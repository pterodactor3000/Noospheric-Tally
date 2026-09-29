<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Scan to Create Item Implementation Plan

- **Plan:** `context/changes/scan-to-create-item/plan.md`
- **Mode:** Deep
- **Date:** 2026-09-13
- **Grounding:** 14/14 cited live paths verified, 6/6 existing symbols verified, ZXing and Open Food Facts docs checked, brief and plan consistent
- **Verdict:** SOUND

## Dimension Verdicts

| Dimension | Verdict |
| --- | --- |
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | PASS |
| Plan Completeness | PASS |

## Findings

### F1: Household barcode loader cannot join as written

- **Severity:** WARNING
- **Impact:** HIGH
- **Dimension:** Architectural Fitness
- **Location:** Phase 2 loaders. `attachBarcode` / `addItemToHousehold` `itemId`.
- **Detail:** The loader is specified as `{ id, name }` from `household_inventory` joined through a barcode. `household_inventory` has no foreign key to `item_barcodes`. `items` and `item_barcodes` have no select policy. PostgREST embeds apply RLS to the embedded table, so that join returns no barcode rows. `household_inventory.id` is the stock row. `attach_barcode` and `add_item_to_household` take `items.id`. A literal join makes every household lookup a miss. `createItem` then treats an already-stocked code as a global add and the RPC raises. Criterion 2.5 fails. Passing `household_inventory.id` into attach fails 2.4.
- **Fix:** Implement `loadHouseholdItemByBarcode` as `find_item_by_barcode`, then a `household_inventory` select by `item_id`. Return `{ itemId, name }` from both household loaders. Never return `household_inventory.id` as `id`.
- **Decision:** FIXED (two-step lookup via `find_item_by_barcode` then `household_inventory` by `item_id`; loaders return `itemId`)

### F2: `loadHouseholdItems` cap can hide stock

- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Completeness
- **Location:** Phase 2 loaders vs inventory entry contract
- **Detail:** `loadHouseholdItems()` is specified as max 20 for the attach offer list. The inventory page must list this household's names with no cap. One function with a hard max 20 hides products after the twentieth row. Later slices that read the full list inherit that cap.
- **Fix:** Keep the cap on the attach offer only. Give the inventory list an uncapped loader, or pass an optional limit.
- **Decision:** FIXED (one loader with optional `{ limit }`. Inventory uncapped. Attach offer `{ limit: 20 }`)

### F3: Scan detect has no server handoff

- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Completeness
- **Location:** Phase 3 scan route
- **Detail:** `onDetect` runs in the client scanner. `loadHouseholdItemByBarcode` uses the server Supabase client. Phase 3 says the scan page shows the household name on a hit, else navigates to `/inventory/new?barcode=`. No server action or search-param reload is named. A client import of that loader will not run.
- **Fix:** On detect or typed submit, always navigate to `/inventory/new?barcode=`. Phase 2 already branches exists, global-known, and miss.
- **Decision:** FIXED (option B: navigate to `/inventory/scan?barcode=`. Server page branches exists vs `/inventory/new`)

### F4: Catalog name can exceed the 120-character save rule

- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Blind Spots
- **Location:** Phase 4 prefill vs name validator
- **Detail:** Household name and `items.name` must be trimmed length 1 to 120. Open Food Facts `product_name` has no such limit. A long prefill fails validation on save. That looks like the catalog blocked create, which Phase 4 says must not happen.
- **Fix:** Truncate the trimmed catalog name to 120 before using it as the default. Leave the field editable.
- **Decision:** FIXED (lookup trims and truncates to 120 before `found`)

### F5: `UPC_E` can fail the 8-to-14 digit validator

- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Plan Completeness
- **Location:** Phase 3 formats vs Phase 1 barcode validator
- **Detail:** The scanner allows `UPC_E`. The validator accepts digits only, length 8 to 14. ZXing may return a 6-digit UPC-E. That decode then fails validation. EU grocery and pet-food codes are usually EAN-13, so this is uncommon for the named use.
- **Fix:** Drop `UPC_E`, or expand UPC-E to UPC-A before validate.
- **Decision:** FIXED (expand UPC-E to UPC-A in the validator and before `onDetect` / lookup)

### F6: `create_item` after a global miss can lose the race

- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Blind Spots
- **Location:** Phase 2 `createItem` vs Phase 1 `create_item`
- **Detail:** Two callers can both miss `find_item_by_barcode`, then both call `create_item`. One insert wins. The loser gets a generic mapped error instead of `add_item_to_household`. Sequential criteria 1.6 and 2.6 do not cover this. First-version traffic is one household, so the chance is low.
- **Fix:** On a `create_item` unique-barcode failure, look up again and add to household, or return a mapped exists/add path. Do not depend on RPC error text for the household-already-stocks case. That case stays on the pre-insert lookup.
- **Decision:** FIXED (on `create_item` failure, re-lookup. Add or return exists. No RPC error-text parse)

### F7: Phase 2 lists `src/app/page.tsx` with no contract

- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Lean Execution
- **Location:** Phase 2 inventory entry
- **Detail:** Signed-in users on `/` already redirect to `/inventory` at `src/app/page.tsx:9-12`. Phase 4 already owns the signed-out milestone copy.
- **Fix:** Remove `src/app/page.tsx` from the Phase 2 file list.
- **Decision:** FIXED (removed from Phase 2. Landing copy stays on Phase 4 with `src/app/page.tsx`)
