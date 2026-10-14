// Team Lead portal routes, relative to /teamlead (see routes/routes.jsx).
// Page names match the original front-end/teamlead/*.html files.
import { Navigate } from 'react-router-dom';
import AssignIssue from './AssignIssue';
import Attendance from './Attendance';
import EmployeeRaisedIssues from './EmployeeRaisedIssues';
import EscalateToHR from './EscalateToHR';
import Escalations from './Escalations';
import IssueManagement from './IssueManagement';
import Leave from './Leave';
import Notifications from './Notifications';
import Profile from './Profile';
import Reports from './Reports';
import ResolveIssue from './ResolveIssue';
import Tasks from './Tasks';
import TeamLeadDashboard from './TeamLeadDashboard';
import TeamPerformance from './TeamPerformance';
import WorkMonitoring from './WorkMonitoring';

const teamLeadRoutes = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', element: <TeamLeadDashboard /> },
  { path: 'tasks', element: <Tasks /> },
  { path: 'work-monitoring', element: <WorkMonitoring /> },
  { path: 'team-performance', element: <TeamPerformance /> },
  { path: 'attendance', element: <Attendance /> },
  { path: 'leave', element: <Leave /> },
  { path: 'issue-management', element: <IssueManagement /> },
  { path: 'employee-raised-issues', element: <EmployeeRaisedIssues /> }, // optional ?tab=alerts|issues|hr
  { path: 'assign-issue', element: <AssignIssue /> }, // optional ?id=<issue_id>
  { path: 'resolve-issue', element: <ResolveIssue /> }, // optional ?id=<issue_id>
  { path: 'escalations', element: <Escalations /> },
  { path: 'escalate-to-hr', element: <EscalateToHR /> }, // optional ?category=&employee=&title=
  { path: 'reports', element: <Reports /> },
  { path: 'notifications', element: <Notifications /> },
  { path: 'profile', element: <Profile /> },
];

export default teamLeadRoutes;
