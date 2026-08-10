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

## Practical ideas — proposed 2026-08-02 (not built)

Day-to-day utility ideas (distinct from the gamification list above), ranked by
value to how Curtis trains (6 days/week, progression-focused, data local-only).

1. **Pre-fill sets from last time (top pick).** When adding an exercise,
   auto-populate the set rows with last session's weights/reps so it's tap-to-
   confirm/bump instead of empty rows. Extends the existing per-row "last:" ghosts
   and the "Last max" strip; removes the pre-add-placeholder friction entirely.
2. **Automatic backups (top pick).** History lives only in this app's
   localStorage; backup is currently a manual button. Add a silent periodic export
   (dated `.ilbak` to Downloads every N days) and/or a "last backed up N days ago"
   nudge. Insurance against cleared cache / failed update / dead phone.
3. **"What to train next."** One suggestion line on the log screen built on the
   Last Trained data ("Legs — 6 days off. Train today?").
4. **This week vs last week.** Small delta tile: volume and workout count vs prior
   week (`+12% volume`, `4 vs 5 workouts`).
5. **Plate calculator.** Target weight (+ bar) → per-side plate breakdown.
6. **e1RM toggle on the Strength chart.** That chart plots raw top weight; toggle
   to plot estimated 1RM (already computed for the Records board) for a truer
   progression line on lighter-higher-rep days.

## Open threads from the 2026-08-02 session

- ~~**Background reliability verdict pending.**~~ **RESOLVED 2026-08-09** — a week
  of real workouts confirmed it. Curtis: "background bell works very well now."
  Draft persistence, unsaved-workout reminder and the Doze-proof `allowWhileIdle`
  alarms all behave on device.
- ~~**Possible rest-timer double-bing.**~~ **FIXED in 1.2.0** — the background path
  proved reliable, so the foreground catch-up `beep()` is now web-only. Native
  relies on the notification's `bell.wav` alone.
- **Backdate the lost workout from ~2026-07-28** (forgotten save, shows as a heatmap
  gap) so the streak is honest. Offered, not yet done.
