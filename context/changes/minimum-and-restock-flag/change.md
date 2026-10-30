---
change_id: minimum-and-restock-flag
title: Minimum and restock flag
status: implementing
created: 2026-10-30
updated: 2026-10-30
archived_at: null
---

## Notes

Roadmap: `context/foundation/roadmap.md` (S-06), PRD FR-007, FR-008, US-02. Linear TEC-30. GitHub issue https://github.com/pterodactor3000/Noospheric-Tally/issues/8. Artifacts: `plan.md`, `plan-brief.md`.

Closed decisions from 2026-10-30. Complexity is Medium. S-10 (shortage-threshold-labels) merges into S-06, so this change covers the default minimum of 3 and the CRITICAL, WARNING, and IN STOCK labels, and the roadmap edit is Phase 1. The minimum is set on a new item page at `/inventory/[itemId]`, opened from the item name. The stock state colors the whole tally row, the scan result card, and the item page with the existing FR-008 tokens, with no text chip on the row or the card. The item page names the state. A minimum is a whole number from 0 to 999, enforced in the server action and by a database check. A blank field saves 3. The default of 3 lives in the column default and a shared code constant. Colored rows and the scan result carry the state name as screen-reader-only text.
