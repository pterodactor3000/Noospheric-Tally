# Create Categories Per Hab Unit Implementation Plan

## Overview

A member can create a category that exists only for the current hab unit, assign it to items, rename it, and delete it. Custom categories sit beside the five built-in categories and render before them, earliest created first. This is Linear TEC-52 (parent TEC-46, tracker only). There is no roadmap item and no PRD requirement id for it. The two TEC-52 acceptance criteria are the scope:

- Given the current hab unit, when a member creates a category, then that category exists only for this hab unit and can be assigned to its items.
- Given a second hab unit, when a member opens it, then it does not list categories created for the first hab unit.

Rename and delete were added to the scope by the user on 2026-11-03. Reordering was not.

Roadmap: None. `context/foundation/roadmap.md` S-11 (`inventory-category-panels`) is a different, shipped change. This plan pulls no scope from it.

Confirmed decisions, not reopened:

- Q1: Built-ins stay global. Custom categories are additional and belong to one hab unit.
- Q2: A separate create control on `/inventory` with its own server action. Assignment stays on the existing item-page save path.
- Q3: Trim the name, 1 to 40 characters, unique in the hab unit ignoring case, different from the five built-in labels. A duplicate is a field error.
- Q4: Delete confirms, then one RPC moves that category's items to Uncategorized and removes the category. Counts and minimums stay. No undo.
- Q5: Stable id. Rename changes only the name. Items keep the assignment. Creation-time position stays. A case-only rename of the same category is allowed. A colliding name is a field error.
- Custom categories render before the built-ins, earliest created first. No reorder.
- Rename and delete controls sit on each custom panel header on `/inventory`. Built-in panels have neither.
- Any hab unit member can create, rename, and delete that hab unit's custom categories.
- Deleting a category while its item page is open makes the later save return the existing stale-save message.
- Catalog lookup still assigns only a built-in category.
- A custom panel uses the same warning icon and open-by-default rules as the built-ins.
- An empty custom category still shows its panel.

## Current State Analysis

Storage:

- `household_inventory` is keyed `(household_id, item_id)` (`supabase/migrations/20260916120209_create_items.sql:24-37`). Its `category text not null default 'uncategorized'` column carries a CHECK limited to five literals (`20261030190000_add_household_inventory_category.sql:1-8`). There is no categories table.
- `household_inventory` has only a member SELECT policy (`20260916120209_create_items.sql:43-53`). Every write goes through a `security definer` function that resolves the caller's hab unit from `auth.uid()`. `hide_household_item` is the smallest example (`20261101100000_hide_household_item.sql:1-35`).
- Each account belongs to one hab unit, because `household_members` has `unique (user_id)` (`20260816083017_create_households.sql:20`). The current hab unit is whatever RLS lets the caller select (`src/lib/hab-unit/load-current-hab-unit.ts:9-15`). A "second hab unit" can only be checked with a second account.

SQL that hardcodes the list:

- The latest `set_household_item_levels` rejects any category outside the five literals for both `expected_category` and `new_category`, updates `category`, and uses `category = expected_category` as the stale guard (`20261102110000_record_item_detail_uses.sql:53-83`). It raises `serialization_failure` on a stale row (`:85-97`). It writes one `household_quantity_changes` row per unit removed (`:99-116`). A quantity above 99 and a minimum above 999 are rejected (`:39-47`).
- `create_item` repeats the list (`20261030191000_create_item_with_category.sql:37-46`). `create_items_bulk`, `create_item_without_barcode`, and `add_item_to_household` take the column default (`20261031190000_create_items_bulk.sql:80`, `20261030081821_create_item_without_barcode.sql:34`, `20260916120209_create_items.sql:186`). They keep working unchanged.
- An earlier migration drops the old function before it creates a new signature (`20261030210000_set_household_item_levels_expected_category.sql:1`).

TypeScript:

- `ITEM_CATEGORIES`, `ItemCategory`, `ITEM_CATEGORY_LABELS`, and `isItemCategory` are a closed union (`src/lib/items/item-category.ts:1-35`).
- `readHabUnitTallyLine` rejects any category that `isItemCategory` does not accept, and `loadHabUnitTallyLines` then throws (`src/lib/items/load-hab-unit-items.ts:45-71,89-96`). A custom value would break `/inventory`. `HabUnitTallyLine.category` is `ItemCategory` (`:6-12`).
- Three loaders select `category`: `load-hab-unit-items.ts:78`, `load-hab-unit-item-by-id.ts:12`, and `load-hab-unit-item-by-barcode.ts:17-23,45-47,59`.
- `groupTallyLinesByCategory` builds its groups from the constant list and drops a line whose category is unknown (`src/lib/items/group-tally-lines-by-category.ts:1-28`). `rankRestockLines` copies `category` (`src/lib/items/rank-restock-lines.ts:16-23`). `getCategoryShortage` and `resolveCategoryPanelOpen` take no category (`get-category-shortage.ts:3-24`, `resolve-category-panel-open.ts:8-23`), so they work for custom panels as they are.

UI:

- `InventoryTally` keys `toggled`, `shortageByCategory`, and `countByCategory` on `ItemCategory`, reads labels from `ITEM_CATEGORY_LABELS`, and builds `panelId` as `inventory-category-<category>` (`src/app/inventory/inventory-tally.tsx:134-154,217-250`). `RestockList` does the same with `restock-category-<category>` (`src/app/inventory/restock/restock-list.tsx:64-108`).
- `InventoryCategoryPanel` renders the header as one full-width `<button>` inside an `<h2>` (`src/app/inventory/inventory-category-panel.tsx:74-104`). A panel with no items shows "Nothing in this category." (`:117`).
- `/inventory` loads tally lines in the server page and renders `InventoryTally` plus the action buttons (`src/app/inventory/page.tsx:39-70`). `/inventory/restock` loads the same lines (`src/app/inventory/restock/page.tsx:19-31`).
- The item page passes `item.category` to `ItemLevelEditor` (`src/app/inventory/[itemId]/page.tsx:31-56`). The editor builds its Category select from `ITEM_CATEGORIES`, posts `category` and `expectedCategory` as built-in strings, and shows the unsaved color when the selection differs (`src/app/inventory/[itemId]/item-level-editor.tsx:127-135,182,204,274-311`). The hide control already uses a first-press-arms, second-press-confirms button (`:345-363`).
- `saveItemLevels` guards both category fields with `isItemCategory`, calls `setHabUnitItemLevels`, and returns `STALE_ITEM_LEVELS_MESSAGE` for a stale save (`src/app/inventory/actions.ts:484-550`, message at `:85`). `setHabUnitItemLevels` sends `expected_category` and `new_category` and maps SQLSTATE `40001` to `stale` (`src/lib/items/set-hab-unit-item-levels.ts:4-8,46-71`).
- `createItem` and the catalog lookup assign only built-in categories (`src/app/inventory/actions.ts:139-148`, `src/lib/catalog/lookup-catalog-name.ts:51-57,88`). They stay as they are.
- `validateItemName` is the validator pattern (`src/lib/items/validate-item-name.ts:1-31`). `createNewItem` and `hideHabUnitItem` are the RPC wrapper pattern with a structural client type (`src/lib/items/create-new-item.ts:10-46`, `src/lib/items/hide-hab-unit-item.ts:3-29`). `BarcodelessItemForm` is the inline form pattern with `useActionState`, `FormAlert`, and `Disclosure` (`src/app/inventory/new/barcodeless-item-form.tsx:17-55`).
- The help topics name the five categories in text (`src/app/help/help-topics.ts:38,41,201`).

