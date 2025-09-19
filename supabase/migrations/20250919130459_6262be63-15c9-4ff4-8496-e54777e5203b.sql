-- 1) Add Clerk column + index first
alter table public.company_access
  add column if not exists clerk_user_id text;

create index if not exists idx_company_access_clerk_user
  on public.company_access (clerk_user_id);

-- 2) Create basic helper functions first (in correct dependency order)
create or replace function current_clerk_id()
returns text
language sql
security invoker
stable
set search_path = ''
as $$
  select auth.jwt() ->> 'sub';
$$;

create or replace function role_meets(min_role text, actual_role text)
returns boolean
language sql
security invoker
stable
set search_path = ''
as $$
  with ladder as (
    select array['user','manager','admin']::text[] as r
  )
  select case
    when min_role is null then true
    else coalesce(array_position((select r from ladder), actual_role), 0)
       >= coalesce(array_position((select r from ladder), min_role), 999)
  end;
$$;