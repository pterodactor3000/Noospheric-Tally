# Shop Barcode Lookup Plan Brief

> Full plan: `context/changes/shop-barcode-hab-unit-lookup/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-09)

## What and Why

A member scans a shop barcode from a separate lookup control and sees whether that item is already in the hab unit. A barcode the household does not hold is blocked in that view, so a global catalog hit cannot look like stock on the shelf. This is roadmap S-09 and PRD FR-017.

## Starting Point

`loadHabUnitItemByBarcode` already returns the household row or null. The create scan does the opposite: a miss redirects to `/inventory/new` and then the global item and the external catalog. `ScanCapture` is bound to stocking and using, so the lookup needs its own capture. `/inventory` shows Add item, Scan item, and a full-width Restock button. The tally list grows with the page, so a long list pushes the title, search, and buttons off screen.

The delta is one pure display function, one read-only `/inventory/lookup` route, a Lookup button beside Restock, and a max-height tally whose list is the only scroller.

## Desired End State

The member opens Lookup, scans or types a barcode, and sees the name, count, and stock label when the item is in the hab unit. Otherwise the page says `Not in your hab unit.` and the scanner stays ready for the next code. Nothing is written, and there is no path to create from that view. On `/inventory`, Restock and Lookup share a row, and a long tally scrolls inside the list while the title, search, and buttons stay put.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Complexity | Low | One read-only route, no migration or write | Plan, user confirmation 2026-10-30 |
| Found result | Name, count, and stock label | The household row is already loaded and answers whether the item is needed | User confirmation 2026-10-30 |
| Blocked result | `Not in your hab unit.`, scanner stays live, no create link | FR-017 blocks the scan in the lookup view | User confirmation 2026-10-30, FR-017 |
| Read path | `loadHabUnitItemByBarcode` only | A global or catalog read would treat a missing household row as present | FR-017, `load-hab-unit-item-by-barcode.ts` |
| Read failure | Distinct message, never the blocked notice | A failed read must not look like a real miss | Code, no `error.tsx` |
| Lookup entry | Side by side with Restock | User chose this over a full-width button under Restock | User confirmation 2026-10-30 |
| Tally chrome | Section max height, only the list scrolls | Title, search, and buttons stay visible | User confirmation 2026-10-30 |
| Phase 3 sign-off | Screenshots before the manual check is done | The user reviews the layout and may request tweaks | User confirmation 2026-10-30 |

## Scope

**In scope:**

- Pure lookup display result for a household row or null.
- `/inventory/lookup` with scan, manual entry, found notice, blocked notice, invalid barcode, and read failure.
- Lookup button beside Restock.
- Max-height tally section with a scrolling item list.

**Out of scope:**

- Creating an item, catalog lookup, or a global-item answer.
- Stocking mode, using mode, and session undo.
- Category panels (S-11) and the consumption rate view (S-08).
- A migration, new table, or write.
- A component test harness.

## Approach

Phase 1 adds `resolveLookupDisplay` and tests, with no page. Phase 2 adds the route and a lookup capture that reads only the household loader. Phase 3 places Lookup beside Restock and caps the tally so only the list scrolls. Phase 3 stops for screenshots.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Resolve a lookup result | Pure found or blocked result, tested | Reusing `resolveScanDisplay` would send a miss to create |
| 2. Lookup route and capture | `/inventory/lookup` reads the household only | A thrown read shown as "not in hab unit" |
| 3. Lookup button and fixed tally chrome | Side-by-side buttons, scrolling list | The list scroller fails to shrink, so the buttons still leave the screen |

## Risks and Assumptions

- `find_item_by_barcode` is not household-scoped. The lookup must ignore a global hit that has no household row. `loadHabUnitItemByBarcode` already does that.
- `BarcodeScanner` keeps reading while `holdBarcode` matches the last code. A different code still submits.
- The tally max height depends on a bounded flex parent. The list needs `min-h-0` or it will not scroll.

## Success Criteria

- A household barcode shows name, count, and stock label.
- Any other barcode shows `Not in your hab unit.` with the scanner still live and no create link.
- A read failure is not that notice.
- On `/inventory`, Restock and Lookup share a row, and only the item list scrolls.
