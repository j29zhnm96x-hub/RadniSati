# Radni sati

A small offline-first PWA for recording work hours and seeing daily earnings and the monthly salary. Built with vanilla HTML, CSS and JavaScript. All data stays in the browser on the device.

## Run locally

The service worker needs `localhost` or HTTPS:

```powershell
cd C:\Users\Korisnik\Documents\CodeProjects\RadniSati
python -m http.server 8000
```

Open `http://localhost:8000`.

## What's new in 0.3.0

- The clock on the Today card is now a live countdown instead of the wall-clock time.
- Before the shift it counts down to the configured start time; once work starts it counts down to the end of the shift.
- Planned hours can be changed at any moment with the `−` / `+` stepper and the countdown, the earnings and the progress bar all adapt immediately, in real time.
- When the shift is over the countdown switches to the next workday's start time.
- State labels now describe what the countdown is measuring (`Preostalo do kraja`, `Do sljedećeg početka`).

## What's new in 0.2.0

- Live earnings clock on Today, based on the configured start time and planned hours, with a per-day override.
- Settings → **Radno vrijeme** stores the start time and default planned hours.
- In-app update checks with a one-click refresh of the installed PWA.
- Existing v0.1.1 data loads unchanged; the new fields are included in export/import.

## Updates

The app compares its built-in version (`APP_VERSION` in `js/app.js`) with `version.json` on launch and from **Settings → Ažuriranje**. If a newer version exists, the banner and Settings offer a one-click update that unregisters service workers, clears caches and reloads with a cache-busting query.

When releasing, bump the version consistently in `APP_VERSION`, `version.json`, `manifest.webmanifest`, the asset queries in `index.html` and the cache name/precache list in `sw.js`. `version.json` is intentionally network-only and is never precached.

## Install on iPhone

Open the deployed HTTPS URL in Safari, tap Share, then **Add to Home Screen**.

## Deploy

Upload the whole folder to any static HTTPS host. There is no build step, no package manager and no external runtime dependency. Keep the folder structure intact so `manifest.webmanifest`, `sw.js` and `icons/` resolve correctly.

## Data

The app uses one versioned `localStorage` key: `radni-sati:v1`. Settings includes JSON export and import for backups. Clearing site data removes local records.
