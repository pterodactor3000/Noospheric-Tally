# Restock List by Shortfall Implementation Plan

## Overview

A member opens one list of every item at or below its minimum, ordered by how far each falls short, and uses it while shopping. This is roadmap S-07 and covers PRD FR-010 (every item at or below its minimum in one list) and FR-014 (items needing restocking ordered by how far each falls below its minimum). The PRD Business Logic rule fixes the ranking: urgency comes from the shortfall alone, and category does not change it.

The same change also reworks the heading of `/inventory/{itemId}` so it lists every barcode of the item and shows a redacted line when there is none. That heading work is Phase 3 and is independent of the restock list.

No table, migration, or write is added. The restock list reads the same rows as the tally.

## Current State Analysis

- `/inventory` loads every household row once with `loadHabUnitTallyLines` (`src/lib/items/load-hab-unit-items.ts:69-94`). A line is `HabUnitTallyLine` with `itemId`, `name`, `quantity`, `minimumQuantity` (`src/lib/items/load-hab-unit-items.ts:5-10`). The page calls `requireCurrentUser` and `requireCurrentHabUnit` first (`src/app/inventory/page.tsx:34-36`).
- The inventory page puts Add item and Scan item in a two-column grid (`src/app/inventory/page.tsx:19-27`, buttons at `:51-66`). Both use `variant="outline"`, `nativeButton={false}`, `render={<Link />}`, and `inventoryActionButton` (`src/app/inventory/page.tsx:29`). There is no Restock control.
- `getStockState` returns `critical` when `quantity <= minimumQuantity` (`src/lib/items/stock-state.ts:13-26`, predicate at `:17`). `STOCK_STATE_TEXT_CLASS_NAMES.critical` is `text-stock-critical` (`src/app/styles/stock-state-class-names.ts:9-13`). The restock inclusion rule and CRITICAL are the same predicate.
- `sortTallyLines` pins a count of 0 below every other count (`src/lib/items/sort-tally-lines.ts:42-46`). A count of 0 can hold the largest shortfall, so that function cannot rank the restock list.
- The tally row is `[name link] [dots]` then count and `[-] [+]`, in the stock text color, with `aria-hidden` dots of 300 `.` characters (`src/app/inventory/inventory-tally.tsx:29`, `:42-47`, `:128-147`). The tally list is 14px and 16px from `sm` (`src/app/inventory/inventory-tally.tsx:31`).
- `BackToInventoryLink` renders for any path that starts with `/inventory/` (`src/components/back-to-inventory-link.tsx:9-17`) and is mounted in the root layout (`src/app/layout.tsx:47`). `/inventory/restock` is covered. `isProtectedPath` already protects every `/inventory/...` path (`src/lib/auth/isProtectedPath.ts:1-7`). `/inventory/new` and `/inventory/scan` already sit beside `/inventory/[itemId]`, so a static `restock` segment resolves before the dynamic one.
- The item heading is `flex-col` below `sm` and `flex-row` from `sm` (`src/app/inventory/[itemId]/item-level-editor.tsx:25-32`). The title dots are `hidden sm:block` (`:40`). The heading renders `[LABEL] {name}`, then dots and ` ++  ${barcode} ++` only when `barcode !== null` (`:144-166`, template string at `:162`). The heading inherits the 14px and 16px from `sm` of `itemRows` (`:23`).
- `loadItemBarcode` returns at most one barcode, with `.limit(1)` and `.maybeSingle()` (`src/lib/items/load-item-barcode.ts:7-34`, `:15-16`). Its only caller is `src/app/inventory/[itemId]/page.tsx:6` and `:35`. `ItemLevelEditor` takes `barcode: string | null` (`src/app/inventory/[itemId]/item-level-editor.tsx:72`) and the page passes it at `src/app/inventory/[itemId]/page.tsx:45`.
- `item_barcodes` has `(item_id, barcode)` as primary key, a unique `barcode`, and a `created_at` column (`supabase/migrations/20260916120209_create_items.sql:13-22`). The member select policy already exists (`supabase/migrations/20261030084022_item_barcodes_select_if_member.sql:1-11`), so reading every barcode needs no migration.
- `Separator` renders a horizontal rule by default (`src/components/ui/separator.tsx:7-28`).
- Vitest runs `src/**/*.test.ts` in a node environment (`vitest.config.mts:15-16`). There is no component or route test harness, so new behavior is tested through pure functions.

## Desired End State

On `/inventory`, a full-width `Restock` button sits under Add item and Scan item. It opens `/inventory/restock`.

