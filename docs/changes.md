# Changes

## v0.10.1 — 2026-10-24

- The automatic save at the end of the countdown now also marks the day as closed in the same write, so the shift is finished without any confirmation step.
- The live-card save button switches to a disabled "Dan je spremljen" immediately when the automatic save fires, instead of still offering "Spremi dan · 8 h".
- The closed state persists across reloads; the Today form shows the saved hours and its button reads "Ažuriraj dan".
- Changing the planned hours, the per-day start time or the open-end switch still clears the closed flag and reopens the countdown.
- Countdown suite extended to 55 checks (auto-close flag, disabled button, reload persistence).
- Version bump to 0.10.1.

## v0.10.0 — 2026-10-21

- History: the inline "add a missed day" card is gone; a "+" button in the History header opens the existing day modal in add mode, with a date field (max today), hours, kilometres, other and note.
- Travel costs are kilometre-based: new settings `travelKm` (default daily distance) and `travelRate` (price per km). Each day stores `km` and the computed `travel` in euros (`km × rate`).
- The Today form and the day modal now ask for kilometres instead of a euro amount, and the calculation box shows `18 km × 0,50 €` next to the travel value.
- Kilometres are editable per day (e.g. 76 km for a site visit) and the travel cost recalculates instantly; the default stays untouched.
- Days created by the shift auto-save or the "Spremi dan" button receive the default kilometres and travel cost automatically.
- Legacy entries without `km` derive it from `travel ÷ rate` so their euro amount is preserved; entries keep their stored euro travel when the rate later changes.
- Validation for both fields, live daily total in Settings, and 40 new browser checks covering the + modal, travel maths per day, month totals, legacy data and 320px.
- Version bump to 0.10.0.

## v0.9.0 — 2026-10-21

- Per-day start time: new `starts` date→"HH:MM" map, edited directly on the Today card with a native time field; a reset button appears only when the day is overridden. The countdown, earnings and the save action all follow the override; the global start in Settings stays untouched.
- Open-ended day: new `openEnds` date→true map with a "Kraj nije poznat" toggle on the Today card. While active, the live card shows elapsed time counting up (`Odrađeno`), earnings grow without the plan cap, the progress bar and the planned-hours row hide, and the auto-save is skipped.
- "Spremi dan" in open mode stores the actually worked hours rounded to 0.25 h and closes the day, so the countdown jumps to the next working start.
- Open end also works on weekends, holidays and vacation days (useful for extra shifts), and the "before start" state still counts down to the start.
- Both maps are additive and backward compatible (schema stays 1); export/import includes them.
- Tests: 32 browser checks for the shift controls plus 15 new unit checks; version bump to 0.9.0.

## v0.8.0 — 2026-10-21

- History gained an "Dodaj propušteni dan" card: date (max today) plus hours, nothing else required. The entry is stored like a normal day, so the rate valid on that date, the daily allowance and the month totals are calculated automatically.
- Validation: required date, no future dates, hours required, numeric and a multiple of 0.25 (max 24). Errors are shown inline.
- Adding a date that already exists does not overwrite it — it opens the existing entry in the editor dialog.
- Every history row now has a trash button that deletes the day after a confirmation dialog; cancelling keeps the day.
- Deleting today's entry from history also clears its closed flag and suppresses the automatic re-save, same as the other delete paths.
- Shared `removeDayEntry` helper now backs the Today delete, the editor delete and the history delete.
- New tests: 23 browser checks for the history flow; version bump to 0.8.0.

## v0.7.0 — 2026-10-21

- Annual leave ranges: new `vacations` array of `{ id, from, to }` with a from/to date pair, an "Dodaj godišnji odmor" button and a removable list showing the range and its length.
- Every date inside a range counts as non-working: plan 0, no auto-save, and the countdown jumps to the first working day after the range (e.g. Friday + 26.–30.10. leave → Monday 2.11. 08:00).
- The live card distinguishes `Godišnji odmor` from `Praznik` and a plain day off.
- Validation: both dates required, start ≤ end, maximum 366 days; invalid input shows an inline error and stores nothing.
- Storage schema stays at 1: `vacations` is optional and old payloads get an empty array; export/import includes it.
- Working-day tests grew to 32 unit checks and the settings UI suite to 41 browser checks; version bump to 0.7.0.

## v0.6.0 — 2026-10-20

- Working days are configurable: `settings.workDays` holds weekday indexes (0 = Sunday) and the Settings card shows seven chips (Pon–Ned) that toggle individual days. Default stays Monday–Friday.
- Holidays: new `holidays` date→true map with a date field, "Dodaj" and a removable list of upcoming dates in Settings.
- The countdown now targets the next **working** start instead of tomorrow: Friday after work counts to Monday 08:00, weekends and holidays are skipped, and a run of holidays is skipped too.
- Non-working days have a plan of 0, so the live card shows `Danas ne radim` (or `Praznik` on a holiday), the amount stays 0, the save button hides and nothing is auto-saved.
- An explicit per-day plan still wins on a day off, and the first `+` on a day off starts from the configured planned hours instead of 15 minutes.
- Countdowns longer than 24 h render with days (`2 d 16:30:00`) and use a slightly smaller clock font.
- Storage stays at schema 1: `settings.workDays` and `holidays` are optional and backward compatible (old data gets Monday–Friday and no holidays); export/import includes both.
- Tests added for the working-day maths (20 unit checks) and the settings UI (27 browser checks); version bump to 0.6.0.

## v0.5.2 — 2026-10-20

- Removes the `radni-sati:theme-location` key left behind by 0.5.0 on every launch, so no coordinates stay stored on the device.
- Version bump to 0.5.2 across manifest, asset queries and the service worker cache.

## v0.5.1 — 2026-10-20

- Removed the sunrise/sunset panel, the location line and the "Odredi moju lokaciju" button from Settings — the auto theme is internal behaviour, not something the user should manage.
- Geolocation is gone entirely: no permission prompt, no coordinates stored, no `radni-sati:theme-location` key.
- Location is resolved silently and only from the device timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`, 30-city table, Zagreb fallback); the sunrise/sunset maths is unchanged.
- Removed the now unused `sun*` strings and the panel styles; version bump to 0.5.1.

## v0.5.0 — 2026-10-20

- Auto theme is now sun-based instead of following `prefers-color-scheme`: light from sunrise to sunset, dark otherwise.
- Sunrise and sunset are computed locally with the NOAA/SunCalc solar algorithm, so the feature works offline and without any network call.
- Location resolution: a timezone → city table (Croatian and neighbouring cities, 30 entries) provides a sensible default, and **Postavke → Izgled → Odredi moju lokaciju** stores exact GPS coordinates in `radni-sati:theme-location`.
- Settings shows today's sunrise/sunset and the location in use for the auto theme.
- The theme switches by itself at the sunrise/sunset boundary (a timer targets the next boundary, capped at 6 h) and re-applies on `visibilitychange` when returning to the app.
- Early-paint inline script now also handles the auto theme through a `radni-sati:theme-dark` hint, so a dark night does not flash light on launch.
- New strings in Croatian and English; version bump to 0.5.0 across manifest, asset queries and the service worker cache.

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
