# Using Mode Decrease and Undo Implementation Plan

## Overview

A signed-in member can choose using, scan an item as he opens it, and see its count drop by 1. Below the scanner he sees every +1 and -1 that the current tab session recorded, newest first, and can reverse any line once. This is roadmap S-04. It covers PRD FR-004 (subtract on scan), FR-009 (reverse a change), and the count half of US-02. It also closes guardrail 1: a repeated scan in either direction now shows up as its own line that the member can undo.

## Current State Analysis

A stocking submit is a server action POST. `stockScannedItem` validates the barcode, loads the household row, redirects a miss to `/inventory/new`, calls `incrementHabUnitQuantity`, and redirects to `/inventory/scan?barcode=&direction=stocking&added=1`. Evidence: `src/app/inventory/actions.ts` lines 151-183. A failed write returns `ITEM_WRITE_FAILURE_MESSAGE` (lines 29-30).

A using scan writes nothing. `ScanCapture` reads the direction from `sessionStorage` at submit time. For using it only calls `router.push` with `direction=using`. For the same barcode it bumps `scanRound` and `noticeGeneration`. Evidence: `src/app/inventory/scan/scan-capture.tsx` lines 49-55 and 76-85. Stocking uses an in-flight ref and bumps `scanRound` in `finally`. Evidence: lines 67 and 87-118.

`resolveScanDisplay` returns `{ status: 'name' }` for using and `{ status: 'quantity' }` for stocking. Evidence: `src/lib/items/scan-direction.ts` lines 32-35 and 45-58. The page renders the using branch as `Already stocked` and the stocking branch with the stocking confirmation `Item ${display.name} ${barcode} was added to inventory.` Evidence: `src/app/inventory/scan/page.tsx` lines 63-74 and 76-91, with the copy on line 86.

`ScanResultNotice` latches its confirmation on mount and only strips `added` from the URL. Evidence: `src/app/inventory/scan/scan-result-notice.tsx` lines 28 and 45-59. The notice key is `${noticeGeneration}:${title}:${detail}`. Evidence: `src/app/inventory/scan/scan-capture.tsx` line 144.

The scanner holds the barcode it just counted until the camera has missed it for 500ms. A new `scanRound` starts a fresh reader. While `errorMessage` is set, the camera does not start. Evidence: `src/components/barcode-scanner.tsx` lines 35, 58-61, 75-77, and 131-134.

The direction lives in `sessionStorage` under `scan-direction`. The buttons read it through `useSyncExternalStore` and catch a throwing storage. Evidence: `src/lib/items/scan-direction.ts` lines 3 and 9-21, `src/app/inventory/scan/scan-direction-buttons.tsx` lines 30-54 and 59-63.

`increment_household_quantity(item_barcode text) returns integer` is security definer with `search_path = ''`. It resolves the caller's household, updates `quantity = quantity + 1`, and raises `increment_household_quantity refuses a barcode this household does not stock` for both an unknown barcode and an unstocked item. It revokes from `public, anon` and grants `authenticated`. Evidence: `supabase/migrations/20260930092020_increment_household_quantity.sql` lines 1-51. A later migration revoked `anon` again. Evidence: `supabase/migrations/20261028113918_revoke_increment_household_quantity_from_anon.sql` line 1.

The wrapper takes an injected client and treats `typeof data !== 'number'` as failure, so 0 is a valid result. Evidence: `src/lib/items/increment-hab-unit-quantity.ts` lines 3-30. The test stubs `rpc` and covers a returned 0. Evidence: `src/lib/items/increment-hab-unit-quantity.test.ts` lines 11-22 and 33-39.

`household_inventory.quantity` is `integer not null default 0` with no check constraint. The table has a unique `(household_id, item_id)` and a member-only select policy. `item_barcodes` and `items` have RLS enabled and no policy, so the session client cannot read them. Evidence: `supabase/migrations/20260916120209_create_items.sql` lines 13-22, 24-37, 39-41, and 43-53. No change-log table exists in `supabase/migrations/`.

Names for tables and functions live in `src/lib/db/entities.ts` lines 1-28. Vitest collects `src/**/*.test.ts` only (`vitest.config.mts` line 16). The scripts are `pnpm lint`, `pnpm test`, and `pnpm typecheck` (`package.json` lines 10-12). Migrations go out with `pnpm exec supabase db push` (`README.md` lines 42-51).

## Desired End State

On `/inventory/scan`, a using scan of a stocked barcode with a count of 1 or more subtracts 1. The result shows the name and the new count, and a one-time confirmation reads `Item {name} {barcode} was removed from inventory.` Refreshing the result does not subtract again and does not repeat the confirmation. Holding the same can in frame does not subtract again until the camera has missed it for 500ms. A using scan at 0 writes nothing, adds no line, and shows `Item {name} {barcode} is already at 0.` An unknown barcode still opens the create flow.

Below the scanner, a list shows every line the current tab session recorded in both directions, newest first. Each line shows `+1` or `-1`, the name, the barcode, and Undo. The list survives leaving the scanner and coming back in the same tab. A new tab session, or a tab that has not recorded a scan yet, shows an empty list. Undo reverses the line once. The count moves back, and the line stays in the list marked `reversed` with no Undo. A reversal that would drop the count below 0 is refused with `This line cannot be reversed because the count would drop below 0.`, and that line stays unreversed.

Verify with the manual steps in Testing Strategy.

## What We're NOT Doing

- Stock labels, minimums, and the CRITICAL, WARNING, or IN STOCK half of US-02. Those are S-06 and S-10.
- Showing quantity on the inventory list.
- Hand-edited counts and name search. Those are S-05, FR-006, and FR-013.
- The consumption view. That is S-08, FR-015. This change records the log it will read and builds no view on it.
- Archiving S-03 or editing `context/foundation/roadmap.md`.
- Reversing changes from an earlier tab session or another device. The list and Undo cover the current tab session only.
- Reversing a reversal, deleting log rows, or scanning more than 1 unit at a time.
- A browser or route test harness. Vitest stays on `src/**/*.test.ts`.

