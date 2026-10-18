import { useState } from 'react';
import { Activity, Building, Dashboard, DataBase, Settings, UserMultiple, UserAvatar } from '@carbon/icons-react';
import { Button, Column, Content, Grid, Header, HeaderGlobalAction, HeaderGlobalBar, HeaderName, Select, SelectItem, SideNav, SideNavItems, SideNavLink, Tag, Tile } from '@carbon/react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useWorkspace } from './auth/WorkspaceGate';
import { supabase } from './lib/supabase';
import LiveRecordsPage from './pages/LiveRecordsPage';

const nav = [
  { label: '业务总览', path: '/', icon: Dashboard },
  { label: '企业', path: '/companies', icon: Building },
  { label: '联系人', path: '/contacts', icon: UserMultiple },
  { label: '销售活动', path: '/activities', icon: Activity },
  { label: '数据源', path: '/data-sources', icon: DataBase },
  { label: '设置', path: '/settings', icon: Settings },
];

const demoDeals = [
  { name: '星河科技集团', contact: '陈总监 · IT', stage: '方案评估', amount: 680000, owner: '林晓', probability: 75, due: '10月24日', status: '高意向' },
  { name: '远景供应链', contact: '王经理 · 采购', stage: '商务谈判', amount: 520000, owner: '周宁', probability: 85, due: '10月21日', status: '待签约' },
  { name: '云杉金融', contact: '刘总 · 运营', stage: '需求分析', amount: 360000, owner: '陈默', probability: 50, due: '10月28日', status: '跟进中' },
  { name: '北辰医疗', contact: '赵经理 · 信息化', stage: '初步接洽', amount: 240000, owner: '林晓', probability: 25, due: '11月02日', status: '新商机' },
  { name: '海岳物流', contact: '孙总监 · 数字化', stage: '方案评估', amount: 410000, owner: '王悦', probability: 65, due: '10月26日', status: '跟进中' },
];

const demoActivities = [
  { time: '09:42', title: '星河科技集团 · 方案演示', detail: '林晓 · 视频会议', kind: '会议', color: 'blue' as const },
  { time: '09:15', title: '远景供应链 · 合同确认', detail: '周宁 · 商机跟进', kind: '重要', color: 'green' as const },
  { time: '昨天', title: '云杉金融 · 需求访谈', detail: '陈默 · 客户沟通', kind: '已完成', color: 'gray' as const },
  { time: '昨天', title: '北辰医疗 · 首次联系', detail: '林晓 · 电话', kind: '待跟进', color: 'red' as const },
];

