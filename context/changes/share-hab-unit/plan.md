# Share a Hab Unit Implementation Plan

## Overview

A member shares a hab unit by generating a single-use invite code or link and handing it to another person. That person signs in, enters the code, and becomes a second member of the same hab unit. They then see the same tally, items, and counts. This is Linear TEC-53 (parent TEC-46), GitHub issue #52, and it delivers PRD FR-011. It has no roadmap item. The PRD and roadmap list FR-011 as deferred and parked, so Phase 4 corrects that text.

The hab unit is the household in the database. The UI says hab-unit. The identifiers `household_*` stay unchanged.

## Current State Analysis

- A hab unit is a `households` row. Membership is a separate `household_members` table with `primary key (household_id, user_id)` and `unique (user_id)` (`supabase/migrations/20260816083017_create_households.sql:13-21`, constraint at `:20`). One account belongs to at most one hab unit.
- `household_members_select_own` lets a member read only their own membership row (`20260816083017_create_households.sql:28-34`). `households_select_if_member` lets a member read the hab unit they belong to (`:36-47`).
- Tally, items, and counts live in `household_inventory` (`household_id`, `item_id`, `name`, `quantity`) (`supabase/migrations/20260916120209_create_items.sql:24-37`). `minimum_quantity` and `category` are later columns (`20261030055001_add_household_minimum_quantity.sql:1-6`, `20261030190000_add_household_inventory_category.sql`). `items` and `item_barcodes` are global product identity.
- Every read policy and every RPC authorizes through membership: `household_inventory_select_if_member` (`20260916120209_create_items.sql:43-53`), `item_barcodes_select_if_member` (`20261030084022_item_barcodes_select_if_member.sql:1-13`), `household_quantity_changes_select_if_member` (`20261029182809_create_household_quantity_changes.sql:27-37`). The RPCs resolve the caller's hab unit with `select membership.household_id … where membership.user_id = caller_id`, for example `increment_household_quantity` (`:58-61`) and `reverse_quantity_change` (`20261029184707_reverse_quantity_change.sql:19-22,28-33`). Nothing stores an owner, so all members are already equal, as the PRD requires (`context/foundation/prd.md:50-52`). A second `household_members` row for the same hab unit therefore gives that person the same tally, items, and counts with no change to any read or write path.
- The only insert into `household_members` is in `create_household` (`20260816083017_create_households.sql:79`), which refuses a second hab unit for the account (`:72`). No code path adds a second member. That is the only gap.
- `loadCurrentHabUnit` selects `households` with `.maybeSingle()` and lets RLS return the one row (`src/lib/hab-unit/load-current-hab-unit.ts:11-15`). `requireCurrentHabUnit` redirects a user with no hab unit to `/hab-unit/new` (`src/lib/helpers/requireCurrentHabUnit.ts:4-9`). `/hab-unit/new` redirects back to `/inventory` when a hab unit exists (`src/app/hab-unit/new/page.tsx:12-17`).
- Password sign-up lands in a session immediately (`src/app/(auth)/actions.ts:123-151`) because email confirmation stays off (`README.md:38`). A new person therefore passes through `/hab-unit/new` before they have a hab unit.
- `/hab-unit` and everything under it is already a protected path (`src/lib/auth/isProtectedPath.ts:1`). A signed-out visitor is redirected to `/login`, and the query string is dropped.
- RPC wrapper pattern: an injected client with an `rpc` method, `unknown` data narrowed by a guard, and an error that names the operation and attaches `cause` (`src/lib/items/increment-hab-unit-quantity.ts:8-58`). Tests use a client stub (`src/lib/items/increment-hab-unit-quantity.test.ts:12-31`). Validators return a `valid` or `invalid` union (`src/lib/hab-unit/validate-hab-unit-name.ts:1-30`). Server actions return a discriminated error and `redirect` on success (`src/app/hab-unit/actions.ts:11-50`). Forms use `useActionState` with `FormAlert` (`src/app/hab-unit/new/hab-unit-name-form.tsx:31-80`). DB names live in `src/lib/db/entities.ts`.
- There is no database test harness: no `supabase/tests` and no local `supabase/config.toml`. Migrations apply to the linked project with `pnpm exec supabase db push` (`README.md:42-51`). `pnpm exec supabase db push --dry-run` lists pending migrations without applying them.
- There is no realtime (`context/foundation/tech-stack.md`, `has_realtime: false`) and no mail provider. A second member sees current data on page load.
- `reverse_quantity_change` is scoped to the hab unit, so one member can undo another member's change. PRD FR-009 accepted that risk for a single-user first version (`prd.md:138`). This change makes it live. It is accepted and not changed here.

