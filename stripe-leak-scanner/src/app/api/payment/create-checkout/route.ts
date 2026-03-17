import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scanId } = await req.json();

    if (!scanId) {
      return NextResponse.json(
        { error: 'Missing scanId parameter' },
        { status: 400 }
      );
    }

    // Verify scan exists and belongs to user
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('id, user_id, payment_status')
      .eq('id', scanId)
      .single();

    if (scanError || !scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    if (scan.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if already paid
    if (scan.payment_status === 'paid') {
      return NextResponse.json(
        { 
          error: 'Scan already paid',
          message: 'This scan has already been purchased. Refresh the page to access the full report.'
        },
        { status: 400 }
      );
    }

    // Check if there's an active checkout session
    if (scan.payment_status === 'processing') {
      // Could retrieve existing session here
      return NextResponse.json(
        { 
          error: 'Payment already in progress',
          message: 'A payment session is already active for this scan.'
        },
        { status: 400 }
      );
    }

    // Get price ID from environment
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      console.error('STRIPE_PRICE_ID not configured');
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      );
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      metadata: { 
        scanId,
        userId: user.id,
        userEmail: user.email || '',
      },
      customer_email: user.email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/scan/${scanId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/scan/${scanId}?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
      },
      custom_text: {
        submit: {
          message: 'You will receive your full revenue leak audit report immediately after payment.',
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    // Update scan with checkout session ID
    const { error: updateError } = await supabase
      .from('scans')
      .update({ 
        stripe_checkout_session_id: checkoutSession.id,
        payment_status: 'processing',
        checkout_created_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    if (updateError) {
      console.error('Failed to update scan:', updateError);
      // Continue anyway, the checkout session is created
    }

    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      expiresAt: checkoutSession.expires_at,
      success: true,
      message: 'Checkout session created successfully'
    });
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error.message,
        suggestion: 'Please try again or contact support.'
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve existing checkout session
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('scanId');
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Retrieve Stripe session
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      
      return NextResponse.json({
        success: true,
        session: {
          id: stripeSession.id,
          status: stripeSession.status,
          payment_status: stripeSession.payment_status,
          amount_total: stripeSession.amount_total,
          currency: stripeSession.currency,
          expires_at: stripeSession.expires_at,
          url: stripeSession.url,
        },
      });
    }

    if (scanId) {
      // Get scan's checkout session
      const { data: scan } = await supabase
        .from('scans')
        .select('stripe_checkout_session_id, payment_status')
        .eq('id', scanId)
        .eq('user_id', user.id)
        .single();

      if (scan?.stripe_checkout_session_id) {
        const stripeSession = await stripe.checkout.sessions.retrieve(scan.stripe_checkout_session_id);
        
        return NextResponse.json({
          success: true,
          session: {
            id: stripeSession.id,
            status: stripeSession.status,
            payment_status: stripeSession.payment_status,
            amount_total: stripeSession.amount_total,
            currency: stripeSession.currency,
            expires_at: stripeSession.expires_at,
            url: stripeSession.url,
          },
          scanPaymentStatus: scan.payment_status,
        });
      }
    }

    return NextResponse.json(
      { error: 'No session found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Checkout retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve checkout session', details: error.message },
      { status: 500 }
    );
  }
}