/*create tables*/
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint household_name_length
    check (
      char_length(trim(name)) > 0
      and char_length(name) <= 80
    )
);

create table public.household_members (
  household_id uuid not null
    references public.households(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id),
  constraint household_member_user_id_key unique (user_id)
);

/*enable RLS*/
alter table public.households enable row level security;
alter table public.household_members enable row level security;

/*create policies*/
create policy household_members_select_own
  on public.household_members
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
  );

create policy households_select_if_member
  on public.households
  for select
  to authenticated
  using (
    exists (
      select 1 from public.household_members as membership
      where membership.household_id = public.households.id
        and membership.user_id = (select auth.uid())
    )
  );

/*create household function*/
create function public.create_household(household_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  new_household_id uuid;
  trimmed_name text := trim(household_name);
begin
  if caller_id is null then
    raise exception 'create_household requires an authenticated user';
  end if;

  if trimmed_name is null or char_length(trimmed_name) = 0 then
    raise exception 'create_household rejects a blank household name';
  end if;

  if exists(
    select 1 from public.household_members
    where user_id = caller_id
  ) then
    raise exception 'create_household refuses a second household for this account';
  end if;

  insert into public.households (name)
  values (trimmed_name)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id)
  values (new_household_id, caller_id);

  return new_household_id;
end;
$$;

revoke all on function public.create_household(text) from public;
grant execute on function public.create_household(text) to authenticated;