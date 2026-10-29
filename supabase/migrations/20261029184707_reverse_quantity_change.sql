create function public.reverse_quantity_change(change_id uuid)
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
  returning inventory.quantity into new_quantity;

  if not found then
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
