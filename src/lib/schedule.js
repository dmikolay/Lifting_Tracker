// Week planning: which weekday each program day lands on, and split days.
//
// state.plans[weekStart] = {
//   assign: { Mon: 1, Tue: 2, ... },   // program day -> weekday index (0 = Sunday)
//   split?: {                          // program days split into two halves
//     [dayKey]: {
//       to: [idxA, idxB],              // weekday index for half 1 and half 2
//       pick: { [liftId]: 0 | 1 },     // which half each lift goes in (missing = half 1)
//     },
//   },
// }
// A week with no saved plan uses DEFAULT_ASSIGNMENT and no splits.
//
// Functions here take a `program` (see weekProgram in data/program.js): the days,
// each day's lifts with their set counts for that rotation week, and the targets.

import { weekPosition } from "./dates.js";
import { muscleGroup, primaryMuscle, sortLifts, totalSets, trimSession } from "./volume.js";

export const DEFAULT_ASSIGNMENT = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export const WEEKDAY_INDEXES = [0, 1, 2, 3, 4, 5, 6];

const dayKeys = (program) => program.days.map((d) => d.key);
const dayTitle = (program, key) => program.days.find((d) => d.key === key).title;

export const getAssignment = (weekStart, plans) =>
  (plans[weekStart] && plans[weekStart].assign) || DEFAULT_ASSIGNMENT;

// A deep copy of the week's splits, safe to edit.
export const getSplits = (weekStart, plans) =>
  JSON.parse(JSON.stringify((plans[weekStart] && plans[weekStart].split) || {}));

// Move every day by `delta`; returns the same object if any day would leave the week.
export function shiftAssignment(assign, delta) {
  const keys = Object.keys(DEFAULT_ASSIGNMENT);
  const moved = keys.map((k) => assign[k] + delta);
  if (Math.min(...moved) < 0 || Math.max(...moved) > 6) return assign;
  return Object.fromEntries(keys.map((k, i) => [k, moved[i]]));
}

// Every weekday index in use, including both halves of split days.
export function usedWeekdays(assign, splits = {}) {
  return Object.keys(DEFAULT_ASSIGNMENT).flatMap((k) => (splits[k] ? splits[k].to : [assign[k]]));
}

// --- Split days ---------------------------------------------------------------

// For splitting, rear delts count as back work and traps as shoulder work, so
// "Back & Shoulders" style days divide the way you'd expect.
const SPLIT_GROUP_OVERRIDES = { "Rear Delt": "Back", Traps: "Shoulders" };

const splitGroup = (lift) => SPLIT_GROUP_OVERRIDES[primaryMuscle(lift)] || muscleGroup(lift);

// "Back & Shoulders" -> ["Back", "Shoulders"]; a single-focus day -> ["Legs 1", "Legs 2"]
// (numbered rather than lettered so they don't read as A/B rotation weeks).
export function splitHalfNames(program, dayKey) {
  const parts = dayTitle(program, dayKey).split(" & ");
  return parts.length === 2 ? parts : [parts[0] + " 1", parts[0] + " 2"];
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
export function defaultSplitPicks(program, dayKey, to, assign, splits = {}) {
  const names = splitHalfNames(program, dayKey);
  const twoFocus = dayTitle(program, dayKey).includes(" & ");
  const lifts = sortLifts(program.liftsByDay[dayKey]);
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
      dayKeys(program)
        .filter((k) => k !== dayKey && !splits[k] && assign[k] === to[side])
        .reduce((sum, k) => sum + totalSets(program.liftsByDay[k]), 0) +
      totalSets(lifts.filter((l) => pick[l.id] === side)),
  );
  for (const lift of flexible) {
    const side = load[0] <= load[1] ? 0 : 1;
    pick[lift.id] = side;
    load[side] += lift.sets;
  }
  return pick;
}

// --- Sessions -----------------------------------------------------------------

// A lift scheduled twice in one session (e.g. Monday and Thursday moved onto the
// same day) appears once, with the sets combined.
function combineRepeats(lifts) {
  const combined = [];
  for (const lift of lifts) {
    const same = combined.find((l) => l.id === lift.id);
    if (same) same.sets += lift.sets;
    else combined.push({ ...lift });
  }
  return combined;
}

/**
 * Everything scheduled on weekday `index`: whole program days plus any split
 * halves, trimmed to a set cap (40 per day's worth of work, max 60).
 * Lifts are in program order; see sessionForDate for display order.
 */
export function buildSession(program, assign, splits = {}, index) {
  const keys = dayKeys(program);
  const wholeDays = keys.filter((k) => !splits[k] && assign[k] === index);
  const halves = [];
  for (const k of keys) {
    const split = splits[k];
    if (!split) continue;
    const names = splitHalfNames(program, k);
    for (const side of [0, 1]) {
      if (split.to[side] === index && program.liftsByDay[k].some((l) => splitSide(split, l) === side)) {
        halves.push({ k, side, name: names[side] });
      }
    }
  }

  const lifts = combineRepeats([
    ...wholeDays.flatMap((k) => program.liftsByDay[k]),
    ...halves.flatMap(({ k, side }) => program.liftsByDay[k].filter((l) => splitSide(splits[k], l) === side)),
  ]);
  if (!lifts.length) {
    return { i: index, sources: [], labels: [], lifts: [], cut: [], shaved: [] };
  }

  const dayUnits = wholeDays.length + 0.5 * halves.length;
  return {
    i: index,
    sources: [...new Set([...wholeDays, ...halves.map((h) => h.k)])],
    labels: [...wholeDays.map((k) => dayTitle(program, k)), ...halves.map((h) => `${h.name} (from ${h.k})`)],
    ...trimSession(lifts, Math.min(60, 40 * Math.ceil(dayUnits)), dayUnits / 6, program.targets),
  };
}

// The session for a calendar date, with lifts sorted for display. `program` is
// the program for that date's week.
export function sessionForDate(ds, plans, program) {
  const { start, index } = weekPosition(ds);
  const assign = getAssignment(start, plans);
  const splits = (plans[start] && plans[start].split) || {};
  const trainingDays = WEEKDAY_INDEXES.filter((i) => buildSession(program, assign, splits, i).lifts.length);
  const nSessions = trainingDays.length;
  const session = buildSession(program, assign, splits, index);
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
