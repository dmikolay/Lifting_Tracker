// The training program: which lifts go on which day, with how many sets.
// PROGRAM.md in the repo root is the source of truth; keep this file in sync with it.

import { LIFTS, RETIRED_LIFTS } from "./lifts.js";

export { LIFTS, RETIRED_LIFTS };

export const LIFTS_BY_ID = Object.fromEntries(LIFTS.map((l) => [l.id, l]));

// A slot is [liftId, sets] or [{ A: liftId, B: liftId }, sets]; A/B slots use the
// variant for the current rotation week (see lib/rotation.js).
export const DAYS = [
  {
    key: "Mon",
    title: "Legs",
    slots: [
      ["barbell-rdl", 4],
      [{ A: "barbell-single-leg-squat", B: "bulgarian-split-squat" }, 3],
      ["hack-squat", 4],
      ["barbell-hip-thrust", 3],
      ["seated-leg-curl", 3],
      ["leg-extension", 3],
      ["isolated-calf-raise", 5],
      ["hip-abduction-machine", 3],
      ["hip-adduction-machine", 3],
      ["standing-cable-crunch", 3],
    ],
  },
  {
    key: "Tue",
    title: "Back & Shoulders",
    slots: [
      ["pull-ups", 4],
      ["single-arm-cable-row", 3],
      ["barbell-bent-over-row", 3],
      ["barbell-overhead-press", 3],
      ["dumbbell-lateral-raise", 4],
      ["machine-lateral-raise", 3],
      ["lying-dumbbell-reverse-fly", 4],
      ["barbell-upright-row", 3],
      ["barbell-shrug", 3],
      ["decline-bench-leg-raise", 3],
    ],
  },
  {
    key: "Wed",
    title: "Chest & Arms",
    slots: [
      [{ A: "flat-barbell-bench-press", B: "flat-dumbbell-bench-press" }, 4],
      ["low-to-high-cable-fly", 3],
      ["pec-deck-fly", 2],
      ["rear-delt-machine", 2],
      ["ez-bar-curl", 2],
      ["decline-dumbbell-curl", 3],
      ["dumbbell-preacher-curl", 3],
      ["ez-bar-skull-crusher", 2],
      ["rope-tricep-pushdown", 3],
      ["rope-overhead-tricep-extension", 3],
      ["ez-bar-reverse-curl", 3],
      ["hanging-straight-leg-raise", 3],
    ],
  },
  {
    key: "Thu",
    title: "Legs",
    slots: [
      [{ A: "barbell-back-squat", B: "barbell-front-squat" }, 4],
      ["leg-press", 3],
      ["leg-extension", 3],
      ["seated-leg-curl", 3],
      ["single-leg-dumbbell-rdl", 3],
      ["leg-press-calf-raise", 5],
      ["isolated-calf-raise", 3],
      ["single-leg-cable-abduction", 3],
      ["single-leg-cable-adduction", 3],
      [{ A: "weighted-side-bend", B: "weighted-plate-sit-up" }, 3],
    ],
  },
  {
    key: "Fri",
    title: "Shoulders & Back",
    slots: [
      ["seated-dumbbell-military-press", 3],
      ["cable-lateral-raise", 4],
      ["machine-lateral-raise", 3],
      ["cable-rear-delt-fly", 4],
      ["dumbbell-shrug", 3],
      ["chin-ups", 4],
      ["lat-pulldown", 3],
      ["single-arm-dumbbell-row", 3],
      [{ A: "high-row-machine", B: "chest-supported-row-machine" }, 3],
      ["seated-ab-crunch-machine", 3],
    ],
  },
  {
    key: "Sat",
    title: "Chest & Arms",
    slots: [
      [{ A: "incline-dumbbell-press", B: "incline-barbell-bench-press" }, 4],
      ["flat-dumbbell-fly", 3],
      ["pec-deck-fly", 2],
      ["rear-delt-machine", 2],
      ["dips", 2],
      ["dual-cable-bicep-curl", 3],
      ["concentration-curl", 3],
      ["cable-curl", 2],
      ["single-arm-cable-tricep-pushdown", 3],
      ["cable-tricep-kickback", 3],
      ["single-arm-overhead-cable-tricep-extension", 2],
      ["cable-wrist-curl", 2],
      ["kneeling-cable-crunch", 3],
    ],
  },
];

