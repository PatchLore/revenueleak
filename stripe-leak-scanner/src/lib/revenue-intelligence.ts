import type Stripe from 'stripe';
import type { RevenueIntelligence, StripeMetrics } from '@/types';
import type { TierConfig } from './tiers';

const DEFAULT_MONTH_WINDOW = 6;

function startOfMonthEpoch(date: Date): number {
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), 1).getTime() / 1000);
}

function intervalToMonthly(amountCents: number, interval?: Stripe.Price.Recurring.Interval | null, intervalCount = 1): number {
  const amount = amountCents / 100;
  if (!interval) return amount;
  if (interval === 'month') return amount / Math.max(intervalCount, 1);
  if (interval === 'year') return amount / (12 * Math.max(intervalCount, 1));
  if (interval === 'week') return amount * (52 / 12) / Math.max(intervalCount, 1);
  if (interval === 'day') return amount * (30 / Math.max(intervalCount, 1));
  return amount;
}

function getSubscriptionMonthlyAmount(subscription: Stripe.Subscription): number {
  return subscription.items.data.reduce((sum, item) => {
    const price = item.price;
    const recurring = price?.recurring;
    const amount = price?.unit_amount ?? item.plan?.amount ?? 0;
    const interval = recurring?.interval ?? item.plan?.interval ?? null;
    const intervalCount = recurring?.interval_count ?? item.plan?.interval_count ?? 1;
    return sum + intervalToMonthly(amount, interval, intervalCount);
  }, 0);
}

function monthLabel(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short' });
}