Tests and tooling:

- Vitest runs `src/**/*.test.ts` only, in `node` (`vitest.config.ts:14-15`). Component markup tests use `createElement` with `renderToStaticMarkup`, as `src/components/ui/input.test.ts:1-3` does. A component that imports a server action is not tested this way. Its pure parts are tested instead.
- The repo has no SQL tests and no `supabase/config.toml`. Migrations are applied to the linked project with `pnpm exec supabase db push` (`README.md:42-51`). SQL behavior is checked by hand in a rolled-back transaction.
- Shared checks are `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` (`README.md:53-63`). Tests run with `pnpm test`.

## Desired End State

A member of a hab unit opens `/inventory`. A create control sits on the page, and it works when the tally is empty. The member types a name, and a new empty panel appears before Pet food. A second custom category appears after the first and before Pet food. The member opens an item, picks the custom category in the Category select, presses Save, and the item shows in that panel. A header control renames the category without losing its items or its position. A second header control, after a confirm press, moves its items to Uncategorized and removes the category. A member of another hab unit sees none of this hab unit's categories, and can create a category with the same name.

Verify with the unit tests under each phase, the migrations applied with `supabase db push`, rolled-back SQL checks of isolation, and the two-hab-unit manual walk in Phase 5.

## What We're NOT Doing

- Reordering categories. Order is creation time, earliest first.
- Changing the catalog mapping. Catalog lookup, the create form, bulk import, and the barcode-less create keep assigning only built-in categories.
- Per-hab-unit built-ins. The five built-ins stay global text values. No seeding, no backfill, no rename or delete of a built-in.
- Rename or delete controls on built-in panels, and on the Restock page.
- Undo or archive of a deleted category.
- Sibling issues TEC-58, TEC-59, TEC-60, and every other open follow-up under TEC-46.
- Editing `context/foundation/roadmap.md` or `context/foundation/prd.md`. PRD FR-018 names five fixed panels and stays as written.
- Changing the stock-state ranking, the shortage rules, search, sort, or the group toggle.

## Implementation Approach

Split the work so every phase leaves the app working and is testable alone.

1. Phase 1 adds the store and teaches every reader about a custom category, with no writer. The UI is unchanged because no custom category exists yet.
2. Phase 2 adds the one writer that creates a category, plus the create control. This proves the isolation criterion.
3. Phase 3 widens the existing item-save RPC so an item can carry a custom category, plus the select options. This proves the assign criterion.
4. Phase 4 adds rename.
5. Phase 5 adds delete and the help copy, then walks the whole feature across two hab units.

The writers follow the existing pattern: one `security definer` function per write with `set search_path = ''`, the caller's hab unit taken from `auth.uid()`, and `revoke all ... from public, anon` then `grant execute ... to authenticated` (`20261101100000_hide_household_item.sql:1-35`). The new table has a SELECT policy for members and no write policy, like `household_inventory`.

A custom category is a row in a new table. An item points at it with a nullable `custom_category_id`. The built-in text column becomes nullable, and a CHECK says exactly one of the two is set. A composite foreign key ties the item and the category to the same hab unit, so a cross-hab-unit assignment is impossible even if an RPC has a bug. The built-ins are not copied into the table, because Q1 keeps them global.

On the TypeScript side a discriminated union `ItemCategoryRef` replaces the bare `ItemCategory` on a tally line. Grouping takes the hab unit's custom categories and returns custom groups first.

## Critical Implementation Details

- Read the relevant guide in `node_modules/next/dist/docs/` before writing any server action or form in Phases 2, 4, and 5. `AGENTS.md` says this Next.js version has breaking changes.
- Load custom categories before the tally lines, so a category deleted between the two queries never leaves a line pointing at a category the page cannot find. If a line still points at an unknown custom id, grouping puts it in the Uncategorized group and does not throw, because the render runs in a client component.
- Keep the `category` text column's existing CHECK (`household_inventory_category_values`, `20261030190000_add_household_inventory_category.sql:4-8`). A NULL passes it. Add the exactly-one rule as a new CHECK. Keep the column default `'uncategorized'`, so the other writers in the Current State section keep working, and set `custom_category_id` only from `set_household_item_levels`, which also nulls `category`.
- The composite foreign key must use `on delete no action`, not `restrict`, so deleting a whole hab unit can cascade to both `household_inventory` and `household_categories` in one statement.
- `delete_household_category` locks the category row with `for update`. `set_household_item_levels` locks the target category row with `for share` before it assigns. This orders a delete and an assignment, so an item can never end up pointing at a removed category.
- A save that targets a category that no longer exists, or one that belongs to another hab unit, raises `serialization_failure`. The existing `40001` mapping then returns the existing stale-save message and reveals nothing about other hab units.
- Phase 3 replaces `set_household_item_levels` and must keep everything from `20261102110000_record_item_detail_uses.sql:39-116`: the 0 to 99 count rule, the 0 to 999 minimum rule, the stale guard, and the weekly-use rows for a saved decrease. Copy the body and change only the category handling.
- The category form value format is the built-in literal, or `custom-<uuid>`. No built-in literal starts with `custom-`, so the format parses without ambiguity. The same key builds the panel ids, `inventory-category-pet-food` keeps its current id, and a custom panel is `inventory-category-custom-<uuid>`.
- `lessons.md` applies. Phase 1 is a refactor that must leave the UI unchanged, so it is checked with a zero-pixel screenshot diff. Phase 4 changes the panel header markup, so it repeats that check for the built-in panels.

## Phase 1: Per-hab-unit category store and read path

### Overview

Add the table and the item reference, then make every reader and the grouping understand a custom category. No writer exists yet, so the UI does not change.

### Changes Required

#### 1. Migration for the store

**File:** `supabase/migrations/20261103090000_create_household_categories.sql` (new)

**Intent:** Give each hab unit its own list of categories, and let an item point at one.

**Contract:**

- Table `public.household_categories` with `id uuid primary key default gen_random_uuid()`, `household_id uuid not null references public.households(id) on delete cascade`, `name text not null`, and `created_at timestamptz not null default now()`.
- The name rule is `char_length(name) between 1 and 40` and `name = trim(name)`.
- A unique index on `(household_id, lower(name))` enforces case-insensitive uniqueness per hab unit.
- `unique (id, household_id)`, so `household_inventory` can reference the pair.
- RLS is enabled. One SELECT policy `household_categories_select_if_member` for `authenticated` follows `household_inventory_select_if_member` (`20260916120209_create_items.sql:43-53`). There is no insert, update, or delete policy.
- `household_inventory` gains `custom_category_id uuid`. Its `category` column drops `not null`. A new CHECK is `num_nonnulls(category, custom_category_id) = 1`.
- A composite foreign key `(custom_category_id, household_id)` references `public.household_categories (id, household_id)` with `on delete no action`. With the default match type, a null `custom_category_id` skips the check.

#### 2. Category reference model

**File:** `src/lib/items/item-category-ref.ts` (new), `src/lib/items/item-category-ref.test.ts` (new)

**Intent:** Replace a bare built-in value with a reference that can also name a custom category, and give the form and the panels one key format.

**Contract:**

```typescript
interface BuiltInCategoryRef {
  readonly kind: 'built-in'
  readonly category: ItemCategory
}

interface CustomCategoryRef {
  readonly kind: 'custom'
  readonly categoryId: string
}

type ItemCategoryRef = BuiltInCategoryRef | CustomCategoryRef
```

