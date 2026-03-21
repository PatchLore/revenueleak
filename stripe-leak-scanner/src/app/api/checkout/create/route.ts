import { NextResponse } from 'next/server';
import { stripe, ALLOWED_PRICE_IDS } from '@/lib/stripe';
import { rateLimit } from '@/lib/rateLimit';

type Body = {
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export async function POST(req: Request) {
  const ip =
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const { allowed } = rateLimit(`checkout:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please wait a moment and try again.' },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const { priceId, successUrl, cancelUrl } = body;

  if (!priceId) {
    return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
  }

  const allowedPriceIds = Object.values(ALLOWED_PRICE_IDS).filter(Boolean) as string[];
  if (!allowedPriceIds.includes(priceId)) {
    return NextResponse.json({ error: 'Invalid priceId' }, { status: 400 });
  }

  if (!successUrl || !cancelUrl) {
    return NextResponse.json(
      { error: 'Missing successUrl or cancelUrl' },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        url: session.url,
      },
      { status: 200 },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[checkout/create] Stripe error', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}

