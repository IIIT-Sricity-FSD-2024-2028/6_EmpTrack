// Converted from front-end/company_admin/dashboard.html + js/views/company_admin/dashboard.js.
// Same page as the HR dashboard (it reused hr/dashboard.css), without leave approvals
// or the action cards.
import HrDashboard from '../hr/HrDashboard';
import { CA_BASE } from './caConstants';

export default function CaDashboard() {
  return <HrDashboard basePath={CA_BASE} showLeaveApprovals={false} showActions={false} />;
}
