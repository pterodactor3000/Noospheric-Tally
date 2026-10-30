# Inventory Category Panels Implementation Plan

## Overview

A member sees the inventory grouped into collapsible category panels, edits an item's category, and sees a warning icon on any panel that holds a shortage. The panels are pet food, food, beauty, other, and uncategorized. A new item is filed by the first Open Facts catalog that answers HTTP 200 for its barcode. This is roadmap S-11 and covers PRD FR-018 and story US-04.

The category is a column on `household_inventory`. Four phases add the column and its read path, set it at create time, render the panels, and edit it on the item page.

## Current State Analysis

- No category exists anywhere in `src` or `supabase`. `household_inventory` has `id`, `household_id`, `item_id`, `name`, `quantity`, and `created_at` (`supabase/migrations/20260916120209_create_items.sql:24-37`), plus `minimum_quantity` (`supabase/migrations/20261030055001_add_household_minimum_quantity.sql:1-6`).
- `household_inventory` has only a member select policy (`supabase/migrations/20260916120209_create_items.sql:43-53`). Every write goes through a `security definer` RPC, so a category write needs an RPC change.
- `items` is global and shared. `find_item_by_barcode` matches every `item_barcodes` row (`supabase/migrations/20260916120209_create_items.sql:55-86`). A per-household category cannot live there.
- `create_item(item_name, item_barcode)` inserts the item, the barcode, and the `household_inventory` row (`supabase/migrations/20260916120209_create_items.sql:89-141`). `add_item_to_household` (`:143-194`) and `create_item_without_barcode` (`supabase/migrations/20261030081821_create_item_without_barcode.sql:1-42`) insert a row with no category, so they take the column default.
- `set_household_item_levels(target_item_id, new_quantity, new_minimum_quantity, expected_quantity)` updates quantity and minimum, and raises `serialization_failure` on a stale count (`supabase/migrations/20261030100414_set_household_item_levels_expected_quantity.sql:1-70`). That migration dropped and recreated the function, which is the precedent for a signature change.
- `HabUnitTallyLine` is `itemId`, `name`, `quantity`, `minimumQuantity` (`src/lib/items/load-hab-unit-items.ts:5-10`). `readHabUnitTallyLine` validates a row and returns `null` on a bad one (`src/lib/items/load-hab-unit-items.ts:43-66`). Three loaders share it: `loadHabUnitTallyLines` selects at `:74`, `loadHabUnitItemById` selects at `src/lib/items/load-hab-unit-item-by-id.ts:12`, and `loadHabUnitItemByBarcode` selects at `src/lib/items/load-hab-unit-item-by-barcode.ts:44` with a local row type at `:17-22`. A select that omits a new required field would make every loader throw.
- `rankRestockLines` rebuilds each line field by field (`src/lib/items/rank-restock-lines.ts:16-22`), and `RestockLine` extends `HabUnitTallyLine` (`:4-6`). Its test builds lines by hand (`src/lib/items/rank-restock-lines.test.ts:12-26`).
- The inventory page loads the lines and renders `InventoryTally` (`src/app/inventory/page.tsx:45`, `:57`). `InventoryTally` holds the search and sort state (`src/app/inventory/inventory-tally.tsx:71-84`), returns `Nothing is added here yet.` for no lines (`:79-81`), and renders one flat `ul` that scrolls (`:33-41`, `:127-160`). Each row computes `getStockState` and passes the label and color to `TallyCountControls` (`:132-143`).
- Stock labels are `CRITICAL`, `WARNING`, and `IN STOCK` (`src/lib/items/stock-state.ts:5-10`). `getStockState` returns `critical` at `quantity <= minimumQuantity` and `warning` below twice the minimum (`:19-32`). Colors are tokens in `src/app/styles/globals.css:25-31`, mapped in `src/app/styles/stock-state-class-names.ts:11-15`.
- The Open Facts lookup builds four URLs in the order beauty, food, pet food, products (`src/lib/catalog/lookup-catalog-name.ts:46-51`) and awaits `Promise.any` (`:57`). `winningCatalog.index` names the first HTTP 200 (`:76`, `:82`), and the lookup then discards it. The result is `found` with a name or `empty` (`:3-13`, `:85-99`). A 200 with a blank name returns `empty` (`:84-89`), and a test pins that (`src/lib/catalog/lookup-catalog-name.test.ts:194-213`). `readCatalogName` contains a stray `debugger` at `:21`.
- The create page calls the lookup and `loadHabUnitItems` together, then passes `defaultName` to `ItemCreateForm` (`src/app/inventory/new/page.tsx:64-83`). `ItemCreateForm` posts a hidden `barcode` field (`src/app/inventory/new/item-create-form.tsx:133`) to `createItem` (`src/app/inventory/actions.ts:100-154`). `createItem` calls `createNewItem(name, barcode)` at `:129`. `createNewItem` has no test and no injected client (`src/lib/items/create-new-item.ts`). `createNewItemWithoutBarcode` is the injected-client pattern to follow (`src/lib/items/create-new-item-without-barcode.ts:3-33`, test `src/lib/items/create-new-item-without-barcode.test.ts`).
- The item page loads one `HabUnitTallyLine` and passes its fields to `ItemLevelEditor` (`src/app/inventory/[itemId]/page.tsx:51-58`). The editor keeps count and minimum in local state (`src/app/inventory/[itemId]/item-level-editor.tsx:164-182`), posts hidden fields (`:186-189`), and Save calls `saveItemLevels` (`:178-179`). `saveItemLevels` validates every field, calls `setHabUnitItemLevels`, and revalidates `/inventory` and the item page (`src/app/inventory/actions.ts:365-421`). `setHabUnitItemLevels` wraps the RPC (`src/lib/items/set-hab-unit-item-levels.ts:39-62`), and its test pins the argument object (`src/lib/items/set-hab-unit-item-levels.test.ts:9-28`).
- A collapsible pattern exists: a button with `aria-expanded` and `aria-controls`, a chevron, and a `grid-rows-[1fr]` and `[0fr]` transition with `inert` when closed (`src/app/inventory/new/item-create-form.tsx:56-66`, `:170-204`). `src/components/ui/` has no Collapsible or Accordion.
- `src/components/ui/` has no select. `ItemLevelEditor` styles its controls with `itemControl` from `src/app/inventory/[itemId]/barcode-line.tsx:11`.
- Vitest runs `src/**/*.test.ts` in the node environment (`vitest.config.mts:14-17`). There is no component test harness, so React components are checked by hand.

