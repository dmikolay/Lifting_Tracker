// Carrying saved data forward when the program changes.
//
// Rules (see PROGRAM.md): migrations only ever ADD data and are safe to re-run.
// Old records stay in storage untouched; a new lift id is filled in from the
// records listed in its `from`, and only if that id doesn't exist yet. Day logs
// and max tests are never rewritten; old ids are read through LEGACY_IDS.

import { LIFTS, LIFTS_BY_ID, RETIRED_LIFTS } from "../data/program.js";

const HISTORY_LIMIT = 260;

// Old per-day lift id -> the current lift that took it over.
export const LEGACY_IDS = Object.fromEntries(LIFTS.flatMap((l) => l.from.map((old) => [old, l.id])));

const RETIRED_BY_ID = Object.fromEntries(RETIRED_LIFTS.map((l) => [l.id, l]));

/**
 * The lift a stored log entry should be counted as, or null to skip it.
 * Entries under a legacy id are skipped: migrateMonthLog has copied them to the
 * current id, which is counted instead.
 */
export const liftForLoggedId = (id) => LIFTS_BY_ID[id] || RETIRED_BY_ID[id] || null;

// Display name for any lift id found in saved data.
export function liftName(id) {
  const lift = LIFTS_BY_ID[id] || LIFTS_BY_ID[LEGACY_IDS[id]] || RETIRED_BY_ID[id];
  return lift ? lift.name : id;
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

const latestDate = (record) =>
  record.hist && record.hist.length ? record.hist[record.hist.length - 1].d : "";

// Combine several old records for one lift: histories merged by date, and the
// working weight, reps and strikes from whichever was trained most recently.
function mergeRecords(records) {
  const primary = records.reduce((best, r) => (latestDate(r) > latestDate(best) ? r : best));
  const hist = records
    .flatMap((r) => r.hist || [])
    .map((h, i) => ({ h, i }))
    .sort((a, b) => (a.h.d < b.h.d ? -1 : a.h.d > b.h.d ? 1 : a.i - b.i))
    .map((x) => x.h);
  return { ...primary, hist: hist.slice(-HISTORY_LIMIT) };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Fill in progress for every current lift that has none yet. Returns new
 * { prog, pending } objects; the inputs are not modified and no key is removed.
 */
export function migrateProgress(prog, pending) {
  const nextProg = { ...prog };
  const nextPending = { ...pending };
  for (const lift of LIFTS) {
    if (nextProg[lift.id]) continue;
    const sources = lift.from.map((id) => prog[id]).filter(Boolean);

    if (!sources.length) {
      const fresh = defaultProgress(lift);
      const seed = lift.startWeightFrom && prog[lift.startWeightFrom];
      if (seed && seed.w != null) {
        fresh.w = seed.w;
        fresh.last = { w: seed.w, r: fresh.r };
      }
      nextProg[lift.id] = fresh;
      continue;
    }

    const record = mergeRecords(sources);
    // Bodyweight rep lifts progress by moving their range, so keep the stored
    // range; everything else takes the program's range.
    if (lift.mode !== "bwreps") {
      record.lo = lift.lo;
      record.hi = lift.hi;
    }
    if (lift.mode !== "amrap") record.r = clamp(record.r, record.lo, record.hi);
    nextProg[lift.id] = record;

    // Carry a waiting progression prompt only if it still makes sense.
    const oldId = lift.from.find((id) => prog[id] && pending[id]);
    const old = oldId && prog[oldId];
    if (sources.length === 1 && old && old.lo === record.lo && old.hi === record.hi) {
      nextPending[lift.id] = pending[oldId];
    }
  }
  return { prog: nextProg, pending: nextPending };
}

// Add current-id entries next to legacy ones in a month's day logs.
export function migrateMonthLog(monthLog) {
  return Object.fromEntries(
    Object.entries(monthLog).map(([date, dayLog]) => {
      const next = { ...dayLog };
      for (const [id, sets] of Object.entries(dayLog)) {
        const current = LEGACY_IDS[id];
        if (current && !(current in next)) next[current] = sets;
      }
      return [date, next];
    }),
  );
}

// Add current-id entries next to legacy ones in saved split-day assignments.
export function migratePlans(plans) {
  return Object.fromEntries(
    Object.entries(plans).map(([weekStart, plan]) => {
      if (!plan.split) return [weekStart, plan];
      const split = Object.fromEntries(
        Object.entries(plan.split).map(([day, sp]) => {
          const pick = { ...(sp.pick || {}) };
          for (const [id, side] of Object.entries(sp.pick || {})) {
            const current = LEGACY_IDS[id];
            if (current && !(current in pick)) pick[current] = side;
          }
          return [day, { ...sp, pick }];
        }),
      );
      return [weekStart, { ...plan, split }];
    }),
  );
}
