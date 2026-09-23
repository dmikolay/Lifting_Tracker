import { describe, expect, it } from "vitest";
import { LIFTS_BY_ID } from "../src/data/program.js";
import { applyPrompt, evaluateSets } from "../src/lib/progression.js";
import { STATE_KEY, createDefaultState, logKey, normalizeState } from "../src/lib/storage.js";
import { clearLift, keepSame, recordSet, resolvePrompt } from "../src/lib/workout.js";

const ohp = LIFTS_BY_ID["Tue|Overhead Press"]; // 3 sets, weight, 5–8 reps
const dips = LIFTS_BY_ID["Sat|Dips"]; // amrap
const hit = (w, r) => ({ ok: true, w, r });
const miss = (w, r) => ({ ok: false, w, r });

describe("storage", () => {
  it("keeps the localStorage keys the phone's data lives under", () => {
    expect(STATE_KEY).toBe("gym:state:v1");
    expect(logKey("2026-09")).toBe("gym:log:2026-09");
  });

  it("fills in lifts missing from an older save and drops non-Sunday plans", () => {
    const saved = createDefaultState();
    delete saved.prog[ohp.id];
    delete saved.snap;
    saved.plans = { "2026-09-20": { assign: {} }, "2026-09-21": { assign: {} }, "2026-09-27": null };
    const state = normalizeState(saved);
    expect(state.prog[ohp.id].w).toBe(ohp.w);
    expect(state.snap).toEqual({});
    expect(Object.keys(state.plans)).toEqual(["2026-09-20"]);
  });
});

describe("progression", () => {
  const prog = { w: 175, r: 5, lo: 5, hi: 8, strikes: 0, last: { w: 170, r: 5 }, hist: [] };

  it("waits until every set is logged", () => {
    const { progress, prompt } = evaluateSets(prog, ohp, [hit(175, 5), hit(175, 5)]);
    expect(progress).toBe(prog);
    expect(prompt).toBe(null);
  });

  it("offers one more rep when every set is hit", () => {
    const { progress, prompt } = evaluateSets(prog, ohp, [hit(175, 5), hit(175, 5), hit(175, 5)]);
    expect(prompt).toEqual({ type: "reps", to: 6 });
    expect(progress.last).toEqual({ w: 175, r: 5 });
    expect(applyPrompt(progress, prompt).r).toBe(6);
  });

  it("offers more weight at the top of the range", () => {
    const top = { ...prog, r: 8 };
    const { prompt } = evaluateSets(top, ohp, [hit(175, 8), hit(175, 8), hit(175, 8)]);
    expect(prompt).toEqual({ type: "weight", to: 175 + ohp.increment, reps: 5 });
  });

  it("reverts after two fully missed sessions", () => {
    const once = evaluateSets(prog, ohp, [miss(175, 5), miss(175, 5), miss(175, 5)]);
    expect(once.progress.strikes).toBe(1);
    const twice = evaluateSets(once.progress, ohp, [miss(175, 5), miss(175, 5), miss(175, 5)]);
    expect(twice.prompt).toEqual({ type: "revert", w: 170, r: 5 });
    expect(twice.progress).toMatchObject({ w: 170, r: 5, strikes: 0 });
  });

  it("never prompts for max-rep lifts", () => {
    const p = createDefaultState().prog[dips.id];
    const { prompt } = evaluateSets(p, dips, [hit(0, 12), hit(0, 10), hit(0, 9)]);
    expect(prompt).toBe(null);
  });
});

describe("logging a workout", () => {
  const date = "2026-09-22";

  it("records history once all sets are in, and Clear undoes the day", () => {
    let state = createDefaultState();
    let dayLog = {};
    for (let i = 0; i < 3; i++) {
      ({ state, dayLog } = recordSet(state, dayLog, ohp, i, hit(175, 5), date));
    }
    expect(state.prog[ohp.id].hist).toEqual([{ d: date, w: 175, r: 5, ok: true }]);
    expect(state.pending[ohp.id]).toEqual({ type: "reps", to: 6 });

    state = resolvePrompt(state, ohp, true);
    expect(state.prog[ohp.id].r).toBe(6);
    expect(state.pending[ohp.id]).toBeUndefined();

    ({ state, dayLog } = clearLift(state, dayLog, ohp, date));
    expect(dayLog[ohp.id]).toBeUndefined();
    expect(state.prog[ohp.id]).toEqual(createDefaultState().prog[ohp.id]);
  });

  it("re-logging the same day replaces that day's history entry", () => {
    let state = createDefaultState();
    let dayLog = {};
    for (let i = 0; i < 3; i++) ({ state, dayLog } = recordSet(state, dayLog, ohp, i, hit(175, 5), date));
    ({ state, dayLog } = recordSet(state, dayLog, ohp, 2, miss(175, 5), date));
    expect(state.prog[ohp.id].hist).toHaveLength(1);
  });

  it("Keep same fills the sets without touching progress", () => {
    const state = createDefaultState();
    const dayLog = keepSame(state, {}, ohp);
    expect(dayLog[ohp.id]).toHaveLength(ohp.sets);
    expect(dayLog[ohp.id][0]).toEqual({ keep: true, ok: null, w: ohp.w, r: ohp.r });
  });
});