## Desired End State

`/inventory` shows five collapsible panels in this order: Pet food, Food, Beauty, Other, Uncategorized. Each holds its items with the same row, search, sort, and count steppers as today. A panel that holds a WARNING or CRITICAL item starts open and shows a warning icon. The other panels start closed. A name search opens every panel that has a match. All five panels always render, including empty ones.

A barcode scanned into the create flow is filed by the first catalog that answers HTTP 200. An item with no barcode, an item added from the global table, and every existing row sit in Uncategorized. On the item page the member picks a category and saves it with count and minimum in one Save. The panels follow the saved value.

Verify with the automated checks and manual steps of each phase.

## What We're NOT Doing

- Changing the restock ranking or the restock page. Category does not change urgency (PRD Business Logic).
- A category on `items`, or any change to the global item record.
- Categorizing existing rows from the catalog. They start as `uncategorized`.
- Calling the catalog for an add-from-global item or an item with no barcode.
- Editing a category from the inventory list. The edit lives on the item page.
- A category filter, a category sort, or a category on the scan result card or lookup page.
- New categories beyond the five, or user-defined categories.
- Saving panel open state between visits.
- A component or browser test harness. Vitest stays on `src/**/*.test.ts`.
- Removing other `console.log` calls in the catalog files. Only the `debugger` is removed, and only in Phase 2.
- The muted green restyle (S-13) and the consumption rate view (S-08).

## Implementation Approach

Follow the S-05, S-07, and S-09 split. Pure logic and tests come first, then data, then UI.

1. Phase 1 adds the category column, the shared category type, and the read path. Every loader returns a category. Nothing writes one yet, so every row reads `uncategorized`.
2. Phase 2 sets the category at create time from the winning catalog and removes the stray `debugger`.
3. Phase 3 groups the tally into panels. It adds three small pure functions with tests and one presentational panel component.
4. Phase 4 extends the level save to carry a category and adds the item-page control.

Every migration is a new file with a timestamp later than `20261030100414`. Phases 2 and 4 drop and recreate an RPC, as `20261030100414` did.

## Critical Implementation Details

**The category value set.** The stored values are `pet-food`, `food`, `beauty`, `other`, and `uncategorized`. The database check constraint, the TypeScript union, and the panel order all use this set. `src/lib/items/item-category.ts` owns it. Panel order is the order in `ITEM_CATEGORIES`, which follows FR-018: pet food, food, beauty, other, uncategorized.

**One shared row reader.** `readHabUnitTallyLine` serves three loaders. Phase 1 changes all three selects and the reader together. Changing the reader alone makes every inventory page throw, because a row with no `category` reads as `null`.

**Catalog index to category.** The lookup URL order is beauty, food, pet food, products. The category list in `lookup-catalog-name.ts` must follow the same order, in the same file, next to the URL array, so an edit to one is visible beside the other. A 200 with a blank name or a body that is not JSON still returns the winning catalog's category. `Promise.any` rejecting, which means no catalog answered, returns `uncategorized`.

**Untrusted category fields.** `createItem` and `saveItemLevels` read the category from a form field. Narrow it with `isItemCategory`. The member can only forge a value for their own household, so a bad value is not a security event, but it must never reach the RPC. `createItem` falls back to `uncategorized` and logs. `saveItemLevels` returns the write failure message, the same as a bad item id.

**Panel open state.** The initial state is derived, not stored. A panel is open when the member toggled it, otherwise when the search is non-empty and the panel has a match, otherwise when the search is empty and the panel holds a shortage. Typing in the search clears every manual toggle, so a search always shows its matches. The shortage icon reads the whole category, never the filtered list.

**Tally scroll.** The S-09 rule still holds. The title, the search row, and the action buttons stay visible, and only the list scrolls. After Phase 3 the scroller is the stack of panels, not a single `ul`. Keep `min-h-[36px]` and `flex-1` on it and keep the component root `contents`.

---

