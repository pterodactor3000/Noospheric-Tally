create function public.create_item_without_barcode(item_name text)
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
begin
  if caller_id is null then
    raise exception 'create_item_without_barcode requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'create_item_without_barcode requires a household';
  end if;

  if trimmed_name is null or char_length(trimmed_name) = 0 then
    raise exception 'create_item_without_barcode rejects a blank item name';
  end if;

  insert into public.items (name)
  values (trimmed_name)
  returning id into new_item_id;

  insert into public.household_inventory (household_id, item_id, name)
  values (caller_household_id, new_item_id, trimmed_name);

  return new_item_id;
end;
$$;

revoke all on function public.create_item_without_barcode(text) from public, anon;
grant execute on function public.create_item_without_barcode(text) to authenticated;
