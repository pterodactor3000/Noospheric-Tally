# Noospheric Tally

Home inventory web app. Scan a barcode to add or subtract stock of consumables (cooking staples, pet food) so counts stay trustworthy at the moment of change.

Built with [Next.js](https://nextjs.org) and deployed to Cloudflare via [OpenNext](https://opennext.js.org/cloudflare).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edit `src/app/page.tsx` and the page updates as you save.

## Supabase environment and Auth

Household sign-in needs a Supabase project. Copy [`.env.example`](./.env.example) to `.env.local` for Next.js, and set the same names in [`.dev.vars`](./.dev.vars) for Wrangler/OpenNext local runs:

- `NEXT_PUBLIC_SUPABASE_URL`: Project URL from Supabase → Project Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon / publishable key from the same page

These values are public client config. Do not introduce a service role key in this app.

Production Worker runtime reads them from the `vars` block in [`wrangler.jsonc`](./wrangler.jsonc). CI needs the same names as GitHub Actions repository secrets so `worker:check` and `worker:deploy` can inline them at build time:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Before building auth UI, set these Auth dashboard options:

1. Disable email confirmation (password sign-up must land in a session immediately).
2. Site URL: `https://noospheric-tally.eldritchcode-it.workers.dev`
3. If the redirect allowlist is enforced for password auth, include `http://localhost:3000`

## Verification

Run the checks shared by local development and CI:

```bash
npm run lint
npm run typecheck
npm run worker:check
```

`worker:check` builds the OpenNext Worker and runs a non-publishing Wrangler deployment validation.

## Local Cloudflare preview

Run against the Cloudflare runtime locally:

```bash
npm run preview
```

Open [http://127.0.0.1:8787](http://127.0.0.1:8787) after the preview starts.

## First production deploy

No custom domain is required for this foundation. The first successful deploy provides a Cloudflare-managed `*.workers.dev` HTTPS URL.

Live deployment: [https://noospheric-tally.eldritchcode-it.workers.dev](https://noospheric-tally.eldritchcode-it.workers.dev)

1. Enable the `workers.dev` subdomain for the intended Cloudflare account.
2. Authenticate interactively with `npx wrangler login`.
3. Publish the Worker:

```bash
npm run deploy
```

1. Save the URL printed by Wrangler and verify it from a phone over HTTPS.

## Continuous deployment

[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) deploys every push to `main`, and can also run manually from the Actions tab. Configure these repository secrets before the first workflow run:

- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account that owns the Worker.
- `CLOUDFLARE_API_TOKEN`: account-scoped token with Cloudflare Workers Scripts edit permission for that account.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: see [Supabase environment and Auth](#supabase-environment-and-auth).

The workflow installs scoped packages with GitHub's short-lived `GITHUB_TOKEN` and `packages: read` permission. If the package is not accessible through that token, configure a `GH_PACKAGES_TOKEN` repository secret with package-read access.

For local installation against GitHub Packages, copy [`.npmrc.example`](./.npmrc.example) to `.npmrc`. Keep the resulting credential file untracked and provide `NODE_AUTH_TOKEN` through your environment or credential manager.

## Project context

Product and planning docs live under `context/foundation/`:

- `prd.md` - product requirements
- `roadmap.md` - ordered vertical slices
- `tech-stack.md` - stack decisions
- `shape-notes.md` - discovery notes

## Contributing

Engineering conventions (naming, TypeScript, testing, security) and commit message format are in [`AGENTS.md`](./AGENTS.md).

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <imperative summary>
```

Examples: `feat(auth): add session cookie validation`, `fix(db): prevent double-count on concurrent tally writes`.
