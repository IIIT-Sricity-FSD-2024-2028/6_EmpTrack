import { useState } from 'react';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import usePageTitle from '../../hooks/usePageTitle';
import { DemoNotice, LoadState, Person, Progress, StatCard, useTeamData } from './components/TeamLeadUI';
import { matchesSearch, nameOf } from './tlUtils';
import './teamlead.css';

const BANDS = {
  all: () => true,
  track: (p) => p >= 75,
  risk: (p) => p >= 50 && p < 75,
  behind: (p) => p < 50,
};

export default function WorkMonitoring() {
  usePageTitle('Work Monitoring');
  const { data, error, reload } = useTeamData();
  const [search, setSearch] = useState('');
  const [member, setMember] = useState('');
  const [band, setBand] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const members = data?.members ?? [];
  const tasks = data?.tasks ?? [];
  const active = tasks.filter((t) => t.status !== 'COMPLETED');

  const rows = (showCompleted ? tasks : active)
    .filter((t) => !member || t.assigned_to === member)
    .filter((t) => BANDS[band](Number(t.progress_percentage || 0)))
    .filter((t) => matchesSearch(search, t.task_id, t.task_title, nameOf(members, t.assigned_to)));

  const hoursLogged = active.reduce((s, t) => s + Number(t.hours_worked || 0), 0);
  const avgProgress = active.length ? Math.round(active.reduce((s, t) => s + Number(t.progress_percentage || 0), 0) / active.length) : 0;

  return (
    <div className="tl-page">
      <DemoNotice />
      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="tl-stats-grid">
          <StatCard icon="ph-briefcase" label="Active Tasks" value={active.length} />
          <StatCard icon="ph-clock" tone="orange" label="Hours Logged (active)" value={`${hoursLogged}h`} />
          <StatCard icon="ph-chart-line-up" tone="green" label="Average Progress" value={`${avgProgress}%`} />
          <StatCard icon="ph-warning" tone="red" label="Behind (<50%)" value={active.filter((t) => Number(t.progress_percentage || 0) < 50).length} />
        </div>

        <div className="card table-modern" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-card-header"><h3>Team Work Monitoring</h3></div>
          <div className="tl-toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by employee, task ID or title" />
            <select className="form-control wm-select" aria-label="Filter by employee" value={member} onChange={(e) => setMember(e.target.value)}>
              <option value="">All employees</option>
              {members.map((m) => <option key={m.emp_id} value={m.emp_id}>{m.emp_name}</option>)}
            </select>
            <select className="form-control wm-select" aria-label="Filter by progress" value={band} onChange={(e) => setBand(e.target.value)}>
              <option value="all">All progress</option>
              <option value="track">On track (75%+)</option>
              <option value="risk">At risk (50-74%)</option>
              <option value="behind">Behind (&lt;50%)</option>
            </select>
            <label className="tl-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} /> Include completed
            </label>
          </div>
          <Table
            rowKey="task_id"
            data={rows}
            emptyMessage="No tasks match these filters."
            columns={[
              { key: 'emp', header: 'Employee', render: (t) => <Person name={nameOf(members, t.assigned_to)} /> },
              { key: 'task_id', header: 'Task ID', render: (t) => <span className="tl-muted">{t.task_id}</span> },
              { key: 'task_title', header: 'Task Title' },
              { key: 'est_hours', header: 'Estimated Hours', render: (t) => (t.est_hours ? `${t.est_hours}h` : '-') },
              { key: 'hours_worked', header: 'Hours Worked', render: (t) => `${t.hours_worked ?? 0}h` },
              { key: 'progress', header: 'Progress', render: (t) => <Progress value={Number(t.progress_percentage || 0)} /> },
            ]}
          />
        </div>
      </LoadState>
    </div>
  );
}
