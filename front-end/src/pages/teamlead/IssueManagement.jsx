import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import usePageTitle from '../../hooks/usePageTitle';
import { DemoNotice, LoadState, StatCard, tlPath, useTeamData } from './components/TeamLeadUI';
import { isOpenIssue, issueStatusBadge, matchesSearch, nameOf, priorityBadge, teamIssues } from './tlUtils';
import './teamlead.css';

export default function IssueManagement() {
  usePageTitle('Issue Management');
  const { data, error, reload } = useTeamData({ tasks: false, issues: true });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const members = data?.members ?? [];
  const issues = teamIssues(members, data?.issues ?? []);
  const visible = issues
    .filter((i) => !status || (status === 'Open' ? isOpenIssue(i) : i.status === status))
    .filter((i) => !priority || i.priority === priority)
    .filter((i) => matchesSearch(search, i.issue_id, i.title, i.type, nameOf(members, i.emp_id), i.assigned_to))
    .sort((a, b) => String(b.raised_date).localeCompare(String(a.raised_date)));

  return (
    <div className="tl-page">
      <DemoNotice />
      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="tl-stats-grid">
          <StatCard icon="ph-list-bullets" label="Total Issues" value={issues.length} />
          <StatCard icon="ph-envelope-open" tone="orange" label="Open" value={issues.filter(isOpenIssue).length} />
          <StatCard icon="ph-spinner-gap" label="In Progress" value={issues.filter((i) => i.status === 'In Progress').length} />
          <StatCard icon="ph-check-circle" tone="green" label="Resolved" value={issues.filter((i) => i.status === 'Resolved').length} />
        </div>

        <div className="card table-modern" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-card-header">
            <h3>Team Issues</h3>
            <Link to={tlPath('employee-raised-issues')} className="btn btn-outline tl-btn-sm">Employee raised issues</Link>
          </div>
          <div className="tl-toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Search issue, employee or assignee" />
            <select className="form-control" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select className="form-control" aria-label="Filter by priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <Table
            rowKey="issue_id"
            data={visible}
            emptyMessage="No issues match these filters."
            columns={[
              { key: 'issue', header: 'Issue', render: (i) => (
                <div style={{ minWidth: 200 }}>
                  <span className="tl-id">{i.issue_id}</span>
                  <div className="tl-strong">{i.title}</div>
                  <div className="tl-muted">{i.type}</div>
                </div>
              ) },
              { key: 'emp', header: 'Employee', render: (i) => nameOf(members, i.emp_id) },
              { key: 'task', header: 'Task', render: (i) => i.related_task || '-' },
              { key: 'priority', header: 'Priority', render: (i) => <Badge variant={priorityBadge(i.priority)}>{i.priority}</Badge> },
              { key: 'status', header: 'Status', render: (i) => <Badge variant={issueStatusBadge(i.status)}>{i.status}</Badge> },
              { key: 'assigned_to', header: 'Assigned To', render: (i) => i.assigned_to || 'Unassigned' },
              { key: 'actions', header: 'Actions', render: (i) =>
                i.status === 'Resolved' ? (
                  <span className="tl-muted"><i className="ph-fill ph-check-circle"></i> Completed</span>
                ) : (
                  <div className="tl-actions">
                    <Link to={`${tlPath('assign-issue')}?id=${i.issue_id}`} className="btn btn-outline tl-btn-sm">Assign</Link>
                    <Link to={`${tlPath('resolve-issue')}?id=${i.issue_id}`} className="btn btn-secondary tl-btn-sm">Resolve</Link>
                  </div>
                ) },
            ]}
          />
        </div>
      </LoadState>
    </div>
  );
}
