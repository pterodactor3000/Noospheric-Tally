---
project: Noospheric Tally
version: 1
status: draft
created: 2026-08-03
context_type: greenfield
product_type: web-app
target_scale:
  users: medium
timeline_budget:
  delivery_weeks: 4
  hard_deadline: null
  after_hours_only: true
---

## Vision & Problem Statement

The user does not know the current stock of frequently used consumables: cooking staples such as spices and nuts, and pet food for cats and dogs.

Three moments trigger the need:

1. Unpacking a bulk order (example given: a Zooplus delivery) when stock increases.
2. Opening or consuming a unit, when stock decreases.
3. Standing in a grocery store, or preparing an order, when the user must decide whether an item needs restocking.

Present cost of the problem:

- Recurring stress about running out of pet food for the animals.
- Money lost when a shortage is discovered too late to look for a cheaper option.
- Spoiled food from over-buying items already held at home.

Current workaround and its failure: the user and his wife exchange chat messages about what to buy, and have tried note apps and other apps. Every workaround requires the user to remember to check stock at home, and the check is unavailable or unreliable at the moment of purchase.

Distinguishing insight: updating stock at the physical moment of change, by scanning the item's barcode, is fast enough to keep counts trustworthy. Manual lists fail because they depend on memory at a moment separated from the physical item.

Seed statement, user-supplied verbatim:

> 1. inventory management application for home
> 2. i experience the problem
> 3. i want it to be able to scan barcode and either add or subtract number of items of this kind from home inventory database; this should be webapp or mobile app

## User & Persona

Primary persona: the household's main grocery buyer and animal feeder. He performs most shopping, unpacks bulk deliveries, cooks, and feeds the family and pets. He uses the product at home while handling physical items, and in a store while deciding what to buy.

Secondary users, not required for the first version: his wife, as a second member of the same household. The user also mentioned separate households as a possible future direction.

## Access Control

Account-based access. The primary user signs in to an account that owns one household inventory. The wife can be invited to the same household later, and sees the same inventory.

Roles: all household members are equal. Every member can scan, add, subtract, and edit items. No owner-only restrictions in the first version.

Separate, unrelated households are a possible future direction, not a first-version requirement.

## Success Criteria

### Primary

The user scans a barcode when unpacking a delivery, scans the same barcode when opening a unit, then sees a current count for that item and whether it is below its minimum quantity.

### Secondary

The below-minimum list is usable in a store, so the user decides what to buy from it on the spot.

The wife using the same inventory from her own phone was the user's first choice of secondary win. It was replaced because FR-011 is deferred out of the first version, and a secondary criterion the first version cannot deliver is not a criterion.

### Guardrails

1. A scan must not silently record the wrong count, and a repeated scan must not double-count without the user noticing.
2. Inventory data must not be lost or reset, since recovery means recounting the house by hand.
3. An unrecognized barcode must never be a dead end: the user must still be able to record the item.

Weak-connectivity usability was raised as a fourth guardrail, then withdrawn to protect the four-week budget. It is recorded as a later goal in `## Non-Goals`.

## User Stories

### US-01: Stock up after a bulk delivery

- **Given** the user has signed in and is unpacking a delivery of pet food cans
- **When** he sets the app to stocking mode and scans each can's barcode
- **Then** the count for that item increases by one per scan without further input

### US-02: Consume a unit and check whether it needs restocking

- **Given** an item already exists in the household inventory with a minimum quantity set
- **When** the user sets the app to using mode, scans the item's barcode as he opens it, then views the item
- **Then** the count has decreased by one and the item shows whether it is at or below its minimum

## Functional Requirements

- FR-001: User can sign in to an account that owns one household inventory. Priority: must-have

> Challenge: sign-in friction hurts if it blocks a quick check in a store. Risk accepted, no change to the requirement.

- FR-002: User can scan an item barcode with the device camera. Priority: must-have

> Challenge: a camera scan that fails in poor light or on a damaged label hurts. Risk accepted, because FR-006 name search covers the failure.

- FR-003: User can add a quantity to the item matched by a scanned barcode. Priority: must-have

> Challenge: scanning the same unit twice within seconds double-counts it. Resolution: a scanning session shows a running list of what it recorded, with per-line undo.

- FR-004: User can subtract a quantity from the item matched by a scanned barcode. Priority: must-have

> Challenge: same double-count risk in the other direction. Resolution: the same session list with per-line undo covers both directions.

- FR-005: User can record a new item for an unrecognized barcode by naming it. Priority: must-have

> Challenge: quick-adding during a bulk unpack creates several entries for one real product. Resolution: before creating an item, the product offers existing items so the new barcode can be attached to one.

- FR-006: User can find an item by name when scanning is not possible. Priority: must-have

> Challenge: search hurts if inconsistent naming makes items unfindable. Risk accepted for the first version.

- FR-007: User can set a minimum quantity for an item. Priority: must-have

