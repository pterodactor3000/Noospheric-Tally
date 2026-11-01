---
change_id: start-items-at-1-cap-99
title: Start new items at 1 and cap counts at 99
status: implementing
created: 2026-11-01
updated: 2026-11-01
archived_at: null
---

## Notes

No roadmap item. Linear TEC-50 (parent TEC-46). GitHub issue https://github.com/pterodactor3000/Noospheric-Tally/issues/49. TEC-50 blocks TEC-51, which is Done. Artifacts: `plan.md`, `plan-brief.md`.

Closed decisions from 2026-11-01. Complexity is Medium. The user approved three phases.

- New inventory rows start at 1 through the `household_inventory.quantity` column default. This covers every create path except bulk insert, which already sets 1.
- The count cap is 99 on increase and on save. It covers `[+]`, the item page stepper and Save, scan stocking, and reversal of a decrement.
- Counts already stored above 99 are clamped to 99 once in the migration, with no restore. A check constraint for 0 through 99 follows. Save works for every row.
- A refused increment writes nothing. The refusal text is `The count cannot go above 99.`
- The minimum cap stays 999.
- Bulk insert and TEC-51 stay out of scope.
