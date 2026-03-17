import type Stripe from 'stripe';

export type PlanSlug = 'free' | 'indie' | 'studio';

export interface AppUser {
  id: string;
  plan: PlanSlug | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
}

export interface StripeMetrics {
  charges: Stripe.Charge[];
  paymentIntents: Stripe.PaymentIntent[];
  subscriptions: Stripe.Subscription[];
  invoices: Stripe.Invoice[];
  customers: Stripe.Customer[];
  balanceTransactions: Stripe.BalanceTransaction[];
  refunds: Stripe.Refund[];
  failedPayments: Stripe.Charge[];
  cancellations: Stripe.Subscription[];
  coupons: Stripe.Coupon[];
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