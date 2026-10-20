# Changes

## v0.4.1 — 2026-10-20

- New 512 px app icon supplied by the user (hard hat over a clock on a dark navy background).
- `icons/icon-192.png` (192 px) and `icons/apple-touch-icon.png` (180 px) regenerated from the new artwork with Lanczos resampling; the source is fully opaque, so no transparency flattening was needed.
- Version bump to 0.4.1 across `APP_VERSION`, `version.json`, manifest icon queries, `index.html` asset queries and the service worker cache, so installed devices fetch the new icon instead of the cached one.

## v0.4.0 — 2026-10-20

- Automatic day save: when the live countdown reaches the end of the shift the app writes the planned hours into today's entry, then refreshes History, the month totals and the Today form, with a toast confirmation.
- Auto-save only fires when the app actually witnessed the shift: either the countdown was running in the session or a `radni-sati:last-seen` heartbeat from today falls inside the shift window. Days off and days the app was never opened for stay untouched.
- Extended shifts save the extended hours: extending while finished reopens the countdown (8 h → 9 h keeps counting to 17:00) and the entry follows to 9 h at the new end.
- New **Spremi dan · X h** button on the Today card saves the full planned hours at once and ends the countdown, for users who do not want to wait.
- Closed days persist across reloads through a new `closed` date map; changing the plan with `−` / `+` clears the flag and recalculates.
- Manual entries are protected: auto-save never overwrites an entry that was typed or edited by the user (`auto` flag on day entries).
- Deleting a day clears its closed flag and suppresses the automatic re-save for that same plan.
- Storage schema stays at version 1: `closed` date→true map, `days[*].auto` boolean, both optional and backward compatible; export/import includes them.
- Version bump to 0.4.0 across manifest, asset queries and the service worker cache.

## v0.3.0 — 2026-10-20

- The Today live card clock became a countdown instead of the current time.
- Before work starts it counts down to `settings.workStart`; while working it counts down to start + planned hours for that date.
- Planned hours changed with the `−` / `+` stepper recalculate the target instantly, so the countdown, the accrued amount and the progress bar all adapt in real time (extending 8 h to 10 h adds two hours of countdown and earnings; shortening it cuts the countdown immediately).
- After the shift ends, or on a day off, the countdown points at the next day's start time.
- New strings `liveRemaining` and `liveNextStart` replace `liveRunning` / `liveFinished` in Croatian and English.
- Version bump to 0.3.0 across manifest, asset queries and the service worker cache; storage schema unchanged.

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
