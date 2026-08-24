// /js/views/technical_member/_board.js
// Shared issue table + detail-modal logic for the Technical Member dashboard
// (used by assigned-issues.js and issue-history.js so both pages stay in sync
// without duplicating the modal markup and action handlers twice).
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, showToast, formatDate, formatDateTime, paginate, renderPagination, debounce } from '../../utils/sa-common.js';

const STATUS_LABELS = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    ESCALATED: 'Escalated',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
};

export function statusBadgeClass(status) {
    if (status === 'RESOLVED') return 'badge-resolved';
    if (status === 'CLOSED') return 'badge-closed';
    if (status === 'ESCALATED') return 'badge-escalated';
    if (status === 'IN_PROGRESS') return 'badge-in-progress';
    return 'badge-open';
}

export function priorityBadgeClass(priority) {
    return `badge-priority-${(priority || 'low').toLowerCase()}`;
}

export function formatStatus(status) {
    return STATUS_LABELS[status] || (status || '').replace(/_/g, ' ');
}

const VERIFICATION_LABELS = {
    PENDING_VERIFICATION: 'Awaiting Verification',
    VERIFIED: 'Verified',
    REJECTED: 'Sent Back for Rework',
};

export function verificationBadgeClass(status) {
    if (status === 'VERIFIED') return 'badge-verified';
    if (status === 'REJECTED') return 'badge-rejected';
    if (status === 'PENDING_VERIFICATION') return 'badge-pending';
    return 'badge-neutral';
}

export function formatVerification(status) {
    return VERIFICATION_LABELS[status] || null;
}

function formatBytes(bytes) {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read the file.'));
        reader.readAsDataURL(file);
    });
}

const MODAL_ID = 'tm-issue-modal';

