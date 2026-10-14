// Employee portal routes, relative to /employee (see routes/routes.jsx).
// Page names match the original front-end/employee/*.html files.
import { Navigate } from 'react-router-dom';
import EmployeeAttendance from './EmployeeAttendance';
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeNotifications from './EmployeeNotifications';
import EmployeeProfile from './EmployeeProfile';
import EmployeeTasks from './EmployeeTasks';
import IssueDetails from './IssueDetails';
import IssuesList from './IssuesList';
import LeaveRequest from './LeaveRequest';
import RaiseIssue from './RaiseIssue';
import UpdateTask from './UpdateTask';
import WorkLogs from './WorkLogs';

const employeeRoutes = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', element: <EmployeeDashboard /> },
  { path: 'tasks', element: <EmployeeTasks /> },
  { path: 'update-task', element: <UpdateTask /> }, // ?id=<task_id>
  { path: 'work-logs', element: <WorkLogs /> }, // optional ?id=<task_id>
  { path: 'attendance', element: <EmployeeAttendance /> },
  { path: 'leave-request', element: <LeaveRequest /> },
  { path: 'issues-list', element: <IssuesList /> },
  { path: 'issue-details', element: <IssueDetails /> }, // ?id=<issue_id>
  { path: 'raise-issue', element: <RaiseIssue /> },
  { path: 'notifications', element: <EmployeeNotifications /> },
  { path: 'profile', element: <EmployeeProfile /> },
];

export default employeeRoutes;
