// Converted from front-end/hr/reports.html + js/views/hr/reports.js.
// The original charts plotted hard-coded numbers; these are computed from the
// company's real attendance, tasks, issues and employees.
import { useEffect, useState } from 'react';
import AnimatedCount from '../../components/sa-common/AnimatedCount';
import ChartCanvas from '../../components/sa-common/ChartCanvas';
import useSaToast from '../../components/sa-common/useSaToast';
import usePageTitle from '../../hooks/usePageTitle';
import * as hr from '../../services/hrService';
import { chartTheme, loadChartJs } from '../../utils/saCommon';
import { WORK_DAY_HOURS, isOnLeave, isStaff, todayKey } from './hrUtils';
import './styles/reports.css';

const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
const avg = (values) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0);
const progressOf = (a) => Math.min(Number(a.hours_spent || 0) / WORK_DAY_HOURS, 1) * 100;

/** Last six calendar months as { key: 'YYYY-MM', label: 'Mon' }. */
function lastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1));
    return { key: d.toISOString().slice(0, 7), label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }) };
  });
}

function computeReport({ employees, attendance, tasks, issues, leaves }) {
  const staff = employees.filter(isStaff);
  const today = todayKey();
  const months = lastSixMonths();
  const resolved = (i) => /resolved|closed/i.test(i.status || '');
  const presentToday = new Set(attendance.filter((a) => a.attendance_date === today).map((a) => a.emp_id));
  const leaveToday = staff.filter((e) => !presentToday.has(e.emp_id) && isOnLeave(leaves, e.emp_id, today)).length;

  const byDept = staff.reduce((acc, e) => {
    const key = e.department_id || 'Unassigned';
    (acc[key] ||= []).push(e.emp_id);
    return acc;
  }, {});

  return {
    kpis: {
      employees: employees.length,
      productivity: Math.round(avg(attendance.map(progressOf))),
      attendanceRate: pct(attendance.filter((a) => a.status === 'PRESENT').length, attendance.length),
      taskCompletion: pct(tasks.filter((t) => t.status === 'COMPLETED').length, tasks.length),
    },
    summary: {
      hours: attendance.reduce((s, a) => s + Number(a.hours_spent || 0), 0),
      tasksDone: tasks.filter((t) => t.status === 'COMPLETED').length,
      avgHours: avg(attendance.map((a) => Number(a.hours_spent || 0))).toFixed(1),
    },
    productivity: months.map((m) => Math.round(avg(attendance.filter((a) => a.attendance_date?.startsWith(m.key)).map(progressOf)))),
    taskStatus: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].map((s) => tasks.filter((t) => t.status === s).length),
    attendanceToday: [presentToday.size, Math.max(staff.length - presentToday.size - leaveToday, 0), leaveToday],
    issues: {
      resolved: months.map((m) => issues.filter((i) => i.raised_date?.startsWith(m.key) && resolved(i)).length),
      open: months.map((m) => issues.filter((i) => i.raised_date?.startsWith(m.key) && !resolved(i)).length),
    },
    departments: Object.entries(byDept).map(([dept, ids]) => ({
      dept,
      score: Math.round(avg(attendance.filter((a) => ids.includes(a.emp_id)).map(progressOf))),
    })),
    months: months.map((m) => m.label),
  };
}

function buildCharts(r) {
  const { textColor, gridColor } = chartTheme();
  const common = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: textColor } } },
    scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true } },
  };
  return {
    productivity: {
      type: 'line',
      data: { labels: r.months, datasets: [{ label: 'Avg. Work Progress %', data: r.productivity, borderColor: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.1)', borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: '#7C3AED' }] },
      options: common,
    },
    task: {
      type: 'bar',
      data: { labels: ['Not Started', 'In Progress', 'Completed'], datasets: [{ label: 'Tasks', data: r.taskStatus, backgroundColor: '#F97316', borderRadius: 4, barThickness: 16 }] },
      options: common,
    },
    attendance: {
      type: 'pie',
      data: { labels: ['Present', 'Absent', 'On Leave'], datasets: [{ data: r.attendanceToday, backgroundColor: ['#22C55E', '#EF4444', '#F97316'], borderWidth: 1, borderColor: '#ffffff' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 20 } } } },
    },
    issues: {
      type: 'bar',
      data: {
        labels: r.months,
        datasets: [
          { label: 'Resolved', data: r.issues.resolved, backgroundColor: '#22C55E', borderRadius: 4 },
          { label: 'Open', data: r.issues.open, backgroundColor: '#EF4444', borderRadius: 4 },
        ],
      },
      options: common,
    },
    dept: {
      type: 'bar',
      data: { labels: r.departments.map((d) => d.dept), datasets: [{ label: 'Avg. Work Progress %', data: r.departments.map((d) => d.score), backgroundColor: '#7C3AED', borderRadius: 4 }] },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true, max: 100 }, y: { grid: { display: false }, ticks: { color: textColor } } },
      },
    },
  };
}

