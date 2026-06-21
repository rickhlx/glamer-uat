# S-2 — Set / edit availability `@critical`

**Surface:** iOS · **Tier:** Critical · **Maps to:** X-4 (reflects on web)

## Preconditions
- Signed in as the test stylist; UAT reset.

## Steps
1. Open the calendar/availability screen.
2. Open a free slot for booking. → Slot shows as available.
3. Close a previously open slot. → Slot shows as unavailable.
4. Cross-check on web: the opened slot is bookable, the closed slot is not (ties to automated X-4).

## Acceptance
- Availability edits persist and gate web bookability. No slot can be booked on web that the stylist closed.

## Results
| Step | @critical | Pass/Fail | Notes / severity |
| --- | :-: | :-: | --- |
| 1 Open availability | | | |
| 2 Open a slot | ✓ | | |
| 3 Close a slot | ✓ | | |
| 4 Web reflects change | ✓ | | |
