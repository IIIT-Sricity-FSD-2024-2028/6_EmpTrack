// /js/views/super_admin/platform-admins.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import {
    escapeHtml, showToast, openModal, closeModal, bindModalDismiss,
    debounce, formatDate, formatDateTime, paginate, renderPagination,
} from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const PAGE_SIZE = 8;
    let admins = [];
    let page = 1;
    let searchTerm = '';
    let statusFilter = 'all';

    const tbody = document.getElementById('pa-tbody');
    const pagerEl = document.getElementById('pa-pagination');

    ['createPaModal', 'editPaModal', 'companiesModal', 'activityModal', 'statusConfirmModal'].forEach(bindModalDismiss);

    function statusBadgeClass(status) {
        if (status === 'ACTIVE') return 'badge-active';
        if (status === 'PENDING') return 'badge-pending';
        return 'badge-inactive';
    }

    async function loadAdmins() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="6"><div class="spinner"></div><div>Loading platform admins...</div></td></tr>`;
        try {
            admins = await db.getPlatformAdmins({ status: statusFilter, search: searchTerm });
            renderTable();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="6"><i class="ph ph-warning-circle"></i> Failed to load platform admins.</td></tr>`;
        }
    }

    function renderTable() {
        if (admins.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><i class="ph ph-shield-star" style="font-size:28px; display:block; margin-bottom:8px;"></i>No platform admins found.</td></tr>`;
            pagerEl.innerHTML = '';
            return;
        }

        const { pageItems, page: safePage, totalPages, total } = paginate(admins, page, PAGE_SIZE);
        page = safePage;

        tbody.innerHTML = pageItems.map((a) => `
            <tr>
                <td>
                    <div class="cell-primary">
                        <span class="cell-name">${escapeHtml(a.emp_name)}</span>
                        <span class="cell-sub">${a.emp_id}</span>
                    </div>
                </td>
                <td>
                    <div class="cell-primary">
                        <span>${escapeHtml(a.email)}</span>
                        <span class="cell-sub">${escapeHtml(a.phone)}</span>
                    </div>
                </td>
                <td><span class="badge ${statusBadgeClass(a.status)}">${escapeHtml(a.status)}</span></td>
                <td><button class="pa-companies-chip" data-companies="${a.emp_id}"><i class="ph ph-buildings"></i> ${a.assigned_company_count}</button></td>
                <td>${formatDate(a.date_of_joining)}</td>
                <td>
                    <div class="row-actions" style="justify-content:flex-end;">
                        <button class="icon-btn" title="View Activity" data-activity="${a.emp_id}"><i class="ph ph-list-magnifying-glass"></i></button>
                        <button class="icon-btn" title="Edit" data-edit="${a.emp_id}"><i class="ph ph-pencil-simple"></i></button>
                        ${a.status === 'ACTIVE'
                            ? `<button class="icon-btn danger" title="Deactivate" data-status="${a.emp_id}|INACTIVE|${escapeHtml(a.emp_name)}"><i class="ph ph-pause-circle"></i></button>`
                            : a.status === 'INACTIVE'
                            ? `<button class="icon-btn" title="Activate" data-status="${a.emp_id}|ACTIVE|${escapeHtml(a.emp_name)}"><i class="ph ph-check-circle"></i></button>`
                            : ''
                        }
                    </div>
                </td>
            </tr>
        `).join('');

        renderPagination(pagerEl, { page, totalPages, total, pageSize: PAGE_SIZE }, (p) => { page = p; renderTable(); });
        bindRowActions();
    }

    function bindRowActions() {
        tbody.querySelectorAll('[data-companies]').forEach((btn) => btn.addEventListener('click', () => openCompaniesModal(btn.getAttribute('data-companies'))));
        tbody.querySelectorAll('[data-activity]').forEach((btn) => btn.addEventListener('click', () => openActivityModal(btn.getAttribute('data-activity'))));
        tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-edit'))));
        tbody.querySelectorAll('[data-status]').forEach((btn) => btn.addEventListener('click', () => {
            const [id, newStatus, name] = btn.getAttribute('data-status').split('|');
            openStatusConfirm(id, name, newStatus);
        }));
    }

    function openCompaniesModal(id) {
        const admin = admins.find((a) => a.emp_id === id);
        const body = document.getElementById('companies-modal-body');
        if (!admin || admin.assigned_companies.length === 0) {
            body.innerHTML = `<div class="empty-state"><i class="ph ph-buildings"></i> No companies assigned yet.</div>`;
        } else {
            body.innerHTML = admin.assigned_companies.map((c) => `
                <div class="company-list-item">
                    <span>${escapeHtml(c.company_name)}</span>
                    <span class="badge ${c.status === 'ACTIVE' ? 'badge-active' : c.status === 'SUSPENDED' ? 'badge-suspended' : 'badge-inactive'}">${escapeHtml(c.status)}</span>
                </div>
            `).join('');
        }
        openModal('companiesModal');
    }

    async function openActivityModal(id) {
        const body = document.getElementById('activity-modal-body');
        body.innerHTML = `<div class="spinner"></div>`;
        openModal('activityModal');
        try {
            const logs = await db.getPlatformAdminActivity(id);
            if (logs.length === 0) {
                body.innerHTML = `<div class="empty-state"><i class="ph ph-list-magnifying-glass"></i> No recorded activity yet.</div>`;
                return;
            }
            body.innerHTML = logs.map((l) => `
                <div class="comment-item">
                    <span class="comment-author">${escapeHtml(l.action)}</span>
                    <span class="comment-time">${formatDateTime(l.timestamp)}</span>
                    <div class="comment-message">${escapeHtml(l.details || '')}${l.company_name ? ` &middot; ${escapeHtml(l.company_name)}` : ''}</div>
                </div>
            `).join('');
        } catch (e) {
            body.innerHTML = `<div class="error-state"><i class="ph ph-warning-circle"></i> Failed to load activity.</div>`;
        }
    }

    function openEditModal(id) {
        const a = admins.find((x) => x.emp_id === id);
        if (!a) return;
        document.getElementById('ep-id').value = a.emp_id;
        document.getElementById('ep-name').value = a.emp_name;
        document.getElementById('ep-email').value = a.email;
        document.getElementById('ep-phone').value = a.phone;
        document.getElementById('edit-pa-error').style.display = 'none';
        openModal('editPaModal');
    }

    let pendingStatusChange = null;
    function openStatusConfirm(id, name, newStatus) {
        pendingStatusChange = { id, newStatus };
        const verb = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
        document.getElementById('status-confirm-title').textContent = `${verb.charAt(0).toUpperCase() + verb.slice(1)} Platform Admin`;
        document.getElementById('status-confirm-text').textContent = `Are you sure you want to ${verb} "${name}"?`;
        openModal('statusConfirmModal');
    }

    document.getElementById('btn-confirm-status').addEventListener('click', async () => {
        if (!pendingStatusChange) return;
        try {
            await db.updatePlatformAdminStatus(pendingStatusChange.id, pendingStatusChange.newStatus);
            showToast('Platform Admin status updated successfully.');
            closeModal('statusConfirmModal');
            await loadAdmins();
        } catch (e) {
            showToast(e.message || 'Failed to update status.', 'error');
        }
    });

    document.getElementById('btn-submit-edit-pa').addEventListener('click', async () => {
        const id = document.getElementById('ep-id').value;
        const data = {
            name: document.getElementById('ep-name').value.trim(),
            email: document.getElementById('ep-email').value.trim(),
            phone: document.getElementById('ep-phone').value.trim(),
        };
        const errorEl = document.getElementById('edit-pa-error');
        if (!data.name || !data.email) {
            errorEl.textContent = 'Name and email are required.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            await db.updatePlatformAdmin(id, data);
            showToast('Platform Admin updated successfully.');
            closeModal('editPaModal');
            await loadAdmins();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to update.';
            errorEl.style.display = 'block';
        }
    });

    document.getElementById('btn-open-create').addEventListener('click', () => {
        document.getElementById('create-pa-form').reset();
        document.getElementById('create-pa-error').style.display = 'none';
        openModal('createPaModal');
    });

    const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    document.getElementById('btn-submit-create-pa').addEventListener('click', async () => {
        const data = {
            name: document.getElementById('cp-name').value.trim(),
            email: document.getElementById('cp-email').value.trim(),
            phone: document.getElementById('cp-phone').value.trim(),
            password: document.getElementById('cp-password').value,
            confirmPassword: document.getElementById('cp-confirm-password').value,
            status: document.getElementById('cp-status').value,
        };
        const errorEl = document.getElementById('create-pa-error');
        if (!data.name || !data.email || !data.phone || !data.password || !data.confirmPassword) {
            errorEl.textContent = 'All fields are required.';
            errorEl.style.display = 'block';
            return;
        }
        if (!EMAIL_RE.test(data.email)) {
            errorEl.textContent = 'Enter a valid email address.';
            errorEl.style.display = 'block';
            return;
        }
        if (!STRONG_PASSWORD.test(data.password)) {
            errorEl.textContent = 'Password must be 8+ characters with uppercase, lowercase, a number, and a special character.';
            errorEl.style.display = 'block';
            return;
        }
        if (data.password !== data.confirmPassword) {
            errorEl.textContent = 'Password and confirmation do not match.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            await db.createPlatformAdmin(data);
            showToast('Platform Admin created successfully. They can log in immediately.');
            closeModal('createPaModal');
            await loadAdmins();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to create Platform Admin.';
            errorEl.style.display = 'block';
        }
    });

    document.getElementById('search-input').addEventListener('input', debounce((e) => {
        searchTerm = e.target.value.trim();
        page = 1;
        loadAdmins();
    }, 350));

    document.getElementById('status-filter').addEventListener('change', (e) => {
        statusFilter = e.target.value;
        page = 1;
        loadAdmins();
    });

    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        searchTerm = '';
        statusFilter = 'all';
        document.getElementById('search-input').value = '';
        document.getElementById('status-filter').value = 'all';
        page = 1;
        loadAdmins();
    });

    await loadAdmins();
});
