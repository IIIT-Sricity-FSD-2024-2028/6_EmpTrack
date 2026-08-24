// /js/views/platform_admin/technical-issues.js
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

    const tbody = document.getElementById('tix-tbody');

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

    const VERIFICATION_LABELS = { PENDING_VERIFICATION: 'Awaiting Your Verification', VERIFIED: 'Verified', REJECTED: 'Sent Back for Rework' };

    function renderVerificationBanner(t) {
        const banner = document.getElementById('d-verification-banner');
        if (!t.verification_status) { banner.style.display = 'none'; return; }
        const tone = t.verification_status === 'VERIFIED' ? 'success' : t.verification_status === 'REJECTED' ? 'danger' : 'warning';
        banner.style.display = 'flex';
        banner.style.cssText = 'display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:8px;' +
            (tone === 'success' ? 'background:rgba(34,197,94,0.1); color:#22C55E;' :
             tone === 'danger' ? 'background:rgba(239,68,68,0.1); color:#EF4444;' :
             'background:rgba(249,115,22,0.1); color:#F97316;');
        banner.innerHTML = `
            <i class="ph ${t.verification_status === 'VERIFIED' ? 'ph-check-circle' : t.verification_status === 'REJECTED' ? 'ph-arrow-counter-clockwise' : 'ph-hourglass-medium'}" style="font-size:20px; flex-shrink:0;"></i>
            <div>
                <strong>${escapeHtml(VERIFICATION_LABELS[t.verification_status] || t.verification_status)}</strong>
                ${t.verification_note ? `<div style="font-size:13px; margin-top:2px; color:var(--text-main);">${escapeHtml(t.verification_note)}</div>` : ''}
            </div>
        `;
    }

    async function loadTeamMembers() {
        try {
            teamMembers = await db.getTechnicalTeam({ status: 'ACTIVE' });
        } catch (e) {
            teamMembers = [];
        }
    }

    async function loadTickets() {
        tbody.innerHTML = `<tr class="loader-row"><td colspan="8"><div class="spinner"></div><div>Loading technical issues...</div></td></tr>`;
        try {
            tickets = await db.getTechnicalIssues({ status: statusFilter, priority: priorityFilter });
            renderTable();
        } catch (e) {
            tbody.innerHTML = `<tr class="error-row"><td colspan="8"><i class="ph ph-warning-circle"></i> Failed to load technical issues.</td></tr>`;
        }
    }

    function renderTable() {
        if (tickets.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="8"><i class="ph ph-bug" style="font-size:28px; display:block; margin-bottom:8px;"></i>No technical issues found.</td></tr>`;
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
        renderVerificationBanner(t);
        document.getElementById('d-verification-section').style.display = t.verification_status === 'PENDING_VERIFICATION' ? 'block' : 'none';
        document.getElementById('d-verify-note').value = '';
        renderComments(t.comments);
        openModal('detailModal');
    }

    async function refreshDetail(id) {
        const updated = await db.getTechnicalIssueById(id);
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
            await db.assignTechnicalIssue(id, assignee);
            showToast('Technical issue assigned successfully.');
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
            await db.reassignTechnicalIssue(id, assignee, reason);
            showToast('Technical issue reassigned successfully.');
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to reassign.', 'error');
        }
    });

    document.getElementById('btn-resolve').addEventListener('click', async () => {
        const id = document.getElementById('d-id').value;
        if (!confirm('Mark this technical issue as resolved?')) return;
        try {
            await db.resolveTechnicalIssue(id, document.getElementById('d-comment').value.trim() || undefined);
            showToast('Technical issue resolved successfully.');
            document.getElementById('d-comment').value = '';
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to resolve.', 'error');
        }
    });

    document.getElementById('btn-escalate').addEventListener('click', async () => {
        const id = document.getElementById('d-id').value;
        if (!confirm('Escalate this technical issue to the Super Admin?')) return;
        try {
            await db.escalateTechnicalIssue(id, document.getElementById('d-comment').value.trim() || undefined);
            showToast('Technical issue escalated to the Super Admin.');
            document.getElementById('d-comment').value = '';
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to escalate.', 'error');
        }
    });

    document.getElementById('btn-verify').addEventListener('click', async () => {
        const id = document.getElementById('d-id').value;
        if (!confirm('Verify this resolution and close the issue?')) return;
        try {
            await db.verifyTechnicalIssue(id, document.getElementById('d-verify-note').value.trim() || undefined);
            showToast('Issue verified and closed.');
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to verify.', 'error');
        }
    });

    document.getElementById('btn-reject-verification').addEventListener('click', async () => {
        const id = document.getElementById('d-id').value;
        const reason = document.getElementById('d-verify-note').value.trim();
        if (!reason) { showToast('Explain what needs rework first.', 'error'); return; }
        if (!confirm('Send this issue back to the Technical Member for rework?')) return;
        try {
            await db.rejectTechnicalIssueVerification(id, reason);
            showToast('Sent back for rework.');
            await refreshDetail(id);
        } catch (e) {
            showToast(e.message || 'Failed to send back.', 'error');
        }
    });

    document.getElementById('btn-add-comment').addEventListener('click', async () => {
        const id = document.getElementById('d-id').value;
        const message = document.getElementById('d-comment').value.trim();
        if (!message) { showToast('Enter a comment first.', 'error'); return; }
        try {
            await db.addTechnicalIssueComment(id, message);
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
});
