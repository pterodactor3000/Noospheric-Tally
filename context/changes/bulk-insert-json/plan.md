# Bulk insert items from a JSON file Implementation Plan

## Overview

A member can add many items to the hab unit tally from one JSON file on the add item view. The file is an array of `{ name, barcode }` objects. One database function inserts every entry in a single transaction, so a file with one bad entry changes nothing. This is Linear TEC-51 (GitHub issue 50, parent TEC-46). There is no roadmap item and no PRD requirement id for it. The acceptance criteria in TEC-51 are the scope.

## Current State Analysis

- An item can only be created one at a time. `createItem` validates one name and one barcode, then calls `create_item` or adds an existing global item (`src/app/inventory/actions.ts:105-173`).
- `create_item` is the model for the new function. It reads `auth.uid()`, finds the caller's household, rejects a barcode that already exists, then inserts into `items`, `item_barcodes`, and `household_inventory` (`supabase/migrations/20261030191000_create_item_with_category.sql:13-67`). It revokes from `public` and `anon` and grants to `authenticated` (`:69-70`).
- `create_item` does not set `quantity`, so a new row gets the column default of 0 (`supabase/migrations/20260916120209_create_items.sql:29`). The category column defaults to `uncategorized` (`supabase/migrations/20261030190000_add_household_inventory_category.sql:1-2`, `src/lib/items/item-category.ts:11`). Bulk insert must set `quantity` to 1 itself and leave `category` to the default.
- The database already enforces the entry rules. `items.name` must be 1 to 120 characters after trimming (`20260916120209_create_items.sql:6-10`). A barcode is 8 to 14 digits and unique across all households (`:18-20`). A household holds one row per item (`:31`).
- `validateBarcode` trims, expands UPC-E to UPC-A, checks 8 to 14 digits and the GS1 check digit, and returns the normalized barcode (`src/lib/items/validate-barcode.ts:151-197`). `validateItemName` trims and allows 1 to 120 characters (`src/lib/items/validate-item-name.ts:15-29`). Both return a `status` discriminated union.
- The RPC wrapper pattern is a small client interface plus a function that throws with the operation and input and attaches `cause` (`src/lib/items/create-new-item.ts:10-46`). Its tests inject a stub client (`src/lib/items/create-new-item.test.ts:12-28`, `:56-84`). RPC names live in `src/lib/db/entities.ts:13-21` and the export list at `:23-43`.
- Actions follow one shape. They validate input, run the write in `try/catch`, log with `console.error`, return `{ status: 'error', message }`, and call `redirectToInventory()` outside the `try` (`src/app/inventory/actions.ts:175-195`, `:100-103`). `saveItemLevels` returns `Promise<ItemActionError>` because success redirects (`:383-385`). `src/app/inventory/actions.ts` is a `'use server'` file, so it can export only async functions. Its message constants are not exported (`:72-80`).
- The add item view renders `BarcodeLookupForm` and `BarcodelessItemForm` when there is no valid barcode in the URL (`src/app/inventory/new/page.tsx:35-48`). `BarcodelessItemForm` is a collapsible section with a chevron, `useActionState`, and `FormAlert` (`src/app/inventory/new/barcodeless-item-form.tsx:26-47`, `:49-55`, `:95-137`).
- Next.js limits a Server Action body to 1MB by default (`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md:59-63`). `next.config.ts` sets nothing (`next.config.ts:3-5`). A 256KB limit in the action sits under that default.
- No server action in the repo has a unit test. Vitest runs `src/**/*.test.ts` in the `node` environment (`vitest.config.mts:15-16`).
- TEC-50 (new items start at 1, counts cap at 99) is a separate, unstarted issue. This change does not depend on its code. It sets `quantity = 1` in its own function.

## Desired End State

On `/inventory/new` with no barcode in the URL, a member opens "Or add many items from a JSON file", selects a `.json` file, and submits. Every entry becomes an item on this hab unit tally with its name, its barcode, a count of 1, and the `uncategorized` category, then the member lands on `/inventory`. A file that is not a JSON array of `{ name, barcode }` objects, has a bad entry, has a duplicate barcode, has a barcode that already exists, has more than 500 entries, or is larger than 256KB shows an error in the form and changes nothing.

