# Share a Hab Unit Plan Brief

> Full plan: `context/changes/share-hab-unit/plan.md`
> Roadmap item: none. Linear TEC-53 (parent TEC-46), GitHub #52, PRD FR-011.

## What and Why

A member shares a hab unit so another person sees the same tally, items, and counts. The member generates a single-use invite code or link and hands it over. The recipient enters it and becomes a second member of the same hab unit. This delivers PRD FR-011, which the PRD and roadmap currently call deferred.

## Starting Point

Every read policy and every RPC already authorize through `household_members`, and nothing stores an owner. A second membership row would show the same tally with no change to reads or writes. Nothing can add one. `create_household` is the only insert, and `unique (user_id)` limits an account to one hab unit.

The delta is one table, two RPCs, a few app wrappers and actions, a share page, and a join form. The existing read and write paths stay as they are.

## Desired End State

A member opens `/hab-unit/share`, generates a code, and shares the code or link. A second person with no hab unit enters it on `/hab-unit/new`, lands on `/inventory`, and sees the same hab unit, tally, items, and counts. The code works once and for seven days. A person who already has a hab unit is refused and keeps it untouched.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Sharing mechanism | Single-use invite code or link, delivered by the member | No mail provider and no account lookup, so no email enumeration | User confirmation 2026-10-31 |
| Invite credential | SHA-256 hash only, 7-day expiry, single use, a new code replaces the unused one | A bearer credential must not be stored in the clear or live forever | User confirmation 2026-10-31 |
| Recipient with a hab unit | Refuse with a clear message, leave it untouched | `unique (user_id)` and PRD guardrail 2 | User confirmation 2026-10-31, research |
| Roles and owner | None. Any member may generate a code | All members are equal | PRD Access Control |
| Foundation text | Phase 4 corrects only the lines this feature makes false | Keeps the PRD and roadmap true to the code | User confirmation 2026-10-31 |
| Complexity | High | Authorization, a migration to a linked project, and a secret credential | User confirmation 2026-10-31 |

## Scope

**In scope:**

- A `household_invites` table and the `create_household_invite` and `accept_household_invite` RPCs
- Typed wrappers, a code validator, and two server actions
- A share page, a join form on `/hab-unit/new`, and a link on `/inventory`
- PRD and roadmap text corrections

**Out of scope:**

- Member lists, member removal, leaving a hab unit, and roles
- Email sending, account lookup, realtime, and moving or merging a recipient's hab unit
- TEC-47, TEC-48, TEC-49, TEC-50, TEC-52, TEC-54, bulk insert, and landing copy

## Approach

Follow `create_household`: `security definer` RPCs with `set search_path = ''`, an `auth.uid()` check, and grants to `authenticated` only. The database generates the code and returns it once. The app side reuses the wrapper, validator, server-action, and `useActionState` form patterns. The migration needs no extension.

## Phases at a Glance

| Phase | Deliverable | Key risk |
| --- | --- | --- |
| 1. Invite storage and join RPCs | Table, RLS with no policy, and two RPCs in one migration | The push changes the linked project, and there is no database test harness |
| 2. App wrappers, validation, and server actions | Code validator, two wrappers, two actions, and fixed copy | The invite code leaking into an error or a log |
| 3. Share page and join entry | `/hab-unit/share`, a join form, and an inventory link | The code is dropped by the sign-in redirect, so the recipient reopens the link |
| 4. Foundation text | PRD and roadmap corrected for FR-011 | Editing more than the false lines |

## Risks and Assumptions

- Only the manual two-account check proves the shared tally end to end, because the repository has no database test harness.
- The invite code is a bearer credential. Hashing, expiry, and single use are the controls, and the plaintext is never logged.
- One member can undo another member's change. PRD FR-009 accepted this for a single-user first version, and it is live now. It is not changed here.
- A second member sees changes on the next page load, because there is no realtime.
- Email confirmation stays off, so recipient accounts are unverified, as the sign-in plan assumed.

## Success Criteria

- A member can share a hab unit, and another person who joins sees the same tally, items, and counts.
- An invite works once and expires after 7 days. A replaced, used, expired, or garbled code is refused with a clear message.
- A person with a hab unit is refused and their hab unit is unchanged.
- `pnpm test`, `pnpm typecheck`, and `pnpm lint` pass, and the PRD and roadmap no longer call FR-011 deferred.
