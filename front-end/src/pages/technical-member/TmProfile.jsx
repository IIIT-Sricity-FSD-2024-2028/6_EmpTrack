// Converted from front-end/technical_member/profile.html + js/views/technical_member/profile.js
import { useEffect, useState } from 'react';
import PasswordCard from '../../components/sa-common/PasswordCard';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import useSaToast from '../../components/sa-common/useSaToast';
import useAuth from '../../hooks/useAuth';
import * as tm from '../../services/technicalMemberService';
import './styles/_shared.css';

export default function TmProfile() {
  const { user } = useAuth();
  const [toast, showToast] = useSaToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    tm.getTechnicalMemberStats().then(setStats).catch(() => setStats(null));
  }, []);

  const stat = (key) => (stats ? stats[key] : '-');

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Technical Member Profile" title="Technical Member Profile" hidden />

      <div className="tm-shell">
        <div className="card tm-profile-banner">
          <div className="tm-avatar-large"><span id="avatar-initials">{user.emp_name.charAt(0).toUpperCase()}</span></div>
          <div className="tm-banner-info">
            <h2 className="tm-banner-name" id="profile-name">{user.emp_name}</h2>
            <div className="tm-banner-role">Technical Member</div>
          </div>
        </div>

        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card settings-card" style={{ padding: 24 }}>
            <div className="card-title"><i className="ph-fill ph-identification-card"></i> Personal Information</div>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">Employee ID</span><span className="detail-value" id="info-empId">{user.emp_id}</span></div>
              <div className="detail-item"><span className="detail-label">Email Address</span><span className="detail-value" id="info-email">{user.email}</span></div>
              <div className="detail-item"><span className="detail-label">Phone Number</span><span className="detail-value" id="info-phone">{user.phone}</span></div>
              <div className="detail-item"><span className="detail-label">Role</span><span className="detail-value">Technical Member</span></div>
              <div className="detail-item"><span className="detail-label">Specialization</span><span className="detail-value" id="info-specialization">{user.specialization || '-'}</span></div>
              <div className="detail-item"><span className="detail-label">Reports To</span><span className="detail-value" id="info-platform-admin">{user.platform_admin_name || '-'}</span></div>
            </div>

            <div className="card-title" style={{ marginTop: 24 }}><i className="ph-fill ph-bug"></i> My Issue Summary</div>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">Assigned Issues</span><span className="detail-value" id="info-assigned">{stat('assigned_issues')}</span></div>
              <div className="detail-item"><span className="detail-label">Active Issues</span><span className="detail-value" id="info-active">{stat('active_issues')}</span></div>
              <div className="detail-item"><span className="detail-label">Resolved Total</span><span className="detail-value" id="info-resolved">{stat('resolved_total')}</span></div>
              <div className="detail-item"><span className="detail-label">Awaiting Verification</span><span className="detail-value" id="info-pending">{stat('pending_verification')}</span></div>
            </div>
          </div>

          <PasswordCard
            onSubmit={(current, next, confirm) => tm.updateUserPassword(user.emp_id, current, next, confirm)}
            onSuccess={() => showToast('Password updated successfully.')}
          />
        </div>
      </div>

      {toast}
    </>
  );
}
