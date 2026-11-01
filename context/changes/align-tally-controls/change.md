---
change_id: align-tally-controls
title: Align tally controls and widen the tally
status: planned
created: 2026-11-01
updated: 2026-11-01
archived_at: null
---

## Notes

No roadmap item. Linear TEC-47, https://linear.app/tech-heresy/issue/TEC-47/fix-align-tally-controls-and-widen-the-tally. Artifacts: `plan.md`, `plan-brief.md`.

Closed decisions from 2026-11-01. Complexity is Low. The acceptance criteria in TEC-47 are the confirmed contract. The user took no interview and approved no phase outline, so the choices below came from the current code.

- Every count control is one flex line. The decrease button, the number, and the increase button are three parts, each `w-11` (44px, today's `min-w-11` tap width), and the group is right-aligned. This covers tally rows and the Count and Minimum rows on item details.
- The item details category dropdown is right-aligned with `text-align-last: right` only. `text-align` is not set, so the open list is unchanged.
- The tally section drops `panel` and `max-w-[900px]`. It keeps the column layout, the `max-h` calc, and its own scroll. Only the tally page changes. Restock and item details keep their panels.
- No component test harness exists and none is added. Checks are typecheck, lint, the existing unit tests, source greps, and manual steps.

Out of scope: hiding items, category creation, sharing, bulk insert, scan page, popups, landing copy, count default, and the count cap.