`/inventory/restock` shows the heading `Restock` and one row per item with `quantity <= minimumQuantity`. The largest shortfall is first, where shortfall is `minimumQuantity - quantity`. Equal shortfalls sort by name A to Z. An item at 0 with a large minimum ranks above an item at 2 with a small minimum. An item with `quantity > minimumQuantity` is not listed. From `sm` up each row is one line: `{name} {dots} {count} // [{n} short]`, for example `4 // [2 short]`. Below `sm` the row is two lines: `{name} {dots}`, then `{dots} {count} // [{n} short]`. The name links to `/inventory/{itemId}`. The row text is the critical color and has no `[-]`, `[+]`, or `[CRITICAL]` chip. With nothing to restock the page shows `Nothing needs restocking.`

On `/inventory/{itemId}`, line 1 is `[STATUS] {name} {dots}`. From the `sm` breakpoint up, line 2 is visible: `{dots} ++  {barcode, barcode} ++` with every barcode oldest first. Below `sm`, line 2 is hidden until the member clicks the item name. The line then opens with the grid-row and slide animation. There is no `Barcodes` control. With no barcode, line 2 reads ` ++  [REDACTED] ++`, and hover, focus, or a tap shows `// NO BARCODE SUPPLIED //`. The heading is 16px, and 18px from `sm`. A separator sits between the heading and Count. Count and Minimum are unchanged.

Verify with the automated checks and manual steps of each phase.

## What We're NOT Doing

- WARNING rows on the restock list. Only `quantity <= minimumQuantity` is listed.
- Category panels (S-11) or any category grouping. Category does not change rank.
- The consumption rate view (S-08).
- Editing a count from the restock list. The page has no `[-]` or `[+]`.
- Changing tally sort, search, or tally row layout. `sortTallyLines` and `InventoryTally` stay untouched.
- A new migration, table, RPC, server action, or write.
- A second back link on the restock page. `BackToInventoryLink` already renders there.
- A visible `[CRITICAL]` chip on a restock row.
- A browser or route test harness. Vitest stays on `src/**/*.test.ts`.
- Changing Count or Minimum size, the stepper behavior, Save, or Cancel on the item page.
- Changing the status label styling on the item heading.

## Implementation Approach

Split pure logic from rendering, as S-05 and S-06 did.

1. Phase 1 adds one pure ranking function and its tests. It has no page.
2. Phase 2 adds the `/inventory/restock` server page, one list component, and the Restock button. The page loads with the existing helpers and ranks with the Phase 1 function.
3. Phase 3 reworks the item heading. A pure function owns the resting and revealed barcode strings. A small client component owns the redacted reveal state. A loader returns every barcode.

Phases 1 and 2 ship the roadmap outcome. Phase 3 is the item-page follow-on and does not depend on them, but it comes last, as approved.

## Critical Implementation Details

**Do not reuse `sortTallyLines`.** It returns a count of 0 last (`src/lib/items/sort-tally-lines.ts:42-46`). The restock ranking sorts by shortfall only, so a count of 0 with the largest shortfall ranks first.

**One inclusion predicate.** `rankRestockLines` includes a line when `getStockState(quantity, minimumQuantity) === 'critical'`. That is exactly `quantity <= minimumQuantity` (`src/lib/items/stock-state.ts:17`), so the list and the CRITICAL label cannot drift apart. A line with minimum 0 and quantity 0 is included with shortfall 0.

**Ranking order.** Sort by `shortfall` descending, then by `name.localeCompare` ascending. The function copies its input and never mutates it.

**Redacted reveal state.** The no-barcode control tracks two flags: `isPinned` (toggled by a click) and `isPreviewed` (set by mouse enter or focus, cleared by mouse leave or blur). The value shows the revealed text when `isPinned || isPreviewed`.

- `onClick` sets `isPinned` to its opposite. When that makes `isPinned` false, it also sets `isPreviewed` to false. Without that reset, a second tap on a touch screen would stay revealed, because touch fires no mouse leave and the control keeps focus.
- `onMouseLeave` and `onBlur` clear `isPreviewed` only. They never clear `isPinned`.
- The control is `<button type="button">`. It sits inside the item `<form>`, so a missing `type` would submit the form.
- `aria-label` is `NO_BARCODE_SUPPLIED_TEXT`. The visible text differs from the accessible name by design.

**Loader replacement.** `load-item-barcode.ts` is deleted and replaced by `load-item-barcodes.ts`, because the file name must match the primary export. Orders by `created_at` ascending, then `barcode` ascending, so two barcodes inserted in one transaction have a stable order.

---

## Phase 1: Rank the restock lines

### Overview

A pure function turns the tally lines into the restock list: filtered, with a shortfall, and ordered. This phase adds no page and no UI.

### Changes Required

#### 1. Restock ranking function

**File:** `src/lib/items/rank-restock-lines.ts` (new)

**Intent:** Select the lines that need restocking and order them by shortfall, so Phase 2 only renders the result. The file name matches the primary export, as `sort-tally-lines.ts` matches `sortTallyLines`.

