# Bracket Button Borders Implementation Plan

## Overview

Every shared `Button`, the raw count buttons on the tally and the item page, and every text, search, email, and password input get a bracket border: a left bracket and a right bracket with short arms, matching the mock on Linear TEC-65. Help, the tally, and the item page drop their typed brackets and show `?`, `-`, and `+`. Focused inputs show the app-title block caret. Untyped cells show a period on the text baseline, and each typed character removes one dot.

This is roadmap S-16 (`context/foundation/roadmap.md:251-262`), PRD FR-019 (`context/foundation/prd.md:176`). Linear TEC-65. GitHub issue pterodactor3000/Noospheric-Tally#72. Branch `feature/s-16-bracket-button-borders`, from `main`. Prerequisites: none. Not blocked.

**Complexity: Medium.** Evidence: one shared CSS primitive and one shared Button reach 30 `<Button>` call sites plus `buttonVariants` consumers on every screen. Two raw-button files need the same frame. The `Input` primitive becomes a stateful composite (frame, mirror, dot track, caret) that must stay correct for controlled values, uncontrolled `defaultValue`, React 19 form reset, and password masking. There is no data, API, auth, or migration work. There is no component test harness (`vitest.config.mts:15-16` runs `src/**/*.test.ts` in `node`), so geometry and caret behavior are verified by browser measurement. Four phases.

## Current State Analysis

Verified against branch `feature/s-16-bracket-button-borders` (one commit, `969b2ea`, ahead of `main`; commit `ffc98e8` merged S-15).

**Mock.** TEC-65 attachment `Bracket button mock` (PNG, 483x181): `[ Button ]` in a mono face. The brackets are tall, thin vertical bars with short horizontal arms at the top and bottom, pointing inward. No fill and no box.

**Shared Button** (`src/components/ui/button.tsx`)

- The base list sets `rounded-lg` (`:12`), `border-2` (`:13`), `border-transparent` (`:14`), `text-sm` (`:16`), `focus-visible:border-ring` (`:22`), `aria-invalid:border-destructive` (`:28`), and `dark:aria-invalid:border-destructive/50` (`:31`). Border colors today are what make a rectangle appear.
- `outline` sets `border-border` (`:46`) and `dark:border-input` (`:52`). `destructive` sets `focus-visible:border-destructive/40` (`:74`). `default`, `secondary`, `ghost`, and `link` have no visible border (`:40-44`, `:56-62`, `:63-69`, `:80`).
- Sizes: `default` h-8 (`:83`), `xs` h-6 plus `text-xs` (`:90`, `:95`), `sm` h-7 plus `text-[0.8rem]` (`:101`, `:106`), `lg` h-9 (`:112`), `icon` size-8 (`:119`), `icon-xs` size-6 (`:120`), `icon-sm` size-7 (`:126`), `icon-lg` size-9 (`:131`).
- The base `text-sm` and the size-level `text-xs` or `text-[0.8rem]` sit on the same element and set the same property. No `tailwind-merge` is in use (`clsx` only, `:3`, `:150`). The winner depends on generated CSS order.
- **Repository conflict with the closed decision.** The decision says the default label stays 1rem. The live default size inherits `text-sm`, which is 0.875rem, because `globals.css` overrides no `--text-*` token and no caller sets a size on the default size (`actionButton` is `font-mono min-h-11`, `src/app/styles/class-names.ts:92`). The plan follows the stated label size: default label 1rem. That moves the default label by 2px. The bracket is the control's side border, not a 1.5rem glyph. See Phase 1 and `## Critical Implementation Details`.
- Callers override geometry: `size-11!` on the three tally icon buttons (`src/app/inventory/inventory-tally.tsx:192`, `:203`, `:214`), `size-17! p-3` on the scan direction buttons (`src/app/inventory/scan/scan-direction-buttons.tsx:117`), `px-2!` on Help (`src/components/help-link.tsx:12`), `min-h-11` through `actionButton` (`class-names.ts:92`), and `-ml-2.5 min-h-11` on the back link, which uses `buttonVariants` on a `Link` (`src/components/back-to-inventory-link.tsx:23-28`).

**Help** (`src/components/help-link.tsx:6-15`) renders `{'[ ? ]'}` at `:14` inside an outline `Button` with `aria-label="Help"`.

**Raw count buttons**

- `src/app/inventory/tally-count-controls.tsx`: `tallyControl` (`:23-36`) is `min-h-[36px] min-w-11 border-0 bg-transparent p-0 ... text-inherit disabled:text-inherit disabled:opacity-100`. Two `<button>`s at `:89-107` and `:108-124`. Labels `[-]` at `:103`, `[+]` at `:122`. Layout classes `countControlGroup` and `countControlPart` come from `class-names.ts:93-101`.
- `src/app/inventory/[itemId]/item-level-editor.tsx`: `LevelStepper` (`:160-208`). Buttons at `:175-188` and `:192-205`. Labels `[-]` at `:187`, `[+]` at `:204`. They use `itemControl` (`src/app/inventory/[itemId]/barcode-line.tsx:11-23`), which `categorySelect` (`item-level-editor.tsx:101-107`) and the no-barcode button (`barcode-line.tsx:44`) also use. `itemControl` must not gain the frame.

**Input** (`src/components/ui/input.tsx`)

