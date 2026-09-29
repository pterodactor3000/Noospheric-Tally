<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: household-sign-in Phase 5

Change: household-sign-in · Scope: phase 5 · Date: 2026-08-19 · Sealed: 2026-08-23
Grounding: plan `context/changes/household-sign-in/plan.md` Phase 5; `plan-brief.md`; `change.md`; `lessons.md` absent. Commits `311e4fc`, `7d66815`, `60f672b`, `46c4478`, `bc48644`; proxy `24a6476` for the original Worker gate. Current files: `src/app/(auth)/actions.ts`, `validateCredentials.ts`, `validateCredentials.test.ts`, `login/page.tsx`, `signup/page.tsx`, `(auth)/layout.tsx`, `src/app/inventory/page.tsx`, `src/components/sign-out-button.tsx`, `src/lib/supabase/server.ts`, `src/middleware.ts`. Final commands: `npm test` 10/10 pass; `npm run lint` exit 0; `npm run typecheck` exit 0; `npm run worker:check` exit 0.

Core auth contract is present: `"use server"` FormData actions, pure `validateCredentials`, six named tests, login/signup forms with labels, `autoComplete`, inline `role="alert"`, cross-links, layout redirect via `loadCurrentUser` / `getUser`, mapped errors with no raw Supabase text. Sign-out exists as an inventory form, not `SignOutButton.tsx`. Next compile listed `/login` and `/signup`. Out of scope (reset, OAuth, PKCE, magic links) is absent from `src/`.

## Verdicts

| Dimension | Verdict |
| --- | --- |
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety and Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

## Findings

### F1: Worker build rejects Node.js `proxy.ts`
- **Severity:** CRITICAL
- **Impact:** HIGH
- **Dimension:** Success Criteria
- **Location:** `src/proxy.ts:1-48` (introduced `24a6476`; Phase 4 Progress 4.2 is checked)
- **Detail:** Phase 5 criterion 5.2 requires `worker:check` to exit zero. `next build` compiled `/`, `/inventory`, `/login`, `/signup`, then OpenNext `@opennextjs/cloudflare@1.20.2` aborted: `Node.js middleware is not currently supported. Consider switching to Edge Middleware.` Next.js 16 `proxy.ts` is Node-only and cannot set an Edge runtime. The adapter still treats it as Node middleware. Slice cannot dry-run deploy. Auth routes are not the compile failure. `context/changes/household-sign-in/research.md` already required Edge middleware on this stack.
- **Fix:** Keep request protection on an Edge-capable `middleware.ts` (or equivalent Edge entry) that OpenNext 1.20.2 will bundle, and re-run `pnpm worker:check` until it exits 0. Do not treat 5.2 or 4.2 as complete while this error remains.
- **Decision:** FIXED
- **Resolution:** Restored Edge `src/middleware.ts` (`middleware` export, matcher unchanged, `runtime = 'experimental-edge'`). Deleted `src/proxy.ts`. `npm test` 10/10; lint exit 0; typecheck exit 0; `npm run worker:check` exit 0 (OpenNext bundled middleware). Next.js warns that the middleware filename is deprecated in favor of proxy; that warning is accepted so the Worker build can complete. Progress 5.2 checked.
- **Alternative:** Drop the request proxy and gate only with `loadCurrentUser()` in protected pages.
  - **Strength:** Removes the OpenNext Node-middleware blocker with no adapter wait.
  - **Tradeoff:** Session cookie refresh on the request path goes away. Stale cookies rely on server-component `getUser` only.
  - **Confidence:** medium
  - **Blind Spot:** `@supabase/ssr` without a `getAll`/`setAll` request interceptor is a known refresh footgun on Workers.

### F2: Planned `SignOutButton.tsx` is missing
- **Severity:** WARNING
- **Impact:** LOW
- **Dimension:** Plan Adherence
- **Location:** missing `src/components/SignOutButton.tsx`; substitute `src/app/inventory/page.tsx:25-31`
- **Detail:** Phase 5 item 5 requires a form component that submits to `signOut` with no browser Supabase client. Inventory inlines that form. Behavior matches. Planned module is absent.
- **Fix:** Extract the inventory form into `src/components/SignOutButton.tsx` and import it from the protected page.
- **Decision:** ACCEPTED
- **Resolution:** User extracted the inline form to `src/components/sign-out-button.tsx` and imports `SignOutButton` from the inventory page. Behavior matches the planned contract. Kebab-case filename is accepted as a deliberate local alternative to the planned `SignOutButton.tsx`.

### F3: `signOut` ignores Supabase errors and always redirects
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Safety and Quality
- **Location:** `src/app/(auth)/actions.ts:132-137`
- **Detail:** `await supabase.auth.signOut()` is unchecked. On failure the action still `revalidatePath` and `redirect('/')`. The UI looks signed out while cookies can remain valid, so `/inventory` stays reachable.
- **Fix:** Read `{ error }` from `signOut()`. Log the operation on failure. Return a discriminated error (or rethrow after log). Redirect to `/` only after a successful sign-out.
- **Decision:** FIXED
- **Resolution:** `signOut()` checks `{ error }`, logs failures server-side, and returns without redirecting. `revalidatePath` and `redirect('/')` run only on success, outside any catch. The action returns `Promise<void>` as required by the React form action contract.

