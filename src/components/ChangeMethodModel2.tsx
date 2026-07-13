import { useState } from 'react';
import type { Payment, PaymentMethod } from '../types';
import { PAYMENT_METHOD_LABELS } from '../types';
import {
  applyMethodChange,
  evaluateMethodChange,
  groupByPaymentMethod,
} from '../logic';
import { Modal } from './Modal';
import { PaymentMethodPicker } from './PaymentMethodPicker';

interface ChangeMethodModel2Props {
  payments: Payment[];
  onApply: (updated: Payment[], close?: boolean) => void;
  onClose: () => void;
}

export function ChangeMethodModel2({
  payments,
  onApply,
  onClose,
}: ChangeMethodModel2Props) {
  const groups = groupByPaymentMethod(payments);
  const [configs, setConfigs] = useState<Map<PaymentMethod, PaymentMethod | null>>(
    () => new Map(Array.from(groups.keys()).map((m) => [m, null])),
  );
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showReview, setShowReview] = useState(false);

  const handleSelectMethod = (toMethod: PaymentMethod) => {
    if (editingMethod === null) return;
    setConfigs((prev) => {
      const next = new Map(prev);
      next.set(editingMethod, toMethod);
      return next;
    });
    setEditingMethod(null);
  };

  const hasChanges = Array.from(configs.entries()).some(
    ([from, to]) => to !== null && to !== from,
  );

  const handleConfirmAll = () => {
    let updated = [...payments];
    for (const [fromMethod, toMethod] of configs.entries()) {
      if (!toMethod || toMethod === fromMethod) continue;
      const groupPayments = groups.get(fromMethod) ?? [];
      const ids = groupPayments.map((p) => p.id);
      const result = applyMethodChange(updated, ids, toMethod);
      updated = result.updated;
    }
    onApply(updated, true);
  };

  if (editingMethod !== null) {
    return (
      <Modal
        title="Choose how to pay"
        onClose={onClose}
        onBack={() => setEditingMethod(null)}
      >
        <PaymentMethodPicker
          currentMethod={editingMethod}
          onSelect={handleSelectMethod}
        />
      </Modal>
    );
  }

  if (showReview) {
    const changedGroups = Array.from(configs.entries()).filter(
      ([from, to]) => to !== null && to !== from,
    );

    return (
      <Modal title="Review changes" onClose={() => setShowReview(false)} width="lg">
        <div className="review-list">
          {Array.from(groups.entries()).map(([fromMethod, groupPayments]) => {
            const toMethod = configs.get(fromMethod);
            const isChanged = toMethod && toMethod !== fromMethod;
            const attentionCount = isChanged
              ? groupPayments.filter(
                  (p) =>
                    evaluateMethodChange(p, toMethod!) === 'needs_attention',
                ).length
              : 0;

            return (
              <div key={fromMethod} className="review-item">
                <div className="review-item__header">
                  <span className="review-item__count">
                    {groupPayments.length} payment
                    {groupPayments.length !== 1 ? 's' : ''}
                  </span>
                  {isChanged ? (
                    <span className="review-item__change">
                      {PAYMENT_METHOD_LABELS[fromMethod]} →{' '}
                      {PAYMENT_METHOD_LABELS[toMethod!]}
                    </span>
                  ) : (
                    <span className="review-item__unchanged">
                      {PAYMENT_METHOD_LABELS[fromMethod]}
                      <span className="review-item__no-change">No change</span>
                    </span>
                  )}
                </div>
                {isChanged && (
                  <p
                    className={`review-item__outcome ${attentionCount > 0 ? 'review-item__outcome--attention' : 'review-item__outcome--ready'}`}
                  >
                    {attentionCount === 0
                      ? 'All payments will remain ready'
                      : `${attentionCount} payment${attentionCount !== 1 ? 's' : ''} will need attention`}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {changedGroups.some(([from, to]) => {
          const gp = groups.get(from) ?? [];
          return gp.some(
            (p) => evaluateMethodChange(p, to!) === 'needs_attention',
          );
        }) && (
          <p className="review-note">
            Affected payments can be reviewed after the changes are applied.
          </p>
        )}

        <div className="modal__actions">
          <button
            className="btn btn--secondary"
            onClick={() => setShowReview(false)}
          >
            Back and edit
          </button>
          <button className="btn btn--primary" onClick={handleConfirmAll}>
            Confirm all changes
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Change payment method" onClose={onClose} width="md">
      <p className="model-hint">
        Configure changes for one or more groups, then review everything together.
      </p>
      <div className="group-list">
        {Array.from(groups.entries()).map(([method, groupPayments]) => {
          const toMethod = configs.get(method);
          const isChanged = toMethod && toMethod !== method;

          return (
            <div key={method} className="group-card group-card--editable">
              <div className="group-card__info">
                <span className="group-card__count">
                  {groupPayments.length} payment
                  {groupPayments.length !== 1 ? 's' : ''}
                </span>
                {isChanged ? (
                  <span className="group-card__proposed">
                    {PAYMENT_METHOD_LABELS[method]} →{' '}
                    {PAYMENT_METHOD_LABELS[toMethod]}
                  </span>
                ) : (
                  <span className="group-card__method">
                    {PAYMENT_METHOD_LABELS[method]}
                  </span>
                )}
              </div>
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => setEditingMethod(method)}
              >
                Change
              </button>
            </div>
          );
        })}
      </div>
      <div className="modal__actions">
        <button className="btn btn--secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn--primary"
          disabled={!hasChanges}
          onClick={() => setShowReview(true)}
        >
          Review changes
        </button>
      </div>
    </Modal>
  );
}
