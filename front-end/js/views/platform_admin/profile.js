// /js/views/platform_admin/profile.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { showToast } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    document.getElementById('avatar-initials').textContent = user.emp_name.charAt(0).toUpperCase();
    document.getElementById('profile-name').textContent = user.emp_name;
    document.getElementById('info-empId').textContent = user.emp_id;
    document.getElementById('info-email').textContent = user.email;
    document.getElementById('info-phone').textContent = user.phone;

    try {
        const summary = await db.getPlatformDashboardSummary();
        document.getElementById('info-companies').textContent = summary.assigned_companies;
        document.getElementById('info-technical').textContent = summary.technical_team_count;
        document.getElementById('info-support').textContent = summary.support_team_count;
    } catch (e) {
        document.getElementById('info-companies').textContent = '-';
        document.getElementById('info-technical').textContent = '-';
        document.getElementById('info-support').textContent = '-';
    }

    document.getElementById('btnUpdatePwd').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const currentPwd = document.getElementById('currentPwd').value;
        const newPwd = document.getElementById('newPwd').value;
        const confPwd = document.getElementById('confPwd').value;
        const errorEl = document.getElementById('pwd-error');
        if (!currentPwd) {
            errorEl.textContent = 'Please enter your current password.';
            errorEl.style.display = 'block';
            return;
        }
        if (!newPwd || newPwd.length < 8) {
            errorEl.textContent = 'Password must be at least 8 characters.';
            errorEl.style.display = 'block';
            return;
        }
        if (newPwd !== confPwd) {
            errorEl.textContent = 'Passwords do not match.';
            errorEl.style.display = 'block';
            return;
        }
        errorEl.style.display = 'none';
        const ogText = btn.innerHTML;
        btn.innerHTML = 'Updating...';
        btn.disabled = true;
        try {
            await db.updateUserPassword(user.emp_id, currentPwd, newPwd, confPwd);
            showToast('Password updated successfully.');
            document.getElementById('password-form').reset();
        } catch (err) {
            errorEl.textContent = err.message || 'Failed to update password.';
            errorEl.style.display = 'block';
        } finally {
            btn.innerHTML = ogText;
            btn.disabled = false;
        }
    });
});
