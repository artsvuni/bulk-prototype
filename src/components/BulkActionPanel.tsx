import type { StatusCounts } from '../logic';
import { STATUS_LABELS } from '../types';

interface BulkActionPanelProps {
  selectedCount: number;
  statusCounts: StatusCounts;
  payableCount: number;
  needsApprovalCount: number;
  onPay: () => void;
  onApprove: () => void;
  onChangeMethod: () => void;
  onDelete: () => void;
}

const STATUS_ORDER = [
  'ready',
  'needs_approval',
  'approved',
  'needs_attention',
] as const;

export function BulkActionPanel({
  selectedCount,
  statusCounts,
  payableCount,
  needsApprovalCount,
  onPay,
  onApprove,
  onChangeMethod,
  onDelete,
}: BulkActionPanelProps) {
  return (
    <div className="bulk-panel" role="toolbar" aria-label="Bulk actions">
      <div className="bulk-panel__info">
        <span className="bulk-panel__count">{selectedCount} selected</span>
        <ul className="bulk-panel__breakdown">
          {STATUS_ORDER.map((status) => {
            const count = statusCounts[status];
            if (count === 0) return null;
            return (
              <li key={status} className="bulk-panel__breakdown-item">
                {count} {STATUS_LABELS[status]}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="bulk-panel__actions">
        <button
          className="btn btn--primary"
          onClick={onPay}
          disabled={payableCount === 0}
        >
          {payableCount > 0 ? `Pay ${payableCount}` : 'Pay'}
        </button>
        {needsApprovalCount > 0 && (
          <button className="btn btn--secondary" onClick={onApprove}>
            Approve {needsApprovalCount}
          </button>
        )}
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
