<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Household Sign-In Implementation Plan

- **Plan:** `context/changes/household-sign-in/plan.md`
- **Mode:** Deep
- **Date:** 2026-08-09
- **Grounding:** 7/7 cited existing paths verified; package content and src tree had drifted since seal; planned create paths correctly absent; brief and plan consistent after triage
- **Verdict:** SOUND

## Dimension Verdicts

| Dimension | Verdict |
| --- | --- |
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | PASS |
| Plan Completeness | PASS |

## Findings

### F1: Current State and Phase 1 ignore premature package and path work

- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Completeness
- **Location:** Current State Analysis · Phase 1
- **Detail:** Plan claimed no `@supabase/*` and exactly three `src/` files. Repo already had both packages as `devDependencies` and an empty env stub (later at `src/lib/env.ts`).
- **Fix:** Update Current State to the real tree. Amend Phase 1 to promote packages into `dependencies` and replace the empty `src/lib/env.ts` stub.
- **Decision:** FIXED (recommended fix applied)

### F2: Supabase Auth dashboard settings have no phase checklist

- **Severity:** WARNING
- **Impact:** HIGH
- **Dimension:** Blind Spots
- **Location:** Phase 1 · Phase 5 · Risks and Assumptions
- **Detail:** Plan assumed email confirmation off and a provisioned project, but no phase required Site URL or confirmation settings.
- **Fix:** Add explicit Phase 1 dashboard contract and manual criteria for email confirmation off, Site URL, and README documentation.
- **Decision:** FIXED (recommended fix applied)

### F3: One-household-per-user is app-enforced only

- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Architectural Fitness
- **Location:** Phase 3 schema contract
- **Detail:** `create_household` refused a second membership, but `household_members` lacked `UNIQUE(user_id)`.
- **Fix:** Add `UNIQUE (user_id)` on `household_members` in the migration contract.
- **Decision:** FIXED (recommended fix applied)

### F4: `get*` helpers claimed pure, against team conventions

- **Severity:** WARNING
- **Impact:** LOW
- **Dimension:** Architectural Fitness
- **Location:** Phase 4 `getCurrentUser` · Phase 6 `getCurrentHousehold`
- **Detail:** Plan called I/O helpers pure while team conventions require `get*` / `find*` / `is*` queries to be pure.
- **Fix:** Rename to `loadCurrentUser` / `loadCurrentHousehold` and drop the purity claim for those helpers.
- **Decision:** FIXED (rename applied)

### F5: Server-client `setAll` try/catch is optional now

- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Lean Execution
- **Location:** Phase 1 server client factory
- **Detail:** Current `@supabase/ssr` allows omitting `setAll` on server components; proxy owns refresh.
- **Fix:** Omit `setAll` on the server-component client; keep full `getAll`/`setAll` only in `src/proxy.ts`.
- **Decision:** FIXED (recommended fix applied)

### F6: Phase 4 redirects to `/login` before that route exists

- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Lean Execution
- **Location:** Phase 4 manual criteria
- **Detail:** Until Phase 5 lands, the redirect target 404s.
- **Fix:** Note in Phase 4 that a 404 at `/login` is expected until Phase 5; criterion is the redirect itself.
- **Decision:** FIXED (recommended fix applied)

### F7: Server-action placement is inconsistent across phases

- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Architectural Fitness
- **Location:** Phase 5 `src/app/(auth)/actions.ts` · Phase 6 household creation
- **Detail:** Auth mutations were route-colocated; household creation lived under `src/lib/`.
- **Fix:** Move household creation to `src/app/household/actions.ts`; keep loaders and pure validators under `src/lib/`.
- **Decision:** FIXED (route-colocated convention applied)
