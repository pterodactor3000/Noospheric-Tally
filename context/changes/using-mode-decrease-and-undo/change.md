---
change_id: using-mode-decrease-and-undo
title: Using mode decrease and undo
status: implementing
created: 2026-10-29
updated: 2026-10-29
archived_at: null
---

## Notes

Roadmap: `context/foundation/roadmap.md` (S-04), PRD FR-004, FR-009, US-02. Linear TEC-28. GitHub issue https://github.com/pterodactor3000/Noospheric-Tally/issues/6. Artifacts: `plan.md`, `plan-brief.md`.

Closed decisions from 2026-10-29. The scanning session is the tab session, stored in `sessionStorage` and created on the first recorded scan. Any unreversed session line can be reversed once, and every line is +1 or -1. The count never drops below 0, and a using scan at 0 or a reversal that would go below 0 is refused with a visible message. The using result mirrors stocking with the name, the new count, and a one-time confirmation, and the session list sits below the scanner, newest first, with Undo on each unreversed line.
