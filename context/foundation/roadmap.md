---
project: Noospheric Tally
version: 1
status: draft
created: 2026-08-04
updated: 2026-08-04
prd_version: 1
main_goal: learn
top_blocker: none
---

# Roadmap: Noospheric Tally

> Derived from `context/foundation/prd.md` plus a confirmed codebase baseline.
> Edit in place. Archive and replace only for full regeneration.

## Vision recap

The household's main grocery buyer does not know how much pet food or cooking staple is left at the moment he orders or shops, which costs him recurring stress, money spent on rushed purchases, and food spoiled by buying what he already had. Every workaround so far has depended on remembering to check at home, separated from the physical item. This product records stock at the moment the item is handled, by scanning its barcode, and answers one question in return: what needs restocking, most urgent first.

## North star

**S-06: user can see an item's count and whether it has fallen below the minimum**: this is the first point where scanning stops being data entry and starts answering the question that causes the stress. It completes the PRD's primary criterion end to end, and everything before it exists only to make this answer trustworthy.

## At a glance

| ID | Change ID | Outcome (user can ...) | Prerequisites | PRD refs | Status |
| --- | --- | --- | --- | --- | --- |
| F-01 | deployed-https-app-shell | (foundation) reach the running app from a phone over HTTPS, redeployed on merge | - | FR-002 | ready |
| S-01 | household-sign-in | sign in and reach an empty household inventory | F-01 | FR-001 | ready |
| S-02 | scan-to-create-item | scan an unknown barcode and record it as a named item | S-01 | FR-002, FR-005, FR-016 | ready |
| S-03 | stocking-mode-increase | scan items in stocking mode to raise their counts | S-02 | FR-003, FR-012, US-01 | ready |
| S-04 | using-mode-decrease-and-undo | scan items in using mode to lower counts, and undo a mis-scan | S-03 | FR-004, FR-009, US-02 | ready |
| S-05 | name-search-and-manual-adjust | find an item by name and adjust it by hand, including items with no barcode | S-02 | FR-006, FR-013 | ready |
| S-06 | minimum-and-restock-flag | set a minimum for an item and see whether it is below it | S-02 | FR-007, FR-008, US-02 | ready |
| S-07 | restock-list-by-shortfall | see everything needing restocking, largest shortfall first | S-06 | FR-010, FR-014 | ready |
| S-08 | consumption-rate-view | see how fast each item is consumed | S-04 | FR-015 | proposed |

## Streams

| Stream | Theme | Chain | Note |
| --- | --- | --- | --- |
| A | Platform and access | `F-01` then `S-01` | The unfamiliar ground: hosting target and session model, taken first because the learn goal puts new technology early. |
| B | Capture | `S-02` then `S-03` then `S-04` | Everything that happens with an item in hand. Each step reuses the scanner built by the one before it. |
| C | Upkeep and restocking | `S-05`, then `S-06` then `S-07`, then `S-08` | The answers derived from recorded stock. `S-05` and `S-06` need only items to exist, so they can run alongside stream B. |

## Baseline

- **Frontend:** present: Next.js App Router shell at `src/app/layout.tsx` and `src/app/page.tsx`, with Tailwind wired through `postcss.config.mjs`.
- **Backend / API:** partial: the App Router server runtime is available, but no route handler, server action, or server module exists.
- **Data:** absent: Supabase Postgres is declared in `context/foundation/tech-stack.md`; no client dependency, schema, or migration exists.
- **Auth:** absent: Supabase Auth with `@supabase/ssr` is declared in `context/foundation/tech-stack.md`; nothing is installed or wired.
- **Deploy / infrastructure:** partial: `wrangler.jsonc`, `open-next.config.ts`, and deploy scripts exist; no CI workflow, no hosting project binding, and the `workerd` postinstall is still blocked locally.
- **Observability:** absent: no logging, error tracking, or test tooling.

## Foundations

### F-01: Reachable deployment over HTTPS

