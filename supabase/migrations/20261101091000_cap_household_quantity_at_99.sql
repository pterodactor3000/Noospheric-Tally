update public.household_inventory
set quantity = 99
where quantity > 99;

alter table public.household_inventory
  add constraint household_inventory_quantity_range
  check (quantity between 0 and 99);

create or replace function public.adjust_household_quantity(
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
    and (
      adjust_household_quantity.delta_quantity = -1
      or inventory.quantity + adjust_household_quantity.delta_quantity <= 99
    )
  returning inventory.quantity into new_quantity;

  if not found then
    if exists (
      select 1
      from public.household_inventory as inventory
      where inventory.household_id = caller_household_id
        and inventory.item_id = adjust_household_quantity.target_item_id
        and inventory.quantity = 0
        and adjust_household_quantity.delta_quantity = -1
    ) then
      raise exception 'adjust_household_quantity refuses a quantity below 0'
        using errcode = 'check_violation';
    end if;

    if exists (
      select 1
      from public.household_inventory as inventory
      where inventory.household_id = caller_household_id
        and inventory.item_id = adjust_household_quantity.target_item_id
        and inventory.quantity >= 99
        and adjust_household_quantity.delta_quantity = 1
    ) then
      raise exception 'adjust_household_quantity refuses a quantity above 99'
        using errcode = 'numeric_value_out_of_range';
    end if;

    raise exception 'adjust_household_quantity refuses an item this household does not stock';
  end if;

  return new_quantity;
end;
$$;

revoke all on function public.adjust_household_quantity(uuid, integer) from public, anon;
grant execute on function public.adjust_household_quantity(uuid, integer) to authenticated;

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
end;
$$;

revoke all on function public.set_household_item_levels(uuid, integer, integer, integer, text, text) from public, anon;
grant execute on function public.set_household_item_levels(uuid, integer, integer, integer, text, text) to authenticated;

create or replace function public.increment_household_quantity(
  item_barcode text,
  scan_session_id uuid
)
returns table (change_id uuid, quantity integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  found_item_id uuid;
  trimmed_barcode text := trim(item_barcode);
begin
  if caller_id is null then
    raise exception 'increment_household_quantity requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'increment_household_quantity requires a household';
  end if;

  if increment_household_quantity.scan_session_id is null then
    raise exception 'increment_household_quantity requires a scan session id';
  end if;

  select barcode_row.item_id
    into found_item_id
  from public.item_barcodes as barcode_row
  where barcode_row.barcode = trimmed_barcode;

  if found_item_id is null then
    raise exception 'increment_household_quantity refuses a barcode this household does not stock';
  end if;

  with updated_inventory as (
    update public.household_inventory as inventory
    set quantity = inventory.quantity + 1
    where inventory.household_id = caller_household_id
      and inventory.item_id = found_item_id
      and inventory.quantity < 99
    returning inventory.household_id, inventory.item_id, inventory.quantity
  ),
  inserted_change as (
    insert into public.household_quantity_changes
      (household_id, item_id, scan_session_id, barcode, quantity_delta)
    select
      updated_inventory.household_id,
      updated_inventory.item_id,
      increment_household_quantity.scan_session_id,
      trimmed_barcode,
      1
    from updated_inventory
    returning id
  )
  select inserted_change.id, updated_inventory.quantity
    into change_id, quantity
  from inserted_change
  cross join updated_inventory;

  if not found then
    if exists (
      select 1
      from public.household_inventory as inventory
      where inventory.household_id = caller_household_id
        and inventory.item_id = found_item_id
    ) then
      raise exception 'increment_household_quantity refuses a quantity above 99'
        using errcode = 'numeric_value_out_of_range';
    end if;

    raise exception 'increment_household_quantity refuses a barcode this household does not stock';
  end if;

  return next;
end;
$$;

revoke all on function public.increment_household_quantity(text, uuid) from public, anon;
grant execute on function public.increment_household_quantity(text, uuid) to authenticated;

create or replace function public.reverse_quantity_change(change_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  change_row_item_id uuid;
  change_row_delta integer;
  change_row_reversed_at timestamptz;
  new_quantity integer;
begin
  if caller_id is null then
    raise exception 'reverse_quantity_change requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'reverse_quantity_change requires a household';
  end if;

  select change_row.item_id, change_row.quantity_delta, change_row.reversed_at
    into change_row_item_id, change_row_delta, change_row_reversed_at
  from public.household_quantity_changes as change_row
  where change_row.id = reverse_quantity_change.change_id
    and change_row.household_id = caller_household_id
  for update;

  if not found then
    raise exception 'reverse_quantity_change refuses a change this household did not record';
  end if;

  if change_row_reversed_at is not null then
    raise exception 'reverse_quantity_change refuses a change that is already reversed';
  end if;

  update public.household_inventory as inventory
  set quantity = inventory.quantity - change_row_delta
  where inventory.household_id = caller_household_id
    and inventory.item_id = change_row_item_id
    and inventory.quantity - change_row_delta >= 0
    and inventory.quantity - change_row_delta <= 99
  returning inventory.quantity into new_quantity;

  if not found then
    if exists (
      select 1
      from public.household_inventory as inventory
      where inventory.household_id = caller_household_id
        and inventory.item_id = change_row_item_id
        and inventory.quantity - change_row_delta > 99
    ) then
      raise exception 'reverse_quantity_change refuses a quantity above 99'
        using errcode = 'numeric_value_out_of_range';
    end if;

    raise exception 'reverse_quantity_change refuses a quantity below 0'
      using errcode = 'check_violation';
  end if;

  update public.household_quantity_changes as change_row
  set reversed_at = now()
  where change_row.id = reverse_quantity_change.change_id;

  return new_quantity;
end;
$$;

revoke all on function public.reverse_quantity_change(uuid) from public, anon;
grant execute on function public.reverse_quantity_change(uuid) to authenticated;
