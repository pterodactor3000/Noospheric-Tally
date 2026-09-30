# Stocking Mode Increase Implementation Plan

## Overview

A signed-in member can open the scanner, choose stocking, and scan items one after another so each stocked barcode adds 1 to that household quantity and the new count is shown. Choosing using shows the item and leaves the quantity unchanged. This is roadmap S-03. It covers PRD FR-003, FR-012, and US-01: one added unit per stocking scan, with the active direction visible while scanning and a fresh tab session starting on using.

## Current State Analysis

`/inventory/scan` with no barcode renders `ScanCapture`. A valid barcode that this household stocks renders `AlreadyStocked` with the name and writes nothing. A miss redirects to `/inventory/new`. The camera stops after one detection and pushes `/inventory/scan?barcode=`. The manual fallback is a GET form to the same route. Evidence: `src/app/inventory/scan/page.tsx` lines 22-48, `src/app/inventory/scan/scan-capture.tsx` lines 23-26, `src/components/barcode-scanner.tsx` lines 84-85 and 129-169.

`household_inventory.quantity` is `integer not null default 0`. RLS allows select for a member and has no insert or update policy. `create_item` and `add_item_to_household` insert the row without setting quantity, so the default 0 stands. No function updates quantity. Evidence: `supabase/migrations/20260916120209_create_items.sql` lines 29, 43-53, and 133-134.

`loadHabUnitItemByBarcode` selects `item_id, name` only and returns `Item`. The inventory list renders names only. Evidence: `src/lib/items/load-hab-unit-item-by-barcode.ts` lines 27-46, `src/app/inventory/page.tsx` lines 29-31.

Item writes are security-definer RPCs on the cookie session client. The wrapper throws an `Error` that names the input when the RPC returns an error. Evidence: `src/lib/items/create-new-item.ts` lines 8-17. The injectable-client test pattern is `src/lib/health/check-supabase-health.test.ts` lines 9-16. Vitest collects `src/**/*.test.ts` only.

## Desired End State

On `/inventory/scan`, two normal buttons labeled using and stocking show one selected choice. A new tab session starts on using. The last click is still selected after leaving the scanner and coming back in the same tab.

A stocking scan of a stocked barcode adds 1 and shows the new count, with no quantity field. A toast reads `Item {name} {barcode} was added to inventory.` Holding that same barcode in frame does not add another 1. After the camera has missed it for 500ms, the next presentation adds 1 and the toast shows again. Refreshing the result page does not add another 1 and does not show the toast. A using scan shows the item name and leaves the stored quantity unchanged. An unknown barcode still opens the existing create flow, and a created row stays at quantity 0. The direction buttons stay visible on the result, and a different barcode can be read without waiting.

Verify with the manual steps in Testing Strategy.

## What We're NOT Doing

- Subtracting quantity, a scan session list, or per-line undo. Those are S-04, FR-004, and FR-009. Guardrail 1's "user notices a repeated scan" mechanism stays there. Two intentional stocking scans of the same barcode add 2, which is US-01.
- Minimums, stock labels, and showing quantity on the inventory list. Those are S-06, FR-007, and FR-008.
- Name search and hand-edited counts. Those are S-05, FR-006, and FR-013.
- Changing `create_item` or `add_item_to_household` so a new row starts above 0. S-02 leaves quantity at 0 so create is not a stock-in.
- Catalog lookup, hab-unit lookup, and category panels.

## Implementation Approach

Add one security-definer RPC that adds 1 for the caller's household, matching `create_item`. Keep the scan page a display. The stocking write is a server action POST, so a refresh of the result URL cannot add another 1. Store the selected direction in `sessionStorage` for the tab. Pass `direction=stocking` on the result URL only so the server knows which display to render. The next scan reads `sessionStorage`, not that query value.

Reuse `Button` outline and default variants, `validateBarcode`, `loadHabUnitItemByBarcode`, and the `/inventory/new` redirect. Keep the scanner one-shot per mount. The result view mounts a new `ScanCapture`. That camera ignores the barcode just counted until a 500ms miss, then the next presentation can count. A different code still counts immediately. Stripping the one-time toast flag must not reset that wait.

## Critical Implementation Details

**GET does not increment.** `src/app/inventory/scan/page.tsx` loads and renders. It must not call `incrementHabUnitQuantity`. Only the stocking server action calls it, once per submit. The result URL may include `direction=stocking` as a display flag. Reloading that URL shows the current quantity and does not write.

**Atomic add.** The RPC updates with `quantity = quantity + 1` and `returning`, so two overlapping stocking scans of the same row both count. Do not read the quantity in TypeScript and write `quantity + 1` from the client.

