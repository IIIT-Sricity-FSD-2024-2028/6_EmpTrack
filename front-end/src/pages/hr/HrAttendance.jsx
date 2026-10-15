// Converted from front-end/hr/attendance.html + js/views/hr/attendance.js.
// The original showed hard-coded demo rows; this reads every employee's attendance
// from the backend and shows the selected day (today by default).
import { useEffect, useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import * as hr from '../../services/hrService';
import { WORK_DAY_HOURS, departmentsOf, isOnLeave, isStaff, todayKey } from './hrUtils';
import './styles/attendance.css';

const BADGES = {
  present: { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--hr-success)', border: 'rgba(34, 197, 94, 0.2)', tip: 'Checked in normally' },
  late: { bg: 'rgba(249, 115, 22, 0.1)', color: 'var(--hr-warning)', border: 'rgba(249, 115, 22, 0.2)', tip: 'Arrived after threshold' },
  escalated: { bg: 'rgba(249, 115, 22, 0.1)', color: 'var(--hr-warning)', border: 'rgba(249, 115, 22, 0.2)', tip: 'Work progress below 50%' },
  absent: { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--hr-danger)', border: 'rgba(239, 68, 68, 0.2)', tip: 'No check-in recorded' },
  leave: { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--hr-info)', border: 'rgba(59, 130, 246, 0.2)', tip: 'Approved leave' },
};

/** 'HH:mm' -> minutes after midnight. */
const minutes = (hhmm) => {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  return Number.isNaN(h) ? null : h * 60 + (m || 0);
};

/** Weekdays from the 1st of the date's month up to and including the date. */
function workingDaysUpTo(date) {
  const d = new Date(`${date}T00:00:00Z`);
  let count = 0;
  for (let day = 1; day <= d.getUTCDate(); day += 1) {
    const wd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), day)).getUTCDay();
    if (wd !== 0 && wd !== 6) count += 1;
  }
  return count;
}

function DataCard({ tone, icon, label, value }) {
  return (
    <div className={`data-card card-${tone}`}>
      <div className="card-icon"><i className={`ph-fill ${icon}`}></i></div>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}>{value}</div>
      </div>
    </div>
  );
}

