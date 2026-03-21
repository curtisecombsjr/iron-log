# 🏋️ IRON LOG

A fast, mobile-first weightlifting tracker. Log workouts, track progress, and analyze trends — all from your phone.

---

## Features

### 📋 Workout Logging
- Build sessions with multiple exercises across any number of sets
- Log weight, reps, and an optional note per set
- Name your workouts (e.g. "Push Day", "Leg Day")
- Sets auto-populate weight/reps from your previous set for fast entry

### 💪 Exercise Library
- 9 muscle groups: Chest, Back, Shoulders, Biceps, Triceps, Legs, Glutes, Core, Full Body
- 5 preset exercises per muscle group (45 total)
- Add custom exercises that get saved and reappear in future sessions

### ⏱️ Rest Timer
- Circular countdown timer with audio beep alert when time is up
- Quick-select presets: 45s, 60s, 90s, 2min, 3min
- Manual custom duration input
- Resume/stop/reset controls

### 📅 Session History
- Full log of every saved workout with date, exercises, sets, weights, and reps
- Delete individual sessions
- Clear all history

### 📈 Trends
- **Strength chart** — tracks your best set weight per session for any exercise over time, with PR, last session, and total change stats
- **Volume chart** — cumulative weight × reps by muscle group across all sessions, color-coded per group

### 🎨 5 Color Themes
Each theme has its own color palette and unique font pairing:

| Theme | Accent | Display Font | Body Font |
|-------|--------|-------------|-----------|
| **Void** | Purple | Orbitron | Share Tech Mono |
| **Ember** | Orange | Bebas Neue | DM Mono |
| **Arctic** | Teal | Exo 2 | Fira Code |
| **Steel** | Blue | Rajdhani | JetBrains Mono |
| **Rose** | Pink | Playfair Display | Courier Prime |

### 📱 Mobile-Ready
- Optimized for phone use — full-screen layout, touch-friendly inputs
- Add to iPhone home screen via Safari → Share → "Add to Home Screen" for a native app feel
- All data stored locally in the browser (no account needed, no server)

---

## Tech Stack

- [React 18](https://react.dev/) — UI
- [Vite](https://vitejs.dev/) — build tool
- [Vercel](https://vercel.com/) — hosting
- localStorage — data persistence
- Web Audio API — rest timer beep
- SVG — custom charts (no charting library)

---

## Run Locally

```bash
git clone https://github.com/curtisecombsjr/iron-log
cd iron-log
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Build for Production

```bash
npm run build
```
