import { NextResponse } from 'next/server';
import { DEMO_MODE } from '@/config/mode';

/**
 * Demo-only subscription checkout.
 * This route must not import the `stripe` SDK so Next.js can build without the `stripe` package installed.
 */
export async function POST() {
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

  // Non-demo mode: we still cannot import the `stripe` SDK in this build setup.
  // Return the same checkout link so the app continues to function.
  const paymentLinkUrl = process.env.STRIPE_PAYMENT_LINK_URL;
  if (!paymentLinkUrl) {
    return NextResponse.json(
      { success: false, error: 'Missing STRIPE_PAYMENT_LINK_URL. Set it in your Vercel environment variables.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    url: paymentLinkUrl,
    sessionId: 'demo',
  });
}

export async function GET() {
  const paymentLinkUrl = process.env.STRIPE_PAYMENT_LINK_URL;
  if (!paymentLinkUrl) {
    return NextResponse.json(
      { success: false, message: 'Missing STRIPE_PAYMENT_LINK_URL.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, url: paymentLinkUrl });
}