## Desired End State

A member opens `/hab-unit/share`, presses Generate, and sees an invite code, an invite link, and the expiry. A second person signs up, opens the link or pastes the code on `/hab-unit/new`, and lands on `/inventory`. They see the same hab unit name, tally, items, and counts as the first member. Either member's scan, adjustment, or minimum change shows for the other on the next page load. The code works once and for seven days. A person who already has a hab unit sees a refusal and keeps their hab unit untouched.

Verify with two real accounts, as in Manual Testing Steps.

## What We're NOT Doing

- Member lists, member removal, leaving a hab unit, and roles. No policy on `household_members` changes. A member cannot see other members.
- Sending email, any mail provider, and looking up another account by email.
- Moving, merging, or deleting a recipient's existing hab unit. A recipient who already has one is refused.
- Realtime sync and push updates.
- Changing any read policy, any existing RPC, or `undo` behavior.
- TEC-47, TEC-48, TEC-49, TEC-50, TEC-52, TEC-54, bulk insert, and landing copy.
- Preserving the invite code through the sign-in redirect. A signed-out visitor who opens the link is sent to `/login`, signs up or in, and reopens the link or pastes the code.
- Editing `context/foundation/tech-stack.md`. Its line about a deferred household invite stays as written.

## Implementation Approach

Add the smallest membership write path that fits the existing model. A new table holds invites. Two `security definer` RPCs, written in the style of `create_household`, create an invite for the caller's hab unit and let a signed-in person with no hab unit accept one. The app side follows the existing wrapper, validator, server-action, and form patterns. The tally, items, and counts need no change, because RLS and every RPC already authorize through membership.

The design is a bearer-credential invite, so the plan fixes its rules:

- **Hashing.** The database generates the code. Only its SHA-256 hash is stored, as `bytea` in `household_invites.code_hash`. The plaintext is returned once by `create_household_invite` and never stored or logged.
- **Expiry.** `expires_at` is `now() + interval '7 days'`, set by the database. `accept_household_invite` refuses a code when `expires_at <= now()`.
- **Single use.** Accepting sets `used_at` and `used_by` in the same transaction that inserts the membership row. A used invite is refused.
- **Replacement.** `create_household_invite` deletes the hab unit's unused invites before it inserts a new one. A partial unique index allows one unused invite per hab unit.

## Critical Implementation Details

**Plaintext code never leaves the create path.** Do not put the code, in full or in part, in an error message, a `console.error` payload, a thrown `cause`, a redirect URL, or a log line. Error messages for the accept path name the operation and say that an invite code was supplied. The coding standards ask for the input in error messages. The secret rule overrides that for this value.

**No client access to invites.** `household_invites` has RLS enabled and no policy. The migration also revokes all table privileges from `anon` and `authenticated`. Only the two `security definer` RPCs touch the table.

**Code generation without an extension.** Build the code from `replace(gen_random_uuid()::text, '-', '')`, which gives 32 lowercase hex characters with 122 random bits. Hash it with `sha256(convert_to(code, 'UTF8'))`. Both are built in, so the migration needs no `pgcrypto` and no `extensions` schema. The functions use `set search_path = ''`, so built-ins resolve through `pg_catalog` and every table is schema-qualified.

**Accept order.** Check in this order: authenticated, well-formed code, caller has no hab unit, invite exists (row locked `for update`), not used, not expired. Only then insert the membership and mark the invite used. A caller who already has a hab unit is refused before the invite lookup, so a refused call never consumes a code.

