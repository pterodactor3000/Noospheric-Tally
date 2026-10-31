---
change_id: rename-household-landing
title: Rename household on the landing page
status: implementing
created: 2026-10-31
updated: 2026-10-31
archived_at: null
---

## Notes

No roadmap item. Linear TEC-54, parent TEC-46. GitHub issue pterodactor3000/Noospheric-Tally#53 (https://github.com/pterodactor3000/Noospheric-Tally/issues/53). Closed decisions: complexity Low, one phase, Option A (change only the landing sentence in `src/app/page.tsx`, leave the `src/app/layout.tsx` metadata description alone), exact sentence "A signed-in member can scan an unknown barcode and save a hab-unit name." with the hyphen. Out of scope: database renames, identifier renames, other pages, TEC-47 through TEC-53, the `src/app/layout.tsx` metadata description. Artifacts: `plan.md`, `plan-brief.md`.