```sql
update public.household_inventory
set quantity = quantity + 1
where household_id = caller_household_id
  and item_id = found_item_id
returning quantity into new_quantity;
```

**Zero is a real quantity.** The wrapper treats RPC failure as `error` or `data === null`. It must not use `!data`, because a later 0 would be a successful value. `createNewItem` uses `!data` only because its id is never empty (`src/lib/items/create-new-item.ts` line 14).

**Do not branch on exception text.** The action calls `loadHabUnitItemByBarcode` first. A miss redirects to `/inventory/new?barcode=`. The RPC raise is only the race where the row disappears after that load, and the action shows `ITEM_WRITE_FAILURE_MESSAGE` (`src/app/inventory/actions.ts` lines 27-28).

**Direction values.** The only stocking token is the exact string `stocking`. A missing key, `using`, or any other stored or query value is using.

**Rearm after a miss.** The stocking result starts a camera. It must not count the barcode just written while that code is still in frame. Ignore that exact code until the reader has gone 500ms without decoding it. One empty frame does not re-arm. After that miss, the next decode of the same code submits once. Any other decoded code submits immediately.

**Stocking toast.** The stocking redirect adds `added=1`. The result renders a polite status with the text `Item {name} {barcode} was added to inventory.` Then it removes `added` from the URL with `router.replace`. Refresh has no `added` flag, so the toast does not return. No toast library. Using scans and the create flow do not show this toast. The scanner key is the counted barcode, not `added`, so removing the flag does not reset the miss wait.

## Phase 1: Household quantity increment

### Overview

A member can add 1 to the quantity of an item this household already stocks. A barcode this household does not stock is refused. Each call adds 1 once, for the caller's household only.

### Changes Required

#### 1. Increment RPC

**File:** `supabase/migrations/20260930092020_increment_household_quantity.sql`

**Intent:** Add the only write path for a stocking scan. Follow `create_item`: `security definer`, `search_path = ''`, `auth.uid()`, household from `household_members`, `revoke all` from `public`, `grant execute` to `authenticated`.

**Contract:** `increment_household_quantity(item_barcode text) returns integer`. Trim the barcode. Resolve the caller's household. Find `item_barcodes.item_id`. Run the atomic update above. Return the new quantity. Raise when the caller is missing, the caller has no household, the barcode matches no item, or this household has no inventory row for that item. Do not insert a row. Use one raise message for the unknown and not-stocked cases: `increment_household_quantity refuses a barcode this household does not stock`.

#### 2. Wrapper and names

**File:** `src/lib/db/entities.ts`

**Intent:** Name the RPC next to the other item functions.

**Contract:** Export `DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY` with value `increment_household_quantity`.

**File:** `src/lib/items/increment-hab-unit-quantity.ts`

**Intent:** Call the RPC with the session client injected, so the test can stub it the way `checkSupabaseHealth` stubs `rpc`.

**Contract:** `incrementHabUnitQuantity(itemBarcode, client)` calls `client.rpc(DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY, { item_barcode: itemBarcode })`. Return `data` when it is a number. Throw `Error` with message `increment_household_quantity failed for barcode ${itemBarcode}` when `error` is set or `data` is `null`, and set `cause` to the RPC error when one exists. The server action creates the client with `createClient` from `src/lib/supabase/server.ts` and passes it in. This wrapper does not call `createClient` itself.

**File:** `src/lib/items/increment-hab-unit-quantity.test.ts`

**Intent:** Lock the success and failure returns without a database.

**Contract:** A stub `rpc` expects the function name and `{ item_barcode }`. Success resolves the returned number, including a test where that number is `0` so `!data` cannot sneak in. An RPC error rejects with the barcode in the message.

### Success Criteria

#### Automated Verification

- `pnpm test` passes `src/lib/items/increment-hab-unit-quantity.test.ts`: a successful rpc returns its number, including `0`, and an rpc error throws an `Error` whose message names the barcode.
- `pnpm lint` and `pnpm exec tsc --noEmit` exit 0.

#### Manual Verification

- `pnpm exec supabase db push` applies `20260930092020_increment_household_quantity.sql`. `README.md` lines 46-48.
- For a barcode this household stocks, two calls return 1 then 2 when the row started at 0.
- For a barcode this household does not stock, the call raises and inserts no `household_inventory` row.

---

## Phase 2: Scan direction buttons

### Overview

The open scanner shows using and stocking as two normal buttons with one selected. The choice is kept for the tab session and restored when the scanner opens again. A new tab session starts on using.

