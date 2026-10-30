<!-- IMPL-REVIEW-REPORT -->

# Implementation review: restock-list-by-shortfall

Date: 2026-10-30
Scope: completed phases 1 through 3
Verdict: NEEDS ATTENTION, then corrected in triage

Grounding: plan adherence and safety reviews on 2026-10-30. Commits `d6476c0` and `9de8680`, plus uncommitted follow-ups. `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm worker:check` exited 0.

## Verdicts

| Dimension | Verdict |
| --- | --- |
| Plan Adherence | WARNING |
| Scope Discipline | PASS |
| Safety and Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1: Stale flex-col sentence

- Severity: OBSERVATION
- Impact: LOW
- Dimension: Plan Adherence
- Location: `context/changes/restock-list-by-shortfall/plan.md:318`
- Detail: The sentence said `itemTitle` loses `flex-col`. The next contract line requires two stacked heading rows, and the editor keeps `flex-col` for that stack.
- Fix: Delete the stale clause. Leave the heading code.
- Decision: FIXED. The plan now says `flex-col` stays so the rows stack.

### F2: Narrow barcode line is closed to the keyboard

- Severity: WARNING
- Impact: MEDIUM
- Dimension: Safety and Quality
- Location: `src/app/inventory/[itemId]/item-level-editor.tsx`
- Detail: The name was a label with `onClick`, so it was not in the tab order and did not support `aria-expanded`.
- Fix: Render the name as `<button type="button">` with the heading text styles.
- Decision: FIXED. The name is that button. `aria-expanded` follows whether the barcode line is shown.

### F3: Wide layout and the expanded state disagree

- Severity: WARNING
- Impact: LOW
- Dimension: Safety and Quality
- Location: `src/app/inventory/[itemId]/item-level-editor.tsx`
- Detail: From `sm` up the barcode row was visible while `aria-expanded` stayed false, and a click changed the narrow open flag without changing the wide layout.
- Fix: Drive the expanded, hidden, and inert state from one shown flag. Ignore name clicks at `40rem` and wider.
- Decision: FIXED. `isBarcodeLineShown` drives those attributes. A wide click returns without changing `isBarcodeLineOpen`.
