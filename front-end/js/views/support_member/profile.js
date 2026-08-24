// /js/views/support_member/profile.js
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
    document.getElementById('info-specialization').textContent = user.specialization || '-';

    try {
        const stats = await db.getSupportMemberStats();
        document.getElementById('info-open').textContent = stats.my_open_tickets;
        document.getElementById('info-resolved').textContent = stats.my_resolved;
        document.getElementById('info-escalated').textContent = stats.my_escalated;
    } catch (e) {
        document.getElementById('info-open').textContent = '-';
        document.getElementById('info-resolved').textContent = '-';
        document.getElementById('info-escalated').textContent = '-';
    }

    document.getElementById('btnUpdatePwd').addEventListener('click', async () => {
        const newPwd = document.getElementById('newPwd').value;
        const confPwd = document.getElementById('confPwd').value;
        const errorEl = document.getElementById('pwd-error');
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
        try {
            await db.updateUserPassword(user.emp_id, newPwd);
            showToast('Password updated successfully.');
            document.getElementById('password-form').reset();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to update password.';
            errorEl.style.display = 'block';
        }
    });
});
