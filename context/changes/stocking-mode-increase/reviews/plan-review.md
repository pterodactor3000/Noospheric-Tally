<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Stocking Mode Increase Implementation Plan

- **Plan:** `context/changes/stocking-mode-increase/plan.md`
- **Mode:** Deep
- **Date:** 2026-09-29
- **Grounding:** 13/13 cited paths verified, 8/8 existing symbols verified, brief and plan consistent.
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

### F1: Result camera counts the can still in frame

- **Severity:** WARNING
- **Impact:** HIGH
- **Dimension:** Blind Spots
- **Location:** Implementation Approach, Phase 3 scan page and `BarcodeScanner` contract
- **Detail:** The plan mounted a new `ScanCapture` on the stocking result, and that mount starts the camera again. `BarcodeScanner` decodes on mount and stops at the first hit (`src/components/barcode-scanner.tsx` lines 51-54 and 84-85). The can just counted is still in frame, so the new mount would call `stockScannedItem` again. Manual 3.3 could pass on that automatic second hit. The refresh rule did not cover it.
- **Fix:** On the stocking result, arm the next count of that barcode only after the camera has missed it for 500ms. A different code still counts immediately. Also show one toast, `Item {name} {barcode} was added to inventory.`, and drop the `added` flag so refresh does not show it again.
- **Decision:** FIXED (500ms miss before the same code counts again; toast `Item {name} {barcode} was added to inventory.` once per successful stocking add)
