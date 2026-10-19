# Radni sati

A small offline-first PWA for recording work hours and seeing daily earnings and the monthly salary. Built with vanilla HTML, CSS and JavaScript. All data stays in the browser on the device.

## Run locally

The service worker needs `localhost` or HTTPS:

```powershell
cd C:\Users\Korisnik\Documents\CodeProjects\RadniSati
python -m http.server 8000
```

Open `http://localhost:8000`.

## Install on iPhone

Open the deployed HTTPS URL in Safari, tap Share, then **Add to Home Screen**.

## Deploy

Upload the whole folder to any static HTTPS host. There is no build step, no package manager and no external runtime dependency. Keep the folder structure intact so `manifest.webmanifest`, `sw.js` and `icons/` resolve correctly.

## Data

The app uses one versioned `localStorage` key: `radni-sati:v1`. Settings includes JSON export and import for backups. Clearing site data removes local records.
