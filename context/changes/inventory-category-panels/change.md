---
change_id: inventory-category-panels
title: Collapsible inventory categories
status: implementing
created: 2026-10-30
updated: 2026-10-30
archived_at: null
---

## Notes

Roadmap: `context/foundation/roadmap.md` (S-11), PRD FR-018, story US-04. Linear TEC-35. GitHub issue https://github.com/pterodactor3000/Noospheric-Tally/issues/16. Artifacts: `plan.md`, `plan-brief.md`.

Closed decisions from 2026-10-30. Complexity is Medium. The user approved four phases in this order: category column and read path, first-response categorization on create, collapsible panels with a shortage icon, and category edit on the item page.

Prerequisite: S-06 is done. S-10 is retired and merged into S-06, so the S-10 text in the Linear description is stale and the roadmap wins.

Category:

- The category is stored on `household_inventory`, not on `items`, because `items` is shared across households.
- Existing rows, items with no barcode, and an item added from the global table start as `uncategorized`.
- The first Open Facts HTTP 200 sets the category by catalog. Beauty gives beauty, food gives food, pet food gives pet food, and products gives other. No answer gives `uncategorized`.
- A 200 response with a blank name still sets the category. The name stays manual entry. The empty lookup status carries a category.
- Category does not change the restock ranking.

Panels:

- All five panels always render, including empty ones.
- A panel that contains a WARNING or CRITICAL item starts open. The other panels start closed. A name search opens every panel that has a match. Open state is not saved between visits.
- The warning icon follows the whole category, not the search result.

Edit:

- The category is a control on the item page, saved with the existing Save button. `set_household_item_levels` is extended so quantity, minimum, and category save in one call.

Cleanup:

- Phase 2 removes the stray `debugger` statement in `src/lib/catalog/lookup-catalog-name.ts`. It is part of that phase and not a separate feature.
