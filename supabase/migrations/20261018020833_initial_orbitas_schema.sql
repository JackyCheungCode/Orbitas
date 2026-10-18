-- Orbitas initial multi-tenant CRM schema.
create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_id_idx on public.organization_members(user_id);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 240),
  domain text, website text, industry text,
  employee_count integer check (employee_count is null or employee_count >= 0),
  annual_revenue numeric(16,2) check (annual_revenue is null or annual_revenue >= 0),
  country text, city text, description text,
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index companies_org_name_idx on public.companies(organization_id, name);
create index companies_org_domain_idx on public.companies(organization_id, domain);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  first_name text not null check (length(trim(first_name)) between 1 and 120),
  last_name text not null default '' check (length(last_name) <= 120),
  email text, phone text, job_title text, linkedin_url text,
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_org_name_idx on public.contacts(organization_id, last_name, first_name);
create index contacts_org_email_idx on public.contacts(organization_id, email);
create index contacts_company_id_idx on public.contacts(company_id);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  activity_type text not null check (activity_type in ('call', 'email', 'meeting', 'note', 'task')),
  subject text not null check (length(trim(subject)) between 1 and 240),
  description text,
  status text not null default 'completed' check (status in ('planned', 'completed', 'cancelled')),
  due_at timestamptz, completed_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index activities_org_created_idx on public.activities(organization_id, created_at desc);
create index activities_org_due_idx on public.activities(organization_id, due_at);

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  source_type text not null check (source_type in ('csv', 'manual', 'api', 'crm', 'other')),
  status text not null default 'configured' check (status in ('configured', 'syncing', 'connected', 'error', 'disabled')),
  config jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index data_sources_org_idx on public.data_sources(organization_id, created_at desc);

create or replace function private.is_org_member(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.organization_members m
    where m.organization_id = p_organization_id and m.user_id = (select auth.uid()));
$$;

create or replace function private.has_org_role(p_organization_id uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.organization_members m
    where m.organization_id = p_organization_id and m.user_id = (select auth.uid())
      and m.role = any(p_roles));
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.has_org_role(uuid, text[]) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, text[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.activities enable row level security;
alter table public.data_sources enable row level security;

create policy "profiles_select_self" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "organizations_select_members" on public.organizations for select to authenticated
using (private.is_org_member(id) or created_by = (select auth.uid()));
create policy "organizations_insert_creator" on public.organizations for insert to authenticated
with check (created_by = (select auth.uid()));
create policy "organizations_update_admins" on public.organizations for update to authenticated
using (private.has_org_role(id, array['owner','admin']))
with check (private.has_org_role(id, array['owner','admin']));

create policy "organization_members_select_org" on public.organization_members for select to authenticated
using (private.is_org_member(organization_id));
create policy "organization_members_insert_admin_or_bootstrap" on public.organization_members for insert to authenticated
with check (
  private.has_org_role(organization_id, array['owner','admin'])
  or (user_id = (select auth.uid()) and role = 'owner' and exists (
    select 1 from public.organizations o where o.id = organization_id and o.created_by = (select auth.uid())
  ))
);
create policy "organization_members_update_owner" on public.organization_members for update to authenticated
using (private.has_org_role(organization_id, array['owner']))
with check (private.has_org_role(organization_id, array['owner']));
create policy "organization_members_delete_owner" on public.organization_members for delete to authenticated
using (private.has_org_role(organization_id, array['owner']) and user_id <> (select auth.uid()));

create policy "companies_select_org" on public.companies for select to authenticated using (private.is_org_member(organization_id));
create policy "companies_insert_writers" on public.companies for insert to authenticated
with check (private.has_org_role(organization_id, array['owner','admin','member']) and created_by = (select auth.uid()));
create policy "companies_update_writers" on public.companies for update to authenticated
using (private.has_org_role(organization_id, array['owner','admin','member']))
with check (private.has_org_role(organization_id, array['owner','admin','member']));
create policy "companies_delete_admins" on public.companies for delete to authenticated
using (private.has_org_role(organization_id, array['owner','admin']));

create policy "contacts_select_org" on public.contacts for select to authenticated using (private.is_org_member(organization_id));
create policy "contacts_insert_writers" on public.contacts for insert to authenticated
with check (private.has_org_role(organization_id, array['owner','admin','member']) and created_by = (select auth.uid())
and (company_id is null or exists (select 1 from public.companies c where c.id = company_id and c.organization_id = organization_id)));
create policy "contacts_update_writers" on public.contacts for update to authenticated
using (private.has_org_role(organization_id, array['owner','admin','member']))
with check (private.has_org_role(organization_id, array['owner','admin','member'])
and (company_id is null or exists (select 1 from public.companies c where c.id = company_id and c.organization_id = organization_id)));
create policy "contacts_delete_admins" on public.contacts for delete to authenticated
using (private.has_org_role(organization_id, array['owner','admin']));

create policy "activities_select_org" on public.activities for select to authenticated using (private.is_org_member(organization_id));
create policy "activities_insert_writers" on public.activities for insert to authenticated
with check (private.has_org_role(organization_id, array['owner','admin','member']) and created_by = (select auth.uid())
and (company_id is null or exists (select 1 from public.companies c where c.id = company_id and c.organization_id = organization_id))
and (contact_id is null or exists (select 1 from public.contacts c where c.id = contact_id and c.organization_id = organization_id)));
create policy "activities_update_writers" on public.activities for update to authenticated
using (private.has_org_role(organization_id, array['owner','admin','member']))
with check (private.has_org_role(organization_id, array['owner','admin','member'])
and (company_id is null or exists (select 1 from public.companies c where c.id = company_id and c.organization_id = organization_id))
and (contact_id is null or exists (select 1 from public.contacts c where c.id = contact_id and c.organization_id = organization_id)));
create policy "activities_delete_admins" on public.activities for delete to authenticated
using (private.has_org_role(organization_id, array['owner','admin']));

create policy "data_sources_select_org" on public.data_sources for select to authenticated using (private.is_org_member(organization_id));
create policy "data_sources_insert_admins" on public.data_sources for insert to authenticated
with check (private.has_org_role(organization_id, array['owner','admin']) and created_by = (select auth.uid()));
create policy "data_sources_update_admins" on public.data_sources for update to authenticated
using (private.has_org_role(organization_id, array['owner','admin']))
with check (private.has_org_role(organization_id, array['owner','admin']));
create policy "data_sources_delete_admins" on public.data_sources for delete to authenticated
using (private.has_org_role(organization_id, array['owner','admin']));

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
grant select, insert, update, delete on public.activities to authenticated;
grant select, insert, update, delete on public.data_sources to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger companies_set_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger activities_set_updated_at before update on public.activities for each row execute function public.set_updated_at();
create trigger data_sources_set_updated_at before update on public.data_sources for each row execute function public.set_updated_at();