### Changes Required

#### 1. Direction storage

**File:** `src/lib/items/scan-direction.ts`

**Intent:** Keep the using and stocking tokens and the storage rules in one pure module.

**Contract:** Export `SCAN_DIRECTION_USING` as `using`, `SCAN_DIRECTION_STOCKING` as `stocking`, and `SCAN_DIRECTION_STORAGE_KEY` as `scan-direction`. `readScanDirection(storage)` returns `stocking` only when `storage.getItem(SCAN_DIRECTION_STORAGE_KEY)` is exactly `stocking`. Every other value returns `using`. `writeScanDirection(storage, direction)` stores that direction under the key. `storage` is `Pick<Storage, 'getItem' | 'setItem'>` so tests pass a memory object.

**File:** `src/lib/items/scan-direction.test.ts`

**Intent:** Lock the default and the round trip.

**Contract:** Missing, `using`, empty string, and any other stored value read as using. `stocking` reads as stocking. Write then read returns the written direction.

#### 2. Buttons on the scanner

**File:** `src/app/inventory/scan/scan-direction-buttons.tsx`

**Intent:** Show the choice on the scanner as two `Button` controls. The selected control uses the `default` variant. The other uses `outline`. `src/components/ui/button.tsx` lines 39-54. Do not render `<input type="radio">`.

**Contract:** The group has `role="radiogroup"` and `aria-label="Scan direction"`. Each control is a `Button` with `role="radio"` and `aria-checked`. Labels are the strings `using` and `stocking`. On mount, read `window.sessionStorage` through `readScanDirection`. A click calls `writeScanDirection` and updates the selected button. This phase does not change what a scan writes.

**File:** `src/app/inventory/scan/scan-capture.tsx`

**Intent:** Put the buttons where the camera is, including the manual fallback, so the direction stays visible while scanning.

**Contract:** Render `ScanDirectionButtons` in `ScanCapture` above `BarcodeScanner`. Leave `onDetect` as the existing `router.push` until Phase 3.

### Success Criteria

#### Automated Verification

- `pnpm test` passes `src/lib/items/scan-direction.test.ts`: missing and unknown stored values resolve to using, `stocking` resolves to stocking, and a write then read returns the written direction.
- `pnpm lint` and `pnpm exec tsc --noEmit` exit 0.

#### Manual Verification

- Open `/inventory/scan` in a tab with no stored direction. using is selected. Both controls are normal buttons.
- Click stocking, open `/inventory`, then use Scan item. stocking is still selected in that tab.
- Open a new tab session and open `/inventory/scan`. using is selected.

---

## Phase 3: Scan applies the selected direction

### Overview

A stocking scan adds 1 and shows the new count with no extra quantity step. A using scan shows the item and leaves the count unchanged. Loading the result again does not add another 1. An unknown barcode still follows the existing create flow.

### Changes Required

#### 1. Display decision and quantity load

**File:** `src/lib/items/scan-direction.ts`

**Intent:** Decide the result screen without writing.

**Contract:** `resolveScanDisplay(direction, stock)` returns `{ status: 'create' }` when `stock` is `null`. It returns `{ status: 'quantity', name, quantity }` when `direction` is `stocking` and `stock` is present. It returns `{ status: 'name', name }` when `direction` is `using` and `stock` is present. It does not call the network.

**File:** `src/lib/items/scan-direction.test.ts`

**Intent:** Lock the three display results.

**Contract:** Cover stocking with a stock row, using with a stock row, and a null stock row for both directions.

**File:** `src/lib/items/load-hab-unit-item-by-barcode.ts`

**Intent:** The stocking result needs the current quantity. The list loader stays name-only.

**Contract:** Select `item_id, name, quantity`. Return `{ itemId, name, quantity }`. Keep `Item` as `{ itemId, name }` for `loadHabUnitItems`. Call sites in `src/app/inventory/actions.ts` and `src/app/inventory/new/page.tsx` still use existence and `name` only.

#### 2. Stocking action

**File:** `src/app/inventory/actions.ts`

**Intent:** Perform the one increment for a stocking submit.

**Contract:** Export `stockScannedItem(barcode: string)`. Validate with `validateBarcode`. On invalid, return `{ status: 'error', message }` using the validator message and `field: 'barcode'`. Load the household row. When it is null, `redirect` to `/inventory/new?barcode=` with the encoded barcode. Otherwise call `incrementHabUnitQuantity` with `createClient()`, `revalidatePath('/inventory')`, and `redirect` to `/inventory/scan?barcode=` plus `direction=stocking` and `added=1`. On a thrown increment error, return `{ status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }`. Do not parse Postgres exception text.

