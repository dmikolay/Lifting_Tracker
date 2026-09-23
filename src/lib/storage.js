// All persistence lives here. Everything is saved to localStorage on every change.
//
// DO NOT rename these keys or change the shape of what's stored under them:
// the installed app on the phone holds real training history in them.
//
//   gym:state:v1        the app state (see createDefaultState)
//   gym:log:YYYY-MM     that month's day logs: { "YYYY-MM-DD": { [liftId]: SetResult[] } }
//
// A SetResult is { ok: true|false, w, r } for a logged set, or
// { keep: true, ok: null, w, r } for a set marked "Keep same".
//
// Program changes are carried forward by src/lib/migrate.js, additively: old
// lift records and log entries are never removed or rewritten.

import { LIFTS } from "../data/program.js";
import { parseDate, today, weekStartOf } from "./dates.js";
import { defaultProgress, migrateMonthLog, migratePlans, migrateProgress } from "./migrate.js";

export { defaultProgress };

export const STATE_KEY = "gym:state:v1";
export const logKey = (month) => `gym:log:${month}`;

export function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Returns false when the browser refuses the write (e.g. Private Browsing).
export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error("save failed", err);
    return false;
  }
}

export function createDefaultState(weekStart = weekStartOf(today())) {
  return {
    v: 1,
    prog: Object.fromEntries(LIFTS.map((l) => [l.id, defaultProgress(l)])), // lift id -> progress
    notes: {}, // day key -> note text
    plans: {}, // week start (Sunday) -> { assign: { Mon: 1, ... }, split?: {...} }
    tests: [], // max tests: { d, vals: { [liftId]: string }, bw }
    pending: {}, // liftId -> progression prompt awaiting "Take it" / "Not yet"
    snap: {}, // "date|liftId" -> progress before that day's first set, restored by Clear
    ab: { anchor: weekStart, flips: [] }, // A/B rotation, see lib/rotation.js
  };
}

// Bring a saved state up to date: fill in anything missing, migrate lifts from
// older programs, and drop malformed week plans. Safe to run repeatedly.
export function normalizeState(saved, weekStart = weekStartOf(today())) {
  const { prog, pending } = migrateProgress(saved.prog, saved.pending || {});
  const plans = Object.fromEntries(
    Object.entries(saved.plans || {}).filter(
      ([start, plan]) => plan && plan.assign && parseDate(start).getDay() === 0,
    ),
  );
  return {
    ...saved,
    prog,
    pending,
    tests: saved.tests || [],
    snap: saved.snap || {},
    plans: migratePlans(plans),
    // The week this version first runs is week A of the rotation.
    ab: saved.ab || { anchor: weekStart, flips: [] },
  };
}

// Load saved state, creating a fresh one on first run. Anything the migration
// added is saved straight away so it's fixed from the first load (notably the
// A/B anchor week).
export function loadState() {
  const saved = readJSON(STATE_KEY);
  const state = saved && saved.prog ? normalizeState(saved) : createDefaultState();
  const changed = JSON.stringify(state) !== JSON.stringify(saved);
  const warning =
    changed && !writeJSON(STATE_KEY, state)
      ? "This browser is blocking local storage. Turn off Private Browsing, or nothing will save."
      : null;
  return { state, warning };
}

// A month's day logs, with current lift ids added next to legacy ones.
export const loadMonthLog = (month) => migrateMonthLog(readJSON(logKey(month)) || {});
