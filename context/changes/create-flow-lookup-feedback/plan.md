# Create-flow Lookup Feedback Implementation Plan

## Overview

Deliver roadmap slice S-12 (`create-flow-lookup-feedback`): a signed-in user can tell a household miss from a catalog miss while creating an item, wait on the existing loading screen while a scan or create lookup runs, and read a bold barcode on the item create form. This satisfies FR-005, FR-016, and guardrail 3. The create form stays available when both lookups miss. Phase 1, the fixed header, was skipped on 2026-10-29.

## Current State Analysis

- The header is in normal flow. It uses `shrink-0`, `bg-background`, and `py-4`, and it is not `fixed` (`src/components/header.tsx:9-24`). Phase 1 was skipped, so this change does not pin it.
- The root layout stacks `Header`, `BackToInventoryLink`, then the page (`src/app/layout.tsx:46-50`). `Header` awaits `loadCurrentUser()`, which reads the auth cookies.
- Shells use `pageShell` from `src/app/styles/class-names.ts`. They do not use `min-h-screen`.
- `/inventory/new` loads the hab-unit item, then the global item, then the catalog. The create form renders only when both stores miss. That branch calls `getCreateLookupNotices` and passes both sentences (`src/app/inventory/new/page.tsx:60-78`). A catalog hit still prefills the name.
- The create form bolds the barcode token and renders each miss sentence in its own `role="status"` element (`src/app/inventory/new/item-create-form.tsx:98-109`).
- `lookupCatalogName` returns `found` or `empty` (`src/lib/catalog/lookup-catalog-name.ts:3-12`). Each catalog call times out after 3 seconds (`src/lib/catalog/lookup-catalog-name.ts:15`).
- `/inventory/scan` redirects to `/inventory/new` when the barcode is valid and absent from the hab unit (`src/app/inventory/scan/page.tsx:59-61`).
- `src/app/loading.tsx` renders `LoadingScreen`. That screen is `fixed`, `inset-0`, `role="status"`, and it shows three ring images plus a screen-reader-only `Loading` label (`src/components/loading-screen.tsx:12-26`). Next.js wraps `page.tsx` in that fallback. It does not wrap the layout, so the header's cookie read does not show this fallback (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`).
- Reduced motion already sets `animation: none` on `.animate-loading-inner`, `.animate-loading-middle`, and `.animate-loading-outer` (`src/app/styles/globals.css:240-251`). `.caret` still blinks. It is not the loading view.
- Vitest runs in Node and includes `src/**/*.test.ts` only (`vitest.config.mts:14-17`). There is no component test renderer.

## Desired End State

The header stays as it is now, in normal flow. This change does not pin it.

On the item create form, the barcode is bold. The form says "The item was not found in our database." It also says "The item was not found in the external databases." when every catalog misses. A catalog hit still prefills the name and omits the catalog sentence. The name field and both submit actions stay usable. Add-to-hab-unit and already-stocked do not show those sentences.

`/inventory/scan` and `/inventory/new` show `LoadingScreen` until that route's server render replaces it. With reduced motion, the rings stay visible and do not spin. The screen-reader label stays `Loading`.

Verify with `pnpm lint`, `pnpm typecheck`, `pnpm test`, and the manual checks in each phase.

## What We're NOT Doing

- Shop barcode lookup, including FR-017 and S-09. That flow blocks a missing barcode. It does not create an item.
- Changing catalog vendors, request order, timeout, name parsing, or the `found` / `empty` result. `src/lib/catalog/lookup-catalog-name.ts` stays as it is, including its current logs.
- Miss copy on add-to-hab-unit or already-stocked. Those screens mean the barcode was found in our database or in this hab unit.
- Counts, stocking mode, using mode, undo, minimums, restock labels, or categories.
- A new spinner, a caret loading view, a component test renderer, or browser end-to-end tests.
- Pinning the header, adding `--header-offset`, or editing the Stream B row in the roadmap.

## Implementation Approach

Miss copy is a pure function tested in Vitest. The create page calls it only on the branch that already proved the barcode is absent from the hab unit and the global item store. The form renders the returned sentences and bolds the barcode.

