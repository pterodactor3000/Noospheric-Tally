# Household Sign-In Implementation Plan

## Overview

Deliver roadmap slice S-01 (`household-sign-in`): a user can sign in to an account that owns one household inventory, and reach that inventory while it is still empty. This satisfies PRD FR-001 and establishes the identity and ownership boundary that every later slice (S-02 through S-08) writes data against.

The slice adds the first server boundary in the repository: Supabase clients, a request proxy for cookie session refresh, the `households` and `household_members` schema with row-level security, self-serve sign-up and sign-in, an explicit household creation step, and an empty inventory view.

## Current State Analysis

The application is a single public page with no server code, no auth UI, no database, and no test tooling. Partial Phase 1 scaffolding has already started and must be finished rather than duplicated.

- The only route is `/`, a static marketing shell whose copy already names sign-in as the next milestone (`src/app/page.tsx:1-55`, specifically `src/app/page.tsx:38-40`).
- The root layout defines fonts and metadata only, with no session provider (`src/app/layout.tsx:1-33`).
- Application source under `src/` is `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, plus an empty stub at `src/lib/env.ts`. There is no `src/middleware.ts`, no `src/proxy.ts`, no route handler, and no server action anywhere in the repository.
- Runtime dependencies are Next.js 16.2.11, React 19, and `@opennextjs/cloudflare` (`package.json:22-27`). `@supabase/ssr` and `@supabase/supabase-js` are already installed, but incorrectly as `devDependencies` (`package.json:30-31`), so they must be promoted to runtime dependencies.
- No environment variables are configured for the Worker. The `vars` block in `wrangler.jsonc:56` is commented out, and `.dev.vars` carries only `NEXTJS_ENV`.
- CI runs lint, typecheck, and `worker:check`, then deploys on push to `main`, passing Cloudflare credentials only (`.github/workflows/deploy.yml:41-54`).
- There is no test runner and no `test` script (`package.json:5-20`).
- The `@/*` path alias is available for new modules (`tsconfig.json:21-23`).
- No `supabase/` directory, migration, or schema exists.

The prerequisite F-01 is functionally satisfied: the app is live over HTTPS at `https://noospheric-tally.eldritchcode-it.workers.dev` (`README.md:42`) and redeploys on merge. Its change record still reads `in_progress`, which is a tracker hygiene matter, not a blocker for this slice.

## Desired End State

A visitor to the deployed HTTPS URL can create an account with an email and password, sign in, name their household once, and land on an inventory page that correctly reports it is empty. Signing out returns them to the landing page, and visiting `/inventory` while signed out sends them to `/login`. A second account sees its own household and never the first account's data.

Verify by running the flow end to end on a phone against the live URL, and by confirming `npm run lint`, `npm run typecheck`, `npm test`, and `npm run worker:check` all pass.

## What We're NOT Doing

- Barcode scanning, item creation, counts, stocking or using modes, minimums, restock lists, and consumption rates. These are S-02 through S-08.
- Inviting another person to the household (PRD FR-011, explicitly deferred at `context/foundation/prd.md:132-134`).
- Password reset or "forgot password" flows.
- Email confirmation, magic links, OTP, and the PKCE `exchangeCodeForSession` callback route they would require.
- OAuth providers.
- Separate unrelated households sharing one deployment (PRD non-goal at `context/foundation/prd.md:179`).
- Roles or owner-only permissions. All household members are equal (`context/foundation/prd.md:52`).
- Renaming or deleting a household after creation.
- Browser-level end-to-end tests. Verification is Vitest plus manual browser checks.

## Implementation Approach

Follow the stack contract already recorded in `context/foundation/tech-stack.md:24`: Supabase Postgres and Supabase Auth, with `@supabase/ssr` carrying cookie-based sessions into server components and the request proxy, deployed to Cloudflare Workers through `@opennextjs/cloudflare`.

There is no existing application pattern to extend, so the plan establishes the conventions the later slices will copy: a single validated environment module, one server client factory and one browser client factory under `src/lib/supabase/`, server actions for mutations rather than route handlers, and database access always scoped by row-level security rather than by application-side filtering.

Phases are ordered so each one is verifiable on its own: configuration and clients first, then the test harness, then the schema, then session protection against a placeholder page, then the auth screens, and finally the household step and inventory view that complete the user-visible outcome.

## Critical Implementation Details

**Next.js 16 uses** `proxy.ts`**, not** `middleware.ts`**.** The `middleware` filename is deprecated in Next.js 16. The correct convention is `src/proxy.ts` exporting a function named `proxy`, and its runtime is Node.js and cannot be configured. Type imports rename accordingly (`NextMiddleware` becomes `NextProxy`, `MiddlewareConfig` becomes `ProxyConfig`). Supabase documentation still shows `middleware.ts`; adapt the cookie `getAll`/`setAll` body verbatim but place it in `proxy.ts` under the new export name.

`NEXT_PUBLIC_*` **variables are needed at build time, not only at runtime.** The client bundle inlines them during `next build`, which in this repository runs inside `npm run worker:check` and `npm run worker:deploy` in CI. Supplying them only as Cloudflare Worker secrets produces a deployed app whose browser client has an undefined URL. They must be present as GitHub Actions environment values for the build steps as well as available to the Worker at runtime.

**Household creation must be atomic and cannot be two client-issued inserts.** Under row-level security, an authenticated user inserting a `households` row and then a `household_members` row is two statements with a window where a household exists that nobody can read, and the membership insert policy has to trust a household the user is not yet a member of. Implement creation as a single `security definer` Postgres function that inserts both rows in one transaction and returns the new household id, then call it through `supabase.rpc`.

**Row-level security policies must not recurse.** The `households` select policy references `household_members`, so the `household_members` select policy must be expressed as `user_id = auth.uid()` directly rather than by joining back through `households`. A policy pair that references each other produces an infinite recursion error at query time rather than at migration time.

**Session reads use** `getUser`**, never** `getSession`**.** On the server, `supabase.auth.getUser()` revalidates the token against the Auth server. `getSession()` returns unverified cookie contents and must not gate access to household data.

---

## Phase 1: Supabase dependencies and environment wiring

### Overview

Install the Supabase packages, add a validated environment module and the two client factories, and document the environment values across local development, the Worker, and CI. No user-visible change.

### Changes Required

#### 1. Dependencies

**File:** `package.json`

**Intent:** Promote the already-installed `@supabase/supabase-js` and `@supabase/ssr` packages from `devDependencies` to runtime `dependencies`, keeping their current major versions. Do not reinstall them as a second copy.

**Contract:** Both packages appear only under `dependencies`. They are removed from `devDependencies`. No script changes in this phase. `package-lock.json` is regenerated by `npm install`.

#### 2. Environment access module

**File:** `src/lib/env.ts`

**Intent:** Replace the empty stub already present at this path. Read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in one place and fail loudly with a named, actionable message when either is missing or empty, so a misconfigured deploy reports the missing variable instead of producing an opaque Supabase client error.

**Contract:** Exports a pure function `getSupabaseEnv()` returning `{ supabaseUrl: string; supabaseAnonKey: string }`. Throws an `Error` naming the specific missing variable. No side effects at module load, so importing it is safe during build.

#### 3. Browser client factory

**File:** `src/lib/supabase/browser.ts`

**Intent:** Provide the single client used by client components, built with `createBrowserClient` from `@supabase/ssr`.

**Contract:** Exports `createClient()`. Uses default cookie handling. No custom cookie implementation. Callers import from `@/lib/supabase/browser`.

#### 4. Server client factory

**File:** `src/lib/supabase/server.ts`

**Intent:** Provide the client used by server components and server actions, wired to the Next.js `cookies()` store.

**Contract:** Exports an async `createClient()` built with `createServerClient` and a cookies adapter that implements `getAll` only. Omits `setAll` so the server-component client is read-only for cookies; `@supabase/ssr` warns if a refresh is needed, and `src/proxy.ts` is the only place that writes refreshed cookies via a full `getAll`/`setAll` pair. Callers import from `@/lib/supabase/server`.

#### 5. Local and deployment environment documentation

**Files:** `.env.example`, `.dev.vars`, `wrangler.jsonc`, `.github/workflows/deploy.yml`, `README.md`

**Intent:** Make the two required values discoverable and supply them everywhere the app is built or run.

**Contract:** `.env.example` lists both variable names with placeholder values and no real credentials. `.dev.vars` gains both names alongside the existing `NEXTJS_ENV`. `wrangler.jsonc` declares them in a `vars` block, replacing the commented example at `wrangler.jsonc:50-56`. The deploy workflow exposes both to the build, validate, and deploy steps from repository secrets. `README.md` documents the required variables and where to obtain them. The anon key is a publishable value; no service role key is introduced anywhere in this change.

#### 6. Supabase Auth dashboard settings

**File:** Supabase project Auth settings (documented in `README.md`)

**Intent:** Make the password sign-up and sign-in flow match the plan decisions before any auth UI is built, so Phase 5 does not fail for configuration reasons outside the code.

**Contract:** Email confirmation is disabled for the project. Site URL is set to `https://noospheric-tally.eldritchcode-it.workers.dev`. Local development origin `http://localhost:3000` is included in the redirect allowlist if the dashboard requires it for password auth. `README.md` records these three settings next to the environment variable instructions.

### Success Criteria

#### Automated Verification

- `npm run lint` exits zero.
- `npm run typecheck` exits zero.
- `npm run worker:check` completes a build and dry-run deploy with the new `vars` block present.

#### Manual Verification

- `npm run dev` starts and `/` renders unchanged.
- Removing `NEXT_PUBLIC_SUPABASE_URL` from the local environment and importing the env module produces an error message naming that variable.
- In the Supabase dashboard, email confirmation is confirmed off.
- In the Supabase dashboard, Site URL is confirmed as `https://noospheric-tally.eldritchcode-it.workers.dev`.
- `README.md` documents the Auth dashboard settings alongside the environment variables.

---

## Phase 2: Vitest harness and CI test gate

### Overview

Add a test runner with a real assertion, and make CI fail when tests fail, so the phases that follow land with a regression net.

### Changes Required

#### 1. Test runner setup

**Files:** `package.json`, `vitest.config.ts`

**Intent:** Add Vitest as a dev dependency with a `test` script, configured for the Node environment and the `@/` path alias, covering pure modules only.

**Contract:** `npm test` runs Vitest once and exits non-zero on failure. Configuration resolves `@/`\_ to `src/`\_to match`tsconfig.json:21-23`. No JSDOM, no React component rendering, no Supabase network access in tests.

#### 2. First tests

**File:** `src/lib/env.test.ts`

**Intent:** Prove the harness runs and lock the environment module's failure behavior, which is otherwise only discovered at deploy time.

**Contract:** Tests named for behavior: returns both values when the environment is complete, throws naming the URL variable when it is absent, throws naming the anon key variable when it is absent, and throws when a variable is present but empty. Each test sets and restores its own environment.

#### 3. CI gate

**File:** `.github/workflows/deploy.yml`

**Intent:** Run the test suite between the typecheck and Worker validation steps.

**Contract:** A `Run tests` step executing `npm test`, placed after `Check TypeScript` (`.github/workflows/deploy.yml:44-48`) so a failing test blocks deployment.

### Success Criteria

#### Automated Verification

- `npm test` passes with at least four assertions covering the env module's success and failure paths.
- `npm run lint` and `npm run typecheck` exit zero with the test files present.

#### Manual Verification

- Deliberately breaking one assertion makes `npm test` exit non-zero, confirming the gate is real. Revert afterwards.

---

## Phase 3: Household schema and row-level security

### Overview

Create the `households` and `household_members` tables, their policies, and the atomic creation function. This is the ownership boundary every later slice inherits.

### Changes Required

#### 1. Schema migration

**File:** `supabase/migrations/<timestamp>_create_households.sql`

**Intent:** Define the two tables that carry household identity and membership.

**Contract:**
`households` has `id uuid primary key default gen_random_uuid()`, `name text not null` with a non-empty check, and `created_at timestamptz not null default now()`.
`household_members` has `household_id uuid not null references households(id) on delete cascade`, `user_id uuid not null references auth.users(id) on delete cascade`, `created_at timestamptz not null default now()`, a composite primary key on `(household_id, user_id)`, and a `UNIQUE (user_id)` constraint so one account can belong to only one household (FR-001), while many members can still share one household for deferred FR-011.
No role column: all members are equal per `context/foundation/prd.md:52`.
An index on `household_members(user_id)` supports the per-request membership lookup. The unique constraint may serve as that index; do not add a redundant second index on the same column.

#### 2. Row-level security policies

**File:** same migration

**Intent:** Make membership the only path to household data, so later slices cannot leak across accounts even if application code forgets a filter.

**Contract:** RLS enabled on both tables with no permissive default. `household_members` select policy is `user_id = auth.uid()`, expressed directly to avoid recursion. `households` select policy admits rows with a matching membership for `auth.uid()`. No direct insert, update, or delete policy is granted on either table to the `authenticated` role in this slice; creation goes through the function below, which is the only write path.

#### 3. Atomic creation function

**File:** same migration

**Intent:** Create a household and its first membership in one transaction, avoiding the orphaned-household window described in Critical Implementation Details.

**Contract:** `create_household(household_name text) returns uuid`, `security definer`, with a fixed empty `search_path`. Raises when `auth.uid()` is null, rejects a blank name, refuses when the caller already belongs to a household so a repeated submission cannot create a second one, inserts both rows, and returns the new household id. Execute granted to the `authenticated` role only.

#### 4. Migration documentation

**File:** `README.md`

**Intent:** Record how to apply migrations to the Supabase project.

**Contract:** A short section naming the migration directory and the command used to apply it, so the schema is reproducible rather than hand-applied in the dashboard.

### Success Criteria

#### Automated Verification

- The migration applies cleanly against the Supabase project with no error.
- Re-running the full migration set from empty produces the same schema.

#### Manual Verification

- In the Supabase SQL editor, calling `create_household('Test')` as one authenticated user creates exactly one household and one membership row.
- Calling it a second time as the same user is refused.
- Selecting from `households` as a second authenticated user returns zero rows, confirming isolation.
- Selecting from `households` with the anon role returns zero rows.

---

## Phase 4: Session plumbing and route protection

### Overview

Refresh the session cookie on every relevant request and protect the signed-in area, verified against a placeholder inventory page before any auth UI exists.

### Changes Required

#### 1. Request proxy

**File:** `src/proxy.ts`

**Intent:** Refresh the Supabase auth cookie on each request and redirect unauthenticated visitors away from protected paths.

**Contract:** Exports `proxy(request: NextRequest)` and a `config.matcher` covering `/inventory` and `/household/:path` while excluding static assets, image optimization, and favicon. Builds a `createServerClient` with `getAll`/`setAll` bound to the request cookies and the outgoing response, calls `supabase.auth.getUser()`, and returns the response with refreshed cookies. Unauthenticated requests to a protected path redirect to `/login`. The file uses the Next.js 16 `proxy` convention, not the deprecated `middleware` filename or export++.++

#### 2. Server-side session helper

**File:** `src/lib/auth/loadCurrentUser.ts`

**Intent:** Give server components one verified way to ask who the caller is.

**Contract:** Exports `loadCurrentUser()` returning the Supabase user or `null`, using `supabase.auth.getUser()` on the server client. Never uses `getSession`. Named `load`_ rather than `get`_ because it performs auth I/O and must not be treated as a pure query under team conventions. It reads the request context and returns without redirecting.

#### 3. Protected placeholder route

**File:** `src/app/inventory/page.tsx`

**Intent:** Give the protection something to protect, verifiable this phase and replaced with the real view in Phase 6.

**Contract:** A server component that redirects to `/login` when `loadCurrentUser()` returns null, and otherwise renders a minimal signed-in placeholder showing the account email.

### Success Criteria

#### Automated Verification

- `npm run lint`, `npm run typecheck`, and `npm test` exit zero.
- `npm run worker:check` builds and dry-run deploys with the proxy present, confirming the Worker bundle accepts it.
- Typecheck confirms no import of the deprecated `NextMiddleware` or `MiddlewareConfig` types.

#### Manual Verification

- Visiting `/inventory` while signed out redirects to `/login`. A 404 at `/login` is expected until Phase 5 creates that route; the success criterion is the redirect itself, not a rendered login page.
- Visiting `/` while signed out still renders the landing page with no redirect.
- Static assets and the favicon load normally, confirming the matcher excludes them.

---

## Phase 5: Sign-up, sign-in, and sign-out

### Overview

Add the credential screens. After this phase an account can be created and used to reach the protected area.

### Changes Required

#### 1. Auth server actions

**File:** `src/app/(auth)/actions.ts`

**Intent:** Handle sign-up, sign-in, and sign-out on the server so tokens are set as cookies rather than handled in the browser.

**Contract:** Exports `signUpWithPassword`, `signInWithPassword`, and `signOut`, each a `"use server"` action taking `FormData`. Validates email shape and a minimum password length at the boundary before calling Supabase. Returns a discriminated result of `{ status: "error"; message: string; field?: "email" | "password" }` rather than throwing, so the forms can render the message. Never echoes a Supabase internal error verbatim; maps failures to a user-facing message. On success, revalidates and redirects to `/inventory`. `signOut` clears the session and redirects to `/`.

#### 2. Validation helpers

**File:** `src/lib/auth/validateCredentials.ts`

**Intent:** Keep credential validation pure and testable, separate from the action's side effects.

**Contract:** Exports `validateCredentials({ email, password })` returning a discriminated union of valid or invalid with the offending field and message. No I/O.

#### 3. Credential validation tests

**File:** `src/lib/auth/validateCredentials.test.ts`

**Intent:** Cover the boundary cases the forms depend on.

**Contract:** Tests named for behavior, covering a valid pair, a missing email, a malformed email, a missing password, a password below the minimum length, and surrounding whitespace handling.

#### 4. Sign-in and sign-up pages

**Files:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/layout.tsx`

**Intent:** Provide the two mobile-first forms and a shared shell, matching the visual language already established in `src/app/page.tsx:1-55`.

**Contract:** Each page renders a form posting to its action, with `type="email"` and `type="password"` inputs carrying correct `autoComplete` values, labels bound to inputs, an inline error region, and a link to the other page. Both redirect an already-authenticated visitor to `/inventory`. Tailwind classes follow the existing page's conventions.

#### 5. Sign-out control

**File:** `src/components/SignOutButton.tsx`

**Intent:** Let a signed-in user end the session from the protected area.

**Contract:** A form submitting to the `signOut` action. No client-side Supabase call.

### Success Criteria

#### Automated Verification

- `npm test` passes including the new credential validation tests.
- `npm run lint`, `npm run typecheck`, and `npm run worker:check` exit zero.

#### Manual Verification

- Creating an account on the deployed HTTPS URL succeeds and lands on the protected area.
- Signing out returns to `/` and `/inventory` again redirects to `/login`.
- Signing back in with the same credentials succeeds.
- A wrong password shows a readable inline message and no internal error text or stack trace.
- A malformed email is rejected before any network call.
- The forms are usable one-handed on a phone.

---

## Phase 6: Household creation step and empty inventory

### Overview

Complete the S-01 outcome: a signed-in user names their household once and reaches an inventory that correctly reports it is empty.

### Changes Required

#### 1. Household query and creation action

**Files:** `src/lib/household/loadCurrentHousehold.ts`, `src/app/household/actions.ts`

**Intent:** Read the caller's household from a lib loader, and create one through a route-colocated server action that calls the atomic function from Phase 3. Auth mutations already live under `src/app/(auth)/actions.ts`; household mutations follow the same convention.

**Contract:** `loadCurrentHousehold()` returns `{ id: string; name: string } | null` from a policy-scoped select. Named `load`\_ rather than `get`\_because it performs database I/O and must not be treated as a pure query under team conventions.`src/app/household/actions.ts`exports`createHousehold`as a`"use server"`action calling`supabase.rpc("create_household", ...)`, validating the name at the boundary, returning a discriminated error result on failure, and redirecting to `/inventory` on success.

#### 2. Household name validation and tests

**Files:** `src/lib/household/validateHouseholdName.ts`, `src/lib/household/validateHouseholdName.test.ts`

**Intent:** Keep the name rule pure and covered.

**Contract:** Rejects empty and whitespace-only names, trims surrounding whitespace, and enforces a maximum length matching the column check. Tests cover empty, whitespace-only, a valid name, a name at the length limit, and one over it.

#### 3. Household creation page

**File:** `src/app/household/new/page.tsx`

**Intent:** The explicit creation step, asking for a name only.

**Contract:** A server component that redirects to `/inventory` when the caller already has a household, and otherwise renders a single-field form prefilled with a default derived from the account email. Submits to the `createHousehold` action from `src/app/household/actions.ts`, rendering inline validation errors.

#### 4. Inventory page

**File:** `src/app/inventory/page.tsx`

**Intent:** Replace the Phase 4 placeholder with the real empty inventory view, and route members without a household to the creation step.

**Contract:** Redirects to `/login` without a user, redirects to `/household/new` when `loadCurrentHousehold()` returns null, and otherwise renders the household name, an explicit empty state stating that nothing has been added yet, and the sign-out control. The empty state names scanning as the next step without implementing it.

#### 5. Landing page update

**File:** `src/app/page.tsx`

**Intent:** Give the landing page an entry point and stop advertising sign-in as an unbuilt milestone (`src/app/page.tsx:38-40`).

**Contract:** Adds sign-in and sign-up links, and updates the "Next milestone" copy to the scanning slice. Signed-in visitors get a link through to `/inventory`. Existing layout and styling are preserved.

### Success Criteria

#### Automated Verification

- `npm test` passes including the household name tests.
- `npm run lint`, `npm run typecheck`, and `npm run worker:check` exit zero.

#### Manual Verification

- A brand-new account signing in for the first time is sent to `/household/new`.
- Submitting a name creates the household and lands on `/inventory` showing that name and an empty state.
- Reloading `/inventory` keeps the same household and does not create another.
- Visiting `/household/new` again redirects to `/inventory`.
- A second account created from a different browser sees its own household creation step, then its own empty inventory, and never the first account's name.
- The whole flow completes on a phone against the live HTTPS URL.

---

## Testing Strategy

### Unit Tests

- Environment module: both values present, each missing individually, and present but empty.
- Credential validation: valid pair, missing email, malformed email, missing password, short password, whitespace handling.
- Household name validation: empty, whitespace-only, valid, at the length limit, over the limit.

### Integration Tests

None automated in this slice. Supabase Auth and row-level security behavior are exercised manually against the real project, because the repository has no database test harness and adding one is a larger commitment than this slice can absorb. The isolation checks in Phase 3 and Phase 6 are the substitute, and their results should be recorded in the change record.

### Manual Testing Steps

1. Apply the migrations to the Supabase project and confirm both tables and the function exist.
2. Deploy to the live HTTPS URL by merging to `main`, and confirm the deploy workflow passes lint, typecheck, tests, and Worker validation.
3. On a phone, open the live URL and follow the sign-up link.
4. Create an account with an email and password, and confirm arrival at `/household/new`.
5. Submit a household name and confirm `/inventory` shows that name with an empty state.
6. Reload `/inventory` and confirm the household is unchanged and not duplicated.
7. Sign out and confirm `/inventory` redirects to `/login`.
8. Sign in again and confirm arrival at `/inventory` with the same household.
9. Attempt sign-in with a wrong password and confirm a readable message with no internal detail.
10. In a separate browser, create a second account and confirm it gets its own household and cannot see the first.

## Migration and Rollback

The schema is additive: two new tables, their policies, and one function. Nothing existing depends on them, so rollback is dropping the function and both tables, in that order, plus reverting the application code. No data migration is required because there is no prior data.

Application rollback is a revert of the merge commit followed by the automatic redeploy. The Supabase environment variables can remain configured after a revert without affecting the reverted app.

## References

- Roadmap: `context/foundation/roadmap.md` (S-01, lines 30 and 73-83)
- PRD: `context/foundation/prd.md` (FR-001 at line 92; access model at lines 50-54; FR-011 deferral at lines 132-134; non-goals at lines 179-180)
- Tech stack: `context/foundation/tech-stack.md:24` (Supabase Auth, `@supabase/ssr`, Cloudflare Workers via OpenNext)
- Research: `context/changes/household-sign-in/research.md`
- `src/app/page.tsx:1-55`: current landing page, replaced entry point in Phase 6
- `src/app/layout.tsx:1-33`: root layout, unchanged by this plan
- `package.json:22-27`: dependency list gaining the Supabase packages
- `tsconfig.json:21-23`: `@/*` alias used by all new modules
- `wrangler.jsonc:50-56`: commented `vars` block replaced in Phase 1
- `.github/workflows/deploy.yml:41-54`: CI steps gaining the test gate and Supabase build values
- `README.md:42`: live HTTPS URL used for manual verification

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Supabase dependencies and environment wiring

#### Automated

- [x] 1.1 `npm run lint` exits zero
- [x] 1.2 `npm run typecheck` exits zero
- [x] 1.3 `npm run worker:check` completes with the new `vars` block present

#### Manual

- [x] 1.4 `npm run dev` starts and `/` renders unchanged
- [x] 1.5 Removing `NEXT_PUBLIC_SUPABASE_URL` produces an error naming that variable
- [x] 1.6 Supabase dashboard: email confirmation is off
- [x] 1.7 Supabase dashboard: Site URL is the live workers.dev URL
- [x] 1.8 `README.md` documents the Auth dashboard settings

### Phase 2: Vitest harness and CI test gate

#### Automated

- [x] 2.1 `npm test` passes with at least four env module assertions (`7ecb2d1`, `57dc0a2`, `0a20a36`)
- [x] 2.2 `npm run lint` and `npm run typecheck` exit zero with test files present (`7ecb2d1`, `8b6804d`, `57dc0a2`)

#### Manual

- [x] 2.3 Breaking one assertion makes `npm test` exit non-zero, then reverted (verified 2026-08-16)

### Phase 3: Household schema and row-level security

#### Automated

- [x] 3.1 The migration applies cleanly with no error (`d890c26`)
- [x] 3.2 Re-running the full migration set from empty reproduces the schema (`d890c26`)

#### Manual

- [x] 3.3 `create_household('Test')` creates exactly one household and one membership (verified 2026-08-16)
- [x] 3.4 A second call by the same user is refused (verified 2026-08-16)
- [x] 3.5 A second authenticated user selecting from `households` returns zero rows (verified 2026-08-16)
- [x] 3.6 The anon role selecting from `households` returns zero rows (verified 2026-08-16)

### Phase 4: Session plumbing and route protection

#### Automated

- [ ] 4.1 `npm run lint`, `npm run typecheck`, and `npm test` exit zero
- [ ] 4.2 `npm run worker:check` builds and dry-run deploys with the proxy present
- [ ] 4.3 Typecheck confirms no deprecated `NextMiddleware` or `MiddlewareConfig` imports

#### Manual

- [ ] 4.4 `/inventory` while signed out redirects to `/login` (404 at `/login` is expected until Phase 5)
- [ ] 4.5 `/` while signed out renders with no redirect
- [ ] 4.6 Static assets and favicon load normally

### Phase 5: Sign-up, sign-in, and sign-out

#### Automated

- [ ] 5.1 `npm test` passes including credential validation tests
- [ ] 5.2 `npm run lint`, `npm run typecheck`, and `npm run worker:check` exit zero

#### Manual

- [ ] 5.3 Account creation on the live URL lands in the protected area
- [ ] 5.4 Sign-out returns to `/` and `/inventory` redirects to `/login`
- [ ] 5.5 Signing back in with the same credentials succeeds
- [ ] 5.6 A wrong password shows a readable message with no internal detail
- [ ] 5.7 A malformed email is rejected before any network call
- [ ] 5.8 Forms are usable one-handed on a phone

### Phase 6: Household creation step and empty inventory

#### Automated

- [ ] 6.1 `npm test` passes including household name tests
- [ ] 6.2 `npm run lint`, `npm run typecheck`, and `npm run worker:check` exit zero

#### Manual

- [ ] 6.3 A new account's first sign-in lands on `/household/new`
- [ ] 6.4 Submitting a name lands on `/inventory` with that name and an empty state
- [ ] 6.5 Reloading `/inventory` does not create a second household
- [ ] 6.6 Revisiting `/household/new` redirects to `/inventory`
- [ ] 6.7 A second account sees only its own household
- [ ] 6.8 The whole flow completes on a phone against the live HTTPS URL
