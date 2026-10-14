// Shared by SupportTeam.jsx and TechnicalTeam.jsx - converted from
// front-end/platform_admin/{support,technical}-team.html + their view scripts,
// which were identical apart from labels and the store functions they called.
import { useState } from 'react';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import { accountStatusBadge, paginate } from '../../../components/platform/format';
import {
  ClearButton, FilterSelect, modalClass, Pagination, PortalShell, SearchInput, SectionHeader, ShellTable, useDebounced, useToast,
} from '../../../components/platform/ShellUI';
import { ConfirmDialog } from '../../../components/platform/TicketParts';
import useFetch from '../../../hooks/useFetch';
import { createTeamMember, getTeam, IS_DEMO, updateTeamMember, updateTeamMemberStatus } from '../../../services/platformAdminService';

const PAGE_SIZE = 8;
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];
const EMPTY_FORM = { name: '', email: '', phone: '', specialization: '' };

/**
 * role:  'SUPPORT_MEMBER' | 'TECHNICAL_MEMBER'
 * label: 'Support' | 'Technical'
 */
export default function TeamMembersPage({ role, label, title }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const query = useDebounced(search.trim());
  // Status and search are filtered server-side (GET /<team>?status=&search=), as in the original.
  const { data: members, loading, error, reload } = useFetch(() => getTeam(role, { status, search: query }), [role, status, query]);
  const pager = paginate(members ?? [], page, PAGE_SIZE);

  const [form, setForm] = useState(null); // { mode: 'create' | 'edit', id?, ...fields }
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusChange, setStatusChange] = useState(null); // { member, newStatus }
  const [toast, showToast] = useToast();

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const openCreate = () => {
    setForm({ mode: 'create', ...EMPTY_FORM });
    setFormError('');
  };
  const openEdit = (m) => {
    setForm({ mode: 'edit', id: m.emp_id, name: m.emp_name, email: m.email, phone: m.phone || '', specialization: m.specialization || '' });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), specialization: form.specialization.trim() };
    const isCreate = form.mode === 'create';
    // Same required fields as the original: create needs name/email/phone, edit name/email.
    if (isCreate && (!data.name || !data.email || !data.phone)) return setFormError('Name, email and phone are required.');
    if (!isCreate && (!data.name || !data.email)) return setFormError('Name and email are required.');
    setSaving(true);
    try {
      if (isCreate) {
        await createTeamMember(role, data);
        showToast(`${label} Team member added successfully.`);
      } else {
        await updateTeamMember(role, form.id, data);
        showToast('Team member updated successfully.');
      }
      setForm(null);
      reload();
    } catch (err) {
      setFormError(err.message || (isCreate ? 'Failed to add team member.' : 'Failed to update.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmStatus = async () => {
    try {
      await updateTeamMemberStatus(role, statusChange.member.emp_id, statusChange.newStatus);
      showToast('Team member status updated successfully.');
      setStatusChange(null);
      reload();
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  const columns = [
    { key: 'member', header: 'Member', render: (m) => <div className="cell-primary"><span className="cell-name">{m.emp_name}</span><span className="cell-sub">{m.emp_id}</span></div> },
    { key: 'contact', header: 'Contact', render: (m) => <div className="cell-primary"><span>{m.email}</span><span className="cell-sub">{m.phone}</span></div> },
    { key: 'specialization', header: 'Specialization', render: (m) => m.specialization || '-' },
    { key: 'status', header: 'Status', render: (m) => <span className={`badge ${accountStatusBadge(m.status)}`}>{m.status}</span> },
    { key: 'open_tickets', header: 'Open' },
    { key: 'in_progress_tickets', header: 'In Progress' },
    { key: 'total_assigned', header: 'Total Assigned' },
    {
      key: 'actions', header: 'Actions', align: 'right', render: (m) => {
        const active = m.status === 'ACTIVE';
        return (
          <div className="row-actions">
            <button type="button" className="icon-btn" title="Edit" aria-label={`Edit ${m.emp_name}`} onClick={() => openEdit(m)}><i className="ph ph-pencil-simple"></i></button>
            <button
              type="button"
              className={active ? 'icon-btn danger' : 'icon-btn'}
              title={active ? 'Deactivate' : 'Activate'}
              aria-label={`${active ? 'Deactivate' : 'Activate'} ${m.emp_name}`}
              onClick={() => setStatusChange({ member: m, newStatus: active ? 'INACTIVE' : 'ACTIVE' })}
            >
              <i className={`ph ${active ? 'ph-pause-circle' : 'ph-check-circle'}`}></i>
            </button>
          </div>
        );
      },
    },
  ];

  const verb = statusChange?.newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

  return (
    <PortalShell portal="pa" title={title} demo={IS_DEMO}>
      <SectionHeader
        title={`${label} Team Members`}
        action={<button type="button" className="btn btn-primary" onClick={openCreate}><i className="ph ph-plus"></i> Add {label} Member</button>}
      />

      <div className="card filter-bar">
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Search by name or email..." />
        <div className="filters-wrap">
          <FilterSelect label="Status" value={status} onChange={changeFilter(setStatus)} options={STATUS_OPTIONS} />
          <ClearButton onClick={() => { setSearch(''); setStatus('all'); setPage(1); }} />
        </div>
      </div>

      <div className="card table-container">
        <ShellTable
          columns={columns}
          rows={members ? pager.pageItems : null}
          rowKey="emp_id"
          loading={loading}
          error={error && `Failed to load the ${label} Team.`}
          loadingText={`Loading ${label} Team...`}
          emptyIcon="ph-hard-drives"
          emptyText={`No ${label} Team members found.`}
        />
        {members && <Pagination {...pager} onChange={setPage} />}
      </div>

      <Modal
        isOpen={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?.mode === 'edit' ? `Edit ${label} Team Member` : `Add ${label} Team Member`}
        className={modalClass('pa')}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button>
            <button type="submit" form="team-member-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : form?.mode === 'edit' ? 'Save Changes' : 'Add Member'}
            </button>
          </>
        }
      >
        {form && (
          <form id="team-member-form" onSubmit={handleSubmit} noValidate>
            <Input label="Name" value={form.name} onChange={set('name')} required />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
            <Input label="Phone" value={form.phone} onChange={set('phone')} required />
            <Input label="Specialization" placeholder="e.g. Infrastructure, Networking" value={form.specialization} onChange={set('specialization')} />
            {formError && <div className="form-error" role="alert">{formError}</div>}
          </form>
        )}
      </Modal>

      <ConfirmDialog
        portal="pa"
        isOpen={Boolean(statusChange)}
        title={`${verb.charAt(0).toUpperCase() + verb.slice(1)} Team Member`}
        message={statusChange ? `Are you sure you want to ${verb} "${statusChange.member.emp_name}"?` : ''}
        onConfirm={confirmStatus}
        onClose={() => setStatusChange(null)}
      />
      {toast}
    </PortalShell>
  );
}
