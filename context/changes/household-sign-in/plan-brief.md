# Household Sign-In Plan Brief

> Full plan: `context/changes/household-sign-in/plan.md`
> Roadmap item: `context/foundation/roadmap.md` (S-01)

## What and Why

A user must be able to sign in to an account that owns one household inventory, and reach that inventory while it is still empty (PRD FR-001). This is the first server boundary in the repository and the ownership model every later slice writes against, so getting the household and row-level security shape right here avoids reworking S-02 through S-08.

## Starting Point

The app is a single public Next.js page with no auth UI, no server code, no database, and no test runner. `@supabase/ssr` and `@supabase/supabase-js` are already installed as `devDependencies` and must be promoted to runtime dependencies; an empty `src/lib/env.ts` stub exists and must be replaced. No Supabase environment values reach the Worker or CI yet. The remaining delta is Supabase clients, a request proxy for session refresh, the household schema with RLS, credential screens, an explicit household creation step, an empty inventory view, and a Vitest harness.

## Desired End State

A visitor can create an account with an email and password, sign in, name their household once, and land on an inventory page that reports it is empty. Signing out returns them to the landing page, `/inventory` redirects to `/login` while signed out, and a second account never sees the first account's data.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Sign-in method | Email plus password | Instant re-entry in a store with no inbox round trip; avoids the PKCE callback route entirely | Plan interview |
| Account creation | Self-serve `/signup` | App is complete on its own and the deferred spouse invite reuses it | Plan interview |
| Email confirmation | Off for the first version | Removes the inbox round trip and confirm route from this slice | Plan interview |
| Password reset | Out of scope | FR-001 asks only for sign-in; reset is available from the Supabase dashboard | Plan interview |
| Household bootstrap | Explicit `/household/new` step, name only | User names the household once, deliberately, rather than by implicit creation | Plan interview |
| Household write path | Single `security definer` Postgres function | Two client-issued inserts leave an orphaned household window and force a policy that trusts an unowned row | Plan |
| Routing | `/` public, `/login`, `/signup`, `/inventory`, `/household/new` | Clean proxy matcher and room for the scanning slices | Plan interview |
| Membership model | Separate `household_members` table, no roles, `UNIQUE (user_id)` | Keeps deferred FR-011 possible without a rewrite; enforces one-account-one-household at the schema; PRD states all members are equal | PRD, plan interview |
| Request interception | `src/proxy.ts` with a `proxy` export | Next.js 16 deprecates the `middleware` filename; runtime is Node.js and not configurable | Next.js 16 docs |
| Verification | Vitest on pure modules plus manual browser checks | No test tooling exists; database and auth behavior verified manually against the real project | Plan interview |
| Provisioning | User provisions Supabase; plan scaffolds `.env.example`, Worker vars, CI values, and Auth dashboard settings (email confirmation off, Site URL) | Credentials are not in the repository | Plan interview |

## Scope

**In scope:**

- Supabase packages, validated environment module, browser and server client factories
- Environment values across local development, `wrangler.jsonc`, and the deploy workflow
- Supabase Auth dashboard settings: email confirmation off, Site URL, README notes
- Vitest harness with a CI test gate
- `households` and `household_members` schema (with `UNIQUE (user_id)`), RLS policies, and the atomic `create_household` function
- Session refresh proxy and protection of the signed-in area
- Sign-up, sign-in, and sign-out via route-colocated server actions
- Household creation step (route-colocated action) and the empty inventory view

**Out of scope:**

- Scanning, items, counts, modes, minimums, restock lists, consumption rates (S-02 through S-08)
- Spouse invite (FR-011), password reset, email confirmation, magic links, OAuth
- Separate unrelated households, member roles, renaming or deleting a household
- Browser-level end-to-end tests

## Approach

Follow the recorded stack contract: Supabase Auth with `@supabase/ssr` cookie sessions on Cloudflare Workers via OpenNext. Because there is no existing application pattern to extend, the plan sets the conventions later slices copy: one validated environment module, one server and one browser client factory, server actions for mutations, and access scoped by row-level security rather than application-side filtering. Phases are ordered so each is independently verifiable, with configuration and the test harness landing before any user-visible behavior.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Supabase and environment wiring | Packages, env module, client factories, values in local, Worker, and CI, plus Auth dashboard settings | `NEXT_PUBLIC_*` values are inlined at build time, so supplying them only as Worker secrets breaks the browser client |
| 2. Vitest harness and CI gate | `npm test` runs and blocks deploys | Test setup that reaches into React or Supabase turns a small phase into a large one |
| 3. Household schema and RLS | Tables, policies, atomic creation function | Mutually referencing policies produce infinite recursion at query time, not at migration time |
| 4. Session plumbing and protection | `src/proxy.ts`, `loadCurrentUser`, protected placeholder | Copying Supabase's `middleware.ts` examples verbatim uses a convention Next.js 16 deprecates |
| 5. Sign-up, sign-in, sign-out | Working credential flow | Leaking raw Supabase errors into the UI, or gating access on unverified `getSession` |
| 6. Household step and empty inventory | The complete S-01 outcome | A repeated submission creating a second household |

## Risks and Assumptions

- Assumes you provision the Supabase project and supply the URL and anon key as local values, Worker vars, and repository secrets before Phase 1 can be verified.
- Assumes public sign-up is acceptable on a household app. Close or restrict Supabase signups once your account exists, otherwise anyone reaching the URL can create an account.
- Assumes email confirmation stays off, which means unverified email addresses. Acceptable for one household, revisit before FR-011.
- Row-level security is the only isolation boundary and is verified manually, since no database test harness exists. A policy mistake would not be caught automatically.
- Prerequisite F-01 is functionally satisfied but its change record still reads `in_progress`. Tracker hygiene only, not a blocker.
- The Supabase and OpenNext Workers combination is unproven in this repository. Phase 1 ends with `worker:check` specifically to surface a runtime incompatibility before any feature work depends on it.

## Success Criteria

- A user can create an account, sign in, name a household once, and reach an empty inventory that belongs to that account.
- Visiting the signed-in area while signed out redirects to sign-in, and signing out ends the session.
- A second account sees only its own household, confirmed both through the app and directly against the database.
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run worker:check` pass, and the deploy workflow enforces all four.
- The complete flow works on a phone against the live HTTPS URL.
