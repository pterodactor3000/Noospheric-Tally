create function public.delete_household_category(target_category_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
begin
  if caller_id is null then
    raise exception 'delete_household_category requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'delete_household_category requires a household';
  end if;

  perform 1
  from public.household_categories as category
  where category.id = target_category_id
    and category.household_id = caller_household_id
  for update;

  if not found then
    raise exception 'delete_household_category found no category'
      using errcode = 'P0002';
  end if;

  update public.household_inventory as inventory
    set
      category = 'uncategorized',
      custom_category_id = null
  where inventory.household_id = caller_household_id
    and inventory.custom_category_id = target_category_id;

  delete from public.household_categories as category
  where category.id = target_category_id
    and category.household_id = caller_household_id;
end;
$$;

revoke all on function public.delete_household_category(uuid) from public, anon;
grant execute on function public.delete_household_category(uuid) to authenticated;
