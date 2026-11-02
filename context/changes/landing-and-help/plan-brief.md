# Landing Page and Help Plan Brief

> Full plan: `context/changes/landing-and-help/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-15, Linear TEC-64)

## What and Why

The signed-out landing page still talks about a deployment foundation and two placeholder sections, and the app has no help. This change makes the landing page say what the app does, adds a `[ ? ]` control to the header, and adds a public help page with ten topics and dark-mode screenshots of the real UI.

## Starting Point

`src/app/page.tsx` has a stale lead plus an Inventory and a Platform section. `src/components/header.tsx` shows the app name and, when signed in, Sign out. There is no `/help` route and no screenshot. Dark mode exists only as a `prefers-color-scheme: dark` token block in `src/app/styles/globals.css`. There is no switcher and no `.dark` class.

## Desired End State

A signed-out visitor reads one sentence: the app records stock when an item is handled and shows what needs restocking. `[ ? ]` sits on the right of the header. Signed in, it sits right after Sign out. It opens `/help`, ten numbered topics from the tally list to sharing a hab unit, with thirteen dark-mode screenshots under the topics they illustrate.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| PRD ref | None cited | The roadmap marks `none (?)`. No FR is invented. | Roadmap |
| Landing copy | Keep the title, buttons, footnote, and redirect. One lead sentence, no replacement section. | Confirmed scope. The exact sentence is the planner's wording. | User, plan |
| Help route | `/help`, public, not in `PROTECTED_PATH_PREFIXES` | Signed-out visitors need it. Pinned by a test. | `isProtectedPath.ts:1` |
| Help content | One data module, `src/app/help/help-topics.ts`, plus a markup-only page | Order, ids, and quoted labels become testable in the `node` Vitest setup. | Plan |
| `[ ? ]` control | `Button variant="outline"` as a link, default `h-8`, in a right-hand group after Sign out | Matches Sign out. Signed out it is alone on the right. DOM order equals visual order. | User, plan |
| Narrow header | Measure first. Fix in a fixed order: tighter button padding, tighter label tracking, label shrink. Never wrap or hide `[ ? ]`. | A 390px phone has about 342px of content width and the three items need more. | Plan |
| Dark mode | Browser color-scheme emulation (`colorScheme: 'dark'`), checked with `matchMedia`. No CSS, class, or switch. | `globals.css:35` gates all dark tokens behind the media query. | `globals.css` |
| Capture settings | 390 by 844, one device scale, `reducedMotion: 'reduce'` | Phone-first product. Reduced motion shows the finished header label and notices. | Plan |
| Image storage | `public/help/help-NN-<slug>.png`, 13 files, `next/image` with `unoptimized` | Plain paths, header-readable PNGs for tests, and no dependence on `/_next/image`. | Plan |
| Scanner shots | The no-camera manual-entry state, with both direction buttons | A real state of the screen. No `getUserMedia` mock. | Plan |
| Popup shots | Real scans through the manual form, `tally` then `consume` on one item | Truthful notices, and the count returns to its seed value. | Plan |
| Seed data | 9 fictional items with in-store `200…` barcodes in the `TEST_EMAIL` hab unit, gated on the hab unit holding nothing else | Fictional names stay off real catalog barcodes. The project is probably the production Supabase. | Plan |
| Share shot | Capture the invite code, then generate another so it is dead | A live code in git would let a stranger join the test hab unit. | Plan |

## Scope

**In scope:**

- Landing page copy in `src/app/page.tsx`
- `[ ? ]` control in `src/components/header.tsx` and new `src/components/help-link.tsx`
- `/help` route, `src/app/help/help-topics.ts`, `src/app/help/help-screenshot.tsx`, and their tests
- A `/help` assertion in `src/lib/auth/isProtectedPath.test.ts`
- Thirteen PNG files in `public/help/`

**Out of scope:**

- A theme switcher, a CSS change, or any visual redesign (including S-13)
- A PRD requirement id
- Help copy for hiding an item, sign-in, sign-up, and hab-unit setup
- A component test harness, a new dependency, or a committed capture script
- A roadmap status change before merge
- The uncommitted `AGENTS.md`, `package.json`, and `pnpm-lock.yaml` edits

## Approach

Landing copy first, because it stands alone. Then the help route before anything links to it, driven by a data module with tests. Then the header control. Last, capture the screenshots from the finished app so they show the final header, and wire them into the data module, with tests that read each PNG header.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Signed-out landing copy | New lead sentence, grid removed, title, buttons, footnote, and redirect kept | Low. Stale imports left behind. |
| 2. Help page with ten topics | `/help` with ten ordered topics, public, tested | Help copy that drifts from the screens. Quoted labels are tested. |
| 3. `[ ? ]` header control | Right-hand group with Sign out then `[ ? ]` | A 320px to 390px header overflows. Measure and apply the fixed fallback ladder. |
| 4. Dark-mode screenshots | 13 PNGs in `public/help/`, rendered under their topics | Seeding writes to a Supabase project. Gate on the test hab unit, use fictional barcodes, kill the invite code. |

## Risks and Assumptions

- **Assumption (changes screenshots):** The `TEST_EMAIL` account in `.env` belongs to a test hab unit that can take nine seeded items, and `.env.local` may be the production Supabase project. If the hab unit holds other items, capture stops. The parent decides whether to use another account or stop.
- **Assumption (changes screenshots):** Seeded counts include scan history (a `tally` and a `consume` on Plain flour). The history stays in the test hab unit. The seeded items are hidden afterwards, and hiding deletes their history.
- **Assumption (changes screenshots):** The scanner and lookup shots show the manual-entry state because the headless browser has no camera. A camera-view shot needs a fake-camera Chromium launch that this plan does not require.
- **Assumption (changes screenshots):** 390 by 844, one device scale for all files. A different viewport changes every file.
- **Assumption (changes screenshots):** The invite link in `help-10-share.png` shows the local origin (`http://localhost:3000`). The code is dead by the end of the phase.
- **Assumption (changes `[ ? ]` placement):** None for the placement itself. Order is Sign out then `[ ? ]` in both states. The narrow-width ladder can tighten the app-name tracking at small widths, and it never moves, wraps, or hides `[ ? ]`.
- **Assumption (copy):** The landing sentence is "Noospheric Tally records stock when an item is handled and shows what needs restocking." The wording is the planner's. The meaning is the confirmed scope.
- **Risk:** The roadmap handoff lists S-15 as not ready for planning. The user confirmed the scope and ordered implementation, so the plan proceeds.
- **Risk:** Help page markup and header placement have no automated render test, since the harness is `node`-only. They are covered by source greps, DOM reads in the browser, and manual steps.

## Success Criteria

- A signed-out visitor sees the product sentence, Sign in, and Sign up, and none of the removed content.
- `[ ? ]` is the rightmost header control, signed out and signed in, and Sign out sits immediately left of it when signed in.
- `/help` opens signed out and signed in, with the ten topics in the confirmed order and thirteen dark images in place.
- `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass.
