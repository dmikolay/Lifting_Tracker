// golden.json holds outputs recorded from the original compiled app for random
// week plans, run against the program as it was then (legacy-program.json). They
// pin the scheduling, split and trimming algorithms independently of the current
// program. If one fails, that behaviour changed: fine if intended, but regenerate
// the fixture and say so in the commit.

import { describe, expect, it } from "vitest";
import { defaultSplitPicks, sessionForDate, shiftAssignment } from "../src/lib/schedule.js";
import { trimSession } from "../src/lib/volume.js";
import golden from "./golden.json";
import legacy from "./legacy-program.json";

const LEGACY_BY_ID = Object.fromEntries(
  Object.values(legacy.liftsByDay)
    .flat()
    .map((l) => [l.id, l]),
);
const ids = (lifts) => lifts.map((l) => `${l.id}:${l.sets}`);
// Single-focus split halves were "Legs A/B" in the original; now "Legs 1/2".
const renumber = (label) => label.replace(/ A \(from/, " 1 (from").replace(/ B \(from/, " 2 (from");

describe("sessionForDate matches the original app", () => {
  golden.sessions.forEach(({ date, plans, expect: want }, i) => {
    it(`case ${i}`, () => {
      const s = sessionForDate(date, plans, legacy);
      expect({
        title: s.title,
        sources: s.sources,
        ordinal: s.ordinal,
        nSessions: s.nSessions,
        lifts: ids(s.lifts),
        cut: ids(s.cut),
        shaved: s.shaved,
      }).toEqual({ ...want, title: want.title && want.title.split(" + ").map(renumber).join(" + ") });
    });
  });
});

describe("defaultSplitPicks matches the original app", () => {
  golden.splitPicks.forEach(({ day, to, assign, splits, expect: want }, i) => {
    it(`case ${i}`, () => {
      expect(defaultSplitPicks(legacy, day, to, assign, splits)).toEqual(want);
    });
  });
});

describe("trimSession matches the original app", () => {
  golden.trims.forEach(({ liftIds, cap, share, expect: want }, i) => {
    it(`case ${i}`, () => {
      const r = trimSession(
        liftIds.map((id) => LEGACY_BY_ID[id]),
        cap,
        share,
        legacy.targets,
      );
      expect({ lifts: ids(r.lifts), cut: ids(r.cut), shaved: r.shaved }).toEqual(want);
    });
  });
});

describe("schedule basics", () => {
  it("shiftAssignment refuses to move days out of the week", () => {
    const a = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    expect(shiftAssignment(a, 1)).toBe(a);
    expect(shiftAssignment(a, -1)).toEqual({ Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5 });
  });
});
