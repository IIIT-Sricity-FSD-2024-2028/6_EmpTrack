// /js/views/super_admin/settings.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, showToast } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let settings = null;

    function populateForm() {
        document.getElementById('st-name').value = settings.platform_name || '';
        document.getElementById('st-support-email').value = settings.support_email || '';
        document.getElementById('st-currency').value = settings.default_currency || '';
        document.getElementById('st-timezone').value = settings.timezone || '';
        document.getElementById('st-maintenance').checked = !!settings.maintenance_mode;

        const sec = settings.security_settings || {};
        document.getElementById('st-pwd-len').value = sec.passwordMinLength || 8;
        document.getElementById('st-session').value = sec.sessionTimeoutMinutes || 60;
        document.getElementById('st-invite-expiry').value = sec.invitationExpiryHours || 72;
        document.getElementById('st-2fa').checked = !!sec.twoFactorRequired;

        const notif = settings.notification_settings || {};
        document.getElementById('st-notif-email').checked = !!notif.emailNotifications;
        document.getElementById('st-notif-escalation').checked = !!notif.criticalEscalationAlerts;
        document.getElementById('st-notif-digest').checked = !!notif.weeklyDigest;
        document.getElementById('st-notif-company').checked = !!notif.newCompanyAlerts;

        const permsList = document.getElementById('role-permissions-list');
        const perms = settings.role_permissions || {};
        permsList.innerHTML = Object.entries(perms).map(([role, capabilities]) => `
            <div class="role-perm-block">
                <div class="role-perm-title">${escapeHtml(role.replace('_', ' '))}</div>
                ${(capabilities || []).map((cap) => `<div class="role-perm-item"><i class="ph-fill ph-check-circle"></i> ${escapeHtml(cap)}</div>`).join('')}
            </div>
        `).join('');
    }

    async function loadSettings() {
        try {
            settings = await db.getPlatformSettings();
            populateForm();
        } catch (e) {
            showToast('Failed to load platform settings.', 'error');
        }
    }

    document.getElementById('btn-save-platform').addEventListener('click', async () => {
        try {
            settings = await db.updatePlatformSettings({
                platform_name: document.getElementById('st-name').value.trim(),
                support_email: document.getElementById('st-support-email').value.trim(),
                default_currency: document.getElementById('st-currency').value.trim().toUpperCase(),
                timezone: document.getElementById('st-timezone').value.trim(),
                maintenance_mode: document.getElementById('st-maintenance').checked,
            });
            showToast('Platform configuration saved.');
        } catch (e) {
            showToast(e.message || 'Failed to save.', 'error');
        }
    });

    document.getElementById('btn-save-security').addEventListener('click', async () => {
        try {
            settings = await db.updatePlatformSettings({
                security_settings: {
                    passwordMinLength: Number(document.getElementById('st-pwd-len').value) || 8,
                    sessionTimeoutMinutes: Number(document.getElementById('st-session').value) || 60,
                    invitationExpiryHours: Number(document.getElementById('st-invite-expiry').value) || 72,
                    twoFactorRequired: document.getElementById('st-2fa').checked,
                },
            });
            showToast('Security settings saved.');
        } catch (e) {
            showToast(e.message || 'Failed to save.', 'error');
        }
    });

    document.getElementById('btn-save-notifications').addEventListener('click', async () => {
        try {
            settings = await db.updatePlatformSettings({
                notification_settings: {
                    emailNotifications: document.getElementById('st-notif-email').checked,
                    criticalEscalationAlerts: document.getElementById('st-notif-escalation').checked,
                    weeklyDigest: document.getElementById('st-notif-digest').checked,
                    newCompanyAlerts: document.getElementById('st-notif-company').checked,
                },
            });
            showToast('Notification settings saved.');
        } catch (e) {
            showToast(e.message || 'Failed to save.', 'error');
        }
    });

    await loadSettings();
});
