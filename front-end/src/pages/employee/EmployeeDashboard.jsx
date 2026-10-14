import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { getAttendanceForUser } from '../../services/attendanceService';
import { getLeavesForUser } from '../../services/leaveService';
import { getTasksForUser } from '../../services/taskService';
import { todayUtcKey } from '../../utils/helpers';
import ProgressBar from './components/ProgressBar';
import { empPath, leaveStatusBadge, WORKING_DAYS_PER_MONTH } from './employeeUtils';
import './styles/dashboard.css';

function StatCard({ value, label, icon, tone }) {
  return (
    <div className="card stat-card">
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className={`stat-icon icon-${tone}`}>
        <i className={`ph-fill ${icon}`}></i>
      </div>
    </div>
  );
}

function TaskSummaryCard({ task }) {
  const done = task.progress_percentage === 100;
  const badge = task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'info' : 'warning';

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', background: 'var(--bg-main)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--font-bold)', letterSpacing: '0.5px' }}>
          #{task.task_id}
        </span>
        <Badge variant={badge} style={{ fontSize: 10 }}>{task.status.replace('_', ' ')}</Badge>
      </div>
      <h4 style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)', lineHeight: 1.4, color: 'var(--text-main)' }}>{task.task_title}</h4>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Progress</span>
          <span style={{ fontSize: 10, fontWeight: 'var(--font-bold)', color: done ? 'var(--secondary-color)' : 'var(--text-main)' }}>
            {task.progress_percentage}%
          </span>
        </div>
        <ProgressBar value={task.progress_percentage} color={done ? 'var(--secondary-color)' : 'var(--primary-color)'} />
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  usePageTitle('Dashboard');
  const { user } = useAuth();

  const { data } = useFetch(async () => {
    const [tasks, attendance, leaves] = await Promise.all([
      getTasksForUser(user.emp_id),
      getAttendanceForUser(user.emp_id),
      getLeavesForUser(user.emp_id),
    ]);
    return { tasks, attendance, leaves };
  }, [user.emp_id]);

  const tasks = data?.tasks ?? [];
  const attendance = data?.attendance ?? [];
  const recentLeaves = (data?.leaves ?? []).slice(0, 3);

  const today = todayUtcKey();
  const monthRecords = attendance.filter((a) => a.attendance_date.startsWith(today.substring(0, 7)));
  const todayRecord = monthRecords.find((a) => a.attendance_date === today);
  const presentDays = monthRecords.filter((a) => a.status === 'PRESENT').length;

  const stats = [
    { label: 'Total Tasks', value: tasks.length, icon: 'ph-briefcase', tone: 'primary' },
    { label: 'In Progress', value: tasks.filter((t) => t.status === 'IN_PROGRESS').length, icon: 'ph-spinner-gap', tone: 'blue' },
    { label: 'Pending', value: tasks.filter((t) => t.status === 'NOT_STARTED' || t.status === 'BLOCKED').length, icon: 'ph-clock', tone: 'yellow' },
    { label: 'Completed', value: tasks.filter((t) => t.status === 'COMPLETED').length, icon: 'ph-check-circle', tone: 'green' },
    { label: 'Attendance %', value: `${Math.round((presentDays / WORKING_DAYS_PER_MONTH) * 100)}%`, icon: 'ph-calendar-check', tone: 'gray' },
  ];

  const hoursToday = todayRecord
    ? todayRecord.hours_spent || `${Math.round((todayRecord.screen_time || 0) / 60)} hrs`
    : '0 hrs';

  return (
    <div className="emp-dashboard">
      {/* Welcome Banner */}
      <div className="card dashboard-welcome-banner">
        <div>
          <h2 className="welcome-title">Welcome back, {user.emp_name.split(' ')[0]}!</h2>
          <p className="welcome-subtitle">Here is your work summary for today</p>
        </div>
        <div className="welcome-icon">
          <i className="ph ph-trend-up"></i>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Assigned Tasks Summary */}
      <div className="card dashboard-tasks-section">
        <div className="card-header">
          <h3 className="section-title">Assigned Tasks Summary</h3>
          <Link to={empPath('tasks')} className="btn btn-outline btn-sm-link">View All</Link>
        </div>
        <div className="dashboard-tasks-list">
          {tasks.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', width: '100%', padding: 20 }}>No recent tasks.</div>
          ) : (
            tasks.slice(0, 4).map((task) => <TaskSummaryCard key={task.task_id} task={task} />)
          )}
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Attendance Status</h3>
          </div>
          <div className="attendance-status-list">
            <div className="attendance-status-item border-bottom">
              <span className="status-label">Today&apos;s Status</span>
              <Badge variant={todayRecord ? 'success' : 'danger'}>{todayRecord ? 'Present' : 'Absent'}</Badge>
            </div>
            <div className="attendance-status-item border-bottom">
              <span className="status-label">Check-In Time</span>
              <span className="status-value font-semibold">{todayRecord?.check_in_time || '--:--'}</span>
            </div>
            <div className="attendance-status-item border-bottom">
              <span className="status-label">Work Hours Built</span>
              <span className="status-value font-semibold">{hoursToday}</span>
            </div>
            <div className="attendance-status-item pt-10">
              <span className="status-label">This Month</span>
              <div className="month-status">
                <span className="month-days">{presentDays}</span>
                <span className="month-total"> / {WORKING_DAYS_PER_MONTH} Days Present</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Recent Leave Requests</h3>
          </div>
          <ul className="recent-leaves-list">
            {recentLeaves.length === 0 ? (
              <li style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No leave requests filed.</li>
            ) : (
              recentLeaves.map((leave) => (
                <li
                  key={leave.leave_id}
                  style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{leave.leave_type} Leave</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {leave.start_date} to {leave.end_date}
                    </p>
                  </div>
                  <Badge variant={leaveStatusBadge(leave.status)}>{leave.status}</Badge>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
