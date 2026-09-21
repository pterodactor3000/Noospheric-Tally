<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: scan-to-create-item Phase 3

Change: scan-to-create-item
Scope: phase 3
Date: 2026-09-21
Sealed: 2026-09-21

Grounding: plan `context/changes/scan-to-create-item/plan.md` Phase 3; `plan-brief.md`; `change.md`; `lessons.md` absent. First-pass commits `75d83e9` and `ac149f9` vs `cbdca53`. Working tree after triage. Extra file: `src/app/inventory/scan/scan-capture.tsx`. CodeRabbit CLI: 5 events, 4 unique findings, 1 duplicate of the camera teardown issue. Commands at first pass: `pnpm test` 37/37; `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm worker:check` exit 0 with `/inventory/scan` in the route table. After triage: `pnpm lint` exit 0; `pnpm test` 37/37; `pnpm typecheck` exit 0. Manual Progress 3.2 and 3.3 still unchecked. 3.4 and 3.5 checked.

At first pass the camera effect could leak the stream on unmount, invalid `?barcode=` restarted capture with no message, and README did not say local HTTP is not the camera check. Triage added dispose tracking, the barcode-camera README section, and validator feedback on the typed fallback.

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

### F1: Camera stream can survive unmount
- **Severity:** WARNING
- **Impact:** HIGH
- **Dimension:** Safety and Quality
- **Location:** `src/components/barcode-scanner.tsx`
- **Detail:** Cleanup was `controls?.stop()` while `decodeFromVideoDevice` was still awaiting. Leave `/inventory/scan` before that promise resolved and the stream kept running. First triage attempt inverted the callback guard (`!isDisposed`), so live scans never called `onDetect`.
- **Fix:** Track `isDisposed`. Stop late controls. Ignore callbacks and `setCameraError` after cleanup. Guard with `isDisposed || !result || hasDetected`.
- **Decision:** FIXED
- **Resolution:** User added dispose tracking and late-stop, then corrected the inverted callback guard.

### F2: README never says local HTTP is not the camera check
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Plan Adherence
- **Location:** `README.md`
- **Detail:** Plan contract and Progress 3.5 require that camera checks use the live HTTPS URL, not localhost. README only mentioned phone HTTPS as a deploy step.
- **Fix:** Add a Barcode camera section after Getting Started.
- **Decision:** FIXED
- **Resolution:** Added the section naming `pnpm dev` and `pnpm preview` as insufficient. Plan 3.5 checked.

### F3: Invalid scan barcode restarts capture with no message
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Pattern Consistency
- **Location:** `src/app/inventory/scan/page.tsx`
- **Detail:** Invalid `?barcode=` rendered `<ScanCapture />` again. No alert, input discarded. `/inventory/new` already shows `validationResult.message` on `BarcodeLookupForm`.
- **Fix:** Pass rejected digits and the validator message into `ScanCapture`. Skip camera start when that message is set.
- **Decision:** FIXED
- **Resolution:** Invalid branch renders `ScanCapture` with `defaultBarcode` and `errorMessage`. Scanner seeds the fallback form and skips `decodeFromVideoDevice`.

### F4: Hints map is an untyped `Map`
- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Pattern Consistency
- **Location:** `src/components/barcode-scanner.tsx`
- **Detail:** `new Map()` at the ZXing hint boundary. Lint and typecheck still passed.
- **Fix:** `const hints = new Map<DecodeHintType, unknown>()`
- **Decision:** FIXED
- **Resolution:** User typed the map as `Map<DecodeHintType, unknown>`.

### F5: Camera `catch` hides the original error
- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Pattern Consistency
- **Location:** `src/components/barcode-scanner.tsx`
- **Detail:** Fallback UI was set. The caught error was not logged.
- **Fix:** `console.error('decodeFromVideoDevice failed', error)` then keep the fallback form.
- **Decision:** FIXED
- **Resolution:** User logged the failure and kept the existing fallback copy.

## Overall verdict

APPROVED after triage. F1-F5 FIXED. Phase 3 ZXing scan route, typed-digits fallback, and HTTPS camera note match the plan.

Success Criteria remains WARNING because Progress 3.1 is still unchecked, and manual 3.2-3.3 need a phone on the live HTTPS URL. Automated lint, test, and typecheck passed after triage. First-pass `worker:check` exited 0 with ZXing installed. Re-run `pnpm worker:check` before checking 3.1.

<!-- End of report -->
