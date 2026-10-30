# Name Search and Manual Adjust Plan Brief

> Full plan: `context/changes/name-search-and-manual-adjust/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-05)

## What and Why

A member needs to find an item by name and change its count by hand, including an item that has no barcode. Spices and loose nuts cannot be scanned, so the product covers half of the PRD's problem until this exists. This change covers FR-006 and FR-013.

## Starting Point

The inventory page lists every item as `[-] {count} [+]`, but both buttons are disabled placeholders that S-04 and S-06 left for this slice. There is no search field. Counts change only by scanning a barcode or reversing a scan line. `create_item` and the create form both require a barcode, so an item without one cannot exist today. `household_quantity_changes` requires a barcode and a scan session id, so a hand adjustment cannot be logged in it.

The delta is one adjustment function, one barcode-less create function, a name filter, and live controls on the tally.

## Desired End State

The member opens `/inventory` and types part of a name. The list narrows to matching items, ignoring case. He presses `[+]` or `[-]` on a row and the count moves by 1. A count never drops below 0, and `[-]` is disabled at 0. On `/inventory/new` he can add an item with a name only. It starts at 0 and shows on the tally, where he finds it by name and raises its count.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Complexity | Medium | Two additive migrations, two wrappers, three components, and no auth, data move, or lock-order change | Plan (no interview, delegated run) |
| How a count is adjusted by hand | The existing `[-]` and `[+]` buttons, 1 per press | S-04 and S-06 recorded them as placeholders for S-05, and FR-013 says "adjust its count by hand" without naming a typed number | S-04 brief, S-06 brief, PRD FR-013 |
| Floor of 0 | `[-]` is disabled at 0, the RPC refuses below 0 with SQLSTATE `23514`, and a raced press shows `The count cannot go below 0.` | FR-007 says a quantity is never below 0, and S-04 refuses visibly | PRD FR-007, S-04 plan |
| Change log | Hand adjustments write no `household_quantity_changes` row | The log needs a barcode and a scan session id, and the opposite button reverses a hand adjustment | Migration `20261029182809`, plan |
| Search | A client-side, case-insensitive substring filter over the loaded rows, with the text kept across a count change | The inventory is fully loaded already, and `ItemCreateForm` filters the same way | Code, PRD FR-006 |
| Search empty state | `No item matches "{query}".` | A blank list reads as a failure | Plan |
| Items without a barcode | Created from `/inventory/new` with a name only, at quantity 0 and the default minimum | FR-013 says "keep" an item without a barcode, and nothing can create one today | PRD FR-013, shape notes line 34, `create_item` |
| Duplicate names | Not checked | The PRD accepts inconsistent naming for the first version | PRD FR-006 challenge |
| Write path | Security-definer RPCs, `revoke` from `anon`, grant to `authenticated`, wrappers with an injected client | Same as S-04 and S-06 | S-04 plan, S-06 migration |
| Roadmap status | Not edited | S-04 and S-06 show `ready` but are on `main`, and neither is a prerequisite here | Roadmap, git log |

## Scope

**In scope:**

- `adjust_household_quantity` and live `[-]` and `[+]` on every tally row
- A name filter and its empty state on `/inventory`
- `create_item_without_barcode` and a name-only form on `/inventory/new`

**Out of scope:**

- Setting an exact count, or steps larger than 1
- Logging or reversing hand adjustments in the change log
- Renaming, deleting, or editing items
- A duplicate-name check
- Server-side, fuzzy, or accent-folded search
- Category panels, the restock list, the consumption view, and roadmap edits

## Approach

Follow the S-04 and S-06 shape. Each write is a security-definer RPC. A server action validates its input, calls a wrapper that takes an injected client, and revalidates `/inventory`. The tally controls call the action from a transition and show its message under the row. Phase 2 moves the list into one client component that owns the search text, and revalidation refreshes its props without resetting it.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Hand adjustment of a count | `adjust_household_quantity`, wrapper, action, and live `[-]` and `[+]` | A double tap records two units, or a raced press goes below 0 |
| 2. Name search | `filterItemsByName` and a client tally list with a search field | A value import of the loader pulls server code into the client bundle |
| 3. Item without a barcode | `create_item_without_barcode`, wrapper, action, and a name-only form | The form crowds the barcode lookup on `/inventory/new` |

## Risks and Assumptions

- One unit per press is slow for a large correction. The plan assumes the PRD does not require a typed count. A typed count is a later change.
- Hand adjustments are not in the change log, so S-08 will not see them.
- Undoing a scan line after a hand adjustment reverses against the current count. S-04's below-0 refusal covers the case that would go negative.
- Two items can share a name. Search shows both, and the member tells them apart himself.
- Run `pnpm exec supabase db push` before deploying. Both migrations only add functions, so the old build is safe in the gap.
- Next is 16.4.3. The implementer reads the relevant guides in `node_modules/next/dist/docs/` before writing Next code.

## Success Criteria

- `[+]` and `[-]` change a row's count by 1, never below 0, and `/inventory/{itemId}` shows the same count.
- Typing part of a name in any case narrows the list, and a query with no match shows `No item matches "{query}".`
- A member adds `Cinnamon` with no barcode, finds it with `cinn`, and raises it to 2 with `[+]`.