- One `InputPrimitive` (`:10`) carries `h-8 w-full min-w-0 rounded-lg border-2 border-input bg-transparent px-2.5 py-1 text-base md:text-sm` (`:14-45`), `placeholder:text-muted-foreground` (`:33`), focus ring and `focus-visible:border-ring` (`:34-36`), `disabled:*` (`:37-40`), and `aria-invalid:*` (`:41-44`). `className` goes to the same element (`:51`). The file also sets `file:*` styles (`:26-32`).
- Callers pass `fieldControl` (`min-h-11 text-base font-mono`, `class-names.ts:82`), sometimes with `min-w-0 flex-1` (`inventory-tally.tsx:182`). Types in use: `text`, `search`, `email`, `password` on 15 inputs, and `file` once (`src/app/inventory/new/bulk-insert-form.tsx:117`). `readOnly` text inputs show the invite code and link (`src/app/hab-unit/share/share-hab-unit-form.tsx:66`, `:78`). No caller passes `placeholder`.
- Callers mix controlled (`inventory-tally.tsx:177` `value`, `item-create-form.tsx:237`) and uncontrolled (`defaultValue` at `src/app/(auth)/login/page.tsx`, `item-create-form.tsx:150`, `barcode-lookup-form.tsx:51`, and others). React 19 resets uncontrolled form fields after a form action.
- `src/components/ui/input-group.tsx:119-132` wraps `Input`, but nothing imports `InputGroup*` outside that file (`rg "InputGroup" src -l` returns only itself). `Textarea` (`src/components/ui/textarea.tsx`) is imported only by `input-group.tsx:9`. Neither is used on a page.

**App-title caret** (`src/components/tally-label.tsx:24-30`): an empty `<span>` with `border-r-[1ch] border-foreground animate-terminal-blink`. The animation is `terminal-blink 1s step-end infinite` (`src/app/styles/globals.css:98`) and toggles `border-color` to `transparent` at 50% (`:109-113`). The font is Kode Mono (`src/app/layout.tsx:15-18`, `globals.css:95`), a monospace face. Radius is 0 (`globals.css:3`).

**Help copy** (`src/app/help/help-topics.ts`): the tally topic names `[-]` and `[+]` at `:37` and `:39`. The item details topic names them at `:203`. `:37` also names the heading `[<hab unit name>] tally`, which the page renders at `src/app/inventory/page.tsx:50-55` and which stays.

**Tests.** `src/app/help/help-topics.test.ts` and `src/app/styles/theme-tokens.test.ts` are the only tests near this code. `theme-tokens.test.ts` parses the `:root` and dark `:root` blocks of `globals.css` (`:54-58`, `:122`), so a new `@utility` block placed after `body` does not disturb it. `react-dom` is installed, so `react-dom/server` is available to `.test.ts` files with no new dependency. No jsdom, no Testing Library.

**Stale assets.** `public/help/help-02-tally.png` and `help-10-item-details.png` show the old `[-]` and `[+]`. `help-topics.test.ts:122` and the tests after it only check file names, signatures, and sizes.

## Desired End State

- Every `Button` (default, outline, secondary, destructive, ghost, link; sizes default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg) shows a left bracket and a right bracket, each with short arms, in every state: idle, hover, focus, pressed, disabled. The brackets are the side borders of the control: they run from its top edge to its bottom edge. They are not the `[` `]` characters, and they are not a 1.5em glyph centered in the hit area. The default label is 1rem. Hit areas, fills, rings, and colors are unchanged.
- Help reads `?`. The tally and the item page read `-` and `+`. Each has the same frame. No typed brackets remain on those labels. Help copy says `-` and `+`. The `[<hab unit name>] tally` heading is unchanged.
- Text, search, email, and password inputs show the same frame, spanning each input from its top edge to its bottom edge. Unfocused, periods fill every untyped cell on the text baseline and no caret shows. Focused, the app-title block caret blinks right after the typed text and replaces the first dot cell. Each typed character removes one dot. Deleting one brings it back. Password masks each character as a still block in the title caret's shape, and the rest stays dots. The native caret is hidden and placeholder text is never drawn.
- The file picker, hidden fields, checkboxes, radios, `Textarea`, and `InputGroup*` are unchanged.
- Verify: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, plus the per-phase browser checks.

## What We're NOT Doing

- S-13 palette work, any color token change, and `src/app/styles/theme-tokens.test.ts`.
- New routes, and any behavior change besides the chrome and the label text named here.
- Other raw `<button>` elements: the category panel toggle (`src/app/inventory/inventory-category-panel.tsx:75`), the disclosure buttons in `bulk-insert-form.tsx:60`, `barcodeless-item-form.tsx:62`, and `item-create-form.tsx:173`, the no-barcode button (`barcode-line.tsx:41`), and the item-name toggle (`item-level-editor.tsx:261`).
- Other typed brackets: the stock label `[IN STOCK]` and initials (`item-level-editor.tsx:253-258`), the category display `[`, `]` (`item-level-editor.tsx:331-336`), the `[<hab unit name>]` heading, the scan `[consume]` label, `[<n> short]`.
- The file picker, hidden inputs, checkboxes, radios, the item `<select>`, `Textarea`, and `InputGroup*` (dead code that wraps `Input`; its `border-0!` and `flex-1` classes now land on the frame, which is accepted because no page renders it).
- Restyling the rectangular focus ring, fills, or disabled opacity on buttons and inputs.
- Regenerating `public/help/*.png`. Two screenshots show the old `[-]` and `[+]` and become stale (see Risks in `plan-brief.md`).
- Moving the caret to the native selection point. The caret always sits after the typed text.
- A component test harness (jsdom, Testing Library, Playwright specs).

## Implementation Approach

