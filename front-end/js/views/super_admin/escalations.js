// /js/views/super_admin/escalations.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, showToast, openModal, closeModal, bindModalDismiss, formatDate, formatDateTime } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let escalations = [];
    let statusFilter = 'all';
    let priorityFilter = 'all';

    const tbody = document.getElementById('esc-tbody');

    ['createEscModal', 'detailEscModal'].forEach(bindModalDismiss);

    function statusBadgeClass(status) {
        if (status === 'RESOLVED') return 'badge-active';
        if (status === 'ESCALATED') return 'badge-suspended';
        if (status === 'IN_PROGRESS') return 'badge-pending';
        return 'badge-info';
    }

    function priorityBadgeClass(priority) {
        return `badge-priority-${(priority || 'low').toLowerCase()}`;
    }

    async function loadEscalations() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="9"><div class="spinner"></div><div>Loading escalations...</div></td></tr>`;
        try {
            escalations = await db.getCriticalEscalations({ status: statusFilter, priority: priorityFilter });
            renderTable();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="9"><i class="ph ph-warning-circle"></i> Failed to load escalations.</td></tr>`;
        }
    }

    function renderTable() {
        if (escalations.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="9"><i class="ph ph-siren" style="font-size:28px; display:block; margin-bottom:8px;"></i>No escalations found.</td></tr>`;
            return;
        }
        tbody.innerHTML = escalations.map((e) => `
            <tr>
                <td>${escapeHtml(e.issue_id)}</td>
                <td>${escapeHtml(e.company_name)}</td>
                <td>${escapeHtml(e.raised_by_name)}</td>
                <td>${escapeHtml(e.category)}</td>
                <td><span class="badge ${priorityBadgeClass(e.priority)}">${escapeHtml(e.priority)}</span></td>
                <td>${escapeHtml(e.assigned_team)}</td>
                <td><span class="badge ${statusBadgeClass(e.status)}">${escapeHtml(e.status.replace('_', ' '))}</span></td>
                <td>${formatDate(e.created_date)}</td>
                <td>
                    <div class="row-actions" style="justify-content:flex-end;">
                        <button class="icon-btn" title="View / Manage" data-detail="${e.issue_id}"><i class="ph ph-eye"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        tbody.querySelectorAll('[data-detail]').forEach((btn) => btn.addEventListener('click', () => openDetailModal(btn.getAttribute('data-detail'))));
    }

    function renderComments(comments) {
        const el = document.getElementById('detail-esc-comments');
        if (!comments || comments.length === 0) {
            el.innerHTML = `<div class="empty-state" style="padding:16px;"><i class="ph ph-chat-circle-dots"></i> No comments yet.</div>`;
            return;
        }
        el.innerHTML = comments.map((c) => `
            <div class="comment-item">
                <span class="comment-author">${escapeHtml(c.author)}</span>
                <span class="comment-time">${formatDateTime(c.timestamp)}</span>
                <div class="comment-message">${escapeHtml(c.message)}</div>
            </div>
        `).join('');
    }

    function openDetailModal(id) {
        const esc = escalations.find((x) => x.issue_id === id);
        if (!esc) return;
        document.getElementById('de-id').value = esc.issue_id;
        document.getElementById('detail-esc-title').textContent = `Escalation ${esc.issue_id}`;
        document.getElementById('detail-esc-info').innerHTML = `
            <div class="detail-item"><span class="detail-label">Company</span><span class="detail-value">${escapeHtml(esc.company_name)}</span></div>
            <div class="detail-item"><span class="detail-label">Raised By</span><span class="detail-value">${escapeHtml(esc.raised_by_name)}</span></div>
            <div class="detail-item"><span class="detail-label">Category</span><span class="detail-value">${escapeHtml(esc.category)}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span class="badge ${statusBadgeClass(esc.status)}">${escapeHtml(esc.status.replace('_', ' '))}</span></div>
            <div class="detail-item" style="grid-column:1/-1;"><span class="detail-label">Description</span><span class="detail-value">${escapeHtml(esc.description || 'No description provided.')}</span></div>
            <div class="detail-item"><span class="detail-label">Created</span><span class="detail-value">${formatDate(esc.created_date)}</span></div>
            <div class="detail-item"><span class="detail-label">Last Updated</span><span class="detail-value">${formatDate(esc.updated_date)}</span></div>
        `;
        document.getElementById('de-priority').value = esc.priority;
        document.getElementById('de-team').value = esc.assigned_team && esc.assigned_team !== 'Unassigned' ? esc.assigned_team : 'Unassigned';
        renderComments(esc.comments);
        openModal('detailEscModal');
    }

    async function refreshDetail(id) {
        const updated = await db.getCriticalEscalationById(id);
        const idx = escalations.findIndex((x) => x.issue_id === id);
        if (idx !== -1) escalations[idx] = updated;
        openDetailModal(id);
        renderTable();
    }

    document.getElementById('btn-save-priority').addEventListener('click', async () => {
        const id = document.getElementById('de-id').value;
        try {
            await db.updateCriticalEscalationPriority(id, document.getElementById('de-priority').value);
            showToast('Priority updated successfully.');
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to update priority.', 'error');
        }
    });

    document.getElementById('btn-save-assign').addEventListener('click', async () => {
        const id = document.getElementById('de-id').value;
        try {
            await db.assignCriticalEscalation(id, document.getElementById('de-team').value);
            showToast('Escalation assigned successfully.');
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to assign.', 'error');
        }
    });

    document.getElementById('btn-resolve').addEventListener('click', async () => {
        const id = document.getElementById('de-id').value;
        if (!confirm('Mark this escalation as resolved?')) return;
        try {
            await db.resolveCriticalEscalation(id, document.getElementById('de-comment').value.trim() || undefined);
            showToast('Escalation resolved successfully.');
            document.getElementById('de-comment').value = '';
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to resolve.', 'error');
        }
    });

    document.getElementById('btn-escalate').addEventListener('click', async () => {
        const id = document.getElementById('de-id').value;
        if (!confirm('Escalate this issue further with Critical priority?')) return;
        try {
            await db.escalateCriticalEscalation(id, document.getElementById('de-comment').value.trim() || undefined);
            showToast('Escalation raised to Critical priority.');
            document.getElementById('de-comment').value = '';
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to escalate.', 'error');
        }
    });

    document.getElementById('btn-add-comment').addEventListener('click', async () => {
        const id = document.getElementById('de-id').value;
        const message = document.getElementById('de-comment').value.trim();
        if (!message) { showToast('Enter a comment first.', 'error'); return; }
        try {
            await db.addCriticalEscalationComment(id, message);
            document.getElementById('de-comment').value = '';
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to add comment.', 'error');
        }
    });

    document.getElementById('btn-open-create').addEventListener('click', async () => {
        document.getElementById('create-esc-form').reset();
        document.getElementById('create-esc-error').style.display = 'none';
        const select = document.getElementById('ce-company');
        select.innerHTML = '<option value="">Loading...</option>';
        try {
            const companies = await db.getCompanies();
            select.innerHTML = companies.map((c) => `<option value="${c.company_id}">${escapeHtml(c.company_name)}</option>`).join('');
        } catch (e) {
            select.innerHTML = '<option value="">Failed to load companies</option>';
        }
        openModal('createEscModal');
    });

    document.getElementById('btn-submit-create-esc').addEventListener('click', async () => {
        const data = {
            company_id: document.getElementById('ce-company').value,
            category: document.getElementById('ce-category').value,
            priority: document.getElementById('ce-priority').value,
            assigned_team: document.getElementById('ce-team').value,
            description: document.getElementById('ce-description').value.trim(),
        };
        const errorEl = document.getElementById('create-esc-error');
        if (!data.company_id) {
            errorEl.textContent = 'Please select a company.';
            errorEl.style.display = 'block';
            return;
        }
        try {
            await db.createCriticalEscalation(data);
            showToast('Escalation raised successfully.');
            closeModal('createEscModal');
            await loadEscalations();
        } catch (e) {
            errorEl.textContent = e.message || 'Failed to raise escalation.';
            errorEl.style.display = 'block';
        }
    });

    document.getElementById('status-filter').addEventListener('change', (e) => { statusFilter = e.target.value; loadEscalations(); });
    document.getElementById('priority-filter').addEventListener('change', (e) => { priorityFilter = e.target.value; loadEscalations(); });
    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        statusFilter = 'all';
        priorityFilter = 'all';
        document.getElementById('status-filter').value = 'all';
        document.getElementById('priority-filter').value = 'all';
        loadEscalations();
    });

    await loadEscalations();
});
