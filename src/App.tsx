import { useState, useCallback } from 'react';
import type { InteractionModel, Payment } from './types';
import { clonePayments } from './data';
import { getAttentionPayments, getReadyPayments } from './logic';
import { PaymentsTable } from './components/PaymentsTable';
import { BulkActionPanel } from './components/BulkActionPanel';
import { DeleteDialog } from './components/DeleteDialog';
import { PayFlow } from './components/PayFlow';
import { ChangeMethodModel1 } from './components/ChangeMethodModel1';
import { ChangeMethodModel2 } from './components/ChangeMethodModel2';
import { ChangeMethodModel3 } from './components/ChangeMethodModel3';
import { PrototypeControls } from './components/PrototypeControls';

type ActiveFlow = 'none' | 'delete' | 'pay' | 'change-method';

export default function App() {
  const [payments, setPayments] = useState<Payment[]>(clonePayments);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>('none');
  const [model, setModel] = useState<InteractionModel>('model1');
  const [toast, setToast] = useState<string | null>(null);

  const selectedPayments = payments.filter((p) => selectedIds.has(p.id));
  const readyPayments = getReadyPayments(selectedPayments);
  const attentionPayments = getAttentionPayments(selectedPayments);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const clearSelection = () => setSelectedIds(new Set());

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
    showToast('Prototype reset to original data');
  };

  const handleDeleteConfirm = () => {
    setPayments((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    const count = selectedIds.size;
    clearSelection();
    setActiveFlow('none');
    showToast(`${count} payment${count !== 1 ? 's' : ''} deleted`);
  };

  const handlePayConfirm = () => {
    const paidIds = new Set(readyPayments.map((p) => p.id));
    setPayments((prev) => prev.filter((p) => !paidIds.has(p.id)));
    const count = readyPayments.length;
    clearSelection();
    setActiveFlow('none');
    showToast(`${count} payment${count !== 1 ? 's' : ''} paid`);
  };

  const handleMethodChangeApply = (updated: Payment[], close = true) => {
    const selectedSet = selectedIds;
    setPayments((prev) =>
      prev.map((p) => {
        if (!selectedSet.has(p.id)) return p;
        const updatedPayment = updated.find((u) => u.id === p.id);
        return updatedPayment ?? p;
      }),
    );
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
          onToggle={handleToggle}
          onToggleAll={handleToggleAll}
        />
      </main>

      {hasSelection && (
        <BulkActionPanel
          selectedCount={selectedIds.size}
          readyCount={readyPayments.length}
          attentionCount={attentionPayments.length}
          onPay={() => setActiveFlow('pay')}
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

      {activeFlow === 'pay' && (
        <PayFlow
          readyPayments={readyPayments}
          attentionPayments={attentionPayments}
          onConfirm={handlePayConfirm}
          onCancel={() => setActiveFlow('none')}
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
