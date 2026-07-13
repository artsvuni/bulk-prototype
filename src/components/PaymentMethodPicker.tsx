import { useState } from 'react';
import type { PaymentMethod } from '../types';
import { PAYMENT_METHOD_LABELS } from '../types';

interface PaymentMethodPickerProps {
  currentMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

type PaySourceTab = 'wise' | 'other';

interface BalanceOption {
  method: PaymentMethod;
  currency: string;
  balance: string;
  flag: string;
}

const WISE_BALANCES: BalanceOption[] = [
  { method: 'gbp_balance', currency: 'GBP', balance: '40,050', flag: '🇬🇧' },
  { method: 'eur_balance', currency: 'EUR', balance: '1,547', flag: '🇪🇺' },
];

const OTHER_METHODS: PaymentMethod[] = ['debit_card'];

function defaultTab(currentMethod: PaymentMethod): PaySourceTab {
  return currentMethod === 'debit_card' ? 'other' : 'wise';
}

export function PaymentMethodPicker({
  currentMethod,
  onSelect,
}: PaymentMethodPickerProps) {
  const [activeTab, setActiveTab] = useState<PaySourceTab>(() =>
    defaultTab(currentMethod),
  );

  return (
    <div className="pay-source">
      <div className="pay-source__tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'wise'}
          className={`pay-source__tab ${activeTab === 'wise' ? 'pay-source__tab--active' : ''}`}
          onClick={() => setActiveTab('wise')}
        >
          Wise
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'other'}
          className={`pay-source__tab ${activeTab === 'other' ? 'pay-source__tab--active' : ''}`}
          onClick={() => setActiveTab('other')}
        >
          Other
        </button>
      </div>

      {activeTab === 'wise' && (
        <div className="pay-source__card" role="tabpanel">
          <h3 className="pay-source__section-title">Current account</h3>
          <ul className="pay-source__list">
            {WISE_BALANCES.map((account) => {
              const isCurrent = account.method === currentMethod;
              return (
                <li key={account.method}>
                  <button
                    className={`pay-source__row ${isCurrent ? 'pay-source__row--disabled' : ''}`}
                    disabled={isCurrent}
                    onClick={() => onSelect(account.method)}
                  >
                    <span className="pay-source__flag" aria-hidden>
                      {account.flag}
                    </span>
                    <span className="pay-source__balance">
                      {account.balance} {account.currency}
                    </span>
                    {isCurrent ? (
                      <span className="pay-source__current">Current</span>
                    ) : (
                      <span className="pay-source__chevron" aria-hidden>
                        ›
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {activeTab === 'other' && (
        <div className="pay-source__card" role="tabpanel">
          <h3 className="pay-source__section-title">Other ways to pay</h3>
          <ul className="pay-source__list">
            {OTHER_METHODS.map((method) => {
              const isCurrent = method === currentMethod;
              return (
                <li key={method}>
                  <button
                    className={`pay-source__row pay-source__row--other ${isCurrent ? 'pay-source__row--disabled' : ''}`}
                    disabled={isCurrent}
                    onClick={() => onSelect(method)}
                  >
                    <span className="pay-source__method-icon" aria-hidden>
                      💳
                    </span>
                    <span className="pay-source__method-name">
                      {PAYMENT_METHOD_LABELS[method]}
                    </span>
                    {isCurrent ? (
                      <span className="pay-source__current">Current</span>
                    ) : (
                      <span className="pay-source__chevron" aria-hidden>
                        ›
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