function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
    <div class="modal-overlay" id="${MODAL_ID}">
        <div class="modal" style="max-width:780px;">
            <div class="modal-header">
                <h3 class="modal-title" id="tm-detail-title">Issue Details</h3>
                <button class="modal-close" data-modal-close>&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="tm-d-id">

                <div id="tm-verification-banner" style="display:none; margin-bottom:16px;"></div>

                <div class="detail-grid" id="tm-detail-info" style="margin-bottom:16px;"></div>
                <div class="detail-item" style="margin-bottom:16px;"><span class="detail-label">Description</span><span class="detail-value" id="tm-d-description">-</span></div>

                <div class="detail-item" style="margin-bottom:16px;">
                    <span class="detail-label">Progress</span>
                    <div class="progress-row">
                        <div class="progress-track"><div class="progress-fill" id="tm-progress-fill" style="width:0%;"></div></div>
                        <span class="progress-pct" id="tm-progress-pct">0%</span>
                    </div>
                </div>

                <div id="tm-controls-section">
                    <div class="form-section-title">Investigation Controls</div>
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select class="form-control" id="tm-d-status">
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Progress: <span id="tm-slider-value">0</span>%</label>
                            <input type="range" class="progress-slider" id="tm-d-progress" min="0" max="100" step="5" value="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Progress note (optional)</label>
                        <input type="text" class="form-control" id="tm-d-progress-note" placeholder="What changed since the last update?">
                    </div>
                    <div style="display:flex; gap:10px; margin:4px 0 20px; flex-wrap:wrap;">
                        <button class="btn btn-secondary" id="tm-btn-update"><i class="ph ph-check-circle"></i> Update Status / Progress</button>
                        <button class="btn btn-primary" id="tm-btn-resolve"><i class="ph ph-flag-checkered"></i> Mark as Resolved</button>
                    </div>
                </div>

                <div id="tm-resolve-form" style="display:none; margin-bottom:20px;">
                    <div class="form-section-title">Resolution</div>
                    <div class="form-group">
                        <label class="form-label">Resolution notes</label>
                        <textarea class="form-control" id="tm-d-resolution" rows="3" placeholder="Describe what was done to resolve this issue..."></textarea>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" id="tm-btn-confirm-resolve"><i class="ph ph-check-circle"></i> Confirm Resolution</button>
                        <button class="btn btn-outline" id="tm-btn-cancel-resolve">Cancel</button>
                    </div>
                </div>

                <div id="tm-submit-section" style="display:none; margin-bottom:20px;">
                    <div class="form-hint" style="margin-top:0;"><i class="ph ph-info"></i> This issue is resolved. Send it back to the Platform Admin for verification.</div>
                    <div class="form-group">
                        <textarea class="form-control" id="tm-d-submit-note" rows="2" placeholder="Note for the Platform Admin (optional)..."></textarea>
                    </div>
                    <button class="btn btn-primary" id="tm-btn-submit-verification"><i class="ph ph-paper-plane-tilt"></i> Send for Verification</button>
                </div>

                <div class="msg-tabs">
                    <button class="msg-tab active" data-tab="conversation">Conversation</button>
                    <button class="msg-tab" data-tab="notes">Technical Notes</button>
                    <button class="msg-tab" data-tab="attachments">Attachments</button>
                    <button class="msg-tab" data-tab="timeline">Progress Log</button>
                </div>

                <div class="msg-pane active" id="tm-pane-conversation">
                    <div id="tm-detail-comments" style="max-height:220px; overflow-y:auto; margin-bottom:12px;"></div>
                    <div class="form-group">
                        <textarea class="form-control" id="tm-d-comment" rows="2" placeholder="Message the Platform Admin..."></textarea>
                    </div>
                    <button class="btn btn-primary" id="tm-btn-send"><i class="ph ph-paper-plane-tilt"></i> Send</button>
                </div>

                <div class="msg-pane" id="tm-pane-notes">
                    <div class="form-hint"><i class="ph ph-eye-slash"></i> Technical notes are internal - never visible to the company that raised this issue.</div>
                    <div id="tm-detail-notes" style="max-height:220px; overflow-y:auto; margin-bottom:12px;"></div>
                    <div class="form-group">
                        <textarea class="form-control" id="tm-d-note" rows="2" placeholder="Add a technical note..."></textarea>
                    </div>
                    <button class="btn btn-outline" id="tm-btn-add-note"><i class="ph ph-note-pencil"></i> Add Note</button>
                </div>

                <div class="msg-pane" id="tm-pane-attachments">
                    <div id="tm-attachment-list" class="attachment-list"></div>
                    <div class="attach-row">
                        <select class="filter-select" id="tm-attach-kind" style="padding:8px 12px;">
                            <option value="SCREENSHOT">Screenshot</option>
                            <option value="LOG">Log File</option>
                            <option value="OTHER">Other</option>
                        </select>
                        <button class="btn btn-outline" id="tm-btn-attach" type="button"><i class="ph ph-upload"></i> Choose File</button>
                        <span class="attach-chip" id="tm-attach-chip" style="display:none;"><i class="ph ph-file"></i> <span id="tm-attach-name"></span></span>
                        <input type="file" id="tm-attach-input" style="display:none;" accept="image/*,.log,.txt">
                        <button class="btn btn-primary" id="tm-btn-upload" disabled><i class="ph ph-cloud-arrow-up"></i> Upload</button>
                    </div>
                    <div class="form-hint"><i class="ph ph-info"></i> Screenshots and log files up to 5 MB.</div>
                </div>

                <div class="msg-pane" id="tm-pane-timeline">
                    <div id="tm-detail-timeline" class="timeline"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" data-modal-close>Close</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(wrap.firstElementChild);

    const modal = document.getElementById(MODAL_ID);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeIssueModal(); });
    modal.querySelectorAll('[data-modal-close]').forEach((btn) => btn.addEventListener('click', closeIssueModal));

    modal.querySelectorAll('.msg-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            activeTabName = tab.getAttribute('data-tab');
            modal.querySelectorAll('.msg-tab').forEach((t) => t.classList.remove('active'));
            modal.querySelectorAll('.msg-pane').forEach((p) => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tm-pane-${activeTabName}`).classList.add('active');
        });
    });

    document.getElementById('tm-d-progress').addEventListener('input', (e) => {
        document.getElementById('tm-slider-value').textContent = e.target.value;
    });

    let pendingFile = null;
    document.getElementById('tm-btn-attach').addEventListener('click', () => document.getElementById('tm-attach-input').click());
    document.getElementById('tm-attach-input').addEventListener('change', (e) => {
        pendingFile = e.target.files[0] || null;
        const chip = document.getElementById('tm-attach-chip');
        const uploadBtn = document.getElementById('tm-btn-upload');
        if (pendingFile) {
            document.getElementById('tm-attach-name').textContent = pendingFile.name;
            chip.style.display = 'inline-flex';
            uploadBtn.disabled = false;
        } else {
            chip.style.display = 'none';
            uploadBtn.disabled = true;
        }
    });

    document.getElementById('tm-btn-upload').addEventListener('click', async () => {
        if (!pendingFile) return;
        if (pendingFile.size > 5 * 1024 * 1024) { showToast('Attachments must be 5 MB or smaller.', 'error'); return; }
        try {
            const data_url = await readFileAsDataUrl(pendingFile);
            await db.uploadMyIssueAttachment(currentIssue.ticket_id, {
                file_name: pendingFile.name,
                file_type: pendingFile.type || 'application/octet-stream',
                file_size: pendingFile.size,
                kind: document.getElementById('tm-attach-kind').value,
                data_url,
            });
            pendingFile = null;
            document.getElementById('tm-attach-input').value = '';
            document.getElementById('tm-attach-chip').style.display = 'none';
            document.getElementById('tm-btn-upload').disabled = true;
            showToast('Attachment uploaded.');
            await refresh();
        } catch (e) {
            showToast(e.message || 'Failed to upload attachment.', 'error');
        }
    });

    document.getElementById('tm-btn-resolve').addEventListener('click', () => {
        document.getElementById('tm-resolve-form').style.display = 'block';
        document.getElementById('tm-d-resolution').focus();
    });
    document.getElementById('tm-btn-cancel-resolve').addEventListener('click', () => {
        document.getElementById('tm-resolve-form').style.display = 'none';
    });
}

function openModal() { document.getElementById(MODAL_ID).classList.add('active'); }
function closeIssueModal() { const m = document.getElementById(MODAL_ID); if (m) m.classList.remove('active'); }

let currentIssue = null;
let onChangedCallback = null;
let activeTabName = 'conversation';

function renderVerificationBanner(issue) {
    const banner = document.getElementById('tm-verification-banner');
    if (!issue.verification_status) { banner.style.display = 'none'; return; }
    const tone = issue.verification_status === 'VERIFIED' ? 'success' : issue.verification_status === 'REJECTED' ? 'danger' : 'warning';
    const icon = issue.verification_status === 'VERIFIED' ? 'ph-check-circle' : issue.verification_status === 'REJECTED' ? 'ph-arrow-counter-clockwise' : 'ph-hourglass-medium';
    banner.style.display = 'flex';
    banner.style.cssText = 'display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:8px;' +
        (tone === 'success' ? 'background:rgba(34,197,94,0.1); color:var(--tm-success);' :
         tone === 'danger' ? 'background:rgba(239,68,68,0.1); color:var(--tm-danger);' :
         'background:rgba(249,115,22,0.1); color:var(--tm-warning);');
    banner.innerHTML = `
        <i class="ph ${icon}" style="font-size:20px; flex-shrink:0;"></i>
        <div>
            <strong>${escapeHtml(formatVerification(issue.verification_status))}</strong>
            ${issue.verification_note ? `<div style="font-size:13px; margin-top:2px; color:var(--text-main);">${escapeHtml(issue.verification_note)}</div>` : ''}
            ${issue.verified_by_name ? `<div style="font-size:12px; margin-top:2px; opacity:0.8;">by ${escapeHtml(issue.verified_by_name)}${issue.verified_at ? ' · ' + formatDateTime(issue.verified_at) : ''}</div>` : ''}
        </div>
    `;
}

function renderConversation(comments) {
    const el = document.getElementById('tm-detail-comments');
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
    const el = document.getElementById('tm-detail-notes');
    if (!notes || notes.length === 0) {
        el.innerHTML = `<div class="empty-state" style="padding:16px;"><i class="ph ph-note"></i> No technical notes yet.</div>`;
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

function attachmentIcon(kind) {
    if (kind === 'SCREENSHOT') return 'ph-image';
    if (kind === 'LOG') return 'ph-file-text';
    return 'ph-paperclip';
}

function renderAttachments(attachments, issueId, canDelete) {
    const el = document.getElementById('tm-attachment-list');
    if (!attachments || attachments.length === 0) {
        el.innerHTML = `<div class="empty-state" style="padding:16px;"><i class="ph ph-paperclip"></i> No attachments yet.</div>`;
        return;
    }
    el.innerHTML = attachments.map((a) => `
        <div class="attachment-item">
            <div class="attachment-icon ${a.kind === 'LOG' ? 'log' : ''}"><i class="ph ${attachmentIcon(a.kind)}"></i></div>
            <div class="attachment-meta">
                <div class="attachment-name">${escapeHtml(a.file_name)}</div>
                <div class="attachment-sub">${formatBytes(a.file_size)} &middot; ${escapeHtml(a.uploaded_by_name || 'Unknown')} &middot; ${formatDateTime(a.uploaded_at)}</div>
            </div>
            <div class="row-actions">
                <button class="icon-btn" title="View" data-view-attachment="${a.attachment_id}"><i class="ph ph-eye"></i></button>
                ${canDelete(a) ? `<button class="icon-btn danger" title="Remove" data-delete-attachment="${a.attachment_id}"><i class="ph ph-trash"></i></button>` : ''}
            </div>
        </div>
        <div id="tm-attach-preview-${a.attachment_id}"></div>
    `).join('');

    el.querySelectorAll('[data-view-attachment]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const attachmentId = btn.getAttribute('data-view-attachment');
            const previewEl = document.getElementById(`tm-attach-preview-${attachmentId}`);
            if (previewEl.innerHTML) { previewEl.innerHTML = ''; return; }
            try {
                const full = await db.getMyIssueAttachment(issueId, attachmentId);
                if (full.data_url && (full.file_type || '').startsWith('image/')) {
                    previewEl.innerHTML = `<img class="attachment-preview" src="${full.data_url}" alt="${escapeHtml(full.file_name)}">`;
                } else if (full.data_url) {
                    previewEl.innerHTML = `<div class="form-hint" style="margin-top:8px;"><i class="ph ph-check"></i> File ready - use the browser's own download tools to save it locally.</div>`;
                } else {
                    previewEl.innerHTML = `<div class="form-hint" style="margin-top:8px;"><i class="ph ph-warning"></i> No preview available for this attachment.</div>`;
                }
            } catch (e) {
                showToast(e.message || 'Failed to load attachment.', 'error');
            }
        });
    });

    el.querySelectorAll('[data-delete-attachment]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            if (!confirm('Remove this attachment?')) return;
            try {
                await db.deleteMyIssueAttachment(issueId, btn.getAttribute('data-delete-attachment'));
                showToast('Attachment removed.');
                await refresh();
            } catch (e) {
                showToast(e.message || 'Failed to remove attachment.', 'error');
            }
        });
    });
}

