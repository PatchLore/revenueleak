export type PlanSlug = 'free' | 'indie' | 'studio';

export interface AppUser {
  id: string;
  plan: PlanSlug | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
}

export interface StripeSubscriptionItem {
  id: string;
  price?: {
    id: string;
    nickname?: string | null;
    unit_amount: number;
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year';
      interval_count: number;
    };
  };
  plan?: {
    id: string;
    nickname?: string | null;
    amount: number;
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
}

export interface StripeSubscription {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused';
  items: {
    data: StripeSubscriptionItem[];
  };
  created: number;
  canceled_at?: number | null;
  cancel_at?: number | null;
  trial_start?: number | null;
  trial_end?: number | null;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  customer: string | { id: string };
}

export interface StripeInvoice {
  id: string;
  currency: string;
  subtotal: number;
  total: number;
  status?: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void' | null;
  attempt_count?: number;
  amount_remaining?: number;
  amount_due?: number;
  created: number;
  customer: string | { id: string };
  discount?: unknown;
  discounts?: unknown[];
}

export interface StripeCharge {
  id: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed';
  payment_intent?: string | {
    id: string;
    attempts_count?: number;
  } | null;
}

export interface StripeCustomer {
  id: string;
  email: string | null;
}

export interface StripeRefund {
  id: string;
  amount: number;
  created?: number;
}

export interface StripeCoupon {
  id: string;
  name?: string;
  percent_off?: number;
  amount_off?: number;
}

export interface StripeMetrics {
  charges: StripeCharge[];
  paymentIntents: unknown[];
  subscriptions: StripeSubscription[];
  invoices: StripeInvoice[];
  customers: StripeCustomer[];
  balanceTransactions: unknown[];
  refunds: StripeRefund[];
  failedPayments: StripeCharge[];
  cancellations: StripeSubscription[];
  coupons: StripeCoupon[];
  timeframe: { start: number; end: number };
}

export interface RevenueIntelligence {
  mrr: {
    current: number;
    thirtyDaysAgo: number;
    percentChange: number;
    currency: string;
  };
  activeSubscriptions: {
    active: number;
    trialing: number;
    pastDue: number;
    canceledThisMonth: number;
  };
  churn: {
    customerChurnRate: number;
    revenueChurnRate: number;
    churnedCustomersThisMonth: number;
  };
  ltv: {
    arpu: number;
    monthlyChurnRate: number;
    ltv: number;
  };
  trialConversion: {
    totalTrialsStarted: number;
    convertedTrials: number;
    conversionRate: number;
  };
  mrrMovement: Array<{
    month: string;
    newMrr: number;
    expansionMrr: number;
    contractionMrr: number;
    churnedMrr: number;
    netNewMrr: number;
  }>;
  churnSeries: Array<{
    month: string;
    customerChurnRate: number;
    revenueChurnRate: number;
  }>;
  revenueLeaks: {
    totalAtRisk: number;
    currency: string;
    items: Array<{
      customerEmail: string;
      category: 'Past Due' | 'Failed Payment' | 'Trial Not Converted' | 'Pending Cancellation';
      amountAtRisk: number;
      daysOverdue: number;
    }>;
  };
  planBreakdown: Array<{
    planName: string;
    subscribers: number;
    mrrContribution: number;
    avgLtv: number;
    churnRate: number;
  }>;
  lastSyncedAt: string;
}

export interface LeakAnalysis {
  failedPaymentRecovery: {
    count: number;
    recoverableAmount: number;
    potentialMrr: number;
    severity: 'Low' | 'Medium' | 'High';
    explanation: string;
  };
  churnLeak: {
    monthlyRate: number;
    revenueLost: number;
    potentialSavings: number;
    severity: 'Low' | 'Medium' | 'High';
    explanation: string;
  };
  discountLeak: {
    totalDiscounted: number;
    percentageOfRevenue: number;
    flaggedInvoices: string[];
    severity: 'Low' | 'Medium' | 'High';
    explanation: string;
  };
  annualConversion: {
    monthlyCustomers: number;
    potentialRevenue: number;
    conversionOpportunity: number;
    severity: 'Low' | 'Medium' | 'High';
    explanation: string;
  };
  dunningEfficiency: {
    avgRetryAttempts: number;
    avgDaysUntilCancel: number;
    score: number;
    severity: 'Low' | 'Medium' | 'High';
    explanation: string;
  };
  refundImpact: {
    totalRefunded: number;
    percentageOfRevenue: number;
    severity: 'Low' | 'Medium' | 'High';
    explanation: string;
  };
  revenueIntelligence?: RevenueIntelligence;
  totalRecoverable: number;
  executiveScore: number; // 0-100 health score
}

export interface AIReport {
  executiveSummary: string;
  topLeaks: Array<{
    title: string;
    impact: string;
    action: string;
  }>;
  totalRecoverable: string;
  actionPlan: string[];
  urgencyLevel: 'Critical' | 'High' | 'Medium' | 'Low';
}