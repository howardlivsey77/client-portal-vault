-- 3) Now create functions that depend on the basic ones
create or replace function user_has_company_access_clerk(company uuid, min_role text default null)
returns boolean
language sql
security invoker
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_access ca
    where ca.company_id = company
      and ca.clerk_user_id = (select current_clerk_id())
      and role_meets(min_role, ca.role)
  );
$$;

-- 4) Update existing functions to work with Clerk
create or replace function public.get_user_companies_clerk()
returns table(id uuid, name text, role text)
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  clerk_id text := current_clerk_id();
  user_is_admin boolean := false;
begin
  -- Check if user is super admin
  begin
    select coalesce(p.is_admin, false) into user_is_admin
    from public.profiles p 
    where p.id = auth.uid();
    
    if not found then
      user_is_admin := false;
    end if;
  exception 
    when others then
      user_is_admin := false;
  end;
  
  -- If user is super admin, return all companies with 'admin' role
  if user_is_admin then
    return query
    select c.id, c.name, 'admin'::text as role
    from public.companies c
    order by c.name;
  else
    -- Otherwise return only companies the user has access to via Clerk
    return query
    select c.id, c.name, ca.role
    from public.companies c
    join public.company_access ca on c.id = ca.company_id
    where ca.clerk_user_id = clerk_id
    order by c.name;
  end if;
end;
$$;

-- 5) Create function to sync Clerk user ID with existing records
create or replace function sync_clerk_user_ids()
returns integer
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  updated_count integer := 0;
begin
  -- This function should be called when users first login with Clerk
  -- to sync their existing company_access records
  update public.company_access
  set clerk_user_id = current_clerk_id()
  where user_id = auth.uid()
    and clerk_user_id is null;
  
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;