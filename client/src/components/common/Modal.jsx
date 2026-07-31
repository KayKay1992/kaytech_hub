import { useEffect } from 'react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

// Generic centered modal — backdrop click, Escape, or the X button close it.
// Locks page scroll while open. `size="lg"` widens it for forms with more
// fields (e.g. an image upload + several text inputs).
export default function Modal({ title, onClose, children, size }) {
  useBodyScrollLock(true);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal${size === 'lg' ? ' modal--lg' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{title}</h3>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
