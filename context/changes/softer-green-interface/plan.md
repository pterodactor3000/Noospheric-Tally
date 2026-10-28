# Softer Green Interface Implementation Plan

## Overview

A user can read every screen in a muted green palette, in light and dark, with shadcn/ui default controls, Geist Sans for body text, Kode Mono for mono text, and square corners. Buttons named in the TEC-37 icon table show a Lucide icon before the label. This is roadmap S-13 and covers PRD FR-019. FR-008 stock-label colors stay fixed and separate from the chrome tokens, as the FR-019 challenge resolution requires.

## Current State Analysis

**Theme tokens.** `src/app/styles/globals.css` lines 5-25 define light tokens as hex values with a beige base (`--background: #f7f5f0`) and a saturated primary (`#2d6a2e`). Lines 27-44 define a `.dark` block with neon greens (`--foreground: #32af00`, `--primary: #3dd800`, `--border: #00b818`). No code ever adds the `dark` class, so that block never applies. Line 3 binds the `dark:` variant to `.dark`, so every `dark:` utility in `src/components/ui/*` and `class-names.ts` line 32 is dead. Lines 222-227 flip only `--background` and `--foreground` under `prefers-color-scheme: dark`, so a dark OS shows a dark page with light-mode primary, border, input, and ring colors.

**Radius.** `globals.css` line 6 sets `--radius: 0.5rem`. Lines 64-67 map `--radius-sm` through `--radius-xl` from it. The shadcn 4.21 scale also maps `--radius-2xl`, `--radius-3xl`, and `--radius-4xl` from `--radius`. Those three are missing, so `rounded-br-4xl` on the inventory panel (`src/app/inventory/page.tsx` lines 21-24, with `cornerShape: 'bevel'`) uses Tailwind's fixed 2rem default.

**Fonts.** `src/app/layout.tsx` lines 10-18 load `Geist` as `--font-geist-sans` and `Kode_Mono` as `--font-kode-mono` through `next/font/google`, and line 37 puts both variable classes on `<body>`. `globals.css` lines 71-72 map `--font-sans` and `--font-mono` to them. Font loading works. Body text does not meet FR-019: `globals.css` line 261 sets `body { font-family: var(--font-kode-mono), monospace }`, and `src/app/styles/class-names.ts` adds `font-mono` to body-copy classes (`pageLead` 45-52, `sectionCopy` 62-68, `footnote` 70, `textLink` 72-78, `fieldLabel` 84, `fieldControl` 86, `formError` 88-94, `actionButton` 96). Other body text with `font-mono`: the radio row label in `src/app/inventory/new/item-create-form.tsx` line 156, the back link in `src/app/inventory/scan/scan-capture.tsx` line 156, the notice container in `src/app/inventory/scan/scan-result-notice.tsx` line 77, and the camera hint in `src/components/barcode-scanner.tsx` line 312. The layout variable for Kode Mono is misnamed `geistMono` (`layout.tsx` line 15).

**Installed controls against shadcn 4.21 `base-nova`.** The local files match the `base-nova` registry style (Base UI primitives). Fetched sources from `https://ui.shadcn.com/r/styles/base-nova/<name>.json` were compared class by class:

- `src/components/ui/button.tsx` has drifted. The base (lines 6-35) omits `rounded-lg`, uses `border border-2` instead of `border border-transparent`, and every variant (lines 39-83) differs. For example, default is `bg-foreground text-background hover:bg-primary/80` instead of `bg-primary text-primary-foreground hover:bg-primary/80`, and outline is `border-primary ... hover:bg-primary/10` instead of `border-border bg-background hover:bg-muted ...`. Sizes (lines 85-135) match.
- `src/components/ui/input.tsx` has drifted. It wraps `react-aria-components` `Input` with `composeRenderProps` (lines 3-7, 20) instead of `@base-ui/react/input`, omits `rounded-lg`, and adds `border-primary` after `border-input` (lines 26-27). `react-aria-components` is imported nowhere else in `src`.
- `src/components/ui/field.tsx` has drifted slightly. `FieldLabel` (lines 140-160) lacks `dark:has-data-checked:border-primary/20` and `dark:has-data-checked:bg-primary/10`. The responsive variant (line 87) prefixes `[&>.sr-only]:w-auto` with `@md/field-group:`, which upstream does not.
- `textarea.tsx`, `label.tsx`, `separator.tsx`, and `input-group.tsx` match upstream class for class.
- Every local file uses `clsx` where upstream uses `cn` (`clsx` plus `tailwind-merge`). The repo has no `tailwind-merge`, and no caller passes a class that conflicts with a base class, so `clsx` stays.

