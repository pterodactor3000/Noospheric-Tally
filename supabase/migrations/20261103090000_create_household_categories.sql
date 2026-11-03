create table public.household_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint household_categories_name_check
    check (
      char_length(name) between 1 and 40
      and name = trim(name)
    ),
  constraint household_categories_id_household_id_key unique (id, household_id)
);

create unique index household_categories_household_id_lower_name_idx
  on public.household_categories (household_id, lower(name));

alter table public.household_categories enable row level security;

create policy household_categories_select_if_member
  on public.household_categories
  for select
  to authenticated
  using (
    exists (
      select 1 from public.household_members as membership
      where membership.household_id = public.household_categories.household_id
        and membership.user_id = (select auth.uid())
    )
  );

alter table public.household_inventory
  add column custom_category_id uuid;

alter table public.household_inventory
  alter column category drop not null;

alter table public.household_inventory
  add constraint household_inventory_category_exactly_one
  check (num_nonnulls(category, custom_category_id) = 1);

alter table public.household_inventory
  add constraint household_inventory_custom_category_id_fkey
  foreign key (custom_category_id, household_id)
  references public.household_categories (id, household_id)
  on delete no action;
