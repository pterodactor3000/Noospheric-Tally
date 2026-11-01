# Toggle Category Grouping Implementation Plan

## Overview

The tally groups items into collapsible category panels. A member who wants one flat list has no way to get it. This change adds one icon button beside the sort buttons. It switches the tally between the category panels and a single flat list of the same items. This is Linear TEC-48 (parent TEC-46), GitHub issue #47.

There is no roadmap item and no roadmap ID. PRD FR-018 and US-04 describe the collapsible panels and do not require this toggle. The TEC-48 acceptance criteria and the closed decisions in `change.md` are the scope. Complexity is Low: one component, no data, no backend.

## Current State Analysis

- `src/app/inventory/inventory-tally.tsx` is a client component. It holds `query` (line 80), `sort` (line 81), and `toggled` (lines 82-84) in `useState`. Nothing is persisted.
- `visibleLines` is the name-filtered, sorted list (line 91). `visibleGroups` groups it by category (line 92). `categoryGroups` groups the unfiltered `lines` (line 93) and feeds the shortage and count maps (lines 94-101), which follow the whole category and not the search result.
- The search row is `tallySearchRow` (line 51), rendered at lines 113-150. It holds the `Input` (lines 114-124) and a `role="group"` sort group (lines 125-148) with two `Button`s using `aria-pressed`, `variant` of `default` or `outline`, `size="icon"`, and `className="size-11!"` (lines 129-134 and 138-145).
- The search `onChange` resets `toggled` to `{}` (line 121). The category toggle must not do this.
- The panel stack (`tallyPanelStack`, lines 42-49 and 155) maps `visibleGroups` to `InventoryCategoryPanel` (lines 156-212). Each panel renders a `<ul>` of rows (lines 180-210). Each row is a `<li className="px-2">` holding `TallyCountControls`, `ItemListMarker`, a `Link` to `/inventory/<itemId>`, and the dot leader (lines 188-206).
- The "no match" status renders when `lines.length > 0 && visibleLines.length === 0` (lines 152-154). It is independent of the panel view.
- `isOpen` for each panel comes from `resolveCategoryPanelOpen` (`src/lib/items/resolve-category-panel-open.ts:8-24`): a user toggle wins, then search opens panels with matches, then a shortage opens the panel.
- `InventoryTally` is used only by `src/app/inventory/page.tsx:51`.
- Vitest runs in the `node` environment and includes only `src/**/*.test.ts` (`vitest.config.mts`). There is no component test harness, and no test for `inventory-tally.tsx` exists today.
- `lucide-react` exports `Layers`, `ListTree`, and `FolderTree` (checked in the installed package).
- The panels plan said nothing persists between visits (`context/changes/inventory-category-panels/change.md`, Panels section).

## Desired End State

On `/inventory` the search row shows the search box, the two sort buttons, and a category toggle button. On first load the toggle is pressed and the tally looks exactly as it does today.

Pressing the toggle turns grouping off. The panels disappear and the same items appear in one flat list, in the current sort order, filtered by the current search. Pressing it again brings the panels back with each panel in the open or closed state it had before. Search and sort work in both views. A reload returns to grouping on.

Verify by the checks in the phase and in Testing Strategy.

## What We're NOT Doing

- TEC-47, TEC-49, TEC-50, TEC-51, TEC-52, TEC-53, TEC-54.
- Category panels or a category toggle on the restock list.
- Any persistence of the toggle: no `sessionStorage`, no `localStorage`, no cookie, no URL param.
- Any backend, server action, database, or migration change.
- Changes to `InventoryCategoryPanel`, `resolveCategoryPanelOpen`, `groupTallyLinesByCategory`, or `sortTallyLines`.
- A new roadmap slice or PRD requirement.
- A component test harness.

## Implementation Approach

Add one `useState<boolean>` flag, `isCategorized`, defaulting to `true`, to `InventoryTally`. Add one icon `Button` that copies the sort button style and flips the flag. In the panel stack, render the existing panels when the flag is on and one flat list of `visibleLines` when it is off.

The panel rows and the flat rows are the same markup. Extract that row list into a small component in the same file so the panel view and the flat view share it and cannot drift. The panel view passes `group.lines`. The flat view passes `visibleLines`.

This follows the existing pattern: sort and search are local state in this component, and the control matches the sort buttons.

## Critical Implementation Details

