// Public company self-registration: Company Details -> Documents -> Administrator,
// then the status page. Every step is saved by the backend; nothing here can mark a
// company verified - only a Super Admin can (pages/super-admin/SaRegistrations.jsx).
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/common/BrandLogo';
import Button from '../../components/common/Button';
import FieldError, { RequiredMark } from '../../components/common/FieldError';
import Input from '../../components/common/Input';
import useFormValidation from '../../hooks/useFormValidation';
import usePageTitle from '../../hooks/usePageTitle';
import {
  forgetRegistration,
  getRegistration,
  getSavedRegistration,
  startRegistration,
  submitRegistration,
  updateRegistration,
  uploadRegistrationDocument,
} from '../../services/companyRegistrationService';
import { PATHS } from '../../utils/constants';
import { PASSWORD_HINT, trimValues, validateField } from '../../utils/validation';
import {
  BUSINESS_TYPES,
  REGISTRATION_DOCUMENTS,
  companyDetailsSchema,
  registrationAdminSchema,
  registrationDocumentRule,
  registrationNumberKind,
} from '../../validation/formSchemas';
import './registration.css';

const STEPS = ['Company Details', 'Document Verification', 'Administrator Account', 'Confirmation'];
const EMPTY_DETAILS = {
  legal_name: '', business_type: '', registration_number: '', gstin: '', company_email: '', phone: '',
  address: '', country: 'India', state: '', website: '',
};
const EMPTY_ADMIN = { admin_name: '', admin_email: '', designation: '', password: '', confirm_password: '', accept_terms: false };
const SUBMITTED = ['pending', 'under_review', 'verified'];

