import type Stripe from 'stripe';

export type LeakType = 'failed_payments' | 'underpriced_customers' | 'churn_risk' | 'refunds';

export type LeakSeverity = 'low' | 'medium' | 'high';

export type LeakReport = {
  totalLeakMonthly: number;
  leaks: {
    type: LeakType;
    title: string;
    description: string;
    monthlyValue: number;
    severity: LeakSeverity;
  }[];
};

export type StripeData = {
  customers: Stripe.Customer[];
  subscriptions: Stripe.Subscription[];
  invoices: Stripe.Invoice[];
  charges: Stripe.Charge[];
  refunds: Stripe.Refund[];
};

const SECONDS_IN_DAY = 24 * 60 * 60;

export function analyzeRevenueLeaks(data: StripeData): LeakReport {
  const now = Date.now() / 1000;
  const thirtyDaysAgo = now - 30 * SECONDS_IN_DAY;
  const fourteenDaysAgo = now - 14 * SECONDS_IN_DAY;

  const leaks = [];

  // 1. Failed Payments
  const failedInvoices = data.invoices.filter((invoice) => {
    const created = typeof invoice.created === 'number' ? invoice.created : 0;
    return (
      created >= thirtyDaysAgo &&
      (invoice.status === 'open' || invoice.status === 'uncollectible')
    );
  });

  const failedAmountCents = failedInvoices.reduce((sum, invoice) => {
    const amount = typeof invoice.amount_remaining === 'number'
      ? invoice.amount_remaining
      : typeof invoice.amount_due === 'number'
      ? invoice.amount_due
      : 0;
    return sum + amount;
  }, 0);

  const failedAmount = failedAmountCents / 100;
  const failedRecoverableMonthly = failedAmount * 0.7;

  leaks.push({
    type: 'failed_payments' as const,
    title: 'Failed & Uncollected Invoices',
    description:
      'Open or uncollectible invoices from the last 30 days that could be recovered with better dunning and retry logic.',
    monthlyValue: failedRecoverableMonthly,
    severity: getSeverity(failedRecoverableMonthly),
  });

  // 2. Underpriced Customers
  // For simplicity, treat the highest unit amount as the "current plan price"
  const activeSubscriptions = data.subscriptions.filter(
    (sub) => sub.status === 'active' || sub.status === 'trialing'
  );

  const getUnitAmount = (sub: Stripe.Subscription): number => {
    const item = sub.items.data[0];
    const amount =
      item?.price?.unit_amount ??
      item?.plan?.amount ??
      0;
    const interval =
      item?.price?.recurring?.interval ??
      item?.plan?.interval ??
      'month';

    // Normalize to monthly
    if (interval === 'year') {
      return amount / 12;
    }
    return amount;
  };

  const monthlyAmounts = activeSubscriptions.map(getUnitAmount).filter((a) => a > 0);
  const currentPlanPriceCents = monthlyAmounts.length > 0 ? Math.max(...monthlyAmounts) : 0;

  const underpricedDeltaCents = activeSubscriptions.reduce((sum, sub) => {
    const amountCents = getUnitAmount(sub);
    if (!amountCents || amountCents >= currentPlanPriceCents) {
      return sum;
    }
    return sum + (currentPlanPriceCents - amountCents);
  }, 0);

  const underpricedMonthly = underpricedDeltaCents / 100;

  leaks.push({
    type: 'underpriced_customers' as const,
    title: 'Underpriced Active Customers',
    description:
      'Active customers paying below your current highest plan price, estimated as missed monthly MRR.',
    monthlyValue: underpricedMonthly,
    severity: getSeverity(underpricedMonthly),
  });

  // 3. Churn Risk (recent cancellations)
  const recentCancellations = data.subscriptions.filter((sub) => {
    const canceledAt =
      typeof sub.canceled_at === 'number'
        ? sub.canceled_at
        : typeof sub.cancel_at === 'number'
        ? sub.cancel_at
        : null;

    return (
      (sub.status === 'canceled' || sub.cancel_at_period_end === true) &&
      canceledAt !== null &&
      canceledAt >= fourteenDaysAgo
    );
  });

  const churnLostMRRCents = recentCancellations.reduce((sum, sub) => {
    const unitAmount = getUnitAmount(sub);
    return sum + unitAmount;
  }, 0);

  const churnLostMRR = churnLostMRRCents / 100;

  leaks.push({
    type: 'churn_risk' as const,
    title: 'Recent Cancellations (Last 14 Days)',
    description:
      'Customers who recently canceled or are set to cancel soon, approximated as lost monthly recurring revenue.',
    monthlyValue: churnLostMRR,
    severity: getSeverity(churnLostMRR),
  });

  // 4. Refund Impact
  const recentRefunds = data.refunds.filter((refund) => {
    const created = typeof refund.created === 'number' ? refund.created : 0;
    return created >= thirtyDaysAgo;
  });

  const refundAmountCents = recentRefunds.reduce((sum, refund) => {
    const amount = typeof refund.amount === 'number' ? refund.amount : 0;
    return sum + amount;
  }, 0);

  const refundAmount = refundAmountCents / 100;

  leaks.push({
    type: 'refunds' as const,
    title: 'Refunds (Last 30 Days)',
    description:
      'Total value of refunds issued over the last 30 days, treated as negative recurring revenue impact.',
    monthlyValue: refundAmount,
    severity: getSeverity(refundAmount),
  });

  const totalLeakMonthly = leaks.reduce((sum, leak) => sum + leak.monthlyValue, 0);

  return {
    totalLeakMonthly,
    leaks,
  };
}

function getSeverity(value: number): LeakSeverity {
  if (value >= 10000) return 'high';
  if (value >= 1000) return 'medium';
  if (value > 0) return 'low';
  return 'low';
}

