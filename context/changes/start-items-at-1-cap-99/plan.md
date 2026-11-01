# Start new items at 1 and cap counts at 99 Implementation Plan

## Overview

A new item starts at a count of 1, and no item count can go above 99. This is Linear TEC-50 (GitHub issue 49, parent TEC-46). There is no roadmap item and no PRD requirement id for it. The acceptance criteria in TEC-50 are the scope. Complexity is Medium. The work is one column default, one clamp plus check constraint, four redefined database functions, and the matching app validation, controls, and error handling.

## Current State Analysis

Verified against the code on `feature/tec-50-start-items-at-1-cap-99`.

**Starting count**

- The column is `quantity integer not null default 0` (`supabase/migrations/20260916120209_create_items.sql:29`).
- `create_item` omits `quantity` (`supabase/migrations/20261030191000_create_item_with_category.sql:62-63`). So does `create_item_without_barcode` (`supabase/migrations/20261030081821_create_item_without_barcode.sql:34-35`) and `add_item_to_household` (`supabase/migrations/20260916120209_create_items.sql:186-187`). All three get 0 today.
- `create_items_bulk` already sets `quantity` to 1 (`supabase/migrations/20261031190000_create_items_bulk.sql:80-81`). It stays as is.
- Nothing raises the count after create. `createItem`, `createItemWithoutBarcode`, and `addItemToHousehold` call one RPC and then `redirectToInventory()` (`src/app/inventory/actions.ts:114-190`, `:205-211`, `:311-333`). Changing the default is enough for the add item view.

**Count cap of 999999 (two paths)**

- `adjust_household_quantity` (the tally row `[+]` and `[-]`) refuses `+1` above 999999 with SQLSTATE `22003` (`supabase/migrations/20261030100413_adjust_household_quantity_upper_bound.sql:40`, `:62`, `:65-66`). It is the latest definition, a `create or replace`.
- `set_household_item_levels` (item page Save) rejects `new_quantity` above 999999 (`supabase/migrations/20261030210000_set_household_item_levels_expected_category.sql:33-34`). That is the latest definition. Its signature is `(uuid, integer, integer, integer, text, text)`.
- The app validator caps at 999999 (`src/lib/items/validate-household-quantity.ts:1`, `:3`, `:19-20`, `:33`). `saveItemLevels` runs it (`src/app/inventory/actions.ts:487-490`).
- The controls read the same constant: `[+]` on a tally row (`src/app/inventory/tally-count-controls.tsx:94`) and the Count stepper on the item page (`src/app/inventory/[itemId]/item-level-editor.tsx:259`).
- The refusal text is hardcoded `The count cannot go above 999999.` (`src/app/inventory/actions.ts:79`). `adjustItemQuantity` returns it on `above-maximum` (`:565-567`).

**No cap at all (three paths)**

- `increment_household_quantity(text, uuid)`, used by scan stocking, does `quantity + 1` with no bound (`supabase/migrations/20261029182809_create_household_quantity_changes.sql:80-86`). The wrapper throws on any error and returns the change (`src/lib/items/increment-hab-unit-quantity.ts:39-58`). `stockScannedItem` ignores the return value and redirects (`src/app/inventory/actions.ts:364-375`).
- `reverse_quantity_change` subtracts the stored delta and only checks the result is at least 0 (`supabase/migrations/20261029184707_reverse_quantity_change.sql:42-52`). Undoing a decrement (delta -1) adds 1, so it can go above any cap. Its only refusal raises `check_violation` (`:50-52`).
- The only count check on the table is `household_inventory_quantity_not_negative`, `quantity >= 0` (`supabase/migrations/20261029182809_create_household_quantity_changes.sql:1-3`). There is no upper-bound check.
- The notes in TEC-50 say the cap is 999999. That is true for the two paths above and false for scan stocking and reversal.

**Error plumbing to reuse**

- `adjustHabUnitQuantity` maps error code `22003` to `above-maximum` (`src/lib/items/adjust-hab-unit-quantity.ts:15-17`, `:48-50`). Its constant is private and its comment names 999999.
- `reverseQuantityChange` exports `CHECK_VIOLATION_ERROR_CODE` and maps `23514` to `below-zero` (`src/lib/items/reverse-quantity-change.ts:3-4`, `:36-38`). The action turns that into a message the scan page shows (`src/app/inventory/actions.ts:456-459`).
- The scan page shows any `{ status: 'error', message }` from the stock action (`src/app/inventory/scan/scan-capture.tsx:153-160`). The session list shows the reversal message (`src/app/inventory/scan/scan-session-list.tsx:101-105`).
- `decrement_household_quantity` is the model for refusing inside a CTE write: when the update matches no row it checks whether the item exists and raises a specific message (`supabase/migrations/20261029182809_create_household_quantity_changes.sql:181-192`).