## Implementation Approach

Every scan write becomes one security-definer RPC call that changes the count and inserts one log row in the same SQL statement. The log row records the household, the item, the scanned barcode, the tab's session id, and the delta. The database refuses a negative count through a check constraint, and both scan RPCs also refuse it explicitly. Reversal is a third RPC that locks the log row, moves the count back, and stamps `reversed_at`.

The app keeps the S-03 shape. The scan page only renders. Server actions do the writes and redirect to a result URL with a one-time flag that `ScanResultNotice` strips. The session id is a UUID that the client mints on the first submit in the tab and stores in `sessionStorage`. That follows the same tab rule as the scan direction. The list is a client component that loads its lines through a server action, filtered by session id. The row-level security policy limits it to the member's household.

Before writing any Next code in Phases 1-4, read the matching guides in `node_modules/next/dist/docs/`. At minimum read `01-app/01-getting-started/07-mutating-data.md`, `01-app/03-api-reference/01-directives/use-server.md`, `01-app/03-api-reference/04-functions/redirect.md`, `01-app/03-api-reference/04-functions/revalidatePath.md`, and `01-app/03-api-reference/04-functions/use-router.md`. Next here is 16.4.3, and its APIs differ from older releases. Follow any deprecation notice those files give. Reading these guides is part of each phase. It does not get a phase of its own.

## Critical Implementation Details

**One statement per scan write.** The scan RPCs update `household_inventory` and insert the log row in one data-modifying CTE. Without a matching inventory row, nothing is inserted. The function declares `returns table (change_id uuid, quantity integer)`, so `change_id` and `quantity` are PL/pgSQL variables. Qualify every column reference with a table alias, and qualify the parameter with the function name. An unqualified `quantity` raises an ambiguous column error at call time.

```sql
with updated_inventory as (
  update public.household_inventory as inventory
  set quantity = inventory.quantity - 1
  where inventory.household_id = caller_household_id
    and inventory.item_id = found_item_id
    and inventory.quantity > 0
  returning inventory.household_id, inventory.item_id, inventory.quantity
),
inserted_change as (
  insert into public.household_quantity_changes
    (household_id, item_id, scan_session_id, barcode, quantity_delta)
  select
    updated_inventory.household_id,
    updated_inventory.item_id,
    decrement_household_quantity.scan_session_id,
    trimmed_barcode,
    -1
  from updated_inventory
  returning id
)
select inserted_change.id, updated_inventory.quantity
  into change_id, quantity
from inserted_change
cross join updated_inventory;
```

The increment uses the same shape with `+ 1`, delta `1`, and no `quantity > 0` filter.

**GET never writes.** `src/app/inventory/scan/page.tsx` loads and renders. It must not import a quantity wrapper. Only server actions call the scan RPCs, once per submit.

**Floor check order for using.** `consumeScannedItem` already loads the row with its quantity through `loadHabUnitItemByBarcode` (`src/lib/items/load-hab-unit-item-by-barcode.ts` lines 39-59). When that quantity is 0, it redirects with `floor=1` and makes no RPC call. The RPC guard is the authority for a race, such as two using scans at quantity 1. A raced raise maps to `ITEM_WRITE_FAILURE_MESSAGE`. Do not parse Postgres exception text.

**Floor refusal for reversal uses a SQLSTATE.** The action has no quantity loaded before a reversal. `reverse_quantity_change` raises its below-0 refusal with `using errcode = 'check_violation'` (SQLSTATE `23514`). The wrapper branches on `error.code === '23514'`, not on the message. Every other error is a plain failure.

**Lock order.** Scan RPCs lock the inventory row through `update`, then insert a new log row. `reverse_quantity_change` locks the log row with `select ... for update`, then updates the inventory row. A scan never locks an existing log row, so the two never wait on each other in a cycle.

**The RPC signature replacement breaks the deployed build until deploy.** The Phase 1 migration drops `increment_household_quantity(text)`. After `db push`, the build already deployed from `main` gets an error on every stocking scan until this branch deploys. Push the Phase 1 migration only when that gap is acceptable, and deploy soon after merge.

**Phase 1 carries the stocking caller.** Replacing the increment signature breaks `stockScannedItem`, the only caller (`src/app/inventory/actions.ts` line 173), at type check and at run time. Phase 1 therefore also adds `src/lib/items/scan-session.ts` and passes the session id on the stocking path. The approved file list placed that work in Phase 2. Phase 2 keeps the using path and its session id.

**Session id lifetime.** The id is minted only inside a submit, never on render or mount. Opening the scanner reads the key and does not write it. A failed first write can leave an id with no lines, and the list for that id is empty, the same as no id. When `window.sessionStorage` throws, log once with the storage key, the same way `scan-direction-buttons.tsx` lines 30-46 do. Then fall back to a module-level in-memory storage object in `scan-capture.tsx` for the life of the page.

**A repeated at-0 notice must show again.** Two at-0 scans of the same barcode produce the same title and detail, so the notice key does not change. The `floor` flag is stripped in between. `ScanResultNotice` must restart, show again, and latch the new text whenever its `confirmation` prop goes from absent to present while mounted. Adjust state during render when the prop changes. Do not use an effect that sets state.

## Phase 1: Quantity change ledger and scan RPCs

### Overview

Every scan-driven +1 or -1 is recorded once in a household-scoped log with a session id. The database refuses a quantity below 0. Both scan RPCs return the change id and the new quantity. Stocking keeps working end to end and now writes a log row with the tab's session id.

### Changes Required

#### 1. Ledger migration

**File:** `supabase/migrations/<timestamp>_create_household_quantity_changes.sql`, created with `pnpm exec supabase migration new create_household_quantity_changes` so its timestamp sorts after `20261028113918`.

**Intent:** Add the change log and the floor constraint, and replace the increment with a logged version. Add the logged decrement.

**Contract:**