Build one CSS primitive and reuse it. A Tailwind v4 `@utility bracket-frame` in `src/app/styles/globals.css` draws both brackets with `::before` and `::after`. Buttons, the two raw count buttons, and the input frame all add that class. The frame is sized in `em`, so the 1.5 ratio holds for every label size without per-size code, and it is centered on the element, so hit areas and fills do not move.

Bracket color is a CSS custom property, `--bracket-color`, defaulting to `currentColor`. Button variants and states set it where they used to set a border color. The real 2px border stays transparent and only reserves box geometry.

Inputs get a frame element that owns `className`, around the real `<input>`. An `aria-hidden` track layer sits over the input and holds an invisible mirror of the typed text, the caret, and a long string of periods, in flex order. The mirror pushes the dots right by exactly the width of the typed text, so no cell math is needed. The track uses the same pattern as the existing dot leaders (`TALLY_DOT_LEADER`, `inventory-tally.tsx:39`; `ITEM_DOT_LEADER`, `item-level-editor.tsx:35`). Focus state is CSS only (`focus-within`). Value state is tracked in React so the mirror follows typing, `defaultValue`, form reset, and autofill.

Phases: shared frame and Button first (everything else depends on it), then the label and raw-button changes, then the input frame and dot track, then the caret and the full input sweep.

## Critical Implementation Details

- **The bracket is the control border.** The pseudo-elements stretch from `top: 0` to `bottom: 0`. The vertical bar is the side of the control and the arms sit on the top and bottom corners. Do not center a `1.5em` glyph in the hit area. That glyph reads as the `[` `]` characters. `actionButton` stays `min-h-11` and the tally icon buttons stay `size-11!`. Shared buttons set the arm to `0.4em` plus `2px`. Count buttons leave `--bracket-arm` unset, so their arms stay `0.4em`. The arms have no glow. Shared buttons and count buttons have no background at rest. Hover paints a 40% wash of the text color, and the pressed state paints 60%. `textLink` takes the same 40% wash on hover. Shared button text and brackets use `text-input`, the color inputs and buttons used for their borders. `textLink` uses that same color. Count buttons keep the color they inherit, so their wash follows that color.
- **Label size conflict.** Closed decision: default label 1rem. Live: `text-sm` at `button.tsx:16`. The base and the size variants both set a font size on one element with no merge, so the cascade order decides. Before editing, record the computed `font-size` of every size variant in a browser. Then move font size out of the base and into each size variant. Keep each recorded value except `default`, which becomes `text-base` (1rem). Each size then sets exactly one font-size class. A unit test enforces that.
- **Border classes that must go.** Removing the visible rectangle means removing every class that colors the real border: `border-border` (`:46`), `dark:border-input` (`:52`), `focus-visible:border-ring` (`:22`), `aria-invalid:border-destructive` (`:28`), `dark:aria-invalid:border-destructive/50` (`:31`), and `focus-visible:border-destructive/40` (`:74`). `border-2 border-transparent` stays for box geometry. Each removed color moves to `--bracket-color` under the same state.
- **`--bracket-color` is read with a fallback, not declared by the utility.** The pseudo-elements use `var(--bracket-color, currentColor)`. The utility never declares the property, so variant classes cannot lose a same-element cascade fight.
- **One class on `itemControl` is forbidden.** `itemControl` is shared with the category `<select>` and the no-barcode button. Add `bracket-frame` only on the two stepper buttons.
- **Monospace cell assumption.** The dot cell and the typed cell must be the same width. Kode Mono is monospaced and the mirror uses the real glyphs. A password block is `border-r-[calc(1ch-2px)]` plus a `2px` margin, so the cell stays one character wide and the bar is 2px thinner than the caret.
- **React 19 form reset.** Uncontrolled inputs are reset by form actions. The input state must re-read the DOM value after a form `reset` event, one macrotask later, because the event fires before the reset applies. It must also read the DOM value on mount to catch autofill and restored values.
- **Password never reaches the track as text.** Each code point is one still block: `border-r-[calc(1ch-2px)] border-foreground` and a `2px` margin, the title caret's shape 2px thinner, without `animate-terminal-blink`. The native password glyphs are transparent. The caret color stays the foreground.
- **Native chrome inside the field.** Hide the search cancel button and decoration, and the Edge password reveal, so the cells are the only content. Set `caret-transparent` only in Phase 4, when the block caret exists, so no phase ships a focused input with no caret.
- **Dot track length.** `'.'.repeat(300)`, clipped by `overflow-hidden`, as the existing dot leaders do. The glyph is a period, so it sits on the text baseline. The widest input is bounded by `max-w-4xl` (`class-names.ts:29`), so 300 cells is enough.

## Phase 1: Bracket frame utility and shared Button

### Overview

Add the shared frame primitive and apply it to every shared `Button`. After this phase every `Button` is bracket-framed with unchanged colors, hit areas, and behavior. The default label becomes 1rem.

### Changes Required

#### 1. Frame primitive

**File:** `src/app/styles/globals.css` (add after the `@keyframes caret-blink` block, before `body` at `:287`)

**Intent:** One definition of the bracket shape for every control.

**Contract:** `@utility bracket-frame` with these properties.

- The element is `position: relative`.
- `::before` is the left bracket and `::after` is the right bracket. Each has `content: ''`, `position: absolute`, `top: 0`, `bottom: 0`, `box-sizing: border-box`, `pointer-events: none`, `border: 2px solid var(--bracket-color, currentColor)`, and `width: var(--bracket-arm, 0.4em)`. No glow. The shared Button sets `--bracket-arm` to `calc(0.4em + 2px)`. Count buttons do not.
- `::before` sits at `left: 0` with `border-right-width: 0`. `::after` sits at `right: 0` with `border-left-width: 0`.
- The utility declares no `--bracket-color` and no `--bracket-arm` value.
- If an arm reaches the label or icon at a size, shorten `--bracket-arm` for that size. Do not change the label.