export default function HrAttendance() {
  usePageTitle('Attendance Management');
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({ search: '', dept: 'all', status: 'all', date: todayKey() });
  const [barsReady, setBarsReady] = useState(false);
  const lateAfter = 9 * 60 + Number(hr.getHrSettings().attendance.lateThreshold || 0);

  useEffect(() => {
    (async () => {
      try {
        const [employees, leaves] = await Promise.all([hr.getEmployees(), hr.getLeaves().catch(() => [])]);
        const staff = employees.filter(isStaff);
        setData({ staff, leaves, attendance: await hr.getAttendanceFor(staff) });
      } catch {
        setError(true);
      }
    })();
  }, []);

  useEffect(() => {
    setBarsReady(false);
    const timer = setTimeout(() => setBarsReady(true), 50);
    return () => clearTimeout(timer);
  }, [data, filters]);

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  const { staff = [], leaves = [], attendance = [] } = data || {};
  const rowsForDate = staff.map((emp) => {
    const record = attendance.find((a) => a.emp_id === emp.emp_id && a.attendance_date === filters.date);
    let status;
    if (record) {
      if (record.status === 'ESCALATED') status = 'escalated';
      else status = minutes(record.check_in_time) > lateAfter ? 'late' : 'present';
    } else {
      status = isOnLeave(leaves, emp.emp_id, filters.date) ? 'leave' : 'absent';
    }
    const hours = Number(record?.hours_spent || 0);
    return { emp, record, status, hours, progress: Math.min(Math.round((hours / WORK_DAY_HOURS) * 100), 100) };
  });

  const term = filters.search.toLowerCase();
  const visible = rowsForDate.filter(({ emp, status }) =>
    (!term || emp.emp_name.toLowerCase().includes(term) || emp.emp_id.toLowerCase().includes(term))
    && (filters.dept === 'all' || emp.department_id === filters.dept)
    && (filters.status === 'all' || status === filters.status));

  const count = (...statuses) => visible.filter((r) => statuses.includes(r.status)).length;
  const month = filters.date.slice(0, 7);
  const workingDays = workingDaysUpTo(filters.date);
  const monthPresent = attendance.filter((a) => a.attendance_date?.startsWith(month) && a.attendance_date <= filters.date).length;
  const avgAttendance = staff.length && workingDays ? Math.round((monthPresent / (staff.length * workingDays)) * 100) : 0;

  let body;
  if (error) body = <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--hr-danger)', padding: 32 }}>Failed to load attendance.</td></tr>;
  else if (!data) body = <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Loading attendance...</td></tr>;
  else if (visible.length === 0) body = <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No results found</td></tr>;
  else {
    body = visible.map(({ emp, record, status, hours, progress }) => {
      const badge = BADGES[status];
      let barColor = 'var(--hr-danger)';
      if (progress >= 70) barColor = 'var(--hr-success)';
      else if (progress >= 50) barColor = '#EAB308';
      return (
        <tr key={emp.emp_id}>
          <td><span style={{ color: 'var(--hr-primary)', fontWeight: 600 }}>{emp.emp_id}</span></td>
          <td style={{ fontWeight: 500 }}>{emp.emp_name}</td>
          <td>{emp.department_id || '-'}</td>
          <td>{record?.check_in_time || '-'}</td>
          <td>{hours}h / {WORK_DAY_HOURS}h</td>
          <td>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{progress}%</div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: barsReady ? `${progress}%` : '0%', backgroundColor: barColor }}></div>
            </div>
          </td>
          <td>
            <span className="status-badge" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }} data-tooltip={badge.tip}>
              {status === 'leave' ? 'On Leave' : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </td>
        </tr>
      );
    });
  }

  return (
    <div className="hr-attendance-dashboard">
      <section className="summary-cards">
        <DataCard tone="blue" icon="ph-calendar-blank" label="Working Days (month to date)" value={workingDays} />
        <DataCard tone="green" icon="ph-user-check" label="Present" value={count('present', 'late', 'escalated')} />
        <DataCard tone="red" icon="ph-user-minus" label="Absent" value={count('absent')} />
        <DataCard tone="orange" icon="ph-clock-user" label="On Leave" value={count('leave')} />
        <DataCard tone="purple" icon="ph-chart-line-up" label="Avg Attendance (month)" value={`${avgAttendance}%`} />
      </section>

      <section className="filters-section">
        <div className="search-bar">
          <i className="ph ph-magnifying-glass"></i>
          <input type="text" maxLength={100} id="hrSearchInput" placeholder="Search by name or ID..." aria-label="Search by name or ID" value={filters.search} onChange={set('search')} />
        </div>
        <div className="filter-dropdowns">
          <input type="date" id="hrDateFilter" aria-label="Attendance date" value={filters.date} max={todayKey()} onChange={(e) => e.target.value && set('date')(e)} />
          <select id="hrDeptFilter" aria-label="Filter by department" value={filters.dept} onChange={set('dept')}>
            <option value="all">All Departments</option>
            {departmentsOf(staff).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select id="hrStatusFilter" aria-label="Filter by status" value={filters.status} onChange={set('status')}>
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="escalated">Escalated</option>
            <option value="absent">Absent</option>
            <option value="leave">On Leave</option>
          </select>
        </div>
      </section>

      <section className="table-section">
        <table id="hrAttendanceTable">
          <thead>
            <tr><th>Employee ID</th><th>Name</th><th>Department</th><th>Check-in Time</th><th>Work Hours</th><th>Work Progress</th><th>Status</th></tr>
          </thead>
          <tbody id="hrTableBody">{body}</tbody>
        </table>
      </section>

      <section style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div className="logic-card">
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ph-fill ph-calculator" style={{ color: 'var(--hr-primary)' }}></i> Attendance Calculation Method
          </h3>
          <div style={{ backgroundColor: 'var(--bg-main)', padding: 16, borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontWeight: 600, marginBottom: 16, border: '1px solid var(--border-color)' }}>
            Progress % = (Total Hours Spent / Estimated Hours) * 100
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ph-fill ph-check-circle" style={{ color: 'var(--hr-success)' }}></i> <strong>Marked Present</strong> &rarr; if progress &ge; 50%
            </li>
            <li style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ph-fill ph-warning-circle" style={{ color: 'var(--hr-warning)' }}></i> <strong>Escalated</strong> &rarr; if progress &lt; 50%
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
