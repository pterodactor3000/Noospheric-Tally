# Scan to Create Item Implementation Plan

## Overview

Deliver roadmap slice S-02 (`scan-to-create-item`): a signed-in household member can scan a barcode the household has never stored, record it as a named item, attach that barcode to an existing product when it is the same good, and accept a catalog prefill when Open Food Facts has a name. This satisfies FR-002, FR-005, FR-016, and guardrail 3.

The slice adds the first inventory write and the first camera capture. Product identity is shared: one `items` row per product, many barcodes, many households. `household_inventory` is what this household stocks. Counts, scan direction, and undo stay in S-03 and S-04. Quantity lives on `household_inventory` as `0` and is not shown or changed here.

## Current State Analysis

- `/inventory` requires a user and a hab-unit, then renders a static empty state that names scanning without implementing it (`src/app/inventory/page.tsx:8-37`).
- Middleware already gates `/inventory` and `/inventory/:path*` with `getUser()` on the Edge runtime (`src/middleware.ts:33-49`).
- Schema is household identity only: `households`, `household_members`, select-only RLS, and `create_household` (`supabase/migrations/20260816083017_create_households.sql:2-87`).
- The only table read in `src/` is `households` `id, name` (`src/lib/hab-unit/load-current-hab-unit.ts:11-14`).
- Mutations use `'use server'` actions, `FormData`, discriminated-union validators, and mapped errors (`src/app/hab-unit/actions.ts:20-63`).
- Client forms use `useActionState`, `aria-invalid`, and `role="alert"` (`src/app/hab-unit/new/hab-unit-name-form.tsx:22-91`).
- No items table, barcode column, camera API, catalog fetch, or scanner package (`package.json:24-34`).
- Live HTTPS URL for phone camera checks: `https://noospheric-tally.eldritchcode-it.workers.dev` (`README.md:73`). Local `pnpm dev` and `pnpm preview` are HTTP (`README.md:11`, `67`).
- Vitest runs in Node on `src/**/*.test.ts` (`vitest.config.mts:14-17`).
- F-01 is archived. S-01 is `impl_reviewed` in live code. Roadmap still lists S-01 as `ready`.
- Research record: `context/changes/scan-to-create-item/research.md`.
- Plan review F1, F2, F4, F5 are in force. F3's household-scoped `items.household_id` model was dismissed.

## Desired End State

A member signed in on a phone over HTTPS can open scan from `/inventory`, point the camera at a grocery barcode or type the digits, and add that product to this household when the household does not already stock it. Open Food Facts may prefill the household name. The user can edit that name before save. If the household already has products, the user can attach a new barcode to one of them. The inventory page lists this household's names. Quantity stays `0` and is not shown.

A barcode this household already stocks shows the household name and does not insert. A barcode another household already stored, that this household has not, adds a `household_inventory` row for the same `items.id`. It does not create a second product.

Verify on the live HTTPS URL from a phone, and with `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm worker:check`.

## What We're NOT Doing

- Raising or lowering counts, stocking or using modes, session undo (S-03, S-04, FR-003, FR-004, FR-009, FR-012).
- Showing quantity, minimums, or restock flags (S-06, FR-007, FR-008).
- Name search as a replacement for a failed camera (FR-006). Typed digits are the camera-failure path in this slice.
- Items with no barcode (FR-013, S-05). `items` has no required barcode column. Barcodes live on `item_barcodes`.
- Offline scanning, native apps, catalog vendors other than Open Food Facts, write access to Open Food Facts.
- Browser-level end-to-end tests.
- Listing every global product to clients. Global lookup is by barcode through a `security definer` function only.

## Implementation Approach

Copy the S-01 write pattern: validate at the action boundary, mutate through `security definer` RPCs, keep table policies select-only where a client read exists, load household context with `loadCurrentHabUnit()`, and protect new routes under the existing `/inventory/:path*` matcher.

Product rows are shared. Household stock is not. Phases land data first, then a typed create, add-to-household, and attach path, then the reusable ZXing scanner, then Open Food Facts.

## Critical Implementation Details

