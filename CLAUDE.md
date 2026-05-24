# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev      # dev server — http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the built dist/
```

There is no test suite and no linter configured.

**Critical — do not "simplify" the npm scripts.** The absolute path to this
project contains a colon (`.../Work:Project/...`). A colon corrupts the `PATH`
that npm prepends `node_modules/.bin` to, so a bare `vite` (or `npx vite`)
fails with "command not found". The scripts therefore invoke Vite explicitly
via `node node_modules/vite/bin/vite.js`. Keep that form for any new
tool-invoking script.

## Architecture

Mobile-first single-page app: a phone-width frame (`.ox-app`, max-width 440px,
`100dvh`) centered on any screen. React 18 + Vite, Firebase Firestore, no
backend of its own.

### Routing
`HashRouter` (chosen so the build can be hosted anywhere). All routes are
declared in `src/App.jsx`. Trainee-scoped screens live under `/client/:id/...`;
the coach roster, calendar and appointments are top-level. `WorkoutLog` serves
both `/workout/new` and `/workout/:workoutId` — create vs. edit.

### Data layer — `src/lib/api.js`
Every Firestore read/write goes through this module; screens never import
`firebase/firestore` directly. Two conventions matter:

- **Single-`where` queries, client-side sort.** List queries filter on one
  field and sort in JS (`byCreated`, `byDateDesc`, ...). This is deliberate —
  it keeps the app free of Firestore composite indexes. Do not add multi-field
  `where`/`orderBy`.
- **Denormalized trainee stats.** Trainee docs carry `sessionCount` and
  `lastWorkoutDate`. After any workout create/update/delete, call
  `api.syncTraineeStats(traineeId)` to recompute them.

Collection names are centralized in `src/firebase.js` as `COL`, all prefixed
`ox5_`. This app shares the `ox-gym-coach-aum` Firebase project with the legacy
app but uses its own isolated collections. The web config keys in `firebase.js`
are public by design; data is protected by Firestore security rules (managed in
the Firebase console, not this repo).

### Data fetching pattern
Screens load data with the `useLoad(fn, deps)` hook (`src/lib/useLoad.js`) →
`{ data, loading, error, reload, setData }`. Standard screen shape: bail early
with `<Loader/>` / `<ErrorState/>`, then render `data`. After a mutation, call
`reload()`.

### Key data shapes
- **Workout** (`ox5_workouts`): `{ traineeId, date, note, exercises: [...] }`
  where each exercise is `{ name, type: 'weight'|'cardio', sets: [{reps,weight}],
  duration }`. The two-level `exercises[] → sets[]` nesting is the core model —
  a workout has many exercises, a weight exercise has many sets.
- **Check-in** (`ox5_checkins`): one record holds both a progress photo and body
  measurements — `{ traineeId, date, photo, measurements: {arm,chest,waist,hips,leg} }`.
  Photo and measurements are always captured together.
- Dates are stored as ISO `YYYY-MM-DD` strings throughout.

### Global state
`AppContext` (`useApp()` → `{ coachId, setCoachId }`) holds the selected coach,
persisted to `localStorage['ox5_coachId']`. Screens that require a coach
redirect with `<Navigate to="/" replace />` when `coachId` is null.

### Dialogs
Use `useDialog()` → promise-based `dialog.alert()` / `dialog.confirm()` instead
of `window.alert`/`confirm`. `DialogProvider` wraps the app in `App.jsx`.

### Styling
No CSS framework. `src/styles/tokens.css` defines design tokens as CSS custom
properties (`--ox-bg`, `--ox-red`, `--f-thai`, ...) plus utility classes
(`.ox-screen`, `.ox-body`, `.ox-card`, `.ox-field`, `.ox-cap`, `.ox-thai`,
`.ox-mono`, `.ox-display`, `.ox-tap`, `.ox-trunc`). Layout is done with inline
`style` objects in components; pull colors and fonts from the token variables
rather than hardcoding.

**Thai text + truncation.** For single-line truncated text use the `.ox-trunc`
class — never raw `overflow:hidden` with a tight `line-height`. Thai stacks
vowels and tone marks above the consonant (e.g. `อั้ม`); a cramped line box plus
the `overflow:hidden` that `text-overflow:ellipsis` requires will silently clip
the upper marks.

### Localization & media
UI is Thai-primary with English captions. `src/lib/thai.js` provides
Buddhist-calendar conversion (BE year = CE + 543), Thai month/day names, and ISO
date helpers. Images are stored as base64 JPEG strings inside Firestore docs
(`compressImage` in `src/lib/image.js`, ~900px / 72% quality); the before/after
export composites them on a `<canvas>` in `src/lib/export.js`.

### `src/` layout
`screens/` — one component per route (numbered 01–10 in header comments).
`components/` — reusable UI kit. `lib/` — framework-free logic (api, dates,
images, hooks). `store/` — React context.
