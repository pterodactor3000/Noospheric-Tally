# Restock List by Shortfall Plan Brief

> Full plan: `context/changes/restock-list-by-shortfall/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-07)

## What and Why

A member needs one list of everything at or below its minimum, with the biggest shortfall first, to use while shopping. This is the slice that answers "what do I buy", and it covers FR-010 and FR-014. The same change also lets the item page show every barcode of an item and a redacted line when there is none.

## Starting Point

`/inventory` lists every item with Add item and Scan item, and colors each row by stock state. There is no restock list. `sortTallyLines` pins a count of 0 to the bottom, so it cannot rank by shortfall. The item page heading collapses to one stacked block below `sm`, shows at most one barcode, and hides the line when the item has none.

The delta is one pure ranking function, one server page with a list component, one button, and a reworked item heading with a loader that returns every barcode.

## Desired End State

The member taps Restock on `/inventory` and sees every item with `quantity <= minimumQuantity`, largest shortfall first, in two-line rows such as `Wet food` over `4 short 2`. Names link to the item. An item at 0 can rank first. A WARNING or IN STOCK item is absent. With nothing to restock the page says `Nothing needs restocking.`

On an item page, from `sm` up, the heading is two lines and shows every barcode oldest first. Below `sm` the barcode line is hidden until the member expands `Barcodes`. An item with no barcode shows ` ++  [REDACTED] ++`, which turns into `// NO BARCODE SUPPLIED //` on hover, focus, or tap. A separator sits under the heading.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Complexity | Medium | Several components and a loader change, no migration, auth, or write | Plan |
| Inclusion rule | `quantity <= minimumQuantity`, shortfall 0 included, via `getStockState === 'critical'` | The list and the CRITICAL label share one predicate | PRD Business Logic, FR-010, `stock-state.ts` |
| Ranking | Shortfall descending, then name A to Z with `localeCompare` | Urgency is the shortfall alone and category does not change it | PRD Business Logic, FR-014 |
| Tally sort reuse | None. A new `rankRestockLines` | `sortTallyLines` pins a count of 0 last, and 0 can have the largest shortfall | `sort-tally-lines.ts:42-46` |
| Row layout | Two lines, `{name} {dots}` then `{dots} {count} short {n}`, no `[-]` or `[+]` | Read-only shopping view, as decided with the user | Closed decisions |
| Row color | Critical text color, no `[CRITICAL]` chip | Every row is critical, so a chip adds noise | Closed decisions |
| Restock entry point | Full-width `Restock` button, `col-span-2`, same pattern as Add item and Scan item | Keeps the existing pair intact | Closed decisions |
| Back link | None added | `BackToInventoryLink` already covers `/inventory/restock` | `back-to-inventory-link.tsx:9-17` |
| Data | Existing `loadHabUnitTallyLines`, no migration or write | The restock list needs only quantity and minimum | Code |
| Item heading | Two lines from `sm` up, `text-base sm:text-lg`, separator below. Below `sm`, barcodes start hidden behind `Barcodes` | A long barcode list must not overflow a narrow heading | User confirmation 2026-10-30 |
| Barcode loader | `loadItemBarcodes` returns every barcode by `created_at` ascending, replacing `loadItemBarcode` | The old loader has `.limit(1)`, and the file name must match the export | Closed decisions, `load-item-barcode.ts:15-16` |
| Redacted line | A pure `getBarcodeLineText` owns the strings. A client button owns the reveal state | Tests cover the strings without rendering | Closed decisions |
| Reveal state | `isPinned` from a tap and `isPreviewed` from hover or focus. A second tap clears both | Touch fires no mouse leave, so a second tap would otherwise stay revealed | Plan |

## Scope

**In scope:**

- `rankRestockLines` and its tests
- `/inventory/restock` with the heading, the two-line rows, and the empty copy
- The `Restock` button on `/inventory`
- The item heading at 16px and 18px from `sm`, with a separator, and a `Barcodes` disclosure below `sm`
- `loadItemBarcodes`, `getBarcodeLineText`, and the redacted reveal control

**Out of scope:**

- WARNING rows on the restock list
- Category panels (S-11) and consumption rate (S-08)
- Editing a count from the restock list
- Changes to tally sort, search, or tally row layout
- Any migration, table, or write

## Approach

Three phases in dependency order. Phase 1 is a pure function with tests. Phase 2 renders it on a new server route that reuses the existing auth helpers and tally loader. Phase 3 reworks the item heading on its own: a pure text function, a loader that returns every barcode, and a small client control for the redacted reveal.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Rank the restock lines | `rankRestockLines` and tests, no page | A count of 0 must rank by shortfall, not last |
| 2. Show the restock page | `/inventory/restock`, two-line rows, Restock button | The two-line row layout and the new route in the worker build |
| 3. Split the item heading and list every barcode | Two-line heading from `sm`, collapsed barcodes below `sm`, separator, redacted reveal | Hover, focus, and tap on the redacted value, and the narrow disclosure |

## Risks and Assumptions

- Shortfall ordering can rank a large spice shortfall above a small pet food one. The roadmap records this as an unknown to settle by real use, not a blocker.
- Below `sm`, the barcode line starts hidden. A long list is shown only after `Barcodes` is expanded. From `sm` up, the value may wrap.
- The reveal behavior has no component test, because Vitest runs node-only `.ts` tests. Manual steps cover hover, focus, and tap.
- The separator margin (`my-2`) is a plan choice, because the closed decisions do not give a spacing.

## Success Criteria

- `/inventory/restock` lists every item at or below its minimum, largest shortfall first, with a count of 0 able to rank first.
- A WARNING or IN STOCK item never appears there, and an empty list says `Nothing needs restocking.`
- Restock is a full-width control under Add item and Scan item.
- From `sm` up the item heading is two lines and lists every barcode oldest first. Below `sm` the barcode line stays hidden until `Barcodes` is expanded. With no barcode, `[REDACTED]` reveals `// NO BARCODE SUPPLIED //`.
- `pnpm test`, `pnpm lint`, and `pnpm typecheck` pass on every phase, and `pnpm worker:check` passes on Phase 2.
