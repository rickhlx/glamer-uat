# S-3 — Receive & view booking requests `@critical`

**Surface:** iOS · **Tier:** Critical · **Maps to:** X-1 / X-2 (stylist side)

## Preconditions
- Signed in as the test stylist. Have a client book on web (or trigger via API) during this pass.

## Steps
1. With the app open, have a client submit a booking on web.
2. A new request appears in the stylist's requests list. → Appears promptly.
3. Open the request. → Details (client, service, time, price) match what the client booked.
4. [CONFIRM notification model] Confirm a push/in-app notification was delivered.

## Acceptance
- New requests appear with correct details; notification delivered within expected latency (open question — see critical-journeys.md).

## Results
| Step | @critical | Pass/Fail | Notes / severity |
| --- | :-: | :-: | --- |
| 1 Client books | | | |
| 2 Request appears | ✓ | | |
| 3 Details match | ✓ | | |
| 4 Notification delivered | | | latency: ___ |
