import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-02-25.clover' as any,
});

export const ALLOWED_PRICE_IDS: Record<string, string | undefined> = {
  LEAKSWEEP_PRO: process.env.STRIPE_PRICE_ID,
  LAUNCH_CONCIERGE_STANDARD: process.env.STRIPE_PRICE_LAUNCH_CONCIERGE_STANDARD,
  LAUNCH_CONCIERGE_PREMIUM: process.env.STRIPE_PRICE_LAUNCH_CONCIERGE_PREMIUM,
};