- `alter table public.household_inventory add constraint household_inventory_quantity_not_negative check (quantity >= 0);`. Existing rows are all at least 0, because only the increment has written quantity.
- `create table public.household_quantity_changes` with `id uuid primary key default gen_random_uuid()`, `household_id uuid not null references public.households(id) on delete cascade`, `item_id uuid not null references public.items(id) on delete cascade`, `scan_session_id uuid not null`, `barcode text not null`, `quantity_delta integer not null check (quantity_delta in (-1, 1))`, `created_at timestamptz not null default now()`, and `reversed_at timestamptz null`.
- Add `foreign key (household_id, item_id) references public.household_inventory (household_id, item_id) on delete cascade`. It targets the existing unique constraint `household_inventory_item_id_key`. Every log row then has an inventory row that holds its name, and PostgREST can embed `household_inventory(name)`.
- Add an index on `(household_id, scan_session_id, created_at desc)`.
- `barcode` stores the trimmed barcode that was scanned. The list needs it, `item_barcodes` is unreadable under RLS, and one item can have several barcodes.
- Enable RLS. Add `household_quantity_changes_select_if_member` for `select` to `authenticated`, written the same way as `household_inventory_select_if_member` (`supabase/migrations/20260916120209_create_items.sql` lines 43-53). Add no insert, update, or delete policy.
- `drop function public.increment_household_quantity(text);`
- `create function public.increment_household_quantity(item_barcode text, scan_session_id uuid) returns table (change_id uuid, quantity integer)`, with `language plpgsql`, `security definer`, and `set search_path = ''`. Raise when the caller is missing, has no household, or passes a null `scan_session_id`. Find the item by trimmed barcode, then run the one-statement CTE from Critical Implementation Details with `+ 1` and delta `1`. When nothing matched, raise `increment_household_quantity refuses a barcode this household does not stock`, the S-03 text, for both an unknown barcode and an unstocked item. Otherwise `return next`.
- `create function public.decrement_household_quantity(item_barcode text, scan_session_id uuid)` with the same return shape and the same security settings. Run the CTE with `- 1`, delta `-1`, and `inventory.quantity > 0`. When nothing matched and the inventory row exists, raise `decrement_household_quantity refuses a quantity below 0`. When nothing matched and no inventory row exists, raise `decrement_household_quantity refuses a barcode this household does not stock`. Neither path inserts a log row.
- For both functions, run `revoke all on function ... (text, uuid) from public, anon;` and then `grant execute on function ... (text, uuid) to authenticated;`.

#### 2. Names

**File:** `src/lib/db/entities.ts`

**Intent:** Name the new table and function next to the existing ones.

**Contract:** Add `DB_TABLE_HOUSEHOLD_QUANTITY_CHANGES = 'household_quantity_changes'` and `DB_FUNCTION_DECREMENT_HOUSEHOLD_QUANTITY = 'decrement_household_quantity'`. Keep `DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY` (line 13).

#### 3. Scan RPC wrappers

**File:** `src/lib/items/increment-hab-unit-quantity.ts`

**Intent:** Call the new signature and return the change id with the quantity.

**Contract:** `incrementHabUnitQuantity(itemBarcode, scanSessionId, client)` calls `client.rpc(DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY, { item_barcode, scan_session_id })`. The client still comes from the caller. `data` is `unknown`. A guard accepts exactly one row whose `change_id` is a string and whose `quantity` is a number, and returns `{ changeId, quantity }`. Export the `ScanQuantityChange` interface and that row reader so the decrement wrapper can use them. 0 is a valid quantity. Throw `increment_household_quantity failed for barcode ${itemBarcode}` when `error` is set or the guard fails, with `cause` set to the RPC error when one exists.

**File:** `src/lib/items/increment-hab-unit-quantity.test.ts`

**Intent:** Lock the new arguments and return shape.

**Contract:** The stub expects the function name and `{ item_barcode, scan_session_id }`. Cover four cases: a row returns `{ changeId, quantity }`, a row with quantity `0` returns 0, an RPC error rejects with the barcode in the message and the error as `cause`, and `null`, an empty array, or a malformed row rejects with the barcode in the message.

**File:** `src/lib/items/decrement-hab-unit-quantity.ts` (new)

**Intent:** Do the same for the decrement.

**Contract:** `decrementHabUnitQuantity(itemBarcode, scanSessionId, client)` calls `DB_FUNCTION_DECREMENT_HOUSEHOLD_QUANTITY` with the same arguments. It returns `ScanQuantityChange` and throws `decrement_household_quantity failed for barcode ${itemBarcode}` with `cause` when one exists.

**File:** `src/lib/items/decrement-hab-unit-quantity.test.ts` (new)

**Intent:** Lock the decrement wrapper without a database.

**Contract:** Use the same cases as the increment test, including a returned quantity of `0` after subtracting the last unit.

#### 4. Session id helper

**File:** `src/lib/items/scan-session.ts` (new)

**Intent:** Keep the session id rules pure and testable, next to `scan-direction.ts`.

**Contract:** Export `SCAN_SESSION_STORAGE_KEY = 'scan-session-id'` and `ScanSessionStorage = Pick<Storage, 'getItem' | 'setItem'>`. `isScanSessionId(value: unknown): value is string` accepts a canonical UUID string (8-4-4-4-12 hex, either case) and rejects everything else. `readScanSessionId(storage)` returns the stored value when it passes `isScanSessionId` and otherwise returns `null`. It never writes. `ensureScanSessionId(storage, createId: () => string)` returns the stored id when it is valid. Otherwise it calls `createId` once, stores the result under the key, and returns it.

**File:** `src/lib/items/scan-session.test.ts` (new)

**Intent:** Lock the read-only path and the mint-once path.

**Contract:** Use an in-memory storage like `src/lib/items/scan-direction.test.ts` lines 13-27. `readScanSessionId` returns `null` for a missing, empty, or non-UUID value and does not write. It returns a stored UUID. `ensureScanSessionId` mints and stores once when the key is missing or invalid. When a valid id exists, it returns that id and calls `createId` zero times. `isScanSessionId` rejects non-strings, an empty string, and a UUID with a wrong group length.