The loading animation is the existing `LoadingScreen`, reached through `src/app/loading.tsx`. Do not add a caret view. Add `loading.tsx` under scan or create only when a manual check shows that the root fallback never appears while that page is still awaiting.

## Critical Implementation Details

**Phase 1 is not in force.** Do not add `--header-offset`, `page-below-header`, or a fixed header. The header stays in normal flow.

**The create branch is the only miss site.** `ItemCreateForm` mounts only after both `loadHabUnitItemByBarcode` and `findGlobalItemByBarcode` miss (`src/app/inventory/new/page.tsx:60-78`). Household miss copy belongs on that form alone. Catalog miss copy belongs there only when `lookupProduct.status` is `empty`. A `found` result still passes `lookupProduct.name` as `defaultName`.

**Notices are status text.** Render each sentence in its own `role="status"` element, after the barcode sentence and before the name field. Leave the red `role="alert"` elements for validation errors. Guardrail 3: both forms on the page still submit.

**Barcode weight.** Bold only the barcode token in the instruction sentence. The surrounding sentence stays at its current weight and color. Use `font-bold` and `text-foreground` on that token so the weight is visible against `text-foreground/70`.

**Loading is the existing screen.** `src/app/loading.tsx` renders `LoadingScreen` and nothing else. That component is the animation for a scan or create server render. Do not add a spinner inside `ItemCreateForm`. The catalog request finishes on the server before the form is sent.

A scan of an unknown hab-unit barcode redirects to `/inventory/new` (`src/app/inventory/scan/page.tsx:59-61`). The root fallback can show while the scan page awaits, then again while the create page awaits the catalog. That sequence is the two waits in this slice.

`loading.js` wraps the page, not the layout. `Header` awaits cookies in the root layout, so that read does not show `LoadingScreen`. After the layout is up, the page fallback can show while the page awaits. If a manual check shows neither route ever shows `LoadingScreen` during that wait, add `src/app/inventory/scan/loading.tsx` and `src/app/inventory/new/loading.tsx`, each rendering `LoadingScreen` only. No other route gains a `loading.tsx`.

**Reduced motion.** The existing `prefers-reduced-motion: reduce` block already sets `animation: none` on the three ring classes. Do not add a `.caret` rule. The rings stay on screen. The screen-reader label stays `Loading`.

---

## Phase 1: Clear the fixed header

Skipped on 2026-10-29. The sections below are not in force.

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

## Phase 3: Show the loading screen while lookup runs

### Overview

Scan and create keep the existing `LoadingScreen` until their server render replaces it. This phase does not add a caret.

### Changes Required

#### 1. Root fallback

**File:** `src/app/loading.tsx`

**Intent:** Keep the animation that already wraps page renders.

**Contract:** The default export renders `LoadingScreen` and nothing else. `LoadingScreen` stays a full-viewport `role="status"` view with the three ring images and a screen-reader-only `Loading` label. It has no timer and no catalog call.

#### 2. Route fallback, only if the root one never shows

**Files:** `src/app/inventory/scan/loading.tsx`, `src/app/inventory/new/loading.tsx`

**Intent:** Cover a scan or create wait that the root fallback does not show.

**Contract:** Add these files only when a manual check shows that the route replaces the previous screen with no `LoadingScreen` while its server page is still awaiting. Each file default-exports a component that renders `LoadingScreen` and nothing else. If the root fallback already shows, do not add either file. No other route gains a `loading.tsx`.

#### 3. Reduced motion

**File:** `src/app/styles/globals.css`

**Intent:** Keep the rings still when the user asks for reduced motion.

**Contract:** Inside the existing `prefers-reduced-motion: reduce` block, `.animate-loading-inner`, `.animate-loading-middle`, and `.animate-loading-outer` stay at `animation: none`. Do not add a `.caret` rule. `.terminal-type` stays as it is.

### Success Criteria

#### Automated Verification

- `pnpm lint` exits 0.
- `pnpm typecheck` exits 0.

#### Manual Verification

- `/inventory/new?barcode=` for a valid barcode absent from the hab unit shows `LoadingScreen` until the create form replaces it.
- `/inventory/scan` shows `LoadingScreen` until the scanner replaces it.
- With `prefers-reduced-motion: reduce`, the rings stay visible and do not spin. The screen-reader label stays `Loading`.

