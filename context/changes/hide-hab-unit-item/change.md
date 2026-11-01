---
change_id: hide-hab-unit-item
title: Hide an item from the hab unit tally
status: planned
created: 2026-11-01
updated: 2026-11-01
archived_at: null
---

## Notes

No roadmap item. Linear TEC-49, https://linear.app/tech-heresy/issue/TEC-49/feat-hide-an-item-from-the-hab-unit-tally. Artifacts: `plan.md`, `plan-brief.md`.

Outcome: a member can hide an item from this hab unit's tally without deleting the shared catalog item.

Acceptance criteria (confirmed product contract):

- Given an item on the hab unit tally, when the member opens its details and uses the hide control, then that item no longer appears on the tally.
- The hide control is on the item details page.
- Hiding drops the item from this hab unit's tally. It does not delete the shared catalog item.

Closed decisions from 2026-11-01. The user told the parent to take the issue and run it, so these were taken from the contract and the current code. There was no interview.

- Complexity is Medium. Two phases: a database function and its wrapper, then the server action and the control.
- "Hide" removes the hab unit's `household_inventory` row for that item. The rows in `items` and `item_barcodes` stay. No `is_hidden` column is added. See `plan.md`, Implementation Approach, for why.
- The write goes through one new `security definer` function, `hide_household_item`, because `household_inventory` has only a select policy for members.
- Hiding an item that is already off the tally is a no-op, not an error.
- No confirmation dialog. The control acts on one press.
- No unhide control. The contract does not require one, and the code does not make the criteria unsatisfiable. A hidden item that has a barcode returns through the existing scan, lookup, or add flow, which finds the catalog item and adds it back. See `plan.md`, Critical Implementation Details.

Known consequence, recorded and accepted: hiding discards that hab unit's count, minimum, category, and quantity change history for the item. An item without a barcode has no scan or lookup path back, so it stays in the catalog and cannot be re-added by the existing flows.

Out of scope: tally layout, dropdown alignment, count width, dropping the panel, scan, popups, landing copy, categories, sharing, bulk insert, count default, the count cap, an unhide control.