- `getCategoryRefKey(ref)` returns the built-in literal, or `custom-<id>`. It is pure.
- `parseCategoryRefKey(value: unknown)` returns an `ItemCategoryRef` or `null`. It accepts a built-in literal, or `custom-` followed by a UUID checked with `isScanSessionId` (`src/lib/items/scan-session.ts:4-8`). Anything else returns `null`.
- `getCategoryRpcArgs(ref)` returns `{ category: string | null, customCategoryId: string | null }` with exactly one set. Phase 3 uses it.

#### 3. Read the custom categories

**File:** `src/lib/items/load-hab-unit-categories.ts` (new), `src/lib/db/entities.ts`

**Intent:** Load the current hab unit's custom categories. RLS limits the rows to that hab unit.

**Contract:**

- `interface HabUnitCategory { readonly id: string; readonly name: string; readonly createdAt: string }`.
- `loadHabUnitCategories(): Promise<HabUnitCategory[]>` selects `id, name, created_at` from `household_categories`. It throws `household_categories select failed` with the error as `cause`, and it throws on a row that fails a type guard.
- `src/lib/db/entities.ts` gains `DB_TABLE_HOUSEHOLD_CATEGORIES`. Place it beside the other table constants (`src/lib/db/entities.ts:1-6`).

#### 4. Tally line and loaders

**File:** `src/lib/items/load-hab-unit-items.ts`, `src/lib/items/load-hab-unit-item-by-id.ts`, `src/lib/items/load-hab-unit-item-by-barcode.ts`, `src/lib/items/rank-restock-lines.ts`

**Intent:** Let a tally line carry a built-in or a custom category.

**Contract:**

- `HabUnitTallyLine.category` changes from `ItemCategory` to `ItemCategoryRef` (`load-hab-unit-items.ts:6-12`).
- `readHabUnitTallyLine` reads `category` as a string or null and `custom_category_id` as a string or null. It returns a line only when exactly one is set. A built-in must pass `isItemCategory`, and a custom id must pass `isScanSessionId`. Any other row returns `null`.
- The three selects add `custom_category_id`. The barcode loader's row type allows `category: string | null` and adds `custom_category_id: string | null` (`load-hab-unit-item-by-barcode.ts:17-23`).
- `rankRestockLines` keeps copying `category` (`rank-restock-lines.ts:21`). No behavior change.

#### 5. Grouping

**File:** `src/lib/items/group-tally-lines-by-category.ts`, `src/lib/items/group-tally-lines-by-category.test.ts`

**Intent:** Return custom groups first, earliest created first, then the five built-ins.

**Contract:**

- Signature `groupTallyLinesByCategory(lines, customCategories)`.
- `CategoryGroup<TLine>` becomes `{ key: string, ref: ItemCategoryRef, label: string, lines: readonly TLine[] }`. `key` is `getCategoryRefKey(ref)`. `label` is the custom name or `ITEM_CATEGORY_LABELS`, so the panels never branch on kind.
- Custom groups are sorted by `createdAt` ascending, with `id` ascending as the tiebreak, and come before the built-ins. Every custom category yields a group, including an empty one. The five built-in groups always yield, as today.
- A line whose custom id is not in `customCategories` is placed in the `uncategorized` group.

#### 6. Pages and panels

**File:** `src/app/inventory/page.tsx`, `src/app/inventory/inventory-tally.tsx`, `src/app/inventory/restock/page.tsx`, `src/app/inventory/restock/restock-list.tsx`

**Intent:** Feed the loaded categories to the grouping, and key panel state on the group key.

**Contract:**

- Both pages call `loadHabUnitCategories()` before `loadHabUnitTallyLines()` and pass `customCategories` as a prop.
- `toggled`, `shortageByCategory`, and `countByCategory` are keyed on `group.key` as `string`. Labels come from `group.label`. `panelId` is `inventory-category-<key>` and `restock-category-<key>`, so built-in ids do not change (`inventory-tally.tsx:134-154,217-250`, `restock-list.tsx:64-108`).
- The shortage icon and the open-by-default rules run through `getCategoryShortage` and `resolveCategoryPanelOpen` as they do today.

#### 7. Tests

**File:** `src/lib/items/load-hab-unit-items.test.ts`

**Intent:** Cover the new row shapes.

**Contract:** Add cases for a custom-id row, a row with both values set, a row with neither, a row with a non-UUID custom id, and a built-in row, which still returns as before. Existing cases update to the `ItemCategoryRef` shape (`load-hab-unit-items.test.ts:3,16,23`).

### Success Criteria

#### Automated Verification

- `pnpm test` passes, including the new `item-category-ref.test.ts` and the updated `group-tally-lines-by-category.test.ts` and `load-hab-unit-items.test.ts`.
- `pnpm typecheck` passes.
- `pnpm lint` passes with no new warnings in the files this phase touches.
- `rg "household_categories" supabase/migrations` matches only `20261103090000_create_household_categories.sql`. That file contains `enable row level security`, `household_categories_select_if_member`, a composite foreign key from `household_inventory` to `household_categories (id, household_id)`, and `num_nonnulls`. It contains no `for insert`, `for update`, or `for delete` policy.

#### Manual Verification

- After confirming the linked project and taking a snapshot, `pnpm exec supabase db push` applies `20261103090000_create_household_categories.sql` with no error.
- In a rolled-back SQL transaction as a member of hab unit A (set the caller first: `select set_config('request.jwt.claims', '{"sub":"<user uuid>"}', true); set local role authenticated;`), `select` on `household_categories` returns zero rows, and an `insert` into it is refused. As the table owner in a rolled-back transaction, referencing a category of hab unit B from a `household_inventory` row of hab unit A fails with a foreign key error, setting both `category` and `custom_category_id` fails the CHECK, and setting neither fails the CHECK.
- Full-page screenshots of `/inventory` and `/inventory/restock` taken before and after the code change, in light and dark, at a wide viewport and at 390px, with animations frozen, show a zero-pixel diff.
- Signed in with existing data, every item still shows in the same one of the five panels with the same count, the same warning icons, and the same open and closed state.

---

## Phase 2: Create a custom category

### Overview

Add the writer that creates a category for the caller's hab unit, and the create control on `/inventory`. This phase proves the isolation criterion: a category exists for one hab unit only.

### Changes Required

#### 1. Create function

**File:** `supabase/migrations/20261103091000_create_household_category.sql` (new)

**Intent:** One `security definer` function that creates a category in the caller's hab unit.

**Contract:**

- `public.create_household_category(category_name text) returns uuid`, `language plpgsql`, `security definer`, `set search_path = ''`. It follows `hide_household_item` for the caller checks (`20261101100000_hide_household_item.sql:8-22`): it raises when `auth.uid()` is null and when the caller has no hab unit.
- It trims the name and raises when the trimmed length is outside 1 to 40.
- It raises with SQLSTATE `23505` (`unique_violation`) when `lower(trimmed)` equals one of `pet food`, `food`, `beauty`, `other`, `uncategorized`. These are the lowercase built-in labels from `ITEM_CATEGORY_LABELS` (`item-category.ts:17-23`).
- The insert uses the caller's hab unit, never a passed id. A name that matches an existing category of that hab unit ignoring case hits the unique index from Phase 1 and raises `23505` as well.
- `revoke all on function public.create_household_category(text) from public, anon` and `grant execute ... to authenticated`.

