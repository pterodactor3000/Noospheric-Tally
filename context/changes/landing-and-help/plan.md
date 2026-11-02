# Landing Page and Help Implementation Plan

## Overview

The signed-out landing page still describes a deployment foundation and two placeholder sections. This change replaces them with one sentence on what the app does, adds a `[ ? ]` control to the header, and adds a public help page with ten topics and dark-mode screenshots of the real app. This is roadmap S-15 (`landing-and-help`), Linear TEC-64.

The roadmap Outcome is authoritative. S-15 has no PRD reference (`none (?)`), so no FR is cited and none is invented. Complexity is Medium: one new route, one header change, a content module with tests, and a screenshot capture that writes seed data to a Supabase project. There is no migration and no new dependency.

## Current State Analysis

Verified on branch `feature/s-15-landing-and-help`, created from `origin/main`.

**Landing page**

- `src/app/page.tsx:20-24` loads the user and redirects a signed-in user to `/inventory`.
- `src/app/page.tsx:29-31` is the `h1` "Know what is at home before you shop." The lead paragraph at `:32-36` ends with "The deployment foundation is in place for the inventory experience to follow."
- `src/app/page.tsx:38-55` holds the Sign in and Sign up buttons. `:57-62` holds the footnote with the second `/signup` link.
- `src/app/page.tsx:64-88` is a bordered two-column grid with the Inventory section (`:76-81`) and the Platform section (`:82-87`). `clsx`, `sectionCopy`, and `sectionHeading` are imported only for that grid (`:3`, `:12-13`).
- `sectionHeading` and `sectionCopy` stay exported from `src/app/styles/class-names.ts` because `src/app/hab-unit/new/join-hab-unit-form.tsx` and `src/app/hab-unit/share/share-hab-unit-form.tsx` use them.

**Header**

- `src/components/header.tsx:5-30` is an async server component. It calls `loadCurrentUser()` and renders `<TallyLabel />` then `{user !== null ? <SignOutButton /> : null}` in a flex row with `justify-between`, `px-6 sm:px-10`, `py-4`, and a 2px bottom border.
- `src/components/sign-out-button.tsx:8-15` is a `<form action={signOut}>` around `<Button variant="outline" type="submit">`. The default button size is `h-8` (`src/components/ui/button.tsx:82-84`).
- `src/app/inventory/page.tsx:20-26` sizes the tally from the signed-in header: `max-h-[calc(100svh-7rem-2px)]` assumes a header of `py-4` plus an `h-8` button plus a 2px border. The header must stay 66px tall when signed in.
- `src/components/tally-label.tsx:7-30` is the terminal-typing app name. It is 16 characters at `tracking-[0.24em]`, and its width is about 225px. Its text animates from `max-w-0` to `48rem` (`src/app/styles/globals.css:117-121`), and `prefers-reduced-motion: reduce` shows it at full width (`globals.css:258-262`).
- Width estimate for a 390px phone: label about 225px, Sign out about 91px, `[ ? ]` about 66px, plus gaps, against 342px of content width. The header can overflow once the third item exists. Phase 3 measures it.
- `src/app/layout.tsx:36-52` renders `<Header />` on every route, so `[ ? ]` also appears on the login, signup, and hab-unit setup pages.

**Routing and access**

- `src/lib/auth/isProtectedPath.ts:1` protects only `/inventory` and `/hab-unit` and their children. `/help` is public by default. `src/lib/auth/isProtectedPath.test.ts:5-19` is the existing test to extend.
- `src/middleware.ts:76-80` runs on every path except static assets and files ending in `png`, `svg`, `jpg`, `jpeg`, `gif`, or `webp`, so images in `public/help/` skip the auth call.

**Appearance (how dark mode is set)**

- `src/app/styles/globals.css:6` sets `color-scheme: light dark`. `:35-57` overrides the color tokens in `@media (prefers-color-scheme: dark)`. The file has no `.dark` class and no `@custom-variant`, so Tailwind's `dark:` utilities in `src/components/ui/button.tsx` and the other `ui` files follow the same media query.
- No theme switcher exists, and none is added. The only way to get a dark render is the browser color scheme. `src/app/styles/theme-tokens.test.ts:121-128` already asserts both token blocks.
- Dark background is `oklch(0.2 0.015 160)`, light background is `oklch(0.97 0.012 155)`.

**Screens the help page explains**

