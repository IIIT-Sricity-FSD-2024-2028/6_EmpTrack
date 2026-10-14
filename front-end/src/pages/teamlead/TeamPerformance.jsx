import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import usePageTitle from '../../hooks/usePageTitle';
import { BarChart, DemoNotice, LineChart, LoadState, Person, Progress, StatCard, useTeamData } from './components/TeamLeadUI';
import { buildPerformance, monthlyTrend, todayKey, weeklyCompletion } from './tlUtils';
import './teamlead.css';

// Validated with the dataviz palette checker in both themes.
const SERIES_COLORS = ['var(--primary-color)', '#059669'];
const BAND_BADGE = { Excellent: 'success', Good: 'info', 'Needs Improvement': 'danger' };

function Group({ title, icon, tone, people, empty }) {
  return (
    <div className="tl-card">
      <h3 className="tl-card-title"><i className={`ph-fill ${icon} text-${tone}`}></i> {title}</h3>
      {people.length === 0 ? (
        <p className="tl-muted">{empty}</p>
      ) : (
        <div className="tl-stats-list">
          {people.map((p) => (
            <div key={p.emp_id} className="tl-stats-list-item">
              <span>{p.name}</span>
              <strong>{p.productivity}%</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamPerformance() {
  usePageTitle('Team Performance');
  const { data, error, reload } = useTeamData({ attendance: true });

  const tasks = data?.tasks ?? [];
  const perf = buildPerformance(data?.members ?? [], tasks, data?.attendance ?? []).sort((a, b) => b.productivity - a.productivity);
  const avg = (key) => {
    const values = perf.map((p) => p[key]).filter((v) => v !== null);
    return values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
  };
  const trend = monthlyTrend(tasks);
  const weekly = weeklyCompletion(tasks);
  const month = todayKey().slice(0, 7);

  return (
    <div className="tl-page">
      <DemoNotice />
      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="tl-stats-grid">
          <StatCard icon="ph-users-three" label="Team Size" value={perf.length} />
          <StatCard icon="ph-chart-line-up" tone="green" label="Avg. Productivity" value={`${avg('productivity')}%`} />
          <StatCard icon="ph-calendar-check" tone="orange" label="Avg. Attendance" value={`${avg('attendance')}%`} />
          <StatCard icon="ph-check-circle" tone="green" label="Completed This Month" value={tasks.filter((t) => t.completed_at?.startsWith(month)).length} />
        </div>

        <Table
          title="Individual Performance"
          rowKey="emp_id"
          data={perf}
          emptyMessage="No team members yet."
          columns={[
            { key: 'name', header: 'Employee', render: (p) => <Person name={p.name} /> },
            { key: 'tasks', header: 'Tasks', render: (p) => <Badge variant="gray">{p.completed} / {p.total} done</Badge> },
            { key: 'productivity', header: 'Productivity', render: (p) => <Progress value={p.productivity} /> },
            { key: 'attendance', header: 'Attendance', render: (p) => (p.attendance === null ? '-' : `${p.attendance}%`) },
            { key: 'band', header: 'Status', render: (p) => <Badge variant={BAND_BADGE[p.band]}>{p.band}</Badge> },
          ]}
        />
        <p className="tl-muted" style={{ margin: 0 }}>
          Productivity = completed tasks / assigned tasks. Attendance = present days / recorded working days.
        </p>

        <div className="tl-grid-2">
          <div className="tl-card">
            <h3 className="tl-card-title">Monthly Trend</h3>
            <LineChart
              label="Tasks assigned and completed per month"
              labels={trend.map((m) => m.label)}
              series={[
                { name: 'Assigned', values: trend.map((m) => m.assigned), color: SERIES_COLORS[0] },
                { name: 'Completed', values: trend.map((m) => m.completed), color: SERIES_COLORS[1] },
              ]}
            />
          </div>
          <div className="tl-card">
            <h3 className="tl-card-title">Weekly Task Completion</h3>
            <BarChart label="Tasks completed in each of the last four weeks" data={weekly} color={SERIES_COLORS[0]} />
          </div>
        </div>

        <div className="tl-grid-2">
          <Group title="Top Performers" icon="ph-trophy" tone="green" people={perf.filter((p) => p.band === 'Excellent')} empty="Nobody at 85%+ yet." />
          <Group title="Meeting Goals" icon="ph-target" tone="orange" people={perf.filter((p) => p.band === 'Good')} empty="Nobody in the 70-84% range." />
          <Group title="Needs Support" icon="ph-hand-heart" tone="red" people={perf.filter((p) => p.band === 'Needs Improvement')} empty="Everyone is meeting goals." />
        </div>
      </LoadState>
    </div>
  );
}