#### 2. Name validation

**File:** `src/lib/items/validate-category-name.ts` (new), `src/lib/items/validate-category-name.test.ts` (new)

**Intent:** Validate the name at the system boundary, with the same shape as `validateItemName` (`validate-item-name.ts:1-31`).

**Contract:**

- `validateCategoryName(name: string)` returns `{ status: 'valid', name }` with the trimmed name, or `{ status: 'invalid', message }`.
- It rejects an empty trimmed name and a name over 40 characters. It rejects a name that equals a built-in label ignoring case, after trimming.
- A name such as `Pet foods` is valid.

#### 3. RPC wrapper

**File:** `src/lib/items/create-hab-unit-category.ts` (new), `src/lib/items/create-hab-unit-category.test.ts` (new), `src/lib/db/entities.ts`

**Intent:** Call the create function and turn a duplicate into a result, not an exception.

**Contract:**

- `DB_FUNCTION_CREATE_HOUSEHOLD_CATEGORY = 'create_household_category'` is added to `entities.ts`.
- `createHabUnitCategory(name, client)` returns `{ status: 'created', categoryId }` or `{ status: 'duplicate' }`. SQLSTATE `23505` gives `duplicate`.
- Any other error throws `create_household_category failed for name <name>` with the error as `cause`. A non-string result throws the same way. The client type is structural, like `CreateItemClient` (`create-new-item.ts:10-22`).

#### 4. Server action

**File:** `src/app/inventory/category-actions.ts` (new, `'use server'`)

**Intent:** Keep the three category actions out of the 640-line `actions.ts`.

**Contract:**

- `createCategory(formData)` returns `{ status: 'saved' }` or `{ status: 'error', message, field?: 'name' }`.
- It validates with `validateCategoryName`. A duplicate returns a field error on `name` with a message such as "A category with this name already exists." Any other failure logs `createCategory failed` with the name and the error, and returns the existing `ITEM_WRITE_FAILURE_MESSAGE` (`src/lib/items/scan-failure-messages`).
- On success it calls `revalidatePath('/inventory')` and `revalidatePath('/inventory/restock')`. It does not redirect.

#### 5. Create control

**File:** `src/app/inventory/create-category-form.tsx` (new), `src/app/inventory/page.tsx`

**Intent:** A separate create control on `/inventory`.

**Contract:**

- A client component with `useActionState`, `Disclosure`, `Label`, `Input`, `FormAlert`, and a `Button`, in the pattern of `BarcodelessItemForm` (`new/barcodeless-item-form.tsx:17-55`). The input sets `maxLength` 40.
- It is rendered by the server page, outside `InventoryTally`, so it is present when the tally is empty (`page.tsx:54`, between the tally and the action grid).
- A field error sets `aria-invalid` on the input and keeps the typed text. A saved category clears the field.

### Success Criteria

#### Automated Verification

- `pnpm exec vitest run src/lib/items/validate-category-name.test.ts src/lib/items/create-hab-unit-category.test.ts` passes. The tests cover a valid name, a trimmed name, an empty name, a 40-character name, a 41-character name, a built-in label in any case, `Pet foods`, a created result, a `23505` duplicate result, another rpc error thrown with `cause`, and a non-string result.
- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm lint` passes with no new warnings in the files this phase touches.
- `rg "create_household_category" supabase/migrations` matches only `20261103091000_create_household_category.sql`. That file contains `security definer`, `set search_path = ''`, `auth.uid()`, and `revoke all on function public.create_household_category(text) from public, anon`.

#### Manual Verification

- After confirming the linked project and taking a snapshot, `pnpm exec supabase db push` applies `20261103091000_create_household_category.sql` with no error.
- In a rolled-back SQL transaction as a member of hab unit A, `create_household_category('Cleaning')` returns a uuid and the new row has hab unit A's id. A second call with `'cleaning'`, and a call with `'food'`, each raise `23505`. A blank name and a 41-character name each raise.
- In a rolled-back SQL transaction as a member of a second hab unit B, `select` on `household_categories` returns none of A's rows, and `create_household_category('Cleaning')` succeeds there.
- On `/inventory` as a member of hab unit A, entering `Cleaning` shows a new empty panel before Pet food, with count 0, "Nothing in this category.", and no warning icon. The create control is visible when the tally holds no items.
- Creating `Garden` next shows its panel after Cleaning and before Pet food, and a reload keeps that order.
- Entering a duplicate name, a built-in label, a blank name, or 41 characters shows a field error under the input, creates no panel, and keeps the typed text.
- Signed in as a member of a second hab unit, `/inventory` and `/inventory/restock` list none of the first hab unit's categories (TEC-52 criterion 2).

---

## Phase 3: Assign a custom category to an item

### Overview

Let an item carry a custom category through the existing item-page save. The save keeps its stale check, and rejects a category from another hab unit. This phase proves the assign criterion.

### Changes Required

#### 1. Widen the save function

**File:** `supabase/migrations/20261103092000_set_household_item_levels_custom_category.sql` (new)

**Intent:** Let `set_household_item_levels` read and write a custom category as well as a built-in one.

**Contract:**

- Drop `public.set_household_item_levels(uuid, integer, integer, integer, text, text)` and create `public.set_household_item_levels(target_item_id uuid, new_quantity integer, new_minimum_quantity integer, expected_quantity integer, expected_category text, expected_custom_category_id uuid, new_category text, new_custom_category_id uuid)`, as `20261030210000_set_household_item_levels_expected_category.sql:1` did.
- For each pair, exactly one value is non-null. A built-in value must be one of the five literals. A violation raises `rejects an unknown category`.
- When `new_custom_category_id` is set, the function locks that category's row with `for share`, filtered by the caller's hab unit. If no row is found, it raises `serialization_failure`. This covers a deleted category and a category of another hab unit.
- The update sets `category = new_category` and `custom_category_id = new_custom_category_id`. It matches the item, the caller's hab unit, `quantity = expected_quantity`, `category is not distinct from expected_category`, and `custom_category_id is not distinct from expected_custom_category_id`. A mismatch on an existing row raises `serialization_failure` as before.
- Everything else is copied from `20261102110000_record_item_detail_uses.sql:26-47,75-116`: the count and minimum bounds, the stale and missing-item errors, and the weekly-use rows for a saved decrease.
- `revoke all ... from public, anon` and `grant execute ... to authenticated` use the new eight-argument signature.

#### 2. Wrapper

**File:** `src/lib/items/set-hab-unit-item-levels.ts`, `src/lib/items/set-hab-unit-item-levels.test.ts`

**Intent:** Send the category pair for either kind.

**Contract:**

- `HouseholdItemLevels.expectedCategory` and `.category` become `ItemCategoryRef` (`set-hab-unit-item-levels.ts:9-15`). The rpc args gain `expected_custom_category_id` and `new_custom_category_id`, filled with `getCategoryRpcArgs`. `expected_category` and `new_category` become `string | null`.
- SQLSTATE `40001` still maps to `{ status: 'stale' }` (`:60-62`). Other errors still throw with the item id in the message.
- Tests cover a built-in save, a custom save, a stale result, and another error.

#### 3. Item page

**File:** `src/app/inventory/[itemId]/page.tsx`

**Intent:** Give the editor the item's category reference and the hab unit's custom categories.

**Contract:** The page calls `loadHabUnitCategories()` and passes `customCategories` and `category={item.category}` as an `ItemCategoryRef` to `ItemLevelEditor` (`page.tsx:31-56`).

#### 4. Editor select

**File:** `src/app/inventory/[itemId]/item-level-editor.tsx`

**Intent:** List the custom categories in the Category select, and post the keys.

**Contract:**

- `category` is an `ItemCategoryRef`. `selectedCategory` state holds a key string. The hidden `expectedCategory` field carries `getCategoryRefKey(category)` (`item-level-editor.tsx:182,204`).
- The select lists the custom categories first, in creation order, then the five built-ins, the same order as the panels. Each option value is the key. The bracketed label shows the selected name (`:284-310`).
- The unsaved color compares keys (`:277`). An onChange value that `parseCategoryRefKey` rejects is ignored, as `isItemCategory` rejected one before (`:297-300`).

#### 5. Save action

**File:** `src/app/inventory/actions.ts`

**Intent:** Parse the two category fields as references.

**Contract:** `saveItemLevels` replaces both `isItemCategory` guards with `parseCategoryRefKey` and passes the references to `setHabUnitItemLevels` (`actions.ts:493-496,520-531,535-544`). A rejected value still logs and returns `ITEM_WRITE_FAILURE_MESSAGE`. A stale result still returns `STALE_ITEM_LEVELS_MESSAGE` (`:85`). The `createItem` category fallback and every other caller stay as they are (`:139-148`).

### Success Criteria

#### Automated Verification

- `pnpm exec vitest run src/lib/items/item-category-ref.test.ts src/lib/items/set-hab-unit-item-levels.test.ts` passes. The key round-trip, an invalid key, a built-in save, a custom save, a stale result, and another error are covered.
- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm lint` passes with no new warnings in the files this phase touches.
- The newest `set_household_item_levels` definition is in `20261103092000_set_household_item_levels_custom_category.sql`. It contains `drop function public.set_household_item_levels(uuid, integer, integer, integer, text, text)`, `new_quantity > 99`, `household_quantity_changes`, `serialization_failure`, `for share`, and `revoke all on function public.set_household_item_levels(uuid, integer, integer, integer, text, uuid, text, uuid) from public, anon`.

