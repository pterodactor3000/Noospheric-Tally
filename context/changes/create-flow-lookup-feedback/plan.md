# Create-flow Lookup Feedback Implementation Plan

## Overview

Deliver roadmap slice S-12 (`create-flow-lookup-feedback`): a signed-in user can tell a household miss from a catalog miss while creating an item, wait on the existing caret while a scan or create lookup runs, scroll without the page covering the fixed header, and read a bold barcode on the item create form. This satisfies FR-005, FR-016, and guardrail 3. The create form stays available when both lookups miss.

## Current State Analysis

- The header is `fixed` at the top of the viewport and has no background and no stacking order (`src/components/header.tsx:9-23`). Page content paints across it once a page is tall enough to reach that band.
- The root layout renders `<Header />` and then `{children}` with no offset (`src/app/layout.tsx:35-40`).
- Six shells size themselves with `min-h-screen`, so they center in the full viewport, including the band under the header: `src/app/page.tsx:15-25`, `src/app/(auth)/layout.tsx:14-24`, `src/app/hab-unit/new/page.tsx:16-26`, `src/app/inventory/page.tsx:15-23`, `src/app/inventory/new/page.tsx:78-88`, and `src/app/inventory/scan/scan-capture.tsx:20-28`.
- `/inventory/new` loads the hab-unit item, then the global item, then the catalog. The create form renders only when both stores miss. A catalog hit prefills the name. A catalog miss leaves the name empty. Neither result is told to the user (`src/app/inventory/new/page.tsx:44-74`).
- The create form prints the barcode as ordinary text inside the instruction sentence (`src/app/inventory/new/item-create-form.tsx:66-77`).
- `lookupCatalogName` returns `found` or `empty` (`src/lib/catalog/lookup-catalog-name.ts:4-12`). Each catalog call times out after 3 seconds (`src/lib/catalog/lookup-catalog-name.ts:15`).
- `/inventory/scan` redirects to `/inventory/new` when the barcode is valid and absent from the hab unit (`src/app/inventory/scan/page.tsx:37-42`).
- The app has no `loading.tsx`. The only motion marks are `.caret` and the terminal type animation (`src/app/globals.css:97-118`). Reduced motion already disables `.terminal-type` and does not disable `.caret`.
- Vitest runs in Node and includes `src/**/*.test.ts` only (`vitest.config.mts:14-17`). There is no component test renderer.

## Desired End State

The header stays pinned to the top, on an opaque background, above scrolling content. Page content starts below it. A short page does not gain an empty scroll equal to the header. On a tall page, content may pass under the header, and the header text stays readable.

On the item create form, the barcode is bold. The form says "The item was not found in our database." It also says "The item was not found in the external databases." when every catalog misses. A catalog hit still prefills the name and omits the catalog sentence. The name field and both submit actions stay usable. Add-to-hab-unit and already-stocked do not show those sentences.

`/inventory/scan` and `/inventory/new` show the word Loading and the existing caret until that route's server render replaces them. With reduced motion, the word stays and the caret does not blink.

Verify with `pnpm lint`, `pnpm typecheck`, `pnpm test`, and the manual checks in each phase.

## What We're NOT Doing

- Shop barcode lookup, including FR-017 and S-09. That flow blocks a missing barcode. It does not create an item.
- Changing catalog vendors, request order, timeout, name parsing, or the `found` / `empty` result. `src/lib/catalog/lookup-catalog-name.ts` stays as it is, including its current logs.
- Miss copy on add-to-hab-unit or already-stocked. Those screens mean the barcode was found in our database or in this hab unit.
- Counts, stocking mode, using mode, undo, minimums, restock labels, or categories.
- A new spinner, a component test renderer, or browser end-to-end tests.
- Unpinning the header, or editing the Stream B row in the roadmap.

## Implementation Approach

Keep the header `fixed`. Give it the page background and a stacking order above the page. One custom property, `--header-offset`, is both the header box height and the space inserted above page content. Shells that use `min-h-screen` fill the viewport minus that offset, so short pages stay one screen tall and start below the header.

Miss copy is a pure function tested in Vitest. The create page calls it only on the branch that already proved the barcode is absent from the hab unit and the global item store. The form renders the returned sentences and bolds the barcode. Route `loading.tsx` files show the existing caret while the scan and create server renders run. The header lives in the root layout, so it stays on screen during that wait.

