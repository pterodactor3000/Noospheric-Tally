# Consumption Rate View Plan Brief

> Full plan: `context/changes/consumption-rate-view/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-08)

## What and Why

FR-015 asks for a view of how fast each item is used up. The change log already stores using scans. This change counts the unreversed ones from the last 7 * 24 hours and shows that count on the item page.

## Starting Point

`/inventory/[itemId]` shows the name, barcodes, Count, and Minimum. Using scans write `household_quantity_changes` with `quantity_delta` -1. Hand adjustments update the count and write no log row. Nothing on the item page reads that log.

## Desired End State

Under Minimum, a `Use` row reads `{n} per week`, or `No use recorded` when the window is empty. Undo removes a scan from the count. Stocking and hand adjustments do not.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Complexity | Medium | One read, one screen, no new table | plan |
| Rate | Unreversed using scans over the last 7 * 24 hours, shown as `{n} per week` | A fixed instant window is testable, and the copy matches a weekly rate | plan |
| Screen | `Use` row on `/inventory/[itemId]`, under Minimum | The item page already holds this item's count and minimum | plan |
| Empty history | `No use recorded` when the count is 0 | A zero rate would read as proof the item is never used | plan |
| Hand adjustments | Excluded | `adjust_household_quantity` does not write the change log | plan |
| Household scope | Existing select policy, no extra `household_id` filter | Same boundary as the item load | plan |

## Scope

**In scope:**

- Format a count as `No use recorded` or `{n} per week`
- Count unreversed using scans for one item in the last 7 * 24 hours
- Show that text on the item page

**Out of scope:**

- Tally or restock columns, a separate page, and charts
- Other windows, stocking scans, reversed scans, and hand adjustments
- A migration, a new policy, or a new index
- S-09, S-11, and roadmap edits

## Approach

A pure formatter owns the copy. A head count on `household_quantity_changes` owns the number. The item page loads the item first, then passes the formatted string into the existing editor as a read-only row.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Count unreversed using scans | Formatter and loader, with tests for 0, the window start, and query failures | An off-by-one window, or counting reversed and stocking rows |
| 2. Show the rate on the item page | `Use` row under Minimum | The row changes Count, Minimum, or Save |

## Risks and Assumptions

- Early households will often see `No use recorded`. That is the accepted FR-015 risk.
- The change log has no `item_id` index. One item's count is a small read for one household, so this change adds no index.
- The roadmap row for S-04 still says ready. The using-mode change is on main at `6de331f`, and the log table is present.

## Success Criteria

- An item with no unreversed using scan in the last 7 * 24 hours shows `No use recorded`.
- One using scan shows `1 per week` after reload, and undo returns `No use recorded`.
- A stocking scan and a hand adjustment do not change the Use value.
- Count, Minimum, and Save still work.