**Hard-coded colors.** `class-names.ts` line 91 uses `text-red-700` for form errors. `class-names.ts` line 32 uses `dark:bg-black/20` for the panel.

**Buttons.** Every `Button` usage, mapped to the TEC-37 icon table:

| Screen | Label | File and lines | Icon |
| --- | --- | --- | --- |
| Scanner | using | `src/app/inventory/scan/scan-direction-buttons.tsx` 78-87 | `PackageMinus` |
| Scanner | stocking | same element, mapped by direction | `PackagePlus` |
| Inventory | Add item | `src/app/inventory/page.tsx` 35-42 | `Plus` |
| Inventory | Scan item | `src/app/inventory/page.tsx` 43-50 | `ScanBarcode` |
| Header | Sign out | `src/components/sign-out-button.tsx` 10-12 | `LogOut` |
| Hab-unit setup | Apply | `src/app/hab-unit/new/hab-unit-name-form.tsx` 76-83 | `Check` |
| Barcode entry | Apply | `src/app/inventory/new/barcode-lookup-form.tsx` 63-69 | `Check` |
| Add to hab-unit | Apply | `src/app/inventory/new/add-to-hab-unit-form.tsx` 72-79 | `Check` |
| Item creation | Apply | `src/app/inventory/new/item-create-form.tsx` 100-107 | `Check` |
| Scanner fallback | Apply | `src/components/barcode-scanner.tsx` 209-215 | `Check` |
| Landing | Sign in | `src/app/page.tsx` 41-48 | none, not in table |
| Landing | Sign up | `src/app/page.tsx` 49-56 | none, not in table |
| Login | Sign in | `src/app/(auth)/login/page.tsx` 92-99 | none, not in table |
| Signup | Sign up | `src/app/(auth)/signup/page.tsx` 92-99 | none, not in table |
| Item creation | Attach | `src/app/inventory/new/item-create-form.tsx` 176-183 | none, not in table |

`src/app/inventory/scan/scan-capture.tsx` lines 143-162 render "Back to inventory" as a plain `Link`, not a `Button`. `lucide-react` is not a dependency (`package.json` lines 24-36). No `components.json` exists.

**Stock labels.** No CRITICAL, WARNING, or IN STOCK label renders anywhere in `src` today. FR-008 lands with S-06 and S-10, which are `ready`, not `done`.

**Controls that break at radius 0.** None of the installed controls has a round-only shape (no switch, checkbox, radio, slider, or avatar component is installed). The only radio on screen is the native `<input type="radio">` in `item-create-form.tsx` lines 159-164, which the browser draws as a circle regardless of radius tokens.

**Commands.** `package.json` lines 10-12: `pnpm lint` (`eslint .`), `pnpm test` (`vitest run`), `pnpm typecheck` (`next typegen && tsc --noEmit`). Line 7: `pnpm build`. CI (`.github/workflows/deploy.yml` lines 45-54) runs lint, typecheck, test, and `pnpm worker:check`. Vitest runs `src/**/*.test.ts` in the node environment (`vitest.config.mts`), so there is no DOM test harness.

`context/foundation/lessons.md` does not exist.

## Desired End State

In light and dark OS modes, every screen in the route table below uses the muted green tokens: sage-tinted off-white or deep green-gray surfaces, low-chroma green primary, and no neon green. Body copy, labels, inputs, buttons, links, and notices render in Geist Sans. Page titles, section headings, the brand label, and the scan notice title render in Kode Mono. Buttons, inputs, panels, notices, and focus rings have square corners. `button.tsx`, `input.tsx`, and `field.tsx` match shadcn 4.21 `base-nova` class sets and primitives. Ten buttons show their Lucide icon before the label, hidden from assistive technology. Three stock-label token pairs exist with fixed FR-008 colors for S-10 to consume.

