# Iron Log — Future Ideas

Gamification ideas in the spirit of the existing streak/heatmap/PR-detection
features. Saved for later — not committed to building any of these.

## Top picks

### 1. Plate Club celebrations
First time you hit 135 / 225 / 315 / 405 lbs on a major lift (squat, bench,
deadlift, OHP), trigger a bigger-than-PR animation:

> 🥇 Two-Plate Club — Bench Press

These are real rite-of-passage milestones in lifting culture. Once per
lift-per-tier, can never be repeated → feels genuinely earned.

**Why this is the strongest pick:** lifting-native, cheap to implement
(static milestone table per major lift, check on save), and lifters
naturally share these moments.

### 2. Lifetime tonnage with milestone banners
Sum of `weight × reps` across every set ever logged. Banner triggers at
100k, 500k, 1M, 5M lbs. Reuses the existing milestone-banner UI pattern
from streaks — same component, new trigger source.

### 3. PR ladder per exercise
PR detection already runs on save, but the full progression isn't shown.
Add a "PR History" section per exercise:

> 185 (Jan) → 195 (Feb) → 205 (Apr)

Current PR feels more meaningful with the climb visible underneath it.

### 4. Anniversaries / "On this day"
Surface in the log view when there's a hit:

> One year ago today: Squat 185×5. Today's best: Squat 245×5. **+60 lbs.**

Brutally motivating in retrospect, and all the data is already there.

### 5. Year in Iron (Spotify Wrapped style)
Triggered Dec 28–31: total tonnage, top exercise, longest streak, biggest
PR, busiest month, total sets. One scrollable card per stat. Costs nothing
during the year and hits hard once.

## Smaller ideas in the same spirit

### 6. Flame overlay on heatmap streak days
A small flame icon on consecutive workout-day squares turns the heatmap
itself into a streak visualization, not just an attendance chart.

### 7. Comeback nudge instead of streak shame
When you log after >7 days off, show a soft "Welcome back. Last time you
hit X." beats a broken streak counter. Resets gently rather than punishing.

### 8. First-rep-of-the-day flair
Tiny animation/haptic on the first set logged each day. Micro-reward for
showing up — the hardest set is often the first one.

## Notes

- All of these layer on top of existing UI patterns (milestone banner, PR
  detection, heatmap) — no architectural changes needed.
- Recommendation if doing only one: **Plate Club**. Most lifting-native,
  smallest blast radius, can layer tonnage/anniversaries on later.