**Minimum cap (unchanged)**

- `MINIMUM_QUANTITY_MAX = 999` (`src/lib/items/stock-state.ts:3`), the validator message (`src/lib/items/validate-minimum-quantity.ts:24`), the check `minimum_quantity between 0 and 999` (`supabase/migrations/20261030055001_add_household_minimum_quantity.sql:6`), and the guard in `set_household_item_levels` (`supabase/migrations/20261030210000_set_household_item_levels_expected_category.sql:37-40`).

**Why existing data matters**

- A row can hold up to 999999 today. Item page Save sends count, minimum, and category together, so once the cap applies, an over-cap row would fail Save even when the member only edits the minimum. The clamp in Phase 2 removes that case.

**Tests**

- Vitest runs `src/**/*.test.ts` in the `node` environment. No server action has a unit test. The RPC wrappers are tested with an injected stub client (`src/lib/items/reverse-quantity-change.test.ts:9-23`). SQL has no automated test. Earlier plans verify migrations by applying them and running checks by hand.

## Desired End State

A member adds an item on `/inventory/new` and it appears on the tally at 1, whichever way it was created. No path can take a count above 99: `[+]` on a tally row disables at 99, the item page Count stepper stops at 99, Save stores any count from 0 to 99, a scan at 99 refuses with `The count cannot go above 99.` and writes nothing, and undoing a decrement that would land above 99 refuses with the same text and leaves the change unreversed. A count stored above 99 before the migration reads 99 afterward. The database rejects any direct write above 99. The minimum still goes to 999.

Verify with the unit tests and the manual steps under each phase.

## What We're NOT Doing

- Bulk insert and TEC-51. `create_items_bulk` and its parser stay as they are.
- The minimum cap of 999, `DEFAULT_MINIMUM_QUANTITY`, and `getStockState`.
- A restore of clamped counts. A stored count above 99 is lowered once and no record is kept.
- A cap on the decrement paths. They only lower a count.
- A change to `household_quantity_changes`, its `-1`/`1` delta check, or its history. Clamping writes no change row.
- A partial or soft cap, such as saturating at 99 on scan.
- A change to the stock state thresholds, labels, or colors.
- A roadmap or PRD edit.
- Any new phase beyond the three below.

## Implementation Approach

Fix the data first, then the app. Phase 1 is one default change. Phase 2 is one migration that makes the database the last line of defense: it clamps, adds the constraint, and redefines the four functions that raise a count. Phase 3 changes the app constant, validator, controls, and the two wrappers that now see a new error. Phase 2 follows the existing `create or replace` upper-bound migration and the `decrement_household_quantity` refusal shape. Phase 3 reuses the `22003` to `above-maximum` mapping that `adjustHabUnitQuantity` already has.

Apply the migrations before the app deploys. An app that deploys first would validate against 99 while rows above 99 still exist, so Save would fail for those rows until the migration runs.

## Critical Implementation Details

- **Clamp before the constraint.** Within `20261101091000_cap_household_quantity_at_99.sql` the `update` runs first and `add constraint` second. Reversed, the constraint would fail on any existing row above 99. Run the clamp and the constraint in the one file so both apply together.
- **A refused increment writes nothing.** In `increment_household_quantity` the cap lives in the update inside the CTE, so a refused call inserts no `household_quantity_changes` row. Raising after a no-match check (as `decrement_household_quantity` does) also rolls back the whole call.
- **Reversal ordering.** `reverse_quantity_change` locks the change row with `for update`, then updates the inventory, then marks `reversed_at`. The new refusal raises before `reversed_at` is set, so the change stays reversible once the count drops.
- **The cap number lives in two places.** SQL holds a literal 99 and the app holds `HOUSEHOLD_QUANTITY_MAX`. They cannot share a source. A reader changing one must change the other, so the app constant carries a comment pointing at the migration.
- **Error code 22003 is the shared signal.** `adjust_household_quantity`, `increment_household_quantity`, and `reverse_quantity_change` all raise `numeric_value_out_of_range` for a refused increase. `set_household_item_levels` keeps its plain exception. Its only caller validates first, so the database message is a backstop.

## Phase 1: Start new rows at 1

