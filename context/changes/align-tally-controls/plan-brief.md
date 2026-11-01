# Align Tally Controls and Widen the Tally Plan Brief

> Full plan: `context/changes/align-tally-controls/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (None. Not a roadmap slice. Linear TEC-47.)

## What and Why

The count controls and the category dropdown do not sit cleanly at the right, and the tally is boxed in a bordered panel capped at 900px. This change right-aligns them, gives `[-]`, the number, and `[+]` one width each, and removes the tally panel.

## Starting Point

Tally rows and the item details Count and Minimum rows put two buttons and a bare number in a right-hand span. The number has no fixed width, so the three parts differ. The category select is as wide as its longest option, so its text sits at the left of its box. `src/app/inventory/page.tsx` wraps the tally in `panel` with `max-w-[900px]`.

## Desired End State

On item details the category text and the count controls share the right edge at any width. Every count control is one line of three 44px parts. `/inventory` has no inner box and uses the full width of `main`. Scan, lookup, and the open category list are unchanged.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Part width | `w-11` (44px) for each of the three parts | Matches today's `min-w-11` tap width. Fits a three-digit minimum. | Plan |
| Where the layout lives | Two shared constants in `src/app/styles/class-names.ts` | The tally and item details share one structure. One source stops drift. | Plan |
| Dropdown alignment | `[text-align-last:right]` only, no `text-align` | Right-aligns the closed text and leaves the open list alone. | Plan |
| Tally panel | Drop `panel` and `max-w-[900px]`, keep the flex column, `max-h` calc, and scroll | Meets the contract and keeps short screens usable. | Plan, TEC-47 |
| Other panels | Restock and item details keep theirs | Only the tally is in the contract. | TEC-47 |
| Tests | No new test, no harness | Vitest is `node`-only and covers `*.test.ts`. Class changes get greps and manual checks. | Plan |

## Scope

**In scope:**

- Count controls on tally rows and the Count and Minimum rows on item details
- The category dropdown on item details
- The tally page container

**Out of scope:**

- Hiding items, category creation, sharing, bulk insert
- Scan page and popups
- Landing copy
- Count default and count cap
- Restock and item details panels

## Approach

Add `countControlGroup` and `countControlPart` to `class-names.ts` and use them in `tally-count-controls.tsx` and `item-level-editor.tsx`. Add `text-align-last: right` to the category select. Remove the panel classes from the tally section in `page.tsx`. Each step is one small, visible change.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Equal-width, right-aligned count controls | Three 44px parts on one line for tally rows and Count and Minimum | Number baseline drifts from the buttons, or a narrow screen squeezes the item name |
| 2. Right-aligned category dropdown | Category text at the right edge at every width | Firefox or Chrome shows the closed text differently, or the open list changes |
| 3. Tally without the inner panel | `/inventory` has no box and fills `main` | Dropping the padding changes the scroll and the short-screen reach of the buttons |

## Risks and Assumptions

- Assumption: "main container" means the content box of `main` (`px-6`). The page does not get a new max width.
- Assumption: 44px per part is the width. The contract says only that the three are equal.
- Assumption: only the tally page loses its panel. Restock and item details keep theirs.
- Assumption: dropping the panel padding is intended, since the content should be as wide as the container.
- Risk: three 44px parts take 132px, so item names truncate sooner at 320px. The removed panel padding gives back 64px or more.
- Risk: no automated test covers the layout, so the manual measurements carry the proof.

## Success Criteria

- The category dropdown on item details is right-aligned at any width.
- The decrease button, the number, and the increase button sit on one right-aligned line, 44px each, on tally rows and on Count and Minimum.
- The tally has no inner bordered container and is as wide as the main container.
- Scan and popups are unchanged.
