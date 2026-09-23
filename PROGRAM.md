# PROGRAM.md — Lifting Program Spec (source of truth)

This file defines the training program the app must implement. When this file changes, the app should be updated to match it.

**Non-negotiables**
- Never rename the localStorage keys `gym:state:v1` or `gym:log:<date>`, and never delete stored history. Migrations must be additive and safe to run more than once.
- Bump the service-worker cache version on every release.

---

## 1. Weekly schedule (200 sets/week)

Days are fixed. Sets per day: Mon 34 · Tue 33 · Wed 33 · Thu 33 · Fri 33 · Sat 34.

"A / B" = weekly rotation slot (see §2). "Sets" = working sets. "Reps" = rep range for rep-range progression.

### Monday — Legs (34)
| Lift | Sets | Reps |
|---|---|---|
| Barbell RDL | 4 | 6–10 |
| A: Barbell Single-Leg Squat / B: Bulgarian Split Squat | 3 | 8–12 |
| Hack Squat Machine | 4 | 8–12 |
| Barbell Hip Thrust | 3 | 8–10 |
| Seated Leg Curl Machine | 3 | 10–12 |
| Leg Extension Machine | 3 | 10–12 |
| Isolated Calf Raise Machine | 5 | 12–15 |
| Hip Abduction Machine | 3 | 12–15 |
| Hip Adduction Machine | 3 | 12–15 |
| Standing Cable Crunch Machine | 3 | 10–15 |

### Tuesday — Back & Shoulders (33)
| Lift | Sets | Reps |
|---|---|---|
| Pull-Ups | 4 | 6–12 |
| Single-Arm Cable Row | 3 | 10–12 |
| Barbell Bent-Over Row | 3 | 6–10 |
| Barbell Overhead Press | 3 | 5–8 |
| Dumbbell Lateral Raise | 4 | 12–15 |
| Machine Lateral Raise | 3 | 12–15 |
| Lying Dumbbell Reverse Fly | 4 | 12–15 |
| Barbell Upright Row | 3 | 12–15 |
| Barbell Shrug | 3 | 10–15 |
| Decline Bench Leg Raise | 3 | 12–20 |

### Wednesday — Chest & Arms (33)
| Lift | Sets | Reps |
|---|---|---|
| A: Flat Barbell Bench Press (5–8) / B: Flat Dumbbell Bench Press (8–10) | 4 | per variant |
| Low-to-High Cable Fly | 3 | 12–15 |
| Pec Deck Machine Fly | 2 | 12–15 |
| Rear Delt Machine | 2 | 12–15 |
| EZ-Bar Curl | 2 | 8–12 |
| Decline Dumbbell Curl | 3 | 10–12 |
| Dumbbell Preacher Curl | 3 | 10–12 |
| EZ-Bar Skull Crusher | 2 | 10–15 |
| Rope Tricep Pushdown | 3 | 10–12 |
| Rope Overhead Tricep Extension | 3 | 10–12 |
| EZ-Bar Reverse Curl | 3 | 12–15 |
| Hanging Straight-Leg Raise | 3 | 12–20 |

### Thursday — Legs (33)
| Lift | Sets | Reps |
|---|---|---|
| A: Barbell Back Squat / B: Barbell Front Squat | 4 | 5–8 |
| Leg Press | 3 | 8–12 |
| Leg Extension Machine | 3 | 10–12 |
| Seated Leg Curl Machine | 3 | 10–12 |
| Single-Leg Dumbbell RDL | 3 | 8–12 |
| Leg Press Calf Raise | 5 | 10–15 |
| Isolated Calf Raise Machine | 3 | 12–15 |
| Single-Leg Cable Abduction | 3 | 12–15 |
| Single-Leg Cable Adduction | 3 | 12–15 |
| A: Weighted Side Bend / B: Weighted Plate Sit-Up | 3 | 12–15 |

### Friday — Shoulders & Back (33)
| Lift | Sets | Reps |
|---|---|---|
| Seated Dumbbell Military Press | 3 | 8–10 |
| Cable Lateral Raise | 4 | 12–15 |
| Machine Lateral Raise | 3 | 12–15 |
| Cable Rear Delt Fly | 4 | 12–15 |
| Dumbbell Shrug | 3 | 10–15 |
| Chin-Ups | 4 | 6–12 |
| Lat Pulldown | 3 | 8–12 |
| Single-Arm Dumbbell Row | 3 | 8–12 |
| A: High Row Machine / B: Chest-Supported Row Machine | 3 | 8–12 |
| Seated Abdominal Crunch Machine | 3 | 10–15 |

