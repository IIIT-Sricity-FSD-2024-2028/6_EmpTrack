import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { updateLeaveStatus } from '../../services/teamLeadService';
import { formatDate, toTitleCase } from '../../utils/helpers';
import { DemoNotice, LoadState, Person, StatCard, Tabs, tlPath, useTeamData, useToast } from './components/TeamLeadUI';
import { LEAVE_TYPE_LABELS, leaveStatusBadge, nameOf, todayKey, unauthorizedAbsences } from './tlUtils';
import './teamlead.css';

const TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

const GUIDELINES = [
  'Check team coverage on the requested dates before approving.',
  'Requests longer than 5 working days need at least 2 weeks notice.',
  'Sick leave over 2 days requires a medical certificate for HR.',
  'Always give a reason when rejecting so the employee can re-plan.',
  'Absences without an approved leave are escalated to HR.',
];

const dateRange = (start, end) => (start === end ? formatDate(start) : `${formatDate(start)} - ${formatDate(end)}`);

export default function Leave() {
  usePageTitle('Leave Management');
  const { user } = useAuth();
  const { data, error, reload } = useTeamData({ tasks: false, attendance: true, leaves: true });
  const [tab, setTab] = useState('PENDING');
  const [action, setAction] = useState(null); // { leave, status }
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();

  const members = data?.members ?? [];
  const leaves = data?.leaves ?? [];
  const today = todayKey();
  const absences = unauthorizedAbsences(data?.attendance ?? [], leaves);
  const awayToday = new Set(
    leaves.filter((l) => l.status === 'APPROVED' && l.start_date <= today && today <= l.end_date).map((l) => l.emp_id),
  );
  const availability = members.length ? Math.round(((members.length - awayToday.size) / members.length) * 100) : 100;

  const open = (leave, status) => {
    setReason('');
    setReasonError('');
    setAction({ leave, status });
  };

  const confirm = async () => {
    const rejecting = action.status === 'REJECTED';
    if (rejecting && reason.trim().length < 5) {
      setReasonError('Please give the employee a reason (at least 5 characters).');
      return;
    }
    setSaving(true);
    try {
      await updateLeaveStatus(action.leave.leave_id, action.status, user.emp_id, rejecting ? reason.trim() : undefined);
      showToast(`Leave ${rejecting ? 'rejected' : 'approved'} for ${nameOf(members, action.leave.emp_id)}`);
      setAction(null);
      await reload();
    } catch (err) {
      showToast(err.message || 'Could not update the leave request.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'leave_id', header: 'Request', render: (l) => <span className="tl-muted">{l.leave_id}</span> },
    { key: 'emp', header: 'Employee', render: (l) => <Person name={nameOf(members, l.emp_id)} /> },
    { key: 'type', header: 'Type', render: (l) => <Badge variant="vacation">{LEAVE_TYPE_LABELS[l.leave_type] || toTitleCase(l.leave_type)}</Badge> },
    { key: 'dates', header: 'Dates', render: (l) => dateRange(l.start_date, l.end_date) },
    { key: 'days', header: 'Days', render: (l) => <strong>{l.days ?? 1}</strong> },
    { key: 'reason', header: 'Reason', render: (l) => (
      <div>
        <div>{l.reason || 'No reason provided'}</div>
        {l.reject_reason && <div className="tl-muted">Rejected: {l.reject_reason}</div>}
      </div>
    ) },
    { key: 'status', header: 'Status', render: (l) => <Badge variant={leaveStatusBadge(l.status)}>{toTitleCase(l.status)}</Badge> },
    ...(tab === 'PENDING'
      ? [{ key: 'actions', header: 'Action', render: (l) => (
          <div className="tl-actions">
            <Button variant="secondary" icon="ph-check-circle" className="tl-btn-sm" onClick={() => open(l, 'APPROVED')}>Approve</Button>
            <Button variant="danger" icon="ph-x-circle" className="tl-btn-sm" onClick={() => open(l, 'REJECTED')}>Reject</Button>
          </div>
        ) }]
      : []),
  ];

  return (
    <div className="tl-page">
      <DemoNotice />
      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="tl-stats-grid">
          <StatCard icon="ph-hourglass" tone="orange" label="Pending Requests" value={leaves.filter((l) => l.status === 'PENDING').length} />
          <StatCard icon="ph-check-circle" tone="green" label="Approved" value={leaves.filter((l) => l.status === 'APPROVED').length} />
          <StatCard icon="ph-warning-octagon" tone="red" label="Unauthorized Absences" value={absences.length} />
          <StatCard icon="ph-users" label="Team Availability Today" value={`${availability}%`} />
        </div>

        <Table
          title="Unauthorized Absences (escalate to HR)"
          rowKey="emp_id"
          data={absences}
          emptyMessage="No absences without an approved leave."
          columns={[
            { key: 'emp', header: 'Employee', render: (a) => <Person name={nameOf(members, a.emp_id)} sub={a.emp_id} /> },
            { key: 'days', header: 'Days Absent', render: (a) => <Badge variant="danger">{a.days} day{a.days > 1 ? 's' : ''}</Badge> },
            { key: 'dates', header: 'Dates', render: (a) => a.dates.map((d) => formatDate(d)).join(', ') },
            { key: 'action', header: 'Action', render: (a) => (
              <Link
                className="btn btn-orange tl-btn-sm"
                to={`${tlPath('escalate-to-hr')}?category=Leave&employee=${a.emp_id}&title=${encodeURIComponent(`Unauthorized absence: ${nameOf(members, a.emp_id)}`)}`}
              >
                <i className="ph ph-siren"></i> Escalate to HR
              </Link>
            ) },
          ]}
        />

        <div className="tl-grid-main">
          <div className="card table-modern" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-card-header">
              <h3>Team Leave Requests</h3>
              <Tabs tabs={TABS} active={tab} onChange={setTab} />
            </div>
            <Table
              columns={columns}
              data={leaves.filter((l) => l.status === tab)}
              rowKey="leave_id"
              emptyMessage={`No ${tab.toLowerCase()} leave requests.`}
            />
          </div>
          <div className="tl-card">
            <h3 className="tl-card-title"><i className="ph ph-list-checks"></i> Approval Guidelines</h3>
            <ul className="tl-list">
              {GUIDELINES.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </div>
        </div>
      </LoadState>

      <Modal
        isOpen={Boolean(action)}
        onClose={() => setAction(null)}
        title={action?.status === 'REJECTED' ? 'Reject leave request' : 'Approve leave request'}
        footer={
          <>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button variant={action?.status === 'REJECTED' ? 'danger' : 'secondary'} disabled={saving} onClick={confirm}>
              {saving ? 'Saving...' : action?.status === 'REJECTED' ? 'Reject' : 'Approve'}
            </Button>
          </>
        }
      >
        {action && (
          <>
            <p style={{ marginTop: 0 }}>
              <strong>{nameOf(members, action.leave.emp_id)}</strong> &bull; {LEAVE_TYPE_LABELS[action.leave.leave_type] || action.leave.leave_type} &bull;{' '}
              {dateRange(action.leave.start_date, action.leave.end_date)} ({action.leave.days ?? 1} day{(action.leave.days ?? 1) > 1 ? 's' : ''})
            </p>
            {action.status === 'REJECTED' && (
              <Input as="textarea" rows={3} label="Reason for rejection" value={reason} error={reasonError} onChange={(e) => setReason(e.target.value)} />
            )}
          </>
        )}
      </Modal>
      {toast}
    </div>
  );
}