- **Do not reset `toggled`.** The category toggle must leave `toggled` untouched. The panels are unmounted while grouping is off, but `toggled` lives in `InventoryTally`, so the open state returns when grouping turns on. Only the search `onChange` (line 121) resets `toggled`, and it stays as is. A search made while grouping is off still resets `toggled`, because the same input handler runs.
- **No-match status stays shared.** The status at lines 152-154 depends on `visibleLines`. It shows in both views. In the flat view with zero `visibleLines`, render no `<ul>`, so there is no empty list under the status.
- **Control placement.** The toggle is a sibling of the sort group inside `tallySearchRow`, not a child of the `role="group"` named "Sort tally". It is not a sort control.

## Phase 1: Category grouping toggle on the tally

### Overview

Add the toggle button and the flat view to `InventoryTally`. One file changes. The phase is complete when the toggle switches between panels and a flat list, in both views search and sort work, and panel open state survives a round trip.

### Changes Required

#### 1. Toggle state, control, and flat view

**File:** `src/app/inventory/inventory-tally.tsx`

**Intent:** Let the member switch between category panels and one flat list without losing search, sort, or panel open state.

**Contract:**

- Import one icon from `lucide-react` at line 4. Use `Layers`. The existing sort icons stay.
- Add `const [isCategorized, setIsCategorized] = useState(true)` next to the other state at lines 80-84. The initial value is `true`. Nothing reads or writes browser storage.
- Add one `Button` in `tallySearchRow` after the sort group's closing tag (after line 148, before line 149). It must use:
  - `type="button"`
  - `aria-pressed={isCategorized}`
  - a fixed `aria-label` of `Group by category`, so the label does not change with the state and `aria-pressed` carries the state
  - `variant={isCategorized ? 'default' : 'outline'}`
  - `size="icon"`
  - `className="size-11!"`
  - `onClick={() => setIsCategorized((current) => !current)}`
  - the icon with `aria-hidden="true"`
- The click handler changes only `isCategorized`. It does not call `setToggled`, `setQuery`, or `setSort`.
- Extract the row list now duplicated in each panel (the `<ul>` at lines 180-210) into a local component in the same file, for example `TallyLineList`, taking `lines: readonly HabUnitTallyLine[]`. It renders the same `<ul>` and `<li className="px-2">` rows with the same `TallyCountControls`, `ItemListMarker`, `Link`, and dot leader, and the same `getStockState` lookup. Panel markup and behavior do not change.
- In the panel stack (line 155), when `isCategorized` is `true`, render the existing `visibleGroups.map(...)` panels with `TallyLineList` as each panel's child, passing `group.lines`. Panel props, `resolveCategoryPanelOpen` input, and `onToggle` stay as they are.
- When `isCategorized` is `false`, render `TallyLineList` once with `visibleLines`, inside the same `tallyPanelStack` wrapper, and only when `visibleLines.length > 0`. No panel headers, no category counts, no shortage icons render.
- The shortage and count maps (lines 94-101) stay computed from `lines`. They are used only by the panel view.
- The toggle appears only where the search row appears, inside the `lines.length > 0` branch (lines 106-151). With no items, no toggle renders, as with search and sort today.
- `InventoryTally` props and `page.tsx` do not change.

### Success Criteria

#### Automated Verification

- `pnpm typecheck` passes.
- `pnpm lint` passes with no new warnings in `src/app/inventory/inventory-tally.tsx`.
- `pnpm test` passes. No existing test changes.
- `rg "sessionStorage|localStorage" src/app/inventory/inventory-tally.tsx` returns no matches.
- `rg "setToggled" src/app/inventory/inventory-tally.tsx` shows `setToggled` called only in the search `onChange` and the panel `onToggle`, and not in the toggle button handler.

#### Manual Verification

- On first load of `/inventory` with items in several categories, the tally shows the category panels, shortage panels open, and the toggle is pressed (filled style). It looks like today.
- Pressing the toggle turns the panels off. The same items show as one flat list with no panel headers, and the toggle shows the outline style with `aria-pressed="false"`.
- In the flat view, the name sort and count sort buttons reorder the list, and each press of the same button flips direction.
- In the flat view, typing in the search box filters the flat list. A query with no match shows `No item matches "<query>".` and no empty list.
- Open one panel that starts closed and close one that starts open. Turn grouping off, then on. Each panel is in the state you left it in.
- With grouping on, search and sort still work and open the panels with matches as before.
- Reloading the page returns to grouping on, with sort, search, and panel state reset.
- The toggle sits in the search row beside the sort buttons, at the same size, and does not wrap or squeeze the search box on a narrow phone width.
- The toggle is reachable by keyboard and a screen reader announces it as `Group by category`, a toggle button, pressed or not pressed.
- The `+` and `-` count controls on a row work in the flat view.

