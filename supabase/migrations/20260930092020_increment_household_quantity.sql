create function public.increment_household_quantity(item_barcode text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  found_item_id uuid;
  new_quantity integer;
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

  select barcode_row.item_id
    into found_item_id
  from public.item_barcodes as barcode_row
  where barcode_row.barcode = trimmed_barcode;

  if found_item_id is null then
    raise exception 'increment_household_quantity refuses a barcode this household does not stock';
  end if;

  update public.household_inventory
  set quantity = quantity + 1
  where household_id = caller_household_id
    and item_id = found_item_id
  returning quantity into new_quantity;

  if not found then
    raise exception 'increment_household_quantity refuses a barcode this household does not stock';
  end if;

  return new_quantity;
end;
$$;

revoke all on function public.increment_household_quantity(text) from public;
grant execute on function public.increment_household_quantity(text) to authenticated;