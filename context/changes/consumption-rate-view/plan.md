# Consumption Rate View Implementation Plan

## Overview

A signed-in member can open an item and see how many units they used in the last 7 * 24 hours. The line reads `{n} per week`, or `No use recorded` when that window has no unreversed using scans. This is roadmap S-08. It covers PRD FR-015.

## Current State Analysis

The item page at `/inventory/[itemId]` loads the household row, then the barcodes, and renders `ItemLevelEditor` with the name, count, minimum, and barcodes. A missing item calls `notFound()`. Evidence: `src/app/inventory/[itemId]/page.tsx` lines 20-47.

Under the heading separator, the editor shows a Count stepper and a Minimum stepper. Evidence: `src/app/inventory/[itemId]/item-level-editor.tsx` lines 242-258. The props stop at `barcodes`. Evidence: lines 109-115.

Using scans and stocking scans write `household_quantity_changes` with `quantity_delta` of -1 or 1 and a nullable `reversed_at`. Evidence: `supabase/migrations/20261029182809_create_household_quantity_changes.sql` lines 5-20, the stocking insert at lines 87-95, and the using insert at lines 164-173. Members can select rows in their household. Evidence: lines 27-37. The only index is `(scan_session_id, created_at desc)`. Evidence: lines 22-23.

`adjust_household_quantity` updates `household_inventory.quantity` and returns. It does not insert a change-log row. Evidence: `supabase/migrations/20261030073824_adjust_household_quantity.sql` lines 33-54. The S-05 plan already records that S-08 will not see hand adjustments.

`loadScanSessionLines` is the existing tested read of this table. It takes an injected client, names the operation and the input in the thrown error, and a stub records the query. Evidence: `src/lib/items/load-scan-session-lines.ts` lines 60-84 and `src/lib/items/load-scan-session-lines.test.ts` lines 43-108. Vitest collects `src/**/*.test.ts` only. Evidence: `vitest.config.mts` lines 14-16. The scripts are `pnpm lint`, `pnpm test`, and `pnpm typecheck`. Evidence: `package.json` lines 10-12.

## Desired End State

On `/inventory/[itemId]`, under Minimum, a row labeled `Use` shows `No use recorded` or `{n} per week`. `n` is the number of change-log rows for that item with `quantity_delta` -1, `reversed_at` null, and `created_at` greater than or equal to the request time minus 7 * 24 hours. A using scan raises `n`. Undo, which sets `reversed_at`, removes that scan from `n`. A stocking scan and a hand adjustment leave `n` unchanged. Count, Minimum, and Save stay as they are.

Verify with the manual steps in Testing Strategy.

## What We're NOT Doing

- A tally column, a restock-list column, or a separate consumption page.
- A 30-day window, a calendar week, or an average since the first scan.
- Charts, sparklines, or a per-day breakdown.
- Writing hand adjustments into `household_quantity_changes`.
- Counting stocking scans (`quantity_delta` 1) or reversed using scans.
- A new table, policy, index, or migration.
- Category panels (S-11) and the shop lookup (S-09).
- Editing `context/foundation/roadmap.md`.

## Implementation Approach

Phase 1 adds a pure formatter and a count loader. The formatter turns the count into the row value. The loader asks Postgres for an exact head count through the session client, with the same injected-client test shape as `loadScanSessionLines`. Phase 2 passes that string into `ItemLevelEditor` and renders one read-only row under Minimum.

The page still loads the item first. A missing item returns `notFound()` and does not query the rate. The count query does not add a `household_id` filter. The existing select policy already limits rows to the caller's household, which is the same boundary `loadHabUnitItemById` uses.

No Next guide applies beyond the existing server page. This change adds no server action, redirect, or route.

## Critical Implementation Details

**The window is an instant, not a calendar week.** `CONSUMPTION_RATE_WINDOW_MS` is `7 * 24 * 60 * 60 * 1000`. The inclusive start is `new Date(now.getTime() - CONSUMPTION_RATE_WINDOW_MS)`. For `now` of `2026-10-30T14:00:00.000Z`, the `created_at` filter is `gte` `2026-10-23T14:00:00.000Z`. A row at that instant counts. A row one millisecond earlier does not.

