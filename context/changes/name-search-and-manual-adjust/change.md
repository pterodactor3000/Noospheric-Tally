---
change_id: name-search-and-manual-adjust
title: Name search and manual adjust
status: implementing
created: 2026-10-30
updated: 2026-10-30
archived_at: null
---

## Notes

Roadmap: `context/foundation/roadmap.md` (S-05), PRD FR-006, FR-013. Linear TEC-29. GitHub issue https://github.com/pterodactor3000/Noospheric-Tally/issues/7. Artifacts: `plan.md`, `plan-brief.md`.

Decisions from 2026-10-30, made from the roadmap, the PRD, and the code with no interview. Complexity is Medium. The `[-]` and `[+]` buttons that S-04 and S-06 left disabled on the tally row become the hand adjustment, one unit per press, floored at 0. Hand adjustments write no row to `household_quantity_changes`. Search is a name filter on the inventory page. A barcode-less item is created from `/inventory/new` with a name only, and starts at 0.

Later the same day, the tally gained name and count sort, 36px rows, and a green household name in the heading. The item page saves count and minimum together. The attach list became `Item designation`. A new household name is prefilled with `Hab-unit#` and three digits. Form errors appear only on failure and slide in with the button under them.
