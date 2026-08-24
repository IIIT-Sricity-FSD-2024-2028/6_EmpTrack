// /js/views/employee/notifications.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, formatDateTime } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const listContainer = document.getElementById('emp-notif-list');
    const dismissed = new Set();
    let notifications = [];
    let activeFilter = 'all';

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
        const visible = notifications.filter(n => !dismissed.has(n.id) && (activeFilter !== 'unread' || !n.read));

        if (visible.length === 0) {
            listContainer.innerHTML = `<div class="empty-state" style="padding:48px; text-align:center; color:var(--text-muted);"><i class="ph ph-bell" style="font-size:28px; display:block; margin-bottom:8px;"></i>No notifications yet.</div>`;
            attachActionListeners();
            updateUnreadCount();
            return;
        }

        listContainer.innerHTML = visible.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
                <div class="ni-icon" style="background: color-mix(in srgb, ${typeColor(n.type)} 15%, transparent); color: ${typeColor(n.type)}; border: 1px solid color-mix(in srgb, ${typeColor(n.type)} 30%, transparent);">
                    <i class="ph-fill ${typeIcon(n.type)}"></i>
                </div>
                <div class="ni-content">
                    <div class="ni-header">
                        <h4 class="ni-title search-target">${escapeHtml(n.message)}</h4>
                        <span class="ni-time">${formatDateTime(n.timestamp)}</span>
                    </div>
                    ${n.link ? `<a href="${n.link}" class="ni-desc" style="color:var(--primary-color); font-weight:600;">View details &rarr;</a>` : ''}
                </div>
                <div class="ni-actions">
                    <button class="ni-action-btn btn-done" data-id="${n.id}" title="Mark as Read"><i class="ph ph-check"></i></button>
                    <button class="ni-action-btn btn-del" data-id="${n.id}" title="Dismiss"><i class="ph ph-x"></i></button>
                </div>
            </div>
        `).join('');

        attachActionListeners();
        updateUnreadCount();
    }

    async function load() {
        try {
            notifications = (await db.getNotificationsForUser(user.emp_id)).map(n => ({ ...n, read: false }));
        } catch (e) {
            notifications = [];
        }
        render();
    }

    const filterBtns = document.querySelectorAll('.tab-btn');
    filterBtns.forEach(btn => {
        // Real notifications carry no "task"/"leave" category, only info/warning/error -
        // drop filters that only ever matched the old hardcoded demo data.
        if (!['all', 'unread'].includes(btn.dataset.filter)) {
            btn.style.display = 'none';
            return;
        }
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            render();
        });
    });

    function updateUnreadCount() {
        const c = notifications.filter(n => !dismissed.has(n.id) && !n.read).length;
        const unreadMetric = document.getElementById('met-unread');
        if (unreadMetric) unreadMetric.innerText = c;
    }

    function attachActionListeners() {
        listContainer.querySelectorAll('.btn-done').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const n = notifications.find(x => String(x.id) === e.currentTarget.dataset.id);
                if (n) n.read = true;
                render();
            });
        });
        listContainer.querySelectorAll('.btn-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                dismissed.add(e.currentTarget.dataset.id);
                render();
            });
        });
    }

    const markAllBtn = document.getElementById('btn-mark-all');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', () => {
            notifications.forEach(n => n.read = true);
            render();
            const toast = document.getElementById('prof-toast');
            if (toast) {
                toast.innerHTML = '<i class="ph-fill ph-check-circle"></i> All notifications marked as read!';
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            }
        });
    }

    load();
});