**The count query does not return rows.** Select `id` with `{ count: 'exact', head: true }`, then filter:

- `eq('item_id', itemId)`
- `eq('quantity_delta', -1)`
- `is('reversed_at', null)`
- `gte('created_at', windowStart.toISOString())`

`0` is a successful count. An error, or a `count` that is not a number, throws. The message is `select count from household_quantity_changes failed for item ${itemId}`, with `cause` set when the client returned an error.

**The formatter rejects a bad count.**

```typescript
const formatConsumptionRate = (usingScanCount: number): string => {
  if (!Number.isInteger(usingScanCount) || usingScanCount < 0) {
    throw new Error(
      `formatConsumptionRate rejected count ${usingScanCount}`,
    )
  }

  if (usingScanCount === 0) {
    return 'No use recorded'
  }

  return `${usingScanCount} per week`
}
```

## Phase 1: Count unreversed using scans

### Overview

A pure function maps a count of 0 to `No use recorded` and any positive integer to `{n} per week`. A loader returns that count for one item over the last 7 * 24 hours.

### Changes Required

#### 1. Formatter

**File:** `src/lib/items/format-consumption-rate.ts`

**Intent:** Keep the empty-history copy and the `{n} per week` copy in one pure function so tests can lock them without a database.

**Contract:** `formatConsumptionRate(usingScanCount: number): string`. `0` returns `No use recorded`. A positive integer returns `${usingScanCount} per week`. Any other number throws `formatConsumptionRate rejected count ${usingScanCount}`.

#### 2. Formatter tests

**File:** `src/lib/items/format-consumption-rate.test.ts`

**Intent:** Cover the empty count, the one-scan boundary, a count above 1, and rejected inputs.

**Contract:** Assert with `toEqual` for `0`, `1`, and a count above 1. Assert the thrown message for a negative count and for a non-integer.

#### 3. Loader

**File:** `src/lib/items/load-item-consumption-count.ts`

**Intent:** Count this item's unreversed using scans inside the window without loading the rows.

**Contract:** `loadItemConsumptionCount(itemId: string, now: Date, client)` returns `Promise<number>`. `client` is `Pick<SupabaseClient, 'from'>`, the same narrowing comment as `loadScanSessionLines`. The window constant and the filter list are the ones in Critical Implementation Details. A `now` whose `getTime()` is `NaN` throws `loadItemConsumptionCount rejected a time for item ${itemId}` before the query. Export `CONSUMPTION_RATE_WINDOW_MS`.

#### 4. Loader tests

**File:** `src/lib/items/load-item-consumption-count.test.ts`

**Intent:** Prove the count, the failure paths, and the exact filters, including the window start for a fixed `now`.

**Contract:** Follow the recorded-query stub in `load-scan-session-lines.test.ts`, extended for `select` options, `is`, and `gte`. Use `now` of `2026-10-30T14:00:00.000Z` and expect `gte` `2026-10-23T14:00:00.000Z`.

### Success Criteria

#### Automated Verification

- `pnpm test -- src/lib/items/format-consumption-rate.test.ts src/lib/items/load-item-consumption-count.test.ts` passes.
- The format tests cover `0`, `1`, a count above 1, a negative count, and a non-integer.
- The loader tests cover a returned `0`, a returned positive count, the recorded table, columns, count options, and filters for the fixed `now`, a query error, a null count, and a `now` that is `NaN`.

#### Manual Verification

- No screen change. The recorded query in the loader test is the check that stocking rows, reversed rows, other items, and scans before the window are outside the count.

---

## Phase 2: Show the rate on the item page

### Overview

The item page shows a `Use` row under Minimum. The value is the formatted count. Count and Minimum stay editable.

### Changes Required

#### 1. Item page

**File:** `src/app/inventory/[itemId]/page.tsx`

**Intent:** Load the rate only after the item exists, and pass the formatted string into the editor.

**Contract:** After `loadHabUnitItemById` returns a line, create the server client, call `loadItemConsumptionCount(item.itemId, new Date(), supabase)`, then `formatConsumptionRate`. Pass the string as `consumptionRate`. A null item still calls `notFound()` and does not query the rate. A loader error still throws.

#### 2. Item editor

**File:** `src/app/inventory/[itemId]/item-level-editor.tsx`

