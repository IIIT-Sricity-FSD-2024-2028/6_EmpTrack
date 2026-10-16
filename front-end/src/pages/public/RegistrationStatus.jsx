// Shows this browser's company registration as the backend currently has it - the
// status is always fetched, never assumed, so it survives refreshes and reflects
// reviewer decisions.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import usePageTitle from '../../hooks/usePageTitle';
import { forgetRegistration, getRegistration, getSavedRegistration } from '../../services/companyRegistrationService';
import { PATHS } from '../../utils/constants';
import { formatBytes, RegistrationShell } from './CompanyRegister';

export const REGISTRATION_STATUS_INFO = {
  draft: { label: 'Not submitted', badge: 'badge-not-started', message: 'Your registration has been started but not yet submitted for verification.' },
  pending: { label: 'Pending', badge: 'badge-pending', message: 'Your company registration has been submitted and is awaiting verification.' },
  under_review: { label: 'Under review', badge: 'badge-info', message: 'The EmpTrack verification team is reviewing your company details and documents.' },
  verified: { label: 'Verified', badge: 'badge-success', message: 'Your company has been verified and your administrator account is active.' },
  rejected: { label: 'Rejected', badge: 'badge-danger', message: 'Your company registration was not approved.' },
};

const NEXT_STEPS = {
  draft: ['Finish uploading your documents and administrator details, then submit for verification.'],
  pending: [
    'A verification reviewer will check your registration details against the documents you uploaded.',
    'You cannot sign in until the review is complete. Check this page for updates.',
  ],
  under_review: ['No action is needed right now. If something is missing, the reviewer will explain what to fix here.'],
  verified: ['Sign in with the administrator email and password you chose during registration.', 'Then invite your HR team and employees from the Company Admin portal.'],
  rejected: ['Read the reason above, correct your details or documents, and submit again.'],
};

export default function RegistrationStatus() {
  usePageTitle('Registration status');
  const navigate = useNavigate();
  const hasSaved = Boolean(getSavedRegistration());
  const [state, setState] = useState(hasSaved ? 'loading' : 'none');
  const [reg, setReg] = useState(null);

  const load = () => {
    setState('loading');
    getRegistration()
      .then((r) => { setReg(r); setState('ready'); })
      .catch((err) => {
        if (err.status === 403) {
          forgetRegistration();
          setState('none');
        } else setState('error');
      });
  };
  useEffect(() => {
    if (hasSaved) load();
  }, []);

  if (state === 'none') {
    return (
      <RegistrationShell title="Registration status" subtitle="No company registration was found in this browser.">
        <div className="rg-actions">
          <Link to={PATHS.HOME} className="btn btn-outline">Back to home</Link>
          <Link to={PATHS.COMPANY_REGISTER} className="btn btn-primary">Register your company</Link>
        </div>
      </RegistrationShell>
    );
  }
  if (state !== 'ready') {
    return (
      <RegistrationShell title="Registration status">
        {state === 'loading' ? (
          <div className="rg-loading" role="status"><div className="spinner"></div> Checking your registration...</div>
        ) : (
          <>
            <div className="form-error field-error rg-alert" role="alert"><i className="ph ph-warning-circle" aria-hidden="true"></i><span>We couldn't reach the server to check your registration.</span></div>
            <Button onClick={load}>Try again</Button>
          </>
        )}
      </RegistrationShell>
    );
  }

  const info = REGISTRATION_STATUS_INFO[reg.status];
  const docs = Object.values(reg.documents);
  return (
    <RegistrationShell title={reg.company.legal_name} subtitle={info.message}>
      <dl className="rg-summary">
        <div><dt>Reference</dt><dd>{reg.reference}</dd></div>
        <div><dt>Status</dt><dd><span className={`badge ${info.badge}`}>{info.label}</span></dd></div>
        {reg.submitted_at && <div><dt>Submitted</dt><dd>{new Date(reg.submitted_at).toLocaleString()}</dd></div>}
        {reg.admin && <div><dt>Administrator</dt><dd>{reg.admin.name} ({reg.admin.email})</dd></div>}
      </dl>

      {reg.status === 'rejected' && (
        <div className="rg-notice rg-notice-danger">
          <strong>Reason</strong>
          <p className="mb-0">{reg.rejection_reason}</p>
        </div>
      )}

      <h2 className="rg-section-title">Submitted documents</h2>
      {docs.length ? (
        <ul className="rg-doc-list">
          {docs.map((d) => <li key={d.label}><i className="ph ph-file-text" aria-hidden="true"></i> <span><strong>{d.label}:</strong> {d.original_name} <span className="text-muted">({formatBytes(d.size_bytes)})</span></span></li>)}
        </ul>
      ) : <p className="text-muted">No documents uploaded yet.</p>}

      <h2 className="rg-section-title">Next steps</h2>
      <ul className="rg-next">{NEXT_STEPS[reg.status].map((s) => <li key={s}>{s}</li>)}</ul>

      <div className="rg-actions">
        <Link to={PATHS.HOME} className="btn btn-outline">Back to home</Link>
        {['pending', 'under_review'].includes(reg.status) && <Button variant="outline" onClick={load}>Refresh status</Button>}
        {['draft', 'rejected'].includes(reg.status) && (
          <Link to={PATHS.COMPANY_REGISTER} className="btn btn-primary">{reg.status === 'rejected' ? 'Update and resubmit' : 'Continue registration'}</Link>
        )}
        {reg.status === 'verified' && (
          <>
            <Button variant="outline" onClick={() => { forgetRegistration(); navigate(PATHS.COMPANY_REGISTER); }}>Register another company</Button>
            <Link to={PATHS.LOGIN} className="btn btn-primary">Go to Login</Link>
          </>
        )}
      </div>
    </RegistrationShell>
  );
}
