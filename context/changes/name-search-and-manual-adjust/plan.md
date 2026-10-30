# Name Search and Manual Adjust Implementation Plan

## Overview

A signed-in member can search the inventory by name, change an item's count by hand, and keep an item that has no barcode. This is roadmap S-05. It covers PRD FR-006 (find an item by name when scanning is not possible) and FR-013 (keep an item without any barcode and adjust its count by hand after finding it by name). Spices and loose nuts cannot be scanned, so without this slice the product covers half of the problem the PRD names.

The slice has three parts. Part one turns the disabled `[-]` and `[+]` buttons on each tally row into a hand adjustment of one unit per press. Part two adds a name filter above the tally. Part three adds a way to create an item with a name and no barcode. Prerequisite S-02 is done.

## Current State Analysis

**The tally already renders every item and has placeholder controls.** `InventoryPage` loads every household row through `loadHabUnitTallyLines` and renders `[-] {count} [+]` per row. The two buttons carry `disabled` and the labels `Decrease {name}` and `Increase {name}`. Evidence: `src/app/inventory/page.tsx` lines 42-47 and 78-96, and `src/lib/items/load-hab-unit-items.ts` lines 69-92. S-04 recorded them as placeholders and S-06 kept them for this slice (`context/changes/using-mode-decrease-and-undo/plan-brief.md` lines 18 and 36, `context/changes/minimum-and-restock-flag/plan-brief.md` lines 26 and 49). The page has no search field and no limit on rows.

**No write path changes a count by hand.** Counts change only through `increment_household_quantity(text, uuid)`, `decrement_household_quantity(text, uuid)`, and `reverse_quantity_change(uuid)`. All three need a barcode or a scan log row. Evidence: `supabase/migrations/20261029182809_create_household_quantity_changes.sql` lines 39-205 and `supabase/migrations/20261029184707_reverse_quantity_change.sql`. `household_inventory.quantity` has `check (quantity >= 0)` (same migration, lines 1-3). `household_inventory` has a select policy for members only, so every write goes through a security-definer function.

**The change log cannot hold a hand adjustment.** `household_quantity_changes` requires `scan_session_id uuid not null`, `barcode text not null`, and `quantity_delta in (-1, 1)`. A barcode-less item has no barcode to log. Evidence: `20261029182809_create_household_quantity_changes.sql` lines 4-17.

**An item without a barcode cannot be created today.** `items` has no barcode column. Barcodes live on `item_barcodes`. Evidence: `supabase/migrations/20260916120209_create_items.sql` lines 1-22. But `create_item(item_name, item_barcode)` inserts the `item_barcodes` row unconditionally (same file, lines 89-138), and `createItem` requires a valid barcode (`src/app/inventory/actions.ts` lines 76-91). `/inventory/new` without a valid barcode shows only `BarcodeLookupForm` (`src/app/inventory/new/page.tsx` lines 33-44, `src/app/inventory/new/barcode-lookup-form.tsx`). The archived S-02 plan says barcode-less items are S-05 (`context/archive/2026-09-13-scan-to-create-item/plan.md` line 37).

**Existing name filter pattern.** `ItemCreateForm` filters its household list on the client with `filter.trim().toLowerCase()` and `item.name.toLowerCase().includes(...)`. Evidence: `src/app/inventory/new/item-create-form.tsx` lines 81-87.

**Write conventions to keep.** Server actions validate input, call a wrapper with an injected client, log with `console.error` and the inputs, and return `ITEM_WRITE_FAILURE_MESSAGE` on failure. A floor refusal uses SQLSTATE `23514` and the wrapper branches on `error.code`. Evidence: `src/app/inventory/actions.ts` lines 295-353, `src/lib/items/reverse-quantity-change.ts` lines 1-52, and `src/lib/items/set-hab-unit-minimum-quantity.ts`. UUID arguments are checked with `isScanSessionId` (`actions.ts` line 298 comment and line 325). Wrapper tests stub `rpc` (`src/lib/items/set-hab-unit-minimum-quantity.test.ts`). Names for database objects live in `src/lib/db/entities.ts`. Vitest collects `src/**/*.test.ts` only (`vitest.config.mts` line 16). The scripts are `pnpm lint`, `pnpm test`, `pnpm typecheck`, and `pnpm worker:check`.

**Roadmap status is stale for S-04 and S-06.** The roadmap table lists both as `ready`, but their code is on `main` (commits `6de331f` and `7427e6c`). Neither is a prerequisite of S-05, so this plan does not depend on that status and does not edit the roadmap.

