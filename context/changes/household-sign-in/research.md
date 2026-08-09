---
date: 2026-08-09T10:56:00+02:00
researcher: pterodactor3000
git_commit: 6a823cc9412ed081798e1256b938f10799937bb7
branch: feature/S-01-sign-in
repository: pterodactor3000/Noospheric-Tally
topic: "S-01 (household-sign-in): current state for sign-in and empty household inventory (FR-001)"
tags: [research, codebase, auth, supabase, s-01]
status: complete
last_updated: 2026-08-09
last_updated_by: pterodactor3000
---

# Research: S-01 household sign-in

## Research Question

What exists today for S-01 (`household-sign-in`): sign in and reach an empty household inventory that belongs to the user's account (FR-001)?

## Summary

S-01 is **greenfield implementation**. The app is a single public Next.js page with no auth, no Supabase packages, no middleware, no API routes, and no database schema. Product and stack decisions already bind S-01 to **Supabase Auth** with **`@supabase/ssr` cookie sessions** and a **one-account-one-household** access model. F-01 (HTTPS deploy) is **functionally satisfied** (live Worker, CI deploy on merge) though its change record still reads `in_progress`. Planning can proceed; implementation must add Supabase wiring, auth UI, session protection, household bootstrap, and deploy-time env configuration for Cloudflare Workers.

## Detailed Findings

### Roadmap and product scope

- S-01 outcome: user signs in and reaches an empty household inventory owned by their account (`context/foundation/roadmap.md:73-83`).
- Change ID `household-sign-in` matches the roadmap; status `ready`, prerequisite F-01 (`context/foundation/roadmap.md:30`, `78`).
- FR-001 is must-have: sign in to an account that owns one household inventory (`context/foundation/prd.md:92`).
- Access model: account owns one household; spouse invite deferred (FR-011); all members equal (`context/foundation/prd.md:50-54`, `132-134`).
- Discovery locked the same model (`context/foundation/shape-notes.md:21-24`, `40`).
- S-01 risk: later slices write household-scoped data, so identity must land first (`context/foundation/roadmap.md:82`).

### Current application shell

- Only route is `/` at `src/app/page.tsx`. Public marketing shell, no forms or auth UI (`src/app/page.tsx:1-55`).
- Copy explicitly names sign-in as the next milestone (`src/app/page.tsx:38-40`).
- Root layout has fonts and metadata only; no session provider (`src/app/layout.tsx:1-33`).
- No `src/middleware.ts`, no `src/app/**/route.ts`, no `"use server"` actions anywhere in the repo.
- No `src/lib/`, no `components/`, no protected route groups.
- Path alias `@/*` is configured for new modules (`tsconfig.json:21-23`).

### Auth and Supabase (declared, not implemented)

- Tech stack declares Supabase Postgres + Auth and `@supabase/ssr` for cookie sessions in middleware and server components (`context/foundation/tech-stack.md:24`).
- Roadmap baseline: auth absent; nothing installed or wired (`context/foundation/roadmap.md:52`).
- Bootstrap verification recorded the same gap (`context/changes/bootstrap-verification/verification.md:98`).
- `package.json` dependencies are Next.js, React, and OpenNext only; no `@supabase/*` (`package.json:22-27`).
- No `.env.example`, `.dev.vars.example`, or Supabase vars in `wrangler.jsonc` (vars block commented at `wrangler.jsonc:51-56`).
- Generated `cloudflare-env.d.ts` exposes only Cloudflare bindings (`NEXTJS_ENV`, `ASSETS`, `IMAGES`); no Supabase keys (`cloudflare-env.d.ts:4-18`).
- No `process.env` usage in application source.

### Data layer

- Roadmap baseline: Supabase Postgres declared in tech-stack; no client, schema, or migrations (`context/foundation/roadmap.md:51`).
- No `supabase/` directory, no SQL migrations, no household or inventory tables in code.
- Household bootstrap behavior (create row on first sign-in vs explicit setup step) is **not decided in repo artifacts**.

### F-01 prerequisite state

- Live HTTPS URL documented: `https://noospheric-tally.eldritchcode-it.workers.dev` (`README.md:42`).
- Deploy workflow runs lint, typecheck, worker validation, and deploy on push to `main` (`.github/workflows/deploy.yml:3-7`, `41-54`).
- F-01 change notes record manual deploy and verification (`context/changes/deployed-https-app-shell/change.md:12-13`).
- F-01 change record status is still `in_progress` with stale pending note about CI secrets (`context/changes/deployed-https-app-shell/change.md:4`, `14`).
- F-01 is not archived under `context/archive/` (only placeholder README there).
- Secure context for phone testing is available via production HTTPS; local `next dev` and preview URLs are HTTP (`README.md:11`, `33-36`).

