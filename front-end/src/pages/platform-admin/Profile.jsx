// Converted from front-end/platform_admin/profile.html + js/views/platform_admin/profile.js
import { useDispatch } from 'react-redux';
import ChangePasswordCard from '../../components/platform/ChangePasswordCard';
import { DetailItem, PortalShell } from '../../components/platform/ShellUI';
import useAuth from '../../hooks/useAuth';
import { IS_DEMO } from '../../services/platformAdminService';
import { employeesEntity, platformOverviewEntity } from '../../store/entities';
import { useEntityQuery } from '../../store/entitySlice';

export default function Profile() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  // Team / company counts come from the dashboard summary, as in the original.
  const { data: summary, error } = useEntityQuery(platformOverviewEntity, 'fetchDashboardSummary');
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

        <ChangePasswordCard
          onSubmit={(currentPassword, newPassword, confirmPassword) => dispatch(employeesEntity.thunks.changePasswordPlatform({
            empId: user.emp_id, currentPassword, newPassword, confirmPassword,
          })).unwrap()}
        />
      </div>
    </PortalShell>
  );
}