#### 2. Shared Button

**File:** `src/components/ui/button.tsx`

**Intent:** Replace the rectangular border with the bracket frame and keep every state color.

**Contract:**

- The base list (`:7-37`) adds `bracket-frame` and sets `--bracket-arm` to `calc(0.4em + 2px)`. It keeps `border-2 border-transparent` (`:13-14`) and removes `text-sm` (`:16`), `focus-visible:border-ring` (`:22`), `aria-invalid:border-destructive` (`:28`), and `dark:aria-invalid:border-destructive/50` (`:31`).
- Bracket color by state, matching the border color each class gave before: base `currentColor`. `outline` (`:45-55`) sets `--bracket-color` to `var(--color-border)`, and `var(--color-input)` in dark, and drops `border-border` and `dark:border-input`. `focus-visible` sets `var(--color-ring)`. `destructive` (`:70-79`) focus-visible sets destructive at 40%, replacing `focus-visible:border-destructive/40`. `aria-invalid` sets `var(--color-destructive)`, at 50% in dark.
- Every size variant (`:83-131`) states its own font size. `default` is `text-base`. `xs` keeps `text-xs`, `sm` keeps `text-[0.8rem]`. `lg`, `icon`, `icon-xs`, `icon-sm`, and `icon-lg` take the computed font size recorded before the edit. Each size has exactly one font-size class.
- Heights, widths, padding, gaps, `rounded-*`, the focus ring, hover fills, `disabled:opacity-50`, and `active:translate-y-px` do not change.
- `buttonVariants` stays the single source, so `BackToInventoryLink` (`back-to-inventory-link.tsx:23`) and `InputGroupButton` (`input-group.tsx:97`) inherit the frame with no edit.

#### 3. Tests

**Files:** `src/components/ui/button.test.ts`, `src/app/styles/bracket-frame.test.ts`

**Intent:** Lock the testable parts of the contract in the `node` environment.

**Contract:**

- `button.test.ts` calls `buttonVariants` for all six variants times all eight sizes. Each result includes `bracket-frame`, includes none of the six removed border-color classes, and includes exactly one class from `text-xs`, `text-sm`, `text-base`, and `text-[0.8rem]`. The `default` size result includes `text-base`.
- `bracket-frame.test.ts` reads `globals.css` as `theme-tokens.test.ts` does (`path.join(__dirname, 'globals.css')`) and asserts `@utility bracket-frame`, a `::before` and an `::after` rule, `top: 0`, `bottom: 0`, no `height`, and `var(--bracket-color, currentColor)`.

### Success Criteria

#### Automated Verification

- `pnpm test` passes, including the new `button.test.ts` (6 variants times 8 sizes, bracket class present, six border-color classes absent, one font-size class, default size `text-base`).
- `pnpm test` passes the new `bracket-frame.test.ts` (utility, both pseudo-elements, `top: 0`, `bottom: 0`, color fallback).
- `pnpm lint` and `pnpm typecheck` pass.

#### Manual Verification

- On `/login` and `/inventory`, each Button shows a left bracket and a right bracket with short arms, like the mock, and no full rectangle at idle, hover, focus, pressed, and disabled.
- Computed styles: a default-size button has a 16px label. The pseudo-elements run from the top edge of the button to the bottom edge, including an `sm` button (`Undo`, `/inventory/scan`) and an `xs` button.
- Bracket color matches the old border color per state in light and dark: outline uses `--border` (`--input` in dark), focus uses `--ring`, invalid uses destructive, and default, secondary, destructive, ghost, and link follow the text color.
- Button boxes did not move: default 32px, `actionButton` 44px, `size-11!` 44px, and `size-17!` 68px. No arm touches a label or icon at `xs`, `icon-xs`, and the 68px scan buttons.

---

## Phase 2: Labels, raw count buttons, and help copy

### Overview

Help, the tally, and the item page show `?`, `-`, and `+` with the bracket frame as the only brackets. Help copy follows.

### Changes Required

#### 1. Help

**File:** `src/components/help-link.tsx`

**Intent:** Drop the typed brackets.

**Contract:** The visible label at `:14` is `?`. `aria-label="Help"`, `variant="outline"`, `render={<Link href="/help" />}`, and `nativeButton={false}` stay. `px-2!` (`:12`) stays unless an arm touches the glyph, in which case adjust only that padding.

#### 2. Tally count buttons

**File:** `src/app/inventory/tally-count-controls.tsx`

**Intent:** Frame the two raw buttons and drop their typed brackets.

**Contract:** The decrease and increase buttons use `countBracketButton`. Visible labels are `-` and `+`. The button box is `1.25em` tall with `0.6em` of horizontal padding, so the bracket sits just above the count text. The arms stay `0.4em`. Hover paints a 40% wash of the inherited text color, and the pressed state paints 60%. Disabled buttons stay transparent. The 36px row and the name link stay. The count is a centered `2ch` column, and the row centers the buttons on that count, so `5` and `12` share the same `-` and `+`. `aria-label`, `disabled`, `onClick`, and the sr-only stock label stay. The bracket color is `currentColor`, so it follows the stock-state text color. Disabled buttons keep `disabled:text-inherit disabled:opacity-100`.

