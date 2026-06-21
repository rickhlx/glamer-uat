# Glamer UAT — Testing Principles

> The "why" behind how we test Glamer. Read this before writing a single test case.
> When a tradeoff isn't covered here, decide in the spirit of these principles and add it.

## What we're testing

Glamer is a peer-to-peer stylist booking platform with three surfaces:

| Surface | Audience | What it does |
| --- | --- | --- |
| **REST API** | Both | OpenAPI-spec-driven backend. The single source of truth for behavior. |
| **Web client** | Clients | Easy bookings from a web page. |
| **iOS app** | Stylists | Business management on the go. |

UAT (User Acceptance Testing) here means: **does the system do what a real client and a real stylist need it to do, end to end, before we ship.** It is not unit testing and it is not a substitute for it.

---

## Core principles

### 1. Test against behavior, not implementation
We assert on what a user observes and what the contract promises — booking states, confirmations, error messages, response shapes — not on internal mechanics. A test should survive a refactor.

### 2. The OpenAPI spec is the contract; honor it everywhere
The API is spec-driven, so the spec is our oracle. API tests validate conformance to it (status codes, schemas, auth, error shapes). The web and iOS clients are tested against the *same* expectations the spec sets. If reality and spec disagree, that's a bug in one of them — file it, don't paper over it.

### 3. Critical user journeys are first-class
We organize UAT around end-to-end journeys a person actually performs, not around endpoints or screens. The highest-value journeys cross surfaces (e.g. *client books on web → stylist receives and accepts on iOS → client sees confirmation*). These get the most attention and are non-negotiable for release.

### 4. Automate what's stable; reserve humans for what isn't
- **API (contract):** automated. Deterministic, fast, cheap to keep green.
- **Web client:** automated via browser automation. The primary regression guard for the client experience.
- **iOS app:** structured **manual** checklists for now. Native UI automation is a deliberate later investment, not a day-one cost.

The goal is leverage: machines catch regressions on every change; humans focus on judgment, exploration, and the surface that's expensive to automate.

### 5. Reproducibility over convenience
We test against a **dedicated UAT environment with seeded, reset-able data**. Every run starts from a known state. A test that only passes "sometimes" or "on Tuesdays" is a failing test until proven otherwise — flakiness is a defect, not noise.

### 6. Tests own their data, and clean up after themselves
Prefer tests that create what they need (a fresh client, a fresh booking) and leave the environment as they found it. Shared mutable state between tests is the enemy of reproducibility. Where seed data is relied upon, it is documented and version-controlled.

### 7. Severity drives the gate, not test count
Not every failure blocks a release. We triage by severity (below). A pile of cosmetic issues should not hold the line while a broken checkout sails through. Conversely, one P1 blocks regardless of how green everything else is.

### 8. A failing test must be actionable
Every failure should make the next step obvious: what journey, what surface, what was expected vs. actual, and how to reproduce. A red result that nobody can act on is wasted signal.

### 9. Test the unhappy paths too
Double bookings, payment declines, cancellations, expired sessions, network failures, permission boundaries (a client touching stylist-only data and vice versa). Acceptance means the system behaves correctly when things go *wrong*, not just when they go right.

### 10. UAT mirrors real usage
Use realistic personas, realistic data, and realistic device/browser conditions. A booking flow that works with perfect inputs but breaks on a real name with an apostrophe hasn't passed.

---

## Scope

In scope for this UAT effort:

- ✅ **REST API** — contract conformance (the foundation).
- ✅ **Web client** — client booking flows, browser-driven.
- ✅ **iOS app** — stylist management flows, manual.
- ✅ **Cross-surface journeys** — flows that span web ↔ API ↔ iOS.

The cross-surface journeys are the point of the product; they get explicit, named test scenarios rather than being assumed to "just work" because the parts pass individually.

---

## Environment

- **Target:** dedicated UAT environment, isolated from production.
- **Data:** seeded baseline + per-test data creation; environment is reset-able to a known state.
- **Accounts:** dedicated test clients and test stylists, clearly identifiable, never reused as real users.
- **Never** point write-heavy UAT runs at production.

---

## Severity & the release gate

We gate releases on severity, not on passing 100% of cases.

| Severity | Definition | Examples |
| --- | --- | --- |
| **P1 — Blocker** | A critical journey is broken or data/payment integrity is at risk. | Can't book; payment charged but no booking; stylist can't see bookings. |
| **P2 — Major** | Significant degradation, no safe workaround. | Cancellation fails silently; wrong availability shown. |
| **P3 — Minor** | Works, with a workaround or limited impact. | Confusing error copy; minor layout issue on one viewport. |
| **P4 — Cosmetic** | No functional impact. | Spacing, polish, non-blocking wording. |

**Release gate:** all defined **critical journeys pass** and there are **zero open P1 or P2 issues.** P3/P4 are tracked and triaged but do not block.

---

## Out of scope (for UAT)

- Unit and integration testing of internal code (owned by the build pipeline, not UAT).
- Load/performance and security testing — valuable, but separate efforts with their own principles.
- iOS UI test *automation* — deferred; manual checklists cover iOS for now.

---

## How we'll know this is working

- Every release is preceded by a UAT run whose result is a clear pass/fail against the gate above.
- Regressions in API and web are caught automatically, before a human looks.
- When something breaks in production that UAT should have caught, we add the missing journey — UAT grows from real gaps, not speculation.

---

*Living document. Amend it when a decision here stops serving us — but amend it deliberately, with the reason recorded.*