**Intent:** Show the rate in the same row shape as Count and Minimum, without steppers.

**Contract:** `ItemLevelEditorProps` gains `readonly consumptionRate: string`. After the Minimum `LevelStepper`, and still inside `itemRows`, render one row: label `Use`, the existing dot leader with `aria-hidden`, and `consumptionRate` as the value. No `[-]` or `[+]`. The separator stays under the heading. Count, Minimum, and Save are unchanged.

### Success Criteria

#### Automated Verification

- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm test` passes.

#### Manual Verification

- Open an item with no unreversed using scan in the last 7 * 24 hours. Under Minimum, the row reads `Use` and `No use recorded`.
- Record one using scan for that item and reopen the page. The value reads `1 per week`.
- Undo that scan and reopen the page. The value reads `No use recorded`.
- Stock one unit, and adjust the count by hand. Reopen the page. The Use value is unchanged by either action.
- Change Count and Minimum and press Save. Both values still save, and Cancel still returns to `/inventory`.

---

## Testing Strategy

### Unit Tests

- `formatConsumptionRate` returns `No use recorded` for `0`, `1 per week` for `1`, and `{n} per week` for a count above 1.
- It throws the named error for a negative count and for a non-integer.
- `loadItemConsumptionCount` returns `0` and a positive count.
- It throws the named error when the client returns an error, when `count` is null, and when `now` is `NaN`.
- The recorded query uses `household_quantity_changes`, selects `id` with `{ count: 'exact', head: true }`, and filters `item_id`, `quantity_delta` -1, `reversed_at` null, and `created_at` `gte` the fixed window start.

### Integration Tests

- None. Vitest does not run a database, and `vitest.config.mts` includes `src/**/*.test.ts` only. The page has no component test.

### Manual Testing Steps

1. Sign in and open an item that has no unreversed using scan in the last 7 * 24 hours. Confirm the Use row reads `No use recorded`.
2. Scan that item in using mode once. Reopen the item. Confirm the Use row reads `1 per week`.
3. Undo that scan from the session list. Reopen the item. Confirm the Use row reads `No use recorded`.
4. Scan the item in stocking mode once, then change the count with the tally `[-]` or `[+]`. Reopen the item. Confirm the Use value did not rise.
5. On the item page, change Count and Minimum, press Save, and confirm both persisted. Press Cancel and confirm the inventory list opens.

## Migration and Rollback

No migration. Removing the Use row and the two modules reverses the change. Existing change-log rows stay as they are.

## References

- Roadmap: `context/foundation/roadmap.md` (S-08)
- PRD: `context/foundation/prd.md` (FR-015)
- Item page: `src/app/inventory/[itemId]/page.tsx` lines 20-47
- Item editor: `src/app/inventory/[itemId]/item-level-editor.tsx` lines 109-115 and 242-258
- Change log: `supabase/migrations/20261029182809_create_household_quantity_changes.sql` lines 5-37, 87-95, and 164-173
- Hand adjustment: `supabase/migrations/20261030073824_adjust_household_quantity.sql` lines 33-54
- Query test pattern: `src/lib/items/load-scan-session-lines.test.ts` lines 43-108

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Count unreversed using scans

#### Automated

- [x] 1.1 `pnpm test -- src/lib/items/format-consumption-rate.test.ts src/lib/items/load-item-consumption-count.test.ts` passes, covering `0`, `1`, a count above 1, a negative count, a non-integer, a returned `0`, a returned positive count, the recorded filters for `now` `2026-10-30T14:00:00.000Z`, a query error, a null count, and a `NaN` time

#### Manual

- [x] 1.2 No screen change. The recorded query excludes stocking rows, reversed rows, other items, and scans before the window

### Phase 2: Show the rate on the item page

#### Automated

- [ ] 2.1 `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass

#### Manual

- [ ] 2.2 An item with no unreversed using scan in the window shows `Use` and `No use recorded` under Minimum
- [ ] 2.3 One using scan changes the value to `1 per week` after reload
- [ ] 2.4 Undo of that scan returns the value to `No use recorded` after reload
- [ ] 2.5 A stocking scan and a hand adjustment leave the Use value unchanged
- [ ] 2.6 Count and Minimum still save, and Cancel still opens `/inventory`