#### 3. Scan page and submit

**File:** `src/app/inventory/scan/page.tsx`

**Intent:** Render the result for the direction flag and keep the scanner on the page for the next barcode.

**Contract:** Accept `direction` on `searchParams`. When `barcode` is absent, render `ScanCapture` only, as today. When the barcode is invalid, render `ScanCapture` with the error, as today. When the barcode is valid, load the household row and call `resolveScanDisplay`. `create` redirects to `/inventory/new?barcode=`. `name` renders `AlreadyStocked` plus `ScanCapture` and the existing inventory link. `quantity` renders the name and the quantity, `StockedToast` when `added` is the string `1`, plus `ScanCapture` and that link. Pass `holdBarcode` as the counted barcode. Key `ScanCapture` by that barcode, not by `added`. This file does not import `incrementHabUnitQuantity`.

**File:** `src/app/inventory/scan/stocked-count.tsx`

**Intent:** Show the count after a stocking scan.

**Contract:** Props are `name` and `quantity`. Render the name and the quantity number. No form and no buttons that write.

**File:** `src/app/inventory/scan/stocked-toast.tsx`

**Intent:** Confirm the stocking add once, with the item name and barcode.

**Contract:** Client component. Props are `name`, `barcode`, and `show`. When `show` is true, render `role="status"` and `aria-live="polite"` with the text `Item {name} {barcode} was added to inventory.` On mount, `router.replace` the current scan URL without `added`. Do not add a toast dependency. When `show` is false, render nothing.

**File:** `src/app/inventory/scan/scan-capture.tsx`

**Intent:** Submit the selected direction. Stocking writes once. Using only navigates.

**Contract:** Read the direction with `readScanDirection(window.sessionStorage)` at submit time, not from the result URL. Using calls `router.push` to `/inventory/scan?barcode=` and `direction=using`. Stocking calls `stockScannedItem`. An error result sets `errorMessage` on `BarcodeScanner`. A redirect ends the action.

**File:** `src/components/barcode-scanner.tsx`

**Intent:** The manual Apply path must use the same submit as the camera. A GET of a stocking barcode must not be the write.

**Contract:** Add an `onSubmitBarcode(barcode: string)` prop. Camera detect and the Apply control both call it. Remove the GET `action="/inventory/scan"` from this form so Apply cannot increment by navigation alone. Keep the invalid-barcode and camera-error alert. Add optional `holdBarcode`. While it is set, ignore a decode equal to `holdBarcode` until 500ms have passed with no decode of that code. One empty frame does not clear the hold. After the miss, the next decode of that code calls `onSubmitBarcode` once. A different code calls `onSubmitBarcode` immediately. The manual Apply path is an intentional submit and is not held.

### Success Criteria

#### Automated Verification

- `pnpm test` passes the `resolveScanDisplay` cases in `src/lib/items/scan-direction.test.ts`: stocking with a row returns quantity, using with a row returns name, and a null row returns create for both directions.
- `pnpm lint` and `pnpm exec tsc --noEmit` exit 0.

#### Manual Verification

- Select stocking and scan a stocked barcode. The count shown is 1 higher than before. There is no quantity field. A toast reads `Item {name} {barcode} was added to inventory.`
- Hold that same barcode in frame. The count stays the same. Move it out of frame for at least 500ms, then present it again. The count is 1 higher, and the toast shows again.
- Refresh that result URL. The shown count stays the same, the database quantity stays the same, and the toast does not show.
- Select using and scan a stocked barcode. The name shows. The database quantity stays the same.
- In either direction, scan a barcode this household does not stock. The existing create flow opens. Saving it leaves quantity at 0.
- After a stocking result, using and stocking are still visible, stocking is still selected, and a different barcode counts without waiting out the 500ms miss.

---

## Testing Strategy

### Unit Tests

- `incrementHabUnitQuantity` returns the rpc number and throws with the barcode on rpc error. Include a returned `0`.
- `readScanDirection` and `writeScanDirection` cover missing, unknown, using, and stocking.
- `resolveScanDisplay` covers create, name, and quantity. It has no client and no write.

### Integration Tests

- No route or browser test exists for inventory today, and Vitest does not collect `*.test.tsx`. Do not add a browser harness in this change. The server action and the page stay covered by the manual steps and by `pnpm exec tsc --noEmit`.

### Manual Testing Steps

