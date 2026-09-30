<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: household-sign-in Phase 1

Change: household-sign-in · Scope: phase 1 re-review · Date: 2026-08-09

Grounding: current working tree; proxy files absent; `package.json` deps promoted; `src/lib/env.ts` exports `getSupabaseEnv()` only; `wrangler.jsonc` literal `vars`; deploy workflow env on `worker:check` + deploy; commands: lint 0, typecheck 0, worker:check 0 (vars bound in dry-run)

## Prior findings disposition

| ID | Prior | Now |
| --- | --- | --- |
| F1 premature proxy `/` redirect | CRITICAL | FIXED (no `proxy.ts`) |
| F2 worker:check Node proxy fail | CRITICAL | FIXED (worker:check 0; no Proxy route) |
| F3 `npm run Build` typo | CRITICAL | FIXED (step removed) |
| F4 `{{env.}}` wrangler placeholders | CRITICAL | FIXED (literal publishable values) |
| F5 packages in devDependencies | WARNING | FIXED (runtime `dependencies` + lockfile) |
| F6 eager `supabaseEnv` side effect | WARNING | FIXED (`export { getSupabaseEnv }`) |
| F7 factory path/export names | WARNING | OPEN as current F2 |
| F8 README Auth/env docs | WARNING | OPEN as current F1 |
| F9 Progress unchecked | OBSERVATION | OPEN as current F3 |

## Verdicts

| Dimension | Verdict |
| --- | --- |
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety and Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1: README still missing env + Auth dashboard docs
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Adherence / Success Criteria
- **Location:** `README.md`
- **Detail:** Phase 1 contracts 5–6 and criteria 1.8 require documenting `NEXT_PUBLIC_SUPABASE_*`, where to obtain them, email confirmation off, Site URL = live workers.dev, and local origin allowlist. README still only lists Cloudflare deploy secrets. `.env.example` / `.dev.vars` keys exist (MATCH). Dashboard 1.6/1.7 still need human confirmation outside the repo.
- **Fix:** Add the Supabase env + Auth settings section to `README.md`, then verify dashboard and check Progress 1.6–1.8.
- **Decision:** FIXED
- **Resolution:** Applied recommended README section covering env vars (local, Worker vars, CI secrets) and Auth dashboard settings (email confirmation off, Site URL, localhost allowlist). Dashboard confirmation and Progress 1.6–1.8 remain manual (see F3).

### F2: Client factory names still differ from plan
- **Severity:** WARNING
- **Impact:** LOW
- **Dimension:** Plan Adherence / Pattern Consistency
- **Location:** `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`
- **Detail:** Behavior MATCHES (`createBrowserClient` defaults; server `getAll` only; lazy `getSupabaseEnv()`). Planned paths/exports were `createBrowserSupabaseClient` / `createServerSupabaseClient`. Actual files export `createClient`.
- **Fix:** Rename to planned names, or amend the plan if short Supabase-template names are the chosen convention.
- **Decision:** FIXED
- **Resolution:** Amended plan Phase 1 items 3–4 to `src/lib/supabase/browser.ts` / `server.ts` exporting `createClient()`, imported from `@/lib/supabase/browser` and `@/lib/supabase/server`. Code unchanged.

### F3: Phase 1 Progress and manuals still open
- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Success Criteria
- **Location:** `plan.md` Progress 1.1–1.8
- **Detail:** Automated 1.1–1.3 now have credible evidence (lint/typecheck/worker:check). Manuals 1.4–1.8 remain unchecked. Dev server was down during re-review; no live `/` curl. Empty-URL error shape verified against the env logic (criterion 1.5 shape MATCH).
- **Fix:** Run `npm run dev` and confirm `/` unchanged; complete dashboard checks; update Progress checkboxes after F1 docs land.
- **Decision:** FIXED
- **Resolution:** Checked Progress 1.1–1.8. Automated gates re-verified earlier. `/` returns 200 with landing copy (no login redirect). User confirmed dashboard 1.6/1.7. README docs from F1 cover 1.8; empty-URL error shape covers 1.5.

## Overall verdict

APPROVED after triage. All open findings FIXED. Phase 1 Progress 1.1–1.8 checked.