#### 3. Item page count buttons

**File:** `src/app/inventory/[itemId]/item-level-editor.tsx`

**Intent:** Same treatment inside `LevelStepper`.

**Contract:** The two `LevelStepper` buttons use `countBracketButton`, the same `1.25em` box as the tally. Labels are `-` and `+`. `itemControl` is not edited, so the category `<select>` and the no-barcode button get no frame and keep their 44px box. The row's `text-unsaved` color carries to the brackets through `currentColor`.

#### 4. Help copy

**File:** `src/app/help/help-topics.ts`

**Intent:** Name the controls as `-` and `+`. Keep the heading text.

**Contract:**

- `:37` becomes: `The tally lists every item in the hab unit. Each row shows the name, a dot leader, the - button, the count, and the + button. The heading is [<hab unit name>] tally.`
- `:39` becomes: `The - button lowers the count by 1. The + button raises it by 1. The tally saves that change at once. The - button is disabled at 0. The + button is disabled at 99.`
- `:203` becomes: `The - button, the + button, and the category list change Count, Minimum, and Category. Unsaved edits turn yellow gold. They apply when you press Save. Cancel drops them and returns to the tally. The state label follows the count and the minimum while you edit.`
- No other copy changes.

#### 5. Tests

**File:** `src/app/help/help-topics.test.ts`

**Intent:** Lock the copy.

**Contract:** Add tests that: the tally topic includes `[<hab unit name>] tally`, the `- button` and `+ button` sentences, and not `[-]` or `[+]`. The item details topic includes `The - button, the + button, and the category list` and not `[-]` or `[+]`. The existing topic order, ids, and screenshot tests stay green.

### Success Criteria

#### Automated Verification

- `rg -n "\[ \? \]|\[-\]|\[\+\]" src` returns no matches.
- `pnpm test` passes the new help copy tests (tally topic, item details topic, heading text kept, no `[-]` or `[+]`).
- `pnpm lint` and `pnpm typecheck` pass.

#### Manual Verification

- The header Help control reads `?` inside a bracket frame, signed out on `/` and signed in on `/inventory`. It still opens `/help` and still announces as Help.
- A tally row shows `-`, the count, and `+`, each button framed, in the row's stock color (IN STOCK green, WARNING yellow, CRITICAL red). `-` is disabled at 0 and `+` at 99, and both keep the frame. A click still changes the count.
- On an item page, the Count and Minimum rows show framed `-` and `+`. A row with unsaved edits turns yellow gold with its brackets. The category value and the barcode line show no frame.
- `/help` reads `the - button` and `the + button` in the tally and item details topics. The `/inventory` heading still reads `[<hab unit name>] tally`.

---

## Phase 3: Input frame, dot track, and value tracking

### Overview

Text, search, email, and password inputs get the bracket frame and the middle-dot track. Typed characters push the dots out, deletes bring them back, and password masks. Focus caret and native caret hiding wait for Phase 4. This phase leaves the native caret visible.

### Changes Required

#### 1. Input type guard

**File:** `src/lib/inputs/is-bracket-input-type.ts`

**Intent:** One answer to which inputs get the frame.

**Contract:** `isBracketInputType(type: string | undefined): boolean`, pure. True for `undefined`, `text`, `search`, `email`, and `password`. False for every other string, including `file`, `hidden`, `checkbox`, `radio`, `number`, `tel`, and `url`.

#### 2. Mirror text

**File:** `src/lib/inputs/get-input-mirror-text.ts`

**Intent:** The invisible text that sets where the dots start.

**Contract:** `getInputMirrorText(value: string, type: string | undefined): string`, pure. For `password`, one `•` (U+2022) per code point of `value` (`Array.from`). For every other type, `value` unchanged.

#### 3. Input component

**File:** `src/components/ui/input.tsx`

**Intent:** Replace the single bordered element with a frame, the real input, and a track layer, for the four framed types only.

**Contract:**

- When `isBracketInputType(type)` is false, render exactly today's single `InputPrimitive` with today's classes, including `file:*`. File pickers, hidden fields, checkboxes, and radios are unchanged.
- When true, render a frame `<span data-slot="input-frame">` that owns `className`. The frame has `group/input bracket-frame relative flex w-full min-w-0 h-8 text-base md:text-sm` and sets `--bracket-arm` to `calc(0.4em + 2px)`, the same longer arm as a shared button, then `className`. Callers' `fieldControl` and `min-w-0 flex-1` therefore size the frame (`inventory-tally.tsx:182`). `<select>` and any other dropdown stay unframed.
- Inside the frame, the `InputPrimitive` (keep `data-slot="input"`) fills it: `w-full self-stretch bg-transparent px-3 outline-none`, `text-[length:inherit] font-[inherit]`, no border, `placeholder:text-transparent` in place of `placeholder:text-muted-foreground`, and the search cancel, search decoration, and Edge password reveal hidden. The type, all other props, and the caller `ref` pass through. The input and frame font match, so `md:text-sm` lives on the frame only.
- After the input, a track layer: `aria-hidden`, `pointer-events-none`, `absolute inset-y-0 left-3 right-3 flex items-center overflow-hidden`. Its children in order: the mirror (`data-slot="input-mirror"`, `invisible min-w-0 shrink overflow-hidden whitespace-pre`) rendering `getInputMirrorText`, then the dots (`data-slot="input-dots"`, `min-w-0 flex-1 overflow-hidden whitespace-nowrap text-muted-foreground`) rendering `INPUT_DOT_TRACK`, a module constant `'.'.repeat(300)`. Phase 4 inserts the caret between them.
- The mirror, not cell math, positions the dots. One typed code point takes one mono cell and removes one dot cell.
- Bracket color on the frame follows what the input border did: base `var(--color-input)`, `focus-within` and `has-[input:focus-visible]` use `var(--color-ring)`, `has-[input[aria-invalid=true]]` uses `var(--color-destructive)` (50% in dark). The rectangular focus ring and invalid ring move to the frame through `has-[...]`. `disabled:*` effects (`disabled:opacity-50`, `disabled:cursor-not-allowed`, `disabled:pointer-events-none`) apply to the frame through `has-disabled:`.
- Value tracking: keep the typed text in state. Initial state is `String(value ?? defaultValue ?? '')`. For a controlled input (`value !== undefined`), render from `value` directly. `onInput` updates the state and calls the caller's `onInput`. On mount, read the DOM `value`. Subscribe to the input's form `reset` event and, one macrotask later, read the DOM `value`. Clean up the listener and the timer in the effect cleanup. Merge the caller `ref` with the internal ref.
- Password: one `data-slot="input-password-block"` per code point, with `border-r-[calc(1ch-2px)] border-foreground`, a `2px` margin, and no blink. The typed value is never rendered into the track. The input text is transparent and `caret-transparent` hides the native caret.
- Do not touch `src/components/ui/input-group.tsx` or `src/components/ui/textarea.tsx`.

