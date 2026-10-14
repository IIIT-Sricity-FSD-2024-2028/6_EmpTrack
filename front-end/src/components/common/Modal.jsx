import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Controlled dialog using the original .modal-overlay / .modal classes.
 * Closes on Escape and backdrop click. maxWidth overrides the default 500px.
 * className is added to the overlay (the modal is portalled to <body>, so
 * page-scoped styles need a class on the overlay to reach it).
 */
export default function Modal({ isOpen, onClose, title, children, footer, maxWidth, className }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => event.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={className ? `modal-overlay active ${className}` : 'modal-overlay active'} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={maxWidth ? { maxWidth } : undefined}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <i className="ph ph-x"></i>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
