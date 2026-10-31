---
change_id: share-hab-unit
title: Share a hab unit and its tally
status: implementing
created: 2026-10-31
updated: 2026-10-31
archived_at: null
---

## Notes

No roadmap item. Linear TEC-53 (parent TEC-46). GitHub issue pterodactor3000/Noospheric-Tally#52 (https://github.com/pterodactor3000/Noospheric-Tally/issues/52). PRD FR-011 (invite another person to the household inventory), which the PRD and roadmap currently list as deferred and parked. Phase 4 corrects that text.

Outcome: a member can share a hab unit so another person sees the same tally, items, and counts.

Closed decisions from 2026-10-31:

- Complexity is High. It adds a membership write path, a new table, `security definer` RPCs, and a migration to the linked project.
- A member generates a single-use invite code or link. Only a hash is stored. The code expires after 7 days. A new code replaces any unused earlier code for that hab unit. The member delivers the code or link. There is no email provider and no account lookup.
- An invited person who already has a hab unit is refused with a clear message, and that hab unit is left untouched.
- Phase 4 updates only the PRD and roadmap sentences this feature makes false. It marks FR-011 delivered, removes its non-goal line and Open Question 1, and moves the roadmap Parked entry to a note.
- Four phases: invite storage and join RPCs, app wrappers and server actions, share page and join entry, foundation text.

Out of scope: member lists, member removal, leaving a hab unit, roles, TEC-47, TEC-48, TEC-49, TEC-50, TEC-52, TEC-54, bulk insert, landing copy.

Branch: `feature/tec-54-rename-household-landing`, checked out by the parent. Artifacts: `plan.md`, `plan-brief.md`.
