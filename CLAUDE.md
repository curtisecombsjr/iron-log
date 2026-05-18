# iron-log

**Vault note:** `~/Projects/vault/projects/android/iron-log/index.md`
**Changelog:** `~/Projects/vault/projects/android/iron-log/changelog.md`

## Execution context

- **Source of truth:** this machine (`~/Projects/android/iron-log/`)
- **Run commands:** locally

(Edit if the project lives elsewhere — e.g. SSH to another host.)

## After any source change, always build the APK

This project ships as a sideloaded APK (not on Play Store) — Curtis copies the APK to his phone manually. So **whenever you edit anything under `src/` (or anything that ends up in the bundle), build the APK automatically — don't stop at `npm run build`.**

Full build flow:

```bash
cd ~/Projects/android/iron-log
npm run build                                                          # vite → dist/
npx cap sync android                                                   # dist/ → android/app/src/main/assets/public
cd android && JAVA_HOME=/usr/lib/jvm/zulu-21 ./gradlew assembleDebug   # → app-debug.apk
```

**Output APK:** `android/app/build/outputs/apk/debug/app-debug.apk`

**Gotcha — JDK version:** Capacitor needs JDK 21. System default is JDK 17 (`/usr/bin/java`). You MUST pass `JAVA_HOME=/usr/lib/jvm/zulu-21` to gradle or it fails with `invalid source release: 21`.

Tell Curtis the final APK path when done so he can `adb push` or just transfer it.

## Before ending a session

If you modified anything in this project, append a one-line entry to the changelog:
`YYYY-MM-DD — what changed and why.`

## Workspace rules

See `~/Projects/CLAUDE.md` for workspace-wide conventions (no committed passwords, kebab-case names, vault is canonical memory, etc.).
