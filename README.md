# Noospheric Tally

Home inventory web app. Scan a barcode to add or subtract stock of consumables (cooking staples, pet food) so counts stay trustworthy at the moment of change.

Built with [Next.js](https://nextjs.org) and deployed to Cloudflare via [OpenNext](https://opennext.js.org/cloudflare).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edit `app/page.tsx` and the page updates as you save.

## Preview

Run against the Cloudflare runtime locally:

```bash
npm run preview
```

## Deploy

```bash
npm run deploy
```

## Project context

Product and planning docs live under `context/foundation/`:

- `prd.md` - product requirements
- `roadmap.md` - ordered vertical slices
- `tech-stack.md` - stack decisions
- `shape-notes.md` - discovery notes

## Contributing

Engineering conventions (naming, TypeScript, testing, security) and commit message format are in [`AGENTS.md`](./AGENTS.md).

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <imperative summary>
```

Examples: `feat(auth): add session cookie validation`, `fix(db): prevent double-count on concurrent tally writes`.
