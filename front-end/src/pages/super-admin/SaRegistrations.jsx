// Company registration review queue. The backend only lets SUPER_ADMIN sessions
// reach /registration-reviews, so this is the one place a company becomes verified.
import { useCallback, useEffect, useState } from 'react';
import SaModal from '../../components/sa-common/SaModal';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import { Field, FormError, StateRow } from '../../components/sa-common/saForm';
import useSaToast from '../../components/sa-common/useSaToast';
import useFormValidation from '../../hooks/useFormValidation';
import * as sa from '../../services/superAdminService';
import { BUSINESS_TYPES, approveRegistrationSchema, rejectRegistrationSchema } from '../../validation/formSchemas';
import { formatBytes } from '../public/CompanyRegister';
import { REGISTRATION_STATUS_INFO } from '../public/RegistrationStatus';
import { SA_PORTAL } from './saConstants';
import './styles/_shared.css';

const COLS = 6;
const TYPE_LABEL = Object.fromEntries(BUSINESS_TYPES);
const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '-');

function StatusBadge({ status }) {
  const info = REGISTRATION_STATUS_INFO[status];
  return <span className={`badge ${info.badge}`}>{info.label}</span>;
}

export default function SaRegistrations() {
  const [toast, showToast] = useSaToast();
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('view'); // view | approve | reject
  const [plans, setPlans] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [approveForm, setApproveForm] = useState({ platform_admin_id: '', subscription_plan_id: '' });
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const planIds = plans.filter((p) => p.status === 'ACTIVE').map((p) => p.plan_id);
  const av = useFormValidation(approveRegistrationSchema(planIds, admins.map((a) => a.emp_id)), approveForm, { idPrefix: 'rr' });
  const rv = useFormValidation(rejectRegistrationSchema, { reason }, { idPrefix: 'rr' });

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      setRows(await sa.getRegistrations({ status }));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    Promise.all([sa.getSubscriptionPlans(), sa.getPlatformAdmins({ status: 'ACTIVE' })])
      .then(([p, a]) => { setPlans(p); setAdmins(a); })
      .catch(() => showToast('Failed to load platform admins / plans.', 'error'));
  }, [showToast]);

  const open = (reg) => {
    setSelected(reg);
    setMode('view');
    setError('');
  };

  // The viewer tab is opened synchronously so popup blockers allow it, then pointed
  // at the document once the authenticated download finishes.
  const viewDocument = async (docType) => {
    const win = window.open('', '_blank');
    if (win) win.opener = null;
    try {
      const blob = await sa.getRegistrationDocument(selected.reference, docType);
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      win?.close();
      showToast(err.message || 'Could not open the document.', 'error');
    }
  };

  const act = async (action, successMessage) => {
    setError('');
    setBusy(true);
    try {
      const updated = await action();
      setSelected(updated);
      setMode('view');
      showToast(successMessage);
      load();
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const startApprove = () => {
    setApproveForm({ platform_admin_id: admins[0]?.emp_id || '', subscription_plan_id: planIds[0] || '' });
    av.reset();
    setError('');
    setMode('approve');
  };
  const startReject = () => {
    setReason('');
    rv.reset();
    setError('');
    setMode('reject');
  };

  let body;
  if (loadState === 'loading') body = <StateRow colSpan={COLS} kind="loading">Loading registrations...</StateRow>;
  else if (loadState === 'error') body = <StateRow colSpan={COLS} kind="error">Failed to load registrations.</StateRow>;
  else if (!rows.length) body = <StateRow colSpan={COLS} kind="empty" icon="ph-seal-check">No registrations match this filter.</StateRow>;
  else {
    body = rows.map((r) => (
      <tr key={r.reference}>
        <td><div className="cell-primary"><span className="cell-name">{r.company.legal_name}</span><span className="cell-sub">{r.company.company_email}</span></div></td>
        <td>{r.reference}</td>
        <td>{TYPE_LABEL[r.company.business_type]}</td>
        <td>{fmt(r.submitted_at)}</td>
        <td><StatusBadge status={r.status} /></td>
        <td style={{ textAlign: 'right' }}><button type="button" className="btn btn-outline" onClick={() => open(r)}>Review</button></td>
      </tr>
    ));
  }

  const s = selected;
  const canDecide = s && ['pending', 'under_review'].includes(s.status);
  let footer;
  if (mode === 'approve') {
    footer = (
      <>
        <button type="button" className="btn btn-outline" onClick={() => setMode('view')} disabled={busy}>Back</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => av.validateAll() && act(() => sa.approveRegistration(s.reference, approveForm), 'Registration approved; company and admin account created.')}>
          {busy ? 'Approving...' : 'Approve and create company'}
        </button>
      </>
    );
  } else if (mode === 'reject') {
    footer = (
      <>
        <button type="button" className="btn btn-outline" onClick={() => setMode('view')} disabled={busy}>Back</button>
        <button type="button" className="btn btn-danger" disabled={busy} onClick={() => rv.validateAll() && act(() => sa.rejectRegistration(s.reference, reason.trim()), 'Registration rejected.')}>
          {busy ? 'Rejecting...' : 'Reject registration'}
        </button>
      </>
    );
  } else {
    footer = (
      <>
        <button type="button" className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
        {s?.status === 'pending' && <button type="button" className="btn btn-outline" disabled={busy} onClick={() => act(() => sa.startRegistrationReview(s.reference), 'Marked as under review.')}>Start review</button>}
        {canDecide && <button type="button" className="btn btn-danger" onClick={startReject}>Reject</button>}
        {canDecide && <button type="button" className="btn btn-primary" onClick={startApprove}>Approve</button>}
      </>
    );
  }

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Company Registrations" title="Company Registrations" portal={SA_PORTAL} />
      <div className="sa-shell">
        <div className="section-header">
          <h2 className="section-title">Company Registrations</h2>
          <select className="filter-select" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All submitted</option>
            {['pending', 'under_review', 'verified', 'rejected'].map((v) => <option key={v} value={v}>{REGISTRATION_STATUS_INFO[v].label}</option>)}
          </select>
        </div>
        <p className="text-muted">
          Check each company's details against its uploaded documents before approving. Identifier formats (CIN, LLPIN, GSTIN check digit)
          are validated automatically, but no government registry lookup is configured, so that the company exists must be confirmed here.
        </p>
        <div className="card table-container">
          <table>
            <thead><tr><th>Company</th><th>Reference</th><th>Business Type</th><th>Submitted</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>{body}</tbody>
          </table>
        </div>
      </div>

      <SaModal id="registrationModal" open={Boolean(s)} onClose={() => setSelected(null)} title={s ? `${s.company.legal_name} (${s.reference})` : ''} titleId="registrationModalTitle" maxWidth="720px" footer={footer}>
        {s && mode === 'view' && (
          <>
            <div className="form-section-title">Company details <StatusBadge status={s.status} /></div>
            <dl className="form-grid">
              {[
                ['Business type', TYPE_LABEL[s.company.business_type]],
                ['Registration number', s.company.registration_number || 'Not provided'],
                ['GSTIN', s.company.gstin || 'Not provided'],
                ['Business email', s.company.company_email],
                ['Phone', s.company.phone],
                ['Website', s.company.website || 'Not provided'],
                ['Address', `${s.company.address}, ${s.company.state}, ${s.company.country}`],
                ['Administrator', s.admin ? `${s.admin.name}, ${s.admin.designation} (${s.admin.email})` : '-'],
              ].map(([k, v]) => <div key={k}><dt className="form-label">{k}</dt><dd style={{ margin: 0, wordBreak: 'break-word' }}>{v}</dd></div>)}
            </dl>
            {s.rejection_reason && <p><strong>Rejection reason:</strong> {s.rejection_reason}</p>}
            <div className="form-section-title">Documents</div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
              {Object.entries(s.documents).map(([type, d]) => (
                <li key={type} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <span><strong>{d.label}:</strong> {d.original_name} ({formatBytes(d.size_bytes)})</span>
                  <button type="button" className="btn btn-outline" onClick={() => viewDocument(type)}><i className="ph ph-eye"></i> Open</button>
                </li>
              ))}
            </ul>
            <div className="form-section-title">History</div>
            <ul style={{ paddingLeft: 18 }}>
              {s.history.map((h, i) => <li key={i}>{fmt(h.at)} - {h.action} by {h.by}{h.note ? `: ${h.note}` : ''}</li>)}
            </ul>
          </>
        )}
        {s && mode === 'approve' && (
          <form onSubmit={(e) => e.preventDefault()} noValidate>
            <p>Approving creates <strong>{s.company.legal_name}</strong> as an active company and activates the administrator account for {s.admin?.email}.</p>
            <div className="form-grid">
              <Field label="Platform Admin" htmlFor="rr-pa" required error={av.errors.platform_admin_id}>
                <select className="form-control" value={approveForm.platform_admin_id} onChange={(e) => setApproveForm((f) => ({ ...f, platform_admin_id: e.target.value }))} {...av.input('platform_admin_id', 'rr-pa')}>
                  {admins.map((a) => <option key={a.emp_id} value={a.emp_id}>{a.emp_name}</option>)}
                </select>
              </Field>
              <Field label="Subscription plan" htmlFor="rr-plan" required error={av.errors.subscription_plan_id}>
                <select className="form-control" value={approveForm.subscription_plan_id} onChange={(e) => setApproveForm((f) => ({ ...f, subscription_plan_id: e.target.value }))} {...av.input('subscription_plan_id', 'rr-plan')}>
                  {plans.filter((p) => p.status === 'ACTIVE').map((p) => <option key={p.plan_id} value={p.plan_id}>{p.name}</option>)}
                </select>
              </Field>
            </div>
          </form>
        )}
        {s && mode === 'reject' && (
          <Field label="Reason (shown to the applicant)" htmlFor="rr-reason" required error={rv.errors.reason}>
            <textarea className="form-control" rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} {...rv.input('reason', 'rr-reason')} />
          </Field>
        )}
        <FormError message={error} />
      </SaModal>
      {toast}
    </>
  );
}