Verify with the unit tests, the migration applied with `supabase db push`, and the manual upload steps under Phase 3.

## What We're NOT Doing

- TEC-50: no change to the 99 cap, the 999999 cap, or the starting count of single-item create.
- No change to `create_item`, `create_item_without_barcode`, or `createItem`.
- No partial import. One bad entry rejects the whole file.
- No `category` field in the file. A `category` key, or any other extra key, is ignored.
- No change to `next.config.ts` or its server action body limit.
- No scan-flow change.
- No roadmap or PRD edit.
- No new phase beyond the three below.

## Implementation Approach

Build the pure file check first, then the all-or-nothing database function with its wrapper, then wire both into a server action and a form. Each phase is testable on its own. The database function mirrors `create_item` for the caller and household lookup and for the security grants, and it checks each entry again inside the function because it is the last line of defense. The wrapper mirrors `createNewItem`. The form mirrors `BarcodelessItemForm`. The action mirrors `createItemWithoutBarcode` and `saveItemLevels`.

## Critical Implementation Details

- **Atomicity.** `create_items_bulk` is one plpgsql function call, so PostgREST runs it in one transaction. Any `raise exception` rolls back every insert before it. The function must not catch and continue.
- **Index convention.** In every message, "index" is the zero-based position in the JSON array, written `entries[2]`. A barcode shown in a message is the string as typed, cut to its first 20 characters, because the file is untrusted and can be 256KB.
- **Error text for a conflict in the database.** The function raises exactly `create_items_bulk conflict at index <n> barcode <digits>`, with the zero-based index and the trimmed barcode. The wrapper puts that rpc error on `cause`, and the action logs it. The member sees `entries[<n>] uses barcode <digits>, which already exists.` Any other write failure still returns `ITEM_WRITE_FAILURE_MESSAGE`. The action never returns the raw database error. The parser names problems it can see in the file alone.
- **Parameter name.** The function parameter is named `items`, which is also a table name. Every table reference in the function body is schema-qualified (`public.items`), and `set search_path = ''` is set, so there is no ambiguity. Keep both.
- **Existing barcode.** A barcode that already exists in any household makes the function raise. `createItem` instead adds the existing global item to the hab unit (`src/app/inventory/actions.ts:139-141`). Bulk insert does not. This follows the all-or-nothing decision and keeps the function to inserts only.
- **Server action file rule.** Constants for the 256KB limit stay unexported in `actions.ts`. The 500-entry limit is exported from the parser file, which is not a `'use server'` file.

## Phase 1: Parse and validate the JSON file

### Overview

A pure function turns an unknown value into a list of `{ name, barcode }` entries or one error message that names the first bad entry. No I/O.

### Changes Required

#### 1. Parser

**File:** `src/lib/items/parse-bulk-items-file.ts` (create)

**Intent:** Check the whole parsed file with the existing validators, so the action and the database function never see a shape the member could have fixed. Reuse `validateItemName` and `validateBarcode` and add only the array shape, the duplicate check, and the size limit.

**Contract:** Exports `parseBulkItemsFile(value: unknown): BulkItemsParseResult`, the interface `BulkItemEntry`, and the constant `BULK_ITEMS_MAX_ENTRIES = 500`. The result is a discriminated union:

```typescript
interface BulkItemEntry {
  readonly name: string
  readonly barcode: string
}

interface ValidBulkItems {
  readonly status: 'valid'
  readonly entries: readonly BulkItemEntry[]
}

interface InvalidBulkItems {
  readonly status: 'invalid'
  readonly message: string
}
```

Checks run in this order, and the first failure returns:

1. The value is not an array: `The file must be a JSON array of items.`
2. The array is empty: `The file has no items.`
3. The array is longer than 500: `The file has 501 items. The limit is 500.` (the real count). This runs before any entry check so a large file fails cheaply.
4. Then each entry in index order. With `P` meaning `entries[<index>]`, or `entries[<index>] (barcode <first 20 characters>)` when the entry's `barcode` is a string:
   - not a plain object (`null`, an array, or a primitive): `entries[<index>] must be an object with a name and a barcode.`
   - `name` missing or not a string: `<P> needs a text name.`
   - `barcode` missing or not a string: `entries[<index>] needs a text barcode.`
   - name fails `validateItemName`: `<P>: <validator message>`
   - barcode fails `validateBarcode`: `<P>: <validator message>`
   - normalized barcode seen earlier in the file: `entries[<index>] repeats the barcode <normalized barcode> from entries[<first index>].`

On success, `entries` holds the trimmed name and the normalized barcode, in file order. No `category` key is read. Extra keys are ignored. The function does not mutate its input and never throws.

#### 2. Parser tests

**File:** `src/lib/items/parse-bulk-items-file.test.ts` (create)

**Intent:** Pin each rejection and the boundary, with test names that state behavior.

**Contract:** Uses `describe` and `test` from `vitest` and asserts with `toEqual`. A local helper builds a valid GTIN-13 from a counter by appending its GS1 check digit, so the 500-entry test needs no fixture file. Tests cover:

- returns the entries with trimmed names and normalized barcodes for a valid file (include one UPC-E barcode that expands to its UPC-A form)
- ignores a `category` key and any other extra key
- rejects an empty array
- rejects `null`, a string, a number, and a plain object as non-arrays
- rejects a `null` entry, an array entry, and a string entry, naming the index
- rejects a missing name, a non-string name, a missing barcode, and a non-string barcode, naming the index
- rejects a blank name and a name over 120 characters
- rejects an invalid barcode and names the index and the barcode
- cuts a very long barcode to 20 characters in the message
- rejects a duplicate barcode, naming the second index and the first index
- rejects a duplicate that only matches after normalization (the same barcode with surrounding spaces)
- reports the first bad entry when several are bad
- accepts exactly 500 valid entries and rejects 501 with the count in the message

### Success Criteria

#### Automated Verification

- `pnpm test src/lib/items/parse-bulk-items-file.test.ts` passes and includes every case above.
- `pnpm typecheck` passes.
- `pnpm lint` passes.

#### Manual Verification

- Read the test expectations and confirm every entry-level message names `entries[<index>]` and, when the barcode is a string, the barcode.
- Run the parser on the example file attached to TEC-46 in a throwaway script or test and confirm it returns 11 entries. Delete the script before committing.

---

## Phase 2: Atomic bulk create RPC and its wrapper

### Overview

One security definer function inserts every entry in a single transaction with a count of 1. A wrapper calls it through an injected client.

### Changes Required

#### 1. Migration

**File:** `supabase/migrations/20261031190000_create_items_bulk.sql` (create)

**Intent:** Add `create_items_bulk(items jsonb)`. The timestamp is later than the newest migration, `20261030210000_set_household_item_levels_expected_category.sql`. Do not edit any existing migration.

**Contract:** `create function public.create_items_bulk(items jsonb) returns integer`, `language plpgsql`, `security definer`, `set search_path = ''`. It returns the number of items inserted. In order:

1. Raise if `auth.uid()` is null, and raise if the caller has no household. Use the same lookup as `create_item` (`20261030191000_create_item_with_category.sql:14-31`), with messages that start `create_items_bulk requires ...`.
2. Raise unless `items` is a JSON array with 1 to 500 elements.
3. Loop over the elements in order with their zero-based index. For each element, raise unless it is a JSON object whose `name` and `barcode` are both JSON strings. Trim both. Raise unless the trimmed name is 1 to 120 characters and the trimmed barcode matches `^[0-9]{8,14}$`.
4. Raise if the barcode is already in `public.item_barcodes`, which also catches a repeat inside the same file because earlier inserts are visible to later iterations. The message is exactly `create_items_bulk conflict at index <n> barcode <digits>`.
5. Insert into `public.items (name)`, then `public.item_barcodes (item_id, barcode)`, then `public.household_inventory (household_id, item_id, name, quantity)` with `quantity` set to 1. The insert leaves `category` out so the column default `uncategorized` applies.
6. Return the count.