### Overview

Every create path except bulk gets a count of 1.

### Changes Required

#### 1. Column default

**File:** `supabase/migrations/20261101090000_household_inventory_quantity_default_one.sql` (create)

**Intent:** Make a row with no explicit quantity start at 1. The timestamp is later than the newest migration, `20261031200000_create_household_invites.sql`. Do not edit any existing migration.

**Contract:** One statement, `alter table public.household_inventory alter column quantity set default 1`. Existing rows keep their counts. `create_item`, `create_item_without_barcode`, and `add_item_to_household` are not redefined, since they omit `quantity` and take the default. `create_items_bulk` keeps its explicit `quantity` of 1. The not-null constraint and the `quantity >= 0` check are untouched.

### Success Criteria

#### Automated Verification

- `pnpm exec supabase db push --dry-run` lists `20261101090000_household_inventory_quantity_default_one.sql` as the only pending migration.
- `pnpm test`, `pnpm typecheck`, and `pnpm lint` pass with no code change.

#### Manual Verification

- After the migration is applied, the default of `household_inventory.quantity` in `information_schema.columns` is `1`, and a row that existed before keeps its count.
- On `/inventory/new`, an item created with a new barcode, an item created without a barcode, and an item added from another hab unit by its existing barcode each appear on the tally at 1.

---

## Phase 2: Enforce the cap of 99 in the database

### Overview

One migration lowers every stored count above 99 to 99, adds a check constraint for 0 through 99, and makes each function that raises a count refuse to pass 99.

### Changes Required

#### 1. Clamp, constraint, and four functions

**File:** `supabase/migrations/20261101091000_cap_household_quantity_at_99.sql` (create)

**Intent:** Make the database refuse any count above 99 and fix existing rows so Save works for every row. The timestamp is later than Phase 1's migration. Do not edit any existing migration.

**Contract:** The file does these in order.

1. Clamp: `update public.household_inventory set quantity = 99 where quantity > 99`. It writes no `household_quantity_changes` row.
2. Constraint: `alter table public.household_inventory add constraint household_inventory_quantity_range check (quantity between 0 and 99)`. The existing `household_inventory_quantity_not_negative` stays.
3. `adjust_household_quantity(uuid, integer)`: `create or replace`, same signature and return type. Replace the bound `999999` with `99` in the update condition and in the not-found check. A `+1` at 99 raises `adjust_household_quantity refuses a quantity above 99` with `numeric_value_out_of_range`. A `-1` and every other rule stay as in `20261030100413_adjust_household_quantity_upper_bound.sql`.
4. `set_household_item_levels(uuid, integer, integer, integer, text, text)`: `create or replace`, same signature. Replace the `new_quantity` bound `999999` with `99`. The message becomes `set_household_item_levels rejects a quantity outside 0 through 99`. The minimum guard (0 through 999), the category checks, the stale-check, and its error codes are unchanged from `20261030210000_set_household_item_levels_expected_category.sql`.
5. `increment_household_quantity(text, uuid)`: `create or replace`, same signature and `returns table (change_id uuid, quantity integer)`. Add `inventory.quantity < 99` to the update inside the CTE. When no row comes back and the caller's household stocks the item, raise `increment_household_quantity refuses a quantity above 99` with `numeric_value_out_of_range`, following the shape of `decrement_household_quantity` (`20261029182809_create_household_quantity_changes.sql:181-192`). The existing not-stocked refusal stays. A refused call inserts no change row.
6. `reverse_quantity_change(uuid)`: `create or replace`, same signature. Add `inventory.quantity - change_row_delta <= 99` to the update condition. When the update matches no row, raise `reverse_quantity_change refuses a quantity above 99` with `numeric_value_out_of_range` if the item's current count minus the delta would be above 99. Otherwise raise the existing `reverse_quantity_change refuses a quantity below 0` with `check_violation`. A refused reversal leaves `reversed_at` null.

Each function ends with the same `revoke all ... from public, anon` and `grant execute ... to authenticated` its latest migration used.

### Success Criteria

#### Automated Verification

- `pnpm exec supabase db push --dry-run` lists `20261101091000_cap_household_quantity_at_99.sql` as the only pending migration once Phase 1's migration is applied.
- `pnpm test`, `pnpm typecheck`, and `pnpm lint` pass with no code change.

#### Manual Verification

