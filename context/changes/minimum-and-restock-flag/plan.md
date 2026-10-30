# Minimum and Restock Flag Implementation Plan

## Overview

A signed-in member can set a minimum quantity for an item and see its current count together with a stock state: CRITICAL, WARNING, or IN STOCK. This is roadmap S-06, with S-10 (shortage-threshold-labels) merged in by user decision on 2026-10-30. It covers PRD FR-007 (a minimum per item, 3 when none is saved, quantity never below 0), FR-008 (count and stock label with fixed colors), and the label half of US-02. Together with the using scan from S-04, it completes the PRD primary success criterion (`context/foundation/prd.md` line 60).

The stock rules come from the PRD Business Logic (`context/foundation/prd.md` line 194):

- CRITICAL, in red, when the quantity is from 0 through the minimum.
- WARNING, in yellow/gold, when the quantity is greater than the minimum and less than twice the minimum.
- IN STOCK, in green, when the quantity is at least twice the minimum.

## Current State Analysis

**Roadmap and PRD disagree today.** The S-06 outcome is a binary below-minimum flag (`context/foundation/roadmap.md` line 141). S-10 carries the default of 3 and the three labels (lines 187-197, risk on line 196, backlog row on line 261). The PRD already states the merged behavior in FR-007, FR-008, the primary criterion, and US-02 (`context/foundation/prd.md` lines 128, 132, 60, and 88). S-11 lists S-10 as its prerequisite (`roadmap.md` lines 40 and 204). Linear TEC-30 blocks TEC-34, the S-10 issue.

**No minimum exists.** `household_inventory` has `quantity integer not null default 0` and no minimum column (`supabase/migrations/20260916120209_create_items.sql` lines 24-37). A later migration adds `check (quantity >= 0)` (`supabase/migrations/20261029182809_create_household_quantity_changes.sql` lines 1-3). Nothing in `src` reads or writes a minimum.

**Writes go through RPCs.** `household_inventory` has only the member select policy `household_inventory_select_if_member` (`create_items.sql` lines 43-53). Every write is a `security definer` function with `set search_path = ''`. Each one resolves the caller's household from `household_members`, raises a named exception, and grants execute only to `authenticated` after revoking `public, anon`. Evidence: `supabase/migrations/20261029184707_reverse_quantity_change.sql` lines 1-64. Table and function names live in `src/lib/db/entities.ts` lines 1-35.

**Read paths.** `loadHabUnitTallyLines` selects `item_id, name, quantity`, ordered by name, and narrows each `unknown` row with `readHabUnitTallyLine` (`src/lib/items/load-hab-unit-items.ts` lines 5-9, 42-59, and 61-86). `readHabUnitTallyLine` is not exported. `loadHabUnitItemByBarcode` looks up the item id through `find_item_by_barcode`, then selects `item_id, name, quantity` from `household_inventory` through a local `HabUnitItemRow` type (`src/lib/items/load-hab-unit-item-by-barcode.ts` lines 9-19 and 39-59). RLS limits both selects to the caller's household.

**Inventory page.** Each row shows the name in a span, a dot leader, and `[-] {count} [+]`, with the two buttons disabled as S-05 placeholders (`src/app/inventory/page.tsx` lines 18-38 and 56-81). The name is not a link (line 58). `src/app/inventory/` contains only `new/`, `scan/`, `page.tsx`, and `actions.ts`, so no per-item route exists. `BackToInventoryLink` already renders on every path under `/inventory/` (`src/components/back-to-inventory-link.tsx` lines 9-10). The proxy guard protects every path under `/inventory` (`src/lib/auth/isProtectedPath.ts` lines 1-7).

**Scan result.** `resolveScanDisplay` returns `{ status: 'quantity', name, quantity }` for a stocked item (`src/lib/items/scan-direction.ts` lines 23-49). Its tests are at `src/lib/items/scan-direction.test.ts` lines 79-121. The scan page passes `title` and `detail` to `ScanCapture` (`src/app/inventory/scan/page.tsx` lines 55-57 and 77-88). `ScanCaptureResult` declares those fields (`src/app/inventory/scan/scan-capture.tsx` lines 28-33), and `ScanResultNotice` renders them in a `role="status"` card with `bg-background` and `text-foreground` (`src/app/inventory/scan/scan-capture.tsx` lines 203-211, `src/app/inventory/scan/scan-result-notice.tsx` lines 12-17 and 80-133).

**Stock tokens exist with no consumer.** `--stock-critical`, `--stock-warning`, and `--stock-in-stock`, each with a foreground pair, are defined once in `:root` and mapped as `--color-stock-*` in `@theme inline` (`src/app/styles/globals.css` lines 25-30 and 72-77). `src/app/styles/theme-tokens.test.ts` lines 37-42 pin their values. The S-13 brief says the label work must use these tokens and add no new label colors (`context/changes/softer-green-interface/plan-brief.md` line 69). Each pair has a computed contrast of at least 4.6:1 (`context/changes/softer-green-interface/plan.md` lines 112-114).