1. Apply the migration with `pnpm exec supabase db push`.
2. Call `increment_household_quantity` twice for a stocked barcode that started at 0. Expect 1, then 2.
3. Call it for a barcode this household does not stock. Expect a raise and no new inventory row.
4. Open `/inventory/scan`. Expect using selected. Click stocking, leave, and come back in the same tab. Expect stocking. Open a new tab session. Expect using.
5. Stocking-scan a stocked item. Expect the count to rise by 1 and the toast `Item {name} {barcode} was added to inventory.` Hold the same code in frame. Expect no second rise. Move it out for at least 500ms and present it again. Expect one more rise and the toast again.
6. Refresh the result. Expect no further rise and no toast.
7. Using-scan a stocked item. Expect the name and an unchanged quantity.
8. Scan an unknown barcode in stocking mode. Expect the create flow, and quantity 0 after save.

## Migration and Rollback

Apply `supabase/migrations/20260930092020_increment_household_quantity.sql` with `pnpm exec supabase db push`. The migration adds a function only. Existing quantities stay as they are. Rollback is a later migration that runs `drop function if exists public.increment_household_quantity(text);`. Dropping the function restores the current scan behavior once the app code that calls it is removed. Leave `household_inventory` in place.

## References

- Roadmap: `context/foundation/roadmap.md` (S-03, lines 102-112)
- PRD: `context/foundation/prd.md` (US-01 lines 78-82, guardrail 1 lines 70-71, FR-003 lines 112-114, FR-012 lines 148-150)
- Scan display: `src/app/inventory/scan/page.tsx` lines 22-48
- Camera stop and manual GET: `src/components/barcode-scanner.tsx` lines 84-85 and 129-169
- Quantity column and select policy: `supabase/migrations/20260916120209_create_items.sql` lines 29 and 43-53
- RPC wrapper pattern: `src/lib/items/create-new-item.ts` lines 8-17
- Injectable rpc test: `src/lib/health/check-supabase-health.test.ts` lines 9-16
- Migration command: `README.md` lines 46-48

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Household quantity increment

#### Automated

- [ ] 1.1 `pnpm test` passes `src/lib/items/increment-hab-unit-quantity.test.ts`: a successful rpc returns its number, including `0`, and an rpc error throws an `Error` whose message names the barcode.
- [ ] 1.2 `pnpm lint` and `pnpm exec tsc --noEmit` exit 0.

#### Manual

- [ ] 1.3 `pnpm exec supabase db push` applies `20260930092020_increment_household_quantity.sql`. `README.md` lines 46-48.
- [ ] 1.4 For a barcode this household stocks, two calls return 1 then 2 when the row started at 0.
- [ ] 1.5 For a barcode this household does not stock, the call raises and inserts no `household_inventory` row.

### Phase 2: Scan direction buttons

#### Automated

- [ ] 2.1 `pnpm test` passes `src/lib/items/scan-direction.test.ts`: missing and unknown stored values resolve to using, `stocking` resolves to stocking, and a write then read returns the written direction.
- [ ] 2.2 `pnpm lint` and `pnpm exec tsc --noEmit` exit 0.

#### Manual

- [ ] 2.3 Open `/inventory/scan` in a tab with no stored direction. using is selected. Both controls are normal buttons.
- [ ] 2.4 Click stocking, open `/inventory`, then use Scan item. stocking is still selected in that tab.
- [ ] 2.5 Open a new tab session and open `/inventory/scan`. using is selected.

### Phase 3: Scan applies the selected direction

#### Automated

- [ ] 3.1 `pnpm test` passes the `resolveScanDisplay` cases in `src/lib/items/scan-direction.test.ts`: stocking with a row returns quantity, using with a row returns name, and a null row returns create for both directions.
- [ ] 3.2 `pnpm lint` and `pnpm exec tsc --noEmit` exit 0.

#### Manual

- [ ] 3.3 Select stocking and scan a stocked barcode. The count shown is 1 higher than before. There is no quantity field. A toast reads `Item {name} {barcode} was added to inventory.`
- [ ] 3.4 Hold that same barcode in frame. The count stays the same. Move it out of frame for at least 500ms, then present it again. The count is 1 higher, and the toast shows again.
- [ ] 3.5 Refresh that result URL. The shown count stays the same, the database quantity stays the same, and the toast does not show.
- [ ] 3.6 Select using and scan a stocked barcode. The name shows. The database quantity stays the same.
- [ ] 3.7 In either direction, scan a barcode this household does not stock. The existing create flow opens. Saving it leaves quantity at 0.
- [ ] 3.8 After a stocking result, using and stocking are still visible, stocking is still selected, and a different barcode counts without waiting out the 500ms miss.