**Three tables.** `items` is shared product identity (`id`, optional canonical `name`, `created_at`). `item_barcodes` holds codes with `UNIQUE (barcode)` globally. `household_inventory` holds `household_id`, `item_id`, household `name`, `quantity` default 0, `UNIQUE (household_id, item_id)`.

**Household name is local.** `household_inventory.name` is what the user edits and what `/inventory` lists. `items.name` is the canonical name from first create or catalog. One household renaming a product must not rename it for another.

**Three barcode outcomes.**
1. This household already stocks the item: show `household_inventory.name`. No insert. No quantity change.
2. The barcode exists globally, this household does not stock it: add `household_inventory` for that `items.id`. Do not insert a second `items` row.
3. The barcode is unknown: create `items` + `item_barcodes` + `household_inventory`, or attach the barcode to a product this household already stocks (FR-005).

**Attach is global and gated.** `attach_barcode` adds a code to a shared `items` row. The caller must already stock that item. A household cannot attach a barcode to a product it does not stock.

**Look up before insert (F2).** Actions call household-scoped and global-scoped lookups. The household lookup is `find_item_by_barcode`, then a `household_inventory` select by that `item_id`. Do not join `household_inventory` to `item_barcodes` through PostgREST. Loaders return `itemId` as `items.id`, never `household_inventory.id`. On a household hit, return `{ status: 'exists', name }`. Do not use RPC error text.

**Offer existing household items (F1).** When this household has inventory rows, show up to 20 household names, then filter. Do not offer the global catalog.

**iOS Safari does not expose `BarcodeDetector`.** Use `@zxing/browser` `BrowserMultiFormatReader.decodeFromVideoDevice` with `EAN_13`, `EAN_8`, `UPC_A`, `UPC_E`. Expand `UPC_E` text to UPC-A before lookup or save. Stop after the first successful decode.

**Camera needs a secure context.** Verify on the live `workers.dev` HTTPS URL.

**Open Food Facts is fail-open.** `GET https://world.openfoodfacts.org/api/v2/product/{barcode}?fields=product_name,product_name_en` with `User-Agent: NoosphericTally/0.1 (https://github.com/pterodactor3000/Noospheric-Tally)`. Failure leaves the household name empty.

**Session reads use `getUser`, never `getSession`.** (`src/middleware.ts:33-35`)

**RPCs use `search_path = ''` and `public.`-qualified names**, same as `create_household` (`supabase/migrations/20260816083017_create_households.sql:53-76`).

**`quantity` stays hidden.** It lives on `household_inventory`. S-02 neither displays nor updates it.

---

## Phase 1: Shared item identity and household inventory

### Overview

Add shared products, global barcodes, household stock rows, select-only RLS, RPCs, and pure validators. No UI.

### Changes Required

#### 1. Schema migration

**File:** `supabase/migrations/<timestamp>_create_items.sql`

**Intent:** Separate product identity from household stock so the same EAN is one `items` row for every household.

**Contract:**
`items` has `id uuid primary key default gen_random_uuid()`, `name text` nullable (canonical, trimmed length 1 to 120 when present), `created_at timestamptz not null default now()`. No `household_id`. No `quantity`.
`item_barcodes` has `item_id uuid not null references public.items(id) on delete cascade`, `barcode text not null`, `created_at timestamptz not null default now()`, primary key `(item_id, barcode)`, and `UNIQUE (barcode)`. Barcode text is digits only, length 8 to 14.
`household_inventory` has `id uuid primary key default gen_random_uuid()`, `household_id uuid not null references public.households(id) on delete cascade`, `item_id uuid not null references public.items(id) on delete cascade`, `name text not null` with trimmed length 1 to 120, `quantity integer not null default 0`, `created_at timestamptz not null default now()`, and `UNIQUE (household_id, item_id)`.

#### 2. Row-level security

**File:** same migration

**Intent:** Clients can read this household's stock. They cannot list the global product table. Writes stay in RPCs.

**Contract:** RLS on all three tables. No insert, update, or delete policy for `authenticated` on any of them.
`household_inventory` select when `household_id` has a `household_members` row for `auth.uid()`, through membership only.
`items` and `item_barcodes` have no select policy for `authenticated` or `anon`. Global barcode lookup goes through the function below.