**Action and form patterns.** Server actions in `src/app/inventory/actions.ts` return a discriminated result (`ItemActionError` on lines 27-31), validate input at the boundary, log the operation and inputs with `console.error`, return `ITEM_WRITE_FAILURE_MESSAGE` on a failed write, and call `revalidatePath` (lines 152-174 and 286-308). A change id is checked with `isScanSessionId`, because both are UUIDs (lines 289-293, guard at `src/lib/items/scan-session.ts` lines 5-9). Validators return a `valid` or `invalid` union (`src/lib/items/validate-item-name.ts` lines 1-31). RPC wrappers take an injected client and narrow `unknown` data (`src/lib/items/increment-hab-unit-quantity.ts` lines 8-58), with stub tests (`src/lib/items/increment-hab-unit-quantity.test.ts` lines 13-96). Client forms use `useActionState` with an alert region for errors (`src/app/hab-unit/new/hab-unit-name-form.tsx` lines 31-84). Shared class strings live in `src/app/styles/class-names.ts` lines 1-121.

**Tooling.** Next is 16.4.3 (`package.json`). Vitest runs in Node on `src/**/*.test.ts` only (`vitest.config.mts`). The scripts are `pnpm lint`, `pnpm test`, and `pnpm typecheck`, and `pnpm worker:check` builds and dry-runs the Worker. CI runs all four on merge to `main` (`.github/workflows/deploy.yml` lines 44-54). Migrations ship with `pnpm exec supabase db push` (`README.md` lines 42-51). No SQL test harness exists.

## Desired End State

The roadmap has one slice for this work. S-06 names the default minimum of 3 and the three labels, S-10 no longer exists as a slice, and S-11 depends on S-06.

Every existing item has a minimum of 3, and every count is unchanged. On `/inventory`, each tally row has the background and text color of its stock state, and a screen reader hears the state name. With the default minimum of 3, a count from 0 through 3 is red CRITICAL, 4 or 5 is yellow/gold WARNING, and 6 or more is green IN STOCK.

Tapping an item name opens `/inventory/{itemId}`. That page shows the name, the count, the minimum, and the state name, in the state's color, plus a minimum form. Saving a whole number from 0 to 999 stores it and recolors the item. Saving a blank field stores 3. Any other value shows `Minimum must be a whole number from 0 to 999.` and stores nothing. A malformed item id, or an item outside the member's household, shows the not-found page.

After a stocking or using scan of a stocked item, the scan result card has the color of the item's new stock state, and its status region announces the state name.

Verify with the manual steps in Testing Strategy.

## What We're NOT Doing

- The below-minimum restock list and shortfall ordering. Those are S-07, FR-010, and FR-014.
- Category panels and the category warning icon. Those are S-11 and FR-018.
- Name search and hand adjustment of counts. Those are S-05, FR-006, and FR-013. The `[-]` and `[+]` buttons on the tally row stay disabled.
- Editing an item's name or barcodes on the item page.
- A text chip or badge on the tally row or the scan result card.
- New stock colors, or changes to the `--stock-*` token values.
- Editing `context/foundation/prd.md`. It already states the merged behavior.
- Updating the stale S-04 status in the roadmap, or archiving S-03 or S-04.
- Linear and GitHub tracker changes. Closing TEC-34 as merged into TEC-30 belongs to the parent agent, outside this plan.
- A browser, route, or SQL test harness. Vitest stays on `src/**/*.test.ts`.

## Implementation Approach

Record the scope merge in the roadmap first, so the code phases implement a slice the roadmap names.

Store the minimum as a `not null` column with a constant default of 3 and a check of 0 through 999. A constant default fills existing rows without touching `quantity`. Writes go through one new `security definer` RPC that follows the `reverse_quantity_change` shape, so no update policy is added. A pure `getStockState` function holds the three bands, and every surface derives its state from that function and the stored minimum.

The item page is a server component under a dynamic segment. It loads one row through the session client, so RLS decides which items exist for the member. The minimum form posts to a server action in the existing `actions.ts`, and that action validates at the boundary before it calls the RPC wrapper. The tally row, the item page, and the scan result card read their colors from one shared map of complete Tailwind class strings.

Before writing Next code in Phases 3 and 4, read the matching guides in `node_modules/next/dist/docs/`. At minimum read `01-app/03-api-reference/03-file-conventions/dynamic-routes.md`, `01-app/03-api-reference/03-file-conventions/page.md`, `01-app/03-api-reference/04-functions/not-found.md`, `01-app/01-getting-started/07-mutating-data.md`, and `01-app/03-api-reference/04-functions/revalidatePath.md`. Follow any deprecation notice they give.

## Critical Implementation Details

