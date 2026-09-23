// Double progression: hit every set and reps go up by one; at the top of the
// range, weight goes up (or, for bodyweight lifts, the range moves up by two).
// Miss every set in two sessions running and the target reverts to the last one
// fully hit.

/**
 * Evaluate a lift's logged sets for today.
 * Returns { progress, prompt }: the updated progress (the same object if nothing
 * changed) and an optional prompt of type "reps" | "weight" | "range" | "revert".
 * A "revert" has already been applied; the others wait for the user to accept.
 */
export function evaluateSets(progress, lift, sets) {
  if (sets.some((s) => s && s.keep)) return { progress, prompt: null };
  const logged = sets.filter((s) => s && s.ok !== undefined && s.ok !== null);
  if (logged.length < lift.sets) return { progress, prompt: null };

  const allHit = logged.every((s) => s.ok);
  const allMissed = logged.every((s) => !s.ok);
  const next = { ...progress };
  let prompt = null;

  if (allHit) {
    if (lift.mode !== "amrap") next.last = { w: progress.w, r: progress.r };
    next.strikes = 0;
    if (lift.mode === "amrap") prompt = null;
    else if (progress.r < progress.hi) prompt = { type: "reps", to: progress.r + 1 };
    else if (lift.mode === "weight")
      prompt = { type: "weight", to: progress.w + lift.increment, reps: progress.lo };
    else prompt = { type: "range", lo: progress.lo + 2, hi: progress.hi + 2 };
  } else if (allMissed) {
    next.strikes = (progress.strikes || 0) + 1;
    if (next.strikes >= 2 && progress.last) {
      next.w = progress.last.w;
      next.r = progress.last.r;
      next.strikes = 0;
      prompt = { type: "revert", w: progress.last.w, r: progress.last.r };
    }
  } else {
    next.strikes = 0;
  }
  return { progress: next, prompt };
}

// Apply an accepted progression prompt to a lift's progress.
export function applyPrompt(progress, prompt) {
  const next = { ...progress };
  if (prompt.type === "reps") next.r = prompt.to;
  else if (prompt.type === "weight") {
    next.w = prompt.to;
    next.r = prompt.reps;
  } else if (prompt.type === "range") {
    next.lo = prompt.lo;
    next.hi = prompt.hi;
    next.r = prompt.lo;
  }
  return next;
}