- Tally: `src/app/inventory/page.tsx:41-100` (title `[<hab unit>] tally`, search, rows, buttons `Add item`, `Scan item`, `Restock`, `Lookup`, link `Share hab unit`). Row and counter: `src/app/inventory/tally-count-controls.tsx:84-114` (`[-]`, count, `[+]`, disabled at 0 and at 99). Search, sort, group toggle: `src/app/inventory/inventory-tally.tsx:165-222`. Category order: `src/lib/items/item-category.ts:1-20` (Pet food, Food, Beauty, Other, Uncategorized). Panels with a shortage open by default: `src/lib/items/resolve-category-panel-open.ts`. Count 0 sorts last: `src/lib/items/sort-tally-lines.ts`.
- Add item: `src/app/inventory/new/page.tsx:20-93`, `barcode-lookup-form.tsx` (`Item data creation`, `Barcode`, `Apply`), `barcodeless-item-form.tsx` (`Or add an item without a barcode`, `Item name`, `Add without barcode`), `bulk-insert-form.tsx` (`Or add many items from a JSON file`, `JSON file`, `Add items from file`). The JSON file rules are in `src/lib/items/parse-bulk-items-file.ts` (array of `{ name, barcode }`, at most 500 entries, valid and unique barcodes) and `src/app/inventory/actions.ts:88-92` (256KB limit).
- Unknown barcode: `src/app/inventory/new/item-create-form.tsx:120-131` and `src/lib/catalog/get-create-lookup-notices.ts:5-6` (`The item was not found in our database.`, `Enter the item name manually.`). Attach: `item-create-form.tsx:170-285` (`Attach to existing item`, `Filter`, `Item designation`, `Attach`). Known elsewhere, not in this hab unit: `add-to-hab-unit-form.tsx` (`Add to hab-unit`). Already here: `already-stocked.tsx` (`Already stocked`).
- Scanner: `src/app/inventory/scan/scan-direction-buttons.tsx:21-31` (labels `consume` for using, `tally` for stocking), `:94-125` (radio group, `[<label>]` above the buttons), default `consume` at `:73-78`. Camera frame and the manual-entry fallback: `src/components/barcode-scanner.tsx:170-216`, `:220-320`. Session list with `Undo`: `src/app/inventory/scan/scan-session-list.tsx`.
- Popups: `src/app/inventory/scan/scan-result-notice.tsx:11-12` (5 seconds), `:33-34` (label only for WARNING and CRITICAL), `:139-178`. Sentences: `src/app/inventory/scan/page.tsx:65-76` (`was added to inventory.`, `was removed from inventory.`, `is already at 0.`).
- Restock: `src/lib/items/stock-state.ts:20-33` (CRITICAL at or below the minimum, WARNING below twice the minimum, minimum default 3), `src/lib/items/rank-restock-lines.ts` (CRITICAL only, shortfall is minimum minus count, largest first), `src/app/inventory/restock/restock-list.tsx:49-50` (`<count> // [<n> short]`), grouped by category (`:77-118`).
- Lookup: `src/app/inventory/lookup/lookup-capture.tsx:12`, `:82-150` (`Not in your hab unit.`, or label, name, `Count`), `src/lib/items/resolve-lookup-display.ts`. Lookup changes no count.
- Item details: `src/app/inventory/[itemId]/item-level-editor.tsx:296-403` (`Count`, `Minimum`, `Category`, `Use`, `Save`, `Cancel`). `Use` is `formatConsumptionRate` (`src/lib/items/format-consumption-rate.ts`): consume scans in the last 7 days (`src/lib/items/load-item-consumption-count.ts:3`), or `No use recorded`. Count 0 to 99, minimum 0 to 999.
- Share: `src/app/hab-unit/share/share-hab-unit-form.tsx:41-96` (`Generate invite code`, `Invite code`, `Invite link`, one use, 7 days, replaces an earlier unused code). Join box: `src/app/hab-unit/new/join-hab-unit-form.tsx` (`Join hab unit`, `Invite code`, `Join`). A person who already has a hab unit is refused and the hab unit is left alone: `context/changes/share-hab-unit/change.md`.

**Tests**

- Vitest runs `src/**/*.test.ts` in `node` (`vitest.config.mts`). There is no component harness and none is added. A content module with plain data is testable, a React page is not.

**Capture environment**

- `.env.local` and `.env` exist. `.env` holds `TEST_EMAIL` and `TEST_PASSWORD`. `wrangler.jsonc` shows one Supabase project. `.env.local` points at a Supabase project, and it is probably the same project that production uses. Seeding writes to it.
- The Playwright MCP namespace offers `browser_emulate_media`, `browser_resize`, `browser_take_screenshot`, `browser_run_code_unsafe`, and `browser_evaluate`. ImageMagick (`magick`) is installed.
- `public/` holds only SVG files and `_headers`. `public/help/` does not exist.
- The working tree has uncommitted edits to `AGENTS.md`, `package.json`, and `pnpm-lock.yaml`. They are not part of this change. `context/foundation/roadmap.md` has the uncommitted S-15 entry and stays as it is.

## Desired End State

- A signed-out visitor opens `/` and reads the title, one sentence saying the app records stock when an item is handled and shows what needs restocking, Sign in, Sign up, and the footnote. A signed-in visitor is redirected to `/inventory`, as before.
- Signed out, the header shows the app name on the left and `[ ? ]` on the right. Signed in, it shows the app name, then Sign out, then `[ ? ]` as the rightmost control, with Sign out immediately left of it.
- `[ ? ]` opens `/help`, a public page with ten numbered topics in the confirmed order. Thirteen dark-mode screenshots of the real app sit under the topics they illustrate.
- Verify with the commands and checks in each phase and the end-to-end steps in Manual Testing Steps.

## What We're NOT Doing

- A theme switcher, a `.dark` class, a CSS change, or any visual redesign.
- Roadmap S-13 (muted green palette) or any other slice.
- A PRD requirement id or a PRD edit.
- Help copy for hiding an item, the sign-in and sign-up pages, and the hab-unit setup page. The ten confirmed topics do not name them.
- A component test harness, a new npm dependency, or a Playwright test suite in the repo. Capture runs from the parent session. No capture script is committed.
- Changing the `src/app/layout.tsx` metadata description.
- A help link anywhere except the header.
- The uncommitted `AGENTS.md`, `package.json`, and `pnpm-lock.yaml` edits in the working tree.
- A roadmap status change. S-15 moves from `proposed` when the pull request merges.

## Implementation Approach

Four phases, ordered by dependency. Phase 1 is a self-contained copy change. Phase 2 builds the help route before anything links to it, driven by one data module (`help-topics.ts`) so the ten topics, their order, and their wording are testable. Phase 3 adds the header control once its target exists. Phase 4 captures the screenshots from the finished app and wires them into the data module, so the screenshots show the final header with `[ ? ]`.

The header control reuses `Button variant="outline"` with `render={<Link />}`, the pattern in `src/app/page.tsx:38-45`, so it matches Sign out in height and style. The help page reuses `pageShell`, `contentWidth`, `pageTitle`, `sectionHeading`, `sectionCopy`, and `textLink` from `src/app/styles/class-names.ts`.

## Critical Implementation Details

**Screenshots are dark mode by color-scheme emulation only.** `globals.css:35` gates every dark token behind `@media (prefers-color-scheme: dark)`. Set the capture page to `colorScheme: 'dark'` with `browser_emulate_media`, then confirm `window.matchMedia('(prefers-color-scheme: dark)').matches` is `true` and `getComputedStyle(document.body).backgroundColor` is the dark background before the first shot. Do not edit CSS, add a class, or add a switch. If the check fails, stop. Do not capture light images.

**Reduced motion for every capture.** Also emulate `reducedMotion: 'reduce'`. Without it, the header label is mid-typing (`animate-terminal-type`, 1.2s) and notices are mid-slide. `globals.css:258-262` and the `motion-safe:` variants make reduced motion render the final state.