#### 5. Stocking caller

**File:** `src/app/inventory/actions.ts`

**Intent:** Keep stocking working on the new RPC and record its session id.

**Contract:** `stockScannedItem(barcode: string, scanSessionId: string)`. When `isScanSessionId` fails, log `stockScannedItem rejected scan session id` with the barcode and return `{ status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }`. Otherwise keep the existing order (lines 154-182) and call `incrementHabUnitQuantity(validBarcode, scanSessionId, supabase)`. The redirect stays `direction=stocking&added=1`.

**File:** `src/app/inventory/scan/scan-capture.tsx`

**Intent:** Pass the tab's session id on a stocking submit.

**Contract:** Inside the stocking submit, before calling `stockScannedItem`, call `ensureScanSessionId` with the session storage and `() => crypto.randomUUID()`. Use the storage fallback from Critical Implementation Details. Do not mint on render or on mount. The using branch stays the `router.push` from lines 76-85 until Phase 2.

### Success Criteria

#### Automated Verification

- `pnpm test` passes `src/lib/items/increment-hab-unit-quantity.test.ts` and `src/lib/items/decrement-hab-unit-quantity.test.ts`. A row returns `{ changeId, quantity }`, a quantity of `0` is returned, and an RPC error or a malformed result throws an `Error` that names the barcode.
- `pnpm test` passes `src/lib/items/scan-session.test.ts`. Read returns `null` for missing or invalid values without writing, ensure mints once and reuses a valid id, and `isScanSessionId` rejects non-UUID input.
- `pnpm lint` and `pnpm typecheck` exit 0.

#### Manual Verification

- `pnpm exec supabase db push` applies the new migration. `select to_regprocedure('public.increment_household_quantity(text)')` returns null.
- `has_function_privilege('anon', ..., 'execute')` returns false for `increment_household_quantity(text, uuid)` and `decrement_household_quantity(text, uuid)`, and `has_function_privilege('authenticated', ..., 'execute')` returns true for both.
- In a rolled-back transaction, `update public.household_inventory set quantity = -1` fails with a check violation.
- As a member, `increment_household_quantity` on a stocked barcode returns a change id and the count plus 1, and adds one log row with that session id, delta 1, and the trimmed barcode.
- As a member, `decrement_household_quantity` on a barcode at 1 returns a change id and 0, and adds one log row with delta -1. A second call raises `decrement_household_quantity refuses a quantity below 0` and adds no log row.
- As a member, both functions raise the `refuses a barcode this household does not stock` text for an unknown barcode and add no log row.
- As a member, `select` on `household_quantity_changes` returns only that household's rows, and an `insert` is refused.
- In the app, a stocking scan still adds 1 and shows `Item {name} {barcode} was added to inventory.` The tab's `sessionStorage` holds `scan-session-id`, and the new log row carries that id.

---

## Phase 2: Using scan lowers the count

### Overview

A using scan of a stocked barcode subtracts 1 through a POST and shows the new count. A refresh does not subtract again. A using scan at 0 is refused visibly and writes nothing. Both directions record the tab's session id.

### Changes Required

#### 1. Display decision

**File:** `src/lib/items/scan-direction.ts`

**Intent:** The using result shows the count, as stocking does.

**Contract:** `resolveScanDisplay(direction, stock)` returns `{ status: 'create' }` for a null row and `{ status: 'quantity', name, quantity }` for a row in either direction. Remove `ScanDisplayName` (lines 32-35). The function stays pure.

**File:** `src/lib/items/scan-direction.test.ts`

**Intent:** Lock quantity for both directions.

**Contract:** Replace the using case (lines 96-101) with one that expects `{ status: 'quantity', name, quantity }`. Add a using case at quantity `0`. Keep both null-row cases.

#### 2. Using action

**File:** `src/app/inventory/actions.ts`

**Intent:** Do the one subtract for a using submit.

**Contract:** Export `consumeScannedItem(barcode: string, scanSessionId: string)`. Do not name it `useScannedItem`, because the `use` prefix marks a React hook. The order follows `stockScannedItem`:

- An invalid barcode returns the validator message with `field: 'barcode'`.
- An invalid session id is logged and returns `ITEM_WRITE_FAILURE_MESSAGE`.
- A missing household row redirects to `/inventory/new?barcode=`.
- A loaded quantity of `0` redirects to `/inventory/scan?barcode=&direction=using&floor=1` with no RPC call.
- Otherwise call `decrementHabUnitQuantity(validBarcode, scanSessionId, supabase)` in `try`. A throw is logged as `consumeScannedItem failed` with the barcode and returns `ITEM_WRITE_FAILURE_MESSAGE`. That includes a raced at-0 raise.
- On success, `revalidatePath('/inventory')` and redirect to `/inventory/scan?barcode=&direction=using&removed=1`.
- Every `redirect` stays outside the `try`.

#### 3. Scan page

**File:** `src/app/inventory/scan/page.tsx`

**Intent:** Render the using result with its count and one-time confirmation.

**Contract:** Accept `removed` and `floor` on `searchParams` next to `added` (lines 25-29). Remove the `name` branch (lines 63-74). For a `quantity` display, render `ScanCapture` with title `name` and detail `String(quantity)`. The confirmation follows the flags:

- Stocking with `added=1` gets `Item ${display.name} ${barcode} was added to inventory.`
- Using with `removed=1` gets `Item ${display.name} ${barcode} was removed from inventory.`
- Using with `floor=1` gets `Item ${display.name} ${barcode} is already at 0.`
- Anything else gets no confirmation.

Pass the matching flag name as the one to clear. Keep `holdBarcode` and `key={barcode}`. This file imports no quantity wrapper.

#### 4. Submit

**File:** `src/app/inventory/scan/scan-capture.tsx`

**Intent:** A using submit writes once, the same way stocking does.