#### 4. Tests

**Files:** `src/lib/inputs/is-bracket-input-type.test.ts`, `src/lib/inputs/get-input-mirror-text.test.ts`, `src/components/ui/input.test.ts`

**Intent:** Cover the pure rules and the rendered shape in `node`.

**Contract:**

- `is-bracket-input-type.test.ts`: `undefined`, `text`, `search`, `email`, `password` return true. `file`, `hidden`, `checkbox`, `radio`, `number`, and the empty string return false.
- `get-input-mirror-text.test.ts`: text returns the value. An empty value returns an empty string. Password returns one `•` per character. A value with one emoji returns one `•` for it. Search and email return the value.
- `input.test.ts` uses `renderToStaticMarkup` from `react-dom/server` with `createElement`. For `text`, `search`, `email`, `password`: the markup has `data-slot="input-frame"`, `data-slot="input-dots"`, `aria-hidden="true"` on the track, the 300-dot string, and `placeholder:text-transparent` on the input. For `password` with `defaultValue="secret"`, the track has six `input-password-block` elements, no blink class, and does not contain `secret`. For `file`, `checkbox`, `radio`, and `hidden`: no `data-slot="input-frame"`, and a single `<input`. `className` lands on the frame for framed types.

### Success Criteria

#### Automated Verification

- `pnpm test` passes `is-bracket-input-type.test.ts` (five true types, six false values).
- `pnpm test` passes `get-input-mirror-text.test.ts` (text, empty, password per character, emoji, search, email).
- `pnpm test` passes `input.test.ts` (framed markup for four types, password mirror hides the value, unframed markup for four types, `className` on the frame).
- `pnpm lint` and `pnpm typecheck` pass.
- `git diff --name-only main` lists neither `src/components/ui/textarea.tsx` nor `src/components/ui/input-group.tsx`.

#### Manual Verification

- Unfocused empty inputs (`/login` email, `/inventory/new` barcode) show a left bracket, a right bracket, and periods on the text baseline across the full width. No block caret shows.
- Typing 1, 5, and 10 characters in a text, a search, and an email field removes exactly one dot per character. Backspace brings one dot back each time. Total cells (dots plus characters) stay constant.
- Password (`/login`) masks every character as a still block the shape of the title caret, 2px thinner than that caret, with no blink.
- After a form submit that resets or repopulates a field, and after back and forward navigation, and after browser autofill, the dot count matches the visible text.
- The controlled search on `/inventory` follows typing and clearing. A value longer than the field pushes all dots out and scrolls without any text or dot leaving the frame.
- `aria-invalid` shows destructive brackets and a destructive ring. A disabled input dims the frame and dots. The read-only invite code and link inputs on `/hab-unit/share` show their value followed by dots.
- The JSON file picker on `/inventory/new` looks exactly as before.

---

## Phase 4: Focus caret and input sweep

### Overview

A focused input shows the app-title block caret, the native caret goes away, and every screen with an input is checked end to end.

### Changes Required

#### 1. Shared caret classes

**File:** `src/app/styles/class-names.ts`

**Intent:** One definition of the caret, shared by the app title and the inputs.

**Contract:** Add `terminalCaret = clsx('border-r-[1ch]', 'border-foreground', 'animate-terminal-blink')` and export it, sorted into the existing export list (after `sectionHeading`, before `textLink`).

#### 2. App title

**File:** `src/components/tally-label.tsx`

**Intent:** Use the shared constant with no visual change.

**Contract:** The caret `<span>` (`:24-30`) takes `terminalCaret` in place of the three inline classes. The rendered class string and behavior are identical.

#### 3. Input caret

**File:** `src/components/ui/input.tsx`

**Intent:** Draw the caret and hide the native one.

**Contract:**

- Between the mirror and the dots, add an empty `<span data-slot="input-caret">` with `hidden shrink-0 group-focus-within/input:block h-[1.25em]` and `terminalCaret`. It is a flex item, so it sits right after the typed text and replaces the first dot cell. When the typed text overflows, the mirror shrinks and the caret stays at the right edge.
- The input adds `caret-transparent`. The caret only shows while the input has focus, including read-only inputs.
- The caret is not drawn when the input is not focused. It uses the 1s step-end blink from `--animate-terminal-blink` (`globals.css:98`), the same cadence as the app title. Reduced-motion handling is unchanged.
- The caret always sits after the typed text. It does not follow the native selection.

