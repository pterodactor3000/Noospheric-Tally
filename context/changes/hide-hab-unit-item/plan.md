# Hide an Item from the Hab Unit Tally Implementation Plan

## Overview

A member can open an item's details page and press a hide control. The item then leaves this hab unit's tally. The shared catalog item (`items` and `item_barcodes`) is not deleted, so other hab units that stock it keep it and a barcode scan can still find it. This is Linear TEC-49, https://linear.app/tech-heresy/issue/TEC-49/feat-hide-an-item-from-the-hab-unit-tally.

There is no roadmap item and no roadmap ID. No PRD requirement covers hiding. The TEC-49 acceptance criteria and the closed decisions in `change.md` are the scope. Complexity is Medium: a new database function with an authorization boundary, a destructive write, a server action, and a client control. There are two phases.

## Current State Analysis

How a hab unit's rows are loaded:

- The hab unit's stock lives in `household_inventory`: `household_id`, `item_id`, `name`, `quantity`, `minimum_quantity`, `category`, unique on `(household_id, item_id)` (`supabase/migrations/20260916120209_create_items.sql`, `household_inventory` table). `item_id` references `items(id)` on delete cascade. The reverse is not true: deleting an inventory row does not touch `items`.
- The only RLS policy on `household_inventory` is `household_inventory_select_if_member` (select for authenticated members). There is no insert, update, or delete policy. Every write is a `security definer` function that resolves the caller's household from `household_members` (`create_item`, `add_item_to_household`, `set_household_item_levels`, `adjust_household_quantity`, and the rest). A client delete would be refused.
- The tally loader is `loadHabUnitTallyLines` (`src/lib/items/load-hab-unit-items.ts:73`). It selects every `household_inventory` row visible to the caller, which RLS limits to the caller's hab unit. It has no filter. Both `src/app/inventory/page.tsx:45` and `src/app/inventory/restock/page.tsx` use it, so a missing row drops the item from the tally and from the restock list with no loader change.
- The item page loader is `loadHabUnitItemById` (`src/lib/items/load-hab-unit-item-by-id.ts`). It selects the row by `item_id`. A missing row returns `null`, and `src/app/inventory/[itemId]/page.tsx` calls `notFound()` for `null`. After a hide, the old item URL is a 404, which is correct.
- `loadHabUnitItemByBarcode` (`src/lib/items/load-hab-unit-item-by-barcode.ts`) finds the catalog item with the `find_item_by_barcode` function, then selects the hab unit row. It returns `null` when this hab unit has no row. Scan, lookup, and the create flow all branch on that.

How a hab unit's rows are written:

- All writes go through `src/app/inventory/actions.ts`. `saveItemLevels` (line 483) is the closest model: it validates `itemId` with `isScanSessionId`, calls a wrapper in `src/lib/items/`, logs and returns `ITEM_WRITE_FAILURE_MESSAGE` on error, then calls `revalidatePath('/inventory')`, `revalidatePath('/inventory/<itemId>')`, and `redirect('/inventory')` outside the `try`. The return type is `Promise<ItemActionError>` because success redirects.
- Wrappers take an RPC-shaped `client` argument and are unit tested with a stub (`src/lib/items/set-hab-unit-minimum-quantity.ts` and its `.test.ts`). Database names live in `src/lib/db/entities.ts` (`DB_FUNCTION_*`, lines 7-24, exports from line 26).
- `household_quantity_changes` has a foreign key to `household_inventory (household_id, item_id)` with `on delete cascade` (`supabase/migrations/20261029182809_create_household_quantity_changes.sql`). Deleting an inventory row deletes its quantity changes.

How a row is shown:

- The tally is `src/app/inventory/inventory-tally.tsx`, a client component fed `lines` from the server page. Each row links to `/inventory/<itemId>`.
- The item page is `src/app/inventory/[itemId]/page.tsx`. It renders `ItemLevelEditor` (`src/app/inventory/[itemId]/item-level-editor.tsx`), one `<form>` with hidden inputs `itemId`, `quantity`, `minimumQuantity`, `expectedQuantity`, `expectedCategory` (lines 193-199). Its one `useActionState` runs `saveItemLevels` (line 186). Its action row is `itemActions`, a two column grid with Save and Cancel (lines 311-329). `FormAlert` wraps the row and shows the action error (lines 307-330).