**Contract:**

```typescript
interface RestockLine extends HabUnitTallyLine {
  readonly shortfall: number
}

const rankRestockLines = (
  lines: readonly HabUnitTallyLine[],
): RestockLine[]
```

- `HabUnitTallyLine` is imported with `import type` from `./load-hab-unit-items`. The file imports no `next/*`, `react`, or Supabase module.
- Includes a line when `getStockState(line.quantity, line.minimumQuantity) === 'critical'`, imported from `./stock-state`.
- `shortfall` is `minimumQuantity - quantity`, so it is `0` or greater for every included line.
- Orders by `shortfall` descending, then by `name.localeCompare` ascending.
- Returns a new array of new objects. The input array and its lines are not changed.
- Returns `[]` for an empty input and for an input with no included line.
- Exports `rankRestockLines` and the type `RestockLine`.

#### 2. Ranking tests

**File:** `src/lib/items/rank-restock-lines.test.ts` (new)

**Intent:** Pin every ranking rule, including the count-of-0 rule that rules out `sortTallyLines`.

**Contract:** Vitest tests in the style of `src/lib/items/sort-tally-lines.test.ts`, with specific `toEqual` assertions and a local line builder. Test names state behavior:

- returns an empty array when there are no lines
- returns an empty array when every line is above its minimum
- includes a line at its minimum with a shortfall of 0
- leaves out a WARNING line and an IN STOCK line
- includes a line with minimum 0 and quantity 0 with a shortfall of 0
- ranks a count of 0 with the largest shortfall first
- ranks a larger shortfall above a smaller one regardless of count
- sorts equal shortfalls by name A to Z
- computes shortfall as minimum minus quantity
- does not change the input array

### Success Criteria

#### Automated Verification

- `pnpm test` passes `src/lib/items/rank-restock-lines.test.ts`: an empty input returns `[]`, a line above its minimum is left out, a line at its minimum is included with shortfall 0, a count of 0 with the largest shortfall ranks first, equal shortfalls sort by name A to Z, and the input array is unchanged.
- `pnpm lint` and `pnpm typecheck` exit 0.

#### Manual Verification

- `rg "sortTallyLines|from 'next|from 'react|supabase" src/lib/items/rank-restock-lines.ts` prints nothing, so the function is pure and does not reuse the tally sort.
- The inclusion predicate, the shortfall formula, the sort order, and the unchanged input each have a named test in `src/lib/items/rank-restock-lines.test.ts`.

---

## Phase 2: Show the restock page

### Overview

Add `/inventory/restock` with one line from `sm` up and two lines below `sm`, and the full-width Restock control on `/inventory`. This phase adds the new route, so it also runs `pnpm worker:check`.

### Changes Required

#### 1. Restock page

**File:** `src/app/inventory/restock/page.tsx` (new)

**Intent:** A server page that shows the ranked list. It follows `src/app/inventory/page.tsx` for auth, loading, and layout.

**Contract:**

- `const RestockPage = async () => { ... }` as the default export.
- Calls `await requireCurrentUser()` and `await requireCurrentHabUnit()` from `@/lib/helpers`, then `loadHabUnitTallyLines()`, then `rankRestockLines(lines)`. It adds no new loader, action, or write.
- Renders `<main className={centeredPage}>` and a `<section>` with the same width classes as `inventorySection` (`src/app/inventory/page.tsx:12-17`). The class constants are local to the route and are not exported from `src/app/inventory/page.tsx`.
- Renders `<h1>` with the exact text `Restock`, styled like `inventoryTitle` (`src/app/inventory/page.tsx:31`).
- Renders `<RestockList lines={restockLines} />`.
- Adds no back link. `BackToInventoryLink` covers this path (`src/components/back-to-inventory-link.tsx:9-17`).

#### 2. Restock list

**File:** `src/app/inventory/restock/restock-list.tsx` (new)

**Intent:** Render the empty copy or the rows. It is a server component with no state and no handlers, so no `'use client'`.

**Contract:**

