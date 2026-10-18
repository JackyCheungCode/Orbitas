-- Restrict privileged membership grants: only owners may grant owner/admin roles.
drop policy if exists "organization_members_insert_admin_or_bootstrap" on public.organization_members;

create policy "organization_members_insert_role_scoped" on public.organization_members
for insert to authenticated
with check (
  private.has_org_role(organization_id, array['owner'])
  or (
    private.has_org_role(organization_id, array['admin'])
    and role in ('member', 'viewer')
  )
  or (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.created_by = (select auth.uid())
    )
  )
);
