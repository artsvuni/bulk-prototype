interface DeleteDialogProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteDialog({ count, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal modal--sm"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="delete-title"
      >
        <div className="modal__header">
          <h2 id="delete-title" className="modal__title">
            Delete {count} payment{count !== 1 ? 's' : ''}?
          </h2>
        </div>
        <div className="modal__body">
          <p className="dialog-text">
            These payments will be permanently removed.
          </p>
          <div className="modal__actions">
            <button className="btn btn--secondary" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn--danger" onClick={onConfirm}>
              Delete payments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
