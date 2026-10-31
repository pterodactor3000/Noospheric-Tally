create function public.create_items_bulk(items jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  new_item_id uuid;
  item_count integer;
  entry jsonb;
  trimmed_name text;
  trimmed_barcode text;
begin
  if caller_id is null then
    raise exception 'create_items_bulk requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'create_items_bulk requires a household';
  end if;

  if jsonb_typeof(items) is distinct from 'array' then
    raise exception 'create_items_bulk requires a JSON array of 1 to 500 items';
  end if;

  item_count := jsonb_array_length(items);

  if item_count < 1 or item_count > 500 then
    raise exception 'create_items_bulk requires a JSON array of 1 to 500 items';
  end if;

  for entry_index in 0 .. item_count - 1 loop
    entry := items -> entry_index;

    if jsonb_typeof(entry) is distinct from 'object' then
      raise exception 'create_items_bulk rejects index % because the entry is not an object', entry_index;
    end if;

    if jsonb_typeof(entry -> 'name') is distinct from 'string'
      or jsonb_typeof(entry -> 'barcode') is distinct from 'string' then
      raise exception 'create_items_bulk rejects index % because name and barcode must be strings', entry_index;
    end if;

    trimmed_name := trim(entry ->> 'name');
    trimmed_barcode := trim(entry ->> 'barcode');

    if trimmed_name is null
      or char_length(trimmed_name) < 1
      or char_length(trimmed_name) > 120 then
      raise exception 'create_items_bulk rejects index % because the name length must be 1 to 120', entry_index;
    end if;

    if trimmed_barcode is null
      or trimmed_barcode !~ '^[0-9]{8,14}$' then
      raise exception 'create_items_bulk rejects index % because the barcode must be 8 to 14 digits', entry_index;
    end if;

    if exists (
      select 1
      from public.item_barcodes
      where barcode = trimmed_barcode
    ) then
      raise exception 'create_items_bulk conflict at index % barcode %', entry_index, trimmed_barcode;
    end if;

    insert into public.items (name)
    values (trimmed_name)
    returning id into new_item_id;

    insert into public.item_barcodes (item_id, barcode)
    values (new_item_id, trimmed_barcode);

    insert into public.household_inventory (household_id, item_id, name, quantity)
    values (caller_household_id, new_item_id, trimmed_name, 1);
  end loop;

  return item_count;
end;
$$;

revoke all on function public.create_items_bulk(jsonb) from public, anon;
grant execute on function public.create_items_bulk(jsonb) to authenticated;