## Desired End State

On `/inventory`, every row's `[-]` and `[+]` change that item's count by 1 per press. The count shown, the name, count, and `[+]` / `[-]` text color, and the count on `/inventory/{itemId}` update. The row background stays plain. `[-]` is disabled at 0. A refused or failed write shows a message under the row.

Above the tally, a search field filters rows by name, ignoring case and surrounding spaces. A query with no match shows `No item matches "{query}".`. The filter text survives a count change.

On `/inventory/new` with no valid barcode, the member can add an item with a name only. The item lands on `/inventory` at 0, with the default minimum of 3, with no barcode attached. He finds it by name and raises its count with `[+]`.

Verify with the manual steps in Testing Strategy.

## What We're NOT Doing

- Setting a count to an exact number, or adjusting by more than 1 per press. The PRD says "adjust its count by hand" and the placeholders are one-step controls. A larger step or a typed count is a later decision.
- Logging hand adjustments in `household_quantity_changes`, or reversing one. The log is scan-session scoped and holds barcode and session id columns that a hand adjustment does not have. The opposite button reverses a hand adjustment.
- Editing or deleting an item, renaming an item, or removing a barcode-less item.
- Attaching a barcode to a barcode-less item through a new flow. The existing "Attach to existing item" list on `/inventory/new` already offers every household item, so a barcode-less item is already attachable.
- A duplicate-name check for barcode-less items. The PRD accepts inconsistent naming for the first version (FR-006 challenge).
- Server-side search, fuzzy matching, accent folding, ranking, or search outside the household inventory.
- Category panels, the restock list, and the consumption view (S-11, S-07, S-08).
- Editing `context/foundation/roadmap.md`, or archiving S-04 or S-06.
- A browser or route test harness. Vitest stays on `src/**/*.test.ts`.

## Implementation Approach

Follow the S-04 and S-06 shape. Writes go through security-definer RPCs. Server actions validate, call a wrapper that takes an injected client, and revalidate `/inventory`. Client components call the action and show its message. No query string and no redirect is needed for the adjustment, because the action returns a result and revalidation refreshes the props.

Three phases, in dependency order, each shippable alone:

1. Hand adjustment of a count. One migration, one wrapper, one action, and the tally controls become live.
2. Name search. A pure filter, and the list moves into one client component that owns the search text.
3. Item without a barcode. One migration, one wrapper, one action, and a name-only form on `/inventory/new`.

Phase 1 comes first because it delivers a working adjustment for every existing item. Phase 2 follows because it moves the list the controls sit in. Phase 3 comes last because the headline FR-013 flow (create, find, adjust) needs the other two.

Before writing Next code in any phase, read these guides in `node_modules/next/dist/docs/`: `01-app/01-getting-started/05-server-and-client-components.md`, `01-app/01-getting-started/07-mutating-data.md`, `01-app/03-api-reference/01-directives/use-server.md`, and `01-app/03-api-reference/04-functions/revalidatePath.md`. Next here is 16.4.3, and its APIs differ from older releases. Follow any deprecation notice those files give. Reading the guides is part of each phase and does not get a phase of its own.

## Critical Implementation Details

**The floor is one conditional statement.** `adjust_household_quantity` runs a single `update ... where quantity + delta_quantity >= 0 returning quantity`. Two presses at the same moment lock the same row in turn, and the second sees the first result. When no row comes back and the inventory row exists, raise with `using errcode = 'check_violation'`. The wrapper branches on `error.code === '23514'`. Do not parse message text.

**Parameter names must not shadow columns.** The function takes `delta_quantity`, not `quantity_delta`, because `household_quantity_changes.quantity_delta` is a column in the same schema. Qualify every column with a table alias and the parameters with the function name, as `20261029182809_create_household_quantity_changes.sql` does.

**Hand adjustments bypass the change log.** A member who scans an item up, lowers it by hand, and then undoes the scan line gets the S-04 reversal on the current count, not on the count the scan produced. The reversal RPC already refuses a result below 0 with a visible message (`20261029184707_reverse_quantity_change.sql` lines 46-52). No change is needed there. S-08 will not see hand adjustments. That is a stated limit, not a defect.

**The delta is closed to -1 and 1.** The client component and the action both reject any other value, and the RPC raises on any other value. Three layers is deliberate: the action is a public POST endpoint, and the RPC is callable by any signed-in member.