- After the migration is applied to a database that held a row at 500, that row reads 99. Rows at or below 99 are unchanged and the row count is unchanged. A direct `update ... set quantity = 100` and a direct insert with `quantity = 100` both fail on `household_inventory_quantity_range`.
- As a household member, `adjust_household_quantity` with `+1` takes 98 to 99, and with `+1` at 99 raises `22003` and leaves the count at 99. With `-1` at 99 it returns 98.
- As a household member, `set_household_item_levels` saves a count of 99, rejects a count of 100 with `rejects a quantity outside 0 through 99`, and still saves a minimum of 999.
- As a household member, `increment_household_quantity` at 98 returns 99 and writes one change row. At 99 it raises `22003`, the count stays 99, and no change row is added.
- As a household member, `reverse_quantity_change` on a decrement change refuses with `22003` when the item is at 99, leaves `reversed_at` null, and succeeds at 98. Reversing an increment change still lowers the count, and a reversal that would go below 0 still raises `check_violation`.

---

## Phase 3: Apply the cap of 99 in the app

### Overview

The app constant, validator, controls, and refusal text move to 99, and scan stocking and reversal turn the new database refusal into the same message.

### Changes Required

#### 1. Count constant and validator

**File:** `src/lib/items/validate-household-quantity.ts` (edit)

**Intent:** One constant drives the validator, both controls, and the messages.

**Contract:** `HOUSEHOLD_QUANTITY_MAX` becomes `99`, with a comment that the database cap lives in `20261101091000_cap_household_quantity_at_99.sql`. `VALIDATION_INVALID_QUANTITY` is built from the constant and reads `Count must be a whole number from 0 to 99.` The digit pattern and the rest of the logic stay. A value above the constant, such as `100`, returns the invalid result, and `99` and `0` return valid.

#### 2. Validator tests

**File:** `src/lib/items/validate-household-quantity.test.ts` (edit)

**Intent:** Pin the new boundary.

**Contract:** The shared invalid message becomes `Count must be a whole number from 0 to 99.` The upper-bound test accepts `99`. Add tests that reject `100` and `999999`. Keep the empty, whitespace, negative, fractional, `0`, and in-range cases. Name each test for its behavior and assert with `toEqual`.

#### 3. Shared out-of-range error code

**File:** `src/lib/items/reverse-quantity-change.ts` (edit)

**Intent:** Put the `22003` code next to `CHECK_VIOLATION_ERROR_CODE`, where wrappers already import shared codes, so three wrappers use one definition.

**Contract:** Export `NUMERIC_VALUE_OUT_OF_RANGE_ERROR_CODE = '22003'` with a comment naming SQLSTATE `numeric_value_out_of_range`. Add `AboveMaximumQuantityChange` (`status: 'above-maximum'`) to `ReverseQuantityChangeResult`. `reverseQuantityChange` returns it when `error.code` is that code. The `23514` mapping, the throw on other errors, and the number check are unchanged.

**File:** `src/lib/items/adjust-hab-unit-quantity.ts` (edit)

**Intent:** Use the shared constant and fix the stale comment.

**Contract:** Remove the private `NUMERIC_VALUE_OUT_OF_RANGE_ERROR_CODE` and import the shared one. Its comment no longer names 999999. Behavior is unchanged.

#### 4. Increment wrapper

**File:** `src/lib/items/increment-hab-unit-quantity.ts` (edit)

**Intent:** Let the caller tell a refused increment from a failure.

**Contract:** `IncrementHouseholdQuantityClient.rpc` returns an error type with an optional `code`. `incrementHabUnitQuantity` returns a discriminated union: `{ status: 'incremented', changeId, quantity }` or `{ status: 'above-maximum' }`. It returns `above-maximum` when `error.code` is the shared out-of-range code. Any other error, and any malformed row, still throws `increment_household_quantity failed for barcode <barcode>` with `cause` attached. `readScanQuantityChange` and its export are unchanged.

#### 5. Wrapper tests

**File:** `src/lib/items/increment-hab-unit-quantity.test.ts` (edit)

**Intent:** Cover the new result shape and the refusal.

**Contract:** Existing success cases now expect `status: 'incremented'` with the same `changeId` and `quantity`. Add: returns `above-maximum` when the rpc error code is `22003`, and throws with the barcode and cause for an error whose code is not `22003`. Keep the malformed-data cases.

**File:** `src/lib/items/reverse-quantity-change.test.ts` (edit)

**Contract:** Add: returns `above-maximum` when the rpc error code is `22003`. The `23514`, non-`23514`, no-code, and malformed-data cases stay.

