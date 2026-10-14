// Platform Admin portal routes, relative to /platform-admin (see routes/routes.jsx).
// Page names match the original front-end/platform_admin/*.html files.
import { Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import MyCompanies from './MyCompanies';
import Notifications from './Notifications';
import Payments from './Payments';
import Profile from './Profile';
import SupportTeam from './SupportTeam';
import SupportTickets from './SupportTickets';
import TechnicalIssues from './TechnicalIssues';
import TechnicalTeam from './TechnicalTeam';
import Workload from './Workload';

const platformAdminRoutes = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', element: <Dashboard /> },
  { path: 'my-companies', element: <MyCompanies /> },
  { path: 'payments', element: <Payments /> },
  { path: 'support-team', element: <SupportTeam /> },
  { path: 'technical-team', element: <TechnicalTeam /> },
  { path: 'support-tickets', element: <SupportTickets /> }, // optional ?open=<ticket_id>
  { path: 'technical-issues', element: <TechnicalIssues /> }, // optional ?open=<ticket_id>
  { path: 'workload', element: <Workload /> },
  { path: 'notifications', element: <Notifications /> },
  { path: 'profile', element: <Profile /> },
];

export default platformAdminRoutes;