### F4: Auth actions have no try/catch around Supabase I/O
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Safety and Quality
- **Location:** `src/app/(auth)/actions.ts:72-137`
- **Detail:** Team convention requires try/catch on async I/O. `createClient()` and Auth calls sit outside try/catch. Network or env throws bypass `mapSupabaseAuthError` and can surface as an unhandled server-action failure instead of `{ status: "error"; message }`.
- **Fix:** Wrap each action body. Log the operation name. Return a generic user-facing error. Do not echo `error.message`.
- **Decision:** FIXED
- **Resolution:** try/catch around `createClient` and Auth calls in `signInWithPassword`, `signUpWithPassword`, and `signOut`. Catches log the operation (email on sign-in/up, never password). Sign-in/up return generic user-facing messages; sign-out has no error region, so it logs and returns `void`. `redirect` stays after catch. Sign-up Auth errors again go through `mapSupabaseAuthError(error.message)` with the generic case swapped to `SIGN_UP_FAILURE_MESSAGE`.

### F5: Server client `setAll` swallows cookie-write failures
- **Severity:** WARNING
- **Impact:** MEDIUM
- **Dimension:** Safety and Quality
- **Location:** `src/lib/supabase/server.ts:18-25`
- **Detail:** Phase 1 contracted a getAll-only server client. `311e4fc` added `setAll` so sign-in/sign-up can persist cookies from server actions (needed). The empty `catch` violates "no empty catch blocks" and can hide a failed cookie write. Auth then redirects to `/inventory` with no session.
- **Fix:** Log a named error in `catch` (`setSupabaseAuthCookies failed`). For server actions, treat a cookie-write failure as an auth error and return the generic mapped message instead of redirecting.
- **Decision:** FIXED
- **Resolution:** `setAll` now catches `unknown` and logs `setSupabaseAuthCookies failed` while preserving the RSC-safe swallow. Removed the unused second callback parameter. Verification: tests 10/10, lint exit 0, typecheck exit 0.

### F6: Unused UI modules landed with Phase 5
- **Severity:** WARNING
- **Impact:** LOW
- **Dimension:** Scope Discipline
- **Location:** `src/components/ui/field.tsx`, `input-group.tsx`, `textarea.tsx`, `separator.tsx`
- **Detail:** Auth forms use `button`, `input`, and `label` only. `field.tsx` (313 lines) and `separator.tsx` arrived in `bc48644`. `input-group.tsx` and `textarea.tsx` arrived in `7d66815`. Nothing under `src/app` imports them. Landing `src/app/page.tsx` also gained sign-in/sign-up links (Phase 6 contract). Those links are the reachable entry for 5.3, so they are extra but justified. The unused atoms are not.
- **Fix:** Remove unused `field`, `input-group`, `textarea`, and `separator` from this slice. Keep `button`/`input`/`label` and the landing auth links.
- **Decision:** ACCEPTED
- **Resolution:** User accepted the low-impact scope risk. The four unused UI modules remain.

### F7: Manual 5.3–5.8 are unchecked and unverified
- **Severity:** OBSERVATION
- **Impact:** MEDIUM
- **Dimension:** Success Criteria
- **Location:** `plan.md` Progress 5.1–5.8
- **Detail:** 5.1 is evidenced here (`npm test` 10/10, including credential cases). F1 fixed 5.2. User attested that live and phone criteria 5.3–5.8 pass on 2026-08-23.
- **Fix:** After F1, run 5.3–5.8 on the live URL, then check the rows with the landing SHA. Do not check 5.2 until `worker:check` exits 0.
- **Decision:** FIXED
- **Resolution:** Checked 5.1 from automated evidence. Checked 5.3–5.8 from user attestation dated 2026-08-23. All Phase 5 progress rows are complete.

### F8: Sign-up maps "already registered" to a distinct email error
- **Severity:** OBSERVATION
- **Impact:** LOW
- **Dimension:** Safety and Quality
- **Location:** `src/app/(auth)/actions.ts:41-46`, `118-125`
- **Detail:** Sign-in always returns `AUTH_FAILURE_MESSAGE`. Sign-up returns `EMAIL_ALREADY_REGISTERED_MESSAGE` with `field: "email"` when the message includes `already registered`. That distinguishes registered emails. The plan did not require hiding this. Acceptable for a single-household MVP.
- **Fix:** Keep as accepted risk, or map duplicate registration to the same generic sign-up failure string.
- **Decision:** ACCEPTED
- **Resolution:** User restored the duplicate-specific registration message after triage. The low-impact email-enumeration risk is accepted for this single-household MVP.

## Overall verdict

APPROVED after triage. F1, F3–F5, and F7 FIXED. F2, F6, and F8 ACCEPTED as low-impact alternatives or risks. All Phase 5 automated and user-verified manual criteria pass.