**Type-only import into client code.** `src/lib/items/load-hab-unit-items.ts` imports `createClient`, which imports `next/headers`. A client component that needs `HabUnitTallyLine` must use `import type`, which erases the import. A value import bundles server-only code and fails `next build`.

**State survives revalidation.** After `revalidatePath`, the server re-renders the page and passes new `lines` props. The client component keeps its own state, so the search text stays. Do not key the component on the lines.

**Deploy order.** Run `pnpm exec supabase db push` before deploying the app. The new build calls functions that do not exist until the migration is applied. Both migrations only add functions, so the build deployed from `main` keeps working in the gap.

## Phase 1: Hand adjustment of a count

### Overview

Every row's `[-]` and `[+]` change that item's count by 1 through a new RPC. The count never drops below 0. A refusal shows a message under the row. Nothing about search or barcode-less items changes yet.

### Changes Required

#### 1. Adjustment migration

**File:** `supabase/migrations/<timestamp>_adjust_household_quantity.sql`, created with `pnpm exec supabase migration new adjust_household_quantity` so its timestamp sorts after `20261030055001`.

**Intent:** Add one function that moves a household item's count by exactly 1 or -1 and never below 0.

**Contract:** `create function public.adjust_household_quantity(target_item_id uuid, delta_quantity integer) returns integer`, with `language plpgsql`, `security definer`, and `set search_path = ''`. It resolves the caller's household as `set_household_minimum_quantity` does (`20261030055001_add_household_minimum_quantity.sql` lines 18-34). It raises `adjust_household_quantity requires an authenticated user` and `adjust_household_quantity requires a household` for a missing caller or household. It raises `adjust_household_quantity rejects a delta other than -1 or 1` when `delta_quantity` is null or not in `(-1, 1)`. It then runs `update public.household_inventory as inventory set quantity = inventory.quantity + adjust_household_quantity.delta_quantity where inventory.household_id = caller_household_id and inventory.item_id = target_item_id and inventory.quantity + adjust_household_quantity.delta_quantity >= 0 returning inventory.quantity into new_quantity`. When no row comes back, it raises `adjust_household_quantity refuses a quantity below 0` with `using errcode = 'check_violation'` if the household stocks the item, and `adjust_household_quantity refuses an item this household does not stock` otherwise. It returns the new quantity. It inserts nothing into `household_quantity_changes`. End with `revoke all on function public.adjust_household_quantity(uuid, integer) from public, anon;` and `grant execute ... to authenticated;`.

#### 2. Names

**File:** `src/lib/db/entities.ts`

**Intent:** Name the new function next to the others.

**Contract:** Add `DB_FUNCTION_ADJUST_HOUSEHOLD_QUANTITY = 'adjust_household_quantity'` and export it.

#### 3. Adjustment guard

**File:** `src/lib/items/quantity-adjustment.ts` (new)

**Intent:** One definition of the allowed steps, shared by the action and the controls.

**Contract:** Export `type QuantityAdjustment = -1 | 1` and `isQuantityAdjustment(value: unknown): value is QuantityAdjustment`. It returns true only for the numbers `-1` and `1`.

**File:** `src/lib/items/quantity-adjustment.test.ts` (new)

**Intent:** Lock the guard.

**Contract:** Cover `1` and `-1` accepted, and `0`, `2`, `-2`, `1.5`, `NaN`, `'1'`, `null`, and `undefined` rejected.

#### 4. Adjustment wrapper

**File:** `src/lib/items/adjust-hab-unit-quantity.ts` (new)

**Intent:** Call the RPC and separate the floor refusal from a failure.

**Contract:** `adjustHabUnitQuantity(itemId: string, deltaQuantity: QuantityAdjustment, client: AdjustHouseholdQuantityClient): Promise<AdjustHabUnitQuantityResult>`. The client interface mirrors `ReverseQuantityChangeClient`: `rpc(functionName: typeof DB_FUNCTION_ADJUST_HOUSEHOLD_QUANTITY, args: { target_item_id: string; delta_quantity: number })` returning `PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>`. The result is the discriminated union `{ status: 'adjusted'; quantity: number } | { status: 'below-zero' }`. `error.code === '23514'` returns `below-zero`. Any other error, or `data` that is not an integer, throws `adjust_household_quantity failed for item ${itemId}` with `cause` set to the RPC error when one exists. A returned 0 is valid. Export `CHECK_VIOLATION_ERROR_CODE` from `src/lib/items/reverse-quantity-change.ts` (line 4) and import it here rather than copying the literal. That export is the only edit to that file.