How a hidden item comes back, with existing code only:

- Scan: `stockScannedItem` and `consumeScannedItem` call `loadHabUnitItemByBarcode`. With no row they redirect to `/inventory/new?barcode=<barcode>` (`src/app/inventory/actions.ts`, `stockScannedItem` and `consumeScannedItem`).
- `src/app/inventory/new/page.tsx` loads the hab unit item (none), then `findGlobalItemByBarcode`. The catalog item is still there, so it renders `AddToHabUnitForm`. That form calls `addItemToHousehold`, which calls `add_item_to_household`. That function refuses only when this hab unit already has a row, so it succeeds and inserts a fresh row.
- Lookup (`src/app/inventory/lookup/page.tsx`) reports the barcode as blocked, which is the existing rule for a barcode this hab unit does not stock (FR-017).

Other facts:

- Vitest runs in `node` and includes only `src/**/*.test.ts` (`vitest.config.mts`). There is no component harness and no SQL test harness.
- Migrations are applied with `pnpm exec supabase db push` (`README.md`, "Database migrations"). The latest migration is `20261101091000_cap_household_quantity_at_99.sql`.
- Active and archived change records hold no earlier decision about hiding or deleting an item from a hab unit.

## Desired End State

On `/inventory/<itemId>` the member sees a Hide control. Pressing it removes the item from this hab unit and returns the member to `/inventory`. The tally no longer lists the item, and neither does the restock list. The catalog item still exists. Another hab unit that stocks it is unaffected. Scanning its barcode, or adding that barcode again, puts it back on this hab unit's tally as a fresh row. Opening the old item URL shows not found.

Verify with the checks in each phase and in Testing Strategy.

## What We're NOT Doing

- Tally layout, dropdown alignment, count width, dropping the panel, scan, popups, landing copy, categories, sharing, bulk insert, the count default, and the count cap.
- An unhide control. See Implementation Approach.
- An `is_hidden` or `hidden_at` column, or any filter added to `loadHabUnitTallyLines`, `loadHabUnitItemById`, or `loadHabUnitItemByBarcode`.
- A confirmation dialog. The guard is a second press of the same button, not a dialog.
- Deleting from `items` or `item_barcodes`, or any change to `find_item_by_barcode`.
- Changes to `add_item_to_household`, the scan flow, the lookup flow, or the create flow.
- A new roadmap slice or PRD requirement.
- A component test harness or a SQL test harness.

## Implementation Approach

Hide means: delete this hab unit's `household_inventory` row for the item. One new `security definer` function, `hide_household_item(target_item_id uuid)`, does it for the caller's hab unit only. A TypeScript wrapper calls it, a server action validates input and calls the wrapper, and a Hide button on the item page submits to the action.

Why delete the row and not add a `hidden` flag:

- The contract says "drops the item from this hab unit's tally" and "does not delete the shared catalog item". The shared catalog item is `items`. The per-hab-unit record is `household_inventory`. Removing that row satisfies both sentences exactly.
- A flag would leave a stocked-but-invisible row. `loadHabUnitTallyLines`, `loadHabUnitItemById`, `loadHabUnitItemByBarcode`, the restock page, and `increment_household_quantity` and `decrement_household_quantity` would each need to know about it. Scan would silently change the count of an item the member cannot see. `add_item_to_household` would refuse the item as already stocked, so the existing add flow could not bring it back. That is a wider change and creates the "unreachable" state this plan must avoid.
- Deleting the row reuses the existing return path for barcoded items (scan, then `/inventory/new`, then `AddToHabUnitForm`). Nothing else changes.

Decision on unhide: none is added. The user confirmed on 2026-11-01 that a hidden item comes back when the member scans its barcode or adds that barcode again. Both paths use the existing add form. `add_item_to_household` inserts a fresh `household_inventory` row for the same `items` row. The old count and history stay deleted. Lookup of a barcode this hab unit does not stock stays blocked. An item without a barcode cannot be scanned. Creating one with the same name makes a new `items` row. The old row stays in the catalog with no barcode and no stocking hab unit, so nothing can open it. That orphan is accepted because the contract requires the catalog row to survive.

