# IRON LOG 🏋️

A weightlifting tracker with multi-exercise sessions, rest timer, history, and trends.

---

## Deploy to Vercel (Recommended — free, ~5 min)

### Option A: Via GitHub (best for ongoing updates)

1. Create a free account at [github.com](https://github.com) if you don't have one
2. Create a new repository called `iron-log`
3. Upload all these files (keep the folder structure intact)
4. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
5. Click **"Add New Project"** → Import your `iron-log` repo
6. Leave all settings as default → Click **Deploy**
7. ✅ You'll get a live URL like `iron-log.vercel.app`

### Option B: Via Vercel CLI (fastest)

```bash
# Install Node.js from nodejs.org first, then:
npm install -g vercel
cd iron-log
npm install
vercel
```
Follow the prompts — it deploys in under a minute.

---

## Deploy to Netlify (drag & drop — no account needed)

```bash
# In the iron-log folder:
npm install
npm run build
```
Then drag the generated `build/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

✅ Instant live URL, no login required.

---

## Run Locally

```bash
npm install
npm start
```
Opens at `http://localhost:3000`

---

## Add to iPhone Home Screen (after deploying)

1. Open your deployed URL in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Tap **Add**

It'll behave like a native app — full screen, no browser chrome.

---

## Project Structure

```
iron-log/
├── public/
│   ├── index.html       ← App shell + mobile meta tags
│   └── manifest.json    ← PWA config for home screen install
├── src/
│   ├── index.js         ← React entry point
│   └── WorkoutTracker.jsx ← Main app (all logic + UI)
├── package.json         ← Dependencies
└── README.md            ← This file
```
