---
change_id: restock-list-by-shortfall
title: Restock list by shortfall
status: implementing
created: 2026-10-30
updated: 2026-10-30
archived_at: null
---

## Notes

Roadmap: `context/foundation/roadmap.md` (S-07), PRD FR-010, FR-014. Linear TEC-31. GitHub issue https://github.com/pterodactor3000/Noospheric-Tally/issues/9. Artifacts: `plan.md`, `plan-brief.md`.

Closed decisions from 2026-10-30. Complexity is Medium. The user approved three phases: rank the restock lines, show the restock page, then split the item heading and list every barcode.

Restock list:

- The route is `/inventory/restock`. A full-width `Restock` button sits under Add item and Scan item on `/inventory` (`col-span-2`, `variant="outline"`, `nativeButton={false}`, `render={<Link />}`).
- A line is included when `quantity <= minimumQuantity`, so a shortfall of 0 stays on the list. A line with `quantity > minimumQuantity` (WARNING and IN STOCK) is left off.
- `shortfall = minimumQuantity - quantity`. The largest shortfall comes first. Equal shortfalls sort by name A to Z with `localeCompare`. A count of 0 can rank first, so `sortTallyLines` is not reused, because it pins a count of 0 to the bottom.
- From `sm` up each row is one line: `{name} {dots} {count} // [{n} short]`, for example `4 // [2 short]`. Below `sm` the row is two lines: `{name} {dots}`, then `{dots} {count} // [{n} short]`. The name links to `/inventory/{itemId}`. The row has no `[-]` or `[+]`. Dots are `aria-hidden`.
- Every item row in the tally, the restock list, the scan session list, and the attach list starts with an `aria-hidden` `>`.
- Row text uses the critical stock color. The row has no visible `[CRITICAL]` chip.
- The heading is `Restock`. The empty copy is `Nothing needs restocking.`
- `BackToInventoryLink` already covers `/inventory/restock`, so no second back link is added.
- The page reuses `requireCurrentUser`, `requireCurrentHabUnit`, and `loadHabUnitTallyLines`. There is no new table, migration, or write.

Item page `/inventory/{itemId}` (Phase 3 only):

- From `sm` up the heading is two lines. Line 1 is `[{STATUS}] {name} {dots}` with the status bold and in the stock color. Below 460px the visible status is the initial: `[C]`, `[W]`, or `[I]`. The full word stays available to assistive tech. Line 2 is `{dots} ++ {barcodes} ++` and keeps the decoration ` ++  ${value} ++` exactly. Below `sm`, line 2 starts hidden. The name is a label with `onClick`, and clicking it expands and collapses line 2 with the grid-row and slide animation. There is no `Barcodes` button and no name button.
- Barcodes are every barcode of the item, oldest first by `created_at`, joined with `, `. `loadItemBarcode` is replaced by a loader that returns every barcode, and `ItemLevelEditor` takes the full list.
- With no barcodes, line 2 stays and reads ` ++  [REDACTED] ++`. Hover, keyboard focus, or a tap swaps the whole decorated value for `// NO BARCODE SUPPLIED //`. A second tap returns to resting. Mouse leave or blur returns to resting unless a tap toggled it on. The control's accessible name is `// NO BARCODE SUPPLIED //` throughout.
- The heading is 16px, and 18px from `sm` (`text-base sm:text-lg`). Count and Minimum stay at 14px and 16px from `sm`. A horizontal `Separator` sits under the heading, above Count. It is 2px thick, the same as `border-2`, with a slight primary glow.
- The resting and hover strings come from one pure function so tests cover them without rendering.

Out of scope: WARNING rows on the restock list, category panels (S-11), consumption rate (S-08), editing a count from the restock list, changes to tally sort, search, or row layout, and any migration.
