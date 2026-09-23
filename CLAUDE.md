# Lifting Tracker

Personal lifting tracker: a React PWA installed on an iPhone home screen, served by GitHub Pages at
https://dmikolay.github.io/Lifting_Tracker/. There is no backend. All data lives in the phone's localStorage.

## Commands

- `npm run dev` runs the dev server with hot reload.
- `npm test` runs the Vitest suite. Run it before every commit.
- `npm run build` builds to `dist/`: one self-contained `index.html` plus `sw.js`, the manifest and icons.
- `npm run format` runs Prettier.

Deploys happen automatically. Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds and
publishes `dist/` to Pages. `dist/` is never committed.

## Data: do not break

- localStorage keys: `gym:state:v1` holds the app state, and `gym:log:YYYY-MM` holds each month's day logs.
  Never rename these keys or change the shape stored under them. The phone holds real training history.
  `src/lib/storage.js` documents the shape.
- Lift ids in `src/data/lifts.js` (e.g. `"ez-bar-curl"`) key each lift's saved progress. Never rename an id.
  Changing a lift's display `name` is fine.
- Migrations are additive and safe to re-run (`src/lib/migrate.js`). A new lift id is filled in from the old
  records in its `from` list, and only if the id doesn't exist yet. Old records, old day-log entries and max
  tests stay untouched, and old ids are read through `LEGACY_IDS`. Retired lifts go in `RETIRED_LIFTS`, never
  deleted.
- If a new field is needed, add it in `normalizeState()` with a default, so older saves still load.

## Program

`PROGRAM.md` is the source of truth for the training program. When it changes, update `src/data/lifts.js`
(the catalog: credits, tiers, rep ranges) and `src/data/program.js` (days, sets, A/B slots, weekly targets),
then check `test/program.test.js`. A lift on several days is one record. A/B slots flip together each week.
See `src/lib/rotation.js`, whose state lives in `state.ab`.

## Layout

- `src/data/` holds the program: days, lifts, weekly set targets, and muscle groups.
- `src/lib/` holds pure logic with no React:
  - `dates.js`: date helpers. Dates are local `YYYY-MM-DD` strings and weeks start on Sunday.
  - `storage.js`: localStorage load and save, the default state, and migration.
  - `schedule.js`: week plans (`state.plans[weekStart]`), split days (`plan.split`), and building a day's
    session. It works on a `program` object (see `weekProgram()`), so tests can run it on other programs.
  - `rotation.js`: A/B week parity and manual flips.
  - `migrate.js`: carrying saved data from older programs forward.
  - `volume.js`: sets per muscle, lift ordering, and trimming oversized sessions.
  - `progression.js`: double-progression rules, including rep and weight increases and the two-strike revert.
  - `workout.js`: state transitions for logging sets, Clear, Keep same, and accepting prompts.
- `src/screens/` has one component per tab: Today, Week, Progress, and Lifts.
- `src/components/` holds shared UI. Styling is inline, using the tokens in `src/theme.js`.
- `src/sw.js` is the service worker. The build stamps its cache version automatically, so there is nothing
  to bump by hand. The page is network-first with a 4 s timeout, falling back to the cached copy offline.
- `test/golden.json` holds outputs recorded from the original app for random week plans, run on the old
  program (`test/legacy-program.json`). It pins the scheduling, split and trimming algorithms. If you change
  that behavior on purpose, regenerate the fixture and say so in the commit.
- `test/fixtures/pre-migration-save.json` is an old-format save used by the migration tests.

Put new logic in `src/lib/` with tests in `test/`, and keep screens thin.

## Versioning

Semantic versioning, below 1.0 while the app runs a single program: features bump the minor (0.3.0), fixes
bump the patch (0.2.1). 1.0.0 is reserved for user-configurable programs. When releasing, update the version
in `package.json` (`npm version <x.y.z> --no-git-tag-version`) and in `README.md`, then tag the commit `v<x.y.z>`.