- `interface RestockListProps { readonly lines: readonly RestockLine[] }` and `const RestockList = ({ lines }: RestockListProps)`, exported as a named export.
- When `lines.length === 0`, renders `<p>Nothing needs restocking.</p>` and no list.
- Otherwise renders `<ul>` sized like the tally list: 14px and 16px from `sm` (`src/app/inventory/inventory-tally.tsx:31`), with `mt-[1rem]`.
- Each `<li key={line.itemId}>` carries `px-2` and `STOCK_STATE_TEXT_CLASS_NAMES.critical`, so the row text is the critical color. It renders no visible `[CRITICAL]` text and no `sr-only` state text.
- Line 1 is a flex row with `items-baseline` and `gap-2`: a `Link` to `/inventory/${line.itemId}` containing `{line.name}`, then `<span aria-hidden="true">` with 300 `.` characters and the `min-w-0 flex-1 overflow-hidden whitespace-nowrap` classes. The link follows `tallyName` (`src/app/inventory/inventory-tally.tsx:35-41`): `min-h-[36px] min-w-0 truncate leading-[36px] text-inherit`.
- The end of the row is `{line.quantity} // [{line.shortfall} short]`. Example text: `4 // [2 short]`, `0 // [3 short]`, `3 // [0 short]`. From `sm` up that end sits on line 1 after the dots, and the second row is `sm:hidden`. Below `sm` the end is hidden on line 1 (`max-sm:hidden`) and line 2 is a flex row with dots first, then the same end text.
- No `[-]` or `[+]`, no button, and no form control appears on this page.
- Dots are decorative and `aria-hidden`, as in the tally.

#### 3. Restock control

**File:** `src/app/inventory/page.tsx`

**Intent:** Link the new page from the inventory page without changing the Add item and Scan item pair.

**Contract:**

- Add a third `Button` after Scan item, before the closing `</div>` of the grid (`src/app/inventory/page.tsx:67`). Same pattern as the other two: `variant="outline"`, `nativeButton={false}`, `render={<Link href="/inventory/restock" />}`. Label `Restock`.
- Its class is `clsx(inventoryActionButton, 'col-span-2')`, so it spans both columns of the `grid-cols-2` grid (`:19-27`).
- The grid, the other two buttons, and `InventoryTally` do not change.

### Success Criteria

#### Automated Verification

- `pnpm test` passes, including `src/lib/items/rank-restock-lines.test.ts` from Phase 1.
- `pnpm lint` and `pnpm typecheck` exit 0, and `pnpm typecheck` generates the `/inventory/restock` route type.
- `pnpm worker:check` exits 0 with the new route.

#### Manual Verification

- On `/inventory`, a full-width `Restock` button sits under Add item and Scan item, spans the width of the pair, and opens `/inventory/restock`.
- With items at (count, minimum) of (0, 5), (2, 5), (4, 6), (3, 3), (4, 3), and (9, 3), `/inventory/restock` lists (0, 5) first with shortfall 5, then (2, 5) with shortfall 3, then (4, 6) with shortfall 2, then (3, 3) with `3 // [0 short]`. The (4, 3) WARNING row and the (9, 3) IN STOCK row are absent.
- Below `sm` each row is two lines: `>` then name then dots, then dots then `{count} // [{n} short]`. From `sm` up each row is one line ending in `{count} // [{n} short]`. The name is a link to `/inventory/{itemId}`. The row text is the critical color and shows no `[-]`, `[+]`, or `[CRITICAL]` text. The `>` is `aria-hidden`.
- Raising a count on `/inventory` past its minimum removes that row from `/inventory/restock` after navigating there.
- With every item above its minimum, or with no items, the page shows `Nothing needs restocking.`
- The heading reads `Restock`, and exactly one `Back to inventory` link shows and returns to `/inventory`.
- Signed out, `/inventory/restock` redirects to `/login`.

---

## Phase 3: Split the item heading and list every barcode

### Overview

The item heading lists every barcode of the item, and shows a redacted line that reveals `// NO BARCODE SUPPLIED //` when there is none. From `sm` up both lines show. Below `sm` the barcode line is hidden until the heading is expanded. The heading is 16px, and 18px from `sm`, with a separator under it. This phase adds no route, so it does not run `pnpm worker:check`.

### Changes Required

#### 1. Barcode line text function

**File:** `src/lib/items/get-barcode-line-text.ts` (new)

**Intent:** One pure place for the resting string, the multi-barcode string, and the hover string, so tests cover them without rendering.

**Contract:**

```typescript
const NO_BARCODE_SUPPLIED_TEXT = '// NO BARCODE SUPPLIED //'

const getBarcodeLineText = (
  barcodes: readonly string[],
  isRevealed: boolean,
): string
```

- `barcodes.length > 0`: returns `` ` ++  ${barcodes.join(', ')} ++` ``, ignoring `isRevealed`. The decoration is the current template string at `src/app/inventory/[itemId]/item-level-editor.tsx:162` and keeps its leading space and double space.
- `barcodes.length === 0` and `isRevealed === false`: returns ` ++  [REDACTED] ++`.
- `barcodes.length === 0` and `isRevealed === true`: returns `// NO BARCODE SUPPLIED //` with no `++` decoration.
- Exports `getBarcodeLineText` and `NO_BARCODE_SUPPLIED_TEXT`.
- Pure. No React or Supabase import.

**File:** `src/lib/items/get-barcode-line-text.test.ts` (new)

