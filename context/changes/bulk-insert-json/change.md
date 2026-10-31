---
change_id: bulk-insert-json
title: Bulk insert items from a JSON file
status: planned
created: 2026-10-31
updated: 2026-10-31
archived_at: null
---

## Notes

No roadmap item. Linear TEC-51. GitHub issue https://github.com/pterodactor3000/Noospheric-Tally/issues/50. Parent TEC-46. Artifacts: `plan.md`, `plan-brief.md`.

Closed decisions from 2026-10-31. Complexity is Medium. The user approved three phases.

- The bulk RPC inserts every item with quantity 1. `create_item`, `create_item_without_barcode`, and the 99 cap are unchanged. TEC-50 stays out of scope.
- The import is all or nothing. One bad entry rejects the whole file, the message names the first bad entry by index and barcode, and the tally does not change.
- The server action rejects a file over 500 entries or over 256KB. `next.config.ts` is unchanged.
