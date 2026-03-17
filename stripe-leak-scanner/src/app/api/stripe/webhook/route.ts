import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`Received Stripe webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        await handleSubscriptionCheckoutCompleted(event);
        break;
      
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to create Supabase client for webhooks (no cookies needed)
function createSupabaseClient() {
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {
          // No-op for webhooks
        },
        remove() {
          // No-op for webhooks
        },
      },
    }
  );
}

// Event handlers
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const scanId = session.metadata?.scanId;
  const userId = session.metadata?.userId;
  
  console.log('Checkout session completed:', {
    sessionId: session.id,
    scanId,
    userId,
    amount: session.amount_total,
    currency: session.currency,
  });

  if (scanId) {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from('scans')
      .update({
        payment_status: 'paid',
        stripe_session_id: session.id,
        payment_completed_at: new Date().toISOString(),
        amount_paid: session.amount_total ? session.amount_total / 100 : null,
        currency: session.currency,
      })
      .eq('id', scanId);

    if (error) {
      console.error('Failed to update scan payment status:', error);
    } else {
      console.log(`Updated scan ${scanId} payment status to paid`);
    }
  }

  // Create invoice record
  if (session.invoice) {
    await createInvoiceRecord(session.invoice as string);
  }
}

async function handleCheckoutSessionExpired(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const scanId = session.metadata?.scanId;
  
  if (scanId) {
    const supabase = createSupabaseClient();
    
    await supabase
      .from('scans')
      .update({ 
        payment_status: 'expired',
        stripe_session_id: session.id,
      })
      .eq('id', scanId);
  }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  console.log('Payment intent succeeded:', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  });
  
  // Could link to scan via metadata if needed
}

async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  console.warn('Payment intent failed:', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    lastPaymentError: paymentIntent.last_payment_error,
  });
}

async function handleSubscriptionCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const tier = session.metadata?.tier as string | undefined;
  const userId = session.metadata?.userId as string | undefined;
  const subscriptionId = session.subscription as string | null;

  if (!tier || !userId || tier === 'audit') return;
  if (tier !== 'indie' && tier !== 'studio') return;
  if (!subscriptionId) return;

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({
      plan: tier,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update user plan after subscription:', error);
  } else {
    console.log(`Updated user ${userId} to plan ${tier}`);
  }
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  console.log('Subscription created:', {
    subscriptionId: subscription.id,
    customerId,
    status: subscription.status,
  });
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const supabase = createSupabaseClient();

  const { error } = await supabase
    .from('users')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
      subscription_status: 'canceled',
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to reset user plan after subscription deleted:', error);
  } else {
    console.log('Reset user plan to free for subscription:', subscription.id);
  }
}

// Helper function to create invoice records
async function createInvoiceRecord(invoiceId: string) {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    
    const supabase = createSupabaseClient();
    
    await supabase
      .from('invoices')
      .insert({
        stripe_invoice_id: invoice.id,
        customer_email: invoice.customer_email || '',
        amount_due: invoice.amount_due / 100,
        amount_paid: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status,
        invoice_pdf: invoice.invoice_pdf || '',
        created_at: new Date(invoice.created * 1000).toISOString(),
      });
      
  } catch (error) {
    console.error('Failed to create invoice record:', error);
  }
}

// GET method for webhook verification (optional)
export async function GET() {
  return NextResponse.json({
    message: 'Stripe webhook endpoint is active',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}