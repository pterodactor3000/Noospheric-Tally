---
change_id: create-hab-unit-categories
title: Create categories per hab unit
status: implemented
created: 2026-11-03
updated: 2026-11-03
archived_at: null
---

## Notes

No roadmap item. Linear TEC-52, https://linear.app/tech-heresy/issue/TEC-52/feat-create-categories-per-hab-unit. Parent TEC-46, tracker only. Branch `feature/tec-52-create-hab-unit-categories`. Artifacts: `plan.md`, `plan-brief.md`.

`context/foundation/roadmap.md` S-11 (`inventory-category-panels`) is a different, already shipped change. It owns the five built-in panels. This change adds to it and does not reopen it. No PRD requirement id covers this change. PRD FR-018 names five fixed panels, and this change adds per-hab-unit panels beside them. The PRD text is not edited here.

Outcome: a member can create a category that exists only for the current hab unit.

Acceptance criteria from TEC-52:

- Given the current hab unit, when a member creates a category, then that category exists only for this hab unit and can be assigned to its items.
- Given a second hab unit, when a member opens it, then it does not list categories created for the first hab unit.

Closed decisions from 2026-11-03. Complexity is High, confirmed by the user. The user approved five phases in this order: category store and read path, create, assign, rename, delete with help copy.

Data model:

- Q1: The five built-in categories stay global, as the text values `pet-food`, `food`, `beauty`, `other`, and `uncategorized`. Custom categories are additional and belong to one hab unit.
- A custom category has a stable id. An item points at it by id. An item uses a built-in value or a custom category, never both.

Create, assign, rename, delete:

- Q2: A separate create control on `/inventory` calls its own server action. The new category then appears in the existing Category select on the item page. Assignment stays on the existing item-page save path.
- Q3: The name is trimmed, 1 to 40 characters, unique in the hab unit ignoring case, and different from the five built-in labels. A duplicate returns a field error.
- Q4: Delete asks for a confirm step. Then one RPC moves that category's items to Uncategorized and removes the category in one transaction. Counts and minimums stay. There is no undo.
- Q5: Rename changes only the name. The id, the item assignments, and the creation-time position stay. A case-only rename of the same category is allowed. A rename that matches another category's name returns a field error.

Display and access:

- Custom panels render before the built-ins, earliest created first. There is no reordering.
- Rename and delete controls sit on each custom panel header on `/inventory`. Built-in panels have neither.
- Any member of the hab unit can create, rename, and delete that hab unit's custom categories.
- Deleting a category while its item page is open makes the later save return the existing stale-save message.
- Catalog lookup still assigns only a built-in category. A custom category is chosen by hand.
- A custom panel uses the same warning icon and open-by-default rules as the built-ins.
- An empty custom category still shows its panel.

Out of scope: reordering categories, changing the catalog mapping, bulk import categories, category archive or undo, sibling issues TEC-58, TEC-59, TEC-60, and every other open follow-up, and any edit to `context/foundation/roadmap.md` or `context/foundation/prd.md`.

Phase 1 edits the item page to pass a built-in category ref through and call notFound() for a custom ref, and leaves the item editor category prop for Phase 3.
