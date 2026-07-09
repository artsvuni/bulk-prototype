import type { Currency, Payment, PaymentMethod, PaymentStatus } from './types';

const ATTENTION_ON_DEBIT_FROM_EUR = new Set(['p2', 'p9']);

export function evaluateMethodChange(
  payment: Payment,
  toMethod: PaymentMethod,
): PaymentStatus {
  if (payment.paymentMethod === toMethod) {
    return payment.status;
  }

  const from = payment.paymentMethod;

  if (from === 'gbp_balance' && toMethod === 'eur_balance') {
    return 'ready';
  }

  if (from === 'eur_balance' && toMethod === 'debit_card') {
    return ATTENTION_ON_DEBIT_FROM_EUR.has(payment.id)
      ? 'needs_attention'
      : 'ready';
  }

  if (from === 'gbp_balance' && toMethod === 'debit_card') {
    return payment.currency === 'EUR' ? 'needs_attention' : 'ready';
  }

  if (from === 'debit_card' && toMethod === 'gbp_balance') {
    return payment.currency === 'EUR' ? 'needs_attention' : 'ready';
  }

  if (from === 'debit_card' && toMethod === 'eur_balance') {
    return 'ready';
  }

  if (from === 'eur_balance' && toMethod === 'gbp_balance') {
    return payment.currency === 'EUR' ? 'needs_attention' : 'ready';
  }

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

export function getReadyPayments(payments: Payment[]): Payment[] {
  return payments.filter((p) => p.status === 'ready');
}

export function getAttentionPayments(payments: Payment[]): Payment[] {
  return payments.filter((p) => p.status === 'needs_attention');
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

export function otherMethods(current: PaymentMethod): PaymentMethod[] {
  const all: PaymentMethod[] = ['gbp_balance', 'eur_balance', 'debit_card'];
  return all.filter((m) => m !== current);
}
