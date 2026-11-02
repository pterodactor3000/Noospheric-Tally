# Count item detail decreases as usage Implementation Plan

## Overview

Saving a lower count on item details writes one weekly-use row per unit removed. The weekly rate already counts `household_quantity_changes` rows with `quantity_delta` -1. A using scan writes those rows. Item details Save does not. Linear TEC-57.

## Current State Analysis

`loadItemConsumptionCount` counts rows for one item where `quantity_delta` is -1, `reversed_at` is null, and `created_at` is inside the last 7 * 24 hours (`src/lib/items/load-item-consumption-count.ts`).

`decrement_household_quantity` inserts one such row for a using scan, with the scan session and the scanned barcode (`supabase/migrations/20261029182809_create_household_quantity_changes.sql`). `scan_session_id` and `barcode` are both `not null` on that table.

`set_household_item_levels` updates `household_inventory` when the stored quantity and category still match the values loaded with the page. It writes no change row (`supabase/migrations/20261101091000_cap_household_quantity_at_99.sql`). The item page calls that function from `saveItemLevels` (`src/app/inventory/actions.ts`). The editor already adds unsaved decreases to the rate shown before Save (`src/app/inventory/[itemId]/item-level-editor.tsx`). That preview is not stored.

`loadScanSessionLines` loads rows for one `scan_session_id` and requires `barcode` to be a string (`src/lib/items/load-scan-session-lines.ts`).

## Desired End State

Saving a count lower than the loaded count writes one unreversed `quantity_delta` -1 row per unit removed. The weekly rate includes those rows. Saving a higher count, or the same count with a different minimum or category, writes no use row. A using scan still counts. A stale save writes no inventory change and no use row. The new rows do not appear in a scan session list.

## What We're NOT Doing

- Recording tally `[-]` presses from `adjust_household_quantity`.
- Recording a raised count as a negative use, or removing uses when the count goes up.
- Undo for these rows.
- Changing the item page preview.
- A new index.

## Implementation Approach

One migration replaces `set_household_item_levels` with the same signature and the same guards. After the inventory update matches, and only when the saved count is lower than the loaded count, it inserts that many rows. Each row has `quantity_delta` -1, a null `scan_session_id`, and a null `barcode`. The migration drops `not null` on those two columns so the insert is valid. Scan writes still set both.

The TypeScript wrapper keeps the same RPC arguments. Its comment names the new side effect.

## Critical Implementation Details

**The insert runs only after a matching update.** The stale and missing-item exceptions return before the insert. A failed insert rolls the quantity update back with it.

**The removed count is `expected_quantity - new_quantity`.** The update has already required `inventory.quantity = expected_quantity`, so that difference is the number of units this save removed. Zero and negative differences insert nothing.

**Null session and null barcode keep the row out of the scan list.** `loadScanSessionLines` filters on `scan_session_id`. These rows have none, so a session load never sees a null barcode.

## Phase 1: Record saved decreases

### Overview

The database writes one use row per unit removed by item details Save.

### Changes Required

#### 1. Migration

**File:** `supabase/migrations/20261102110000_record_item_detail_uses.sql`

**Intent:** Make a saved decrease visible to the weekly rate without attaching it to a scan.

**Contract:** `set_household_item_levels(uuid, integer, integer, integer, text, text)` keeps its signature, grants, bounds, category checks, and stale error. When the update matches and `new_quantity` is less than `expected_quantity`, it inserts `expected_quantity - new_quantity` rows into `household_quantity_changes` with `quantity_delta` -1, `scan_session_id` null, and `barcode` null. Otherwise it inserts nothing. `scan_session_id` and `barcode` allow null.

#### 2. Wrapper comment

**File:** `src/lib/items/set-hab-unit-item-levels.ts`

**Intent:** State the side effect next to the only application caller of the function.

**Contract:** The RPC argument object is unchanged.

### Success Criteria

#### Automated Verification

- `pnpm test` passes.
- `pnpm lint` passes.
- `pnpm typecheck` passes.
- The wrapper test still sends the same RPC arguments.

#### Manual Verification

- Apply the migration to the linked database before the behavior is live. The Worker deploy does not run it.
- As a member, open an item at count 5, set the count to 3, and save. The weekly rate increases by 2.
- Save a higher count. The weekly rate does not change.
- Save the same count with a new minimum or a new category. The weekly rate does not change.
- A using scan still increases the rate by 1.
- The scan session list does not show the item-detail rows.

---

## Testing Strategy

### Unit Tests

The existing `setHabUnitItemLevels` tests pin the RPC arguments, the stale result, and the thrown error. This change does not alter that contract. Vitest does not execute SQL.

### Integration Tests

None. This repository has no database test harness.

### Manual Testing Steps

1. Apply `supabase/migrations/20261102110000_record_item_detail_uses.sql` with `pnpm exec supabase db push` on the linked project.
2. Open an item whose weekly rate is known. Lower the count by 2 and save. Reopen the item. The rate is 2 higher.
3. Raise the count and save. The rate is unchanged.
4. Change only the minimum, then only the category. The rate is unchanged.
5. Scan the item in using mode. The rate increases by 1, and that scan still appears in the scan session.

## Migration and Rollback

Apply the migration before relying on the new rate. The application build does not need a coordinated deploy. The previous function ignores the new rows, so an old build keeps working after the migration.

To roll back, restore `set_household_item_levels` from `supabase/migrations/20261101091000_cap_household_quantity_at_99.sql`, delete the rows this function inserted (`scan_session_id is null` and `quantity_delta = -1`), then set `scan_session_id` and `barcode` to `not null` again.

## References

- Linear: TEC-57
- GitHub: https://github.com/pterodactor3000/Noospheric-Tally/issues/62
- `supabase/migrations/20261101091000_cap_household_quantity_at_99.sql`
- `supabase/migrations/20261029182809_create_household_quantity_changes.sql`
- `src/lib/items/load-item-consumption-count.ts`
- `src/lib/items/load-scan-session-lines.ts`

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Record saved decreases

#### Automated

- [ ] 1.1 `pnpm test` passes, including the unchanged RPC argument test.
- [ ] 1.2 `pnpm lint` passes.
- [ ] 1.3 `pnpm typecheck` passes.

#### Manual

- [ ] 1.4 Apply the migration, save a decrease of 2, and see the weekly rate increase by 2.
- [ ] 1.5 Save a higher count, a minimum-only edit, and a category-only edit. The weekly rate stays the same.
- [ ] 1.6 A using scan still increases the rate by 1 and still appears in the scan session. The item-detail rows do not.