const detailData: Record<string, { title: string; subtitle: string; columns: string[]; rows: string[][] }> = {
  revenue: { title: '销售收入', subtitle: '已成交合同及收入表现 · 演示数据', columns: ['客户', '合同编号', '签约日期', '负责人', '合同金额', '状态'], rows: [['远景供应链', 'ORB-2026-1042', '2026-10-16', '周宁', '¥520,000', '已签约'], ['新锐能源', 'ORB-2026-1038', '2026-10-14', '王悦', '¥385,000', '已签约'], ['星河科技集团', 'ORB-2026-1031', '2026-10-08', '林晓', '¥680,000', '已签约'], ['启明教育', 'ORB-2026-1025', '2026-10-03', '陈默', '¥168,000', '已签约']] },
  pipeline: { title: '销售管道', subtitle: '全部开放商机 · 按预估金额排序 · 演示数据', columns: ['商机 / 客户', '销售阶段', '负责人', '预计成交日', '赢单概率', '预计金额'], rows: demoDeals.map(d => [d.name, d.stage, d.owner, d.due, d.probability + '%', '¥' + d.amount.toLocaleString('zh-CN')]) },
  forecast: { title: '预计成交额', subtitle: '基于开放商机金额与赢单概率加权计算 · 演示数据', columns: ['商机 / 客户', '阶段', '负责人', '概率', '商机金额', '加权金额'], rows: demoDeals.map(d => [d.name, d.stage, d.owner, d.probability + '%', '¥' + d.amount.toLocaleString('zh-CN'), '¥' + Math.round(d.amount * d.probability / 100).toLocaleString('zh-CN')]) },
  winrate: { title: '赢单率分析', subtitle: '本季度已关闭商机 · 演示数据', columns: ['客户', '销售负责人', '结果', '成交周期', '商机金额', '关闭日期'], rows: [['远景供应链', '周宁', '赢单', '32 天', '¥520,000', '2026-10-16'], ['新锐能源', '王悦', '赢单', '26 天', '¥385,000', '2026-10-14'], ['宏远咨询', '陈默', '输单', '41 天', '¥210,000', '2026-10-12'], ['启明教育', '陈默', '赢单', '19 天', '¥168,000', '2026-10-03']] },
  companies: { title: '企业客户', subtitle: 'CRM 企业档案 · 演示数据', columns: ['企业名称', '行业', '客户分级', '负责人', '最近互动', '客户状态'], rows: [['星河科技集团', '信息技术', '战略客户', '林晓', '今天 09:42', '活跃'], ['远景供应链', '物流供应链', '重点客户', '周宁', '今天 09:15', '活跃'], ['云杉金融', '金融服务', '重点客户', '陈默', '昨天', '跟进中'], ['北辰医疗', '医疗健康', '潜力客户', '林晓', '昨天', '待跟进']] },
  contacts: { title: '联系人', subtitle: '客户关系与关键决策人 · 演示数据', columns: ['姓名', '所属企业', '职位', '负责人', '最近互动', '关系状态'], rows: [['陈总监', '星河科技集团', 'IT 总监', '林晓', '今天', '关键决策人'], ['王经理', '远景供应链', '采购经理', '周宁', '今天', '活跃'], ['刘总', '云杉金融', '运营总监', '陈默', '昨天', '跟进中'], ['赵经理', '北辰医疗', '信息化经理', '林晓', '昨天', '新联系人']] },
  followups: { title: '待跟进线索', subtitle: '需要销售团队采取下一步行动的记录 · 演示数据', columns: ['客户 / 联系人', '跟进原因', '负责人', '最后联系', '下一步行动', '优先级'], rows: [['北辰医疗 · 赵经理', '首次联系待反馈', '林晓', '3 天前', '电话回访', '高'], ['云杉金融 · 刘总', '需求待确认', '陈默', '2 天前', '发送需求摘要', '高'], ['新锐能源 · 孙经理', '报价后待反馈', '王悦', '4 天前', '确认采购时间', '中'], ['启明教育 · 李老师', '演示预约', '周宁', '昨天', '安排产品演示', '中']] },
  activities: { title: '销售活动', subtitle: '客户触达、会议、任务与跟进记录 · 演示数据', columns: ['活动', '客户', '负责人', '时间', '类型', '状态'], rows: [['方案演示', '星河科技集团', '林晓', '今天 09:42', '会议', '已完成'], ['合同确认', '远景供应链', '周宁', '今天 09:15', '跟进', '进行中'], ['需求访谈', '云杉金融', '陈默', '昨天', '会议', '已完成'], ['首次联系', '北辰医疗', '林晓', '昨天', '电话', '待跟进']] },
  team: { title: '团队业绩', subtitle: '销售目标、成交表现与商机贡献 · 演示数据', columns: ['销售负责人', '本季目标', '已完成', '完成率', '开放商机', '跟进活动'], rows: [['林晓', '¥1,500,000', '¥1,080,000', '72%', '12', '38'], ['周宁', '¥1,200,000', '¥936,000', '78%', '9', '31'], ['陈默', '¥1,000,000', '¥620,000', '62%', '11', '27'], ['王悦', '¥1,100,000', '¥770,000', '70%', '8', '24']] },
  tasks: { title: '逾期与待办', subtitle: '即将到期的客户任务和销售活动 · 演示数据', columns: ['待办事项', '关联客户', '负责人', '截止日期', '状态', '优先级'], rows: [['确认合同条款', '远景供应链', '周宁', '今天', '待完成', '高'], ['安排需求复盘', '云杉金融', '陈默', '今天', '待完成', '高'], ['回访报价反馈', '新锐能源', '王悦', '昨天', '已逾期', '高'], ['准备演示材料', '北辰医疗', '林晓', '明天', '待完成', '中']] },
};