**Failure to message mapping.** The RPCs raise distinct messages. The wrapper in Phase 2 maps each to a reason. The reasons are `malformed`, `already-has-hab-unit`, `unknown`, `used`, and `expired`. Any other error is thrown, not mapped. The action turns each reason into fixed copy, and an unmapped failure into one generic message with no database text.

**Applying the migration touches the linked project.** `pnpm exec supabase db push` changes the shared database. The parent asks the user before it pushes. Phase 1 verification uses `--dry-run` first.

## Phase 1: Invite storage and join RPCs

### Overview

Add the invite table and the two RPCs in one migration. No TypeScript changes. No change to an existing table, policy, or function.

### Changes Required

#### 1. Invite table, policies, and RPCs

**File:** `supabase/migrations/20261031200000_create_household_invites.sql` (new)

**Intent:** Give a member a way to create an invite for their own hab unit, and give a signed-in person with no hab unit a way to accept one. Keep the credential hashed, expiring, and single use.

**Contract:**

- Table `public.household_invites`: `id uuid primary key default gen_random_uuid()`, `household_id uuid not null references public.households(id) on delete cascade`, `code_hash bytea not null`, `created_by uuid not null references auth.users(id) on delete cascade`, `created_at timestamptz not null default now()`, `expires_at timestamptz not null`, `used_at timestamptz null`, `used_by uuid null references auth.users(id) on delete set null`. A unique constraint on `code_hash`. A partial unique index `household_invites_one_unused_idx` on `(household_id)` where `used_at is null`.
- Row level security is enabled with no policy. `revoke all on table public.household_invites from anon, authenticated`.
- `public.create_household_invite()` returns `table (invite_code text, invite_expires_at timestamptz)`. The output column names differ from table columns so plpgsql does not read them as ambiguous.
  - It requires `auth.uid()` and a membership row. It raises `create_household_invite requires an authenticated user` or `create_household_invite requires a hab unit`.
  - It deletes the caller's hab unit invites where `used_at is null`. It generates the code, stores `sha256(convert_to(code, 'UTF8'))` and `expires_at = now() + interval '7 days'`, and returns the plaintext code and the expiry once.
  - Any member may call it. There is no owner check, because all members are equal (`prd.md:50-52`).
- `public.accept_household_invite(invite_code text)` returns `uuid`, the joined hab unit id.
  - It raises the following messages. The wrapper in Phase 2 matches them as text:
    - `accept_household_invite requires an authenticated user`
    - `accept_household_invite rejects a malformed invite code`, for input that does not match `^[0-9a-f]{32}$` after trim and lowercase
    - `accept_household_invite refuses a caller who already has a hab unit`
    - `accept_household_invite refuses an unknown invite code`
    - `accept_household_invite refuses a used invite code`
    - `accept_household_invite refuses an expired invite code`
  - It follows the accept order in Critical Implementation Details. On success it inserts `household_members (household_id, user_id)` and sets `used_at = now()` and `used_by = caller_id` on that invite, in one transaction.
  - It never changes or reads another hab unit's data, and it never touches a hab unit the caller already belongs to.
- Both functions use `language plpgsql`, `security definer`, and `set search_path = ''`. Both run `revoke all … from public, anon` and `grant execute … to authenticated`, as in `20260816083017_create_households.sql:86-87`.
- Existing migrations, policies, and functions stay unchanged.

### Success Criteria

#### Automated Verification

- `pnpm exec supabase db push --dry-run` lists `20261031200000_create_household_invites.sql` as the only pending migration and reports no error.
- `pnpm test` passes unchanged.

#### Manual Verification

- After the user approves the push, `pnpm exec supabase db push` applies the migration, and the Supabase dashboard shows `household_invites` with row level security enabled and zero policies.
- In the SQL editor, `select has_function_privilege('anon', 'public.create_household_invite()', 'execute')` and the same query for `public.accept_household_invite(text)` both return `false`, and the `authenticated` role returns `true` for both.

---

## Phase 2: App wrappers, validation, and server actions

### Overview

