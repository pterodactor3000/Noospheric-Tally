# Using Mode Decrease and Undo Plan Brief

> Full plan: `context/changes/using-mode-decrease-and-undo/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-04)

## What and Why

A member opening an item needs a using scan to subtract 1. He also needs to catch a double scan in either direction and undo it. Today a using scan only shows the name, and nothing records what a scanning session changed. Without that record, guardrail 1 is open, because a repeated scan changes the count with no trace.

## Starting Point

Stocking writes through `stockScannedItem` and the security-definer `increment_household_quantity(text)`, which returns only the new integer. A using scan calls `router.push` and writes nothing. `household_inventory.quantity` has no check constraint, and no change log exists. The scan direction already lives in `sessionStorage` for the tab.

The delta is a household-scoped change log with a session id, logged increment and decrement RPCs, a floor of 0 in the database, a using server action, a session list below the scanner, and a locked reversal RPC.

## Desired End State

The member selects using and scans an item he opens. The count drops by 1, and `Item {name} {barcode} was removed from inventory.` shows once. A refresh changes nothing. At 0, the scan writes nothing and shows `Item {name} {barcode} is already at 0.` Below the scanner, every +1 and -1 from this tab session is listed newest first, with Undo on each unreversed line. Undo moves the count back once and marks the line `reversed`. A reversal that would go below 0 shows `This line cannot be reversed because the count would drop below 0.`, and the line stays unreversed.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Complexity | High | A new table, a replaced RPC signature, three security-definer functions, row locking, and a floor constraint | User confirmation 2026-10-29 |
| Scanning session | The tab session in `sessionStorage`, minted on the first recorded scan and reused. Opening the scanner first shows an empty list and mints nothing | Same tab rule as the scan direction | User confirmation 2026-10-29 (Q1) |
| What can be reversed | Any unreversed session line, once. Every line is +1 or -1 | One scan is one unit, and one wrong line should be fixable on its own | User confirmation 2026-10-29 (Q2) |
| Floor of 0 | Refuse visibly. A using scan at 0 writes nothing and adds no line. A reversal below 0 is refused and the line stays unreversed | FR-007 says a quantity is never below 0 | User confirmation 2026-10-29 (Q3) |
| Using result and list layout | Name, new count, and a one-time confirmation that mirrors stocking. The list sits below the scanner, newest first, with Undo, and a reversed line stays marked | Same feedback in both directions | User confirmation 2026-10-29 (Q4) |
| Where the log lives | Server table `household_quantity_changes` with `scan_session_id` and `reversed_at`, written only by RPCs. Reversal is an RPC that locks the row | A browser-only list cannot prove what the database changed, and S-08 needs the history | plan |
| Scan write shape | One SQL statement updates the count and inserts the log row | A count change and its log row cannot drift apart | plan |
| Barcode and name for a line | Store the scanned barcode on the log row, and add a composite foreign key to `household_inventory` for the name | `item_barcodes` is unreadable under RLS, and one item can have several barcodes | plan |
| At-0 using scan | The action checks the loaded quantity before the write. A raced RPC raise shows the existing write failure | No parsing of Postgres exception text | plan |
| Reversal below 0 | The RPC raises SQLSTATE `23514`, and the wrapper branches on that code | The action has no quantity loaded before a reversal | plan |
| Stocking caller in Phase 1 | Phase 1 also adds the session helper and passes the session id on stocking | The replaced increment signature otherwise breaks the only caller | plan |

## Scope

**In scope:**

- Change log table, floor constraint, logged increment and decrement RPCs
- Using scan subtracts 1 through a POST, with a one-time confirmation and a visible at-0 refusal
- Session id in `sessionStorage` on both directions
- Session list below the scanner, newest first
- Per-line Undo through a locked reversal RPC, with a visible below-0 refusal

**Out of scope:**

- Stock labels and minimums (S-06, S-10)
- Quantity on the inventory list
- Manual adjustment and name search (S-05)
- Consumption view (S-08)
- Archiving S-03 or editing the roadmap
- Reversing changes from an earlier tab session or another device

## Approach

Follow the S-03 pattern. Security-definer RPCs do every write, server actions call them and redirect to a result URL with a one-time flag, and the scan page only renders. Each scan write changes the count and inserts its log row in one statement. The list is a client component that loads its lines by session id through a server action, and row-level security limits it to the household. Reversal locks the log row, moves the count back only when it stays at 0 or above, and stamps `reversed_at`.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Quantity change ledger and scan RPCs | Log table, floor constraint, logged increment and decrement, stocking passes the session id | Dropping the old increment breaks stocking on the deployed build until this branch deploys |
| 2. Using scan lowers the count | `consumeScannedItem`, count and confirmation on the using result, visible at-0 refusal | A repeated at-0 notice with an unchanged key fails to show again |
| 3. Session review list | Lines from this tab session below the scanner, newest first | The list reloads before or after the redirect render and shows a stale set |
| 4. Per-line reversal | Undo once per line, below-0 refusal, reversed marker | A double tap or a concurrent scan reverses twice or deadlocks |

## Risks and Assumptions

- The Phase 1 migration drops `increment_household_quantity(text)`. Push it close to deploy.
- The scan RPCs declare `returns table (change_id uuid, quantity integer)`. An unqualified `quantity` column inside them is ambiguous and fails at call time.
- The reversal RPC locks the log row and then the inventory row. A scan locks only the inventory row, so they cannot deadlock.
- A storage that throws falls back to an in-memory session id for the page lifetime.
- `fetchScanSessionLines` adds one new message, `Session list failed to load. Purify the Machine Spirit and try again.`, written in the style of the existing write failure text.
- Next is 16.4.3. The implementer reads the relevant guides in `node_modules/next/dist/docs/` before writing Next code.

## Success Criteria

- A using scan of a stocked item at 1 or more lowers the count by 1 once, and a refresh does not lower it again.
- A using scan at 0 writes nothing and shows `Item {name} {barcode} is already at 0.`
- The scanner lists every line from this tab session, newest first, in both directions.
- Undo reverses a line once, the count moves back, and the line shows as reversed.
- A reversal below 0 shows `This line cannot be reversed because the count would drop below 0.` and changes nothing.
