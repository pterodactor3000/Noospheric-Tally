# Shop Barcode Lookup Implementation Plan

## Overview

A member scans a barcode from a separate lookup control and sees whether that item is in the hab unit. A barcode that is not in the household inventory is blocked in that view. The lookup reads only the household inventory. This is roadmap S-09 and covers PRD FR-017 and story US-03.

The same change places a Lookup button beside Restock and caps the tally section so a long list scrolls on its own. The title, the search row, and the action buttons stay visible.

No table, migration, or write is added.

## Current State Analysis

- `loadHabUnitItemByBarcode` calls `find_item_by_barcode`, then selects `household_inventory` by `item_id`. It returns `null` when the household has no row (`src/lib/items/load-hab-unit-item-by-barcode.ts:24-67`). An item that exists only in the global table is `null`. That is the FR-017 block.
- `find_item_by_barcode` is `security definer` and matches every `item_barcodes` row (`supabase/migrations/20260916120209_create_items.sql:55-86`). `findGlobalItemByBarcode` wraps that RPC (`src/lib/items/find-global-item-by-barcode.ts`). The lookup must not use either as its answer.
- Member select policies already cover `household_inventory` and `item_barcodes` (`supabase/migrations/20260916120209_create_items.sql:41-53`, `supabase/migrations/20261030084022_item_barcodes_select_if_member.sql:1-13`). No migration is needed.
- The create scan redirects a miss to `/inventory/new?barcode=…` (`src/app/inventory/scan/page.tsx:59-61`). `resolveScanDisplay` returns `status: 'create'` when the household row is null (`src/lib/items/scan-direction.ts:44-50`). The create page then reads the global item and the external catalog. Reusing that path would show a shop barcode the household does not hold as present.
- `ScanCapture` submits stocking and using actions and renders the direction buttons and the session list (`src/app/inventory/scan/scan-capture.tsx`). A lookup writes nothing, so it needs its own capture.
- `BarcodeScanner` takes `onSubmitBarcode`, `holdBarcode`, and `scanRound`, and falls back to a manual form (`src/components/barcode-scanner.tsx:27-33`). While `holdBarcode` matches the decoded text, that same code does not submit again (`src/components/barcode-scanner.tsx:131`). A different code still submits.
- `validateBarcode` returns `status: 'valid' | 'invalid'` (`src/lib/items/validate-barcode.ts:151-197`).
- `getStockState` returns `critical` at `quantity <= minimumQuantity`, `warning` below twice the minimum, and `in-stock` at twice the minimum or more (`src/lib/items/stock-state.ts:19-32`). Labels are `CRITICAL`, `WARNING`, and `IN STOCK` (`src/lib/items/stock-state.ts:7-11`).
- `ScanResultNotice` requires a stock state and always renders a count (`src/app/inventory/scan/scan-result-notice.tsx`). It cannot show a miss.
- `/inventory` is a two-column grid. Add item and Scan item each take one column. Restock uses `col-span-2` (`src/app/inventory/page.tsx:20-28`, `:50-74`). The tally search and the `ul` live in `InventoryTally` (`src/app/inventory/inventory-tally.tsx:78-122`). The list has no max height.
- `/inventory/*` is protected (`src/lib/auth/isProtectedPath.ts:1-9`). `BackToInventoryLink` already covers any `/inventory/` path (`src/components/back-to-inventory-link.tsx:9-10`). A static `lookup` segment resolves before `/inventory/[itemId]`.
- Vitest runs `src/**/*.test.ts` in the node environment (`vitest.config.mts`). There is no component test harness. `resolveScanDisplay` is tested for a null row and stock boundaries (`src/lib/items/scan-direction.test.ts`). `loadHabUnitItemByBarcode` has no test file.

## Desired End State

`/inventory/lookup` accepts a camera scan or a typed barcode. When the household holds that item, the page shows the name, the count, and the stock label. Otherwise it shows `Not in your hab unit.` The scanner stays mounted and accepts the next code. The page does not write, does not link to create, and does not redirect to `/inventory/new`. An invalid barcode shows the existing validation message. A failed household read shows `The hab unit lookup failed. Try the scan again.` and never the blocked sentence.

