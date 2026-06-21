# Glamer UAT — Runbook

How to run UAT locally and in CI. For the *why*, see [principles.md](./principles.md);
for *what* we test, see [critical-journeys.md](./critical-journeys.md).

## One-time setup
```bash
pnpm install
cp .env.example .env      # then fill in real UAT URLs + test creds
pnpm gen:types            # generate spec/glamer.d.ts from the OpenAPI spec
pnpm exec playwright install --with-deps chromium
```

## Running
```bash
pnpm test            # everything (api + web + cross)
pnpm test:api        # REST contract journeys (A-*)
pnpm test:web        # web client journeys (C-*)
pnpm test:cross      # cross-surface journeys (X-*)
pnpm test:critical   # ONLY @critical — this is the release gate
pnpm report          # open the HTML report
```

## The release gate
Ship-readiness = **`pnpm test:critical` green** **and** **zero open P1/P2 issues**
(automated suites *and* the manual [iOS checklists](../ios-checklists)). Severity
definitions live in [principles.md](./principles.md).

## Placeholder mode
Until `API_BASE_URL` points at a real host (not a `*.example` domain), journey tests
**skip themselves** so the scaffold stays green. They activate automatically once real
URLs are configured. Schema validation, type generation, and typecheck run regardless.

## Manual iOS pass
Work through [../ios-checklists](../ios-checklists) on a UAT build; record results in each
file's table. File failures with journey ID, step, expected vs. actual, severity, and a
screenshot/recording.

## CI
`.github/workflows/uat.yml` runs on push/PR, nightly (08:00 UTC), and manual dispatch.
Configure these **GitHub Actions secrets**: `API_BASE_URL`, `WEB_BASE_URL`,
`TEST_CLIENT_EMAIL/PASSWORD`, `TEST_STYLIST_EMAIL/PASSWORD`, `SEED_URL`, `SEED_TOKEN`,
`TEST_CARD_DECLINE`. The HTML report is uploaded as an artifact.

## Auth model (Firebase)
The real spec authenticates via Firebase: the suite signs in to Firebase with a test
account (`getFirebaseIdToken` in `support/auth.ts`), exchanges the ID token at
`POST /session` for a `glamer-session` cookie, and rides that cookie (managed by
`support/cookie-fetch.ts`) on all later calls. Set `FIREBASE_API_KEY` plus the test
account creds in `.env`.

## Remaining to go live
The real `spec/glamer.openapi.yaml` is in place and the suite is wired to it. To activate:
1. Set real `API_BASE_URL` / `WEB_BASE_URL`, `FIREBASE_API_KEY`, test creds, and
   `TEST_STYLIST_USERNAME` in `.env` (and CI secrets) → journey tests activate.
2. Replace placeholder service/appointment ids in `tests/api` & `tests/cross` with
   seed-data ids, and placeholder selectors in `tests/web` with real ones.
3. Wire `fixtures/seed.ts` to the actual UAT seed/reset mechanism.
4. Re-run `pnpm gen:types` whenever the spec updates; fix any contract drift.
