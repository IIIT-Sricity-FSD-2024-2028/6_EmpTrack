// Converted from front-end/hr/dashboard.html + js/views/hr/dashboard.js.
// The original rendered hard-coded demo numbers; every figure here comes from the backend.
// The Company Admin dashboard is the same page without leave approvals or the action
// cards (as in the original company_admin/dashboard.html).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AnimatedCount from '../../components/sa-common/AnimatedCount';
import useSaToast from '../../components/sa-common/useSaToast';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import * as hr from '../../services/hrService';
import { HR_BASE, ROLE_NAMES, isOnLeave, isStaff, joinedThisMonth, shortDate, todayKey } from './hrUtils';
import { LEAVE_TYPE_LABELS } from '../teamlead/tlUtils';
import './styles/dashboard.css';

function SummaryCard({ icon, iconStyle, trend, trendStyle, value, label }) {
  return (
    <div className="card summary-card">
      <div className="sc-header">
        <div className="sc-icon" style={iconStyle}><i className={`ph-fill ${icon}`}></i></div>
        {trend && <div className="sc-trend" style={trendStyle}>{trend}</div>}
      </div>
      <div>
        <div className="sc-value"><AnimatedCount value={value} /></div>
        <div className="sc-label">{label}</div>
      </div>
    </div>
  );
}

const GREEN = { background: 'rgba(34,197,94,0.1)', color: 'var(--hr-success)' };
const RED = { background: 'rgba(239,68,68,0.1)', color: 'var(--hr-danger)' };

