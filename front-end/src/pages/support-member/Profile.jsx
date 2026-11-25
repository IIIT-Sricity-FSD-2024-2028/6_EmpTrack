// Converted from front-end/support_member/profile.html + js/views/support_member/profile.js
import { useDispatch } from 'react-redux';
import ChangePasswordCard from '../../components/platform/ChangePasswordCard';
import { DetailItem, PortalShell } from '../../components/platform/ShellUI';
import useAuth from '../../hooks/useAuth';
import { IS_DEMO } from '../../services/supportMemberService';
import { employeesEntity, platformOverviewEntity } from '../../store/entities';
import { useEntityQuery } from '../../store/entitySlice';

export default function Profile() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { data: stats, error } = useEntityQuery(platformOverviewEntity, 'fetchSupportStats');
  const count = (key) => (error || !stats ? '-' : stats[key]);

  return (
    <PortalShell portal="sm" title="Support Member Profile" demo={IS_DEMO}>
      <div className="card profile-banner">
        <div className="avatar-large">{user.emp_name?.charAt(0).toUpperCase()}</div>
        <div>
          <h2 className="banner-name">{user.emp_name}</h2>
          <div className="banner-role">Support Member</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card settings-card">
          <div className="card-title"><i className="ph-fill ph-identification-card"></i> Personal Information</div>
          <div className="detail-grid">
            <DetailItem label="Employee ID">{user.emp_id}</DetailItem>
            <DetailItem label="Email Address">{user.email || '-'}</DetailItem>
            <DetailItem label="Phone Number">{user.phone || '-'}</DetailItem>
            <DetailItem label="Role">Support Member</DetailItem>
            <DetailItem label="Specialization">{user.specialization || '-'}</DetailItem>
          </div>

          <div className="card-title spaced"><i className="ph-fill ph-ticket"></i> My Ticket Summary</div>
          <div className="detail-grid">
            <DetailItem label="Open Tickets">{count('my_open_tickets')}</DetailItem>
            <DetailItem label="Resolved Tickets">{count('my_resolved')}</DetailItem>
            <DetailItem label="Escalated Tickets">{count('my_escalated')}</DetailItem>
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
