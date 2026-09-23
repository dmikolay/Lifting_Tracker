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
- Lift ids in `src/data/lifts.js` (`"Day|Short name"`) key each lift's saved progress. Never rename an id.
  Changing a lift's display `name` is fine.
- If a new field is needed, add it in `normalizeState()` with a default, so older saves still load.

## Layout

- `src/data/` holds the program: days, lifts, weekly set targets, and muscle groups.
- `src/lib/` holds pure logic with no React:
  - `dates.js`: date helpers. Dates are local `YYYY-MM-DD` strings and weeks start on Sunday.
  - `storage.js`: localStorage load and save, the default state, and migration.
  - `schedule.js`: week plans (`state.plans[weekStart]`), split days (`plan.split`), and building a day's session.
  - `volume.js`: sets per muscle, lift ordering, and trimming oversized sessions.
  - `progression.js`: double-progression rules, including rep and weight increases and the two-strike revert.
  - `workout.js`: state transitions for logging sets, Clear, Keep same, and accepting prompts.
- `src/screens/` has one component per tab: Today, Week, Progress, and Lifts.
- `src/components/` holds shared UI. Styling is inline, using the tokens in `src/theme.js`.
- `src/sw.js` is the service worker. The build stamps its cache version automatically, so there is nothing
  to bump by hand. The page is network-first with a 4 s timeout, falling back to the cached copy offline.
- `test/golden.json` holds outputs recorded from the original app for random week plans. It pins the
  scheduling and trimming behavior. If you change that behavior on purpose, regenerate the fixture and say
  so in the commit.

Put new logic in `src/lib/` with tests in `test/`, and keep screens thin.
