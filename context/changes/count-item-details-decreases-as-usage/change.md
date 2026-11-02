---
change_id: count-item-details-decreases-as-usage
title: Count item detail decreases as usage
status: implementing
created: 2026-11-02
updated: 2026-11-02
archived_at: null
---

## Notes

No roadmap item. Linear TEC-57 (parent TEC-46). GitHub issue https://github.com/pterodactor3000/Noospheric-Tally/issues/62. Artifacts: `plan.md`, `plan-brief.md`.

The weekly rate counts `household_quantity_changes` rows with `quantity_delta` -1. A using scan already writes one such row. Saving a lower count on item details updates `household_inventory` and writes none. This change writes one row per unit removed inside `set_household_item_levels`, after the inventory update succeeds. A raise, a minimum-only save, and a category-only save write none. The rows have a null scan session and a null barcode, so they stay out of the scan session list.
