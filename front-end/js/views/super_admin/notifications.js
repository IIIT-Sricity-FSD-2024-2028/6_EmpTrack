// /js/views/super_admin/notifications.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, formatDateTime } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const list = document.getElementById('notif-list');
    try {
        const notifications = await db.getNotificationsForUser(user.emp_id);
        if (!notifications || notifications.length === 0) {
            list.innerHTML = `<div class="card empty-state"><i class="ph ph-bell"></i> No notifications yet.</div>`;
            return;
        }
        list.innerHTML = notifications.map((n) => `
            <div class="card notif-card ${n.is_read ? '' : 'unread'}">
                <i class="ph-fill ph-bell notif-icon"></i>
                <div>
                    <div class="notif-title">${escapeHtml(n.message)}</div>
                    <div class="notif-time">${formatDateTime(n.timestamp)}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = `<div class="card error-state"><i class="ph ph-warning-circle"></i> Failed to load notifications.</div>`;
    }
});