---

## Testing Strategy

### Unit Tests

- No new unit test. The change adds no pure logic. The grouping, filtering, sorting, and panel-open rules it uses are already covered by `group-tally-lines-by-category.test.ts`, `filter-items-by-name.test.ts`, and the sort and panel-open helpers' tests.
- Vitest includes only `src/**/*.test.ts` in a `node` environment, so a `.tsx` component test would need new tooling. That is out of scope.

### Integration Tests

- None. No cross-boundary behavior changes.

### Manual Testing Steps

1. Sign in with a hab unit that has items in at least three categories, one with a WARNING or CRITICAL item.
2. Open `/inventory`. Confirm panels and a pressed toggle.
3. Press the toggle. Confirm a flat list, sorted by name ascending, zero-count items last.
4. Press the count sort. Confirm the flat order changes. Press it again and confirm the direction flips.
5. Search for part of a name. Confirm the flat list filters. Search for a string that matches nothing and confirm the status message.
6. Clear the search. Press the toggle to bring the panels back.
7. Toggle two panels by hand, turn grouping off, then on. Confirm both panels kept their state.
8. Reload. Confirm grouping is on.
9. Repeat steps 2-3 at a narrow phone width.

## Migration and Rollback

Not applicable. There is no data or schema change. Rollback is reverting the commit.

## References

- Roadmap: none. No roadmap item covers this change.
- PRD: `context/foundation/prd.md` (FR-018 line 172, US-04 line 96). They describe the panels and do not require the toggle.
- Linear TEC-48 (parent TEC-46): https://linear.app/tech-heresy/issue/TEC-48/feat-toggle-category-grouping-on-the-tally
- GitHub issue: https://github.com/pterodactor3000/Noospheric-Tally/issues/47
- Tally component: `src/app/inventory/inventory-tally.tsx:1-219`
- Search row and sort buttons: `src/app/inventory/inventory-tally.tsx:113-150`
- Panel stack and rows: `src/app/inventory/inventory-tally.tsx:155-214`
- Panel component: `src/app/inventory/inventory-category-panel.tsx:63-123`
- Panel open rule: `src/lib/items/resolve-category-panel-open.ts:8-24`
- Tally usage: `src/app/inventory/page.tsx:51`
- Prior change: `context/changes/inventory-category-panels/plan.md`, `context/changes/inventory-category-panels/change.md`
- Test config: `vitest.config.mts`

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Category grouping toggle on the tally

#### Automated

- [x] 1.1 `pnpm typecheck` passes. f22c1a5
- [x] 1.2 `pnpm lint` passes with no new warnings in `src/app/inventory/inventory-tally.tsx`. f22c1a5
- [x] 1.3 `pnpm test` passes. No existing test changes. f22c1a5
- [x] 1.4 `rg "sessionStorage|localStorage" src/app/inventory/inventory-tally.tsx` returns no matches. f22c1a5
- [x] 1.5 `rg "setToggled" src/app/inventory/inventory-tally.tsx` shows `setToggled` called only in the search `onChange` and the panel `onToggle`, and not in the toggle button handler. f22c1a5

#### Manual

- [x] 1.6 On first load of `/inventory` with items in several categories, the tally shows the category panels, shortage panels open, and the toggle is pressed (filled style). It looks like today. f22c1a5
- [x] 1.7 Pressing the toggle turns the panels off. The same items show as one flat list with no panel headers, and the toggle shows the outline style with `aria-pressed="false"`. f22c1a5
- [x] 1.8 In the flat view, the name sort and count sort buttons reorder the list, and each press of the same button flips direction. f22c1a5
- [x] 1.9 In the flat view, typing in the search box filters the flat list. A query with no match shows `No item matches "<query>".` and no empty list. f22c1a5
- [x] 1.10 Open one panel that starts closed and close one that starts open. Turn grouping off, then on. Each panel is in the state you left it in. f22c1a5
- [x] 1.11 With grouping on, search and sort still work and open the panels with matches as before. f22c1a5
- [x] 1.12 Reloading the page returns to grouping on, with sort, search, and panel state reset. f22c1a5
- [x] 1.13 The toggle sits in the search row beside the sort buttons, at the same size, and does not wrap or squeeze the search box on a narrow phone width. f22c1a5
- [x] 1.14 The toggle is reachable by keyboard and a screen reader announces it as `Group by category`, a toggle button, pressed or not pressed. f22c1a5
- [x] 1.15 The `+` and `-` count controls on a row work in the flat view. f22c1a5
