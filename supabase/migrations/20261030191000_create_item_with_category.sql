drop function public.create_item(text, text);

create function public.create_item(
  item_name text,
  item_barcode text,
  item_category text default 'uncategorized'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  new_item_id uuid;
  trimmed_name text := trim(item_name);
  trimmed_barcode text := trim(item_barcode);
begin
  if caller_id is null then
    raise exception 'create_item requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'create_item requires a household';
  end if;

  if trimmed_name is null or char_length(trimmed_name) = 0 then
    raise exception 'create_item rejects a blank item name';
  end if;

  if item_category is null
    or item_category not in (
      'pet-food',
      'food',
      'beauty',
      'other',
      'uncategorized'
    ) then
    raise exception 'create_item rejects an unknown category';
  end if;

  if exists (
    select 1 from public.item_barcodes
    where barcode = trimmed_barcode
  ) then
    raise exception 'create_item refuses a barcode that already exists';
  end if;

  insert into public.items (name)
  values (trimmed_name)
  returning id into new_item_id;

  insert into public.item_barcodes (item_id, barcode)
  values (new_item_id, trimmed_barcode);

  insert into public.household_inventory (household_id, item_id, name, category)
  values (caller_household_id, new_item_id, trimmed_name, item_category);

  return new_item_id;
end;
$$;

revoke all on function public.create_item(text, text, text) from public, anon;
grant execute on function public.create_item(text, text, text) to authenticated;
