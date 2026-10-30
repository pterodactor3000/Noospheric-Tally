alter table public.household_inventory
  add column minimum_quantity integer not null default 3;

alter table public.household_inventory
  add constraint household_inventory_minimum_quantity_range
  check (minimum_quantity between 0 and 999);

create function public.set_household_minimum_quantity(
  target_item_id uuid,
  new_minimum_quantity integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  stored_minimum_quantity integer;
begin
  if caller_id is null then
    raise exception 'set_household_minimum_quantity requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'set_household_minimum_quantity requires a household';
  end if;

  if new_minimum_quantity is null
    or new_minimum_quantity < 0
    or new_minimum_quantity > 999 then
    raise exception 'set_household_minimum_quantity rejects a minimum outside 0 through 999';
  end if;

  update public.household_inventory as inventory
  set minimum_quantity = new_minimum_quantity
  where inventory.household_id = caller_household_id
    and inventory.item_id = target_item_id
  returning inventory.minimum_quantity into stored_minimum_quantity;

  if not found then
    raise exception 'set_household_minimum_quantity refuses an item this household does not stock';
  end if;

  return stored_minimum_quantity;
end;
$$;

revoke all on function public.set_household_minimum_quantity(uuid, integer) from public, anon;
grant execute on function public.set_household_minimum_quantity(uuid, integer) to authenticated;
