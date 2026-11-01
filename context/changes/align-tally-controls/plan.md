# Align Tally Controls and Widen the Tally Implementation Plan

## Overview

The count controls and the category dropdown drift left of the right edge, and the tally sits in a bordered panel capped at 900px. This change aligns the controls to the right, gives the three count parts one width, and removes the tally's panel so it uses the main width. This is Linear TEC-47.

There is no roadmap item and no PRD requirement id. The TEC-47 acceptance criteria and the closed decisions in `change.md` are the scope. Complexity is Low: three files for layout classes on the tally and item details, plus shared class constants. There is no data, backend, or migration work.

## Current State Analysis

Verified against `origin/main` (commit `fdc589a`).

**Tally page**

- `src/app/inventory/page.tsx:13-26` builds `inventorySection` from `panel` (border, padding, `bg-card`), `max-w-[900px]`, a flex column, `overflow-y-auto`, and `max-h-[calc(100svh-7rem-2px)]`. The calc covers the signed-in header (`py-4`, an `h-8` Sign out button, a 2px bottom border) and the `py-6` on `main` (`:48`). It has nothing to do with the section border.
- `panel` is `border-2 border-foreground/50 p-8 shadow-sm backdrop-blur sm:p-12 bg-card text-card-foreground` (`src/app/styles/class-names.ts:27-36`). `--card-foreground` equals `--foreground` in both themes (`src/app/styles/globals.css:9,11,37,39`). `body` already uses `--foreground` (`:284-287`). Only the background tint differs.
- `main` is `centeredPage`: flex column, `items-center`, `px-6` (`class-names.ts:15-23`). The section is the only child that is narrower than `main`.
- The inner list `tallyPanelStack` (`src/app/inventory/inventory-tally.tsx:41-48`) has `flex-1 overflow-y-auto` and scrolls on its own. The tally root is `contents` (`:40`), so its children are flex children of the section.
- `src/app/inventory/restock/page.tsx:11-16` has the same panel and 900px cap. It is not part of this change.

**Tally row count controls**

- `TallyCountControls` renders one row `tallyLine`: flex, `items-baseline`, `gap-2` (`src/app/inventory/tally-count-controls.tsx:37`, `:86`). The count group is a `span` (`tallyCount`, `shrink-0 whitespace-nowrap`, `:22`, `:88-113`) with two `<button>`s and the number as bare text, separated by `{' '}`.
- `tallyControl` gives each button `min-h-[36px] min-w-11` (`:23-36`). The number is bare text, so its width follows its digits (1 to 2 digits at the cap of 99). The decrease button, the number, and the increase button therefore differ in width, and the right edge of the group is the only thing that lines up.
- The dot leader (`tallyDots`, `inventory-tally.tsx:59-64`) has `flex-1`, so the group is already the last flex item. The right-alignment is implicit, not set on the group.
- `TallyCountControls` is used only by `inventory-tally.tsx:91`. The scan page does not use it.

**Item details count rows**

- `LevelStepper` renders Count and Minimum (`src/app/inventory/[itemId]/item-level-editor.tsx:134-169`, used at `:255-270`). It has the same shape: `itemLine` flex row (`:33`), `itemValue` span (`shrink-0 whitespace-nowrap`, `:82`) holding two buttons with `itemControl` and the number as bare text with `{' '}` spacers (`:147-167`).
- `itemControl` is `min-h-11 min-w-11` plus reset classes (`src/app/inventory/[itemId]/barcode-line.tsx:11-24`). It is shared with the no-barcode button (`:44`) and the category select (`item-level-editor.tsx:289`).
- Count goes 0 to 99 (`HOUSEHOLD_QUANTITY_MAX = 99`, `src/lib/items/validate-household-quantity.ts`). Minimum goes 0 to 999 (`MINIMUM_QUANTITY_MAX`, `src/lib/items/stock-state.ts`). The number part must fit three digits.

**Item details category dropdown**

- The Category row is `itemLine` with the label, a dot leader, and the select inside `itemValue` (`item-level-editor.tsx:271-298`). The select has `appearance-none bg-none` and `itemControl` (`:289`).
- A select is as wide as its widest option, so the shorter selected text stays at the left edge of that box. The select box is at the right of the row, and the text inside it is not. That is the misalignment. The label text is `[<category>]` (`:293`).

