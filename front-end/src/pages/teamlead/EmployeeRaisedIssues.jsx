import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { getHrEscalations } from '../../services/teamLeadService';
import { formatDate } from '../../utils/helpers';
import { DemoNotice, LoadState, Person, Progress, StatCard, Tabs, tlPath, useTeamData } from './components/TeamLeadUI';
import { escalationReason, isEscalated, issueStatusBadge, matchesSearch, nameOf, priorityBadge, teamIssues } from './tlUtils';
import './teamlead.css';

const hrLink = (issue) =>
  `${tlPath('escalate-to-hr')}?employee=${issue.emp_id}&title=${encodeURIComponent(`${issue.issue_id}: ${issue.title}`)}` +
  `&category=${issue.type === 'Interpersonal' ? 'Conflict' : 'Other'}`;

export default function EmployeeRaisedIssues() {
  usePageTitle('Employee Raised Issues');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'issues';
  const { data, error, reload } = useTeamData({ issues: true });
  const { data: hrEscalations = [] } = useFetch(getHrEscalations, []);
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState(null);

  const members = data?.members ?? [];
  const issues = teamIssues(members, data?.issues ?? []);
  const alerts = (data?.tasks ?? []).filter((t) => isEscalated(t));
  const visible = issues.filter((i) => matchesSearch(search, i.issue_id, i.title, i.type, nameOf(members, i.emp_id), i.status));

  const tabs = [
    { key: 'alerts', label: `Low Productivity Alerts (${alerts.length})` },
    { key: 'issues', label: `Employee Raised Issues (${issues.length})` },
    { key: 'hr', label: `Escalate to HR (${hrEscalations.length})` },
  ];

  return (
    <div className="tl-page">
      <DemoNotice />
      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="tl-stats-grid">
          <StatCard icon="ph-chat-centered-text" label="Total Issues" value={issues.length} />
          <StatCard icon="ph-fire" tone="red" label="High Priority" value={issues.filter((i) => priorityBadge(i.priority) === 'high').length} />
          <StatCard icon="ph-hourglass" tone="orange" label="Pending" value={issues.filter((i) => i.status === 'Pending' || i.status === 'Open').length} />
          <StatCard icon="ph-spinner-gap" tone="green" label="In Progress" value={issues.filter((i) => i.status === 'In Progress').length} />
        </div>

        <Tabs tabs={tabs} active={tab} onChange={(key) => setParams({ tab: key }, { replace: true })} />

        {tab === 'alerts' && (
          <Table
            title="Low Productivity Alerts"
            rowKey="task_id"
            data={alerts}
            emptyMessage="No low productivity alerts right now."
            columns={[
              { key: 'emp', header: 'Employee', render: (t) => <Person name={nameOf(members, t.assigned_to)} /> },
              { key: 'task', header: 'Task', render: (t) => <><span className="tl-id">{t.task_id}</span> {t.task_title}</> },
              { key: 'progress', header: 'Progress', render: (t) => <Progress value={Number(t.progress_percentage || 0)} /> },
              { key: 'reason', header: 'Reason', render: (t) => escalationReason(t) },
              { key: 'action', header: 'Action', render: () => <Link to={tlPath('escalations')} className="btn btn-danger tl-btn-sm">Take Action</Link> },
            ]}
          />
        )}

        {tab === 'issues' && (
          <div className="card table-modern" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-card-header"><h3>Employee Raised Issues</h3></div>
            <div className="tl-toolbar">
              <SearchBar value={search} onChange={setSearch} placeholder="Search by employee, issue, type or status" />
            </div>
            <Table
              rowKey="issue_id"
              data={visible}
              emptyMessage="No issues match your search."
              columns={[
                { key: 'emp', header: 'Employee', render: (i) => <Person name={nameOf(members, i.emp_id)} /> },
                { key: 'issue_id', header: 'Issue ID', render: (i) => <span className="tl-muted">{i.issue_id}</span> },
                { key: 'title', header: 'Title', render: (i) => <span className="tl-strong">{i.title}</span> },
                { key: 'type', header: 'Type', render: (i) => <Badge variant="gray">{i.type}</Badge> },
                { key: 'priority', header: 'Priority', render: (i) => <Badge variant={priorityBadge(i.priority)}>{i.priority}</Badge> },
                { key: 'status', header: 'Status', render: (i) => <Badge variant={issueStatusBadge(i.status)}>{i.status}</Badge> },
                { key: 'date', header: 'Raised', render: (i) => formatDate(i.raised_date) },
                { key: 'actions', header: 'Actions', render: (i) => (
                  <div className="tl-actions">
                    <button type="button" className="tl-icon-btn" title="View details" aria-label={`View ${i.issue_id}`} onClick={() => setDetails(i)}>
                      <i className="ph ph-eye"></i>
                    </button>
                    {i.status !== 'Resolved' && (
                      <Link to={`${tlPath('resolve-issue')}?id=${i.issue_id}`} className="tl-icon-btn" title="Resolve issue" aria-label={`Resolve ${i.issue_id}`}>
                        <i className="ph ph-check-circle"></i>
                      </Link>
                    )}
                    <Link to={hrLink(i)}className="tl-icon-btn" title="Escalate to HR" aria-label={`Escalate ${i.issue_id} to HR`}>
                      <i className="ph ph-siren"></i>
                    </Link>
                  </div>
                ) },
              ]}
            />
          </div>
        )}

        {tab === 'hr' && (
          <div className="card">
            <div className="card-header">
              <h3 className="section-title">Escalations sent to HR</h3>
              <Link to={tlPath('escalate-to-hr')} className="btn btn-orange tl-btn-sm"><i className="ph ph-siren"></i> New HR Escalation</Link>
            </div>
            {hrEscalations.length === 0 ? (
              <EmptyState icon="ph-paper-plane-tilt" description="You have not escalated anything to HR yet." />
            ) : (
              hrEscalations.map((e) => (
                <div key={e.id} className="tl-issue-card">
                  <div className="tl-issue-header">
                    <span className="tl-issue-title">{e.title}</span>
                    <Badge variant={priorityBadge(e.priority)}>{e.priority}</Badge>
                  </div>
                  <div className="tl-muted">{e.id} &bull; {e.category} &bull; {e.relatedEmployee || 'N/A'} &bull; {formatDate(e.date)} &bull; {e.status}</div>
                </div>
              ))
            )}
          </div>
        )}
      </LoadState>

      <Modal
        isOpen={Boolean(details)}
        onClose={() => setDetails(null)}
        title={details ? `${details.issue_id} - ${details.title}` : ''}
        footer={
          details && (
            <>
              <Button variant="outline" onClick={() => setDetails(null)}>Close</Button>
              {details.status !== 'Resolved' && (
                <Link to={`${tlPath('assign-issue')}?id=${details.issue_id}`} className="btn btn-primary">Assign</Link>
              )}
            </>
          )
        }
      >
        {details && (
          <div className="tl-page" style={{ gap: 0 }}>
            <p style={{ marginTop: 0 }}>{details.description || 'No description provided.'}</p>
            {[
              ['Raised by', nameOf(members, details.emp_id)],
              ['Type', details.type],
              ['Priority', details.priority],
              ['Status', details.status],
              ['Related task', details.related_task || '-'],
              ['Assigned to', details.assigned_to || 'Unassigned'],
              ['Raised on', formatDate(details.raised_date)],
            ].map(([k, v]) => (
              <div key={k} className="tl-kv"><span>{k}</span><span>{v}</span></div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
