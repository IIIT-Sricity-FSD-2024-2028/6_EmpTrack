import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { getIssuesForUser } from '../../services/issueService';
import BackHeading from './components/BackHeading';
import ProgressBar from './components/ProgressBar';
import { empPath, issuePriorityBadge, issueStatusBadge } from './employeeUtils';

const TIMELINE_STEPS = ['Issue Submitted', 'Under Review', 'Assigned to Lead', 'In Progress', 'Resolved'];

// Progress % and reached timeline step for an issue (same rules as the original page).
function issueProgress(issue) {
  if (issue.status === 'In Progress') return { percent: 60, step: 3 };
  if (issue.status === 'Resolved') return { percent: 100, step: 4 };
  if (issue.assigned_to !== 'Unassigned' && issue.status === 'Open') return { percent: 40, step: 2 };
  return { percent: 25, step: 0 };
}

const rowBetween = { display: 'flex', justifyContent: 'space-between' };
const dividedRow = { ...rowBetween, borderBottom: '1px solid var(--border-light)', paddingBottom: 8 };
const muted = { color: 'var(--text-muted)' };
const cardTitle = { margin: '0 0 16px 0', fontSize: 'var(--text-lg)' };

export default function IssueDetails() {
  usePageTitle('Issue Details');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const issueId = searchParams.get('id');

  const { data: issue, loading } = useFetch(
    async () => (await getIssuesForUser(user.emp_id)).find((i) => i.issue_id === issueId) ?? null,
    [user.emp_id, issueId],
  );

  // The original page only confirms and returns to the list (no close endpoint is called).
  const handleClose = () => {
    window.alert('Issue is closed');
    navigate(empPath('issues-list'));
  };

  const heading = <BackHeading to={empPath('issues-list')}>Issue Details</BackHeading>;

  if (loading) return heading;

  if (!issue) {
    return (
      <>
        {heading}
        <div className="card">
          <div style={{ textAlign: 'center', padding: 40 }}>
            Issue Not Found. <Link to={empPath('issues-list')}>Return</Link>
          </div>
        </div>
      </>
    );
  }

  const { percent, step } = issueProgress(issue);
  const lastUpdated = issue.updates?.length ? issue.updates[issue.updates.length - 1].time : issue.raised_date;

  return (
    <>
      {heading}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
        {/* Card 1: Information */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={cardTitle}>Issue Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', fontSize: 'var(--text-sm)' }}>
            <div style={dividedRow}>
              <span style={muted}>Issue ID</span>
              <span style={{ fontWeight: 'bold' }}>{issue.issue_id}</span>
            </div>
            <div style={dividedRow}>
              <span style={muted}>Category</span>
              <Badge variant="low" style={{ padding: '2px 8px' }}>{issue.type}</Badge>
            </div>
            <div>
              <div style={{ ...muted, marginBottom: 4 }}>Title</div>
              <div style={{ fontWeight: 'bold' }}>{issue.title}</div>
            </div>
            <div>
              <div style={{ ...muted, marginBottom: 4 }}>Description</div>
              <div className="form-control" style={{ backgroundColor: 'var(--bg-main)', border: 'none' }}>{issue.description}</div>
            </div>
            <div style={{ ...dividedRow, paddingTop: 8 }}>
              <span style={muted}>Raised Date</span>
              <span>{issue.raised_date}</span>
            </div>
            <div style={rowBetween}>
              <span style={muted}>Assigned To</span>
              <span>{issue.assigned_to}</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ ...muted, marginBottom: 8 }}>Attachments</div>
            </div>
          </div>
        </div>

        {/* Card 2: Overview */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={cardTitle}>Status Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', fontSize: 'var(--text-sm)' }}>
            <div style={{ ...rowBetween, alignItems: 'center' }}>
              <span style={muted}>Current Status</span>
              <Badge variant={issueStatusBadge(issue.status)} style={{ padding: '4px 12px', fontSize: 12 }}>{issue.status}</Badge>
            </div>
            <div style={{ ...rowBetween, alignItems: 'center' }}>
              <span style={muted}>Priority Level</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ph ph-warning" style={{ color: 'var(--danger-color)' }}></i>
                <Badge variant={issuePriorityBadge(issue.priority)} style={{ padding: '2px 8px', fontSize: 11 }}>{issue.priority}</Badge>
              </div>
            </div>
            <div style={rowBetween}>
              <span style={muted}>Last Updated</span>
              <span>{lastUpdated}</span>
            </div>
            <div style={rowBetween}>
              <span style={muted}>Expected Resolution</span>
              <span>TBD</span>
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ ...rowBetween, marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold' }}>Progress</span>
                <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{percent}% Complete</span>
              </div>
              <ProgressBar value={percent} height={10} />
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Timeline */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: 'var(--text-lg)' }}>Progress Timeline</h3>
        <div>
          {TIMELINE_STEPS.map((label, idx) => {
            const reached = idx <= step;
            return (
              <div key={label} className="timeline-item">
                <div className={`timeline-icon${reached ? ' completed' : ''}`}>
                  {reached && <i className="ph-bold ph-check"></i>}
                </div>
                <div style={{ fontWeight: reached ? 'bold' : 'normal', color: reached ? 'var(--text-main)' : 'var(--text-muted)', marginTop: 2 }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
        <button
          type="button"
          className="btn btn-purple"
          onClick={handleClose}
          style={{ flex: 1, padding: 16, fontSize: 'var(--text-md)', fontWeight: 'bold', backgroundColor: 'var(--text-main)' }}
        >
          Close Issue
        </button>
      </div>
    </>
  );
}