---

## Testing Strategy

### Unit Tests

- `getCreateLookupNotices('found')` returns the household sentence and `catalogMissMessage === null`.
- `getCreateLookupNotices('empty')` returns the household sentence and the catalog sentence.
- No other status exists on `LookupStatus` (`src/lib/catalog/lookup-catalog-name.ts:4-12`).

### Integration Tests

- None. Vitest does not render routes, and this slice adds no request or database boundary. The create page's branch choice stays the existing hab-unit, global, then catalog order.

### Manual Testing Steps

1. Scan or enter a barcode that this hab unit and the global store do not have, and that a catalog can name. Confirm the household sentence, the prefilled name, the bold barcode, and that Apply still works.
2. Repeat with a barcode every catalog misses. Confirm both sentences, an empty name, and that Apply still requires a typed name as it does today.
3. Open a barcode this hab unit already stocks, and one the global store has but this hab unit does not. Confirm those screens omit both sentences.
4. Reload `/inventory/scan` and `/inventory/new?barcode=` for an unknown barcode. Confirm `LoadingScreen` shows until the next screen replaces it. If it never shows, add the two route `loading.tsx` files from Phase 3 and repeat this step.
5. Repeat step 4 with reduced motion. Confirm the rings stay visible and do not spin.

## References

- Roadmap: `context/foundation/roadmap.md` (S-12)
- PRD: `context/foundation/prd.md` (FR-005, FR-016, guardrail 3)
- Issue: TEC-36
- Header: `src/components/header.tsx:9-24`
- Root layout: `src/app/layout.tsx:46-50`
- Create branch: `src/app/inventory/new/page.tsx:60-78`
- Barcode sentence: `src/app/inventory/new/item-create-form.tsx:98-109`
- Catalog result: `src/lib/catalog/lookup-catalog-name.ts:3-15`
- Scan redirect: `src/app/inventory/scan/page.tsx:59-61`
- Loading screen: `src/app/loading.tsx`, `src/components/loading-screen.tsx:12-26`
- Reduced motion: `src/app/styles/globals.css:240-251`
- Next.js loading boundary: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Clear the fixed header

Status: skipped on 2026-10-29 by user decision. Do not implement. The header stays in normal flow.

#### Automated

- [x] 1.1 `pnpm lint` exits 0. (skipped 2026-10-29, no code change, no SHA)
- [x] 1.2 `pnpm typecheck` exits 0. (skipped 2026-10-29, no code change, no SHA)

#### Manual

- [x] 1.3 A short page starts below the header, and the header does not cover its top. (skipped 2026-10-29, no code change, no SHA)
- [x] 1.4 On a tall page, content scrolls under the header and the header text stays readable. (skipped 2026-10-29, no code change, no SHA)
- [x] 1.5 The header stays pinned to the top of the viewport. (skipped 2026-10-29, no code change, no SHA)

### Phase 2: Show lookup misses and a bold barcode

#### Automated

- [x] 2.1 `pnpm test src/lib/catalog/get-create-lookup-notices.test.ts` passes. `c21aed0`
- [x] 2.2 `pnpm typecheck` exits 0. `c21aed0`

#### Manual

- [ ] 2.3 A barcode absent from the hab unit and the global store, with a catalog hit, shows "The item was not found in our database.", hides the catalog sentence, prefills the name, and still submits.
- [ ] 2.4 The same path, when every catalog misses, shows both sentences, leaves the name empty, and still submits.
- [ ] 2.5 The barcode on the item create form is bold.
- [ ] 2.6 Add-to-hab-unit and already-stocked do not show those sentences.

### Phase 3: Show the loading screen while lookup runs

#### Automated

- [ ] 3.1 `pnpm lint` exits 0.
- [ ] 3.2 `pnpm typecheck` exits 0.

#### Manual

- [ ] 3.3 `/inventory/new?barcode=` for a valid barcode absent from the hab unit shows `LoadingScreen` until the create form replaces it.
- [ ] 3.4 `/inventory/scan` shows `LoadingScreen` until the scanner replaces it.
- [ ] 3.5 With `prefers-reduced-motion: reduce`, the rings stay visible and do not spin. The screen-reader label stays `Loading`.
