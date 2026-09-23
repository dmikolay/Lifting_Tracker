// Lift catalog. One entry per distinct exercise, independent of which day(s) it's on;
// the schedule (days, sets, A/B variants) lives in program.js.
//
// `id` keys the lift's saved progress in localStorage. Never rename an id: that
// orphans its history. To add a lift, give it a new id; it starts from the values
// below. To retire one, move it to RETIRED_LIFTS (its history stays in storage).
//
// Field reference:
//   equipment  key into EQUIPMENT_LABELS
//   increment  lb added when the top of the rep range is hit (0 for bodyweight)
//   tier       1 = main lift, 2 = secondary, 3 = accessory (higher tiers get trimmed first)
//   muscles    muscle -> credit (1 = primary mover, 0.5 = secondary) for volume counts
//   lo, hi     rep range (Dips: max reps, no range)
//   w, r       starting weight and reps for a fresh install (w is null for bodyweight)
//   maxTest    included in the four-monthly max test
//   from       ids of the per-day records this lift took over from the old program.
//              See src/lib/migrate.js. Several ids = histories merged.
//   startWeightFrom  for a new lift: take its starting weight from this old record

export const LIFTS = [
  { id: "barbell-rdl", name: "Barbell RDL", equipment: "bbC", increment: 10, tier: 1, muscles: { Hamstrings: 1, Glutes: 0.5, "Lower Back": 0.5 }, lo: 6, hi: 10, w: 275, r: 6, maxTest: false, from: ["Mon|BB RDL"] },
  { id: "barbell-single-leg-squat", name: "Barbell Single-Leg Squat", equipment: "bbC", increment: 10, tier: 2, muscles: { Quads: 1, Glutes: 0.5 }, lo: 8, hi: 12, w: 215, r: 8, maxTest: false, from: ["Mon|SL Squat"] },
  { id: "bulgarian-split-squat", name: "Bulgarian Split Squat", equipment: "db", increment: 5, tier: 2, muscles: { Quads: 1, Glutes: 0.5 }, lo: 8, hi: 12, w: 85, r: 8, maxTest: false, from: ["Thu|Bulgarian"] },
  { id: "hack-squat", name: "Hack Squat Machine", equipment: "machPL", increment: 10, tier: 3, muscles: { Quads: 1, Glutes: 0.5 }, lo: 8, hi: 12, w: 300, r: 8, maxTest: false, from: ["Mon|Hack Squat"] },
  { id: "barbell-hip-thrust", name: "Barbell Hip Thrust", equipment: "bbC", increment: 10, tier: 1, muscles: { Glutes: 1, Hamstrings: 0.5 }, lo: 8, hi: 10, w: 335, r: 8, maxTest: false, from: ["Mon|Hip Thrust"] },
  { id: "seated-leg-curl", name: "Seated Leg Curl Machine", equipment: "mach", increment: 10, tier: 1, muscles: { Hamstrings: 1 }, lo: 10, hi: 12, w: 200, r: 10, maxTest: false, from: ["Thu|Leg Curl"] },
  { id: "leg-extension", name: "Leg Extension Machine", equipment: "mach", increment: 10, tier: 1, muscles: { Quads: 1 }, lo: 10, hi: 12, w: 200, r: 10, maxTest: false, from: ["Thu|Leg Extension"] },
  { id: "isolated-calf-raise", name: "Isolated Calf Raise Machine", equipment: "mach", increment: 10, tier: 2, muscles: { Calves: 1 }, lo: 12, hi: 15, w: 35, r: 15, maxTest: false, from: ["Mon|Calf Raises"] },
  { id: "hip-abduction-machine", name: "Hip Abduction Machine", equipment: "mach", increment: 10, tier: 2, muscles: { Abductors: 1, Glutes: 0.5 }, lo: 12, hi: 15, w: 220, r: 12, maxTest: false, from: ["Thu|Abduction"] },
  { id: "hip-adduction-machine", name: "Hip Adduction Machine", equipment: "mach", increment: 10, tier: 2, muscles: { Adductors: 1 }, lo: 12, hi: 15, w: 230, r: 12, maxTest: false, from: ["Thu|Adduction"] },
  { id: "standing-cable-crunch", name: "Standing Cable Crunch Machine", equipment: "mach", increment: 10, tier: 2, muscles: { Abs: 1, Obliques: 0.5 }, lo: 10, hi: 15, w: 45, r: 15, maxTest: false, from: ["Mon|Stand Ab Mach"] },
  { id: "pull-ups", name: "Pull-Ups", equipment: "bw", increment: 0, tier: 3, muscles: { Lats: 1, Biceps: 0.5, "Upper Back": 0.5, Forearms: 0.5 }, lo: 6, hi: 12, w: null, r: 10, maxTest: false, from: ["Tue|Pull Ups","Fri|Pull Ups"] },
  { id: "single-arm-cable-row", name: "Single-Arm Cable Row", equipment: "cable", increment: 5, tier: 2, muscles: { Lats: 1, "Upper Back": 0.5, Biceps: 0.5 }, lo: 10, hi: 12, w: 60, r: 10, maxTest: false, from: ["Tue|SA Cable Row"] },
  { id: "barbell-bent-over-row", name: "Barbell Bent-Over Row", equipment: "bbC", increment: 10, tier: 1, muscles: { "Upper Back": 1, Lats: 1, "Rear Delt": 0.5, Biceps: 0.5, "Lower Back": 0.5 }, lo: 6, hi: 10, w: 225, r: 6, maxTest: false, from: ["Tue|Bent Over Row"] },
  { id: "barbell-overhead-press", name: "Barbell Overhead Press", equipment: "bbC", increment: 10, tier: 1, muscles: { "Front Delt": 1, "Side Delt": 0.5, Triceps: 0.5 }, lo: 5, hi: 8, w: 175, r: 5, maxTest: true, from: ["Tue|Overhead Press"] },
  { id: "dumbbell-lateral-raise", name: "Dumbbell Lateral Raise", equipment: "db", increment: 5, tier: 1, muscles: { "Side Delt": 1 }, lo: 12, hi: 15, w: 35, r: 12, maxTest: false, from: ["Tue|DB Lat Raise"] },
  { id: "machine-lateral-raise", name: "Machine Lateral Raise", equipment: "mach", increment: 10, tier: 3, muscles: { "Side Delt": 1 }, lo: 12, hi: 15, w: 140, r: 12, maxTest: false, from: ["Tue|Mach Lat Raise","Fri|Mach Lat Raise"] },
  { id: "lying-dumbbell-reverse-fly", name: "Lying Dumbbell Reverse Fly", equipment: "db", increment: 5, tier: 3, muscles: { "Rear Delt": 1, "Upper Back": 0.5 }, lo: 12, hi: 15, w: 25, r: 12, maxTest: false, from: ["Tue|Ly Reverse Fly"] },
  { id: "barbell-upright-row", name: "Barbell Upright Row", equipment: "bbI", increment: 5, tier: 2, muscles: { Traps: 1, "Side Delt": 0.5 }, lo: 12, hi: 15, w: 155, r: 12, maxTest: false, from: ["Tue|Upright Row"] },
  { id: "barbell-shrug", name: "Barbell Shrug", equipment: "bbC", increment: 10, tier: 2, muscles: { Traps: 1, Forearms: 0.5 }, lo: 10, hi: 15, w: 195, r: 12, maxTest: false, from: ["Tue|Barbell Shrugs"] },
  { id: "decline-bench-leg-raise", name: "Decline Bench Leg Raise", equipment: "bw", increment: 0, tier: 2, muscles: { Abs: 1, Obliques: 0.5 }, lo: 12, hi: 20, w: null, r: 12, maxTest: false, from: ["Tue|Incline Raises"] },
  { id: "flat-barbell-bench-press", name: "Flat Barbell Bench Press", equipment: "bbC", increment: 10, tier: 1, muscles: { "Lower Chest": 1, "Upper Chest": 0.5, Triceps: 0.5, "Front Delt": 0.5 }, lo: 5, hi: 8, w: 305, r: 5, maxTest: true, from: ["Wed|Barbell Bench"] },
  { id: "flat-dumbbell-bench-press", name: "Flat Dumbbell Bench Press", equipment: "db", increment: 5, tier: 1, muscles: { "Lower Chest": 1, Triceps: 0.5, "Front Delt": 0.5 }, lo: 8, hi: 10, w: 115, r: 8, maxTest: false, from: ["Sat|DB Bench"] },
  { id: "low-to-high-cable-fly", name: "Low-to-High Cable Fly", equipment: "cable", increment: 5, tier: 2, muscles: { "Upper Chest": 1, "Lower Chest": 0.5 }, lo: 12, hi: 15, w: 30, r: 12, maxTest: false, from: ["Sat|Cable Flys"] },
  { id: "pec-deck-fly", name: "Pec Deck Machine Fly", equipment: "mach", increment: 10, tier: 3, muscles: { "Lower Chest": 1, "Upper Chest": 0.5 }, lo: 12, hi: 15, w: 140, r: 12, maxTest: false, from: ["Wed|Machine Flys","Sat|Machine Flys"] },
  { id: "rear-delt-machine", name: "Rear Delt Machine", equipment: "mach", increment: 10, tier: 2, muscles: { "Rear Delt": 1, "Upper Back": 0.5 }, lo: 12, hi: 15, w: 130, r: 12, maxTest: false, from: ["Fri|Mach Rear Delt"] },
  { id: "ez-bar-curl", name: "EZ-Bar Curl", equipment: "bbI", increment: 5, tier: 2, muscles: { Biceps: 1, Forearms: 0.5 }, lo: 8, hi: 12, w: 80, r: 10, maxTest: false, from: ["Mon|EZ Bar Curl"] },
  { id: "decline-dumbbell-curl", name: "Decline Dumbbell Curl", equipment: "db", increment: 5, tier: 1, muscles: { Biceps: 1 }, lo: 10, hi: 12, w: 40, r: 10, maxTest: false, from: ["Wed|Decline Curls"] },
  { id: "dumbbell-preacher-curl", name: "Dumbbell Preacher Curl", equipment: "db", increment: 5, tier: 2, muscles: { Biceps: 1 }, lo: 10, hi: 12, w: 37.5, r: 10, maxTest: false, from: ["Wed|Isolation Curls"] },
  { id: "ez-bar-skull-crusher", name: "EZ-Bar Skull Crusher", equipment: "bbI", increment: 5, tier: 2, muscles: { Triceps: 1 }, lo: 10, hi: 15, w: 80, r: 10, maxTest: false, from: ["Mon|Skull Crusher"] },
  { id: "rope-tricep-pushdown", name: "Rope Tricep Pushdown", equipment: "cable", increment: 5, tier: 1, muscles: { Triceps: 1 }, lo: 10, hi: 12, w: 60, r: 10, maxTest: false, from: ["Wed|R Tri Pushdown"] },
  { id: "rope-overhead-tricep-extension", name: "Rope Overhead Tricep Extension", equipment: "cable", increment: 5, tier: 2, muscles: { Triceps: 1 }, lo: 10, hi: 12, w: 65, r: 10, maxTest: false, from: ["Wed|R Tri Overhead"] },
  { id: "ez-bar-reverse-curl", name: "EZ-Bar Reverse Curl", equipment: "bbI", increment: 5, tier: 3, muscles: { Forearms: 1, Biceps: 0.5 }, lo: 12, hi: 15, w: 70, r: 12, maxTest: false, from: ["Mon|EZ Bar Reverse"] },
  { id: "hanging-straight-leg-raise", name: "Hanging Straight-Leg Raise", equipment: "bw", increment: 0, tier: 2, muscles: { Abs: 1, Obliques: 0.5 }, lo: 12, hi: 20, w: null, r: 12, maxTest: false, from: ["Wed|Hanging Raises"] },
  { id: "barbell-back-squat", name: "Barbell Back Squat", equipment: "bbC", increment: 10, tier: 1, muscles: { Quads: 1, Glutes: 0.5, "Lower Back": 0.5 }, lo: 5, hi: 8, w: 355, r: 5, maxTest: true, from: ["Thu|Back Squat"] },
  { id: "barbell-front-squat", name: "Barbell Front Squat", equipment: "bbC", increment: 10, tier: 1, muscles: { Quads: 1, Glutes: 0.5, "Upper Back": 0.5 }, lo: 5, hi: 8, w: 265, r: 5, maxTest: true, from: ["Mon|Front Squat"] },
  { id: "leg-press", name: "Leg Press", equipment: "press", increment: 20, tier: 3, muscles: { Quads: 1, Glutes: 0.5, Hamstrings: 0.5 }, lo: 8, hi: 12, w: 700, r: 8, maxTest: false, from: ["Thu|Leg Press"] },
  { id: "single-leg-dumbbell-rdl", name: "Single-Leg Dumbbell RDL", equipment: "db", increment: 5, tier: 1, muscles: { Hamstrings: 1, Glutes: 0.5 }, lo: 8, hi: 12, w: 95, r: 8, maxTest: false, from: ["Thu|SL DB RDL"] },
  { id: "leg-press-calf-raise", name: "Leg Press Calf Raise", equipment: "machPL", increment: 10, tier: 2, muscles: { Calves: 1 }, lo: 10, hi: 15, w: 300, r: 15, maxTest: false, from: ["Thu|Calf Raises"] },
  { id: "single-leg-cable-abduction", name: "Single-Leg Cable Abduction", equipment: "cable", increment: 5, tier: 3, muscles: { Abductors: 1, Glutes: 0.5 }, lo: 12, hi: 15, w: 25, r: 12, maxTest: false, from: ["Mon|SL Abductor"] },
  { id: "single-leg-cable-adduction", name: "Single-Leg Cable Adduction", equipment: "cable", increment: 5, tier: 3, muscles: { Adductors: 1 }, lo: 12, hi: 15, w: 25, r: 12, maxTest: false, from: ["Mon|SL Adductor"] },
  { id: "weighted-side-bend", name: "Weighted Side Bend", equipment: "plate", increment: 5, tier: 3, muscles: { Obliques: 1, Abs: 0.5 }, lo: 12, hi: 15, w: 25, r: 15, maxTest: false, from: ["Thu|Oblique Extend"] },
  { id: "weighted-plate-sit-up", name: "Weighted Plate Sit-Up", equipment: "plate", increment: 5, tier: 2, muscles: { Abs: 1, Obliques: 0.5 }, lo: 12, hi: 15, w: 25, r: 15, maxTest: false, from: ["Thu|Plate Sit Ups"] },
  { id: "seated-dumbbell-military-press", name: "Seated Dumbbell Military Press", equipment: "db", increment: 5, tier: 1, muscles: { "Front Delt": 1, "Side Delt": 0.5, Triceps: 0.5 }, lo: 8, hi: 10, w: 90, r: 8, maxTest: false, from: ["Fri|DB Military"] },
  { id: "cable-lateral-raise", name: "Cable Lateral Raise", equipment: "cable", increment: 5, tier: 2, muscles: { "Side Delt": 1 }, lo: 12, hi: 15, w: 20, r: 12, maxTest: false, from: ["Fri|Cable Lat Raise"] },
  { id: "cable-rear-delt-fly", name: "Cable Rear Delt Fly", equipment: "cable", increment: 5, tier: 3, muscles: { "Rear Delt": 1 }, lo: 12, hi: 15, w: 15, r: 12, maxTest: false, from: ["Fri|Cable Rear Delt"] },
  { id: "dumbbell-shrug", name: "Dumbbell Shrug", equipment: "db", increment: 5, tier: 2, muscles: { Traps: 1, Forearms: 0.5 }, lo: 10, hi: 15, w: 95, r: 12, maxTest: false, from: ["Fri|DB Shrugs"] },
  { id: "chin-ups", name: "Chin-Ups", equipment: "bw", increment: 0, tier: 3, muscles: { Lats: 1, Biceps: 0.5, "Upper Back": 0.5, Forearms: 0.5 }, lo: 6, hi: 12, w: null, r: 10, maxTest: true, from: ["Fri|Chin Ups","Tue|Chin Ups"] },
  { id: "lat-pulldown", name: "Lat Pulldown", equipment: "cable", increment: 5, tier: 1, muscles: { Lats: 1, Biceps: 0.5, "Upper Back": 0.5 }, lo: 8, hi: 12, w: 90, r: 8, maxTest: false, from: ["Fri|Lat Pulldowns"] },
  { id: "single-arm-dumbbell-row", name: "Single-Arm Dumbbell Row", equipment: "db", increment: 5, tier: 1, muscles: { "Upper Back": 1, Lats: 0.5, Biceps: 0.5 }, lo: 8, hi: 12, w: 95, r: 8, maxTest: false, from: ["Fri|SA Row"] },
  { id: "high-row-machine", name: "High Row Machine", equipment: "machPL", increment: 10, tier: 2, muscles: { "Upper Back": 1, Lats: 0.5, "Rear Delt": 0.5 }, lo: 8, hi: 12, w: 300, r: 8, maxTest: false, from: ["Fri|Shoulder Row"] },
  { id: "chest-supported-row-machine", name: "Chest-Supported Row Machine", equipment: "machPL", increment: 10, tier: 2, muscles: { "Upper Back": 1, Lats: 0.5 }, lo: 8, hi: 12, w: 225, r: 8, maxTest: false, from: ["Fri|Chest Row"] },
  { id: "seated-ab-crunch-machine", name: "Seated Abdominal Crunch Machine", equipment: "mach", increment: 10, tier: 2, muscles: { Abs: 1 }, lo: 10, hi: 15, w: 170, r: 15, maxTest: false, from: ["Fri|Sit Ab Machine"] },
  { id: "incline-dumbbell-press", name: "Incline Dumbbell Press", equipment: "db", increment: 5, tier: 1, muscles: { "Upper Chest": 1, "Front Delt": 0.5, Triceps: 0.5 }, lo: 8, hi: 10, w: 110, r: 8, maxTest: false, from: ["Wed|DB Incline"] },
  { id: "incline-barbell-bench-press", name: "Incline Barbell Bench Press", equipment: "bbC", increment: 10, tier: 1, muscles: { "Upper Chest": 1, "Front Delt": 0.5, Triceps: 0.5 }, lo: 5, hi: 8, w: 265, r: 5, maxTest: true, from: ["Sat|Barbell Incline"] },
  { id: "flat-dumbbell-fly", name: "Flat Dumbbell Fly", equipment: "db", increment: 5, tier: 2, muscles: { "Upper Chest": 1, "Lower Chest": 0.5 }, lo: 10, hi: 15, w: 32.5, r: 10, maxTest: false, from: ["Wed|DB Flys"] },
  { id: "dips", name: "Dips", equipment: "bw", increment: 0, tier: 3, muscles: { Triceps: 1, "Lower Chest": 1, "Front Delt": 0.5 }, lo: 0, hi: 0, w: null, r: 10, maxTest: false, from: ["Sat|Dips"] },
  { id: "dual-cable-bicep-curl", name: "Dual Cable Bicep Curl", equipment: "cable", increment: 5, tier: 1, muscles: { Biceps: 1 }, lo: 12, hi: 15, w: 35, r: 12, maxTest: false, from: ["Sat|Cable Dual Curl"] },
  { id: "concentration-curl", name: "Standing Single-Arm Concentration Curl", equipment: "db", increment: 5, tier: 2, muscles: { Biceps: 1 }, lo: 10, hi: 12, w: 25, r: 10, maxTest: false, from: ["Sat|SA Iso Curl"] },
  { id: "single-arm-cable-tricep-pushdown", name: "Single-Arm Cable Tricep Pushdown", equipment: "cable", increment: 5, tier: 1, muscles: { Triceps: 1 }, lo: 12, hi: 15, w: 30, r: 12, maxTest: false, from: ["Sat|SA Cable Tri"] },
  { id: "cable-tricep-kickback", name: "Cable Tricep Kickback", equipment: "cable", increment: 5, tier: 3, muscles: { Triceps: 1 }, lo: 12, hi: 15, w: 15, r: 12, maxTest: false, from: ["Wed|Cable Kickback"] },
  { id: "single-arm-overhead-cable-tricep-extension", name: "Single-Arm Overhead Cable Tricep Extension", equipment: "cable", increment: 5, tier: 2, muscles: { Triceps: 1 }, lo: 12, hi: 15, w: 40, r: 12, maxTest: false, from: ["Sat|SA OH Tri"] },
  { id: "cable-wrist-curl", name: "Cable Wrist Curl", equipment: "cable", increment: 5, tier: 3, muscles: { Forearms: 1 }, lo: 15, hi: 20, w: 25, r: 15, maxTest: false, from: ["Sat|Cable Forearms"] },
  { id: "kneeling-cable-crunch", name: "Kneeling Cable Crunch", equipment: "cable", increment: 5, tier: 2, muscles: { Abs: 1, Obliques: 0.5 }, lo: 10, hi: 15, w: 90, r: 15, maxTest: false, from: ["Sat|Cable Crunch"] },
  { id: "cable-curl", name: "Cable Curl", equipment: "cable", increment: 5, tier: 3, muscles: { Biceps: 1 }, lo: 10, hi: 12, w: 50, r: 10, maxTest: false, from: [], startWeightFrom: "Wed|Cable B Curls" },
];

