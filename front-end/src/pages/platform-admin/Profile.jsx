// Converted from front-end/platform_admin/profile.html + js/views/platform_admin/profile.js
import ChangePasswordCard from '../../components/platform/ChangePasswordCard';
import { DetailItem, PortalShell } from '../../components/platform/ShellUI';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { changePassword, getDashboardSummary, IS_DEMO } from '../../services/platformAdminService';

export default function Profile() {
  const { user } = useAuth();
  // Team / company counts come from the dashboard summary, as in the original.
  const { data: summary, error } = useFetch(getDashboardSummary, []);
  const count = (key) => (error || !summary ? '-' : summary[key]);

  return (
    <PortalShell portal="pa" title="Platform Admin Profile" demo={IS_DEMO}>
      <div className="card profile-banner">
        <div className="avatar-large">{user.emp_name?.charAt(0).toUpperCase()}</div>
        <div>
          <h2 className="banner-name">{user.emp_name}</h2>
          <div className="banner-role">Platform Admin</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card settings-card">
          <div className="card-title"><i className="ph-fill ph-identification-card"></i> Personal Information</div>
          <div className="detail-grid">
            <DetailItem label="Employee ID">{user.emp_id}</DetailItem>
            <DetailItem label="Email Address">{user.email || '-'}</DetailItem>
            <DetailItem label="Phone Number">{user.phone || '-'}</DetailItem>
            <DetailItem label="Role">Platform Admin</DetailItem>
            <DetailItem label="Assigned Companies">{count('assigned_companies')}</DetailItem>
            <DetailItem label="Technical Team">{count('technical_team_count')}</DetailItem>
            <DetailItem label="Support Team">{count('support_team_count')}</DetailItem>
          </div>
        </div>

        <ChangePasswordCard onSubmit={(current, next, confirm) => changePassword(user.emp_id, current, next, confirm)} />
      </div>
    </PortalShell>
  );
}