#### 4. Tests

**Files:** `src/app/styles/class-names.test.ts`, `src/components/ui/input.test.ts`

**Intent:** Lock the shared string and the caret markup.

**Contract:** `class-names.test.ts` asserts `terminalCaret` equals `border-r-[1ch] border-foreground animate-terminal-blink`. `input.test.ts` adds: for the four framed types the markup has `data-slot="input-caret"` with `group-focus-within/input:block` and `hidden`, and the input has `caret-transparent`. Unframed types have neither.

### Success Criteria

#### Automated Verification

- `pnpm test` passes the `terminalCaret` string test and the caret markup tests.
- `rg -n "border-r-\[1ch\]" src` returns only `src/app/styles/class-names.ts`.
- `rg -n "Textarea" src --glob '!src/components/ui/*'` returns no matches, and `git diff --name-only main` lists neither `textarea.tsx` nor `input-group.tsx`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass.

#### Manual Verification

- The app title caret looks and blinks as before.
- A focused empty input shows the block caret blinking at the start, and dots fill the rest. The native caret is not visible. The cadence matches the app title (1s, step-end).
- Typing one character puts the caret after it, and one dot is gone. Deleting brings it back. Blurring removes the caret and the dots return to full width.
- A long value keeps the caret visible at the right edge.
- Every input screen is checked in light and dark: `/login`, `/signup`, `/hab-unit/new` (invite code and name), `/hab-unit/share` (read-only fields), `/inventory` (search), `/inventory/new` (barcode, item name, attach filter, JSON file picker unchanged), `/inventory/scan` and `/inventory/lookup` (manual barcode). Framing, dots, caret, and password masking behave as above, and no form submission changes.
- The `/inventory` search row keeps its sort and group buttons aligned with the framed search field, and no control is clipped on a 390px viewport.

---

## Testing Strategy

### Unit Tests

- `buttonVariants` output across 6 variants and 8 sizes: bracket class present, six border-color classes absent, exactly one font-size class, default `text-base`.
- `globals.css` contains the `bracket-frame` utility with both pseudo-elements, `top: 0`, `bottom: 0`, and the color fallback.
- `isBracketInputType`: framed types, unframed types, `undefined`, and the empty string.
- `getInputMirrorText`: empty, text, password, emoji, search, email.
- `Input` markup through `react-dom/server`: framed and unframed types, the password mirror hiding the value, `className` on the frame, the caret markup.
- Help copy: the new sentences, the kept heading, and no `[-]` or `[+]`.
- `terminalCaret` string.

### Integration Tests

- No component harness exists and none is added. Behavior that needs a browser (dot count while typing, form reset, autofill, caret blink, overflow) is covered by the manual steps.
- `pnpm build` checks that the `@utility` block and the server and client component boundaries compile.

### Manual Testing Steps

1. Run `pnpm dev`. Record each size variant's computed font size before Phase 1.
2. After Phase 1, open `/login` and `/inventory`. Measure label size and pseudo-element height, and check each state.
3. After Phase 2, sign in, open the tally and an item page, and check the labels, frames, disabled states, and help copy.
4. After Phases 3 and 4, type in every input type, delete, blur, submit, navigate back, and check the dot count against the visible text.
5. Repeat the checks in dark mode (`prefers-color-scheme: dark`) and on a 390px viewport.

## Migration and Rollback

No data, schema, or route changes. Each phase is a separate commit, and reverting one commit restores that phase's chrome. Phase 1 changes the default Button label from 0.875rem to 1rem. Phase 3 changes the `Input` DOM from one element to a frame around the input, which matters to any code that targets the input through the caller `className` (none does today: `rg` shows only `fieldControl`, layout classes, and `InputGroupInput`).

## References

- Roadmap: `context/foundation/roadmap.md` (S-16, `:251-262`; handoff row `:283`)
- PRD: `context/foundation/prd.md` (FR-019, `:176`, `:235`)
- Linear TEC-65 and its attached mock, GitHub issue #72
- `src/components/ui/button.tsx:5-139` (variants, sizes), `:141-153` (`Button`)
- `src/components/ui/input.tsx:8-55`
- `src/components/help-link.tsx:6-15`
- `src/app/inventory/tally-count-controls.tsx:23-36`, `:88-125`
- `src/app/inventory/[itemId]/item-level-editor.tsx:160-208`, `src/app/inventory/[itemId]/barcode-line.tsx:11-23`
- `src/components/tally-label.tsx:24-30`, `src/app/styles/globals.css:98`, `:109-113`
- `src/app/styles/class-names.ts:82`, `:92-101`, `:139-157`
- `src/app/help/help-topics.ts:37`, `:39`, `:203`, `src/app/help/help-topics.test.ts`
- `src/app/inventory/inventory-tally.tsx:173-218`
- `vitest.config.mts:15-16`

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Bracket frame utility and shared Button

#### Automated

- [x] 1.1 `pnpm test` passes the new `button.test.ts` (6 variants times 8 sizes, bracket class present, six border-color classes absent, one font-size class, default size `text-base`). `8cb28f2`
- [x] 1.2 `pnpm test` passes the new `bracket-frame.test.ts` (utility, both pseudo-elements, `top: 0`, `bottom: 0`, color fallback). `8cb28f2`
- [x] 1.3 `pnpm lint` and `pnpm typecheck` pass. `8cb28f2`

