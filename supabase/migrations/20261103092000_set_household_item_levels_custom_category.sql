-- An item stores either a built-in category or one custom category of this hab unit.
-- A missing custom category, including one from another hab unit, is a stale save.

drop function public.set_household_item_levels(uuid, integer, integer, integer, text, text);

create function public.set_household_item_levels(
  target_item_id uuid,
  new_quantity integer,
  new_minimum_quantity integer,
  expected_quantity integer,
  expected_category text,
  expected_custom_category_id uuid,
  new_category text,
  new_custom_category_id uuid
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

  if num_nonnulls(expected_category, expected_custom_category_id) <> 1
    or (
      expected_category is not null
      and expected_category not in (
        'pet-food',
        'food',
        'beauty',
        'other',
        'uncategorized'
      )
    ) then
    raise exception 'set_household_item_levels rejects an unknown category';
  end if;

  if num_nonnulls(new_category, new_custom_category_id) <> 1
    or (
      new_category is not null
      and new_category not in (
        'pet-food',
        'food',
        'beauty',
        'other',
        'uncategorized'
      )
    ) then
    raise exception 'set_household_item_levels rejects an unknown category';
  end if;

  if new_custom_category_id is not null then
    perform 1
    from public.household_categories as category
    where category.id = new_custom_category_id
      and category.household_id = caller_household_id
    for share;

    if not found then
      raise exception 'set_household_item_levels refuses a stale quantity or category'
        using errcode = 'serialization_failure';
    end if;
  end if;

  update public.household_inventory as inventory
  set
    quantity = new_quantity,
    minimum_quantity = new_minimum_quantity,
    category = new_category,
    custom_category_id = new_custom_category_id
  where inventory.household_id = caller_household_id
    and inventory.item_id = target_item_id
    and inventory.quantity = expected_quantity
    and inventory.category is not distinct from expected_category
    and inventory.custom_category_id is not distinct from expected_custom_category_id;

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

revoke all on function public.set_household_item_levels(uuid, integer, integer, integer, text, uuid, text, uuid) from public, anon;
grant execute on function public.set_household_item_levels(uuid, integer, integer, integer, text, uuid, text, uuid) to authenticated;
