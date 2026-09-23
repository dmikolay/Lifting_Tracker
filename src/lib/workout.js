// State transitions for logging a workout. Each takes the current app state and
// the day's log and returns the new versions; nothing here touches storage.

import { applyPrompt, evaluateSets } from "./progression.js";

const HISTORY_LIMIT = 260;

const snapKey = (date, liftId) => `${date}|${liftId}`;

// Record set `index` of `lift` as `result` ({ ok, w, r }).
export function recordSet(state, dayLog, lift, index, result, date) {
  const previous = dayLog[lift.id] || [];
  const isFirstSetToday = !previous.some(Boolean);
  const sets = [...previous];
  sets[index] = result;

  const { progress, prompt } = evaluateSets(state.prog[lift.id], lift, sets);
  const updated = { ...progress };

  // Once every set is in, write (or rewrite) today's history entry.
  if (sets.filter(Boolean).length >= lift.sets) {
    const hist = [...(updated.hist || [])];
    if (hist.length && hist[hist.length - 1].d === date) hist.pop();
    hist.push({
      d: date,
      w: (sets[0] && sets[0].w) || updated.w || 0,
      r: Math.max(...sets.map((s) => (s && s.r) || 0)),
      ok: sets.some((s) => s && s.ok),
    });
    updated.hist = hist.slice(-HISTORY_LIMIT);
  }

  const pending = { ...state.pending };
  if (prompt && prompt.type !== "revert") pending[lift.id] = prompt;
  else delete pending[lift.id];

  // Remember where the lift stood before today so Clear can undo it.
  const snap = { ...(state.snap || {}) };
  if (isFirstSetToday) snap[snapKey(date, lift.id)] = state.prog[lift.id];

  return {
    state: { ...state, prog: { ...state.prog, [lift.id]: updated }, pending, snap },
    dayLog: { ...dayLog, [lift.id]: sets },
  };
}

// Wipe today's sets for a lift and restore its progress from before today.
export function clearLift(state, dayLog, lift, date) {
  // An empty list rather than a deleted key, so sets logged under a pre-migration
  // lift id aren't copied back in on the next load (see migrateMonthLog).
  const newDayLog = { ...dayLog, [lift.id]: [] };

  const prog = { ...state.prog };
  const pending = { ...state.pending };
  const snap = { ...(state.snap || {}) };
  const key = snapKey(date, lift.id);
  if (snap[key]) {
    prog[lift.id] = snap[key];
    delete snap[key];
  }
  delete pending[lift.id];

  return { state: { ...state, prog, pending, snap }, dayLog: newDayLog };
}

// Mark every set as done at the current target without affecting progression.
export function keepSame(state, dayLog, lift) {
  const { w, r } = state.prog[lift.id];
  const sets = Array.from({ length: lift.sets }, () => ({ keep: true, ok: null, w, r }));
  return { ...dayLog, [lift.id]: sets };
}

// Accept ("Take it") or dismiss ("Not yet") a lift's pending progression prompt.
export function resolvePrompt(state, lift, accept) {
  const prog = { ...state.prog };
  if (accept) prog[lift.id] = applyPrompt(prog[lift.id], state.pending[lift.id]);
  const pending = { ...state.pending };
  delete pending[lift.id];
  return { ...state, prog, pending };
}

export const isLiftDone = (lift, sets = []) => sets.filter(Boolean).length >= lift.sets;
