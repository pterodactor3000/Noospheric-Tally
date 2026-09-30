---
date: 2026-09-13T09:52:16Z
researcher: pterodactor3000
git_commit: b40e32bfddadd43578cccffd029ba5dc059b3b4a
branch: feature/S-01-sign-in
repository: pterodactor3000/Noospheric-Tally
topic: "What exists today for S-02 (scan-to-create-item): scan an unknown barcode and record it as a named item, with catalog prefills when found and typed names when not (FR-002, FR-005, FR-016)?"
tags: [research, codebase, scan, barcode, s-02]
status: complete
last_updated: 2026-09-13
last_updated_by: pterodactor3000
---

# Research: S-02 scan to create item

## Research Question

What exists today for S-02 (`scan-to-create-item`): scan an unknown barcode and record it as a named item, with catalog prefills when found and typed names when not (FR-002, FR-005, FR-016)?

## Summary

S-02 is **greenfield on top of a finished S-01 identity boundary**. A signed-in user with a hab-unit lands on `/inventory`, which is a static empty state that names scanning as the next step. There is no camera access, no barcode decoder, no items table, no catalog fetch, and no item server action.

S-01 left reusable patterns: Edge `middleware.ts` on `/inventory` and `/hab-unit`, `loadCurrentUser` / `loadCurrentHabUnit`, server actions with discriminated-union validators and `useActionState` forms, and household writes through a `security definer` RPC with select-only RLS. Product docs already bind FR-002, FR-005, FR-016, and guardrail 3. The catalog vendor is unresolved and does not block a manual-name ship.

`context/changes/household-sign-in/research.md` describes a pre-auth shell. Treat it as historical. Live code after S-01 is the evidence.

## Detailed Findings

### Roadmap and product scope

- S-02 outcome: scan a never-seen barcode, record a named item, prefill from a catalog when found, type the name when not (`context/foundation/roadmap.md:87`).
- PRD refs are FR-002, FR-005, FR-016 (`context/foundation/roadmap.md:31`, `89`). Status is `ready`. Prerequisite is S-01 (`context/foundation/roadmap.md:90`).
- Catalog choice is an unknown. Owner: user. Block: no, because manual naming ships alone (`context/foundation/roadmap.md:93`).
- Camera risk is why this slice exists before S-03 and S-04 reuse the scanner (`context/foundation/roadmap.md:44`, `94`).
- FR-002: camera barcode scan. Poor light and damaged labels accepted. FR-006 name search is later, not this slice (`context/foundation/prd.md:96-98`).
- FR-005: name an unrecognized barcode. Before create, offer existing items so the barcode can attach to one (`context/foundation/prd.md:108-110`).
- FR-016: catalog prefill, editable before save, typed name when lookup is empty (`context/foundation/prd.md:152-154`).
- Guardrail 3: an unrecognized barcode is never a dead end (`context/foundation/prd.md:72`).
- One confirmation per scan is acceptable. Network is required. Offline scan is a non-goal (`context/foundation/prd.md:158-159`).
- FR-003, FR-004, and FR-012 (counts and stocking/using modes) are later slices. S-01 plan excluded them from that work (`context/changes/household-sign-in/plan.md:33`).

### Inventory and item data flow after S-01

- Schema is household identity only: `households` and `household_members` (`supabase/migrations/20260816083017_create_households.sql:2-21`).
- `household_members.user_id` is unique. One account, one household (`supabase/migrations/20260816083017_create_households.sql:20`).
- RLS is on. Policies are SELECT only (`supabase/migrations/20260816083017_create_households.sql:24-46`).
- The only write path is `create_household`, a `security definer` RPC (`supabase/migrations/20260816083017_create_households.sql:49-87`).
- The only table query in `src/` is `households` `id, name` (`src/lib/hab-unit/load-current-hab-unit.ts:11-14`).
- No `items` table, barcode column, catalog table, or generated `Database` types exist in the repo.
- Tech stack still says Postgres will store items and quantity changes. That is intent, not schema (`context/foundation/tech-stack.md:24`).