function timelineEntries(issue) {
    const entries = [];
    (issue.progress_log || []).forEach((p) => entries.push({
        icon: 'ph-chart-line-up',
        title: `Progress ${p.from}% → ${p.to}%`,
        sub: p.note || null,
        actor: p.author,
        timestamp: p.timestamp,
    }));
    if (issue.submitted_for_verification_at) entries.push({
        icon: 'ph-paper-plane-tilt',
        title: 'Sent for verification',
        sub: null, actor: null,
        timestamp: issue.submitted_for_verification_at,
    });
    if (issue.verified_at) entries.push({
        icon: issue.verification_status === 'REJECTED' ? 'ph-arrow-counter-clockwise' : 'ph-check-circle',
        title: issue.verification_status === 'REJECTED' ? 'Returned for rework' : 'Verified by Platform Admin',
        sub: issue.verification_note || null,
        actor: issue.verified_by_name,
        timestamp: issue.verified_at,
    });
    return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function renderTimeline(issue) {
    const el = document.getElementById('tm-detail-timeline');
    const entries = timelineEntries(issue);
    if (entries.length === 0) {
        el.innerHTML = `<div class="empty-state" style="padding:16px;"><i class="ph ph-clock-counter-clockwise"></i> No progress recorded yet.</div>`;
        return;
    }
    el.innerHTML = entries.map((e) => `
        <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-body">
                <div class="timeline-title"><i class="ph ${e.icon}"></i> ${escapeHtml(e.title)}</div>
                ${e.sub ? `<div class="timeline-sub">${escapeHtml(e.sub)}</div>` : ''}
                ${e.actor ? `<div class="timeline-sub">${escapeHtml(e.actor)}</div>` : ''}
            </div>
            <div class="timeline-time">${formatDateTime(e.timestamp)}</div>
        </div>
    `).join('');
}

export async function openIssueDetail(issue, onChanged) {
    ensureModal();
    // Opening a different issue always starts on Conversation; refreshing the same
    // issue (e.g. after uploading an attachment) keeps whatever tab was active.
    if (!currentIssue || currentIssue.ticket_id !== issue.ticket_id) activeTabName = 'conversation';
    currentIssue = issue;
    onChangedCallback = onChanged;

    const user = auth.getCurrentUser();

    document.getElementById('tm-d-id').value = issue.ticket_id;
    document.getElementById('tm-detail-title').textContent = `${issue.ticket_id} - ${issue.title}`;
    document.getElementById('tm-detail-info').innerHTML = `
        <div class="detail-item"><span class="detail-label">Company</span><span class="detail-value">${escapeHtml(issue.company_name)}</span></div>
        <div class="detail-item"><span class="detail-label">Category</span><span class="detail-value">${escapeHtml(issue.category)}</span></div>
        <div class="detail-item"><span class="detail-label">Raised By</span><span class="detail-value">${escapeHtml(issue.raised_by_name)}</span></div>
        <div class="detail-item"><span class="detail-label">Status</span><span class="badge ${statusBadgeClass(issue.status)}">${escapeHtml(formatStatus(issue.status))}</span></div>
        <div class="detail-item"><span class="detail-label">Priority</span><span class="badge ${priorityBadgeClass(issue.priority)}">${escapeHtml(issue.priority)}</span></div>
        <div class="detail-item"><span class="detail-label">Assigned By</span><span class="detail-value">${escapeHtml(issue.platform_admin_name || '-')}</span></div>
        <div class="detail-item"><span class="detail-label">Created</span><span class="detail-value">${formatDate(issue.created_date)}</span></div>
        <div class="detail-item"><span class="detail-label">Last Updated</span><span class="detail-value">${formatDate(issue.updated_date)}</span></div>
    `;
    document.getElementById('tm-d-description').textContent = issue.description || 'No description provided.';

    renderVerificationBanner(issue);

    const pct = issue.progress_percentage || 0;
    const fillEl = document.getElementById('tm-progress-fill');
    fillEl.style.width = `${pct}%`;
    fillEl.classList.toggle('complete', pct >= 100);
    document.getElementById('tm-progress-pct').textContent = `${pct}%`;

    const isTerminal = ['RESOLVED', 'CLOSED', 'ESCALATED'].includes(issue.status);
    const isVerified = issue.verification_status === 'VERIFIED';

    document.getElementById('tm-controls-section').style.display = isTerminal ? 'none' : 'block';
    document.getElementById('tm-resolve-form').style.display = 'none';
    document.getElementById('tm-d-resolution').value = '';
    if (!isTerminal) {
        document.getElementById('tm-d-status').value = issue.status;
        document.getElementById('tm-d-progress').value = pct;
        document.getElementById('tm-slider-value').textContent = pct;
        document.getElementById('tm-d-progress-note').value = '';
    }

    const canSubmitForVerification = issue.status === 'RESOLVED' && !isVerified && issue.verification_status !== 'PENDING_VERIFICATION';
    document.getElementById('tm-submit-section').style.display = canSubmitForVerification ? 'block' : 'none';
    document.getElementById('tm-d-submit-note').value = '';

    document.getElementById('tm-attach-chip').style.display = 'none';
    document.getElementById('tm-btn-upload').disabled = true;
    document.getElementById('tm-attach-input').value = '';
    document.getElementById('tm-d-comment').value = '';
    document.getElementById('tm-d-note').value = '';
    const tabToActivate = document.querySelector(`#${MODAL_ID} .msg-tab[data-tab="${activeTabName}"]`) || document.querySelectorAll(`#${MODAL_ID} .msg-tab`)[0];
    tabToActivate.click();

    renderConversation(issue.comments);
    renderNotes(issue.internal_notes);
    renderAttachments(issue.attachments, issue.ticket_id, (a) => a.uploaded_by === user.emp_id);
    renderTimeline(issue);

    openModal();
}

async function refresh() {
    const id = document.getElementById('tm-d-id').value;
    const updated = await db.getMyTechnicalIssueById(id);
    await openIssueDetail(updated, onChangedCallback);
    if (onChangedCallback) onChangedCallback(updated);
}

function bindModalActions() {
    document.getElementById('tm-btn-update').addEventListener('click', async () => {
        const id = currentIssue.ticket_id;
        const status = document.getElementById('tm-d-status').value;
        const progress = Number(document.getElementById('tm-d-progress').value);
        const note = document.getElementById('tm-d-progress-note').value.trim() || undefined;
        try {
            if (status !== currentIssue.status) await db.updateMyIssueStatus(id, status);
            if (progress !== (currentIssue.progress_percentage || 0)) await db.updateMyIssueProgress(id, progress, note);
            showToast('Issue updated.');
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to update issue.', 'error'); }
    });

    document.getElementById('tm-btn-confirm-resolve').addEventListener('click', async () => {
        const notes = document.getElementById('tm-d-resolution').value.trim();
        if (!notes) { showToast('Describe how the issue was resolved.', 'error'); return; }
        try {
            await db.resolveMyIssue(currentIssue.ticket_id, notes);
            showToast('Issue marked as resolved.');
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to resolve issue.', 'error'); }
    });

    document.getElementById('tm-btn-submit-verification').addEventListener('click', async () => {
        const note = document.getElementById('tm-d-submit-note').value.trim() || undefined;
        try {
            await db.submitMyIssueForVerification(currentIssue.ticket_id, note);
            showToast('Sent to the Platform Admin for verification.');
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to send for verification.', 'error'); }
    });

    document.getElementById('tm-btn-send').addEventListener('click', async () => {
        const message = document.getElementById('tm-d-comment').value.trim();
        if (!message) { showToast('Write a message first.', 'error'); return; }
        try {
            await db.addMyIssueComment(currentIssue.ticket_id, message);
            document.getElementById('tm-d-comment').value = '';
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to send message.', 'error'); }
    });

    document.getElementById('tm-btn-add-note').addEventListener('click', async () => {
        const message = document.getElementById('tm-d-note').value.trim();
        if (!message) { showToast('Write a technical note first.', 'error'); return; }
        try {
            await db.addMyIssueWorkNote(currentIssue.ticket_id, message);
            document.getElementById('tm-d-note').value = '';
            await refresh();
        } catch (e) { showToast(e.message || 'Failed to add note.', 'error'); }
    });
}

let modalActionsBound = false;

export function renderIssueRows(tbody, issues, { onChanged, emptyMessage } = {}) {
    if (!issues || issues.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="9"><i class="ph ph-bug" style="font-size:28px; display:block; margin-bottom:8px;"></i>${escapeHtml(emptyMessage || 'No issues found.')}</td></tr>`;
        return;
    }
    tbody.innerHTML = issues.map((t) => `
        <tr class="${t.priority === 'Critical' && !['RESOLVED', 'CLOSED'].includes(t.status) ? 'critical-row' : ''}">
            <td>${escapeHtml(t.ticket_id)}</td>
            <td>${escapeHtml(t.company_name)}</td>
            <td>
                <div class="cell-primary">
                    <span class="cell-name">${escapeHtml(t.title)}</span>
                    <span class="cell-sub">${escapeHtml(t.category)}</span>
                </div>
            </td>
            <td><span class="badge ${priorityBadgeClass(t.priority)}">${escapeHtml(t.priority)}</span></td>
            <td><span class="badge ${statusBadgeClass(t.status)}">${escapeHtml(formatStatus(t.status))}</span></td>
            <td>
                <div class="progress-row" style="min-width:110px;">
                    <div class="progress-track"><div class="progress-fill ${t.progress_percentage >= 100 ? 'complete' : ''}" style="width:${t.progress_percentage || 0}%;"></div></div>
                    <span class="progress-pct">${t.progress_percentage || 0}%</span>
                </div>
            </td>
            <td>${t.verification_status ? `<span class="badge ${verificationBadgeClass(t.verification_status)}">${escapeHtml(formatVerification(t.verification_status))}</span>` : '-'}</td>
            <td>${formatDate(t.updated_date)}</td>
            <td>
                <div class="row-actions" style="justify-content:flex-end;">
                    <button class="icon-btn" title="View / Manage" data-detail="${t.ticket_id}"><i class="ph ph-eye"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    if (!modalActionsBound) { ensureModal(); bindModalActions(); modalActionsBound = true; }

    tbody.querySelectorAll('[data-detail]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const issue = issues.find((x) => x.ticket_id === btn.getAttribute('data-detail'));
            if (issue) openIssueDetail(issue, onChanged);
        });
    });
}

export { escapeHtml, showToast, formatDate, formatDateTime, paginate, renderPagination, debounce, auth, db };
