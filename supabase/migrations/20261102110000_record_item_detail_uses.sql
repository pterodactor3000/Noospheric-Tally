-- A saved decrease on item details is a use, and it is not a scan.
-- scan_session_id and barcode stay null so the row is absent from scan sessions.

alter table public.household_quantity_changes
  alter column scan_session_id drop not null,
  alter column barcode drop not null;

create or replace function public.set_household_item_levels(
  target_item_id uuid,
  new_quantity integer,
  new_minimum_quantity integer,
  expected_quantity integer,
  expected_category text,
  new_category text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  removed_unit_count integer;
begin
  if caller_id is null then
    raise exception 'set_household_item_levels requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'set_household_item_levels requires a household';
  end if;

  if new_quantity is null or new_quantity < 0 or new_quantity > 99 then
    raise exception 'set_household_item_levels rejects a quantity outside 0 through 99';
  end if;

  if new_minimum_quantity is null
    or new_minimum_quantity < 0
    or new_minimum_quantity > 999 then
    raise exception 'set_household_item_levels rejects a minimum outside 0 through 999';
  end if;

  if expected_quantity is null then
    raise exception 'set_household_item_levels rejects a missing expected quantity';
  end if;

  if expected_category is null
    or expected_category not in (
      'pet-food',
      'food',
      'beauty',
      'other',
      'uncategorized'
    ) then
    raise exception 'set_household_item_levels rejects an unknown expected category';
  end if;

  if new_category is null
    or new_category not in (
      'pet-food',
      'food',
      'beauty',
      'other',
      'uncategorized'
    ) then
    raise exception 'set_household_item_levels rejects an unknown category';
  end if;

  update public.household_inventory as inventory
  set
    quantity = new_quantity,
    minimum_quantity = new_minimum_quantity,
    category = new_category
  where inventory.household_id = caller_household_id
    and inventory.item_id = target_item_id
    and inventory.quantity = expected_quantity
    and inventory.category = expected_category;

  if not found then
    if exists (
      select 1
      from public.household_inventory as inventory
      where inventory.household_id = caller_household_id
        and inventory.item_id = target_item_id
    ) then
      raise exception 'set_household_item_levels refuses a stale quantity or category'
        using errcode = 'serialization_failure';
    end if;

    raise exception 'set_household_item_levels refuses an item this household does not stock';
  end if;

  removed_unit_count := expected_quantity - new_quantity;

  if removed_unit_count > 0 then
    insert into public.household_quantity_changes (
      household_id,
      item_id,
      scan_session_id,
      barcode,
      quantity_delta
    )
    select
      caller_household_id,
      set_household_item_levels.target_item_id,
      null,
      null,
      -1
    from generate_series(1, removed_unit_count);
  end if;
end;
$$;

revoke all on function public.set_household_item_levels(uuid, integer, integer, integer, text, text) from public, anon;
grant execute on function public.set_household_item_levels(uuid, integer, integer, integer, text, text) to authenticated;