export const formatBytes = (n) => (n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Header + centred card shared by the registration and status pages. */
export function RegistrationShell({ title, subtitle, children }) {
  return (
    <div className="rg-page">
      <header className="rg-header">
        <BrandLogo to={PATHS.HOME} className="rg-logo" />
        <nav className="rg-nav" aria-label="Primary">
          <Link to={PATHS.HOME}>Home</Link>
          <Link to={PATHS.LOGIN} className="btn btn-outline">Login</Link>
        </nav>
      </header>
      <main className="rg-main">
        <section className="rg-card" aria-labelledby="rg-title">
          <h1 id="rg-title" className="rg-title">{title}</h1>
          {subtitle && <p className="rg-subtitle">{subtitle}</p>}
          {children}
        </section>
      </main>
    </div>
  );
}

function Stepper({ step }) {
  return (
    <ol className="rg-steps" aria-label="Registration progress">
      {STEPS.map((label, i) => (
        <li key={label} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} aria-current={i === step ? 'step' : undefined}>
          <span className="rg-step-num" aria-hidden="true">{i < step ? <i className="ph ph-check"></i> : i + 1}</span>
          <span className="rg-step-label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

function Alert({ children }) {
  return children ? <div className="form-error field-error rg-alert" role="alert"><i className="ph ph-warning-circle" aria-hidden="true"></i><span>{children}</span></div> : null;
}

const fromCompany = (c) => Object.fromEntries(Object.keys(EMPTY_DETAILS).map((k) => [k, c?.[k] ?? '']));

export default function CompanyRegister() {
  usePageTitle('Register your company');
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState(getSavedRegistration() ? 'loading' : 'ready');
  const [reg, setReg] = useState(null);
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [admin, setAdmin] = useState(EMPTY_ADMIN);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState({});
  const [docErrors, setDocErrors] = useState({});
  const dv = useFormValidation(companyDetailsSchema, details, { idPrefix: 'rg' });
  const av = useFormValidation(registrationAdminSchema, admin, { idPrefix: 'rg' });

  const load = () => {
    setLoadState('loading');
    getRegistration()
      .then((r) => {
        setReg(r);
        setDetails(fromCompany(r.company));
        // A rejected registration reopens on its details so they can be corrected.
        setStep(r.status === 'draft' ? 1 : 0);
        setLoadState('ready');
      })
      .catch((err) => {
        if (err.status === 403) {
          forgetRegistration();
          setLoadState('ready');
        } else setLoadState('error');
      });
  };
  useEffect(() => {
    if (getSavedRegistration()) load();
  }, []);

  if (reg && SUBMITTED.includes(reg.status)) return <Navigate to={PATHS.REGISTRATION_STATUS} replace />;

  const setDetail = (name) => (e) => setDetails((d) => ({ ...d, [name]: e.target.value }));
  const setAdminField = (name) => (e) => setAdmin((a) => ({ ...a, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function run(action) {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (err) {
      if (!(dv.setServerErrors(err) || av.setServerErrors(err))) setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const saveDetails = (e) => {
    e.preventDefault();
    if (busy || !dv.validateAll()) return;
    const body = trimValues({ ...details, registration_number: details.registration_number.toUpperCase(), gstin: details.gstin.toUpperCase() });
    run(async () => {
      setReg(reg ? await updateRegistration(body) : await startRegistration(body));
      setStep(1);
    });
  };

  async function upload(doc, file) {
    if (!file) return; // picker cancelled
    const message = validateField(registrationDocumentRule(doc), file);
    setDocErrors((d) => ({ ...d, [doc.type]: message }));
    if (message) return;
    setUploading((u) => ({ ...u, [doc.type]: true }));
    try {
      setReg(await uploadRegistrationDocument(doc.type, file));
    } catch (err) {
      setDocErrors((d) => ({ ...d, [doc.type]: err.message || 'Upload failed. Please try again.' }));
    } finally {
      setUploading((u) => ({ ...u, [doc.type]: false }));
    }
  }

  const continueToAdmin = () => {
    setError('');
    if (reg.missing_documents.length) setError(`Please upload: ${reg.missing_documents.join(', ')}.`);
    else setStep(2);
  };

  const submit = (e) => {
    e.preventDefault();
    if (busy || !av.validateAll()) return;
    run(async () => {
      await submitRegistration({ ...trimValues(admin), password: admin.password, confirm_password: admin.confirm_password });
      navigate(PATHS.REGISTRATION_STATUS, { replace: true });
    });
  };

  if (loadState !== 'ready') {
    return (
      <RegistrationShell title="Register your company">
        {loadState === 'loading' ? (
          <div className="rg-loading" role="status"><div className="spinner"></div> Loading your registration...</div>
        ) : (
          <>
            <Alert>We couldn't reach the server to load your registration.</Alert>
            <Button onClick={load}>Try again</Button>
          </>
        )}
      </RegistrationShell>
    );
  }

  const idKind = registrationNumberKind(details);
  const anyUploading = Object.values(uploading).some(Boolean);

  return (
    <RegistrationShell
      title="Register your company"
      subtitle="Tell us about your business. Every company is verified by the EmpTrack team before its account is activated."
    >
      <Stepper step={step} />
      {reg?.status === 'rejected' && (
        <div className="rg-notice rg-notice-danger" role="status">
          <strong>Your previous submission was not approved.</strong>
          <p>{reg.rejection_reason}</p>
          <p className="mb-0">Correct the details or documents below and submit again.</p>
        </div>
      )}
      {reg && <p className="rg-ref">Reference: <strong>{reg.reference}</strong></p>}

      {step === 0 && (
        <form onSubmit={saveDetails} noValidate>
          <p className="rg-legend">Fields marked <RequiredMark /> are required.</p>
          <div className="rg-grid">
            <Input label="Legal company name" value={details.legal_name} onChange={setDetail('legal_name')} maxLength={150} autoComplete="organization" required groupStyle={{ gridColumn: '1 / -1' }} {...dv.field('legal_name')} />
            <Input as="select" label="Business type" value={details.business_type} onChange={setDetail('business_type')} required {...dv.field('business_type')}>
              <option value="">Select business type</option>
              {BUSINESS_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Input>
            <Input
              label={idKind || 'Company registration number'}
              value={details.registration_number}
              onChange={setDetail('registration_number')}
              maxLength={50}
              required={Boolean(idKind)}
              hint={idKind ? `As shown on your ${idKind === 'CIN' ? 'Certificate of Incorporation' : 'LLP incorporation certificate'}.` : 'Optional for this business type.'}
              {...dv.field('registration_number')}
            />
            <Input label="Country" value={details.country} onChange={setDetail('country')} maxLength={60} autoComplete="country-name" required {...dv.field('country')} />
            <Input label="State" value={details.state} onChange={setDetail('state')} maxLength={60} autoComplete="address-level1" required {...dv.field('state')} />
            <Input label="GSTIN" value={details.gstin} onChange={setDetail('gstin')} maxLength={15} hint="If your business is GST-registered. You'll be asked for the GST certificate." {...dv.field('gstin')} />
            <Input label="Company website" type="url" value={details.website} onChange={setDetail('website')} maxLength={200} placeholder="https://" hint="Optional" autoComplete="url" {...dv.field('website')} />
            <Input label="Official business email" type="email" value={details.company_email} onChange={setDetail('company_email')} maxLength={254} autoComplete="email" required {...dv.field('company_email')} />
            <Input label="Business phone number" type="tel" value={details.phone} onChange={setDetail('phone')} maxLength={20} autoComplete="tel" required {...dv.field('phone')} />
            <Input as="textarea" rows={3} label="Registered office address" value={details.address} onChange={setDetail('address')} maxLength={300} autoComplete="street-address" required groupStyle={{ gridColumn: '1 / -1' }} {...dv.field('address')} />
          </div>
          <Alert>{error}</Alert>
          <div className="rg-actions">
            <Link to={PATHS.HOME} className="btn btn-outline">Cancel</Link>
            <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save and continue'}</Button>
          </div>
        </form>
      )}

      {step === 1 && reg && (
        <div>
          <p className="rg-legend">
            Upload clear copies of your registration documents. Accepted formats: PDF, JPG, PNG (max 5 MB; logo max 2 MB).
            Documents are stored privately and are only visible to the EmpTrack verification team.
          </p>
          <ul className="rg-docs">
            {REGISTRATION_DOCUMENTS.map((doc) => {
              const uploaded = reg.documents[doc.type];
              const required = doc.type === 'incorporation' || (doc.type === 'gst' && Boolean(reg.company.gstin));
              const inputId = `rg-doc-${doc.type}`;
              return (
                <li key={doc.type} className="rg-doc">
                  <div className="rg-doc-info">
                    <div className="rg-doc-title">
                      {doc.label}
                      <span className={`rg-tag${required ? ' is-required' : ''}`}>{required ? 'Required' : 'Optional'}</span>
                    </div>
                    <div className="form-hint">{doc.extensions.join(', ').toUpperCase().replace(/\./g, '')} · max {formatBytes(doc.maxBytes)}</div>
                    {uploading[doc.type] ? (
                      <div className="rg-doc-file" role="status"><div className="spinner rg-spinner-sm"></div> Uploading...</div>
                    ) : uploaded && (
                      <div className="rg-doc-file"><i className="ph ph-check-circle" aria-hidden="true"></i> {uploaded.original_name} <span className="text-muted">({formatBytes(uploaded.size_bytes)})</span></div>
                    )}
                    <FieldError id={`${inputId}-error`} message={docErrors[doc.type]} />
                  </div>
                  <label className={`btn btn-outline rg-file-btn${uploading[doc.type] ? ' is-disabled' : ''}`} htmlFor={inputId}>
                    <i className="ph ph-upload-simple" aria-hidden="true"></i> {uploaded ? 'Replace' : 'Upload'}
                    <span className="rg-sr-only"> {doc.label}</span>
                  </label>
                  <input
                    id={inputId}
                    type="file"
                    className="rg-file-input"
                    accept={doc.extensions.join(',')}
                    disabled={uploading[doc.type]}
                    aria-describedby={docErrors[doc.type] ? `${inputId}-error` : undefined}
                    onChange={(e) => { upload(doc, e.target.files[0]); e.target.value = ''; }}
                  />
                </li>
              );
            })}
          </ul>
          <Alert>{error}</Alert>
          <div className="rg-actions">
            <Button variant="outline" onClick={() => { setError(''); setStep(0); }}>Back</Button>
            <Button onClick={continueToAdmin} disabled={anyUploading}>Continue</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={submit} noValidate>
          <p className="rg-legend">
            This person becomes the Company Administrator. The account can sign in only after your company has been verified.
          </p>
          <div className="rg-grid">
            <Input label="Administrator full name" value={admin.admin_name} onChange={setAdminField('admin_name')} maxLength={100} autoComplete="name" required {...av.field('admin_name')} />
            <Input label="Designation" value={admin.designation} onChange={setAdminField('designation')} maxLength={80} autoComplete="organization-title" required {...av.field('designation')} />
            <Input label="Official work email" type="email" value={admin.admin_email} onChange={setAdminField('admin_email')} maxLength={254} autoComplete="email" required groupStyle={{ gridColumn: '1 / -1' }} {...av.field('admin_email')} />
            <Input label="Password" type="password" value={admin.password} onChange={setAdminField('password')} maxLength={64} autoComplete="new-password" required hint={PASSWORD_HINT} {...av.field('password')} />
            <Input label="Confirm password" type="password" value={admin.confirm_password} onChange={setAdminField('confirm_password')} maxLength={64} autoComplete="new-password" required {...av.field('confirm_password')} />
          </div>
          <div className="form-group">
            <label className="rg-check">
              <input type="checkbox" checked={admin.accept_terms} onChange={setAdminField('accept_terms')} {...av.input('accept_terms')} aria-describedby={av.errors.accept_terms ? 'rg-accept_terms-error' : undefined} />
              <span>I accept the Terms and Conditions and Privacy Policy, and confirm that I am authorised to register this company.</span>
            </label>
            <FieldError {...av.errorProps('accept_terms')} />
          </div>
          <Alert>{error}</Alert>
          <div className="rg-actions">
            <Button variant="outline" onClick={() => { setError(''); setStep(1); }} disabled={busy}>Back</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Submitting...' : 'Submit for verification'}</Button>
          </div>
        </form>
      )}
    </RegistrationShell>
  );
}
