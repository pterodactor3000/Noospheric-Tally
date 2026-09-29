<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: scan-to-create-item Phase 4

Change: scan-to-create-item
Scope: phase 4
Date: 2026-09-22
Sealed: 2026-09-22

Grounding: plan `context/changes/scan-to-create-item/plan.md` Phase 4; `plan-brief.md`; `change.md`; `lessons.md` absent. Commits `a166bbf`, `8c7cc8a`, and `bc5b239` against `9fddb83`, plus the working tree after triage. `src/app/inventory/new/item-create-form.tsx` already accepted `defaultName` before this phase. Commands after triage: `pnpm test` 51 passed; `pnpm lint` exit 0; `pnpm exec tsc --noEmit` exit 0; `pnpm worker:check` exit 0. Worker bindings include the four Open Facts URLs. The bundle User-Agent reads `package.json` version `0.2.0`. Manual Progress 4.3, 4.4, and 4.5 remain unchecked. Progress 4.1 and 4.2 are checked from those commands.

At first pass the suite was red, the catalog raced four hosts the plan did not name, names were not cut to 120 characters, a hung catalog blocked the create page, and the worker User-Agent could render as `NoosphericTally/undefined`. Triage kept the four calls, amended S-02, and fixed the rest.

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

### F1: `pnpm test` fails after env reads moved to import time
- **Severity:** CRITICAL
- **Impact:** HIGH
- **Dimension:** Success Criteria
- **Location:** `src/lib/env.ts`, `src/lib/definitions.ts`
- **Detail:** `getSupabaseEnv` used Supabase values captured when `definitions.ts` loaded. `env.test.ts` stubs `process.env` after that import, so five tests threw `Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL`.
- **Fix:** Read `process.env` inside `getSupabaseEnv` on each call. Remove the Supabase constants from `definitions.ts`.
- **Decision:** FIXED
- **Resolution:** `getSupabaseEnv` reads `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` on each call. `pnpm test` passed afterward.

### F2: Four catalog hosts, and the live worker has none of their URLs
- **Severity:** WARNING
- **Impact:** HIGH
- **Dimension:** Scope Discipline
- **Location:** `src/lib/catalog/lookup-catalog-name.ts`, `wrangler.jsonc`, `.github/workflows/deploy.yml`
- **Detail:** `lookupCatalogName` races Open Beauty Facts, Open Food Facts, Open Pet Food Facts, and Open Products Facts. The first pass plan named one Open Food Facts URL and no new Worker variable. The dry-run bindings omitted the four catalog URLs.
- **Fix:** Keep the four calls. Update S-02 and Phase 4 to require them. Put the four public base URLs on the worker and in the deploy workflow.
- **Decision:** FIXED
- **Resolution:** Code still requests four catalogs. S-02, `plan.md`, and `plan-brief.md` name those hosts and the first HTTP 200. `wrangler.jsonc` and `deploy.yml` set the four URLs. `lookupCatalogName` reads them on each call, after the worker copies bindings onto `process.env`. `pnpm worker:check` lists all four bindings.

### F3: A found name is not trimmed or cut to 120 characters
- **Severity:** WARNING
- **Impact:** HIGH
- **Dimension:** Plan Adherence
- **Location:** `src/lib/catalog/lookup-catalog-name.ts`
- **Detail:** A found result used `product_name` with no trim and no 120-character cut. A body with only `product_name_en`, or a blank `product_name`, did not follow the contract. `validateItemName` rejects names longer than 120 characters.
- **Fix:** Parse JSON as `unknown`. Use `product_name`, then `product_name_en`. Trim. Return `empty` when the name is blank. Otherwise return `found` with at most 120 characters.
- **Decision:** FIXED
- **Resolution:** `readCatalogName` implements that order. Tests cover truncation, the English fallback, and blank names.

### F4: A slow catalog holds the create page
- **Severity:** WARNING
- **Impact:** HIGH
- **Dimension:** Safety and Quality
- **Location:** `src/lib/catalog/lookup-catalog-name.ts`
- **Detail:** Each request was aborted only after another catalog responded. If every host hung, `/inventory/new` did not render the name field.
- **Fix:** Add `AbortSignal.timeout(3000)` to each request. On timeout, return `{ status: 'empty' }`.
- **Decision:** FIXED
- **Resolution:** Each fetch uses `AbortSignal.any` with the controller signal and `AbortSignal.timeout(3000)`. A test hangs every request and expects `empty`.

### F5: Landing milestone still describes scan-to-create as future work
- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Plan Adherence
- **Location:** `src/app/page.tsx`
- **Detail:** The heading was `Next milestone` and the sentence was `Scan an unknown barcode and record it as a named item.`
- **Fix:** State the present outcome.
- **Decision:** FIXED
- **Resolution:** The heading is `Inventory`. The sentence is `A signed-in member can scan an unknown barcode and save a household name.`

### F6: User-Agent becomes `NoosphericTally/undefined` on the worker
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Adherence
- **Location:** `src/lib/definitions.ts`, `src/lib/fetchHttp200.ts`
- **Detail:** The header used `process.env.npm_package_version`. The worker does not set that variable, so the header could be `NoosphericTally/undefined (pterodactor@pm.me)`.
- **Fix:** The worker build should carry the current `package.json` version.
- **Decision:** FIXED
- **Resolution:** `PROJECT_VERSION` is `package.json` `version`. The dry-run bundle sets the User-Agent from that value, currently `NoosphericTally/0.2.0 (pterodactor@pm.me)`. The plan contract matches.

## Overall verdict

APPROVED after triage. F1-F6 FIXED. Phase 4 prefills a household name from the first HTTP 200 among the four Open Facts catalogs, cuts that name to 120 characters, and leaves the field blank when every catalog fails or times out.

Success Criteria remains WARNING because manual Progress 4.3, 4.4, and 4.5 are still unchecked. Those need a phone on the live HTTPS URL after the next deploy.

<!-- End of report -->
