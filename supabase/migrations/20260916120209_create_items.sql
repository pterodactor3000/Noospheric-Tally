create table public.items (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz not null default now(),

  constraint name_length
    check (
      char_length(trim(name)) > 0
      and char_length(name) < 121
    )
);

create table public.item_barcodes (
  item_id uuid not null references public.items(id) on delete cascade,
  barcode text not null,
  created_at timestamptz not null default now(),
  primary key (item_id, barcode),
  constraint item_barcodes_barcode_key unique (barcode),
  constraint barcode_digits_length
    check (barcode ~ '^[0-9]{8,14}$')

);

create table public.household_inventory (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  name text not null,
  quantity integer not null default 0,
  created_at timestamptz not null default now(),
  constraint household_inventory_item_id_key unique (household_id, item_id),
  constraint item_name_length 
    check (
      char_length(trim(name)) > 0
      and char_length(name) <= 120
    )
);

alter table public.items enable row level security;
alter table public.item_barcodes enable row level security;
alter table public.household_inventory enable row level security;

create policy household_inventory_select_if_member
  on public.household_inventory
  for select
  to authenticated
  using (
    exists (
      select 1 from public.household_members as membership
      where membership.household_id = public.household_inventory.household_id
        and membership.user_id = (select auth.uid())
    )
  );

create function public.find_item_by_barcode(item_barcode text)
returns table (item_id uuid, canonical_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'find_item_by_barcode requires an authenticated user';
  end if;

  if not exists (
    select 1 from public.household_members
    where user_id = caller_id
  ) then
    raise exception 'find_item_by_barcode requires a household';
  end if;

  return query
  select
    barcode_row.item_id,
    item_row.name
  from public.item_barcodes as barcode_row
  inner join public.items as item_row
    on item_row.id = barcode_row.item_id
  where barcode_row.barcode = trim(item_barcode);
end;
$$;

revoke all on function public.find_item_by_barcode(text) from public;
grant execute on function public.find_item_by_barcode(text) to authenticated;

create function public.create_item(item_name text, item_barcode text)
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

  insert into public.household_inventory (household_id, item_id, name)
  values (caller_household_id, new_item_id, trimmed_name);

  return new_item_id;
end;
$$;

revoke all on function public.create_item(text, text) from public;
grant execute on function public.create_item(text, text) to authenticated;

create function public.add_item_to_household(target_item_id uuid, item_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  trimmed_name text := trim(item_name);
begin
  if caller_id is null then
    raise exception 'add_item_to_household requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'add_item_to_household requires a household';
  end if;

  if trimmed_name is null or char_length(trimmed_name) = 0 then
    raise exception 'add_item_to_household rejects a blank item name';
  end if;

  if not exists (
    select 1 from public.items
    where id = target_item_id
  ) then
    raise exception 'add_item_to_household rejects an unknown item';
  end if;

  if exists (
    select 1 from public.household_inventory
    where household_id = caller_household_id
      and item_id = target_item_id
  ) then
    raise exception 'add_item_to_household refuses an item this household already stocks';
  end if;

  insert into public.household_inventory (household_id, item_id, name)
  values (caller_household_id, target_item_id, trimmed_name);

  return target_item_id;
end;
$$;

revoke all on function public.add_item_to_household(uuid, text) from public;
grant execute on function public.add_item_to_household(uuid, text) to authenticated;

create function public.attach_barcode(target_item_id uuid, item_barcode text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_household_id uuid;
  trimmed_barcode text := trim(item_barcode);
begin
  if caller_id is null then
    raise exception 'attach_barcode requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'attach_barcode requires a household';
  end if;

  if not exists (
    select 1 from public.household_inventory
    where household_id = caller_household_id
      and item_id = target_item_id
  ) then
    raise exception 'attach_barcode refuses an item this household does not stock';
  end if;

  if exists (
    select 1 from public.item_barcodes
    where barcode = trimmed_barcode
  ) then
    raise exception 'attach_barcode refuses a barcode that already exists';
  end if;

  insert into public.item_barcodes (item_id, barcode)
  values (target_item_id, trimmed_barcode);

  return target_item_id;
end;
$$;

revoke all on function public.attach_barcode(uuid, text) from public;
grant execute on function public.attach_barcode(uuid, text) to authenticated;