#### Manual Verification

- After confirming the linked project and taking a snapshot, `pnpm exec supabase db push` applies `20261103092000_set_household_item_levels_custom_category.sql` with no error.
- In a rolled-back SQL transaction as a member of hab unit A, saving an item with A's custom category id sets `custom_category_id` and nulls `category`. Passing a category id of hab unit B raises `serialization_failure`. Passing a wrong `expected_custom_category_id` raises `serialization_failure`. Saving a built-in category still works, and saving a lower count still writes one `household_quantity_changes` row per unit removed.
- On an item page as a member of hab unit A, the Category select lists the custom categories first in creation order, then Pet food, Food, Beauty, Other, and Uncategorized.
- Picking `Cleaning` and pressing Save returns to `/inventory`, and the item is listed under the Cleaning panel with its count. The panel shows its count and the shortage icon rules apply. If the item is CRITICAL, it also appears under Cleaning on `/inventory/restock`.
- Reopening the item shows Cleaning selected. The Category row turns the unsaved color when the selection differs from the saved one, and moving it back to Food and saving leaves the item in Food.
- A new item created from `/inventory/new` still lands in a built-in category.

---

## Phase 4: Rename a custom category

### Overview

Add rename. The id, the item assignments, and the creation-time position do not change. The control sits on each custom panel header on `/inventory`.

### Changes Required

#### 1. Rename function

**File:** `supabase/migrations/20261103093000_rename_household_category.sql` (new)

**Intent:** Change only the name of one category of the caller's hab unit.

**Contract:**

- `public.rename_household_category(target_category_id uuid, new_name text) returns void`, `security definer`, `set search_path = ''`, with the same caller checks and the same revoke and grant as Phase 2.
- It trims the name and applies the Phase 2 rules: length 1 to 40, and a built-in label raises `23505`.
- It updates `name` only, on the row with `id = target_category_id` and the caller's hab unit. A collision with another category's name hits the unique index and raises `23505`. A rename that changes only the case of the row's own name succeeds, because the index excludes the row being updated.
- When no row matches, it raises with SQLSTATE `P0002` (`no_data_found`).

#### 2. Wrapper

**File:** `src/lib/items/rename-hab-unit-category.ts` (new), `src/lib/items/rename-hab-unit-category.test.ts` (new), `src/lib/db/entities.ts`

**Intent:** Turn the three outcomes into a result.

**Contract:**

- `DB_FUNCTION_RENAME_HOUSEHOLD_CATEGORY` is added to `entities.ts`.
- `renameHabUnitCategory({ categoryId, name }, client)` returns `{ status: 'renamed' }`, `{ status: 'duplicate' }` for `23505`, or `{ status: 'missing' }` for `P0002`. Any other error throws with the category id and name in the message and the error as `cause`.

#### 3. Server action

**File:** `src/app/inventory/category-actions.ts`

**Intent:** Add the rename action.

**Contract:** `renameCategory(formData)` checks that `categoryId` passes `isScanSessionId` and the name passes `validateCategoryName`. A duplicate returns a field error on `name`. A missing category returns the message "That category no longer exists. Reload the page." Success revalidates `/inventory` and `/inventory/restock` and returns `{ status: 'saved' }`.

#### 4. Panel header actions

**File:** `src/app/inventory/inventory-category-panel.tsx`, `src/app/inventory/inventory-category-panel.test.ts` (new)

**Intent:** Let a panel show controls beside its toggle without nesting a button inside a button.

**Contract:**

- `InventoryCategoryPanel` takes an optional `actions: ReactNode`. When `actions` is absent, the header markup is byte-identical to today (`inventory-category-panel.tsx:74-104`). When it is present, the `<h2>` holds a row with the existing toggle button at `flex-1` and the actions as a sibling, never inside the `<button>`.
- The test renders the panel with `renderToStaticMarkup` and checks that the output without `actions` matches the pre-change markup, and that with `actions` the control sits outside the `<button>`.

#### 5. Rename control

**File:** `src/app/inventory/custom-category-controls.tsx` (new), `src/app/inventory/inventory-tally.tsx`

**Intent:** A rename control on each custom panel header only.

**Contract:**

- A client component with a Rename button that opens an inline form: an input prefilled with the current name and `maxLength` 40, a Save button, a Cancel button, and a `FormAlert` for the field error. Cancel closes the form without a request.
- `InventoryTally` passes it as `actions` only when `group.ref.kind === 'custom'`. Built-in panels pass nothing. Restock passes nothing.
- A saved rename closes the form. The panel keeps its position and its items, because the category id and `createdAt` do not change.

### Success Criteria

#### Automated Verification

