# Glamer UAT — Critical User Journeys

> The named journeys the release gate refers to. Per [principles.md](./principles.md),
> **all critical (P1) journeys must pass and there must be zero open P1/P2 issues** to ship.
>
> ⚠️ These are inferred from a standard p2p booking model. Items marked **[CONFIRM]**
> need validation against the OpenAPI spec / product before we lock them.

## Legend

- **Surface:** `API` (contract) · `Web` (client) · `iOS` (stylist) · `Cross` (spans surfaces)
- **Tier:**
  - **Critical** — in the release gate. A failure here is a P1.
  - **Important** — should pass; a failure is typically P2.
- **ID scheme:** `C-*` client · `S-*` stylist · `X-*` cross-surface · `A-*` API contract

---

## The crown jewels — cross-surface journeys

These are the reason the product exists. They get explicit scenarios; we never assume they
work just because the parts pass individually.

### X-1 — Book → notify → accept → confirm `[Critical]` · Cross
A client books on web; the stylist receives the request on iOS, accepts it; the client sees a
confirmed booking.
- **Actors:** test client (web), test stylist (iOS)
- **Flow:** client selects stylist + service + slot → submits booking → request appears on stylist's iOS → stylist accepts → client's web view shows *Confirmed* → both see matching appointment details.
- **Acceptance:** booking state transitions `requested → accepted/confirmed` consistently across all three surfaces; details (service, time, price) match exactly.

### X-2 — Stylist declines a request `[Critical]` · Cross
- **Flow:** client books → stylist declines on iOS → client is notified and the slot is released.
- **Acceptance:** booking state `requested → declined`; slot becomes bookable again; no charge captured (or hold released). **[CONFIRM]** charge timing.

### X-3 — Client cancels an accepted booking `[Critical]` · Cross
- **Flow:** confirmed booking → client cancels on web → stylist sees cancellation on iOS → schedule frees up.
- **Acceptance:** state `confirmed → cancelled`; cancellation/refund policy applied correctly **[CONFIRM]**; stylist availability restored.

### X-4 — Stylist availability change reflects on web `[Critical]` · Cross
- **Flow:** stylist edits availability on iOS → newly closed slots disappear from web booking options; opened slots appear.
- **Acceptance:** web cannot book a slot the stylist has marked unavailable; no double-booking possible.

### X-5 — Appointment completion → payment settles `[Important]` · Cross `[no coverage — glamer-uat#10]`
- **Flow:** appointment time passes → stylist marks complete on iOS → payment captured/settled → client sees receipt. **[CONFIRM]** who triggers completion and capture.
- **Acceptance:** payment state correct; amounts and any platform fee reconcile; receipt available to client.
- **Status:** not automated. A-6 covers only `mark-paid`; the `POST /appointments/{id}/complete` transition is untested. Tracked in glamer-uat#10 (API-runnable now).

---

## Client journeys (Web)

### C-1 — Sign up / sign in `[Critical]` · Web
- **Flow:** new client registers (or signs in) → authenticated session.
- **Acceptance:** valid creds succeed; invalid creds rejected with clear error; session persists across navigation.

### C-2 — Discover & view a stylist `[Critical]` · Web
- **Flow:** browse/search stylists → open a profile → see services, prices, availability.
- **Acceptance:** listings load; profile shows accurate services/prices/availability sourced from the API.

### C-3 — Book an appointment `[Critical]` · Web
- **Flow:** choose service → choose available slot → confirm → pay → booking created.
- **Acceptance:** only available slots are bookable; price shown matches charged amount; success state + confirmation shown. Covers the happy path of X-1's client side.

### C-4 — Payment decline handling `[Critical]` · Web
- **Flow:** book with a card that declines.
- **Acceptance:** clear error; **no** booking created and **no** orphaned hold; client can retry. (Unhappy path — see principle 9.)

### C-5 — Reschedule a booking `[Important]` · Web `[CONFIRM]` feature exists
- **Acceptance:** new slot validated for availability; old slot released; both surfaces updated.

### C-6 — Cancel a booking `[Critical]` · Web
- Client side of X-3. **Acceptance:** cancellation succeeds within policy; correct refund behavior.

### C-7 — View booking history & status `[Important]` · Web
- **Acceptance:** past/upcoming bookings listed with correct, current statuses.

### C-8 — Guest booking (no account) `[Important]` · Web `[deferred — glamer-uat#1]`
- **Flow:** an account-less visitor verifies a phone over SMS → builds a cart → checks out as a
  guest → appointment request created.
