// Converted from front-end/super_admin/platform-admins.html + js/views/super_admin/platform-admins.js
import { useCallback, useEffect, useState } from 'react';
import SaFilterBar from '../../components/sa-common/SaFilterBar';
import SaModal from '../../components/sa-common/SaModal';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import SaPagination from '../../components/sa-common/SaPagination';
import { Field, FormError, StateRow, useFormState } from '../../components/sa-common/saForm';
import useSaToast from '../../components/sa-common/useSaToast';
import * as sa from '../../services/superAdminService';
import { companyStatusBadgeClass, formatDate, formatDateTime, paginate } from '../../utils/saCommon';
import useFormValidation from '../../hooks/useFormValidation';
import { PASSWORD_HINT } from '../../utils/validation';
import { createPlatformAdminSchema, editPlatformAdminSchema } from '../../validation/formSchemas';
import { SA_PORTAL } from './saConstants';
import './styles/_shared.css';
import './styles/platform-admins.css';

const PAGE_SIZE = 8;
const COLS = 6;
const EMPTY_CREATE = { name: '', email: '', phone: '', password: '', confirmPassword: '', status: 'ACTIVE' };

function statusBadgeClass(status) {
  if (status === 'ACTIVE') return 'badge-active';
  if (status === 'PENDING') return 'badge-pending';
  return 'badge-inactive';
}

