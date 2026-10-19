# Changes

## v0.1.0 — 2026-10-19

- Initial release: today entry form, live earnings calculation, history by month, monthly salary totals and settings.
- Date-aware hourly rate history, daily allowance, travel and other costs.
- Croatian and English interface, Auto / Light / Dark themes.
- JSON export and validated import, clear-all flow, corrupt-store fallback.
- Installable offline PWA with versioned service worker cache, inline SVG icons and iOS home-screen metadata.
- Mobile layout with safe-area support, fixed bottom navigation, 44px tap targets and tabular money figures.

## v0.1.1 — 2026-10-19

- New app icon: user-supplied 512px artwork; regenerated 192px and 180px apple-touch-icon from it.
- Version bump to refresh PWA cache and installed icon.

## v0.2.0 — 2026-10-19

- In-app update flow: Settings shows the current version and checks `./version.json`; an available version can be applied in one tap.
- Launch-time automatic check with a dismissible top banner, remembered per version in `localStorage`.
- One-click update unregisters every service worker, deletes all caches and reloads with a cache-busting query.
- `version.json` is network-only in the service worker and is no longer precached; `registration.update()` runs opportunistically on boot.
- Live earnings card on Today: timestamp-based accrual from the configured start time at today's rate, capped at the planned hours, with an HH:MM:SS clock and progress bar.
- Per-day planned-hours override on the live card (`−` / `+`, step 0.25, 0–24), stored per date; other dates fall back to the Settings default.
- Settings gained "Radno vrijeme" (start time, planned hours) and "Ažuriranje" sections.
- Storage schema stays at version 1: `settings.workStart`, `settings.plannedHours` and a `plans` date→hours map were added; existing v0.1.1 data loads unchanged and export/import includes the new fields.
- Croatian and English strings, dark-mode and 320px layout coverage, version bump to 0.2.0 across manifest, asset queries and the service worker cache.