**File:** `src/lib/items/adjust-hab-unit-quantity.test.ts` (edit)

**Contract:** The stub error message for the `22003` case reads `adjust_household_quantity refuses a quantity above 99`. The assertions stay.

#### 6. Server actions

**File:** `src/app/inventory/actions.ts` (edit)

**Intent:** Show one refusal text on every path.

**Contract:** `QUANTITY_ABOVE_MAXIMUM_MESSAGE` is built from `HOUSEHOLD_QUANTITY_MAX` and reads `The count cannot go above 99.` The file imports the constant from `@/lib/items/validate-household-quantity`. `stockScannedItem` reads the wrapper result and returns `{ status: 'error', message: QUANTITY_ABOVE_MAXIMUM_MESSAGE }` on `above-maximum`, before it revalidates or redirects. `reverseScanSessionLine` returns the same error on `above-maximum`. The other branches and messages are unchanged. The file stays `'use server'` and exports only async functions.

#### 7. Controls

**Files:** `src/app/inventory/tally-count-controls.tsx` and `src/app/inventory/[itemId]/item-level-editor.tsx` (no edit expected)

**Intent:** Both already read `HOUSEHOLD_QUANTITY_MAX`, so they follow the constant.

**Contract:** `[+]` on a tally row disables at 99. The Count stepper on the item page stops at 99. The Minimum stepper still uses `MINIMUM_QUANTITY_MAX` (999). Edit these files only if a literal cap is found there.

### Success Criteria

#### Automated Verification

- `pnpm test src/lib/items/validate-household-quantity.test.ts src/lib/items/increment-hab-unit-quantity.test.ts src/lib/items/reverse-quantity-change.test.ts src/lib/items/adjust-hab-unit-quantity.test.ts` passes and includes every case above.
- `pnpm test` passes in full.
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `rg 999999 src` finds no match outside test files.

#### Manual Verification

- On `/inventory`, an item at 98 goes to 99 with `[+]`, and `[+]` is then disabled.
- On an item page, the Count stepper stops at 99. Saving a count of 99 works, and saving only a new minimum works on an item at 99.
- On an item page, the Minimum stepper still reaches 999 and saves.
- Scanning an item that is at 99 in stocking mode shows `The count cannot go above 99.`, leaves the count at 99, and adds no line to the session list.
- Undoing a decrement on the scan session list when the item is at 99 shows `The count cannot go above 99.` and keeps the line.

---

## Testing Strategy

### Unit Tests

- `validateHouseholdQuantity`: 0, 99, 100, 999999, blank, whitespace, negative, fractional, with the 99 message.
- `incrementHabUnitQuantity`: success shape, `22003` refusal, other error throws with barcode and cause, malformed rows.
- `reverseQuantityChange`: success, `22003` refusal, `23514` below-zero, other errors, malformed data.
- `adjustHabUnitQuantity`: unchanged behavior with the shared constant.

### Integration Tests

- SQL checks in Phase 2 against an applied database, run as a household member inside a transaction that rolls back: clamp, constraint, and each of the four functions at 98 and 99. There is no automated SQL test in this repo.

### Manual Testing Steps

1. Apply both migrations with `pnpm exec supabase db push`, then run the Phase 1 and Phase 2 manual checks.
2. Start the app and run the Phase 3 manual checks.
3. Create one item with each create path and confirm each shows 1.

## Migration and Rollback

Apply both migrations before deploying the app. The default change is reversible by a new migration that sets the default back to 0. The constraint is reversible with `drop constraint household_inventory_quantity_range`, and the four functions with a new migration that restores their earlier bodies. The clamp is not reversible. A count above 99 is lowered once and nothing records the old value. This was decided and accepted. Do not edit an existing migration to undo it.

## References

