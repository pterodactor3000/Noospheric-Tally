---
change_id: consumption-rate-view
title: Consumption rate view
status: implementing
created: 2026-10-30
updated: 2026-10-30
archived_at: null
---

## Notes

Roadmap: `context/foundation/roadmap.md` (S-08), PRD FR-015. Linear TEC-32. GitHub issue https://github.com/pterodactor3000/Noospheric-Tally/issues/10. Artifacts: `plan.md`, `plan-brief.md`.

Closed decisions from 2026-10-30. Complexity is Medium. The user approved two phases. The rate is the count of unreversed using scans in the last 7 * 24 hours, shown on the item page as `{n} per week`. A count of 0 reads `No use recorded`. Hand adjustments stay out of the change log, so they stay out of this rate.
