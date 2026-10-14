// Ticket pieces used by both portals: comment / internal-note lists and the
// confirmation dialog that replaces the original pages' window.confirm/prompt.
import { useState } from 'react';
import Modal from '../common/Modal';
import { cx } from '../../utils/helpers';
import { formatDateTime } from './format';
import { EmptyNote, modalClass } from './ShellUI';

/** items: [{ author, message, timestamp }]. internal: render as internal notes. */
export function CommentList({ items, internal, emptyText, emptyIcon = 'ph-chat-circle-dots' }) {
  if (!items || items.length === 0) return <div className="comment-list"><EmptyNote compact icon={emptyIcon} message={emptyText} /></div>;
  return (
    <div className="comment-list">
      {items.map((c, i) => (
        <div key={`${c.timestamp}-${i}`} className={cx('comment-item', internal && 'internal')}>
          <span className="comment-author">
            {c.author}
            {internal && <span className="sender-tag">Internal</span>}
          </span>
          <span className="comment-time">{formatDateTime(c.timestamp)}</span>
          <div className="comment-message">{c.message}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Confirmation step before a ticket action.
 * onConfirm may be async; the dialog stays open (buttons disabled) until it settles.
 * children: optional extra fields (e.g. a reason textarea).
 */
export function ConfirmDialog({ portal, isOpen, title, message, confirmLabel = 'Confirm', confirmVariant = 'danger', confirmIcon, onConfirm, onClose, children }) {
  const [busy, setBusy] = useState(false);
  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={busy ? undefined : onClose}
      title={title}
      maxWidth="440px"
      className={modalClass(portal)}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={`btn btn-${confirmVariant}`} onClick={handleConfirm} disabled={busy}>
            {confirmIcon && <i className={`ph ${confirmIcon}`}></i>} {busy ? 'Working...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-text">{message}</p>
      {children}
    </Modal>
  );
}