## Critical Implementation Details

**One header measurement.** Today's header height is `py-12` (6rem) plus one text line (1.5rem) plus `border-b-2` (2px). Replace that implicit sum with:

```css
:root {
  --header-offset: calc(6rem + 1.5rem + 2px);
}
```

The header box is `h-[var(--header-offset)]` with `items-center`, `box-border`, `bg-background`, and `z-20`. Remove `py-12` from the header so padding cannot change the box without changing the variable. Keep `fixed`, `inset-x-0`, `top-0`, the border, and the shadow.

**Content starts below that box.** The root layout wraps `{children}` in an element whose `padding-top` is `var(--header-offset)`. Each current `min-h-screen` shell drops that utility and adds `page-below-header`:

```css
.page-below-header {
  min-height: calc(100svh - var(--header-offset));
}
```

The document's minimum height stays one viewport: offset plus `(100svh - offset)`. Tall content grows downward from the top of that shell. When it scrolls, it passes under the opaque header.

**The create branch is the only miss site.** `ItemCreateForm` mounts only after both `loadHabUnitItemByBarcode` and `findGlobalItemByBarcode` miss (`src/app/inventory/new/page.tsx:44-74`). Household miss copy belongs on that form alone. Catalog miss copy belongs there only when `lookupProduct.status` is `empty`. A `found` result still passes `lookupProduct.name` as `defaultName`.

**Notices are status text.** Render each sentence in its own `role="status"` element, after the barcode sentence and before the name field. Leave the red `role="alert"` elements for validation errors. Guardrail 3: both forms on the page still submit.

**Barcode weight.** Bold only the barcode token in the instruction sentence. The surrounding sentence stays at its current weight and color. Use `font-bold` and `text-foreground` on that token so the weight is visible against `text-foreground/70`.

**Loading is the route suspense boundary.** `src/app/inventory/scan/loading.tsx` and `src/app/inventory/new/loading.tsx` each render one shared loading view. That view is a child of the offset wrapper, uses `page-below-header`, and shows `Loading` plus `<span className="caret" aria-hidden="true" />`. Do not add a second spinner inside `ItemCreateForm`. The catalog request finishes on the server before the form is sent.

A scan of an unknown hab-unit barcode redirects to `/inventory/new` (`src/app/inventory/scan/page.tsx:40-42`). The user can see the scan loading view, then the create loading view, while the catalog lookup runs. That sequence is the two waits in this slice.

**Reduced motion.** Extend the existing `prefers-reduced-motion` block so `.caret` sets `animation: none`. The loading word stays.

---

## Phase 1: Clear the fixed header

### Overview

The header stays pinned, paints on the page background above scrolling content, and page content starts below it.

### Changes Required

#### 1. Header offset

**File:** `src/app/globals.css`

**Intent:** Name the header block once, and name the page height below it.

**Contract:** `:root` defines `--header-offset: calc(6rem + 1.5rem + 2px)`. `.page-below-header` sets `min-height: calc(100svh - var(--header-offset))`. No other rule reads or writes the header block size.

#### 2. Header bar

**File:** `src/components/header.tsx`

**Intent:** Keep the header fixed and stop page content from showing through it.

**Contract:** The header keeps `fixed`, `inset-x-0`, and `top-0`. It gains `z-20`, `bg-background`, `box-border`, `items-center`, and `h-[var(--header-offset)]`. It loses `py-12`. Label, sign-out, border, and shadow stay.

#### 3. Page offset

**File:** `src/app/layout.tsx`

**Intent:** Start every page below the fixed header.

**Contract:** `{children}` is wrapped in one element with `padding-top: var(--header-offset)`. The header stays outside that wrapper.

#### 4. Shell height

**Files:** `src/app/page.tsx`, `src/app/(auth)/layout.tsx`, `src/app/hab-unit/new/page.tsx`, `src/app/inventory/page.tsx`, `src/app/inventory/new/page.tsx`, `src/app/inventory/scan/scan-capture.tsx`

**Intent:** Stop those shells from centering through the header band.