#### 3. Functions

**File:** same migration

**Intent:** Atomic create, stock, attach, and barcode lookup without leaking other households' inventory.

**Contract:** All `security definer`, `search_path = ''`, `public.`-qualified names, execute to `authenticated` only. Raise when `auth.uid()` is null or the caller has no household.

`find_item_by_barcode(item_barcode text)` returns `item_id uuid`, `canonical_name text`. Looks up `public.item_barcodes` only. Returns no household names.

`create_item(item_name text, item_barcode text) returns uuid`. Raises when that barcode already exists. Inserts `public.items` (canonical name = item_name), one `public.item_barcodes` row, and one `public.household_inventory` row for the caller (`name` = item_name, `quantity` default). Returns `items.id`.

`add_item_to_household(target_item_id uuid, item_name text) returns uuid`. Raises when the item does not exist or the household already stocks it. Inserts `public.household_inventory` only. Returns `target_item_id`.

`attach_barcode(target_item_id uuid, item_barcode text) returns uuid`. Raises when the caller does not stock that item or the barcode already exists. Inserts `public.item_barcodes`. Returns `target_item_id`.

#### 4. Validators

**File:** `src/lib/items/validate-item-name.ts`, `src/lib/items/validate-barcode.ts`, plus `*.test.ts` siblings

**Intent:** Mirror `validateHabUnitName` (`src/lib/hab-unit/validate-hab-unit-name.ts:16-29`).

**Contract:** Discriminated unions `valid` | `invalid`. Name: trim, length 1 to 120. Barcode: trim, expand UPC-E to UPC-A, then digits only, length 8 to 14. Tests cover empty, too long, non-digit, UPC-E expansion, and valid cases with `toEqual`.

### Success Criteria

#### Automated Verification

- The migration applies with `pnpm exec supabase db push` and no error.
- Re-running the full migration set from empty reproduces the schema.
- `pnpm test` passes including the new name and barcode validator cases, including UPC-E expansion.
- `pnpm lint` and `pnpm typecheck` exit zero.

#### Manual Verification

- As a household member, `create_item` inserts one `items` row, one barcode, and one `household_inventory` row at quantity 0.
- A second `create_item` with the same barcode is refused.
- `attach_barcode` by that member adds a second barcode to the same `items.id`.
- A second household calling `add_item_to_household` for that item gets its own inventory row. It cannot select the first household's `household_inventory`.
- Authenticated PostgREST select on `items` or `item_barcodes` returns zero rows. Anon select on all three tables returns zero rows.

---

## Phase 2: Manual create, stock, and attach

### Overview

A signed-in member can type a barcode and a name from `/inventory`. First household item skips the attach picker. Later unknown barcodes can attach to a household product. A barcode this household already stocks does not insert. A globally known barcode this household does not stock adds inventory only.

### Changes Required

#### 1. Loaders

**File:** `src/lib/items/load-household-item-by-barcode.ts`, `src/lib/items/find-global-item-by-barcode.ts`, `src/lib/items/load-household-items.ts`

**Intent:** Household reads through RLS. Global reads through `find_item_by_barcode`. Keep I/O helpers named `load*` or `find*`.

**Contract:** `loadHouseholdItemByBarcode(barcode)` calls `find_item_by_barcode`, then selects `household_inventory` for this household by that `item_id`. Returns `{ itemId, name }` or `null`. Do not join `household_inventory` to `item_barcodes` through PostgREST. `findGlobalItemByBarcode(barcode)` calls `find_item_by_barcode` and returns `{ itemId, canonicalName }` or `null`. `loadHouseholdItems({ limit }?)` returns `{ itemId, name }[]` from `household_inventory` ordered by name, no quantity. Omit `limit` on `/inventory`. Pass `{ limit: 20 }` only for the attach offer list. None redirect. Server client only (`src/lib/supabase/server.ts:6-29`).

#### 2. Server actions

**File:** `src/app/inventory/actions.ts`

**Intent:** Same mutation shape as `createHabUnit` (`src/app/hab-unit/actions.ts:20-63`).

