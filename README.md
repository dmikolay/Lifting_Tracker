# Gym: Lifting Tracker

A personal weightlifting tracker that runs as an app on an iPhone home screen. It tells you what to lift today, logs each set with a tap, decides when to add reps or weight, and shows how your weekly volume stacks up against per-muscle targets.

**Live app:** https://dmikolay.github.io/Lifting_Tracker/
**Version:** 0.2.0 ([versioning](#versioning))

The app has no account, no server, and no sign-up. It's a single web page that installs to your home screen, works offline, and keeps all your data on your phone.

> **Right now this is built around one person's program**: my schedule, my lifts and my targets. The long-term goal is to let anyone set it up on their phone for their own schedule and style of training. See [Roadmap](#roadmap-an-app-for-anyone).

---

## Contents

- [What it does](#what-it-does)
- [How progression works](#how-progression-works)
- [The program](#the-program)
- [How it works under the hood](#how-it-works-under-the-hood)
- [Set it up for yourself](#set-it-up-for-yourself)
- [Developing](#developing)
- [Versioning](#versioning)
- [Roadmap: an app for anyone](#roadmap-an-app-for-anyone)
- [Known limitations](#known-limitations)

---

## What it does

The app has four tabs.

### Today

Today's session: the lifts, each one's target weight × reps, and a box for every set.

- **Tap a lift** to open it. You'll see the target, rep range, what you did last time, and any "strikes" (missed sessions).
- **Log each set** with ✓ (hit the target) or ✕ (missed it). Adjust the weight and reps with − and + first if you did something different.
- **Dips** are logged as max reps to failure instead of ✓/✕.
- **Keep same** marks every set as done at the current target without changing your progression. Use it for a deload or a day you just want to get through.
- **Clear** wipes today's sets for that lift and puts its progression back to where it was this morning.
- **Notes** at the bottom are saved per program day, e.g. one note for "Chest & Arms".
- **‹ ›** step through days, so you can log a session you forgot or look ahead.

The header shows which day of the week's sessions this is (e.g. "Day 2 of 6") and whether it's **Week A or Week B** (see [A/B weeks](#ab-weeks)).

### Week

The whole week at a glance: each day's session, with lift and set counts, and a **weekly sets by muscle** chart against your targets.

Tap **Edit** to rearrange the week:
- **Start day:** start the week on Sunday or Monday. The whole week slides.
- **Move a day:** pick which weekday each program day lands on. Two days can share a weekday. The app then trims the combined session (see [session trimming](#session-trimming)).
- **Split a day:** break one program day into two halves on different weekdays. Tap a lift to move it between halves.
- **Save** applies the plan to that week only. **Reset** returns to the default layout.

**Make this week A/B** flips the rotation if a week got skipped (see [A/B weeks](#ab-weeks)).

### Progress

- **Rolling 7 days:** sets you actually logged in the last week, by muscle, against targets.
- **Load over time:** a chart of the weight (or reps, for bodyweight lifts) for any lift.
- **Stalled:** lifts that haven't moved in 4+ weeks. If more than six are stalled, the app suggests an easy week.
- **Monthly volume:** a calendar heatmap of how many sets you did each day.
- **Last 30 days:** which lifts went up, and which stayed flat.
- **Max test:** every four months, test 1-rep maxes (or max reps) on the main lifts. The app flags when a test is due and shows your last three.

### Lifts

Every lift in the program, grouped by day, with its equipment, tier, sets, and current target. Open one to see which muscles it credits, and to edit its weight, reps or rep range by hand. A lift that appears on two days is one record, so editing it on one day updates both.

---

## How progression works

The app uses **double progression**: first you earn reps, then you earn weight.

1. Each lift has a **rep range** (say 8–12) and a **current target** (say 135 × 8).
2. **Hit every set** and the app offers one more rep next time: "Move to 9 reps next time?" Tap **Take it** or **Not yet**.
3. **At the top of the range** (135 × 12, every set hit), it offers more weight and drops you back to the bottom of the range: "Add 5 lb → 140 × 8?"
4. **Bodyweight lifts** (pull-ups, leg raises) can't add weight, so the whole rep range moves up by two instead.
5. **Miss every set two sessions in a row** and the target reverts to the last one you fully hit. That's a "strike"; the lift shows strikes as "1 of 2".

Mixed sessions, where some sets were hit and some missed, reset the strikes and leave the target alone.

Every completed session is saved to the lift's history (date, weight, best reps, hit or missed). The charts and stall detection read from that history.

---

## The program

The full program is in [`PROGRAM.md`](PROGRAM.md), which is the source of truth. The app is built to match it. In short:

| Day | Focus | Sets |
|---|---|---|
| Monday | Legs | 34 |
| Tuesday | Back & Shoulders | 33 |
| Wednesday | Chest & Arms | 33 |
| Thursday | Legs | 33 |
| Friday | Shoulders & Back | 33 |
| Saturday | Chest & Arms | 34 |
| **Week** | | **200** |

Each lift has a **tier**: 1 for a main lift, 2 for secondary, 3 for an accessory. Tiers set the order within a session and decide what gets cut first when a session has to shrink.

### A/B weeks

Some slots alternate week to week. For example, Wednesday's bench is **flat barbell** in Week A and **flat dumbbell** in Week B, and Saturday's incline does the opposite, so heavy barbell pressing happens once a week. Every A/B slot flips together.

- The first week on this program was Week A. After that it alternates.
- Each variant is its own lift with its own history and progression.
- If you miss a week, use **Make this week B/A** on the Week tab. The flip carries forward from that week; earlier weeks stay as they were.

### Muscle credit and weekly targets

Each lift credits the muscles it trains: **1** for a primary mover, **0.5** for a secondary one. For example, a barbell row credits Upper Back 1, Lats 1, Rear Delts 0.5, Biceps 0.5 and Lower Back 0.5. Adding these up across a week gives the "sets by muscle" bars, compared against weekly targets (e.g. Quads 20, Side Delts 18, Lower Back 4).

### Session trimming

If you merge days so one session gets too long, the app trims it automatically. The cap is 40 sets for one day's worth of work and 60 at most. It first drops whole non-main lifts for muscles that already have the most volume, then shortens lifts a set at a time, never below 2–3 sets. Dropped and shortened lifts are listed under the session.

---

## How it works under the hood

### It's a website that acts like an app

The app is a **Progressive Web App (PWA)**: a web page with a manifest (name, icon, colors) and a **service worker** (a small script that caches the app). Adding it to the iPhone home screen makes it open full-screen like a native app.

The service worker makes it work offline:
- **With signal**, it loads the latest version from the web, so updates arrive on their own.
- **With no signal** (or if the network takes more than 4 seconds), it opens the last copy it saved.

### Your data stays on your phone

Everything is saved in the browser's **localStorage** on your device, the moment you change it:

| Key | What's in it |
|---|---|
| `gym:state:v1` | Your targets and history for every lift, week plans, notes, max tests, and the A/B rotation |
| `gym:log:YYYY-MM` | Every set you logged that month, by day |

Nothing is sent anywhere, and there's no cloud copy. See [Known limitations](#known-limitations).

When the program changes, the app **migrates** your saved data forward the first time it opens. A lift that moved to a new day keeps its history, two copies of the same lift get their histories merged, and removed lifts stay in storage untouched. Migrations only ever add data, and running one twice changes nothing.

### How it's built

- **React** for the interface, **Vite** to build it. The build produces one self-contained `index.html` plus the service worker, manifest and icons.
- **Vitest** for tests: the progression rules, the program's set totals and muscle volumes, the A/B rotation, the scheduling and trimming logic, the service worker, and migrating a real old-format save.
- **GitHub Actions + GitHub Pages** for hosting. Every push to `main` runs the tests, builds the app and publishes it. If a test fails, nothing is deployed.

```
PROGRAM.md            the training program (source of truth)
src/
  data/lifts.js       every lift: equipment, tier, muscle credits, rep range
  data/program.js     the weekly schedule: days, sets, A/B slots, targets
  lib/                logic with no UI: progression, scheduling, A/B rotation,
                      volume and trimming, storage, migrations
  screens/            one file per tab: Today, Week, Progress, Lifts
  components/         shared UI pieces
  sw.js               the service worker
public/               manifest and icons
test/                 the test suite
```

---

## Set it up for yourself

The app currently runs **my** program. You can run your own copy today, but to change the lifts, sets or schedule you'll need to edit code (see [Changing the program](#changing-the-program)). Making that easier is the [long-term goal](#roadmap-an-app-for-anyone).

### 1. Get your own copy online

You'll need a free [GitHub](https://github.com) account.

1. **Fork** this repository (the "Fork" button at the top of the GitHub page).
2. In your fork, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Go to the **Actions** tab. If GitHub asks, enable workflows. Then open **Deploy** and click **Run workflow** (or push any change to `main`).
4. When it finishes (about a minute), your app is live at `https://<your-username>.github.io/Lifting_Tracker/`.

### 2. Put it on your iPhone

1. Open your app's link in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open it from the home screen. It runs full-screen and works offline from then on.

On Android, open the link in Chrome and use **Add to Home screen** or **Install app** from the menu.

> Don't use Private Browsing. It blocks storage, and nothing will save. The app shows a warning if this happens.

### 3. Getting updates

Updates arrive the next time you open the app with signal. If you don't see a change, close the app fully (swipe it away) and reopen it.

### Changing the program

For now the program is defined in code, in two files:

- **`src/data/lifts.js`:** add or edit a lift's name, equipment, tier, rep range, starting weight, and muscle credits.
- **`src/data/program.js`:** which lifts go on which day, how many sets each, A/B pairs, and weekly muscle targets.

Then update `PROGRAM.md` to match, and run the tests (see below). Two rules protect your saved data:
- **Never rename a lift's `id`.** It's the key its history is saved under. Changing the display `name` is fine.
- **Don't delete lifts.** Move retired ones to `RETIRED_LIFTS`, so their history stays readable.

`CLAUDE.md` has more detail on how the code fits together.

---

## Developing

You'll need [Node.js](https://nodejs.org) 22.12 or newer.

```bash
npm install
```

```bash
npm run dev
```

That starts a local copy with live reload. Before pushing, run the tests:

```bash
npm test
```

To build the production version into `dist/`:

```bash
npm run build
```

To format the code:

```bash
npm run format
```

Pushing to `main` deploys automatically once the tests pass.

---

## Versioning

The app uses [semantic versioning](https://semver.org) (`MAJOR.MINOR.PATCH`). While it's still a personal, single-program app, it stays below 1.0:

- **0.1.x:** the original single-file app, about twenty builds made one change at a time as one large HTML file with no source code.
- **0.2.0 (current):** the first version built from real source code: a React + Vite project with tests and automatic deploys. It also brings the 200-set program with A/B weeks and a data migration that carried all existing history forward.
- **Later 0.x releases:** new features bump the middle number (0.3.0); fixes bump the last one (0.2.1).
- **1.0.0:** reserved for when anyone can set the app up for their own program (see below).

---

## Roadmap: an app for anyone

Today the app knows exactly one program. The goal is for **anyone**, with any schedule, split, or training style, to be able to put it on their phone and have it built around them. That could be 3 days a week or 6, full-body or a bro split, strength or hypertrophy.

It isn't clear yet how to get there, but these are the likely pieces:

- **Programs as data, not code.** Move the program out of source files into something the app can load and save, the way it already stores your history.
- **An in-app program editor.** Add, remove and reorder lifts, set sets and rep ranges, and choose which days you train, all from the phone.
- **Starter templates** to pick from and adjust: Push/Pull/Legs, Upper/Lower, full-body 3×/week, and this program.
- **Setup on first launch:** a short onboarding flow that asks about your schedule and goals, then builds a starting program.
- **Your own targets and rules:** weekly volume targets per muscle, rep ranges, weight jumps, and whether A/B weeks or deloads are used.
- **Backup and moving to a new phone:** a way to export and import your data, so it isn't tied to one device.

Much of the groundwork is already in place. The scheduling, trimming, progression and volume logic already runs on a program passed in as data, and the migration system already knows how to carry history forward when a program changes.

---

## Known limitations

- **One device only.** Your data lives on the phone you use. It doesn't sync, and there's currently no backup or export. **Deleting the home-screen app deletes your data.**
- **One program.** Changing lifts or the schedule means editing code (see [Changing the program](#changing-the-program)).
- **Rolling 7 days** only counts months you've already viewed in the app during that session, so early in a month it can miss the end of the previous one.