Add the typed boundary between the app and the two RPCs, a code validator, and two server actions. No page changes. The actions are reachable only from code until Phase 3.

### Changes Required

#### 1. Database names

**File:** `src/lib/db/entities.ts`

**Intent:** Name the two new RPCs in one place, as the existing functions are named.

**Contract:** Add `DB_FUNCTION_CREATE_HOUSEHOLD_INVITE = 'create_household_invite'` and `DB_FUNCTION_ACCEPT_HOUSEHOLD_INVITE = 'accept_household_invite'`, and export both. Add no table constant, because the app never queries `household_invites`.

#### 2. Invite code validator

**File:** `src/lib/hab-unit/validate-hab-unit-invite-code.ts` (new), `src/lib/hab-unit/validate-hab-unit-invite-code.test.ts` (new)

**Intent:** Reject a malformed code at the system boundary, before an RPC call.

**Contract:** Export `validateHabUnitInviteCode(code: string)`, which returns `{ status: 'valid', code }` or `{ status: 'invalid', message }`, in the shape of `validate-hab-unit-name.ts:1-30`. It trims, lowercases, and requires `^[0-9a-f]{32}$`. The valid result carries the normalized code. The message is `Invite code is not valid. Check it and try again.` The tests cover an empty string, whitespace only, uppercase input that normalizes, 31 and 33 characters, a non-hex character, and a valid code with surrounding spaces.

#### 3. Create wrapper

**File:** `src/lib/hab-unit/create-hab-unit-invite.ts` (new), `src/lib/hab-unit/create-hab-unit-invite.test.ts` (new)

**Intent:** Call `create_household_invite` through an injected client and return a typed result.

**Contract:** Export `createHabUnitInvite(client)`, which returns `{ inviteCode: string, expiresAt: string }`. The client interface and the `unknown` guard follow `increment-hab-unit-quantity.ts:8-58`. It reads the single-row array and requires `invite_code` as a string and `invite_expires_at` as a string. A bad shape or an rpc error throws an error that names `create_household_invite`, attaches `cause`, and contains no code. The tests cover a successful row, an rpc error with `cause`, an empty array, a row with a missing field, and a row with a non-string field.

#### 4. Accept wrapper

**File:** `src/lib/hab-unit/accept-hab-unit-invite.ts` (new), `src/lib/hab-unit/accept-hab-unit-invite.test.ts` (new)

**Intent:** Call `accept_household_invite` and turn each expected refusal into a typed reason, while a real failure still throws.

**Contract:** Export `acceptHabUnitInvite(inviteCode, client)`, which returns a discriminated union: `{ status: 'joined', habUnitId: string }` or `{ status: 'refused', reason: 'malformed' | 'already-has-hab-unit' | 'unknown' | 'used' | 'expired' }`. A refusal is detected by matching the raised message text from Phase 1. An rpc error with any other message, or a success whose data is not a string, throws an error that names `accept_household_invite` and attaches `cause`. The message and the `cause` never include the code. The tests cover a successful join, each of the five refusals, an unrelated rpc error that throws, and a non-string result that throws.

#### 5. Server actions

**File:** `src/app/hab-unit/actions.ts`

**Intent:** Expose the create and accept paths to the UI, with validation at the boundary and fixed user copy.

**Contract:**

- Extend `HabUnitActionError.field` to `'name' | 'code'`.
- Add `createHabUnitInvite()`. It builds the client with `createClient` from `@/lib/supabase/server`, calls the wrapper, and returns `{ status: 'created', inviteCode, expiresAt }`. A thrown error is logged with `console.error('Create hab-unit invite failed.', { error })`, which carries no code, and the action returns `{ status: 'error', message: CREATE_HAB_UNIT_INVITE_FAILURE_MESSAGE }`.
- Add `joinHabUnit(formData)`. It reads `code` as a string, runs `validateHabUnitInviteCode`, and returns an error with `field: 'code'` on an invalid result. On `joined` it calls `redirect('/inventory')`. On `refused` it returns `{ status: 'error', message, field: 'code' }` with the copy below. A thrown error is logged with `console.error('Join hab-unit failed.', { error })` and returns the generic failure message. Neither log carries the code.
- Fixed copy:
  - `malformed`: `Invite code is not valid. Check it and try again.`
  - `unknown`: `Invite code was not found. Check it and try again.`
  - `expired`: `Invite code expired. Ask the member for a new one.`
  - `used`: `Invite code was already used. Ask the member for a new one.`
  - `already-has-hab-unit`: `This account already has a hab unit. Leaving a hab unit is not supported yet.`
  - join failure: `Joining the hab unit failed. Try again.`
  - create failure: `Invite code creation failed. Try again.`
