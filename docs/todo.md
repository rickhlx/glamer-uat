# Glamer UAT — Status & Remaining Work

The canonical status doc. See also [principles.md](./principles.md),
[critical-journeys.md](./critical-journeys.md), [runbook.md](./runbook.md),
[findings.md](./findings.md), and [next-steps.md](./next-steps.md) (the plan to reach a real
ship/no-ship signal).

_Last updated: 2026-06-25._

---

## Spec update — 2026-06-25 (stylist → iOS-only, web = client-only)

The backend spec landed a product split: **all stylist functionality is iOS-only**; the Next.js
web app is **client-facing only**. The suite already honored this (web = C-\*, iOS = S-\* manual,
stylist actions driven via the API as an iOS stand-in), so this was an additive change, not a
teardown. Done this round:

- **Regenerated** `spec/glamer.d.ts` from the updated yaml (`pnpm gen:types`).
- **New journey A-7 — guest booking & phone verification** (`tests/api/guest-booking.spec.ts` +
  `support/guest.ts`): phone request/confirm shapes, the **unverified-checkout → 403** guard (runs
  every time), and a full SMS happy path gated behind `GUEST_TEST_OTP` (self-skips when unset).
- **Extended A-5** conformance for the enriched public profile (`workLocations[]`) and guest cart
  create/read.
- **Docs** reframed: client/stylist split is now stated as product design; A-7 + C-8 registered.
- **Kept** the stylist-API-driven tests (A-3/A-6/X-2/X-4) as the automated proxy for the iOS
  backend contract; the test stylist stays onboardable via API for setup.
- The `POST/PUT /me/stylist/services` → **204** change is a no-op for the suite (only `GET` is
  used). iOS-only additions (subscription, work-history, RevenueCat webhook) are left to the S-\*
  manual checklists — no automated tests added.

**Found:** **F12** — the guest phone-verification endpoints `500` because the `phone_verifications`
table is missing in UAT (migration not applied); the whole guest flow is down until it's deployed.
The unverified-checkout `403` guard and malformed-phone `400` validation pass correctly.

**Filed for backend:** [#428](https://github.com/rickhlx/glamer-backend/issues/428) (F12 missing
table), [#429](https://github.com/rickhlx/glamer-backend/issues/429) (F13 `contact.Social`), and
[#430](https://github.com/rickhlx/glamer-backend/issues/430) (UAT test-OTP mechanism to enable the
A-7 guest E2E).

**Still open:** backend to apply the F12 migration on UAT (#428); then wire a UAT test-OTP
(`GUEST_TEST_OTP`, #430) to unlock the full guest E2E; web guest booking (C-8) remains behind the
glamer-uat#1 modal blocker.

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
| API contract (A-\*) | `pnpm test:api` | ✅ **15 passed**; **A-7 guest booking added** (verify next live run) |
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
| F4 | [#366](https://github.com/rickhlx/glamer-backend/issues/366) | P2 | Stylist-only endpoints `500` for non-stylists (should be `403`) — _still open, re-verified 2026-06-28_ |
| F16 | [#448](https://github.com/rickhlx/glamer-backend/issues/448) | P3 | `GET /stylists/{username}` 200 `oneOf` ambiguous — _#448 closed on backend but still fails locally; needs local spec refresh to confirm_ |
| F6 | [#368](https://github.com/rickhlx/glamer-backend/issues/368) | P3 | `POST /me/register` `500` on duplicate email — _closed by backend; UAT-unverified (no safe repro)_ |

✅ Resolved & verified 2026-06-28 (guards removed / assertions tightened):
F9 ([#387](https://github.com/rickhlx/glamer-backend/issues/387)) `includedAddons`,
F10 ([#388](https://github.com/rickhlx/glamer-backend/issues/388)) slot release on cancel/decline,
F12 ([#428](https://github.com/rickhlx/glamer-backend/issues/428)) guest phone-verification table,
F13 ([#429](https://github.com/rickhlx/glamer-backend/issues/429)) `contact.Social`,
F14 ([#442](https://github.com/rickhlx/glamer-backend/issues/442)) guest checkout duplicate-cart,
F15 ([#438](https://github.com/rickhlx/glamer-backend/issues/438)) `/me/appointments` empty array,
F5 ([#367](https://github.com/rickhlx/glamer-backend/issues/367)) bad-location 400,
F8 ([#386](https://github.com/rickhlx/glamer-backend/issues/386)) double-book 409.

When a fix lands: re-run → the `test.fail` guard flips → remove the marker → close the issue.

---

## Remaining work

### 1. Web client (`tests/web`) — real selectors wired; blocked on Vercel wall
Selectors are now **real**, read from the live `glamer-frontend` (Next.js App Router)
source, not placeholders. Routes: sign-in `/signin`, profile `/{username}`, booking
modal `/{username}?booking=true` (multi-step: Services → Date&Time → Summary),
appointments `/appointments` (also the post-login landing). Web auth is Firebase
email/password; the frontend sets the `glamer-session` cookie itself.

> **Route change (2026-06-28):** the standalone discovery listing page
> `/search/stylists` was removed (now hard-404s, `x-matched-path: /404`) and sign-in
> now lands on `/appointments`. C-1's expected URL was re-pointed and the C-2 listing
> assertion was dropped (clients reach stylists by profile link); re-add a listing
> test if a discovery index returns.

- [x] Replace placeholder selectors with real ones (`support/web.ts` helpers + all C-\* specs).
- [x] Confirm web auth: sign-in form `input[name=email|password]`, server action sets `glamer-session`.
- [x] **Vercel deployment protection solved.** Bypass *cookie* minted in `globalSetup` →
  storageState, loaded only by web/cross (`playwright.config.ts`); secret in
  `VERCEL_AUTOMATION_BYPASS_SECRET`. (A header would leak to Sentry/Maps and break their CORS.)
- [x] **C-1 sign in** (valid ✅, lands on `/appointments`; invalid guarded → **F11** crash,
  glamer-uat#2) and **C-2 discover** (profile ✅; listing dropped after `/search/stylists`
  was removed) — green against live staging.
- [x] **C-4 payment decline — NOT APPLICABLE on web** (request-to-book, "pay at location";
  no web payment UI). Documented + skipped; payment coverage lives in API A-6.
- **[ ] C-3 booking + X-1 web step — blocked, tracked in glamer-uat#1.**
  Selectors are real; the booking-modal helper races the modal's server-action step
  transitions, and the shared server-side cart makes it flaky. (F10 is now resolved, so
  the slot-leak caveat no longer applies — a clean-cart reset is still nice-to-have.)
  **Preferred fix is upstream:** [glamer-frontend#647](https://github.com/rickhlx/glamer-frontend/issues/647)
  — the modal gates `Next` on a server round-trip (optimistic update misses `canProceedToNext`)
  and transitions steps via full `redirect()` re-renders with no stable step signal. Once it
  lands (optimistic Next + `data-booking-step`), re-point the helper at the new affordances.
- **[ ] C-6 cancel web step — blocked, tracked in glamer-uat#9.** Distinct from #1: the
  appointment-card actions trigger (ellipsis) has no accessible name, so the menu can't be
  opened by role/name. Preferred fix is an upstream `aria-label`; interim is a stable test-id
  selector. The rest of the C-6 flow is already written.
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