**File:** `src/lib/items/adjust-hab-unit-quantity.test.ts` (new)

**Intent:** Lock the wrapper without a database.

**Contract:** Stub `rpc` as `set-hab-unit-minimum-quantity.test.ts` does, and assert the function name and `{ target_item_id, delta_quantity }`. Cover an adjusted result with a quantity above 0, an adjusted result with quantity `0`, `below-zero` for code `23514`, a throw naming the item id with the error as `cause` for any other RPC error, and a throw naming the item id for `null`, a string, a float, and an object as `data`.

#### 5. Adjustment action

**File:** `src/app/inventory/actions.ts`

**Intent:** Give the client one call that adjusts a count and reports the outcome.

**Contract:** Export `adjustItemQuantity(itemId: unknown, deltaQuantity: unknown): Promise<QuantityAdjustmentResult>`, where `QuantityAdjustmentResult` is `{ status: 'adjusted'; quantity: number } | ItemActionError`. Follow `saveItemMinimumQuantity` (lines 319-352). Reject an `itemId` that fails `isScanSessionId` and a delta that fails `isQuantityAdjustment`, each with a `console.error` naming the rejected value and `ITEM_WRITE_FAILURE_MESSAGE`. Create the client inside `try` with `createClient`, call `adjustHabUnitQuantity`, and return `{ status: 'error', message: QUANTITY_BELOW_ZERO_MESSAGE }` for `below-zero`. Define `QUANTITY_BELOW_ZERO_MESSAGE = 'The count cannot go below 0.'` beside `REVERSAL_BELOW_ZERO_MESSAGE` (line 63). Any throw is logged as `adjustItemQuantity failed` with the item id and delta and returns `ITEM_WRITE_FAILURE_MESSAGE`. On success call `revalidatePath('/inventory')` and `revalidatePath(`/inventory/${itemId}`)` and return `{ status: 'adjusted', quantity }`. Add the action to the export list (line 354). Do not redirect.

#### 6. Live count controls

**File:** `src/app/inventory/tally-count-controls.tsx` (new, `'use client'`)

**Intent:** Replace the disabled placeholder buttons with working ones, one row at a time.

**Contract:** Props are `itemId`, `name`, `quantity`, and `stockStateLabel` (the screen-reader text). It renders what the `tallyCount` span renders today (`page.tsx` lines 77-99): `[-]`, the count, `[+]`, and the screen-reader-only label. The two buttons keep their `Decrease {name}` and `Increase {name}` labels and their text-only look (`tallyControl`, lines 29-40). Each button gets `min-h-11 min-w-11` so it is a usable tap target on a phone. A press calls `adjustItemQuantity(itemId, -1 | 1)` inside `useTransition`. Both buttons are disabled while the transition is pending, so a double tap records one unit. `[-]` is also disabled when `quantity === 0`. An `error` result shows its message in an element with `role="alert"` under the row, and the next press clears it. The count shown is always the `quantity` prop, never local state, so a revalidation is the only thing that changes it. The row's `li` must wrap so the message takes its own line without moving the dot leader.

**File:** `src/app/inventory/page.tsx`

**Intent:** Use the live controls in place of the placeholders.

**Contract:** Replace the `tallyCount` span (lines 77-99) with `<TallyCountControls />` and move `tallyCount` and `tallyControl` into the new file. Keep the name link, the dot leader, and the layout unchanged. The name, the count, and `[+]` / `[-]` use the stock text color. The row background stays plain. The page stays a server component.

### Success Criteria

#### Automated Verification

- `pnpm test` passes `src/lib/items/quantity-adjustment.test.ts`: only `1` and `-1` are accepted.
- `pnpm test` passes `src/lib/items/adjust-hab-unit-quantity.test.ts`: an adjusted result returns the quantity including `0`, code `23514` returns `below-zero`, and another RPC error or a malformed result throws an `Error` that names the item id.
- `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` exit 0.

#### Manual Verification