function Overview() {
  const { organization } = useWorkspace();
  const [period, setPeriod] = useState('quarter');
  const kpis = [
    { label: '销售收入', value: '¥ 2.86M', change: '+18.6%', note: '已签约合同金额', to: '/details/revenue', trend: 'up' },
    { label: '销售管道', value: '¥ 8.42M', change: '+12.4%', note: '开放商机总金额', to: '/details/pipeline', trend: 'up' },
    { label: '预计成交额', value: '¥ 3.18M', change: '+8.2%', note: '按赢单概率加权', to: '/details/forecast', trend: 'up' },
    { label: '赢单率', value: '34.8%', change: '+4.2 pt', note: '本季度已关闭商机', to: '/details/winrate', trend: 'up' },
    { label: '企业客户', value: '248', change: '+16', note: '本月新增企业 · 演示数据', to: '/details/companies', trend: 'up' },
    { label: '联系人', value: '1,426', change: '+64', note: '本月新增联系人 · 演示数据', to: '/details/contacts', trend: 'up' },
  ];
  const stages = [
    { name: '初步接洽', count: 42, amount: '¥ 1.26M', width: '100%', color: '#a6c8ff' },
    { name: '需求分析', count: 31, amount: '¥ 2.08M', width: '78%', color: '#78a9ff' },
    { name: '方案评估', count: 24, amount: '¥ 2.46M', width: '61%', color: '#4589ff' },
    { name: '商务谈判', count: 13, amount: '¥ 1.84M', width: '38%', color: '#0f62fe' },
    { name: '赢单', count: 9, amount: '¥ 0.78M', width: '23%', color: '#24a148' },
  ];
  const reps = [
    { name: '周宁', role: '华东销售', amount: '¥936K', target: 78, initials: '周' },
    { name: '林晓', role: '战略客户', amount: '¥1.08M', target: 72, initials: '林' },
    { name: '王悦', role: '华南销售', amount: '¥770K', target: 70, initials: '王' },
    { name: '陈默', role: '金融行业', amount: '¥620K', target: 62, initials: '陈' },
  ];
  return <div className="page overview-page">
    <div className="overview-banner">
      <div className="page-heading overview-heading"><div><div className="eyebrow">ORBITAS / BUSINESS INTELLIGENCE</div><h1>业务总览</h1><p className="page-description">{organization.name} · 汇总客户、销售管道、团队表现与待办事项。</p></div><div className="overview-actions"><Tag type="blue">演示数据</Tag><Select id="overview-period" labelText="统计周期" size="md" value={period} onChange={(event) => setPeriod(event.currentTarget.value)}><SelectItem value="month" text="本月" /><SelectItem value="quarter" text="本季度" /><SelectItem value="year" text="本年度" /></Select><Button kind="primary" onClick={() => window.location.assign('/details/pipeline')}>查看销售管道</Button></div></div>
      <div className="overview-context"><span className="context-dot" /> CRM 经营驾驶舱 <span className="context-divider">/</span> {period === 'month' ? '2026年10月' : period === 'year' ? '2026年度' : '2026年第四季度'} <span className="context-updated">数据为界面预览用途，非真实财务数据</span></div>
    </div>

    <section className="dashboard-section">
      <div className="section-heading dashboard-section-heading"><div><h2>经营关键指标</h2><p>核心业务结果与客户资产 · 点击指标进入明细</p></div><span className="section-meta">01 / PERFORMANCE</span></div>
      <Grid className="executive-kpi-grid">{kpis.map((kpi, index) => <Column key={kpi.label} sm={4} md={4} lg={4}><Link className="kpi-link" to={kpi.to}><Tile className={'executive-kpi executive-kpi--' + index}><div className="kpi-topline"><span>{kpi.label}</span><span className="kpi-arrow" aria-hidden="true">↗</span></div><div className="kpi-value">{kpi.value}</div><div className="kpi-bottomline"><Tag type="green">{kpi.change}</Tag><span>{kpi.note}</span></div><div className="kpi-underline" /></Tile></Link></Column>)}</Grid>
    </section>

    <Grid className="dashboard-main-grid">
      <Column sm={4} md={8} lg={10}>
        <section className="dashboard-panel pipeline-panel">
          <div className="panel-heading"><div><span className="panel-kicker">SALES PERFORMANCE</span><h2>销售管道分析</h2><p>从线索到签约，掌握各阶段商机分布</p></div><Link to="/details/pipeline" className="panel-link">全部商机 <span>→</span></Link></div>
          <div className="pipeline-summary"><div><span>开放商机金额</span><strong>¥ 8,420,000</strong></div><div><span>开放商机数量</span><strong>110 <small>笔</small></strong></div><div><span>加权预测</span><strong>¥ 3,180,000</strong></div></div>
          <div className="funnel-list">{stages.map((stage, index) => <Link to={index === 4 ? '/details/winrate' : '/details/pipeline'} className="funnel-row" key={stage.name}><span className="funnel-name">{stage.name}</span><span className="funnel-track"><span style={{ width: stage.width, background: stage.color }} /></span><span className="funnel-count">{stage.count} 笔</span><strong>{stage.amount}</strong></Link>)}</div>
          <div className="panel-footnote">商机金额按当前阶段汇总 · 演示数据 <Link to="/details/pipeline">查看阶段明细 →</Link></div>
        </section>
      </Column>
      <Column sm={4} md={8} lg={6}>
        <section className="dashboard-panel target-panel">
          <div className="panel-heading"><div><span className="panel-kicker">QUOTA ATTAINMENT</span><h2>季度目标达成</h2><p>销售收入与目标进度</p></div><Link to="/details/team" className="panel-link">团队业绩 →</Link></div>
          <div className="target-total"><strong>68.4%</strong><span><Tag type="green">+ 6.8%</Tag><small>较上季度同期</small></span></div>
          <div className="target-progress"><div className="target-progress-fill" /></div>
          <div className="target-legend"><span><i className="legend-dot legend-dot--blue" />已完成 <strong>¥2.86M</strong></span><span><i className="legend-dot" />季度目标 <strong>¥4.18M</strong></span></div>
          <div className="target-divider" />
          <div className="target-detail-row"><span>距离季度目标</span><strong>¥1.32M</strong></div>
          <div className="target-detail-row"><span>本季度预计达成</span><strong className="text-positive">82.6%</strong></div>
          <Link to="/details/revenue" className="target-cta">查看收入与目标明细 <span>↗</span></Link>
        </section>
      </Column>
    </Grid>

    <Grid className="dashboard-secondary-grid">
      <Column sm={4} md={8} lg={10}>
        <section className="dashboard-panel deals-panel">
          <div className="panel-heading"><div><span className="panel-kicker">DEAL MANAGEMENT</span><h2>重点商机</h2><p>近期高价值机会与下一步成交节点</p></div><Link to="/details/pipeline" className="panel-link">全部商机 →</Link></div>
          <div className="deal-list">{demoDeals.slice(0, 4).map((deal) => <Link className="deal-row" to="/details/pipeline" key={deal.name}><span className="deal-avatar">{deal.name.slice(0, 1)}</span><span className="deal-primary"><strong>{deal.name}</strong><small>{deal.contact} · {deal.owner}</small></span><span className="deal-stage"><Tag type={deal.status === '待签约' ? 'green' : deal.status === '高意向' ? 'blue' : 'cool-gray'}>{deal.stage}</Tag></span><span className="deal-amount"><strong>¥{deal.amount.toLocaleString('zh-CN')}</strong><small>预计 {deal.due}</small></span><span className="deal-arrow">›</span></Link>)}</div>
          <div className="panel-footnote">按商机金额及成交时效筛选 <Link to="/details/pipeline">进入销售管道 →</Link></div>
        </section>
      </Column>
      <Column sm={4} md={8} lg={6}>
        <section className="dashboard-panel activity-panel">
          <div className="panel-heading"><div><span className="panel-kicker">CUSTOMER ENGAGEMENT</span><h2>销售活动</h2><p>客户触达与团队执行情况</p></div><Link to="/details/activities" className="panel-link">全部活动 →</Link></div>
          <div className="activity-stats"><Link to="/details/activities"><strong>86</strong><span>本周活动</span></Link><Link to="/details/tasks"><strong className="text-warning">12</strong><span>待完成</span></Link><Link to="/details/tasks"><strong className="text-danger">4</strong><span>已逾期</span></Link></div>
          <div className="activity-list">{demoActivities.map((activity) => <Link to={activity.kind === '待跟进' ? '/details/tasks' : '/details/activities'} className="activity-row" key={activity.time + activity.title}><span className="activity-time">{activity.time}</span><span className="activity-marker" /><span className="activity-copy"><strong>{activity.title}</strong><small>{activity.detail}</small></span><Tag type={activity.color}>{activity.kind}</Tag></Link>)}</div>
        </section>
      </Column>
    </Grid>

    <Grid className="dashboard-bottom-grid">
      <Column sm={4} md={8} lg={10}>
        <section className="dashboard-panel team-panel">
          <div className="panel-heading"><div><span className="panel-kicker">TEAM EFFECTIVENESS</span><h2>销售团队表现</h2><p>个人目标完成率与业绩贡献</p></div><Link to="/details/team" className="panel-link">查看团队报表 →</Link></div>
          <div className="team-table-wrap"><table className="team-table"><thead><tr><th>销售负责人</th><th>已成交收入</th><th>季度目标完成</th><th>进度</th></tr></thead><tbody>{reps.map(rep => <tr key={rep.name}><td><Link to="/details/team" className="rep-name"><span>{rep.initials}</span><span><strong>{rep.name}</strong><small>{rep.role}</small></span></Link></td><td><strong>{rep.amount}</strong></td><td>{rep.target}%</td><td><span className="rep-progress"><span style={{ width: rep.target + '%' }} /></span></td></tr>)}</tbody></table></div>
        </section>
      </Column>
      <Column sm={4} md={8} lg={6}>
        <section className="dashboard-panel followup-panel">
          <div className="panel-heading"><div><span className="panel-kicker">ATTENTION REQUIRED</span><h2>待处理事项</h2><p>需要及时跟进的业务风险</p></div><Link to="/details/tasks" className="panel-link">查看全部 →</Link></div>
          <Link to="/details/tasks" className="attention-row"><span className="attention-icon attention-icon--red">!</span><span><strong>逾期销售任务</strong><small>4 项任务超过截止时间</small></span><span className="attention-number">4</span></Link>
          <Link to="/details/followups" className="attention-row"><span className="attention-icon attention-icon--orange">↗</span><span><strong>待跟进重点客户</strong><small>12 个客户超过 3 天未联系</small></span><span className="attention-number">12</span></Link>
          <Link to="/details/pipeline" className="attention-row"><span className="attention-icon attention-icon--blue">◷</span><span><strong>即将到期的商机</strong><small>7 个商机预计本周成交</small></span><span className="attention-number">7</span></Link>
          <Link to="/details/followups" className="attention-footer">打开跟进工作台 <span>→</span></Link>
        </section>
      </Column>
    </Grid>
    <div className="dashboard-disclaimer">演示环境 · 首页经营指标、销售记录、企业客户、联系人及团队数据均为虚拟样例，不代表真实经营结果。</div>
  </div>;
}

