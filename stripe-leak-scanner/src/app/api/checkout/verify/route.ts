import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { savePurchase, getPurchase } from '@/lib/purchasesStore';

type VerifyBody = {
  sessionId?: string;
};

export async function POST(req: Request) {
  let body: VerifyBody;
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    body = {};
  }

  const sessionId = body.sessionId;

  if (!sessionId) {
    return NextResponse.json(
      { paid: false, error: 'Missing sessionId' },
      { status: 400 },
    );
  }

  const existing = getPurchase(sessionId);
  if (existing) {
    return NextResponse.json(
      {
        paid: true,
        customerEmail: existing.customerEmail ?? undefined,
        amountTotal: existing.amount,
      },
      { status: 200 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ paid: false }, { status: 200 });
    }

    const amountTotal = session.amount_total ?? 0;
    const customerEmail =
      (session.customer_details && session.customer_details.email) ||
      (session.customer_email as string | null) ||
      null;

    const record = {
      sessionId: session.id,
      customerEmail,
      priceId: (session.metadata && (session.metadata.priceId as string)) || 'unknown',
      amount: amountTotal,
      createdAt: Date.now(),
    };

    savePurchase(record);

    return NextResponse.json(
      {
        paid: true,
        customerEmail: customerEmail ?? undefined,
        amountTotal,
      },
      { status: 200 },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[checkout/verify] Error verifying session', error);
    return NextResponse.json(
      { paid: false, error: 'Failed to verify session' },
      { status: 500 },
    );
  }
}

