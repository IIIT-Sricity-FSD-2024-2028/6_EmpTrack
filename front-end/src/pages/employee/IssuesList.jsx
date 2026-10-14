import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { getIssuesForUser } from '../../services/issueService';
import { empPath, issuePriorityBadge, issueStatusBadge } from './employeeUtils';

const pillStyle = { padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 11 };
const ellipsis = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const detailsPath = (issue) => `${empPath('issue-details')}?id=${issue.issue_id}`;

const columns = [
  {
    key: 'issue_id',
    header: 'Issue ID',
    render: (i) => (
      <Link to={detailsPath(i)} style={{ color: '#3B82F6', fontWeight: 'var(--font-semibold)', textDecoration: 'none' }}>
        #{i.issue_id}
      </Link>
    ),
  },
  {
    key: 'title',
    header: 'Title',
    cellStyle: { fontWeight: 'var(--font-medium)', maxWidth: 200 },
    render: (i) => <div style={ellipsis}>{i.title}</div>,
  },
  { key: 'priority', header: 'Priority', render: (i) => <Badge variant={issuePriorityBadge(i.priority)} style={pillStyle}>{i.priority}</Badge> },
  { key: 'status', header: 'Status', render: (i) => <Badge variant={issueStatusBadge(i.status)} style={pillStyle}>{i.status}</Badge> },
  { key: 'assigned_to', header: 'Assigned To', cellStyle: { color: 'var(--text-muted)' } },
  {
    key: 'description',
    header: 'Remarks',
    cellStyle: { color: 'var(--text-muted)', fontSize: 12, maxWidth: 200 },
    render: (i) => <div style={ellipsis}>{i.description}</div>,
  },
  {
    key: 'actions',
    header: 'Actions',
    headerStyle: { textAlign: 'right' },
    cellStyle: { textAlign: 'right' },
    render: (i) => (
      <Link
        to={detailsPath(i)}
        className="btn btn-purple"
        style={{ fontSize: 11, textDecoration: 'none', padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
      >
        <i className="ph ph-eye"></i> View Details
      </Link>
    ),
  },
];

export default function IssuesList() {
  usePageTitle('Issue Reporting');
  const { user } = useAuth();
  const { data: issues = [] } = useFetch(() => getIssuesForUser(user.emp_id), [user.emp_id]);

  const metrics = [
    { label: 'Total Issues', value: issues.length, color: 'var(--text-main)' },
    { label: 'Open Issues', value: issues.filter((i) => i.status === 'Open').length, color: '#3B82F6' },
    { label: 'In Progress', value: issues.filter((i) => i.status === 'In Progress').length, color: '#EA580C' },
    { label: 'Resolved', value: issues.filter((i) => i.status === 'Resolved').length, color: '#16A34A' },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="ph ph-warning-circle" style={{ color: 'var(--primary-color)', fontSize: 28 }}></i>
          <span style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xl)' }}>Issue Reporting</span>
        </div>
        <Link
          to={empPath('raise-issue')}
          className="btn btn-purple"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 'var(--text-sm)' }}
        >
          <i className="ph ph-plus"></i> Raise New Issue
        </Link>
      </div>

      <Table
        title="Issue Status"
        headerStyle={{ padding: 20 }}
        style={{ marginBottom: 'var(--spacing-xl)' }}
        columns={columns}
        data={issues}
        rowKey="issue_id"
        emptyMessage="No issues recorded."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {metrics.map((m) => (
          <div key={m.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'var(--font-bold)', color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}
