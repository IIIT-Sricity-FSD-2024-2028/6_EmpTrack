// /js/views/platform_admin/support-tickets.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, showToast, openModal, closeModal, bindModalDismiss, formatDate, formatDateTime } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let tickets = [];
    let teamMembers = [];
    let statusFilter = 'all';
    let priorityFilter = 'all';

    const tbody = document.getElementById('sup-tbody');

    bindModalDismiss('detailModal');

    function statusBadgeClass(status) {
        if (status === 'RESOLVED') return 'badge-active';
        if (status === 'ESCALATED') return 'badge-suspended';
        if (status === 'IN_PROGRESS') return 'badge-pending';
        return 'badge-info';
    }

    function priorityBadgeClass(priority) {
        return `badge-priority-${(priority || 'low').toLowerCase()}`;
    }

    async function loadTeamMembers() {
        try {
            teamMembers = await db.getSupportTeam({ status: 'ACTIVE' });
        } catch (e) {
            teamMembers = [];
        }
    }

    async function loadTickets() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="8"><div class="spinner"></div><div>Loading support tickets...</div></td></tr>`;
        try {
            tickets = await db.getSupportTickets({ status: statusFilter, priority: priorityFilter });
            renderTable();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="8"><i class="ph ph-warning-circle"></i> Failed to load support tickets.</td></tr>`;
        }
    }

    function renderTable() {
        if (tickets.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="8"><i class="ph ph-bug" style="font-size:28px; display:block; margin-bottom:8px;"></i>No support tickets found.</td></tr>`;
            return;
        }
        tbody.innerHTML = tickets.map((t) => `
            <tr>
                <td>${escapeHtml(t.ticket_id)}</td>
                <td>${escapeHtml(t.company_name)}</td>
                <td>${escapeHtml(t.title)}</td>
                <td><span class="badge ${priorityBadgeClass(t.priority)}">${escapeHtml(t.priority)}</span></td>
                <td>${escapeHtml(t.assigned_to_name || 'Unassigned')}</td>
                <td><span class="badge ${statusBadgeClass(t.status)}">${escapeHtml(t.status.replace('_', ' '))}</span></td>
                <td>${formatDate(t.created_date)}</td>
                <td>
                    <div class="row-actions" style="justify-content:flex-end;">
                        <button class="icon-btn" title="View / Manage" data-detail="${t.ticket_id}"><i class="ph ph-eye"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        tbody.querySelectorAll('[data-detail]').forEach((btn) => btn.addEventListener('click', () => openDetailModal(btn.getAttribute('data-detail'))));
    }

    function renderComments(comments) {
        const el = document.getElementById('detail-comments');
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

    function renderAssigneeOptions(selectedId) {
        const select = document.getElementById('d-assignee');
        select.innerHTML = teamMembers
            .map((m) => `<option value="${m.emp_id}" ${m.emp_id === selectedId ? 'selected' : ''}>${escapeHtml(m.emp_name)} (Open: ${m.open_tickets}, In Progress: ${m.in_progress_tickets})</option>`)
            .join('');
    }

    function openDetailModal(id) {
        const t = tickets.find((x) => x.ticket_id === id);
        if (!t) return;
        document.getElementById('d-id').value = t.ticket_id;
        document.getElementById('detail-title').textContent = `${t.ticket_id} - ${t.title}`;
        document.getElementById('detail-info').innerHTML = `
            <div class="detail-item"><span class="detail-label">Company</span><span class="detail-value">${escapeHtml(t.company_name)}</span></div>
            <div class="detail-item"><span class="detail-label">Raised By</span><span class="detail-value">${escapeHtml(t.raised_by_name)}</span></div>
            <div class="detail-item"><span class="detail-label">Category</span><span class="detail-value">${escapeHtml(t.category)}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span class="badge ${statusBadgeClass(t.status)}">${escapeHtml(t.status.replace('_', ' '))}</span></div>
            <div class="detail-item" style="grid-column:1/-1;"><span class="detail-label">Description</span><span class="detail-value">${escapeHtml(t.description || 'No description provided.')}</span></div>
            <div class="detail-item"><span class="detail-label">Created</span><span class="detail-value">${formatDate(t.created_date)}</span></div>
            <div class="detail-item"><span class="detail-label">Last Updated</span><span class="detail-value">${formatDate(t.updated_date)}</span></div>
        `;
        renderAssigneeOptions(t.assigned_to);
        document.getElementById('d-reason-group').style.display = 'none';
        document.getElementById('d-reason').value = '';
        renderComments(t.comments);
        openModal('detailModal');
    }

    async function refreshDetail(id) {
        const updated = await db.getSupportTicketById(id);
        const idx = tickets.findIndex((x) => x.ticket_id === id);
        if (idx !== -1) tickets[idx] = updated;
        await loadTeamMembers();
        openDetailModal(id);
        renderTable();
    }

    document.getElementById('btn-assign').addEventListener('click', async () => {
        const id = document.getElementById('d-id').value;
        const assignee = document.getElementById('d-assignee').value;
        if (!assignee) { showToast('Select a team member first.', 'error'); return; }
        try {
            await db.assignSupportTicket(id, assignee);
            showToast('Support ticket assigned successfully.');
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to assign.', 'error');
        }
    });

    document.getElementById('btn-reassign').addEventListener('click', async () => {
        const reasonGroup = document.getElementById('d-reason-group');
        if (reasonGroup.style.display === 'none') {
            reasonGroup.style.display = 'block';
            return;
        }
        const id = document.getElementById('d-id').value;
        const assignee = document.getElementById('d-assignee').value;
        const reason = document.getElementById('d-reason').value.trim();
        if (!assignee || !reason) { showToast('Select a member and enter a reassignment reason.', 'error'); return; }
        try {
            await db.reassignSupportTicket(id, assignee, reason);
            showToast('Support ticket reassigned successfully.');
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to reassign.', 'error');
        }
    });

    document.getElementById('btn-resolve').addEventListener('click', async () => {
        const id = document.getElementById('d-id').value;
        if (!confirm('Mark this support ticket as resolved?')) return;
        try {
            await db.resolveSupportTicket(id, document.getElementById('d-comment').value.trim() || undefined);
            showToast('Support ticket resolved successfully.');
            document.getElementById('d-comment').value = '';
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to resolve.', 'error');
        }
    });

    document.getElementById('btn-escalate').addEventListener('click', async () => {
        const id = document.getElementById('d-id').value;
        if (!confirm('Escalate this support ticket to the Super Admin?')) return;
        try {
            await db.escalateSupportTicket(id, document.getElementById('d-comment').value.trim() || undefined);
            showToast('Support ticket escalated to the Super Admin.');
            document.getElementById('d-comment').value = '';
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to escalate.', 'error');
        }
    });

    document.getElementById('btn-add-comment').addEventListener('click', async () => {
        const id = document.getElementById('d-id').value;
        const message = document.getElementById('d-comment').value.trim();
        if (!message) { showToast('Enter a comment first.', 'error'); return; }
        try {
            await db.addSupportTicketComment(id, message);
            document.getElementById('d-comment').value = '';
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to add comment.', 'error');
        }
    });

    document.getElementById('status-filter').addEventListener('change', (e) => { statusFilter = e.target.value; loadTickets(); });
    document.getElementById('priority-filter').addEventListener('change', (e) => { priorityFilter = e.target.value; loadTickets(); });
    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        statusFilter = 'all';
        priorityFilter = 'all';
        document.getElementById('status-filter').value = 'all';
        document.getElementById('priority-filter').value = 'all';
        loadTickets();
    });

    await loadTeamMembers();
    await loadTickets();

    // Deep link from a notification's "View Issue" link (?open=TIX-...).
    const openId = new URLSearchParams(location.search).get('open');
    if (openId && tickets.some((t) => t.ticket_id === openId)) openDetailModal(openId);
});