**Contract:** Replace `min-h-screen` with `page-below-header`. Leave `items-center`, `justify-center`, and existing `py-12` as they are. The already-stocked fragment in `src/app/inventory/scan/page.tsx:44-48` has no `min-h-screen`. The layout wrapper's padding is its offset.

### Success Criteria

#### Automated Verification

- `pnpm lint` exits 0.
- `pnpm typecheck` exits 0.

#### Manual Verification

- A short page starts below the header, and the header does not cover its top.
- On a tall page, content scrolls under the header and the header text stays readable.
- The header stays pinned to the top of the viewport.

---

## Phase 2: Show lookup misses and a bold barcode

### Overview

The item create form tells the user about a household miss and, when every catalog misses, a catalog miss. The barcode is bold. The form still saves.

### Changes Required

#### 1. Notice selection

**File:** `src/lib/catalog/get-create-lookup-notices.ts`

**Intent:** Decide the two sentences in one pure function so Vitest can cover them without rendering the form.

**Contract:**

```ts
interface CreateLookupNotices {
  householdMissMessage: string
  catalogMissMessage: string | null
}

const getCreateLookupNotices = (
  catalogStatus: 'found' | 'empty',
): CreateLookupNotices
```

`householdMissMessage` is `The item was not found in our database.` `catalogMissMessage` is `The item was not found in the external databases.` when `catalogStatus` is `empty`, and `null` when it is `found`.

#### 2. Notice tests

**File:** `src/lib/catalog/get-create-lookup-notices.test.ts`

**Intent:** Lock the two sentences and the catalog-hit omission.

**Contract:** One test expects the household sentence and `catalogMissMessage === null` for `found`. One test expects both sentences for `empty`. The file matches `src/**/*.test.ts`.

#### 3. Create page

**File:** `src/app/inventory/new/page.tsx`

**Intent:** Pass the notices into the create form from the branch that already missed both stores.

**Contract:** Call `getCreateLookupNotices(lookupProduct.status)` only in the `ItemCreateForm` branch (`src/app/inventory/new/page.tsx:58-74`). Pass both fields as props. Keep `defaultName` as the catalog name when `status` is `found`, and `''` when it is `empty`. `AlreadyStocked` and `AddToHabUnitForm` receive no miss props.

#### 4. Create form

**File:** `src/app/inventory/new/item-create-form.tsx`

**Intent:** Show the sentences and bold the barcode without blocking submit.

**Contract:** Add `householdMissMessage: string` and `catalogMissMessage: string | null` to `ItemCreateFormProps`. Render the household sentence, then the catalog sentence when it is non-null, each in its own `role="status"` element, after the barcode sentence and before the name field. The barcode token in that sentence is a `strong` with `font-bold` and `text-foreground`. Hidden barcode inputs stay unchanged. Both submit buttons stay enabled under the same pending rules as today.

### Success Criteria

#### Automated Verification

- `pnpm test src/lib/catalog/get-create-lookup-notices.test.ts` passes.
- `pnpm typecheck` exits 0.

#### Manual Verification

- A barcode absent from the hab unit and the global store, with a catalog hit, shows "The item was not found in our database.", hides the catalog sentence, prefills the name, and still submits.
- The same path, when every catalog misses, shows both sentences, leaves the name empty, and still submits.
- The barcode on the item create form is bold.
- Add-to-hab-unit and already-stocked do not show those sentences.

---

## Phase 3: Show a loading state while lookup runs

### Overview

The scan and create routes show the existing caret until their server render replaces it.

### Changes Required

#### 1. Loading view

**File:** `src/components/lookup-loading.tsx`

**Intent:** Share one loading view between the two routes.

**Contract:** The view is a `main` with `page-below-header`, centered like the scan shell. Its text is `Loading` followed by `<span className="caret" aria-hidden="true" />`. It has no timer and no catalog call.

#### 2. Route boundaries

**Files:** `src/app/inventory/scan/loading.tsx`, `src/app/inventory/new/loading.tsx`

**Intent:** Show that view while each route's async page is unresolved.

**Contract:** Each file default-exports a component that renders `LookupLoading` and nothing else. No other route gains a `loading.tsx`.

#### 3. Reduced motion

**File:** `src/app/globals.css`

**Intent:** Stop the caret blink when the user asks for reduced motion.

