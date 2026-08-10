# Changelog

All notable changes to Iron Log are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-08-09

### Changed
- **Streaks are now strict.** A streak requires consecutive calendar days; a day
  counts if you trained *or* logged a rest day. Previously a gap of up to two days
  continued the streak, so a missed day cost nothing and training every other day
  held a "streak" indefinitely. Curtis: *"strict. keep me honest."*
- Streak staleness is measured in calendar days rather than a 36-hour window — the
  streak is alive if the most recent logged day is today or yesterday. The old
  hour-based test made the answer depend on what time of day you lifted.

### Fixed
- `calcStreak` crashed when rest days were logged but no workout sessions existed
  (it read `sessionList[0].date` unguarded). It now reads the combined day list.
- The streak comment claimed a "36hr grace period" while the code tolerated two
  days; code and comment now agree.

## [1.2.0] - 2026-08-09

### Changed
- **Rest timer no longer double-rings.** Returning to the app after the timer
  expired in the background used to sound a second bell: the scheduled Android
  notification had already played `bell.wav`, then the foreground catch-up
  handler played its own `beep()` on top. The catch-up bell is now web-only,
  where no notification exists to ring.

### Verified
- **Background rest-timer reliability confirmed** over a week of real workouts.
  The Doze-proof `allowWhileIdle` alarms, draft persistence, and unsaved-workout
  reminder shipped in 1.1.0 all behave as intended on device. This is what the
  double-ring fix above was waiting on — the foreground beep had been kept
  deliberately as a fallback until the background path proved itself.

## [1.1.0] - 2026-08-07

### Added
- Trends dashboard: overview tiles, consistency chart, muscle-balance breakdown,
  last-trained view, and a personal-records board.
- Auto-named workouts derived from the muscle groups trained (removed the
  manual workout-type dropdown).
- Two-tap Clear button in the title row to discard the current workout.
- `IDEAS.md` — a backlog capturing unbuilt gamification ideas and open threads.

### Changed
- Set-delete now uses an inline two-tap "Delete?" pill instead of the native
  confirm dialog.
- Volume trend uses adaptive weekly/monthly binning to smooth long-range charts;
  default range is 1 year, single muscle group.
- Template deletion now prompts for confirmation.

### Fixed
- Background reliability: in-progress workouts persist, an unsaved-workout
  reminder fires, and rest-timer alarms survive Android Doze.

## Prior history

Earlier milestones are captured in the following git tags:

- `v1.0-pre-capacitor` — the last pre-Capacitor build before the Android
  wrapper was added.
- `v0.9` — earlier PWA-era snapshot.