**Contract:** `'use server'`.
`createItem(formData)` reads `name` and `barcode`, validates, then `loadHouseholdItemByBarcode`. On a household hit, return `{ status: 'exists', name }` and do not write. On a global hit, call `add_item_to_household`. On a miss, call `create_item`. If `create_item` fails, look up the barcode again. A new global hit uses `add_item_to_household`, or `{ status: 'exists', name }` when this household now stocks it. A still-missing barcode maps to `{ status: 'error', message, field?: 'name' | 'barcode' }`. Do not parse RPC error text. Success: `revalidatePath('/inventory')` and `redirect('/inventory')`.
`attachBarcode(formData)` reads `itemId` and `barcode`, validates, calls `attach_barcode`, same error shape and redirect. `itemId` is `items.id`, not `household_inventory.id`.
`addItemToHousehold(formData)` reads `itemId` and `name` when the page is on the global-known path, same success redirect. `itemId` is `items.id`.
None write `quantity`. Do not use RPC error text to detect an existing household barcode or a unique-barcode race (F2, F6).

#### 3. Create route and form

**File:** `src/app/inventory/new/page.tsx`, `src/app/inventory/new/item-create-form.tsx`

**Intent:** Typed path that Phase 3 will feed after a decode.

**Contract:** Server page: same user and hab-unit guards as `src/app/inventory/page.tsx:8-16`. Reads optional `barcode` search param and runs it through the barcode validator so UPC-E is expanded.
Household hit, or `createItem` returns `{ status: 'exists', name }`: render that household name and no create form.
Global hit, household miss: render add-to-household form, name default `canonicalName`, editable.
Global miss and household inventory count is 0: name form only (barcode hidden when the query param is valid).
Global miss and household has rows: name form plus a default list of up to 20 household names ordered by name, plus a filter field (F1). Attach requires an explicit choice. Search is the filter, not the only way to see offers.
Form uses `useActionState`, `aria-invalid`, and `role="alert"`. Wrap actions the same way as `createHabUnit` in `src/app/hab-unit/new/hab-unit-name-form.tsx:22-24` (F4). Quantity is absent.

#### 4. Inventory entry

**File:** `src/app/inventory/page.tsx`

**Intent:** Replace the "Scanning barcode." placeholder with a working entry and this household's name list.

**Contract:** Empty household still says nothing is added, plus a control that goes to `/inventory/new` (Phase 3 adds `/inventory/scan`). After stock exists, list `household_inventory.name` only via `loadHouseholdItems()` with no limit. Signed-out visits to `/inventory/new` follow the existing middleware redirect to `/login` (`src/middleware.ts:37-40`).

### Success Criteria

#### Automated Verification

- `pnpm test` passes including validators.
- `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` exit zero.

#### Manual Verification

- Typed barcode plus name from a first-item household lands on `/inventory` with that name and no attach picker.
- A second unknown barcode can attach to the first household product. Both codes resolve to one `items.id` for that household.
- Submitting a barcode this household already stocks shows the household name and does not insert.
- A second household submitting a barcode the first household created adds inventory only. `items` count stays one. The second household's name can differ.
- Quantity never appears.
- `/inventory/new` while signed out redirects to `/login`.

---

## Phase 3: Camera scan

### Overview

Add a reusable ZXing scanner on `/inventory/scan` with a typed-digits fallback. Phone verification is on the live HTTPS URL.

### Changes Required

#### 1. Dependencies

**File:** `package.json`

**Intent:** Decode EAN and UPC in the browser, including iOS Safari.

**Contract:** Runtime dependencies `@zxing/browser` and `@zxing/library`. No `BarcodeDetector` path.

#### 2. Scanner component

**File:** `src/components/barcode-scanner.tsx`

**Intent:** One capture surface S-03 can reuse.

**Contract:** `'use client'` component. Constructs `BrowserMultiFormatReader` with `DecodeHintType.POSSIBLE_FORMATS` set to `EAN_13`, `EAN_8`, `UPC_A`, `UPC_E`. Calls `decodeFromVideoDevice` with the environment camera when the device lists one. Invokes `onDetect(text)` once and `controls.stop()`. If the format is `UPC_E`, expand to UPC-A before `onDetect`. Cleans up on unmount. Permission denial or `getUserMedia` failure renders the typed-digits field and an actionable message. Does not persist data. If `pnpm worker:check` fails on the ZXing import, load the scanner with a dynamic import and `ssr: false` (F5).