**Contract:** Vitest tests with exact `toEqual` strings:

- returns the redacted text when there are no barcodes and the line is not revealed
- returns the no barcode supplied phrase when there are no barcodes and the line is revealed
- returns one barcode inside the decoration
- returns several barcodes joined with a comma and a space
- keeps the barcodes when the line is marked revealed
- keeps the leading space and the double space before the value

#### 2. Every-barcode loader

**File:** `src/lib/items/load-item-barcodes.ts` (new). Delete `src/lib/items/load-item-barcode.ts`.

**Intent:** Return every barcode of an item, oldest first, in place of the single `.limit(1)` read (`src/lib/items/load-item-barcode.ts:7-34`).

**Contract:**

- `const loadItemBarcodes = async (itemId: string): Promise<string[]>`. Selects `barcode` from `DB_TABLE_ITEM_BARCODES` where `item_id` equals `itemId`, ordered by `created_at` ascending then `barcode` ascending. No `.limit` and no `.maybeSingle`.
- `const readItemBarcodes = (rows: unknown): string[] | null` returns the barcodes when `rows` is an array and every element is an object with a string `barcode`, and `null` for anything else. An empty array returns `[]`.
- On a Supabase `error`, throws `item_barcodes select failed for item ${itemId}` with `{ cause: error }`, as the current loader does (`:18-22`). When `readItemBarcodes` returns `null`, throws the same message without a cause.
- Exports `loadItemBarcodes` and `readItemBarcodes`. The external `data` stays `unknown` until `readItemBarcodes` narrows it.

**File:** `src/lib/items/load-item-barcodes.test.ts` (new)

**Contract:** Tests of `readItemBarcodes` in the style of `src/lib/items/load-hab-unit-items.test.ts`:

- returns every barcode in row order
- returns an empty array for an empty row list
- returns null when a row has no barcode
- returns null when a barcode is not a string
- returns null when the rows are not an array

#### 3. Item page caller

**File:** `src/app/inventory/[itemId]/page.tsx`

**Intent:** Load every barcode and pass the list on.

**Contract:**

- Replace the import at `:6` with `loadItemBarcodes` from `@/lib/items/load-item-barcodes`.
- Replace `const barcode = await loadItemBarcode(item.itemId)` (`:35`) with `const barcodes = await loadItemBarcodes(item.itemId)`.
- Pass `barcodes={barcodes}` in place of `barcode={barcode}` (`:45`).
- This is the only caller of the old loader. After the change, `rg loadItemBarcode\b src` finds no match.

#### 4. Redacted barcode line

**File:** `src/app/inventory/[itemId]/barcode-line.tsx` (new, `'use client'`)

**Intent:** Render the value on line 2 and own the redacted reveal behavior.

**Contract:**

- `interface BarcodeLineProps { readonly barcodes: readonly string[] }` and `const BarcodeLine = ({ barcodes }: BarcodeLineProps)`, exported as a named export.
- When `barcodes.length > 0`, renders a plain `<span>` with `getBarcodeLineText(barcodes, false)`. It has no button and no state.
- When `barcodes.length === 0`, renders `<button type="button" aria-label={NO_BARCODE_SUPPLIED_TEXT}>` whose text is `getBarcodeLineText([], isRevealed)`, where `isRevealed` is `isPinned || isPreviewed`. The state rules are under Critical Implementation Details: `onMouseEnter` and `onFocus` set `isPreviewed`, `onMouseLeave` and `onBlur` clear it, and `onClick` toggles `isPinned` and clears `isPreviewed` when it turns `isPinned` off.
- The button reuses the `itemControl` look (`min-h-11 min-w-11`, no border or background, inherited font and color, `src/app/inventory/[itemId]/item-level-editor.tsx:42-55`), so it is a 44px tap target and reads as text. Move or export that class constant instead of copying it.
- From `sm` up, the barcode value may wrap when several barcodes do not fit on one line. Below `sm` the line is hidden until expanded, so a long list does not overflow a narrow heading.

#### 5. Heading layout, size, and separator

**File:** `src/app/inventory/[itemId]/item-level-editor.tsx`

**Intent:** A larger heading, a separator, and the full barcode list. Below `sm` the barcode line starts hidden until the item name is clicked, then it animates open. From `sm` up both lines show.

**Contract:**

