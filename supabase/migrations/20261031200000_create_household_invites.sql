create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null
    references public.households(id) on delete cascade,
  code_hash bytea not null,
  created_by uuid not null
    references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz null,
  used_by uuid null
    references auth.users(id) on delete set null,
  constraint household_invites_code_hash_key unique (code_hash)
);

create unique index household_invites_one_unused_idx
  on public.household_invites (household_id)
  where used_at is null;

alter table public.household_invites enable row level security;

revoke all on table public.household_invites from anon, authenticated;

create function public.create_household_invite()
returns table (invite_code text, invite_expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  generated_code text;
begin
  if caller_id is null then
    raise exception 'create_household_invite requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'create_household_invite requires a hab unit';
  end if;

  delete from public.household_invites as invite
  where invite.household_id = caller_household_id
    and invite.used_at is null;

  generated_code := pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', '');
  invite_expires_at := pg_catalog.now() + interval '7 days';

  insert into public.household_invites (
    household_id,
    code_hash,
    created_by,
    expires_at
  )
  values (
    caller_household_id,
    pg_catalog.sha256(pg_catalog.convert_to(generated_code, 'UTF8')),
    caller_id,
    invite_expires_at
  );

  invite_code := generated_code;
  return next;
end;
$$;

revoke all on function public.create_household_invite() from public, anon;
grant execute on function public.create_household_invite() to authenticated;

create function public.accept_household_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_code text;
  found_invite_id uuid;
  found_household_id uuid;
  found_used_at timestamptz;
  found_expires_at timestamptz;
begin
  if caller_id is null then
    raise exception 'accept_household_invite requires an authenticated user';
  end if;

  normalized_code := pg_catalog.lower(trim(both from invite_code));

  if normalized_code is null
    or normalized_code !~ '^[0-9a-f]{32}$' then
    raise exception 'accept_household_invite rejects a malformed invite code';
  end if;

  if exists (
    select 1
    from public.household_members as membership
    where membership.user_id = caller_id
  ) then
    raise exception 'accept_household_invite refuses a caller who already has a hab unit';
  end if;

  select
    invite.id,
    invite.household_id,
    invite.used_at,
    invite.expires_at
  into
    found_invite_id,
    found_household_id,
    found_used_at,
    found_expires_at
  from public.household_invites as invite
  where invite.code_hash = pg_catalog.sha256(pg_catalog.convert_to(normalized_code, 'UTF8'))
  for update;

  if not found then
    raise exception 'accept_household_invite refuses an unknown invite code';
  end if;

  if found_used_at is not null then
    raise exception 'accept_household_invite refuses a used invite code';
  end if;

  if found_expires_at <= pg_catalog.now() then
    raise exception 'accept_household_invite refuses an expired invite code';
  end if;

  insert into public.household_members (household_id, user_id)
  values (found_household_id, caller_id);

  update public.household_invites as invite
  set
    used_at = pg_catalog.now(),
    used_by = caller_id
  where invite.id = found_invite_id;

  return found_household_id;
end;
$$;

revoke all on function public.accept_household_invite(text) from public, anon;
grant execute on function public.accept_household_invite(text) to authenticated;
