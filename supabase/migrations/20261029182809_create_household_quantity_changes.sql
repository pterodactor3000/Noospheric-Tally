alter table public.household_inventory
  add constraint household_inventory_quantity_not_negative
  check (quantity >= 0);

create table public.household_quantity_changes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  scan_session_id uuid not null,
  barcode text not null,
  quantity_delta integer not null,
  created_at timestamptz not null default now(),
  reversed_at timestamptz null,
  constraint household_quantity_changes_quantity_delta_check
    check (quantity_delta in (-1, 1)),
  constraint household_quantity_changes_inventory_fkey
    foreign key (household_id, item_id)
    references public.household_inventory (household_id, item_id)
    on delete cascade
);

create index household_quantity_changes_scan_session_id_created_at_idx
  on public.household_quantity_changes (scan_session_id, created_at desc);

alter table public.household_quantity_changes enable row level security;

create policy household_quantity_changes_select_if_member
  on public.household_quantity_changes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.household_members as membership
      where membership.household_id = public.household_quantity_changes.household_id
        and membership.user_id = (select auth.uid())
    )
  );

create function public.increment_household_quantity(
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
    raise exception 'increment_household_quantity refuses a barcode this household does not stock';
  end if;

  return next;
end;
$$;

revoke all on function public.increment_household_quantity(text, uuid) from public, anon;
grant execute on function public.increment_household_quantity(text, uuid) to authenticated;

create function public.decrement_household_quantity(
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
    raise exception 'decrement_household_quantity requires an authenticated user';
  end if;

  select membership.household_id
    into caller_household_id
  from public.household_members as membership
  where membership.user_id = caller_id;

  if caller_household_id is null then
    raise exception 'decrement_household_quantity requires a household';
  end if;

  if decrement_household_quantity.scan_session_id is null then
    raise exception 'decrement_household_quantity requires a scan session id';
  end if;

  select barcode_row.item_id
    into found_item_id
  from public.item_barcodes as barcode_row
  where barcode_row.barcode = trimmed_barcode;

  if found_item_id is null then
    raise exception 'decrement_household_quantity refuses a barcode this household does not stock';
  end if;

  with updated_inventory as (
    update public.household_inventory as inventory
    set quantity = inventory.quantity - 1
    where inventory.household_id = caller_household_id
      and inventory.item_id = found_item_id
      and inventory.quantity > 0
    returning inventory.household_id, inventory.item_id, inventory.quantity
  ),
  inserted_change as (
    insert into public.household_quantity_changes
      (household_id, item_id, scan_session_id, barcode, quantity_delta)
    select
      updated_inventory.household_id,
      updated_inventory.item_id,
      decrement_household_quantity.scan_session_id,
      trimmed_barcode,
      -1
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
      raise exception 'decrement_household_quantity refuses a quantity below 0';
    end if;

    raise exception 'decrement_household_quantity refuses a barcode this household does not stock';
  end if;

  return next;
end;
$$;

revoke all on function public.decrement_household_quantity(text, uuid) from public, anon;
grant execute on function public.decrement_household_quantity(text, uuid) to authenticated;