Routes to check: `/`, `/login`, `/signup`, `/hab-unit/new`, `/inventory`, `/inventory/new`, `/inventory/new?barcode=<unknown>`, `/inventory/new?barcode=<global item>`, `/inventory/scan`, and the scanner manual fallback.

## What We're NOT Doing

- Rendering CRITICAL, WARNING, or IN STOCK labels. That is S-06 and S-10 under FR-007 and FR-008. This change only defines their tokens.
- A theme toggle, `next-themes`, or a stored theme preference. Dark mode follows the OS setting.
- Icons for Sign in, Sign up, or Attach. The TEC-37 table names no icon for them.
- Icons on links that are not `Button` (Back to inventory, footnote links, the brand label).
- Restyling the loading splash (`src/components/loading-screen.tsx`). Its marks are white SVG files on a fixed `#181818` backdrop and would vanish on a light token.
- Restyling the camera viewport in `barcode-scanner.tsx` lines 220-320 (`bg-black`, `text-white`, black overlay). It frames live video.
- Replacing the native radio list. That is S-14.
- Adding `tailwind-merge`, a `cn` helper, `components.json`, or shadcn tokens no installed control reads (`--popover`, `--chart-*`, `--sidebar-*`).
- Adding shadcn components that are not installed.
- Editing `context/foundation/roadmap.md`.

## Implementation Approach

Theme through CSS variables, following shadcn 4.21 theming: OKLCH values in `:root`, a dark override, and `@theme inline` mappings with the full radius scale derived from `--radius`. Set `--radius: 0` so every `rounded-*` utility on installed controls resolves to 0 without touching component structure. Use Tailwind's default `dark:` variant (`prefers-color-scheme`) instead of the unused `.dark` class, so the existing `dark:` utilities in shadcn controls start working. Keep stock-label colors in their own token family, defined once, outside the chrome palette.

Restore the three drifted controls to upstream class sets and primitives, keeping the repo's `clsx` idiom. Move body text to Geist Sans by setting `font-sans` on `<body>` and removing `font-mono` from body-copy classes. Add Lucide icons with `data-icon="inline-start"` so the upstream Button rules size the svg and trim the start padding.

## Critical Implementation Details

**Palette tokens.** Exact values for `globals.css`. Hex values are sRGB approximations for review only. Write the OKLCH values.

| Token | Light (`:root`) | Dark (`prefers-color-scheme: dark`) |
| --- | --- | --- |
| `--background` | `oklch(0.97 0.012 155)` #eff8f2 | `oklch(0.2 0.015 160)` #101814 |
| `--foreground` | `oklch(0.27 0.03 160)` #192b21 | `oklch(0.9 0.02 155)` #d4e2d8 |
| `--card` | `oklch(0.985 0.008 155)` #f6fcf8 | `oklch(0.24 0.018 160)` #18221c |
| `--card-foreground` | `oklch(0.27 0.03 160)` | `oklch(0.9 0.02 155)` |
| `--primary` | `oklch(0.48 0.06 160)` #3e6852 | `oklch(0.72 0.06 158)` #85b096 |
| `--primary-foreground` | `oklch(0.97 0.012 155)` | `oklch(0.2 0.015 160)` |
| `--secondary` | `oklch(0.92 0.02 155)` #dbe9df | `oklch(0.3 0.02 160)` #25312a |
| `--secondary-foreground` | `oklch(0.27 0.03 160)` | `oklch(0.9 0.02 155)` |
| `--muted` | `oklch(0.93 0.015 155)` #e0ebe3 | `oklch(0.28 0.018 160)` #212c26 |
| `--muted-foreground` | `oklch(0.5 0.025 160)` #57685e | `oklch(0.7 0.025 155)` #93a398 |
| `--accent` | `oklch(0.9 0.03 155)` #cfe4d5 | `oklch(0.32 0.03 160)` #25382e |
| `--accent-foreground` | `oklch(0.27 0.03 160)` | `oklch(0.9 0.02 155)` |
| `--destructive` | `oklch(0.55 0.19 27)` #c9302d | `oklch(0.7 0.17 25)` #f66d67 |
| `--border` | `oklch(0.85 0.02 155)` #c4d2c8 | `oklch(0.36 0.02 160)` #344039 |
| `--input` | `oklch(0.85 0.02 155)` | `oklch(0.4 0.02 160)` #3f4b44 |
| `--ring` | `oklch(0.6 0.05 160)` #668a76 | `oklch(0.55 0.05 158)` #597b66 |