## Phase 1: Add the category column and read path

### Overview

Every `household_inventory` row has a category from the five values. Existing rows read `uncategorized`. Every loader returns it. No page shows it yet and nothing writes it.

### Changes Required

#### 1. Category column

**File:** `supabase/migrations/20261030190000_add_household_inventory_category.sql` (new)

**Intent:** Store the category on the household row and keep existing rows safe.

**Contract:**

- `alter table public.household_inventory add column category text not null default 'uncategorized'`.
- A check constraint named `household_inventory_category_values` limits `category` to `pet-food`, `food`, `beauty`, `other`, and `uncategorized`.
- The default backfills every existing row. No row is deleted or rewritten otherwise.
- No new policy and no new function. The existing select policy already covers the column.

#### 2. Category type and guard

**File:** `src/lib/items/item-category.ts` (new)

**Intent:** One owner of the category set, its panel order, and its labels. The file name matches the primary export.

**Contract:**

- `ITEM_CATEGORIES` is a readonly tuple in panel order: `pet-food`, `food`, `beauty`, `other`, `uncategorized`.
- `ItemCategory` is the union of those values, derived from the tuple.
- `DEFAULT_ITEM_CATEGORY` is `'uncategorized'`.
- `ITEM_CATEGORY_LABELS` maps each category to `Pet food`, `Food`, `Beauty`, `Other`, and `Uncategorized`.
- `isItemCategory(value: unknown): value is ItemCategory` is pure and returns `false` for a non-string and for a string outside the set.
- The file imports no `next/*`, `react`, or Supabase module.

#### 3. Category tests

**File:** `src/lib/items/item-category.test.ts` (new)

**Intent:** Pin the set, the order, and the guard.

**Contract:** Vitest tests with `toEqual`. Test names state behavior:

- lists the categories in panel order
- returns true for each stored category value
- returns false for an unknown string
- returns false for an empty string
- returns false for null, undefined, and a number
- labels every category

#### 4. Tally line and loaders

**File:** `src/lib/items/load-hab-unit-items.ts`

**Intent:** Carry the category on every tally line.

**Contract:**

- `HabUnitTallyLine` gains `readonly category: ItemCategory`.
- `readHabUnitTallyLine` reads `category` and returns `null` when it is missing or fails `isItemCategory`.
- `loadHabUnitTallyLines` selects `item_id, name, quantity, minimum_quantity, category` (`:74`).
- `loadHabUnitItems` keeps its name-only select (`:21`). It is the attach list and needs no category.

**File:** `src/lib/items/load-hab-unit-item-by-id.ts`

**Intent:** The item page receives the category in Phase 4.

**Contract:** The select at `:12` adds `category`. The return type is unchanged.

**File:** `src/lib/items/load-hab-unit-item-by-barcode.ts`

**Intent:** Keep the scan and lookup paths working after the shared reader tightens.

**Contract:** The select at `:44` adds `category`, and `HabUnitItemRow` (`:17-22`) gains `readonly category: string`. `HabUnitStockedItem` is otherwise unchanged. The scan and lookup pages do not read the category.

**File:** `src/lib/items/rank-restock-lines.ts`

**Intent:** Keep `RestockLine extends HabUnitTallyLine` compiling without changing the ranking.

**Contract:** The `map` at `:16-22` passes `category: line.category` through. Filter, shortfall, and sort are unchanged.

#### 5. Loader and ranking tests

**File:** `src/lib/items/load-hab-unit-items.test.ts`

**Intent:** Pin the category in the reader.

**Contract:** Valid-row tests add `category` to the row and to the expected line. Add tests: returns the line for each category value, returns null for a missing category, returns null for an unknown category string, and returns null for a numeric category. The existing null cases stay.

**File:** `src/lib/items/rank-restock-lines.test.ts`

**Intent:** Keep the ranking tests green and prove category does not rank.

**Contract:** The `line` builder (`:12-26`) sets a `category`. Add one test: ranks by shortfall and not by category, with two critical lines in different categories.

### Success Criteria

#### Automated Verification

