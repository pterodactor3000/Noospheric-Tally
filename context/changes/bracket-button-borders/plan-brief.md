# Bracket Button Borders Plan Brief

> Full plan: `context/changes/bracket-button-borders/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-16)

## What and Why

Frame every shared Button, the tally and item-page count buttons, and every text, search, email, and password input in a bracket border: a left and a right bracket with short arms, 50% taller than the text, as in the TEC-65 mock. Inputs also get a middle-dot track and the app-title block caret while focused. This covers FR-019 chrome for S-16 and adds no behavior.

## Starting Point

Buttons are rectangles, colored through `border-*` classes on a 2px border (`src/components/ui/button.tsx`). Help renders `[ ? ]`. The tally and item-page count buttons are raw `<button>`s that render `[-]` and `[+]`. `Input` is one bordered `<input>` (`src/components/ui/input.tsx`). The app title already has a blinking block caret (`src/components/tally-label.tsx:24-30`). Help copy names `[-]` and `[+]` in three places (`src/app/help/help-topics.ts:37`, `:39`, `:203`).

The delta: one shared CSS frame, a Button rebuilt around it, three new labels, and an `Input` rebuilt as frame, input, and track.

## Desired End State

Every shared Button and count control shows both brackets in every state, with today's colors and hit areas. Help shows `?` and the counts show `-` and `+`, with no typed brackets. Framed inputs show dots for untyped cells, lose one dot per typed character, and show the blinking block caret only while focused. Password still masks. File picker, hidden fields, checkboxes, radios, `Textarea`, and `InputGroup*` are unchanged.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Border is | Drawn brackets, not typed characters | Mock and TEC-65 | Roadmap, TEC-65 |
| Frame size | `1.5em` of the control's own font size | The 50% ratio holds at every size with no per-size code | Plan |
| Frame vs hit area | Frame centered, hit area unchanged | `min-h-11` and `size-11!` call sites keep their 44px tap targets | Plan |
| Default label | 1rem, with a 1.5rem frame | Closed decision. Live code is 0.875rem, so the default label grows by 2px | Plan (repository conflict) |
| Colors | `--bracket-color` replaces border-color classes, per state | Keeps focus, invalid, outline, and destructive treatments | Plan |
| Help, tally, item page | Labels `?`, `-`, `+`. Raw buttons get the same frame | Closed decision | Roadmap, TEC-65 |
| Help copy | `the - button`, `the + button`. Heading `[<hab unit name>] tally` stays | Closed decision | Roadmap, TEC-65 |
| Input structure | Frame span, real input, `aria-hidden` track with invisible mirror, caret, dots | The mirror places dots with no cell math. Focus is CSS only | Plan |
| Which inputs | `text`, `search`, `email`, `password`, or no type. Others render as today | Closed decision | Roadmap, TEC-65 |
| Caret position | After the typed text, not at the native selection | Closed decision wording | TEC-65 |
| `Textarea`, `InputGroup*` | Untouched | Unused on pages | Roadmap, plan |

## Scope

**In scope:**

- `bracket-frame` utility and the shared `Button`.
- `?`, `-`, and `+` labels on Help, the tally, and the item page, with framed raw buttons.
- Help copy for `-` and `+`.
- Frame, dot track, and focus caret on text, search, email, and password inputs.

**Out of scope:**

- S-13 palette work, new routes, any other behavior change.
- Other raw buttons, other typed brackets (`[IN STOCK]`, category display, `[consume]`, `[n short]`).
- File picker, hidden fields, checkboxes, radios, the item `<select>`, `Textarea`, `InputGroup*`.
- Regenerating `public/help/*.png`.
- A component test harness.

## Approach

Add one `@utility bracket-frame` in `globals.css` that draws both brackets with pseudo-elements, in `em`, centered, with a `--bracket-color` fallback. Phase 1 applies it to `Button` and moves each state's border color to that property. Phase 2 changes the labels and frames the two raw buttons. Phases 3 and 4 rebuild `Input` around a frame, a mirror, a dot string, and a caret, with value state tracked in React so typing, `defaultValue`, form reset, and autofill all keep the dots right.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Bracket frame utility and shared Button | Every `Button` is bracket-framed, colors and hit areas unchanged | Each size's font-size class conflicts today with the base `text-sm`. Arms can crowd the smallest buttons |
| 2. Labels, raw count buttons, and help copy | `?`, `-`, `+` with the frame, new help sentences | `itemControl` is shared with the category select and the no-barcode button |
| 3. Input frame, dot track, and value tracking | Frame, dots, typed text, password mask, state tracking | Stale dot count after React 19 form reset or autofill. Mask glyph width |
| 4. Focus caret and input sweep | Block caret on focus, native caret hidden, all screens checked | Caret over the first dot cell and overflow behavior |

## Risks and Assumptions

- **Default label conflict.** The closed decision says the default label stays 1rem. `button.tsx:16` makes it 0.875rem. The plan follows the stated 1rem and 1.5rem numbers, a 2px change on the default size only. If the parent wants the label untouched, change `default` to keep `text-sm` and accept a 1.3125rem default frame. Either way the 1.5 ratio holds.
- The dot track can be misread as a password mask. Password uses `•` and the empty cells use `·`. Phase 3 checks both side by side.
- No component test harness. Dot counts, blink, form reset, and overflow are checked in a browser. Chromium is not installed for the Playwright MCP on this machine (`/opt/google/chrome/chrome` is missing), so the parent needs another browser path for manual checks.
- `input.test.ts` imports `@base-ui/react/input` and `react-dom/server` in the `node` environment. If that import fails, fall back to asserting class strings from an exported constant. Do not add jsdom.
- The caret does not follow the native selection and the native caret is hidden. Editing in the middle of a value shows no insertion point. This follows the closed decision wording. Raise it as a follow-up if it hurts.
- `public/help/help-02-tally.png` and `help-10-item-details.png` show the old `[-]` and `[+]` after this change. The help copy tests do not check pixels. Regenerating them is outside S-16.
- `InputGroup*` wraps `Input` but nothing imports it. Its `border-0!` class now lands on the frame, which is accepted.
- The plan was checked against the live code on `feature/s-16-bracket-button-borders`. The roadmap and PRD list S-13 as parallel, so the palette tokens may move. Brackets read `--border`, `--input`, `--ring`, and `--destructive`, so a palette change needs no edit here.

## Success Criteria

- Every `Button`, and the tally and item-page count buttons, shows both brackets in every state with today's colors.
- Help shows `?`. The tally and item page show `-` and `+`. No typed brackets remain on those labels. Help copy says `-` and `+`.
- A focused input shows a blinking block caret after the typed text. Untyped cells are middle dots. Each typed character removes one dot and deleting brings it back. Password still masks.
- File picker, hidden fields, checkboxes, radios, and `Textarea` are unchanged.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.