Computed WCAG contrast: foreground on background is 13.7:1 light and 13.5:1 dark, high enough for long reads without pure black on white. Muted foreground on background is 5.5:1 light and 6.8:1 dark. Primary foreground on primary is 5.8:1 light and 7.5:1 dark. Ring on background is 3.6:1 light and 3.8:1 dark, above the 3:1 non-text minimum.

**Stock-label tokens.** Defined once in `:root`, not overridden in dark, and mapped in `@theme inline` as `--color-stock-critical`, `--color-stock-critical-foreground`, and the same for `warning` and `in-stock`. Each pair is a self-contained badge, so it reads on both backgrounds.

| Token | Value | Foreground | Foreground contrast |
| --- | --- | --- | --- |
| `--stock-critical` (red) | `oklch(0.58 0.21 27)` #db2c2b | `oklch(0.985 0.008 155)` | 4.6:1 |
| `--stock-warning` (yellow/gold) | `oklch(0.8 0.16 85)` #edb417 | `oklch(0.2 0.015 160)` | 9.6:1 |
| `--stock-in-stock` (green) | `oklch(0.62 0.17 145)` #2f9f3d | `oklch(0.2 0.015 160)` | 5.3:1 |

**Why chrome stays distinct from IN STOCK.** Every chrome token except `--destructive` has OKLCH chroma at most 0.06, while IN STOCK has chroma 0.17 at hue 145, against chrome hues 155-160. The nearest chrome token, light `--ring`, sits 0.124 from IN STOCK in OKLab distance. Light `--primary` sits 0.18 and dark `--primary` 0.15. A just-noticeable OKLab difference is about 0.02. The Phase 1 test enforces the chroma ceiling and a 0.12 minimum distance.

**Dark variant.** Delete `@custom-variant dark (&:is(.dark *));` so Tailwind's default `dark:` variant (`prefers-color-scheme: dark`) applies. Replace both the `.dark` block and the partial media block with one `@media (prefers-color-scheme: dark) { :root { ... } }` that holds the full dark column above. Add `color-scheme: light dark` to `:root` so native radios, autofill, and scrollbars follow the mode.

**Radius 0.** With `--radius: 0`, upstream arbitrary values such as `rounded-[calc(var(--radius)-3px)]` compute to a negative length, which CSS clamps to 0. No control needs a non-zero exception.

## Phase 1: Muted green tokens and square corners

### Overview

Every screen uses the muted green palette in light and dark, every `rounded-*` utility resolves to 0, and stock-label tokens exist separately from chrome.

### Changes Required

#### 1. Theme tokens

**File:** `src/app/styles/globals.css`

**Intent:** Replace the hex palette with the OKLCH tokens above, make dark mode real, set radius to 0, complete the shadcn radius scale, and add the stock-label family.

**Contract:** Line 3 `@custom-variant dark` is removed. `:root` holds `--radius: 0`, `--border-width-thick: 2px` (unchanged), `color-scheme: light dark`, the light column, and the six stock tokens. One `@media (prefers-color-scheme: dark)` block overrides `:root` with the dark column only and contains no `--stock-*` token. The `.dark` block (lines 27-44) and the old media block (lines 222-227) are gone. `@theme inline` adds `--radius-2xl: calc(var(--radius) * 1.8)`, `--radius-3xl: calc(var(--radius) * 2.2)`, `--radius-4xl: calc(var(--radius) * 2.6)`, and the six `--color-stock-*` mappings. Font mappings, animations, keyframes, and the reduced-motion block stay as they are.

#### 2. Hard-coded chrome colors

**File:** `src/app/styles/class-names.ts`

**Intent:** Put the panel and form error on theme tokens so both read in dark mode.

**Contract:** `panel` replaces `dark:bg-black/20` with `bg-card` and `text-card-foreground`. `formError` replaces `text-red-700` with `text-destructive`. No other class changes in this phase.

#### 3. Inventory panel corner

**File:** `src/app/inventory/page.tsx`

**Intent:** Remove the bevel corner, which radius 0 makes dead.

