# Create-flow Lookup Feedback Plan Brief

> Full plan: `context/changes/create-flow-lookup-feedback/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-12)

## What and Why

S-12 tells the user when a barcode is missing from our database and when the external catalogs also miss, and it keeps the create form usable (FR-005, FR-016, guardrail 3). The same slice shows a loading caret while scan and create look up that barcode, keeps the fixed header readable while scrolling, and bolds the barcode on the create form.

## Starting Point

The create form already opens when the hab unit and the global store both miss, and a catalog hit already prefills the name. It says neither result out loud, and the barcode is ordinary text. The header is fixed with no background, so tall pages slide across it. Scan and create have no `loading.tsx`.

## Desired End State

The user sees the household sentence on the create form, sees the catalog sentence only when every catalog misses, and can still name and save the item. The barcode is bold. Scan and create show the caret until the result replaces it. The header stays pinned and readable, and page content starts below it.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Header clearance | Fixed header, opaque background, content offset by `--header-offset` | Keeps the header pinned and readable, and keeps the top of the page visible | Plan, user confirmed |
| Miss copy | Two exact sentences, create form only | The create branch is the double miss. Add-to-hab-unit means the global store hit | TEC-36, codebase |
| Catalog hit | Household sentence only, name still prefilled | The catalog sentence is for a total catalog miss | TEC-36 |
| Loading | `loading.tsx` on scan and create, existing caret | Those routes wait on the server. The caret is the motion already in the app | Plan, codebase |
| Reduced motion | Loading word stays, caret blink stops | `prefers-reduced-motion` already disables the terminal type animation | Codebase |

## Scope

**In scope:**

- Header background, stacking order, and a shared offset for page shells
- Household and catalog sentences on the item create form
- Bold barcode token on that form
- Caret loading view for `/inventory/scan` and `/inventory/new`

**Out of scope:**

- FR-017 shop lookup
- Catalog request behavior and `lookup-catalog-name.ts`
- Miss copy on add-to-hab-unit or already-stocked
- Counts, scan direction, restock labels, and categories
- Browser end-to-end tests

## Approach

One CSS variable sizes the fixed header and the gap above page content. A pure function chooses the miss sentences, and the create page passes them only after both local lookups miss. Two route loading files share the caret view. The header stays in the root layout, so it remains visible during the wait.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Clear the fixed header | Opaque pinned header and page content starting below it | A shell left on `min-h-screen` still centers through the header |
| 2. Show lookup misses and a bold barcode | Two sentences and a bold barcode on the create form | The two sentences read as one failure if they use the red error style |
| 3. Show a loading state while lookup runs | Caret on scan and create until the server render finishes | An unknown hab-unit scan shows scan loading, then create loading |

## Risks and Assumptions

- `--header-offset` is the only header measurement. Putting `py-12` back on the header splits the bar from the page gap.
- S-02's create branch remains the place that knows both local lookups missed.
- Status text, not the red alert, keeps a catalog miss distinct from a household miss.
- Vitest will not render the header, the form, or the loading view. Those checks are manual.

## Success Criteria

- The header stays pinned and readable, and content starts below it.
- The create form states a household miss, states a catalog miss only when every catalog misses, and still saves.
- The barcode on that form is bold.
- Scan and create show the caret until the result replaces it, and reduced motion stops the blink.