function MetricDetail() {
  const { metric = 'pipeline' } = useParams();
  const { organization } = useWorkspace();
  const data = detailData[metric] ?? detailData.pipeline;
  return <div className="page detail-page">
    <div className="detail-breadcrumb"><Link to="/">业务总览</Link><span>/</span><span>{data.title}</span></div>
    <div className="page-heading"><div><div className="eyebrow">BUSINESS INTELLIGENCE / DETAIL</div><h1>{data.title}</h1><p className="page-description">{data.subtitle}</p></div><Button kind="tertiary" onClick={() => window.history.back()}>返回上一页</Button></div>
    <div className="detail-summary-strip"><div><span>当前工作空间</span><strong>{organization.name}</strong></div><div><span>记录数</span><strong>{data.rows.length} 条</strong></div><div><span>数据范围</span><strong>2026 年第四季度</strong></div><Tag type="blue">虚拟演示数据</Tag></div>
    <section className="dashboard-panel detail-table-panel"><div className="panel-heading"><div><span className="panel-kicker">RECORD EXPLORER</span><h2>{data.title}明细</h2><p>此页面用于预览首页指标的下钻体验，数据为虚拟样例。</p></div><Button kind="tertiary" onClick={() => window.location.assign('/')}>返回业务总览</Button></div>
      <div className="team-table-wrap"><table className="detail-table"><thead><tr>{data.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{data.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cellIndex === row.length - 1 && /已逾期|高$|待跟进/.test(cell) ? <Tag type="red">{cell}</Tag> : cellIndex === row.length - 1 && /已签约|赢单|活跃/.test(cell) ? <Tag type="green">{cell}</Tag> : cell}</td>)}</tr>)}</tbody></table></div>
      <div className="detail-table-footer"><span>显示 {data.rows.length} 条演示记录</span><span>真实数据接入后将支持搜索、筛选、排序与分页</span></div>
    </section>
    <div className="detail-back-link"><Link to="/">← 返回业务总览</Link></div>
  </div>;
}

