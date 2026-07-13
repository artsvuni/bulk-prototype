import type { Currency, Payment, PaymentMethod, PaymentStatus } from './types';

const ATTENTION_ON_DEBIT_FROM_EUR = new Set(['p2', 'p9']);

function methodChangeNeedsAttention(
  payment: Payment,
  toMethod: PaymentMethod,
): boolean {
  if (payment.paymentMethod === toMethod) return false;

  const from = payment.paymentMethod;

  if (from === 'gbp_balance' && toMethod === 'eur_balance') return false;
  if (from === 'eur_balance' && toMethod === 'debit_card') {
    return ATTENTION_ON_DEBIT_FROM_EUR.has(payment.id);
  }
  if (from === 'gbp_balance' && toMethod === 'debit_card') {
    return payment.currency === 'EUR';
  }
  if (from === 'debit_card' && toMethod === 'gbp_balance') {
    return payment.currency === 'EUR';
  }
  if (from === 'debit_card' && toMethod === 'eur_balance') return false;
  if (from === 'eur_balance' && toMethod === 'gbp_balance') {
    return payment.currency === 'EUR';
  }

  return false;
}

export function evaluateMethodChange(
  payment: Payment,
  toMethod: PaymentMethod,
): PaymentStatus {
  if (payment.paymentMethod === toMethod) {
    return payment.status;
  }

  if (methodChangeNeedsAttention(payment, toMethod)) {
    return 'needs_attention';
  }

  if (payment.status === 'needs_approval') return 'needs_approval';
  if (payment.status === 'approved') return 'approved';
  return 'ready';
}

export function groupByPaymentMethod(payments: Payment[]): Map<PaymentMethod, Payment[]> {
  const groups = new Map<PaymentMethod, Payment[]>();

  for (const payment of payments) {
    const existing = groups.get(payment.paymentMethod) ?? [];
    existing.push(payment);
    groups.set(payment.paymentMethod, existing);
  }

  return groups;
}

export function isPayable(status: PaymentStatus): boolean {
  return status === 'ready' || status === 'approved';
}

export function getPayablePayments(payments: Payment[]): Payment[] {
  return payments.filter((p) => isPayable(p.status));
}

export function getNeedsApprovalPayments(payments: Payment[]): Payment[] {
  return payments.filter((p) => p.status === 'needs_approval');
}

export function getAttentionPayments(payments: Payment[]): Payment[] {
  return payments.filter((p) => p.status === 'needs_attention');
}

export interface StatusCounts {
  ready: number;
  needs_approval: number;
  approved: number;
  needs_attention: number;
}

export function countByStatus(payments: Payment[]): StatusCounts {
  const counts: StatusCounts = {
    ready: 0,
    needs_approval: 0,
    approved: 0,
    needs_attention: 0,
  };

  for (const payment of payments) {
    counts[payment.status] += 1;
  }

  return counts;
}

export interface CurrencySummary {
  currency: Currency;
  count: number;
  total: number;
}

export function summarizeByCurrency(payments: Payment[]): CurrencySummary[] {
  const map = new Map<Currency, { count: number; total: number }>();

  for (const payment of payments) {
    const existing = map.get(payment.currency) ?? { count: 0, total: 0 };
    existing.count += 1;
    existing.total += payment.amount;
    map.set(payment.currency, existing);
  }

  return Array.from(map.entries()).map(([currency, { count, total }]) => ({
    currency,
    count,
    total,
  }));
}

export interface MethodChangeResult {
  payment: Payment;
  newStatus: PaymentStatus;
}

export function applyMethodChange(
  payments: Payment[],
  paymentIds: string[],
  toMethod: PaymentMethod,
): { updated: Payment[]; results: MethodChangeResult[] } {
  const idSet = new Set(paymentIds);
  const results: MethodChangeResult[] = [];

  const updated = payments.map((payment) => {
    if (!idSet.has(payment.id)) return payment;

    const newStatus = evaluateMethodChange(payment, toMethod);
    results.push({ payment, newStatus });

    return {
      ...payment,
      paymentMethod: toMethod,
      status: newStatus,
      issueCount:
        newStatus === 'needs_attention'
          ? payment.status === 'needs_attention'
            ? payment.issueCount ?? 1
            : 1
          : undefined,
    };
  });

  return { updated, results };
}

export function countAttentionAfterChange(
  payments: Payment[],
  toMethod: PaymentMethod,
): number {
  return payments.filter(
    (p) => evaluateMethodChange(p, toMethod) === 'needs_attention',
  ).length;
}

export function approvePayments(
  payments: Payment[],
  paymentIds: string[],
): Payment[] {
  const idSet = new Set(paymentIds);
  return payments.map((payment) =>
    idSet.has(payment.id) && payment.status === 'needs_approval'
      ? { ...payment, status: 'approved' as PaymentStatus }
      : payment,
  );
}