- `pnpm exec supabase db push` applies the migration. `select to_regprocedure('public.adjust_household_quantity(uuid, integer)')` is not null. `has_function_privilege('anon', ..., 'execute')` is false and `has_function_privilege('authenticated', ..., 'execute')` is true.
- As a member in SQL, a delta of `1` returns the count plus 1 and a delta of `-1` returns the count minus 1. A delta of `0` or `2` raises the delta message. A delta of `-1` on an item at 0 raises with SQLSTATE `23514` and leaves the count at 0. An item id from another household raises the `does not stock` message. No call adds a row to `household_quantity_changes`.
- On `/inventory`, `[+]` raises a row's count by 1 and `[-]` lowers it by 1. The name, count, and `[+]` / `[-]` use the stock text color, the row background stays plain, and a refresh keeps the count. `/inventory/{itemId}` shows the same count.
- On a row at 0, `[-]` is disabled. With the same item open at 0 in a second tab after it was lowered there, `[-]` in the stale tab shows `The count cannot go below 0.` under the row and the count stays 0.
- A double tap on `[+]` raises the count by 1, and both buttons are disabled while a press is pending.

---

## Phase 2: Name search

### Overview

A search field above the tally filters the rows by name. The list, its empty states, and the live controls move into one client component that owns the search text.

### Changes Required

#### 1. Name filter

**File:** `src/lib/items/filter-items-by-name.ts` (new)

**Intent:** One pure rule for matching a query to item names, testable without React.

**Contract:** `filterItemsByName<TItem extends { readonly name: string }>(items: readonly TItem[], query: string): TItem[]`. It trims the query and lower-cases both sides. A query that is empty after trimming returns every item. Otherwise it returns the items whose lower-cased name contains the lower-cased query, in input order. It never mutates its input and always returns a new array. It matches the rule in `item-create-form.tsx` lines 81-87 and does not refactor that file.

**File:** `src/lib/items/filter-items-by-name.test.ts` (new)

**Intent:** Lock the matching rule.

**Contract:** Cover an empty query, a whitespace-only query, a match that differs only in case, a match in the middle of a name, a query with surrounding spaces, no match returning `[]`, input order kept, an empty item list, and the input array left unchanged.

#### 2. Tally list with search

**File:** `src/app/inventory/inventory-tally.tsx` (new, `'use client'`)

**Intent:** Render the search field and the rows, and own the search text.

**Contract:** Props are `lines: readonly HabUnitTallyLine[]`, imported with `import type` from `@/lib/items/load-hab-unit-items`. State is one search string. When `lines` is empty it renders `Nothing is added here yet.` and no search field. Otherwise it renders a labeled `type="search"` field with the visible label `Search by name` (use `Label`, `Input`, `fieldLabel`, `fieldControl`, and `fieldStack` as `item-create-form.tsx` lines 204-222 do), then the rows from `filterItemsByName(lines, query)`. When the filter returns nothing it renders `No item matches "{query}".` with `role="status"` and no rows, and `{query}` is the trimmed query. Each row is what `page.tsx` renders today (lines 58-100), now using `TallyCountControls` from Phase 1. Move `TALLY_DOT_LEADER`, `tallyList`, `tallyRow`, `tallyName`, and `tallyDots` (lines 11-28) into this file. Row order stays the loader's name order. The row key stays `line.itemId`.

**File:** `src/app/inventory/page.tsx`

**Intent:** Hand the list to the client component.

**Contract:** Render `<InventoryTally lines={tallyLines} />` inside `inventorySection`, above the `<br />` and the two buttons. Keep the heading, `requireCurrentUser`, `requireCurrentHabUnit`, `loadHabUnitTallyLines`, the section styling, and the Add item and Scan item buttons. Remove the imports the move leaves unused.

### Success Criteria

#### Automated Verification

- `pnpm test` passes `src/lib/items/filter-items-by-name.test.ts`: an empty or whitespace query returns every item, matching ignores case and surrounding spaces, no match returns an empty array, and the input is unchanged.
- `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` exit 0.

#### Manual Verification

- On `/inventory`, typing part of an item name in any case narrows the list to the items that contain it. Each remaining row still shows `[-] {count} [+]`. Clearing the field shows every item again.
- A query that matches nothing shows `No item matches "{query}".` and no rows. The Add item and Scan item buttons are still there.
- Pressing `[+]` on a row in a filtered list changes that count and keeps the search text and the filtered list.
- A household with no items shows `Nothing is added here yet.` and no search field.

---

## Phase 3: Item without a barcode

### Overview

A member can add an item by name alone from `/inventory/new`. It starts at 0 with the default minimum, has no barcode, and is found and adjusted like any other item.

### Changes Required

#### 1. Barcode-less item migration