On `/inventory`, Restock and Lookup share the second action row, one column each. The tally section has a max height. Only the item `ul` scrolls. The title, the search row, and the action buttons stay visible.

Verify with the automated checks and manual steps of each phase. Phase 3 manual sign-off includes screenshots for the user.

## What We're NOT Doing

- A create link, a redirect to `/inventory/new`, or any call to the external catalog.
- Using `findGlobalItemByBarcode` or `resolveScanDisplay` as the lookup answer. A null household row is blocked, not a create.
- Stocking mode, using mode, session undo, or the direction buttons.
- Category panels (S-11) or the consumption rate view (S-08).
- A migration, new table, RPC, server action, or write.
- A second back link. `BackToInventoryLink` already covers `/inventory/lookup`.
- A component or browser test harness. Vitest stays on `src/**/*.test.ts`.
- Changing tally sort, search filtering, row layout, or the count steppers.
- Changing Add item or Scan item.

## Implementation Approach

Split pure logic from rendering, as S-05 and S-07 did.

1. Phase 1 adds `resolveLookupDisplay` and its tests. Nothing in the app calls it yet.
2. Phase 2 adds `/inventory/lookup` and a lookup capture. The page validates, loads the household row, and renders the Phase 1 result. It is reachable by URL before the button exists.
3. Phase 3 adds the Lookup button beside Restock and caps the tally so only the list scrolls. Screenshots of that page go to the user before the manual check is marked done.

## Critical Implementation Details

**Do not reuse `resolveScanDisplay`.** A null row returns `status: 'create'` (`src/lib/items/scan-direction.ts:48-50`). The lookup result for null is `status: 'blocked'`.

**One household read.** The lookup page calls `loadHabUnitItemByBarcode` and no other item or catalog loader. `null` and a thrown error are different results. Catch the throw in the page and render the failure copy. Do not map it to blocked.

**Scanner stays live.** Keep `BarcodeScanner` mounted after a found or blocked result. Pass the last submitted barcode as `holdBarcode` so that same code does not submit again. A different code still calls `onSubmitBarcode`. Do not add a control that unmounts the scanner or requires a separate "scan again" step.

**Tally scroll.** The section is a column with a viewport max height and `overflow-y-auto`. `InventoryTally` is a column with `min-h-0` and `flex-1`. Only the `ul` gets `overflow-y-auto`. The search row, the empty copy, and the no-match status stay outside that scroller. The action buttons stay outside `InventoryTally`, as they do now. On a short viewport the section itself scrolls so the buttons stay reachable when the title, search, and buttons are taller than the cap.

---

## Phase 1: Resolve a lookup result

### Overview

A pure function maps a household item or `null` to a found result or a blocked result. This phase adds no page and no UI.

### Changes Required

#### 1. Lookup display function

**File:** `src/lib/items/resolve-lookup-display.ts` (new)

**Intent:** Name the found and blocked results so the page cannot send a miss into the create flow. The file name matches the primary export.

**Contract:**

```typescript
interface LookupDisplayFound {
  readonly status: 'found'
  readonly name: string
  readonly quantity: number
  readonly stockState: StockState
}

interface LookupDisplayBlocked {
  readonly status: 'blocked'
}

type LookupDisplay = LookupDisplayFound | LookupDisplayBlocked

const resolveLookupDisplay = (
  stock: ScanStock | null,
): LookupDisplay
```

- `ScanStock` is imported with `import type` from `./scan-direction`. `StockState` and `getStockState` come from `./stock-state`.
- The file imports no `next/*`, `react`, or Supabase module.
- `null` returns `{ status: 'blocked' }`.
- A stock row returns `{ status: 'found', name, quantity, stockState }`, where `stockState` is `getStockState(quantity, minimumQuantity)`.
- The input object is not mutated.
- Exports `resolveLookupDisplay` and the type `LookupDisplay`.

#### 2. Lookup display tests

**File:** `src/lib/items/resolve-lookup-display.test.ts` (new)

**Intent:** Pin the block rule and the stock-label boundaries the notice will show.

**Contract:** Vitest tests in the style of `src/lib/items/scan-direction.test.ts`, with `toEqual` and a local stock builder. Test names state behavior:

- returns blocked when the household row is null
- returns found with critical when the quantity is 0
- returns found with critical when the quantity equals the minimum
- returns found with warning when the quantity is one above the minimum
- returns found with in-stock when the quantity is twice the minimum
- does not change the input stock

### Success Criteria

#### Automated Verification

- `npm test -- src/lib/items/resolve-lookup-display.test.ts` passes.
- `npm run typecheck` passes.

#### Manual Verification

- No page calls `resolveLookupDisplay` yet. Confirm with a search of `src/app`.

---

## Phase 2: Add the lookup route and capture

### Overview

`/inventory/lookup` scans or accepts a manual barcode, reads only the household inventory, and shows the found notice, the blocked notice, an invalid-barcode error, or a read-failure message.

### Changes Required

#### 1. Lookup capture

**File:** `src/app/inventory/lookup/lookup-capture.tsx` (new)

**Intent:** Own the scanner and the result copy without stocking, using, or a create link.

**Contract:** A client component. It renders `BarcodeScanner` with `onSubmitBarcode` navigating to `/inventory/lookup?barcode=` plus the encoded barcode. It accepts optional `holdBarcode`, `errorMessage`, `failureMessage`, and a display result.

- Found: visible name, count, and `STOCK_STATE_LABELS[stockState]`.
- Blocked: the exact sentence `Not in your hab unit.`
- Failure: the exact sentence `The hab unit lookup failed. Try the scan again.`
- Invalid: the `errorMessage` from `validateBarcode`, passed through to `BarcodeScanner`.
- No `Link` or anchor to `/inventory/new`. No direction buttons. No session list.
- The scanner stays mounted for found, blocked, invalid, and failure results.

#### 2. Lookup page

**File:** `src/app/inventory/lookup/page.tsx` (new)

**Intent:** Validate, load the household row, and render the capture. Match the scan page's search-param shape without its create redirect.

**Contract:** A server page. It calls `requireCurrentUser` and `requireCurrentHabUnit` first.

- No `barcode` param: render `LookupCapture` with no result.
- Invalid `validateBarcode`: render `LookupCapture` with `defaultBarcode` and `errorMessage`. Do not call the loader.
- Valid barcode: `try` `loadHabUnitItemByBarcode`. On throw, render `LookupCapture` with the failure sentence and `holdBarcode` set to the valid barcode. On success, `resolveLookupDisplay` and render found or blocked with that `holdBarcode`.
- The page imports neither `findGlobalItemByBarcode` nor `lookup-catalog-name`. It does not call `redirect`.

### Success Criteria

#### Automated Verification

- `npm test` passes.
- `npm run typecheck` passes.
- A search of `src/app/inventory/lookup` finds no `inventory/new`, `findGlobalItemByBarcode`, or catalog import.

#### Manual Verification

- Open `/inventory/lookup` while signed in. A household barcode shows name, count, and stock label.
- A barcode that is not in the hab unit shows `Not in your hab unit.` The camera or manual field still accepts another code. The page does not open the create form.
- An invalid code shows the validation message and does not show the blocked sentence.
- With the household read forced to fail, the page shows `The hab unit lookup failed. Try the scan again.` and does not show the blocked sentence.

---

## Phase 3: Place Lookup and keep the tally chrome fixed

### Overview

`/inventory` gains a Lookup button beside Restock. The tally section stops growing with the list. Only the item list scrolls.

### Changes Required

#### 1. Inventory actions and section height

**File:** `src/app/inventory/page.tsx`

**Intent:** Open the lookup route from the tally and keep the title and buttons on screen when the list is long.

**Contract:**

- Remove `col-span-2` from Restock.
- Add a Lookup button in the same grid, `variant="outline"`, `nativeButton={false}`, `render={<Link href="/inventory/lookup" />}`, label `Lookup`.
- Add item and Scan item stay on the first row, unchanged.
- The tally `section` is a flex column with `min-h-0`, `overflow-hidden`, and a max height that fits in the viewport under the page padding, so the title and the action row cannot be pushed off screen.
- `InventoryTally` sits in a `min-h-0 flex-1` region between the title and the buttons.

#### 2. Scrolling list

**File:** `src/app/inventory/inventory-tally.tsx`