**Fixed capture geometry.** Viewport 390 by 844. The same device scale for all 13 files (1 or 2). Viewport-sized shots for screens that scroll inside themselves (`/inventory`, `/inventory/restock`, scan, lookup). Full-page shots only for pages that scroll as a document (`/inventory/new`, `/inventory/new?barcode=...`, `/hab-unit/share`, item details).

**The seed hab unit must be a test hab unit.** The capture signs in as `TEST_EMAIL`. Before writing anything, open `/inventory` as that user. If it lists any item not named in the seed table below, stop and tell the parent. An empty tally is fine. If the user has no hab unit yet, create one with the prefilled name on `/hab-unit/new`. Never print, log, or commit `TEST_EMAIL`, `TEST_PASSWORD`, or an access token, and make sure no screenshot shows an email address.

**Seed barcodes are in-store GS1 codes (`200…`).** They are valid under `validateBarcode` (`src/lib/items/validate-barcode.ts:41-45`) and are not real products, so seeding does not put fictional names against a real barcode in the shared catalog. `2000000000008` is reserved as the unregistered barcode. Never create an item for it.

| Item | Barcode | Category | Count | Minimum | State |
| --- | --- | --- | --- | --- | --- |
| Basmati rice | `2000000000015` | Food | 9 | 3 | IN STOCK |
| Olive oil | `2000000000022` | Food | 4 | 3 | WARNING |
| Plain flour | `2000000000039` | Food | 2 | 3 | CRITICAL, 1 short |
| Rice noodles | `2000000000046` | Food | 1 | 3 | CRITICAL, 2 short |
| Cinnamon | none (added by name) | Food | 5 | 3 | WARNING |
| Cat pouches | `2000000000053` | Pet food | 1 | 4 | CRITICAL, 3 short |
| Dog biscuits | `2000000000060` | Pet food | 8 | 3 | IN STOCK |
| Shampoo | `2000000000077` | Beauty | 6 | 3 | IN STOCK |
| Dish tabs | `2000000000084` | Other | 5 | 3 | WARNING |

Seed with the bulk insert form (`/tmp/help-seed.json`, outside the repo, eight entries), add Cinnamon by name, then set count, minimum, and category on each item page. New items start at 1 with minimum 3.

## Phase 1: Signed-out landing copy

### Overview

The landing page says what the app does and loses the deployment lead, the Inventory section, and the Platform section.

### Changes Required

#### 1. Landing page

**File:** `src/app/page.tsx`

**Intent:** Replace the stale lead and the two placeholder sections with the product statement the roadmap asks for. Keep everything else on the page.

**Contract:**

- The `h1` text "Know what is at home before you shop." stays.
- The lead paragraph (`:32-36`, class `pageLead`) renders exactly: "Noospheric Tally records stock when an item is handled and shows what needs restocking." The sentence is one text node on one JSX paragraph. The sentence is the planner's wording of the confirmed scope. It is an assumption, named in the brief.
- The grid `div` (`:64-88`) with the Inventory and Platform sections is deleted whole. Nothing replaces it.
- The Sign in and Sign up `Button`s (`:38-55`), the footnote with the "Requisite one" link (`:57-62`), and the signed-in `redirect('/inventory')` (`:21-24`) are unchanged.
- Remove imports that become unused: `clsx` (`:3`), `sectionCopy`, `sectionHeading` (`:12-13`). Do not touch `class-names.ts`.
- No other file changes in this phase.

### Success Criteria

#### Automated Verification

- `pnpm typecheck` exits 0.
- `pnpm lint` exits 0 with no unused import in `src/app/page.tsx`.
- `pnpm test` exits 0.
- `rg -n "deployment foundation|Platform|Inventory|sectionHeading|sectionCopy|clsx" src/app/page.tsx` finds nothing.
- `rg -n "redirect\('/inventory'\)|href=\"/login\"|href=\"/signup\"|Know what is at home" src/app/page.tsx` still lists the redirect, the `/login` link, both `/signup` links, and the title.

#### Manual Verification

- Signed out, `/` shows the title, the new sentence, Sign in, Sign up, and the footnote. It has no Inventory heading, no Platform heading, and no "deployment foundation" text.
- Signed in, `/` redirects to `/inventory`.
- At 390px and 1280px wide, the page has no stray border, no empty gap where the grid was, and no horizontal scroll.

---

## Phase 2: Help page with ten topics

### Overview

`/help` is a public page that lists ten numbered topics in the confirmed order. Text only. Screenshots come in Phase 4.

### Changes Required

#### 1. Help content module

**File:** `src/app/help/help-topics.ts` (new)

**Intent:** Hold the ten topics as data, so order, ids, and the labels the copy quotes can be tested and the page stays markup only.

**Contract:**

- Export `HELP_TOPICS: readonly HelpTopic[]` and `interface HelpTopic { readonly id: string; readonly title: string; readonly paragraphs: readonly string[] }`.
- Exactly ten entries, in this order. Ids are lowercase kebab-case and unique.

| # | `id` | `title` |
| --- | --- | --- |
| 1 | `tally-list` | The tally list |
| 2 | `search-sort-categories` | Search, sort, and categories |
| 3 | `add-items` | Add items below the tally |
| 4 | `unknown-barcode-and-attach` | Items missing from the database, and extra barcodes |
| 5 | `scanner` | The scanner |
| 6 | `scan-popups` | Scan popups |
| 7 | `restock` | Restock |
| 8 | `lookup` | Lookup |
| 9 | `item-details` | Item details |
| 10 | `share-hab-unit` | Sharing a hab unit |

