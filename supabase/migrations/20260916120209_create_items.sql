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
  constraint barcode_length (
    check (
      char_length(trim(name)) >= 8
      and char_length(name) <= 14
    )
  )
);

create table public.household_inventory (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  name text not null,
  quantity integer not null default 0,
  created_at timestamptz not null default now(),
  constraint household_inventory_item_id_key unique (household_id, item_id)
  constraint item_name_length (
    check (
      char_length(trim(name)) > 0
      and char_length(name) <= 120
    )
  )
);