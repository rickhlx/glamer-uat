# mobile/ — reserved for iOS automation (Maestro)

iOS is **manual** today ([../ios-checklists](../ios-checklists)). This directory is
the reserved home for future [Maestro](https://maestro.mobile.dev) flows so we can
automate without restructuring.

## Plan when we adopt Maestro
- Add `mobile/maestro/<S-id>.yaml` flows mirroring the checklist files **1:1**
  (e.g. `mobile/maestro/S-4-accept-decline.yaml` ↔ `ios-checklists/S-4-accept-decline.md`).
- Reuse the same seed/reset (`fixtures/seed.ts`) and test accounts (`.env`) as the
  other suites — one source of truth for environment + data.
- Add a `test:ios` script and a CI job (likely a macOS runner with a simulator).

Maestro chosen over XCUITest for low authoring cost (YAML, no Xcode project wiring).
Revisit if we need deeper native fidelity.
