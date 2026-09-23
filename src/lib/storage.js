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

import { LIFTS } from "../data/program.js";
import { parseDate } from "./dates.js";

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

export function defaultProgress(lift) {
  return {
    w: lift.w,
    r: lift.r,
    lo: lift.lo,
    hi: lift.hi,
    strikes: 0, // consecutive fully missed sessions; two in a row reverts to `last`
    last: lift.mode === "amrap" ? null : { w: lift.w, r: lift.r }, // last target fully hit
    hist: [], // one { d, w, r, ok } per completed session, newest last
  };
}

export function createDefaultState() {
  return {
    v: 1,
    prog: Object.fromEntries(LIFTS.map((l) => [l.id, defaultProgress(l)])), // per-lift targets
    notes: {}, // day key -> note text
    plans: {}, // week start (Sunday) -> { assign: { Mon: 1, ... }, split?: {...} }
    tests: [], // max tests: { d, vals: { [liftId]: string }, bw }
    pending: {}, // liftId -> progression prompt awaiting "Take it" / "Not yet"
    snap: {}, // "date|liftId" -> progress before that day's first set, restored by Clear
  };
}

// Fill in anything missing from older saves, and drop malformed week plans.
export function normalizeState(saved) {
  const state = { ...saved, prog: { ...saved.prog } };
  for (const lift of LIFTS) {
    if (!state.prog[lift.id]) state.prog[lift.id] = defaultProgress(lift);
  }
  state.pending = state.pending || {};
  state.tests = state.tests || [];
  state.snap = state.snap || {};
  state.plans = Object.fromEntries(
    Object.entries(state.plans || {}).filter(
      ([weekStart, plan]) => plan && plan.assign && parseDate(weekStart).getDay() === 0,
    ),
  );
  return state;
}

// Load saved state, creating (and saving) a fresh one on first run.
export function loadState() {
  const saved = readJSON(STATE_KEY);
  if (saved && saved.prog) return { state: normalizeState(saved), warning: null };
  const fresh = createDefaultState();
  const warning = writeJSON(STATE_KEY, fresh)
    ? null
    : "This browser is blocking local storage. Turn off Private Browsing, or nothing will save.";
  return { state: fresh, warning };
}