- `ItemLevelEditorProps.barcode: string | null` (`:72`) becomes `readonly barcodes: readonly string[]`, and the destructured prop at `:126` changes with it.
- Remove the side-by-side collapse. `itemTitle` keeps `flex-col` so the two heading rows stack. It loses `sm:flex-row`, `sm:items-baseline`, and `sm:gap-2`. `itemTitleDots` (`:40`) loses `hidden sm:block`. The `w-full sm:w-auto` on the label (`:145`) and the `leading-11 sm:leading-[inherit]` on the value (`:161`) go away.
- The `<h1>` (`:144`) is `m-0 text-base sm:text-lg`, so the whole heading is 16px, and 18px from `sm`. The `itemRows` wrapper (`:23`, `:143`) stays `text-[14px] sm:text-[16px]`, so Count and Minimum keep 14px and 16px from `sm`.
- The `<h1>` holds two flex rows, each a `<span>` with `items-baseline` and `gap-2` (`itemLine`, `:24`).
  - Line 1: the label span (`itemLabel`, `:33`) with the status and the name, then the dots span.
  - Line 2: a dots span, then `<BarcodeLine barcodes={barcodes} />`.
- The status span is unchanged: bold, bracketed `[{STOCK_STATE_LABELS[stockState]}]`, and `STOCK_STATE_TEXT_CLASS_NAMES[stockState]`. Below `sm`, the name is a `<button type="button">` with the heading text styles, `aria-controls` pointing at line 2, and `aria-expanded` set from the narrow open state. Activating it shows line 2 and sets `aria-expanded` to true. Activating it again hides line 2. The button does not submit the form. From `sm` up, the name is plain text, so it is not in the tab order, and line 2 stays shown.
- Line 2 is in the document, including when `barcodes` is empty. The dots are `aria-hidden`. Below `sm` it starts closed. Opening it uses the same grid-row height animation and slide as the attach panel (`transition-[grid-template-rows]` and `translate-y`, 500ms, `motion-reduce:transition-none`). From `sm` up, line 2 is shown whether or not the narrow control was used. The open state starts closed on each visit and is not stored.
- Add `<Separator />` from `@/components/ui/separator` between the `</h1>` (`:166`) and the Count `LevelStepper` (`:167`), inside the `itemRows` div. It is horizontal, full width, 2px thick to match `border-2`, with a 16px vertical margin (`my-4`) and a slight primary glow (`shadow-[0_0_8px] shadow-primary/40`).
- Count and Minimum steppers, the hidden inputs, the form action, Save, and Cancel do not change.

### Success Criteria

#### Automated Verification

- `pnpm test` passes `src/lib/items/get-barcode-line-text.test.ts`: no barcode returns ` ++  [REDACTED] ++`, no barcode with `isRevealed` true returns `// NO BARCODE SUPPLIED //`, one barcode returns ` ++  {barcode} ++`, and several barcodes join with `, `.
- `pnpm test` passes `src/lib/items/load-item-barcodes.test.ts`: rows keep their order, an empty list returns `[]`, and a row without a string `barcode` or a non-array input returns `null`.
- `pnpm lint` and `pnpm typecheck` exit 0.
- `rg "loadItemBarcode\b|load-item-barcode'" src` prints nothing, and `src/lib/items/load-item-barcode.ts` no longer exists.

#### Manual Verification

- At 1024px the heading is two lines. Line 1 is `[STATUS] {name}` then dots. Line 2 is dots then ` ++  … ++`, and it is visible. The name is plain text. At 360px line 1 is visible, line 2 is hidden, and the item name is a button with `aria-expanded` false. There is no `Barcodes` control.
- The status stays bold, bracketed, and in the stock color, and changes with Count and Minimum as before. Below 460px the visible label is `[C]`, `[W]`, or `[I]`. From 460px up it is the full word.
- The heading text is 16px at 360px and 18px at 1024px. Count and Minimum are still 14px and 16px from `sm`.
- A horizontal rule sits under the heading and above Count. It is 2px thick, the same as the panel border, with a slight primary glow.
- An item with one barcode shows ` ++  {barcode} ++`. An item with two barcodes, attached through the existing flow, shows both oldest first, joined with `, `.
- An item with no barcode shows ` ++  [REDACTED] ++`. Hovering it with a mouse replaces the whole value with `// NO BARCODE SUPPLIED //`. Moving the mouse away restores the resting text.
- Tabbing to the redacted value shows `// NO BARCODE SUPPLIED //`, and tabbing away restores it. The control's accessible name is `// NO BARCODE SUPPLIED //` in the accessibility tree at rest and while revealed.
- On a touch screen or in device emulation, a tap shows the phrase, a second tap restores the redacted text, and tapping elsewhere does not clear a tap that toggled it on.
- Pressing the redacted control never submits the form.
- At 360px, activating the item name with a click or the keyboard animates line 2 open and sets `aria-expanded` to true. Activating it again animates line 2 closed and sets `aria-expanded` to false. The status keeps its styling. The name control does not submit the form. At 1024px, the name is not a control.

---

## Testing Strategy

### Unit Tests

