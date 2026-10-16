// Converted from front-end/hr/escalations.html + js/views/hr/escalations.js.
// The original mixed hard-coded demo escalations with alert()/prompt() actions;
// this lists the real escalations sent to HR (GET /escalations) and uses the
// backend's Reject (PATCH /escalations/:id/reject) and Report (POST /escalations/:id/report)
// actions. Same three views: queue -> details -> action center.
import { useCallback, useEffect, useState } from 'react';
import useSaToast from '../../components/sa-common/useSaToast';
import usePageTitle from '../../hooks/usePageTitle';
import * as hr from '../../services/hrService';
import { ROLE_NAMES, isStaff, shortDate } from './hrUtils';
import './styles/escalations.css';

const STATUS_STYLE = {
  Pending: { background: 'var(--color-med-bg)', color: 'var(--color-med)' },
  Rejected: { background: 'var(--color-high-bg)', color: 'var(--color-high)' },
  Resolved: { background: 'var(--color-low-bg)', color: 'var(--color-low)' },
};
const statusLabel = (s) => (s === 'OPEN' ? 'Pending' : s ? s.charAt(0) + s.slice(1).toLowerCase() : '-');
const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

/** Team Lead escalations are sent as "title: description". */
function splitReason(reason = '') {
  const i = reason.indexOf(': ');
  return i > 0 ? { title: reason.slice(0, i), description: reason.slice(i + 2) } : { title: reason, description: '' };
}

