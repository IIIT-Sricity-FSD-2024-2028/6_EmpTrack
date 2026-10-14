// Company Admin portal routes, relative to /company-admin (see routes/routes.jsx).
// Page names match the original front-end/company_admin/*.html files.
import { Navigate } from 'react-router-dom';
import CaBilling from './CaBilling';
import CaDashboard from './CaDashboard';
import CaEmployeeManagement from './CaEmployeeManagement';
import CaNotifications from './CaNotifications';
import CaProfile from './CaProfile';
import CaRaiseIssue from './CaRaiseIssue';

const companyAdminRoutes = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', element: <CaDashboard /> },
  { path: 'employee-management', element: <CaEmployeeManagement /> },
  { path: 'raise-issue', element: <CaRaiseIssue /> },
  { path: 'billing', element: <CaBilling /> },
  { path: 'notifications', element: <CaNotifications /> },
  { path: 'profile', element: <CaProfile /> },
];

export default companyAdminRoutes;