// Lifts dropped from the program. Hidden everywhere, but their saved progress
// and logs are kept; these entries let old logs and max tests still resolve.
export const RETIRED_LIFTS = [
  { id: "Tue|Landmine Press", name: "Kneeling Single-Arm Landmine Press", muscles: { "Front Delt": 1, "Upper Chest": 0.5, Triceps: 0.5 } },
  { id: "Tue|DB Front Raise", name: "Dumbbell Front Raise", muscles: { "Front Delt": 1 } },
  { id: "Tue|DB Pullovers", name: "Dumbbell Pullover", muscles: { Lats: 1, "Upper Chest": 0.5 } },
  { id: "Wed|Cable B Curls", name: "Cable Bar Curl", muscles: { Biceps: 1 } },
  { id: "Wed|Cable R Curl", name: "Cable Reverse Curl", muscles: { Forearms: 1, Biceps: 0.5 } },
  { id: "Wed|Bar Forearms", name: "Barbell Wrist Curl", muscles: { Forearms: 1 } },
  { id: "Thu|Kickbacks", name: "Glute Kickback Machine", muscles: { Glutes: 1, Hamstrings: 0.5 } },
  { id: "Sat|Bicep Machine", name: "Bicep Machine", muscles: { Biceps: 1 } },
  { id: "Sat|Tricep Machine", name: "Tricep Machine", muscles: { Triceps: 1 } },
];

// How a lift is logged: by weight, by reps at bodyweight, or as max reps (Dips).
for (const lift of LIFTS) {
  lift.mode = lift.equipment !== "bw" ? "weight" : lift.name === "Dips" ? "amrap" : "bwreps";
}