### Saturday — Chest & Arms (34)
| Lift | Sets | Reps |
|---|---|---|
| A: Incline Dumbbell Press (8–10) / B: Incline Barbell Bench Press (5–8) | 4 | per variant |
| Flat Dumbbell Fly | 3 | 10–15 |
| Pec Deck Machine Fly | 2 | 12–15 |
| Rear Delt Machine | 2 | 12–15 |
| Dips | 2 | AMRAP (log max reps to failure, as today) |
| Dual Cable Bicep Curl | 3 | 12–15 |
| Standing Single-Arm Concentration Curl | 3 | 10–12 |
| Cable Curl *(new lift)* | 2 | 10–12 |
| Single-Arm Cable Tricep Pushdown | 3 | 12–15 |
| Cable Tricep Kickback | 3 | 12–15 |
| Single-Arm Overhead Cable Tricep Extension | 2 | 12–15 |
| Cable Wrist Curl | 2 | 15–20 |
| Kneeling Cable Crunch | 3 | 10–15 |

---

## 2. A/B rotation rules
- The whole program has exactly two week versions, **Week A** and **Week B**. Every A/B slot flips on the same week.
- Anchor: the first week the new program goes live is Week A. Parity = weeks since anchor (even = A, odd = B), using the app's existing week boundaries.
- Add a control in the Week tab to see which week it is and to flip A/B manually (in case a week is missed).
- Only the active variant shows in Today. Each variant keeps its own separate progression history.
- Bench design: barbell pressing happens once per week, alternating flat (A, Wed) and incline (B, Sat).

## 3. Same lift, same data
A lift that appears on more than one day is **one lift**. It shares one progression record, one history, and one rep range, with no per-day copies:
Leg Extension Machine, Seated Leg Curl Machine, Isolated Calf Raise Machine, Machine Lateral Raise, Pec Deck Machine Fly, Rear Delt Machine.
Where two old per-day records exist (e.g. Machine Lateral Raise on Tue and Fri, Pec Deck on Wed and Sat), merge their histories by date and use the most recent working weight.

## 4. Migration from the old program
Lift history is currently keyed by day (e.g. `Tue|...`). Move each lift's progression and history to its new place so nothing restarts from zero.

**Moved to a new day**
- Mon → Wed: EZ-Bar Curl, EZ-Bar Reverse Curl, EZ-Bar Skull Crusher
- Mon → Thu: Barbell Front Squat (now the B variant with Back Squat); Single-Leg Cable Abduction; Single-Leg Cable Adduction
- Thu → Mon: Bulgarian Split Squat (now the B variant with Barbell Single-Leg Squat); Hip Abduction Machine; Hip Adduction Machine
- Wed → Sat: Incline Dumbbell Press, Flat Dumbbell Fly, Cable Tricep Kickback
- Sat → Wed: Flat Dumbbell Bench Press, Low-to-High Cable Fly
- Fri → Wed + Sat: Rear Delt Machine (shared, see §3)

**Newly appears on an extra day** (shared record, §3): Leg Extension and Seated Leg Curl on Mon; Isolated Calf Raise Machine on Thu.

**New lift**: Cable Curl (Sat). Credits: Biceps 1. Tier 3. Starts with no history.

**Removed from the program.** Hide these from the schedule and Today, but keep their stored history in localStorage:
Dumbbell Front Raise, Kneeling Single-Arm Landmine Press, Cable Bar Curl, Cable Reverse Curl, Bicep Machine, Tricep Machine, Barbell Wrist Curl, Glute Kickback Machine, Dumbbell Pullover, the Tuesday copy of Chin-Ups, and the Friday copy of Pull-Ups (Pull-Ups are now Tue only, Chin-Ups Fri only).

**Rep-range changes**: keep each lift's current working weight. If its current target reps fall outside the new range, clamp them into the new range.

## 5. Muscle credit fixes
Credits use the existing system: 1 = primary mover, 0.5 = secondary mover.
- **Pec Deck Machine Fly**: currently inconsistent between days. Use one mapping: Lower Chest 1, Upper Chest 0.5.
- **Single-Arm Cable Row**: the user pulls it tucked, down to the hip, so it's lat-dominant. Change to Lats 1, Upper Back 0.5, Biceps 0.5.
- **High Row Machine** and **Chest-Supported Row Machine**: both done overhand, wide, elbows flared, so they're upper-back-dominant. Keep Upper Back as primary.

## 6. Weekly muscle targets (replace current values)
| Muscle | Target | | Muscle | Target |
|---|---|---|---|---|
| Quads | 20 | | Upper Chest | 14 |
| Hamstrings | 16 | | Lower Chest | 12 |
| Glutes | 16 | | Front Delt | 12 |
| Adductors | 6 | | Side Delt | 18 |
| Abductors | 6 | | Rear Delt | 14 |
| Calves | 14 | | Biceps | 24 |
| Lats | 20 | | Triceps | 24 |
| Upper Back | 20 | | Forearms | 12 |
| Lower Back | 4 | | Abs | 16 |
| Traps | 10 | | Obliques | 8 |

## 7. Checks before shipping
- Each day's set total matches §1, and the week totals 200.
- With the corrected credits, the Week tab's muscle bars for a normal A week and B week land close to the targets (arms intentionally above target).
- Existing features still work: day splitting and merging with set trimming, stall detection, quarterly max tests (Front Squat is now a Thursday B-week lift), and backup/restore.
- A test backup from before the migration still imports correctly.