**Contract:** Replace the using `router.push` (lines 76-85) with a `consumeScannedItem(barcode, ensuredSessionId)` call. Use the same in-flight ref, transition, `unstable_rethrow`, and failure state as the stocking path (lines 87-118). Generalize the ref name to `isScanSubmitInFlight` so either direction blocks a second submit. In `finally`, for the same barcode as the hold, bump both `scanRound` and `noticeGeneration`. Replace `shouldClearAdded` on `ScanCaptureResult` (lines 20-25) with `clearParam?: 'added' | 'removed' | 'floor'`.

#### 5. Notice

**File:** `src/app/inventory/scan/scan-result-notice.tsx`

**Intent:** Strip whichever one-time flag the result carried, and show a repeated confirmation again.

**Contract:** Replace `shouldClearAdded` with `clearParam?: 'added' | 'removed' | 'floor'`. The URL effect (lines 45-59) deletes that param only and calls `router.replace` without scrolling. When `confirmation` changes from absent to present while mounted, set phase back to `shown`, latch the new text, and restart the 5000ms timers. This follows Critical Implementation Details.

### Success Criteria

#### Automated Verification

- `pnpm test` passes `src/lib/items/scan-direction.test.ts`. A row returns quantity for stocking and for using, including quantity `0`, and a null row returns create for both directions.
- `pnpm lint` and `pnpm typecheck` exit 0.

#### Manual Verification

- Select using and scan a stocked barcode at 2 or more. The count shown is 1 lower, and the confirmation reads `Item {name} {barcode} was removed from inventory.`
- Refresh that result URL. The count and the database quantity stay the same, and the confirmation does not show.
- Hold the same barcode in frame. The count stays the same. Move it out for at least 500ms and present it again. The count drops by 1 and the confirmation shows again.
- Using-scan a barcode at 0. The notice reads `Item {name} {barcode} is already at 0.`, the count stays 0, and no log row is added. Move it out for at least 500ms and present it again. The same notice shows again.
- Using-scan a barcode this household does not stock. The create flow opens.
- Open `/inventory/scan?barcode={stocked}&direction=using` directly. The name and count show, and nothing is written.
- In one tab, make one stocking scan and one using scan. Both log rows carry the same `scan_session_id` as `sessionStorage` `scan-session-id`.

---

## Phase 3: Session review list

### Overview

The scanner shows every line the current tab session recorded, in both directions, newest first.

### Changes Required

#### 1. Loader

**File:** `src/lib/items/load-scan-session-lines.ts` (new)

**Intent:** Read the session's lines under the member's RLS.

**Contract:** `loadScanSessionLines(scanSessionId, client)` takes the injected client, like the scan wrappers. It runs `from(DB_TABLE_HOUSEHOLD_QUANTITY_CHANGES).select('id, barcode, quantity_delta, created_at, reversed_at, household_inventory(name)').eq('scan_session_id', scanSessionId).order('created_at', { ascending: false })`. It treats `data` as `unknown` and narrows each row with a guard. It returns `ScanSessionLine[]`, where a line is `{ changeId, name, barcode, quantityDelta: 1 | -1, isReversed, createdAt }`. `isReversed` is `reversed_at !== null`, and `createdAt` is the ISO string. It throws `select from household_quantity_changes failed for scan session ${scanSessionId}` when `error` is set or any row fails the guard, with `cause` when an error exists.

**File:** `src/lib/items/load-scan-session-lines.test.ts` (new)

**Intent:** Lock the mapping and the query without a database.

**Contract:** A stub records the table, columns, filter, and order calls. Cover these cases:

- No rows returns `[]`.
- Two rows map in the returned order.
- A row with `reversed_at` set maps to `isReversed: true`.
- A `-1` row maps to `quantityDelta: -1`.
- An error throws with the session id and `cause`.
- A row with a missing name or an out-of-range delta throws.

#### 2. Load action

**File:** `src/app/inventory/actions.ts`

**Intent:** Give the client component a way to load lines.

**Contract:** Export `fetchScanSessionLines(scanSessionId: string)`, which returns `{ status: 'loaded', lines } | { status: 'error', message }`. Validate the id with `isScanSessionId`. When it is invalid, log the failure and return the load failure. Call `loadScanSessionLines` with `createClient()` in `try`. On a throw, log `fetchScanSessionLines failed` with the id and return `SCAN_SESSION_LOAD_FAILURE_MESSAGE`, which is `Session list failed to load. Purify the Machine Spirit and try again.` That text follows the pattern of `ITEM_WRITE_FAILURE_MESSAGE`. The action writes nothing and does not revalidate.

#### 3. List component

**File:** `src/app/inventory/scan/scan-session-list.tsx` (new)

**Intent:** Show the lines below the scanner.

**Contract:** A client component with props `scanSessionId: string | null` and `reloadToken: number`. When `scanSessionId` is null, render an empty list and make no call. Otherwise call `fetchScanSessionLines` on mount and whenever either prop changes. Ignore a response that arrives after a newer request started or after unmount. Render an `<ol>` in a `<section aria-label="Scan session">`, newest first. Each item shows `+1` or `-1`, the name, and the barcode. A load failure renders its message with `role="alert"`. Undo comes in Phase 4.

#### 4. Placement and session state

**File:** `src/app/inventory/scan/scan-capture.tsx`

**Intent:** Mount the list below the scanner and give it the current id.

**Contract:** Hold `scanSessionId` in state, starting at `null`. On mount, set it from `readScanSessionId`, which never writes. After each submit calls `ensureScanSessionId`, set it to the returned id. Render `ScanSessionList` after the scanner block inside `main`. Pass `scanSessionId` and `reloadToken={scanRound}`. A different barcode remounts `ScanCapture` and loads the list fresh.

### Success Criteria

#### Automated Verification

- `pnpm test` passes `src/lib/items/load-scan-session-lines.test.ts`. No rows maps to `[]`, rows keep their returned order, `reversed_at` maps to `isReversed`, `-1` maps to `quantityDelta: -1`, and an error or a malformed row throws with the session id.
- `pnpm lint` and `pnpm typecheck` exit 0.

#### Manual Verification