#### 3. Scan route

**File:** `src/app/inventory/scan/page.tsx`

**Intent:** Capture a code, then hand it to the Phase 2 path.

**Contract:** Same auth and hab-unit guards. On detect or typed submit, navigate to `/inventory/scan?barcode=`. The server page reads that param, runs it through the barcode validator so UPC-E is expanded, then calls `loadHouseholdItemByBarcode`. Household hit: show the household name and a link back to `/inventory`. Household miss: navigate to `/inventory/new?barcode=` using the normalized digits. Do not call the loader from the client scanner. Inventory empty state and list gain a control to `/inventory/scan`. README notes that camera checks use the live HTTPS URL, not `localhost`.

### Success Criteria

#### Automated Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm worker:check` exit zero with the ZXing packages installed.

#### Manual Verification

- On a phone at the live HTTPS URL, grant camera access, decode a grocery barcode, and reach the name form, add-to-household form, or the already-stocked name.
- Deny camera access. Typed digits still reach the same path.
- One physical scan produces one detect. The video stream stops after that decode.
- `pnpm dev` on HTTP is documented as insufficient for this check.

---

## Phase 4: Catalog prefill

### Overview

When the barcode is unknown globally, ask Open Food Facts for a name. Prefill is the household name, editable. Failure leaves the field empty. A global hit uses `items.name` as the default household name and does not need catalog.

### Changes Required

#### 1. Catalog client

**File:** `src/lib/catalog/lookup-catalog-name.ts`, `src/lib/catalog/lookup-catalog-name.test.ts`

**Intent:** Server-side public fetch under `global_fetch_strictly_public` (`wrangler.jsonc:10`).

**Contract:** `lookupCatalogName(barcode)` returns `{ status: 'found', name: string }` or `{ status: 'empty' }`. `GET https://world.openfoodfacts.org/api/v2/product/{barcode}?fields=product_name,product_name_en` with the User-Agent above and a short timeout (about three seconds). Use `product_name` or `product_name_en`. Trim the chosen name and truncate it to 120 characters before returning `found`. Treat missing product, blank names, HTTP failure, abort, and thrown fetch as `empty`. Tests mock `fetch` for found, missing, failed, and over-length names, and assert the User-Agent header. No API key. No new Worker var.

#### 2. Prefill on the create page

**File:** `src/app/inventory/new/page.tsx`, `src/app/inventory/new/item-create-form.tsx`, `src/app/page.tsx`

**Intent:** FR-016 without blocking FR-005.

**Contract:** For a globally unknown barcode, the server page calls `lookupCatalogName` and passes the name as the household-name default. The input stays editable. Empty lookup renders a blank name field. Save still requires a valid household name. A truncated catalog name must still save. On create, that name is written to both `items.name` and `household_inventory.name`. Landing milestone copy can now state the S-02 outcome as present.

### Success Criteria

#### Automated Verification

- `pnpm test` passes including catalog client cases (found, missing, failed, User-Agent, over-length truncated).
- `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` exit zero.

#### Manual Verification

- A grocery EAN that Open Food Facts knows prefills a name. Editing it and saving stores the edited household name.
- A pet-food barcode with no catalog hit leaves the name blank. Typing a name still saves.
- A failed or slow lookup still allows a typed name and save.

---

## Testing Strategy

### Unit Tests

- Item name and barcode validators: empty, whitespace, too long, non-digit, UPC-E expansion, valid.
- Catalog client: found name, missing product, HTTP error, abort, User-Agent header, name longer than 120 truncated.

### Integration Tests

- None beyond `pnpm worker:check`. RLS and RPC behavior are verified manually against the linked Supabase project, same as S-01.

### Manual Testing Steps

1. Sign in on the live HTTPS URL and open `/inventory`.
2. Scan a new grocery barcode or type its digits. Confirm or edit the name. Save. See the household name on `/inventory`.
3. Scan a second code for the same product. Attach it. Confirm both codes resolve to one `items.id` for this household.
4. Scan a code this household already stocks. See the household name. Confirm quantity did not appear and no extra inventory row was created.
5. From a second account, submit that same barcode. Confirm a new household name can be saved and `items` does not duplicate.
6. Deny camera permission and complete create with typed digits.

