# Glamer UAT

Black-box User Acceptance Testing for **Glamer**, a p2p stylist booking platform:

- **REST API** (OpenAPI-spec-driven) — the contract everything depends on
- **Web client** (clients) — easy bookings from a web page
- **iOS app** (stylists) — business management

This repo tests the *deployed UAT environment* end to end. It does not import app source.

## Quick start
```bash
pnpm install
cp .env.example .env      # fill in real UAT URLs + test creds
pnpm gen:types
pnpm exec playwright install --with-deps chromium
pnpm test:critical       # the release gate
```
See [docs/runbook.md](docs/runbook.md) for the full workflow.

## How it's organized
| Path | What |
| --- | --- |
| `docs/principles.md` | How we test and what guides decisions |
| `docs/critical-journeys.md` | The journeys the release gate refers to (A-*, C-*, S-*, X-*) |
| `docs/runbook.md` | How to run UAT locally + in CI |
| `tests/api` | REST contract journeys (A-*) — Playwright + OpenAPI validation |
| `tests/web` | Web client journeys (C-*) — Playwright browser |
| `tests/cross` | Cross-surface journeys (X-*) — web + API together |
| `ios-checklists/` | Manual stylist journeys (S-*) |
| `support/` | Shared infra: env, typed API client, schema matcher, fixtures |
| `fixtures/` | Personas + seed/reset helpers |
| `spec/` | Vendored OpenAPI spec (→ generated types) |
| `mobile/` | Reserved for future Maestro iOS automation |

## Stack
TypeScript · [Playwright](https://playwright.dev) (one runner for API + web) ·
[`openapi-typescript`](https://openapi-ts.dev) + [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/)
for a typed API client · `openapi-response-validator` for runtime contract checks · GitHub Actions CI.

## Status
Scaffold with a **placeholder OpenAPI spec** and example journeys. Journey tests skip
themselves until real UAT URLs are configured. To go live, see
"When the real spec arrives" in [docs/runbook.md](docs/runbook.md). Outstanding product
questions (payments, notifications, etc.) are listed at the bottom of
[docs/critical-journeys.md](docs/critical-journeys.md).
