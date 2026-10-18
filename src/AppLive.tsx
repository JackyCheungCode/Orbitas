import { useEffect, useState } from 'react';
import { Activity, Building, Dashboard, DataBase, Settings, UserMultiple, UserAvatar } from '@carbon/icons-react';
import { Column, Content, Grid, Header, HeaderGlobalAction, HeaderGlobalBar, HeaderName, SideNav, SideNavItems, SideNavLink, Tile } from '@carbon/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useWorkspace } from './auth/WorkspaceGate';
import { supabase } from './lib/supabase';
import LiveRecordsPage from './pages/LiveRecordsPage';

const nav = [
  { label: 'Overview', path: '/', icon: Dashboard },
  { label: 'Companies', path: '/companies', icon: Building },
  { label: 'Contacts', path: '/contacts', icon: UserMultiple },
  { label: 'Activities', path: '/activities', icon: Activity },
  { label: 'Data sources', path: '/data-sources', icon: DataBase },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function Overview() {
  const { organization } = useWorkspace();
  const [counts, setCounts] = useState({ companies: 0, contacts: 0, activities: 0, sources: 0 });
  const [companies, setCompanies] = useState<Array<{id:string;name:string;domain:string|null;industry:string|null}>>([]);
  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) return;
      const [companyRows, contactRows, activityRows, sourceRows] = await Promise.all([
        supabase.from('companies').select('id,name,domain,industry').eq('organization_id', organization.id).order('created_at', { ascending: false }).limit(8),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id),
        supabase.from('activities').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id),
        supabase.from('data_sources').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id),
      ]);
      if (!active) return;
      setCompanies(companyRows.data ?? []);
      setCounts({ companies: companyRows.count ?? companyRows.data?.length ?? 0, contacts: contactRows.count ?? 0, activities: activityRows.count ?? 0, sources: sourceRows.count ?? 0 });
    }
    void load();
    return () => { active = false; };
  }, [organization.id]);
  const metrics = [{label:'Companies',value:counts.companies},{label:'Contacts',value:counts.contacts},{label:'Activities',value:counts.activities},{label:'Data sources',value:counts.sources}];
  return <div className="page">
    <div className="page-heading"><div><div className="eyebrow">WORKSPACE / OVERVIEW</div><h1>Prospect intelligence</h1><p className="page-description">Live CRM data for {organization.name}.</p></div><a className="cds--btn cds--btn--primary" href="/companies">Add company</a></div>
    <Grid className="metrics-grid">{metrics.map((metric) => <Column key={metric.label} sm={4} md={4} lg={4}><Tile className="metric-card"><div className="metric-card__label">{metric.label}</div><div className="metric-card__value">{metric.value.toLocaleString()}</div><div className="metric-card__detail">In this workspace</div></Tile></Column>)}</Grid>
    <section className="content-section"><div className="section-heading"><div><h2>Recent companies</h2><p>Company records stored in Supabase.</p></div><a href="/companies">View all</a></div>
    <div className="table-scroll"><table className="prospect-table"><thead><tr><th>Company</th><th>Domain</th><th>Industry</th></tr></thead><tbody>
      {companies.map((company) => <tr key={company.id}><td>{company.name}</td><td>{company.domain || '—'}</td><td>{company.industry || '—'}</td></tr>)}
      {companies.length === 0 && <tr><td colSpan={3} className="empty-cell">No companies yet. Open Companies to add your first record.</td></tr>}
    </tbody></table></div></section>
  </div>;
}

function Placeholder({ title }: { title: string }) {
  const { organization } = useWorkspace();
  return <div className="page"><div className="page-heading"><div><div className="eyebrow">WORKSPACE</div><h1>{title}</h1><p className="page-description">{organization.name}</p></div></div><Tile className="placeholder-tile"><h2>{title} workspace</h2><p>This section will be implemented after the core company and contact workflows.</p></Tile></div>;
}

export default function AppLive() {
  const location = useLocation();
  const { organization, user } = useWorkspace();
  return <div className="app-shell">
    <Header aria-label="Orbitas workspace"><HeaderName href="/" prefix="ORBITAS">Prospect intelligence</HeaderName><HeaderGlobalBar><HeaderGlobalAction aria-label="Sign out" tooltipAlignment="end" onClick={() => { if (supabase) void supabase.auth.signOut(); }}><UserAvatar size={20} /></HeaderGlobalAction></HeaderGlobalBar></Header>
    <SideNav aria-label="Primary navigation" expanded isFixedNav><div className="workspace-label"><span className="workspace-avatar">O</span><span><strong>{organization.name}</strong><small>{user.email}</small></span></div><SideNavItems><div className="nav-section-label">WORKSPACE</div>{nav.map(({label,path,icon:Icon}) => <SideNavLink key={path} href={path} isActive={location.pathname === path} renderIcon={Icon}>{label}</SideNavLink>)}</SideNavItems><div className="sidebar-bottom"><div className="sidebar-status"><span className="status-dot" /><span>Workspace operational</span></div><small>ORBITAS · FOUNDATION 0.2</small></div></SideNav>
    <Content className="main-content"><div className="mobile-page-bar"><span>{nav.find((item) => item.path === location.pathname)?.label ?? 'Overview'}</span><span className="mobile-workspace-dot">O</span></div><nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(({label,path}) => <a key={path} href={path} aria-current={location.pathname === path ? 'page' : undefined}>{label}</a>)}</nav><div className="main-content-inner"><Routes><Route path="/" element={<Overview />} /><Route path="/companies" element={<LiveRecordsPage resource="companies" title="Companies" description="Build and qualify your target account universe." />} /><Route path="/contacts" element={<LiveRecordsPage resource="contacts" title="Contacts" description="Map decision-makers and buying committees." />} /><Route path="/activities" element={<Placeholder title="Activities" />} /><Route path="/data-sources" element={<Placeholder title="Data sources" />} /><Route path="/settings" element={<Placeholder title="Settings" />} /><Route path="*" element={<Overview />} /></Routes><footer className="app-footer"><span>Orbitas · B2B Prospect Intelligence</span><span>Carbon Design System foundation</span></footer></div></Content>
  </div>;
}