export default function SaPlatformAdmins() {
  const [toast, showToast] = useSaToast();
  const [admins, setAdmins] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'companies' | 'activity' | 'status'
  const [selected, setSelected] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [activity, setActivity] = useState(null); // null loading | 'error' | []
  const [error, setError] = useState('');
  const createForm = useFormState(EMPTY_CREATE);
  const editForm = useFormState({});

  const loadAdmins = useCallback(async () => {
    setLoadState('loading');
    try {
      setAdmins(await sa.getPlatformAdmins(filters));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [filters]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const close = () => setModal(null);
  const cv = useFormValidation(createPlatformAdminSchema, createForm.values, { idPrefix: 'cp' });
  const ev = useFormValidation(editPlatformAdminSchema, editForm.values, { idPrefix: 'ep' });

  const open = (name, admin = null) => {
    setSelected(admin);
    setError('');
    cv.reset();
    ev.reset();
    setModal(name);
  };

  const openActivity = async (a) => {
    setActivity(null);
    open('activity', a);
    try {
      setActivity(await sa.getPlatformAdminActivity(a.emp_id));
    } catch {
      setActivity('error');
    }
  };

  const submitCreate = async () => {
    setError('');
    if (!cv.validateAll()) return;
    const { values } = createForm;
    const data = { ...values, name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim() };
    try {
      await sa.createPlatformAdmin(data);
      showToast('Platform Admin created successfully. They can log in immediately.');
      close();
      await loadAdmins();
    } catch (e) {
      if (!cv.setServerErrors(e)) setError(e.message || 'Failed to create Platform Admin.');
    }
  };

  const submitEdit = async () => {
    setError('');
    if (!ev.validateAll()) return;
    const { values } = editForm;
    const data = { name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim() };
    // A blank phone leaves the stored number unchanged.
    if (!data.phone) delete data.phone;
    try {
      await sa.updatePlatformAdmin(selected.emp_id, data);
      showToast('Platform Admin updated successfully.');
      close();
      await loadAdmins();
    } catch (e) {
      if (!ev.setServerErrors(e)) setError(e.message || 'Failed to update.');
    }
  };

  const submitStatus = async () => {
    try {
      await sa.updatePlatformAdminStatus(pendingStatus.id, pendingStatus.newStatus);
      showToast('Platform Admin status updated successfully.');
      close();
      await loadAdmins();
    } catch (e) {
      showToast(e.message || 'Failed to update status.', 'error');
    }
  };

  const { pageItems, page: safePage, totalPages, total } = paginate(admins, page, PAGE_SIZE);
  const verb = pendingStatus?.newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
  const footer = (label, onClick, variant = 'btn-primary') => (
    <>
      <button type="button" className="btn btn-outline" onClick={close}>Cancel</button>
      <button type="button" className={`btn ${variant}`} onClick={onClick}>{label}</button>
    </>
  );

  let rows;
  if (loadState === 'loading') rows = <StateRow colSpan={COLS} kind="loading">Loading platform admins...</StateRow>;
  else if (loadState === 'error') rows = <StateRow colSpan={COLS} kind="error">Failed to load platform admins.</StateRow>;
  else if (admins.length === 0) rows = <StateRow colSpan={COLS} kind="empty" icon="ph-shield-star">No platform admins found.</StateRow>;
  else {
    rows = pageItems.map((a) => (
      <tr key={a.emp_id}>
        <td><div className="cell-primary"><span className="cell-name">{a.emp_name}</span><span className="cell-sub">{a.emp_id}</span></div></td>
        <td><div className="cell-primary"><span>{a.email}</span><span className="cell-sub">{a.phone}</span></div></td>
        <td><span className={`badge ${statusBadgeClass(a.status)}`}>{a.status}</span></td>
        <td><button type="button" className="pa-companies-chip" onClick={() => open('companies', a)}><i className="ph ph-buildings"></i> {a.assigned_company_count}</button></td>
        <td>{formatDate(a.date_of_joining)}</td>
        <td>
          <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="icon-btn" title="View Activity" onClick={() => openActivity(a)}><i className="ph ph-list-magnifying-glass"></i></button>
            <button type="button" className="icon-btn" title="Edit" onClick={() => { editForm.reset({ name: a.emp_name, email: a.email, phone: a.phone }); open('edit', a); }}><i className="ph ph-pencil-simple"></i></button>
            {a.status === 'ACTIVE' && (
              <button type="button" className="icon-btn danger" title="Deactivate" onClick={() => { setPendingStatus({ id: a.emp_id, name: a.emp_name, newStatus: 'INACTIVE' }); open('status', a); }}><i className="ph ph-pause-circle"></i></button>
            )}
            {a.status === 'INACTIVE' && (
              <button type="button" className="icon-btn" title="Activate" onClick={() => { setPendingStatus({ id: a.emp_id, name: a.emp_name, newStatus: 'ACTIVE' }); open('status', a); }}><i className="ph ph-check-circle"></i></button>
            )}
          </div>
        </td>
      </tr>
    ));
  }

  let activityBody;
  if (activity === null) activityBody = <div className="spinner"></div>;
  else if (activity === 'error') activityBody = <div className="error-state"><i className="ph ph-warning-circle"></i> Failed to load activity.</div>;
  else if (activity.length === 0) activityBody = <div className="empty-state"><i className="ph ph-list-magnifying-glass"></i> No recorded activity yet.</div>;
  else {
    activityBody = activity.map((l, i) => (
      <div key={i} className="comment-item">
        <span className="comment-author">{l.action}</span>
        <span className="comment-time">{formatDateTime(l.timestamp)}</span>
        <div className="comment-message">{l.details || ''}{l.company_name ? <> &middot; {l.company_name}</> : null}</div>
      </div>
    ));
  }

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Platform Admins" title="Platform Admins" portal={SA_PORTAL} />

      <div className="sa-shell">
        <div className="section-header">
          <h2 className="section-title">All Platform Admins</h2>
          <button type="button" className="btn btn-primary" id="btn-open-create" onClick={() => { createForm.reset(); open('create'); }}><i className="ph ph-plus"></i> Create Platform Admin</button>
        </div>

        <SaFilterBar
          placeholder="Search by name or email..."
          onSearch={(search) => { setPage(1); setFilters((f) => ({ ...f, search })); }}
          onClear={() => { setPage(1); setFilters({ search: '', status: 'all' }); }}
        >
          <select id="status-filter" className="filter-select" value={filters.status} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, status: e.target.value })); }}>
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending Invitation</option>
          </select>
        </SaFilterBar>

        <div className="card table-container">
          <table>
            <thead>
              <tr><th>Platform Admin</th><th>Contact</th><th>Status</th><th>Assigned Companies</th><th>Joined</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            </thead>
            <tbody id="pa-tbody">{rows}</tbody>
          </table>
          {loadState === 'ready' && admins.length > 0 ? (
            <SaPagination id="pa-pagination" page={safePage} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          ) : (
            <div className="pagination" id="pa-pagination"></div>
          )}
        </div>
      </div>

      <SaModal id="createPaModal" open={modal === 'create'} onClose={close} title="Create Platform Admin" footer={footer('Create Platform Admin', submitCreate)}>
        <form id="create-pa-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <Field label="Name" htmlFor="cp-name" required error={cv.errors.name}><input type="text" className="form-control" maxLength={100} aria-required={true} {...createForm.bind('name')} {...cv.input('name', 'cp-name')} /></Field>
          <Field label="Email" htmlFor="cp-email" required error={cv.errors.email}><input type="email" className="form-control" maxLength={254} aria-required={true} {...createForm.bind('email')} {...cv.input('email', 'cp-email')} /></Field>
          <Field label="Phone" htmlFor="cp-phone" required error={cv.errors.phone}><input type="tel" className="form-control" maxLength={20} aria-required={true} {...createForm.bind('phone')} {...cv.input('phone', 'cp-phone')} /></Field>
          <div className="form-hint"><i className="ph ph-info"></i> {PASSWORD_HINT}</div>
          <Field label="Password" htmlFor="cp-password" required error={cv.errors.password}><input type="password" className="form-control" autoComplete="new-password" maxLength={64} aria-required={true} {...createForm.bind('password')} {...cv.input('password', 'cp-password')} /></Field>
          <Field label="Confirm Password" htmlFor="cp-confirm-password" required error={cv.errors.confirmPassword}><input type="password" className="form-control" autoComplete="new-password" maxLength={64} aria-required={true} {...createForm.bind('confirmPassword')} {...cv.input('confirmPassword', 'cp-confirm-password')} /></Field>
          <Field label="Status" htmlFor="cp-status" error={cv.errors.status}>
            <select className="form-control" aria-required={false} {...createForm.bind('status')} {...cv.input('status', 'cp-status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
          <div className="form-hint"><i className="ph ph-info"></i> The account is created as a Platform Admin and can log in immediately with this email and password.</div>
          <FormError id="create-pa-error" message={error} />
        </form>
      </SaModal>

      <SaModal id="editPaModal" open={modal === 'edit'} onClose={close} title="Edit Platform Admin" footer={footer('Save Changes', submitEdit)}>
        <form id="edit-pa-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <Field label="Name" htmlFor="ep-name" required error={ev.errors.name}><input type="text" className="form-control" maxLength={100} aria-required={true} {...editForm.bind('name')} {...ev.input('name', 'ep-name')} /></Field>
          <Field label="Email" htmlFor="ep-email" required error={ev.errors.email}><input type="email" className="form-control" maxLength={254} aria-required={true} {...editForm.bind('email')} {...ev.input('email', 'ep-email')} /></Field>
          <Field label="Phone" htmlFor="ep-phone" error={ev.errors.phone}><input type="tel" className="form-control" maxLength={20} aria-required={false} {...editForm.bind('phone')} {...ev.input('phone', 'ep-phone')} /></Field>
          <FormError id="edit-pa-error" message={error} />
        </form>
      </SaModal>

      <SaModal id="companiesModal" open={modal === 'companies'} onClose={close} title="Assigned Companies">
        {!selected?.assigned_companies?.length ? (
          <div className="empty-state"><i className="ph ph-buildings"></i> No companies assigned yet.</div>
        ) : (
          selected.assigned_companies.map((c) => (
            <div key={c.company_id} className="company-list-item">
              <span>{c.company_name}</span>
              <span className={`badge ${companyStatusBadgeClass(c.status)}`}>{c.status}</span>
            </div>
          ))
        )}
      </SaModal>

      <SaModal id="activityModal" open={modal === 'activity'} onClose={close} title="Platform Admin Activity">
        {activityBody}
      </SaModal>

      <SaModal
        id="statusConfirmModal" open={modal === 'status'} onClose={close} maxWidth="420px" titleId="status-confirm-title"
        title={`${verb.charAt(0).toUpperCase() + verb.slice(1)} Platform Admin`} footer={footer('Confirm', submitStatus, 'btn-danger')}
      >
        <p id="status-confirm-text" style={{ color: 'var(--text-main)', margin: 0 }}>Are you sure you want to {verb} &quot;{pendingStatus?.name}&quot;?</p>
      </SaModal>

      {toast}
    </>
  );
}
