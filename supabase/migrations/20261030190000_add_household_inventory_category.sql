alter table public.household_inventory
  add column category text not null default 'uncategorized';

alter table public.household_inventory
  add constraint household_inventory_category_values
  check (
    category in ('pet-food', 'food', 'beauty', 'other', 'uncategorized')
  );
