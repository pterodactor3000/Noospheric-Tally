# Toggle Category Grouping Plan Brief

> Full plan: `context/changes/toggle-category-grouping/plan.md`
> Roadmap item: none. Linear TEC-48 (parent TEC-46), GitHub issue #47. PRD FR-018 and US-04 describe the panels and do not require this toggle.

## What and Why

A member can switch the tally between category panels and one flat list with a button beside the sort buttons. Some members want one list to scan, and the panels force a grouped view today.

## Starting Point

`src/app/inventory/inventory-tally.tsx` always renders `visibleGroups` as `InventoryCategoryPanel`s (lines 155-212). Search, sort, and panel open state are local `useState` (lines 80-84). The search row holds the search box and two sort icon buttons (lines 113-150). The delta is one more state flag, one more icon button, and a flat render path for `visibleLines`.

## Desired End State

Grouping is on at load and matches today's tally. One press shows a flat list of the same filtered, sorted items. Another press brings the panels back with their open state kept. Reloading returns to grouping on.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Complexity | Low, one phase | One component, no data or backend | Plan |
| Default | Grouping on | First load matches today's panels | Plan |
| Persistence | `useState` only, no storage | Search, sort, and panel state already reset on reload | Panels plan |
| Panel open state | Kept when grouping toggles off and on | `toggled` is not reset by the toggle | Plan |
| Control | Icon `Button` in the search row, sort button style, `aria-pressed`, `default` when on, `outline` when off | Matches the sort buttons | Plan |
| Views | Both views honor search and sort. Off view renders `visibleLines` as one list | Reuses the existing filter and sort | Plan |
| Row markup | Extract a local row list component shared by both views | Avoids two copies of the row markup | Plan |
| Tests | No new unit test | No pure logic added, and Vitest has no component harness | Plan |

## Scope

**In scope:**

- A `isCategorized` state flag and a toggle button in `src/app/inventory/inventory-tally.tsx`.
- A flat list view of `visibleLines`.
- A shared row list component in the same file.

**Out of scope:**

- TEC-47, TEC-49, TEC-50, TEC-51, TEC-52, TEC-53, TEC-54.
- Restock list panels.
- Persistence of the toggle.
- Backend, database, and migrations.
- A new roadmap slice or PRD requirement.

## Approach

Add a boolean state flag and an icon button that flips it. Render panels when on and one flat row list when off, sharing one row list component. Leave `toggled` alone so panel state survives a round trip.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Category grouping toggle | Toggle button and flat view in `inventory-tally.tsx` | Panel rows drift from flat rows, or the toggle resets `toggled` |

## Risks and Assumptions

- No component test harness exists, so the view switch is verified by hand.
- The extracted row list must keep the panel markup unchanged.
- The extra button must not squeeze the search box on a narrow phone.
- Assumes the `Layers` icon reads clearly as a grouping control.

## Success Criteria

- The tally loads grouped, as it does today.
- One press shows one flat list. Search and sort work there.
- Pressing again restores the panels with the same open and closed state.
- Reload returns to grouped.
