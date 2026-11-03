# Create Categories Per Hab Unit Plan Brief

> Full plan: `context/changes/create-hab-unit-categories/plan.md`
> Roadmap item: None. Linear TEC-52 (parent TEC-46, tracker only). `context/foundation/roadmap.md` S-11 is a different, shipped change.

## What and Why

A member of a hab unit can create their own categories, assign them to items, rename them, and delete them. A category belongs to one hab unit, and another hab unit never lists it. Today only five fixed categories exist, stored as text on each inventory row, so a hab unit cannot file items the way it shops.

## Starting Point

`household_inventory.category` holds one of five literals, enforced by a CHECK and repeated in several SQL functions and in a closed TypeScript union. The tally, the restock list, and the item page all assume those five. All writes go through `security definer` functions, and there is no SQL test harness. The delta is a per-hab-unit table, an optional reference from an item, a discriminated category reference in TypeScript, three new write functions, a widened item-save function, and the UI to drive them.

## Desired End State

On `/inventory` a member creates a category and sees its panel before the built-ins. They assign it from the item page's Category select with the existing Save. Each custom panel header has a rename control and a delete control, and delete asks for a second press. A member of another hab unit sees none of it.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Built-ins | Stay global text values. Custom categories are additional and belong to one hab unit. | No backfill, no reseed, and catalog defaults and existing rows stay untouched. | Q1, user |
| Create entry point | A separate create control on `/inventory` with its own server action. Assignment stays on the item-page save. | Creation stays independent of the count, minimum, and stale-write check. | Q2, user |
| Name rules | Trim, 1 to 40 characters, unique in the hab unit ignoring case, different from the five built-in labels. A duplicate is a field error. | No two panels named alike, and a clear error. | Q3, user |
| Delete | Confirm, then one RPC moves the items to Uncategorized and removes the category. Counts and minimums stay. No undo. | No lost items or counts, and no partial delete. | Q4, user |
| Rename | A stable id. Rename changes only the name, so items keep the assignment and the panel keeps its position. A case-only rename is allowed. A colliding name is a field error. | Items point at an id, so rename touches one row and cannot race with item saves. | Q5, user |
| Order | Custom panels before the built-ins, earliest created first. No reorder. | User decision. Creation time needs no new column. | User |
| Controls | Rename and delete on each custom panel header on `/inventory`. None on built-ins or Restock. | User default, not objected to. | User |
| Access | Any hab unit member can create, rename, and delete. | Members share every other write. | User |
| Stale save | Deleting a category while its item page is open makes the later save return the existing stale-save message. | Reuses the `serialization_failure` path. | User |
| Catalog | Catalog lookup still assigns only a built-in category. | Out of TEC-52. | User |
| Panel rules | A custom panel uses the same warning icon and open-by-default rules. An empty one still shows. | One set of rules for every panel. | User |
| Isolation | A composite foreign key ties an item and its category to the same hab unit, and the RPCs take the hab unit from `auth.uid()`. | Isolation holds even if one function has a bug. | Plan, code research |
| Phases | Five phases, in the order approved. | User approval. | User |

## Scope

**In scope:**

- A per-hab-unit category table with member-only read access
- Create, assign, rename, and delete for custom categories
- Custom panels on `/inventory` and `/inventory/restock`, and custom options in the item-page select
- Help copy that describes custom categories

**Out of scope:**

- Reordering categories
- Per-hab-unit built-ins, or rename and delete of a built-in
- Changes to catalog lookup, the create form, or bulk import
- Undo or archive of a deleted category
- Sibling issues TEC-58, TEC-59, TEC-60, and the other open follow-ups
- Edits to `context/foundation/roadmap.md` and `context/foundation/prd.md`

## Approach

Each phase leaves the app working. First add the table and teach every reader about a custom category, with no writer, so the UI does not change. Then add the writers one by one, each as a `security definer` function in the pattern of `hide_household_item`: create, then assign by widening the item-save function, then rename, then delete with the help copy. A category is a row with a stable id, and an item points at it by id or holds a built-in value, never both.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Per-hab-unit category store and read path | Table, item reference, category reference model, loaders, grouping with custom groups first | The new CHECK and composite foreign key, and a UI refactor that must not change a pixel |
| 2. Create a custom category | Create function, name validation, server action, create control on `/inventory` | Isolation between hab units, with no SQL test harness |
| 3. Assign a custom category to an item | Widened `set_household_item_levels`, item-page select, save action | The replacement function must keep the count, minimum, stale, and weekly-use rules |
| 4. Rename a custom category | Rename function, wrapper, action, panel header control | Header markup change must leave built-in panels identical |
| 5. Delete a custom category and update the help copy | Delete function, confirm control, help copy, two-hab-unit walk | A delete racing with an assignment, and the migrations applied to a linked project |

## Risks and Assumptions

- PRD FR-018 names five fixed panels. This change adds per-hab-unit panels beside them, and the PRD text is not edited here.
- The repo has no SQL tests. Isolation and name rules are checked by hand in rolled-back transactions, so a second account that owns its own hab unit is needed. If none is available, that check stays open with the reason.
- Migrations are applied with `pnpm exec supabase db push` to the linked project. The README names no production project, so the link is confirmed and a snapshot is taken before each push.
- Phase 3 replaces a function signature. The Phase 3 code and its migration must go out together.
- Vitest runs only `*.test.ts` in `node`. A component that imports a server action is not markup-tested, and its pure parts are tested instead.
- A category deleted between the category load and the tally load is handled by loading categories first, and by placing an unknown custom id in Uncategorized.

## Success Criteria

- A member can create a category for the current hab unit, and it can be assigned to its items.
- A second hab unit does not list categories created for the first hab unit.
- A member can rename a custom category without losing its items or its position, and a colliding name shows a field error.
- A member can delete a custom category after a confirm step, and its items move to Uncategorized with their counts and minimums.
- Custom panels render before the built-ins, earliest created first, with the same warning icon and open rules.
