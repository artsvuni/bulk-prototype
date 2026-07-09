interface BulkActionPanelProps {
  selectedCount: number;
  readyCount: number;
  attentionCount: number;
  onPay: () => void;
  onChangeMethod: () => void;
  onDelete: () => void;
}

export function BulkActionPanel({
  selectedCount,
  readyCount,
  attentionCount,
  onPay,
  onChangeMethod,
  onDelete,
}: BulkActionPanelProps) {
  return (
    <div className="bulk-panel" role="toolbar" aria-label="Bulk actions">
      <div className="bulk-panel__info">
        <span className="bulk-panel__count">{selectedCount} selected</span>
        {attentionCount > 0 && (
          <span className="bulk-panel__meta">
            {readyCount} ready to pay · {attentionCount} need attention
          </span>
        )}
      </div>
      <div className="bulk-panel__actions">
        <button
          className="btn btn--primary"
          onClick={onPay}
          disabled={readyCount === 0}
        >
          {readyCount > 0 ? `Pay ${readyCount}` : 'Pay'}
        </button>
        <button className="btn btn--secondary" onClick={onChangeMethod}>
          Change payment method
        </button>
        <button className="btn btn--danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
