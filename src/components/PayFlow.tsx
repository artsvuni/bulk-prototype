import { useState } from 'react';
import type { Payment } from '../types';
import { formatAmount } from '../types';
import { summarizeByCurrency } from '../logic';
import { Modal } from './Modal';
import { PaymentList } from './PaymentsTable';

const PROCESSING_MS = 2500;

interface PayFlowProps {
  payablePayments: Payment[];
  attentionPayments: Payment[];
  needsApprovalPayments: Payment[];
  newlyApprovedCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PayFlow({
  payablePayments,
  attentionPayments,
  needsApprovalPayments,
  newlyApprovedCount = 0,
  onConfirm,
  onCancel,
}: PayFlowProps) {
  const summaries = summarizeByCurrency(payablePayments);
  const [showExcluded, setShowExcluded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fromApproval = newlyApprovedCount > 0;

  const excludedCount =
    attentionPayments.length + needsApprovalPayments.length;
  const excludedPayments = [...attentionPayments, ...needsApprovalPayments];

  const confirmLabel = fromApproval
    ? `Confirm payment for ${payablePayments.length}`
    : 'Confirm payment';

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onConfirm();
    }, PROCESSING_MS);
  };

  const processingLabel =
    payablePayments.length === 1
      ? 'Processing payment…'
      : `Processing ${payablePayments.length} payments…`;

  return (
    <Modal
      title={
        isProcessing
          ? processingLabel
          : `Pay ${payablePayments.length} payment${payablePayments.length !== 1 ? 's' : ''}`
      }
      onClose={isProcessing ? undefined : onCancel}
    >
      {isProcessing ? (
        <div className="pay-processing">
          <div className="pay-processing__spinner" aria-hidden />
          <p className="pay-processing__text">{processingLabel}</p>
          <p className="pay-processing__subtext">
            This usually takes a few seconds.
          </p>
        </div>
      ) : (
        <div className="pay-summary">
          {fromApproval && (
            <div className="pay-summary__approved">
              <p className="pay-summary__approved-title">
                {newlyApprovedCount} payment
                {newlyApprovedCount !== 1 ? 's' : ''} approved
              </p>
              <p className="pay-summary__approved-detail">
                These payments are ready to be paid. Confirm to complete
                approval and payment.
              </p>
            </div>
          )}

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

          {!fromApproval && excludedCount > 0 && (
            <div className="pay-summary__excluded">
              <p>
                {excludedCount} selected payment
                {excludedCount !== 1 ? 's' : ''} will not be included.
                {attentionPayments.length > 0 &&
                  ` ${attentionPayments.length} need attention.`}
                {needsApprovalPayments.length > 0 &&
                  ` ${needsApprovalPayments.length} need approval.`}
              </p>
              <button
                className="btn btn--link"
                onClick={() => setShowExcluded(!showExcluded)}
              >
                {showExcluded ? 'Hide' : 'View'} excluded payments
              </button>
              {showExcluded && <PaymentList payments={excludedPayments} />}
            </div>
          )}

          <div className="modal__actions">
            <button className="btn btn--secondary" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn--primary" onClick={handleConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