- **Outcome:** (foundation) the application runs on the declared hosting target, reachable from a phone over HTTPS, and redeploys on merge to the main branch
- **Change ID:** deployed-https-app-shell
- **PRD refs:** FR-002
- **Unlocks:** S-01 through S-08. Camera access in a mobile browser requires a secure context, so no scanning slice can be verified on the actual device until this exists. Also resolves the unknown of whether the local build path works against the hosting target at all.
- **Prerequisites:** -
- **Parallel with:** -
- **Blockers:** -
- **Unknowns:** Whether local tooling can produce a working build with platform install scripts still blocked. Owner: user. Block: no.
- **Risk:** Deferring this hides deployment surprises until the end, and every scanning slice would be verified only on a desktop browser, which is not where the product is used.
- **Status:** ready

## Slices

### S-01: Sign in to a household inventory

- **Outcome:** user can sign in and reach an empty household inventory that belongs to their account
- **Change ID:** household-sign-in
- **PRD refs:** FR-001
- **Prerequisites:** F-01
- **Parallel with:** -
- **Blockers:** -
- **Unknowns:** -
- **Risk:** Every later slice writes data that belongs to a household, so establishing the owning account first avoids reworking every write once identity arrives.
- **Status:** ready

### S-02: Record a new item from a scanned barcode

- **Outcome:** user can scan a barcode the system has never seen and record it as a named item, with the name prefilled from an external catalog when one is found and typed by hand when it is not
- **Change ID:** scan-to-create-item
- **PRD refs:** FR-002, FR-005, FR-016
- **Prerequisites:** S-01
- **Parallel with:** -
- **Blockers:** -
- **Unknowns:** Which external product catalog answers the lookup, and how poorly it covers European pet food and grocery barcodes. Owner: user. Block: no, because manual naming is the documented fallback and the slice can ship on that alone.
- **Risk:** Camera capture in a mobile browser is the least predictable part of the product, so it is exercised before anything depends on a working scanner.
- **Status:** ready

### S-03: Raise counts by scanning in stocking mode

- **Outcome:** user can put the app in stocking mode, scan items one after another while unpacking a delivery, and see each count rise
- **Change ID:** stocking-mode-increase
- **PRD refs:** FR-003, FR-012, US-01
- **Prerequisites:** S-02
- **Parallel with:** S-05, S-06
- **Blockers:** -
- **Unknowns:** -
- **Risk:** The persistent mode is the decision most likely to corrupt counts silently, so it ships with the first direction rather than being retrofitted around two existing ones.
- **Status:** ready

### S-04: Lower counts by scanning in using mode, and undo mistakes

- **Outcome:** user can switch to using mode, scan an item as it is opened, review what the current scanning session recorded, and reverse any line that was wrong
- **Change ID:** using-mode-decrease-and-undo
- **PRD refs:** FR-004, FR-009, US-02
- **Prerequisites:** S-03
- **Parallel with:** S-05, S-06
- **Blockers:** -
- **Unknowns:** -
- **Risk:** Without the session review and per-line reversal, a double scan quietly produces a wrong count, which the PRD names as the first guardrail.
- **Status:** ready

### S-05: Find an item by name and adjust it by hand

- **Outcome:** user can search the inventory by name and change an item's count directly, including for items that have no barcode at all
- **Change ID:** name-search-and-manual-adjust
- **PRD refs:** FR-006, FR-013
- **Prerequisites:** S-02
- **Parallel with:** S-03, S-04, S-06
- **Blockers:** -
- **Unknowns:** -
- **Risk:** Spices and loose nuts, one of the two named pains, are unreachable by scanning, so the product only covers half the problem until this exists.
- **Status:** ready

### S-06: Set a minimum and see the restock flag

- **Outcome:** user can set a minimum quantity for an item and see its current count together with whether it has reached or fallen below that minimum
- **Change ID:** minimum-and-restock-flag
- **PRD refs:** FR-007, FR-008, US-02
- **Prerequisites:** S-02
- **Parallel with:** S-03, S-04, S-05
- **Blockers:** -
- **Unknowns:** -
- **Risk:** This is the first slice that answers the user's actual question rather than storing data, so delaying it delays all evidence that the product is worth using.
- **Status:** ready

### S-07: See everything needing restocking, worst shortfall first