**Deploy order.** The Phase 2 code selects `minimum_quantity`. Apply the Phase 2 migration with `pnpm exec supabase db push` before any build that contains the Phase 2 code reaches production. Otherwise the inventory page and the scan page throw on their selects. The column is additive, so the build already on `main` keeps working after the migration.

**Qualify the RPC update.** The RPC parameter is named `new_minimum_quantity` so it cannot collide with the `minimum_quantity` column. Qualify every column in the update with the table alias, as `reverse_quantity_change` does (`20261029184707_reverse_quantity_change.sql` lines 43-48).

**Two sources for the default.** The column default and `DEFAULT_MINIMUM_QUANTITY` in `src/lib/items/stock-state.ts` must both be 3. The server action always sends a number, so a blank field sends `DEFAULT_MINIMUM_QUANTITY` and never relies on the column default. A unit test pins the constant at 3.

**Complete class strings.** Tailwind finds utilities by scanning source text. The stock color map must spell each class in full, such as `bg-stock-critical` and `text-stock-critical-foreground`. Never build one from a template string.

**Band edges.** `getStockState(quantity, minimumQuantity)` returns `critical` when `quantity <= minimumQuantity`, `warning` when `quantity < 2 * minimumQuantity`, and `in-stock` otherwise. With a minimum of 0, a count of 0 is CRITICAL and every count of 1 or more is IN STOCK. No count is WARNING then, which matches the PRD bands.

## Phase 1: Merge S-10 into S-06 in the roadmap

### Overview

Rewrite `context/foundation/roadmap.md` so S-06 owns the default minimum and the three labels, and S-10 no longer exists as a separate slice. This phase edits no application file. `plan.md` progress rows and `change.md` status may change with it.

### Changes Required

#### 1. Roadmap

**File:** `context/foundation/roadmap.md`

**Intent:** Record the 2026-10-30 decision to merge S-10 into S-06, so the roadmap matches FR-007, FR-008, and US-02 and the code phases build a named slice.

**Contract:**

- Frontmatter `updated` (line 6) becomes `2026-10-30`.
- The North star heading (line 23) names the count and the CRITICAL, WARNING, or IN STOCK label instead of "whether it has fallen below the minimum". The rest of that paragraph stays.
- The S-06 row in At a glance (line 35) reads `set a minimum for an item, 3 by default, and see CRITICAL, WARNING, or IN STOCK from its count`. Change ID, prerequisites, PRD refs, and status stay.
- The S-10 row (line 39) is removed.
- The S-11 row (line 40) lists `S-06` as its prerequisite.
- The S-06 body (lines 139-149) keeps its heading text, Change ID, PRD refs, prerequisites, parallel list, blockers, unknowns, and status. Its Outcome reads: user can set a minimum quantity for an item, 3 when none is saved, and see its current count with a CRITICAL, WARNING, or IN STOCK label from that count and the minimum. Add one line under the body: `- **Merged:** S-10 (shortage-threshold-labels) merged into this slice on 2026-10-30. The ID S-10 is retired.`
- The S-10 body (lines 187-197) is removed.
- The S-11 body Prerequisites line (line 204) reads `S-06`.
- The S-06 row in Backlog Handoff (line 257) adds `Includes the default minimum of 3 and the three stock labels, merged from S-10.` to its Notes.
- The S-10 row in Backlog Handoff (line 261) is removed.
- No other slice, stream, baseline, parked item, or Done entry changes.

### Success Criteria

#### Automated Verification

- `rg -n "S-10" context/foundation/roadmap.md` matches only the Merged line under S-06 and the S-06 Backlog Handoff Notes line. Approved 2026-10-30: the Notes must say "merged from S-10", so that line is allowed.
- `rg -n "shortage-threshold-labels" context/foundation/roadmap.md` matches only the Merged line under S-06.
- The product diff is only `context/foundation/roadmap.md`. `plan.md` progress rows and `change.md` status may change with it. Recorded from the phase 1 review on 2026-10-30.

#### Manual Verification

- The At a glance table shows S-06 with the default of 3 and the three labels, no S-10 row, and S-11 with prerequisite S-06.
- The S-06 body Outcome matches the FR-007 and FR-008 text in `context/foundation/prd.md` lines 128 and 132.

---

## Phase 2: Store the minimum and add the stock rules

### Overview

Add the minimum column, its write RPC, the pure stock rules, and the RPC wrapper. Both loaders return the minimum. No screen changes in this phase.

### Changes Required

#### 1. Minimum migration

**File:** `supabase/migrations/<timestamp>_add_household_minimum_quantity.sql`, created with `pnpm exec supabase migration new add_household_minimum_quantity`, so its timestamp sorts after `20261029184707`.

**Intent:** Store one minimum per household item, filled with 3 for every existing row, and give members one way to change it.

**Contract:**

