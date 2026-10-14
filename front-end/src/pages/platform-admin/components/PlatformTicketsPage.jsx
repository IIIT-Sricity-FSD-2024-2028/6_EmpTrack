// Shared by SupportTickets.jsx and TechnicalIssues.jsx - converted from
// front-end/platform_admin/{support-tickets,technical-issues}.html + their view
// scripts. Same workflow for both; technical issues add the Verify & Close /
// Send Back for Rework step for work a Technical Member submitted.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../../../components/common/Modal';
import { formatDate, formatPlatformStatus, platformTicketBadge, priorityBadge } from '../../../components/platform/format';
import { ClearButton, DetailItem, FilterSelect, modalClass, PortalShell, SectionHeader, ShellTable, useToast } from '../../../components/platform/ShellUI';
import { CommentList, ConfirmDialog } from '../../../components/platform/TicketParts';
import useFetch from '../../../hooks/useFetch';
import {
  addTicketComment, assignTicket, escalateTicket, getTeam, getTicket, getTickets, IS_DEMO, reassignTicket,
  rejectTechnicalIssueVerification, resolveTicket, verifyTechnicalIssue,
} from '../../../services/platformAdminService';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'RESOLVED', label: 'Resolved' },
];
const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

const VERIFICATION = {
  PENDING_VERIFICATION: { label: 'Awaiting Your Verification', tone: 'warning', icon: 'ph-hourglass-medium' },
  VERIFIED: { label: 'Verified', tone: 'success', icon: 'ph-check-circle' },
  REJECTED: { label: 'Sent Back for Rework', tone: 'danger', icon: 'ph-arrow-counter-clockwise' },
};

const TEXT = {
  SUPPORT: { noun: 'support ticket', Noun: 'Support ticket', plural: 'support tickets', heading: 'Support Tickets From My Companies', team: 'SUPPORT_MEMBER' },
  TECHNICAL: { noun: 'technical issue', Noun: 'Technical issue', plural: 'technical issues', heading: 'Technical Issues From My Companies', team: 'TECHNICAL_MEMBER' },
};

function StatusBadge({ status }) {
  return <span className={`badge ${platformTicketBadge(status)}`}>{formatPlatformStatus(status)}</span>;
}

