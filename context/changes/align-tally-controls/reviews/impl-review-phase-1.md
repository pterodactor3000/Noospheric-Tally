<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: align-tally-controls phase 1

- **Change:** align-tally-controls
- **Scope:** Phase 1 only, commit `276cc65`, progress record `615aa34`
- **Date:** 2026-11-01
- **Grounding:** `plan.md` and the phase 1 diff. `pnpm typecheck`, `pnpm lint`, and `pnpm test` passed. Vitest passed 47 files and 396 tests. The two `rg` checks matched the plan. The inventory page was not opened in a signed-in browser.
- **Verdict:** APPROVED

## Dimension Verdicts

| Dimension | Verdict |
| --- | --- |
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety and Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS (automated); manual 1.6 to 1.10 pending |

## Findings

### F1: Layout is not verified in a browser

- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Success Criteria
- **Location:** `plan.md` Progress rows 1.6 to 1.10
- **Detail:** These rows are correctly left unchecked. The class contract matches the code. The 44px widths and the no-wrap behavior, including a Minimum of 999 in a `w-11` cell, still need a signed-in browser.
- **Fix:** Run the manual checks before the pull request, on `/inventory` and an item page at 320px, 390px, and 1280px.
- **Decision:** ACCEPTED
- **Resolution:** No code change. The preview browser was sent to the login page, so the rows stay open until a signed-in session can measure them. Check them before the pull request.
