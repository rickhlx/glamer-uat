# Glamer UAT — Next Steps to Completion

> What's left to call UAT **complete** and produce a clean ship/no-ship signal.
> Companion to [todo.md](./todo.md) (status), [findings.md](./findings.md) (open bugs),
> [critical-journeys.md](./critical-journeys.md) (the gate), [runbook.md](./runbook.md) (how to run).
>
> _Last updated: 2026-06-28._

## Definition of done

Per [principles.md](./principles.md), UAT is complete when:

1. **Every critical journey passes** — A-1…A-7, C-1…C-8, X-1…X-5, and the S-\* manual checklists.
2. **Zero open P1/P2 findings.** P3/P4 are tracked but don't block.
3. A single command (`pnpm test:critical`) gives an unambiguous pass/fail, run from CI.

Today the automated gate (`pnpm test`) is **31 passed / 4 skipped / 0 failed**, but it's green
*only because* known failures are guarded with `test.fail` (F4, F11, F13, F14, F15) and the web
booking journeys are skipped. The list below is the work to make it pass **for real**.

---

## Recently resolved (verified 2026-06-28) — don't re-do these

- **F9** (#387), **F10** (#388), **F12** (#428) — fixed earlier; guards removed.
- **F13** (#429) `contact.Social` → `[]`, **F14** (#442) guest-checkout duplicate-cart,
  **F15** (#438) `/me/appointments` empty → `[]` — all fixed in UAT, guards removed. Backend
  should close #429/#442/#438. (F14 also needed a UAT-side helper fix: `createGuestCart` now
  sets the cart's `preferredStartTime`.)
- **A-7 guest happy path is now fully green end-to-end** (test OTP + F14 fix). The test creates a
  real appointment and declines it (stylist) to free the slot.
- **#430 UAT test-OTP** delivered and wired (`+14155550100`/`000000` in `.env`). Backend close #430.
- **glamer-uat#5** (seed/reset for slot exhaustion) closed — F10 was its driver.

---

## Priority 1 — P2 bugs blocking a real (un-guarded) gate

| Finding | Issue | Owner | Done when |
| --- | --- | --- | --- |
| **F4** — stylist-only endpoints `500` for non-stylists (should `403`) | [#366](https://github.com/rickhlx/glamer-backend/issues/366) | backend | A-2 authz test passes un-guarded |
| **F11** — wrong password white-screens sign-in | [glamer-uat#2](https://github.com/rickhlx/glamer-uat/issues/2) | frontend | C-1 invalid-credentials passes un-guarded |
| **F16** — `/stylists/{username}` 200 `oneOf` ambiguous (spec-side) | [#448](https://github.com/rickhlx/glamer-backend/issues/448) | UAT/backend | full-profile conformance test passes un-guarded (P3) |

When each lands: re-run → the guard flips → delete the `test.fail` marker → close the issue.

---

## Priority 2 — Finish the web client suite (C-\*)

### 2.1 Unblock the booking modal  ·  owner: frontend + UAT
**glamer-uat#1**: the booking-modal helper races the modal's server-action step transitions and
the shared server-side cart makes it flaky. Preferred fix is upstream
([glamer-frontend#647](https://github.com/rickhlx/glamer-frontend/issues/647): optimistic Next +
`data-booking-step`). This blocks **C-3** (book) and the **X-1** web step. **Highest-leverage
automated work** — it's the gateway to C-8 too.
- **Done when:** `bookFirstAvailableViaWeb` in `support/web.ts` drives the modal deterministically;
  C-3 un-skips and passes.

### 2.2 Unblock C-6 web cancel  ·  owner: frontend + UAT
**glamer-uat#9** (split out from #1): the appointment-card actions trigger (ellipsis) has no
accessible name, so the menu can't be opened by role/name. Preferred fix is an upstream
`aria-label`; interim is a stable test-id. The rest of the C-6 flow is already written.

### 2.3 Wire the web guest-booking journey (C-8)  ·  owner: UAT
Once **F14** (#442) and **2.1** (modal) land, point the web flow at the guest checkout path
(phone verify → cart → guest checkout) and add the C-8 web test. Tracked in **glamer-uat#3**
(canonical guest tracker). Until then, **A-7** covers the API contract.

### 2.4 Confirm/add the remaining C-\* journeys  ·  owner: UAT  ·  glamer-uat#8
- **C-5 reschedule** `[CONFIRM feature exists]` — backed by `PUT /appointments/{id}`; add a test
  or mark out of scope.
- **C-7 booking history** — add a read-only web assertion over `/appointments`.

### 2.5 Add X-5 completion → settlement coverage  ·  owner: UAT  ·  glamer-uat#10
**No coverage today** — A-6 tests only `mark-paid`; `POST /appointments/{id}/complete` is untested.
Add `tests/cross/complete-settle.spec.ts`: book → confirm → complete → settle, asserting both
surfaces reflect the final state. **API-runnable now** (no web/modal blocker; F10 resolved).
`[CONFIRM]` whether `/complete` auto-captures or `mark-paid` stays a separate step.

---

## Priority 3 — Newly surfaced backend gaps (cheap API coverage)

- **#438 / F15** — `GET /me/appointments` returns `data: null` for an empty result (should `[]`).
  Coverage added (guarded `test.fail` → F15). The original #438 `400` (no client profile) did
  **not** reproduce with our accounts — add a dedicated profile-less account if that scenario
  still needs covering.
- Triaged backend feature work to plan future journeys around: reviews (#432 private / #433 public),
  payments/payouts (#434, #350), stylist intake forms (#435).

---

## Priority 4 — iOS manual pass (S-\*)  ·  owner: manual QA  ·  glamer-uat#7
iOS is now the **only** stylist surface. Run the checklists in [../ios-checklists](../ios-checklists)
(S-1…S-7) on a UAT build and record results.
- Cross-check against the automated stand-ins: S-2/S-4 ↔ X-2/X-4, S-1 ↔ C-2.
- New iOS-only surface (no automated coverage by design) to add to checklists: **subscription**
  (`GET /me/subscription`), **work-history** (`/me/stylist/work-history`), **RevenueCat** purchase
  lifecycle. Suggest extending S-1 (profile) and S-7 (payouts/subscription).

---

## Priority 5 — P3 findings (track, don't block)
Mostly cleared by the backend. **Fixed & verified 2026-06-28:** F5 (#367 bad-location 400),
F8 (#386 double-book 409), F13 (#429), F15 (#438). **Closed by backend, UAT-unverified:**
F6 (#368 duplicate-register — no safe repro). **Still open:** F16 (#448 — `/stylists/{username}`
200 `oneOf` ambiguous, spec-side).

---

## Priority 6 — CI (required for "a single pass/fail from CI")  ·  owner: UAT  ·  glamer-uat#6
Per [todo.md](./todo.md) §2: add GitHub Actions secrets (`API_BASE_URL`, `WEB_BASE_URL`,
`FIREBASE_API_KEY`, `TEST_*`, `VERCEL_AUTOMATION_BYPASS_SECRET`, and `GUEST_TEST_OTP`/`GUEST_TEST_PHONE`);
fix the `.github/workflows/uat.yml` env block (add `FIREBASE_API_KEY` + `TEST_STYLIST_USERNAME`, drop
`TEST_CARD_DECLINE`); decide gate scope (`pnpm test:critical`) and push-vs-nightly for web/cross.

---

## Suggested sequence

```
P1 backend fixes (F14 #442 / F4 #366) ─┐
F11 frontend (#2) ─────────────────────┼─▶ 2.1 modal (#1) ─▶ 2.3 C-8 / 2.4 C-5,C-7
                                        │   2.2 C-6 (#9)
                                        └─▶ A-7 guest E2E un-guards once F14 lands
P4 iOS manual pass (#7) ───────── parallel
P5 P3 cleanup ─── parallel ─────────────────────────────────▶ P6 CI (#6) ─▶ DONE
```

**Release sign-off:** `pnpm test:critical` green with **no `test.fail` guards remaining on critical
journeys**, the iOS S-\* pass recorded, and zero open P1/P2 in [findings.md](./findings.md).
