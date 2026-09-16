<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: scan-to-create-item Phase 1

Change: scan-to-create-item
Scope: phase 1
Date: 2026-09-16
Sealed: 2026-09-16

Grounding: plan `context/changes/scan-to-create-item/plan.md` Phase 1; `plan-brief.md`; `reviews/plan-review.md`; `change.md`; `lessons.md` absent. Commit `fa48cc0` plus the working tree after triage. Files: `supabase/migrations/20260916120209_create_items.sql`, `src/lib/items/validate-item-name.ts`, `validate-item-name.test.ts`, `validate-barcode.ts`, `validate-barcode.test.ts`. Pattern sources: `supabase/migrations/20260816083017_create_households.sql`, `src/lib/hab-unit/validate-hab-unit-name.ts`. Commands: `pnpm lint` exit 0; `tsc --noEmit --incremental false` exit 0; `pnpm test` not re-run after triage (Ask-mode EROFS on Vite temp); `pnpm exec supabase db push` not run.

At first review the commit only added a broken `create table` block. Triage landed RLS, four `security definer` functions, validators, the barcode check, and removal of a leftover `debugger`.

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

### F1: Migration SQL does not parse
- **Severity:** CRITICAL
- **Impact:** HIGH
- **Dimension:** Success Criteria
- **Location:** `supabase/migrations/20260916120209_create_items.sql:19-24` and `:34-40` at review
- **Detail:** Criterion 1.1 requires `pnpm exec supabase db push` with no error. `item_barcodes` used `constraint barcode_length (` instead of `check (`. `household_inventory` was missing a comma after the unique constraint and repeated the extra parenthesis. The households migration already shows `constraint household_name_length check (`.
- **Fix:** Copy the households constraint syntax. Add the missing comma. Confirm the file applies on an empty database.
- **Decision:** FIXED
- **Resolution:** User corrected `check (` syntax and added the unique-constraint comma in the working copy during triage.

### F2: RLS is absent on all three tables
- **Severity:** CRITICAL
- **Impact:** HIGH
- **Dimension:** Safety and Quality
- **Location:** `supabase/migrations/20260916120209_create_items.sql`
- **Detail:** Phase 1 requires RLS on `items`, `item_barcodes`, and `household_inventory`. Authenticated gets a membership select on `household_inventory` only. `items` and `item_barcodes` get no select policy. There are no insert, update, or delete policies. Without RLS, Supabase default grants would let `anon` and `authenticated` read and write the global catalog and every household's stock.
- **Fix:** Enable RLS on all three tables. Add `household_inventory` select for `authenticated` when `household_id` has a `household_members` row for `auth.uid()`. Add no policies on `items` or `item_barcodes`. Add no write policies.
- **Decision:** FIXED
- **Resolution:** User appended `alter table ... enable row level security` for all three tables and `household_inventory_select_if_member`. No write policies. No select policies on `items` or `item_barcodes`.

### F3: The four security-definer functions are missing
- **Severity:** CRITICAL
- **Impact:** HIGH
- **Dimension:** Plan Adherence
- **Location:** `supabase/migrations/20260916120209_create_items.sql`
- **Detail:** The contract requires `find_item_by_barcode`, `create_item`, `add_item_to_household`, and `attach_barcode`. Each is `security definer`, `search_path = ''`, `public.`-qualified, execute for `authenticated` only, and must raise when `auth.uid()` is null or the caller has no household. None existed at review. Manual checks 1.5 to 1.8 could not run.
- **Fix:** Add the four functions in this migration, matching `create_household` for definer, search_path, revoke from `public`, and grant execute to `authenticated`.
- **Decision:** FIXED
- **Resolution:** User appended all four functions with household gates, explicit duplicate/unknown-item raises, revoke from `public`, and grant execute to `authenticated`.

### F4: Name and barcode validators are missing
- **Severity:** WARNING
- **Impact:** HIGH
- **Dimension:** Plan Adherence
- **Location:** `src/lib/items/validate-item-name.ts`, `src/lib/items/validate-barcode.ts`
- **Detail:** Phase 1 names those two modules plus `*.test.ts` siblings. The contract is discriminated `valid` | `invalid`. Name trims to length 1 to 120. Barcode trims, expands UPC-E to UPC-A, then accepts digits only, length 8 to 14. Tests must cover empty, too long, non-digit, UPC-E expansion, and valid cases. No `src/lib/items` directory existed at review.
- **Fix:** Mirror `validateHabUnitName` and its tests. Put UPC-E expansion in `validate-barcode.ts` before the digit and length checks.
- **Decision:** FIXED
- **Resolution:** User added the four files. Name validator trims to 1..120. Barcode validator expands 6-digit and 0/1-prefixed 7/8-digit UPC-E, then applies `^\d{8,14}$`. Tests cover empty, whitespace, non-digit, too long, EAN-13, and 6-digit plus 8-digit UPC-E expansion. The 8-digit path recomputes the UPC-A check digit instead of copying the UPC-E check digit. `04252614` still expands to `042100005264`.

### F5: Barcode check uses the wrong column and skips digits-only
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Adherence
- **Location:** `supabase/migrations/20260916120209_create_items.sql:19-20`
- **Detail:** After the F1 parse fix, the barcode check still read `name`, which `item_barcodes` does not have. The contract is digits only, length 8 to 14, on `barcode`. A push would fail on the missing column.
- **Fix:** Check `barcode` with digits only and length 8 to 14. Keep `UNIQUE (barcode)` and primary key `(item_id, barcode)`.
- **Decision:** FIXED
- **Resolution:** User replaced the check with `constraint barcode_digits_length check (barcode ~ '^[0-9]{8,14}$')`.

### F6: `debugger` left in `validateBarcode`
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Safety and Quality
- **Location:** `src/lib/items/validate-barcode.ts:25` at triage
- **Detail:** `getUpcACheckDigit` contained `debugger`. A debug session would pause on every UPC-E expand, including tests. Raised during F4 verification, not in the first review pass.
- **Fix:** Delete that line.
- **Decision:** FIXED
- **Resolution:** User removed `debugger`. No `debugger` remains under `src/`.

## Overall verdict

APPROVED after triage. F1-F6 FIXED. Phase 1 code matches the plan.

Success Criteria remains WARNING because 1.2 is skipped. 1.1, 1.3, and 1.4 passed after triage (`db push` applied `20260916120209_create_items.sql`; `pnpm test` 30/30; lint and typecheck exit 0). Manual 1.5 to 1.9 were checked by the user against the linked project. 1.2 still needs a throwaway empty project; a second push on live would skip already-applied files.

<!-- End of report -->
