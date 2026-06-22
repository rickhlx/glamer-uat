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
| Cross (X-\*) | `pnpm test:cross` | 🟡 X-2, X-4 green; **X-1, X-3 blocked on web** |
| Web (C-\*) | `pnpm test:web` | 🔴 placeholder selectors — not yet wired |
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

### 1. Web client (`tests/web`) — biggest unblock
- [ ] Replace placeholder selectors with real **glamer-frontend** ones (prefer `getByRole` / `data-testid`).
- [ ] Confirm the web client's auth matches our cookie assumption.
- [ ] C-1 sign in, C-2 discover (runnable once selectors land).
- [ ] C-3 booking, C-4 payment decline, C-6 cancel (need the real booking/payment UI).
- [ ] Unblocks **X-1** and **X-3** (they drive the client booking step through the web UI).

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