- Each topic has one to five non-empty `paragraphs`. A paragraph is plain text, one fact group, in the app's terse voice. No markup, no em dash, and no claim outside the facts below. Quote UI labels exactly as the screens spell them.
- Facts each topic must state (all verified in Current State Analysis):
  1. **Tally list.** The tally lists every item in the hab unit, one row each, as name, dot leader, `[-]`, count, `[+]`. The page heading is `[<hab unit name>] tally`. Items are filed in categories, in this order: Pet food, Food, Beauty, Other, Uncategorized. A category header shows how many items it holds. `[-]` lowers the count by 1 and `[+]` raises it by 1. A change saves at once. `[-]` is disabled at 0 and `[+]` at 99. Row color shows the state: green for IN STOCK, yellow for WARNING, red for CRITICAL. Tapping a name opens its details. A category that holds a WARNING or CRITICAL item takes that color and opens by itself. The other categories stay closed until tapped.
  2. **Search, sort, and categories.** `Search by name` filters rows by part of the name, ignoring case, and opens the categories that match. If nothing matches the page says so. Two sort buttons sort by name (A to Z, then Z to A on a second press) and by count (low to high, then high to low). Items at 0 always sit last. The layers button, labelled `Group by category`, switches between category panels and one flat list. It is disabled while a count change is saving. The search field appears once the hab unit holds an item.
  3. **Add items below the tally.** Buttons under the tally: `Add item`, `Scan item`, `Restock`, `Lookup`, and the link `Share hab unit`. `Scan item`, `Restock`, `Lookup`, and sharing have their own topics. `Add item` opens `Item data creation` with three ways: (a) type the digits in `Barcode` and press `Apply`, 8 to 14 digits with a valid check digit; (b) `Or add an item without a barcode`, then `Item name` and `Add without barcode`, for spices and loose goods, a name of 1 to 120 characters; (c) `Or add many items from a JSON file`, then `JSON file` and `Add items from file`. The file is a JSON array of objects with a `name` and a `barcode`, at most 500 items and 256KB, barcodes valid and not repeated. If one entry is wrong, the message names that entry and nothing is added. A barcode that is already in the hab unit shows `Already stocked`. A barcode known from another hab unit shows `Add to hab-unit` with the saved name and `Apply`. A new item starts at a count of 1 and a minimum of 3.
  4. **Items missing from the database, and extra barcodes.** A barcode the app has never seen opens `Item data creation` for that barcode, with the message `The item was not found in our database.` The name is prefilled when a public catalog (Open Food, Beauty, Pet Food, or Products Facts) knows the barcode. When none does, the page adds `Enter the item name manually.` Type or fix `Item name` and press `Apply`. `Attach to existing item` opens a `Filter` and the `Item designation` list. Pick the item, press `Attach`, and the new barcode joins that item, so both barcodes find it. The section shows only when the hab unit has at least one item.
  5. **The scanner.** `Scan item` opens the camera with a frame. Two round buttons sit over it: `consume`, the default, and `tally`. The selected one is filled and named in brackets above the buttons, for example `[consume]`. `consume` lowers the count of the scanned item by 1. `tally` raises it by 1. The choice is kept for the browser session. A barcode the hab unit does not hold opens `Item data creation`. If the camera cannot start, the screen says so and shows a `Barcode` field: type the digits and press `Apply`. Below the camera the scans of this session are listed with `+1` or `-1`, and `Undo` reverses one line.
  6. **Scan popups.** After a scan a notice slides in at the top and leaves after about 5 seconds. A WARNING or CRITICAL item shows its label in brackets and its color. An IN STOCK item shows no label. The notice shows the item name, a `Count` line with the new count, and one sentence: `Item <name> <barcode> was added to inventory.` after `tally`, `Item <name> <barcode> was removed from inventory.` after `consume`, or `Item <name> <barcode> is already at 0.` after `consume` on a count of 0, which stays 0.
  7. **Restock.** `Restock` lists only CRITICAL items, grouped by category. An item is CRITICAL when its count is at or below its minimum. WARNING is a count below twice the minimum, and IN STOCK is everything above. The default minimum is 3. Each row reads `<name> ... <count> // [<n> short]`, where `<n>` is the minimum minus the count. A count equal to the minimum reads `[0 short]`. Inside a category the largest shortfall comes first. The page says `Nothing needs restocking.` when no item is CRITICAL.
  8. **Lookup.** `Lookup` opens the same camera, with the same manual `Barcode` field. It changes no count. If the hab unit holds the item, the notice shows its label in brackets (IN STOCK, WARNING, or CRITICAL), its name, and its count. Otherwise it says `Not in your hab unit.` Use it in a shop to check whether the item is already at home.
  9. **Item details.** Tap an item name on the tally. The heading shows the state label and the name. The barcode shows beside the name on a wide screen and opens with a tap on the name on a phone. Rows: `Count` (0 to 99), `Minimum` (0 to 999), `Category` (Pet food, Food, Beauty, Other, Uncategorized), and `Use`. `Use` is shown for information only. It counts `consume` scans in the last 7 days, as `<n> per week`, or `No use recorded`. Count, Minimum, and Category change with `[-]`, `[+]`, and the category list. Changes turn yellow gold and apply only on `Save`. `Cancel` drops them and returns to the tally. The state label follows the count and minimum as they change.
  10. **Sharing a hab unit.** `Share hab unit` opens a page with `Generate invite code`. It shows `Invite code`, `Invite link`, and the expiry date. A code works once, expires in 7 days, and replaces any earlier unused code. Send the code or the link to the other person. After they sign up, they enter the code in `Join hab unit` on the hab-unit setup page, or open the link. They then see the same tally. A person who already has a hab unit is refused, and their hab unit stays as it was.
- Implementer rule: copy a label only after reading its component. Where this plan and a component disagree, the component wins and the plan is wrong. Report it to the parent.
- Read `getExistingBarcodeMessage` in `src/app/inventory/actions.ts:214` before writing about a bulk barcode that already exists. Quote only what it says.

#### 2. Help page

**File:** `src/app/help/page.tsx` (new)

**Intent:** Render the ten topics as a readable page that works signed out and signed in.

**Contract:**

- Default-exported server component. No `'use client'`. No `loadCurrentUser`, no `requireCurrentUser`, no redirect.
- `export const metadata = { title: '// Help //' }`.
- Markup: `<main className={pageShell}>` with `<div className={contentWidth}>`. An `h1` `pageTitle` with the text `Help`. Then `HELP_TOPICS.map` to one `<section id={topic.id}>` per topic with an `h2` in `sectionHeading` reading `{index + 1}. {title}` and one `<p className={sectionCopy}>` per paragraph. Sections are spaced with `mt-10`. Keys are the topic ids.
- A closing `<p className={footnote}>` with `<Link href="/" className={textLink}>Back</Link>`. `/` sends a signed-in user to `/inventory` and a signed-out visitor to the landing page, so one link serves both.
- No screenshot markup yet.

