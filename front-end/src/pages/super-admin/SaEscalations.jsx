// Converted from front-end/super_admin/escalations.html + js/views/super_admin/escalations.js
import { useCallback, useEffect, useState } from 'react';
import SaModal from '../../components/sa-common/SaModal';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import { Field, FormError, StateRow, useFormState } from '../../components/sa-common/saForm';
import useSaToast from '../../components/sa-common/useSaToast';
import * as sa from '../../services/superAdminService';
import { formatDate, formatDateTime } from '../../utils/saCommon';
import { SA_PORTAL } from './saConstants';
import './styles/_shared.css';
import './styles/escalations.css';

const COLS = 9;
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const TEAMS = ['Support Team', 'Technical Team', 'Unassigned'];
const EMPTY_CREATE = { company_id: '', category: 'Technical', priority: 'Medium', assigned_team: 'Unassigned', description: '' };

function statusBadgeClass(status) {
  if (status === 'RESOLVED') return 'badge-active';
  if (status === 'ESCALATED') return 'badge-suspended';
  if (status === 'IN_PROGRESS') return 'badge-pending';
  return 'badge-info';
}

const priorityBadgeClass = (priority) => `badge-priority-${(priority || 'low').toLowerCase()}`;
const statusLabel = (status) => (status || '').replace('_', ' ');