- In a new tab, open `/inventory/scan` before any scan. The list is empty, and `sessionStorage` has no `scan-session-id` key.
- Make a stocking scan, then a using scan of a different barcode. The list shows the `-1` line above the `+1` line, each with its name and barcode.
- Open `/inventory`, then come back to Scan item in the same tab. The same lines show.
- Open `/inventory/scan` in a new tab session. The list is empty.
- A using scan at 0 adds no line.

---

## Phase 4: Per-line reversal

### Overview

The member can reverse a session line exactly once. The count moves back, and the line shows as reversed. A reversal below 0 is refused visibly.

### Changes Required

#### 1. Reversal migration

**File:** `supabase/migrations/<timestamp>_reverse_quantity_change.sql`, created with `pnpm exec supabase migration new reverse_quantity_change`.

**Intent:** Add the only reversal write path.

**Contract:** `create function public.reverse_quantity_change(change_id uuid) returns integer`, with `language plpgsql`, `security definer`, and `set search_path = ''`. The body runs in this order:

- Raise when the caller is missing or has no household.
- Run `select ... from public.household_quantity_changes as change_row where change_row.id = reverse_quantity_change.change_id and change_row.household_id = caller_household_id for update`.
- When no row comes back, raise `reverse_quantity_change refuses a change this household did not record`. That covers both a missing id and another household's id, so it reveals neither.
- When `reversed_at` is set, raise `reverse_quantity_change refuses a change that is already reversed`.
- Run `update public.household_inventory as inventory set quantity = inventory.quantity - change_row_delta where inventory.household_id = caller_household_id and inventory.item_id = change_row_item_id and inventory.quantity - change_row_delta >= 0 returning inventory.quantity into new_quantity`.
- When no row was updated, raise `reverse_quantity_change refuses a quantity below 0` with `using errcode = 'check_violation'`.
- Set `reversed_at = now()` on the locked row, then return `new_quantity`.

Run `revoke all on function public.reverse_quantity_change(uuid) from public, anon;` and `grant execute on function public.reverse_quantity_change(uuid) to authenticated;`.

#### 2. Names

**File:** `src/lib/db/entities.ts`

**Intent:** Name the reversal function.

**Contract:** Add `DB_FUNCTION_REVERSE_QUANTITY_CHANGE = 'reverse_quantity_change'`.

#### 3. Reversal wrapper

**File:** `src/lib/items/reverse-quantity-change.ts` (new)

**Intent:** Call the RPC and separate the floor refusal from other failures without reading message text.

**Contract:** `reverseQuantityChange(changeId, client)` calls `client.rpc(DB_FUNCTION_REVERSE_QUANTITY_CHANGE, { change_id: changeId })`. It returns a discriminated union. `{ status: 'reversed', quantity }` comes back when `data` is a number, including 0. `{ status: 'below-zero' }` comes back when `error.code === '23514'`. Any other error, or a non-number `data`, throws `reverse_quantity_change failed for change ${changeId}` with `cause` when an error exists.

**File:** `src/lib/items/reverse-quantity-change.test.ts` (new)

**Intent:** Lock the three outcomes.

**Contract:** The stub expects the function name and `{ change_id }`. Cover these cases:

- A number returns `reversed`, including `0`.
- An error with code `23514` returns `below-zero`.
- An error with another code throws with the change id and `cause`.
- `null` data with no error throws.

#### 4. Reversal action

**File:** `src/app/inventory/actions.ts`

**Intent:** Reverse one line for the client.

**Contract:** Export `reverseScanSessionLine(changeId: string)`, which returns `{ status: 'reversed', quantity } | { status: 'error', message }`. Validate the id with `isScanSessionId`, because it is also a UUID. When it is invalid, log the failure and return `ITEM_WRITE_FAILURE_MESSAGE`. Call `reverseQuantityChange` with `createClient()` in `try`. `below-zero` returns `This line cannot be reversed because the count would drop below 0.` A throw is logged as `reverseScanSessionLine failed` with the change id and returns `ITEM_WRITE_FAILURE_MESSAGE`. On success, `revalidatePath('/inventory')` and return `reversed`. The action does not redirect.

#### 5. Undo in the list

**File:** `src/app/inventory/scan/scan-session-list.tsx`

**Intent:** Add Undo to unreversed lines.

**Contract:** An unreversed line renders a `Button` labeled `Undo`, with `aria-label` `Undo {+1|-1} {name} {barcode}`. A reversed line renders the text `reversed` and no button. An in-flight ref blocks a second reversal while one is pending and disables every Undo button. On `reversed`, reload the lines and call `router.refresh()` so a displayed count for that barcode updates. On `error`, render the message with `role="alert"` and leave the line unreversed. A thrown call is logged with the change id and shows `ITEM_WRITE_FAILURE_MESSAGE`.

### Success Criteria

#### Automated Verification

- `pnpm test` passes `src/lib/items/reverse-quantity-change.test.ts`. A number returns `reversed`, including `0`. Code `23514` returns `below-zero`. Any other error or `null` data throws with the change id.
- `pnpm lint` and `pnpm typecheck` exit 0.

#### Manual Verification

- `pnpm exec supabase db push` applies the reversal migration. `has_function_privilege('anon', 'public.reverse_quantity_change(uuid)', 'execute')` returns false, and the same check for `authenticated` returns true.
- Undo a `+1` line. The database quantity drops by 1, and the line stays marked `reversed` with no Undo.
- Undo a `-1` line. The database quantity rises by 1, and the line shows as reversed.
- Stock an item from 0 to 1, then using-scan it back to 0, then Undo the `+1` line. The message reads `This line cannot be reversed because the count would drop below 0.` The line keeps its Undo, and the quantity stays 0.
- Tap Undo twice quickly on one line. Only one reversal happens.
- When the reversed line's barcode is the result on screen, the shown count updates after Undo.
- As a member in SQL, `reverse_quantity_change` on an already reversed id raises `reverse_quantity_change refuses a change that is already reversed`. A random UUID raises `reverse_quantity_change refuses a change this household did not record`.

---

## Testing Strategy

