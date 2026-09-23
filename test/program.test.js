// Checks the program data against PROGRAM.md.

import { describe, expect, it } from "vitest";
import {
  DAYS,
  LIFTS,
  LIFTS_BY_ID,
  LIFT_DAYS,
  MUSCLES,
  WEEKLY_SET_TARGETS,
  weekProgram,
} from "../src/data/program.js";
import { toggleFlip, weekVariant } from "../src/lib/rotation.js";
import { buildSession, sessionForDate } from "../src/lib/schedule.js";
import { setsByMuscle, totalSets } from "../src/lib/volume.js";

const DAY_SETS = { Mon: 34, Tue: 33, Wed: 33, Thu: 33, Fri: 33, Sat: 34 };

describe("program matches PROGRAM.md §1", () => {
  for (const variant of ["A", "B"]) {
    const program = weekProgram(variant);
    it(`week ${variant}: each day's set total, 200 for the week`, () => {
      const totals = Object.fromEntries(
        Object.entries(program.liftsByDay).map(([k, lifts]) => [k, totalSets(lifts)]),
      );
      expect(totals).toEqual(DAY_SETS);
      expect(Object.values(totals).reduce((a, b) => a + b)).toBe(200);
    });
  }

  it("every slot points at a real lift, and every lift is scheduled", () => {
    for (const day of DAYS) {
      for (const [ref] of day.slots) {
        for (const id of typeof ref === "string" ? [ref] : [ref.A, ref.B])
          expect(LIFTS_BY_ID[id]).toBeTruthy();
      }
    }
    for (const lift of LIFTS) expect(LIFT_DAYS[lift.id].length).toBeGreaterThan(0);
  });

  it("A/B bench design: barbell pressing once a week, flat in A and incline in B", () => {
    const pressing = (v) =>
      Object.values(weekProgram(v).liftsByDay)
        .flat()
        .filter((l) => /Barbell Bench|Incline Barbell/.test(l.name))
        .map((l) => l.name);
    expect(pressing("A")).toEqual(["Flat Barbell Bench Press"]);
    expect(pressing("B")).toEqual(["Incline Barbell Bench Press"]);
  });

  it("shared lifts are one record on several days (§3)", () => {
    for (const id of [
      "leg-extension",
      "seated-leg-curl",
      "isolated-calf-raise",
      "machine-lateral-raise",
      "pec-deck-fly",
      "rear-delt-machine",
    ]) {
      expect(LIFT_DAYS[id].length).toBe(2);
    }
  });

  it("muscle credit fixes (§5)", () => {
    expect(LIFTS_BY_ID["pec-deck-fly"].muscles).toEqual({ "Lower Chest": 1, "Upper Chest": 0.5 });
    expect(LIFTS_BY_ID["single-arm-cable-row"].muscles).toEqual({
      Lats: 1,
      "Upper Back": 0.5,
      Biceps: 0.5,
    });
    expect(LIFTS_BY_ID["high-row-machine"].muscles["Upper Back"]).toBe(1);
    expect(LIFTS_BY_ID["chest-supported-row-machine"].muscles["Upper Back"]).toBe(1);
    expect(LIFTS_BY_ID["cable-curl"]).toMatchObject({ muscles: { Biceps: 1 }, tier: 3 });
  });

  it("a normal week is never trimmed", () => {
    for (const v of ["A", "B"]) {
      const program = weekProgram(v);
      for (let i = 1; i <= 6; i++) {
        const s = buildSession(program, { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }, {}, i);
        expect(s.cut).toEqual([]);
        expect(s.shaved).toEqual([]);
      }
    }
  });

  it("weekly volume per muscle lands near target (§7)", () => {
    const rows = MUSCLES.map((m) => {
      const [a, b] = ["A", "B"].map(
        (v) =>
          setsByMuscle(
            Object.values(weekProgram(v).liftsByDay)
              .flat()
              .map((lift) => ({ lift, sets: lift.sets })),
          )[m],
      );
      return { muscle: m, target: WEEKLY_SET_TARGETS[m], A: a, B: b };
    });
    console.table(rows);
    const ARMS = ["Biceps", "Triceps", "Forearms"]; // intentionally above target
    for (const { muscle, target, A, B } of rows) {
      for (const v of [A, B]) {
        if (ARMS.includes(muscle)) expect(v).toBeGreaterThanOrEqual(target * 0.75);
        else expect(Math.abs(v - target)).toBeLessThanOrEqual(Math.max(2, target * 0.15));
      }
    }
  });
});

describe("A/B rotation (§2)", () => {
  const ab = { anchor: "2026-09-20", flips: [] };

  it("alternates weekly from the anchor week, which is A", () => {
    expect(["2026-09-20", "2026-09-27", "2026-10-04", "2026-09-13"].map((w) => weekVariant(w, ab))).toEqual([
      "A",
      "B",
      "A",
      "B",
    ]);
  });

  it("a flip carries forward and leaves earlier weeks alone; flipping again undoes it", () => {
    const flipped = toggleFlip(ab, "2026-10-04");
    expect(
      ["2026-09-20", "2026-09-27", "2026-10-04", "2026-10-11"].map((w) => weekVariant(w, flipped)),
    ).toEqual(["A", "B", "B", "A"]);
    expect(toggleFlip(flipped, "2026-10-04").flips).toEqual([]);
  });

  it("Today shows only the active variant", () => {
    const thuA = sessionForDate("2026-09-24", {}, weekProgram("A")).lifts.map((l) => l.id);
    const thuB = sessionForDate("2026-10-01", {}, weekProgram("B")).lifts.map((l) => l.id);
    expect(thuA).toContain("barbell-back-squat");
    expect(thuA).not.toContain("barbell-front-squat");
    expect(thuB).toContain("barbell-front-squat");
    expect(thuB).not.toContain("barbell-back-squat");
  });

  it("merging Monday and Thursday onto one day lists shared lifts once, sets combined", () => {
    const program = weekProgram("A");
    const s = buildSession(program, { Mon: 1, Tue: 2, Wed: 3, Thu: 1, Fri: 5, Sat: 6 }, {}, 1);
    const ids = s.lifts.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(totalSets(s.lifts)).toBe(60); // 67 planned, trimmed to the two-day cap
    expect(s.cut.length + s.shaved.length).toBeGreaterThan(0);
  });
});