- `pnpm exec vitest run src/lib/items/rename-hab-unit-category.test.ts src/app/inventory/inventory-category-panel.test.ts` passes. The tests cover renamed, duplicate, missing, another error thrown with `cause`, the unchanged markup without `actions`, and the control placed outside the toggle `<button>`.
- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm lint` passes with no new warnings in the files this phase touches.
- `rg "rename_household_category" supabase/migrations` matches only `20261103093000_rename_household_category.sql`. That file contains `security definer`, `set search_path = ''`, `auth.uid()`, `P0002`, and `revoke all on function public.rename_household_category(uuid, text) from public, anon`.

#### Manual Verification

- After confirming the linked project and taking a snapshot, `pnpm exec supabase db push` applies `20261103093000_rename_household_category.sql` with no error.
- In a rolled-back SQL transaction as a member of hab unit A, renaming `Cleaning` to `Garden` raises `23505` when `Garden` exists. Renaming `Cleaning` to `CLEANING` succeeds and keeps the same id. Renaming a category id of hab unit B raises `P0002`. The assigned items still point at the same id after a rename.
- On `/inventory`, each custom panel header shows a rename control, and the built-in panels show none. Renaming `Cleaning` to `Cleaners` shows the new label, keeps the items inside, and keeps the panel's position. A reload shows the same.
- Renaming to another category's name, to a built-in label, to a blank name, or to 41 characters shows a field error and changes nothing. A case-only rename succeeds.
- The item page Category select shows the new name.
- Full-page screenshots of `/inventory` with only built-in panels, before and after this phase, in light and dark at a wide viewport and at 390px, show a zero-pixel diff.

---

## Phase 5: Delete a custom category and update the help copy

### Overview

Add delete with a confirm step. One function moves the items to Uncategorized and removes the category. Update the help text, then walk the whole feature across two hab units.

### Changes Required

#### 1. Delete function

**File:** `supabase/migrations/20261103094000_delete_household_category.sql` (new)

**Intent:** Move a category's items to Uncategorized and remove the category in one transaction.

**Contract:**

- `public.delete_household_category(target_category_id uuid) returns void`, `security definer`, `set search_path = ''`, with the same caller checks and the same revoke and grant as Phase 2.
- It locks the category row with `for update`, filtered by `id` and the caller's hab unit. When no row is found, it raises `P0002`.
- It updates every `household_inventory` row of the caller's hab unit with `custom_category_id = target_category_id` to `category = 'uncategorized'` and `custom_category_id = null`. It changes no other column, so counts and minimums stay, and it writes no `household_quantity_changes` row.
- It deletes the category row. Both statements run in the function's one transaction.

#### 2. Wrapper

**File:** `src/lib/items/delete-hab-unit-category.ts` (new), `src/lib/items/delete-hab-unit-category.test.ts` (new), `src/lib/db/entities.ts`

**Intent:** Call the function and report a missing category.

**Contract:**

- `DB_FUNCTION_DELETE_HOUSEHOLD_CATEGORY` is added to `entities.ts`.
- `deleteHabUnitCategory(categoryId, client)` returns `{ status: 'deleted' }` or `{ status: 'missing' }` for `P0002`. Any other error throws with the category id in the message and the error as `cause`.

#### 3. Server action

**File:** `src/app/inventory/category-actions.ts`

**Intent:** Add the delete action.

**Contract:** `deleteCategory(formData)` checks `categoryId` with `isScanSessionId`. A missing category returns the same "no longer exists" message as rename. Success revalidates `/inventory` and `/inventory/restock` and returns `{ status: 'saved' }`. There is no undo.

#### 4. Delete control

**File:** `src/app/inventory/custom-category-controls.tsx`, `src/app/inventory/inventory-tally.tsx`

**Intent:** A delete control with a confirm step on each custom panel header.

**Contract:**

- It follows the arming pattern of the hide button (`item-level-editor.tsx:345-363`). The first press arms the button and changes its label to `Confirm delete. Items move to Uncategorized`. The second press submits. A Cancel button shows while it is armed and disarms it.
- It shows only on custom panels, next to the rename control. Built-in panels show none.

#### 5. Help copy

**File:** `src/app/help/help-topics.ts`, `src/app/help/help-topics.test.ts`

**Intent:** Say that a hab unit can have its own categories, and how to create, rename, and delete them.

**Contract:** Update the tally topic (`help-topics.ts:38,41`), the search and categories topic (`:53-58`), and the item details topic (`:201`) to describe custom categories, their order before the built-ins, and the create, rename, and delete controls. Update the assertions in `help-topics.test.ts` that depend on the old text (`:91-96,122`). Screenshot references stay as they are.

### Success Criteria

#### Automated Verification

- `pnpm exec vitest run src/lib/items/delete-hab-unit-category.test.ts src/app/help/help-topics.test.ts` passes. The wrapper tests cover deleted, missing, and another error thrown with `cause`.
- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm lint` passes with no new warnings in the files this phase touches.
- `pnpm worker:check` passes.
- `rg "delete_household_category" supabase/migrations` matches only `20261103094000_delete_household_category.sql`. That file contains `security definer`, `set search_path = ''`, `auth.uid()`, `for update`, `P0002`, and `revoke all on function public.delete_household_category(uuid) from public, anon`. The function does not write `quantity` or `minimum_quantity`.

#### Manual Verification

- After confirming the linked project and taking a snapshot, `pnpm exec supabase db push` applies `20261103094000_delete_household_category.sql` with no error.
- In a rolled-back SQL transaction as a member of hab unit A, deleting a category that holds two items leaves both items with `category = 'uncategorized'`, `custom_category_id` null, and the same `quantity` and `minimum_quantity`. The category row is gone and no `household_quantity_changes` row was added. Deleting a category id of hab unit B raises `P0002`.
- On `/inventory`, the first press on a custom panel's delete control arms it and the second press deletes. The items appear under Uncategorized with the same counts, and the panel disappears. Cancel disarms it. Built-in panels show no delete control. There is no undo control.
- With an item page open in a second tab on a deleted category, pressing Save returns "The count changed. Reload the page before saving." Pressing Save with the deleted category chosen in the select from a stale page returns the same message.
- Signed in as a member of a second hab unit, the same custom name can be created, assigned, renamed, and deleted without changing the first hab unit's categories or items. The first hab unit's list is unchanged throughout.
- The help page describes custom categories, their order, and the create, rename, and delete controls.
- A final run through `/inventory` and `/inventory/restock` at a wide viewport and at 390px, in light and dark, shows custom panels before the built-ins, earliest created first, with no layout break.

---

## Testing Strategy

### Unit Tests

- `item-category-ref`: the key round-trip for a built-in and a custom category, a `custom-` prefix with a non-UUID suffix, an unknown string, `null`, and `getCategoryRpcArgs` setting exactly one value.
- `groupTallyLinesByCategory`: custom groups first, earliest created first, ties broken by id, an empty custom group present, built-ins still in the fixed order, and a line with an unknown custom id placed in Uncategorized.
- `readHabUnitTallyLine`: a built-in row, a custom row, a row with both values, a row with neither, a non-UUID custom id, and an unknown built-in value.
- `validateCategoryName`, `createHabUnitCategory`, `renameHabUnitCategory`, `deleteHabUnitCategory`, and `setHabUnitItemLevels`: success, each named error code, other errors thrown with `cause`, empty, null, and boundary lengths of 1, 40, and 41.
- `InventoryCategoryPanel`: unchanged markup without `actions`, and the actions placed outside the toggle button.

### Integration Tests

- No database test harness exists. Each migration is applied with `pnpm exec supabase db push` and checked by hand in a rolled-back transaction, with the caller set as an authenticated member of a hab unit. The checks cover isolation between two hab units, the name rules, the stale rules, and the move on delete.

### Manual Testing Steps

1. Apply each phase's migration with `pnpm exec supabase db push` to the project the app points at.
2. Use `http://localhost:3000`. Sign in with `TEST_EMAIL` and `TEST_PASSWORD` read from `.env` inside the script. Do not print them.
3. Create a category, assign an item to it, rename it, and delete it, as the Phase 2 to 5 checks describe.
4. Sign in as a member of a second hab unit and repeat the isolation checks. This needs a second account that has created its own hab unit. If none is available, leave the check open with the reason.