Every raised message starts `create_items_bulk` and, for an entry problem, names the index. There is no `exception when others` block. Finish with `revoke all on function public.create_items_bulk(jsonb) from public, anon;` and `grant execute on function public.create_items_bulk(jsonb) to authenticated;`, matching `20261030191000_create_item_with_category.sql:69-70`.

#### 2. RPC name constant

**File:** `src/lib/db/entities.ts` (edit)

**Intent:** Register the new function name where the others live.

**Contract:** Add `DB_FUNCTION_CREATE_ITEMS_BULK = 'create_items_bulk'` after `DB_FUNCTION_CREATE_ITEM_WITHOUT_BARCODE` (`:21`) and add it to the export list (`:23-43`).

#### 3. Wrapper

**File:** `src/lib/items/create-bulk-items.ts` (create)

**Intent:** Call the function through an injected client so tests need no database, the same way `createNewItem` does.

**Contract:** Exports `createBulkItems(entries: readonly BulkItemEntry[], client: CreateBulkItemsClient): Promise<number>` and the type `CreateBulkItemsClient`. The client has one method, `rpc(functionName: typeof DB_FUNCTION_CREATE_ITEMS_BULK, args: { items: readonly BulkItemEntry[] })`, returning `PromiseLike<{ data: unknown; error: { message: string } | null }>`. `BulkItemEntry` comes from `./parse-bulk-items-file`. The function resolves with the inserted count when `error` is null and `data` is a number equal to `entries.length`. Otherwise it throws `new Error(`create_items_bulk failed for ${entries.length} items`, error ? { cause: error } : undefined)`.

#### 4. Wrapper tests

**File:** `src/lib/items/create-bulk-items.test.ts` (create)

**Intent:** Cover the success, error, and empty-result paths with a stub client.

**Contract:** Same style as `create-new-item.test.ts`. The stub asserts the function name and the `items` argument. Tests:

- returns the inserted count from a successful rpc
- passes the entries to the rpc unchanged
- rejects with the input count and the rpc error as `cause` when the rpc returns an error
- rejects when the rpc returns no data
- rejects when the rpc returns a count that differs from the input length

### Success Criteria

#### Automated Verification

- `pnpm test src/lib/items/create-bulk-items.test.ts` passes.
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `ls supabase/migrations | tail -n 1` prints `20261031190000_create_items_bulk.sql`, so the new file sorts after every existing migration.

#### Manual Verification

- Apply the migration with `pnpm exec supabase db push` to the linked project, as `README.md:44-51` describes. The repo has no `supabase/config.toml`, so there is no local stack.
- In a SQL session inside a transaction that you roll back, `set local role authenticated`, set `request.jwt.claims` to a member's `sub`, then run `select public.create_items_bulk('[{"name":"A","barcode":"4260512871529"},{"name":"B","barcode":"4260512871420"}]'::jsonb)`. It returns 2 and adds two `household_inventory` rows with `quantity` 1 and `category` `uncategorized`.
- A call with one new barcode and one barcode that already exists raises and leaves the row counts in `items`, `item_barcodes`, and `household_inventory` unchanged.
- A call as `anon` is refused with a permission error.

---

## Phase 3: Server action and add item view form

### Overview

A member picks a file on the add item view. The action checks the file, runs the parser, calls the wrapper, and redirects on success or returns an error on any failure.

### Changes Required

#### 1. Server action

**File:** `src/app/inventory/actions.ts` (edit)

**Intent:** Add `createItemsFromJsonFile`, written like `createItemWithoutBarcode` (`:175-195`) and typed like `saveItemLevels` (`:383-385`), because success redirects.

**Contract:** `createItemsFromJsonFile(formData: FormData): Promise<ItemActionError>`. Add it to the export list (`:496-507`). Add unexported constants for the 256KB limit (262144 bytes) and for the messages below. Steps, in order, each returning `{ status: 'error', message }` on failure:

1. Read `formData.get('file')`. If it is not a `File` or has size 0, return `Choose a JSON file.`
2. If `file.size` is over 262144, return `The file is larger than 256KB.`
3. Read the text with `file.text()` and `JSON.parse` it inside `try/catch`. On failure, log with `console.error('createItemsFromJsonFile failed to read the file', { fileSize, error })` and return `The file is not valid JSON.`
4. Call `parseBulkItemsFile`. On `invalid`, return its `message` unchanged.
5. Inside `try/catch`, call `createBulkItems(entries, await createClient())`. On failure, log `console.error('createItemsFromJsonFile failed', { entryCount, error })`. If the thrown error's `cause.message` matches `create_items_bulk conflict at index <n> barcode <digits>`, return `entries[<n>] uses barcode <digits>, which already exists.` Any other failure returns `ITEM_WRITE_FAILURE_MESSAGE`. Never return the raw database error.
6. Call `redirectToInventory()` outside the `try`, as the other actions do (`:100-103`, `:194`).

The action never logs file contents. It imports `parseBulkItemsFile` and `createBulkItems` and adds no new field to `ItemActionError`.

#### 2. Bulk insert form

**File:** `src/app/inventory/new/bulk-insert-form.tsx` (create)

**Intent:** A collapsible section that looks and behaves like `BarcodelessItemForm` and posts a file. Copy its toggle, chevron, grid-rows transition, `inert` and `aria-hidden` handling, `useActionState`, and `FormAlert` use (`barcodeless-item-form.tsx:26-47`, `:49-55`, `:83-137`). Keep a local chevron component instead of refactoring the existing one.

**Contract:** Client component exporting `BulkInsertForm` with no props. The heading button reads `Or add many items from a JSON file`, sets `aria-expanded`, and controls `bulk-insert`. The form has `id="bulk-insert"` and `action={formAction}` bound to `createItemsFromJsonFile`. It holds one labelled file input, `name="file"`, `type="file"`, `accept=".json,application/json"`, using `Label`, `Input`, `fieldStack`, `fieldLabel`, and `fieldControl`. A submit button labelled `Add items from file` is disabled while `isPending` and sits inside `FormAlert`, which shows `state.message` when `state.status === 'error'`. The file input has an id that differs from any id in the barcodeless form.

#### 3. Page

**File:** `src/app/inventory/new/page.tsx` (edit)

**Intent:** Show the section where the other no-barcode options show.

**Contract:** Import `BulkInsertForm` next to the other form imports (`:11-15`) and render it after `<BarcodelessItemForm />` in the `!barcode` branch (`:35-48`). The branches that handle a barcode in the URL are unchanged.

### Success Criteria

#### Automated Verification

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes with the Phase 1 and Phase 2 tests included.

#### Manual Verification

- Open `/inventory/new` with no barcode, expand the bulk section, upload the 11-entry example file attached to TEC-46, and confirm the redirect to `/inventory` and 11 new rows, each with its file name, a count of 1, and the `uncategorized` category.
- Upload a wrong-shape file (for example a JSON object instead of an array) and confirm the error appears in the form. Confirm the tally is unchanged.
- Upload a file with one invalid barcode among valid entries and confirm the message names that entry's index and barcode and that no entry from the file appears on the tally.
- Upload the example file a second time and confirm the message names the first existing entry by index and barcode, and the tally still has the same rows.
- Confirm the section does not render on `/inventory/new?barcode=<valid barcode>`.

---

## Testing Strategy

### Unit Tests

- The parser covers empty, non-array, `null`, non-object entries, missing and non-string fields, invalid name and barcode, in-file duplicates, normalization, and the 500 and 501 boundary.
- The wrapper covers success, rpc error with `cause`, missing data, and a count mismatch.

### Integration Tests

- The database function runs against the linked Supabase project in the Phase 2 manual checks, inside a rolled-back transaction. The repo has no database test harness and no local Supabase config, and this change adds neither.
- The server action has no unit test, like every other action in the repo. Its branches are covered by the Phase 3 manual steps.

### Manual Testing Steps