export default function HrDashboard({ basePath = HR_BASE, showLeaveApprovals = true, showActions = true }) {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const [toast, showToast] = useSaToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [barsReady, setBarsReady] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      // The approval list is the backend's HR review queue (emergency leaves and Team
      // Lead leaves); ordinary employee leaves are decided by their Team Lead.
      const [employees, leaves, queue] = await Promise.all([
        hr.getEmployees(),
        hr.getLeaves(),
        showLeaveApprovals ? hr.getLeaveReviewQueue() : [],
      ]);
      const staff = employees.filter(isStaff);
      const attendance = await hr.getAttendanceFor(staff);
      setData({ employees, staff, leaves, queue, attendance });
      setError(false);
    } catch {
      setError(true);
    }
  }, [showLeaveApprovals]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!data) return undefined;
    const timer = setTimeout(() => setBarsReady(true), 100);
    return () => clearTimeout(timer);
  }, [data]);

  const decide = async (leave, status) => {
    setBusy(leave.leave_id);
    try {
      await hr.updateLeaveStatus(leave.leave_id, status, user.emp_id);
      showToast(status === 'APPROVED' ? 'Leave approved.' : 'Leave rejected.');
      await load();
    } catch (e) {
      showToast(e.message || 'Failed to update leave.', 'error');
    } finally {
      setBusy(null);
    }
  };

  if (error) {
    return <div className="hr-dashboard-root"><div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--hr-danger)' }}><i className="ph ph-warning-circle"></i> Failed to load the HR dashboard.</div></div>;
  }
  if (!data) {
    return <div className="hr-dashboard-root"><div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard...</div></div>;
  }

  const { employees, staff, leaves, queue, attendance } = data;
  const today = todayKey();
  const presentIds = new Set(attendance.filter((a) => a.attendance_date === today).map((a) => a.emp_id));
  const presentPct = staff.length ? Math.round((presentIds.size / staff.length) * 100) : 0;
  const pending = leaves.filter((l) => l.status === 'PENDING');
  // Emergency requests first, then oldest first.
  const toReview = [...queue].sort((a, b) =>
    (b.leave_type === 'EMERGENCY') - (a.leave_type === 'EMERGENCY') || String(a.applied_date).localeCompare(String(b.applied_date)));
  const teams = new Set(staff.map((e) => e.team_id).filter(Boolean));
  const newThisMonth = employees.filter((e) => joinedThisMonth(e)).length;
  const nameOf = (id) => employees.find((e) => e.emp_id === id)?.emp_name || id;

  const departments = Object.entries(
    staff.reduce((acc, e) => {
      const key = e.department_id || 'Unassigned';
      (acc[key] ||= []).push(e);
      return acc;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  const recent = [...employees].sort((a, b) => String(b.date_of_joining).localeCompare(String(a.date_of_joining))).slice(0, 3);

  return (
    <div className="hr-dashboard-root">
      <div className="summary-grid">
        <SummaryCard icon="ph-users" iconStyle={{ background: 'rgba(59,130,246,0.1)', color: 'var(--hr-info)' }} trend={newThisMonth ? `+${newThisMonth}` : null} trendStyle={GREEN} value={employees.length} label="Total Employees" />
        <SummaryCard icon="ph-users-three" iconStyle={{ background: 'rgba(124,58,237,0.1)', color: 'var(--hr-primary)' }} value={teams.size} label="Active Teams" />
        <SummaryCard icon="ph-check-circle" iconStyle={GREEN} trend={`${presentPct}%`} trendStyle={GREEN} value={presentIds.size} label="Present Today" />
        <SummaryCard icon="ph-calendar-x" iconStyle={{ background: 'rgba(249,115,22,0.1)', color: 'var(--hr-warning)' }} value={pending.length} label="Pending Leaves" />
      </div>

      <div className="main-grid">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 20px 0 20px', fontWeight: 600, fontSize: 16 }}>Attendance Overview by Department (Today)</div>
          <div className="dept-list" id="dept-list-container">
            {departments.length === 0 && <div style={{ padding: 20, color: 'var(--text-muted)' }}>No employees yet.</div>}
            {departments.map(([dept, members]) => {
              const present = members.filter((m) => presentIds.has(m.emp_id)).length;
              const onLeave = members.filter((m) => !presentIds.has(m.emp_id) && isOnLeave(leaves, m.emp_id, today)).length;
              const perc = (present / members.length) * 100;
              return (
                <div key={dept} className="dept-item">
                  <div className="dept-header">
                    <span>{dept} ({members.length})</span>
                    <div className="dept-stats">
                      <div className="dept-stat-box green">{present} Present</div>
                      <div className="dept-stat-box red">{members.length - present - onLeave} Absent</div>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: barsReady ? `${perc}%` : 0 }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div style={{ padding: 20, fontWeight: 600, fontSize: 16, display: 'flex', justifyContent: 'space-between' }}>
              <span>Recently Added</span>
              <Link to={`${basePath}/employee-management`}><span style={{ fontSize: 12, color: 'var(--hr-primary)', cursor: 'pointer' }}>View All</span></Link>
            </div>
            <div className="list-wrapper" id="recent-emp-container">
              {recent.map((e) => (
                <div key={e.emp_id} className="list-item">
                  <div className="li-left">
                    <div className="li-avatar">{e.emp_name.charAt(0)}</div>
                    <div className="li-details">
                      <div className="li-name">{e.emp_name}</div>
                      <div className="li-sub">{ROLE_NAMES[e.role] || e.role} &bull; {e.department_id || '-'}</div>
                      <div className="li-sub" style={{ fontSize: 10 }}>Joined {shortDate(e.date_of_joining)}</div>
                    </div>
                  </div>
                  <div className={`badge ${e.status === 'ACTIVE' ? 'green' : 'red'}`}>{e.status === 'ACTIVE' ? 'Active' : 'Inactive'}</div>
                </div>
              ))}
            </div>
          </div>

          {showLeaveApprovals && (
          <div className="card">
            <div style={{ padding: 20, fontWeight: 600, fontSize: 16, display: 'flex', justifyContent: 'space-between' }}>
              <span>Leave Approvals</span>
              <span className="badge blue" id="pending-leaves-badge">{toReview.length} Pending</span>
            </div>
            <div className="list-wrapper" id="leavesContainer">
              {toReview.length === 0 && <div style={{ padding: '0 20px 20px', color: 'var(--text-muted)', fontSize: 13 }}>No leave requests waiting for HR approval.</div>}
              {toReview.map((l) => (
                <div key={l.leave_id} className="list-item">
                  <div className="li-left">
                    <div className="li-details">
                      <div className="li-name">
                        {nameOf(l.emp_id)} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>({l.emp_id})</span>
                        <span className="badge blue" style={{ fontSize: 9, marginLeft: 4 }}>{l.days} day{Number(l.days) === 1 ? '' : 's'}</span>
                        {l.leave_type === 'EMERGENCY' && <span className="badge red" style={{ fontSize: 9, marginLeft: 4 }}><i className="ph-fill ph-siren"></i> Emergency</span>}
                      </div>
                      <div className="li-sub"><i className="ph ph-calendar"></i> {shortDate(l.start_date)} - {shortDate(l.end_date)}</div>
                      <div className="li-sub" style={{ fontWeight: 500, color: l.leave_type === 'EMERGENCY' ? 'var(--hr-danger)' : 'var(--hr-warning)' }}>{LEAVE_TYPE_LABELS[l.leave_type] || l.leave_type} &bull; {l.status.charAt(0) + l.status.slice(1).toLowerCase()}</div>
                      <div className="li-sub" style={{ whiteSpace: 'normal' }}>{l.reason}</div>
                      <div className="li-sub" style={{ fontSize: 10 }}>Submitted {shortDate(l.applied_date)}</div>
                    </div>
                  </div>
                  <div className="action-btns">
                    <button type="button" className="btn-text btn-approve" disabled={busy === l.leave_id} onClick={() => decide(l, 'APPROVED')}><i className="ph ph-check"></i> Approve</button>
                    <button type="button" className="btn-text btn-reject" disabled={busy === l.leave_id} onClick={() => decide(l, 'REJECTED')}><i className="ph ph-x"></i> Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      {showActions && (
      <div className="actions-grid">
        <Link to={`${HR_BASE}/attendance`} className="card action-card">
          <div className="ac-icon" style={{ background: 'var(--hr-success)' }}><i className="ph ph-calendar-check"></i></div>
          <div><div style={{ fontWeight: 600, fontSize: 16 }}>View Attendance</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manage daily records</div></div>
        </Link>
        <Link to={`${HR_BASE}/escalations`} className="card action-card">
          <div className="ac-icon" style={{ background: 'var(--hr-warning)' }}><i className="ph ph-envelope-open"></i></div>
          <div><div style={{ fontWeight: 600, fontSize: 16 }}>Manage Escalations</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Review pending requests</div></div>
        </Link>
        <Link to={`${HR_BASE}/reports`} className="card action-card">
          <div className="ac-icon" style={{ background: 'var(--hr-primary)' }}><i className="ph ph-chart-bar"></i></div>
          <div><div style={{ fontWeight: 600, fontSize: 16 }}>View Reports</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Org analytics &amp; stats</div></div>
        </Link>
      </div>
      )}

      {toast}
    </div>
  );
}