## Migration and Rollback

Four additive migrations and one replacement:

- `20261103090000_create_household_categories.sql` adds a table, a column, a CHECK, and a foreign key, and drops `not null` on `household_inventory.category`. Every existing row keeps its built-in value, so no backfill is needed and the new CHECK holds for all existing rows.
- `20261103091000_create_household_category.sql`, `20261103093000_rename_household_category.sql`, and `20261103094000_delete_household_category.sql` each add a function.
- `20261103092000_set_household_item_levels_custom_category.sql` replaces `set_household_item_levels` with an eight-argument signature. The app code that calls the old signature must not ship before this migration is applied, and the new migration must not be applied without the Phase 3 code. Apply it immediately before deploying Phase 3.

`db push` writes to the project linked in this checkout (`pnpm exec supabase link --project-ref <project-id>`, `README.md:44-51`). The README does not name a production project. Confirm the link and take a snapshot of that project before each push.

Rollback after Phase 1 or 2: drop the new functions and table. Rollback after Phase 3 needs the old function restored and any item with a custom category moved back to a built-in value first, because the old function cannot read `custom_category_id`. Run the Phase 5 delete behavior as a one-off for each category before dropping the table.

## References

- Roadmap: None. `context/foundation/roadmap.md` (S-11 is a different, shipped change).
- PRD: None. No PRD requirement id covers this change. FR-018 (`context/foundation/prd.md:172,198`) names five fixed panels and is not edited here.
- Linear: TEC-52, https://linear.app/tech-heresy/issue/TEC-52/feat-create-categories-per-hab-unit. Parent TEC-46.
- Prior art: `context/changes/inventory-category-panels/change.md` and `plan.md`, `context/changes/hide-hab-unit-item/plan.md`, `context/changes/bulk-insert-json/plan.md`.
- Lessons: `context/foundation/lessons.md` ("Prove visual refactors with screenshot diffs", "Record user visual overrides in the plan").
- `supabase/migrations/20260816083017_create_households.sql:13-21,36-46`
- `supabase/migrations/20260916120209_create_items.sql:24-37,43-53`
- `supabase/migrations/20261030190000_add_household_inventory_category.sql:1-8`
- `supabase/migrations/20261030191000_create_item_with_category.sql:37-46`
- `supabase/migrations/20261030210000_set_household_item_levels_expected_category.sql:1,95-96`
- `supabase/migrations/20261101100000_hide_household_item.sql:1-35`
- `supabase/migrations/20261102110000_record_item_detail_uses.sql:8-121`
- `src/lib/items/item-category.ts:1-35`
- `src/lib/items/load-hab-unit-items.ts:6-12,45-98`
- `src/lib/items/load-hab-unit-item-by-id.ts:5-37`
- `src/lib/items/load-hab-unit-item-by-barcode.ts:17-23,43-67`
- `src/lib/items/group-tally-lines-by-category.ts:1-28`
- `src/lib/items/rank-restock-lines.ts:8-30`
- `src/lib/items/set-hab-unit-item-levels.ts:4-71`
- `src/lib/items/validate-item-name.ts:1-31`
- `src/lib/items/create-new-item.ts:10-46`
- `src/lib/items/hide-hab-unit-item.ts:3-29`
- `src/lib/items/scan-session.ts:4-8`
- `src/lib/hab-unit/load-current-hab-unit.ts:9-33`
- `src/lib/db/entities.ts:1-6,8-23`
- `src/app/inventory/actions.ts:44-48,85,122-190,484-550,559-588`
- `src/app/inventory/page.tsx:39-70`
- `src/app/inventory/inventory-tally.tsx:62-64,111-154,216-250`
- `src/app/inventory/inventory-category-panel.tsx:9-17,61-123`
- `src/app/inventory/restock/page.tsx:19-31`
- `src/app/inventory/restock/restock-list.tsx:33-35,64-108`
- `src/app/inventory/[itemId]/page.tsx:21-60`
- `src/app/inventory/[itemId]/item-level-editor.tsx:127-135,171-205,274-311,325-365`
- `src/app/inventory/new/barcodeless-item-form.tsx:17-55`
- `src/app/help/help-topics.ts:34-60,196-204`
- `src/components/ui/input.test.ts:1-3`
- `vitest.config.ts:14-15`
- `README.md:42-63`

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Per-hab-unit category store and read path

#### Automated

- [ ] 1.1 `pnpm test` passes, including the new `item-category-ref.test.ts` and the updated `group-tally-lines-by-category.test.ts` and `load-hab-unit-items.test.ts`.
- [ ] 1.2 `pnpm typecheck` passes.
- [ ] 1.3 `pnpm lint` passes with no new warnings in the files this phase touches.
- [ ] 1.4 `rg "household_categories" supabase/migrations` matches only `20261103090000_create_household_categories.sql`. That file contains `enable row level security`, `household_categories_select_if_member`, a composite foreign key from `household_inventory` to `household_categories (id, household_id)`, and `num_nonnulls`. It contains no `for insert`, `for update`, or `for delete` policy.

#### Manual

- [ ] 1.5 After confirming the linked project and taking a snapshot, `pnpm exec supabase db push` applies `20261103090000_create_household_categories.sql` with no error.
- [ ] 1.6 In a rolled-back SQL transaction as a member of hab unit A (set the caller first: `select set_config('request.jwt.claims', '{"sub":"<user uuid>"}', true); set local role authenticated;`), `select` on `household_categories` returns zero rows, and an `insert` into it is refused. As the table owner in a rolled-back transaction, referencing a category of hab unit B from a `household_inventory` row of hab unit A fails with a foreign key error, setting both `category` and `custom_category_id` fails the CHECK, and setting neither fails the CHECK.
- [ ] 1.7 Full-page screenshots of `/inventory` and `/inventory/restock` taken before and after the code change, in light and dark, at a wide viewport and at 390px, with animations frozen, show a zero-pixel diff.
- [ ] 1.8 Signed in with existing data, every item still shows in the same one of the five panels with the same count, the same warning icons, and the same open and closed state.

### Phase 2: Create a custom category

#### Automated

- [ ] 2.1 `pnpm exec vitest run src/lib/items/validate-category-name.test.ts src/lib/items/create-hab-unit-category.test.ts` passes. The tests cover a valid name, a trimmed name, an empty name, a 40-character name, a 41-character name, a built-in label in any case, `Pet foods`, a created result, a `23505` duplicate result, another rpc error thrown with `cause`, and a non-string result.
- [ ] 2.2 `pnpm test` passes.
- [ ] 2.3 `pnpm typecheck` passes.
- [ ] 2.4 `pnpm lint` passes with no new warnings in the files this phase touches.
- [ ] 2.5 `rg "create_household_category" supabase/migrations` matches only `20261103091000_create_household_category.sql`. That file contains `security definer`, `set search_path = ''`, `auth.uid()`, and `revoke all on function public.create_household_category(text) from public, anon`.

#### Manual

