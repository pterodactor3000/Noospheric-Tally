# Hide an Item from the Hab Unit Tally Plan Brief

> Full plan: `context/changes/hide-hab-unit-item/plan.md`
> Roadmap item: none. Linear TEC-49, https://linear.app/tech-heresy/issue/TEC-49/feat-hide-an-item-from-the-hab-unit-tally. No PRD requirement covers hiding.

## What and Why

A member can press a Hide control on an item's details page to remove it from this hab unit's tally. The shared catalog item stays, so other hab units keep it and its barcode still resolves. Members need a way to drop items they no longer stock.

## Starting Point

The tally and restock list read every `household_inventory` row for the caller's hab unit (`src/lib/items/load-hab-unit-items.ts:73`). The item page is `ItemLevelEditor` with Save and Cancel (`src/app/inventory/[itemId]/item-level-editor.tsx:311-329`). `household_inventory` has only a select policy, so every write is a `security definer` function. Nothing hides or removes an item today. The delta is one new function, one wrapper with a test, one server action, and one button.

## Desired End State

On the item page the member presses `Hide from tally` and returns to `/inventory`. The item is off the tally and off the restock list. The `items` and `item_barcodes` rows remain, another hab unit is unaffected, and scanning the barcode offers to add the item again.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Meaning of hide | Delete this hab unit's `household_inventory` row. Keep `items` and `item_barcodes`. | Matches "drops from this tally, does not delete the catalog item". No loader changes. | Plan |
| Flag column | Not added | A flag needs filters in six places, lets scan change a hidden count, and blocks the add flow. | Plan |
| Write path | New `hide_household_item(target_item_id)` `security definer` function | No delete policy exists. The function scopes to the caller's hab unit. | Plan |
| Already hidden | No-op, not an error | The member's goal is already true, and a double press stays quiet. | Plan |
| Unhide control | Not added | Not in the contract. A barcoded item returns through scan and the add form. | Contract, plan |
| Confirmation | None | The contract says the control hides the item. | Contract |
| Control | Second submit button, `Hide from tally`, with its own `formAction` | One form, no nested forms. Own row under Save and Cancel. | Plan |
| Tests | Unit test for the wrapper only | Vitest has no component or SQL harness. | Plan |

## Scope

**In scope:**

- Migration `supabase/migrations/20261101100000_hide_household_item.sql`
- `DB_FUNCTION_HIDE_HOUSEHOLD_ITEM` in `src/lib/db/entities.ts`
- `src/lib/items/hide-hab-unit-item.ts` and its test
- `hideItem` in `src/app/inventory/actions.ts`
- The Hide button in `src/app/inventory/[itemId]/item-level-editor.tsx`

**Out of scope:**

- Tally layout, dropdown alignment, count width, dropping the panel, scan, popups, landing copy, categories, sharing, bulk insert, count default, and the count cap
- An unhide control, a `hidden` column, loader changes, a confirmation dialog. The guard is a second press of the Hide button.

## Approach

Add the function, wrap it, call it from a server action that validates the id and redirects to `/inventory`, and add a Hide button to the item form. Phase 1 is the database and wrapper. Phase 2 is the action and button. The migration is applied before the Phase 2 code ships.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Hide function and wrapper | Migration, name constant, wrapper, unit test | The function must scope to the caller's hab unit only |
| 2. Hide action and control on the item page | One form action and a two-press `Hide from tally` button | Redirect must stay outside the `try`, and one action state must show the latest error |

## Risks and Assumptions

- Hiding discards this hab unit's count, minimum, category, and quantity change history for the item. Scanning that barcode, or adding it again, puts the same catalog item back on the tally as a fresh row.
- An item without a barcode cannot be scanned. Creating one with the same name makes a new catalog item. The old row stays and is unreachable. Accepted.
- The first press arms the button. The second press deletes the row. There is no dialog.
- Assumption: "hide" removes the hab unit's row. Keeping the data would need the flag approach, which is a larger change.
- `pnpm exec supabase db push` writes to the currently linked project. Snapshot that project first. There is no SQL test harness, so the function is checked by hand. A SQL call must set `request.jwt.claims` and `role` to `authenticated`.

## Success Criteria

- The item page has a hide control, and pressing it removes the item from the tally.
- The restock list and the item URL no longer show the item.
- The catalog `items` and `item_barcodes` rows remain, and another hab unit's tally is unchanged.
- Scanning a hidden barcoded item offers to add it back.
