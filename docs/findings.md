# Glamer UAT — Findings

Backend/contract issues surfaced by UAT, ready to file with the **glamer-backend**
team. Tests for these are marked known-failing (`test.fail`) and linked back here, so
they don't block the gate as noise but flip to a real failure the moment they're fixed.

Severities follow [principles.md](./principles.md).

---

## F1 — Auth failures return `400` instead of `401`

- **Severity:** P3 (minor) — affects the error contract of every cookie-authed endpoint.
- **Endpoints:** all `cookieAuth` endpoints (observed on `HEAD /session`, `GET /me/`).
- **Spec says:** `401 Unauthorized` (e.g. `HEAD /session` documents `401`).
- **Actual:** `400 Bad Request`:
  ```json
  { "error": "error in openapi3filter.SecurityRequirementsError: security requirements failed: no session cookie found" }
  ```
- **Repro:** call any cookie-authed endpoint with no `glamer-session` cookie.
- **Likely cause:** the `openapi3filter` request-validation layer rejects missing
  security with `400` before the handler runs. Consider mapping
  `SecurityRequirementsError` → `401`.
- **Test:** `tests/api/auth.spec.ts` (A-1 unauthenticated cases), `test.fail` → F1.

---

## F2 — `GET /stylists` response doesn't conform to its OpenAPI schema

- **Severity:** P2 (major) — contract conformance gap on a core discovery endpoint.
- **Endpoint:** `GET /stylists` (200).
- **Spec says:** response `data[]` items validate against the declared schema (`oneOf`).
- **Actual:** validation fails — `"must match exactly one schema in oneOf"`. Sample item
  includes empty-string fields (`location.timezone: ""`, `location.postalCode: ""`) and
  may be missing/adding fields relative to the `oneOf` variants.
- **Repro:** `GET /stylists`, validate the body against the spec's response schema.
- **Open question for backend:** is the `oneOf` stale (spec wrong), or is the response
  emitting a non-conforming shape (empty strings where a format/required is expected)?
- **Test:** `tests/api/schema-conformance.spec.ts` (A-5 stylist search), `test.fail` → F2.

---

## F4 — Stylist-only endpoints return `500` for non-stylists instead of `403`

- **Severity:** P2 (major) — authorization rejection surfaced as a server error.
- **Endpoints:** `/me/stylist/*` (observed on `GET /me/stylist/profile`).
- **Spec says:** stylist-only endpoints should reject a non-stylist with `401`/`403`.
- **Actual:** `500`:
  ```json
  { "type": "server_error", "title": "Internal Server Error", "detail": "user is not a stylist" }
  ```
  The backend *knows* the caller isn't a stylist (correct `detail`) but returns it as a
  `500` rather than a `403 Forbidden`.
- **Repro:** authenticate as a client, call `GET /me/stylist/profile`.
- **Test:** `tests/api/authorization.spec.ts` (A-2), `test.fail` → F4.

---

## F3 — (resolved as test-data) Client account had a stylist profile

- Not a backend bug: the UAT "client" account (`ricardo_client`) was mistakenly set up
  with a stylist profile, so `GET /me/stylist/profile` returned `200` for a client.
- **Action:** recreate the client account as client-only. Once fixed, the A-2
  authorization-boundary test (`tests/api/authorization.spec.ts`) passes as written.