function EscalationDetail({ esc, onChanged, showToast }) {
  const [priority, setPriority] = useState(esc.priority);
  const [team, setTeam] = useState(esc.assigned_team && esc.assigned_team !== 'Unassigned' ? esc.assigned_team : 'Unassigned');
  const [comment, setComment] = useState('');

  const act = async (run, success, failure, { clearComment } = {}) => {
    try {
      await run();
      if (success) showToast(success);
      if (clearComment) setComment('');
      await onChanged(esc.issue_id);
    } catch (e) {
      showToast(e.message || failure, 'error');
    }
  };

  const note = () => comment.trim() || undefined;

  return (
    <>
      <div className="detail-grid" id="detail-esc-info" style={{ marginBottom: 16 }}>
        <div className="detail-item"><span className="detail-label">Company</span><span className="detail-value">{esc.company_name}</span></div>
        <div className="detail-item"><span className="detail-label">Raised By</span><span className="detail-value">{esc.raised_by_name}</span></div>
        <div className="detail-item"><span className="detail-label">Category</span><span className="detail-value">{esc.category}</span></div>
        <div className="detail-item"><span className="detail-label">Status</span><span className={`badge ${statusBadgeClass(esc.status)}`}>{statusLabel(esc.status)}</span></div>
        <div className="detail-item" style={{ gridColumn: '1/-1' }}><span className="detail-label">Description</span><span className="detail-value">{esc.description || 'No description provided.'}</span></div>
        <div className="detail-item"><span className="detail-label">Created</span><span className="detail-value">{formatDate(esc.created_date)}</span></div>
        <div className="detail-item"><span className="detail-label">Last Updated</span><span className="detail-value">{formatDate(esc.updated_date)}</span></div>
      </div>

      <div className="form-section-title">Update</div>
      <div className="form-grid">
        <Field label="Priority" htmlFor="de-priority">
          <select className="form-control" id="de-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Assigned Team" htmlFor="de-team">
          <select className="form-control" id="de-team" value={team} onChange={(e) => setTeam(e.target.value)}>
            {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-outline" id="btn-save-priority" onClick={() => act(() => sa.updateCriticalEscalationPriority(esc.issue_id, priority), 'Priority updated successfully.', 'Failed to update priority.')}>Save Priority</button>
        <button type="button" className="btn btn-outline" id="btn-save-assign" onClick={() => act(() => sa.assignCriticalEscalation(esc.issue_id, team), 'Escalation assigned successfully.', 'Failed to assign.')}>Save Assignment</button>
        <button
          type="button" className="btn btn-secondary" id="btn-resolve"
          onClick={() => window.confirm('Mark this escalation as resolved?') && act(() => sa.resolveCriticalEscalation(esc.issue_id, note()), 'Escalation resolved successfully.', 'Failed to resolve.', { clearComment: true })}
        >
          Resolve
        </button>
        <button
          type="button" className="btn btn-danger" id="btn-escalate"
          onClick={() => window.confirm('Escalate this issue further with Critical priority?') && act(() => sa.escalateCriticalEscalation(esc.issue_id, note()), 'Escalation raised to Critical priority.', 'Failed to escalate.', { clearComment: true })}
        >
          Escalate Further
        </button>
      </div>

      <div className="form-section-title">Comments</div>
      <div id="detail-esc-comments" style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
        {!esc.comments?.length ? (
          <div className="empty-state" style={{ padding: 16 }}><i className="ph ph-chat-circle-dots"></i> No comments yet.</div>
        ) : (
          esc.comments.map((c, i) => (
            <div key={i} className="comment-item">
              <span className="comment-author">{c.author}</span>
              <span className="comment-time">{formatDateTime(c.timestamp)}</span>
              <div className="comment-message">{c.message}</div>
            </div>
          ))
        )}
      </div>
      <div className="form-group">
        <textarea className="form-control" id="de-comment" rows="2" placeholder="Add a comment..." aria-label="Comment" value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
      </div>
      <button
        type="button" className="btn btn-outline" id="btn-add-comment"
        onClick={() => (comment.trim() ? act(() => sa.addCriticalEscalationComment(esc.issue_id, comment.trim()), null, 'Failed to add comment.', { clearComment: true }) : showToast('Enter a comment first.', 'error'))}
      >
        <i className="ph ph-chat-circle-text"></i> Add Comment
      </button>
    </>
  );
}

export default function SaEscalations() {
  const [toast, showToast] = useSaToast();
  const [escalations, setEscalations] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' });
  const [modal, setModal] = useState(null); // 'create' | 'detail'
  const [detailId, setDetailId] = useState(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [companies, setCompanies] = useState(null); // null loading | 'error' | []
  const [error, setError] = useState('');
  const createForm = useFormState(EMPTY_CREATE);

  const loadEscalations = useCallback(async () => {
    setLoadState('loading');
    try {
      setEscalations(await sa.getCriticalEscalations(filters));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [filters]);

  useEffect(() => {
    loadEscalations();
  }, [loadEscalations]);

  const close = () => setModal(null);
  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  const refreshDetail = async (id) => {
    const updated = await sa.getCriticalEscalationById(id);
    setEscalations((list) => list.map((x) => (x.issue_id === id ? updated : x)));
    setDetailVersion((v) => v + 1);
  };

  const openCreate = async () => {
    createForm.reset();
    setError('');
    setCompanies(null);
    setModal('create');
    try {
      const list = await sa.getCompanies();
      setCompanies(list);
      createForm.setValues((v) => ({ ...v, company_id: list[0]?.company_id || '' }));
    } catch {
      setCompanies('error');
    }
  };

  const submitCreate = async () => {
    const data = { ...createForm.values, description: createForm.values.description.trim() };
    if (!data.company_id) return setError('Please select a company.');
    try {
      await sa.createCriticalEscalation(data);
      showToast('Escalation raised successfully.');
      close();
      await loadEscalations();
    } catch (e) {
      setError(e.message || 'Failed to raise escalation.');
    }
  };

  const detail = escalations.find((x) => x.issue_id === detailId);

  let rows;
  if (loadState === 'loading') rows = <StateRow colSpan={COLS} kind="loading">Loading escalations...</StateRow>;
  else if (loadState === 'error') rows = <StateRow colSpan={COLS} kind="error">Failed to load escalations.</StateRow>;
  else if (escalations.length === 0) rows = <StateRow colSpan={COLS} kind="empty" icon="ph-siren">No escalations found.</StateRow>;
  else {
    rows = escalations.map((e) => (
      <tr key={e.issue_id}>
        <td>{e.issue_id}</td>
        <td>{e.company_name}</td>
        <td>{e.raised_by_name}</td>
        <td>{e.category}</td>
        <td><span className={`badge ${priorityBadgeClass(e.priority)}`}>{e.priority}</span></td>
        <td>{e.assigned_team}</td>
        <td><span className={`badge ${statusBadgeClass(e.status)}`}>{statusLabel(e.status)}</span></td>
        <td>{formatDate(e.created_date)}</td>
        <td>
          <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="icon-btn" title="View / Manage" onClick={() => { setDetailId(e.issue_id); setModal('detail'); }}><i className="ph ph-eye"></i></button>
          </div>
        </td>
      </tr>
    ));
  }

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Escalations" title="Escalations" portal={SA_PORTAL} />

      <div className="sa-shell">
        <div className="section-header">
          <h2 className="section-title">Escalations Requiring Attention</h2>
          <button type="button" className="btn btn-primary" id="btn-open-create" onClick={openCreate}><i className="ph ph-plus"></i> Raise Escalation</button>
        </div>

        <div className="card filter-bar">
          <div className="filters-wrap">
            <select id="status-filter" className="filter-select" aria-label="Filter by status" value={filters.status} onChange={setFilter('status')}>
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <select id="priority-filter" className="filter-select" aria-label="Filter by priority" value={filters.priority} onChange={setFilter('priority')}>
              <option value="all">All Priorities</option>
              {[...PRIORITIES].reverse().map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="button" className="btn-clear" id="btn-clear-filters" onClick={() => setFilters({ status: 'all', priority: 'all' })}><i className="ph ph-x"></i> Clear</button>
          </div>
        </div>

        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Issue ID</th><th>Company</th><th>Raised By</th><th>Category</th><th>Priority</th><th>Assigned Team</th><th>Status</th><th>Created</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="esc-tbody">{rows}</tbody>
          </table>
        </div>
      </div>

      <SaModal
        id="createEscModal" open={modal === 'create'} onClose={close} title="Raise Critical Escalation"
        footer={<><button type="button" className="btn btn-outline" onClick={close}>Cancel</button><button type="button" className="btn btn-primary" onClick={submitCreate}>Raise Escalation</button></>}
      >
        <form id="create-esc-form" onSubmit={(e) => e.preventDefault()}>
          <Field label="Company" htmlFor="ce-company">
            <select className="form-control" id="ce-company" {...createForm.bind('company_id')}>
              {companies === null && <option value="">Loading...</option>}
              {companies === 'error' && <option value="">Failed to load companies</option>}
              {Array.isArray(companies) && companies.map((c) => <option key={c.company_id} value={c.company_id}>{c.company_name}</option>)}
            </select>
          </Field>
          <div className="form-grid">
            <Field label="Category" htmlFor="ce-category">
              <select className="form-control" id="ce-category" {...createForm.bind('category')}>
                {['Technical', 'Billing', 'Support', 'Security', 'Other'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Priority" htmlFor="ce-priority">
              <select className="form-control" id="ce-priority" {...createForm.bind('priority')}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Assigned Team" htmlFor="ce-team">
            <select className="form-control" id="ce-team" {...createForm.bind('assigned_team')}>
              {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Description" htmlFor="ce-description"><textarea className="form-control" id="ce-description" rows="3" {...createForm.bind('description')}></textarea></Field>
          <FormError id="create-esc-error" message={error} />
        </form>
      </SaModal>

      <SaModal id="detailEscModal" open={modal === 'detail' && Boolean(detail)} onClose={close} titleId="detail-esc-title" title={detail ? `Escalation ${detail.issue_id}` : 'Escalation Details'} maxWidth="640px">
        {detail && <EscalationDetail key={`${detail.issue_id}-${detailVersion}`} esc={detail} onChanged={refreshDetail} showToast={showToast} />}
      </SaModal>

      {toast}
    </>
  );
}