- `createHabUnit` and its constants stay unchanged.

### Success Criteria

#### Automated Verification

- `pnpm test` passes and includes the new validator, create wrapper, and accept wrapper tests.
- `pnpm typecheck` passes.
- `pnpm lint` passes.

#### Manual Verification

- Read the diff and confirm that no error message, thrown `cause`, `console.error` payload, or redirect URL contains the invite code, and that only the `createHabUnitInvite` action result returns the plaintext code.

---

## Phase 3: Share page and join entry

### Overview

Add the page where a member generates an invite, and the join form where the invited person enters it. Link the share page from the inventory. After this phase, a second person can join and see the same tally.

### Changes Required

#### 1. Invite link builder

**File:** `src/lib/hab-unit/build-hab-unit-invite-url.ts` (new), `src/lib/hab-unit/build-hab-unit-invite-url.test.ts` (new)

**Intent:** Build the invite link in one pure function.

**Contract:** Export `buildHabUnitInviteUrl(origin: string, inviteCode: string)`, which returns `${origin}/hab-unit/new?code=${encodeURIComponent(inviteCode)}`. It is pure. The tests cover an origin without a trailing slash, an origin with one trailing slash (removed before joining), and a code that needs no encoding.

#### 2. Share page

**File:** `src/app/hab-unit/share/page.tsx` (new), `src/app/hab-unit/share/share-hab-unit-form.tsx` (new)

**Intent:** Let any member generate an invite and read it.

**Contract:**

- `page.tsx` is a server component. It calls `requireCurrentUser` then `requireCurrentHabUnit`, and renders `ShareHabUnitForm` in the `pageShell`, `contentWidth`, and `panel` classes from `src/app/styles/class-names.ts`. It includes a link back to `/inventory`, because `BackToInventoryLink` shows only for paths that start with `/inventory/` (`src/components/back-to-inventory-link.tsx:9-10`).
- `share-hab-unit-form.tsx` is a client component that follows `hab-unit-name-form.tsx`. A `Generate invite code` button runs `createHabUnitInvite` through `useActionState`. A created result shows the code and the link in two read-only inputs, the expiry, and this text: the code works once, expires in 7 days, and replaces any earlier unused code.
- The link is built with `buildHabUnitInviteUrl(window.location.origin, inviteCode)` after the action returns. The code is held in action state only. It never appears in this page's URL.
- An error result shows through `FormAlert`. The page offers no member list, no revoke control, and no copy button.

#### 3. Join entry

**File:** `src/app/hab-unit/new/page.tsx`, `src/app/hab-unit/new/join-hab-unit-form.tsx` (new)

**Intent:** Let a signed-in person with no hab unit enter an invite code before they create a hab unit of their own.

**Contract:**

- `page.tsx` reads `searchParams` as a `Promise` with a `code` value, as `src/app/inventory/scan/page.tsx:24-38` does. A string value prefills the join form. Any other value gives an empty field. Before writing this page, read the page and `searchParams` guide under `node_modules/next/dist/docs/`, as `AGENTS.md` directs.
- The page renders `JoinHabUnitForm` above `HabUnitNameForm` in the existing `panel`, with a `Separator` between them. The existing redirect to `/inventory` when a hab unit exists (`page.tsx:15-17`) stays, so a person with a hab unit never sees the form.
- `join-hab-unit-form.tsx` is a client component. It uses `useActionState` around `joinHabUnit`, an `h2` heading in `sectionHeading` (the existing form owns the `h1`), one labeled input `name="code"` with `id="invite-code"` and `autoComplete="off"`, a `FormAlert`, and a submit button. A `field: 'code'` error sets `aria-invalid` on the input. `HabUnitNameForm` and `createHabUnit` stay unchanged.
- `isProtectedPath` already covers `/hab-unit` and `/hab-unit/share`, so it needs no edit.

