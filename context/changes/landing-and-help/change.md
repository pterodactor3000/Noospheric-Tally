---
change_id: landing-and-help
title: Landing page and help
status: planned
created: 2026-11-02
updated: 2026-11-02
archived_at: null
---

## Notes

Roadmap S-15 (`context/foundation/roadmap.md`). Linear TEC-64, team Tech Heresy, project Noospheric Tally, https://linear.app/tech-heresy/issue/TEC-64/s-15landing-and-help-feat-explain-the-product-and-add-help. PRD refs: none. The roadmap marks them `none (?)`, and no FR is invented. Artifacts: `plan.md`, `plan-brief.md`.

Branch: `feature/s-15-landing-and-help`.

Outcome: the signed-out landing page says the app records stock when an item is handled and shows what needs restocking. A `[ ? ]` control in the header opens a help page with ten topics and dark-mode screenshots of the real UI.

Confirmed product decisions from 2026-11-02:

- Signed-out landing page: remove the deployment-foundation lead, the Inventory section, and the Platform section. Keep the title, Sign in, Sign up, and the signed-in redirect to `/inventory`.
- Header: signed out, no Sign out and `[ ? ]` on the right. Signed in, `[ ? ]` sits immediately right of Sign out.
- Help page topics, in order: tally list, search and sort and categories, action buttons below the tally, unknown barcode and attach, scanner with `consume` and `tally`, scan popups, restock, lookup, item details, sharing a hab unit.
- Screenshots are dark-mode pictures of the real app.

Plan-time decisions (made from the codebase, no user question asked):

- The app has no dark theme switch. Dark mode is the `prefers-color-scheme: dark` media query in `src/app/styles/globals.css`. Screenshots use browser color-scheme emulation. No class, switcher, or CSS change is added.
- Help route is `/help`. It is public and stays out of `PROTECTED_PATH_PREFIXES`.
- Screenshots live in `public/help/` as 13 PNG files and render through `next/image` with `unoptimized`.
- Complexity is Medium: four phases, one new route, one header change, and a capture procedure that writes to a Supabase project.

Out of scope: unrelated visual redesign, help copy for hiding an item, the sign-in and sign-up pages, and the hab-unit setup page, and any new theme switcher.

The roadmap handoff lists S-15 as not ready for planning. The user confirmed the scope and ordered implementation on 2026-11-02, so the plan proceeds. Roadmap status stays `proposed` until the pull request merges.
