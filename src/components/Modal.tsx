import { ReactNode, useEffect } from 'react';

interface ModalProps {
  title: string;
  onClose?: () => void;
  onBack?: () => void;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export function Modal({
  title,
  onClose,
  onBack,
  children,
  width = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!onClose) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className={`modal modal--${width}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={`modal__header ${onBack ? 'modal__header--with-back' : ''}`}>
          {onBack && (
            <button
              className="modal__back"
              onClick={onBack}
              aria-label="Go back"
            >
              ←
            </button>
          )}
          <h2 id="modal-title" className="modal__title">
            {title}
          </h2>
          {onClose && (
            <button className="modal__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