#### 4. Inventory entry point

**File:** `src/app/inventory/page.tsx`

**Intent:** Give a member a way to reach the share page.

**Contract:** After the existing action grid, add one centered `Button` with `variant="link"` rendered as a `Link` to `/hab-unit/share`, with the text `Share hab unit`. The four existing buttons, the grid, and the tally stay unchanged.

### Success Criteria

#### Automated Verification

- `pnpm test` passes and includes the `buildHabUnitInviteUrl` tests.
- `pnpm typecheck` passes.
- `pnpm lint` passes.

#### Manual Verification

- With a signed-in member, `/inventory` shows `Share hab unit`, and it opens `/hab-unit/share`. Generate shows a code, a link, and an expiry. Generating a second time shows a different code.
- A second account that has no hab unit opens the invite link while signed in, sees the code prefilled on `/hab-unit/new`, submits, lands on `/inventory`, and sees the same hab unit name, tally, items, and counts as the first member.
- A change by either member (a `[+]` press or a scan) shows for the other member after a page reload.
- The same code entered again by a third account shows `Invite code was already used. Ask the member for a new one.`
- A code replaced by a newer one shows `Invite code was not found. Check it and try again.`, because the replaced invite no longer exists.
- An account that already has a hab unit cannot reach the join form. A direct call with a valid code returns `This account already has a hab unit. Leaving a hab unit is not supported yet.`, and that account's hab unit is unchanged.
- A garbled code shows `Invite code is not valid. Check it and try again.`

---

## Phase 4: Foundation text

### Overview

Correct the PRD and roadmap lines that this feature makes false. Change documentation only. Do not add a roadmap slice.

### Changes Required

#### 1. PRD

**File:** `context/foundation/prd.md`

**Intent:** Record FR-011 as delivered and drop the text that calls it deferred.

**Contract:**

- In Access Control, change `The wife can be invited to the same household later, and sees the same inventory.` (`prd.md:50`) to say the wife can be invited to the same household with a single-use invite code, and sees the same inventory.
- FR-011 and its Challenge (`prd.md:144-146`): keep the requirement text. Replace the Challenge with a note that the requirement is delivered by change `share-hab-unit`, with an invite code that is hashed, single use, and valid for 7 days, and that a person who already has a hab unit is refused.
- Remove the non-goal line `Inviting other people to the household (FR-011).` (`prd.md:212`).
- Remove Open Question 1 about when FR-011 is delivered (`prd.md:221`) and renumber the remaining questions.
- Add one line to the resolved list that records FR-011 as delivered.
- Leave the sentences that explain why the secondary success criterion was replaced (`prd.md:66` and the resolved line at `prd.md:232`), because they record a past decision. Leave the rest of the PRD unchanged.

#### 2. Roadmap

**File:** `context/foundation/roadmap.md`

**Intent:** Remove the parked entry and the open question that this feature closes, and leave a note that it shipped outside the roadmap.

**Contract:**

- Remove the Parked entry `Inviting another person to the household (FR-011)` (`roadmap.md:264`).
- Remove Open Roadmap Question 1 about when the household invite is delivered (`roadmap.md:258`) and renumber the remaining questions.
- Add one bullet under `## Done` that says FR-011 (invite another person to the household) was delivered outside the roadmap by change `share-hab-unit` (Linear TEC-53), with no slice.
- Add no row to `## At a glance` and no slice section. `context/foundation/tech-stack.md` stays unchanged.

### Success Criteria

#### Automated Verification