- **Acceptance:** only a verified phone can check out; unverified checkout is rejected; the booking
  shows the same confirmation as C-3. **Web automation is deferred** behind the same booking-modal
  blocker as C-3 (glamer-uat#1); the API contract for this flow is covered by **A-7**.

---

## Stylist journeys (iOS only — by product design)

> Stylist account setup (signup, onboarding, profile, services, availability, work history,
> subscription) lives **only in the iOS app** — there is no stylist web surface. These are
> covered by **manual checklists** ([../ios-checklists](../ios-checklists)) for now; native UI
> automation is a later investment. The backend contract behind them is exercised automatically
> via the API as a stand-in for iOS (see A-3/A-6 and the cross-surface X-2/X-4).

### S-1 — Stylist onboarding / profile setup `[Critical]` · iOS
- **Flow:** sign in → create/edit profile, services, prices.
- **Acceptance:** saved profile is what clients see on web (ties to C-2).

### S-2 — Set / edit availability `[Critical]` · iOS
- Stylist side of X-4. **Acceptance:** availability edits persist and gate web bookability.

### S-3 — Receive & view booking requests `[Critical]` · iOS
- **Acceptance:** new requests appear promptly with correct details; notification delivered **[CONFIRM]** push vs. in-app.

### S-4 — Accept / decline a request `[Critical]` · iOS
- Stylist side of X-1 / X-2.

### S-5 — View schedule / calendar `[Critical]` · iOS
- **Acceptance:** confirmed bookings appear on the right date/time; no phantom or missing entries.

### S-6 — Cancel / mark complete `[Important]` · iOS
- **Acceptance:** correct state transitions; ties to X-3 (stylist-initiated cancel) and X-5 (completion).

### S-7 — Payouts / earnings view `[Important]` · iOS `[CONFIRM]` scope
- **Acceptance:** settled payments and balances reflect completed appointments accurately.

---

## API contract journeys (automated)

The API is the foundation; these run on every change and underpin everything above.

### A-1 — Auth & sessions `[Critical]` · API
- **Acceptance:** login/token issuance/refresh/expiry behave per spec; protected endpoints reject unauthenticated requests.

### A-2 — Authorization boundaries `[Critical]` · API
- **Acceptance:** a client token cannot access stylist-only endpoints and vice versa; users cannot read/modify others' bookings. (Principle 9 — permission boundaries.)

### A-3 — Booking lifecycle endpoints `[Critical]` · API
- **Acceptance:** create → accept/decline → cancel → complete transitions enforce valid state machine; invalid transitions rejected.

### A-4 — Availability endpoints `[Critical]` · API
- **Acceptance:** availability reads/writes are consistent; **no double-booking** is possible even on concurrent requests **[CONFIRM]** concurrency expectation.

### A-5 — Schema & error-shape conformance `[Critical]` · API
- **Acceptance:** responses validate against the OpenAPI schemas; error responses use the documented shape and status codes across endpoints.

### A-6 — Payment endpoints `[Critical]` · API `[CONFIRM]` integration model
- **Acceptance:** charge/hold/capture/refund behave per spec; declines surface correctly; idempotency on retries **[CONFIRM]**.

### A-7 — Guest booking & phone verification `[Critical]` · API
The contract behind the account-less booking path (client side of C-8).
- **Flow:** `POST /verify/phone/request` → `POST /verify/phone/confirm` (token) → `POST /carts` +
  `/carts/{id}/items` → `POST /carts/{id}/checkout` with a `guest` (name + verified phone + token).
- **Acceptance:** request/confirm validate input and return the spec shapes; **checkout without a
  valid verification token is rejected with `403`**; a verified guest checkout creates an
  appointment (`CartCheckoutResponse`). The SMS happy path runs only when a UAT test code is
  configured (`GUEST_TEST_OTP`); the 403 guard runs unconditionally.

---

## Coverage map (journey → surfaces)

| Journey | API | Web | iOS |
| --- | :-: | :-: | :-: |
| X-1 Book→accept→confirm | ● | ● | ● |
| X-2 Decline | ● | ● | ● |
| X-3 Client cancel | ● | ● | ● |
| X-4 Availability sync | ● | ● | ● |
| X-5 Complete→settle | ● | ● | ● |
| C-1..C-7 Client | ● | ● | |
| C-8 Guest booking | ● | ○ | |
| S-1..S-7 Stylist | ● | | ● |
| A-1..A-7 Contract | ● | | |

> ○ = client surface exists but web automation is deferred (glamer-uat#1); A-7 covers the API side.

---

## Open questions to resolve before locking

> **Update:** the real OpenAPI spec (`spec/glamer.openapi.yaml`) landed and answers
> several of these. Remaining unknowns are behavioral details the spec doesn't pin down.

**Resolved by the spec:**
- **Auth** — Firebase ID token → `POST /session` → `glamer-session` cookie (all other
  endpoints are cookie-authed). Tests need a Firebase Web API key for the UAT project.
- **Booking lifecycle** — `POST /appointments`, then explicit actions:
  `confirm`, `decline`, `complete`, `mark-paid`, `no-show-client`, `no-show-stylist`,
  `cancel-stylist` (stylist), and `DELETE /appointments/{id}` (client cancel).
  Statuses: `requested · confirmed · completed · completed_auto · canceled_by_client ·
  canceled_by_stylist · expired · no_show_client · no_show_stylist`.
- **Payment** — `paymentStatus` (`unpaid · authorized · captured · refunded ·
  partial_refund`) with an explicit `mark-paid` action; there's also a cart/checkout flow
  (`/carts/{id}/checkout`). Reschedule exists as `PUT /appointments/{id}` (update).
- **Reviews / no-shows** — first-class endpoints exist (`/reviews`, `no-show-*`).

**Still open (need product/behavioral confirmation):**
1. **Charge timing** — at request, confirm, or completion? When does `mark-paid` happen,
   and what releases an authorization on decline/cancel?
2. **Notifications** — push/email/in-app (devices endpoints exist); expected latency for
   "stylist receives request"?
3. **Completion trigger** — manual `complete` vs. `completed_auto` (auto on elapse)?
4. **Concurrency** — guaranteed behavior for two clients racing the same slot?
5. **Payouts scope** — is earnings/payout in scope for this UAT round?
6. **UAT specifics** — the Firebase UAT project + API key, real test usernames/service
   ids, and the seed/reset mechanism.

Resolving these turns the remaining **[CONFIRM]** items into assertable criteria.
