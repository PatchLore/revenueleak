import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { DEMO_MODE } from '@/config/mode';

const TIER_PRICE_IDS: Record<string, string | undefined> = {
  indie: process.env.STRIPE_PRICE_ID_INDIE,
  studio: process.env.STRIPE_PRICE_ID_STUDIO,
};

export async function POST(req: Request) {
  if (DEMO_MODE) {
    const paymentLinkUrl = process.env.STRIPE_PAYMENT_LINK_URL;
    if (!paymentLinkUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing STRIPE_PAYMENT_LINK_URL. Set it in your Vercel environment variables.' },
        { status: 500 }
      );
    }

    // Demo mode: do not create a Stripe subscription session. Redirect to a preconfigured checkout link.
    return NextResponse.json({
      success: true,
      url: paymentLinkUrl,
      sessionId: 'demo',
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const tier = (body.tier ?? body.tierId) as string;
    if (tier !== 'indie' && tier !== 'studio') {
      return NextResponse.json(
        { error: 'Invalid tier. Use "indie" or "studio".' },
        { status: 400 }
      );
    }

    const priceId = TIER_PRICE_IDS[tier];
    if (!priceId) {
      return NextResponse.json(
        { error: `Subscription price for ${tier} is not configured.` },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: user.id, tier },
      customer_email: user.email ?? undefined,
      success_url: `${baseUrl}/dashboard?upgraded=${tier}`,
      cancel_url: `${baseUrl}/dashboard`,
      subscription_data: {
        metadata: { userId: user.id, tier },
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      success: true,
    });
  } catch (err: unknown) {
    console.error('Subscription checkout error:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
