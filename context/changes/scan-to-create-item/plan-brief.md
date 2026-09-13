# Scan to Create Item Plan Brief

> Full plan: `context/changes/scan-to-create-item/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-02)

## What and Why

A signed-in member must scan or type an unknown-to-this-household barcode and record a named stock row (FR-002, FR-005, FR-016). Product identity is shared. Household stock is not. Counts stay out of this slice so a create cannot pretend to be a stock-in.

## Starting Point

S-01 left auth, a hab-unit, `/inventory` empty-state copy, Edge middleware on `/inventory/:path*`, and household-only schema. There is no product table, no inventory table, no camera code, and no catalog fetch. The prior household-scoped `items.household_id` model was rejected in plan review.

## Desired End State

On the live HTTPS URL, a member can scan or type a barcode, confirm or type a household name, optionally attach that code to a product this household already stocks, and see that name on `/inventory`. Quantity stays `0` and hidden. A barcode this household already stocks does not insert. A barcode another household stored becomes this household's stock of the same `items.id`.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Product vs stock | Shared `items` + `item_barcodes`. `household_inventory` links household to item | Same EAN is one product for every household | Plan interview F3 |
| Quantity | On `household_inventory`, default 0, hidden | Increment is S-03. Quantity is per household | Plan interview |
| Household name | `household_inventory.name`. `items.name` is canonical only | A rename must not leak across households | Replan |
| Catalog | Manual name first. Open Food Facts last in this slice. Trim and truncate prefill to 120 | Roadmap treats catalog as enhancement. Long names must still save | Plan interview, roadmap, plan review F4 |
| Decode | `@zxing/browser` plus typed digits. Expand `UPC_E` to UPC-A before lookup or save | `BarcodeDetector` is off on iOS Safari. Validator is 8 to 14 digits | Plan interview, Can I Use, plan review F5 |
| Attach | Skip picker when this household has zero stock. Later, show up to 20 household names and filter | FR-005. F1 | Plan review F1 |
| Inventory list | `loadHouseholdItems()` with no limit. Attach offer passes `{ limit: 20 }` | A hard cap would hide stock after 20 rows | Plan review F2 |
| Known to household | Show household name. No insert. No quantity change | S-02 is unknown-to-household create. F2 | Plan review F2 |
| Known globally, new here | `add_item_to_household` only | Do not duplicate `items` | Replan |
| Create race | If `create_item` fails, look up again and add or return exists | Two callers can miss, then one insert wins | Plan review F6 |
| Writes | `create_item`, `add_item_to_household`, `attach_barcode`, `find_item_by_barcode`. No client select on `items` | Copies S-01 isolation. Hides the global catalog | Replan |
| Household barcode lookup | `find_item_by_barcode`, then `household_inventory` by `item_id`. Loaders return `itemId` | No PostgREST join to `item_barcodes`. Attach and add need `items.id` | Plan review F1 |
| Action wiring | Wrap `useActionState` like hab-unit. Client-only ZXing | F4, F5 | Plan review |
| Scan handoff | Detect or typed digits go to `/inventory/scan?barcode=`. Server page branches exists vs `/inventory/new` | Client scanner cannot call the server loader | Plan review F3 |

## Scope

**In scope:**

- `items`, `item_barcodes`, `household_inventory`, RLS, RPCs
- Typed create, add-to-household, and attach UI from `/inventory`
- ZXing camera scan with typed-digits fallback
- Open Food Facts name prefill, editable, fail-open
- Household name list after the first stock row

**Out of scope:**

- Counts, modes, undo, minimums, restock lists (S-03 through S-08)
- FR-006 name search as the camera-failure path
- Barcode-less items (FR-013)
- Offline scan, other catalog vendors, browser E2E tests
- Client listing of all global products

## Approach

Copy S-01: validate in server actions, mutate through `security definer` RPCs. Land shared schema first, then a camera-free create and stock path, then the reusable scanner, then catalog.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Shared item identity and household inventory | Three tables, RLS, four functions, validators | Client select on `items` would leak the global catalog |
| 2. Manual create, stock, and attach | `/inventory/new`, household name list | Creating a second `items` row for a known EAN |
| 3. Camera scan | `/inventory/scan`, ZXing | iOS camera and HTTPS secure context |
| 4. Catalog prefill | Open Food Facts lookup | A down or empty catalog blocking save |

## Risks and Assumptions

- Camera checks assume the live `workers.dev` HTTPS URL. Local HTTP is not that check.
- Open Food Facts coverage of Zooplus pet food is weak. Manual name is the real path for those codes.
- Shared `items.name` is canonical. Household display name can differ. First writer sets the canonical name.
- RLS and RPCs are verified by hand against the linked Supabase project.
- Roadmap still lists S-01 as `ready`. Live code already provides sign-in and `/inventory`.
- ZXing on iPhone Safari is the highest product risk. Phase 2 still ships if the camera fails, via typed digits.

## Success Criteria

- A member can record a barcode this household has never stocked, from a phone over HTTPS.
- An unrecognized barcode is never a dead end: type the name, or attach it to a household product.
- A second household scanning the same EAN stocks the same `items` row.
- Catalog prefills when present and never blocks save.
- Quantity is not shown or changed.