- [ ] 2.6 After confirming the linked project and taking a snapshot, `pnpm exec supabase db push` applies `20261103091000_create_household_category.sql` with no error.
- [ ] 2.7 In a rolled-back SQL transaction as a member of hab unit A, `create_household_category('Cleaning')` returns a uuid and the new row has hab unit A's id. A second call with `'cleaning'`, and a call with `'food'`, each raise `23505`. A blank name and a 41-character name each raise.
- [ ] 2.8 In a rolled-back SQL transaction as a member of a second hab unit B, `select` on `household_categories` returns none of A's rows, and `create_household_category('Cleaning')` succeeds there.
- [ ] 2.9 On `/inventory` as a member of hab unit A, entering `Cleaning` shows a new empty panel before Pet food, with count 0, "Nothing in this category.", and no warning icon. The create control is visible when the tally holds no items.
- [ ] 2.10 Creating `Garden` next shows its panel after Cleaning and before Pet food, and a reload keeps that order.
- [ ] 2.11 Entering a duplicate name, a built-in label, a blank name, or 41 characters shows a field error under the input, creates no panel, and keeps the typed text.
- [ ] 2.12 Signed in as a member of a second hab unit, `/inventory` and `/inventory/restock` list none of the first hab unit's categories (TEC-52 criterion 2).

### Phase 3: Assign a custom category to an item

#### Automated

- [ ] 3.1 `pnpm exec vitest run src/lib/items/item-category-ref.test.ts src/lib/items/set-hab-unit-item-levels.test.ts` passes. The key round-trip, an invalid key, a built-in save, a custom save, a stale result, and another error are covered.
- [ ] 3.2 `pnpm test` passes.
- [ ] 3.3 `pnpm typecheck` passes.
- [ ] 3.4 `pnpm lint` passes with no new warnings in the files this phase touches.
- [ ] 3.5 The newest `set_household_item_levels` definition is in `20261103092000_set_household_item_levels_custom_category.sql`. It contains `drop function public.set_household_item_levels(uuid, integer, integer, integer, text, text)`, `new_quantity > 99`, `household_quantity_changes`, `serialization_failure`, `for share`, and `revoke all on function public.set_household_item_levels(uuid, integer, integer, integer, text, uuid, text, uuid) from public, anon`.

#### Manual

- [ ] 3.6 After confirming the linked project and taking a snapshot, `pnpm exec supabase db push` applies `20261103092000_set_household_item_levels_custom_category.sql` with no error.
- [ ] 3.7 In a rolled-back SQL transaction as a member of hab unit A, saving an item with A's custom category id sets `custom_category_id` and nulls `category`. Passing a category id of hab unit B raises `serialization_failure`. Passing a wrong `expected_custom_category_id` raises `serialization_failure`. Saving a built-in category still works, and saving a lower count still writes one `household_quantity_changes` row per unit removed.
- [ ] 3.8 On an item page as a member of hab unit A, the Category select lists the custom categories first in creation order, then Pet food, Food, Beauty, Other, and Uncategorized.
- [ ] 3.9 Picking `Cleaning` and pressing Save returns to `/inventory`, and the item is listed under the Cleaning panel with its count. The panel shows its count and the shortage icon rules apply. If the item is CRITICAL, it also appears under Cleaning on `/inventory/restock`.
- [ ] 3.10 Reopening the item shows Cleaning selected. The Category row turns the unsaved color when the selection differs from the saved one, and moving it back to Food and saving leaves the item in Food.
- [ ] 3.11 A new item created from `/inventory/new` still lands in a built-in category.

### Phase 4: Rename a custom category

#### Automated

- [ ] 4.1 `pnpm exec vitest run src/lib/items/rename-hab-unit-category.test.ts src/app/inventory/inventory-category-panel.test.ts` passes. The tests cover renamed, duplicate, missing, another error thrown with `cause`, the unchanged markup without `actions`, and the control placed outside the toggle `<button>`.
- [ ] 4.2 `pnpm test` passes.
- [ ] 4.3 `pnpm typecheck` passes.
- [ ] 4.4 `pnpm lint` passes with no new warnings in the files this phase touches.
- [ ] 4.5 `rg "rename_household_category" supabase/migrations` matches only `20261103093000_rename_household_category.sql`. That file contains `security definer`, `set search_path = ''`, `auth.uid()`, `P0002`, and `revoke all on function public.rename_household_category(uuid, text) from public, anon`.

#### Manual

- [ ] 4.6 After confirming the linked project and taking a snapshot, `pnpm exec supabase db push` applies `20261103093000_rename_household_category.sql` with no error.
- [ ] 4.7 In a rolled-back SQL transaction as a member of hab unit A, renaming `Cleaning` to `Garden` raises `23505` when `Garden` exists. Renaming `Cleaning` to `CLEANING` succeeds and keeps the same id. Renaming a category id of hab unit B raises `P0002`. The assigned items still point at the same id after a rename.
- [ ] 4.8 On `/inventory`, each custom panel header shows a rename control, and the built-in panels show none. Renaming `Cleaning` to `Cleaners` shows the new label, keeps the items inside, and keeps the panel's position. A reload shows the same.
- [ ] 4.9 Renaming to another category's name, to a built-in label, to a blank name, or to 41 characters shows a field error and changes nothing. A case-only rename succeeds.
- [ ] 4.10 The item page Category select shows the new name.
- [ ] 4.11 Full-page screenshots of `/inventory` with only built-in panels, before and after this phase, in light and dark at a wide viewport and at 390px, show a zero-pixel diff.

### Phase 5: Delete a custom category and update the help copy

#### Automated

- [ ] 5.1 `pnpm exec vitest run src/lib/items/delete-hab-unit-category.test.ts src/app/help/help-topics.test.ts` passes. The wrapper tests cover deleted, missing, and another error thrown with `cause`.
- [ ] 5.2 `pnpm test` passes.
- [ ] 5.3 `pnpm typecheck` passes.
- [ ] 5.4 `pnpm lint` passes with no new warnings in the files this phase touches.
- [ ] 5.5 `pnpm worker:check` passes.
- [ ] 5.6 `rg "delete_household_category" supabase/migrations` matches only `20261103094000_delete_household_category.sql`. That file contains `security definer`, `set search_path = ''`, `auth.uid()`, `for update`, `P0002`, and `revoke all on function public.delete_household_category(uuid) from public, anon`. The function does not write `quantity` or `minimum_quantity`.

#### Manual

- [ ] 5.7 After confirming the linked project and taking a snapshot, `pnpm exec supabase db push` applies `20261103094000_delete_household_category.sql` with no error.
- [ ] 5.8 In a rolled-back SQL transaction as a member of hab unit A, deleting a category that holds two items leaves both items with `category = 'uncategorized'`, `custom_category_id` null, and the same `quantity` and `minimum_quantity`. The category row is gone and no `household_quantity_changes` row was added. Deleting a category id of hab unit B raises `P0002`.
- [ ] 5.9 On `/inventory`, the first press on a custom panel's delete control arms it and the second press deletes. The items appear under Uncategorized with the same counts, and the panel disappears. Cancel disarms it. Built-in panels show no delete control. There is no undo control.
- [ ] 5.10 With an item page open in a second tab on a deleted category, pressing Save returns "The count changed. Reload the page before saving." Pressing Save with the deleted category chosen in the select from a stale page returns the same message.
- [ ] 5.11 Signed in as a member of a second hab unit, the same custom name can be created, assigned, renamed, and deleted without changing the first hab unit's categories or items. The first hab unit's list is unchanged throughout.
- [ ] 5.12 The help page describes custom categories, their order, and the create, rename, and delete controls.
- [ ] 5.13 A final run through `/inventory` and `/inventory/restock` at a wide viewport and at 390px, in light and dark, shows custom panels before the built-ins, earliest created first, with no layout break.
