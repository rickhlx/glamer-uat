# Glamer UAT — Findings

Issues surfaced by UAT, filed with the **glamer-backend** team (or **glamer-frontend**
for web bugs). Tests for these are marked known-failing (`test.fail`) and linked here, so
they don't block the gate as noise but flip to a real failure the moment they're fixed.

Severities follow [principles.md](./principles.md).

**Status:** ✅ F1, F2, F7, F9 (#387), F10 (#388), F12 (#428), F13 (#429), F14 (#442),
F15 (#438), **F5 (#367), F8 (#386)** fixed & verified; **F6 (#368)** closed by backend
(unverified — can't reproduce the duplicate-register scenario in UAT). 🔴 Open:
F4 (#366), F11 (frontend — glamer-uat#2),
F16 (#448 — `/stylists/{username}` 200 `oneOf` is ambiguous, spec-side).

---

## F16 — `GET /stylists/{username}` 200 `oneOf` is ambiguous (matches both/neither variant)

- **Repo:** spec / **glamer-backend**. **Issue:** https://github.com/rickhlx/glamer-backend/issues/448
  — **closed on backend, but still fails here.** The backend likely fixed the spec *source*; our
  local bundled `spec/glamer.openapi.yaml` is stale (remote `/openapi.yaml` is now multi-file).
  Refresh the local spec to confirm before removing the guard; if it still fails after refresh, reopen.
- **Severity:** P3 — conformance/spec-design gap on the public profile endpoint; surfaced after
  F13 (`contact.Social`) was fixed.
- **Surface:** API A-5 ("the full public profile conforms to spec").
- **Actual:** the 200 response is `oneOf: [StylistPublicResponse, StylistAuthenticatedResponse]`,
  and validation fails with `"must match exactly one schema in oneOf"` — the two variants overlap
  (no discriminator), so a public response satisfies both (or neither). All individual fields now
  conform (no null-where-array remains).
- **Expected:** the response validates against exactly one schema — add a `discriminator`, make the
  variants mutually exclusive (required fields unique to the authenticated variant), or collapse the
  200 to a single schema.
- **Test:** `tests/api/schema-conformance.spec.ts` ("the full public profile conforms to spec"),
  `test.fail` → F16. The `workLocations[]` sub-check (separate test) passes.

---

## F15 — `GET /me/appointments` returns `data: null` for an empty result, should be `[]` ✅ FIXED

- **Resolved:** verified green 2026-06-28 — the empty result now returns `200 { …, "data": [] }`;
  guard removed.
- **Repo:** **glamer-backend**. **Issue:** https://github.com/rickhlx/glamer-backend/issues/438
  — **close as resolved**. Same class as F9/F13.
- **Severity:** P3 — schema conformance gap on a core client read endpoint.
- **Surface:** API A-5 / the client appointments read backing web C-7.
- **Actual:** for an account with no appointments, the endpoint returns
  `200 { "meta": {...}, "links": {}, "data": null }`. The spec declares `data` as an
  array, so `null` fails conformance.
- **Expected:** `200` with `data: []`.
- **Note on #438:** #438 reports a `400` when the user has *no client profile*. With the
  available UAT accounts the **status is already correct** (the stylist account, which has
  no client appointments, returns `200`) — only the `null`-vs-`[]` body gap remains. The
  exact profile-less `400` scenario couldn't be reproduced without a dedicated no-profile
  account; if it still 400s for such accounts, that needs separate coverage.
- **Test:** `tests/api/schema-conformance.spec.ts` (A-5 "/me/appointments returns an empty
  array…"), `test.fail` → F15.

---

## F14 — Guest checkout `500`: duplicate active cart blocks `POST /carts/{id}/checkout` ✅ FIXED

- **Resolved:** verified green 2026-06-28 — the `idx_carts_user_active` duplicate is gone and the
  full A-7 happy path converts to an appointment. The flow also needs the cart's
  `preferredStartTime` set before checkout (else `500 "cart must have a preferred start time"`);
  `support/guest.ts` `createGuestCart` now `PUT`s a free slot. Guard removed.
- **Repo:** **glamer-backend**. **Issue:** https://github.com/rickhlx/glamer-backend/issues/442 — **close as resolved**.
- **Severity:** P2 (major) — the account-less guest happy path (A-7 / web C-8) can't
  complete once the guest has any existing active cart; a guest who abandons a cart and
  retries is permanently blocked.
- **Surface:** API A-7 happy path. **Endpoint:** `POST /carts/{id}/checkout` (guest block).
- **Actual:** with a valid cart + verified guest token, checkout returns:
  ```json
  { "type": "server_error", "title": "Internal Server Error",
    "detail": "failed to associate guest client with cart: ERROR: duplicate key value violates unique constraint \"idx_carts_user_active\" (SQLSTATE 23505)" }
  ```
- **Expected:** `200` with a `CartCheckoutResponse` (`appointmentId`), converting the cart
  to a `requested` appointment.
- **Root cause (likely):** checkout resolves/creates a guest client by phone, then associates
  the cart with that client — but `idx_carts_user_active` enforces one active cart per user,
  and the guest already owns an active cart (a prior abandoned cart for the same phone).
  Checkout should reconcile/deactivate the guest's other active cart(s), or scope the
  uniqueness so the cart being checked out is the one that wins.
- **Note:** surfaced only now that the **UAT test OTP** (backend #430) lets the suite reach
  the happy path; the OTP plumbing itself is correct (request `202` → confirm `200` → genuine
  token). F12 (the missing table) is resolved; this is a distinct, downstream defect.
- **Repro:** `tests/api/guest-booking.spec.ts` ("a verified guest can book end-to-end"),
  `test.fail` → F14. Also reproducible via curl (create guest cart → add item → request →
  confirm → checkout).

---

## F13 — `GET /stylists/{username}` returns `contact.Social: null`, should be array ✅ FIXED

- **Resolved:** verified green 2026-06-28 — `contact.Social` is now `[]`. Guard on this specific
  field removed. (The full-profile conformance test stays guarded for a **separate** issue, F16.)
- **Repo:** **glamer-backend**. **Issue:** https://github.com/rickhlx/glamer-backend/issues/429 — **close as resolved**. Same class as F9.
- **Severity:** P3 (minor) — contract conformance gap on the public profile endpoint.
- **Surface:** API A-5; the profile read backing web C-2 / the new workLocations enrichment.
- **Actual:** the response includes `"contact": { "Social": null, ... }`; the spec declares
  `Social` as an array, so the body fails its `oneOf` (`contact/Social: must be array`).
- **Expected:** `[]` when there are no socials (or make the field nullable in the spec).
- **Note:** the new `workLocations[]` field conforms correctly — only `contact.Social` breaks
  conformance, and it predates this spec change.
- **Test:** `tests/api/schema-conformance.spec.ts` (A-5 "the full public profile conforms"),
  `test.fail` → F13.

---

## F12 — Guest phone-verification endpoints `500`: `phone_verifications` table missing in UAT ✅ FIXED

- **Resolved:** verified green 2026-06-28. The migration landed in UAT — `request`
  now returns `202`/`400`/`429` and `confirm` returns the documented `400` for an
  invalid code (the two A-7 tests went from `test.fail` to passing). `test.fail`
  guards removed.
- **Repo:** **glamer-backend** (likely a UAT deploy/migration gap, not app code).
  **Issue:** https://github.com/rickhlx/glamer-backend/issues/428 — **close as resolved**.
  Test-enablement follow-up (UAT test OTP): https://github.com/rickhlx/glamer-backend/issues/430.
- **Severity:** **P1 for journey A-7** — the entire account-less guest booking flow is
  non-functional in UAT (no phone can be verified, so no guest can check out).
- **Surface:** API A-7 (and blocks web C-8). **Endpoints:** `POST /verify/phone/request`,
  `POST /verify/phone/confirm`.
- **Actual:** both return `500`:
  ```json
  { "type": "server_error", "title": "Internal Server Error",
    "detail": "ERROR: relation \"phone_verifications\" does not exist (SQLSTATE 42P01)" }
  ```
- **Expected:** `request` → `202` (accepted) / `400` / `429`; `confirm` → `200` with a
  `verificationToken`, or `400` for an invalid/expired code.
- **Root cause:** the `phone_verifications` relation doesn't exist in the UAT database — the
  feature's schema migration hasn't been applied (or the deploy predates it). Validation that
  runs *before* the DB lookup is fine: malformed phone → `400`, and guest checkout with a bogus
  token → `403` (both pass), so only the two paths that hit the table 500.
- **Action:** apply the phone-verification migration / redeploy UAT, then the A-7 happy path and
  C-8 can be exercised (also set `GUEST_TEST_OTP` for the full SMS E2E).
- **Test:** `tests/api/guest-booking.spec.ts` (A-7 request + confirm), `test.fail` → F12.

---

## F11 — Wrong password crashes the sign-in page (white-screen) instead of showing an error

- **Repo:** **glamer-frontend** (web client). **Issue:** https://github.com/rickhlx/glamer-uat/issues/2
  (tracked in the UAT repo; cross-file to glamer-frontend if desired).
- **Severity:** P2 (a crash on a core flow with a trivial repro; arguably P1).
- **Surface:** web C-1 (sign in, unhappy path).
- **Actual:** signing in with a valid email + wrong password white-screens the page with
  *"Application error: a client-side exception has occurred."* Console throws
  `Error: You used a <Description /> component, but it is not inside a relevant parent.`
- **Root cause (two coupled defects):**
  1. `components/ui/fieldset.tsx` `ErrorMessage` wraps Headless UI `<Description>`, which
     must be inside a `<Field>`. In `app/(auth)/signin/_components/signin-form.tsx` the
     **form-level** error (`{form.errors && <ErrorMessage>…}`) is rendered directly in
     `<FieldGroup>`, **outside** any `<Field>` → Headless UI throws → React error boundary
     crashes the whole page. So *any* form-level error crashes sign-in.
  2. `lib/actions/signin.action.ts` only maps `auth/wrong-password` / `auth/user-not-found`
     to field errors. Modern Firebase returns **`auth/invalid-credential`** for a wrong
     password, so it falls through to the generic `formErrors` branch — straight into (1).
- **Expected:** a clear inline error (e.g. "Incorrect email or password"), no crash, stays
  on `/signin`.
- **Fix sketch:** render form-level errors outside the Headless `<Field>` context (a plain
  element, not `ErrorMessage`/`<Description>`), **and** handle `auth/invalid-credential` in
  the action.
- **Test:** `tests/web/auth.spec.ts` C-1 "invalid credentials…", `test.fail` → F11.

---

## F10 — Canceled/declined appointments don't release their slot (availability leak) ✅ FIXED

- **Resolved:** verified green 2026-06-28. Declining now frees the slot — the X-2
  "a declined slot is released" test went from `test.fail` to passing; `test.fail`
  guard removed. This also clears the slot-leak caveat on the real-booking helpers.
- **Issue:** https://github.com/rickhlx/glamer-backend/issues/388 — **close as resolved**
- **Severity:** P2. **Endpoints:** `POST /appointments/{id}/decline`, `DELETE /appointments/{id}`.
- **Actual:** after a decline (`canceled_by_stylist`) or client cancel (`204`), the slot
  stays unavailable — `GET /stylists/{username}/availability` never offers it again
  (16 → 14 slots on book, stays 14 after cancel).
- **Expected:** canceling/declining frees the slot for rebooking.
- **Impact:** slots leak permanently; also means test cleanup (`cancelAppointment`)
  doesn't recover availability — a seed/reset is needed to avoid exhausting slots.
- **Test:** `tests/cross/decline.spec.ts` (X-2 "a declined slot is released"), `test.fail` → F10.

---

## F8 — Double-booking a slot returns `500` instead of `409` ✅ FIXED

- **Resolved:** verified green 2026-06-28 — a second booking of the same slot now returns `409`.
- **Issue:** https://github.com/rickhlx/glamer-backend/issues/386 — **closed**.
- **Severity:** P3. **Endpoint:** `POST /appointments`.
- **Test:** `tests/api/availability.spec.ts` (A-4) now asserts the second booking is `409` (was a
  generic "not 201" + tracked note).

---

## F9 — Appointment response `services[].includedAddons` is `null`, should be array ✅ FIXED

- **Resolved:** verified green 2026-06-28. The booking response now conforms — the
  A-5 "booking response conforms" test went from `test.fail` to passing; `test.fail`
  guard removed.
- **Issue:** https://github.com/rickhlx/glamer-backend/issues/387 — **close as resolved**
- **Severity:** P3. **Endpoint:** `POST /appointments` (and AppointmentResponse generally).
- **Actual:** `includedAddons: null` → fails schema (`services/0/includedAddons: must be array`).
- **Expected:** `[]` (or make the field nullable in the spec).
- **Test:** `tests/api/schema-conformance.spec.ts` (A-5 booking conforms), `test.fail` → F9.

---

## F1 — Auth failures return `400` instead of `401` ✅ FIXED

- **Issue:** https://github.com/rickhlx/glamer-backend/issues/364 — **closed, verified**

- **Severity:** P3 (minor) — affects the error contract of every cookie-authed endpoint.
- **Endpoints:** all `cookieAuth` endpoints (observed on `HEAD /session`, `GET /me/`).
- **Spec says:** `401 Unauthorized` (e.g. `HEAD /session` documents `401`).
- **Actual:** `400 Bad Request`:
  ```json
  { "error": "error in openapi3filter.SecurityRequirementsError: security requirements failed: no session cookie found" }
  ```
- **Repro:** call any cookie-authed endpoint with no `glamer-session` cookie.
- **Likely cause:** the `openapi3filter` request-validation layer rejects missing
  security with `400` before the handler runs. Consider mapping
  `SecurityRequirementsError` → `401`.
- **Test:** `tests/api/auth.spec.ts` (A-1 unauthenticated cases), `test.fail` → F1.

---

## F2 — `GET /stylists` response doesn't conform to its OpenAPI schema ✅ FIXED

- **Issue:** https://github.com/rickhlx/glamer-backend/issues/365 — **closed, verified**

- **Severity:** P2 (major) — contract conformance gap on a core discovery endpoint.
- **Endpoint:** `GET /stylists` (200).
- **Spec says:** response `data[]` items validate against the declared schema (`oneOf`).
- **Actual:** validation fails — `"must match exactly one schema in oneOf"`. Sample item
  includes empty-string fields (`location.timezone: ""`, `location.postalCode: ""`) and
  may be missing/adding fields relative to the `oneOf` variants.
- **Repro:** `GET /stylists`, validate the body against the spec's response schema.
- **Open question for backend:** is the `oneOf` stale (spec wrong), or is the response
  emitting a non-conforming shape (empty strings where a format/required is expected)?
- **Test:** `tests/api/schema-conformance.spec.ts` (A-5 stylist search), `test.fail` → F2.

---

## F4 — Stylist-only endpoints return `500` for non-stylists instead of `403`

- **Issue:** https://github.com/rickhlx/glamer-backend/issues/366

- **Severity:** P2 (major) — authorization rejection surfaced as a server error.
- **Endpoints:** `/me/stylist/*` (observed on `GET /me/stylist/profile`).
- **Spec says:** stylist-only endpoints should reject a non-stylist with `401`/`403`.
- **Actual:** `500`:
  ```json
  { "type": "server_error", "title": "Internal Server Error", "detail": "user is not a stylist" }
  ```
  The backend *knows* the caller isn't a stylist (correct `detail`) but returns it as a
  `500` rather than a `403 Forbidden`.
- **Repro:** authenticate as a client, call `GET /me/stylist/profile`.
- **Test:** `tests/api/authorization.spec.ts` (A-2), `test.fail` → F4.

---

## F5 — `POST /appointments` returns `500` for missing/invalid location ✅ FIXED

- **Resolved:** verified green 2026-06-28 — an invalid `locationId` now returns `400`.
- **Issue:** https://github.com/rickhlx/glamer-backend/issues/367 — **closed**.
- **Test:** `tests/api/booking-lifecycle.spec.ts` (A-3 "booking with an invalid location is rejected with 400").
- **Severity:** P3 (minor) — validation surfaced as a server error.
- **Endpoint:** `POST /appointments`.
- **Actual:** with `locationType`/`locationId` omitted →
  `500 "appointment missing location reference for snapshot capture"`. With a
  wrong location id → `500 "failed to load location <id>: no rows in result set"`.
- **Expected:** `400 Bad Request` for missing/invalid location.
- **Note:** the working request is `locationType: at_stylist` + `locationId` =
  the **catalog** location id (`location.id` from `/me/stylist/locations`), not
  the work-location wrapper id.

---

## F6 — `POST /me/register` returns `500` on duplicate, not `409` ☑️ CLOSED BY BACKEND (unverified)

- **Issue:** https://github.com/rickhlx/glamer-backend/issues/368 — **closed by backend 2026-06-28.**
  Not independently verified by UAT — reproducing the duplicate-register path safely needs a
  throwaway account (re-registering our standing test client could mutate it). No guarded test.
- **Severity:** P3 (minor).
- **Endpoint:** `POST /me/register`.
- **Actual:** re-registering an existing email →
  `500 "duplicate key value violates unique constraint idx_users_email_unique"`.
- **Expected:** `409 Conflict` (or idempotent success).

---

## F7 — Booking `500`s when the client has no client profile (blocker) ✅ FIXED

- **Issue:** https://github.com/rickhlx/glamer-backend/issues/369 — **closed, verified** (registered clients can now book)

- **Severity:** P1 for UAT (blocks all booking journeys) — likely P2 product bug.
- **Endpoint:** `POST /appointments`.
- **Actual:** for an authenticated client whose account lacks a client-profile
  record → `500 "failed to load client profile: client - client not found"`.
  `POST /me/register` cannot repair it (F6 duplicate-email 500).
- **Impact:** the test client account (`rickhl+client@`) was created without a
  client profile, so no booking can be created.
- **Action (UAT data):** recreate the client through the normal web sign-up flow
  (which provisions the client profile), or have the backend create the profile
  row. Then A-3 / A-4 / A-6 and the X-* booking journeys unblock.
- **Backend finding:** booking should return a clear `4xx` here, not a `500`.

---

## F3 — (resolved as test-data) Client account had a stylist profile

- Not a backend bug: the UAT "client" account (`ricardo_client`) was mistakenly set up
  with a stylist profile, so `GET /me/stylist/profile` returned `200` for a client.
- **Action:** recreate the client account as client-only. Once fixed, the A-2
  authorization-boundary test (`tests/api/authorization.spec.ts`) passes as written.
