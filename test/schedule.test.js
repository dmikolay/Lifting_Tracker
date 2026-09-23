// golden.json holds outputs recorded from the original compiled app (before the
// source rebuild) for randomly generated week plans. If one of these fails, the
// scheduling/trimming behaviour has changed. That's fine if intended: regenerate
// the fixture from the new behaviour and say so in the commit.

import { describe, expect, it } from "vitest";
import { LIFTS_BY_ID } from "../src/data/program.js";
import { defaultSplitPicks, sessionForDate, shiftAssignment } from "../src/lib/schedule.js";
import { trimSession } from "../src/lib/volume.js";
import golden from "./golden.json";

const ids = (lifts) => lifts.map((l) => `${l.id}:${l.sets}`);

describe("sessionForDate matches the original app", () => {
  golden.sessions.forEach(({ date, plans, expect: want }, i) => {
    it(`case ${i}`, () => {
      const s = sessionForDate(date, plans);
      expect({
        title: s.title,
        sources: s.sources,
        ordinal: s.ordinal,
        nSessions: s.nSessions,
        lifts: ids(s.lifts),
        cut: ids(s.cut),
        shaved: s.shaved,
      }).toEqual(want);
    });
  });
});

describe("defaultSplitPicks matches the original app", () => {
  golden.splitPicks.forEach(({ day, to, assign, splits, expect: want }, i) => {
    it(`case ${i}`, () => {
      expect(defaultSplitPicks(day, to, assign, splits)).toEqual(want);
    });
  });
});

describe("trimSession matches the original app", () => {
  golden.trims.forEach(({ liftIds, cap, share, expect: want }, i) => {
    it(`case ${i}`, () => {
      const r = trimSession(
        liftIds.map((id) => LIFTS_BY_ID[id]),
        cap,
        share,
      );
      expect({ lifts: ids(r.lifts), cut: ids(r.cut), shaved: r.shaved }).toEqual(want);
    });
  });
});

describe("schedule basics", () => {
  it("a default week is six sessions, Monday to Saturday, rest on Sunday", () => {
    expect(sessionForDate("2026-09-20", {}).title).toBe(null); // Sunday
    const monday = sessionForDate("2026-09-21", {});
    expect(monday.title).toBe("Legs & Arms");
    expect(monday.ordinal).toBe(1);
    expect(monday.nSessions).toBe(6);
  });

  it("shiftAssignment refuses to move days out of the week", () => {
    const a = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    expect(shiftAssignment(a, 1)).toBe(a);
    expect(shiftAssignment(a, -1)).toEqual({ Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5 });
  });
});
