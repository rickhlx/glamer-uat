# Glamer UAT — Status & Remaining Work

The canonical status doc. See also [principles.md](./principles.md),
[critical-journeys.md](./critical-journeys.md), [runbook.md](./runbook.md),
[findings.md](./findings.md).

_Last updated: 2026-06-22._

---

## How we got here (recap)

1. **Principles & journeys** — agreed how we test ([principles.md](./principles.md)) and the
   critical user journeys A-\* (API), C-\* (web), S-\* (iOS), X-\* (cross) ([critical-journeys.md](./critical-journeys.md)).
2. **Toolchain & scaffold** — TypeScript + Playwright as one runner for API + web; `openapi-typescript`
   typed client; a `toMatchSpec` matcher (`openapi-response-validator`) for runtime contract checks;
   GitHub Actions workflow; severity-tagged tests (`@critical`/`@important`).
3. **Real spec adopted** — replaced the placeholder with the real Glamer Backend API v1.0 and
   rewired everything to it (`/appointments` lifecycle, `/me/stylist/*`, etc.).
4. **Auth solved** — Firebase ID token → `POST /session` → `glamer-session` cookie. Found and fixed
   that the session value comes back in the **response body**, not a `Set-Cookie` header.
5. **Went live against UAT** — filled `.env`, `pnpm smoke` green for both roles.
6. **Onboarded the test stylist** via API (profile, service, availability, work location) and pinned
   down the real booking contract (`locationType: at_stylist` + catalog `location.id`).
7. **Robust booking** — `bookIntoFreeSlot` (resilient to parallel slot contention) + per-test cleanup.
8. **Surfaced 10 findings**, filed as glamer-backend issues; 3 fixed & verified.

## Current test status

| Suite | Command | Status |
| --- | --- | --- |
| Smoke (auth) | `pnpm smoke` | ✅ green |
| API contract (A-\*) | `pnpm test:api` | ✅ **15 passed** |
| Cross (X-\*) | `pnpm test:cross` | 🟡 X-2, X-3, X-4 green; **X-1 web step blocked (glamer-uat#1)** |
| Web (C-\*) | `pnpm test:web` | 🟡 C-1, C-2 green; C-4 n/a; **C-3/C-6 booking blocked (glamer-uat#1)** |
| iOS (S-\*) | manual | ⬜ not yet run |

Known-failing findings (F4, F8, F9, F10) are guarded with `test.fail` — they don't block the
gate and auto-alert when the backend fixes them.

## Findings

✅ Fixed & verified (closed): **F1** (#364), **F2** (#365), **F7** (#369).
F3 was a test-data mistake (client account), not a backend bug — resolved.

🔴 Open (tracked, not blocking the gate):

| ID | Issue | Sev | Summary |
| --- | --- | --- | --- |
| F4 | [#366](https://github.com/rickhlx/glamer-backend/issues/366) | P2 | Stylist-only endpoints `500` for non-stylists (should be `403`) |
| F5 | [#367](https://github.com/rickhlx/glamer-backend/issues/367) | P3 | `POST /appointments` `500` on missing/invalid location (should be `400`) |
| F6 | [#368](https://github.com/rickhlx/glamer-backend/issues/368) | P3 | `POST /me/register` `500` on duplicate email (should be `409`) |
| F8 | [#386](https://github.com/rickhlx/glamer-backend/issues/386) | P3 | Double-booking `500` (should be `409`) |
| F9 | [#387](https://github.com/rickhlx/glamer-backend/issues/387) | P3 | `services[].includedAddons` is `null` (should be `[]`) |
| F10 | [#388](https://github.com/rickhlx/glamer-backend/issues/388) | P2 | Canceled/declined appointments don't release the slot (availability leak) |

When a fix lands: re-run → the `test.fail` guard flips → remove the marker → close the issue.

---

## Remaining work

### 1. Web client (`tests/web`) — real selectors wired; blocked on Vercel wall
Selectors are now **real**, read from the live `glamer-frontend` (Next.js App Router)
source, not placeholders. Routes: sign-in `/signin`, discovery `/search/stylists`,
profile `/{username}`, booking modal `/{username}?booking=true` (multi-step:
Services → Date&Time → Summary), appointments `/appointments`. Web auth is Firebase
email/password; the frontend sets the `glamer-session` cookie itself.

- [x] Replace placeholder selectors with real ones (`support/web.ts` helpers + all C-\* specs).
- [x] Confirm web auth: sign-in form `input[name=email|password]`, server action sets `glamer-session`.
- [x] **Vercel deployment protection solved.** Bypass *cookie* minted in `globalSetup` →
  storageState, loaded only by web/cross (`playwright.config.ts`); secret in
  `VERCEL_AUTOMATION_BYPASS_SECRET`. (A header would leak to Sentry/Maps and break their CORS.)
- [x] **C-1 sign in** (valid ✅; invalid guarded → **F11** crash, glamer-uat#2) and
  **C-2 discover** (search + profile ✅) — green against live staging.
- [x] **C-4 payment decline — NOT APPLICABLE on web** (request-to-book, "pay at location";
  no web payment UI). Documented + skipped; payment coverage lives in API A-6.
- **[ ] C-3 booking + C-6 cancel + X-1 web step — blocked, tracked in glamer-uat#1.**
  Selectors are real; the booking-modal helper races the modal's server-action step
  transitions, and the shared server-side cart makes it flaky. C-6's card menu trigger is
  unlabeled. Needs transition-aware waits + a clean-cart/appointments reset (ties to F10).
- X-3 is already fully API-driven and green.

### 2. CI (Step 6)
- [ ] Add GitHub Actions **secrets**: `API_BASE_URL`, `WEB_BASE_URL`, `FIREBASE_API_KEY`,
  `TEST_CLIENT_EMAIL/PASSWORD`, `TEST_STYLIST_EMAIL/PASSWORD`, `TEST_STYLIST_USERNAME`, seed vars.
- [ ] Fix `.github/workflows/uat.yml` env block (predates Firebase): add `FIREBASE_API_KEY` +
  `TEST_STYLIST_USERNAME`, drop obsolete `TEST_CARD_DECLINE`.
- [ ] Decide CI gate scope (`pnpm test:critical`) and push-vs-nightly for web/cross.

### 3. Seed / reset (Step 4) — now more urgent
- [ ] Decide the UAT reset mechanism and wire `fixtures/seed.ts`.
- [ ] **Because of F10, cancellation doesn't free slots**, so each booking-test run permanently
  consumes ~2 of the stylist's slots. Without a reset (or fixing F10, or periodically refreshing
  the availability window) the stylist will eventually run out of bookable slots.

### 4. iOS (manual — `ios-checklists/`)
- [ ] Run a manual pass on a UAT build of the stylist app; record results.
- [ ] (Later) Maestro automation under `mobile/`.

### 5. Housekeeping
- [ ] Prune `test.fail` markers + this list as F4/F5/F6/F8/F9/F10 close.
- [ ] Wire in or remove `fixtures/personas.ts` (currently unused).

---

## Release gate (reminder)

Ship-ready = **`pnpm test:critical` green** + **zero open P1/P2 bugs**. Today the gate command
passes (known-failing findings are guarded); the open P2s (F4, F10) are tracked backend bugs to
resolve before a real go-live sign-off.
