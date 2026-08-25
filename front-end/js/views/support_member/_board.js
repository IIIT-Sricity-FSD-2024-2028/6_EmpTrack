// /js/views/support_member/_board.js
// Shared ticket table + detail-modal logic for the Support Member dashboard
// (used by dashboard.js, my-tickets.js and escalated.js so those pages stay in sync
// without duplicating the modal markup and action handlers three times).
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, showToast, formatDate, formatDateTime, paginate, renderPagination, debounce } from '../../utils/sa-common.js';

const STATUS_LABELS = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_CUSTOMER: 'Waiting for Customer',
    ESCALATED: 'Escalated',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
};

export function statusBadgeClass(status) {
    if (status === 'RESOLVED') return 'badge-resolved';
    if (status === 'CLOSED') return 'badge-closed';
    if (status === 'ESCALATED') return 'badge-escalated';
    if (status === 'WAITING_FOR_CUSTOMER') return 'badge-waiting';
    if (status === 'IN_PROGRESS') return 'badge-in-progress';
    return 'badge-open';
}

export function priorityBadgeClass(priority) {
    return `badge-priority-${(priority || 'low').toLowerCase()}`;
}

export function formatStatus(status) {
    return STATUS_LABELS[status] || (status || '').replace(/_/g, ' ');
}

const MODAL_ID = 'sm-ticket-modal';
const RESOLVE_MODAL_ID = 'sm-resolve-modal';