**Item details page shell**

- `src/app/inventory/[itemId]/page.tsx:15-21` also uses `panel` and `max-w-[900px]`. TEC-47 does not ask to change it.

**Tests**

- Vitest runs `src/**/*.test.ts` in the `node` environment (`vitest.config.mts`). There is no component test harness and no test for these files. `src/app/styles/theme-tokens.test.ts` is the only test under `src/app`. Adding a harness is out of scope.

## Desired End State

- On `/inventory/<itemId>`, at any viewport width, the selected category text ends on the same vertical line as the `[+]` glyphs and the Use value.
- On a tally row, and on the Count and Minimum rows of item details, `[-]`, the number, and `[+]` sit on one line. The group is right-aligned. The three parts each measure 44px wide, for a one-digit, two-digit, and three-digit number.
- `/inventory` has no bordered box around the tally. The title, search row, list, and action buttons use the width of `main` minus 4px on each side (`px-1`). The list still scrolls on its own and the action buttons stay reachable on a short screen. Tabbing to the search field and the group button shows the full focus ring.
- `/inventory/scan` and `/inventory/lookup` render the same as before. The category list that opens from the select looks the same as before.

## What We're NOT Doing

- Hiding items, category creation, sharing, bulk insert.
- The scan page, including `scan-session-list.tsx` and `scan-capture.tsx`.
- Popups, including the open category list. No `text-align` is added to the select.
- Landing copy.
- The count default of 1 and the count cap of 99.
- The restock page panel and the item details panel. Both keep `panel` and `max-w-[900px]`.
- A component test harness.

## Implementation Approach

Both count controls already share one structure, so put the layout in two shared class constants in `src/app/styles/class-names.ts`, next to `actionButton` and `panel`, and use them in both files. This avoids copying the width into four places. Keep every local class that handles the row height (`min-h-[36px]` on the tally, `min-h-11` on item details) so the row sizes do not move.

For the dropdown, add `text-align-last: right` to the select. It right-aligns the closed display without touching the open list.

For the tally, remove `panel` and `max-w-[900px]` from `inventorySection` and keep the scroll behavior. Add `px-1` so the 3px focus ring is not clipped by `overflow-y-auto`. The content is 4px inside `main` on each side. That is the accepted tolerance for "as wide as the main container."

## Phase 1: Equal-width, right-aligned count controls

### Overview

Tally rows and the Count and Minimum rows on item details show `[-]`, the number, and `[+]` as three equal parts on one line, aligned right.

### Changes Required

#### 1. Shared count control classes

**File:** `src/app/styles/class-names.ts`

**Intent:** Hold the count control layout in one place so the tally and item details cannot drift apart again.

**Contract:** Add and export two constants, named `countControlGroup` and `countControlPart`, sorted into the existing export list.

- `countControlGroup`: a flex row that does not wrap or shrink (`flex`, `shrink-0`, `items-baseline`, `whitespace-nowrap`). Right alignment comes from this group being the last flex item after the `flex-1` dot leader. Do not add `justify-end`. The group has no spare room, so that class changes nothing.
- `countControlPart`: a fixed 44px, non-shrinking cell with no text alignment (`w-11`, `shrink-0`). The decrease button and the number add `text-center`. The increase button adds `text-right` instead, so the `[+]` glyph ends at the right edge of its cell. Do not put `text-center` and `text-right` on the same element. Tailwind does not resolve that conflict by class order.

44px equals today's `min-w-11` tap width, so touch targets do not shrink. Three digits of the row font fit in 44px.

#### 2. Tally row controls

**File:** `src/app/inventory/tally-count-controls.tsx`

**Intent:** Make the group on each tally row three equal parts on one line.

**Contract:**

