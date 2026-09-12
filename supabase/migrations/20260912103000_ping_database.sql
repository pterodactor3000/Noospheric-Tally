create function public.ping_database()
returns integer
language sql
stable
set search_path = ''
as $$
  select 1;
$$;

revoke all on function public.ping_database() from public;
grant execute on function public.ping_database() to anon, authenticated;
