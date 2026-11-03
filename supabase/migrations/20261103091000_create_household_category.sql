create function public.create_household_category(category_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  trimmed_name text := trim(category_name);
  new_category_id uuid;
begin
  if caller_id is null then
    raise exception 'create_household_category requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'create_household_category requires a household';
  end if;

  if trimmed_name is null
    or char_length(trimmed_name) < 1
    or char_length(trimmed_name) > 40 then
    raise exception 'create_household_category rejects a name outside 1 to 40 characters';
  end if;

  if lower(trimmed_name) in (
    'pet food',
    'food',
    'beauty',
    'other',
    'uncategorized'
  ) then
    raise exception 'create_household_category rejects a built-in category name'
      using errcode = '23505';
  end if;

  insert into public.household_categories (household_id, name)
  values (caller_household_id, trimmed_name)
  returning id into new_category_id;

  return new_category_id;
end;
$$;

revoke all on function public.create_household_category(text) from public, anon;
grant execute on function public.create_household_category(text) to authenticated;
