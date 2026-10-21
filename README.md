# Radni sati

A small offline-first PWA for recording work hours and seeing daily earnings and the monthly salary. Built with vanilla HTML, CSS and JavaScript. All data stays in the browser on the device.

## Run locally

The service worker needs `localhost` or HTTPS:

```powershell
cd C:\Users\Korisnik\Documents\CodeProjects\RadniSati
python -m http.server 8000
```

Open `http://localhost:8000`.

## What's new in 0.9.0

- **Početak samo za danas**: na kartici Danas je polje **Početak** — postavi 09:00 i cijeli dan se računa od 09:00 (odbrojavanje, zarada, "Spremi dan"). Vrijedi samo za taj datum, a reset gumb vraća zadano vrijeme iz Postavki.
- **Kraj nije poznat**: prekidač za dane kad ne znaš kad ćeš završiti. Sat tada broji **od početka prema gore** (`Odrađeno`), zarada raste bez ograničenja, a **Spremi dan** upiše stvarno odrađene sate (zaokruženo na 0,25 h).
- Dok je "Kraj nije poznat" uključen, nema automatskog spremanja na kraju smjene — dan završavaš sam kad stvarno završiš.

## What's new in 0.8.0

- **Povijest → Dodaj propušteni dan**: upišeš samo datum i koliko si sati radio; satnica za taj datum, dnevna naknada i ukupni iznos izračunaju se kao za svaki drugi dan, a dan ulazi u Povijest i Mjesec.
- Svaki red u Povijesti sada ima **ikonu kante** za brisanje — briše se uz potvrdu, a "Odustani" zadrži dan.
- Datum u budućnosti, prazna ili neispravna količina sati se odbijaju uz poruku ispod polja.
- Ako dan već postoji, app ga ne prepiše nego otvori postojeći unos za uređivanje.

## What's new in 0.7.0

- **Godišnji odmor** u Postavkama → Radni dani: upišeš datum **od** i **do** i cijeli raspon se preskače — pet dana, dva tjedna, kako god.
- Dodani rasponi se vide na listi s trajanjem (npr. `26.10.2026 – 30.10.2026 · 5 d`) i mogu se ukloniti jednim dodirom.
- Na dan godišnjeg kartica pokazuje `Godišnji odmor`, ništa se ne sprema i odbrojavanje ide na prvi radni dan nakon povratka.
- Primjer: petak poslije posla + godišnji od 26.–30.10. → odbrojavanje ide ravno na **ponedjeljak 2.11. u 08:00**.

## What's new in 0.6.0

- **Radni dani** u Postavkama: sedam kockica (Pon–Ned) kojima odabereš koje dane radiš. Zadano je ponedjeljak–petak, a možeš uključiti i subotu ili bilo koju kombinaciju.
- **Praznici i slobodni dani**: dodaj konkretan datum i taj dan se ne računa kao radni.
- Odbrojavanje sada preskače neradne dane: u petak poslije posla pokazuje koliko je do **ponedjeljka u 08:00**, a ne do sutra.
- Kad je odbrojavanje duže od 24 sata prikazuje se s danima, npr. `2 d 16:30:00`.
- Na neradni dan kartica pokazuje `Danas ne radim` (ili `Praznik`), a prvi `+` odmah postavlja planirane sate umjesto 15 minuta, ako ipak radiš.

## What's new in 0.5.2

- A leftover location saved by 0.5.0 is deleted on launch; nothing about the location is kept on the device.

## What's new in 0.5.1

- Postavke su opet čiste: nema prikaza izlaska/zalaska sunca, nema lokacije i nema gumba za lokaciju — automatska tema je interna stvar aplikacije.
- Lokacija se tiho određuje iz vremenske zone uređaja; GPS se više ne traži i ništa se o lokaciji ne pohranjuje.

## What's new in 0.5.0

- **Automatska tema sada prati sunce**, ne sistem: svijetla tema vrijedi od izlaska do zalaska sunca, tamna od zalaska do sljedećeg izlaska.
- Izlazak i zalazak se računaju lokalno (NOAA/SunCalc algoritam), bez interneta i bez API-ja, pa radi i offline.
- Tema se sama prebaci u trenutku zalaska/izlaska dok je app otvorena, i odmah pri povratku u app.

## What's new in 0.4.1

- New app icon (512 px artwork: hard hat and clock). The 192 px icon and the 180 px Apple touch icon were regenerated from it at full quality.
- Version bump so the installed PWA, the manifest and the service worker pick up the new artwork instead of the cached one.

## What's new in 0.4.0

- The day now saves itself: when the countdown reaches zero the planned hours are written into Today's entry, History and the month total, with a confirmation toast.
- **Spremi dan** button on the Today card saves the full planned hours immediately and ends the countdown, for when you do not want to wait until the shift runs out.
- Both flows stay dynamic: pressing `+` after the day was saved reopens the countdown (8 h → 9 h keeps counting to 17:00) and the new end saves the new hours; pressing `−` recalculates and saves the reduced hours.
- A day is only auto-saved when the app was actually open during the shift (live session or a heartbeat left in `localStorage`), so days off and days you never opened the app for are not credited.
- Manually typed entries are never overwritten by the automatic save, and deleting a day does not trigger it again for the same plan.

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

`radni-sati:last-seen` is a separate heartbeat timestamp written while the shift is running. It is not user data and is not exported; it only tells the app whether it was open during today's shift so the automatic day save can be trusted.

Day entries saved by the countdown are marked `auto: true` internally and stay editable like any other entry. As soon as you save the day manually, the entry becomes yours and the automatic save never overwrites it.