- `rg -n "FR-011" context/foundation/prd.md context/foundation/roadmap.md` returns only lines that say FR-011 is delivered, plus the two PRD lines that explain why the secondary criterion was replaced.
- `rg -n "Inviting (another person|other people) to the household" context/foundation/prd.md context/foundation/roadmap.md` returns no match under a non-goal or Parked heading.
- `git diff --name-only` for this phase lists only `context/foundation/prd.md` and `context/foundation/roadmap.md`.

#### Manual Verification

- Read the PRD Open Questions and the roadmap Open Roadmap Questions. Neither lists the household invite, and the remaining questions are numbered from 1 with no gap.
- Read the roadmap Parked section and the PRD Non-Goals. Neither lists the household invite.

---

## Testing Strategy

### Unit Tests

- Invite code validator: empty, whitespace only, uppercase that normalizes, 31 and 33 characters, a non-hex character, and a valid code with surrounding spaces.
- Create wrapper: a valid row, an rpc error with `cause`, an empty array, and a row with a missing or non-string field. No error text contains a code.
- Accept wrapper: a successful join, each of the five refusal reasons, an unrelated error that throws with `cause`, and a non-string result that throws. No error text contains the code.
- Invite URL builder: no trailing slash, one trailing slash, and a code with no characters that need encoding.

### Integration Tests

- None automated. The repository has no database test harness. The two-account manual check in Phase 3 covers the cross-boundary behavior: membership insert, RLS, shared tally, single use, replacement, and refusal.

### Manual Testing Steps

1. Sign in as account A with a hab unit that has several items and counts. Open `/hab-unit/share` from `/inventory` and generate a code. Note the code, the link, and the expiry.
2. Sign up as account B in a separate browser profile. If the link was opened before sign-up, you land on `/login` with the code dropped. Open the link again after sign-up.
3. Confirm `/hab-unit/new` shows the code prefilled. Submit it. Confirm B lands on `/inventory` with A's hab unit name, tally, items, and counts.
4. As B, press `[+]` on one item. Reload as A. Confirm the new count.
5. As account C, enter the same code. Confirm the used-code message.
6. As A, generate a second code, then generate a third. Enter the second as a new account D. Confirm the unknown-code message. Enter the third as D. Confirm D joins.
7. As an account that already has a hab unit, post a valid code through the join action. Confirm the refusal message and that nothing changed in that hab unit.

## Migration and Rollback

The migration is additive. It adds one table and two functions and changes no existing object, so existing reads and writes keep working if the migration is applied and the app is not.

Roll back with a new migration that drops `public.accept_household_invite(text)`, `public.create_household_invite()`, and `public.household_invites`. A membership row that an accepted invite created stays after that rollback, because it is ordinary membership data. Remove such a row by hand if a rollback needs to undo a join.

`pnpm exec supabase db push` modifies the linked project. The parent confirms with the user before the push.

## References

- Roadmap: `context/foundation/roadmap.md` (no roadmap ID; Parked entry and Open Roadmap Question 1 corrected in Phase 4)
- PRD: `context/foundation/prd.md` (FR-011, FR-009, Access Control `:50-52`, Non-Goals `:212`, Open Question 1 `:221`)
- Linear TEC-53 (parent TEC-46); GitHub https://github.com/pterodactor3000/Noospheric-Tally/issues/52
- `supabase/migrations/20260816083017_create_households.sql:13-21,28-47,49-87`
- `supabase/migrations/20260916120209_create_items.sql:24-37,43-53`
- `supabase/migrations/20261029182809_create_household_quantity_changes.sql:27-37,58-61`
- `supabase/migrations/20261029184707_reverse_quantity_change.sql:19-33`
- `supabase/migrations/20261030084022_item_barcodes_select_if_member.sql:1-13`
- `src/lib/hab-unit/load-current-hab-unit.ts:11-15`
- `src/lib/hab-unit/validate-hab-unit-name.ts:1-30`
- `src/lib/helpers/requireCurrentHabUnit.ts:4-9`
- `src/lib/items/increment-hab-unit-quantity.ts:8-58` and its test `:12-31`
- `src/lib/auth/isProtectedPath.ts:1`
- `src/lib/db/entities.ts`
- `src/app/hab-unit/actions.ts:11-50`
- `src/app/hab-unit/new/page.tsx:11-30`, `src/app/hab-unit/new/hab-unit-name-form.tsx:31-80`
- `src/app/inventory/page.tsx` (action grid), `src/app/inventory/scan/page.tsx:24-38` (`searchParams` shape)
- `src/components/back-to-inventory-link.tsx:9-10`, `src/components/form-alert.tsx`
- `package.json` scripts: `test`, `lint`, `typecheck`
- `README.md:38,42-51`

