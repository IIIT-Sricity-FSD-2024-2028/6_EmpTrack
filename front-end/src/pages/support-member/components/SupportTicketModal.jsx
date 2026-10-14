// Ticket detail modal from front-end/js/views/support_member/_board.js.
// Unassigned tickets are claim-only; once claimed the Support Member can update
// status/priority/category, reply, add internal notes, resolve / reopen / close,
// and escalate to the Technical Team or the Platform Admin.
import { useEffect, useState } from 'react';
import Modal from '../../../components/common/Modal';
import { formatDate, formatStatus, isClosedStatus, priorityBadge, supportTicketBadge } from '../../../components/platform/format';
import { DetailItem, modalClass } from '../../../components/platform/ShellUI';
import { CommentList, ConfirmDialog } from '../../../components/platform/TicketParts';
import useFetch from '../../../hooks/useFetch';
import { cx } from '../../../utils/helpers';
import {
  addInternalNote, addMessage, changeCategory, changePriority, changeStatus, claimTicket, closeTicket, escalateToPlatformAdmin,
  escalateToTechnicalTeam, getCategories, getCompanySummary, getLinkedTechnicalTicket, getTicket, reopenTicket, resolveTicket,
} from '../../../services/supportMemberService';

const EDITABLE_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function CompanyPanel({ companyId }) {
  const { data: c } = useFetch(() => getCompanySummary(companyId), [companyId]);
  if (!c) return null; // the original hid the panel when the lookup failed
  return (
    <div className="company-panel">
      <div className="company-panel-title"><i className="ph ph-buildings"></i> Company Information</div>
      <div className="detail-grid">
        <DetailItem label="Company">{c.company_name}</DetailItem>
        <DetailItem label="Company ID">{c.company_id}</DetailItem>
        <DetailItem label="Assigned Platform Admin">{c.assigned_platform_admin || '-'}</DetailItem>
        <DetailItem label="Company Admin">{c.company_admin || '-'}</DetailItem>
        <DetailItem label="Subscription">{c.subscription_plan || '-'}</DetailItem>
        <DetailItem label="Employee Count">{c.employee_count}</DetailItem>
      </div>
    </div>
  );
}

function LinkedTechnicalTicket({ id }) {
  const { data: linked } = useFetch(() => getLinkedTechnicalTicket(id), [id]);
  if (!linked) return null;
  return (
    <div className="form-hint" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
      <i className="ph ph-link"></i> Escalated as Technical Ticket <strong>{linked.ticket_id}</strong> &middot;
      Status: <span className={`badge ${supportTicketBadge(linked.status)}`}>{formatStatus(linked.status)}</span> &middot;
      Assigned To: {linked.assigned_to_name || 'Unassigned'}
    </div>
  );
}

/**
 * ticket: the ticket to show (null = closed). onClose(). onChanged(updated) after
 * any successful action, so the page can reload its lists. showToast(message, type).
 */
