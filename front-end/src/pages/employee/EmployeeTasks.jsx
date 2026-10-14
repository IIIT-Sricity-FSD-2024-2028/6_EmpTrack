import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { getTasksForUser } from '../../services/taskService';
import { readStorage } from '../../utils/helpers';
import { empPath, taskBadge } from './employeeUtils';

const linkStyle = { color: '#3B82F6', fontWeight: 'var(--font-semibold)', textDecoration: 'none' };
const actionStyle = { fontSize: 11, textDecoration: 'none', display: 'inline-block', textAlign: 'center' };

// Tasks the original Team Lead page kept in localStorage ('assignedTasks')
// when it could not reach the API; shown here as the original page did.
function legacyAssignedTasks() {
  return readStorage('assignedTasks', []).map((t) => ({
    task_id: `T-${String(t.id).slice(-4)}`,
    task_title: t.title,
    task_description: t.description,
    deadline: t.dueDate,
    est_hours: t.hours || 0,
    status: t.status || 'ASSIGNED',
  }));
}

const columns = [
  {
    key: 'task_id',
    header: 'Task ID',
    render: (t) => (
      <Link to={`${empPath('update-task')}?id=${t.task_id}`} style={linkStyle}>#{t.task_id}</Link>
    ),
  },
  { key: 'task_title', header: 'Task Title', cellStyle: { fontWeight: 'var(--font-medium)' } },
  {
    key: 'task_description',
    header: 'Description',
    cellStyle: { color: 'var(--text-muted)', maxWidth: 250 },
    render: (t) => (
      <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {t.task_description}
      </div>
    ),
  },
  { key: 'deadline', header: 'Assigned Date' },
  { key: 'est_hours', header: 'Est. Hours', cellStyle: { color: 'var(--text-muted)' }, render: (t) => `${t.est_hours || 0}h` },
  {
    key: 'status',
    header: 'Status',
    render: (t) => (
      <Badge
        variant={taskBadge(t.status)}
        style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 11, whiteSpace: 'nowrap' }}
      >
        {t.status.replace('_', ' ')}
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    headerStyle: { textAlign: 'right' },
    cellStyle: { textAlign: 'right' },
    render: (t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <Link to={`${empPath('update-task')}?id=${t.task_id}`} className="btn btn-orange" style={actionStyle}>
          Update
        </Link>
        <Link to={`${empPath('work-logs')}?id=${t.task_id}`} className="btn btn-purple" style={{ ...actionStyle, padding: '6px 16px' }}>
          Work on Task
        </Link>
      </div>
    ),
  },
];

export default function EmployeeTasks() {
  usePageTitle('Work on Assigned Tasks');
  const { user } = useAuth();
  const { data: tasks = [] } = useFetch(
    async () => [...(await getTasksForUser(user.emp_id).catch(() => [])), ...legacyAssignedTasks()],
    [user.emp_id],
  );

  return (
    <Table
      card
      columns={columns}
      data={tasks}
      rowKey={(t, i) => `${t.task_id}-${i}`}
      emptyMessage="No tasks currently assigned."
    />
  );
}