1. Apply the migration with `pnpm exec supabase db push` to the project the app points at.
2. Sign in as a member with a hab unit and open `/inventory/new`.
3. Upload the 11-entry example, then a wrong-shape file, then a file with one bad barcode, then the example again, and check the tally after each.

## Migration and Rollback

The migration only adds a function, so it is safe to run before the app code ships and nothing reads it until Phase 3. To reverse it, add a new migration that runs `drop function public.create_items_bulk(jsonb);`. Do not edit the applied migration. Items already inserted by the function are ordinary rows and stay.

## References

- Roadmap: none. No roadmap item covers this change.
- PRD: none. No PRD requirement id covers this change. The Linear issue TEC-51 and its parent TEC-46 own the intent.
- `src/app/inventory/actions.ts:27`, `:38-42`, `:72-80`, `:95-103`, `:105-173`, `:175-195`, `:383-385`, `:496-507`
- `src/app/inventory/new/page.tsx:11-15`, `:35-48`
- `src/app/inventory/new/barcodeless-item-form.tsx:26-47`, `:49-55`, `:83-137`
- `src/lib/items/validate-barcode.ts:151-199`
- `src/lib/items/validate-item-name.ts:15-31`
- `src/lib/items/item-category.ts:11`
- `src/lib/items/create-new-item.ts:10-49`
- `src/lib/items/create-new-item.test.ts:12-28`, `:56-84`
- `src/lib/db/entities.ts:13-43`
- `README.md:44-51`
- `supabase/migrations/20261030191000_create_item_with_category.sql:13-70`
- `supabase/migrations/20260916120209_create_items.sql:1-35`
- `supabase/migrations/20261030190000_add_household_inventory_category.sql:1-8`
- `vitest.config.mts:15-16`
- `next.config.ts:3-5`
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md:59-63`

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Parse and validate the JSON file

#### Automated

- [x] 1.1 `pnpm test src/lib/items/parse-bulk-items-file.test.ts` passes and includes every listed case (db7adf5)
- [x] 1.2 `pnpm typecheck` passes (db7adf5)
- [x] 1.3 `pnpm lint` passes (db7adf5)

#### Manual

- [x] 1.4 Every entry-level message in the tests names `entries[<index>]` and, when the barcode is a string, the barcode (db7adf5)
- [x] 1.5 The parser returns 11 entries for the example file attached to TEC-46, and the throwaway script is deleted (d87041f)

### Phase 2: Atomic bulk create RPC and its wrapper

#### Automated

- [x] 2.1 `pnpm test src/lib/items/create-bulk-items.test.ts` passes (6b1314e)
- [x] 2.2 `pnpm typecheck` passes (6b1314e)
- [x] 2.3 `pnpm lint` passes (6b1314e)
- [x] 2.4 `ls supabase/migrations | tail -n 1` prints `20261031190000_create_items_bulk.sql` (6b1314e)

#### Manual

- [ ] 2.5 After `pnpm exec supabase db push`, a valid two-entry call in a rolled-back transaction returns 2 and adds two rows with `quantity` 1 and `category` `uncategorized`
- [ ] 2.6 A call with one existing barcode raises and leaves the row counts in `items`, `item_barcodes`, and `household_inventory` unchanged
- [ ] 2.7 A call as `anon` is refused with a permission error

### Phase 3: Server action and add item view form

#### Automated

- [x] 3.1 `pnpm lint` passes (675575a)
- [x] 3.2 `pnpm typecheck` passes (675575a)
- [x] 3.3 `pnpm test` passes with the Phase 1 and Phase 2 tests included (675575a)

#### Manual

- [ ] 3.4 The 11-entry example file redirects to `/inventory` and adds 11 rows with their file names, a count of 1, and `uncategorized`
- [ ] 3.5 A wrong-shape file shows an error in the form and leaves the tally unchanged
- [ ] 3.6 A file with one invalid barcode shows a message naming that entry's index and barcode and adds no row from the file
- [ ] 3.7 Uploading the example file a second time names the first existing entry by index and barcode and leaves the tally unchanged
- [ ] 3.8 The bulk section does not render on `/inventory/new?barcode=<valid barcode>`
