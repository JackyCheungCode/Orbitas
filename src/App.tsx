import { useMemo, useState } from 'react';
import {
  Activity,
  Add,
  Building,
  Dashboard,
  DataBase,
  Notification,
  Search as SearchIcon,
  Settings,
  UserAvatar,
  UserMultiple,
} from '@carbon/icons-react';
import {
  Button,
  Column,
  Content,
  Grid,
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderName,
  Search,
  SideNav,
  SideNavItems,
  SideNavLink,
  Tag,
  Tile,
} from '@carbon/react';
import { Route, Routes, useLocation } from 'react-router-dom';

type Prospect = {
  name: string;
  domain: string;
  industry: string;
  location: string;
  status: 'Qualified' | 'New' | 'In review';
  score: number;
};

const prospects: Prospect[] = [
  { name: 'Northstar Analytics', domain: 'northstaranalytics.com', industry: 'Software', location: 'Singapore', status: 'Qualified', score: 94 },
  { name: 'Meridian Systems', domain: 'meridiansystems.io', industry: 'IT Services', location: 'London, UK', status: 'In review', score: 87 },
  { name: 'Vertex Industrial', domain: 'vertexindustrial.com', industry: 'Manufacturing', location: 'Munich, DE', status: 'New', score: 82 },
  { name: 'Bluepeak Logistics', domain: 'bluepeaklogistics.com', industry: 'Logistics', location: 'Sydney, AU', status: 'Qualified', score: 79 },
  { name: 'Aster Digital Group', domain: 'asterdigital.co', industry: 'Marketing', location: 'Toronto, CA', status: 'In review', score: 73 },
];

const navigation = [
  { label: 'Overview', path: '/', icon: Dashboard },
  { label: 'Companies', path: '/companies', icon: Building },
  { label: 'Contacts', path: '/contacts', icon: UserMultiple },
  { label: 'Activities', path: '/activities', icon: Activity },
  { label: 'Data sources', path: '/data-sources', icon: DataBase },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function MetricCard({ label, value, detail, trend }: { label: string; value: string; detail: string; trend?: string }) {
  return (
    <Tile className="metric-card">
      <div className="metric-card__top">
        <span className="metric-card__label">{label}</span>
        {trend && <Tag type="green">{trend}</Tag>}
      </div>
      <div className="metric-card__value">{value}</div>
      <div className="metric-card__detail">{detail}</div>
    </Tile>
  );
}

function DashboardPage() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => prospects.filter((prospect) =>
    [prospect.name, prospect.domain, prospect.industry, prospect.location].join(' ').toLowerCase().includes(query.toLowerCase()),
  ), [query]);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE / OVERVIEW</div>
          <h1>Prospect intelligence</h1>
          <p className="page-description">Your pipeline, signals, and next opportunities in one place.</p>
        </div>
        <Button renderIcon={Add} onClick={() => window.alert('Lead creation flow will be connected in the next phase.')}>Add prospect</Button>
      </div>

      <Grid className="metrics-grid">
        <Column sm={4} md={4} lg={4}><MetricCard label="Total prospects" value="12,486" detail="Across all connected sources" trend="+12.8%" /></Column>
        <Column sm={4} md={4} lg={4}><MetricCard label="Qualified this month" value="864" detail="High-fit accounts identified" trend="+8.2%" /></Column>
        <Column sm={4} md={4} lg={4}><MetricCard label="Open opportunities" value="238" detail="Assigned across your team" /></Column>
        <Column sm={4} md={4} lg={4}><MetricCard label="Data health" value="96.4%" detail="Records with verified fields" trend="+2.4%" /></Column>
      </Grid>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <h2>Priority prospects</h2>
            <p>Accounts ranked by fit score and recent activity.</p>
          </div>
          <Button kind="ghost" size="md" renderIcon={SearchIcon} onClick={() => window.alert('Advanced search will be available when the search service is connected.')}>Advanced search</Button>
        </div>
        <div className="table-toolbar">
          <Search
            size="lg"
            labelText="Search prospects"
            placeholder="Search company, industry, location..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="result-count">{filtered.length} records</span>
        </div>
        <div className="table-scroll">
          <table className="prospect-table">
            <thead><tr><th>Company</th><th>Industry</th><th>Location</th><th>Fit score</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((prospect) => (
                <tr key={prospect.domain}>
                  <td><div className="company-cell"><span className="company-mark">{prospect.name.slice(0, 1)}</span><span><strong>{prospect.name}</strong><small>{prospect.domain}</small></span></div></td>
                  <td>{prospect.industry}</td>
                  <td>{prospect.location}</td>
                  <td><div className="score-cell"><span className="score-track"><span style={{ width: `${prospect.score}%` }} /></span><strong>{prospect.score}</strong></div></td>
                  <td><Tag type={prospect.status === 'Qualified' ? 'green' : prospect.status === 'New' ? 'blue' : 'warm-gray'}>{prospect.status}</Tag></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td className="empty-cell" colSpan={5}>No prospects match “{query}”. Try a different search.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>Showing {filtered.length} of {prospects.length} sample records</span><span>Data shown is illustrative</span></div>
      </section>

      <Grid className="bottom-grid">
        <Column sm={4} md={4} lg={8}>
          <Tile className="insight-tile">
            <div className="tile-kicker">SIGNAL MONITOR</div>
            <h3>New buying signals detected</h3>
            <p>18 accounts showed hiring, funding, or technology-change signals in the last 7 days.</p>
            <Button kind="tertiary" size="md" onClick={() => window.alert('Signal monitoring will be connected in a later phase.')}>Review signals</Button>
          </Tile>
        </Column>
        <Column sm={4} md={4} lg={8}>
          <Tile className="insight-tile insight-tile--dark">
            <div className="tile-kicker">DATA CONNECTIVITY</div>
            <h3>Bring your sources together</h3>
            <p>Connect your CRM and enrichment sources to build a unified prospect view.</p>
            <Button kind="tertiary" size="md" onClick={() => window.alert('Source connections will be configured in a later phase.')}>Manage sources</Button>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}

function ListingPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="page">
      <div className="page-heading">
        <div><div className="eyebrow">WORKSPACE / DIRECTORY</div><h1>{title}</h1><p className="page-description">{description}</p></div>
        <Button renderIcon={Add} onClick={() => window.alert(`The ${title.toLowerCase()} workflow will be implemented in the next phase.`)}>Add {title.toLowerCase().replace(/s$/, '')}</Button>
      </div>
      <Tile className="placeholder-tile">
        <div className="placeholder-icon"><DataBase size={24} /></div>
        <h2>{title} workspace</h2>
        <p>This area is scaffolded and ready for the next implementation phase. Live records will be connected after the Supabase schema and access policies are in place.</p>
        <Tag type="cool-gray">Foundation ready</Tag>
      </Tile>
    </div>
  );
}

