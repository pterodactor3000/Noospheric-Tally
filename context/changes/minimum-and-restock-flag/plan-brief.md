# Minimum and Restock Flag Plan Brief

> Full plan: `context/changes/minimum-and-restock-flag/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-06, with S-10 merged)

## What and Why

A member needs to see, for each item, its count and whether it needs restocking. Today the app stores counts but no minimum, so it cannot answer that. This change adds a minimum per item, 3 by default, and shows CRITICAL, WARNING, or IN STOCK from the count and the minimum (FR-007, FR-008, US-02).

## Starting Point

`household_inventory` has a quantity with a floor of 0, and no minimum column. Every write goes through a `security definer` RPC. The inventory list shows each name and count, with no link to the item. The scan result card shows a name and count in neutral colors. The FR-008 stock color tokens exist but nothing uses them. The roadmap still splits this work into S-06 and S-10, while the PRD already describes the merged behavior.

The delta is a roadmap merge, a minimum column with a range check and a write RPC, pure stock rules, an item page with a minimum form, and stock colors on the tally rows, the item page, and the scan result card.

## Desired End State

Every item starts with a minimum of 3 and keeps its count. Each tally row is red, yellow/gold, or green by stock state, and a screen reader hears the state name. Tapping a name opens `/inventory/{itemId}`, which shows the name, count, minimum, and state name in the state's color. On that page the member can save a whole number from 0 to 999, and a blank field saves 3. After a scan, the result card takes the item's new state color.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Complexity | Medium | One additive column and RPC, a pure rule function, one new route, and changes to existing screens. No auth change or new integration | User confirmation 2026-10-30 |
| Scope | Merge S-10 into S-06: default minimum 3 and the three labels. Phase 1 edits the roadmap | The PRD already states this behavior in FR-007, FR-008, and US-02 | User confirmation 2026-10-30 (Q1) |
| Where the minimum is set | New item page `/inventory/[itemId]`, opened from the item name, with name, count, minimum, state, and a minimum form | Gives US-02 "views the item" a screen and keeps the tally row free for S-05 | User confirmation 2026-10-30 (Q2) |
| How the state shows | The whole row or card takes the stock color, with no text chip on the tally row or scan result. The item page names the state | User choice. Uses the existing FR-008 tokens | User confirmation 2026-10-30 (Q2) |
| Minimum values | Whole number 0 to 999, checked in the server action and by a database check | A bounded value at the boundary and in the schema | User confirmation 2026-10-30 (Q3) |
| Blank field | Saves 3. Null is never stored | The merge removes the nullable minimum | User approval 2026-10-30 |
| Default location | Column default and `DEFAULT_MINIMUM_QUANTITY`. The action always sends a number | Existing rows get 3 from the column, and the app never relies on the column default | User approval 2026-10-30 |
| Accessibility | Screen-reader-only state name on colored rows and the scan result | Color alone does not carry the state | User approval 2026-10-30 |
| Write path | New `security definer` RPC `set_household_minimum_quantity`, no update policy | Matches every existing write | plan |
| Item id check | Reuse `isScanSessionId` as the UUID guard | Same precedent as the change id check in `actions.ts` | plan |

## Scope

**In scope:**

- Roadmap edit that merges S-10 into S-06 and points S-11 at S-06
- `minimum_quantity` column, range check, and `set_household_minimum_quantity` RPC
- `getStockState`, the default and range constants, and the label text
- `/inventory/[itemId]` item page and minimum form, with a server action and validation
- Stock colors and screen-reader state names on tally rows and the scan result card

**Out of scope:**

- Restock list and shortfall ordering (S-07)
- Category panels and the category warning icon (S-11)
- Name search and hand adjustment (S-05). The `[-]` and `[+]` buttons stay disabled
- Editing names or barcodes on the item page
- New stock colors or token changes
- PRD edits, S-04 status fixes, and archiving
- Linear and GitHub tracker changes, including closing TEC-34

## Approach

Edit the roadmap first so the code builds a named slice. Add the minimum as a `not null default 3` column with a 0 to 999 check, so existing rows get 3 without touching counts, and write it through one new RPC that follows `reverse_quantity_change`. Put the bands in one pure function and the colors in one class map, and use them on the item page, the tally rows, and the scan result card.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Merge S-10 into S-06 in the roadmap | Roadmap with one slice for the minimum and labels, S-11 pointing at S-06 | A stray S-10 reference left behind |
| 2. Store the minimum and add the stock rules | Column, check, RPC, wrapper, stock rules, loaders returning the minimum | Deploying the code before the migration breaks the inventory and scan pages |
| 3. Add the item page and the minimum form | `/inventory/[itemId]` with count, minimum, state, and a validated form | Showing another household's item if RLS or the id guard is bypassed |
| 4. Color the tally rows and the scan result | Stock colors and screen-reader state names on rows and the card | Tailwind drops classes built from template strings |

## Risks and Assumptions

- The migration must reach the database before the Phase 2 build deploys.
- The default of 3 lives in two places. A unit test pins the code constant, and the plan names both.
- RLS on `household_inventory` is the only thing that hides another household's item on the item page.
- The stock token pairs keep their computed contrast of at least 4.6:1 when they fill a whole row.
- Assumption: the primary user can check the screen-reader output with VoiceOver or TalkBack on his phone.

## Success Criteria

- Every existing item has a minimum of 3 and an unchanged count after the migration.
- With a minimum of 3, counts 0 to 3 are red CRITICAL, 4 and 5 are yellow/gold WARNING, and 6 or more are green IN STOCK, on the tally row, the item page, and the scan result card.
- The member can save a minimum from 0 to 999 on the item page, and a blank field saves 3.
- An invalid minimum is refused with a visible message and changes nothing.
- Another household's item, or a malformed item id, shows the not-found page.
