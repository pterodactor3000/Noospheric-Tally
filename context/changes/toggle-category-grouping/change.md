---
change_id: toggle-category-grouping
title: Toggle category grouping on the tally
status: implementing
created: 2026-11-01
updated: 2026-11-01
archived_at: null
---

## Notes

No roadmap item. Linear TEC-48 (parent TEC-46), https://linear.app/tech-heresy/issue/TEC-48/feat-toggle-category-grouping-on-the-tally. GitHub issue pterodactor3000/Noospheric-Tally#47 (https://github.com/pterodactor3000/Noospheric-Tally/issues/47). Artifacts: `plan.md`, `plan-brief.md`.

PRD FR-018 and US-04 describe collapsible category panels. They do not require a toggle. This change adds one on top of the shipped panels from `inventory-category-panels` (S-11).

Closed decisions from 2026-11-01. The user said "follow dev rules" and did not take the interview, so these were taken from the current tally and the panels plan.

- Complexity is Low. One phase.
- Categorization defaults to on. The first load matches today's panels.
- The toggle is component state only (`useState`). No `sessionStorage`, no `localStorage`. Search, sort, and panel open state already work this way.
- Turning categories off and back on keeps the existing panel open state. `toggled` is not reset.
- The control sits beside the sort buttons in the tally search row. It uses the same button style: `Button`, `size="icon"`, `className="size-11!"`, `aria-pressed`, `variant="default"` when on and `outline` when off.
- Search and sort work in both views. The off view renders the filtered, sorted `visibleLines` as one list. The on view keeps the category panels.

Out of scope: TEC-47, TEC-49, TEC-50, TEC-51, TEC-52, TEC-53, TEC-54, restock list panels, persistence, backend, migrations.
