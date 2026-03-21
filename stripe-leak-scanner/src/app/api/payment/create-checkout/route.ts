import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Static Stripe Payment Link (no Stripe SDK call).
  // Expected behavior:
  // - frontend calls this endpoint
  // - redirect user to returned `url`
  const body = (await req.json().catch(() => ({}))) as { returnUrl?: string };

  const paymentLinkUrl = process.env.STRIPE_PAYMENT_LINK_URL;
  // Temporary MVP: after successful payment, redirect user to /results?unlocked=true
  const returnUrl = body.returnUrl ?? '/results?unlocked=true';

  if (!paymentLinkUrl) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Missing STRIPE_PAYMENT_LINK_URL. Set it in your Vercel environment variables.',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    url: paymentLinkUrl,
    returnUrl,
  });
}

export async function GET() {
  // Optional: allow previewing the payment link URL.
  const url = process.env.STRIPE_PAYMENT_LINK_URL;
  if (!url) {
    return NextResponse.json(
      { success: false, error: 'Missing STRIPE_PAYMENT_LINK_URL' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, url });
}