// /js/views/super_admin/activity.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, formatDateTime, paginate, renderPagination } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const PAGE_SIZE = 12;
    let logs = [];
    let page = 1;
    let userFilter = '';
    let actionFilter = '';

    const tbody = document.getElementById('activity-tbody');
    const pagerEl = document.getElementById('activity-pagination');

    function statusBadgeClass(status) {
        if (status === 'SUCCESS') return 'badge-active';
        if (status === 'WARNING') return 'badge-pending';
        return 'badge-suspended';
    }

    async function loadFilters() {
        try {
            const admins = await db.getPlatformAdmins();
            const userSelect = document.getElementById('user-filter');
            admins.forEach((a) => {
                const opt = document.createElement('option');
                opt.value = a.emp_id;
                opt.textContent = a.emp_name;
                userSelect.appendChild(opt);
            });
        } catch (e) { /* non-critical */ }
    }

    async function loadActivity() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="5"><div class="spinner"></div><div>Loading activity...</div></td></tr>`;
        try {
            logs = await db.getActivityLogs({ userId: userFilter, action: actionFilter });
            populateActionFilter();
            renderTable();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="5"><i class="ph ph-warning-circle"></i> Failed to load activity.</td></tr>`;
        }
    }

    let actionsPopulated = false;
    function populateActionFilter() {
        if (actionsPopulated) return;
        const select = document.getElementById('action-filter');
        const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();
        uniqueActions.forEach((a) => {
            const opt = document.createElement('option');
            opt.value = a;
            opt.textContent = a;
            select.appendChild(opt);
        });
        actionsPopulated = true;
    }

    function renderTable() {
        if (logs.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="5"><i class="ph ph-list-magnifying-glass" style="font-size:28px; display:block; margin-bottom:8px;"></i>No activity recorded yet.</td></tr>`;
            pagerEl.innerHTML = '';
            return;
        }
        const { pageItems, page: safePage, totalPages, total } = paginate(logs, page, PAGE_SIZE);
        page = safePage;

        tbody.innerHTML = pageItems.map((l) => `
            <tr>
                <td>
                    <div class="cell-primary">
                        <span class="cell-name">${escapeHtml(l.user_name)}</span>
                        <span class="cell-sub">${escapeHtml(l.role)}</span>
                    </div>
                </td>
                <td>
                    <div class="cell-primary">
                        <span>${escapeHtml(l.action)}</span>
                        <span class="cell-sub details">${escapeHtml(l.details || '')}</span>
                    </div>
                </td>
                <td>${escapeHtml(l.company_name || '-')}</td>
                <td>${formatDateTime(l.timestamp)}</td>
                <td><span class="badge ${statusBadgeClass(l.status)}">${escapeHtml(l.status)}</span></td>
            </tr>
        `).join('');

        renderPagination(pagerEl, { page, totalPages, total, pageSize: PAGE_SIZE }, (p) => { page = p; renderTable(); });
    }

    document.getElementById('user-filter').addEventListener('change', (e) => { userFilter = e.target.value; page = 1; loadActivity(); });
    document.getElementById('action-filter').addEventListener('change', (e) => { actionFilter = e.target.value; page = 1; renderTable(); });
    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        userFilter = '';
        actionFilter = '';
        document.getElementById('user-filter').value = '';
        document.getElementById('action-filter').value = '';
        page = 1;
        loadActivity();
    });

    await loadFilters();
    await loadActivity();
});
