-- 1) Add Clerk column + index
alter table public.company_access
  add column if not exists clerk_user_id text;

create index if not exists idx_company_access_clerk_user
  on public.company_access (clerk_user_id);

-- 2) Helper functions for Clerk
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

-- 3) Update existing functions to work with Clerk
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

-- 4) Create function to sync Clerk user ID with existing records
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

-- 5) Update RLS policies to use Clerk functions
drop policy if exists "Users can view companies they have access to" on public.companies;
create policy "Users can view companies they have access to"
on public.companies
for select
using (
  user_has_company_access_clerk(id) or 
  (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
);

drop policy if exists "Company admins can view access for their company" on public.company_access;
create policy "Company admins can view access for their company"
on public.company_access
for select
using (user_has_company_access_clerk(company_id, 'admin'));

drop policy if exists "Users can view sickness records for their company employees" on public.employee_sickness_records;
create policy "Users can view sickness records for their company employees"
on public.employee_sickness_records
for select
using (user_has_company_access_clerk(company_id));

drop policy if exists "Admins can insert sickness records for their company employees" on public.employee_sickness_records;
create policy "Admins can insert sickness records for their company employees"
on public.employee_sickness_records
for insert
with check (user_has_company_access_clerk(company_id, 'admin'));

drop policy if exists "Admins can update sickness records for their company employees" on public.employee_sickness_records;
create policy "Admins can update sickness records for their company employees"
on public.employee_sickness_records
for update
using (user_has_company_access_clerk(company_id, 'admin'));

drop policy if exists "Admins can delete sickness records for their company employees" on public.employee_sickness_records;
create policy "Admins can delete sickness records for their company employees"
on public.employee_sickness_records
for delete
using (user_has_company_access_clerk(company_id, 'admin'));

-- 6) Update entitlement usage policies
drop policy if exists "Users can view entitlement usage for their company employees" on public.employee_sickness_entitlement_usage;
create policy "Users can view entitlement usage for their company employees"
on public.employee_sickness_entitlement_usage
for select
using (user_has_company_access_clerk(company_id));

drop policy if exists "Admins can manage entitlement usage for their company employees" on public.employee_sickness_entitlement_usage;
create policy "Admins can manage entitlement usage for their company employees"
on public.employee_sickness_entitlement_usage
for all
using (user_has_company_access_clerk(company_id, 'admin'));

-- 7) Update documents policies
drop policy if exists "Users can view documents for their companies" on public.documents;
create policy "Users can view documents for their companies"
on public.documents
for select
using (user_has_company_access_clerk(company_id));

drop policy if exists "Users can create documents for their companies" on public.documents;
create policy "Users can create documents for their companies"
on public.documents
for insert
with check (user_has_company_access_clerk(company_id));

drop policy if exists "Users can update documents for their companies" on public.documents;
create policy "Users can update documents for their companies"
on public.documents
for update
using (user_has_company_access_clerk(company_id));

drop policy if exists "Users can delete documents for their companies" on public.documents;
create policy "Users can delete documents for their companies"
on public.documents
for delete
using (user_has_company_access_clerk(company_id));

-- 8) Update document folders policies
drop policy if exists "Users can view folders for their companies" on public.document_folders;
create policy "Users can view folders for their companies"
on public.document_folders
for select
using (user_has_company_access_clerk(company_id));

drop policy if exists "Users can create folders for their companies" on public.document_folders;
create policy "Users can create folders for their companies"
on public.document_folders
for insert
with check (user_has_company_access_clerk(company_id));

drop policy if exists "Users can update folders for their companies" on public.document_folders;
create policy "Users can update folders for their companies"
on public.document_folders
for update
using (user_has_company_access_clerk(company_id));

drop policy if exists "Users can delete folders for their companies" on public.document_folders;
create policy "Users can delete folders for their companies"
on public.document_folders
for delete
using (user_has_company_access_clerk(company_id));