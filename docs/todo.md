# Glamer UAT — Remaining Work

Status snapshot and outstanding tasks. See [principles.md](./principles.md),
[critical-journeys.md](./critical-journeys.md), [runbook.md](./runbook.md),
[findings.md](./findings.md).

_Last updated: 2026-06-22._

## ✅ Done

- Scaffold, toolchain, CI workflow, docs.
- Wired to the real OpenAPI spec; Firebase → `/session` cookie auth working.
- `pnpm smoke` green (both roles authenticate).
- **API suite green — `pnpm test:api`: 15 passed.** Booking uses real
  service/slot/location discovery with per-test cleanup.
- Test stylist (`ricardo_stylist`) onboarded via API (profile, service,
  availability, work location).
- 6 backend findings filed; F1/F2/F7 fixed & verified.

## 🔴 Open backend findings (tracked, not blocking the gate)

Each has a `test.fail` guard that flips to a real failure when fixed.

| ID | Issue | Summary |
| --- | --- | --- |
| F4 | [#366](https://github.com/rickhlx/glamer-backend/issues/366) | Stylist-only endpoints `500` for non-stylists (should be `403`) |
| F5 | [#367](https://github.com/rickhlx/glamer-backend/issues/367) | `POST /appointments` `500` on missing/invalid location (should be `400`) |
| F6 | [#368](https://github.com/rickhlx/glamer-backend/issues/368) | `POST /me/register` `500` on duplicate email (should be `409`) |
| F8 | [#386](https://github.com/rickhlx/glamer-backend/issues/386) | Double-booking `500` (should be `409`) |
| F9 | [#387](https://github.com/rickhlx/glamer-backend/issues/387) | `services[].includedAddons` is `null` (should be `[]`) |

→ When a fix lands, re-run; the guard alerts; then remove the `test.fail` marker and close the issue.

## ⏳ Test suites remaining

### Cross-surface (`tests/cross`)
- [ ] **X-2 decline** (pure API) — refactor onto `bookIntoFreeSlot` + cleanup; should go green.
- [ ] **X-4 availability sync** (pure API) — verify green against live UAT.
- [ ] **X-1 book→confirm** — uses the web UI for the client booking step → blocked on web selectors.
- [ ] **X-3 client cancel** — uses the web UI → blocked on web selectors.

### Web client (`tests/web`)
- [ ] Replace placeholder selectors with real **glamer-frontend** ones
  (prefer `getByRole` / `data-testid`).
- [ ] C-1 sign in, C-2 discover — runnable once selectors land.
- [ ] C-3 booking, C-4 payment decline, C-6 cancel — need the real booking/payment UI.
- [ ] Confirm the web client's auth (does it set the `glamer-session` cookie the same way?).

### iOS (manual — `ios-checklists/`)
- [ ] Run a manual pass on a UAT build of the stylist app; record results.
- [ ] (Later) Maestro automation under `mobile/`.

## ⏳ Infrastructure

### Step 4 — Seed / reset
- [ ] Decide the UAT reset mechanism (endpoint? script? none?) and wire `fixtures/seed.ts`.
- [ ] Until then, booking tests self-clean via `cancelAppointment`; confirm that's sufficient
  (slots are finite — repeated runs without reset could exhaust availability).

### Step 6 — CI
- [ ] Add GitHub Actions **secrets**: `API_BASE_URL`, `WEB_BASE_URL`, `FIREBASE_API_KEY`,
  `TEST_CLIENT_EMAIL/PASSWORD`, `TEST_STYLIST_EMAIL/PASSWORD`, `TEST_STYLIST_USERNAME`,
  and seed vars.
- [ ] Update `.github/workflows/uat.yml` env block (predates the Firebase change): add
  `FIREBASE_API_KEY` + `TEST_STYLIST_USERNAME`, drop the obsolete `TEST_CARD_DECLINE`.
- [ ] Decide gate scope in CI (e.g. `pnpm test:critical`) and whether web/cross run on every
  push or nightly only.

## 🧹 Housekeeping

- [ ] Consider a dedicated **client-only** vs **stylist** account hygiene check in CI setup docs.
- [ ] Revisit `personas.ts` (currently unused) — wire it in or remove.
- [ ] When F4/F5/F6/F8/F9 close, prune `test.fail` markers and this list.

## Release gate (reminder)

Ship-ready = **`pnpm test:critical` green** + **zero open P1/P2**. Today all open
findings are P2/P3 and tracked; the one-time P1 (F7) is fixed.
