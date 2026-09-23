// Migration from the old per-day program (PROGRAM.md §3–4), run against a save
// in the pre-migration format (test/fixtures/pre-migration-save.json).

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LIFTS } from "../src/data/program.js";
import { LEGACY_IDS, liftForLoggedId, liftName, migrateMonthLog } from "../src/lib/migrate.js";
import { STATE_KEY, loadMonthLog, loadState, logKey, normalizeState } from "../src/lib/storage.js";
import { clearLift } from "../src/lib/workout.js";
import save from "./fixtures/pre-migration-save.json";

const WEEK = "2026-09-20";
const old = save[STATE_KEY];
const clone = (x) => JSON.parse(JSON.stringify(x));
const migrate = () => normalizeState(clone(old), WEEK);

describe("migration is additive and repeatable", () => {
  it("keeps every old record, prompt, note, plan and test exactly as it was", () => {
    const s = migrate();
    for (const [id, record] of Object.entries(old.prog)) expect(s.prog[id]).toEqual(record);
    for (const [id, prompt] of Object.entries(old.pending)) expect(s.pending[id]).toEqual(prompt);
    expect(s.notes).toEqual(old.notes);
    expect(s.tests).toEqual(old.tests);
    for (const [week, plan] of Object.entries(old.plans)) {
      expect(s.plans[week].assign).toEqual(plan.assign);
      for (const [day, sp] of Object.entries(plan.split || {})) {
        expect(s.plans[week].split[day]).toMatchObject({ to: sp.to, pick: sp.pick });
      }
    }
  });

  it("running it again changes nothing", () => {
    const once = migrate();
    expect(normalizeState(clone(once), "2026-10-04")).toEqual(once);
  });

  it("gives every current lift a record", () => {
    const s = migrate();
    for (const lift of LIFTS) expect(s.prog[lift.id]).toBeTruthy();
  });
});

describe("lifts carry their history (§4)", () => {
  it("a moved lift keeps its history and weight", () => {
    const s = migrate();
    const before = old.prog["Mon|EZ Bar Curl"];
    expect(s.prog["ez-bar-curl"]).toMatchObject({ w: before.w, hist: before.hist, lo: 8, hi: 12 });
  });

  it("a new rep range keeps the weight and clamps reps into range", () => {
    const s = migrate();
    expect(old.prog["Mon|BB RDL"].r).toBe(5);
    expect(s.prog["barbell-rdl"]).toMatchObject({ w: old.prog["Mon|BB RDL"].w, lo: 6, hi: 10, r: 6 });
    expect(s.prog["concentration-curl"]).toMatchObject({ lo: 10, hi: 12, r: 10 });
  });

  it("shared lifts merge both days' history by date and take the latest working weight (§3)", () => {
    const s = migrate();
    const mlr = s.prog["machine-lateral-raise"];
    expect(mlr.hist.map((h) => h.d)).toEqual(["2026-08-04", "2026-08-07", "2026-08-11", "2026-08-14"]);
    expect(mlr).toMatchObject({ w: 155, r: 12, lo: 12, hi: 15 }); // Friday's 11 reps, clamped to 12
    const pec = s.prog["pec-deck-fly"];
    expect(pec.hist).toHaveLength(
      old.prog["Wed|Machine Flys"].hist.length + old.prog["Sat|Machine Flys"].hist.length,
    );
  });

  it("Pull-Ups and Chin-Ups merge their Tue and Fri copies", () => {
    const s = migrate();
    const pull = s.prog["pull-ups"];
    expect(pull.hist).toHaveLength(
      old.prog["Tue|Pull Ups"].hist.length + old.prog["Fri|Pull Ups"].hist.length,
    );
    // Friday was trained last, and bodyweight lifts keep the range they progressed to.
    expect(pull).toMatchObject({ lo: 8, hi: 14, r: 12 });
    expect(s.prog["chin-ups"].hist).toHaveLength(
      old.prog["Fri|Chin Ups"].hist.length + old.prog["Tue|Chin Ups"].hist.length,
    );
  });

  it("Cable Curl starts with no history, at Cable Bar Curl's working weight", () => {
    const s = migrate();
    expect(s.prog["cable-curl"]).toMatchObject({ w: 65, r: 10, lo: 10, hi: 12, hist: [] });
  });

  it("removed lifts are kept in storage but not scheduled", () => {
    const s = migrate();
    expect(s.prog["Wed|Cable B Curls"]).toEqual(old.prog["Wed|Cable B Curls"]);
    expect(LIFTS.some((l) => l.id === "Wed|Cable B Curls")).toBe(false);
    expect(liftName("Thu|Kickbacks")).toBe("Glute Kickback Machine");
  });

  it("waiting prompts carry over only where the rep range didn't change", () => {
    const s = migrate();
    expect(s.pending["barbell-overhead-press"]).toEqual(old.pending["Tue|Overhead Press"]);
    expect(s.pending["dumbbell-lateral-raise"]).toBeUndefined(); // range moved 10–12 → 12–15
  });

  it("split-day picks gain entries for the new ids", () => {
    const s = migrate();
    expect(s.plans[WEEK].split.Sat.pick).toMatchObject({ "Sat|Dips": 1, dips: 1 });
  });

  it("the first week on the new program is week A, and an existing rotation is kept", () => {
    expect(migrate().ab).toEqual({ anchor: WEEK, flips: [] });
    const withAb = { ...clone(old), ab: { anchor: "2026-09-13", flips: ["2026-09-20"] } };
    expect(normalizeState(withAb, WEEK).ab).toEqual(withAb.ab);
  });
});