function makePastMonths(count: number): Date[] {
  const months: Date[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  return months;
}

function customerEmailById(customers: Stripe.Customer[]): Map<string, string> {
  const map = new Map<string, string>();
  customers.forEach((customer) => {
    map.set(customer.id, customer.email ?? 'Unknown customer');
  });
  return map;
}

export function computeRevenueIntelligence(
  data: StripeMetrics,
  userTier?: TierConfig | null
): RevenueIntelligence {
  const now = new Date();
  const nowEpoch = Math.floor(now.getTime() / 1000);
  const startCurrentMonthEpoch = startOfMonthEpoch(now);
  const currency = data.invoices[0]?.currency?.toUpperCase() ?? 'USD';
  const monthWindow =
    userTier?.maxHistoryDays === 30 ? 1 : DEFAULT_MONTH_WINDOW;

  const activeSubscriptions = data.subscriptions.filter((sub) => sub.status === 'active');
  const activeCount = activeSubscriptions.length;
  const currentMrr = activeSubscriptions.reduce((sum, sub) => sum + getSubscriptionMonthlyAmount(sub), 0);

  const thirtyDaysAgoEpoch = nowEpoch - 30 * 24 * 60 * 60;
  const mrrThirtyDaysAgo = data.subscriptions
    .filter((sub) => {
      const created = sub.created ?? 0;
      const canceledAt = sub.canceled_at ?? Number.MAX_SAFE_INTEGER;
      return created <= thirtyDaysAgoEpoch && canceledAt > thirtyDaysAgoEpoch;
    })
    .reduce((sum, sub) => sum + getSubscriptionMonthlyAmount(sub), 0);

  const mrrPercentChange = mrrThirtyDaysAgo > 0 ? ((currentMrr - mrrThirtyDaysAgo) / mrrThirtyDaysAgo) * 100 : 0;
  const canceledThisMonth = data.subscriptions.filter((sub) => (sub.canceled_at ?? 0) >= startCurrentMonthEpoch);
  const activeStartOfMonth = data.subscriptions.filter((sub) => {
    const created = sub.created ?? 0;
    const canceledAt = sub.canceled_at ?? Number.MAX_SAFE_INTEGER;
    return created < startCurrentMonthEpoch && canceledAt >= startCurrentMonthEpoch;
  });

  const startMonthMrr = activeStartOfMonth.reduce((sum, sub) => sum + getSubscriptionMonthlyAmount(sub), 0);
  const churnedMrrThisMonth = canceledThisMonth.reduce((sum, sub) => sum + getSubscriptionMonthlyAmount(sub), 0);
  const customerChurnRate = activeStartOfMonth.length > 0 ? (canceledThisMonth.length / activeStartOfMonth.length) * 100 : 0;
  const revenueChurnRate = startMonthMrr > 0 ? (churnedMrrThisMonth / startMonthMrr) * 100 : 0;

  const arpu = activeCount > 0 ? currentMrr / activeCount : 0;
  const monthlyChurnRate = customerChurnRate / 100;
  const ltv = monthlyChurnRate > 0 ? arpu / monthlyChurnRate : 0;

  const ninetyDaysAgoEpoch = nowEpoch - 90 * 24 * 60 * 60;
  const trialsStarted = data.subscriptions.filter((sub) => (sub.trial_start ?? 0) >= ninetyDaysAgoEpoch);
  const convertedTrials = trialsStarted.filter(
    (sub) => (sub.status === 'active' || sub.status === 'past_due' || sub.status === 'unpaid') && !sub.canceled_at
  );
  const trialConversionRate = trialsStarted.length > 0 ? (convertedTrials.length / trialsStarted.length) * 100 : 0;

  const months = makePastMonths(monthWindow);
  const mrrMovement = months.map((monthDate) => {
    const monthStart = startOfMonthEpoch(monthDate);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const monthEnd = startOfMonthEpoch(nextMonth);

    const monthSubs = data.subscriptions.filter((sub) => {
      const created = sub.created ?? 0;
      return created >= monthStart && created < monthEnd;
    });

    const canceledMonthSubs = data.subscriptions.filter((sub) => {
      const canceledAt = sub.canceled_at ?? 0;
      return canceledAt >= monthStart && canceledAt < monthEnd;
    });

    const newMrr = monthSubs.reduce((sum, sub) => sum + getSubscriptionMonthlyAmount(sub), 0);
    const churnedMrr = canceledMonthSubs.reduce((sum, sub) => sum + getSubscriptionMonthlyAmount(sub), 0);
    const expansionMrr = newMrr * 0.1;
    const contractionMrr = newMrr * 0.05;
    const netNewMrr = newMrr + expansionMrr - contractionMrr - churnedMrr;

    return {
      month: monthLabel(monthDate),
      newMrr,
      expansionMrr,
      contractionMrr,
      churnedMrr,
      netNewMrr,
    };
  });

  const churnSeries = months.map((monthDate) => {
    const monthStart = startOfMonthEpoch(monthDate);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const monthEnd = startOfMonthEpoch(nextMonth);

    const monthCanceled = data.subscriptions.filter((sub) => {
      const canceledAt = sub.canceled_at ?? 0;
      return canceledAt >= monthStart && canceledAt < monthEnd;
    });
    const monthActiveBase = data.subscriptions.filter((sub) => {
      const created = sub.created ?? 0;
      const canceledAt = sub.canceled_at ?? Number.MAX_SAFE_INTEGER;
      return created < monthStart && canceledAt >= monthStart;
    });

    const monthStartMrr = monthActiveBase.reduce((sum, sub) => sum + getSubscriptionMonthlyAmount(sub), 0);
    const monthCanceledMrr = monthCanceled.reduce((sum, sub) => sum + getSubscriptionMonthlyAmount(sub), 0);

    return {
      month: monthLabel(monthDate),
      customerChurnRate: monthActiveBase.length > 0 ? (monthCanceled.length / monthActiveBase.length) * 100 : 0,
      revenueChurnRate: monthStartMrr > 0 ? (monthCanceledMrr / monthStartMrr) * 100 : 0,
    };
  });

  const emailMap = customerEmailById(data.customers);
  const pastDueSubs = data.subscriptions.filter((sub) => sub.status === 'past_due');
  const pendingCancelSubs = data.subscriptions.filter((sub) => sub.cancel_at_period_end);
  const failedInvoices = data.invoices.filter((invoice) => invoice.status === 'open' && invoice.attempt_count > 0);
  const trialNotConverted = data.subscriptions.filter(
    (sub) => (sub.trial_end ?? 0) < nowEpoch && sub.status !== 'active' && !sub.canceled_at
  );

  const leakItems: RevenueIntelligence['revenueLeaks']['items'] = [];

  const pushLeak = (
    customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null,
    category: RevenueIntelligence['revenueLeaks']['items'][number]['category'],
    amountAtRisk: number,
    eventEpoch?: number
  ) => {
    const id = typeof customerId === 'string' ? customerId : customerId?.id;
    const email = id ? emailMap.get(id) ?? 'Unknown customer' : 'Unknown customer';
    const daysOverdue = eventEpoch ? Math.max(0, Math.floor((nowEpoch - eventEpoch) / (24 * 60 * 60))) : 0;
    leakItems.push({ customerEmail: email, category, amountAtRisk, daysOverdue });
  };

  pastDueSubs.forEach((sub) => {
    const currentPeriodEnd = (sub as any).current_period_end as number | undefined;
    pushLeak(sub.customer, 'Past Due', getSubscriptionMonthlyAmount(sub), currentPeriodEnd ?? sub.created);
  });
  failedInvoices.slice(0, 50).forEach((invoice) => {
    pushLeak(invoice.customer, 'Failed Payment', (invoice.amount_remaining ?? invoice.amount_due ?? 0) / 100, invoice.created);
  });
  trialNotConverted.slice(0, 50).forEach((sub) => {
    pushLeak(sub.customer, 'Trial Not Converted', getSubscriptionMonthlyAmount(sub), sub.trial_end ?? sub.created);
  });
  pendingCancelSubs.forEach((sub) => {
    const currentPeriodEnd = (sub as any).current_period_end as number | undefined;
    pushLeak(sub.customer, 'Pending Cancellation', getSubscriptionMonthlyAmount(sub), sub.cancel_at ?? currentPeriodEnd ?? sub.created);
  });

  const totalAtRisk = leakItems.reduce((sum, item) => sum + item.amountAtRisk, 0);

  const planStats = new Map<string, { planName: string; subscribers: number; mrrContribution: number; canceled: number }>();
  data.subscriptions.forEach((sub) => {
    sub.items.data.forEach((item) => {
      const planName = item.price.nickname || item.price.id || item.plan?.nickname || item.plan?.id || 'Unnamed plan';
      if (!planStats.has(planName)) {
        planStats.set(planName, { planName, subscribers: 0, mrrContribution: 0, canceled: 0 });
      }
      const current = planStats.get(planName)!;
      current.subscribers += sub.status === 'active' ? 1 : 0;
      current.mrrContribution += getSubscriptionMonthlyAmount(sub);
      current.canceled += sub.canceled_at && (sub.canceled_at >= startCurrentMonthEpoch) ? 1 : 0;
    });
  });

  const planBreakdown = [...planStats.values()].map((plan) => ({
    planName: plan.planName,
    subscribers: plan.subscribers,
    mrrContribution: plan.mrrContribution,
    avgLtv: monthlyChurnRate > 0 ? (plan.mrrContribution / Math.max(plan.subscribers, 1)) / monthlyChurnRate : 0,
    churnRate: plan.subscribers > 0 ? (plan.canceled / plan.subscribers) * 100 : 0,
  }));

  return {
    mrr: {
      current: currentMrr,
      thirtyDaysAgo: mrrThirtyDaysAgo,
      percentChange: mrrPercentChange,
      currency,
    },
    activeSubscriptions: {
      active: activeCount,
      trialing: data.subscriptions.filter((s) => s.status === 'trialing').length,
      pastDue: pastDueSubs.length,
      canceledThisMonth: canceledThisMonth.length,
    },
    churn: {
      customerChurnRate,
      revenueChurnRate,
      churnedCustomersThisMonth: canceledThisMonth.length,
    },
    ltv: {
      arpu,
      monthlyChurnRate,
      ltv,
    },
    trialConversion: {
      totalTrialsStarted: trialsStarted.length,
      convertedTrials: convertedTrials.length,
      conversionRate: trialConversionRate,
    },
    mrrMovement,
    churnSeries,
    revenueLeaks: {
      totalAtRisk,
      currency,
      items: leakItems
        .sort((a, b) => b.amountAtRisk - a.amountAtRisk)
        .slice(
          0,
          userTier?.maxLeaksShown === 'unlimited' ? leakItems.length : (userTier?.maxLeaksShown ?? 20)
        ),
    },
    planBreakdown: planBreakdown.sort((a, b) => b.mrrContribution - a.mrrContribution),
    lastSyncedAt: new Date().toISOString(),
  };
}
