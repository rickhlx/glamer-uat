# S-4 — Accept / decline a request `@critical`

**Surface:** iOS · **Tier:** Critical · **Maps to:** X-1 (accept), X-2 (decline)

## Preconditions
- A pending booking request exists (from S-3).

## Steps
1. Open a pending request → tap Accept. → Status changes to accepted/confirmed.
2. Cross-check: the client sees "confirmed" on web (ties to X-1).
3. Create a second request → tap Decline. → Status changes to declined.
4. Cross-check: the client is notified and the slot is released (ties to X-2).

## Acceptance
- Accept and decline both transition state correctly and propagate to the client.

## Results
| Step | @critical | Pass/Fail | Notes / severity |
| --- | :-: | :-: | --- |
| 1 Accept | ✓ | | |
| 2 Client sees confirmed | ✓ | | |
| 3 Decline | ✓ | | |
| 4 Client notified / slot freed | ✓ | | |
