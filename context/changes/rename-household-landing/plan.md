# Rename Household on the Landing Page Implementation Plan

## Overview

The landing page Inventory section says "save a household name". The product term is hab-unit. This change replaces that one word in the visible sentence so the landing page uses the product term. There is no roadmap item. The work is Linear TEC-54 (parent TEC-46), GitHub issue #53.

## Current State Analysis

- `src/app/page.tsx:80-81` renders the Inventory section copy: "A signed-in member can scan an unknown barcode and save a household name." The sentence is wrapped across two JSX lines, with `household name.` on line 81.
- That is the only occurrence of `household` in `src/app/page.tsx`. A case-insensitive search of the file returns line 81 alone.
- `src/app/layout.tsx:23` has the metadata description `[ A household inventory app for keeping everyday stock visible ]`. It lives in the document head, not in the rendered landing body. A closed decision leaves it unchanged.
- The repo has no landing-page test. No `page.test.*` exists under `src/app`. The only test under `src/app` is `src/app/styles/theme-tokens.test.ts`. No test needs extension, so this plan adds none.
- `package.json` defines the scripts `typecheck` (`next typegen && tsc --noEmit`), `lint` (`eslint .`), and `test` (`vitest run`). All three exist.

## Desired End State

A visitor who is not signed in opens `/` and reads, in the Inventory section: "A signed-in member can scan an unknown barcode and save a hab-unit name." The word household appears nowhere in the visible landing page. Typecheck, lint, and tests pass unchanged.

## What We're NOT Doing

- Database renames.
- Identifier renames, including any `household`-named function, file, or test such as `validate-household-quantity`.
- Other pages.
- TEC-47 through TEC-53.
- The metadata description in `src/app/layout.tsx`.
- A new test file. No landing-page test exists to extend.

## Implementation Approach

Edit the single sentence in the existing JSX paragraph and keep the markup, class names, and line wrapping style as they are. No new component, token, or helper.

## Phase 1: Landing sentence uses hab-unit

### Overview

Replace the word `household` with `hab-unit` in the Inventory section sentence of the landing page.

### Changes Required

#### 1. Landing page copy

**File:** `src/app/page.tsx`

**Intent:** Make the Inventory sentence use the product term hab-unit instead of household. Edit only the text on lines 80-81.

**Contract:** The rendered paragraph text equals exactly "A signed-in member can scan an unknown barcode and save a hab-unit name." Spelling is `hab-unit`, lowercase, with the hyphen. The `<p className={sectionCopy}>` element and all other JSX in the file stay unchanged. No other file is edited.

### Success Criteria

#### Automated Verification

- `pnpm typecheck` exits 0.
- `pnpm lint` exits 0.
- `pnpm test` exits 0.
- A case-insensitive search of `src/app/page.tsx` for `household` returns no match.

#### Manual Verification

- A visitor reading `/` sees hab-unit in the Inventory sentence and does not see household on the landing page.

---

## Testing Strategy

### Unit Tests

- None added. The repo has no landing-page test to extend, and the phase contract forbids a new test file. The existing suite runs unchanged through `pnpm test`.

### Integration Tests

- None.

### Manual Testing Steps

1. Run `pnpm dev` and open `/` while signed out.
2. Read the Inventory section and confirm the sentence is "A signed-in member can scan an unknown barcode and save a hab-unit name."
3. Scan the rest of the landing page and confirm the word household does not appear.

## References

- Roadmap: none. This change has no roadmap item.
- PRD: none referenced.
- Linear TEC-54, parent TEC-46.
- GitHub issue: https://github.com/pterodactor3000/Noospheric-Tally/issues/53
- Edit target: `src/app/page.tsx:80-81`
- Left unchanged by decision: `src/app/layout.tsx:23`
- Scripts: `package.json` (`typecheck`, `lint`, `test`)

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Landing sentence uses hab-unit

#### Automated

- [ ] 1.1 `pnpm typecheck` exits 0.
- [ ] 1.2 `pnpm lint` exits 0.
- [ ] 1.3 `pnpm test` exits 0.
- [ ] 1.4 A case-insensitive search of `src/app/page.tsx` for `household` returns no match.

#### Manual

- [ ] 1.5 A visitor reading `/` sees hab-unit in the Inventory sentence and does not see household on the landing page.