#### Manual

- [x] 1.4 On `/login` and `/inventory`, each Button shows a left bracket and a right bracket with short arms, like the mock, and no full rectangle at idle, hover, focus, pressed, and disabled. `8cb28f2`
- [x] 1.5 Computed styles: a default-size button has a 16px label. The pseudo-elements run from the top edge of the button to the bottom edge. They are not 24px glyphs centered in the button. `8cb28f2`
- [x] 1.6 Bracket color matches the old border color per state in light and dark: outline `--border` (`--input` in dark), focus `--ring`, invalid destructive, and default, secondary, destructive, ghost, and link follow the text color. `8cb28f2`
- [x] 1.7 Button boxes did not move (default 32px, `actionButton` 44px, `size-11!` 44px, `size-17!` 68px), and no arm touches a label or icon at `xs`, `icon-xs`, and the 68px scan buttons. `8cb28f2`

### Phase 2: Labels, raw count buttons, and help copy

#### Automated

- [x] 2.1 `rg -n "\[ \? \]|\[-\]|\[\+\]" src` returns no matches. `8cb28f2`
- [x] 2.2 `pnpm test` passes the new help copy tests (tally topic, item details topic, heading text kept, no `[-]` or `[+]`). `8cb28f2`
- [x] 2.3 `pnpm lint` and `pnpm typecheck` pass. `8cb28f2`

#### Manual

- [x] 2.4 The header Help control reads `?` inside a bracket frame, signed out on `/` and signed in on `/inventory`, opens `/help`, and still announces as Help. `8cb28f2`
- [ ] 2.5 A tally row shows framed `-`, the count, and framed `+` in the row's stock color. Both disable at 0 and 99 and keep the frame, and a click still changes the count.
- [x] 2.6 On an item page, Count and Minimum show framed `-` and `+`, unsaved rows turn yellow gold with their brackets, and the category value and barcode line show no frame. `8cb28f2`
- [x] 2.7 `/help` reads `the - button` and `the + button` in the tally and item details topics, and the `/inventory` heading still reads `[<hab unit name>] tally`. `8cb28f2`

### Phase 3: Input frame, dot track, and value tracking

#### Automated

- [x] 3.1 `pnpm test` passes `is-bracket-input-type.test.ts` (five true types, six false values). `400f170`
- [x] 3.2 `pnpm test` passes `get-input-mirror-text.test.ts` (text, empty, password per character, emoji, search, email). `400f170`
- [x] 3.3 `pnpm test` passes `input.test.ts` (framed markup for four types, password mirror hides the value, unframed markup for four types, `className` on the frame). `400f170`
- [x] 3.4 `pnpm lint` and `pnpm typecheck` pass. `400f170`
- [x] 3.5 `git diff --name-only main` lists neither `src/components/ui/textarea.tsx` nor `src/components/ui/input-group.tsx`. `400f170`

#### Manual

- [x] 3.6 Unfocused empty inputs show both brackets and periods on the text baseline across the full width, with no block caret. `400f170`
- [x] 3.7 Typing 1, 5, and 10 characters in a text, a search, and an email field removes exactly one dot per character, backspace brings one back each time, and total cells stay constant. `8cb28f2`
- [x] 3.8 Password masks every character as a still block the shape of the title caret, 2px thinner than that caret, with no blink. `8cb28f2`
- [ ] 3.9 After a form submit that resets or repopulates a field, after back and forward navigation, and after browser autofill, the dot count matches the visible text.
- [x] 3.10 The controlled search on `/inventory` follows typing and clearing, and a value longer than the field scrolls without any text or dot leaving the frame. `8cb28f2`
- [ ] 3.11 `aria-invalid` shows destructive brackets and ring, a disabled input dims the frame and dots, and the read-only invite fields on `/hab-unit/share` show their value followed by dots.
- [x] 3.12 The JSON file picker on `/inventory/new` looks exactly as before. `8cb28f2`

### Phase 4: Focus caret and input sweep

#### Automated

- [x] 4.1 `pnpm test` passes the `terminalCaret` string test and the caret markup tests. `8cb28f2`
- [ ] 4.2 `rg -n "border-r-\[1ch\]" src` returns only `src/app/styles/class-names.ts`.
- [x] 4.3 `rg -n "Textarea" src --glob '!src/components/ui/*'` returns no matches, and `git diff --name-only main` lists neither `textarea.tsx` nor `input-group.tsx`. `8cb28f2`
- [x] 4.4 `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass. `8cb28f2`

#### Manual

- [x] 4.5 The app title caret looks and blinks as before. `8cb28f2`
- [x] 4.6 A focused empty input shows the block caret blinking at the start, dots fill the rest, the native caret is not visible, and the cadence matches the app title (1s, step-end). `8cb28f2`
- [x] 4.7 Typing one character puts the caret after it and removes one dot, deleting brings it back, and blurring removes the caret and restores the full dot width. `8cb28f2`
- [x] 4.8 A long value keeps the caret visible at the right edge. `8cb28f2`
- [ ] 4.9 Every input screen passes in light and dark: `/login`, `/signup`, `/hab-unit/new`, `/hab-unit/share`, `/inventory`, `/inventory/new`, `/inventory/scan`, `/inventory/lookup`, with no form submission changed.
- [x] 4.10 The `/inventory` search row keeps its sort and group buttons aligned with the framed search field, and no control is clipped on a 390px viewport. `8cb28f2`