This follows the existing pattern: a migration with a `security definer` function, a wrapper in `src/lib/items/` with a stubbed unit test, an action beside `saveItemLevels`, and a button in `item-level-editor.tsx`.

## Critical Implementation Details

- **Authorization is in the function.** There is no delete policy on `household_inventory`, and none is added. `hide_household_item` must resolve the household from `auth.uid()` through `household_members` and delete only `where household_id = caller_household_id and item_id = target_item_id`. It must never accept a household id from the caller. Revoke execute from `public` and `anon`, grant to `authenticated`, as `set_household_minimum_quantity` does.
- **Zero rows deleted is success.** If the row is already gone (a double press, or another member hid it first), the end state the member asked for is true. The function does not raise for that case. It still raises for no user and no household, matching its siblings. The wrapper therefore returns `void` on success and throws only on an RPC error.
- **Redirect outside the `try`.** `redirect()` throws a control-flow error. The action calls it after the `try/catch`, as `saveItemLevels` does, so the catch never swallows it.
- **One action state.** The editor stays one `<form>`. Save and Hide are submit buttons with `name="intent"` and values `save` and `hide`. One `useActionState` runs a wrapper that calls `saveItemLevels` or `hideItem`. `FormAlert` reads that one state, so a later Save error replaces an earlier Hide error. Pressing Hide discards unsaved count edits, which is expected because the row is deleted.
- **Two presses.** The first press of Hide does not submit. It arms the button and changes its label to `Confirm hide. This deletes the count and history`. The second press submits `intent=hide`. Pressing Save clears the armed state. There is no dialog.
- **Pending state.** Disable both Save and Hide while the action is pending.
- **History is lost.** Deleting the inventory row cascades to `household_quantity_changes` for that item and hab unit. An open scan session in another tab that undoes a line for that item then fails with the write failure message, because `reverse_quantity_change` no longer finds the change row. That is an accepted consequence. Nothing outside this hab unit is affected.

## Phase 1: Hide function and wrapper

### Overview

Add the database function and a tested TypeScript wrapper. The phase is complete when the migration is written, the wrapper calls it with the right arguments, and unit tests cover success and error. The migration is applied to the linked project in the manual checks.

### Changes Required

#### 1. Migration

**File:** `supabase/migrations/20261101100000_hide_household_item.sql` (new)

**Intent:** Give a member a way to remove one item from their own hab unit without a delete policy and without touching the catalog.

**Contract:**

- `create function public.hide_household_item(target_item_id uuid) returns void`, `language plpgsql`, `security definer`, `set search_path = ''`.
- Declare `caller_id uuid := auth.uid()` and `caller_household_id uuid`.
- Raise `'hide_household_item requires an authenticated user'` when `caller_id` is null.
- Select `caller_household_id` from `public.household_members` where `user_id = caller_id`. Raise `'hide_household_item requires a household'` when it is null.
- Raise `'hide_household_item rejects a missing item id'` when `target_item_id` is null.
- `delete from public.household_inventory as inventory where inventory.household_id = caller_household_id and inventory.item_id = hide_household_item.target_item_id`. No check on the number of rows. No other table is written.
- `revoke all on function public.hide_household_item(uuid) from public, anon;` then `grant execute on function public.hide_household_item(uuid) to authenticated;`.
- No change to any existing function, policy, or table. The migration is additive and needs no data backfill.

#### 2. Database name constant

**File:** `src/lib/db/entities.ts`

**Intent:** Keep the function name in one place, as every other function name is.

**Contract:** Add `const DB_FUNCTION_HIDE_HOUSEHOLD_ITEM = 'hide_household_item'` after `DB_FUNCTION_CREATE_ITEMS_BULK` (line 24) and add it to the export list (after line 48).

#### 3. Wrapper

**File:** `src/lib/items/hide-hab-unit-item.ts` (new)

**Intent:** Call the function and turn an RPC error into a thrown error that names the operation and the item.