**Intent:** Scroll the rows only. Leave search and sort in place.

**Contract:**

- The component root is a flex column with `min-h-0` and `flex-1` when it renders the search and list.
- The search row, including the sort buttons, does not scroll.
- The `ul` has `min-h-0`, `flex-1`, and `overflow-y-auto`.
- `Nothing is added here yet.` and the no-match status stay outside the `ul`.
- Sort, filter, row markup, and the count steppers are otherwise unchanged.

### Success Criteria

#### Automated Verification

- `npm test` passes.
- `npm run typecheck` passes.

#### Manual Verification

- On `/inventory`, Restock and Lookup share one row. Add item and Scan item are unchanged. Lookup opens `/inventory/lookup`.
- With enough items to overflow, only the list scrolls. The title, the search row, and the four buttons stay visible.
- Capture a desktop screenshot and a narrow screenshot of that overflowing tally, plus the side-by-side Restock and Lookup row. Show them to the user. This check stays open until the user approves the layout or the requested tweaks are applied and shown again.

---

## Testing Strategy

### Unit Tests

- `resolveLookupDisplay` covers null, quantity 0, quantity equal to the minimum, one above the minimum, twice the minimum, and a non-mutated input.

### Integration Tests

- No route harness exists. Phase 2 checks the lookup folder with a search so the create path and the catalog cannot slip in.

### Manual Testing Steps

1. Sign in and open `/inventory/lookup` directly.
2. Scan or type a barcode the hab unit holds. Confirm name, count, and stock label.
3. Scan or type a barcode the hab unit does not hold. Confirm `Not in your hab unit.` and that the next code can be entered without a create redirect.
4. Type a short invalid code. Confirm the validation message.
5. Open `/inventory` with a long tally. Confirm the list scrolls and the title, search, and buttons stay visible. Confirm Restock and Lookup share a row.
6. Show the Phase 3 screenshots to the user before marking that manual check done.

## Migration and Rollback

No migration. Revert the branch to remove the route, the button, and the scroll classes. Household data is unchanged.

## References

- Roadmap: `context/foundation/roadmap.md` (S-09)
- PRD: `context/foundation/prd.md` (FR-017, US-03)
- `src/lib/items/load-hab-unit-item-by-barcode.ts:24-67`
- `src/lib/items/scan-direction.ts:44-58`
- `src/lib/items/stock-state.ts:7-32`
- `src/app/inventory/page.tsx:20-74`
- `src/app/inventory/inventory-tally.tsx:78-122`
- `src/components/barcode-scanner.tsx:27-33`
- Linear: TEC-33
- GitHub: https://github.com/pterodactor3000/Noospheric-Tally/issues/14

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Resolve a lookup result

#### Automated

- [x] 1.1 `npm test -- src/lib/items/resolve-lookup-display.test.ts` passes (e8e9154)
- [x] 1.2 Typecheck passes (e8e9154)

#### Manual

- [x] 1.3 No page calls `resolveLookupDisplay` yet (e8e9154)

### Phase 2: Add the lookup route and capture

#### Automated

- [x] 2.1 `npm test` passes (2b4b398)
- [x] 2.2 Typecheck passes (2b4b398)
- [x] 2.3 `src/app/inventory/lookup` has no create redirect, global item lookup, or catalog import (2b4b398)

#### Manual

- [x] 2.4 A household barcode shows name, count, and stock label
- [x] 2.5 A missing barcode shows `Not in your hab unit.` and the scanner stays live with no create path
- [x] 2.6 An invalid barcode shows the validation message
- [ ] 2.7 A failed household read shows `The hab unit lookup failed. Try the scan again.`

### Phase 3: Place Lookup and keep the tally chrome fixed

#### Automated

- [x] 3.1 `npm test` passes (c90d3e9)
- [x] 3.2 Typecheck passes (c90d3e9)

#### Manual

- [x] 3.3 Restock and Lookup share one row, and Lookup opens `/inventory/lookup`
- [x] 3.4 Only the item list scrolls. The title, search row, and buttons stay visible
- [x] 3.5 Desktop and narrow screenshots are shown to the user, and the user approves the layout or the requested tweaks are applied
