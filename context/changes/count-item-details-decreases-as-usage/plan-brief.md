# Count item detail decreases as usage Plan Brief

> Full plan: `context/changes/count-item-details-decreases-as-usage/plan.md`
> Roadmap item: None. Linear TEC-57, GitHub issue 62.

## What and Why

A decrease saved on item details counts in the weekly usage rate, the same way a using scan does. The rate counts change rows with `quantity_delta` -1. Item details Save updates the inventory row and writes no change row, so those units are missing from the rate.

## Starting Point

`set_household_item_levels` updates quantity, minimum, and category when the stored quantity and category still match the page. It returns without inserting into `household_quantity_changes`. `decrement_household_quantity` inserts one row with `quantity_delta` -1 for a using scan. Both `scan_session_id` and `barcode` are `not null` because every existing row is a scan.

## Desired End State

Saving a count of 3 when the page loaded 5 writes two unreversed rows with `quantity_delta` -1. The weekly rate includes them. Saving a higher count, or saving the same count with a new minimum or category, writes no use row. A using scan still writes its own row and still counts.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Where the rows are written | Inside `set_household_item_levels`, after the inventory update matches | The count change and the use rows commit together. A stale save writes neither | TEC-57, current function |
| Row shape | One row per removed unit, `quantity_delta` -1, null scan session, null barcode | The rate counts rows, not a summed delta. A null session keeps the row out of the scan list | TEC-57, `load-scan-session-lines.ts` |
| Columns | Drop `not null` on `scan_session_id` and `barcode` | A manual save has no scan session and may have no barcode | Table definition |

## Scope

**In scope:** the column nullability change and the insert in `set_household_item_levels`.

**Out of scope:** tally `[-]` adjustments, stocking scans, undo, and the item page preview that already adds unsaved decreases to the displayed rate.