- **Outcome:** user can open one list of every item at or below its minimum, ordered by how far each falls short, and use it while shopping
- **Change ID:** restock-list-by-shortfall
- **PRD refs:** FR-010, FR-014
- **Prerequisites:** S-06
- **Parallel with:** S-08
- **Blockers:** -
- **Unknowns:** Whether shortfall ordering misleads in practice by ranking a large spice shortfall above a small pet food one. Owner: user. Block: no, resolved by observing real use.
- **Risk:** This carries the PRD's secondary criterion and the domain rule's ranking, so it is the slice that proves the product's decision is useful rather than merely correct.
- **Status:** ready

### S-08: See how fast each item is consumed

- **Outcome:** user can see the rate at which each item is used up over time
- **Change ID:** consumption-rate-view
- **PRD refs:** FR-015
- **Prerequisites:** S-04
- **Parallel with:** S-07
- **Blockers:** -
- **Unknowns:** Whether enough recorded history accumulates for the view to say anything meaningful. Owner: user. Block: no.
- **Risk:** Nice-to-have, and sparse early data can make the product look wrong, so it stays last and stays optional.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID | Suggested issue title | Ready for planning | Notes |
| --- | --- | --- | --- | --- |
| F-01 | deployed-https-app-shell | Deploy the app over HTTPS with redeploy on merge | yes | Start here. Everything else is verified against it, and it settles the blocked platform install scripts. |
| S-01 | household-sign-in | Sign in to a household inventory | yes | Plan after F-01 exists. Establishes the account that owns all later data. |
| S-02 | scan-to-create-item | Record a new item from a scanned barcode | yes | Plan the catalog lookup as an enhancement over manual naming, not a dependency. |
| S-03 | stocking-mode-increase | Raise counts by scanning in stocking mode | yes | Includes the visible mode indicator and its reset behavior. |
| S-04 | using-mode-decrease-and-undo | Lower counts by scanning, with session undo | yes | Carries guardrail one: no silent double-count. |
| S-05 | name-search-and-manual-adjust | Find an item by name and adjust it by hand | yes | Can be planned alongside stream B once items exist. |
| S-06 | minimum-and-restock-flag | Set a minimum and see the restock flag | yes | North star. Completes the PRD primary criterion. |
| S-07 | restock-list-by-shortfall | See restocking needs ranked by shortfall | yes | Carries the domain rule's ranking and the secondary criterion. |
| S-08 | consumption-rate-view | See how fast each item is consumed | no | Nice-to-have. Revisit once real history exists and the must-have path is done. |

## Open Roadmap Questions

1. **Which external product catalog answers unknown barcodes, and what is done when its coverage is poor**: Owner: user. Block: S-02, as an enhancement only, since manual naming ships regardless.
2. **When the household invite is delivered, given it is the deferred original secondary criterion**: Owner: user. Block: roadmap-wide, currently parked.
3. **When offline use becomes real work, given it was withdrawn to protect the four weeks**: Owner: user. Block: roadmap-wide, currently parked.
4. **At what point the medium user-scale ambition turns into work, while separate households remain out of scope**: Owner: user. Block: roadmap-wide, currently parked.

## Parked

- **Inviting another person to the household (FR-011)**: Why parked: PRD non-goal, deferred until the first version proves useful. The account and household model keeps it possible.
- **Offline use, including scanning without a connection**: Why parked: PRD non-functional non-goal, withdrawn to protect the four-week budget, recorded as a later goal.
- **Separate unrelated households on one deployment**: Why parked: PRD non-goal for the first version.
- **Expiry date tracking and spoilage warnings**: Why parked: PRD non-goal, needs per-unit dates that multiply the scanning effort.
- **Ordering or reordering from shops**: Why parked: PRD non-goal, requires shop integrations, and the stated pain is knowing stock rather than placing orders.
- **Price tracking and finding cheaper options**: Why parked: PRD non-goal, addressed indirectly by the restock flag.
- **Recipe or meal planning integration**: Why parked: PRD non-goal, unrelated to knowing current stock.
- **Tracking where in the house each item is stored**: Why parked: PRD non-goal, the user knows where his own items are.
- **Native app store distribution**: Why parked: PRD non-functional non-goal, the browser reaches the phone camera within the budget.

## Done