### Deploy and platform constraints relevant to auth

- Target runtime is Cloudflare Workers via `@opennextjs/cloudflare` (`wrangler.jsonc:11-12`, `open-next.config.ts`).
- `nodejs_compat` and `global_fetch_strictly_public` compatibility flags are set (`wrangler.jsonc:14-16`).
- OpenNext Cloudflare dev init is enabled in `next.config.ts` for local binding access (`next.config.ts:9-12`).
- CI deploy passes only Cloudflare secrets today; Supabase env vars are not in the workflow (`.github/workflows/deploy.yml:52-54`).
- Auth middleware on this stack must use the **Edge** middleware runtime; cookie refresh via `@supabase/ssr` typically requires `middleware.ts` with `getAll`/`setAll` on the response.

### Tests and verification surfaces

- No test runner or `test` script in `package.json` (`package.json:5-20`).
- CI runs lint, typecheck, and `worker:check` only (`.github/workflows/deploy.yml:41-48`).
- Roadmap lists observability and test tooling as absent (`context/foundation/roadmap.md:54`).
- S-01 manual verification will rely on browser sign-in flows on HTTPS until test harness exists.

## Code References

- `src/app/page.tsx:38-40`: next milestone text references sign-in; no implementation.
- `src/app/layout.tsx:15-18`: app metadata; no auth wrapper.
- `package.json:22-27`: runtime dependencies; Supabase not present.
- `wrangler.jsonc:14-16`: Worker compatibility flags for OpenNext.
- `wrangler.jsonc:51-56`: no environment variables configured for Supabase.
- `next.config.ts:9-12`: OpenNext Cloudflare dev initialization.
- `tsconfig.json:21-23`: `@/*` path alias for new auth and lib modules.
- `.github/workflows/deploy.yml:50-54`: production deploy env (Cloudflare only).
- `.gitignore:49-57`: `.env*` and `.dev.vars*` ignored; example files allowed but missing.

## Architecture Insights

- **Greenfield auth slice:** S-01 adds the first server boundary (middleware, auth callback route, Supabase clients, protected inventory route). No existing patterns to extend in application code.
- **Stack contract:** Cookie-based Supabase SSR sessions are the declared session model; deviating would conflict with `tech-stack.md` and FR-001 wiring expectations.
- **Household as data owner:** PRD and roadmap treat the signed-in account as owner of one household inventory. Schema and RLS should scope all future item writes to that household, even though S-01 only needs an empty inventory view.
- **Cloudflare-first verification:** Phone and secure-context auth testing should target the live `workers.dev` URL; local HTTP dev is insufficient for realistic mobile auth checks.
- **Deploy env gap:** Supabase URL and anon key must be available at Worker runtime (wrangler vars/secrets and CI) before auth works in production; this is not scaffolded yet.

## Historical Context

- `context/foundation/tech-stack.md`: chose Supabase Auth + `@supabase/ssr` for FR-001 on Cloudflare Workers.
- `context/changes/bootstrap-verification/verification.md`: confirmed Supabase packages and env vars still to add after scaffold.
- `context/changes/deployed-https-app-shell/change.md`: F-01 delivered HTTPS shell; prerequisite for S-01 device testing.
- `context/changes/household-sign-in/change.md`: change folder created 2026-08-09; no plan or framing yet.

## Related Research

- None in this change folder yet.

## Open Questions

- **Supabase auth method (email magic link, password, OAuth):** not specified in PRD or shape-notes. Owner: user. Blocks plan detail for sign-in UI and Supabase dashboard config.
- **Supabase project provisioning:** no project URL, anon key, or redirect URLs in repo. Owner: user. Blocks local and production auth wiring.
- **Household bootstrap trigger:** create household row automatically on first successful sign-in vs separate "create household" step. Owner: planner/user. Blocks schema and first-login flow design.
- **Initial inventory route shape:** dedicated `/inventory` vs replacing `/` for signed-in users. Owner: planner. Blocks routing and middleware matcher design.
- **F-01 formal closeout:** functionally done but change still `in_progress` and not archived. Owner: user. Does not block S-01 research or planning, but may cause prerequisite ambiguity in tracker hygiene.