### Routes, guards, and empty inventory UI

- Signed-in users on `/` go to `/inventory` (`src/app/page.tsx:9-12`).
- `/inventory` requires a user, then a hab-unit, else `/login` or `/hab-unit/new` (`src/app/inventory/page.tsx:8-16`).
- Empty state copy: household name, "Nothing is added here yet.", "Next step", "Scanning barcode." No scan control (`src/app/inventory/page.tsx:29-37`).
- Landing page advertises the S-02 outcome as copy only (`src/app/page.tsx:131-142`).
- Middleware authenticates with `getUser()` and redirects to `/login`. Matcher is `/inventory`, `/inventory/:path*`, `/hab-unit`, `/hab-unit/:path*` (`src/middleware.ts:33-49`). Runtime is `experimental-edge` (`src/middleware.ts:46`).
- Hab-unit existence is a page-level check, not a middleware check.
- No `/scan` route, no nested `/inventory/*` page, no item API route. The only app API route is health.

### UI and server-action patterns

- Mutations live in two `'use server'` modules: `src/app/(auth)/actions.ts` and `src/app/hab-unit/actions.ts`.
- Hab-unit create reads `FormData`, runs `validateHabUnitName`, calls `supabase.rpc('create_household')`, maps failures to `{ status: 'error', message, field? }`, and redirects to `/inventory` (`src/app/hab-unit/actions.ts:20-63`).
- Auth actions use the same error shape and `validateCredentials` (`src/app/(auth)/actions.ts:9-13`).
- Client forms use `useActionState`, `aria-invalid` on the failing field, and `role="alert"` with `aria-live="polite"` (login, signup, hab-unit name form).
- Validators are discriminated unions (`valid` | `invalid`). Tests exist for both (`src/lib/auth/validateCredentials.ts`, `src/lib/hab-unit/validate-hab-unit-name.ts:16-20`).
- `src/lib/supabase/server.ts` is the action and loader client. `src/lib/supabase/browser.ts` is not imported by app pages or components.
- No `src/app/inventory/actions.ts` and no item validation helper.

### Camera, catalog, tests, and Worker constraints

- `package.json` runtime deps are Next.js, React, Supabase, OpenNext, and UI libs. No barcode or camera package (`package.json:24-34`).
- Application source has no `getUserMedia`, `BarcodeDetector`, `<video>` capture, or catalog `fetch`.
- Worker vars are Supabase URL and anon key only (`wrangler.jsonc:52-55`). No catalog API key or URL.
- Compatibility flags include `nodejs_compat` and `global_fetch_strictly_public` (`wrangler.jsonc:10`). A later server-side catalog fetch must use a public URL.
- Tech stack puts catalog lookup in the same Next.js deployable, not a separate API (`context/foundation/tech-stack.md:24`).
- Live HTTPS URL: `https://noospheric-tally.eldritchcode-it.workers.dev` (`README.md:73`). Local `pnpm dev` and `pnpm preview` are HTTP (`README.md:11`, `67`). Camera needs a secure context (`context/foundation/roadmap.md:63`).
- F-01 is archived. Phone HTTPS and 390px rendering were verified (`context/archive/2026-08-06-deployed-https-app-shell/change.md:12-13`).
- Vitest runs in Node on `src/**/*.test.ts` (`vitest.config.mts:14-17`). Four files: env, credentials, hab-unit name, health. No DOM, Playwright, or scan tests.
- No Content-Security-Policy or Permissions-Policy for camera in app config.

### Prerequisite S-01 state

- `household-sign-in` status is `impl_reviewed` (`context/changes/household-sign-in/change.md:4`).
- Roadmap still lists S-01 as `ready` (`context/foundation/roadmap.md:30`). That row is stale relative to the change record.
- S-01 inventory contract already names scanning as the next step without implementing it (`context/changes/household-sign-in/plan.md:396`).
- S-01 RLS contract: later slices must not rely on application filters alone (`context/changes/household-sign-in/plan.md:208-210`).
- S-01 plan required `src/proxy.ts`. Impl review restored Edge `src/middleware.ts` for OpenNext (`context/changes/household-sign-in/reviews/impl-review-phase-5.md`). Live file is `src/middleware.ts`.