- `alter table public.household_inventory add column minimum_quantity integer not null default 3`, with a named constraint `household_inventory_minimum_quantity_range` that checks `minimum_quantity between 0 and 999`. The statement does not touch `quantity`.
- `create function public.set_household_minimum_quantity(target_item_id uuid, new_minimum_quantity integer) returns integer`, with `language plpgsql`, `security definer`, and `set search_path = ''`.
- The function raises `set_household_minimum_quantity requires an authenticated user` when `auth.uid()` is null, and `set_household_minimum_quantity requires a household` when the caller has no membership row.
- It raises `set_household_minimum_quantity rejects a minimum outside 0 through 999` when `new_minimum_quantity` is null, below 0, or above 999.
- It updates `minimum_quantity` on the row where `household_id` is the caller's household and `item_id = target_item_id`, and returns the stored value. When no row matched, it raises `set_household_minimum_quantity refuses an item this household does not stock`.
- `revoke all on function public.set_household_minimum_quantity(uuid, integer) from public, anon;` then `grant execute ... to authenticated;`.
- No insert, update, or delete policy is added to `household_inventory`.

#### 2. Database names

**File:** `src/lib/db/entities.ts`

**Intent:** Name the new function next to the existing ones.

**Contract:** Add and export `DB_FUNCTION_SET_HOUSEHOLD_MINIMUM_QUANTITY = 'set_household_minimum_quantity'`.

#### 3. Stock rules

**File:** `src/lib/items/stock-state.ts` (new), with `src/lib/items/stock-state.test.ts` (new)

**Intent:** One pure place for the default, the range, the three bands, and the label text.

**Contract:**

- Export `DEFAULT_MINIMUM_QUANTITY = 3`, `MINIMUM_QUANTITY_MIN = 0`, and `MINIMUM_QUANTITY_MAX = 999`.
- Export `type StockState = 'critical' | 'warning' | 'in-stock'`.
- Export `getStockState(quantity: number, minimumQuantity: number): StockState`, with the band edges from Critical Implementation Details.
- Export `STOCK_STATE_LABELS: Readonly<Record<StockState, string>>` with `CRITICAL`, `WARNING`, and `IN STOCK`.

#### 4. Minimum RPC wrapper

**File:** `src/lib/items/set-hab-unit-minimum-quantity.ts` (new), with `src/lib/items/set-hab-unit-minimum-quantity.test.ts` (new)

**Intent:** Call the RPC through an injected client, following `increment-hab-unit-quantity.ts`.

**Contract:**

- Export `interface SetHouseholdMinimumQuantityClient` with an `rpc(functionName: typeof DB_FUNCTION_SET_HOUSEHOLD_MINIMUM_QUANTITY, args: { target_item_id: string; new_minimum_quantity: number })` method that returns `PromiseLike<{ data: unknown; error: { message: string } | null }>`.
- Export `setHabUnitMinimumQuantity(itemId: string, minimumQuantity: number, client): Promise<number>`. It returns `data` when `data` is an integer.
- When the RPC returns an error, or data that is not an integer, it throws `set_household_minimum_quantity failed for item ${itemId}` with `{ cause: error }` when an error exists.

#### 5. Loaders return the minimum

**Files:** `src/lib/items/load-hab-unit-items.ts`, `src/lib/items/load-hab-unit-item-by-barcode.ts`, and `src/lib/items/load-hab-unit-items.test.ts` (new)

**Intent:** Every read that feeds a stock state returns the stored minimum.

**Contract:**

- `HabUnitTallyLine` (lines 5-9) gains `readonly minimumQuantity: number`.
- `loadHabUnitTallyLines` selects `item_id, name, quantity, minimum_quantity` (line 66).
- `readHabUnitTallyLine` (lines 42-59) also requires `minimum_quantity` to be an integer, maps it to `minimumQuantity`, and is exported for tests and for the Phase 3 loader.
- In `load-hab-unit-item-by-barcode.ts`, `HabUnitStockedItem` (lines 9-11) and `HabUnitItemRow` (lines 15-19) gain the minimum, and the select on line 41 adds `minimum_quantity`.
- `loadHabUnitItems` stays name-only.

### Success Criteria

#### Automated Verification

- `pnpm test` passes, including these new tests:
  - `stock-state.test.ts`: `DEFAULT_MINIMUM_QUANTITY` equals 3. With a minimum of 3, counts 0 and 3 return `critical`, 4 and 5 return `warning`, and 6 and 50 return `in-stock`. With a minimum of 0, a count of 0 returns `critical` and a count of 1 returns `in-stock`. With a minimum of 999, a count of 1998 returns `in-stock`. `STOCK_STATE_LABELS` equals `{ critical: 'CRITICAL', warning: 'WARNING', 'in-stock': 'IN STOCK' }`.
  - `set-hab-unit-minimum-quantity.test.ts`: the wrapper returns the stored minimum, including 0. It passes the expected function name and args. It throws a message that names the item id, with the RPC error as `cause`, on an RPC error. It also throws on null, a string, a float, an array, and an object.
  - `load-hab-unit-items.test.ts`: `readHabUnitTallyLine` returns a line with `minimumQuantity` for a valid row. It returns null for a missing `minimum_quantity`, a float, a string, and a non-object row.
