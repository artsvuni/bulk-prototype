import { useState } from 'react';
import type { Payment } from '../types';
import { formatAmount } from '../types';
import { summarizeByCurrency } from '../logic';
import { Modal } from './Modal';
import { PaymentList } from './PaymentsTable';

interface PayFlowProps {
  readyPayments: Payment[];
  attentionPayments: Payment[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function PayFlow({
  readyPayments,
  attentionPayments,
  onConfirm,
  onCancel,
}: PayFlowProps) {
  const summaries = summarizeByCurrency(readyPayments);
  const [showAttention, setShowAttention] = useState(false);

  return (
    <Modal
      title={`Pay ${readyPayments.length} payment${readyPayments.length !== 1 ? 's' : ''}`}
      onClose={onCancel}
    >
      <div className="pay-summary">
        {summaries.map((s) => (
          <div key={s.currency} className="pay-summary__row">
            <span className="pay-summary__count">
              {s.count} payment{s.count !== 1 ? 's' : ''}
            </span>
            <span className="pay-summary__amount">
              {formatAmount(s.total, s.currency)}
            </span>
          </div>
        ))}

        {attentionPayments.length > 0 && (
          <div className="pay-summary__excluded">
            <p>
              {attentionPayments.length} selected payment
              {attentionPayments.length !== 1 ? 's' : ''} need attention and
              will not be included.
            </p>
            <button
              className="btn btn--link"
              onClick={() => setShowAttention(!showAttention)}
            >
              {showAttention ? 'Hide' : 'View'} payments that need attention
            </button>
            {showAttention && <PaymentList payments={attentionPayments} />}
          </div>
        )}

        <div className="modal__actions">
          <button className="btn btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={onConfirm}>
            Confirm payment
          </button>
        </div>
      </div>
    </Modal>
  );
}
