<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Align Tally Controls and Widen the Tally

- **Plan:** `context/changes/align-tally-controls/plan.md`
- **Mode:** Deep
- **Date:** 2026-11-01
- **Grounding:** 12/12 paths verified, 14/14 symbols and line ranges verified, brief and plan consistent.
- **Verdict:** REVISE

## Dimension Verdicts

| Dimension | Verdict |
| --- | --- |
| End-State Alignment | WARNING |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | PASS |

## Findings

### F1: Removing the panel padding clips focus rings and the separator glow

- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Blind Spots
- **Location:** Phase 3, change 1 (`inventorySection`)
- **Detail:** Dropping `panel` removes `p-8 sm:p-12` while `overflow-y-auto` stays. Focus rings and the separator glow paint outside the content box and get clipped.
- **Fix:** Option A, `px-1` on the section. The 4px inset is the accepted tolerance against the main width. The 8px glow may still be trimmed.
- **Decision:** FIXED

### F2: Centered `[+]` glyphs will not share a right edge with the flush category text

- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** End-State Alignment
- **Location:** Phase 1 (`countControlPart`), Phase 2 contract, checks 2.5 and 1.7
- **Detail:** A centered `[+]` in a 44px cell ends about 9px short of flush category text and the Use value.
- **Fix:** Option A. The increase button uses `text-right` and does not also use `text-center`.
- **Decision:** FIXED

### F3: Phase 2 open-list claim is unproven, with no fallback

- **Severity:** OBSERVATION
- **Impact:** MEDIUM
- **Dimension:** Blind Spots
- **Location:** Phase 2, Intent and check 2.7
- **Detail:** `text-align-last` may or may not affect the native option list. Check 2.7 still detects a change. No CSS fallback was added.
- **Fix:** Add `[&_option]:[text-align-last:start]` only if check 2.7 fails.
- **Decision:** ACCEPTED

### F4: Two Phase 1 and 3 classes do nothing, and one claim is wrong

- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Lean Execution
- **Location:** Phase 1 change 1 (`justify-end`), Phase 3 contract (`min-w-0`)
- **Detail:** `justify-end` has no spare room. `min-w-0` does not stop a long name from widening this column-flex section.
- **Fix:** Drop both classes and state the real reason.
- **Decision:** FIXED

### F5: Three phases and nine delegate cycles for a three-file Low change

- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Lean Execution
- **Location:** Phases 1 to 3
- **Detail:** The three phases match the three acceptance criteria. Folding Phase 2 into Phase 1 is optional.
- **Fix:** Leave the split.
- **Decision:** SKIPPED