- `pnpm lint` exits 0.
- `pnpm typecheck` exits 0.

#### Manual Verification

- Before the push, record `select count(*), sum(quantity) from public.household_inventory;`. Run `pnpm exec supabase db push`. The same query returns the same values afterward.
- `select count(*) from public.household_inventory where minimum_quantity <> 3;` returns 0.
- `has_function_privilege('anon', 'public.set_household_minimum_quantity(uuid, integer)', 'execute')` returns false, and the same check for `authenticated` returns true.
- As the database owner, `update public.household_inventory set minimum_quantity = 1000` on one real row fails with a check violation on `household_inventory_minimum_quantity_range`, and the row keeps its minimum of 3.
- With the migration applied, `pnpm dev` shows `/inventory` with every count unchanged, and a stocking scan still raises a count.

---

## Phase 3: Add the item page and the minimum form

### Overview

Add `/inventory/[itemId]` with the count, minimum, and stock state, and a form that saves the minimum. The tally row name links to it.

### Changes Required

#### 1. Minimum validation

**File:** `src/lib/items/validate-minimum-quantity.ts` (new), with `src/lib/items/validate-minimum-quantity.test.ts` (new)

**Intent:** Validate the form value at the boundary, following `validate-item-name.ts`.

**Contract:**

- Export `validateMinimumQuantity(rawValue: string)`. It returns `{ status: 'valid', minimumQuantity: number }` or `{ status: 'invalid', message: string }`.
- It trims the input. A blank value is valid and returns `DEFAULT_MINIMUM_QUANTITY`.
- A value that matches `^[0-9]{1,3}$` is valid and returns its number, so `007` returns 7. Every result falls from `MINIMUM_QUANTITY_MIN` through `MINIMUM_QUANTITY_MAX`.
- Any other value is invalid with `Minimum must be a whole number from 0 to 999.`

#### 2. Single-item loader

**File:** `src/lib/items/load-hab-unit-item-by-id.ts` (new)

**Intent:** Load one household item for the item page.

**Contract:**

- Export `loadHabUnitItemById(itemId: string): Promise<HabUnitTallyLine | null>`.
- It selects `item_id, name, quantity, minimum_quantity` from `household_inventory` where `item_id` equals the id, using `.maybeSingle()` through the session client.
- It returns null when no row comes back. RLS hides rows from other households, so those return null too.
- It narrows the row with `readHabUnitTallyLine`. On a select error or a row that fails the guard, it throws `household_inventory item select failed for item ${itemId}`, with the error as `cause` when one exists.

#### 3. Minimum server action

**File:** `src/app/inventory/actions.ts`

**Intent:** Save a minimum from the item page form.

**Contract:**

- `ItemActionError.field` (line 30) adds `'minimum'`.
- Add `interface MinimumQuantitySaved { status: 'saved'; minimumQuantity: number }` and `type MinimumQuantityResult = MinimumQuantitySaved | ItemActionError`.
- Add and export `saveItemMinimumQuantity(formData: FormData): Promise<MinimumQuantityResult>`.
- It reads `itemId` and `minimumQuantity` with `getFormString`. It checks `itemId` with `isScanSessionId`, as the change id check on lines 289-293 does. On failure it logs `saveItemMinimumQuantity rejected item id` and returns `ITEM_WRITE_FAILURE_MESSAGE`.
- It runs `validateMinimumQuantity`. An invalid value returns `{ status: 'error', message, field: 'minimum' }` and calls no RPC.
- It calls `setHabUnitMinimumQuantity` with `await createClient()`. On a throw it logs `saveItemMinimumQuantity failed` with the item id and error, and returns `ITEM_WRITE_FAILURE_MESSAGE`.
- On success it calls `revalidatePath` for `/inventory` and for `/inventory/{itemId}`, then returns `{ status: 'saved', minimumQuantity }`.

#### 4. Stock color map

**File:** `src/app/styles/stock-state-class-names.ts` (new)

**Intent:** One map from stock state to the existing FR-008 token classes, shared by the item page, the tally row, and the scan result card.

**Contract:** Export `STOCK_STATE_CLASS_NAMES: Readonly<Record<StockState, string>>`. It maps `critical` to `bg-stock-critical text-stock-critical-foreground`, `warning` to `bg-stock-warning text-stock-warning-foreground`, and `in-stock` to `bg-stock-in-stock text-stock-in-stock-foreground`. Every class is a complete literal, as Critical Implementation Details requires.

#### 5. Item page

**Files:** `src/app/inventory/[itemId]/page.tsx` (new) and `src/app/inventory/[itemId]/item-minimum-form.tsx` (new)