function Placeholder({ title }: { title: string }) {
  const { organization } = useWorkspace();
  return <div className="page"><div className="page-heading"><div><div className="eyebrow">WORKSPACE</div><h1>{title}</h1><p className="page-description">{organization.name}</p></div></div><Tile className="placeholder-tile"><h2>{title}工作区</h2><p>此模块将在核心 CRM 工作流完善后继续扩展。</p></Tile></div>;
}

export default function AppLive() {
  const location = useLocation();
  const { organization, user } = useWorkspace();
  return <div className="app-shell">
    <Header aria-label="Orbitas workspace"><HeaderName href="/" prefix="ORBITAS">CRM · 业务管理</HeaderName><HeaderGlobalBar><HeaderGlobalAction aria-label="Sign out" tooltipAlignment="end" onClick={() => { if (supabase) void supabase.auth.signOut(); }}><UserAvatar size={20} /></HeaderGlobalAction></HeaderGlobalBar></Header>
    <SideNav aria-label="Primary navigation" expanded isFixedNav><div className="workspace-label"><span className="workspace-avatar">O</span><span><strong>{organization.name}</strong><small>{user.email}</small></span></div><SideNavItems><div className="nav-section-label">业务管理</div>{nav.map(({label,path,icon:Icon}) => <SideNavLink key={path} href={path} isActive={location.pathname === path} renderIcon={Icon}>{label}</SideNavLink>)}</SideNavItems><div className="sidebar-bottom"><div className="sidebar-status"><span className="status-dot" /><span>工作空间运行正常</span></div><small>ORBITAS · CRM PREVIEW</small></div></SideNav>
    <Content className="main-content"><div className="mobile-page-bar"><span>{nav.find((item) => item.path === location.pathname)?.label ?? '业务明细'}</span><span className="mobile-workspace-dot">O</span></div><nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(({label,path}) => <a key={path} href={path} aria-current={location.pathname === path ? 'page' : undefined}>{label}</a>)}</nav><div className="main-content-inner"><Routes><Route path="/" element={<Overview />} /><Route path="/details/:metric" element={<MetricDetail />} /><Route path="/companies" element={<LiveRecordsPage resource="companies" title="企业客户" description="统一管理目标企业、客户档案与账户关系。" />} /><Route path="/contacts" element={<LiveRecordsPage resource="contacts" title="联系人" description="管理联系人、关键决策人及客户关系。" />} /><Route path="/activities" element={<Placeholder title="销售活动" />} /><Route path="/data-sources" element={<Placeholder title="数据源" />} /><Route path="/settings" element={<Placeholder title="设置" />} /><Route path="*" element={<Overview />} /></Routes><footer className="app-footer"><span>Orbitas · 完整 CRM 业务平台</span><span>IBM Carbon Design System</span></footer></div></Content>
  </div>;
}
