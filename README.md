# OX GYM — Coach App

Trainee management app for gym coaches. Brutalist black/red design, Thai + English,
mobile-first. Rebuilt from the V4 feature set against the committed `DESIGN/` prototype.

## Stack

- **React 18 + Vite** — single-page app
- **Firebase Firestore** — data persistence (project `ox-gym-coach-aum`, fresh `ox5_*` collections)
- **HashRouter** — client-side routing, deploy-anywhere safe

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
```

## Features

Coach profiles · trainee roster · multi-set workout logging · workout history ·
body measurements · progress photo gallery · before/after export · monthly
calendar · daily appointment schedule.

## Data model (Firestore)

| Collection         | Purpose                                            |
|--------------------|----------------------------------------------------|
| `ox5_coaches`      | Coach profiles                                     |
| `ox5_trainees`     | Trainees, scoped to a coach                        |
| `ox5_workouts`     | Workout sessions — each holds an array of exercises, each exercise an array of sets |
| `ox5_checkins`     | Progress check-ins — photo + body measurements     |
| `ox5_appointments` | Calendar appointments, scoped to a coach           |
