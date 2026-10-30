# Inventory Category Panels Plan Brief

> Full plan: `context/changes/inventory-category-panels/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-11)

## What and Why

A member sees the inventory grouped into five collapsible category panels, edits an item's category, and sees a warning icon on any panel that holds a WARNING or CRITICAL item. A new item is filed by the first Open Facts catalog that answers HTTP 200. This is roadmap S-11 and PRD FR-018, so the household can scan the shortages by kind of item instead of one long list.

## Starting Point

The inventory is one flat list with search and sort. No category exists in the code or the database. `household_inventory` is written only through `security definer` RPCs. The Open Facts lookup races four catalogs and knows which answered first, but it returns only a name and drops the winner. One row reader, `readHabUnitTallyLine`, serves three loaders, so a new field must reach all three. The item page saves count and minimum together through `set_household_item_levels`.

The delta is a category column, a category on every loader, a category in the lookup result and the create RPC, a panel stack in the tally, and a category control saved by the existing Save.

## Desired End State

`/inventory` shows Pet food, Food, Beauty, Other, and Uncategorized panels. A panel with a shortage starts open and shows a warning icon. A name search opens every panel with a match. A scanned item lands in the category of the catalog that answered first. On the item page the member changes the category and saves it with count and minimum, and the panels follow.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Complexity | Medium | A migration, two RPC changes, a lookup contract change, and new UI | Plan, user confirmation 2026-10-30 |
| Storage | Column on `household_inventory` | `items` is shared across households, so a per-household category cannot live there | Code, user confirmation 2026-10-30 |
| Starting category | `uncategorized` for existing rows, no-barcode items, and add-from-global items | The roadmap default, and no catalog call happens on those paths | Roadmap S-11, user confirmation 2026-10-30 |
| First-response rule | Beauty, food, pet food, products map to beauty, food, pet-food, other by catalog index | FR-018 and the Business Logic paragraph | PRD FR-018 |
| Blank name from a 200 | Category still set from the winner, name stays manual | FR-018 says the first response sets the category | User confirmation 2026-10-30 |
| Category edit | Item page control saved with Save, one extended RPC | Matches the S-05 rule that edits stay local until Save, and keeps the save atomic | User confirmation 2026-10-30 |
| Panel state | A shortage panel starts open, the rest closed, search opens matches, nothing persists | Shortages show first and a search never hides its match | User confirmation 2026-10-30 |
| Panels shown | All five, including empty ones | PRD Business Logic | PRD FR-018 |
| Icon scope | The whole category, not the search result | A search must not hide a shortage | Plan |
| Restock ranking | Unchanged | Category does not change urgency | PRD Business Logic |
| Stray `debugger` | Removed in Phase 2 | It sits in the file Phase 2 edits | User confirmation 2026-10-30 |
| Prerequisite | S-06, with S-10 retired and merged into it | The roadmap wins over the Linear text | Roadmap S-06, S-11 |

## Scope

**In scope:**

- A category column, type, and read path on every loader.
- First-response categorization at create time, through the lookup result, the create RPC, the action, and the form.
- Five collapsible panels with search, sort, steppers, and a shortage icon.
- A category control on the item page saved with count and minimum.
- Removing the stray `debugger` in `src/lib/catalog/lookup-catalog-name.ts`.

**Out of scope:**

- Restock ranking, a category filter or sort, and categories on the scan or lookup pages.
- A category on `items`, or categorizing existing rows from the catalog.
- Catalog calls for add-from-global and no-barcode items.
- Saved panel state and user-defined categories.
- A component or browser test harness.
- The muted green restyle (S-13) and the consumption rate view (S-08).

## Approach

Phase 1 adds the column, the shared category type, and the read path. Phase 2 passes the winning catalog's category through the lookup, the create RPC, and the create form. Phase 3 groups the tally into panels with three small pure functions and one presentational component. Phase 4 extends the level save to carry a category and adds the item-page control.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Category column and read path | Every row has a category, existing rows are `uncategorized`, every loader returns it | A select that omits the field makes every loader throw |
| 2. First-response categorization | A scanned item is filed by the first catalog to answer, and the `debugger` is gone | The category array drifting out of order with the URL array |
| 3. Collapsible panels with shortage icon | Five panels, derived open state, warning icon | The panel stack breaks the scroll rule that keeps the buttons visible |
| 4. Edit category on the item page | Category saved with count and minimum in one RPC | A signature change deployed apart from its migration |

## Risks and Assumptions

- Phases 2 and 4 drop and recreate an RPC. The migration and the code must ship together, as `20261030100414` did.
- The same barcode can be filed differently on another scan when a different catalog answers first. The member edits the category, and the panels follow the edited value.
- A bare SQL session cannot call the RPCs, so their category checks are a second guard behind the action's `isItemCategory` check.
- There is no component test harness, so the panels and the control are checked by hand.

## Success Criteria

- Five panels render in order, including empty ones, and every existing item sits in Uncategorized after the migration.
- A scanned food barcode is filed in the category of the catalog that answered first.
- A panel with a WARNING or CRITICAL item starts open with a warning icon, and the other panels start closed.
- A name search opens only the panels with a match, and the icon ignores the search.
- Changing the category on the item page and pressing Save moves the item to the new panel.
- The restock list is unchanged.
