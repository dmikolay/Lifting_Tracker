import { LIFTS } from "./lifts.js";

export { LIFTS };

// The six program days, in order. `key` is what lifts and saved plans refer to.
export const DAYS = [
  { key: "Mon", title: "Legs & Arms" },
  { key: "Tue", title: "Back & Shoulders" },
  { key: "Wed", title: "Chest & Arms" },
  { key: "Thu", title: "Legs" },
  { key: "Fri", title: "Shoulders & Back" },
  { key: "Sat", title: "Chest & Arms" },
];

export const DAY_KEYS = DAYS.map((d) => d.key);

export const dayTitle = (key) => DAYS.find((d) => d.key === key).title;

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
  Adductors: 8,
  Abductors: 8,
  Calves: 12,
  Lats: 20,
  "Upper Back": 16,
  "Lower Back": 8,
  Traps: 12,
  "Upper Chest": 16,
  "Lower Chest": 16,
  "Front Delt": 12,
  "Side Delt": 16,
  "Rear Delt": 12,
  Biceps: 20,
  Triceps: 20,
  Forearms: 10,
  Abs: 16,
  Obliques: 10,
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

export const LIFTS_BY_ID = Object.fromEntries(LIFTS.map((l) => [l.id, l]));

export const LIFTS_BY_DAY = Object.fromEntries(
  DAY_KEYS.map((key) => [key, LIFTS.filter((l) => l.day === key)]),
);

export const MAX_TEST_LIFTS = LIFTS.filter((l) => l.maxTest);

export const unitLabel = (lift) => (lift.mode === "weight" ? " lb" : " reps");
