export type PaymentMethod = 'gbp_balance' | 'eur_balance' | 'debit_card';
export type PaymentStatus =
  | 'ready'
  | 'needs_approval'
  | 'approved'
  | 'needs_attention';
export type Currency = 'GBP' | 'EUR';
export type InteractionModel = 'model1' | 'model2' | 'model3';

export interface Payment {
  id: string;
  recipient: string;
  accountDetails: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  dueDate: string;
  status: PaymentStatus;
  /** Number of unresolved issues when status is needs_attention */
  issueCount?: number;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  gbp_balance: 'GBP balance',
  eur_balance: 'EUR balance',
  debit_card: 'Debit card',
};

export const STATUS_LABELS: Record<PaymentStatus, string> = {
  ready: 'Ready to pay',
  needs_approval: 'Needs approval',
  approved: 'Approved',
  needs_attention: 'Needs attention',
};

export function formatStatusLabel(payment: Payment): string {
  if (payment.status === 'needs_attention') {
    const count = payment.issueCount ?? 1;
    return `Needs attention · ${count} issue${count !== 1 ? 's' : ''}`;
  }
  return STATUS_LABELS[payment.status];
}

export function formatAmount(amount: number, currency: Currency): string {
  const symbol = currency === 'GBP' ? '£' : '€';
  return `${symbol}${amount.toLocaleString('en-GB')}`;
}

export function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
