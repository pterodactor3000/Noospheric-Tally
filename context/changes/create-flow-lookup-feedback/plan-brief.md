# Create-flow Lookup Feedback Plan Brief

> Full plan: `context/changes/create-flow-lookup-feedback/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-12)

## What and Why

S-12 tells the user when a barcode is missing from our database and when the external catalogs also miss, and it keeps the create form usable (FR-005, FR-016, guardrail 3). The same slice shows the existing loading screen while scan and create look up that barcode, and bolds the barcode on the create form. The fixed-header phase was skipped.

## Starting Point

The create form opens when the hab unit and the global store both miss, and a catalog hit prefills the name. Phase 2 now states both miss results and bolds the barcode. The header is in normal flow, with a background, and this change leaves it there. `src/app/loading.tsx` already renders `LoadingScreen` while a page render is unresolved.

## Desired End State

The user sees the household sentence on the create form, sees the catalog sentence only when every catalog misses, and can still name and save the item. The barcode is bold. Scan and create show `LoadingScreen` until the result replaces it. The header stays in normal flow.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Header clearance | Skipped. Header stays in normal flow | The softer green restyle already took the header out of `fixed`. The user skipped Phase 1 on 2026-10-29 | User decision |
| Miss copy | Two exact sentences, create form only | The create branch is the double miss. Add-to-hab-unit means the global store hit | TEC-36, codebase |
| Catalog hit | Household sentence only, name still prefilled | The catalog sentence is for a total catalog miss | TEC-36 |
| Loading | Existing `LoadingScreen` from `src/app/loading.tsx` | That screen is already the page fallback. A caret view would be a second loading UI | Codebase, user decision |
| Route loading files | Add scan and create `loading.tsx` only if the root fallback never shows | `loading.js` wraps the page, not a layout that awaits cookies | Next.js loading docs |
| Reduced motion | Rings stay visible and do not spin | `prefers-reduced-motion` already sets `animation: none` on the three ring classes | Codebase |

## Scope

**In scope:**

- Household and catalog sentences on the item create form
- Bold barcode token on that form
- The existing `LoadingScreen` while `/inventory/scan` and `/inventory/new` render on the server

**Out of scope:**

- FR-017 shop lookup
- Catalog request behavior and `lookup-catalog-name.ts`
- Miss copy on add-to-hab-unit or already-stocked
- Counts, scan direction, restock labels, and categories
- Browser end-to-end tests
- Pinning the header, `--header-offset`, and a caret loading view

## Approach

A pure function chooses the miss sentences, and the create page passes them only after both local lookups miss. The root `LoadingScreen` is the wait state. Route `loading.tsx` files are added only if that screen never appears during the scan or create wait.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Clear the fixed header | Skipped. No header change | Implementing it would pin a header the restyle left in normal flow |
| 2. Show lookup misses and a bold barcode | Two sentences and a bold barcode on the create form | The two sentences read as one failure if they use the red error style |
| 3. Show the loading screen while lookup runs | Existing `LoadingScreen` until the server render finishes | The root layout awaits cookies, so the root fallback may not show |

## Risks and Assumptions

- S-02's create branch remains the place that knows both local lookups missed.
- Status text, not the red alert, keeps a catalog miss distinct from a household miss.
- The root layout's cookie read can hide `LoadingScreen` until the layout finishes. The manual check decides whether route fallbacks are required.
- Vitest will not render the form or the loading view. Those checks are manual.

## Success Criteria

- The create form states a household miss, states a catalog miss only when every catalog misses, and still saves.
- The barcode on that form is bold.
- Scan and create show `LoadingScreen` until the result replaces it, and reduced motion keeps the rings still.
