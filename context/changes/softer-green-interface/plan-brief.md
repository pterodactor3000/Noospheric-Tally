# Softer Green Interface Plan Brief

> Full plan: `context/changes/softer-green-interface/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-13)

## What and Why

Restyle every screen in a muted green palette for comfortable long reads, on shadcn/ui default controls, with Geist Sans body text, Kode Mono mono text, and square corners (FR-019). FR-008 stock-label colors stay fixed and separate from chrome, so IN STOCK green never blends into the interface.

## Starting Point

The palette is beige plus saturated green in light and neon green in a `.dark` block that never applies, so a dark OS gets a half-dark theme. Radius is 0.5rem. Fonts load correctly, but body text is forced to Kode Mono. `Button`, `Input`, and `Field` have drifted from shadcn 4.21 `base-nova`. `Input` wraps `react-aria-components` instead of Base UI. No button has an icon, `lucide-react` is not installed, and no stock label renders yet.

## Desired End State

In light and dark OS modes, every screen uses low-chroma green tokens with square corners. Running text is Geist Sans, and titles, headings, and the brand are Kode Mono. Installed controls match upstream. Ten buttons show their Lucide icon before the label, hidden from screen readers. Stock-label tokens exist for S-10 to consume.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Palette | OKLCH chrome tokens at chroma 0.06 or less, hue 155-160 (values in plan) | Muted for long reads. Foreground contrast is about 13.5:1 in both modes | Plan |
| IN STOCK separation | Separate `--stock-*` tokens. IN STOCK is `oklch(0.62 0.17 145)`, at least 0.12 OKLab from every chrome token | FR-019 challenge: chrome and stock-label colors stay separate | PRD, plan |
| Stock tokens now | Define critical, warning, and in-stock pairs once, mode-independent, with no consumer yet | Gives S-10 a fixed contract and makes the separation testable | Plan |
| Dark mode | Tailwind default `prefers-color-scheme` variant. Drop the unused `.dark` class | Nothing sets `.dark`. A toggle is out of scope | Research |
| Radius | `--radius: 0` with the full shadcn scale through `4xl`. No exceptions | No installed control breaks when square. The native radio is drawn by the browser | Research |
| Fonts | No install. `font-sans` on body. Mono only for titles, headings, brand, notice title | `next/font` wiring already works. Body was forced to mono | Research |
| Control drift | Restore upstream class sets and Base UI `Input`. Keep `clsx`, remove `react-aria-components` | Smallest edit to upstream structure. No class conflicts need `tailwind-merge` | Research |
| Icons | Lucide per the TEC-37 table, `data-icon="inline-start"`, `aria-hidden`, no size class | Upstream Button svg rules set size and padding | Issue |

## Scope

**In scope:**

- Theme tokens, dark mode activation, radius 0, and stock-label tokens in `globals.css`
- Theme-token guard test
- Body font switch and removal of `font-mono` from running text
- Restoring `button.tsx`, `input.tsx`, and `field.tsx` to `base-nova`
- `lucide-react` icons on using, stocking, Add item, Scan item, Sign out, and five Apply buttons

**Out of scope:**

- Rendering stock labels (S-06, S-10)
- A theme toggle or `next-themes`
- Icons for Sign in, Sign up, and Attach, which the TEC-37 table does not name
- The loading splash and the camera viewport, which need fixed dark backdrops
- Replacing the native radio list (S-14)
- `tailwind-merge`, `components.json`, and unused shadcn tokens

## Approach

Theme only through CSS variables, as shadcn 4.21 documents: OKLCH tokens in `:root`, one dark media override, and `@theme inline` mappings. Radius 0 squares every control without touching component structure. Then restore the three drifted controls to upstream, move body text to Geist Sans, and add icons with the upstream `data-icon` hook.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Muted green tokens and square corners | Muted palette in both modes, radius 0, stock tokens, guard test | Activating `dark:` utilities may expose dark styles never seen before |
| 2. Body text in Geist Sans | Sans running text, mono titles and brand | Uppercase cogitator copy may read differently in sans |
| 3. shadcn default controls | Upstream Button, Base UI Input, Field fixes | Base UI Input behavior differs from react-aria on edge props |
| 4. Button icons | Ten buttons with Lucide icons | Icon padding on full-width and link buttons |

## Risks and Assumptions

- Assumes OS-driven dark mode is acceptable without a toggle.
- Stock tokens have no consumer until S-10. S-10 must use them, not new label colors.
- Sign in, Sign up, and Attach stay icon-less, which leaves the icon criterion partial unless the issue table is extended.
- "Comfortable for a long read" is judged manually. The contrast figures in the plan are the objective proxy.

## Success Criteria

- Every listed route reads in the muted green palette in light and dark.
- Body text computes to Geist, and titles and the brand compute to Kode Mono.
- All buttons, inputs, panels, and focus rings are square.
- `button.tsx`, `input.tsx`, and `field.tsx` match shadcn 4.21 `base-nova`.
- The ten named buttons show their icon before the label, and the label stays the accessible name.
- The theme-token test locks radius 0 and the FR-008 stock colors.