function Badge({ status }) {
  return <span className="badge" style={STATUS_STYLE[status] || { background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>{status}</span>;
}

function StatCard({ icon, style, value, label }) {
  return (
    <div className="card stat-card">
      <div className="stat-icon" style={style}><i className={`ph-fill ${icon}`}></i></div>
      <div><div className="stat-val">{value}</div><div className="stat-label">{label}</div></div>
    </div>
  );
}

export default function HrEscalations() {
  usePageTitle('Escalations');
  const [toast, showToast] = useSaToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState({ name: 'dashboard', id: null });
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [escalations, employees] = await Promise.all([hr.getEscalations(), hr.getEmployees()]);
      const attendance = await hr.getAttendanceFor(employees.filter(isStaff));
      setData({ escalations: [...escalations].reverse(), employees, attendance });
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const employee = (id) => data?.employees.find((e) => e.emp_id === id);
  const nameOf = (id) => employee(id)?.emp_name || id || '-';
  const toRow = (e) => ({
    ...e,
    ...splitReason(e.escalation_reason),
    statusText: statusLabel(e.status),
    raisedBy: nameOf(e.escalated_from),
    subject: employee(e.reference_id) ? nameOf(e.reference_id) : e.reference_id,
  });

  const reject = async (esc) => {
    setBusy(true);
    try {
      const res = await hr.rejectEscalation(esc.escalation_id);
      showToast(res?.message || 'Escalation rejected.');
      await load();
      setView({ name: 'dashboard', id: null });
    } catch (e) {
      showToast(e.message || 'Error rejecting escalation', 'error');
    } finally {
      setBusy(false);
    }
  };

  const report = async (esc) => {
    try {
      const res = await hr.generateEscalationReport(esc.escalation_id);
      if (!res?.report) throw new Error('The report could not be generated.');
      const rows = Object.entries(res.report);
      const csv = rows.map(([key, value]) => `${csvCell(key)},${csvCell(value)}`).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `escalation-${esc.escalation_id}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      showToast('Escalation report downloaded.');
    } catch (e) {
      showToast(e.message || 'Failed to generate report.', 'error');
    }
  };

  if (error) return <div className="hr-esc-root"><div className="card" style={{ color: 'var(--color-high)' }}><i className="ph ph-warning-circle"></i> Failed to load escalations.</div></div>;
  if (!data) return <div className="hr-esc-root"><div className="card" style={{ color: 'var(--text-muted)' }}>Loading escalations...</div></div>;

  const rows = data.escalations.map(toRow);
  const pending = rows.filter((r) => r.statusText === 'Pending');
  const visible = rows.filter((r) => filter === 'all' || r.statusText === filter);
  const categories = Object.entries(rows.reduce((acc, r) => ({ ...acc, [r.reference_type]: (acc[r.reference_type] || 0) + 1 }), {}));
  const attendanceAlerts = data.attendance.filter((a) => a.status === 'ESCALATED').sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  const current = rows.find((r) => r.escalation_id === view.id);

  const goDashboard = () => setView({ name: 'dashboard', id: null });
  let breadcrumbs = null;
  if (view.name === 'details') {
    breadcrumbs = <span onClick={goDashboard} role="button" tabIndex={0}><i className="ph ph-arrow-left"></i> Back to Dashboard</span>;
  } else if (view.name === 'action') {
    breadcrumbs = (
      <>
        <span onClick={goDashboard} role="button" tabIndex={0}><i className="ph ph-house"></i> Home</span>
        <i className="ph ph-caret-right" style={{ margin: '0 8px', color: 'var(--esc-muted)' }}></i>
        <span onClick={() => setView({ name: 'details', id: view.id })} role="button" tabIndex={0}>Details</span>
        <i className="ph ph-caret-right" style={{ margin: '0 8px', color: 'var(--esc-muted)' }}></i>
        <span style={{ color: 'var(--esc-text)' }}>Action Center</span>
      </>
    );
  }

  const filterBtn = (key, label, style) => (
    <button type="button" className={`btn ${filter === key ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '6px 12px', fontSize: 12, ...(filter === key ? {} : style) }} onClick={() => setFilter(key)}>{label}</button>
  );

  return (
    <>
      {breadcrumbs && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div id="escBreadcrumbs" style={{ fontSize: 13, fontWeight: 500, color: 'var(--emp-primary, #7B2CBF)', cursor: 'pointer' }}>{breadcrumbs}</div>
        </div>
      )}

      <div className="hr-esc-root">
        {view.name === 'dashboard' && (
          <div id="view-dashboard" className="page-view active">
            {pending.length > 0 && (
              <div className="alert-banner">
                <i className="ph-fill ph-warning-circle" style={{ fontSize: 24 }}></i>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Escalations Requiring HR Attention</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{pending.length} escalation{pending.length === 1 ? ' is' : 's are'} waiting for review.</div>
                </div>
              </div>
            )}

            <div className="stats-grid">
              <StatCard icon="ph-stack" style={{ background: 'rgba(123,44,191,0.1)', color: 'var(--esc-primary)' }} value={rows.length} label="Total Escalations" />
              <StatCard icon="ph-clock-counter-clockwise" style={{ background: 'var(--color-med-bg)', color: 'var(--color-med)' }} value={pending.length} label="Pending" />
              <StatCard icon="ph-prohibit" style={{ background: 'var(--color-high-bg)', color: 'var(--color-high)' }} value={rows.filter((r) => r.statusText === 'Rejected').length} label="Rejected" />
              <StatCard icon="ph-users-three" style={{ background: 'rgba(247,37,133,0.1)', color: 'var(--esc-accent)' }} value={new Set(rows.map((r) => r.escalated_from)).size} label="Raised By" />
              <StatCard icon="ph-calendar-x" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }} value={attendanceAlerts.length} label="Attendance Alerts" />
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <div style={{ padding: 20, borderBottom: '1px solid var(--esc-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>Escalations Queue</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {filterBtn('all', 'All')}
                  {filterBtn('Pending', 'Filter Pending', { color: 'var(--color-med)', borderColor: 'var(--color-med)' })}
                  {filterBtn('Rejected', 'Filter Rejected', { color: 'var(--color-high)', borderColor: 'var(--color-high)' })}
                </div>
              </div>
              <table id="escTable">
                <thead>
                  <tr><th>ID</th><th>Issue Title</th><th>Raised By</th><th>Category</th><th>Employee / Reference</th><th>Status</th><th>Date</th><th>Action</th></tr>
                </thead>
                <tbody id="escTbody">
                  {visible.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>{rows.length ? 'No escalations found for this filter.' : 'No escalated issues found'}</td></tr>
                  ) : (
                    visible.map((e) => (
                      <tr key={e.escalation_id} style={{ cursor: 'pointer' }} onClick={() => setView({ name: 'details', id: e.escalation_id })}>
                        <td style={{ fontWeight: 600, color: 'var(--esc-primary)' }}>{e.escalation_id}</td>
                        <td style={{ fontWeight: 500 }}>{e.title}</td>
                        <td>{e.raisedBy}</td>
                        <td>{e.reference_type}</td>
                        <td>{e.subject}{e.issue_id && <div style={{ fontSize: 11, color: 'var(--esc-muted)' }}>Issue {e.issue_id}</div>}</td>
                        <td><Badge status={e.statusText} /></td>
                        <td>{shortDate(e.escalation_date)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }} onClick={(ev) => ev.stopPropagation()}>
                            <button type="button" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setView({ name: 'details', id: e.escalation_id })}>Review</button>
                            <button type="button" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setView({ name: 'action', id: e.escalation_id })}>Take Action</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {categories.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 24 }}>
                {categories.map(([category, n], i) => (
                  <div key={category} className="card" style={{ padding: 16, textAlign: 'center', fontWeight: 600, fontSize: 14, color: ['var(--esc-primary)', 'var(--esc-secondary)', '#3B82F6', 'var(--color-high)'][i % 4] }}>
                    {category} ({n})
                  </div>
                ))}
              </div>
            )}

            <div className="card" style={{ marginTop: 24 }}>
              <h3 style={{ marginTop: 0, color: 'var(--esc-text)' }}>Attendance Alerts</h3>
              <div style={{ color: 'var(--color-high)', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Days the backend escalated because work progress was below 50%.</div>
              {attendanceAlerts.length === 0 ? (
                <div style={{ fontSize: 14, color: 'var(--esc-muted)' }}>No attendance alerts.</div>
              ) : (
                <table style={{ marginTop: 16 }}>
                  <thead><tr><th>Employee</th><th>Date</th><th>Hours</th><th>Remarks</th><th>Status</th></tr></thead>
                  <tbody>
                    {attendanceAlerts.map((a) => (
                      <tr key={a.attendance_id}>
                        <td style={{ fontWeight: 500 }}>{nameOf(a.emp_id)}</td>
                        <td>{shortDate(a.attendance_date)}</td>
                        <td style={{ color: 'var(--color-high)', fontWeight: 700 }}>{a.hours_spent}h</td>
                        <td>{a.remarks || '-'}</td>
                        <td><span className="badge" style={{ background: 'var(--color-med-bg)', color: 'var(--color-med)' }}>Escalated</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {view.name === 'details' && current && (
          <div id="view-details" className="page-view active">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0' }}>{current.escalation_id}: {current.title}</h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge" style={{ background: 'var(--color-med-bg)', color: 'var(--color-med)' }}>{current.reference_type}</span>
                  <Badge status={current.statusText} />
                  <span style={{ fontSize: 12, color: 'var(--esc-muted)', marginLeft: 12 }}>Raised on {shortDate(current.escalation_date)}</span>
                </div>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => setView({ name: 'action', id: current.escalation_id })}>Proceed to Take Action</button>
            </div>

            <div className="details-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="card">
                  <h3 style={{ marginTop: 0 }}>Escalation Details</h3>
                  <p style={{ color: 'var(--esc-muted)', fontSize: 14, lineHeight: 1.6 }}>{current.description || current.title}</p>
                </div>
                <div className="card">
                  <h3 style={{ marginTop: 0 }}>Raised By</h3>
                  <div style={{ background: 'var(--bg-main)', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong>{current.raisedBy}</strong> <span style={{ fontSize: 11, color: 'var(--esc-muted)' }}>{shortDate(current.escalation_date)}</span>
                    </div>
                    <div style={{ fontSize: 14 }}>{current.escalation_reason}</div>
                  {current.issue_id && <div style={{ fontSize: 13, marginTop: 8 }}><strong>Linked issue:</strong> {current.issue_id}</div>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {(() => {
                  const emp = employee(current.reference_id);
                  return (
                    <div className="card" style={{ background: 'rgba(123,44,191,0.03)', border: '1px solid rgba(123,44,191,0.1)' }}>
                      <h3 style={{ marginTop: 0 }}>{emp ? 'Employee Info' : 'Reference'}</h3>
                      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{current.subject}</div>
                      <div style={{ fontSize: 13, color: 'var(--esc-muted)', marginBottom: 16 }}>{current.reference_id} &bull; {current.reference_type}</div>
                      {emp && (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <li><strong>Dept:</strong> {emp.department_id || '-'}</li>
                          <li><strong>Role:</strong> {ROLE_NAMES[emp.role] || emp.role}</li>
                          <li><strong>Manager:</strong> {nameOf(emp.manager_id)}</li>
                          <li><strong>Join Date:</strong> {shortDate(emp.date_of_joining)}</li>
                        </ul>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {view.name === 'action' && current && (
          <div id="view-action" className="page-view active">
            <div className="alert-banner" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <i className="ph-fill ph-warning" style={{ fontSize: 24 }}></i>
              <div><div style={{ fontWeight: 700, fontSize: 16 }}>Action Center - {current.escalation_id}</div></div>
            </div>

            <div className="details-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button" className="btn btn-outline" id="btn-reject-esc" disabled={busy || current.statusText !== 'Pending'}
                    style={{ borderColor: 'var(--color-high)', color: 'var(--color-high)' }} onClick={() => reject(current)}
                  >
                    <i className="ph ph-prohibit"></i> {current.statusText === 'Pending' ? 'Reject Escalation' : `Already ${current.statusText}`}
                  </button>
                  <button type="button" className="btn btn-outline" id="btn-gen-report" onClick={() => report(current)}><i className="ph ph-download-simple"></i> Download CSV Report</button>
                </div>
                <div className="card">
                  <h3 style={{ marginTop: 0 }}>Escalation Summary</h3>
                  <div style={{ padding: 16, borderLeft: '4px solid var(--color-high)', background: 'var(--color-high-bg)', fontSize: 14, borderRadius: 4 }}>
                    <strong>{current.title}</strong>
                    {current.description && <><br /><br />{current.description}</>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="card">
                  <h3 style={{ marginTop: 0, fontSize: 15 }}>Escalation Timeline</h3>
                  <div className="timeline">
                    <div className="timeline-item">
                      <div style={{ fontSize: 11, color: 'var(--esc-muted)' }}>{shortDate(current.escalation_date)}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Escalation raised by {current.raisedBy}</div>
                    </div>
                    <div className="timeline-item">
                      <div style={{ fontSize: 11, color: 'var(--esc-muted)' }}>Current status</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{current.statusText}</div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <h3 style={{ marginTop: 0, fontSize: 14 }}>Resolution Guidelines</h3>
                  <ul style={{ paddingLeft: 16, fontSize: 13, margin: 0, lineHeight: 1.6, color: 'var(--esc-muted)' }}>
                    <li>Contact the Team Lead for verbal confirmation.</li>
                    <li>Reach the employee on alternate contacts.</li>
                    <li>Send a formal show-cause email.</li>
                    <li>Generate a report to keep a record of the escalation.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast}
    </>
  );
}
