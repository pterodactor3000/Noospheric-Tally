---
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
---

## Why this stack

The PRD defines a mobile-first web app for one signed-in household, sixteen requirements deep, built solo in about four weeks of after-hours work. Next.js is the vetted JavaScript default for that product type and passes all four agent-friendly quality gates: TypeScript by default, strong conventions, dominant popularity in its family, and current authoritative documentation. One deployable unit covers the scanning interface and the server work behind sign-in, per-item minimums, and the outbound catalog lookup for unknown barcodes, so the budget is not spent wiring a separate API. Supabase is the data store, supplying hosted Postgres for households, items, and recorded quantity changes, plus the authentication FR-001 requires; the `@supabase/ssr` package carries cookie-based sessions into server components and middleware. Cloudflare Workers is the deployment target through the `@opennextjs/cloudflare` adapter, chosen after verification showed the catalog's `cloudflare-pages` entry no longer matches documented practice for new Next.js apps. GitHub Actions deploys on merge to the main branch. Realtime sync, payments, AI, and background jobs are absent from the requirements, so nothing here provisions for them, and the deferred household invite needs no different foundation.
