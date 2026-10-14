// HR portal routes, relative to /hr (see routes/routes.jsx).
// Page names match the original front-end/hr/*.html files.
import { Navigate } from 'react-router-dom';
import HrAttendance from './HrAttendance';
import HrDashboard from './HrDashboard';
import HrEmployeeManagement from './HrEmployeeManagement';
import HrEscalations from './HrEscalations';
import HrNotifications from './HrNotifications';
import HrProfile from './HrProfile';
import HrReports from './HrReports';
import HrSettings from './HrSettings';

const hrRoutes = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', element: <HrDashboard /> },
  { path: 'employee-management', element: <HrEmployeeManagement /> },
  { path: 'attendance', element: <HrAttendance /> },
  { path: 'escalations', element: <HrEscalations /> },
  { path: 'reports', element: <HrReports /> },
  { path: 'settings', element: <HrSettings /> },
  { path: 'notifications', element: <HrNotifications /> },
  { path: 'profile', element: <HrProfile /> },
];

export default hrRoutes;
