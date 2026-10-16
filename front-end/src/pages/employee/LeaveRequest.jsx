import { useRef, useState } from 'react';
import Badge from '../../components/common/Badge';
import FieldError, { RequiredMark } from '../../components/common/FieldError';
import Table from '../../components/common/Table';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useFormValidation from '../../hooks/useFormValidation';
import usePageTitle from '../../hooks/usePageTitle';
import { createLeave, getLeavesForUser } from '../../services/leaveService';
import { leaveRequestSchema } from '../../validation/formSchemas';
import PortalHeading from './components/PortalHeading';
import { LEAVE_TYPES, leaveBalance, leaveReviewer, leaveStatusBadge } from './employeeUtils';

const POLICY = [
  'Taking leave without Team Lead approval → escalation to HR',
  'All leave requests must be approved in advance',
  'Unauthorized absence will be flagged',
  'HR notified for unapproved leaves',
  'Repeated violations → disciplinary action',
  'Emergency cases must be communicated immediately',
];

// Summary cards; values come from leaveBalance() over the employee's own records.
const BALANCE = [
  { key: 'total', label: 'Total Leave', icon: 'ph-calendar-blank', bg: 'var(--bg-main)', color: 'var(--text-main)', valueColor: undefined },
  { key: 'used', label: 'Used', icon: 'ph-check-circle', bg: '#D1FAE5', color: '#059669', valueColor: '#059669' },
  { key: 'pending', label: 'Pending', icon: 'ph-clock-counter-clockwise', bg: '#FFEDD5', color: '#EA580C', valueColor: '#EA580C' },
  { key: 'remaining', label: 'Remaining', icon: 'ph-identification-badge', bg: 'var(--primary-light)', color: 'var(--primary-color)', valueColor: 'var(--primary-color)' },
];

const fieldStyle = { borderRadius: 'var(--radius-md)', padding: '12px 16px' };
const labelStyle = { fontWeight: 'var(--font-medium)' };
const rowGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 };
const mutedSmall = { color: 'var(--text-muted)', fontSize: 13 };
const EMPTY_FORM = { type: '', start: '', end: '', reason: '' };
const SERVER_FIELDS = { leave_type: 'type', start_date: 'start', end_date: 'end' };

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
  { key: 'routed_to', header: 'Sent To', cellStyle: mutedSmall, render: (l) => ({ HR: 'HR', TEAMLEAD: 'Team Lead' })[l.routed_to] || '-' },
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
  const { data: leaves = [], error: leavesError, loading: leavesLoading, reload } = useFetch(() => getLeavesForUser(user.emp_id), [user.emp_id]);
  // Until the records load (or if they fail) the counts are unknown - show '-' rather
  // than figures that look real.
  const balance = leavesLoading || leavesError ? null : leaveBalance(leaves);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // the saved request, once the backend confirms it
  // Blocks a second submit fired before the disabled button re-renders.
  const inFlight = useRef(false);
  const validation = useFormValidation(leaveRequestSchema, form, { idPrefix: 'lv', serverFieldMap: SERVER_FIELDS });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const days = countDays(form.start, form.end);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (inFlight.current) return;
    setSubmitted(null);
    if (!validation.validateAll()) return;
    inFlight.current = true;
    setSubmitting(true);
    let saved;
    try {
      saved = await createLeave({
        empId: user.emp_id,
        leave_type: form.type,
        days: String(days),
        start_date: form.start,
        end_date: form.end,
        reason: form.reason.trim(),
      });
    } catch (err) {
      if (!validation.setServerErrors(err)) setSubmitError(err.message || 'Failed to submit the leave request.');
      return;
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
    setForm(EMPTY_FORM);
    validation.reset();
    setSubmitted(saved || {});
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
              <div style={{ fontWeight: 'bold', fontSize: 32, color: b.valueColor }}>{balance ? balance[b.key] : '-'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 'var(--font-medium)' }}>{b.label}</div>
            </div>
          ))}
        </div>

        {/* SECTION 3: APPLY FOR LEAVE */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border-light)', paddingBottom: 16 }}>
            Apply for Leave
          </h3>
          <form onSubmit={handleSubmit} noValidate>
            <div style={rowGrid}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={labelStyle} htmlFor="lv_type">Leave Type<RequiredMark /></label>
                <select className="form-control" aria-required="true" style={fieldStyle} value={form.type} onChange={update('type')} {...validation.input('type', 'lv_type')}>
                  <option value="" disabled>Enter leave type</option>
                  {Object.entries(LEAVE_TYPES).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <FieldError {...validation.errorProps('type')} />
                {form.type && (
                  <div id="lv_type_route" role="note" style={{ ...mutedSmall, marginTop: 6 }}>
                    <i className="ph ph-info" aria-hidden="true"></i>{' '}
                    This request will be sent to {leaveReviewer(form.type)} for review.
                  </div>
                )}
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
                <label className="form-label" style={labelStyle} htmlFor="lv_start">Start Date<RequiredMark /></label>
                <input type="date" className="form-control" aria-required="true" style={fieldStyle} value={form.start} onChange={update('start')} {...validation.input('start', 'lv_start')} />
                <FieldError {...validation.errorProps('start')} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={labelStyle} htmlFor="lv_end">End Date<RequiredMark /></label>
                <input type="date" className="form-control" aria-required="true" min={form.start || undefined} style={fieldStyle} value={form.end} onChange={update('end')} {...validation.input('end', 'lv_end')} />
                <FieldError {...validation.errorProps('end')} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={labelStyle} htmlFor="lv_reason">Reason for Leave<RequiredMark /></label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Give the reason for the leave..."
                aria-required="true"
                maxLength={500}
                style={{ borderRadius: 'var(--radius-md)', padding: 16, resize: 'vertical' }}
                value={form.reason}
                onChange={update('reason')}
                {...validation.input('reason', 'lv_reason')}
              ></textarea>
              <FieldError {...validation.errorProps('reason')} />
            </div>

            {submitError && <div className="form-error field-error" role="alert" style={{ marginBottom: 12 }}><i className="ph ph-warning-circle" aria-hidden="true"></i><span>{submitError}</span></div>}
            {submitted && <div role="status" style={{ color: 'var(--success-color, #059669)', marginBottom: 12, fontSize: 13 }}><i className="ph-fill ph-check-circle"></i> Leave request submitted.{submitted.routed_to && <span> It has been sent to {submitted.routed_to === 'HR' ? 'HR' : 'your Team Lead'} for review.</span>}</div>}
            <button
              type="submit"
              className="btn btn-purple"
              disabled={submitting}
              style={{ width: '100%', padding: 16, fontSize: 'var(--text-md)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, borderRadius: 50 }}
            >
              <i className="ph ph-paper-plane-right" style={{ fontSize: 20 }}></i> {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </form>
        </div>

        {/* SECTION 4: MY LEAVE REQUESTS */}
        {leavesError && (
          <div className="form-error field-error" role="alert">
            <i className="ph ph-warning-circle" aria-hidden="true"></i>
            <span>Failed to load your leave requests: {leavesError.message}</span>
          </div>
        )}
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
