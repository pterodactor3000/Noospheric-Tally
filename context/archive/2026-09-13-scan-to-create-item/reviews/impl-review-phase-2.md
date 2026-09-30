<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: scan-to-create-item Phase 2

Change: scan-to-create-item
Scope: phase 2
Date: 2026-09-20
Sealed: 2026-09-20

Grounding: plan `context/changes/scan-to-create-item/plan.md` Phase 2; `plan-brief.md`; `change.md`; `lessons.md` absent. First-pass commit `cda079d` vs `dd12d95`. Working tree after triage. Planned paths landed under `hab-unit*` names. Extra files: RPC wrappers, split forms, `src/lib/helpers`, barcode GET form. CodeRabbit CLI: 5 findings on 18 files. Commands at first pass: `pnpm test` 37/37; `pnpm lint` exit 0 with unused-var warnings; `pnpm typecheck` exit 0; `pnpm worker:check` exit 0. Manual Progress 2.3-2.8 still unchecked.

At first pass `/hab-unit/new` and `/` used `require*` helpers in the wrong direction, `createItem` could catch its own `redirect()`, and typed create skipped the global-hit branch. Triage restored the S-01 routes, finished the create control flow, and sent typed barcodes through `?barcode=`.

## Verdicts

| Dimension | Verdict |
| --- | --- |
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety and Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | WARNING |

## Findings

### F1: `/hab-unit/new` cannot create a hab-unit
- **Severity:** CRITICAL
- **Impact:** HIGH
- **Dimension:** Safety and Quality
- **Location:** `src/app/hab-unit/new/page.tsx`
- **Detail:** `requireCurrentHabUnit()` redirected a missing hab-unit to `/hab-unit/new`. The create form was unreachable. A user who already had a hab-unit stayed on the form.
- **Fix:** Keep `requireCurrentUser`. Load with `loadCurrentHabUnit`. Redirect to `/inventory` only when a hab-unit exists.
- **Decision:** FIXED
- **Resolution:** User restored `loadCurrentHabUnit` and the existing-hab-unit redirect to `/inventory`.

### F2: `createItem` catches its own redirect
- **Severity:** CRITICAL
- **Impact:** HIGH
- **Dimension:** Safety and Quality
- **Location:** `src/app/inventory/actions.ts`
- **Detail:** `redirect()` throws. Global-hit and race-recovery redirects sat inside the outer `try`. The `catch` could return a write-failure after a successful add. After redirect was moved out, a global hit still fell through into `createNewItem`.
- **Fix:** Add on a global hit and skip `createNewItem`. Keep create-and-relookup in the else branch. Call `redirectToInventory()` only after the outer `try/catch`.
- **Decision:** FIXED
- **Resolution:** User applied that control flow. Household hit returns `exists`. Global hit adds only. Unknown barcode creates. Create failure re-looks up, then exists, add, or error.

### F3: Home page inverts public landing and signed-in redirect
- **Severity:** WARNING
- **Impact:** HIGH
- **Dimension:** Scope Discipline
- **Location:** `src/app/page.tsx`
- **Detail:** Unplanned helper swap. Signed-out visitors went to `/login`. Signed-in users stayed on the landing.
- **Fix:** Restore `loadCurrentUser`. Redirect to `/inventory` only when a user exists.
- **Decision:** FIXED
- **Resolution:** User restored `loadCurrentUser` and the signed-in redirect to `/inventory`.

### F4: Typed barcode skips the global-hit add form
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Adherence
- **Location:** `src/app/inventory/new/page.tsx`
- **Detail:** Household and global lookup ran only for a valid `?barcode=`. A typed barcode stayed on `ItemCreateForm`. Attach of a globally known code could hit the unique-barcode raise.
- **Fix:** Make the typed barcode a GET to `/inventory/new?barcode=`, then reuse the server branches.
- **Decision:** FIXED
- **Resolution:** Added `barcode-lookup-form.tsx`. Invalid query param stays on the lookup form with the validator message. `ItemCreateForm` takes a required barcode.

### F5: Inventory load errors look like an empty shelf
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Safety and Quality
- **Location:** `src/lib/items/load-hab-unit-items.ts`
- **Detail:** Query error returned `null`. Callers coalesced that to `[]`.
- **Fix:** Throw on failed or missing data. Return `Promise<Item[]>`. Drop `?? []`.
- **Decision:** FIXED
- **Resolution:** User threw on `error || !data`, typed the loader as `Promise<Item[]>`, and passed the array through on `/inventory` and `/inventory/new`.

### F6: Attach does not require an explicit item choice
- **Severity:** WARNING
- **Impact:** LOW
- **Dimension:** Plan Adherence
- **Location:** `src/app/inventory/new/item-create-form.tsx`
- **Detail:** Plan requires an explicit attach choice. Radios had no `required`.
- **Fix:** Put `required` on the radio group.
- **Decision:** FIXED
- **Resolution:** User set `required` on the attach radios.

### F7: Create form state is a hand-copied action type
- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Pattern Consistency
- **Location:** `src/app/inventory/new/item-create-form.tsx`
- **Detail:** `ItemCreateFormState` listed fields by hand. A first edit put `createItem`'s return type on `ItemAttachFormState`.
- **Fix:** Derive create state from `createItem` and attach state from `attachBarcode`. Narrow `exists` without an extra name guard.
- **Decision:** FIXED
- **Resolution:** User aligned both aliases and the `exists` branch.

## Overall verdict

APPROVED after triage. F1-F7 FIXED. Phase 2 create, stock, and attach match the plan.

Success Criteria remains WARNING because Progress 2.3-2.8 are still unchecked. Automated 2.1 and 2.2 passed at first pass (`pnpm test` 37/37; lint, typecheck, and `worker:check` exit 0). Re-run those commands after the triage edits before checking 2.1 and 2.2.

<!-- End of report -->