function ChartItem({ title, id, config, ready, height }) {
  return (
    <div className="card chart-item">
      <div className="chart-title">{title}</div>
      <div className="chart-wrapper" style={height ? { height } : undefined}>
        {!ready && <div className="skeleton"></div>}
        <ChartCanvas id={id} config={config} />
      </div>
    </div>
  );
}

export default function HrReports() {
  usePageTitle('Reports & Analytics');
  const [toast, showToast] = useSaToast();
  const [report, setReport] = useState(null);
  const [charts, setCharts] = useState(null);
  const [chartsDone, setChartsDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [employees, issues, leaves] = await Promise.all([hr.getEmployees(), hr.getIssues(), hr.getLeaves()]);
        const staff = employees.filter(isStaff);
        const [attendance, tasks] = await Promise.all([hr.getAttendanceFor(staff), hr.getTasksFor(staff)]);
        const r = computeReport({ employees, attendance, tasks, issues, leaves });
        if (cancelled) return;
        setReport(r);
        try {
          await loadChartJs();
          if (!cancelled) setCharts(buildCharts(r));
        } catch {
          if (!cancelled) showToast('Charts could not be loaded.', 'error');
        } finally {
          if (!cancelled) setChartsDone(true);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  if (error) return <div className="hr-reports-root"><div className="card" style={{ color: '#EF4444' }}><i className="ph ph-warning-circle"></i> Failed to load reports.</div></div>;

  const k = report?.kpis;
  const kpi = (tip, icon, style, label, value, suffix = '') => (
    <div className="card hr-tooltip" data-tip={tip}>
      <div className="kpi-icon" style={style}><i className={`ph-fill ${icon}`}></i></div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-val">{report ? <AnimatedCount value={value} /> : 0}{suffix}</div>
    </div>
  );

  return (
    <div className="hr-reports-root" id="reports-container">
      <div className="kpi-grid">
        {kpi('Everyone in your company', 'ph-users', { background: 'rgba(59,130,246,0.1)', color: 'var(--rep-blue)' }, 'Total Employees', k?.employees)}
        {kpi('Average of hours logged / 8h workday', 'ph-chart-line-up', { background: 'rgba(34,197,94,0.1)', color: 'var(--rep-green)' }, 'Avg. Work Progress', k?.productivity, '%')}
        {kpi('Attendance records marked Present', 'ph-calendar-check', { background: 'rgba(124,58,237,0.1)', color: 'var(--rep-primary)' }, 'Attendance Rate', k?.attendanceRate, '%')}
        {kpi('Assigned tasks marked Completed', 'ph-check-square-offset', { background: 'rgba(249,115,22,0.1)', color: 'var(--rep-orange)' }, 'Task Completion', k?.taskCompletion, '%')}
      </div>

      <div className="chart-grid">
        <ChartItem title="Work Progress Trend (6 months)" id="chartProductivity" config={charts?.productivity} ready={chartsDone} />
        <ChartItem title="Task Status" id="chartTask" config={charts?.task} ready={chartsDone} />
      </div>
      <div className="chart-grid">
        <ChartItem title="Today's Attendance" id="chartAttendance" config={charts?.attendance} ready={chartsDone} />
        <ChartItem title="Issue Resolution Report" id="chartIssues" config={charts?.issues} ready={chartsDone} />
      </div>
      <ChartItem title="Department Work Progress" id="chartDept" config={charts?.dept} ready={chartsDone} height={350} />

      <div className="card bottom-summary">
        <div className="bs-item" style={{ borderLeftColor: 'var(--rep-blue)' }}>
          <div className="bs-label">Total Work Hours</div>
          <div className="bs-val">{report ? `${report.summary.hours.toLocaleString()} hrs` : '-'}</div>
        </div>
        <div className="bs-item" style={{ borderLeftColor: 'var(--rep-green)' }}>
          <div className="bs-label">Tasks Completed</div>
          <div className="bs-val">{report ? report.summary.tasksDone : '-'}</div>
        </div>
        <div className="bs-item" style={{ borderLeftColor: 'var(--rep-primary)' }}>
          <div className="bs-label">Average Hours per Day</div>
          <div className="bs-val">{report ? `${report.summary.avgHours} hrs` : '-'}</div>
        </div>
      </div>

      {toast}
    </div>
  );
}
