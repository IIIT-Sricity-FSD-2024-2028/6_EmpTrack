// Issue detail modal shared by the Technical Member dashboard, Assigned Issues
// and Issue History pages (converted from js/views/technical_member/_board.js).
import { Fragment, useEffect, useRef, useState } from 'react';
import SaModal from '../../../components/sa-common/SaModal';
import useAuth from '../../../hooks/useAuth';
import * as tm from '../../../services/technicalMemberService';
import { cx } from '../../../utils/helpers';
import { formatDate, formatDateTime } from '../../../utils/saCommon';
import {
  formatBytes, formatStatus, formatVerification, priorityBadgeClass, readFileAsDataUrl, statusBadgeClass,
} from '../tmConstants';
import { ProgressBar } from './IssueRows';

const TABS = [
  { key: 'conversation', label: 'Conversation' },
  { key: 'notes', label: 'Technical Notes' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'timeline', label: 'Progress Log' },
];

function attachmentIcon(kind) {
  if (kind === 'SCREENSHOT') return 'ph-image';
  if (kind === 'LOG') return 'ph-file-text';
  return 'ph-paperclip';
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
  if (issue.submitted_for_verification_at) {
    entries.push({ icon: 'ph-paper-plane-tilt', title: 'Sent for verification', sub: null, actor: null, timestamp: issue.submitted_for_verification_at });
  }
  if (issue.verified_at) {
    entries.push({
      icon: issue.verification_status === 'REJECTED' ? 'ph-arrow-counter-clockwise' : 'ph-check-circle',
      title: issue.verification_status === 'REJECTED' ? 'Returned for rework' : 'Verified by Platform Admin',
      sub: issue.verification_note || null,
      actor: issue.verified_by_name,
      timestamp: issue.verified_at,
    });
  }
  return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function VerificationBanner({ issue }) {
  if (!issue.verification_status) return <div id="tm-verification-banner" style={{ display: 'none', marginBottom: 16 }}></div>;
  const vs = issue.verification_status;
  const tone = vs === 'VERIFIED' ? 'success' : vs === 'REJECTED' ? 'danger' : 'warning';
  const icon = vs === 'VERIFIED' ? 'ph-check-circle' : vs === 'REJECTED' ? 'ph-arrow-counter-clockwise' : 'ph-hourglass-medium';
  const toneStyle = {
    success: { background: 'rgba(34,197,94,0.1)', color: 'var(--tm-success)' },
    danger: { background: 'rgba(239,68,68,0.1)', color: 'var(--tm-danger)' },
    warning: { background: 'rgba(249,115,22,0.1)', color: 'var(--tm-warning)' },
  }[tone];
  return (
    <div id="tm-verification-banner" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 8, ...toneStyle }}>
      <i className={`ph ${icon}`} style={{ fontSize: 20, flexShrink: 0 }}></i>
      <div>
        <strong>{formatVerification(vs)}</strong>
        {issue.verification_note && <div style={{ fontSize: 13, marginTop: 2, color: 'var(--text-main)' }}>{issue.verification_note}</div>}
        {issue.verified_by_name && (
          <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>
            by {issue.verified_by_name}{issue.verified_at ? ` · ${formatDateTime(issue.verified_at)}` : ''}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Modal body. Re-mounted (via `key`) whenever an issue is opened or refreshed,
 * which resets every input exactly like the original openIssueDetail().
 */
function IssueDetailBody({ issue, activeTab, setActiveTab, refresh, showToast }) {
  const { user } = useAuth();
  const pct = issue.progress_percentage || 0;
  const isTerminal = ['RESOLVED', 'CLOSED', 'ESCALATED'].includes(issue.status);
  const isVerified = issue.verification_status === 'VERIFIED';
  const canSubmitForVerification = issue.status === 'RESOLVED' && !isVerified && issue.verification_status !== 'PENDING_VERIFICATION';

  const [status, setStatus] = useState(issue.status);
  const [progress, setProgress] = useState(pct);
  const [progressNote, setProgressNote] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const [resolution, setResolution] = useState('');
  const [submitNote, setSubmitNote] = useState('');
  const [comment, setComment] = useState('');
  const [note, setNote] = useState('');
  const [attachKind, setAttachKind] = useState('SCREENSHOT');
  const [pendingFile, setPendingFile] = useState(null);
  const [previews, setPreviews] = useState({});

  const fileInputRef = useRef(null);
  const resolutionRef = useRef(null);
  const commentsRef = useRef(null);

  // Conversation stays scrolled to the newest message.
  useEffect(() => {
    if (commentsRef.current) commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
  }, [issue.comments, activeTab]);

  useEffect(() => {
    if (showResolve) resolutionRef.current?.focus();
  }, [showResolve]);

  const act = async (fn, success, failure) => {
    try {
      await fn();
      if (success) showToast(success);
      await refresh();
    } catch (e) {
      showToast(e.message || failure, 'error');
    }
  };

  const update = () =>
    act(async () => {
      if (status !== issue.status) await tm.updateMyIssueStatus(issue.ticket_id, status);
      if (Number(progress) !== pct) await tm.updateMyIssueProgress(issue.ticket_id, Number(progress), progressNote.trim() || undefined);
    }, 'Issue updated.', 'Failed to update issue.');

  const confirmResolve = () => {
    const notes = resolution.trim();
    if (!notes) {
      showToast('Describe how the issue was resolved.', 'error');
      return;
    }
    act(() => tm.resolveMyIssue(issue.ticket_id, notes), 'Issue marked as resolved.', 'Failed to resolve issue.');
  };

  const submitVerification = () =>
    act(() => tm.submitMyIssueForVerification(issue.ticket_id, submitNote.trim() || undefined), 'Sent to the Platform Admin for verification.', 'Failed to send for verification.');

  const send = () => {
    const message = comment.trim();
    if (!message) {
      showToast('Write a message first.', 'error');
      return;
    }
    act(() => tm.addMyIssueComment(issue.ticket_id, message), null, 'Failed to send message.');
  };

  const addNote = () => {
    const message = note.trim();
    if (!message) {
      showToast('Write a technical note first.', 'error');
      return;
    }
    act(() => tm.addMyIssueWorkNote(issue.ticket_id, message), null, 'Failed to add note.');
  };

  const upload = async () => {
    if (!pendingFile) return;
    if (pendingFile.size > 5 * 1024 * 1024) {
      showToast('Attachments must be 5 MB or smaller.', 'error');
      return;
    }
    await act(async () => {
      const data_url = await readFileAsDataUrl(pendingFile);
      await tm.uploadMyIssueAttachment(issue.ticket_id, {
        file_name: pendingFile.name,
        file_type: pendingFile.type || 'application/octet-stream',
        file_size: pendingFile.size,
        kind: attachKind,
        data_url,
      });
    }, 'Attachment uploaded.', 'Failed to upload attachment.');
  };

  const togglePreview = async (attachmentId) => {
    if (previews[attachmentId]) {
      setPreviews((p) => ({ ...p, [attachmentId]: null }));
      return;
    }
    try {
      const full = await tm.getMyIssueAttachment(issue.ticket_id, attachmentId);
      let preview;
      if (full.data_url && (full.file_type || '').startsWith('image/')) {
        preview = <img className="attachment-preview" src={full.data_url} alt={full.file_name} />;
      } else if (full.data_url) {
        preview = <div className="form-hint" style={{ marginTop: 8 }}><i className="ph ph-check"></i> File ready - use the browser&apos;s own download tools to save it locally.</div>;
      } else {
        preview = <div className="form-hint" style={{ marginTop: 8 }}><i className="ph ph-warning"></i> No preview available for this attachment.</div>;
      }
      setPreviews((p) => ({ ...p, [attachmentId]: preview }));
    } catch (e) {
      showToast(e.message || 'Failed to load attachment.', 'error');
    }
  };

  const removeAttachment = (attachmentId) => {
    if (!window.confirm('Remove this attachment?')) return;
    act(() => tm.deleteMyIssueAttachment(issue.ticket_id, attachmentId), 'Attachment removed.', 'Failed to remove attachment.');
  };

  const comments = issue.comments || [];
  const notes = issue.internal_notes || [];
  const attachments = issue.attachments || [];
  const timeline = timelineEntries(issue);

  return (
    <>
      <VerificationBanner issue={issue} />

      <div className="detail-grid" id="tm-detail-info" style={{ marginBottom: 16 }}>
        <div className="detail-item"><span className="detail-label">Company</span><span className="detail-value">{issue.company_name}</span></div>
        <div className="detail-item"><span className="detail-label">Category</span><span className="detail-value">{issue.category}</span></div>
        <div className="detail-item"><span className="detail-label">Raised By</span><span className="detail-value">{issue.raised_by_name}</span></div>
        <div className="detail-item"><span className="detail-label">Status</span><span className={`badge ${statusBadgeClass(issue.status)}`}>{formatStatus(issue.status)}</span></div>
        <div className="detail-item"><span className="detail-label">Priority</span><span className={`badge ${priorityBadgeClass(issue.priority)}`}>{issue.priority}</span></div>
        <div className="detail-item"><span className="detail-label">Assigned By</span><span className="detail-value">{issue.platform_admin_name || '-'}</span></div>
        <div className="detail-item"><span className="detail-label">Created</span><span className="detail-value">{formatDate(issue.created_date)}</span></div>
        <div className="detail-item"><span className="detail-label">Last Updated</span><span className="detail-value">{formatDate(issue.updated_date)}</span></div>
      </div>
      <div className="detail-item" style={{ marginBottom: 16 }}>
        <span className="detail-label">Description</span>
        <span className="detail-value" id="tm-d-description">{issue.description || 'No description provided.'}</span>
      </div>

      <div className="detail-item" style={{ marginBottom: 16 }}>
        <span className="detail-label">Progress</span>
        <ProgressBar value={pct} fillId="tm-progress-fill" pctId="tm-progress-pct" />
      </div>

      <div id="tm-controls-section" style={{ display: isTerminal ? 'none' : 'block' }}>
        <div className="form-section-title">Investigation Controls</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" id="tm-d-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Progress: <span id="tm-slider-value">{progress}</span>%</label>
            <input type="range" className="progress-slider" id="tm-d-progress" min="0" max="100" step="5" value={progress} onChange={(e) => setProgress(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Progress note (optional)</label>
          <input type="text" className="form-control" id="tm-d-progress-note" placeholder="What changed since the last update?" value={progressNote} onChange={(e) => setProgressNote(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10, margin: '4px 0 20px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" id="tm-btn-update" onClick={update}><i className="ph ph-check-circle"></i> Update Status / Progress</button>
          <button type="button" className="btn btn-primary" id="tm-btn-resolve" onClick={() => setShowResolve(true)}><i className="ph ph-flag-checkered"></i> Mark as Resolved</button>
        </div>
      </div>

      <div id="tm-resolve-form" style={{ display: showResolve ? 'block' : 'none', marginBottom: 20 }}>
        <div className="form-section-title">Resolution</div>
        <div className="form-group">
          <label className="form-label">Resolution notes</label>
          <textarea ref={resolutionRef} className="form-control" id="tm-d-resolution" rows="3" placeholder="Describe what was done to resolve this issue..." value={resolution} onChange={(e) => setResolution(e.target.value)}></textarea>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-primary" id="tm-btn-confirm-resolve" onClick={confirmResolve}><i className="ph ph-check-circle"></i> Confirm Resolution</button>
          <button type="button" className="btn btn-outline" id="tm-btn-cancel-resolve" onClick={() => setShowResolve(false)}>Cancel</button>
        </div>
      </div>

      <div id="tm-submit-section" style={{ display: canSubmitForVerification ? 'block' : 'none', marginBottom: 20 }}>
        <div className="form-hint" style={{ marginTop: 0 }}><i className="ph ph-info"></i> This issue is resolved. Send it back to the Platform Admin for verification.</div>
        <div className="form-group">
          <textarea className="form-control" id="tm-d-submit-note" rows="2" placeholder="Note for the Platform Admin (optional)..." value={submitNote} onChange={(e) => setSubmitNote(e.target.value)}></textarea>
        </div>
        <button type="button" className="btn btn-primary" id="tm-btn-submit-verification" onClick={submitVerification}><i className="ph ph-paper-plane-tilt"></i> Send for Verification</button>
      </div>

      <div className="msg-tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={cx('msg-tab', activeTab === t.key && 'active')} onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className={cx('msg-pane', activeTab === 'conversation' && 'active')} id="tm-pane-conversation">
        <div id="tm-detail-comments" ref={commentsRef} style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
          {comments.length === 0 ? (
            <div className="empty-state" style={{ padding: 16 }}><i className="ph ph-chat-circle-dots"></i> No messages yet.</div>
          ) : (
            comments.map((c, i) => (
              <div key={i} className="comment-item">
                <span className="comment-author">{c.author}</span>
                <span className="comment-time">{formatDateTime(c.timestamp)}</span>
                <div className="comment-message">{c.message}</div>
              </div>
            ))
          )}
        </div>
        <div className="form-group">
          <textarea className="form-control" id="tm-d-comment" rows="2" placeholder="Message the Platform Admin..." value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
        </div>
        <button type="button" className="btn btn-primary" id="tm-btn-send" onClick={send}><i className="ph ph-paper-plane-tilt"></i> Send</button>
      </div>

      <div className={cx('msg-pane', activeTab === 'notes' && 'active')} id="tm-pane-notes">
        <div className="form-hint"><i className="ph ph-eye-slash"></i> Technical notes are internal - never visible to the company that raised this issue.</div>
        <div id="tm-detail-notes" style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
          {notes.length === 0 ? (
            <div className="empty-state" style={{ padding: 16 }}><i className="ph ph-note"></i> No technical notes yet.</div>
          ) : (
            notes.map((n, i) => (
              <div key={i} className="comment-item internal">
                <span className="comment-author">{n.author}<span className="sender-tag">Internal</span></span>
                <span className="comment-time">{formatDateTime(n.timestamp)}</span>
                <div className="comment-message">{n.message}</div>
              </div>
            ))
          )}
        </div>
        <div className="form-group">
          <textarea className="form-control" id="tm-d-note" rows="2" placeholder="Add a technical note..." value={note} onChange={(e) => setNote(e.target.value)}></textarea>
        </div>
        <button type="button" className="btn btn-outline" id="tm-btn-add-note" onClick={addNote}><i className="ph ph-note-pencil"></i> Add Note</button>
      </div>

      <div className={cx('msg-pane', activeTab === 'attachments' && 'active')} id="tm-pane-attachments">
        <div id="tm-attachment-list" className="attachment-list">
          {attachments.length === 0 ? (
            <div className="empty-state" style={{ padding: 16 }}><i className="ph ph-paperclip"></i> No attachments yet.</div>
          ) : (
            attachments.map((a) => (
              <Fragment key={a.attachment_id}>
                <div className="attachment-item">
                  <div className={`attachment-icon ${a.kind === 'LOG' ? 'log' : ''}`}><i className={`ph ${attachmentIcon(a.kind)}`}></i></div>
                  <div className="attachment-meta">
                    <div className="attachment-name">{a.file_name}</div>
                    <div className="attachment-sub">{formatBytes(a.file_size)} &middot; {a.uploaded_by_name || 'Unknown'} &middot; {formatDateTime(a.uploaded_at)}</div>
                  </div>
                  <div className="row-actions">
                    <button type="button" className="icon-btn" title="View" onClick={() => togglePreview(a.attachment_id)}><i className="ph ph-eye"></i></button>
                    {a.uploaded_by === user.emp_id && (
                      <button type="button" className="icon-btn danger" title="Remove" onClick={() => removeAttachment(a.attachment_id)}><i className="ph ph-trash"></i></button>
                    )}
                  </div>
                </div>
                <div id={`tm-attach-preview-${a.attachment_id}`}>{previews[a.attachment_id]}</div>
              </Fragment>
            ))
          )}
        </div>
        <div className="attach-row">
          <select className="filter-select" id="tm-attach-kind" style={{ padding: '8px 12px' }} value={attachKind} onChange={(e) => setAttachKind(e.target.value)}>
            <option value="SCREENSHOT">Screenshot</option>
            <option value="LOG">Log File</option>
            <option value="OTHER">Other</option>
          </select>
          <button type="button" className="btn btn-outline" id="tm-btn-attach" onClick={() => fileInputRef.current?.click()}><i className="ph ph-upload"></i> Choose File</button>
          <span className="attach-chip" id="tm-attach-chip" style={{ display: pendingFile ? 'inline-flex' : 'none' }}>
            <i className="ph ph-file"></i> <span id="tm-attach-name">{pendingFile?.name}</span>
          </span>
          <input type="file" id="tm-attach-input" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,.log,.txt" onChange={(e) => setPendingFile(e.target.files[0] || null)} />
          <button type="button" className="btn btn-primary" id="tm-btn-upload" disabled={!pendingFile} onClick={upload}><i className="ph ph-cloud-arrow-up"></i> Upload</button>
        </div>
        <div className="form-hint"><i className="ph ph-info"></i> Screenshots and log files up to 5 MB.</div>
      </div>

      <div className={cx('msg-pane', activeTab === 'timeline' && 'active')} id="tm-pane-timeline">
        <div id="tm-detail-timeline" className="timeline">
          {timeline.length === 0 ? (
            <div className="empty-state" style={{ padding: 16 }}><i className="ph ph-clock-counter-clockwise"></i> No progress recorded yet.</div>
          ) : (
            timeline.map((e, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-body">
                  <div className="timeline-title"><i className={`ph ${e.icon}`}></i> {e.title}</div>
                  {e.sub && <div className="timeline-sub">{e.sub}</div>}
                  {e.actor && <div className="timeline-sub">{e.actor}</div>}
                </div>
                <div className="timeline-time">{formatDateTime(e.timestamp)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

/**
 * const { openIssue, issueModal } = useIssueDetail({ onChanged, showToast });
 * onChanged(updatedIssue) runs after every successful action, so the page can
 * reload its list (the modal stays open on the refreshed issue).
 */
export default function useIssueDetail({ onChanged, showToast }) {
  const [current, setCurrent] = useState(null);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('conversation');
  const [version, setVersion] = useState(0);

  const openIssue = (issue) => {
    // A different issue starts on Conversation; reopening the same one keeps the tab.
    if (!current || current.ticket_id !== issue.ticket_id) setActiveTab('conversation');
    setCurrent(issue);
    setVersion((v) => v + 1);
    setOpen(true);
  };

  const refresh = async () => {
    const updated = await tm.getMyTechnicalIssueById(current.ticket_id);
    setCurrent(updated);
    setVersion((v) => v + 1);
    onChanged?.(updated);
  };

  const issueModal = (
    <SaModal
      id="tm-issue-modal"
      open={open}
      onClose={() => setOpen(false)}
      title={current ? `${current.ticket_id} - ${current.title}` : 'Issue Details'}
      titleId="tm-detail-title"
      maxWidth="780px"
    >
      {current && (
        <IssueDetailBody
          key={`${current.ticket_id}-${version}`}
          issue={current}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          refresh={refresh}
          showToast={showToast}
        />
      )}
    </SaModal>
  );

  return { openIssue, issueModal };
}
