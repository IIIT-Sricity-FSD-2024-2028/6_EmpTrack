import { useState } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import usePageTitle from '../../hooks/usePageTitle';
import { CAN_EDIT_ASSIGNMENT, createTask, deleteTask, updateTask } from '../../services/teamLeadService';
import { formatDate } from '../../utils/helpers';
import { DemoNotice, LoadState, StatCard, useTeamData, useToast } from './components/TeamLeadUI';
import { matchesSearch, nameOf, TASK_STATUSES, taskStatusBadge, taskStatusLabel, todayKey } from './tlUtils';
import './teamlead.css';

const EMPTY_TASK = { assigned_to: '', task_title: '', task_description: '', est_hours: '', deadline: '', priority: 'Medium' };

function validate(values, { isNew }) {
  const errors = {};
  if (!values.assigned_to) errors.assigned_to = 'Select a team member.';
  if (values.task_title.trim().length < 3) errors.task_title = 'Title must be at least 3 characters.';
  if (!(Number(values.est_hours) > 0)) errors.est_hours = 'Enter the estimated hours (more than 0).';
  if (!values.deadline) errors.deadline = 'Pick a deadline.';
  else if (isNew && values.deadline < todayKey()) errors.deadline = 'Deadline cannot be in the past.';
  return errors;
}

