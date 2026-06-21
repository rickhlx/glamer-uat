# S-6 — Cancel / mark complete `@important`

**Surface:** iOS · **Tier:** Important · **Maps to:** X-3 (stylist-initiated cancel), X-5 (completion)

## Preconditions
- A confirmed booking exists.

## Steps
1. Open a confirmed booking → Cancel. → Status changes to cancelled; client is notified; slot frees up.
2. Open another confirmed booking whose time has passed → Mark complete. → Status changes to completed.
3. [CONFIRM completion trigger] Verify whether completion is manual (here) or automatic on time elapse.

## Acceptance
- Cancel and complete transition correctly and ripple to the client (X-3) and payment settlement (X-5).

## Results
| Step | @critical | Pass/Fail | Notes / severity |
| --- | :-: | :-: | --- |
| 1 Cancel | | | |
| 2 Mark complete | | | |
| 3 Completion model confirmed | | | |
