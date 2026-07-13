import { useState, useCallback, useRef } from 'react';
import type { InteractionModel, Payment } from './types';
import { clonePayments } from './data';
import {
  approvePayments,
  countByStatus,
  getAttentionPayments,
  getNeedsApprovalPayments,
  getPayablePayments,
} from './logic';
import { PaymentsTable } from './components/PaymentsTable';
import { BulkActionPanel } from './components/BulkActionPanel';
import { DeleteDialog } from './components/DeleteDialog';
import { PayFlow } from './components/PayFlow';
import { ApproveFlow } from './components/ApproveFlow';
import { ChangeMethodModel1 } from './components/ChangeMethodModel1';
import { ChangeMethodModel2 } from './components/ChangeMethodModel2';
import { ChangeMethodModel3 } from './components/ChangeMethodModel3';
import { PrototypeControls } from './components/PrototypeControls';

type ActiveFlow = 'none' | 'delete' | 'pay' | 'approve' | 'change-method';

export default function App() {
  const [payments, setPayments] = useState<Payment[]>(clonePayments);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>('none');
  const [model, setModel] = useState<InteractionModel>('model1');
  const [toast, setToast] = useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(
    new Set(),
  );
  const [pendingPayIds, setPendingPayIds] = useState<string[] | null>(null);
  const [newlyApprovedCount, setNewlyApprovedCount] = useState(0);
  const highlightTimeout = useRef<ReturnType<typeof setTimeout>>();

  const selectedPayments = payments.filter((p) => selectedIds.has(p.id));
  const payablePayments = getPayablePayments(selectedPayments);
  const needsApprovalPayments = getNeedsApprovalPayments(selectedPayments);
  const statusCounts = countByStatus(selectedPayments);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const flashRows = (ids: string[]) => {
    if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
    setHighlightedIds(new Set(ids));
    highlightTimeout.current = setTimeout(() => setHighlightedIds(new Set()), 2000);
  };

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === payments.length) return new Set();
      return new Set(payments.map((p) => p.id));
    });
  }, [payments]);

  const handleReset = () => {
    setPayments(clonePayments());
    setSelectedIds(new Set());
    setActiveFlow('none');
    setHighlightedIds(new Set());
    setPendingPayIds(null);
    setNewlyApprovedCount(0);
    showToast('Prototype reset to original data');
  };

  const closePayFlow = () => {
    setActiveFlow('none');
    setPendingPayIds(null);
    setNewlyApprovedCount(0);
  };

  const openPayFlow = () => {
    setPendingPayIds(null);
    setNewlyApprovedCount(0);
    setActiveFlow('pay');
  };

  const handleDeleteConfirm = () => {
    const deletedIds = [...selectedIds];
    setPayments((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setActiveFlow('none');
    showToast(
      `${deletedIds.length} payment${deletedIds.length !== 1 ? 's' : ''} deleted`,
    );
  };

  const paymentsForPayFlow = pendingPayIds
    ? payments.filter((p) => pendingPayIds.includes(p.id))
    : getPayablePayments(selectedPayments);

  const handlePayConfirm = () => {
    const toPay = paymentsForPayFlow;
    const paidIds = new Set(toPay.map((p) => p.id));
    setPayments((prev) => prev.filter((p) => !paidIds.has(p.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of paidIds) next.delete(id);
      return next;
    });
    const toastMessage =
      newlyApprovedCount > 0
        ? `${newlyApprovedCount} payment${newlyApprovedCount !== 1 ? 's' : ''} approved and paid`
        : `${toPay.length} payment${toPay.length !== 1 ? 's' : ''} paid`;
    closePayFlow();
    showToast(toastMessage);
  };

  const approveSelected = (): string[] => {
    const ids = needsApprovalPayments.map((p) => p.id);
    setPayments((prev) => approvePayments(prev, ids));
    flashRows(ids);
    return ids;
  };

  const handleApproveOnly = () => {
    const count = needsApprovalPayments.length;
    approveSelected();
    setActiveFlow('none');
    showToast(
      `${count} payment${count !== 1 ? 's' : ''} approved`,
    );
  };

  const handleApproveAndPay = () => {
    const ids = needsApprovalPayments.map((p) => p.id);
    setPayments((prev) => approvePayments(prev, ids));
    flashRows(ids);
    setPendingPayIds(ids);
    setNewlyApprovedCount(ids.length);
    setActiveFlow('pay');
  };

  const handleMethodChangeApply = (updated: Payment[], close = true) => {
    const selectedSet = selectedIds;
    const changedIds: string[] = [];

    setPayments((prev) =>
      prev.map((p) => {
        if (!selectedSet.has(p.id)) return p;
        const updatedPayment = updated.find((u) => u.id === p.id);
        if (updatedPayment && updatedPayment.status !== p.status) {
          changedIds.push(p.id);
        }
        return updatedPayment ?? p;
      }),
    );

    if (changedIds.length > 0) flashRows(changedIds);

    if (close) {
      setActiveFlow('none');
      showToast('Payment methods updated');
    }
  };

  const hasSelection = selectedIds.size > 0;

  return (
    <div className={`app ${hasSelection ? 'app--panel-open' : ''}`}>
      <header className="app-header">
        <div className="app-header__main">
          <h1 className="app-header__title">Payments</h1>
          <span className="app-header__count">{payments.length} payments</span>
        </div>
        <PrototypeControls
          model={model}
          onModelChange={setModel}
          onReset={handleReset}
        />
      </header>

      <main className="app-main">
        <PaymentsTable
          payments={payments}
          selectedIds={selectedIds}
          highlightedIds={highlightedIds}
          onToggle={handleToggle}
          onToggleAll={handleToggleAll}
        />
      </main>

      {hasSelection && (
        <BulkActionPanel
          selectedCount={selectedIds.size}
          statusCounts={statusCounts}
          payableCount={payablePayments.length}
          needsApprovalCount={needsApprovalPayments.length}
          onPay={openPayFlow}
          onApprove={() => setActiveFlow('approve')}
          onChangeMethod={() => setActiveFlow('change-method')}
          onDelete={() => setActiveFlow('delete')}
        />
      )}

      {activeFlow === 'delete' && (
        <DeleteDialog
          count={selectedIds.size}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setActiveFlow('none')}
        />
      )}

      {activeFlow === 'approve' && (
        <ApproveFlow
          payments={needsApprovalPayments}
          onApproveAndPay={handleApproveAndPay}
          onApproveOnly={handleApproveOnly}
          onBack={() => setActiveFlow('none')}
        />
      )}

      {activeFlow === 'pay' && (
        <PayFlow
          payablePayments={paymentsForPayFlow}
          attentionPayments={
            pendingPayIds ? [] : getAttentionPayments(selectedPayments)
          }
          needsApprovalPayments={
            pendingPayIds ? [] : getNeedsApprovalPayments(selectedPayments)
          }
          newlyApprovedCount={newlyApprovedCount}
          onConfirm={handlePayConfirm}
          onCancel={closePayFlow}
        />
      )}

      {activeFlow === 'change-method' && model === 'model1' && (
        <ChangeMethodModel1
          payments={selectedPayments}
          onApply={handleMethodChangeApply}
          onClose={() => setActiveFlow('none')}
        />
      )}

      {activeFlow === 'change-method' && model === 'model2' && (
        <ChangeMethodModel2
          payments={selectedPayments}
          onApply={handleMethodChangeApply}
          onClose={() => setActiveFlow('none')}
        />
      )}

      {activeFlow === 'change-method' && model === 'model3' && (
        <ChangeMethodModel3
          payments={selectedPayments}
          onApply={handleMethodChangeApply}
          onClose={() => setActiveFlow('none')}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