/** Fields shared by the create form and the edit modal. */
function TaskFields({ values, errors, members, onChange, withStatus }) {
  // The backend cannot change the assignee or estimate of an existing task.
  const locked = (name) => withStatus && !CAN_EDIT_ASSIGNMENT && (name === 'assigned_to' || name === 'est_hours');
  const field = (name) => ({
    name,
    value: values[name],
    error: errors[name],
    disabled: locked(name),
    title: locked(name) ? 'The backend cannot change this after a task is created' : undefined,
    onChange: (e) => onChange(name, e.target.value),
  });
  return (
    <div className="tl-form-grid">
      <Input as="select" label="Assign To" {...field('assigned_to')}>
        <option value="">Select team member</option>
        {members.map((m) => (
          <option key={m.emp_id} value={m.emp_id}>{m.emp_name}</option>
        ))}
      </Input>
      <Input label="Task Title" placeholder="e.g. Payment gateway integration" {...field('task_title')} />
      <Input label="Estimated Hours" type="number" min="1" step="0.5" {...field('est_hours')} />
      <Input label="Deadline" type="date" {...field('deadline')} />
      <Input as="select" label="Priority" {...field('priority')}>
        {['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
      </Input>
      {withStatus && (
        <Input as="select" label="Status" {...field('status')}>
          {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Input>
      )}
      <Input as="textarea" rows={3} label="Description" placeholder="What needs to be done?" groupStyle={{ gridColumn: '1 / -1' }} {...field('task_description')} />
    </div>
  );
}

export default function Tasks() {
  usePageTitle('Assign Tasks');
  const { data, error, reload } = useTeamData();
  const [toast, showToast] = useToast();

  const [form, setForm] = useState(EMPTY_TASK);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // task being edited (form values)
  const [editErrors, setEditErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [sortBy, setSortBy] = useState('deadline');

  const members = data?.members ?? [];
  const tasks = data?.tasks ?? [];
  const count = (s) => tasks.filter((t) => t.status === s).length;

  const visible = tasks
    .filter((t) => (status === 'ALL' ? true : status === 'ACTIVE' ? t.status !== 'COMPLETED' : t.status === status))
    .filter((t) => matchesSearch(search, t.task_id, t.task_title, nameOf(members, t.assigned_to)))
    .sort((a, b) => (sortBy === 'hours' ? Number(b.est_hours) - Number(a.est_hours) : String(a.deadline).localeCompare(String(b.deadline))));

  const run = async (action, success) => {
    try {
      await action();
      showToast(success);
      await reload();
      return true;
    } catch (err) {
      showToast(err.message || 'Something went wrong.', 'error');
      return false;
    }
  };

  const toPayload = (v) => ({ ...v, task_title: v.task_title.trim(), task_description: v.task_description.trim(), est_hours: Number(v.est_hours) });

  const handleCreate = async (e) => {
    e.preventDefault();
    const errors = validate(form, { isNew: true });
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    setSaving(true);
    if (await run(() => createTask(toPayload(form)), `Task assigned to ${nameOf(members, form.assigned_to)}`)) setForm(EMPTY_TASK);
    setSaving(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const errors = validate(editing, { isNew: false });
    setEditErrors(errors);
    if (Object.keys(errors).length) return;
    setSaving(true);
    const { task_id, ...changes } = editing;
    if (await run(() => updateTask(task_id, toPayload(changes)), 'Task updated')) setEditing(null);
    setSaving(false);
  };

  const openEdit = (t) => {
    setEditErrors({});
    setEditing({
      task_id: t.task_id,
      assigned_to: t.assigned_to,
      task_title: t.task_title,
      task_description: t.task_description || '',
      est_hours: t.est_hours ?? '',
      deadline: t.deadline || '',
      priority: t.priority || 'Medium',
      status: t.status,
    });
  };

  const columns = [
    { key: 'task_id', header: 'Task ID', render: (t) => <span className="tl-id">{t.task_id}</span> },
    { key: 'assigned_to', header: 'Employee', render: (t) => nameOf(members, t.assigned_to) },
    { key: 'task_title', header: 'Title', render: (t) => (
      <div>
        <div className="tl-strong">{t.task_title}</div>
        {t.task_description && <div className="tl-muted">{t.task_description}</div>}
      </div>
    ) },
    { key: 'est_hours', header: 'Est. Hours', render: (t) => (t.est_hours ? `${t.est_hours}h` : '-') },
    { key: 'deadline', header: 'Deadline', render: (t) => formatDate(t.deadline) || '-' },
    { key: 'status', header: 'Status', render: (t) => (
      <select
        className="form-control"
        aria-label={`Status of ${t.task_id}`}
        value={t.status}
        onChange={(e) => run(() => updateTask(t.task_id, { status: e.target.value }), `${t.task_id} marked ${taskStatusLabel(e.target.value)}`)}
        style={{ minWidth: 130 }}
      >
        {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    ) },
    { key: 'badge', header: '', render: (t) => <Badge variant={taskStatusBadge(t.status)}>{taskStatusLabel(t.status)}</Badge> },
    { key: 'actions', header: 'Actions', render: (t) => (
      <div className="tl-actions">
        <button type="button" className="tl-icon-btn" title="Edit task" aria-label={`Edit ${t.task_id}`} onClick={() => openEdit(t)}>
          <i className="ph ph-pencil-simple"></i>
        </button>
        <button type="button" className="tl-icon-btn danger" title="Delete task" aria-label={`Delete ${t.task_id}`} onClick={() => setDeleting(t)}>
          <i className="ph ph-trash"></i>
        </button>
      </div>
    ) },
  ];

  return (
    <div className="tl-page">
      <DemoNotice />
      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="tl-stats-grid">
          <StatCard icon="ph-briefcase" label="Total Assigned" value={tasks.length} />
          <StatCard icon="ph-rocket" tone="orange" label="In Progress" value={count('IN_PROGRESS')} />
          <StatCard icon="ph-check-circle" tone="green" label="Completed" value={count('COMPLETED')} />
          <StatCard icon="ph-hourglass-high" tone="red" label="Not Started" value={count('NOT_STARTED')} />
        </div>

        <form className="card" onSubmit={handleCreate} noValidate>
          <h3 className="tl-section-title">Create &amp; Assign Task</h3>
          <TaskFields values={form} errors={formErrors} members={members} onChange={(name, value) => setForm((f) => ({ ...f, [name]: value }))} />
          <div className="tl-form-actions">
            <Button type="submit" icon="ph-paper-plane-tilt" disabled={saving}>{saving ? 'Assigning...' : 'Assign Task'}</Button>
            <Button variant="outline" onClick={() => { setForm(EMPTY_TASK); setFormErrors({}); }}>Clear</Button>
          </div>
        </form>

        <div className="card table-modern" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-card-header"><h3>Assigned Tasks</h3></div>
          <div className="tl-toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by task, title or employee" />
            <select className="form-control" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">Active (not completed)</option>
              <option value="ALL">All statuses</option>
              {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select className="form-control" aria-label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="deadline">Sort: Deadline</option>
              <option value="hours">Sort: Est. hours</option>
            </select>
          </div>
          <Table columns={columns} data={visible} rowKey="task_id" emptyMessage="No tasks match these filters." />
        </div>
      </LoadState>

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Edit Task ${editing?.task_id ?? ''}`}
        maxWidth={640}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" form="edit-task-form" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </>
        }
      >
        {editing && (
          <form id="edit-task-form" className="tl-page" onSubmit={handleEdit} noValidate>
            <TaskFields values={editing} errors={editErrors} members={members} withStatus onChange={(name, value) => setEditing((t) => ({ ...t, [name]: value }))} />
          </form>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete task?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" onClick={async () => { await run(() => deleteTask(deleting.task_id), `${deleting.task_id} deleted`); setDeleting(null); }}>Delete</Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          <strong>{deleting?.task_id}</strong> - {deleting?.task_title} will be removed. This cannot be undone.
        </p>
      </Modal>
      {toast}
    </div>
  );
}
