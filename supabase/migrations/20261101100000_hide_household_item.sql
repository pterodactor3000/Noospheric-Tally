create function public.hide_household_item(target_item_id uuid)
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
    raise exception 'hide_household_item requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'hide_household_item requires a household';
  end if;

  if target_item_id is null then
    raise exception 'hide_household_item rejects a missing item id';
  end if;

  delete from public.household_inventory as inventory
  where inventory.household_id = caller_household_id
    and inventory.item_id = hide_household_item.target_item_id;
end;
$$;

revoke all on function public.hide_household_item(uuid) from public, anon;
grant execute on function public.hide_household_item(uuid) to authenticated;