#### 3. Public-route test

**File:** `src/lib/auth/isProtectedPath.test.ts`

**Intent:** Pin that `/help` stays public.

**Contract:** In the existing `returns false for public routes and lookalike paths` test, add `expect(isProtectedPath('/help')).toEqual(false)` and `expect(isProtectedPath('/help/')).toEqual(false)`. Do not edit `isProtectedPath.ts`.

#### 4. Content test

**File:** `src/app/help/help-topics.test.ts` (new)

**Intent:** Pin the topic order and the labels that readers act on.

**Contract:** Vitest, `node` environment, behavior-named tests, `toEqual` assertions. Cover:

- returns the ten topic ids in the confirmed order;
- returns unique, lowercase kebab-case ids;
- returns a non-empty title and at least one non-empty paragraph for every topic;
- names `consume` and `tally` in the scanner topic;
- names `[0 short]`, `CRITICAL`, and `minimum` in the restock topic;
- names `Not in your hab unit.` in the lookup topic;
- names `Generate invite code` and `7 days` in the sharing topic;
- names `Count`, `Minimum`, `Category`, and `Use` in the item details topic.

A label check joins a topic's paragraphs and asserts `includes(label)` with `toEqual(true)`.

### Success Criteria

#### Automated Verification

- `pnpm typecheck` exits 0.
- `pnpm lint` exits 0.
- `pnpm test` exits 0, including `src/app/help/help-topics.test.ts` and the two new `/help` assertions in `src/lib/auth/isProtectedPath.test.ts`.
- `rg -n "help" src/lib/auth/isProtectedPath.ts` finds nothing.
- `rg -n "use client" src/app/help` finds nothing.
- `rg -c "<section" src/app/help/page.tsx` reports one `<section` in the file (the map), and `HELP_TOPICS` has ten entries by the test.

#### Manual Verification

- Signed out, `/help` opens with status 200 and no redirect to `/login`. Signed in, `/help` opens the same page.
- The page shows ten numbered headings in the confirmed order, each with its text.
- Spot-check labels against the live app: `Search by name`, `Add item`, `Item data creation`, `Apply`, `consume`, `tally`, `[<n> short]`, `Not in your hab unit.`, `Count`, `Minimum`, `Category`, `Use`, `Generate invite code`. Each appears on the screen the topic describes.
- `Back` returns signed-out visitors to the landing page and signed-in members to `/inventory`.
- At 320px, 390px, and 1280px wide, `/help` has no horizontal scroll and no overlapping text.

---

## Phase 3: `[ ? ]` header control

### Overview

The header gets a `[ ? ]` control that opens `/help`. Signed out it is the only control, on the right. Signed in it sits immediately right of Sign out.

### Changes Required

#### 1. Help link

**File:** `src/components/help-link.tsx` (new)

**Intent:** One small component for the control, so the header holds only placement.

**Contract:**

- Exports `HelpLink`. A server component, no `'use client'`.
- Renders `Button` with `variant="outline"`, `nativeButton={false}`, `render={<Link href="/help" />}`, and `aria-label="Help"`. The visible text is `[ ? ]` (open bracket, space, question mark, space, close bracket) as one text node.
- Default button size, so the height is `h-8`, the same as Sign out. No `size` prop, no custom height.

#### 2. Header placement

**File:** `src/components/header.tsx`

**Intent:** Put the control on the right, and right of Sign out when signed in.

**Contract:**

- Replace the bare `{user !== null ? <SignOutButton /> : null}` (`:27`) with a right-hand group: a `div` with `flex items-center gap-2` that holds `{user !== null ? <SignOutButton /> : null}` followed by `<HelpLink />`. DOM order is Sign out, then `[ ? ]`, so tab order and visual order agree.
- `justify-between` on the `header` stays, so the group is the right-hand item and `[ ? ]` is its last child. Signed out, the group holds only `<HelpLink />`.
- The group is `shrink-0` so the controls are never squeezed or clipped.
- Header height stays 66px signed in (`py-4`, an `h-8` control, a 2px border), so `src/app/inventory/page.tsx:20-26` needs no change. Signed out, the header grows by the control's `h-8` and that is accepted.
- **Narrow widths.** Measure the signed-in header at 320px, 360px, and 390px with `getBoundingClientRect` before changing anything else. The header must stay on one line with no document horizontal scroll, and both controls fully visible. If it does not fit, apply only these, in order, stopping when it fits: (1) `px-2` on `[ ? ]`, which stays within `HelpLink`; (2) `max-sm:tracking-[0.08em]` on the `<p>` in `src/components/tally-label.tsx:9-20`; (3) `min-w-0` on the `Link` in `tally-label.tsx` so the already clipped app name shrinks instead of pushing the controls. Do not wrap the header, hide `[ ? ]`, or change `px-6 sm:px-10`. Report which step was needed.
- `SignOutButton`, `TallyLabel` (apart from the fallback above), `layout.tsx`, and every page stay as they are.

### Success Criteria

#### Automated Verification

- `pnpm typecheck` exits 0.
- `pnpm lint` exits 0.
- `pnpm test` exits 0.
- `rg -n "href=\"/help\"" src` matches only `src/components/help-link.tsx`.
- `rg -n "HelpLink" src/components/header.tsx` matches the import and one render, and `rg -n "use client" src/components/help-link.tsx` finds nothing.

#### Manual Verification