**Intent:** Show one item's name, count, minimum, and stock state in its color, with a form to change the minimum.

**Contract:**

- `page.tsx` is an async server component typed with `PageProps<'/inventory/[itemId]'>`. It awaits `requireCurrentUser()` and `requireCurrentHabUnit()`, then awaits `params`.
- It calls `notFound()` when `itemId` fails `isScanSessionId`, or when `loadHabUnitItemById` returns null.
- It renders the name as the page heading. Below the heading, a block with the `STOCK_STATE_CLASS_NAMES` classes for `getStockState(quantity, minimumQuantity)` shows the visible text `Count: {quantity}`, `Minimum: {minimumQuantity}`, and the `STOCK_STATE_LABELS` value.
- `item-minimum-form.tsx` is a client component that takes `itemId` and `minimumQuantity` props. It uses `useActionState` over `saveItemMinimumQuantity`, following `src/app/hab-unit/new/hab-unit-name-form.tsx` lines 31-84.
- The form has a hidden `itemId` input and a labeled `minimumQuantity` input with `inputMode="numeric"`, `defaultValue` set to the current minimum, and `aria-invalid` when `field` is `'minimum'`.
- It has an alert region for the error message, a status region that reads `Minimum saved.` after a save, and a submit button labeled `Save minimum` that is disabled while pending. The existing `Input`, `Label`, `Button`, and `class-names.ts` styles are reused.

#### 6. Tally row link

**File:** `src/app/inventory/page.tsx`

**Intent:** Open the item page from the item name.

**Contract:** The name span on line 58 becomes a `next/link` `Link` to `/inventory/${line.itemId}`. It keeps the `tallyName` truncation classes and has a touch target of at least 44px (`min-h-11`). The count and the disabled controls do not change.

### Success Criteria

#### Automated Verification

- `pnpm test` passes, including `validate-minimum-quantity.test.ts`. A blank value and a whitespace-only value return 3. `0`, `7`, ` 12 `, `007`, and `999` are valid with their numbers. `-1`, `1000`, `2.5`, `1e2`, `abc`, `+5`, and `0x10` are invalid with `Minimum must be a whole number from 0 to 999.`
- `pnpm lint` exits 0.
- `pnpm typecheck` exits 0, including the generated `PageProps<'/inventory/[itemId]'>` type.
- `pnpm worker:check` exits 0.

#### Manual Verification

- On `pnpm dev`, tapping an item name on `/inventory` opens `/inventory/{itemId}`. The page shows the name, `Count: n`, `Minimum: 3`, the matching state name, and the matching stock color.
- Saving `5` shows `Minimum saved.`, and the page then shows `Minimum: 5` with the state recomputed. Saving a blank field shows `Minimum: 3`.
- Saving `1000`, `-1`, `2.5`, or `abc` shows `Minimum must be a whole number from 0 to 999.`, and a page reload shows the minimum unchanged.
- `/inventory/not-a-uuid` and `/inventory/{random-uuid}` show the not-found page. So does an item id from a second test account's household, opened while signed in to the first account.
- `Back to inventory` appears on the item page and returns to `/inventory`.

---

## Phase 4: Color the tally rows and the scan result

### Overview

Each tally row and the scan result card take the color of their stock state, with the state name available to screen readers only. Neither shows a text chip.

### Changes Required

#### 1. Tally row color

**File:** `src/app/inventory/page.tsx`

**Intent:** Show each item's stock state on the inventory list.

**Contract:**

- Each `li` (line 57) adds `STOCK_STATE_CLASS_NAMES[getStockState(line.quantity, line.minimumQuantity)]` and horizontal padding, so the text does not touch the colored edge. The name link, dot leader, count, and controls inherit the foreground color, which `tallyControl` already does with `text-inherit` (line 34).
- Each row adds `<span className="sr-only">` holding the `STOCK_STATE_LABELS` value after the count. No visible label is added.

#### 2. Scan display carries the state

**Files:** `src/lib/items/scan-direction.ts` and `src/lib/items/scan-direction.test.ts`

**Intent:** Derive the scan result's stock state in the same pure function that builds the display.

**Contract:**

- `ScanStock` (lines 23-26) gains `readonly minimumQuantity: number`.
- `ScanDisplayQuantity` (lines 32-36) gains `readonly stockState: StockState`.
- `resolveScanDisplay` sets `stockState` to `getStockState(stock.quantity, stock.minimumQuantity)`.
- The existing tests (lines 79-121) pass a minimum and assert `stockState`.

#### 3. Scan result card color

**Files:** `src/app/inventory/scan/page.tsx`, `src/app/inventory/scan/scan-capture.tsx`, and `src/app/inventory/scan/scan-result-notice.tsx`

**Intent:** Color the scan result card with the item's state after a scan.

**Contract:**

