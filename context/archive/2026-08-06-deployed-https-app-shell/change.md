---
change_id: deployed-https-app-shell
title: Deployed HTTPS app shell
status: archived
created: 2026-08-06
updated: 2026-09-13
archived_at: 2026-09-13T09:36:44Z
---

## Notes

- 2026-08-06: Deployed the first production Worker at [noospheric-tally.eldritchcode-it.workers.dev](https://noospheric-tally.eldritchcode-it.workers.dev) (version `019c29b2-78ac-4fb4-8b7d-a28d2436265e`).
- Verified lint, typecheck, production build, Wrangler dry-run, HTTPS secure context, browser rendering at 390px, and no browser console errors.
- Pending completion: configure `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` as GitHub Actions secrets, merge the deployment workflow to `main`, then verify automatic redeployment.
