import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal in the original sa-common markup (.modal-overlay with an id, toggled
 * with .active). Rendered into <body> like the original; closes on the backdrop,
 * the x / Close buttons and Escape. footer replaces the default Close button.
 */
export default function SaModal({ id, open, onClose, title, titleId, maxWidth, footer, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => event.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return createPortal(
    <div className={open ? 'modal-overlay active' : 'modal-overlay'} id={id} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} style={maxWidth ? { maxWidth } : undefined}>
        <div className="modal-header">
          <h3 className="modal-title" id={titleId}>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">{open && children}</div>
        <div className="modal-footer">
          {footer ?? <button type="button" className="btn btn-outline" onClick={onClose}>Close</button>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
