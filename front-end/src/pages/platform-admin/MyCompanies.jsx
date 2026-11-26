// Converted from front-end/platform_admin/my-companies.html + js/views/platform_admin/my-companies.js
import { useMemo, useState } from 'react';
import Modal from '../../components/common/Modal';
import { accountStatusBadge, formatDate, paginate } from '../../components/platform/format';
import {
  ClearButton, DetailItem, FilterSelect, modalClass, Pagination, PortalShell, SearchInput, SectionHeader, ShellTable, useDebounced,
} from '../../components/platform/ShellUI';
import { IS_DEMO } from '../../services/platformAdminService';
import { companiesEntity } from '../../store/entities';
import { useEntityQuery } from '../../store/entitySlice';

const PAGE_SIZE = 8;
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

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
  const { data: companies, loading, error } = useEntityQuery(companiesEntity, 'fetchMine');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
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
        </div>
      ),
    },
  ];

  return (
    <PortalShell portal="pa" title="My Companies" demo={IS_DEMO}>
      <SectionHeader
        title="Companies Assigned To Me"
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
    </PortalShell>
  );
}
