# iOS (Stylist) — Manual UAT Checklists

The iOS stylist app is tested **manually** for now (per [docs/principles.md](../docs/principles.md),
principle 4). Each file here covers one stylist journey (S-*) from
[docs/critical-journeys.md](../docs/critical-journeys.md). The iOS halves of the
cross-surface journeys (X-1…X-5) are exercised here too — they reference the same
X-* IDs so a manual pass lines up with the automated web/API runs.

## How to run a pass

1. Reset UAT to a known state (same seed the automated suites use — see [docs/runbook.md](../docs/runbook.md)).
2. Build/install the UAT build of the iOS app on a device or simulator.
3. Sign in as the test stylist.
4. Work through each checklist top to bottom, filling the results table.
5. File any failure with: journey ID, step, expected vs. actual, severity (P1–P4), and a screenshot/recording.

## Pass/fail

A checklist passes when every **@critical** step passes. The release gate
(critical journeys green, zero open P1/P2) spans these checklists *and* the
automated suites — neither alone is sufficient.

## Future: Maestro

These checklists are written step-by-step so they map 1:1 onto Maestro YAML flows
(`mobile/maestro/<S-id>.yaml`) when we automate. See [../mobile/README.md](../mobile/README.md).
