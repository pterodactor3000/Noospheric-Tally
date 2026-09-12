<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: household-sign-in Phase 6

Change: household-sign-in · Scope: phase 6 · Date: 2026-09-12 · Sealed: 2026-09-12
Grounding: plan `context/changes/household-sign-in/plan.md` Phase 6; `plan-brief.md`; `change.md`; `lessons.md` absent. Commits `62499ca` and `17a9a8d`. Worktree landing, inventory empty state, hab-unit default name, header bar, and Progress 6.1-6.8. Files after triage: `src/lib/hab-unit/load-current-hab-unit.ts`, `validate-hab-unit-name.ts`, `validate-hab-unit-name.test.ts`, `src/app/hab-unit/actions.ts`, `src/app/hab-unit/new/page.tsx`, `hab-unit-name-form.tsx`, `src/app/inventory/page.tsx`, `src/app/page.tsx`, `src/components/header.tsx`, `src/middleware.ts`. Commands: `pnpm test` 18/18; `pnpm run lint` exit 0; `pnpm run typecheck` exit 0; `pnpm run worker:check` exit 0. Build routes: `/`, `/hab-unit/new`, `/inventory`, `/login`, `/signup`.

Loader, action, validation, and `/hab-unit/new` call `create_household` and read `households` under RLS. Inventory shows the hab-unit name, empty-state copy, and scanning as the next step. Landing has sign-in and sign-up links, scanning milestone copy, and a signed-in redirect to `/inventory`. Name field prefills from the email local part. Header is a top bar. Sign-out lives in the header for signed-in users.

## Verdicts

| Dimension | Verdict |
| --- | --- |
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety and Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1: Inventory does not report empty
- **Severity:** CRITICAL
- **Impact:** HIGH
- **Dimension:** Plan Adherence
- **Location:** `src/app/inventory/page.tsx:29-37`
- **Detail:** Phase 6 contract and criterion 6.4 require the household name plus an explicit empty state that nothing has been added yet, and that scanning is the next step. At review time the page rendered only `Your {habUnit.name} tally`. Progress 6.4 was already checked.
- **Fix:** Add the empty-state copy on `/inventory`. Leave 6.4 unchecked until that copy is visible.
- **Decision:** FIXED
- **Resolution:** User added empty-state copy during triage. Inventory now shows the hab-unit name, `Nothing is added here yet.`, and scanning as the next step. Progress 6.4 remains checked against that markup.

### F2: Planned household routes were replaced
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Adherence
- **Location:** `src/lib/hab-unit/*`, `src/app/hab-unit/*`
- **Detail:** Loader, action, validation, tests, and the create page existed under `hab-unit` names. Middleware matches `/hab-unit`. The RPC and tables remain `create_household` / `households`. Progress 6.3 and 6.6 named `/household/new`, which is not a compiled route.
- **Fix:** Amend the plan and Progress paths to `hab-unit`, or restore the planned `household` modules and `/household/new`.
- **Decision:** FIXED
- **Resolution:** Plan Phase 6 files, exports, matcher, success criteria, Progress 6.1/6.3/6.6, and plan-brief routing now use `hab-unit` modules and `/hab-unit/new`. Schema and `create_household` are unchanged.

### F3: Create form is not prefilled from email
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Adherence
- **Location:** `src/app/hab-unit/new/hab-unit-name-form.tsx:73`
- **Detail:** The contract requires a single-field form prefilled with a default derived from the account email. `NewHabUnit` already loads the user. The form took no default.
- **Fix:** Pass a default from `user.email` into the name input.
- **Decision:** FIXED
- **Resolution:** `NewHabUnit` passes `user.email?.split('@')[0] ?? ''` as `defaultName`. The name input uses that `defaultValue`.

### F4: Header covers the viewport
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Safety and Quality
- **Location:** `src/components/header.tsx:18-20`
- **Detail:** `fixed inset-0` sized the header to the viewport. Sign in still received the click at the button center. Empty regions hit the header.
- **Fix:** Size the header to the top bar (`inset-x-0 top-0`) and keep pointer events on the bar only.
- **Decision:** FIXED
- **Resolution:** Header classes are `fixed inset-x-0 top-0`. The bar sizes to its content. Sign-out stays in the header for signed-in users.

### F5: Keep-alive health check landed in this range
- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Scope Discipline
- **Location:** `17a9a8d` (`src/app/api/health/route.ts`, `custom-worker.ts`, `supabase/migrations/20260912103000_ping_database.sql`)
- **Detail:** The commit is not a Phase 6 path. It is also outside S-01 exclusions. It does not change household creation.
- **Fix:** Keep it as a separate change record, or leave it and do not treat it as Phase 6 evidence.
- **Decision:** ACCEPTED
- **Resolution:** User left the keep-alive commit in place. It is not Phase 6 evidence.

### F6: Automated 6.1 and 6.2 pass and stay unchecked
- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Success Criteria
- **Location:** `plan.md` Progress 6.1-6.2
- **Detail:** `pnpm test` is 18/18, including the five hab-unit name cases. Lint, typecheck, and `worker:check` exit 0. The rows were still open. Manual 6.8 was checked from user attestation.
- **Fix:** Check 6.1 and 6.2 from these command results after F2 is decided. Keep 6.8 checked only if the phone run against the live URL is attested.
- **Decision:** FIXED
- **Resolution:** Progress 6.1 and 6.2 checked from the review command results. 6.3-6.8 remain checked. All Phase 6 progress rows are complete.

## Overall verdict

APPROVED after triage. F1-F4 and F6 FIXED. F5 ACCEPTED. Progress 6.1-6.8 checked.

<!-- End of report -->
