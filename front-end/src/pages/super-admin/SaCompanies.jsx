// Converted from front-end/super_admin/companies.html + js/views/super_admin/companies.js
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SaFilterBar from '../../components/sa-common/SaFilterBar';
import SaModal from '../../components/sa-common/SaModal';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import SaPagination from '../../components/sa-common/SaPagination';
import { Field, FormError, StateRow, useFormState } from '../../components/sa-common/saForm';
import useSaToast from '../../components/sa-common/useSaToast';
import useFormValidation from '../../hooks/useFormValidation';
import * as sa from '../../services/superAdminService';
import { companyStatusBadgeClass, formatDate, paginate } from '../../utils/saCommon';
import { PASSWORD_HINT } from '../../utils/validation';
import { createCompanyAdminSchema, createCompanySchema, editCompanySchema, reassignPlatformAdminSchema } from '../../validation/formSchemas';
import { SA_BASE, SA_PORTAL } from './saConstants';
import './styles/_shared.css';
import './styles/companies.css';

const PAGE_SIZE = 8;
const COLS = 8;

const EMPTY_CREATE = {
  company_name: '', company_email: '', phone: '', industry: '', address: '', subscription_plan_id: '', status: 'ACTIVE',
  admin_name: '', admin_email: '', admin_phone: '', admin_password: '', admin_confirm_password: '', platform_admin_id: '',
};
const EMPTY_CA = { name: '', email: '', password: '', confirmPassword: '', phone: '', companyId: '', status: 'ACTIVE' };

function PlanOptions({ plans, selectedId }) {
  return plans
    .filter((p) => p.status === 'ACTIVE' || p.plan_id === selectedId)
    .map((p) => <option key={p.plan_id} value={p.plan_id}>{p.name} - ${p.price}/{p.billing_cycle === 'MONTHLY' ? 'mo' : 'yr'}</option>);
}

function AdminOptions({ admins }) {
  return admins.map((a) => <option key={a.emp_id} value={a.emp_id}>{a.emp_name} ({a.assigned_company_count} companies)</option>);
}