### Unit Tests

- `incrementHabUnitQuantity` and `decrementHabUnitQuantity` return `{ changeId, quantity }`, accept quantity 0, and throw with the barcode on an RPC error or a malformed result.
- `isScanSessionId`, `readScanSessionId`, and `ensureScanSessionId` cover missing, invalid, and valid stored values, a read that never writes, and an ensure that mints once.
- `resolveScanDisplay` returns quantity for both directions, including 0, and create for a null row.
- `loadScanSessionLines` covers empty, order, reversed, `-1`, error, and malformed rows.
- `reverseQuantityChange` covers reversed, below-zero by SQLSTATE, other errors, and null data.

### Integration Tests

- None. No route or browser harness exists, and Vitest does not collect `*.test.tsx`. The SQL behavior, the server actions, and the components are covered by the manual steps below and by `pnpm typecheck`.

### Manual Testing Steps

1. Run `pnpm exec supabase db push` to apply the ledger migration.
2. In the SQL editor, start a transaction. Run `set local role authenticated` and `set local request.jwt.claims = '{"sub":"<member user id>"}'`. Call `increment_household_quantity('<stocked barcode>', gen_random_uuid())`. Expect a change id and the count plus 1, plus one log row. Roll back.
3. Repeat step 2 with `decrement_household_quantity` on a barcode at 1. Expect 0, then a `refuses a quantity below 0` raise and no second log row. Call both functions with an unknown barcode. Expect the not-stocked text.
4. Check `has_function_privilege` for `anon` and `authenticated` on both scan functions. Check that `to_regprocedure('public.increment_household_quantity(text)')` is null.
5. In the app, stock-scan an item. Expect the S-03 result and toast, a `scan-session-id` in `sessionStorage`, and one log row with that id.
6. Using-scan a stocked item at 2 or more. Expect the count 1 lower and `Item {name} {barcode} was removed from inventory.` Refresh. Expect no change and no confirmation.
7. Hold the same can in frame. Expect no change. Move it out for 500ms or more and present it again. Expect one more decrease.
8. Using-scan an item at 0 twice, with a 500ms miss between. Expect `Item {name} {barcode} is already at 0.` both times and no new log row.
9. In a new tab, open the scanner. Expect an empty list and no `scan-session-id`. Make one scan in each direction. Expect two lines, newest first. Leave the scanner and return. Expect the same lines.
10. Apply the reversal migration. Undo a `+1` line and a `-1` line. Expect the quantities to move back and both lines marked `reversed` without Undo.
11. Bring an item to 0 through a `+1` and then a `-1`. Undo the `+1`. Expect `This line cannot be reversed because the count would drop below 0.` and an unreversed line.
12. Double-tap Undo on one line. Expect one reversal.

## Migration and Rollback

Two migrations, applied with `pnpm exec supabase db push` (`README.md` lines 42-51).

The ledger migration adds a constraint, a table, and an RLS policy. It drops `increment_household_quantity(text)` and creates the two `(text, uuid)` scan functions. The constraint validates the existing rows, which are all at least 0. No existing quantity changes. The old increment is gone the moment the migration applies, so the build deployed from `main` fails stocking scans until this branch deploys. Apply it close to deploy.

The reversal migration adds one function and changes no data.

All three functions are `security definer` with `set search_path = ''`. Each one resolves the household from `auth.uid()` through `household_members`, revokes `public` and `anon`, and grants `authenticated` only. The table has a member-only select policy and no write policy, so rows change only through these functions.

To roll back, add one new migration and deploy the S-03 app code with it:

- Drop `reverse_quantity_change(uuid)`, `decrement_household_quantity(text, uuid)`, and `increment_household_quantity(text, uuid)`.
- Recreate `increment_household_quantity(item_barcode text) returns integer` from `supabase/migrations/20260930092020_increment_household_quantity.sql` lines 1-48, with its revoke and grant.
- Drop `public.household_quantity_changes`.
- Drop the `household_inventory_quantity_not_negative` constraint, or keep it, since S-03 never writes a negative value.

Dropping the table loses the change history. Counts stay as they are.

## References

- Roadmap: `context/foundation/roadmap.md` (S-04, lines 115-125, and the At a glance row on line 33)
- PRD: `context/foundation/prd.md` (guardrail 1 line 70, US-02 lines 84-88, FR-004 lines 116-118, FR-007 floor of 0 line 128, FR-009 lines 136-138)
- Stocking action and failure text: `src/app/inventory/actions.ts` lines 29-30 and 151-183
- Scan page result branches and stocking copy: `src/app/inventory/scan/page.tsx` lines 17-20, 25-29, 54-91, and 86
- Submit paths, in-flight ref, and notice key: `src/app/inventory/scan/scan-capture.tsx` lines 20-25, 49-55, 67, 76-118, and 144
- Notice latch and flag clear: `src/app/inventory/scan/scan-result-notice.tsx` lines 12-17, 28, and 45-59
- Direction storage: `src/lib/items/scan-direction.ts` lines 3, 9-21, and 45-58, `src/app/inventory/scan/scan-direction-buttons.tsx` lines 30-63
- Scanner hold and round: `src/components/barcode-scanner.tsx` lines 35, 58-61, 75-77, and 131-134
- Increment RPC and anon revoke: `supabase/migrations/20260930092020_increment_household_quantity.sql` lines 1-51, `supabase/migrations/20261028113918_revoke_increment_household_quantity_from_anon.sql` line 1
- Inventory table, policy, and unreadable barcode table: `supabase/migrations/20260916120209_create_items.sql` lines 13-22, 24-53
- Wrapper pattern and test: `src/lib/items/increment-hab-unit-quantity.ts` lines 3-33, `src/lib/items/increment-hab-unit-quantity.test.ts` lines 11-39
- Row load with quantity: `src/lib/items/load-hab-unit-item-by-barcode.ts` lines 21-60
- Names: `src/lib/db/entities.ts` lines 1-28
- Test include and scripts: `vitest.config.mts` line 16, `package.json` lines 10-12
- Next 16.4.3 guides: `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`, `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md`, `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md`, `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`, `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md`

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Quantity change ledger and scan RPCs