- The `span.tallyCount` (`:22`, `:88`) uses `countControlGroup` instead of `shrink-0 whitespace-nowrap`.
- The decrease button adds `countControlPart` and `text-center` to `tallyControl` (`:23-36`, `:93`). The increase button adds `countControlPart` and `text-right` (`:105`). The local `min-h-[36px]` stays.
- The bare number (`:100`) becomes a `span` with `countControlPart` and `text-center`, with the same `min-h-[36px]` and `leading-[36px]` the name uses (`inventory-tally.tsx:52-58`), so its baseline matches the buttons.
- Remove the `{' '}` spacers at `:99` and `:100`. With flex they add nothing, and the `gap` is not wanted between parts. The three parts touch, and the 44px cells carry the spacing.
- The sr-only stock label (`:112`) stays inside the group and the disabled, `aria-label`, `onClick`, and error-alert behavior stay as is.

#### 3. Item details Count and Minimum rows

**File:** `src/app/inventory/[itemId]/item-level-editor.tsx`

**Intent:** Give `LevelStepper` the same three-part layout.

**Contract:**

- `itemValue` (`:82`) stays for the Use and Category rows. In `LevelStepper` (`:147`) the span wrapping the controls uses `countControlGroup` instead.
- The decrease button adds `countControlPart` and `text-center` to `itemControl` (`:152`). The increase button adds `countControlPart` and `text-right` (`:162`). `itemControl` itself is not changed, because the no-barcode button and the select share it.
- The bare number (`:157`) becomes a `span` with `countControlPart`, `text-center`, and `min-h-11 leading-11`, matching `itemLabel` (`:75`).
- Remove the `{' '}` spacers at `:156` and `:157`.
- Count and Minimum both get this. The Minimum number reaches three digits (999) and must stay inside its 44px cell with no wrap.

### Success Criteria

#### Automated Verification

- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm test` passes with no test added or removed.
- `rg -n "countControlGroup|countControlPart" src` lists `class-names.ts`, `tally-count-controls.tsx`, and `item-level-editor.tsx`, and no file under `src/app/inventory/scan`.
- `rg -n "\{' '\}" src/app/inventory/tally-count-controls.tsx src/app/inventory/[itemId]/item-level-editor.tsx` finds no spacer between the buttons and the number.

#### Manual Verification

- On `/inventory`, a row with count 1, a row with count 10, and a row with count 99 each show `[-]`, the number, and `[+]` on one line. Measure the three parts in the browser inspector: each is 44px wide.
- The `[+]` glyphs of rows with different digit counts end on one vertical line, flush with the right edge of the 44px cell. The `[-]` glyphs stay centered in their cells.
- Decrease is disabled at 0 and increase at 99, as before. Pressing `[+]` and `[-]` still changes the count, and the error alert still shows below the row on a failure.
- On `/inventory/<itemId>`, Count and Minimum show the same three parts at 44px each. Set Minimum to 100 and 999 and check the number stays on the line, inside its cell.
- At 320px, 390px, and 1280px wide, no control line wraps.

---

## Phase 2: Right-aligned category dropdown

### Overview

The category dropdown on item details reads from the right edge at every width.

### Changes Required

#### 1. Category select

**File:** `src/app/inventory/[itemId]/item-level-editor.tsx`

**Intent:** Make the selected category text sit at the right edge of the select box, where the box is already right-aligned in the row.

**Contract:** Add `[text-align-last:right]` to the select `className` (`:289`). Do not add `text-align`, `dir`, or `appearance` changes. The open list and the keyboard and change behavior stay as is, and `name`, `id`, `value`, and the option labels stay as is.

### Success Criteria

#### Automated Verification

- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `rg -n "text-align-last" src` shows one match, in `item-level-editor.tsx`.
- `rg -n "text-right" src/app/inventory/[itemId]/item-level-editor.tsx` matches the increase button only, not the select. `rg -n "dir=" src/app/inventory/[itemId]/item-level-editor.tsx` finds nothing.

#### Manual Verification

- On `/inventory/<itemId>` at 320px, 640px, and 1280px wide, the selected `[Category]` text ends on the same vertical line as the `[+]` glyphs and the Use value. Try the shortest and the longest category label.
- Choose a different category: the closed select shows the new label at the right, and Save stores it.
- Open the select: the option list looks the same as on `main` (same alignment, same labels). Check in Chrome and Firefox.

---

## Phase 3: Tally without the inner panel

### Overview

The tally page loses its bordered box and fills the main container.

### Changes Required

#### 1. Tally section

**File:** `src/app/inventory/page.tsx`

**Intent:** Remove the inner container and the 900px cap. Keep how the page scrolls.

**Contract:**

- `inventorySection` (`:13-26`) no longer includes `panel` or `'max-w-[900px]'`. It keeps the width classes, `flex`, `min-h-0`, `flex-col`, `overflow-y-auto`, and the `max-h-[calc(100svh-7rem-2px)]` with its comment. The `-2px` is the header's border, not the panel's, so it stays.
- Add `px-1`. `overflow-y` other than `visible` also computes `overflow-x` to `auto`, and the removed panel padding used to cover the 3px focus ring and the separator glow. `px-1` gives the ring room. The glow (`shadow-[0_0_8px]`) may still be trimmed by 4px. That trim is accepted. Do not add `min-w-0`. A long name already truncates through `tallyName`, and `min-width: auto` does not apply across this column-flex cross axis.
- Remove the now-unused `panel` import (`:8`). `clsx`, `actionButton`, and `centeredPage` stay.
- Nothing else on the page changes: title, `Separator`, `InventoryTally`, the four action buttons (`max-w-lg`, centered), and the share link.

### Success Criteria

#### Automated Verification

- `pnpm typecheck` passes.
- `pnpm lint` passes with no unused import of `panel` in `page.tsx`.
- `rg -n "panel|max-w-\[900px\]" src/app/inventory/page.tsx` finds nothing.
- `rg -n "max-w-\[900px\]" src` still matches `restock/page.tsx` and `[itemId]/page.tsx` and nothing else.
- `pnpm test` passes.
- `git diff --stat origin/main` lists no file under `src/app/inventory/scan` or `src/app/inventory/lookup`.

#### Manual Verification

- `/inventory` has no border, no card tint, and no panel padding box around the tally. The title, search row, and list sit 4px inside `main`'s content edges, at 390px, 1280px, and 1920px wide. At 1920px the tally is wider than 900px. Tab to the search field and to the group button. The full focus ring is visible on both.
- With many items, the list scrolls inside the page and the four action buttons stay visible on a short viewport (for example 700px tall). With few items the page does not scroll.
- A long item name truncates and does not widen the page or push the controls off screen.
- `/inventory/scan` and `/inventory/lookup` look the same as on `main`. `/inventory/restock` and `/inventory/<itemId>` keep their panels.

---

## Testing Strategy

### Unit Tests

- No new unit test. The change is Tailwind classes in React components, the Vitest environment is `node`, and no component harness exists. Adding one is out of scope. `pnpm test` confirms the existing tests still pass, and the source greps in each phase pin the class changes.

### Integration Tests

- None. No data flow, action, or route changes.

### Manual Testing Steps

1. Run `pnpm dev`, sign in, and open `/inventory` with items at counts 0, 1, 10, and 99 and a minimum above 99.
2. Measure the three count parts on a row at 390px and 1280px. Each is 44px.
3. Open an item. Check Count, Minimum, and Category share the right edge at 320px, 640px, and 1280px.
4. Open the category list and confirm it looks the same as on `main`.
5. Return to `/inventory` and confirm there is no inner box and the content is full width.
6. Open `/inventory/scan` and `/inventory/lookup` and compare them with `main`.

## Migration and Rollback

Not applicable. No data or API changes. Revert the three phases' files to roll back.

## References

- Roadmap: None. This is not a roadmap slice, and `context/foundation/roadmap.md` has no entry for it.
- PRD: `context/foundation/prd.md` (no requirement id applies)
- Linear: TEC-47, https://linear.app/tech-heresy/issue/TEC-47/fix-align-tally-controls-and-widen-the-tally
- Tally page: `src/app/inventory/page.tsx:13-26`, `:48-49`
- Panel and layout classes: `src/app/styles/class-names.ts:15-36`, `:99-121`
- Tally list and row markup: `src/app/inventory/inventory-tally.tsx:40-64`, `:84-111`
- Tally count controls: `src/app/inventory/tally-count-controls.tsx:22-37`, `:84-114`
- Item details editor: `src/app/inventory/[itemId]/item-level-editor.tsx:75-82`, `:134-169`, `:255-298`
- Shared item control: `src/app/inventory/[itemId]/barcode-line.tsx:11-24`
- Item details page shell: `src/app/inventory/[itemId]/page.tsx:15-21`
- Count and minimum caps: `src/lib/items/validate-household-quantity.ts`, `src/lib/items/stock-state.ts`
- Neighbouring changes: `context/changes/toggle-category-grouping/`, `context/changes/start-items-at-1-cap-99/`

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Equal-width, right-aligned count controls

#### Automated

- [x] 1.1 `pnpm typecheck` passes. 276cc65
- [x] 1.2 `pnpm lint` passes. 276cc65
- [x] 1.3 `pnpm test` passes with no test added or removed. 276cc65
- [x] 1.4 `rg -n "countControlGroup|countControlPart" src` lists `class-names.ts`, `tally-count-controls.tsx`, and `item-level-editor.tsx`, and no file under `src/app/inventory/scan`. 276cc65
- [x] 1.5 `rg -n "\{' '\}"` on `tally-count-controls.tsx` and `item-level-editor.tsx` finds no spacer between the buttons and the number. 276cc65

#### Manual

- [ ] 1.6 On `/inventory`, rows with counts 1, 10, and 99 each show `[-]`, the number, and `[+]` on one line, and each part is 44px wide.
- [ ] 1.7 The `[+]` glyphs of rows with different digit counts end on one vertical line, flush with the right edge of the 44px cell. The `[-]` glyphs stay centered in their cells.
- [ ] 1.8 Decrease is disabled at 0, increase at 99, both buttons still change the count, and the error alert still shows on a failure.
- [ ] 1.9 On `/inventory/<itemId>`, Count and Minimum show three 44px parts, and a Minimum of 100 and 999 stays on the line.
- [ ] 1.10 At 320px, 390px, and 1280px wide, no control line wraps.

### Phase 2: Right-aligned category dropdown

#### Automated

- [ ] 2.1 `pnpm typecheck` passes.
- [ ] 2.2 `pnpm lint` passes.
- [ ] 2.3 `rg -n "text-align-last" src` shows one match, in `item-level-editor.tsx`.
- [ ] 2.4 `rg -n "text-right"` on `item-level-editor.tsx` matches the increase button only, not the select. `rg -n "dir="` on that file finds nothing.

#### Manual

- [ ] 2.5 At 320px, 640px, and 1280px wide, the selected category text ends on the same vertical line as the `[+]` glyphs and the Use value, for the shortest and longest label.
- [ ] 2.6 Choosing a different category shows the new label at the right, and Save stores it.
- [ ] 2.7 The open option list looks the same as on `main` in Chrome and Firefox.

### Phase 3: Tally without the inner panel

#### Automated

- [ ] 3.1 `pnpm typecheck` passes.
- [ ] 3.2 `pnpm lint` passes with no unused `panel` import in `page.tsx`.
- [ ] 3.3 `rg -n "panel|max-w-\[900px\]" src/app/inventory/page.tsx` finds nothing.
- [ ] 3.4 `rg -n "max-w-\[900px\]" src` matches only `restock/page.tsx` and `[itemId]/page.tsx`.
- [ ] 3.5 `pnpm test` passes.
- [ ] 3.6 `git diff --stat origin/main` lists no file under `src/app/inventory/scan` or `src/app/inventory/lookup`.

#### Manual

- [ ] 3.7 `/inventory` has no border, card tint, or panel padding box. Content sits 4px inside `main` at 390px, 1280px, and 1920px, and is wider than 900px at 1920px. Tabbing to the search field and the group button shows the full focus ring.
- [ ] 3.8 With many items the list scrolls inside the page and the action buttons stay visible on a 700px-tall viewport. With few items the page does not scroll.
- [ ] 3.9 A long item name truncates and does not widen the page or push the controls off screen.
- [ ] 3.10 `/inventory/scan` and `/inventory/lookup` look the same as on `main`, and `/inventory/restock` and `/inventory/<itemId>` keep their panels.