## Code References

- `src/app/inventory/page.tsx:8-16`: auth and hab-unit guards before the empty inventory view.
- `src/app/inventory/page.tsx:29-37`: empty-state copy that names scanning. No scan UI.
- `src/middleware.ts:33-49`: Edge session gate for `/inventory` and `/hab-unit` only.
- `src/lib/hab-unit/load-current-hab-unit.ts:11-14`: only household read in application code.
- `src/app/hab-unit/actions.ts:36-63`: RPC mutation pattern later item writes would sit beside.
- `supabase/migrations/20260816083017_create_households.sql:2-46`: household schema and select-only RLS. No items.
- `package.json:24-34`: no camera or barcode dependency.
- `wrangler.jsonc:10`: `global_fetch_strictly_public` for future outbound catalog fetches.
- `README.md:73`: production HTTPS URL for phone camera checks.
- `context/foundation/prd.md:108-110`: offer existing items before creating a new one.
- `context/foundation/prd.md:152-154`: catalog prefill is editable. Manual name remains the fallback.

## Architecture Insights

S-02 adds the first inventory write and the first browser camera use. Household identity is already the owner of later data. Item rows, if added, inherit membership RLS and a household foreign key. The hab-unit RPC is the existing write precedent: validate at the action boundary, mutate through `security definer`, keep table policies select-only unless a new policy is added on purpose.

`/inventory` is the post-auth landing and already mentions scanning. Middleware already covers `/inventory/:path*`. Hab-unit membership is still checked in the page, not in middleware.

Forms that name an entity already exist. The hab-unit name form is the closest "name this thing" pattern. Catalog lookup, if added, is specified as server work in the same Worker. `global_fetch_strictly_public` limits that fetch to public URLs.

Camera verification belongs on the live HTTPS URL. Local HTTP is not a secure context.

## Historical Context

- `context/foundation/prd.md`: FR-002, FR-005, FR-016, guardrail 3, and the catalog-edit fallback.
- `context/foundation/roadmap.md`: S-02 outcome, catalog as enhancement, Stream B reuse of the scanner.
- `context/foundation/tech-stack.md`: one Next.js unit for scan UI, sign-in, and catalog lookup. Supabase for items.
- `context/archive/2026-08-06-deployed-https-app-shell/change.md`: HTTPS shell verified. Prerequisite for phone camera.
- `context/changes/household-sign-in/plan.md`: excluded scanning and item creation. Set RLS, RPC, server-action, and `/inventory` conventions.
- `context/changes/household-sign-in/research.md`: 2026-08-09 snapshot. Auth, schema, and tests were still absent. Do not treat as current code.
- `context/changes/household-sign-in/reviews/impl-review-phase-5.md`: Edge `middleware.ts` replaced the planned `proxy.ts`.

## Related Research

- `context/changes/household-sign-in/research.md`: S-01 investigation. Stale for live code. Still the prior research record in this stream.

## Open Questions

- **Which external catalog FR-016 uses, and how poor European pet-food coverage is handled beyond an editable prefill:** Owner: user. Does not block a manual-name ship (`context/foundation/roadmap.md:93`, `context/foundation/prd.md:192`).
- **Whether creating an item also writes an initial count:** Owner: planner. Counts and scan direction are S-03 and S-04 (`context/foundation/roadmap.md:32-33`). Docs do not say S-02 stores quantity.
- **Which browser barcode library or API the scan UI uses:** Owner: planner. No package or stack entry exists.
- **How the FR-005 "offer existing items" step behaves on a first-ever item versus later unknown barcodes:** Owner: planner. The requirement is binding (`context/foundation/prd.md:110`). The first create has an empty list.