**Contract:** Line 22 drops `rounded-br-4xl`. Line 23 drops the `cornerShape` style prop. The unused `CSSProperties` import (line 8) goes.

#### 4. Token guard test

**File:** `src/app/styles/theme-tokens.test.ts` (new)

**Intent:** Lock the testable parts of FR-019 and the FR-008 colors.

**Contract:** Reads `globals.css` from disk and parses `--name: oklch(L C H)` declarations in the `:root` block and the dark media block. Tests:
- `sets the base radius token to 0`
- `keeps the FR-008 stock label colors at their fixed values` (exact strings for all six stock tokens)
- `defines stock label tokens only in the light root block`
- `keeps every chrome color token at or below 0.06 chroma except destructive` (both modes)
- `keeps every chrome color token at least 0.12 OKLab distance from the in-stock color` (both modes, excluding `--destructive`)
- `fails to parse when a chrome token is not oklch` (the parser throws a named error on a non-OKLCH chrome value)
Assertions use `toEqual`.

### Success Criteria

#### Automated Verification

- `pnpm test` passes, including `src/app/styles/theme-tokens.test.ts`.
- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `rg -n "custom-variant dark|\.dark \{|#[0-9a-fA-F]{6}" src/app/styles/globals.css` returns no match.
- `rg -n "rounded-(xs|full|br-4xl)|cornerShape" src --glob '!src/components/ui/**'` returns no match.

#### Manual Verification

- With the OS (or DevTools `prefers-color-scheme`) set to light, `/`, `/login`, and `/inventory` show a sage off-white background, dark green-gray text, and no beige or neon green.
- With dark emulated, the same routes show a deep green-gray background, soft green-gray text, and muted green borders and focus rings. No `#32af00`-style neon remains.
- The inventory panel, buttons, inputs, and focus rings have square corners in both modes.
- A form error on `/login` (submit empty) reads in the destructive red in both modes.

---

## Phase 2: Body text in Geist Sans

### Overview

Running text renders in Geist Sans, and mono text (display headings and the brand) renders in Kode Mono. No font is installed or reloaded: the `next/font` wiring already works.

### Changes Required

#### 1. Root body font

**Files:** `src/app/layout.tsx`, `src/app/styles/globals.css`

**Intent:** Make Geist Sans the inherited body font through the existing `--font-sans` mapping.

**Contract:** `<body>` className gains `font-sans` beside the two font variable classes and `antialiased`. The `geistMono` constant is renamed `kodeMono`, with no option change. In `globals.css`, the `body` rule (lines 258-262) loses its `font-family` declaration and keeps `background` and `color`.

#### 2. Body-copy classes

**File:** `src/app/styles/class-names.ts`

**Intent:** Stop forcing mono on running text.

**Contract:** `font-mono` is removed from `pageLead`, `sectionCopy`, `footnote`, `textLink`, `fieldLabel`, `fieldControl`, `formError`, and `actionButton`. `pageTitle` and `sectionHeading` keep `font-mono`.

#### 3. Inline body text

**Files:** `src/app/inventory/new/item-create-form.tsx`, `src/app/inventory/scan/scan-capture.tsx`, `src/app/inventory/scan/scan-result-notice.tsx`, `src/components/barcode-scanner.tsx`

**Intent:** Apply the same mono and sans split to text styled outside `class-names.ts`.

**Contract:** Remove `font-mono` from the radio row label (`item-create-form.tsx` line 156), the back link (`scan-capture.tsx` line 156), and the camera hint (`barcode-scanner.tsx` line 312). In `scan-result-notice.tsx`, move `font-mono` from the container (line 77) to the title paragraph (lines 87-94), so the detail and confirmation lines render in Geist Sans. The attach heading (`item-create-form.tsx` line 117) and `src/components/tally-label.tsx` keep `font-mono`.

### Success Criteria

#### Automated Verification

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes.
- `rg -n "font-kode-mono\), monospace|geistMono" src` returns no match.
- `rg -n "'font-mono'" src` lists only `class-names.ts` (`pageTitle`, `sectionHeading`), `item-create-form.tsx` (attach heading), `scan-result-notice.tsx` (title), and `tally-label.tsx`.

#### Manual Verification

