# Glamer UAT — Next Steps to Completion

> What's left to call UAT **complete** and produce a clean ship/no-ship signal.
> Companion to [todo.md](./todo.md) (status), [findings.md](./findings.md) (open bugs),
> [critical-journeys.md](./critical-journeys.md) (the gate), [runbook.md](./runbook.md) (how to run).
>
> _Last updated: 2026-06-25._

## Definition of done

Per [principles.md](./principles.md), UAT is complete when:

1. **Every critical journey passes** — A-1…A-7, C-1…C-8, X-1…X-5, and the S-\* manual checklists.
2. **Zero open P1/P2 findings.** P3/P4 are tracked but don't block.
3. A single command (`pnpm test:critical`) gives an unambiguous pass/fail, run from CI.

Today the automated gate command passes *only because* known failures are guarded with `test.fail`.
The list below is the work to make it pass **for real**.

---

## Priority 1 — Unblockers (nothing else is trustworthy until these land)

### 1.1 Restore bookable availability / wire seed-reset  ·  owner: UAT + backend
The booking journeys (A-3, A-4, A-6, X-1, X-3) currently fail with **"No bookable slot (all taken?)"**.
Root cause is **F10** ([#388](https://github.com/rickhlx/glamer-backend/issues/388), P2): canceled/declined
appointments don't release their slot, so repeated runs permanently exhaust the test stylist's slots.
- **Now (UAT):** finalize the reset mechanism in `fixtures/seed.ts` (currently a stub against a
  protected seed endpoint) **or** refresh the stylist's availability window before a run.
- **Real fix (backend):** F10 — release the slot on cancel/decline.
- **Done when:** a fresh `pnpm test:api` run books and cancels without exhausting slots, twice in a row.

### 1.2 Deploy the guest phone-verification migration to UAT  ·  owner: backend
**F12** ([#428](https://github.com/rickhlx/glamer-backend/issues/428), P1): `phone_verifications`
table is missing in UAT, so `POST /verify/phone/request|confirm` 500. The entire guest flow (A-7, C-8)
is dead until the migration is applied.
- **Done when:** `tests/api/guest-booking.spec.ts` request/confirm tests stop 500ing; the `test.fail`
  guards flip to real passes (remove the markers + close F12).

---

## Priority 2 — P2 findings in the release gate

| Finding | Issue | Owner | Done when |
| --- | --- | --- | --- |
| **F4** — stylist-only endpoints `500` for non-stylists (should `403`) | [#366](https://github.com/rickhlx/glamer-backend/issues/366) | backend | A-2 authz test passes un-guarded |
| **F10** — slot not released on cancel/decline | [#388](https://github.com/rickhlx/glamer-backend/issues/388) | backend | X-2 "declined slot is released" passes; ties to 1.1 |
| **F11** — wrong password white-screens sign-in | [glamer-uat#2](https://github.com/rickhlx/glamer-uat/issues/2) | frontend | C-1 invalid-credentials passes un-guarded |
| **F12** — guest verification table missing | [#428](https://github.com/rickhlx/glamer-backend/issues/428) | backend | see 1.2 |

When each lands: re-run → the guard flips → delete the `test.fail` marker → close the issue.

---

## Priority 3 — Finish the web client suite (C-\*)

### 3.1 Unblock the booking modal  ·  owner: frontend + UAT
**glamer-uat#1**: the booking-modal helper races the modal's server-action step transitions and the
shared server-side cart makes it flaky; C-6's card menu trigger is unlabeled. Preferred fix is upstream
([glamer-frontend#647](https://github.com/rickhlx/glamer-frontend/issues/647): optimistic Next +
`data-booking-step`). This blocks **C-3** (book), **C-6** (cancel), and the **X-1** web step.
- **Done when:** `bookFirstAvailableViaWeb` in `support/web.ts` drives the modal deterministically;
  C-3/C-6 un-skip and pass.

### 3.2 Wire the web guest-booking journey (C-8)  ·  owner: UAT
Once 1.2 (backend) and 3.1 (modal) land, point the web flow at the guest checkout path (phone verify →
cart → guest checkout) and add the C-8 web test. Until then, **A-7** covers the API contract.

### 3.3 Confirm/add the remaining C-\* journeys  ·  owner: UAT
- **C-5 reschedule** `[CONFIRM feature exists]` — backed by `PUT /appointments/{id}`; add a test or
  mark out of scope.
- **C-7 booking history** — add a read-only web assertion over `/appointments`.

---

## Priority 4 — Enable the guest happy-path E2E (A-7)  ·  owner: backend + UAT
After F12 (1.2), the full guest checkout still needs a `verificationToken` without a real SMS.
**#430** asks backend for a UAT test-OTP mechanism. Once provided, set `GUEST_TEST_OTP` /
`GUEST_TEST_PHONE` (see `.env.example`); the gated test in `tests/api/guest-booking.spec.ts`
("a verified guest can book end-to-end") then runs to a created appointment.

---

## Priority 5 — iOS manual pass (S-\*)  ·  owner: manual QA
iOS is now the **only** stylist surface. Run the checklists in [../ios-checklists](../ios-checklists)
(S-1…S-7) on a UAT build and record results.
- Cross-check against the automated stand-ins: S-2/S-4 ↔ X-2/X-4, S-1 ↔ C-2.
- New iOS-only surface from this spec (no automated coverage by design) to add to checklists:
  **subscription** (`GET /me/subscription`), **work-history** (`/me/stylist/work-history`),
  **RevenueCat** purchase lifecycle. Suggest extending S-1 (profile) and S-7 (payouts/subscription).

---

## Priority 6 — P3 findings (track, don't block)
F5 ([#367](https://github.com/rickhlx/glamer-backend/issues/367)),
F6 ([#368](https://github.com/rickhlx/glamer-backend/issues/368)),
F8 ([#386](https://github.com/rickhlx/glamer-backend/issues/386)),
F9 ([#387](https://github.com/rickhlx/glamer-backend/issues/387)),
F13 ([#429](https://github.com/rickhlx/glamer-backend/issues/429)) — all "`500`/`null` where a proper
`4xx`/`[]` is expected." Batchable for the backend; flip their guards as they close.

---

## Priority 7 — CI (deferred, but required for "a single pass/fail from CI")  ·  owner: UAT
Per [todo.md](./todo.md) §2: add GitHub Actions secrets (`API_BASE_URL`, `WEB_BASE_URL`,
`FIREBASE_API_KEY`, `TEST_*`, seed vars, and `GUEST_TEST_OTP` once #430 lands); fix the
`.github/workflows/uat.yml` env block (add `FIREBASE_API_KEY` + `TEST_STYLIST_USERNAME`, drop
`TEST_CARD_DECLINE`); decide gate scope (`pnpm test:critical`) and push-vs-nightly for web/cross.

---

## Suggested sequence

```
1.1 seed-reset  ─┐
1.2 F12 migration ┼─▶ P2 fixes (F4/F10/F11) ─▶ 3.1 modal ─▶ 3.2 C-8 / 3.3 C-5,C-7
#430 test-OTP ───┘                                         └─▶ P4 A-7 E2E
                                              5. iOS manual pass (parallel)
                                              6. P3 cleanup (parallel) ─▶ 7. CI ─▶ DONE
```

**Release sign-off:** `pnpm test:critical` green with **no `test.fail` guards remaining on critical
journeys**, the iOS S-\* pass recorded, and zero open P1/P2 in [findings.md](./findings.md).
