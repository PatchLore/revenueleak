import Stripe from 'stripe';
import { encrypt } from './encryption';
import { StripeMetrics } from '@/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

export async function createOAuthLink(state: string): Promise<string> {
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/callback` : '';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
    scope: 'read_only',
    state: state,
    redirect_uri: redirectUri,
  });
  
  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code,
  });

  // stripe_user_id should be present for a successful connection, but guard just in case
  return response.stripe_user_id ?? '';
}

export async function fetchStripeData(accountId: string, maxDays: number = 365): Promise<StripeMetrics> {
  const client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
    stripeAccount: accountId,
  });

  const end = Math.floor(Date.now() / 1000);
  const start = end - (maxDays * 24 * 60 * 60);

  const [
    charges,
    paymentIntents,
    subscriptions,
    invoices,
    customers,
    balanceTransactions,
    refunds,
  ] = await Promise.all([
    client.charges.list({ limit: 100, created: { gte: start } }).autoPagingToArray({ limit: 1000 }),
    client.paymentIntents.list({ limit: 100, created: { gte: start } }).autoPagingToArray({ limit: 1000 }),
    client.subscriptions.list({ limit: 100, created: { gte: start } }).autoPagingToArray({ limit: 1000 }),
    client.invoices.list({ limit: 100, created: { gte: start } }).autoPagingToArray({ limit: 1000 }),
    client.customers.list({ limit: 100, created: { gte: start } }).autoPagingToArray({ limit: 1000 }),
    client.balanceTransactions.list({ limit: 100, created: { gte: start } }).autoPagingToArray({ limit: 1000 }),
    client.refunds.list({ limit: 100, created: { gte: start } }).autoPagingToArray({ limit: 1000 }),
  ]);

  // Filter failed payments
  const failedPayments = charges.filter(c => !c.captured && c.status === 'failed');
  
  // Filter cancellations
  const cancellations = subscriptions.filter(s => s.canceled_at);

  // Fetch coupons
  const coupons = await client.coupons.list({ limit: 100 }).autoPagingToArray({ limit: 100 });

  return {
    charges,
    paymentIntents,
    subscriptions,
    invoices,
    customers,
    balanceTransactions,
    refunds,
    failedPayments,
    cancellations,
    coupons,
    timeframe: { start, end },
  };
}

// Store encrypted account ID in database
export async function storeAccountConnection(userId: string, accountId: string): Promise<void> {
  const encryptedAccountId = encrypt(accountId);
  
  // TODO: Implement database storage
  // await db.stripeConnections.create({
  //   data: {
  //     userId,
  //     encryptedAccountId,
  //     connectedAt: new Date(),
  //   },
  // });
}

// Retrieve account ID from database
export async function getAccountConnection(userId: string): Promise<string | null> {
  // TODO: Implement database retrieval
  // const connection = await db.stripeConnections.findFirst({
  //   where: { userId },
  //   orderBy: { connectedAt: 'desc' },
  // });
  // 
  // return connection ? decrypt(connection.encryptedAccountId) : null;
  return null;
}