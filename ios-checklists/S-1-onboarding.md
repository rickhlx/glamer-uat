# S-1 — Stylist onboarding / profile setup `@critical`

**Surface:** iOS · **Tier:** Critical · **Maps to:** C-2 (clients see this profile on web)

## Preconditions
- UAT reset to known state; signed in as the test stylist.

## Steps
1. Open the app → go to Profile.
2. Set/confirm display name, bio, and photo. → Saved without error.
3. Add a service: name, price, duration. → Service appears in the list.
4. Edit the service price. → Update persists after leaving and re-entering the screen.

## Acceptance
- Saved profile + services match what a client sees on the web profile (cross-check C-2).
- Realistic input (name with accents/apostrophe) is preserved exactly (principle 10).

## Results
| Step | @critical | Pass/Fail | Notes / severity |
| --- | :-: | :-: | --- |
| 1 Open profile | | | |
| 2 Save profile | ✓ | | |
| 3 Add service | ✓ | | |
| 4 Edit price persists | ✓ | | |