**File:** `supabase/migrations/<timestamp>_create_item_without_barcode.sql`, created with `pnpm exec supabase migration new create_item_without_barcode` so its timestamp sorts after the Phase 1 migration.

**Intent:** Add the item and its household row without an `item_barcodes` row.

**Contract:** `create function public.create_item_without_barcode(item_name text) returns uuid`, with `language plpgsql`, `security definer`, and `set search_path = ''`. It mirrors `create_item` (`20260916120209_create_items.sql` lines 89-138) minus the barcode. It raises `create_item_without_barcode requires an authenticated user`, `create_item_without_barcode requires a household`, and `create_item_without_barcode rejects a blank item name` for a missing caller, a missing household, and a name that is null or empty after `trim`. It inserts one `public.items` row with the trimmed name, then one `public.household_inventory` row for the caller's household with the same name, and returns the new item id. Quantity and minimum take their column defaults, 0 and 3. It inserts no `item_barcodes` row. End with `revoke all on function public.create_item_without_barcode(text) from public, anon;` and `grant execute ... to authenticated;`.

#### 2. Names

**File:** `src/lib/db/entities.ts`

**Intent:** Name the new function.

**Contract:** Add `DB_FUNCTION_CREATE_ITEM_WITHOUT_BARCODE = 'create_item_without_barcode'` and export it.

#### 3. Wrapper

**File:** `src/lib/items/create-new-item-without-barcode.ts` (new)

**Intent:** Call the RPC through an injected client, which makes it testable.

**Contract:** `createNewItemWithoutBarcode(itemName: string, client: CreateItemWithoutBarcodeClient): Promise<string>`. The client interface is `rpc(functionName: typeof DB_FUNCTION_CREATE_ITEM_WITHOUT_BARCODE, args: { item_name: string })` returning `PromiseLike<{ data: unknown; error: { message: string } | null }>`. It returns `data` when it is a non-empty string. Otherwise it throws `create_item_without_barcode failed for item name ${itemName}` with `cause` set to the RPC error when one exists.

**File:** `src/lib/items/create-new-item-without-barcode.test.ts` (new)

**Intent:** Lock the wrapper without a database.

**Contract:** Stub `rpc` and assert the function name and `{ item_name }`. Cover a returned id, an RPC error that rejects with the item name in the message and the error as `cause`, and `null`, an empty string, a number, and an object as `data` that each reject with the item name in the message.

#### 4. Action

**File:** `src/app/inventory/actions.ts`

**Intent:** Validate the name, create the item, and land on the tally.

**Contract:** Export `createItemWithoutBarcode(formData: FormData): Promise<ItemActionResult>`. Read `name` with `getFormString`. An invalid name returns `{ status: 'error', message: nameResult.message, field: 'name' }` from `validateItemName`. In `try`, create the client with `createClient` and call `createNewItemWithoutBarcode(nameResult.name, supabase)`. A throw is logged as `createItemWithoutBarcode failed` with the name and returns `ITEM_WRITE_FAILURE_MESSAGE`. On success call `redirectToInventory()` (line 71) outside the `try`. Add it to the export list.

#### 5. Form on the new-item page

**File:** `src/app/inventory/new/barcodeless-item-form.tsx` (new, `'use client'`)

**Intent:** A name-only form for an item that has no barcode.

**Contract:** Export `BarcodelessItemForm`. It uses `useActionState` around `createItemWithoutBarcode`, as `ItemCreateForm` does with `createItem` (`item-create-form.tsx` lines 62-72). It renders an `h2` with the text `Or add an item without a barcode`, one labeled text field named `name` (label `Item name`, `id="barcodeless-item-name"`, `autoComplete="off"`), a `role="alert"` region for the error message, and a submit button with the text `Add without barcode` disabled while pending. Use the shared class names from `src/app/styles/class-names.ts`. A name-field error sets `aria-invalid` on the field.

**File:** `src/app/inventory/new/page.tsx`

**Intent:** Offer the form when no barcode is given.

**Contract:** In the `!barcode` branch (lines 33-44), render `BarcodeLookupForm` and `BarcodelessItemForm` together. Every branch that has a valid barcode stays as it is. The page shows the form for an empty barcode and for an invalid one.

### Success Criteria

#### Automated Verification

- `pnpm test` passes `src/lib/items/create-new-item-without-barcode.test.ts`: a returned id comes back unchanged, and an RPC error or a non-string result throws an `Error` that names the item.
- `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` exit 0.

#### Manual Verification