export default function SupportTicketModal({ ticket: initial, onClose, onChanged, showToast }) {
  const [ticket, setTicket] = useState(initial);
  const { data: categories } = useFetch(() => getCategories().catch(() => []), []);
  const [controls, setControls] = useState({ status: 'OPEN', priority: 'LOW', category: '' });
  const [tab, setTab] = useState('conversation');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [dialog, setDialog] = useState(null); // 'resolve' | 'reopen' | 'close' | 'esc-tech' | 'esc-admin'
  const [dialogText, setDialogText] = useState('');
  const [busy, setBusy] = useState(false);

  const sync = (t) => {
    setTicket(t);
    if (!t) return;
    setControls({
      status: EDITABLE_STATUSES.includes(t.status) ? t.status : 'OPEN',
      priority: (t.priority || 'LOW').toUpperCase(),
      category: t.category,
    });
  };

  // Reset everything when a different ticket is opened.
  useEffect(() => {
    sync(initial);
    setTab('conversation');
    setMessage('');
    setNote('');
    setAttachment(null);
    setDialog(null);
  }, [initial]);

  if (!ticket) return null;

  const isUnassigned = !ticket.assigned_to;
  const isTerminal = isClosedStatus(ticket.status);
  const isEscalated = ticket.status === 'ESCALATED';
  const categoryOptions = categories?.length ? categories : [ticket.category];

  /** Runs an action, then reloads the ticket and notifies the page. */
  const run = async (action, success, after) => {
    setBusy(true);
    try {
      await action();
      after?.();
      const updated = await getTicket(ticket.ticket_id);
      sync(updated);
      onChanged?.(updated);
      if (success) showToast(success);
      return true;
    } catch (err) {
      showToast(err.message || 'Something went wrong.', 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const id = ticket.ticket_id;

  const handleUpdate = () => run(async () => {
    // Only the fields that changed are sent, each to its own endpoint (as in the original).
    if (controls.status !== ticket.status) await changeStatus(id, controls.status);
    if (controls.priority !== (ticket.priority || '').toUpperCase()) await changePriority(id, controls.priority);
    if (controls.category !== ticket.category) await changeCategory(id, controls.category);
  }, 'Ticket updated.');

  const handleSend = () => {
    if (!message.trim()) return showToast('Write a response first.', 'error');
    return run(() => addMessage(id, message.trim()), null, () => {
      setMessage('');
      setAttachment(null);
    });
  };

  const handleAddNote = () => {
    if (!note.trim()) return showToast('Write an internal note first.', 'error');
    return run(() => addInternalNote(id, note.trim()), null, () => setNote(''));
  };

  const openDialog = (kind) => {
    setDialogText('');
    setDialog(kind);
  };

  // Escalations take the Internal Notes box as their note, like the original.
  const escalationNote = note.trim() || undefined;
  const dialogs = {
    resolve: {
      title: 'Resolve Ticket?', label: 'Resolve Ticket', variant: 'success', icon: 'ph-check-fat',
      message: <>Are you sure you want to mark <strong>{id}</strong> as resolved?</>,
      field: { label: 'Resolution note (optional)', placeholder: 'Briefly describe how the issue was resolved...' },
      action: () => resolveTicket(id, dialogText.trim() || undefined), success: `Ticket ${id} has been resolved successfully.`,
    },
    reopen: {
      title: 'Reopen Ticket', label: 'Reopen', variant: 'primary', icon: 'ph-arrow-counter-clockwise',
      message: 'Why are you reopening this ticket?',
      field: { label: 'Reason (optional)', placeholder: 'Reason for reopening...' },
      action: () => reopenTicket(id, dialogText.trim() || undefined), success: 'Ticket reopened.',
    },
    close: {
      title: 'Close Ticket', label: 'Close Ticket', variant: 'danger', message: 'Close this ticket? It must already be resolved.',
      action: () => closeTicket(id), success: 'Ticket closed.',
    },
    'esc-tech': {
      title: 'Escalate to Technical Team', label: 'Escalate', variant: 'danger', message: 'Escalate this ticket to the Technical Team?',
      action: () => escalateToTechnicalTeam(id, escalationNote), success: 'Escalated to the Technical Team.', after: () => setNote(''),
    },
    'esc-admin': {
      title: 'Escalate to Platform Admin', label: 'Escalate', variant: 'danger', message: 'Escalate this ticket to the Platform Admin?',
      action: () => escalateToPlatformAdmin(id, escalationNote), success: 'Escalated to the Platform Admin.', after: () => setNote(''),
    },
  };
  const active = dialog && dialogs[dialog];

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        title={`${id} - ${ticket.title}`}
        maxWidth="760px"
        className={modalClass('sm')}
        footer={<button type="button" className="btn btn-outline" onClick={onClose}>Close</button>}
      >
        <CompanyPanel companyId={ticket.company_id} />

        <div className="detail-grid" style={{ marginBottom: 16 }}>
          <DetailItem label="Raised By">{ticket.raised_by_name}</DetailItem>
          <DetailItem label="Email">{ticket.raised_by_email || '-'}</DetailItem>
          <DetailItem label="Status"><span className={`badge ${supportTicketBadge(ticket.status)}`}>{formatStatus(ticket.status)}</span></DetailItem>
          <DetailItem label="Priority"><span className={`badge ${priorityBadge(ticket.priority)}`}>{ticket.priority}</span></DetailItem>
          <DetailItem label="Assigned To">{ticket.assigned_to_name || 'Unassigned'}</DetailItem>
          <DetailItem label="Created">{formatDate(ticket.created_date)}</DetailItem>
          <DetailItem label="Last Updated">{formatDate(ticket.updated_date)}</DetailItem>
        </div>
        <div style={{ marginBottom: 16 }}>
          <DetailItem label="Description">{ticket.description || 'No description provided.'}</DetailItem>
        </div>

        {isUnassigned ? (
          <>
            <div className="action-row">
              <button type="button" className="btn btn-outline" disabled={busy} onClick={() => run(() => claimTicket(id), 'Ticket claimed.')}>
                <i className="ph ph-hand-pointing"></i> Claim Ticket
              </button>
            </div>
            <div className="form-hint"><i className="ph ph-info"></i> This ticket is unassigned. Claim it to reply, update, resolve, or escalate it.</div>
          </>
        ) : (
          <>
            <div className="form-section-title">Ticket Controls</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="sm-status">Status</label>
                <select id="sm-status" className="form-control" value={controls.status} onChange={(e) => setControls((c) => ({ ...c, status: e.target.value }))}>
                  {EDITABLE_STATUSES.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sm-priority">Priority</label>
                <select id="sm-priority" className="form-control" value={controls.priority} onChange={(e) => setControls((c) => ({ ...c, priority: e.target.value }))}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sm-category">Category</label>
                <select id="sm-category" className="form-control" value={controls.category} onChange={(e) => setControls((c) => ({ ...c, category: e.target.value }))}>
                  {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="action-row" style={{ margin: '12px 0 20px' }}>
              {!isTerminal && <button type="button" className="btn btn-secondary" disabled={busy} onClick={handleUpdate}><i className="ph ph-check-circle"></i> Update Status / Priority / Category</button>}
              {!isTerminal && <button type="button" className="btn btn-success" disabled={busy} onClick={() => openDialog('resolve')}><i className="ph ph-check-fat"></i> Resolve</button>}
              {isTerminal && <button type="button" className="btn btn-outline" disabled={busy} onClick={() => openDialog('reopen')}><i className="ph ph-arrow-counter-clockwise"></i> Reopen</button>}
              {ticket.status === 'RESOLVED' && <button type="button" className="btn btn-outline" disabled={busy} onClick={() => openDialog('close')}><i className="ph ph-x-circle"></i> Close Ticket</button>}
              {!isTerminal && (
                <>
                  <button type="button" className="btn btn-danger" disabled={busy || isEscalated} onClick={() => openDialog('esc-tech')}><i className="ph ph-hard-drives"></i> Escalate to Technical Team</button>
                  <button type="button" className="btn btn-danger" disabled={busy || isEscalated} onClick={() => openDialog('esc-admin')}><i className="ph ph-shield-star"></i> Escalate to Platform Admin</button>
                </>
              )}
            </div>

            {ticket.linked_technical_ticket_id && <LinkedTechnicalTicket id={ticket.linked_technical_ticket_id} />}

            <div className="msg-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'conversation'} className={cx('msg-tab', tab === 'conversation' && 'active')} onClick={() => setTab('conversation')}>Conversation</button>
              <button type="button" role="tab" aria-selected={tab === 'notes'} className={cx('msg-tab', tab === 'notes' && 'active')} onClick={() => setTab('notes')}>Internal Notes</button>
            </div>

            {tab === 'conversation' ? (
              <div role="tabpanel">
                <CommentList items={ticket.comments} emptyText="No messages yet." />
                <div className="form-group">
                  <textarea className="form-control" rows={2} placeholder="Write your response..." aria-label="Write your response" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
                <div className="attach-row">
                  <label className="btn btn-outline" style={{ marginBottom: 0 }}>
                    <i className="ph ph-paperclip"></i> Attach File
                    <input type="file" hidden onChange={(e) => setAttachment(e.target.files[0] || null)} />
                  </label>
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={handleSend}><i className="ph ph-paper-plane-tilt"></i> Send</button>
                  {attachment && (
                    <span className="attach-chip" title="There is no upload endpoint for support tickets, so the file is not sent.">
                      <i className="ph ph-file"></i> {attachment.name} (preview only - not uploaded)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div role="tabpanel">
                <div className="form-hint"><i className="ph ph-eye-slash"></i> Internal notes are never visible to the Company Admin.</div>
                <CommentList items={ticket.internal_notes} internal emptyIcon="ph-note" emptyText="No internal notes yet." />
                <div className="form-group">
                  <textarea className="form-control" rows={2} placeholder="Add an internal note..." aria-label="Add an internal note" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <button type="button" className="btn btn-outline" disabled={busy} onClick={handleAddNote}><i className="ph ph-note-pencil"></i> Add Internal Note</button>
              </div>
            )}
          </>
        )}
      </Modal>

      <ConfirmDialog
        portal="sm"
        isOpen={Boolean(active)}
        title={active?.title}
        message={active?.message}
        confirmLabel={active?.label}
        confirmVariant={active?.variant}
        confirmIcon={active?.icon}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          if (await run(active.action, active.success, active.after)) setDialog(null);
        }}
      >
        {active?.field && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="sm-dialog-text">{active.field.label}</label>
            <textarea id="sm-dialog-text" className="form-control" rows={3} placeholder={active.field.placeholder} value={dialogText} onChange={(e) => setDialogText(e.target.value)} />
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
