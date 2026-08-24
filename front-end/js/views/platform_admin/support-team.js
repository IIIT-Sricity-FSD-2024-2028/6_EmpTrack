// /js/views/platform_admin/support-team.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import {
    escapeHtml, showToast, openModal, closeModal, bindModalDismiss,
    debounce, paginate, renderPagination,
} from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    const PAGE_SIZE = 8;
    let members = [];
    let page = 1;
    let searchTerm = '';
    let statusFilter = 'all';

    const tbody = document.getElementById('team-tbody');
    const pagerEl = document.getElementById('team-pagination');

    ['createMemberModal', 'editMemberModal', 'statusConfirmModal'].forEach(bindModalDismiss);

    function statusBadgeClass(status) {
        return status === 'ACTIVE' ? 'badge-active' : 'badge-inactive';
    }

    async function loadMembers() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="8"><div class="spinner"></div><div>Loading Support Team...</div></td></tr>`;
        try {
            members = await db.getSupportTeam({ status: statusFilter, search: searchTerm });
            renderTable();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="8"><i class="ph ph-warning-circle"></i> Failed to load the Support Team.</td></tr>`;
        }
    }

    function renderTable() {
        if (members.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="8"><i class="ph ph-hard-drives" style="font-size:28px; display:block; margin-bottom:8px;"></i>No Support Team members found.</td></tr>`;
            pagerEl.innerHTML = '';
            return;
        }

        const { pageItems, page: safePage, totalPages, total } = paginate(members, page, PAGE_SIZE);
        page = safePage;

        tbody.innerHTML = pageItems.map((m) => `
            <tr>
                <td>
                    <div class="cell-primary">
                        <span class="cell-name">${escapeHtml(m.emp_name)}</span>
                        <span class="cell-sub">${m.emp_id}</span>
                    </div>
                </td>
                <td>
                    <div class="cell-primary">
                        <span>${escapeHtml(m.email)}</span>
                        <span class="cell-sub">${escapeHtml(m.phone)}</span>
                    </div>
                </td>
                <td>${escapeHtml(m.specialization || '-')}</td>
                <td><span class="badge ${statusBadgeClass(m.status)}">${escapeHtml(m.status)}</span></td>
                <td>${m.open_tickets}</td>
                <td>${m.in_progress_tickets}</td>
                <td>${m.total_assigned}</td>
                <td>
                    <div class="row-actions" style="justify-content:flex-end;">
                        <button class="icon-btn" title="Edit" data-edit="${m.emp_id}"><i class="ph ph-pencil-simple"></i></button>
                        ${m.status === 'ACTIVE'
                            ? `<button class="icon-btn danger" title="Deactivate" data-status="${m.emp_id}|INACTIVE|${escapeHtml(m.emp_name)}"><i class="ph ph-pause-circle"></i></button>`
                            : `<button class="icon-btn" title="Activate" data-status="${m.emp_id}|ACTIVE|${escapeHtml(m.emp_name)}"><i class="ph ph-check-circle"></i></button>`
                        }
                    </div>
                </td>
            </tr>
        `).join('');

        renderPagination(pagerEl, { page, totalPages, total, pageSize: PAGE_SIZE }, (p) => { page = p; renderTable(); });
        bindRowActions();
    }

    function bindRowActions() {
        tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-edit'))));
        tbody.querySelectorAll('[data-status]').forEach((btn) => btn.addEventListener('click', () => {
            const [id, newStatus, name] = btn.getAttribute('data-status').split('|');
            openStatusConfirm(id, name, newStatus);
        }));
    }

    function openEditModal(id) {
        const m = members.find((x) => x.emp_id === id);
        if (!m) return;
        document.getElementById('em-id').value = m.emp_id;
        document.getElementById('em-name').value = m.emp_name;
        document.getElementById('em-email').value = m.email;
        document.getElementById('em-phone').value = m.phone;
        document.getElementById('em-specialization').value = m.specialization || '';
        document.getElementById('edit-member-error').style.display = 'none';
        openModal('editMemberModal');
    }

    let pendingStatusChange = null;
    function openStatusConfirm(id, name, newStatus) {
        pendingStatusChange = { id, newStatus };
        const verb = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
        document.getElementById('status-confirm-title').textContent = `${verb.charAt(0).toUpperCase() + verb.slice(1)} Team Member`;
        document.getElementById('status-confirm-text').textContent = `Are you sure you want to ${verb} "${name}"?`;
        openModal('statusConfirmModal');
    }

    document.getElementById('btn-confirm-status').addEventListener('click', async () => {
        if (!pendingStatusChange) return;
        try {
            await db.updateSupportTeamMemberStatus(pendingStatusChange.id, pendingStatusChange.newStatus);
            showToast('Team member status updated successfully.');
            closeModal('statusConfirmModal');
            await loadMembers();
        } catch (e) {
            showToast(e.message || 'Failed to update status.', 'error');
        }
    });

    document.getElementById('btn-submit-edit-member').addEventListener('click', async () => {
        const id = document.getElementById('em-id').value;
        const data = {
            name: document.getElementById('em-name').value.trim(),
            email: document.getElementById('em-email').value.trim(),
            phone: document.getElementById('em-phone').value.trim(),
            specialization: document.getElementById('em-specialization').value.trim(),
        };
        const errorEl = document.getElementById('edit-member-error');
        if (!data.name || !data.email) {
            errorEl.textContent = 'Name and email are required.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            await db.updateSupportTeamMember(id, data);
            showToast('Team member updated successfully.');
            closeModal('editMemberModal');
            await loadMembers();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to update.';
            errorEl.style.display = 'block';
        }
    });

    document.getElementById('btn-open-create').addEventListener('click', () => {
        document.getElementById('create-member-form').reset();
        document.getElementById('create-member-error').style.display = 'none';
        openModal('createMemberModal');
    });

    document.getElementById('btn-submit-create-member').addEventListener('click', async () => {
        const data = {
            name: document.getElementById('cm-name').value.trim(),
            email: document.getElementById('cm-email').value.trim(),
            phone: document.getElementById('cm-phone').value.trim(),
            specialization: document.getElementById('cm-specialization').value.trim(),
        };
        const errorEl = document.getElementById('create-member-error');
        if (!data.name || !data.email || !data.phone) {
            errorEl.textContent = 'Name, email and phone are required.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            await db.createSupportTeamMember(data);
            showToast('Support Team member added successfully.');
            closeModal('createMemberModal');
            await loadMembers();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to add team member.';
            errorEl.style.display = 'block';
        }
    });

    document.getElementById('search-input').addEventListener('input', debounce((e) => {
        searchTerm = e.target.value.trim();
        page = 1;
        loadMembers();
    }, 350));

    document.getElementById('status-filter').addEventListener('change', (e) => {
        statusFilter = e.target.value;
        page = 1;
        loadMembers();
    });

    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        searchTerm = '';
        statusFilter = 'all';
        document.getElementById('search-input').value = '';
        document.getElementById('status-filter').value = 'all';
        page = 1;
        loadMembers();
    });

    await loadMembers();
});