**Contract:**

- Export `hideHabUnitItem(itemId: string, client: HideHouseholdItemClient): Promise<void>` and the type `HideHouseholdItemClient`.
- `HideHouseholdItemClient` is the same structural RPC shape as `SetHouseholdMinimumQuantityClient`: `rpc(functionName: typeof DB_FUNCTION_HIDE_HOUSEHOLD_ITEM, args: { target_item_id: string }): PromiseLike<{ data: unknown; error: { message: string } | null }>`.
- On `error`, throw `new Error(\`hide_household_item failed for item ${itemId}\`, { cause: error })`.
- On no error, return. The `data` value is not read.

#### 4. Wrapper tests

**File:** `src/lib/items/hide-hab-unit-item.test.ts` (new)

**Intent:** Pin the wrapper's call shape and error behavior, in the style of `set-hab-unit-minimum-quantity.test.ts`.

**Contract:** A stub client asserts `functionName` equals `DB_FUNCTION_HIDE_HOUSEHOLD_ITEM` and `args` equals `{ target_item_id: ITEM_ID }`. Tests:

- resolves with `undefined` when the rpc returns no error
- throws an error with message `hide_household_item failed for item <id>` and the rpc error as `cause` when the rpc returns an error
- sends the item id it was given as `target_item_id`

### Success Criteria

#### Automated Verification

