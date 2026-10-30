create function public.adjust_household_quantity(
  target_item_id uuid,
  delta_quantity integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  new_quantity integer;
begin
  if caller_id is null then
    raise exception 'adjust_household_quantity requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'adjust_household_quantity requires a household';
  end if;

  if adjust_household_quantity.delta_quantity is null
    or adjust_household_quantity.delta_quantity not in (-1, 1) then
    raise exception 'adjust_household_quantity rejects a delta other than -1 or 1';
  end if;

  update public.household_inventory as inventory
  set quantity = inventory.quantity + adjust_household_quantity.delta_quantity
  where inventory.household_id = caller_household_id
    and inventory.item_id = adjust_household_quantity.target_item_id
    and inventory.quantity + adjust_household_quantity.delta_quantity >= 0
  returning inventory.quantity into new_quantity;

  if not found then
    if exists (
      select 1
      from public.household_inventory as inventory
      where inventory.household_id = caller_household_id
        and inventory.item_id = adjust_household_quantity.target_item_id
    ) then
      raise exception 'adjust_household_quantity refuses a quantity below 0'
        using errcode = 'check_violation';
    end if;

    raise exception 'adjust_household_quantity refuses an item this household does not stock';
  end if;

  return new_quantity;
end;
$$;

revoke all on function public.adjust_household_quantity(uuid, integer) from public, anon;
grant execute on function public.adjust_household_quantity(uuid, integer) to authenticated;
