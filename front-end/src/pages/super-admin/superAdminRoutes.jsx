// Super Admin portal routes, relative to /super-admin (see routes/routes.jsx).
// Page names match the original front-end/super_admin/*.html files.
import { Navigate } from 'react-router-dom';
import SaActivity from './SaActivity';
import SaAnalytics from './SaAnalytics';
import SaCompanies from './SaCompanies';
import SaDashboard from './SaDashboard';
import SaEscalations from './SaEscalations';
import SaNotifications from './SaNotifications';
import SaPlatformAdmins from './SaPlatformAdmins';
import SaProfile from './SaProfile';
import SaRevenue from './SaRevenue';
import SaSettings from './SaSettings';
import SaSubscriptions from './SaSubscriptions';

const superAdminRoutes = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', element: <SaDashboard /> },
  { path: 'companies', element: <SaCompanies /> },
  { path: 'platform-admins', element: <SaPlatformAdmins /> },
  { path: 'subscriptions', element: <SaSubscriptions /> },
  { path: 'revenue', element: <SaRevenue /> },
  { path: 'analytics', element: <SaAnalytics /> },
  { path: 'activity', element: <SaActivity /> },
  { path: 'escalations', element: <SaEscalations /> },
  { path: 'settings', element: <SaSettings /> },
  { path: 'notifications', element: <SaNotifications /> },
  { path: 'profile', element: <SaProfile /> },
];

export default superAdminRoutes;
