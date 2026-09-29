# Stocking Mode Increase Plan Brief

> Full plan: `context/changes/stocking-mode-increase/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-03)

## What and Why

A member unpacking a delivery needs each scan of a stocked barcode to add 1, and needs to see that count, without typing a quantity. The scanner already finds or creates items and then stops. Quantity stays 0, and a second scan of a stocked code only shows the name.

S-03 adds the stocking direction and the increment. Using stays selectable and does not change quantity until S-04.

## Starting Point

`/inventory/scan` shows `AlreadyStocked` for a household hit and redirects a miss to `/inventory/new`. `household_inventory.quantity` defaults to 0 and has no update function. The camera stops after one read and navigates with a GET.

The delta is a household-scoped increment, two direction buttons remembered for the tab session, and a stocking submit that adds 1 once and then only displays the result.

## Desired End State

The member opens the scanner, selects stocking, and scans stocked items one after another. Each new presentation shows a count 1 higher than before, and a toast reads `Item {name} {barcode} was added to inventory.` Holding the same code in frame does not add another 1. Refreshing the result does not add another 1 and does not show the toast. Selecting using shows the item and leaves the count unchanged. A new tab session starts on using. An unknown barcode still uses the existing create flow and saves at quantity 0.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Direction control | Two normal buttons labeled using and stocking, one selected | The member chose button controls that act as a single choice | plan |
| Using scan | Show the item and leave quantity unchanged | Decrease and undo belong to S-04 | plan |
| Stocking scan | Add 1 and show the new count | One unit per scan, no extra quantity step | PRD |
| How long the choice lasts | `sessionStorage` for the tab session. A new tab session starts on using | The member chose survival after leaving the scanner, cleared when the tab session ends | plan |
| What performs the write | Server action POST. The scan page only displays | A refresh of the result must not add another 1 | plan |
| Unknown barcode | Existing create flow, quantity stays 0 | Create is not a stock-in | S-02 plan |
| Next count of the same code | Wait 500ms with that code out of frame | A result camera would otherwise count the can still in frame | plan review F1 |
| Stocking confirmation | Toast `Item {name} {barcode} was added to inventory.` once | The member asked for the name and barcode on a successful add | plan |

## Scope

**In scope:**

- Increment by 1 for a barcode this household already stocks
- Visible using and stocking buttons on the scanner
- Tab-session memory of the selected button, default using
- Stocking result shows the new count, a one-time toast with the name and barcode, and the next presentation after a 500ms miss
- Using result shows the name and does not write

**Out of scope:**

- Quantity decrease, session list, and per-line undo
- Minimums, stock labels, and quantity on the inventory list
- Name search and hand-edited counts
- Starting a new item above quantity 0

## Approach

Add `increment_household_quantity` as a security-definer function that sets `quantity = quantity + 1` for the caller's household. The scanner stores the button choice in `sessionStorage`. A stocking detection calls a server action once. The action redirects to a result URL that loads the quantity and renders it. The page never increments during render.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Household quantity increment | RPC and wrapper that add 1 for this household only | A missed auth check would write another household's row |
| 2. Scan direction buttons | using and stocking buttons restored for the tab session | A new tab that still shows stocking would violate the reset |
| 3. Scan applies the selected direction | Stocking adds 1, shows the count, and toasts the name and barcode. The same code waits for a 500ms miss. Using shows the name | A result camera that counts the can still in frame would add 1 again |

## Risks and Assumptions

- A tab left open keeps stocking mode. That is the accepted persistence rule.
- Using can be selected before a using scan lowers a count.
- Two stocking scans of one barcode add 2. Noticing a mistaken repeat waits for S-04.
- Assumption: the quantity column from S-02 is already present and starts at 0.

## Success Criteria

- In stocking mode, each new presentation of a stocked barcode shows a count 1 higher than before, with no quantity field, and a toast reads `Item {name} {barcode} was added to inventory.`
- Holding that barcode in frame does not change the count. A different barcode still counts.
- Refreshing that result does not change the count and does not show the toast.
- In using mode, a scan shows the item and leaves the stored quantity unchanged.
- Leaving the scanner and returning in the same tab keeps the selected button. A new tab session starts on using.