- `ScanCaptureResult` (`scan-capture.tsx` lines 28-33) gains `readonly stockState: StockState`. `ScanCapture` passes it to `ScanResultNotice` (lines 204-210). The notice key (line 205) adds `stockState`, so a state change remounts the card.
- `scan/page.tsx` passes `display.stockState` in `scanResult` (lines 81-86). `loadHabUnitItemByBarcode` already returns the minimum after Phase 2.
- `ScanResultNotice` takes a required `stockState` prop. It replaces `bg-background` and `text-foreground` (lines 89 and 93) with `STOCK_STATE_CLASS_NAMES[stockState]`. It adds a `sr-only` span holding the `STOCK_STATE_LABELS` value inside the `role="status"` region, so the state is announced with the result. The visible title, detail, confirmation, timers, and `clearParam` behavior do not change.

### Success Criteria

#### Automated Verification

- `pnpm test` passes. `scan-direction.test.ts` asserts `stockState` for a stocking and a using stock row at the CRITICAL, WARNING, and IN STOCK edges with a minimum of 3. `theme-tokens.test.ts` still passes with the stock token values unchanged.
- `pnpm lint` exits 0.
- `pnpm typecheck` exits 0.
- `pnpm worker:check` exits 0.
- `rg -n "bg-stock-|text-stock-" src` matches only `src/app/styles/stock-state-class-names.ts`.

#### Manual Verification

- With a minimum of 3, set counts of 3, 4, and 6 by scanning. On `/inventory` the rows are red, yellow/gold, and green, with no visible label text.
- With the screen reader on (VoiceOver or TalkBack on the phone), each tally row reads its state name after the count.
- A using scan that takes an item from 4 to 3 shows a red scan result card. A stocking scan that takes it from 5 to 6 shows a green card. The screen reader announces the state name with the result.
- The colored rows and card stay readable in light and dark OS modes on the phone over the deployed HTTPS URL.

---

## Testing Strategy

### Unit Tests

- `getStockState` at every band edge for minimums of 0, 3, and 999, the label map, and the default constant.
- `validateMinimumQuantity` for blank, whitespace, leading zeros, 0, 999, negative, above 999, decimal, exponent, sign, hex, and non-numeric input.
- `setHabUnitMinimumQuantity` for success, a stored 0, an RPC error with `cause`, and each malformed data shape.
- `readHabUnitTallyLine` for a valid row and each invalid `minimum_quantity` shape.
- `resolveScanDisplay` with `stockState` for both directions.

### Integration Tests

- No automated integration harness exists. Phase 2 manual checks cover the migration, the privileges, and the range check. Phase 3 manual checks cover RLS on the item page with two accounts.

### Manual Testing Steps

1. Record `select count(*), sum(quantity) from public.household_inventory;`, run `pnpm exec supabase db push`, and confirm the same result plus `minimum_quantity = 3` on every row.
2. Open `/inventory`. Confirm each row's color matches its count against a minimum of 3, and nothing else on the row changed.
3. Tap an item name. Confirm the item page shows the name, count, `Minimum: 3`, and the state name in its color.
4. Save `5`, then save a blank field, then save `1000`. Confirm the minimum becomes 5, then 3, then stays 3 with the range message.
5. Open `/inventory/not-a-uuid`, a random UUID, and an item id from a second account's household. Confirm each shows the not-found page.
6. On the phone over HTTPS, set an item to a count of 4 with a minimum of 3, then scan it in using mode. Confirm the count drops to 3 and the scan result card is red.
7. Stock the same item to 6. Confirm the card turns green and the tally row is green.
8. With the screen reader on, confirm the tally row and the scan result announce the state name.

## Migration and Rollback

The Phase 2 migration is additive. `add column ... not null default 3` with a constant default fills existing rows without rewriting `quantity`, which keeps Guardrail 2 (`context/foundation/prd.md` line 71). Apply it before deploying the Phase 2 build, as Critical Implementation Details describes.

To roll back, revert the app first, then run `drop function public.set_household_minimum_quantity(uuid, integer);` and `alter table public.household_inventory drop column minimum_quantity;` in a new migration. Dropping the column loses only saved minimums. Counts and the change log stay intact.

## References

