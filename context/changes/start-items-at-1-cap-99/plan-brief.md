# Start new items at 1 and cap counts at 99 Plan Brief

> Full plan: `context/changes/start-items-at-1-cap-99/plan.md`
> Roadmap item: None. No roadmap item constrains this change (Linear TEC-50, GitHub issue 49).

## What and Why

A new item starts at a count of 1, and no item count can go above 99. Today new rows start at 0, and the 999999 cap covers only the tally row buttons and the item page Save. Scan stocking and undo of a decrement have no cap.

## Starting Point

The `household_inventory.quantity` column defaults to 0, and `create_item`, `create_item_without_barcode`, and `add_item_to_household` take that default. `create_items_bulk` already sets 1. `adjust_household_quantity` and `set_household_item_levels` cap at 999999. `increment_household_quantity` and `reverse_quantity_change` have no upper bound, and the table has only a `quantity >= 0` check. The delta is a column default, one clamp with a constraint, four function changes, and app changes that follow one constant.

## Desired End State

A new item shows 1 on the tally whichever way it was created. `[+]`, the item page stepper, Save, scan stocking, and undo of a decrement all stop at 99. A refused increase shows `The count cannot go above 99.` and writes nothing. A count stored above 99 before the change reads 99 afterward. The minimum still goes to 999.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Complexity | Medium | Several database functions and a data clamp, but no authorization or integration change | User confirmation 2026-11-01 |
| Starting count | Column default becomes 1 | One statement covers every create path that omits `quantity`, and bulk already sets 1 | Plan, TEC-50 |
| Existing counts above 99 | Clamp to 99 once in the migration, then add a check for 0 through 99, with no restore | Matches "no count can go above 99" and keeps Save working for every row | User confirmation 2026-11-01 (Q1, option A) |
| Cap scope | 99 on `[+]`, item page, Save, scan stocking, and reversal of a decrement | The issue says any increase or save | TEC-50, user confirmation |
| Refused increase | Write nothing and show `The count cannot go above 99.` | Same as the existing refusal on `[+]` | User confirmation, `actions.ts:79` precedent |
| Minimum cap | Stays 999 | The issue says it keeps its current cap | TEC-50 |
| Bulk insert | Out of scope, not reopened | TEC-51 is Done and already starts at 1 | TEC-50, TEC-51 |
| Phases | Three: default, database cap, app cap | Approved split | User confirmation 2026-11-01 |

## Scope

**In scope:**

- A column default of 1 for new inventory rows
- A clamp of stored counts above 99 and a check constraint for 0 through 99
- Caps of 99 in `adjust_household_quantity`, `set_household_item_levels`, `increment_household_quantity`, and `reverse_quantity_change`
- `HOUSEHOLD_QUANTITY_MAX` of 99, the validator, the refusal text, and the scan and reversal handling

**Out of scope:**

- Bulk insert and TEC-51
- The minimum cap of 999 and the stock state thresholds
- A restore of clamped counts
- Caps on decrement paths
- Any change to `household_quantity_changes`
- A roadmap or PRD edit

## Approach

Fix the data first, then the app. One migration sets the default, a second clamps, constrains, and redefines the four functions, and the app then follows a single constant. Apply the migrations before the app deploys.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Start new rows at 1 | One migration sets the column default to 1 | Low. Existing rows are untouched |
| 2. Enforce the cap of 99 in the database | Clamp, check constraint, and four function changes | The clamp lowers counts above 99 with no restore, and the reversal refusal must not mark the change reversed |
| 3. Apply the cap of 99 in the app | Constant, validator, messages, scan and reversal handling, tests | The wrapper result shape for scan stocking changes, so its tests and caller need care |

## Risks and Assumptions

- The clamp is permanent. This was accepted.
- The cap number lives in SQL and in one app constant, so a later change must touch both.
- An app deployed before the migration would fail Save for rows above 99. Apply migrations first.
- Assumes no other code writes `household_inventory.quantity`. A search found none beyond the functions named above.

## Success Criteria

- A new item appears at 1 from every create path.
- No path takes a count above 99, and a refused increase shows `The count cannot go above 99.`
- A count stored above 99 before the migration reads 99.
- The minimum still goes to 999.
- `pnpm test`, `pnpm typecheck`, and `pnpm lint` pass.