- `pnpm test -- src/lib/items/item-category.test.ts src/lib/items/load-hab-unit-items.test.ts src/lib/items/rank-restock-lines.test.ts` passes.
- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm lint` passes.

#### Manual Verification

- Apply the migration with the Supabase CLI. Every existing `household_inventory` row has `category` equal to `uncategorized`.
- An insert of `category = 'drinks'` is rejected by the check constraint.
- `/inventory`, `/inventory/restock`, `/inventory/lookup`, a scan, and an item page still load with no error.

---

## Phase 2: Set the category from the first Open Facts response

### Overview

A barcode scanned into the create flow is filed by the first catalog that answers HTTP 200, even when that answer has no name. A miss or no answer files `uncategorized`. The stray `debugger` is removed in this phase.

### Changes Required

#### 1. Lookup result and winning catalog

**File:** `src/lib/catalog/lookup-catalog-name.ts`

**Intent:** Return the category of the catalog that answered first, and remove the stray `debugger`.

**Contract:**

- Remove the `debugger` statement at `:21`. No other behavior in `readCatalogName` changes. This removal is named here because it is a change in this file and not a separate feature.
- `LookupStatusFound` becomes `{ status: 'found', name: string, category: ItemCategory }`.
- `LookupStatusEmpty` becomes `{ status: 'empty', category: ItemCategory }`.
- A constant array of categories sits beside the URL array and follows its order: `beauty`, `food`, `pet-food`, `other` for indexes 0 to 3. A comment states that the two arrays share an order.
- After `Promise.any` resolves, the category is `CATALOG_CATEGORIES[winningCatalog.index]`.
- A winning 200 with no usable name returns `{ status: 'empty', category }` with the winner's category.
- A winning 200 whose body is not JSON returns `{ status: 'empty', category }` with the winner's category. Keep the category in a variable declared before the `try` so the `catch` can return it.
- `Promise.any` rejecting, which means every catalog failed or timed out, returns `{ status: 'empty', category: 'uncategorized' }`.
- The name rules, the 120 character cap, the abort handling, and the timeout are unchanged.

**File:** `src/lib/catalog/lookup-catalog-name.test.ts`

**Intent:** Pin the category for each catalog and for every empty case.

**Contract:**

- The `emptyLookup` constant (`:20-22`) becomes `{ status: 'empty', category: 'uncategorized' }`. Tests that expect it with no catalog answer keep using it.
- Every test that asserts a `found` or `empty` result with a category stubs one catalog URL only, through a helper such as `answerOnly(catalogUrl, response)` that returns a 404 for the other URLs. The winner is then known and the test does not depend on response order.
- Add one test per catalog: returns category beauty, food, pet-food, and other when only that catalog answers with a name.
- The blank-name test (`:194-213`) answers only the pet food URL with a blank name and expects `{ status: 'empty', category: 'pet-food' }`.
- The non-JSON test (`:259-275`) answers only the products URL with a body that is not JSON and expects `{ status: 'empty', category: 'other' }`.
- The name tests (`:116-192`) keep their name assertions and expect `found` with the category of the one URL they answer.
- The tests that fail every catalog (`:235-257`, `:376-391`) expect `emptyLookup`, which carries `uncategorized`.
- The request, User-Agent, and abort tests (`:293-352`) keep their behavior. The abort test answers the food URL, so its result carries `food`.

#### 2. Create-item RPC

**File:** `supabase/migrations/20261030191000_create_item_with_category.sql` (new)

**Intent:** File a new item under its category in the same insert.

**Contract:**

- Drop `public.create_item(text, text)` and recreate it as `create_item(item_name text, item_barcode text, item_category text default 'uncategorized')`. It stays `security definer` with `set search_path = ''`.
- The body is the current body (`supabase/migrations/20260916120209_create_items.sql:94-137`), plus a check that raises `create_item rejects an unknown category` when `item_category` is null or outside the five values, and a `category` column in the `household_inventory` insert.
- Restore the grants: `revoke all on function public.create_item(text, text, text) from public, anon;` and `grant execute ... to authenticated`.

#### 3. Create-item wrapper

**File:** `src/lib/items/create-new-item.ts`

**Intent:** Pass the category and become testable, like `createNewItemWithoutBarcode`.

**Contract:**

- Signature `createNewItem(input: { name: string; barcode: string; category: ItemCategory }, client: CreateItemClient)`. Two parameters.
- `CreateItemClient` is an interface with an `rpc` method typed for `DB_FUNCTION_CREATE_ITEM` and the args `item_name`, `item_barcode`, and `item_category`.
- A failed call throws `create_item failed for barcode ${barcode}` with the rpc error as `cause`, as it does now (`src/lib/items/create-new-item.ts:11-15`).
- The function returns the new item id and rejects an empty id.

**File:** `src/lib/items/create-new-item.test.ts` (new)

**Intent:** Cover the wrapper, which has no test today.

**Contract:** Vitest tests in the style of `create-new-item-without-barcode.test.ts`, with a client stub that asserts the function name and the exact args. Names: returns the item id from a successful rpc, sends the category to the rpc, rejects with the barcode and the rpc error as cause, and rejects when the rpc returns no id.

#### 4. Create action

**File:** `src/app/inventory/actions.ts`

**Intent:** Read the category from the form, validate it, and pass it on.

**Contract:**

- `createItem` (`:100-154`) reads a `category` form field with `getFormString`. A value that fails `isItemCategory` becomes `DEFAULT_ITEM_CATEGORY` and is logged with `console.error('createItem rejected category', { barcode, category })`.
- The call at `:129` becomes `createNewItem({ name, barcode, category }, await createClient())`. Create the Supabase client once, inside the existing `try`.
- The add-from-global branches (`:124-126`, `:141-142`) and `createItemWithoutBarcode` (`:157-175`) are unchanged. They take the column default.

#### 5. Create page and form

**File:** `src/app/inventory/new/page.tsx`

**Intent:** Hand the looked-up category to the form.

**Contract:** `ItemCreateForm` (`:75-83`) receives `category={lookupProduct.category}`. `defaultName`, the notices, and the other branches are unchanged.

**File:** `src/app/inventory/new/item-create-form.tsx`

**Intent:** Carry the category to the action without showing a control.

**Contract:** `ItemCreateFormProps` (`:23-29`) gains `category: ItemCategory`. The create form (`:130-136`) adds a hidden input `name="category"` next to the hidden barcode. The attach form, the attach list, and the visible fields are unchanged. The member does not pick a category here. They edit it later on the item page.

### Success Criteria

#### Automated Verification

- `pnpm test -- src/lib/catalog/lookup-catalog-name.test.ts src/lib/items/create-new-item.test.ts` passes.
- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- A search of `src` for `debugger` finds no match.

#### Manual Verification

- Apply the migration. Create an item from the create form and confirm the item saves with no error. The RPC cannot be called from a bare SQL session, because it needs a signed-in user.
- Scan or type a food barcode, such as `3017620422003`, and save the item from the create form. The new `household_inventory` row has the category of the catalog that answered first.
- Create an item for a barcode every catalog misses. The row has `uncategorized`.
- Create an item with no barcode, and add an item that already exists in the global table. Both rows have `uncategorized`.
- Edit the hidden `category` field to `drinks` in the browser and submit. The item saves as `uncategorized` and the server logs the rejection.

---

## Phase 3: Render collapsible category panels with a shortage icon

### Overview

`/inventory` groups the tally into five collapsible panels. A panel that holds a WARNING or CRITICAL item shows a warning icon. Search, sort, and the count steppers work as before.

### Changes Required

#### 1. Group lines by category

**File:** `src/lib/items/group-tally-lines-by-category.ts` (new)

**Intent:** Turn a flat list into the five panels, empty ones included.

**Contract:**

- `groupTallyLinesByCategory<TLine extends { readonly category: ItemCategory }>(lines: readonly TLine[]): CategoryGroup<TLine>[]`.
- `CategoryGroup<TLine>` is `{ readonly category: ItemCategory; readonly lines: readonly TLine[] }`.
- It always returns five groups in `ITEM_CATEGORIES` order. A category with no line has `lines: []`.
- Lines keep their input order inside a group. The input is not mutated.
- The file is pure and imports no `next/*`, `react`, or Supabase module.

**File:** `src/lib/items/group-tally-lines-by-category.test.ts` (new)

**Contract:** Vitest tests with `toEqual`: returns five empty groups for no lines, returns groups in panel order, puts each line in its own category, keeps input order inside a group, and does not mutate the input.

#### 2. Category shortage

**File:** `src/lib/items/get-category-shortage.ts` (new)

**Intent:** Say whether a category has a shortage and how bad the worst one is, so the icon can show it.

**Contract:**

- `getCategoryShortage(lines: readonly { readonly quantity: number; readonly minimumQuantity: number }[]): 'critical' | 'warning' | null`.
- It uses `getStockState`. It returns `critical` when any line is critical, otherwise `warning` when any line is warning, otherwise `null`. An empty list returns `null`.
- Pure. It takes the whole category, never a filtered list.

**File:** `src/lib/items/get-category-shortage.test.ts` (new)

**Contract:** Tests: returns null for no lines, returns null when every line is in stock, returns warning for a warning line, returns critical for a critical line, returns critical when a warning and a critical line mix, and treats a count equal to the minimum as critical.

#### 3. Panel open state

**File:** `src/lib/items/resolve-category-panel-open.ts` (new)

**Intent:** One rule for whether a panel is open, so the component holds no logic.

**Contract:**

- `resolveCategoryPanelOpen(options: { toggledOpen: boolean | undefined; isSearching: boolean; matchCount: number; hasShortage: boolean }): boolean`.
- A defined `toggledOpen` wins. Otherwise a search opens the panel when `matchCount > 0` and closes it when `matchCount === 0`. With no search, the panel is open when `hasShortage` is true.
- Pure.

**File:** `src/lib/items/resolve-category-panel-open.test.ts` (new)

**Contract:** Tests: starts open with a shortage and no search, starts closed with no shortage and no search, opens a panel with a match while searching, closes a panel with no match while searching even with a shortage, and returns the toggled value over every derived rule.

#### 4. Panel component

**File:** `src/app/inventory/inventory-category-panel.tsx` (new)

**Intent:** One collapsible panel with a header button, a count, and a shortage icon.

**Contract:**

- A client component with props `label`, `panelId`, `isOpen`, `onToggle`, `itemCount`, `shortage` (`'critical' | 'warning' | null`), and `children`.
- The header is a heading containing a button with `aria-expanded={isOpen}` and `aria-controls={panelId}`, in the pattern of `item-create-form.tsx:170-188`. It shows the label, the item count, a chevron, and the icon.
- The icon is the `TriangleAlert` icon from `lucide-react`, shown only when `shortage` is not `null`. It carries `role="img"` and the label `Category has an item at WARNING or CRITICAL`. Its color is `STOCK_STATE_TEXT_CLASS_NAMES.critical` for `critical` and `STOCK_STATE_TEXT_CLASS_NAMES.warning` for `warning`.
- The body uses the `grid-rows-[1fr]` and `[0fr]` transition, `motion-reduce:transition-none`, and `inert` plus `aria-hidden` when closed, as in `item-create-form.tsx:190-204`.
- An empty panel's body is the line `Nothing in this category.` when `itemCount` is 0. The panel itself still renders.

#### 5. Tally grouping

**File:** `src/app/inventory/inventory-tally.tsx`

**Intent:** Replace the flat list with the panel stack and keep search, sort, and the scroll rule.

**Contract:**

- Keep `query` and `sort` state, the search row, and the sort buttons (`:71-125`) as they are.
- Add `toggled` state, a map from category to boolean. Typing in the search field sets it to an empty map in the same handler as `setQuery`.
- Filter and sort the lines as today (`:84`), then call `groupTallyLinesByCategory` on the sorted visible lines. Call it again on the unfiltered `lines` to get each category's shortage with `getCategoryShortage`.
- Render five `InventoryCategoryPanel` elements in order. Each body holds the existing `ul` of rows (`:131-158`) unchanged, including `TallyCountControls` and the stock label and color.
- `isOpen` comes from `resolveCategoryPanelOpen` with `isSearching` true when the trimmed query is not empty and `matchCount` from the visible group.
- The no-match status (`:127-129`) stays when a search matches nothing. The five panels still render, closed.
- With no lines, show `Nothing is added here yet.` as a status line above the five empty panels and do not render the search row.
- The component root stays `contents`. The panel stack takes the classes the `ul` had for scrolling (`min-h-[36px]`, `flex-1`, `overflow-y-auto`, `:33-41`). Each panel's `ul` does not scroll on its own.
- `InventoryTallyProps.lines` is `readonly HabUnitTallyLine[]`, so each line already has `category` from Phase 1. `src/app/inventory/page.tsx` needs no change.

### Success Criteria

#### Automated Verification

- `pnpm test -- src/lib/items/group-tally-lines-by-category.test.ts src/lib/items/get-category-shortage.test.ts src/lib/items/resolve-category-panel-open.test.ts` passes.
- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm lint` passes.

#### Manual Verification

- With items in several categories, `/inventory` shows Pet food, Food, Beauty, Other, and Uncategorized in that order, including a panel with no items.
- A panel that holds a WARNING or CRITICAL item starts open and shows the icon. The other panels start closed and show no icon. Reloading the page applies the same rule again.
- Raise the count of a shortage item above twice its minimum on the item page and save. Its panel loses the icon.
- Typing a name opens only the panels that have a match. Clearing the search returns to the shortage rule. Toggling a panel by hand holds until the next keystroke in the search.
- The icon stays when a search hides the shortage item in that panel.
- Sort and the count steppers work inside a panel. The row stock labels and colors are unchanged.
- With enough items to overflow, only the panel stack scrolls. The title, the search row, and the four buttons stay visible.
- A screen reader announces each header as a button with its expanded state, and announces the icon label.
- With no items, `Nothing is added here yet.` appears above five empty panels.

---

## Phase 4: Edit an item's category on the item page

### Overview

The item page has a Category control. Save writes quantity, minimum, and category in one RPC. The panels follow the saved value.

### Changes Required

#### 1. Level save RPC

**File:** `supabase/migrations/20261030192000_set_household_item_levels_category.sql` (new)

**Intent:** Save category with the levels in one atomic update.

**Contract:**

- Drop `public.set_household_item_levels(uuid, integer, integer, integer)` and recreate it as `set_household_item_levels(target_item_id uuid, new_quantity integer, new_minimum_quantity integer, expected_quantity integer, new_category text)`. It stays `security definer` with `set search_path = ''`.
- The body is the current body (`supabase/migrations/20261030100414_set_household_item_levels_expected_quantity.sql:14-66`), plus a check that raises `set_household_item_levels rejects an unknown category` when `new_category` is null or outside the five values, and `category = new_category` in the update.
- The stale count rule and the not-stocked rule are unchanged, including `serialization_failure` for a stale count.
- Restore the grants: `revoke all on function public.set_household_item_levels(uuid, integer, integer, integer, text) from public, anon;` and `grant execute ... to authenticated`.

#### 2. Level save wrapper

**File:** `src/lib/items/set-hab-unit-item-levels.ts`

**Intent:** Carry the category through the typed wrapper.

**Contract:**

- `HouseholdItemLevels` (`:6-10`) gains `readonly category: ItemCategory`.
- The `rpc` args type (`:15-20`) gains `new_category: string`. The call (`:44-49`) sends `new_category: levels.category`.
- The stale and error handling (`:51-60`) is unchanged.

**File:** `src/lib/items/set-hab-unit-item-levels.test.ts`

**Contract:** `LEVELS` (`:10`) gains a category and the stub's expected args (`:20-25`) gain `new_category`. Add a test: sends the category to the rpc. The saved, stale, and error tests keep their behavior.

#### 3. Save action

**File:** `src/app/inventory/actions.ts`

**Intent:** Read and validate the category with the other level fields.

**Contract:** `saveItemLevels` (`:365-421`) reads a `category` form field. A value that fails `isItemCategory` logs `console.error('saveItemLevels rejected category', { itemId, category })` and returns `{ status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }`, in the pattern at `:375-378` and `:394-397`. The valid category goes into the `setHabUnitItemLevels` call (`:401-409`). The revalidation of `/inventory` and the item page (`:418-419`) already covers the panels.

#### 4. Item page and editor

**File:** `src/app/inventory/[itemId]/page.tsx`

**Intent:** Hand the saved category to the editor.

**Contract:** `ItemLevelEditor` (`:51-58`) receives `category={item.category}`. The other props are unchanged.

**File:** `src/app/inventory/[itemId]/item-level-editor.tsx`

**Intent:** Let the member pick a category and save it with Save.

**Contract:**

- `ItemLevelEditorProps` (`:109-116`) gains `readonly category: ItemCategory`.
- Add a Category line after Minimum, in the same line layout as the other levels (`:253-260`). It has a visible label `Category`, the dot leader, and a native `select` with one `option` per `ITEM_CATEGORIES` entry, labelled with `ITEM_CATEGORY_LABELS`. The `select` has `name="category"`, an `id` matched by the label's `htmlFor`, and `defaultValue` set to the saved category. It is styled to match the Count and Minimum controls, with a 44px minimum touch height like the `[-]` and `[+]` buttons.
- The heading, stock label, count, minimum, consumption rate, barcode line, error alert, Save, and Cancel are unchanged.
- Cancel still returns to `/inventory` with no write.

### Success Criteria

#### Automated Verification

- `pnpm test -- src/lib/items/set-hab-unit-item-levels.test.ts` passes.
- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm lint` passes.

#### Manual Verification

- Apply the migration. Save an item from the item page and confirm the count, minimum, and category all persist. The RPC cannot be called from a bare SQL session, because it needs a signed-in user.
- Open an item page. The Category control shows the saved category.
- Change the category and press Save. `/inventory` shows the item in the new panel, and the old panel no longer lists it.
- Change only the category, leaving count and minimum alone, and Save. The count and minimum are unchanged.
- Move a shortage item to an empty panel. That panel starts open with the icon, and the old panel loses the icon if it held no other shortage.
- Press Cancel after changing the category. The item stays in its old panel.
- Edit the category field to `drinks` in the browser and submit. The page shows the write failure message and nothing is saved.
- Save with a stale count from a second tab. The existing stale message appears and the category is not saved.

---

## Testing Strategy

### Unit Tests

- `isItemCategory`, the category order, and the labels (Phase 1).
- `readHabUnitTallyLine` for each category, a missing category, an unknown category, and a numeric category (Phase 1).
- `rankRestockLines` ranks by shortfall and not by category (Phase 1).
- `lookupCatalogName` returns the category of each catalog, `uncategorized` when none answers, and the winner's category for a blank name and for a body that is not JSON (Phase 2).
- `createNewItem` sends the category and rejects with the barcode and the rpc error (Phase 2).
- `groupTallyLinesByCategory`, `getCategoryShortage`, and `resolveCategoryPanelOpen` cover empty input, boundaries, and mixed states (Phase 3).
- `setHabUnitItemLevels` sends the category and keeps the stale and error paths (Phase 4).

### Integration Tests

- No route harness exists. The create form, the panel stack, and the item page control are checked by hand. The category check constraint is exercised by a direct insert in Phase 1. The RPC category checks are a second guard behind the action's `isItemCategory` check, and the forged-field steps in Phases 2 and 4 exercise the action guard.

### Manual Testing Steps

1. Apply the three migrations in order against the linked project.
2. Open `/inventory`. Confirm five panels, all items under Uncategorized, and the shortage rule for open state and the icon.
3. Create an item from a food barcode. Confirm the row has the catalog's category and appears in that panel.
4. Create an item for a barcode every catalog misses, an item with no barcode, and an item added from the global table. Confirm each lands in Uncategorized.
5. Open an item, change the category, and Save. Confirm the item moves, and the icons follow.
6. Search by name. Confirm only matching panels open, and the icon ignores the search.
7. Overflow the list. Confirm only the panel stack scrolls.

## Migration and Rollback

Three migrations, in this order:

1. `20261030190000_add_household_inventory_category.sql` adds a column with a default. Existing rows become `uncategorized`. Rollback is dropping the column and its check constraint. No other data changes.
2. `20261030191000_create_item_with_category.sql` replaces `create_item`. Rollback is recreating the two-argument function from `20260916120209_create_items.sql:89-141`.
3. `20261030192000_set_household_item_levels_category.sql` replaces `set_household_item_levels`. Rollback is recreating the four-argument function from `20261030100414_set_household_item_levels_expected_quantity.sql`.

Phases 2 and 4 change an RPC signature. Apply each migration and deploy its code together, in the same release, or an old build calling the old signature fails after the drop. Phase 1 can ship alone. The new `create_item` keeps a default for its category, so a build from before Phase 2 would still work against it, but the Phase 4 function has no default, so a pre-Phase 4 build cannot save levels after that migration. Reverting the branch removes the panels and the control. Household counts and minimums are never altered by this change.

## References

- Roadmap: `context/foundation/roadmap.md` (S-11, with S-06 as the prerequisite and S-10 retired)
- PRD: `context/foundation/prd.md` (FR-018, US-04, Business Logic category paragraph)
- `supabase/migrations/20260916120209_create_items.sql:24-37`, `:43-53`, `:89-141`
- `supabase/migrations/20261030100414_set_household_item_levels_expected_quantity.sql:1-70`
- `src/lib/items/load-hab-unit-items.ts:5-10`, `:43-66`, `:69-94`
- `src/lib/items/load-hab-unit-item-by-id.ts:12`
- `src/lib/items/load-hab-unit-item-by-barcode.ts:17-22`, `:44`
- `src/lib/items/rank-restock-lines.ts:4-22`
- `src/lib/items/stock-state.ts:5-32`
- `src/lib/items/set-hab-unit-item-levels.ts:6-62`
- `src/lib/items/create-new-item.ts`
- `src/lib/items/create-new-item-without-barcode.ts:3-33`
- `src/lib/catalog/lookup-catalog-name.ts:3-13`, `:21`, `:46-99`
- `src/lib/catalog/lookup-catalog-name.test.ts:20-22`, `:194-213`, `:259-275`
- `src/app/inventory/page.tsx:45-57`
- `src/app/inventory/inventory-tally.tsx:33-41`, `:71-163`
- `src/app/inventory/actions.ts:100-154`, `:365-421`
- `src/app/inventory/new/page.tsx:64-83`
- `src/app/inventory/new/item-create-form.tsx:23-29`, `:56-66`, `:130-136`, `:170-204`
- `src/app/inventory/[itemId]/page.tsx:51-58`
- `src/app/inventory/[itemId]/item-level-editor.tsx:109-116`, `:164-189`, `:253-260`
- `src/app/styles/stock-state-class-names.ts:11-15`
- Linear: TEC-35
- GitHub: https://github.com/pterodactor3000/Noospheric-Tally/issues/16

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Add the category column and read path

#### Automated

- [x] 1.1 `pnpm test -- src/lib/items/item-category.test.ts src/lib/items/load-hab-unit-items.test.ts src/lib/items/rank-restock-lines.test.ts` passes (88c315f)
- [x] 1.2 `pnpm test` passes (88c315f)
- [x] 1.3 Typecheck passes (88c315f)
- [x] 1.4 Lint passes (88c315f)

#### Manual

- [ ] 1.5 After the migration, every existing `household_inventory` row has category `uncategorized`
- [ ] 1.6 An insert with category `drinks` is rejected by the check constraint
- [ ] 1.7 `/inventory`, `/inventory/restock`, `/inventory/lookup`, a scan, and an item page still load with no error

### Phase 2: Set the category from the first Open Facts response

#### Automated

- [x] 2.1 `pnpm test -- src/lib/catalog/lookup-catalog-name.test.ts src/lib/items/create-new-item.test.ts` passes
- [x] 2.2 `pnpm test` passes
- [x] 2.3 Typecheck passes
- [x] 2.4 Lint passes
- [x] 2.5 A search of `src` for `debugger` finds no match

#### Manual

- [ ] 2.6 After the migration, creating an item from the create form saves with no error
- [ ] 2.7 A food barcode saved from the create form has the category of the catalog that answered first
- [ ] 2.8 A barcode every catalog misses is saved as `uncategorized`
- [ ] 2.9 An item with no barcode and an item added from the global table are both `uncategorized`
- [ ] 2.10 A forged hidden category of `drinks` saves as `uncategorized` and the server logs the rejection

### Phase 3: Render collapsible category panels with a shortage icon

#### Automated

- [ ] 3.1 `pnpm test -- src/lib/items/group-tally-lines-by-category.test.ts src/lib/items/get-category-shortage.test.ts src/lib/items/resolve-category-panel-open.test.ts` passes
- [ ] 3.2 `pnpm test` passes
- [ ] 3.3 Typecheck passes
- [ ] 3.4 Lint passes

#### Manual

- [ ] 3.5 `/inventory` shows five panels in order, including an empty one
- [ ] 3.6 A panel with a WARNING or CRITICAL item starts open with the icon, and the other panels start closed with no icon
- [ ] 3.7 Raising a shortage item to in stock and saving removes its panel's icon
- [ ] 3.8 A name search opens only the matching panels, and a manual toggle holds until the next keystroke
- [ ] 3.9 The icon stays when a search hides the shortage item
- [ ] 3.10 Sort and the count steppers work inside a panel, and row labels and colors are unchanged
- [ ] 3.11 With an overflowing list, only the panel stack scrolls and the title, search, and buttons stay visible
- [ ] 3.12 A screen reader announces each header's expanded state and the icon label
- [ ] 3.13 With no items, `Nothing is added here yet.` shows above five empty panels

### Phase 4: Edit an item's category on the item page

#### Automated

- [ ] 4.1 `pnpm test -- src/lib/items/set-hab-unit-item-levels.test.ts` passes
- [ ] 4.2 `pnpm test` passes
- [ ] 4.3 Typecheck passes
- [ ] 4.4 Lint passes

#### Manual

- [ ] 4.5 After the migration, saving from the item page persists count, minimum, and category
- [ ] 4.6 The item page Category control shows the saved category
- [ ] 4.7 Changing the category and pressing Save moves the item to the new panel
- [ ] 4.8 Saving only a category change leaves count and minimum unchanged
- [ ] 4.9 Moving a shortage item to an empty panel opens that panel with the icon, and the old panel loses its icon if it held no other shortage
- [ ] 4.10 Cancel after changing the category leaves the item in its old panel
- [ ] 4.11 A forged category of `drinks` shows the write failure message and saves nothing
- [ ] 4.12 A stale count from a second tab shows the existing stale message and does not save the category