function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
    <div class="modal-overlay" id="${MODAL_ID}">
        <div class="modal" style="max-width:760px;">
            <div class="modal-header">
                <h3 class="modal-title" id="sm-detail-title">Ticket Details</h3>
                <button class="modal-close" data-modal-close>&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="sm-d-id">

                <div class="company-panel" id="sm-company-panel" style="display:none;">
                    <div class="company-panel-title"><i class="ph ph-buildings"></i> Company Information</div>
                    <div class="detail-grid" id="sm-company-info"></div>
                </div>

                <div class="detail-grid" id="sm-detail-info" style="margin-bottom:16px;"></div>
                <div class="detail-item" style="margin-bottom:16px;"><span class="detail-label">Description</span><span class="detail-value" id="sm-d-description">-</span></div>

                <div style="display:flex; gap:10px; margin:0 0 16px; flex-wrap:wrap;">
                    <button class="btn btn-outline" id="sm-btn-claim"><i class="ph ph-hand-pointing"></i> Claim Ticket</button>
                </div>

                <div class="form-hint" id="sm-unassigned-hint" style="display:none;">
                    <i class="ph ph-info"></i> This ticket is unassigned. Claim it to reply, update, resolve, or escalate it.
                </div>

                <div id="sm-controls-section">
                    <div class="form-section-title">Ticket Controls</div>
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select class="form-control" id="sm-d-status">
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Priority</label>
                            <select class="form-control" id="sm-d-priority">
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select class="form-control" id="sm-d-category"></select>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px; margin:12px 0 20px; flex-wrap:wrap;">
                        <button class="btn btn-secondary" id="sm-btn-update"><i class="ph ph-check-circle"></i> Update Status / Priority / Category</button>
                        <button class="btn btn-success" id="sm-btn-resolve"><i class="ph ph-check-fat"></i> Resolve</button>
                        <button class="btn btn-outline" id="sm-btn-reopen"><i class="ph ph-arrow-counter-clockwise"></i> Reopen</button>
                        <button class="btn btn-outline" id="sm-btn-close"><i class="ph ph-x-circle"></i> Close Ticket</button>
                        <button class="btn btn-danger" id="sm-btn-esc-tech"><i class="ph ph-hard-drives"></i> Escalate to Technical Team</button>
                        <button class="btn btn-danger" id="sm-btn-esc-admin"><i class="ph ph-shield-star"></i> Escalate to Platform Admin</button>
                    </div>

                    <div id="sm-linked-ticket" style="display:none; margin-bottom:16px;"></div>

                    <div class="msg-tabs">
                        <button class="msg-tab active" data-tab="conversation">Conversation</button>
                        <button class="msg-tab" data-tab="notes">Internal Notes</button>
                    </div>

                    <div class="msg-pane active" id="sm-pane-conversation">
                        <div id="sm-detail-comments" style="max-height:220px; overflow-y:auto; margin-bottom:12px;"></div>
                        <div class="form-group">
                            <textarea class="form-control" id="sm-d-comment" rows="2" placeholder="Write your response..."></textarea>
                        </div>
                        <div class="attach-row">
                            <button class="btn btn-outline" id="sm-btn-attach" type="button"><i class="ph ph-paperclip"></i> Attach File</button>
                            <button class="btn btn-primary" id="sm-btn-send"><i class="ph ph-paper-plane-tilt"></i> Send</button>
                            <span class="attach-chip" id="sm-attach-chip" style="display:none;"><i class="ph ph-file"></i> <span id="sm-attach-name"></span></span>
                            <input type="file" id="sm-attach-input" style="display:none;">
                        </div>
                    </div>

                    <div class="msg-pane" id="sm-pane-notes">
                        <div class="form-hint"><i class="ph ph-eye-slash"></i> Internal notes are never visible to the Company Admin.</div>
                        <div id="sm-detail-notes" style="max-height:220px; overflow-y:auto; margin-bottom:12px;"></div>
                        <div class="form-group">
                            <textarea class="form-control" id="sm-d-note" rows="2" placeholder="Add an internal note..."></textarea>
                        </div>
                        <button class="btn btn-outline" id="sm-btn-add-note"><i class="ph ph-note-pencil"></i> Add Internal Note</button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" data-modal-close>Close</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(wrap.firstElementChild);

    const resolveWrap = document.createElement('div');
    resolveWrap.innerHTML = `
    <div class="modal-overlay" id="${RESOLVE_MODAL_ID}">
        <div class="modal" style="max-width:440px;">
            <div class="modal-header">
                <h3 class="modal-title">Resolve Ticket?</h3>
                <button class="modal-close" data-modal-close>&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin:0 0 16px; color:var(--text-main); font-size:14px;">
                    Are you sure you want to mark <strong id="sm-resolve-ticket-id"></strong> as resolved?
                </p>
                <div class="form-group">
                    <label class="form-label">Resolution note (optional)</label>
                    <textarea class="form-control" id="sm-resolve-note" rows="3" placeholder="Briefly describe how the issue was resolved..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" data-modal-close>Cancel</button>
                <button class="btn btn-success" id="sm-btn-confirm-resolve"><i class="ph ph-check-fat"></i> Resolve Ticket</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(resolveWrap.firstElementChild);

    const modal = document.getElementById(MODAL_ID);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeTicketModal(); });
    modal.querySelectorAll('[data-modal-close]').forEach((btn) => btn.addEventListener('click', closeTicketModal));

    const resolveModal = document.getElementById(RESOLVE_MODAL_ID);
    resolveModal.addEventListener('click', (e) => { if (e.target === resolveModal) closeResolveModal(); });
    resolveModal.querySelectorAll('[data-modal-close]').forEach((btn) => btn.addEventListener('click', closeResolveModal));
    document.getElementById('sm-btn-confirm-resolve').addEventListener('click', confirmResolve);

    modal.querySelectorAll('.msg-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            modal.querySelectorAll('.msg-tab').forEach((t) => t.classList.remove('active'));
            modal.querySelectorAll('.msg-pane').forEach((p) => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`sm-pane-${tab.getAttribute('data-tab')}`).classList.add('active');
        });
    });

    // Attach File is UI-only (no upload backend exists yet) - it just previews the chosen filename.
    document.getElementById('sm-btn-attach').addEventListener('click', () => document.getElementById('sm-attach-input').click());
    document.getElementById('sm-attach-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        const chip = document.getElementById('sm-attach-chip');
        if (file) {
            document.getElementById('sm-attach-name').textContent = file.name;
            chip.style.display = 'inline-flex';
        } else {
            chip.style.display = 'none';
        }
    });
}

function openModal() { document.getElementById(MODAL_ID).classList.add('active'); }
function closeTicketModal() { const m = document.getElementById(MODAL_ID); if (m) m.classList.remove('active'); }

function openResolveModal() {
    document.getElementById('sm-resolve-ticket-id').textContent = currentTicket.ticket_id;
    document.getElementById('sm-resolve-note').value = '';
    document.getElementById(RESOLVE_MODAL_ID).classList.add('active');
}
function closeResolveModal() { const m = document.getElementById(RESOLVE_MODAL_ID); if (m) m.classList.remove('active'); }

async function confirmResolve() {
    const id = currentTicket.ticket_id;
    const note = document.getElementById('sm-resolve-note').value.trim() || undefined;
    try {
        await db.resolveMyTicket(id, note);
        closeResolveModal();
        showToast(`Ticket ${id} has been resolved successfully.`);
        await refresh();
    } catch (e) { showToast(e.message || 'Failed to resolve ticket.', 'error'); }
}

let currentTicket = null;
let currentCategories = [];
let onChangedCallback = null;

async function renderCompanyPanel(companyId) {
    const panel = document.getElementById('sm-company-panel');
    const info = document.getElementById('sm-company-info');
    try {
        const c = await db.getSupportCompanySummary(companyId);
        info.innerHTML = `
            <div class="detail-item"><span class="detail-label">Company</span><span class="detail-value">${escapeHtml(c.company_name)}</span></div>
            <div class="detail-item"><span class="detail-label">Company ID</span><span class="detail-value">${escapeHtml(c.company_id)}</span></div>
            <div class="detail-item"><span class="detail-label">Assigned Platform Admin</span><span class="detail-value">${escapeHtml(c.assigned_platform_admin || '-')}</span></div>
            <div class="detail-item"><span class="detail-label">Company Admin</span><span class="detail-value">${escapeHtml(c.company_admin || '-')}</span></div>
            <div class="detail-item"><span class="detail-label">Subscription</span><span class="detail-value">${escapeHtml(c.subscription_plan || '-')}</span></div>
            <div class="detail-item"><span class="detail-label">Employee Count</span><span class="detail-value">${c.employee_count}</span></div>
        `;
        panel.style.display = 'block';
    } catch (e) {
        panel.style.display = 'none';
    }
}

function renderConversation(comments) {
    const el = document.getElementById('sm-detail-comments');
    if (!comments || comments.length === 0) {
        el.innerHTML = `<div class="empty-state" style="padding:16px;"><i class="ph ph-chat-circle-dots"></i> No messages yet.</div>`;
        return;
    }
    el.innerHTML = comments.map((c) => `
        <div class="comment-item">
            <span class="comment-author">${escapeHtml(c.author)}</span>
            <span class="comment-time">${formatDateTime(c.timestamp)}</span>
            <div class="comment-message">${escapeHtml(c.message)}</div>
        </div>
    `).join('');
    el.scrollTop = el.scrollHeight;
}

function renderNotes(notes) {
    const el = document.getElementById('sm-detail-notes');
    if (!notes || notes.length === 0) {
        el.innerHTML = `<div class="empty-state" style="padding:16px;"><i class="ph ph-note"></i> No internal notes yet.</div>`;
        return;
    }
    el.innerHTML = notes.map((n) => `
        <div class="comment-item internal">
            <span class="comment-author">${escapeHtml(n.author)}<span class="sender-tag">Internal</span></span>
            <span class="comment-time">${formatDateTime(n.timestamp)}</span>
            <div class="comment-message">${escapeHtml(n.message)}</div>
        </div>
    `).join('');
}

async function renderLinkedTicket(ticket) {
    const el = document.getElementById('sm-linked-ticket');
    if (!ticket.linked_technical_ticket_id) { el.style.display = 'none'; return; }
    try {
        const linked = await db.getLinkedTechnicalTicket(ticket.linked_technical_ticket_id);
        el.style.display = 'block';
        el.innerHTML = `
            <div class="form-hint" style="margin-top:0;">
                <i class="ph ph-link"></i> Escalated as Technical Ticket <strong>${escapeHtml(linked.ticket_id)}</strong> &middot;
                Status: <span class="badge ${statusBadgeClass(linked.status)}">${escapeHtml(formatStatus(linked.status))}</span> &middot;
                Assigned To: ${escapeHtml(linked.assigned_to_name || 'Unassigned')}
            </div>`;
    } catch (e) {
        el.style.display = 'none';
    }
}

export async function openTicketDetail(ticket, categories, onChanged) {
    ensureModal();
    currentTicket = ticket;
    currentCategories = categories || [];
    onChangedCallback = onChanged;

    document.getElementById('sm-d-id').value = ticket.ticket_id;
    document.getElementById('sm-detail-title').textContent = `${ticket.ticket_id} - ${ticket.title}`;
    document.getElementById('sm-detail-info').innerHTML = `
        <div class="detail-item"><span class="detail-label">Raised By</span><span class="detail-value">${escapeHtml(ticket.raised_by_name)}</span></div>
        <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${escapeHtml(ticket.raised_by_email || '-')}</span></div>
        <div class="detail-item"><span class="detail-label">Status</span><span class="badge ${statusBadgeClass(ticket.status)}">${escapeHtml(formatStatus(ticket.status))}</span></div>
        <div class="detail-item"><span class="detail-label">Priority</span><span class="badge ${priorityBadgeClass(ticket.priority)}">${escapeHtml(ticket.priority)}</span></div>
        <div class="detail-item"><span class="detail-label">Assigned To</span><span class="detail-value">${escapeHtml(ticket.assigned_to_name || 'Unassigned')}</span></div>
        <div class="detail-item"><span class="detail-label">Created</span><span class="detail-value">${formatDate(ticket.created_date)}</span></div>
        <div class="detail-item"><span class="detail-label">Last Updated</span><span class="detail-value">${formatDate(ticket.updated_date)}</span></div>
    `;
    document.getElementById('sm-d-description').textContent = ticket.description || 'No description provided.';

    const categorySelect = document.getElementById('sm-d-category');
    categorySelect.innerHTML = currentCategories.map((c) => `<option value="${escapeHtml(c)}" ${c === ticket.category ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')
        || `<option value="${escapeHtml(ticket.category)}" selected>${escapeHtml(ticket.category)}</option>`;
    document.getElementById('sm-d-status').value = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'].includes(ticket.status) ? ticket.status : 'OPEN';
    document.getElementById('sm-d-priority').value = (ticket.priority || 'LOW').toUpperCase();

    // Unassigned tickets are claim-only: no status/priority/category edits, no Resolve/
    // Escalate, no reply/notes, until a Support Member claims ownership (section 8/12).
    const isUnassigned = !ticket.assigned_to;
    const isTerminal = ['RESOLVED', 'CLOSED'].includes(ticket.status);
    document.getElementById('sm-btn-claim').style.display = isUnassigned ? 'inline-flex' : 'none';
    document.getElementById('sm-unassigned-hint').style.display = isUnassigned ? 'flex' : 'none';
    document.getElementById('sm-controls-section').style.display = isUnassigned ? 'none' : 'block';
    document.getElementById('sm-btn-update').style.display = isTerminal ? 'none' : 'inline-flex';
    document.getElementById('sm-btn-resolve').style.display = isTerminal ? 'none' : 'inline-flex';
    document.getElementById('sm-btn-reopen').style.display = isTerminal ? 'inline-flex' : 'none';
    document.getElementById('sm-btn-close').style.display = ticket.status === 'RESOLVED' ? 'inline-flex' : 'none';
    document.getElementById('sm-btn-esc-tech').style.display = isTerminal ? 'none' : 'inline-flex';
    document.getElementById('sm-btn-esc-admin').style.display = isTerminal ? 'none' : 'inline-flex';
    const escalateDisabled = ticket.status === 'ESCALATED';
    document.getElementById('sm-btn-esc-tech').disabled = escalateDisabled;
    document.getElementById('sm-btn-esc-admin').disabled = escalateDisabled;

    document.getElementById('sm-attach-chip').style.display = 'none';
    document.getElementById('sm-d-comment').value = '';
    document.getElementById('sm-d-note').value = '';
    document.querySelectorAll(`#${MODAL_ID} .msg-tab`)[0].click();

    renderConversation(ticket.comments);
    renderNotes(ticket.internal_notes);
    renderCompanyPanel(ticket.company_id);
    renderLinkedTicket(ticket);

    openModal();
}

