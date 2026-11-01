<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Hide an item from the hab unit tally

- **Plan:** `context/changes/hide-hab-unit-item/plan.md`
- **Mode:** Deep
- **Date:** 2026-11-01
- **Grounding:** 16/16 paths verified, 14/14 symbols verified, brief and plan consistent. One line reference was off and is corrected.
- **Verdict:** REVISE

## Dimension Verdicts

| Dimension | Verdict |
| --- | --- |
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | WARNING |

## Findings

### F1: Irreversible delete ships with no confirmation and no recorded product sign-off

- **Severity:** WARNING
- **Impact:** HIGH
- **Dimension:** Blind Spots
- **Location:** Implementation Approach, Phase 2 control
- **Detail:** One press would delete the inventory row and its quantity history.
- **Fix:** Keep the row delete. The first press arms the button. The second press submits. There is no dialog.
- **Decision:** FIXED

### F2: The "no path back" claim for barcodeless items is incomplete

- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Completeness
- **Location:** Implementation Approach, Risks, manual step 8
- **Detail:** A barcodeless item can be created again by name. The old catalog row stays and is unreachable.
- **Fix:** Say that, and add a manual check that creating by name works.
- **Decision:** FIXED

### F3: A stale hide error masks later save errors

- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Completeness
- **Location:** Phase 2, FormAlert
- **Detail:** Two action states let a failed hide cover a later save error.
- **Fix:** One form action reads `intent` and calls save or hide. One state feeds the alert.
- **Decision:** FIXED

### F4: Failure check 2.16 and the SQL manual checks are not runnable as written

- **Severity:** OBSERVATION
- **Impact:** MEDIUM
- **Dimension:** Plan Completeness
- **Location:** Phase 1 manual checks, Phase 2 check 2.16, Migration and Rollback
- **Detail:** An offline browser never reaches the action catch. `auth.uid()` is null in the SQL editor unless the JWT claims and role are set. `db push` targets the linked project.
- **Fix:** Name the claim-setting steps, the snapshot, and a server-side failure instead of going offline.
- **Decision:** FIXED

### F5: Undo of a scan line fails after the item is hidden

- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Blind Spots
- **Location:** Critical Implementation Details
- **Detail:** A cascade delete removes the change row, so undo in another tab fails.
- **Fix:** Name it as an accepted consequence. No code change.
- **Decision:** FIXED

### F6: One line reference is wrong

- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Plan Completeness
- **Location:** Current State Analysis, References
- **Detail:** `loadHabUnitTallyLines` is called at `src/app/inventory/page.tsx:45`, not `:51`.
- **Fix:** Correct the citation.
- **Decision:** FIXED
