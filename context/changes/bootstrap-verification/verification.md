---
bootstrapped_at: 2026-08-03T11:39:03Z
starter_id: next
project_name: noospheric-tally
language_family: js
package_manager: npm
scaffold_status: ok
audit_command: npm audit --json
---

## Binding Record

```yaml
starter_id: next
package_manager: npm
project_name: noospheric-tally
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-workers
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  scaffolding_confidence: verified
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

Rationale, verbatim from `context/foundation/tech-stack.md`:

> The PRD defines a mobile-first web app for one signed-in household, sixteen requirements deep, built solo in about four weeks of after-hours work. Next.js is the vetted JavaScript default for that product type and passes all four agent-friendly quality gates: TypeScript by default, strong conventions, dominant popularity in its family, and current authoritative documentation. One deployable unit covers the scanning interface and the server work behind sign-in, per-item minimums, and the outbound catalog lookup for unknown barcodes, so the budget is not spent wiring a separate API. Supabase is the data store, supplying hosted Postgres for households, items, and recorded quantity changes, plus the authentication FR-001 requires; the `@supabase/ssr` package carries cookie-based sessions into server components and middleware. Cloudflare Workers is the deployment target through the `@opennextjs/cloudflare` adapter, chosen after verification showed the catalog's `cloudflare-pages` entry no longer matches documented practice for new Next.js apps. GitHub Actions deploys on merge to the main branch. Realtime sync, payments, AI, and background jobs are absent from the requirements, so nothing here provisions for them, and the deferred household invite needs no different foundation.

## Source Verification

Checked through Context7 before execution:

- `create-next-app` remains the documented Next.js starter. All configured flags (`--ts`, `--tailwind`, `--eslint`, `--app`, `--src-dir`, `--use-npm`) exist in the current CLI option list. The CLI now also writes `AGENTS.md` by default.
- OpenNext documents the Cloudflare path for a new Next.js app as `npm create cloudflare@latest -- <name> --framework=next --platform=workers`, with `@opennextjs/cloudflare build` and `deploy` for release.

Two drifts recorded, both requiring a catalog maintainer fix:

1. `bootstrap-config.md` maps `next` to a plain `create-next-app` command with no Cloudflare wiring. That command cannot serve the `cloudflare-workers` deployment target in the binding record. The user chose the documented Cloudflare command instead.
2. The documented OpenNext command fails on create-cloudflare 2.70.16: `Error: Unsupported framework: next` when `--platform=workers` is passed. The `next` template is Workers-only in this version, so the platform flag must be omitted. Documentation has not caught up.

One execution hazard worth recording: passing `-y` to create-cloudflare overrides the framework selection with C3's default category and silently produces a plain Workers SSR app rather than a Next.js project. The first attempt did exactly that and was discarded.

Environment notes: create-cloudflare aborted on the first run with `EACCES: permission denied, open '/home/pterodactorius/.config/.wrangler/metrics.json'`. Re-run with `CREATE_CLOUDFLARE_TELEMETRY_DISABLED=1`, `WRANGLER_SEND_METRICS=false`, and `HOME` plus `XDG_CONFIG_HOME` redirected into the scaffold directory.

## Scaffold Log

Resolved command, run inside `.synaptic-scaffold/`:

```bash
npm create cloudflare@latest -- noospheric-tally --framework=next --no-deploy --no-git
```

Exit status: 0. No `.git` directory was created, so no upstream history entered the project.

Produced stack: Next.js 16.2.11, React 19.1.7, Tailwind CSS 4, ESLint 9 with `eslint-config-next`, TypeScript 5.7.4, `@opennextjs/cloudflare` 1.19.9, Wrangler 4.118.0. Both `wrangler.jsonc` and `package.json` name the project `noospheric-tally`. Deploy scripts are `opennextjs-cloudflare build && opennextjs-cloudflare deploy`, with `preview` and `upload` variants and a `cf-typegen` script.

Files moved into the repository root, 13 paths, no conflicts and therefore no `.scaffold` siblings:

`src/`, `public/`, `README.md`, `package.json`, `package-lock.json`, `next.config.ts`, `open-next.config.ts`, `wrangler.jsonc`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `cloudflare-env.d.ts`, `.dev.vars`

`.vscode/settings.json` could not be moved (`Device or resource busy` under the sandbox) and was copied instead. Content is a single `files.associations` entry mapping `wrangler.json` to jsonc.

Ignore-file handling: 23 unique scaffold lines appended to the existing `.gitignore` after a `# from next` marker. No existing line was modified or removed.

The scaffold's own `node_modules/` was discarded rather than merged, because the repository already had a `node_modules/` directory. Dependencies were installed from the merged manifest instead.

Manifest amendment, approved by the user: `@pterodactor3000/silica-animus` ^0.3.2 was re-added as a dev dependency, since the deleted Vite `package.json` declared it and a clean install would otherwise prune the conventions package.

`npm install` added 640 packages and audited 641. Six packages had install scripts blocked by the npm allowScripts policy: `esbuild@0.25.4`, `esbuild@0.28.1`, `sharp@0.34.5`, `unrs-resolver@1.12.2`, `workerd@1.20260730.1`, and `@pterodactor3000/silica-animus@0.3.2`.

## Dependency Audit

Command: `npm audit --json`. Severity counts: critical 0, high 3, moderate 0, low 0, info 0.

High findings, all transitive through Next.js 16.2.11:

- `postcss` at or below 8.5.17: XSS via unescaped `</style>` in stringify output, arbitrary file read via attacker-controlled `sourceMappingURL`, and path traversal in source-map auto-loading.
- `sharp` below 0.35.0: inherited libvips vulnerabilities CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591.
- `next` in range 9.3.4-canary.0 to 16.3.0-preview.7, flagged as the parent of both.

npm reports the only available fix as `next@14.2.35`, a semver-major downgrade. No fix was applied, per the rite's no-automatic-fix rule. These are transitive dependencies of the framework, and the practical resolution is a Next.js patch release that bumps `postcss` and `sharp`.

## Hints Observed

Hints recorded in the binding record but not acted on by this rite:

- `deployment_target: cloudflare-workers`: the scaffold wires `@opennextjs/cloudflare` and Wrangler, but no Cloudflare account, worker route, or secret is configured.
- `ci_provider: github-actions` and `ci_default_flow: auto-deploy-on-merge`: no workflow file was created.
- `has_auth: true`: Supabase is not installed. `@supabase/supabase-js` and `@supabase/ssr` are still to be added, along with project URL and key environment variables.
- `team_size: solo`, `path_taken: standard`, `quality_override: false`: informational only.

## Next Actions

- Review any `.scaffold` sibling files. None were created in this run.
- Address dependency findings according to project risk tolerance. Three high-severity transitive findings await a Next.js patch release.
- Initialize repository history if needed. Git history already exists; the Vite template deletions and this scaffold are both uncommitted.
- Decide on the blocked install scripts. `workerd` and `esbuild` postinstall steps fetch platform binaries, and local `wrangler dev` or an OpenNext build may fail until they are approved with `npm install-scripts approve <pkg>`. The `@pterodactor3000/silica-animus` postinstall is what refreshes the conventions files.
- Remove `.synaptic-scaffold/` manually. Three `.vscode/settings.json` files under it could not be deleted from the sandbox (`Read-only file system`), leaving empty scaffold directories behind.
