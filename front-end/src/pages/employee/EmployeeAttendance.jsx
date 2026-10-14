import { useState } from 'react';
import Badge from '../../components/common/Badge';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { getAttendanceForUser, markAttendance, markCheckOut } from '../../services/attendanceService';
import { cx, todayUtcKey } from '../../utils/helpers';
import { WORKING_DAYS_PER_MONTH } from './employeeUtils';
import './styles/attendance.css';

const RATE_PATH = 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831';
const LOCATIONS = ['Office', 'Home'];

// Same rules as the original table: under 4 recorded hours counts as escalated.
function displayStatus(record) {
  return parseInt(record.hours_spent, 10) < 4.0 ? 'ESCALATED' : record.status;
}

function statusBadge(status) {
  if (status === 'PRESENT') return 'present';
  if (status === 'ABSENT') return 'absent';
  if (status === 'WEEKEND') return 'weekend';
  if (status === 'ESCALATED') return 'escalated';
  return 'not-started';
}

function SummaryCard({ icon, iconClass, value, label, valueClass, valueStyle }) {
  return (
    <div className="card attendance-summary-card">
      <div className={`summary-icon ${iconClass}`}>
        <i className={`ph-fill ${icon} icon-lg`}></i>
      </div>
      <div className={cx('summary-value', valueClass)} style={valueStyle}>{value}</div>
      <div className="summary-label">{label}</div>
    </div>
  );
}

export default function EmployeeAttendance() {
  usePageTitle('Attendance');
  const { user } = useAuth();
  const { data: records = [], reload } = useFetch(() => getAttendanceForUser(user.emp_id), [user.emp_id]);
  // Location chosen before checking in (the saved record's mode wins afterwards).
  const [chosenLocation, setChosenLocation] = useState('Office');

  const today = todayUtcKey();
  const todaysRecord = records.find((a) => a.attendance_date === today);
  const isCheckedIn = Boolean(todaysRecord?.check_in_time && !todaysRecord?.check_out_time);
  const isCheckedOut = Boolean(todaysRecord?.check_out_time);
  const locked = isCheckedIn || isCheckedOut;
  const activeLocation = todaysRecord ? (todaysRecord.attendance_mode === 'REMOTE' ? 'Home' : 'Office') : chosenLocation;

  const presentDays = records.filter((a) => a.status === 'PRESENT' && a.attendance_date.startsWith(today.slice(0, 7))).length;
  const attendanceRate = Math.round((presentDays / WORKING_DAYS_PER_MONTH) * 100) || 0;
  const escalationCount = records.filter((a) => a.status === 'ESCALATED').length;

  const handleCheckIn = async () => {
    if (todaysRecord?.check_in_time) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    await markAttendance(user.emp_id, time, activeLocation === 'Home' ? 'REMOTE' : 'OFFICE');
    reload();
  };

  const handleCheckOut = async () => {
    await markCheckOut(user.emp_id);
    reload();
  };

  // Check-in is the live action before checking in, check-out after; both are off once checked out.
  const checkInActive = !isCheckedIn && !isCheckedOut;
  const checkOutActive = isCheckedIn && !isCheckedOut;

  return (
    <div className="emp-attendance">
      <div className="attendance-page-layout">
        {/* SECTION 1: MARK ATTENDANCE */}
        <div className="card attendance-mark-card">
          <h3 className="attendance-card-title">Mark your Attendance</h3>
          <div className="attendance-card-subtitle">Select your work location and mark check-in/check-out</div>

          <div className="attendance-location-container">
            <div className="location-label">Work Location</div>
            <div className="location-toggle-group">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className={cx('location-toggle', activeLocation === loc && 'active')}
                  disabled={locked}
                  onClick={() => setChosenLocation(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div className="attendance-action-group">
            <button
              type="button"
              className={cx('btn btn-attendance', checkInActive ? 'btn-purple' : 'btn-outline action-btn-disabled')}
              disabled={!checkInActive}
              onClick={handleCheckIn}
            >
              Check-in
            </button>
            <button
              type="button"
              className={cx('btn btn-attendance', checkOutActive ? 'btn-purple' : 'btn-outline action-btn-disabled')}
              disabled={!checkOutActive}
              onClick={handleCheckOut}
            >
              Check-out
            </button>
          </div>
        </div>

        {/* SECTION 2: TODAY'S SUMMARY CARDS */}
        <div className="attendance-summary-grid">
          <SummaryCard
            icon="ph-check-circle"
            iconClass="bg-green"
            value={todaysRecord ? 'Present' : 'Pending'}
            valueStyle={{ color: todaysRecord ? 'var(--secondary-color)' : 'var(--text-muted)' }}
            label="Today's Status"
          />
          <SummaryCard icon="ph-clock" iconClass="bg-gray" value={todaysRecord?.hours_spent || 0} label="Work Hours Today" />
          <SummaryCard
            icon="ph-check-square-offset"
            iconClass="bg-primary-light"
            value={`${isCheckedIn ? 40 : isCheckedOut ? 100 : 0}%`}
            valueClass="color-primary"
            label="Today's Progress"
          />
          <SummaryCard icon="ph-calendar-blank" iconClass="bg-gray" value={`${presentDays}/${WORKING_DAYS_PER_MONTH}`} label="This Month" />
        </div>

        {/* SECTION 3: MONTHLY ATTENDANCE RECORDS */}
        <div className="card table-modern attendance-records-card">
          <div className="attendance-records-header">
            <h3 className="attendance-records-title">Monthly Attendance Records</h3>
          </div>
          <div className="table-container attendance-table-container">
            <table className="attendance-table">
              <thead>
                <tr className="attendance-table-header-row">
                  <th className="attendance-table-th">Date</th>
                  <th className="attendance-table-th">Status</th>
                  <th className="attendance-table-th">Hours Spent</th>
                  <th className="attendance-table-th">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map((a) => {
                  const status = displayStatus(a);
                  return (
                    <tr
                      key={a.attendance_id ?? a.attendance_date}
                      style={a.attendance_date === today ? { backgroundColor: '#F5F3FF' } : undefined}
                    >
                      <td style={{ padding: 16, fontWeight: 'var(--font-medium)' }}>{a.attendance_date}</td>
                      <td style={{ padding: 16 }}>
                        <Badge variant={statusBadge(status)} style={{ padding: '4px 12px', textTransform: 'capitalize' }}>
                          {status.toLowerCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: 16 }}>{a.hours_spent || '-'}</td>
                      <td style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>{a.remarks || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: PERFORMANCE METRICS */}
        <div className="attendance-metrics-grid">
          <div className="card metric-card">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg" d={RATE_PATH} />
              <path className="circle" strokeDasharray={`${attendanceRate}, 100`} d={RATE_PATH} />
              <text x="18" y="20.35" className="percentage">{attendanceRate}%</text>
            </svg>
            <div className="metric-chart-label">Attendance Rate</div>
          </div>
          <div className="card metric-card-flex">
            {/* Fixed value in the original page (no backend metric yet). */}
            <div className="metric-hero-value color-main">72%</div>
            <div className="metric-title">Average Daily Progress</div>
            <div className="metric-subtitle">Based on last 30 days</div>
          </div>
          <div className="card metric-card-flex">
            <div className="metric-hero-value color-orange">{escalationCount}</div>
            <div className="metric-title">Escalation Count</div>
            <div className="metric-subtitle">Issues escalated this month</div>
          </div>
        </div>
      </div>
    </div>
  );
}