/** type: 'SUPPORT' | 'TECHNICAL' */
export default function PlatformTicketsPage({ type, title }) {
  const text = TEXT[type];
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const { data: tickets, loading, error, reload } = useFetch(() => getTickets(type, { status, priority }), [type, status, priority]);
  // Active members of the matching team, with their workload, for the assignee picker.
  const { data: members, reload: reloadMembers } = useFetch(() => getTeam(text.team, { status: 'ACTIVE' }).catch(() => []), [type]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [ticket, setTicket] = useState(null); // ticket shown in the detail modal
  const [assignee, setAssignee] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [verifyNote, setVerifyNote] = useState('');
  const [pending, setPending] = useState(null); // confirmation: 'resolve' | 'escalate' | 'verify' | 'reject'
  const [busy, setBusy] = useState(false);
  const [toast, showToast] = useToast();

  const openDetail = (t) => {
    setTicket(t);
    setAssignee(t.assigned_to || '');
    setShowReason(false);
    setReason('');
    setComment('');
    setVerifyNote('');
  };

  // Deep link from a notification's "View Issue" link (?open=TIX-...).
  const openId = searchParams.get('open');
  useEffect(() => {
    if (!openId || !tickets) return;
    const match = tickets.find((t) => t.ticket_id === openId);
    if (match) openDetail(match);
    setSearchParams((params) => {
      params.delete('open');
      return params;
    }, { replace: true });
  }, [openId, tickets, setSearchParams]);

  // Default the picker to the first member when the ticket is unassigned (the
  // original <select> had no empty option, so the first member was preselected).
  const assigneeValue = assignee || members?.[0]?.emp_id || '';

  /** Runs an action, then refreshes the open ticket, the table and the workload counts. */
  const run = async (action, success, after) => {
    setBusy(true);
    try {
      await action();
      showToast(success);
      after?.();
      const updated = await getTicket(type, ticket.ticket_id);
      setTicket(updated);
      setAssignee(updated.assigned_to || '');
      reload();
      reloadMembers();
      return true;
    } catch (err) {
      showToast(err.message || 'Something went wrong.', 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = () => {
    if (!assigneeValue) return showToast('Select a team member first.', 'error');
    return run(() => assignTicket(type, ticket.ticket_id, assigneeValue), `${text.Noun} assigned successfully.`);
  };

  const handleReassign = () => {
    if (!showReason) return setShowReason(true);
    if (!assigneeValue || !reason.trim()) return showToast('Select a member and enter a reassignment reason.', 'error');
    return run(() => reassignTicket(type, ticket.ticket_id, assigneeValue, reason.trim()), `${text.Noun} reassigned successfully.`, () => {
      setShowReason(false);
      setReason('');
    });
  };

  const handleComment = () => {
    if (!comment.trim()) return showToast('Enter a comment first.', 'error');
    return run(() => addTicketComment(type, ticket.ticket_id, comment.trim()), 'Comment added.', () => setComment(''));
  };

  const handleRejectClick = () => {
    if (!verifyNote.trim()) return showToast('Explain what needs rework first.', 'error');
    return setPending('reject');
  };

  // Resolve / Escalate send the comment box as the note, like the original.
  const confirmations = {
    resolve: {
      title: `Resolve ${text.Noun}`, message: `Mark this ${text.noun} as resolved?`, label: 'Resolve', variant: 'secondary',
      action: () => resolveTicket(type, ticket.ticket_id, comment.trim() || undefined), success: `${text.Noun} resolved successfully.`, after: () => setComment(''),
    },
    escalate: {
      title: 'Escalate to Super Admin', message: `Escalate this ${text.noun} to the Super Admin?`, label: 'Escalate', variant: 'danger',
      action: () => escalateTicket(type, ticket.ticket_id, comment.trim() || undefined), success: `${text.Noun} escalated to the Super Admin.`, after: () => setComment(''),
    },
    verify: {
      title: 'Verify & Close', message: 'Verify this resolution and close the issue?', label: 'Verify & Close', variant: 'secondary',
      action: () => verifyTechnicalIssue(ticket.ticket_id, verifyNote.trim() || undefined), success: 'Issue verified and closed.', after: () => setVerifyNote(''),
    },
    reject: {
      title: 'Send Back for Rework', message: 'Send this issue back to the Technical Member for rework?', label: 'Send Back', variant: 'danger',
      action: () => rejectTechnicalIssueVerification(ticket.ticket_id, verifyNote.trim()), success: 'Sent back for rework.', after: () => setVerifyNote(''),
    },
  };
  const confirm = pending && confirmations[pending];

  const columns = [
    { key: 'ticket_id', header: 'Ticket ID' },
    { key: 'company_name', header: 'Company' },
    { key: 'title', header: 'Title' },
    { key: 'priority', header: 'Priority', render: (t) => <span className={`badge ${priorityBadge(t.priority)}`}>{t.priority}</span> },
    { key: 'assigned', header: 'Assigned To', render: (t) => t.assigned_to_name || 'Unassigned' },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    { key: 'created', header: 'Created', render: (t) => formatDate(t.created_date) },
    {
      key: 'actions', header: 'Actions', align: 'right', render: (t) => (
        <div className="row-actions">
          <button type="button" className="icon-btn" title="View / Manage" aria-label={`View ${t.ticket_id}`} onClick={() => openDetail(t)}><i className="ph ph-eye"></i></button>
        </div>
      ),
    },
  ];

  const verification = ticket && VERIFICATION[ticket.verification_status];
  // reassign_log stores employee ids; inactive members are not in the picker list, so fall back to the id.
  const memberName = (id) => (id && (members ?? []).find((m) => m.emp_id === id)?.emp_name) || id;

  return (
    <PortalShell portal="pa" title={title} demo={IS_DEMO}>
      <SectionHeader title={text.heading} />

      <div className="card filter-bar">
        <div className="filters-wrap">
          <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          <FilterSelect label="Priority" value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />
          <ClearButton onClick={() => { setStatus('all'); setPriority('all'); }} />
        </div>
      </div>

      <div className="card table-container">
        <ShellTable
          columns={columns}
          rows={tickets}
          rowKey="ticket_id"
          loading={loading}
          error={error && `Failed to load ${text.plural}.`}
          loadingText={`Loading ${text.plural}...`}
          emptyIcon="ph-bug"
          emptyText={`No ${text.plural} found.`}
        />
      </div>

      <Modal
        isOpen={Boolean(ticket)}
        onClose={() => setTicket(null)}
        title={ticket ? `${ticket.ticket_id} - ${ticket.title}` : ''}
        maxWidth="640px"
        className={modalClass('pa')}
        footer={<button type="button" className="btn btn-outline" onClick={() => setTicket(null)}>Close</button>}
      >
        {ticket && (
          <>
            {verification && (
              <div className={`verification-banner ${verification.tone}`}>
                <i className={`ph ${verification.icon}`}></i>
                <div>
                  <strong>{verification.label}</strong>
                  {ticket.verification_note && <div className="note">{ticket.verification_note}</div>}
                </div>
              </div>
            )}

            <div className="detail-grid" style={{ marginBottom: 16 }}>
              <DetailItem label="Company">{ticket.company_name}</DetailItem>
              <DetailItem label="Raised By">{ticket.raised_by_name}</DetailItem>
              <DetailItem label="Category">{ticket.category}</DetailItem>
              <DetailItem label="Status"><StatusBadge status={ticket.status} /></DetailItem>
              <DetailItem label="Description" full>{ticket.description || 'No description provided.'}</DetailItem>
              <DetailItem label="Created">{formatDate(ticket.created_date)}</DetailItem>
              <DetailItem label="Last Updated">{formatDate(ticket.updated_date)}</DetailItem>
            </div>

            <div className="form-section-title">Assign / Reassign</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="pa-assignee">Team Member</label>
                <select id="pa-assignee" className="form-control" value={assigneeValue} onChange={(e) => setAssignee(e.target.value)}>
                  {(members ?? []).length === 0 && <option value="">No active team members</option>}
                  {(members ?? []).map((m) => (
                    <option key={m.emp_id} value={m.emp_id}>{m.emp_name} (Open: {m.open_tickets}, In Progress: {m.in_progress_tickets})</option>
                  ))}
                </select>
              </div>
              {showReason && (
                <div className="form-group">
                  <label className="form-label" htmlFor="pa-reason">Reassignment Reason</label>
                  <input id="pa-reason" type="text" className="form-control" placeholder="Why is this being reassigned?" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
                </div>
              )}
            </div>
            <div className="action-row">
              <button type="button" className="btn btn-outline" onClick={handleAssign} disabled={busy}>Assign</button>
              <button type="button" className="btn btn-outline" onClick={handleReassign} disabled={busy}>Reassign</button>
              <button type="button" className="btn btn-secondary" onClick={() => setPending('resolve')} disabled={busy}>Resolve</button>
              <button type="button" className="btn btn-danger" onClick={() => setPending('escalate')} disabled={busy}>Escalate to Super Admin</button>
            </div>

            {type === 'TECHNICAL' && ticket.verification_status === 'PENDING_VERIFICATION' && (
              <div style={{ marginBottom: 16 }}>
                <div className="form-section-title">Verify Resolution</div>
                <div className="form-hint"><i className="ph ph-info"></i> The Technical Member marked this issue resolved and sent it back for your sign-off.</div>
                {ticket.resolution_notes && <div className="comment-item"><span className="comment-author">Resolution notes</span><div className="comment-message">{ticket.resolution_notes}</div></div>}
                <div className="form-group">
                  <label className="form-label" htmlFor="pa-verify-note">Note (optional for verify, required to send back)</label>
                  <textarea id="pa-verify-note" className="form-control" rows={2} placeholder="Add a note..." value={verifyNote} onChange={(e) => setVerifyNote(e.target.value)} />
                </div>
                <div className="action-row" style={{ marginBottom: 0 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setPending('verify')} disabled={busy}><i className="ph ph-check-circle"></i> Verify &amp; Close</button>
                  <button type="button" className="btn btn-danger" onClick={handleRejectClick} disabled={busy}><i className="ph ph-arrow-counter-clockwise"></i> Send Back for Rework</button>
                </div>
              </div>
            )}

            {ticket.reassign_log?.length > 0 && (
              <>
                <div className="form-section-title">Reassignment History</div>
                <CommentList
                  items={ticket.reassign_log.map((r) => ({
                    author: `${memberName(r.from) || 'Unassigned'} → ${memberName(r.to)}`,
                    message: r.reason,
                    timestamp: r.date,
                  }))}
                />
              </>
            )}

            <div className="form-section-title">Comments</div>
            <CommentList items={ticket.comments} emptyText="No comments yet." />
            <div className="form-group">
              <textarea className="form-control" rows={2} placeholder="Add a comment..." aria-label="Add a comment" value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            <button type="button" className="btn btn-outline" onClick={handleComment} disabled={busy}><i className="ph ph-chat-circle-text"></i> Add Comment</button>
          </>
        )}
      </Modal>

      <ConfirmDialog
        portal="pa"
        isOpen={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        confirmVariant={confirm?.variant}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (await run(confirm.action, confirm.success, confirm.after)) setPending(null);
        }}
      />
      {toast}
    </PortalShell>
  );
}