> Challenge: a badly chosen minimum produces a flag the user learns to ignore. Risk accepted, since the minimum is editable.

- FR-008: User can see an item's current count and whether it is below its minimum. Priority: must-have

> Challenge: a count the user does not trust is worse than no count. Risk accepted, and addressed by the guardrails on wrong counts and data loss.

- FR-009: User can reverse the most recent quantity change for an item. Priority: must-have

> Challenge: undo hurts if it silently reverses someone else's change. Risk accepted while the first version stays effectively single-user.

- FR-010: User can see every item at or below its minimum in one list. Priority: nice-to-have

> Challenge: it competes with the four-week budget. Resolution: kept in the first version.

- FR-011: User can invite another person to the household inventory. Priority: nice-to-have

> Challenge: multi-user work costs more than its first-version value. Resolution: deferred until the first version works. The account and household model still assumes it later.

- FR-012: User can select a scan direction, stocking or using, that applies to every scan until it is switched. Priority: must-have

> Challenge: a forgotten stocking mode quietly inflates every count. Resolution: the active mode is always visible while scanning, and resets to using when the app is reopened.

- FR-013: User can keep an item without any barcode and adjust its count by hand after finding it by name. Priority: must-have

> Challenge: hand-adjusted items drift out of date faster than scanned ones. Risk accepted, since drift beats not tracking spices and loose nuts at all.

- FR-014: User can see items needing restocking ordered by how far each falls below its minimum. Priority: must-have

> Challenge: shortfall ranking hurts when a large shortfall on an optional item outranks a small shortfall on pet food. Resolution: shortfall-only ranking accepted for the first version, to be revisited after real use shows whether the ordering misleads.

- FR-015: User can see how fast each item is consumed over time. Priority: nice-to-have

> Challenge: usage history hurts if early data is too sparse to be meaningful and the user distrusts the product because of it. Risk accepted, since the view is nice-to-have and does not gate the primary flow.

- FR-016: User can have the product name prefilled from an external product catalog when an unknown barcode is scanned, and can type the name when the lookup returns nothing. Priority: must-have

> Challenge: an external catalog hurts when it returns a wrong or foreign-language name that the user then trusts, and when a lookup delay slows a bulk unpack. Resolution: the prefilled name is editable before it is saved, and FR-005 manual naming remains the fallback.

## Non-Functional Requirements

- Recording one item during a bulk unpack takes a few seconds, and one confirmation per scan is acceptable.
- The product requires a network connection to be used. Offline operation is out of scope for the first version.
- Recorded counts survive normal use without loss, since manual recovery means recounting the house.

## Business Logic

An item needs restocking when its counted quantity is at or below the minimum quantity the user set for it, and items needing restocking are ranked by how far they fall below their minimum, so the largest shortfall is presented first.

Urgency is computed from the shortfall alone. The user does not set a priority or category, and none is stored in the first version.

This rule is carried by FR-014.

## Non-Goals

Functional non-goals:

- Expiry date tracking and spoilage warnings. Reason: it needs per-unit dates, which multiplies the scanning effort the first version is trying to keep cheap.
- Ordering or reordering from shops such as Zooplus. Reason: it requires shop integrations, and the stated pain is knowing stock, not placing orders.
- Price tracking or finding cheaper options. Reason: the money loss comes from late discovery of a shortage, which the restock flag already addresses.
- Recipe or meal planning integration. Reason: unrelated to knowing current stock.
- Tracking where in the house each item is stored. Reason: the user handles the items himself and knows their location.
- Separate unrelated households sharing one deployment. Reason: the first version serves one household, even though the product is expected to reach more households later.
- Inviting other people to the household (FR-011). Reason: deferred until the first version proves useful, though the account and household model keeps it possible.

Non-functional non-goals:

- Offline use, including scanning without a connection. Reason: withdrawn to protect the four-week budget. Recorded as an explicit later goal.
- Native app store distribution. Reason: a mobile-first web app reaches the phone camera within the budget.

## Open Questions

1. When FR-011 (inviting the wife to the household) should be delivered is unresolved. It sits immediately after the first version, with no date. Owner: user. Resolution date: unknown.
2. Offline support is a stated later goal with no target date. Owner: user. Resolution date: unknown.
3. Target scale is recorded as medium, meaning many households eventually, while separate households are a first-version non-goal. The point at which that ambition becomes work is unresolved. Owner: user. Resolution date: unknown.
4. Which external product catalog FR-016 uses, and what happens when it covers a barcode poorly, is unresolved at the product level. Owner: user. Resolution date: unknown.

Resolved during discovery cross-check, kept for traceability:

- Shortfall-only ranking accepted for the first version, to be revisited after real use.
- Separate unrelated households declared a non-goal.
- Consumption history accepted as nice-to-have FR-015 rather than a non-goal.
- Unknown barcodes resolved against an external catalog with manual naming as fallback, recorded as FR-016.
- The secondary success criterion replaced, because the original one depended on deferred FR-011.