- `pnpm exec supabase db push` applies the migration. `select to_regprocedure('public.create_item_without_barcode(text)')` is not null. `has_function_privilege('anon', ..., 'execute')` is false and `has_function_privilege('authenticated', ..., 'execute')` is true.
- As a member in SQL, `create_item_without_barcode('Cinnamon')` adds one `items` row, one `household_inventory` row at quantity 0 with minimum 3, and no `item_barcodes` row. A blank name raises the blank-name message and adds nothing.
- On `/inventory/new` with no `barcode` parameter, the barcode lookup form and the `Or add an item without a barcode` form both show. Submitting `Cinnamon` lands on `/inventory` with a `Cinnamon` row at `[-] 0 [+]` colored CRITICAL.
- Submitting a blank name shows `Item does not match length restrictions` under the field and creates no item.
- Searching `cinn` on `/inventory` shows the `Cinnamon` row. Pressing `[+]` twice shows a count of 2, and `/inventory/{itemId}` shows `Count: 2`.
- `/inventory/new?barcode=<valid unknown barcode>` still shows the item create form, and a scanned or known barcode behaves as before.

---

## Testing Strategy

### Unit Tests

- `quantity-adjustment.test.ts`: the guard accepts `1` and `-1` and rejects `0`, `2`, `1.5`, `NaN`, strings, `null`, and `undefined`.
- `adjust-hab-unit-quantity.test.ts`: the rpc name and arguments, a quantity of 0 as a valid result, `below-zero` for `23514`, and throws for other errors and malformed data.
- `filter-items-by-name.test.ts`: empty, whitespace-only, case, middle-of-name, trimmed query, no match, order, empty list, and no mutation.
- `create-new-item-without-barcode.test.ts`: the rpc name and arguments, a returned id, and throws for an error and for non-string data.
- No test is added for the server actions or the client components. The repository has no harness for them, and Vitest stays on `src/**/*.test.ts`. The manual steps below cover them.

### Integration Tests

- The two migrations run against the linked Supabase project through the SQL checks in Phases 1 and 3. They cover the floor, the delta guard, the household scope, and the absence of an `item_barcodes` row.

### Manual Testing Steps

1. Run `pnpm exec supabase db push`, then `pnpm dev` and sign in with a household that has at least two scanned items.
2. On `/inventory`, press `[+]` and `[-]` on one item. Check the count, the stock text color on the name and buttons, and `/inventory/{itemId}`.
3. Lower an item to 0. Check that `[-]` is disabled.
4. Type part of an item name in lower case and in upper case. Check the filtered list, then a query that matches nothing, then clear the field.
5. Adjust a count while the filter is set. Check the filter stays.
6. Open `/inventory/new`, add `Cinnamon` with no barcode, and check the row at 0.
7. Search `cinn`, press `[+]` twice, and check the count is 2.
8. Scan an item up in stocking mode, lower it by hand, then undo the scan line. Check the S-04 reversal either succeeds or shows its below-0 message and never leaves the count negative.

## Migration and Rollback

Both migrations only add functions. They change no table and no existing function, so the build on `main` keeps working when they are applied first. Apply them with `pnpm exec supabase db push` before deploying the app. To roll back, deploy the previous app build, then `drop function public.adjust_household_quantity(uuid, integer)` and `drop function public.create_item_without_barcode(text)`. Items created without a barcode stay as rows and keep working in the tally.

## References

- Roadmap: `context/foundation/roadmap.md` (S-05, prerequisite S-02 done)
- PRD: `context/foundation/prd.md` (FR-006, FR-013, FR-007 floor of 0, guardrail 2)
- Shape notes: `context/foundation/shape-notes.md` line 34 (items without barcodes are adjusted by hand after a name search)
- Placeholder controls: `src/app/inventory/page.tsx` lines 42-47 and 78-96
- Tally loader: `src/lib/items/load-hab-unit-items.ts` lines 69-92
- Action and write conventions: `src/app/inventory/actions.ts` lines 63-75 and 295-353
- Floor refusal by SQLSTATE: `src/lib/items/reverse-quantity-change.ts` lines 1-52 and `supabase/migrations/20261029184707_reverse_quantity_change.sql` lines 46-52
- Household resolution in a function: `supabase/migrations/20261030055001_add_household_minimum_quantity.sql` lines 18-34
- Item creation to mirror: `supabase/migrations/20260916120209_create_items.sql` lines 89-138
- Existing name filter: `src/app/inventory/new/item-create-form.tsx` lines 81-87
- New-item page branch: `src/app/inventory/new/page.tsx` lines 33-44
- Wrapper test pattern: `src/lib/items/set-hab-unit-minimum-quantity.test.ts`
- Prior plans: `context/changes/using-mode-decrease-and-undo/plan-brief.md`, `context/changes/minimum-and-restock-flag/plan-brief.md`, `context/archive/2026-09-13-scan-to-create-item/plan.md` line 37

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Hand adjustment of a count