- Roadmap: None. No roadmap item constrains this change.
- PRD: None. FR-007 and FR-008 define the minimum default and the floor of 0 only.
- Linear TEC-50 (parent TEC-46): https://linear.app/tech-heresy/issue/TEC-50/fix-start-new-items-at-1-and-cap-counts-at-99
- GitHub issue: https://github.com/pterodactor3000/Noospheric-Tally/issues/49
- Default: `supabase/migrations/20260916120209_create_items.sql:29`, `:133-134`, `:186-187`
- Create paths: `supabase/migrations/20261030191000_create_item_with_category.sql:62-63`, `supabase/migrations/20261030081821_create_item_without_barcode.sql:34-35`
- Bulk (unchanged): `supabase/migrations/20261031190000_create_items_bulk.sql:80-81`
- Caps today: `supabase/migrations/20261030100413_adjust_household_quantity_upper_bound.sql:40`, `:62`, `:65`; `supabase/migrations/20261030210000_set_household_item_levels_expected_category.sql:33-34`; `src/lib/items/validate-household-quantity.ts:1`; `src/app/inventory/actions.ts:79`
- Uncapped paths: `supabase/migrations/20261029182809_create_household_quantity_changes.sql:80-86`; `supabase/migrations/20261029184707_reverse_quantity_change.sql:42-52`
- Refusal model: `supabase/migrations/20261029182809_create_household_quantity_changes.sql:181-192`
- Minimum cap (unchanged): `src/lib/items/stock-state.ts:3`; `src/lib/items/validate-minimum-quantity.ts:24`; `supabase/migrations/20261030055001_add_household_minimum_quantity.sql:6`
- Controls: `src/app/inventory/tally-count-controls.tsx:94`; `src/app/inventory/[itemId]/item-level-editor.tsx:259`
- Scan error display: `src/app/inventory/scan/scan-capture.tsx:153-160`; `src/app/inventory/scan/scan-session-list.tsx:101-105`
- Related change: `context/changes/bulk-insert-json/plan.md` (TEC-51, out of scope)

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Start new rows at 1

#### Automated

- [x] 1.1 `pnpm exec supabase db push --dry-run` lists `20261101090000_household_inventory_quantity_default_one.sql` as the only pending migration.
- [x] 1.2 `pnpm test`, `pnpm typecheck`, and `pnpm lint` pass with no code change.

#### Manual

- [ ] 1.3 After the migration is applied, the default of `household_inventory.quantity` is `1`, and a row that existed before keeps its count.
- [ ] 1.4 On `/inventory/new`, an item created with a new barcode, an item created without a barcode, and an item added from another hab unit by its existing barcode each appear on the tally at 1.

### Phase 2: Enforce the cap of 99 in the database

#### Automated

- [ ] 2.1 `pnpm exec supabase db push --dry-run` lists `20261101091000_cap_household_quantity_at_99.sql` as the only pending migration once Phase 1's migration is applied.
- [ ] 2.2 `pnpm test`, `pnpm typecheck`, and `pnpm lint` pass with no code change.

#### Manual

- [ ] 2.3 A row at 500 reads 99 after the migration, rows at or below 99 and the row count are unchanged, and a direct update or insert with `quantity = 100` fails on `household_inventory_quantity_range`.
- [ ] 2.4 `adjust_household_quantity` takes 98 to 99 with `+1`, raises `22003` with `+1` at 99 and leaves the count at 99, and returns 98 with `-1` at 99.
- [ ] 2.5 `set_household_item_levels` saves a count of 99, rejects a count of 100 with `rejects a quantity outside 0 through 99`, and still saves a minimum of 999.
- [ ] 2.6 `increment_household_quantity` at 98 returns 99 and writes one change row, and at 99 it raises `22003`, keeps the count at 99, and adds no change row.
- [ ] 2.7 `reverse_quantity_change` on a decrement change refuses with `22003` at 99 and leaves `reversed_at` null, succeeds at 98, still reverses an increment change, and still raises `check_violation` below 0.

### Phase 3: Apply the cap of 99 in the app

#### Automated

- [ ] 3.1 `pnpm test src/lib/items/validate-household-quantity.test.ts src/lib/items/increment-hab-unit-quantity.test.ts src/lib/items/reverse-quantity-change.test.ts src/lib/items/adjust-hab-unit-quantity.test.ts` passes and includes every case above.
- [ ] 3.2 `pnpm test` passes in full.
- [ ] 3.3 `pnpm typecheck` passes.
- [ ] 3.4 `pnpm lint` passes.
- [ ] 3.5 `rg 999999 src` finds no match outside test files.

#### Manual

- [ ] 3.6 On `/inventory`, an item at 98 goes to 99 with `[+]`, and `[+]` is then disabled.
- [ ] 3.7 On an item page, the Count stepper stops at 99, saving a count of 99 works, and saving only a new minimum works on an item at 99.
- [ ] 3.8 On an item page, the Minimum stepper still reaches 999 and saves.
- [ ] 3.9 Scanning an item that is at 99 in stocking mode shows `The count cannot go above 99.`, leaves the count at 99, and adds no line to the session list.
- [ ] 3.10 Undoing a decrement on the scan session list when the item is at 99 shows `The count cannot go above 99.` and keeps the line.
