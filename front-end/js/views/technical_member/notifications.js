// /js/views/technical_member/notifications.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, formatDateTime } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const listEl = document.getElementById('notif-list');

    function typeIcon(type) {
        if (type === 'error') return 'ph-warning-circle';
        if (type === 'warning') return 'ph-warning';
        return 'ph-info';
    }

    try {
        const notifications = await db.getNotificationsForUser(user.emp_id);
        if (!notifications || notifications.length === 0) {
            listEl.innerHTML = `<div class="empty-state" style="padding:48px;"><i class="ph ph-bell"></i> No notifications yet.</div>`;
            return;
        }
        listEl.innerHTML = notifications.map((n) => `
            <div class="comment-item" style="margin:8px 16px;">
                <span class="comment-author"><i class="ph ${typeIcon(n.type)}"></i> ${escapeHtml(n.message)}</span>
                <span class="comment-time">${formatDateTime(n.timestamp)}</span>
            </div>
        `).join('');
    } catch (e) {
        listEl.innerHTML = `<div class="error-state" style="padding:48px;"><i class="ph ph-warning-circle"></i> Failed to load notifications.</div>`;
    }
});