- Signed out, on `/`, `/login`, and `/help`, the header shows the app name and `[ ? ]` only. There is no Sign out. `[ ? ]` ends at the same x as the header content edge (the viewport width minus 24px below 640px, minus 40px from 640px).
- Signed in, on `/inventory`, the header shows the app name, Sign out, then `[ ? ]`. The `browser_evaluate` read of `header a, header button` text, in DOM order, is the app name link, `Sign out`, `[ ? ]`. The horizontal gap between Sign out and `[ ? ]` is 8px, and `[ ? ]` is the rightmost control.
- Clicking `[ ? ]` opens `/help` in both states.
- At 320px, 360px, 390px, and 1280px wide, signed in and signed out, the header is one line, `document.documentElement.scrollWidth` does not exceed `innerWidth`, and both controls are fully visible. Both controls measure 32px tall.
- The signed-in header measures 66px tall, and `/inventory` still keeps its action buttons on screen on an 844px-tall viewport.
- Tab order on the header goes app name, Sign out, `[ ? ]`, and `[ ? ]` shows the focus ring.

---

## Phase 4: Dark-mode screenshots on the help page

### Overview

Thirteen dark-mode screenshots of the real app are captured, stored in `public/help/`, and shown under the topics they illustrate.

### Changes Required

#### 1. Capture and store the screenshots

**Files:** the thirteen files below in `public/help/` (new, binary). No script is committed.

**Intent:** Real pictures of the finished app, dark mode, from a seeded test hab unit.

**Contract:**

- **Run the app without the dev badge.** Prefer `pnpm build` then `pnpm start` on port 3000. If the build cannot run, use `pnpm dev` and confirm the Next.js dev badge is not in the frame.
- **Drive it with the Playwright MCP.** `browser_resize` to 390 by 844. `browser_emulate_media` with `colorScheme: 'dark'` and `reducedMotion: 'reduce'`. Verify with `browser_evaluate` as in Critical Implementation Details. `browser_take_screenshot` with a `filename`. Move the output into `public/help/`. Keep the device scale the same for all thirteen files.
- **Sign in** at `/login` as `TEST_EMAIL`, from `.env`, without echoing the values. Run the seed gate and seed table from Critical Implementation Details.
- **No camera.** The headless browser has no camera, so `/inventory/scan` and `/inventory/lookup` open their manual-entry state with the `Barcode` field and the message about the camera. That is a real state of the screen and shows both direction buttons. Do not mock `getUserMedia` and do not change `barcode-scanner.tsx`. Topics 5 and 8 describe the camera view and this fallback in words.
- **Capture table.** One file per row. Names, order, and topic mapping are fixed.

| File | Topic | Screen and state |
| --- | --- | --- |
| `help-01-tally.png` | 1 | `/inventory` as seeded. Pet food, Food, and Other open. Beauty and Uncategorized closed. The four action buttons and the share link visible. |
| `help-02-search-sort.png` | 2 | `/inventory` with `rice` typed in `Search by name`, `Group by category` toggled off, and the count sort pressed once. Two rows, Rice noodles then Basmati rice. |
| `help-03-add-item.png` | 3 | `/inventory/new`, full page, with both `Or add an item without a barcode` and `Or add many items from a JSON file` expanded. |
| `help-04-unknown-barcode.png` | 4 | `/inventory/new?barcode=2000000000008`, full page. The `not found in our database` notice, `Enter the item name manually.`, the `Item name` field, and the collapsed `Attach to existing item`. |
| `help-04-attach-existing.png` | 4 | The same page with `Attach to existing item` open and `Basmati rice` selected. Do not press `Attach`. |
| `help-05-scanner.png` | 5 | `/inventory/scan` with `consume` selected and `[consume]` shown above the buttons. |
| `help-06-popup-tally.png` | 6 | Scan state with `tally` selected. Type `2000000000039` in `Barcode`, press `Apply`, and capture within 5 seconds. Notice shows `[CRITICAL]`, Plain flour, `Count` 3, and the `was added to inventory.` sentence. |
| `help-06-popup-consume.png` | 6 | Select `consume`, enter `2000000000039`, press `Apply`, and capture within 5 seconds. Notice shows `[CRITICAL]`, Plain flour, `Count` 2, and the `was removed from inventory.` sentence. This returns the count to 2. |
| `help-07-restock.png` | 7 | `/inventory/restock`. Cat pouches, Rice noodles, and Plain flour with `[3 short]`, `[2 short]`, and `[1 short]`. |
| `help-08-lookup-found.png` | 8 | `/inventory/lookup?barcode=2000000000022`. Olive oil, `[WARNING]`, `Count` 4. |
| `help-08-lookup-missing.png` | 8 | `/inventory/lookup?barcode=2000000000008`. `Not in your hab unit.` |
| `help-09-item-details.png` | 9 | `/inventory/<Plain flour id>`, after the two scans above. `[CRITICAL]`, Count 2, Minimum 3, Category `[Food]`, and `Use` reading `1 per week`. |
| `help-10-share.png` | 10 | `/hab-unit/share` after pressing `Generate invite code`. Capture, then press `Generate invite code` once more so the code in the image is dead. |

- **Order of capture.** Seed, 01, 02, 03, 04, 05, then the two scans (06 tally then 06 consume), 07, 08, 09, 10. Scans change real data, so only that order keeps the images consistent with the seed table.
- **Cleanup.** After the last shot, hide each seeded item from its details page (`Hide from tally`, confirm). Delete `/tmp/help-seed.json`. Stop the server.
- **Clean frames.** The header label must read in full (`NOOSPHERIC TALLY`) in every image. No frame shows an email address, a token, or a stack trace. The sign-in session, `localhost` origin in the invite link, and the seeded names are the only account-specific content, and the invite code is dead before the phase ends.

#### 2. Screenshot data and rendering

**Files:** `src/app/help/help-topics.ts`, `src/app/help/help-screenshot.tsx` (new), `src/app/help/page.tsx`

**Intent:** Show each screenshot under the topic it illustrates.

**Contract:**

