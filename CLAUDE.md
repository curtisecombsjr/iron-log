# iron-log

**Vault note:** `~/Projects/vault/projects/android/iron-log/index.md`
**Changelog:** `~/Projects/vault/projects/android/iron-log/changelog.md`

## Execution context

- **Source of truth:** this machine (`~/Projects/android/iron-log/`)
- **Run commands:** locally

(Edit if the project lives elsewhere — e.g. SSH to another host.)

## Git flow

- **`develop`** = integration (day-to-day work); **`main`** = releases only.
- Bump versions on `develop` (`package.json` + `android/app/build.gradle` versionName/versionCode) and update `CHANGELOG.md`, then `git merge --no-ff develop` into `main` and push.
- Tag `vX.Y.Z` on `main` and push the tag — CI (`.github/workflows/build.yml`) builds the APK on every push and, on `v*` tags, publishes a **GitHub Release** with `iron-log.apk`.
- Commit/push after meaningful changes (the workspace Stop hook is the safety net; its WIP snapshots carry `[skip ci]`).

## After any source change, always build the APK

This project ships as a sideloaded APK (not on Play Store) — Curtis copies the APK to his phone manually. So **whenever you edit anything under `src/` (or anything that ends up in the bundle), build the APK automatically — don't stop at `npm run build`.**

Full build flow:

```bash
cd ~/Projects/android/iron-log
npm run build                                                          # vite → dist/
npx cap sync android                                                   # dist/ → android/app/src/main/assets/public
cd android && JAVA_HOME=/usr/lib/jvm/zulu-21 ./gradlew assembleDebug   # → app-debug.apk
cd app/build/outputs/apk/debug && cp app-debug.apk iron-log.apk        # MANDATORY rename — Curtis uploads iron-log.apk
```

**Output APK Curtis installs:** `android/app/build/outputs/apk/debug/iron-log.apk`

**Gotcha — the rename is NOT optional.** Gradle only ever writes `app-debug.apk`. Curtis's sideload workflow uploads **`iron-log.apk`**, a copy in the *same dir*. If you skip the `cp`, `iron-log.apk` stays stale and Curtis installs an OLD build — the change "doesn't show up" even though the source/build are correct. Always `cp app-debug.apk iron-log.apk` as the final build step and verify the timestamp updated. (Burned us 2026-06-17: the template-delete confirm was in `app-debug.apk` but `iron-log.apk` was a month-old build.)

**Gotcha — JDK version:** Capacitor needs JDK 21. System default is JDK 17 (`/usr/bin/java`). You MUST pass `JAVA_HOME=/usr/lib/jvm/zulu-21` to gradle or it fails with `invalid source release: 21`.

Tell Curtis the final APK path (`…/debug/iron-log.apk`) when done so he can `adb push` or just transfer it.

## Before ending a session

If you modified anything in this project, append a one-line entry to the changelog:
`YYYY-MM-DD — what changed and why.`

## Workspace rules

See `~/Projects/CLAUDE.md` for workspace-wide conventions (no committed passwords, kebab-case names, vault is canonical memory, etc.).
