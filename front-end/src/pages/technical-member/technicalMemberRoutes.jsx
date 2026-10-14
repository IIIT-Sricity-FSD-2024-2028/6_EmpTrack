// Technical Member portal routes, relative to /technical-member (see routes/routes.jsx).
// Page names match the original front-end/technical_member/*.html files.
import { Navigate } from 'react-router-dom';
import AssignedIssues from './AssignedIssues';
import IssueHistory from './IssueHistory';
import TmDashboard from './TmDashboard';
import TmNotifications from './TmNotifications';
import TmProfile from './TmProfile';

const technicalMemberRoutes = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', element: <TmDashboard /> },
  { path: 'assigned-issues', element: <AssignedIssues /> }, // optional ?status= / ?priority=
  { path: 'issue-history', element: <IssueHistory /> },
  { path: 'notifications', element: <TmNotifications /> },
  { path: 'profile', element: <TmProfile /> },
];

export default technicalMemberRoutes;