- In `help-topics.ts` add `interface HelpScreenshotImage { readonly fileName: string; readonly alt: string; readonly width: number; readonly height: number }` and add `readonly screenshots: readonly HelpScreenshotImage[]` to `HelpTopic`. Every topic sets it.
- `width` and `height` are the PNG's real pixel size. `alt` states what the picture shows in one sentence and says it is the dark-mode app, for example "Tally list in dark mode with Food and Pet food open." No `alt` is empty.
- Mapping (topic, then files in this order): 1 gets `help-01-tally.png`. 2 gets `help-02-search-sort.png`. 3 gets `help-03-add-item.png`. 4 gets `help-04-unknown-barcode.png` and `help-04-attach-existing.png`. 5 gets `help-05-scanner.png`. 6 gets `help-06-popup-tally.png` and `help-06-popup-consume.png`. 7 gets `help-07-restock.png`. 8 gets `help-08-lookup-found.png` and `help-08-lookup-missing.png`. 9 gets `help-09-item-details.png`. 10 gets `help-10-share.png`.
- `help-screenshot.tsx` exports `HelpScreenshot`, a server component whose props are `{ readonly image: HelpScreenshotImage }`. It renders a `figure` holding `next/image` with `src={`/help/${image.fileName}`}`, `width`, `height`, `alt`, `unoptimized`, and classes `h-auto w-full max-w-sm border border-border`. `unoptimized` keeps the page independent of `/_next/image`, which the middleware matcher excludes. The images are small fixed files, so optimization buys nothing.
- In `page.tsx`, render a topic's screenshots after its paragraphs, in array order, in a `div` with `mt-4 flex flex-col gap-4`.
- The page copy and the order of topics from Phase 2 do not change.

#### 3. Screenshot test

**File:** `src/app/help/help-topics.test.ts`

**Intent:** Fail the build when a screenshot is missing, renamed, or a different size than the data says.

**Contract:** Add tests, using `node:fs` and a small local reader of the PNG header (signature `89 50 4E 47 0D 0A 1A 0A`, width at byte 16, height at byte 20, both big-endian):

- maps each topic to the exact file names in the Phase 4 mapping;
- finds every referenced file in `public/help/` and no unreferenced `help-*.png` there;
- reads a valid PNG signature for every file;
- matches the declared `width` and `height` to the PNG header for every file;
- uses one pixel width for all thirteen files;
- gives every file a name matching `/^help-\d{2}-[a-z-]+\.png$/` whose number equals its topic number;
- gives every screenshot a non-empty `alt`.

### Success Criteria

#### Automated Verification

- `pnpm typecheck` exits 0.
- `pnpm lint` exits 0.
- `pnpm test` exits 0, including the screenshot tests.
- `ls public/help` lists exactly the thirteen file names in the capture table.
- `magick identify -format '%f %w %h %[fx:mean]\n' public/help/*.png` prints one width for all thirteen files and a mean brightness below 0.4 for each. The dark background is about 0.1 and the light one about 0.95.
- Each file is under 400 KB (`ls -l public/help`).
- `git status --short` lists only the files this plan names, `context/changes/landing-and-help/`, and the uncommitted edits that existed before the change.

#### Manual Verification

- Before the first shot, `matchMedia('(prefers-color-scheme: dark)').matches` was `true` and the body background was the dark background. No CSS, class, or switcher was added to get dark.
- The seed gate ran first: the test hab unit held no item outside the seed table.
- Each image is open and checked against its row in the capture table, and shows that screen and state in dark colors, with the full header label and `[ ? ]` in the header.
- No image shows an email address, a password, a token, or the Next.js dev badge.
- The invite code in `help-10-share.png` no longer works after the second `Generate invite code` press.
- Seeded items are hidden afterwards, `/tmp/help-seed.json` is gone, and the server is stopped.
- On `/help` at 390px and 1280px wide, the thirteen images sit under topics 1 to 10 as mapped, are sharp, stay within the content width, and do not overlap text. The images stay dark when the browser color scheme is light.

---

## Testing Strategy

### Unit Tests

- `src/app/help/help-topics.test.ts`: ten topics in order, unique ids, non-empty copy, labels that readers act on, screenshot mapping, PNG signature and size, one width, name pattern, non-empty alt.
- `src/lib/auth/isProtectedPath.test.ts`: `/help` and `/help/` are public.
- No component test. The harness is `node`-only and none is added. Header placement and the page markup are checked by source greps and manual steps.

### Integration Tests

- None. No data flow, action, route handler, or migration changes. The capture writes data through the existing forms and is verification, not a test.

### Manual Testing Steps

1. Run `pnpm build` then `pnpm start`. Open `/` signed out and read the title, the sentence, and the two buttons.
2. Check the header on `/`, `/login`, and `/help`: app name left, `[ ? ]` right, no Sign out.
3. Sign in as the test user. Check the header on `/inventory`: Sign out, then `[ ? ]`, as the rightmost control. Click `[ ? ]`.
4. Read the ten topics against the live screens. Resize to 320px, 390px, and 1280px.
5. Confirm the thirteen images, in light and in dark browser color scheme.
6. Open `/` signed in and confirm the redirect to `/inventory`.

## Migration and Rollback

No migration and no data model change. Rollback is a revert of the four phase commits. The capture leaves the seeded items hidden, the invite code dead, and no repo file outside the thirteen PNGs.

## References

- Roadmap: `context/foundation/roadmap.md` (S-15, `At a glance`, `### S-15`, Backlog Handoff)
- PRD: `context/foundation/prd.md` (none referenced. The roadmap marks S-15 `none (?)`.)
- Linear: TEC-64, https://linear.app/tech-heresy/issue/TEC-64/s-15landing-and-help-feat-explain-the-product-and-add-help
- Landing page: `src/app/page.tsx:20-24`, `:29-36`, `:38-62`, `:64-88`
- Header: `src/components/header.tsx:5-30`, `src/components/sign-out-button.tsx:8-15`, `src/components/tally-label.tsx:7-30`, `src/app/layout.tsx:36-52`
- Button sizes and variants: `src/components/ui/button.tsx:44-55`, `:82-88`
- Header height assumption: `src/app/inventory/page.tsx:15-26`
- Public routes and middleware: `src/lib/auth/isProtectedPath.ts:1-10`, `src/middleware.ts:76-80`
- Dark mode: `src/app/styles/globals.css:1-57`, `:258-262`, `src/app/styles/theme-tokens.test.ts:121-128`
- Class constants: `src/app/styles/class-names.ts:1-60`, `:152-158`
- Topic sources: see Current State Analysis, "Screens the help page explains"
- Barcode validation: `src/lib/items/validate-barcode.ts:41-45`
- Prior plan format and neighbours: `context/changes/align-tally-controls/plan.md`, `context/changes/rename-household-landing/plan.md`, `context/changes/share-hab-unit/change.md`
- Next.js image docs read for this plan: `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` (`unoptimized`, `width`, `height`)

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Signed-out landing copy

