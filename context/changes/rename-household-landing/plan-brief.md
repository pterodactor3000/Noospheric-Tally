# Rename Household on the Landing Page Plan Brief

> Full plan: `context/changes/rename-household-landing/plan.md`
> Roadmap item: none. Linear TEC-54, parent TEC-46, GitHub issue #53.

## What and Why

The landing page Inventory sentence says "household name". The product term is hab-unit. Replace that one word so the landing page matches the product language.

## Starting Point

`src/app/page.tsx:80-81` reads "A signed-in member can scan an unknown barcode and save a household name." It is the only `household` in that file. `src/app/layout.tsx:23` also says household in the metadata description, and it stays. The repo has no landing-page test.

## Desired End State

A visitor on `/` reads "A signed-in member can scan an unknown barcode and save a hab-unit name." and sees no household on the landing page.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Complexity | Low | One sentence in one file | Plan |
| Metadata | Option A: change only the landing sentence, leave `src/app/layout.tsx` alone | Keeps the change to the visible copy | User |
| Spelling | `hab-unit` with the hyphen | Matches the product term | User |
| Phases | One | Single-line copy edit | User |
| Tests | No new test file | No landing-page test exists to extend | Plan |

## Scope

**In scope:**

- The Inventory sentence in `src/app/page.tsx`

**Out of scope:**

- Database renames
- Identifier renames
- Other pages
- TEC-47 through TEC-53
- The metadata description in `src/app/layout.tsx`

## Approach

Edit the sentence text in place. Keep the markup, classes, and every other line unchanged. Then run typecheck, lint, and tests, and read `/` once.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Landing sentence uses hab-unit | Inventory sentence reads "save a hab-unit name." | Typing `hab unit` or `habunit` instead of `hab-unit` |

## Risks and Assumptions

- Assumes the head metadata description is not part of "the landing page" a visitor reads. The user closed that decision.
- No automated test covers the copy, so the search for `household` in `src/app/page.tsx` and the manual read of `/` are the checks.

## Success Criteria

- `/` shows "A signed-in member can scan an unknown barcode and save a hab-unit name."
- The word household does not appear on the visible landing page.
- `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass.