## Migration and Rollback

Apply `supabase/migrations/<timestamp>_create_items.sql` with `pnpm exec supabase db push` (`README.md:36-45`). Rollback is a new down migration that drops `household_inventory`, then `item_barcodes`, then `items`, then the functions. Do not drop `households`. Removing the app routes without dropping tables leaves orphan data but does not break sign-in.

## References

- Roadmap: `context/foundation/roadmap.md` (S-02)
- PRD: `context/foundation/prd.md` (FR-002, FR-005, FR-016, guardrail 3)
- Research: `context/changes/scan-to-create-item/research.md`
- Plan review: `context/changes/scan-to-create-item/reviews/plan-review.md` (F1, F2, F4, F5 kept; F3 model replaced)
- `src/app/inventory/page.tsx:8-37`: empty inventory and scan placeholder
- `src/middleware.ts:33-49`: existing `/inventory/:path*` gate
- `src/app/hab-unit/actions.ts:20-63`: action and RPC pattern to copy
- `src/lib/hab-unit/validate-hab-unit-name.ts:16-29`: validator pattern to copy
- `supabase/migrations/20260816083017_create_households.sql:24-87`: RLS and `security definer` precedent
- `wrangler.jsonc:10`: `global_fetch_strictly_public`
- `README.md:73`: live HTTPS URL
- `package.json:24-34`: current runtime dependencies

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Shared item identity and household inventory

#### Automated

- [ ] 1.1 The migration applies with `pnpm exec supabase db push` and no error
- [ ] 1.2 Re-running the full migration set from empty reproduces the schema
- [ ] 1.3 `pnpm test` passes including name and barcode validator cases, including UPC-E expansion
- [ ] 1.4 `pnpm lint` and `pnpm typecheck` exit zero

#### Manual

- [ ] 1.5 `create_item` inserts one `items` row, one barcode, and one `household_inventory` row at quantity 0
- [ ] 1.6 A second `create_item` with the same barcode is refused
- [ ] 1.7 `attach_barcode` by that member adds a second barcode to the same `items.id`
- [ ] 1.8 A second household `add_item_to_household` gets its own inventory row and cannot select the first household's stock
- [ ] 1.9 Authenticated select on `items` or `item_barcodes` returns zero rows. Anon select on all three tables returns zero rows

### Phase 2: Manual create, stock, and attach

#### Automated

- [ ] 2.1 `pnpm test` passes including validators
- [ ] 2.2 `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` exit zero

#### Manual

- [ ] 2.3 First-item typed create lands on `/inventory` with the household name and no attach picker
- [ ] 2.4 A second unknown barcode can attach to the first household product; both codes resolve to one `items.id`
- [ ] 2.5 A barcode this household already stocks shows the household name and does not insert
- [ ] 2.6 A second household submitting the first household's barcode adds inventory only. `items` count stays one
- [ ] 2.7 Quantity never appears
- [ ] 2.8 `/inventory/new` while signed out redirects to `/login`

### Phase 3: Camera scan

#### Automated

- [ ] 3.1 `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm worker:check` exit zero with ZXing installed

#### Manual

- [ ] 3.2 Phone HTTPS decode reaches the name form, add-to-household form, or the already-stocked name
- [ ] 3.3 Denied camera still completes through typed digits
- [ ] 3.4 One physical scan produces one detect and the stream stops
- [ ] 3.5 README states HTTP local dev is insufficient for the camera check

### Phase 4: Catalog prefill

#### Automated

- [ ] 4.1 `pnpm test` passes including catalog client cases (found, missing, failed, User-Agent, over-length truncated)
- [ ] 4.2 `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` exit zero

#### Manual

- [ ] 4.3 A known grocery EAN prefills a name that can be edited and saved as the household name
- [ ] 4.4 A catalog miss leaves the name blank and still saves a typed household name
- [ ] 4.5 A failed or slow lookup still allows typed save