export default function SaCompanies() {
  const [toast, showToast] = useSaToast();
  const [companies, setCompanies] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [plans, setPlans] = useState([]);
  const [activeAdmins, setActiveAdmins] = useState([]);
  const [hasActiveAdmin, setHasActiveAdmin] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  const [modal, setModal] = useState(null); // 'create' | 'createCa' | 'edit' | 'view' | 'reassign' | 'status'
  const [selected, setSelected] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [error, setError] = useState('');
  const [caCompanies, setCaCompanies] = useState(null);
  const [reassignTo, setReassignTo] = useState('');
  const createForm = useFormState(EMPTY_CREATE);
  const editForm = useFormState({});
  const caForm = useFormState(EMPTY_CA);

  const loadLookups = useCallback(async () => {
    const [planList, adminList, activeCount] = await Promise.all([
      sa.getSubscriptionPlans(),
      sa.getPlatformAdmins({ status: 'ACTIVE' }),
      sa.getActivePlatformAdminCount(),
    ]);
    setPlans(planList);
    setActiveAdmins(adminList);
    setHasActiveAdmin(activeCount.count > 0);
  }, []);

  const loadCompanies = useCallback(async () => {
    setLoadState('loading');
    try {
      setCompanies(await sa.getCompanies(filters));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [filters]);

  useEffect(() => {
    loadLookups().catch(() => showToast('Failed to load platform admins / plans.', 'error'));
  }, [loadLookups, showToast]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const activePlanIds = plans.filter((p) => p.status === 'ACTIVE').map((p) => p.plan_id);
  const adminIds = activeAdmins.map((a) => a.emp_id);
  const cv = useFormValidation(createCompanySchema(activePlanIds, adminIds), createForm.values, { idPrefix: 'cc' });
  const ev = useFormValidation(
    editCompanySchema([...activePlanIds, ...(selected?.subscription_plan_id ? [selected.subscription_plan_id] : [])]),
    editForm.values,
    { idPrefix: 'ec' },
  );
  const cav = useFormValidation(createCompanyAdminSchema(Array.isArray(caCompanies) ? caCompanies.map((c) => c.company_id) : []), caForm.values, { idPrefix: 'cca' });
  const rv = useFormValidation(reassignPlatformAdminSchema(adminIds), { platform_admin_id: reassignTo }, { idPrefix: 'ra' });

  const close = () => setModal(null);
  const open = (name, company = null) => {
    setSelected(company);
    setError('');
    [cv, ev, cav, rv].forEach((v) => v.reset());
    setModal(name);
  };

  const openCreate = () => {
    if (!hasActiveAdmin) return;
    createForm.reset({ ...EMPTY_CREATE, subscription_plan_id: plans.find((p) => p.status === 'ACTIVE')?.plan_id || '', platform_admin_id: activeAdmins[0]?.emp_id || '' });
    open('create');
  };

  const openEdit = (c) => {
    editForm.reset({ company_name: c.company_name, company_email: c.company_email, phone: c.phone, industry: c.industry, address: c.address, subscription_plan_id: c.subscription_plan_id });
    open('edit', c);
  };

  const openReassign = (c) => {
    setReassignTo(c.platform_admin_id && activeAdmins.some((a) => a.emp_id === c.platform_admin_id) ? c.platform_admin_id : activeAdmins[0]?.emp_id || '');
    open('reassign', c);
  };

  const openStatus = (c, newStatus) => {
    setPendingStatus({ id: c.company_id, name: c.company_name, newStatus });
    open('status', c);
  };

  const openCreateCa = async () => {
    caForm.reset(EMPTY_CA);
    setCaCompanies(null);
    open('createCa');
    try {
      setCaCompanies(await sa.getCompanies());
    } catch {
      setCaCompanies('error');
    }
  };

  const submitCreate = async () => {
    setError('');
    if (!cv.validateAll()) return;
    const data = Object.fromEntries(Object.entries(createForm.values).map(([k, v]) => [k, typeof v === 'string' && !k.includes('password') ? v.trim() : v]));
    try {
      await sa.createCompany(data);
      showToast('Company created successfully. Company Admin can log in immediately.');
      close();
      await Promise.all([loadLookups(), loadCompanies()]);
    } catch (e) {
      if (!cv.setServerErrors(e)) setError(e.message || 'Failed to create company.');
    }
  };

  const submitEdit = async () => {
    setError('');
    if (!ev.validateAll()) return;
    const data = Object.fromEntries(Object.entries(editForm.values).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
    try {
      await sa.updateCompany(selected.company_id, data);
      showToast('Company updated successfully.');
      close();
      await loadCompanies();
    } catch (e) {
      if (!ev.setServerErrors(e)) setError(e.message || 'Failed to update company.');
    }
  };

  const submitReassign = async () => {
    if (!rv.validateAll()) return;
    try {
      await sa.reassignCompanyPlatformAdmin(selected.company_id, reassignTo);
      showToast('Platform Admin reassigned successfully.');
      close();
      await Promise.all([loadLookups(), loadCompanies()]);
    } catch (e) {
      if (!rv.setServerErrors(e)) showToast(e.message || 'Failed to reassign.', 'error');
    }
  };

  const submitStatus = async () => {
    try {
      await sa.updateCompanyStatus(pendingStatus.id, pendingStatus.newStatus);
      showToast('Company status updated successfully.');
      close();
      await loadCompanies();
    } catch (e) {
      showToast(e.message || 'Failed to update status.', 'error');
    }
  };

  const submitCreateCa = async () => {
    setError('');
    if (!cav.validateAll()) return;
    const { companyId, ...rest } = caForm.values;
    const data = { ...rest, name: rest.name.trim(), email: rest.email.trim(), phone: rest.phone.trim() };
    try {
      await sa.createCompanyAdmin(companyId, data);
      showToast('Company Admin created successfully. They can log in immediately.');
      close();
      await loadCompanies();
    } catch (e) {
      if (!cav.setServerErrors(e)) setError(e.message || 'Failed to create Company Admin.');
    }
  };

  const { pageItems, page: safePage, totalPages, total } = paginate(companies, page, PAGE_SIZE);
  const verb = pendingStatus ? (pendingStatus.newStatus === 'ACTIVE' ? 'activate' : pendingStatus.newStatus === 'SUSPENDED' ? 'suspend' : 'deactivate') : '';
  const footer = (label, onClick, variant = 'btn-primary') => (
    <>
      <button type="button" className="btn btn-outline" onClick={close}>Cancel</button>
      <button type="button" className={`btn ${variant}`} onClick={onClick}>{label}</button>
    </>
  );

  let rows;
  if (loadState === 'loading') rows = <StateRow colSpan={COLS} kind="loading">Loading companies...</StateRow>;
  else if (loadState === 'error') rows = <StateRow colSpan={COLS} kind="error">Failed to load companies.</StateRow>;
  else if (companies.length === 0) rows = <StateRow colSpan={COLS} kind="empty" icon="ph-buildings">No companies found matching your criteria.</StateRow>;
  else {
    rows = pageItems.map((c) => (
      <tr key={c.company_id}>
        <td>
          <div className="cell-primary">
            <span className="cell-name"><a href="#" onClick={(e) => { e.preventDefault(); open('view', c); }}>{c.company_name}</a></span>
            <span className="cell-sub">{c.industry}</span>
          </div>
        </td>
        <td>{c.company_email}</td>
        <td><span className={`badge ${companyStatusBadgeClass(c.status)}`}>{c.status}</span></td>
        <td>{c.subscription_plan_name || '-'}</td>
        <td>{c.platform_admin_name || 'Unassigned'}</td>
        <td>{c.employee_count}</td>
        <td>{formatDate(c.created_date)}</td>
        <td>
          <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="icon-btn" title="View" onClick={() => open('view', c)}><i className="ph ph-eye"></i></button>
            <button type="button" className="icon-btn" title="Edit" onClick={() => openEdit(c)}><i className="ph ph-pencil-simple"></i></button>
            <button type="button" className="icon-btn" title="Reassign Platform Admin" onClick={() => openReassign(c)}><i className="ph ph-arrows-left-right"></i></button>
            {c.status === 'ACTIVE' ? (
              <>
                <button type="button" className="icon-btn" title="Deactivate" onClick={() => openStatus(c, 'INACTIVE')}><i className="ph ph-pause-circle"></i></button>
                <button type="button" className="icon-btn danger" title="Suspend" onClick={() => openStatus(c, 'SUSPENDED')}><i className="ph ph-prohibit"></i></button>
              </>
            ) : (
              <button type="button" className="icon-btn" title="Activate" onClick={() => openStatus(c, 'ACTIVE')}><i className="ph ph-check-circle"></i></button>
            )}
          </div>
        </td>
      </tr>
    ));
  }

  const v = selected;
  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Companies" title="Companies" portal={SA_PORTAL} />

      <div className="sa-shell">
        <div className="section-header">
          <h2 className="section-title">All Companies</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline" id="btn-open-create-ca" onClick={openCreateCa}><i className="ph ph-user-plus"></i> Create Company Admin</button>
            <button type="button" className={`btn btn-primary${hasActiveAdmin ? '' : ' action-btn-disabled'}`} id="btn-open-create" disabled={!hasActiveAdmin} onClick={openCreate}><i className="ph ph-plus"></i> Create Company</button>
          </div>
        </div>

        {!hasActiveAdmin && (
          <div className="card" id="no-admin-banner" style={{ padding: '16px 20px', borderLeft: '4px solid var(--sa-warning, var(--warning-color))', display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="ph-fill ph-warning-circle" style={{ fontSize: 22, color: 'var(--warning-color)' }}></i>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No Platform Admin available.</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Please create a Platform Admin before creating a company.</div>
            </div>
            <Link to={`${SA_BASE}/platform-admins`} className="btn btn-outline" style={{ marginLeft: 'auto' }}>Go to Platform Admins</Link>
          </div>
        )}

        <SaFilterBar
          placeholder="Search by company name or email..."
          onSearch={(search) => { setPage(1); setFilters((f) => ({ ...f, search })); }}
          onClear={() => { setPage(1); setFilters({ search: '', status: 'all' }); }}
        >
          <select id="status-filter" className="filter-select" value={filters.status} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, status: e.target.value })); }}>
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </SaFilterBar>

        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Company Name</th><th>Contact Email</th><th>Status</th><th>Subscription</th><th>Platform Admin</th><th>Employees</th><th>Created</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="companies-tbody">{rows}</tbody>
          </table>
          {loadState === 'ready' && companies.length > 0 ? (
            <SaPagination id="companies-pagination" page={safePage} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          ) : (
            <div className="pagination" id="companies-pagination"></div>
          )}
        </div>
      </div>

      <SaModal id="createCompanyModal" open={modal === 'create'} onClose={close} title="Create Company" maxWidth="640px" footer={footer('Create Company', submitCreate)}>
        <form id="create-company-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <div className="form-section-title">Company Information</div>
          <div className="form-grid">
            <Field label="Company Name" htmlFor="cc-name" required error={cv.errors.company_name}><input type="text" className="form-control" maxLength={120} aria-required={true} {...createForm.bind('company_name')} {...cv.input('company_name', 'cc-name')} /></Field>
            <Field label="Company Email" htmlFor="cc-email" required error={cv.errors.company_email}><input type="email" className="form-control" maxLength={254} aria-required={true} {...createForm.bind('company_email')} {...cv.input('company_email', 'cc-email')} /></Field>
            <Field label="Phone Number" htmlFor="cc-phone" required error={cv.errors.phone}><input type="tel" className="form-control" maxLength={20} aria-required={true} {...createForm.bind('phone')} {...cv.input('phone', 'cc-phone')} /></Field>
            <Field label="Industry" htmlFor="cc-industry" required error={cv.errors.industry}><input type="text" className="form-control" maxLength={100} aria-required={true} {...createForm.bind('industry')} {...cv.input('industry', 'cc-industry')} /></Field>
            <Field label="Address" htmlFor="cc-address" required error={cv.errors.address} style={{ gridColumn: '1 / -1' }}><input type="text" className="form-control" maxLength={300} aria-required={true} {...createForm.bind('address')} {...cv.input('address', 'cc-address')} /></Field>
            <Field label="Subscription Plan" htmlFor="cc-plan" required error={cv.errors.subscription_plan_id}>
              <select className="form-control" aria-required={true} {...createForm.bind('subscription_plan_id')} {...cv.input('subscription_plan_id', 'cc-plan')}><PlanOptions plans={plans} /></select>
            </Field>
            <Field label="Company Status" htmlFor="cc-status" error={cv.errors.status}>
              <select className="form-control" aria-required={false} {...createForm.bind('status')} {...cv.input('status', 'cc-status')}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </Field>
          </div>

          <div className="form-section-title">Company Admin Information</div>
          <div className="form-hint"><i className="ph ph-info"></i> The Company Admin account is created immediately and can log in with this email and password.</div>
          <div className="form-grid">
            <Field label="Admin Name" htmlFor="cc-admin-name" required error={cv.errors.admin_name}><input type="text" className="form-control" maxLength={100} aria-required={true} {...createForm.bind('admin_name')} {...cv.input('admin_name', 'cc-admin-name')} /></Field>
            <Field label="Admin Email" htmlFor="cc-admin-email" required error={cv.errors.admin_email}><input type="email" className="form-control" maxLength={254} aria-required={true} {...createForm.bind('admin_email')} {...cv.input('admin_email', 'cc-admin-email')} /></Field>
            <Field label="Admin Phone" htmlFor="cc-admin-phone" required error={cv.errors.admin_phone}><input type="tel" className="form-control" maxLength={20} aria-required={true} {...createForm.bind('admin_phone')} {...cv.input('admin_phone', 'cc-admin-phone')} /></Field>
            <div className="form-hint" style={{ gridColumn: '1 / -1' }}><i className="ph ph-info"></i> {PASSWORD_HINT}</div>
            <Field label="Admin Password" htmlFor="cc-admin-password" required error={cv.errors.admin_password}><input type="password" className="form-control" autoComplete="new-password" maxLength={64} aria-required={true} {...createForm.bind('admin_password')} {...cv.input('admin_password', 'cc-admin-password')} /></Field>
            <Field label="Confirm Admin Password" htmlFor="cc-admin-confirm-password" required error={cv.errors.admin_confirm_password}><input type="password" className="form-control" autoComplete="new-password" maxLength={64} aria-required={true} {...createForm.bind('admin_confirm_password')} {...cv.input('admin_confirm_password', 'cc-admin-confirm-password')} /></Field>
          </div>

          <div className="form-section-title">Platform Admin Assignment</div>
          <Field label="Assigned Platform Admin" htmlFor="cc-platform-admin" required error={cv.errors.platform_admin_id}>
            <select className="form-control" aria-required={true} {...createForm.bind('platform_admin_id')} {...cv.input('platform_admin_id', 'cc-platform-admin')}><AdminOptions admins={activeAdmins} /></select>
          </Field>

          <FormError id="create-company-error" message={error} />
        </form>
      </SaModal>

      <SaModal id="createCaModal" open={modal === 'createCa'} onClose={close} title="Create Company Admin" footer={footer('Create Company Admin', submitCreateCa)}>
        <form id="create-ca-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <Field label="Full Name" htmlFor="cca-name" required error={cav.errors.name}><input type="text" className="form-control" maxLength={100} aria-required={true} {...caForm.bind('name')} {...cav.input('name', 'cca-name')} /></Field>
          <Field label="Email" htmlFor="cca-email" required error={cav.errors.email}><input type="email" className="form-control" maxLength={254} aria-required={true} {...caForm.bind('email')} {...cav.input('email', 'cca-email')} /></Field>
          <Field label="Password" htmlFor="cca-password" required error={cav.errors.password}><input type="password" className="form-control" autoComplete="new-password" maxLength={64} aria-required={true} {...caForm.bind('password')} {...cav.input('password', 'cca-password')} /></Field>
          <Field label="Confirm Password" htmlFor="cca-confirm-password" required error={cav.errors.confirmPassword}><input type="password" className="form-control" autoComplete="new-password" maxLength={64} aria-required={true} {...caForm.bind('confirmPassword')} {...cav.input('confirmPassword', 'cca-confirm-password')} /></Field>
          <Field label="Phone Number" htmlFor="cca-phone" required error={cav.errors.phone}><input type="tel" className="form-control" maxLength={20} aria-required={true} {...caForm.bind('phone')} {...cav.input('phone', 'cca-phone')} /></Field>
          <Field label="Company" htmlFor="cca-company" required error={cav.errors.companyId}>
            <select className="form-control" aria-required={true} {...caForm.bind('companyId')} {...cav.input('companyId', 'cca-company')}>
              {caCompanies === null && <option value="">Loading companies...</option>}
              {caCompanies === 'error' && <option value="">Failed to load companies</option>}
              {Array.isArray(caCompanies) && (
                <>
                  <option value="">Select a company...</option>
                  {caCompanies.map((c) => <option key={c.company_id} value={c.company_id}>{c.company_name}</option>)}
                </>
              )}
            </select>
          </Field>
          <Field label="Status" htmlFor="cca-status" error={cav.errors.status}>
            <select className="form-control" aria-required={false} {...caForm.bind('status')} {...cav.input('status', 'cca-status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
          <div className="form-hint"><i className="ph ph-info"></i> The account can log in immediately with this email and password.</div>
          <FormError id="create-ca-error" message={error} />
        </form>
      </SaModal>

      <SaModal id="editCompanyModal" open={modal === 'edit'} onClose={close} title="Edit Company" maxWidth="560px" footer={footer('Save Changes', submitEdit)}>
        <form id="edit-company-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <div className="form-grid">
            <Field label="Company Name" htmlFor="ec-name" required error={ev.errors.company_name}><input type="text" className="form-control" maxLength={120} aria-required={true} {...editForm.bind('company_name')} {...ev.input('company_name', 'ec-name')} /></Field>
            <Field label="Company Email" htmlFor="ec-email" required error={ev.errors.company_email}><input type="email" className="form-control" maxLength={254} aria-required={true} {...editForm.bind('company_email')} {...ev.input('company_email', 'ec-email')} /></Field>
            <Field label="Phone Number" htmlFor="ec-phone" required error={ev.errors.phone}><input type="tel" className="form-control" maxLength={20} aria-required={true} {...editForm.bind('phone')} {...ev.input('phone', 'ec-phone')} /></Field>
            <Field label="Industry" htmlFor="ec-industry" required error={ev.errors.industry}><input type="text" className="form-control" maxLength={100} aria-required={true} {...editForm.bind('industry')} {...ev.input('industry', 'ec-industry')} /></Field>
            <Field label="Address" htmlFor="ec-address" required error={ev.errors.address} style={{ gridColumn: '1 / -1' }}><input type="text" className="form-control" maxLength={300} aria-required={true} {...editForm.bind('address')} {...ev.input('address', 'ec-address')} /></Field>
            <Field label="Subscription Plan" htmlFor="ec-plan" required error={ev.errors.subscription_plan_id}>
              <select className="form-control" aria-required={true} {...editForm.bind('subscription_plan_id')} {...ev.input('subscription_plan_id', 'ec-plan')}><PlanOptions plans={plans} selectedId={v?.subscription_plan_id} /></select>
            </Field>
          </div>
          <FormError id="edit-company-error" message={error} />
        </form>
      </SaModal>

      <SaModal id="viewCompanyModal" open={modal === 'view'} onClose={close} title="Company Details" maxWidth="560px">
        {v && (
          <div className="detail-grid" id="view-company-body">
            <div className="detail-item"><span className="detail-label">Company Name</span><span className="detail-value">{v.company_name}</span></div>
            <div className="detail-item"><span className="detail-label">Status</span><span className={`badge ${companyStatusBadgeClass(v.status)}`}>{v.status}</span></div>
            <div className="detail-item"><span className="detail-label">Contact Email</span><span className="detail-value">{v.company_email}</span></div>
            <div className="detail-item"><span className="detail-label">Phone</span><span className="detail-value">{v.phone}</span></div>
            <div className="detail-item"><span className="detail-label">Industry</span><span className="detail-value">{v.industry}</span></div>
            <div className="detail-item"><span className="detail-label">Created</span><span className="detail-value">{formatDate(v.created_date)}</span></div>
            <div className="detail-item" style={{ gridColumn: '1/-1' }}><span className="detail-label">Address</span><span className="detail-value">{v.address}</span></div>
            <div className="detail-item"><span className="detail-label">Subscription Plan</span><span className="detail-value">{v.subscription_plan_name || '-'}</span></div>
            <div className="detail-item"><span className="detail-label">Employees</span><span className="detail-value">{v.employee_count}</span></div>
            <div className="detail-item"><span className="detail-label">Platform Admin</span><span className="detail-value">{v.platform_admin_name || 'Unassigned'}</span></div>
            <div className="detail-item">
              <span className="detail-label">Company Admin</span>
              <span className="detail-value">{v.company_admin_name || 'Invitation pending'}{v.company_admin_status === 'PENDING' && <> <span className="badge badge-pending">Pending</span></>}</span>
            </div>
          </div>
        )}
      </SaModal>

      <SaModal id="reassignModal" open={modal === 'reassign'} onClose={close} title="Reassign Platform Admin" maxWidth="420px" footer={footer('Reassign', submitReassign)}>
        <Field label="New Platform Admin" htmlFor="ra-platform-admin" required error={rv.errors.platform_admin_id}>
          <select className="form-control" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} {...rv.input('platform_admin_id', 'ra-platform-admin')}><AdminOptions admins={activeAdmins} /></select>
        </Field>
      </SaModal>

      <SaModal
        id="statusConfirmModal" open={modal === 'status'} onClose={close} maxWidth="420px" titleId="status-confirm-title"
        title={`${verb.charAt(0).toUpperCase() + verb.slice(1)} Company`} footer={footer('Confirm', submitStatus, 'btn-danger')}
      >
        <p id="status-confirm-text" style={{ color: 'var(--text-main)', margin: 0 }}>Are you sure you want to {verb} &quot;{pendingStatus?.name}&quot;?</p>
      </SaModal>

      {toast}
    </>
  );
}
