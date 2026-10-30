---
change_id: shop-barcode-hab-unit-lookup
title: Shop barcode lookup in the hab unit
status: implementing
created: 2026-10-30
updated: 2026-10-30
archived_at: null
---

## Notes

Roadmap: `context/foundation/roadmap.md` (S-09), PRD FR-017, story US-03. Linear TEC-33. GitHub issue https://github.com/pterodactor3000/Noospheric-Tally/issues/14. Artifacts: `plan.md`, `plan-brief.md`.

Closed decisions from 2026-10-30. Complexity is Low. The user approved three phases.

Lookup:

- A found barcode shows the item name, count, and stock label.
- A blocked barcode shows `Not in your hab unit.` The scanner stays live. The lookup view has no create link and does not redirect to `/inventory/new`.
- The lookup reads only through `loadHabUnitItemByBarcode`. A global-only or catalog-only barcode is blocked, the same as a total miss.
- A read failure is a distinct message, never the blocked notice.

Inventory page:

- Restock and Lookup sit side by side. This replaces the S-07 full-width Restock button.
- The tally section has a max height. Only the item list scrolls. The title, search row, and action buttons stay visible.
- Phase 3 manual sign-off waits on screenshots. The user approves that layout or requests tweaks before the manual check is marked done.