describe("day logs", () => {
  const month = save["gym:log:2026-09"];

  it("old entries are readable under the new id, and not double-counted", () => {
    const log = migrateMonthLog(month);
    const day = log["2026-09-22"];
    expect(day["Tue|Overhead Press"]).toEqual(month["2026-09-22"]["Tue|Overhead Press"]);
    expect(day["barbell-overhead-press"]).toEqual(month["2026-09-22"]["Tue|Overhead Press"]);
    const counted = Object.keys(day).filter((id) => liftForLoggedId(id));
    expect(counted).toEqual(["barbell-overhead-press"]);
    expect(migrateMonthLog(log)).toEqual(log);
  });

  it("clearing a lift logged before the update stays cleared after a reload", () => {
    const state = migrate();
    const day = migrateMonthLog(month)["2026-09-22"];
    const lift = LIFTS.find((l) => l.id === "barbell-overhead-press");
    const { dayLog } = clearLift(state, day, lift, "2026-09-22");
    expect(migrateMonthLog({ d: dayLog }).d[lift.id]).toEqual([]);
  });

  it("every legacy id maps to a current lift", () => {
    for (const id of Object.values(LEGACY_IDS)) expect(liftForLoggedId(id)).toBeTruthy();
  });
});

describe("loading from localStorage", () => {
  let store;
  beforeEach(() => {
    store = new Map(Object.entries(save).map(([k, v]) => [k, JSON.stringify(v)]));
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
    };
  });
  afterEach(() => delete globalThis.localStorage);

  it("saves the migrated state once, then leaves it alone", () => {
    const { state } = loadState();
    const saved = store.get(STATE_KEY);
    expect(JSON.parse(saved)).toEqual(state);
    expect(state.prog["ez-bar-curl"]).toBeTruthy();
    loadState();
    expect(store.get(STATE_KEY)).toBe(saved);
  });

  it("never rewrites a month log just by reading it", () => {
    const raw = store.get(logKey("2026-09"));
    expect(loadMonthLog("2026-09")["2026-09-22"]["barbell-overhead-press"]).toBeTruthy();
    expect(store.get(logKey("2026-09"))).toBe(raw);
  });
});