- `pnpm exec vitest run src/lib/items/hide-hab-unit-item.test.ts` passes.
- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm lint` passes with no new warnings in the files this phase touches.
- `rg "hide_household_item" supabase/migrations` matches only `20261101100000_hide_household_item.sql`, and that file contains `security definer`, `set search_path = ''`, `auth.uid()`, and `revoke all on function public.hide_household_item(uuid) from public, anon`.
- `rg "delete from" supabase/migrations/20261101100000_hide_household_item.sql` matches only `public.household_inventory`.

#### Manual Verification

- Confirm the linked project, snapshot it, then `pnpm exec supabase db push` applies `20261101100000_hide_household_item.sql` with no error.
- In the SQL editor or `psql`, set the caller before the call, because `auth.uid()` is null otherwise: `select set_config('request.jwt.claims', '{"sub":"<user uuid>"}', true); set local role authenticated;`. As a member of hab unit A, calling `hide_household_item` for an item A stocks removes that `household_inventory` row and leaves the `items` and `item_barcodes` rows.
- Calling it for the same item again returns without error.
- Calling it for an item that only hab unit B stocks changes nothing in B.

---

## Phase 2: Hide action and control on the item page

### Overview

Add the server action and the Hide button on the item details page. The phase is complete when pressing Hide on an item removes it from the tally, the catalog item stays, and failure shows an alert.

### Changes Required

#### 1. Server action

**File:** `src/app/inventory/actions.ts`

**Intent:** Validate the item id, run the wrapper, refresh the tally, and send the member back to it.

**Contract:**

- Import `hideHabUnitItem` from `@/lib/items/hide-hab-unit-item`, in the existing sorted import block (after `findGlobalItemByBarcode`, line 12).
- Add `hideItem = async (formData: FormData): Promise<ItemActionError>` after `saveItemLevels` (ends line 556).
- Read `itemId` with `getFormString(formData, 'itemId')`. When `!isScanSessionId(itemId)`, `console.error('hideItem rejected item id', { itemId })` and return `{ status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }`.
- In a `try`, `await hideHabUnitItem(itemId, await createClient())`. In the `catch`, `console.error('hideItem failed', { itemId, error })` and return `{ status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }`.
- After the `try/catch`: `revalidatePath('/inventory')`, `revalidatePath('/inventory/restock')`, `revalidatePath(\`/inventory/${itemId}\`)`, then `redirect('/inventory')`.
- Add `submitItemForm`, which reads `intent` from the form. `hide` calls `hideItem`. Any other value calls `saveItemLevels`. Export `submitItemForm` and `hideItem`.
- No new message constant. The existing `ITEM_WRITE_FAILURE_MESSAGE` is reused.

#### 2. Hide control

**File:** `src/app/inventory/[itemId]/item-level-editor.tsx`

**Intent:** Put the hide control on the item details page without disturbing Save, Cancel, or the layout of the page above them.

**Contract:**

- The form's one `useActionState` calls `submitItemForm` instead of `saveItemLevels`.
- Save keeps `type="submit"`, and gains `name="intent"` and `value="save"`.
- Add one `Button` inside `itemActions`, after Cancel: `type="submit"`, `name="intent"`, `value="hide"`, `variant="outline"`, `className={clsx(itemActionButton, 'col-span-2')}`. It sits on its own row under Save and Cancel. Save and Cancel keep their positions and size.
- The first press does not submit. It sets local armed state and the label becomes `Confirm hide. This deletes the count and history`. The second press submits. Pressing Save clears the armed state and submits `intent=save`.
- While the action is pending, Save and Hide are disabled.
- `FormAlert` reads that single action state. A failed Hide followed by a failed Save shows the Save message.
- The hidden inputs, `ItemLevelEditorProps`, `page.tsx`, and every other control are unchanged.

### Success Criteria

#### Automated Verification

- `pnpm typecheck` passes.
- `pnpm lint` passes with no new warnings in `src/app/inventory/actions.ts` and `src/app/inventory/[itemId]/item-level-editor.tsx`.
- `pnpm test` passes. No existing test changes.
- `rg "hideItem" src` matches only `src/app/inventory/actions.ts` and `src/app/inventory/[itemId]/item-level-editor.tsx`.
- `rg "hide_household_item|DB_FUNCTION_HIDE_HOUSEHOLD_ITEM" src` matches only `src/lib/db/entities.ts`, `src/lib/items/hide-hab-unit-item.ts`, and `src/lib/items/hide-hab-unit-item.test.ts`.
- `rg "loadHabUnitTallyLines|loadHabUnitItemById|loadHabUnitItemByBarcode" src` shows no loader file changed (`git diff --stat` lists none of `load-hab-unit-items.ts`, `load-hab-unit-item-by-id.ts`, `load-hab-unit-item-by-barcode.ts`).

#### Manual Verification

- Open an item from `/inventory`. The item page shows a `Hide from tally` button under Save and Cancel, and Save and Cancel look and sit as before.
- The first press changes the label to `Confirm hide. This deletes the count and history` and stays on the item page. The second press returns to `/inventory`, and the item is not on the tally in any category panel, with search empty.
- Reload `/inventory`. The item is still absent. The restock list at `/inventory/restock` does not list it either, even when it was below its minimum before.
- Open the old item URL `/inventory/<itemId>`. The page shows not found.
- Sign in as a member of a second hab unit that stocks the same item. Its tally still lists the item with its own count.
- In the database, the `items` row and the `item_barcodes` row for the item still exist.
- With a barcoded item hidden, scan its barcode in using or stocking direction. The app opens `/inventory/new?barcode=<barcode>` with the add-to-hab-unit form showing the catalog name. Adding it puts it back on the tally with a fresh count.
- On the lookup page, the hidden barcode reports as blocked.
- Edit the count with `[+]` and then press `Hide from tally` without saving. The item is hidden, and no save error shows.
- Cause the server action to throw in a dev database, for example by renaming `hide_household_item` for one call and then restoring it. A visible alert shows the write failure message, the item stays on the tally, and Save and Hide are usable again. Do not use an offline browser as the proof. That fails the request before the action's `catch`.
- After that failed hide, cause Save to fail. The alert shows the Save message, not the old hide message.
- Hide a barcodeless item, then create an item with the same name from the barcodeless form. The new item appears on the tally. The old catalog row is still in `items` and is not the row just created.
- Both buttons are disabled while a hide is in flight, and are reachable by keyboard.

---

## Testing Strategy

### Unit Tests

- `src/lib/items/hide-hab-unit-item.test.ts`: success with no error, thrown error with the item id and `cause` on an RPC error, and the exact RPC name and arguments.
- No test for the action or the button. Vitest includes only `src/**/*.test.ts` in a `node` environment, and the action needs the Next request context and a Supabase client. A harness for either is out of scope.

### Integration Tests

- None automated. No SQL or end-to-end harness exists. The database function and the cross-hab-unit isolation are covered by the manual checks in both phases.

### Manual Testing Steps

1. Run `pnpm exec supabase db push` and confirm `20261101100000_hide_household_item.sql` applies.
2. Sign in with a hab unit that has a barcoded item with a count of 5 and a minimum of 3, and a barcodeless item.
3. Open `/inventory`, then the barcoded item. Confirm the `Hide from tally` button.
4. Press it. Confirm the redirect to `/inventory` and that the item is gone from the tally and from `/inventory/restock`.
5. Open the old item URL. Confirm not found.
6. Check the database: the `items` and `item_barcodes` rows remain, and the `household_inventory` row and its `household_quantity_changes` rows are gone for this hab unit only.
7. Scan the barcode. Confirm the add form opens with the catalog name. Add it and confirm a fresh count of 1.
8. Hide the barcodeless item. Confirm it leaves the tally. Create an item with the same name from the barcodeless form and confirm that new item appears on the tally. The old `items` row remains and is not that new row.
9. As a member of a second hab unit that stocks the same barcoded item, confirm it is unchanged.
10. Repeat step 3-4 at a narrow phone width. Confirm the button does not wrap badly or push Save and Cancel.

## Migration and Rollback

One additive migration, `20261101100000_hide_household_item.sql`. It adds a function and changes no existing object, so it is safe to apply before the code ships. Apply it with `pnpm exec supabase db push` before deploying the Phase 2 code, so the button never calls a missing function. `db push` writes to the project linked in this checkout (`pnpm exec supabase link --project-ref <project-id>`, see `README.md`). Confirm that link and take a snapshot of that project before the push. The README does not name a production project.

Rollback of the code is reverting the commits. Rollback of the function is a new migration that drops it (`drop function public.hide_household_item(uuid)`). Hiding itself is not reversible: a deleted `household_inventory` row and its quantity history cannot be restored from the app. A barcoded item can be added again with a fresh row. Take a database snapshot first if the loss of counts matters before wide use.

## References

- Roadmap: none. This is not a roadmap slice, so there is no roadmap ID and no `context/foundation/roadmap.md` entry.
- PRD: `context/foundation/prd.md`. No requirement covers hiding an item. FR-017 (lookup reads only the household inventory, line 168) is the rule that makes a hidden barcode report as blocked.
- Linear TEC-49: https://linear.app/tech-heresy/issue/TEC-49/feat-hide-an-item-from-the-hab-unit-tally
- Inventory table, unique key, and only select policy: `supabase/migrations/20260916120209_create_items.sql`
- Write-by-function pattern: `supabase/migrations/20261030055001_add_household_minimum_quantity.sql` (`set_household_minimum_quantity`)
- Cascade from inventory to changes: `supabase/migrations/20261029182809_create_household_quantity_changes.sql`
- Latest migration: `supabase/migrations/20261101091000_cap_household_quantity_at_99.sql`
- Tally loader: `src/lib/items/load-hab-unit-items.ts:73`
- Item loader: `src/lib/items/load-hab-unit-item-by-id.ts`
- Barcode loader: `src/lib/items/load-hab-unit-item-by-barcode.ts`
- Add-back path: `src/app/inventory/new/page.tsx`, `src/lib/items/add-item-to-hab-unit.ts`, `src/app/inventory/actions.ts` (`stockScannedItem`, `consumeScannedItem`, `addItemToHousehold`)
- Model action: `src/app/inventory/actions.ts:483-556` (`saveItemLevels`), exports at lines 596-608
- Item page and editor: `src/app/inventory/[itemId]/page.tsx`, `src/app/inventory/[itemId]/item-level-editor.tsx:186`, `:193-199`, `:307-330`
- Tally and restock pages: `src/app/inventory/page.tsx:45`, `src/app/inventory/restock/page.tsx`
- Wrapper and test model: `src/lib/items/set-hab-unit-minimum-quantity.ts`, `src/lib/items/set-hab-unit-minimum-quantity.test.ts`
- Names: `src/lib/db/entities.ts:24-48`
- Test config: `vitest.config.mts`
- Migrations guide: `README.md` ("Database migrations")

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Hide function and wrapper

#### Automated

- [x] 1.1 `pnpm exec vitest run src/lib/items/hide-hab-unit-item.test.ts` passes.
- [x] 1.2 `pnpm test` passes.
- [x] 1.3 `pnpm typecheck` passes.
- [x] 1.4 `pnpm lint` passes with no new warnings in the files this phase touches.
- [x] 1.5 `rg "hide_household_item" supabase/migrations` matches only `20261101100000_hide_household_item.sql`, and that file contains `security definer`, `set search_path = ''`, `auth.uid()`, and `revoke all on function public.hide_household_item(uuid) from public, anon`.
- [x] 1.6 `rg "delete from" supabase/migrations/20261101100000_hide_household_item.sql` matches only `public.household_inventory`.

#### Manual

- [ ] 1.7 After confirming the linked project and taking a snapshot, `pnpm exec supabase db push` applies `20261101100000_hide_household_item.sql` with no error.
- [ ] 1.8 With `request.jwt.claims` set to that member and `role` set to `authenticated`, calling `hide_household_item` for an item hab unit A stocks removes that `household_inventory` row and leaves the `items` and `item_barcodes` rows.
- [ ] 1.9 Calling it for the same item again returns without error.
- [ ] 1.10 Calling it for an item that only hab unit B stocks changes nothing in B.

### Phase 2: Hide action and control on the item page

#### Automated

- [ ] 2.1 `pnpm typecheck` passes.
- [ ] 2.2 `pnpm lint` passes with no new warnings in `src/app/inventory/actions.ts` and `src/app/inventory/[itemId]/item-level-editor.tsx`.
- [ ] 2.3 `pnpm test` passes. No existing test changes.
- [ ] 2.4 `rg "hideItem" src` matches only `src/app/inventory/actions.ts` and `src/app/inventory/[itemId]/item-level-editor.tsx`.
- [ ] 2.5 `rg "hide_household_item|DB_FUNCTION_HIDE_HOUSEHOLD_ITEM" src` matches only `src/lib/db/entities.ts`, `src/lib/items/hide-hab-unit-item.ts`, and `src/lib/items/hide-hab-unit-item.test.ts`.
- [ ] 2.6 `git diff --stat` lists none of `load-hab-unit-items.ts`, `load-hab-unit-item-by-id.ts`, `load-hab-unit-item-by-barcode.ts`.

#### Manual

- [ ] 2.7 The item page shows a `Hide from tally` button under Save and Cancel, and Save and Cancel look and sit as before.
- [ ] 2.8 The first press changes the label to `Confirm hide. This deletes the count and history` and stays on the item page. The second press returns to `/inventory`, and the item is not on the tally in any category panel, with search empty.
- [ ] 2.9 After a reload, the item is still absent from `/inventory` and from `/inventory/restock`, even when it was below its minimum before.
- [ ] 2.10 Opening the old item URL `/inventory/<itemId>` shows not found.
- [ ] 2.11 A member of a second hab unit that stocks the same item still sees it with its own count.
- [ ] 2.12 In the database, the `items` row and the `item_barcodes` row for the hidden item still exist.
- [ ] 2.13 Scanning the barcode of a hidden barcoded item opens `/inventory/new?barcode=<barcode>` with the add-to-hab-unit form showing the catalog name, and adding it puts it back on the tally with a fresh count.
- [ ] 2.14 The lookup page reports the hidden barcode as blocked.
- [ ] 2.15 Editing the count with `[+]` and then pressing `Hide from tally` without saving hides the item, and no save error shows.
- [ ] 2.16 When the server action throws in a dev database, a visible alert shows the write failure message, the item stays on the tally, and Save and Hide are usable again.
- [ ] 2.17 After a failed hide, a failed Save shows the Save message, not the old hide message.
- [ ] 2.18 Hiding a barcodeless item and creating an item with the same name puts the new item on the tally. The old `items` row remains and is not that new row.
- [ ] 2.19 Both buttons are disabled while a hide is in flight, and are reachable by keyboard.