## Progress

> `- [ ]` is pending and `- [x]` is complete. Append a commit SHA when a step lands.

### Phase 1: Invite storage and join RPCs

#### Automated

- [x] 1.1 `pnpm exec supabase db push --dry-run` lists `20261031200000_create_household_invites.sql` as the only pending migration and reports no error. e9e5b44
- [x] 1.2 `pnpm test` passes unchanged. e9e5b44

#### Manual

- [x] 1.3 After the user approves the push, `pnpm exec supabase db push` applies the migration, and the Supabase dashboard shows `household_invites` with row level security enabled and zero policies. e9e5b44
- [x] 1.4 `has_function_privilege` returns `false` for `anon` and `true` for `authenticated` on both `public.create_household_invite()` and `public.accept_household_invite(text)`. e9e5b44

### Phase 2: App wrappers, validation, and server actions

#### Automated

- [x] 2.1 `pnpm test` passes and includes the new validator, create wrapper, and accept wrapper tests. daeb5ea
- [x] 2.2 `pnpm typecheck` passes. daeb5ea
- [x] 2.3 `pnpm lint` passes. daeb5ea

#### Manual

- [x] 2.4 The diff shows no error message, thrown `cause`, `console.error` payload, or redirect URL that contains the invite code, and only the `createHabUnitInvite` action result returns the plaintext code. daeb5ea

### Phase 3: Share page and join entry

#### Automated

- [x] 3.1 `pnpm test` passes and includes the `buildHabUnitInviteUrl` tests. 070c87e
- [x] 3.2 `pnpm typecheck` passes. 070c87e
- [x] 3.3 `pnpm lint` passes. 070c87e

#### Manual

- [ ] 3.4 A signed-in member sees `Share hab unit` on `/inventory`, it opens `/hab-unit/share`, Generate shows a code, a link, and an expiry, and a second Generate shows a different code
- [ ] 3.5 A second account with no hab unit opens the invite link, sees the code prefilled on `/hab-unit/new`, submits, lands on `/inventory`, and sees the same hab unit name, tally, items, and counts
- [ ] 3.6 A change by either member shows for the other member after a page reload
- [ ] 3.7 The same code entered by a third account shows `Invite code was already used. Ask the member for a new one.`
- [ ] 3.8 A replaced code shows `Invite code was not found. Check it and try again.`
- [ ] 3.9 An account that already has a hab unit cannot reach the join form, and a direct call with a valid code returns the already-has-a-hab-unit message and leaves that hab unit unchanged
- [ ] 3.10 A garbled code shows `Invite code is not valid. Check it and try again.`

### Phase 4: Foundation text

#### Automated

- [x] 4.1 `rg -n "FR-011" context/foundation/prd.md context/foundation/roadmap.md` returns only lines that say FR-011 is delivered, plus the two PRD lines that explain why the secondary criterion was replaced. a2859c0. The kept requirement at prd.md:144 also matches, as the phase contract requires.
- [x] 4.2 `rg -n "Inviting (another person|other people) to the household" context/foundation/prd.md context/foundation/roadmap.md` returns no match under a non-goal or Parked heading. a2859c0
- [x] 4.3 `git diff --name-only` for this phase lists only `context/foundation/prd.md` and `context/foundation/roadmap.md`. a2859c0

#### Manual

- [x] 4.4 Neither the PRD Open Questions nor the roadmap Open Roadmap Questions lists the household invite, and the remaining questions are numbered from 1 with no gap. a2859c0
- [x] 4.5 Neither the roadmap Parked section nor the PRD Non-Goals lists the household invite. a2859c0
