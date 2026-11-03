create function public.rename_household_category(
  target_category_id uuid,
  new_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  trimmed_name text := trim(new_name);
  updated_id uuid;
begin
  if caller_id is null then
    raise exception 'rename_household_category requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'rename_household_category requires a household';
  end if;

  if trimmed_name is null
    or char_length(trimmed_name) < 1
    or char_length(trimmed_name) > 40 then
    raise exception 'rename_household_category rejects a name outside 1 to 40 characters';
  end if;

  if lower(trimmed_name) in (
    'pet food',
    'food',
    'beauty',
    'other',
    'uncategorized'
  ) then
    raise exception 'rename_household_category rejects a built-in category name'
      using errcode = '23505';
  end if;

  update public.household_categories
    set name = trimmed_name
  where id = target_category_id
    and household_id = caller_household_id
  returning id into updated_id;

  if updated_id is null then
    raise exception 'rename_household_category found no category'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.rename_household_category(uuid, text) from public, anon;
grant execute on function public.rename_household_category(uuid, text) to authenticated;
