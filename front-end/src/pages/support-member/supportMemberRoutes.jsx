// Support Member portal routes, relative to /support-member (see routes/routes.jsx).
// Page names match the original front-end/support_member/*.html files.
import { Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import Escalated from './Escalated';
import MyTickets from './MyTickets';
import Notifications from './Notifications';
import Profile from './Profile';

const supportMemberRoutes = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', element: <Dashboard /> },
  { path: 'my-tickets', element: <MyTickets /> }, // optional ?assignment=unassigned&status=&priority=&category=&search=&date=
  { path: 'escalated', element: <Escalated /> },
  { path: 'notifications', element: <Notifications /> },
  { path: 'profile', element: <Profile /> },
];

export default supportMemberRoutes;