- On `/`, DevTools computed `font-family` for the lead paragraph and section copy resolves to Geist, and for the `h1` and section headings to Kode Mono.
- On `/login`, labels, inputs, the error line, the Sign in button, and the footnote link render in Geist Sans.
- The header brand label still types out in Kode Mono.
- On `/inventory/scan` with a stocked barcode, the notice title renders in Kode Mono and the detail line in Geist Sans.

---

## Phase 3: shadcn default controls

### Overview

`Button`, `Input`, and `Field` match shadcn 4.21 `base-nova` primitives, base classes, and variants. The theme tokens and radius 0 now set their look.

### Changes Required

#### 1. Button

**File:** `src/components/ui/button.tsx`

**Intent:** Restore upstream base classes and variants.

**Contract:** The base class set equals upstream: add `rounded-lg`, replace `border-2` with `border-transparent`, everything else unchanged. Variants equal upstream:
- `default`: `bg-primary text-primary-foreground hover:bg-primary/80`
- `outline`: `border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50`
- `secondary`: `bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground`
- `ghost`: `hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50`
- `destructive`: `bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40`
- `link`: unchanged

Sizes, `defaultVariants`, the `Button` signature, `data-slot`, and exports stay. The `clsx` token-per-argument formatting may stay.

#### 2. Input

**File:** `src/components/ui/input.tsx`

**Intent:** Restore the upstream Base UI primitive and class set.

**Contract:** Import `Input as InputPrimitive` from `@base-ui/react/input`. Props are `React.ComponentProps<'input'>`. `className` is a plain `clsx(...)` string, with no `composeRenderProps`. Classes equal upstream: add `rounded-lg`, drop `border-primary`. Keep `'use client'`, `type` pass-through, and `data-slot="input"`. Callers (`fieldControl` strings, `value` and `onChange` in `item-create-form.tsx` lines 133-139, `defaultValue`, `aria-invalid`) work unchanged.

#### 3. Field

**File:** `src/components/ui/field.tsx`

**Intent:** Close the two small class gaps with upstream.

**Contract:** `FieldLabel` gains `dark:has-data-checked:border-primary/20` and `dark:has-data-checked:bg-primary/10`. The responsive variant uses `[&>.sr-only]:w-auto` without the `@md/field-group:` prefix. No other change.

#### 4. Orphaned dependency

**File:** `package.json` (and `pnpm-lock.yaml`)

**Intent:** Drop the library that only the old `Input` used.

**Contract:** Run `pnpm remove react-aria-components`. No other dependency changes.

### Success Criteria

#### Automated Verification

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm build` passes.
- `rg -n "react-aria" src package.json` returns no match.
- `rg -n "border-2|bg-foreground|border-primary" src/components/ui/button.tsx src/components/ui/input.tsx` returns no match.

#### Manual Verification

- On `/login`, inputs show a thin `--input` border, a ring-colored focus outline, square corners, and the destructive border when invalid.
- Outline buttons on `/` and `/inventory` show the `--border` color, a muted hover fill, and square corners in both modes.
- On `/inventory/scan`, the selected direction uses the default variant (primary fill, primary foreground) and the other uses outline. Keyboard focus shows the ring.
- On `/inventory/new?barcode=<unknown>` with stocked items, typing in Filter narrows the radio list, which confirms `value` and `onChange` still work on the new Input.

---

## Phase 4: Button icons

### Overview

Every button named in the TEC-37 table shows its Lucide icon before the label. The icon is hidden from assistive technology, and the label stays the accessible name.

### Changes Required

#### 1. Icon library

**File:** `package.json` (and `pnpm-lock.yaml`)

**Intent:** Add Lucide, which is not installed.

**Contract:** Run `pnpm add lucide-react`. No `components.json`.

#### 2. Icon placement

**Files:** `src/app/inventory/scan/scan-direction-buttons.tsx`, `src/app/inventory/page.tsx`, `src/components/sign-out-button.tsx`, `src/app/hab-unit/new/hab-unit-name-form.tsx`, `src/app/inventory/new/barcode-lookup-form.tsx`, `src/app/inventory/new/add-to-hab-unit-form.tsx`, `src/app/inventory/new/item-create-form.tsx`, `src/components/barcode-scanner.tsx`

**Intent:** Place the table icon as the first child of each named `Button`.

**Contract:** Each icon element is `<IconName data-icon="inline-start" aria-hidden="true" />`, with no `size-*` or other class, followed by the unchanged label text. The upstream `[&_svg:not([class*='size-'])]:size-4` and `has-data-[icon=inline-start]:pl-2` rules set size and padding. Mapping: using `PackageMinus`, stocking `PackagePlus`, Add item `Plus`, Scan item `ScanBarcode`, Sign out `LogOut`, each of the five Apply buttons `Check`. In `scan-direction-buttons.tsx`, a module constant `SCAN_DIRECTION_ICONS` maps each `ScanDirection` to its icon component, and the map callback renders it. `role="radio"`, `aria-checked`, and `onClick` are unchanged. For `nativeButton={false}` link buttons on `/inventory`, the icon is a child of `Button`, so it renders inside the `Link`. Sign in, Sign up, and Attach get no icon.

### Success Criteria

#### Automated Verification

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm build` passes.
- `rg -n '"lucide-react"' package.json` shows one dependency entry.
- `rg -c 'data-icon="inline-start"' src` totals 9 across the 8 files (one per Apply, Add item, Scan item, and Sign out element, and one shared element in the direction map).
- `rg -n 'data-icon="inline-start"[^>]*className' src` returns no match.