async function refresh() {
    const id = document.getElementById('sm-d-id').value;
    const updated = await db.getMyDashboardTicketById(id);
    await openTicketDetail(updated, currentCategories, onChangedCallback);
    if (onChangedCallback) onChangedCallback(updated);
}

function bindModalActions() {
    document.getElementById('sm-btn-claim').addEventListener('click', async () => {
        try {
            await db.claimTicket(currentTicket.ticket_id);
            showToast('Ticket claimed.');
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to claim ticket.', 'error'); }
    });

    document.getElementById('sm-btn-update').addEventListener('click', async () => {
        const id = currentTicket.ticket_id;
        const status = document.getElementById('sm-d-status').value;
        const priority = document.getElementById('sm-d-priority').value;
        const category = document.getElementById('sm-d-category').value;
        try {
            if (status !== currentTicket.status) await db.changeTicketStatus(id, status);
            if (priority !== (currentTicket.priority || '').toUpperCase()) await db.changeTicketPriority(id, priority);
            if (category !== currentTicket.category) await db.changeTicketCategory(id, category);
            showToast('Ticket updated.');
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to update ticket.', 'error'); }
    });

    document.getElementById('sm-btn-resolve').addEventListener('click', () => {
        openResolveModal();
    });

    document.getElementById('sm-btn-reopen').addEventListener('click', async () => {
        const reason = prompt('Why are you reopening this ticket?') || undefined;
        try {
            await db.reopenTicket(currentTicket.ticket_id, reason);
            showToast('Ticket reopened.');
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to reopen ticket.', 'error'); }
    });

    document.getElementById('sm-btn-close').addEventListener('click', async () => {
        if (!confirm('Close this ticket? It must already be resolved.')) return;
        try {
            await db.closeTicket(currentTicket.ticket_id);
            showToast('Ticket closed.');
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to close ticket.', 'error'); }
    });

    document.getElementById('sm-btn-esc-tech').addEventListener('click', async () => {
        if (!confirm('Escalate this ticket to the Technical Team?')) return;
        const note = document.getElementById('sm-d-note').value.trim() || undefined;
        try {
            await db.escalateToTechnicalTeam(currentTicket.ticket_id, note);
            showToast('Escalated to the Technical Team.');
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to escalate.', 'error'); }
    });

    document.getElementById('sm-btn-esc-admin').addEventListener('click', async () => {
        if (!confirm('Escalate this ticket to the Platform Admin?')) return;
        const note = document.getElementById('sm-d-note').value.trim() || undefined;
        try {
            await db.escalateToPlatformAdmin(currentTicket.ticket_id, note);
            showToast('Escalated to the Platform Admin.');
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to escalate.', 'error'); }
    });

    document.getElementById('sm-btn-send').addEventListener('click', async () => {
        const message = document.getElementById('sm-d-comment').value.trim();
        if (!message) { showToast('Write a response first.', 'error'); return; }
        try {
            await db.addTicketMessage(currentTicket.ticket_id, message);
            document.getElementById('sm-d-comment').value = '';
            document.getElementById('sm-attach-chip').style.display = 'none';
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to send message.', 'error'); }
    });

    document.getElementById('sm-btn-add-note').addEventListener('click', async () => {
        const message = document.getElementById('sm-d-note').value.trim();
        if (!message) { showToast('Write an internal note first.', 'error'); return; }
        try {
            await db.addInternalNote(currentTicket.ticket_id, message);
            document.getElementById('sm-d-note').value = '';
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to add note.', 'error'); }
    });
}

let modalActionsBound = false;

export function renderTicketRows(tbody, tickets, { categories, onChanged, emptyMessage } = {}) {
    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="9"><i class="ph ph-ticket" style="font-size:28px; display:block; margin-bottom:8px;"></i>${escapeHtml(emptyMessage || 'No tickets found.')}</td></tr>`;
        return;
    }
    tbody.innerHTML = tickets.map((t) => `
        <tr class="${t.priority === 'Critical' && t.status !== 'RESOLVED' && t.status !== 'CLOSED' ? 'critical-row' : ''}">
            <td>${escapeHtml(t.ticket_id)}</td>
            <td>${escapeHtml(t.company_name)}</td>
            <td>
                <div class="cell-primary">
                    <span class="cell-name">${escapeHtml(t.title)}</span>
                    <span class="cell-sub">${escapeHtml(t.raised_by_name)}</span>
                </div>
            </td>
            <td>${escapeHtml(t.category)}</td>
            <td><span class="badge ${priorityBadgeClass(t.priority)}">${escapeHtml(t.priority)}</span></td>
            <td><span class="badge ${statusBadgeClass(t.status)}">${escapeHtml(formatStatus(t.status))}</span></td>
            <td>${escapeHtml(t.assigned_to_name || 'Unassigned')}</td>
            <td>${formatDate(t.created_date)}</td>
            <td>
                <div class="row-actions" style="justify-content:flex-end;">
                    <button class="icon-btn" title="View" data-detail="${t.ticket_id}"><i class="ph ph-eye"></i></button>
                    ${!t.assigned_to ? `<button class="icon-btn" title="Claim" data-claim="${t.ticket_id}"><i class="ph ph-hand-pointing"></i></button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');

    if (!modalActionsBound) { ensureModal(); bindModalActions(); modalActionsBound = true; }

    tbody.querySelectorAll('[data-detail]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const ticket = tickets.find((x) => x.ticket_id === btn.getAttribute('data-detail'));
            if (ticket) openTicketDetail(ticket, categories, onChanged);
        });
    });

    // Quick-claim straight from the Unassigned Support Queue row, without opening the
    // detail modal - the modal's Claim button covers the same action for anyone who
    // opened View first.
    tbody.querySelectorAll('[data-claim]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-claim');
            try {
                await db.claimTicket(id);
                showToast(`Ticket ${id} claimed.`);
                if (onChanged) onChanged();
            } catch (e) { showToast(e.message || 'Failed to claim ticket.', 'error'); }
        });
    });
}

export { escapeHtml, showToast, formatDate, formatDateTime, paginate, renderPagination, debounce, auth, db };
