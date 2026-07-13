import { useState } from 'react';
import type { Payment, PaymentMethod } from '../types';
import { PAYMENT_METHOD_LABELS } from '../types';
import {
  applyMethodChange,
  countAttentionAfterChange,
  evaluateMethodChange,
  groupByPaymentMethod,
} from '../logic';
import { Modal } from './Modal';
import { PaymentMethodPicker } from './PaymentMethodPicker';

type Step = 'groups' | 'pick-method' | 'consequences';

interface ChangeMethodModel1Props {
  payments: Payment[];
  onApply: (updated: Payment[], close?: boolean) => void;
  onClose: () => void;
}

export function ChangeMethodModel1({
  payments,
  onApply,
  onClose,
}: ChangeMethodModel1Props) {
  const [step, setStep] = useState<Step>('groups');
  const [activeMethod, setActiveMethod] = useState<PaymentMethod | null>(null);
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null);

  const groups = groupByPaymentMethod(payments);
  const activePayments =
    activeMethod !== null ? (groups.get(activeMethod) ?? []) : [];

  const handleSelectGroup = (method: PaymentMethod) => {
    setActiveMethod(method);
    setStep('pick-method');
  };

  const handlePickMethod = (toMethod: PaymentMethod) => {
    setPendingMethod(toMethod);
    setStep('consequences');
  };

  const handleConfirm = () => {
    if (!activeMethod || !pendingMethod) return;
    const ids = activePayments.map((p) => p.id);
    const { updated } = applyMethodChange(payments, ids, pendingMethod);
    onApply(updated, false);
    setPendingMethod(null);
    setActiveMethod(null);
    setStep('groups');
  };

  const handleBackFromConsequences = () => {
    setPendingMethod(null);
    setStep('pick-method');
  };

  const handleBackFromPicker = () => {
    setActiveMethod(null);
    setStep('groups');
  };

  if (step === 'pick-method' && activeMethod) {
    return (
      <Modal
        title="Choose how to pay"
        onClose={onClose}
        onBack={handleBackFromPicker}
      >
        <PaymentMethodPicker
          currentMethod={activeMethod}
          onSelect={handlePickMethod}
        />
      </Modal>
    );
  }

  if (step === 'consequences' && activeMethod && pendingMethod) {
    const attentionCount = countAttentionAfterChange(
      activePayments,
      pendingMethod,
    );
    const allReady = attentionCount === 0;

    return (
      <Modal
        title="Review change"
        onClose={onClose}
        width="md"
      >
        <div className="consequence-review">
          <div className="consequence-review__change">
            <span className="consequence-review__count">
              {activePayments.length} payment{activePayments.length !== 1 ? 's' : ''}
            </span>
            <span className="consequence-review__arrow">
              {PAYMENT_METHOD_LABELS[activeMethod]} →{' '}
              {PAYMENT_METHOD_LABELS[pendingMethod]}
            </span>
          </div>

          {allReady ? (
            <p className="consequence-review__outcome consequence-review__outcome--ready">
              All {activePayments.length} payment
              {activePayments.length !== 1 ? 's' : ''} will remain ready
            </p>
          ) : (
            <p className="consequence-review__outcome consequence-review__outcome--attention">
              {attentionCount} payment{attentionCount !== 1 ? 's' : ''} will need
              attention
            </p>
          )}

          {!allReady && (
            <p className="consequence-review__explain">
              Changing the payment method means some payment details will need to
              be reviewed afterwards.
            </p>
          )}

          <div className="modal__actions">
            <button className="btn btn--secondary" onClick={handleBackFromConsequences}>
              Back
            </button>
            <button className="btn btn--primary" onClick={handleConfirm}>
              Confirm change
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Change payment method" onClose={onClose} width="md">
      <p className="model-hint">
        Choose one group to change. Each group is validated separately.
      </p>
      <div className="group-list">
        {Array.from(groups.entries()).map(([method, groupPayments]) => (
          <div key={method} className="group-card">
            <div className="group-card__info">
              <span className="group-card__count">
                {groupPayments.length} payment{groupPayments.length !== 1 ? 's' : ''}
              </span>
              <span className="group-card__method">
                Currently: {PAYMENT_METHOD_LABELS[method]}
              </span>
            </div>
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => handleSelectGroup(method)}
            >
              Change
            </button>
          </div>
        ))}
      </div>
      <div className="modal__actions">
        <button className="btn btn--secondary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

export function getGroupConsequenceSummary(
  payments: Payment[],
  toMethod: PaymentMethod,
): { ready: number; attention: number } {
  let ready = 0;
  let attention = 0;
  for (const p of payments) {
    if (evaluateMethodChange(p, toMethod) === 'needs_attention') {
      attention++;
    } else {
      ready++;
    }
  }
  return { ready, attention };
}