- `rankRestockLines`: empty input, all above minimum, at minimum (shortfall 0), WARNING and IN STOCK excluded, minimum 0 and quantity 0, count of 0 ranking first, larger shortfall first, equal shortfall by name, input unchanged.
- `getBarcodeLineText`: redacted, revealed phrase, one barcode, several barcodes, barcodes ignoring `isRevealed`, exact spacing.
- `readItemBarcodes`: order kept, empty list, malformed row, non-string barcode, non-array input.

### Integration Tests

None. Vitest runs `src/**/*.test.ts` in node (`vitest.config.mts:15-16`) and has no route or component harness. The page, the list, and the redacted control are verified by hand.

### Manual Testing Steps

1. Sign in with a household that holds items at (count, minimum) of (0, 5), (2, 5), (4, 6), (3, 3), (4, 3), and (9, 3).
2. Open `/inventory`, and check the `Restock` button is full width under Add item and Scan item.
3. Open `/inventory/restock`. Below `sm`, check the two-line rows. From `sm` up, check the single line ending in `{count} // [{n} short]`. Check the order, the links, the critical color, and the missing `[-]`, `[+]`, and `[CRITICAL]`.
4. Raise one listed item above its minimum on `/inventory`, return to `/inventory/restock`, and check the row is gone. Raise every item and check `Nothing needs restocking.`
5. Open an item with no barcode. Check `[REDACTED]`, hover, focus, tap, second tap, and blur.
6. Attach a second barcode to an item with one through the existing flow. Open it and check both barcodes, oldest first.
7. At 360px, check that barcodes are hidden, activate the item name with a click and with the keyboard, and check that line 2 animates open and closed. At 1024px, check that both lines show and the name is plain text. Check the sizes and the separator at both widths.

## Migration and Rollback

Not applicable. No migration, no table change, and no write path. To roll back, revert the change. `item_barcodes` and `household_inventory` are only read.

## References

- Roadmap: `context/foundation/roadmap.md` (S-07)
- PRD: `context/foundation/prd.md` (FR-010, FR-014, Business Logic)
- Tally loader and line type: `src/lib/items/load-hab-unit-items.ts:5-10`, `:69-94`
- Stock state predicate: `src/lib/items/stock-state.ts:13-26`
- Stock text colors: `src/app/styles/stock-state-class-names.ts:9-13`
- Tally sort that pins 0 last: `src/lib/items/sort-tally-lines.ts:42-46`
- Tally row and dots: `src/app/inventory/inventory-tally.tsx:29-47`, `:128-147`
- Inventory page actions: `src/app/inventory/page.tsx:19-29`, `:51-67`
- Back link: `src/components/back-to-inventory-link.tsx:9-17`, `src/app/layout.tsx:47`
- Route protection: `src/lib/auth/isProtectedPath.ts:1-7`
- Item heading: `src/app/inventory/[itemId]/item-level-editor.tsx:23-41`, `:67-73`, `:121-127`, `:143-182`
- Item page and old loader call: `src/app/inventory/[itemId]/page.tsx:6`, `:35`, `:45`
- Old loader: `src/lib/items/load-item-barcode.ts:7-36`
- Barcode table and select policy: `supabase/migrations/20260916120209_create_items.sql:13-22`, `supabase/migrations/20261030084022_item_barcodes_select_if_member.sql:1-11`
- Separator: `src/components/ui/separator.tsx:7-28`
- Test configuration: `vitest.config.mts:15-16`
- Test patterns: `src/lib/items/sort-tally-lines.test.ts`, `src/lib/items/load-hab-unit-items.test.ts`
- Prior change records: `context/changes/minimum-and-restock-flag/plan-brief.md`, `context/changes/name-search-and-manual-adjust/plan-brief.md`

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Rank the restock lines

#### Automated

- [x] 1.1 `pnpm test` passes `src/lib/items/rank-restock-lines.test.ts`: an empty input returns `[]`, a line above its minimum is left out, a line at its minimum is included with shortfall 0, a count of 0 with the largest shortfall ranks first, equal shortfalls sort by name A to Z, and the input array is unchanged. (d6476c0)
- [x] 1.2 `pnpm lint` and `pnpm typecheck` exit 0. (d6476c0)

#### Manual

- [x] 1.3 `rg "sortTallyLines|from 'next|from 'react|supabase" src/lib/items/rank-restock-lines.ts` prints nothing, so the function is pure and does not reuse the tally sort. (d6476c0)
- [x] 1.4 The inclusion predicate, the shortfall formula, the sort order, and the unchanged input each have a named test in `src/lib/items/rank-restock-lines.test.ts`. (d6476c0)

### Phase 2: Show the restock page

#### Automated