#### Automated

- [x] 1.1 `pnpm test` passes `src/lib/items/quantity-adjustment.test.ts`: only `1` and `-1` are accepted. `243ca3e`
- [x] 1.2 `pnpm test` passes `src/lib/items/adjust-hab-unit-quantity.test.ts`: an adjusted result returns the quantity including `0`, code `23514` returns `below-zero`, and another RPC error or a malformed result throws an `Error` that names the item id. `243ca3e`
- [x] 1.3 `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` exit 0. `243ca3e`

#### Manual

- [x] 1.4 `pnpm exec supabase db push` applies the migration. `to_regprocedure('public.adjust_household_quantity(uuid, integer)')` is not null, `anon` cannot execute it, and `authenticated` can.
- [ ] 1.5 As a member in SQL, a delta of `1` and `-1` move the count by 1, a delta of `0` or `2` raises, `-1` at 0 raises SQLSTATE `23514` and leaves the count at 0, another household's item id raises the `does not stock` message, and no call adds a row to `household_quantity_changes`.
- [ ] 1.6 On `/inventory`, `[+]` and `[-]` change a row's count by 1, the name, count, and `[+]` / `[-]` use the stock text color, the row background stays plain, a refresh keeps the count, and `/inventory/{itemId}` shows the same count.
- [ ] 1.7 On a row at 0, `[-]` is disabled, and a stale tab that presses `[-]` after the count reached 0 elsewhere shows `The count cannot go below 0.` under the row and the count stays 0.
- [ ] 1.8 A double tap on `[+]` raises the count by 1, and both buttons are disabled while a press is pending.

### Phase 2: Name search

#### Automated

- [x] 2.1 `pnpm test` passes `src/lib/items/filter-items-by-name.test.ts`: an empty or whitespace query returns every item, matching ignores case and surrounding spaces, no match returns an empty array, and the input is unchanged. `b9c71c6`
- [x] 2.2 `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` exit 0. `b9c71c6`

#### Manual

- [ ] 2.3 On `/inventory`, typing part of an item name in any case narrows the list to matching items with `[-] {count} [+]` on each row, and clearing the field shows every item again.
- [ ] 2.4 A query that matches nothing shows `No item matches "{query}".` and no rows, and the Add item and Scan item buttons are still there.
- [ ] 2.5 Pressing `[+]` on a row in a filtered list changes that count and keeps the search text and the filtered list.
- [ ] 2.6 A household with no items shows `Nothing is added here yet.` and no search field.

### Phase 3: Item without a barcode

#### Automated

- [x] 3.1 `pnpm test` passes `src/lib/items/create-new-item-without-barcode.test.ts`: a returned id comes back unchanged, and an RPC error or a non-string result throws an `Error` that names the item. `c43a151`
- [x] 3.2 `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` exit 0. `c43a151`

#### Manual

- [x] 3.3 `pnpm exec supabase db push` applies the migration. `to_regprocedure('public.create_item_without_barcode(text)')` is not null, `anon` cannot execute it, and `authenticated` can.
- [ ] 3.4 As a member in SQL, `create_item_without_barcode('Cinnamon')` adds one `items` row, one `household_inventory` row at quantity 0 with minimum 3, and no `item_barcodes` row, and a blank name raises and adds nothing.
- [ ] 3.5 On `/inventory/new` with no `barcode` parameter, both forms show, and submitting `Cinnamon` lands on `/inventory` with a `Cinnamon` row at `[-] 0 [+]` colored CRITICAL.
- [ ] 3.6 Submitting a blank name shows `Item does not match length restrictions` under the field and creates no item.
- [ ] 3.7 Searching `cinn` on `/inventory` shows the `Cinnamon` row, pressing `[+]` twice shows a count of 2, and `/inventory/{itemId}` shows `Count: 2`.
- [ ] 3.8 `/inventory/new?barcode=<valid unknown barcode>` still shows the item create form, and a known barcode behaves as before.
