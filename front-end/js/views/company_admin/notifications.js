// /js/views/company_admin/notifications.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, formatDateTime } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const listContainer = document.getElementById('ca-notif-list');
    let notifications = [];

    function typeIcon(type) {
        if (type === 'error') return 'ph-warning-circle';
        if (type === 'warning') return 'ph-warning';
        return 'ph-info';
    }
    function typeColor(type) {
        if (type === 'error') return 'var(--danger-color)';
        if (type === 'warning') return 'var(--warning-color)';
        return 'var(--primary-color)';
    }

    function render() {
        if (!listContainer) return;
        if (notifications.length === 0) {
            listContainer.innerHTML = `<div class="empty-state" style="padding:48px; text-align:center; color:var(--text-muted);"><i class="ph ph-bell" style="font-size:28px; display:block; margin-bottom:8px;"></i>No notifications yet.</div>`;
            return;
        }
        listContainer.innerHTML = notifications.map(n => `
            <div class="notification-card ${n.read ? '' : 'unread'}" data-id="${n.id}" style="border-left-color: ${typeColor(n.type)};">
                <i class="ph-fill ${typeIcon(n.type)} notification-icon" style="color: ${typeColor(n.type)};"></i>
                <div class="notification-content">
                    <div class="notification-title">${escapeHtml(n.message)}</div>
                    <div class="notification-time">${formatDateTime(n.timestamp)}</div>
                    ${n.link ? `<a href="${n.link}" style="font-size:13px; font-weight:600; color:var(--primary-color);">View details &rarr;</a>` : ''}
                </div>
            </div>
        `).join('');
    }

    async function load() {
        try {
            notifications = (await db.getNotificationsForUser(user.emp_id)).map(n => ({ ...n, read: false }));
        } catch (e) {
            notifications = [];
        }
        render();
    }

    const markAllBtn = document.getElementById('btn-mark-all');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', () => {
            notifications.forEach(n => n.read = true);
            render();
        });
    }

    load();
});
