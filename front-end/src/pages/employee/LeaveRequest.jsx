import { useState } from 'react';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { createLeave, getLeavesForUser } from '../../services/leaveService';
import PortalHeading from './components/PortalHeading';
import { LEAVE_TYPES, leaveStatusBadge } from './employeeUtils';

const POLICY = [
  'Taking leave without Team Lead approval → escalation to HR',
  'All leave requests must be approved in advance',
  'Unauthorized absence will be flagged',
  'HR notified for unapproved leaves',
  'Repeated violations → disciplinary action',
  'Emergency cases must be communicated immediately',
];

// Leave balance figures are fixed in the original page (no balance endpoint yet).
const BALANCE = [
  { label: 'Total Leave', value: 24, icon: 'ph-calendar-blank', bg: 'var(--bg-main)', color: 'var(--text-main)', valueColor: undefined },
  { label: 'Used', value: 8, icon: 'ph-check-circle', bg: '#D1FAE5', color: '#059669', valueColor: '#059669' },
  { label: 'Pending', value: 2, icon: 'ph-clock-counter-clockwise', bg: '#FFEDD5', color: '#EA580C', valueColor: '#EA580C' },
  { label: 'Remaining', value: 14, icon: 'ph-identification-badge', bg: 'var(--primary-light)', color: 'var(--primary-color)', valueColor: 'var(--primary-color)' },
];

const fieldStyle = { borderRadius: 'var(--radius-md)', padding: '12px 16px' };
const labelStyle = { fontWeight: 'var(--font-medium)' };
const rowGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 };
const mutedSmall = { color: 'var(--text-muted)', fontSize: 13 };
const EMPTY_FORM = { type: '', start: '', end: '', reason: '' };

const columns = [
  { key: 'leave_id', header: 'Leave ID', render: (l) => <span style={{ color: '#3B82F6', fontWeight: 'var(--font-medium)' }}>{l.leave_id}</span> },
  {
    key: 'leave_type',
    header: 'Leave Type',
    render: (l) => {
      const type = LEAVE_TYPES[l.leave_type] || LEAVE_TYPES.SICK;
      return <Badge variant={type.badge}>{type.label}</Badge>;
    },
  },
  { key: 'start_date', header: 'Start Date', cellStyle: mutedSmall },
  { key: 'end_date', header: 'End Date', cellStyle: mutedSmall },
  { key: 'days', header: 'Days', render: (l) => l.days || '-' },
  {
    key: 'reason',
    header: 'Reason',
    headerStyle: { width: '25%' },
    cellStyle: { fontSize: 13, lineHeight: 1.4 },
    render: (l) => (
      <>
        {l.reason}
        {l.status === 'REJECTED' && l.reject_reason && (
          <span className="leave-reject-reason" style={{ display: 'block', color: 'var(--danger-color)', fontSize: 11, marginTop: 4 }}>
            Reject reason: {l.reject_reason}
          </span>
        )}
      </>
    ),
  },
  { key: 'applied_date', header: 'Applied On', cellStyle: mutedSmall },
  {
    key: 'status',
    header: 'Status',
    render: (l) => (
      <Badge variant={leaveStatusBadge(l.status)} style={{ textTransform: 'capitalize' }}>{l.status.toLowerCase()}</Badge>
    ),
  },
];

/** Inclusive day count between two date inputs, or '' if the range is invalid. */
function countDays(start, end) {
  if (!start || !end) return '';
  const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
  return days > 0 ? days : '';
}

export default function LeaveRequest() {
  usePageTitle('Leave Request');
  const { user } = useAuth();
  const { data: leaves = [], reload } = useFetch(() => getLeavesForUser(user.emp_id), [user.emp_id]);
  const [form, setForm] = useState(EMPTY_FORM);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const days = countDays(form.start, form.end);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.end) < new Date(form.start)) {
      window.alert('Error: End date must be greater than or equal to the Start date.');
      return;
    }
    await createLeave({
      empId: user.emp_id,
      leave_type: form.type,
      days: String(days),
      start_date: form.start,
      end_date: form.end,
      reason: form.reason,
      reject_reason: null,
    });
    setForm(EMPTY_FORM);
    reload();
  };

  return (
    <>
      <PortalHeading>Leave Request</PortalHeading>

      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40 }}>
        {/* SECTION 1: POLICY INFORMATION */}
        <div className="card" style={{ padding: 24, backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', display: 'flex', gap: 16 }}>
          <div style={{ color: 'var(--warning-color)', fontSize: 24 }}>
            <i className="ph-fill ph-warning-circle"></i>
          </div>
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-md)', color: 'var(--text-main)' }}>
              Important: Unauthorized Absence Policy
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
              {POLICY.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>

        {/* SECTION 2: LEAVE SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          {BALANCE.map((b) => (
            <div key={b.label} className="card" style={{ padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: b.bg, color: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`ph-fill ${b.icon}`} style={{ fontSize: 24 }}></i>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: 32, color: b.valueColor }}>{b.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 'var(--font-medium)' }}>{b.label}</div>
            </div>
          ))}
        </div>

        {/* SECTION 3: APPLY FOR LEAVE */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border-light)', paddingBottom: 16 }}>
            Apply for Leave
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={rowGrid}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={labelStyle} htmlFor="lv_type">Leave Type</label>
                <select id="lv_type" className="form-control" required style={fieldStyle} value={form.type} onChange={update('type')}>
                  <option value="" disabled>Enter leave type</option>
                  {Object.entries(LEAVE_TYPES).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={labelStyle} htmlFor="lv_days">Number of Days</label>
                <input
                  type="number"
                  id="lv_days"
                  className="form-control"
                  placeholder="Enter number of days"
                  min="1"
                  required
                  readOnly
                  style={{ ...fieldStyle, backgroundColor: 'var(--bg-main)' }}
                  value={days}
                />
              </div>
            </div>

            <div style={rowGrid}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={labelStyle} htmlFor="lv_start">Start Date</label>
                <input type="date" id="lv_start" className="form-control" required style={fieldStyle} value={form.start} onChange={update('start')} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={labelStyle} htmlFor="lv_end">End Date</label>
                <input type="date" id="lv_end" className="form-control" required style={fieldStyle} value={form.end} onChange={update('end')} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={labelStyle} htmlFor="lv_reason">Reason for Leave</label>
              <textarea
                id="lv_reason"
                className="form-control"
                rows={4}
                placeholder="Give the reason for the leave..."
                required
                style={{ borderRadius: 'var(--radius-md)', padding: 16, resize: 'vertical' }}
                value={form.reason}
                onChange={update('reason')}
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-purple"
              style={{ width: '100%', padding: 16, fontSize: 'var(--text-md)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, borderRadius: 50 }}
            >
              <i className="ph ph-paper-plane-right" style={{ fontSize: 20 }}></i> Submit Leave Request
            </button>
          </form>
        </div>

        {/* SECTION 4: MY LEAVE REQUESTS */}
        <Table
          title="My Leave Requests"
          columns={columns}
          data={[...leaves].reverse()}
          rowKey="leave_id"
          emptyMessage="No leave requests found."
        />
      </div>
    </>
  );
}
