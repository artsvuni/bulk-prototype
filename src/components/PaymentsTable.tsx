import type { Payment } from '../types';
import {
  formatAmount,
  formatDueDate,
  PAYMENT_METHOD_LABELS,
  STATUS_LABELS,
} from '../types';

interface PaymentsTableProps {
  payments: Payment[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

export function PaymentsTable({
  payments,
  selectedIds,
  onToggle,
  onToggleAll,
}: PaymentsTableProps) {
  const allSelected =
    payments.length > 0 && payments.every((p) => selectedIds.has(p.id));
  const someSelected = payments.some((p) => selectedIds.has(p.id));

  return (
    <div className="table-container">
      <table className="payments-table">
        <thead>
          <tr>
            <th className="col-checkbox">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={onToggleAll}
                aria-label="Select all payments"
              />
            </th>
            <th>Recipient</th>
            <th>Account details</th>
            <th className="col-amount">Amount</th>
            <th>Payment method</th>
            <th className="col-date">Due date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const isSelected = selectedIds.has(payment.id);
            return (
              <tr
                key={payment.id}
                className={isSelected ? 'payments-table__row--selected' : ''}
                onClick={() => onToggle(payment.id)}
              >
                <td className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(payment.id)}
                    aria-label={`Select ${payment.recipient}`}
                  />
                </td>
                <td className="col-recipient">{payment.recipient}</td>
                <td className="col-account">{payment.accountDetails}</td>
                <td className="col-amount">
                  {formatAmount(payment.amount, payment.currency)}
                </td>
                <td>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</td>
                <td className="col-date">{formatDueDate(payment.dueDate)}</td>
                <td>
                  <span
                    className={`status-badge status-badge--${payment.status}`}
                  >
                    {STATUS_LABELS[payment.status]}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PaymentList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <p className="empty-list">No payments in this group.</p>;
  }

  return (
    <ul className="payment-list">
      {payments.map((p) => (
        <li key={p.id} className="payment-list__item">
          <span className="payment-list__recipient">{p.recipient}</span>
          <span className="payment-list__detail">{p.accountDetails}</span>
          <span className="payment-list__amount">
            {formatAmount(p.amount, p.currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}
