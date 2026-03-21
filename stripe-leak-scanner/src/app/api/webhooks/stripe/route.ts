import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { savePurchase } from '@/lib/purchasesStore';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook signature missing' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[webhooks/stripe] Signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const amountTotal = session.amount_total ?? 0;
    const customerEmail =
      (session.customer_details && session.customer_details.email) ||
      (session.customer_email as string | null) ||
      null;

    savePurchase({
      sessionId: session.id,
      customerEmail,
      priceId: (session.metadata && (session.metadata.priceId as string)) || 'unknown',
      amount: amountTotal,
      createdAt: Date.now(),
    });
  }

  return NextResponse.json({ received: true }, { status:200 });
}