#### Automated

- [ ] 1.1 `pnpm typecheck` exits 0.
- [ ] 1.2 `pnpm lint` exits 0 with no unused import in `src/app/page.tsx`.
- [ ] 1.3 `pnpm test` exits 0.
- [ ] 1.4 `rg -n "deployment foundation|Platform|Inventory|sectionHeading|sectionCopy|clsx" src/app/page.tsx` finds nothing.
- [ ] 1.5 `rg -n "redirect\('/inventory'\)|href=\"/login\"|href=\"/signup\"|Know what is at home" src/app/page.tsx` still lists the redirect, the `/login` link, both `/signup` links, and the title.

#### Manual

- [ ] 1.6 Signed out, `/` shows the title, the new sentence, Sign in, Sign up, and the footnote, with no Inventory heading, no Platform heading, and no "deployment foundation" text.
- [ ] 1.7 Signed in, `/` redirects to `/inventory`.
- [ ] 1.8 At 390px and 1280px wide, the page has no stray border, no empty gap where the grid was, and no horizontal scroll.

### Phase 2: Help page with ten topics

#### Automated

- [ ] 2.1 `pnpm typecheck` exits 0.
- [ ] 2.2 `pnpm lint` exits 0.
- [ ] 2.3 `pnpm test` exits 0, including `src/app/help/help-topics.test.ts` and the two new `/help` assertions in `src/lib/auth/isProtectedPath.test.ts`.
- [ ] 2.4 `rg -n "help" src/lib/auth/isProtectedPath.ts` finds nothing.
- [ ] 2.5 `rg -n "use client" src/app/help` finds nothing.
- [ ] 2.6 `rg -c "<section" src/app/help/page.tsx` reports one `<section` in the file, and `HELP_TOPICS` has ten entries by the test.

#### Manual

- [ ] 2.7 Signed out, `/help` opens with status 200 and no redirect to `/login`. Signed in, `/help` opens the same page.
- [ ] 2.8 The page shows ten numbered headings in the confirmed order, each with its text.
- [ ] 2.9 Quoted labels match the live app: `Search by name`, `Add item`, `Item data creation`, `Apply`, `consume`, `tally`, `[<n> short]`, `Not in your hab unit.`, `Count`, `Minimum`, `Category`, `Use`, `Generate invite code`.
- [ ] 2.10 `Back` returns signed-out visitors to the landing page and signed-in members to `/inventory`.
- [ ] 2.11 At 320px, 390px, and 1280px wide, `/help` has no horizontal scroll and no overlapping text.

### Phase 3: `[ ? ]` header control

#### Automated

- [ ] 3.1 `pnpm typecheck` exits 0.
- [ ] 3.2 `pnpm lint` exits 0.
- [ ] 3.3 `pnpm test` exits 0.
- [ ] 3.4 `rg -n "href=\"/help\"" src` matches only `src/components/help-link.tsx`.
- [ ] 3.5 `rg -n "HelpLink" src/components/header.tsx` matches the import and one render, and `rg -n "use client" src/components/help-link.tsx` finds nothing.

#### Manual

- [ ] 3.6 Signed out, on `/`, `/login`, and `/help`, the header shows the app name and `[ ? ]` only, with no Sign out, and `[ ? ]` ends at the header content edge.
- [ ] 3.7 Signed in, on `/inventory`, the header order in the DOM is the app name link, `Sign out`, `[ ? ]`. The gap between Sign out and `[ ? ]` is 8px and `[ ? ]` is the rightmost control.
- [ ] 3.8 Clicking `[ ? ]` opens `/help` signed out and signed in.
- [ ] 3.9 At 320px, 360px, 390px, and 1280px wide, signed in and signed out, the header is one line, has no document horizontal scroll, shows both controls in full, and both controls are 32px tall.
- [ ] 3.10 The signed-in header measures 66px tall, and `/inventory` still keeps its action buttons on screen on an 844px-tall viewport.
- [ ] 3.11 Tab order on the header goes app name, Sign out, `[ ? ]`, and `[ ? ]` shows the focus ring.

### Phase 4: Dark-mode screenshots on the help page

#### Automated

- [ ] 4.1 `pnpm typecheck` exits 0.
- [ ] 4.2 `pnpm lint` exits 0.
- [ ] 4.3 `pnpm test` exits 0, including the screenshot tests.
- [ ] 4.4 `ls public/help` lists exactly the thirteen file names in the capture table.
- [ ] 4.5 `magick identify -format '%f %w %h %[fx:mean]\n' public/help/*.png` prints one width for all thirteen files and a mean brightness below 0.4 for each.
- [ ] 4.6 Each file in `public/help` is under 400 KB.
- [ ] 4.7 `git status --short` lists only the files this plan names, `context/changes/landing-and-help/`, and the uncommitted edits that existed before the change.

#### Manual

- [ ] 4.8 Before the first shot, `matchMedia('(prefers-color-scheme: dark)').matches` was `true` and the body background was the dark background, with no CSS, class, or switcher added.
- [ ] 4.9 The seed gate ran first, and the test hab unit held no item outside the seed table.
- [ ] 4.10 Each image matches its row in the capture table, shows dark colors, and shows the full header label and `[ ? ]`.
- [ ] 4.11 No image shows an email address, a password, a token, or the Next.js dev badge.
- [ ] 4.12 The invite code in `help-10-share.png` no longer works after the second `Generate invite code` press.
- [ ] 4.13 Seeded items are hidden, `/tmp/help-seed.json` is gone, and the server is stopped.
- [ ] 4.14 On `/help` at 390px and 1280px wide, the thirteen images sit under topics 1 to 10 as mapped, stay within the content width, and do not overlap text, and they stay dark when the browser color scheme is light.
