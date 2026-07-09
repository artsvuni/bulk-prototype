import type { PaymentMethod } from '../types';
import { PAYMENT_METHOD_LABELS } from '../types';

interface PaymentMethodPickerProps {
  currentMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  onCancel: () => void;
}

export function PaymentMethodPicker({
  currentMethod,
  onSelect,
  onCancel,
}: PaymentMethodPickerProps) {
  const methods: PaymentMethod[] = ['gbp_balance', 'eur_balance', 'debit_card'];

  return (
    <div className="method-picker">
      <p className="method-picker__hint">
        Choose a new payment method. The current method is not available.
      </p>
      <div className="method-picker__options">
        {methods.map((method) => {
          const isCurrent = method === currentMethod;
          return (
            <button
              key={method}
              className={`method-picker__option ${isCurrent ? 'method-picker__option--disabled' : ''}`}
              disabled={isCurrent}
              onClick={() => onSelect(method)}
            >
              <span className="method-picker__option-label">
                {PAYMENT_METHOD_LABELS[method]}
              </span>
              {isCurrent && (
                <span className="method-picker__current">Current</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="modal__actions">
        <button className="btn btn--secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
