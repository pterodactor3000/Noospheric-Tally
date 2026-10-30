create policy item_barcodes_select_if_member
  on public.item_barcodes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.household_inventory as inventory
      inner join public.household_members as membership
        on membership.household_id = inventory.household_id
      where inventory.item_id = public.item_barcodes.item_id
        and membership.user_id = (select auth.uid())
    )
  );
