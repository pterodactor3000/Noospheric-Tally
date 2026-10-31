# Bulk insert items from a JSON file Plan Brief

> Full plan: `context/changes/bulk-insert-json/plan.md`
> Roadmap item: none

## What and Why

A member with a stack of barcodes in a file has to add each item by hand today. This change lets the add item view take one JSON file of `{ name, barcode }` objects and add every entry to the hab unit tally in one step. It is Linear TEC-51 under TEC-46.

## Starting Point

Items are created one at a time through `create_item`, and a new row starts at a count of 0. `validateBarcode` and `validateItemName` already hold the entry rules, and the database enforces the same rules with constraints. The add item view has a no-barcode branch with a collapsible form, `BarcodelessItemForm`, that is the model for the new form.

The delta is one pure parser, one transactional database function with a wrapper, one server action, and one form.

## Desired End State

On `/inventory/new` a member opens a bulk insert section, selects a `.json` file, and submits. Each entry becomes an item with its name and barcode, a count of 1, and the default category, and the member lands on `/inventory`. A file that is the wrong shape, has a bad or duplicate or already used barcode, has over 500 entries, or is over 256KB shows an error and changes nothing.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Complexity | Medium | New migration, wrapper, parser, action, and form, with real failure paths and no auth or data move | User confirmation |
| Starting count | The bulk function inserts `quantity = 1`. `create_item`, `create_item_without_barcode`, and the 99 cap stay unchanged. TEC-50 is out of scope. | TEC-51 needs a count of 1 now, and TEC-50 owns the single-item and cap changes | User confirmation, TEC-50, TEC-51 |
| Failure handling | All or nothing. One bad entry rejects the whole file, the message names the first bad entry by index and barcode, and the tally does not change. | The criteria say a bad file leaves the tally unchanged, and a partial import is hard to recover from | User confirmation, TEC-51 |
| Size limits | The action rejects a file over 500 entries or over 256KB. `next.config.ts` is unchanged. | 256KB sits under the 1MB Server Action default, so no config change is needed | User confirmation, Next.js docs |
| File fields | Only `name` and `barcode` are read. A `category` key is ignored. | TEC-51 says the file has no category and items use the default | TEC-51 |
| Existing barcode | The function raises and the whole file fails. It does not add an existing global item to the hab unit. | Keeps the function to inserts and keeps the import all or nothing | Plan |
| Error text for a database conflict | The member sees `entries[<index>] uses barcode <barcode>, which already exists.` The raw database error stays in the log. Other write failures keep the generic message. | Decision 2 names the first conflicting entry, including a barcode already stored | User confirmation |
| Index in messages | Zero-based, written `entries[2]` | Matches JSON tooling and avoids a count that is off by one | Plan |

## Scope

**In scope:**

- `parseBulkItemsFile` with unit tests
- Migration `create_items_bulk(items jsonb)`, the `DB_FUNCTION_CREATE_ITEMS_BULK` constant, and the `createBulkItems` wrapper with unit tests
- `createItemsFromJsonFile` in `src/app/inventory/actions.ts`
- `BulkInsertForm` and its place on the add item view

**Out of scope:**

- TEC-50, the 99 cap, and any change to single-item create
- Partial import
- A `category` field in the file
- Any change to `next.config.ts`
- The scan flow

## Approach

Build in dependency order. The parser is pure and ships first. The migration and wrapper follow the `create_item` and `createNewItem` patterns. The action and form copy `createItemWithoutBarcode` and `BarcodelessItemForm`. Each phase passes lint, typecheck, and tests on its own.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Parse and validate the JSON file | `parseBulkItemsFile` and its unit tests | A message that does not name the first bad entry, or a barcode that is not normalized before the duplicate check |
| 2. Atomic bulk create RPC and its wrapper | `create_items_bulk` migration, name constant, `createBulkItems`, and tests | A partial insert if the function catches an error, or a missing revoke from `anon` |
| 3. Server action and add item view form | `createItemsFromJsonFile`, `BulkInsertForm`, and the page wiring | A file over 1MB hits the Next.js limit before the action runs |

## Risks and Assumptions

- A file over 1MB is stopped by Next.js before the action runs, and the member sees the framework's error instead of the 256KB message. `next.config.ts` stays unchanged by decision.
- The repo has no local Supabase config, so the migration is checked after `supabase db push` in a rolled-back transaction.
- No action in the repo has a unit test, so the action's branches rely on the Phase 3 manual steps.
- TEC-51 is blocked by TEC-50 in Linear. This plan does not depend on TEC-50 code, because the bulk function sets `quantity = 1` itself. The cap of 99 does not apply to a count of 1.
- The 11-entry example file lives on TEC-46 and is not in the repo.

## Success Criteria

- A member uploads a valid file and every entry appears on the tally with its name, barcode, a count of 1, and the default category.
- A file with the wrong shape, a bad entry, a duplicate barcode, or an existing barcode leaves the tally unchanged and shows an error.
- A file over 500 entries or 256KB is rejected before any write.
