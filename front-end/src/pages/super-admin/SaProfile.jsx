// Converted from front-end/super_admin/profile.html + js/views/super_admin/profile.js
import PasswordCard from '../../components/sa-common/PasswordCard';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import useSaToast from '../../components/sa-common/useSaToast';
import useAuth from '../../hooks/useAuth';
import * as sa from '../../services/superAdminService';
import './styles/_shared.css';
import './styles/profile.css';

export default function SaProfile() {
  const { user } = useAuth();
  const [toast, showToast] = useSaToast();

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Super Admin Profile" title="Super Admin Profile" />

      <div className="sa-shell">
        <div className="card sa-profile-banner">
          <div className="sa-avatar-large" id="avatar-circle"><span id="avatar-initials">{user.emp_name.charAt(0).toUpperCase()}</span></div>
          <div className="sa-banner-info">
            <h2 className="sa-banner-name" id="profile-name">{user.emp_name}</h2>
            <div className="sa-banner-role">Super Admin</div>
          </div>
        </div>

        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card settings-card" style={{ padding: 24 }}>
            <div className="card-title"><i className="ph-fill ph-identification-card"></i> Personal Information</div>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">Employee ID</span><span className="detail-value" id="info-empId">{user.emp_id}</span></div>
              <div className="detail-item"><span className="detail-label">Email Address</span><span className="detail-value" id="info-email">{user.email}</span></div>
              <div className="detail-item"><span className="detail-label">Phone Number</span><span className="detail-value" id="info-phone">{user.phone}</span></div>
              <div className="detail-item"><span className="detail-label">Role</span><span className="detail-value">Super Admin</span></div>
            </div>
          </div>

          <PasswordCard
            onSubmit={(current, next, confirm) => sa.updateUserPassword(user.emp_id, current, next, confirm)}
            onSuccess={() => showToast('Password updated successfully.')}
          />
        </div>
      </div>

      {toast}
    </>
  );
}
