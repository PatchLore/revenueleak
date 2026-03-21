import { DEMO_MODE } from '@/config/mode';
import type { StripeMetrics } from '@/types';

// Demo-aware Stripe OAuth utilities. In DEMO_MODE we return stubbed data;
// when DEMO_MODE is false, you can wire real Stripe logic into the non-demo branches.

export async function createOAuthLink(_state: string): Promise<string> {
  if (DEMO_MODE) {
    // In demo mode, just send the user to the leak-finder page.
    return '/leak-finder';
  }

  // Real implementation placeholder — to be filled when enabling live Stripe.
  // For now, fall back to demo behavior for safety.
  return '/leak-finder';
}

export async function exchangeCodeForToken(_code: string): Promise<string> {
  if (DEMO_MODE) {
    // Return a fake connected account ID in demo mode.
    return 'acct_demo_123';
  }

  // Real implementation placeholder — to be filled when enabling live Stripe.
  return '';
}

export async function fetchStripeData(
  _accountId: string,
  _maxDays: number = 365
): Promise<StripeMetrics> {
  if (DEMO_MODE) {
    // Return empty Stripe metrics for demo purposes so analysis functions still work.
    const now = Math.floor(Date.now() / 1000);
    return {
      charges: [],
      paymentIntents: [],
      subscriptions: [],
      invoices: [],
      customers: [],
      balanceTransactions: [],
      refunds: [],
      failedPayments: [],
      cancellations: [],
      coupons: [],
      timeframe: { start: now, end: now },
    };
  }

  // Real implementation placeholder — to be filled when enabling live Stripe.
  const now = Math.floor(Date.now() / 1000);
  return {
    charges: [],
    paymentIntents: [],
    subscriptions: [],
    invoices: [],
    customers: [],
    balanceTransactions: [],
    refunds: [],
    failedPayments: [],
    cancellations: [],
    coupons: [],
    timeframe: { start: now, end: now },
  };
}

export async function storeAccountConnection(
  _userId: string,
  _accountId: string
): Promise<void> {
  if (DEMO_MODE) {
    // No-op in demo mode.
    return;
  }

  // Real implementation placeholder.
}

export async function getAccountConnection(_userId: string): Promise<string | null> {
  if (DEMO_MODE) {
    // No stored connections in demo mode.
    return null;
  }

  // Real implementation placeholder.
  return null;
}