**Contract:** Inside the existing `prefers-reduced-motion: reduce` block, `.caret` sets `animation: none`. `.terminal-type` stays as it is.

### Success Criteria

#### Automated Verification

- `pnpm lint` exits 0.
- `pnpm typecheck` exits 0.

#### Manual Verification

- `/inventory/new?barcode=` for a valid barcode absent from the hab unit shows the caret until the create form replaces it.
- `/inventory/scan` shows the caret until the scanner replaces it.
- With `prefers-reduced-motion: reduce`, the loading word stays and the caret does not blink.

---

## Testing Strategy

### Unit Tests

- `getCreateLookupNotices('found')` returns the household sentence and `catalogMissMessage === null`.
- `getCreateLookupNotices('empty')` returns the household sentence and the catalog sentence.
- No other status exists on `LookupStatus` (`src/lib/catalog/lookup-catalog-name.ts:4-12`).

### Integration Tests

- None. Vitest does not render routes, and this slice adds no request or database boundary. The create page's branch choice stays the existing hab-unit, global, then catalog order.

### Manual Testing Steps

1. Open a short page, such as sign-in, and confirm the card starts below the header.
2. Open a tall page, scroll, and confirm the header text stays readable on top of the content.
3. Scan or enter a barcode that this hab unit and the global store do not have, and that a catalog can name. Confirm the household sentence, the prefilled name, the bold barcode, and that Apply still works.
4. Repeat with a barcode every catalog misses. Confirm both sentences, an empty name, and that Apply still requires a typed name as it does today.
5. Open a barcode this hab unit already stocks, and one the global store has but this hab unit does not. Confirm those screens omit both sentences.
6. Reload `/inventory/scan` and `/inventory/new?barcode=` for an unknown barcode. Confirm the caret shows until the next screen replaces it.
7. Repeat step 6 with reduced motion. Confirm the loading word stays and the caret does not blink.

## References

- Roadmap: `context/foundation/roadmap.md` (S-12)
- PRD: `context/foundation/prd.md` (FR-005, FR-016, guardrail 3)
- Issue: TEC-36
- Header: `src/components/header.tsx:9-23`
- Root layout: `src/app/layout.tsx:35-40`
- Create branch: `src/app/inventory/new/page.tsx:44-74`
- Barcode sentence: `src/app/inventory/new/item-create-form.tsx:66-77`
- Catalog result: `src/lib/catalog/lookup-catalog-name.ts:4-12`
- Scan redirect: `src/app/inventory/scan/page.tsx:37-42`
- Caret: `src/app/globals.css:97-118`

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Clear the fixed header

#### Automated

- [ ] 1.1 `pnpm lint` exits 0.
- [ ] 1.2 `pnpm typecheck` exits 0.

#### Manual

- [ ] 1.3 A short page starts below the header, and the header does not cover its top.
- [ ] 1.4 On a tall page, content scrolls under the header and the header text stays readable.
- [ ] 1.5 The header stays pinned to the top of the viewport.

### Phase 2: Show lookup misses and a bold barcode

#### Automated

- [ ] 2.1 `pnpm test src/lib/catalog/get-create-lookup-notices.test.ts` passes.
- [ ] 2.2 `pnpm typecheck` exits 0.

#### Manual

- [ ] 2.3 A barcode absent from the hab unit and the global store, with a catalog hit, shows "The item was not found in our database.", hides the catalog sentence, prefills the name, and still submits.
- [ ] 2.4 The same path, when every catalog misses, shows both sentences, leaves the name empty, and still submits.
- [ ] 2.5 The barcode on the item create form is bold.
- [ ] 2.6 Add-to-hab-unit and already-stocked do not show those sentences.

### Phase 3: Show a loading state while lookup runs

#### Automated

- [ ] 3.1 `pnpm lint` exits 0.
- [ ] 3.2 `pnpm typecheck` exits 0.

#### Manual

- [ ] 3.3 `/inventory/new?barcode=` for a valid barcode absent from the hab unit shows the caret until the create form replaces it.
- [ ] 3.4 `/inventory/scan` shows the caret until the scanner replaces it.
- [ ] 3.5 With `prefers-reduced-motion: reduce`, the loading word stays and the caret does not blink.