#### Manual Verification

- On `/inventory/scan`, using shows a package with a minus badge and stocking shows the same package with a plus badge, both before the label.
- On `/inventory`, Add item shows a plus and Scan item shows a barcode scanner icon. The header Sign out shows a log-out arrow.
- Each Apply button (hab-unit setup, barcode entry, add to hab-unit, item creation, scanner fallback) shows a check mark before the label.
- Icons sit at 16px with balanced start padding and inherit the button text color in both modes.
- In the DevTools accessibility tree, each icon button's name is its label text only (for example `stocking`, `Sign out`), and the svg is hidden.
- Sign in, Sign up, and Attach show no icon.

---

## Testing Strategy

### Unit Tests

- `theme-tokens.test.ts` covers the radius token, the six fixed stock-label values, their absence from the dark block, the chroma ceiling, the OKLab distance from IN STOCK in both modes, and the parse error path.

### Integration Tests

- None. Vitest runs in the node environment with no DOM harness, and no existing test renders components. `pnpm build` confirms every route compiles with the restored controls and icons.

### Manual Testing Steps

1. Run `pnpm dev`. Open DevTools Rendering and emulate `prefers-color-scheme: light`.
2. Visit `/`, `/signup`, `/login`. Check palette, square corners, fonts (Geist body, Kode Mono titles), and outline buttons.
3. Submit login empty. Check the destructive error color and the invalid input border.
4. Sign in. On `/hab-unit/new` (new account) check the Apply check icon. On `/inventory` check Add item and Scan item icons and the square panel.
5. Open `/inventory/new`, enter an unknown barcode, and check the Apply icon on barcode entry and item creation. With stocked items, check Filter narrows the list and Attach has no icon.
6. Open `/inventory/scan`. Check the using and stocking icons, switch direction, and scan or enter a stocked barcode to check the notice fonts. Deny camera access to reach the manual fallback and check its Apply icon.
7. Emulate `prefers-color-scheme: dark` and repeat steps 2 to 6.
8. Inspect the accessibility tree for one icon button per screen.

## References

- Roadmap: `context/foundation/roadmap.md` (S-13)
- PRD: `context/foundation/prd.md` (FR-019, FR-008)
- Linear TEC-37, GitHub issue pterodactor3000/Noospheric-Tally#20
- shadcn 4.21 theming: `apps/v4/content/docs/(root)/theming.mdx` (radius scale, OKLCH tokens)
- shadcn 4.21 `base-nova` registry: `https://ui.shadcn.com/r/styles/base-nova/{button,input,field,textarea,label,separator,input-group}.json`
- Next.js 16 `next/font` `variable` option with Tailwind `@theme inline`: `docs/01-app/03-api-reference/02-components/font.mdx`
- `src/app/styles/globals.css` lines 3, 5-25, 27-44, 46-82, 222-227, 258-262
- `src/app/layout.tsx` lines 10-18, 36-38
- `src/app/styles/class-names.ts` lines 26-33, 45-96
- `src/components/ui/button.tsx` lines 6-135
- `src/components/ui/input.tsx` lines 3-57
- `src/components/ui/field.tsx` lines 81-90, 133-163
- `src/app/inventory/page.tsx` lines 8, 21-50
- `src/app/inventory/scan/scan-direction-buttons.tsx` lines 73-90

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Muted green tokens and square corners

