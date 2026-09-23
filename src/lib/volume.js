// Muscle volume accounting, lift ordering, and trimming oversized sessions.

import { MUSCLES, MUSCLE_GROUPS, WEEKLY_SET_TARGETS } from "../data/program.js";

// Muscles a lift works at full weighting.
export const primaryMuscles = (lift) =>
  Object.entries(lift.muscles)
    .filter(([, weight]) => weight === 1)
    .map(([muscle]) => muscle);

// The first full-weight muscle, or null if the lift has none.
export const primaryMuscle = (lift) => primaryMuscles(lift)[0] ?? null;

export const muscleGroup = (lift) => MUSCLE_GROUPS[primaryMuscle(lift)] || "Other";

// Order lifts for display: by body region (in order of first appearance), then
// tier, then muscle order, then original position.
export function sortLifts(lifts) {
  const groups = [];
  for (const lift of lifts) {
    const g = muscleGroup(lift);
    if (!groups.includes(g)) groups.push(g);
  }
  const groupRank = (lift) => {
    const i = groups.indexOf(muscleGroup(lift));
    return i < 0 ? 99 : i;
  };
  const muscleRank = (lift) => {
    const i = MUSCLES.indexOf(primaryMuscle(lift));
    return i < 0 ? 99 : i;
  };
  return lifts
    .map((lift, i) => ({ lift, i }))
    .sort(
      (a, b) =>
        groupRank(a.lift) - groupRank(b.lift) ||
        a.lift.tier - b.lift.tier ||
        muscleRank(a.lift) - muscleRank(b.lift) ||
        a.i - b.i,
    )
    .map((x) => x.lift);
}

// Weighted set count per muscle. `entries` is [{ lift, sets }].
export function setsByMuscle(entries) {
  const totals = Object.fromEntries(MUSCLES.map((m) => [m, 0]));
  for (const { lift, sets } of entries) {
    for (const [muscle, weight] of Object.entries(lift.muscles)) {
      if (totals[muscle] !== undefined) totals[muscle] += sets * weight;
    }
  }
  return totals;
}

export const totalSets = (lifts) => lifts.reduce((sum, l) => sum + l.sets, 0);

// Fewest sets a lift can be shortened to.
const minSets = (lift) => (lift.sets >= 4 || lift.tier === 1 ? 3 : 2);

/**
 * Fit a session under `cap` total sets. While more than 8 sets over, drop whole
 * non-main lifts; then shave single sets until it fits. Lifts hitting the
 * best-covered muscles (relative to `weekShare` of the weekly target) go first.
 *
 * Returns { lifts, cut, shaved }: the kept lifts (copies, with adjusted sets),
 * the dropped lifts, and [{ id, name, n, to }] for each shortened lift.
 */
export function trimSession(sourceLifts, cap, weekShare) {
  let lifts = sourceLifts.map((l) => ({ ...l }));
  if (totalSets(lifts) <= cap) return { lifts, cut: [], shaved: [] };

  const cut = [];
  const shaved = [];
  const currentVolume = () => setsByMuscle(lifts.map((lift) => ({ lift, sets: lift.sets })));

  // Most-expendable first: best coverage (bucketed to 15%), then higher tier, then more sets.
  const byExpendability = (candidates, volume) => {
    const coverage = (lift) => {
      const muscles = primaryMuscles(lift);
      return muscles.length
        ? Math.min(...muscles.map((m) => volume[m] / (WEEKLY_SET_TARGETS[m] * weekShare)))
        : 99;
    };
    return [...candidates].sort(
      (a, b) =>
        Math.round(coverage(b) / 0.15) - Math.round(coverage(a) / 0.15) || b.tier - a.tier || b.sets - a.sets,
    );
  };

  while (totalSets(lifts) - cap > 8) {
    const volume = currentVolume();
    let candidates = lifts.filter((l) => l.tier > 1);
    if (!candidates.length) break;
    // Prefer lifts whose removal still leaves every primary muscle some work.
    const safe = candidates.filter((l) => primaryMuscles(l).every((m) => volume[m] - l.sets > 0.01));
    if (safe.length) candidates = safe;
    const drop = byExpendability(candidates, volume)[0];
    lifts = lifts.filter((l) => l !== drop);
    cut.push(drop);
  }

  while (totalSets(lifts) > cap) {
    const volume = currentVolume();
    const candidates = lifts.filter((l) => l.sets > minSets(l));
    if (!candidates.length) break;
    const lift = byExpendability(candidates, volume)[0];
    lift.sets -= 1;
    const entry = shaved.find((s) => s.id === lift.id);
    if (entry) {
      entry.n += 1;
      entry.to = lift.sets;
    } else {
      shaved.push({ id: lift.id, name: lift.name, n: 1, to: lift.sets });
    }
  }

  return { lifts, cut, shaved };
}