#### Automated

- [ ] 1.1 `pnpm test` passes `src/lib/items/increment-hab-unit-quantity.test.ts` and `src/lib/items/decrement-hab-unit-quantity.test.ts`. A row returns `{ changeId, quantity }`, a quantity of `0` is returned, and an RPC error or a malformed result throws an `Error` that names the barcode.
- [ ] 1.2 `pnpm test` passes `src/lib/items/scan-session.test.ts`. Read returns `null` for missing or invalid values without writing, ensure mints once and reuses a valid id, and `isScanSessionId` rejects non-UUID input.
- [ ] 1.3 `pnpm lint` and `pnpm typecheck` exit 0.

#### Manual

- [ ] 1.4 `pnpm exec supabase db push` applies the new migration. `select to_regprocedure('public.increment_household_quantity(text)')` returns null.
- [ ] 1.5 `has_function_privilege('anon', ..., 'execute')` returns false for `increment_household_quantity(text, uuid)` and `decrement_household_quantity(text, uuid)`, and `has_function_privilege('authenticated', ..., 'execute')` returns true for both.
- [ ] 1.6 In a rolled-back transaction, `update public.household_inventory set quantity = -1` fails with a check violation.
- [ ] 1.7 As a member, `increment_household_quantity` on a stocked barcode returns a change id and the count plus 1, and adds one log row with that session id, delta 1, and the trimmed barcode.
- [ ] 1.8 As a member, `decrement_household_quantity` on a barcode at 1 returns a change id and 0, and adds one log row with delta -1. A second call raises `decrement_household_quantity refuses a quantity below 0` and adds no log row.
- [ ] 1.9 As a member, both functions raise the `refuses a barcode this household does not stock` text for an unknown barcode and add no log row.
- [ ] 1.10 As a member, `select` on `household_quantity_changes` returns only that household's rows, and an `insert` is refused.
- [ ] 1.11 In the app, a stocking scan still adds 1 and shows `Item {name} {barcode} was added to inventory.` The tab's `sessionStorage` holds `scan-session-id`, and the new log row carries that id.

### Phase 2: Using scan lowers the count

#### Automated

- [ ] 2.1 `pnpm test` passes `src/lib/items/scan-direction.test.ts`. A row returns quantity for stocking and for using, including quantity `0`, and a null row returns create for both directions.
- [ ] 2.2 `pnpm lint` and `pnpm typecheck` exit 0.

#### Manual

- [ ] 2.3 Select using and scan a stocked barcode at 2 or more. The count shown is 1 lower, and the confirmation reads `Item {name} {barcode} was removed from inventory.`
- [ ] 2.4 Refresh that result URL. The count and the database quantity stay the same, and the confirmation does not show.
- [ ] 2.5 Hold the same barcode in frame. The count stays the same. Move it out for at least 500ms and present it again. The count drops by 1 and the confirmation shows again.
- [ ] 2.6 Using-scan a barcode at 0. The notice reads `Item {name} {barcode} is already at 0.`, the count stays 0, and no log row is added. Move it out for at least 500ms and present it again. The same notice shows again.
- [ ] 2.7 Using-scan a barcode this household does not stock. The create flow opens.
- [ ] 2.8 Open `/inventory/scan?barcode={stocked}&direction=using` directly. The name and count show, and nothing is written.
- [ ] 2.9 In one tab, make one stocking scan and one using scan. Both log rows carry the same `scan_session_id` as `sessionStorage` `scan-session-id`.

### Phase 3: Session review list

#### Automated

- [ ] 3.1 `pnpm test` passes `src/lib/items/load-scan-session-lines.test.ts`. No rows maps to `[]`, rows keep their returned order, `reversed_at` maps to `isReversed`, `-1` maps to `quantityDelta: -1`, and an error or a malformed row throws with the session id.
- [ ] 3.2 `pnpm lint` and `pnpm typecheck` exit 0.

#### Manual

- [ ] 3.3 In a new tab, open `/inventory/scan` before any scan. The list is empty, and `sessionStorage` has no `scan-session-id` key.
- [ ] 3.4 Make a stocking scan, then a using scan of a different barcode. The list shows the `-1` line above the `+1` line, each with its name and barcode.
- [ ] 3.5 Open `/inventory`, then come back to Scan item in the same tab. The same lines show.
- [ ] 3.6 Open `/inventory/scan` in a new tab session. The list is empty.
- [ ] 3.7 A using scan at 0 adds no line.

### Phase 4: Per-line reversal

#### Automated

- [ ] 4.1 `pnpm test` passes `src/lib/items/reverse-quantity-change.test.ts`. A number returns `reversed`, including `0`. Code `23514` returns `below-zero`. Any other error or `null` data throws with the change id.
- [ ] 4.2 `pnpm lint` and `pnpm typecheck` exit 0.

#### Manual

- [ ] 4.3 `pnpm exec supabase db push` applies the reversal migration. `has_function_privilege('anon', 'public.reverse_quantity_change(uuid)', 'execute')` returns false, and the same check for `authenticated` returns true.
- [ ] 4.4 Undo a `+1` line. The database quantity drops by 1, and the line stays marked `reversed` with no Undo.
- [ ] 4.5 Undo a `-1` line. The database quantity rises by 1, and the line shows as reversed.
- [ ] 4.6 Stock an item from 0 to 1, then using-scan it back to 0, then Undo the `+1` line. The message reads `This line cannot be reversed because the count would drop below 0.` The line keeps its Undo, and the quantity stays 0.
- [ ] 4.7 Tap Undo twice quickly on one line. Only one reversal happens.
- [ ] 4.8 When the reversed line's barcode is the result on screen, the shown count updates after Undo.
- [ ] 4.9 As a member in SQL, `reverse_quantity_change` on an already reversed id raises `reverse_quantity_change refuses a change that is already reversed`. A random UUID raises `reverse_quantity_change refuses a change this household did not record`.
