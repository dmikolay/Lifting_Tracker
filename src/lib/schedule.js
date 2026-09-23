// Week planning: which weekday each program day lands on, and split days.
//
// state.plans[weekStart] = {
//   assign: { Mon: 1, Tue: 2, ... },   // program day -> weekday index (0 = Sunday)
//   split?: {                          // program days split into two halves
//     [dayKey]: {
//       to: [idxA, idxB],              // weekday index for half A and half B
//       pick: { [liftId]: 0 | 1 },     // which half each lift goes in (missing = A)
//     },
//   },
// }
// A week with no saved plan uses DEFAULT_ASSIGNMENT and no splits.

import { DAY_KEYS, LIFTS_BY_DAY, dayTitle } from "../data/program.js";
import { weekPosition } from "./dates.js";
import { muscleGroup, primaryMuscle, sortLifts, totalSets, trimSession } from "./volume.js";

export const DEFAULT_ASSIGNMENT = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export const WEEKDAY_INDEXES = [0, 1, 2, 3, 4, 5, 6];

export const getAssignment = (weekStart, plans) =>
  (plans[weekStart] && plans[weekStart].assign) || DEFAULT_ASSIGNMENT;

// A deep copy of the week's splits, safe to edit.
export const getSplits = (weekStart, plans) =>
  JSON.parse(JSON.stringify((plans[weekStart] && plans[weekStart].split) || {}));

// Move every day by `delta`; returns the same object if any day would leave the week.
export function shiftAssignment(assign, delta) {
  const moved = DAY_KEYS.map((k) => assign[k] + delta);
  if (Math.min(...moved) < 0 || Math.max(...moved) > 6) return assign;
  return Object.fromEntries(DAY_KEYS.map((k, i) => [k, moved[i]]));
}

// Every weekday index in use, including both halves of split days.
export function usedWeekdays(assign, splits = {}) {
  return DAY_KEYS.flatMap((k) => (splits[k] ? splits[k].to : [assign[k]]));
}

// --- Split days ---------------------------------------------------------------

// For splitting, rear delts count as back work and traps as shoulder work, so
// "Back & Shoulders" style days divide the way you'd expect.
const SPLIT_GROUP_OVERRIDES = { "Rear Delt": "Back", Traps: "Shoulders" };

const splitGroup = (lift) => SPLIT_GROUP_OVERRIDES[primaryMuscle(lift)] || muscleGroup(lift);

// "Legs & Arms" -> ["Legs", "Arms"]; a single-focus day -> ["Legs A", "Legs B"].
export function splitHalfNames(dayKey) {
  const parts = dayTitle(dayKey).split(" & ");
  return parts.length === 2 ? parts : [parts[0] + " A", parts[0] + " B"];
}

export function splitSide(split, lift) {
  const side = split && split.pick && split.pick[lift.id];
  return side === 1 ? 1 : 0;
}

/**
 * Initial half for each lift when `dayKey` is first split onto weekdays `to`.
 * Two-focus days split by body region; lifts outside both regions (and all lifts
 * on single-focus days, which alternate) are balanced against each target day's
 * existing load.
 */
export function defaultSplitPicks(dayKey, to, assign, splits = {}) {
  const names = splitHalfNames(dayKey);
  const twoFocus = dayTitle(dayKey).includes(" & ");
  const lifts = sortLifts(LIFTS_BY_DAY[dayKey]);
  const pick = {};
  const flexible = [];

  lifts.forEach((lift, i) => {
    if (twoFocus) {
      const side = names.indexOf(splitGroup(lift));
      if (side < 0) flexible.push(lift);
      else pick[lift.id] = side;
    } else {
      pick[lift.id] = i % 2;
    }
  });

  const load = [0, 1].map(
    (side) =>
      DAY_KEYS.filter((k) => k !== dayKey && !splits[k] && assign[k] === to[side]).reduce(
        (sum, k) => sum + totalSets(LIFTS_BY_DAY[k]),
        0,
      ) + totalSets(lifts.filter((l) => pick[l.id] === side)),
  );
  for (const lift of flexible) {
    const side = load[0] <= load[1] ? 0 : 1;
    pick[lift.id] = side;
    load[side] += lift.sets;
  }
  return pick;
}

// --- Sessions -----------------------------------------------------------------

/**
 * Everything scheduled on weekday `index`: whole program days plus any split
 * halves, trimmed to a set cap (40 per day's worth of work, max 60).
 * Lifts are in program order; see sessionForDate for display order.
 */
export function buildSession(assign, splits = {}, index) {
  const wholeDays = DAY_KEYS.filter((k) => !splits[k] && assign[k] === index);
  const halves = [];
  for (const k of DAY_KEYS) {
    const split = splits[k];
    if (!split) continue;
    const names = splitHalfNames(k);
    for (const side of [0, 1]) {
      if (split.to[side] === index && LIFTS_BY_DAY[k].some((l) => splitSide(split, l) === side)) {
        halves.push({ k, side, name: names[side] });
      }
    }
  }

  const lifts = [
    ...wholeDays.flatMap((k) => LIFTS_BY_DAY[k]),
    ...halves.flatMap(({ k, side }) => LIFTS_BY_DAY[k].filter((l) => splitSide(splits[k], l) === side)),
  ];
  if (!lifts.length) {
    return { i: index, sources: [], labels: [], lifts: [], cut: [], shaved: [] };
  }

  const dayUnits = wholeDays.length + 0.5 * halves.length;
  return {
    i: index,
    sources: [...new Set([...wholeDays, ...halves.map((h) => h.k)])],
    labels: [...wholeDays.map(dayTitle), ...halves.map((h) => `${h.name} (from ${h.k})`)],
    ...trimSession(lifts, Math.min(60, 40 * Math.ceil(dayUnits)), dayUnits / 6),
  };
}

// The session for a calendar date, with lifts sorted for display.
export function sessionForDate(ds, plans) {
  const { start, index } = weekPosition(ds);
  const assign = getAssignment(start, plans);
  const splits = (plans[start] && plans[start].split) || {};
  const trainingDays = WEEKDAY_INDEXES.filter((i) => buildSession(assign, splits, i).lifts.length);
  const nSessions = trainingDays.length;
  const session = buildSession(assign, splits, index);
  if (!session.lifts.length) {
    return {
      lifts: [],
      cut: [],
      shaved: [],
      title: null,
      sources: [],
      index,
      start,
      ordinal: 0,
      nSessions,
    };
  }
  return {
    ...session,
    lifts: sortLifts(session.lifts),
    title: session.labels.join(" + "),
    index,
    start,
    ordinal: trainingDays.indexOf(index) + 1,
    nSessions,
  };
}