- Roadmap: `context/foundation/roadmap.md` (S-06, with S-10 merged)
- PRD: `context/foundation/prd.md` (FR-007, FR-008, US-02, Business Logic line 194, Guardrail 2 line 71)
- Schema: `supabase/migrations/20260916120209_create_items.sql` lines 24-53, `supabase/migrations/20261029182809_create_household_quantity_changes.sql` lines 1-3, `supabase/migrations/20261029184707_reverse_quantity_change.sql` lines 1-64
- Loaders: `src/lib/items/load-hab-unit-items.ts` lines 5-86, `src/lib/items/load-hab-unit-item-by-barcode.ts` lines 9-59
- Actions: `src/app/inventory/actions.ts` lines 27-31, 152-174, and 286-308
- Inventory page: `src/app/inventory/page.tsx` lines 18-81
- Scan: `src/lib/items/scan-direction.ts` lines 23-49, `src/app/inventory/scan/page.tsx` lines 55-88, `src/app/inventory/scan/scan-capture.tsx` lines 28-33 and 203-211, `src/app/inventory/scan/scan-result-notice.tsx` lines 12-17 and 80-133
- Stock tokens: `src/app/styles/globals.css` lines 25-30 and 72-77, `src/app/styles/theme-tokens.test.ts` lines 37-42
- Patterns: `src/lib/items/increment-hab-unit-quantity.ts` lines 8-58, `src/lib/items/validate-item-name.ts` lines 1-31, `src/app/hab-unit/new/hab-unit-name-form.tsx` lines 31-84, `src/lib/items/scan-session.ts` lines 5-9

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Merge S-10 into S-06 in the roadmap

#### Automated

- [x] 1.1 `rg -n "S-10" context/foundation/roadmap.md` matches only the Merged line under S-06 and the S-06 Backlog Handoff Notes line. `7522b57`
- [x] 1.2 `rg -n "shortage-threshold-labels" context/foundation/roadmap.md` matches only the Merged line under S-06. `7522b57`
- [x] 1.3 The product diff is only `context/foundation/roadmap.md`. `plan.md` progress rows and `change.md` status may change with it. `7522b57`

#### Manual

- [x] 1.4 At a glance shows S-06 with the default of 3 and the three labels, no S-10 row, and S-11 with prerequisite S-06. `7522b57`
- [x] 1.5 The S-06 body Outcome matches FR-007 and FR-008 in `prd.md` lines 128 and 132. `7522b57`

### Phase 2: Store the minimum and add the stock rules

#### Automated

- [x] 2.1 `pnpm test` passes, including `stock-state.test.ts`, `set-hab-unit-minimum-quantity.test.ts`, and `load-hab-unit-items.test.ts`. `eb7df5e`
- [x] 2.2 `pnpm lint` exits 0. `eb7df5e`
- [x] 2.3 `pnpm typecheck` exits 0. `eb7df5e`

#### Manual

- [x] 2.4 `count(*)` and `sum(quantity)` on `household_inventory` match before and after `pnpm exec supabase db push`. `eb7df5e`
- [x] 2.5 No row has `minimum_quantity <> 3` after the push. `eb7df5e`
- [x] 2.6 `anon` cannot execute `set_household_minimum_quantity(uuid, integer)`, and `authenticated` can. `eb7df5e`
- [x] 2.7 Setting `minimum_quantity = 1000` on a real row fails with a check violation on `household_inventory_minimum_quantity_range`. `eb7df5e`
- [ ] 2.8 With the migration applied, `/inventory` shows unchanged counts and a stocking scan still raises a count

### Phase 3: Add the item page and the minimum form

#### Automated

- [x] 3.1 `pnpm test` passes, including `validate-minimum-quantity.test.ts`. `b1d7cc6`
- [x] 3.2 `pnpm lint` exits 0. `b1d7cc6`
- [x] 3.3 `pnpm typecheck` exits 0, including `PageProps<'/inventory/[itemId]'>`. `b1d7cc6`
- [x] 3.4 `pnpm worker:check` exits 0. `b1d7cc6`

#### Manual

- [ ] 3.5 Tapping an item name opens `/inventory/{itemId}` with name, count, `Minimum: 3`, state name, and stock color
- [ ] 3.6 Saving `5` shows `Minimum saved.` and `Minimum: 5`, and saving a blank field shows `Minimum: 3`
- [ ] 3.7 Saving `1000`, `-1`, `2.5`, or `abc` shows the range message and leaves the minimum unchanged after reload
- [ ] 3.8 A malformed id, a random UUID, and another household's item id show the not-found page
- [ ] 3.9 `Back to inventory` appears on the item page and returns to `/inventory`

### Phase 4: Color the tally rows and the scan result

#### Automated

- [ ] 4.1 `pnpm test` passes, with `stockState` asserted in `scan-direction.test.ts` and `theme-tokens.test.ts` unchanged
- [ ] 4.2 `pnpm lint` exits 0
- [ ] 4.3 `pnpm typecheck` exits 0
- [ ] 4.4 `pnpm worker:check` exits 0
- [ ] 4.5 `rg -n "bg-stock-|text-stock-" src` matches only `src/app/styles/stock-state-class-names.ts`

#### Manual

- [ ] 4.6 With a minimum of 3, counts of 3, 4, and 6 show red, yellow/gold, and green rows with no visible label text
- [ ] 4.7 The screen reader reads each tally row's state name after the count
- [ ] 4.8 A using scan from 4 to 3 shows a red card, a stocking scan from 5 to 6 shows a green card, and the screen reader announces the state
- [ ] 4.9 Colored rows and the card stay readable in light and dark OS modes on the phone over HTTPS