export const DAY_KEYS = DAYS.map((d) => d.key);

export const DAY_NAMES = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

// Target working sets per muscle per week. Key order is the display order.
export const WEEKLY_SET_TARGETS = {
  Quads: 20,
  Hamstrings: 16,
  Glutes: 16,
  Adductors: 6,
  Abductors: 6,
  Calves: 14,
  Lats: 20,
  "Upper Back": 20,
  "Lower Back": 4,
  Traps: 10,
  "Upper Chest": 14,
  "Lower Chest": 12,
  "Front Delt": 12,
  "Side Delt": 18,
  "Rear Delt": 14,
  Biceps: 24,
  Triceps: 24,
  Forearms: 12,
  Abs: 16,
  Obliques: 8,
};

export const MUSCLES = Object.keys(WEEKLY_SET_TARGETS);

// Body region each muscle belongs to, used to group lifts within a session.
export const MUSCLE_GROUPS = {
  Quads: "Legs",
  Hamstrings: "Legs",
  Glutes: "Legs",
  Adductors: "Legs",
  Abductors: "Legs",
  Calves: "Legs",
  "Upper Chest": "Chest",
  "Lower Chest": "Chest",
  Lats: "Back",
  "Upper Back": "Back",
  "Lower Back": "Back",
  Traps: "Back",
  "Front Delt": "Shoulders",
  "Side Delt": "Shoulders",
  "Rear Delt": "Shoulders",
  Biceps: "Arms",
  Triceps: "Arms",
  Forearms: "Arms",
  Abs: "Core",
  Obliques: "Core",
};

export const EQUIPMENT_LABELS = {
  bbC: "Barbell",
  bbI: "Barbell",
  db: "Dumbbell (each hand)",
  cable: "Cable",
  mach: "Machine",
  machPL: "Plate-loaded",
  press: "Leg press",
  plate: "Plate",
  bw: "Bodyweight",
};

export const MAX_TEST_LIFTS = LIFTS.filter((l) => l.maxTest);

export const unitLabel = (lift) => (lift.mode === "weight" ? " lb" : " reps");

/**
 * The program as it runs in a given rotation week ("A" or "B"):
 *   { days: [{ key, title }], liftsByDay: { Mon: [lift & { sets, variant }] }, targets }
 * Scheduling code works on this shape, so tests can feed it other programs.
 */
export function weekProgram(variant) {
  return {
    days: DAYS.map(({ key, title }) => ({ key, title })),
    liftsByDay: Object.fromEntries(
      DAYS.map((day) => [
        day.key,
        day.slots.map(([ref, sets]) =>
          typeof ref === "string"
            ? { ...LIFTS_BY_ID[ref], sets }
            : { ...LIFTS_BY_ID[ref[variant]], sets, variant },
        ),
      ]),
    ),
    targets: WEEKLY_SET_TARGETS,
  };
}

// Every lift slot on a day with both variants, for screens that list the whole program.
export function daySlots(dayKey) {
  return DAYS.find((d) => d.key === dayKey).slots.map(([ref, sets]) =>
    typeof ref === "string"
      ? [{ lift: LIFTS_BY_ID[ref], sets }]
      : ["A", "B"].map((v) => ({ lift: LIFTS_BY_ID[ref[v]], sets, variant: v })),
  );
}

// Day keys a lift is scheduled on (either variant).
export const LIFT_DAYS = Object.fromEntries(
  LIFTS.map((lift) => [
    lift.id,
    DAYS.filter((d) =>
      d.slots.some(([ref]) =>
        typeof ref === "string" ? ref === lift.id : Object.values(ref).includes(lift.id),
      ),
    ).map((d) => d.key),
  ]),
);
