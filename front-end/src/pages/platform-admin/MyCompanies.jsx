// Converted from front-end/platform_admin/my-companies.html + js/views/platform_admin/my-companies.js
import { useMemo, useState } from 'react';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { accountStatusBadge, formatDate, paginate } from '../../components/platform/format';
import {
  ClearButton, DetailItem, FilterSelect, modalClass, Pagination, PortalShell, SearchInput, SectionHeader, ShellTable, useDebounced, useToast,
} from '../../components/platform/ShellUI';
import useFetch from '../../hooks/useFetch';
import { createCompanyAdmin, getMyCompanies, IS_DEMO } from '../../services/platformAdminService';

const PAGE_SIZE = 8;
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];
const EMPTY_FORM = { name: '', email: '', password: '', confirmPassword: '', phone: '', companyId: '', status: 'ACTIVE' };

function CompanyDetails({ company }) {
  return (
    <div className="detail-grid">
      <DetailItem label="Company Name">{company.company_name}</DetailItem>
      <DetailItem label="Status"><span className={`badge ${accountStatusBadge(company.status)}`}>{company.status}</span></DetailItem>
      <DetailItem label="Contact Email">{company.company_email}</DetailItem>
      <DetailItem label="Phone">{company.phone}</DetailItem>
      <DetailItem label="Industry">{company.industry}</DetailItem>
      <DetailItem label="Created">{formatDate(company.created_date)}</DetailItem>
      <DetailItem label="Address" full>{company.address}</DetailItem>
      <DetailItem label="Subscription Plan">{company.subscription_plan_name || '-'}</DetailItem>
      <DetailItem label="Employees">{company.employee_count}</DetailItem>
      <DetailItem label="Company Admin">
        <span className="detail-value">
          {company.company_admin_name || 'Invitation pending'}
          {company.company_admin_status === 'PENDING' && <> <span className="badge badge-pending">Pending</span></>}
        </span>
      </DetailItem>
    </div>
  );
}

export default function MyCompanies() {
  const { data: companies, loading, error, reload } = useFetch(getMyCompanies, []);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();
  const query = useDebounced(search.trim());

  const filtered = useMemo(() => {
    let list = companies ?? [];
    if (status !== 'all') list = list.filter((c) => c.status === status);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((c) => c.company_name.toLowerCase().includes(q) || c.company_email.toLowerCase().includes(q));
    }
    return list;
  }, [companies, status, query]);
  const pager = paginate(filtered, page, PAGE_SIZE);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const openCreate = (companyId = '') => {
    setForm({ ...EMPTY_FORM, companyId });
    setFormError('');
  };
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const data = { ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() };
    if (!data.companyId || !data.name || !data.email || !data.phone || !data.password || !data.confirmPassword) return setFormError('All fields are required.');
    if (!EMAIL_RE.test(data.email)) return setFormError('Enter a valid email address.');
    if (!STRONG_PASSWORD.test(data.password)) return setFormError('Password must be 8+ characters with uppercase, lowercase, a number, and a special character.');
    if (data.password !== data.confirmPassword) return setFormError('Password and confirmation do not match.');
    setSaving(true);
    try {
      const { companyId, ...payload } = data;
      await createCompanyAdmin(companyId, payload);
      showToast(IS_DEMO
        ? 'Company Admin created in demo data (this account cannot log in without the backend).'
        : 'Company Admin created successfully. They can log in immediately.');
      setForm(null);
      reload();
    } catch (err) {
      setFormError(err.message || 'Failed to create Company Admin.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'name', header: 'Company Name', render: (c) => (
        <div className="cell-primary">
          <button type="button" className="cell-link" onClick={() => setViewing(c)}>{c.company_name}</button>
          <span className="cell-sub">{c.industry}</span>
        </div>
      ),
    },
    { key: 'company_email', header: 'Contact Email' },
    { key: 'status', header: 'Status', render: (c) => <span className={`badge ${accountStatusBadge(c.status)}`}>{c.status}</span> },
    { key: 'plan', header: 'Subscription', render: (c) => c.subscription_plan_name || '-' },
    { key: 'admin', header: 'Company Admin', render: (c) => c.company_admin_name || 'Invitation pending' },
    { key: 'employee_count', header: 'Employees' },
    { key: 'created', header: 'Assigned Since', render: (c) => formatDate(c.created_date) },
    {
      key: 'actions', header: 'Actions', align: 'right', render: (c) => (
        <div className="row-actions">
          <button type="button" className="icon-btn" title="View" aria-label={`View ${c.company_name}`} onClick={() => setViewing(c)}><i className="ph ph-eye"></i></button>
          <button type="button" className="icon-btn" title="Add Company Admin" aria-label={`Add Company Admin for ${c.company_name}`} onClick={() => openCreate(c.company_id)}><i className="ph ph-user-plus"></i></button>
        </div>
      ),
    },
  ];

  return (
    <PortalShell portal="pa" title="My Companies" demo={IS_DEMO}>
      <SectionHeader
        title="Companies Assigned To Me"
        action={<button type="button" className="btn btn-primary" onClick={() => openCreate()}><i className="ph ph-user-plus"></i> Create Company Admin</button>}
      />

      <div className="card filter-bar">
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Search by company name or email..." />
        <div className="filters-wrap">
          <FilterSelect label="Status" value={status} onChange={changeFilter(setStatus)} options={STATUS_OPTIONS} />
          <ClearButton onClick={() => { setSearch(''); setStatus('all'); setPage(1); }} />
        </div>
      </div>

      <div className="card table-container">
        <ShellTable
          columns={columns}
          rows={companies ? pager.pageItems : null}
          rowKey="company_id"
          loading={loading}
          error={error && 'Failed to load companies.'}
          loadingText="Loading companies..."
          emptyIcon="ph-buildings"
          emptyText="No companies found matching your criteria."
        />
        {companies && <Pagination {...pager} onChange={setPage} />}
      </div>

      <Modal
        isOpen={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title="Company Details"
        maxWidth="560px"
        className={modalClass('pa')}
        footer={<button type="button" className="btn btn-outline" onClick={() => setViewing(null)}>Close</button>}
      >
        {viewing && <CompanyDetails company={viewing} />}
      </Modal>

      <Modal
        isOpen={Boolean(form)}
        onClose={() => setForm(null)}
        title="Create Company Admin"
        className={modalClass('pa')}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button>
            <button type="submit" form="create-ca-form" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Company Admin'}</button>
          </>
        }
      >
        {form && (
          <form id="create-ca-form" onSubmit={handleCreate} noValidate>
            <Input label="Full Name" value={form.name} onChange={set('name')} required />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
            <Input label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} required />
            <Input label="Confirm Password" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
            <Input label="Phone Number" value={form.phone} onChange={set('phone')} required />
            <Input as="select" label="Company" value={form.companyId} onChange={set('companyId')} required>
              <option value="">Select a company...</option>
              {(companies ?? []).map((c) => <option key={c.company_id} value={c.company_id}>{c.company_name}</option>)}
            </Input>
            <Input as="select" label="Status" value={form.status} onChange={set('status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Input>
            <div className="form-hint">
              <i className="ph ph-info"></i>
              {IS_DEMO
                ? 'Only companies assigned to you are listed. Demo mode: the account is added to demo data but cannot log in.'
                : 'Only companies assigned to you are listed. The account can log in immediately with this email and password.'}
            </div>
            {formError && <div className="form-error" role="alert">{formError}</div>}
          </form>
        )}
      </Modal>
      {toast}
    </PortalShell>
  );
}