#### Automated

- [x] 1.1 `pnpm test` passes, including `src/app/styles/theme-tokens.test.ts` bba5050
- [x] 1.2 `pnpm lint` passes bba5050
- [x] 1.3 `pnpm typecheck` passes bba5050
- [x] 1.4 `rg -n "custom-variant dark|\.dark \{|#[0-9a-fA-F]{6}" src/app/styles/globals.css` returns no match bba5050
- [x] 1.5 `rg -n "rounded-(xs|full|br-4xl)|cornerShape" src --glob '!src/components/ui/**'` returns no match bba5050

#### Manual

- [x] 1.6 Light mode on `/`, `/login`, `/inventory` shows sage off-white background, dark green-gray text, no beige or neon green bba5050
- [x] 1.7 Dark mode on the same routes shows deep green-gray background, soft text, muted green borders and rings, no neon bba5050
- [x] 1.8 Inventory panel, buttons, inputs, and focus rings are square in both modes bba5050
- [x] 1.9 A `/login` form error reads in destructive red in both modes bba5050

### Phase 2: Body text in Geist Sans

#### Automated

- [ ] 2.1 `pnpm lint` passes
- [ ] 2.2 `pnpm typecheck` passes
- [ ] 2.3 `pnpm test` passes
- [ ] 2.4 `rg -n "font-kode-mono\), monospace|geistMono" src` returns no match
- [ ] 2.5 `rg -n "'font-mono'" src` lists only `pageTitle`, `sectionHeading`, the attach heading, the scan notice title, and `tally-label.tsx`

#### Manual

- [ ] 2.6 On `/`, lead and section copy compute to Geist, `h1` and section headings to Kode Mono
- [ ] 2.7 On `/login`, labels, inputs, error, Sign in button, and footnote link render in Geist Sans
- [ ] 2.8 The header brand label still types out in Kode Mono
- [ ] 2.9 The scan notice title renders in Kode Mono and its detail in Geist Sans

### Phase 3: shadcn default controls

#### Automated

- [ ] 3.1 `pnpm lint` passes
- [ ] 3.2 `pnpm typecheck` passes
- [ ] 3.3 `pnpm test` passes
- [ ] 3.4 `pnpm build` passes
- [ ] 3.5 `rg -n "react-aria" src package.json` returns no match
- [ ] 3.6 `rg -n "border-2|bg-foreground|border-primary" src/components/ui/button.tsx src/components/ui/input.tsx` returns no match

#### Manual

- [ ] 3.7 `/login` inputs show thin input border, ring focus, square corners, destructive border when invalid
- [ ] 3.8 Outline buttons on `/` and `/inventory` show border color, muted hover, square corners in both modes
- [ ] 3.9 On `/inventory/scan`, the selected direction uses the default variant and the other uses outline, with visible keyboard focus
- [ ] 3.10 On item creation, Filter narrows the radio list on the new Input

### Phase 4: Button icons

#### Automated

- [ ] 4.1 `pnpm lint` passes
- [ ] 4.2 `pnpm typecheck` passes
- [ ] 4.3 `pnpm test` passes
- [ ] 4.4 `pnpm build` passes
- [ ] 4.5 `rg -n '"lucide-react"' package.json` shows one dependency entry
- [ ] 4.6 `rg -c 'data-icon="inline-start"' src` totals 9 across the 8 files
- [ ] 4.7 `rg -n 'data-icon="inline-start"[^>]*className' src` returns no match

#### Manual

- [ ] 4.8 using and stocking show the same package glyph with a minus or plus badge before the label
- [ ] 4.9 Add item shows a plus, Scan item a barcode scanner, Sign out a log-out arrow
- [ ] 4.10 All five Apply buttons show a check mark before the label
- [ ] 4.11 Icons are 16px with balanced start padding and inherit text color in both modes
- [ ] 4.12 Accessibility tree names each icon button by its label only, with the svg hidden
- [ ] 4.13 Sign in, Sign up, and Attach show no icon
