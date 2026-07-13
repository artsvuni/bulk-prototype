import type { Payment } from '../types';
import { formatAmount, STATUS_LABELS } from '../types';
import { summarizeByCurrency } from '../logic';
import { Modal } from './Modal';

interface ApproveFlowProps {
  payments: Payment[];
  onApproveAndPay: () => void;
  onApproveOnly: () => void;
  onBack: () => void;
}

export function ApproveFlow({
  payments,
  onApproveAndPay,
  onApproveOnly,
  onBack,
}: ApproveFlowProps) {
  const summaries = summarizeByCurrency(payments);

  return (
    <Modal
      title={`Approve ${payments.length} payment${payments.length !== 1 ? 's' : ''}`}
      onClose={onBack}
    >
      <p className="approve-flow__intro">
        These payments were prepared by your team and are waiting for your
        approval.
      </p>

      {summaries.length > 0 && (
        <div className="approve-flow__totals">
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
        </div>
      )}

      <ul className="approve-flow__list">
        {payments.map((payment) => (
          <li key={payment.id} className="approve-flow__item">
            <span className="approve-flow__recipient">{payment.recipient}</span>
            <span className="approve-flow__amount">
              {formatAmount(payment.amount, payment.currency)}
            </span>
            <span className="approve-flow__status">
              {STATUS_LABELS[payment.status]}
            </span>
          </li>
        ))}
      </ul>

      <div className="modal__actions modal__actions--stacked">
        <button className="btn btn--primary" onClick={onApproveOnly}>
          Approve only
        </button>
        <button className="btn btn--secondary" onClick={onApproveAndPay}>
          Approve and pay
        </button>
        <button className="btn btn--link" onClick={onBack}>
          Go back
        </button>
      </div>
    </Modal>
  );
}
