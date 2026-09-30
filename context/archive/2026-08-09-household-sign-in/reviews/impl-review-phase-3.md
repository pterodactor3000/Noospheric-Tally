<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: household-sign-in Phase 3

Change: household-sign-in · Scope: phase 3 · Date: 2026-08-16
Grounding: commit `d890c26`; files `supabase/migrations/20260816083017_create_households.sql`, `README.md`, `package.json`, `pnpm-lock.yaml`; CLI `supabase` 2.114.0; linked project `noospheric-tally` (`nlceppgmzezmqutuvqpw`); `supabase db push --dry-run` reports remote up to date; Progress 3.1–3.6 checked after triage.

## Verdicts

| Dimension | Verdict |
| --- | --- |
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety and Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Passing evidence:

- `households` and `household_members` match the column, FK, PK, unique, and check contract. No `role` column. Unique on `user_id` is the only index on that column.
- RLS is enabled on both tables. Members select is `user_id = (select auth.uid())`. Households select uses `exists` on membership. No write policies.
- `create_household(household_name text) returns uuid` is `security definer` with `set search_path = ''`. Raises on null `auth.uid()`, blank name, and existing membership. Inserts both rows and returns the id. `revoke all ... from public` then `grant execute ... to authenticated`.
- `README.md` names `supabase/migrations/` and `pnpm exec supabase db push`.

## Findings

### F1: Unplanned CLI package; README command is unprefixed
- **Severity:** WARNING
- **Impact:** LOW
- **Dimension:** Scope Discipline
- **Location:** `package.json:40`, `README.md:40-42`
- **Detail:** Phase 3 planned only the migration file and README. Commit `d890c26` also adds `supabase` `^2.114.0` as a `devDependency`. README told the reader to run `supabase link` and `supabase db push`, which fail unless that binary is on `PATH`. In this workspace `which supabase` is empty; `node_modules/.bin/supabase` is the installed CLI.
- **Fix:** Document `pnpm exec supabase link --project-ref <project-id>` and `pnpm exec supabase db push`. Keep the CLI as a `devDependency`.
- **Decision:** FIXED
- **Resolution:** README migration commands and the reproduce sentence now use `pnpm exec supabase`. CLI remains a `devDependency`.

### F2: Phase 3 verification gates are unproven
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Success Criteria
- **Location:** `plan.md` Progress 3.1–3.6
- **Detail:** 3.1–3.6 were all `- [ ]` at review start. First `supabase db push --dry-run` returned `Cannot find project ref. Have you run supabase link?`. Manual 3.3–3.6 had no recorded SQL-editor evidence.
- **Fix:** `pnpm exec supabase link --project-ref <project-id>`, then `pnpm exec supabase db push`. Re-run against an empty project for 3.2. Execute 3.3–3.6 in the SQL editor. Check the Progress rows and append the landing SHA `d890c26`.
- **Decision:** FIXED
- **Resolution:** User applied link and push. Linked project `noospheric-tally` (`nlceppgmzezmqutuvqpw`). Dry-run reports remote up to date. Progress 3.1–3.2 checked with SHA `d890c26`. Progress 3.3–3.6 checked as verified 2026-08-16.

## Overall verdict

APPROVED after triage. F1 and F2 FIXED. Phase 3 schema, RLS, `create_household`, and migration docs match the plan.