- [x] 2.1 `pnpm test` passes, including `src/lib/items/rank-restock-lines.test.ts` from Phase 1. (d6476c0)
- [x] 2.2 `pnpm lint` and `pnpm typecheck` exit 0, and `pnpm typecheck` generates the `/inventory/restock` route type. (d6476c0)
- [x] 2.3 `pnpm worker:check` exits 0 with the new route. (d6476c0)

#### Manual

- [x] 2.4 On `/inventory`, a full-width `Restock` button sits under Add item and Scan item, spans the width of the pair, and opens `/inventory/restock`. (d6476c0)
- [x] 2.5 With items at (count, minimum) of (0, 5), (2, 5), (4, 6), (3, 3), (4, 3), and (9, 3), `/inventory/restock` lists (0, 5) first with shortfall 5, then (2, 5) with shortfall 3, then (4, 6) with shortfall 2, then (3, 3) with `3 // [0 short]`. The (4, 3) WARNING row and the (9, 3) IN STOCK row are absent. (d6476c0)
- [x] 2.6 Below `sm` each row is two lines: `>` then name then dots, then dots then `{count} // [{n} short]`. From `sm` up each row is one line ending in `{count} // [{n} short]`. The name is a link to `/inventory/{itemId}`. The row text is the critical color and shows no `[-]`, `[+]`, or `[CRITICAL]` text. The `>` is `aria-hidden`. (d6476c0)
- [x] 2.7 Raising a count on `/inventory` past its minimum removes that row from `/inventory/restock` after navigating there. (d6476c0)
- [x] 2.8 With every item above its minimum, or with no items, the page shows `Nothing needs restocking.` (d6476c0)
- [x] 2.9 The heading reads `Restock`, and exactly one `Back to inventory` link shows and returns to `/inventory`. (d6476c0)
- [x] 2.10 Signed out, `/inventory/restock` redirects to `/login`. (d6476c0)

### Phase 3: Split the item heading and list every barcode

#### Automated

- [x] 3.1 `pnpm test` passes `src/lib/items/get-barcode-line-text.test.ts`: no barcode returns ` ++  [REDACTED] ++`, no barcode with `isRevealed` true returns `// NO BARCODE SUPPLIED //`, one barcode returns ` ++  {barcode} ++`, and several barcodes join with `, `. (d6476c0)
- [x] 3.2 `pnpm test` passes `src/lib/items/load-item-barcodes.test.ts`: rows keep their order, an empty list returns `[]`, and a row without a string `barcode` or a non-array input returns `null`. (d6476c0)
- [x] 3.3 `pnpm lint` and `pnpm typecheck` exit 0. (d6476c0)
- [x] 3.4 `rg "loadItemBarcode\b|load-item-barcode'" src` prints nothing, and `src/lib/items/load-item-barcode.ts` no longer exists. (d6476c0)

#### Manual

- [x] 3.5 At 1024px the heading is two lines. Line 1 is `[STATUS] {name}` then dots. Line 2 is dots then ` ++  … ++`, and it is visible. The name is plain text. At 360px line 1 is visible, line 2 is hidden, and the item name is a button with `aria-expanded` false. There is no `Barcodes` control. (d6476c0)
- [x] 3.6 The status stays bold, bracketed, and in the stock color, and changes with Count and Minimum as before. Below 460px the visible label is `[C]`, `[W]`, or `[I]`. From 460px up it is the full word. (d6476c0)
- [x] 3.7 The heading text is 16px at 360px and 18px at 1024px. Count and Minimum are still 14px and 16px from `sm`. (d6476c0)
- [x] 3.8 A horizontal rule sits under the heading and above Count. It is 2px thick, the same as the panel border, with a slight primary glow. (d6476c0)
- [x] 3.9 An item with one barcode shows ` ++  {barcode} ++`. An item with two barcodes, attached through the existing flow, shows both oldest first, joined with `, `. (d6476c0)
- [x] 3.10 An item with no barcode shows ` ++  [REDACTED] ++`. Hovering it with a mouse replaces the whole value with `// NO BARCODE SUPPLIED //`. Moving the mouse away restores the resting text. (d6476c0)
- [x] 3.11 Tabbing to the redacted value shows `// NO BARCODE SUPPLIED //`, and tabbing away restores it. The control's accessible name is `// NO BARCODE SUPPLIED //` in the accessibility tree at rest and while revealed. (d6476c0)
- [x] 3.12 On a touch screen or in device emulation, a tap shows the phrase, a second tap restores the redacted text, and tapping elsewhere does not clear a tap that toggled it on. (d6476c0)
- [x] 3.13 Pressing the redacted control never submits the form. (d6476c0)
- [x] 3.14 At 360px, activating the item name with a click or the keyboard animates line 2 open and sets `aria-expanded` to true. Activating it again animates line 2 closed and sets `aria-expanded` to false. The status keeps its styling. The name control does not submit the form. At 1024px, the name is not a control. (d6476c0)