function App() {
  const location = useLocation();
  const activeItem = navigation.find((item) => item.path === location.pathname);
  const currentTitle = activeItem?.label ?? 'Overview';

  return (
    <div className="app-shell">
      <Header aria-label="Orbitas workspace">
        <HeaderName href="/" prefix="ORBITAS">Prospect intelligence</HeaderName>
        <HeaderGlobalBar>
          <HeaderGlobalAction aria-label="Notifications" tooltipAlignment="end" onClick={() => window.alert('Notifications will be available in a later phase.')}><Notification size={20} /></HeaderGlobalAction>
          <HeaderGlobalAction aria-label="User profile" tooltipAlignment="end" onClick={() => window.alert('Profile and team settings will be connected in a later phase.')}><UserAvatar size={20} /></HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>
      <SideNav aria-label="Primary navigation" expanded isFixedNav>
        <div className="workspace-label"><span className="workspace-avatar">O</span><span><strong>Orbitas workspace</strong><small>Sales operations</small></span></div>
        <SideNavItems>
          <div className="nav-section-label">WORKSPACE</div>
          {navigation.map(({ label, path, icon: Icon }) => (
            <SideNavLink key={path} href={path} isActive={location.pathname === path} renderIcon={Icon}>
              {label}
            </SideNavLink>
          ))}
        </SideNavItems>
        <div className="sidebar-bottom"><div className="sidebar-status"><span className="status-dot" /><span>Workspace operational</span></div><small>ORBITAS · FOUNDATION 0.1</small></div>
      </SideNav>
      <Content className="main-content">
        <div className="mobile-page-bar"><span>{currentTitle}</span><span className="mobile-workspace-dot">O</span></div>
        <div className="main-content-inner">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/companies" element={<ListingPage title="Companies" description="Build and qualify your target account universe." />} />
            <Route path="/contacts" element={<ListingPage title="Contacts" description="Map decision-makers and buying committees." />} />
            <Route path="/activities" element={<ListingPage title="Activities" description="Coordinate follow-ups and team engagement." />} />
            <Route path="/data-sources" element={<ListingPage title="Data sources" description="Connect, monitor, and govern your data inputs." />} />
            <Route path="/settings" element={<ListingPage title="Settings" description="Manage workspace preferences and access controls." />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
          <footer className="app-footer"><span>Orbitas · B2B Prospect Intelligence</span><span>Carbon Design System foundation</span></footer>
        </div>
      </Content>
    </div>
  );
}

export default App;