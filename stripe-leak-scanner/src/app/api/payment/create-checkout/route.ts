import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Demo checkout endpoint: no real Stripe call, just return a fake URL.
  await req.json().catch(() => null);

  return NextResponse.json({
    url: '/leak-finder?checkout=demo',
    sessionId: 'cs_demo_123',
    expiresAt: Math.floor(Date.now() / 1000) + 30 * 60,
    success: true,
    message: 'Checkout session simulated (demo mode, no real charge).',
  });
}

export async function GET(req: Request) {
  // Demo GET: echo back that there is no real session in demo mode.
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId') ?? 'cs_demo_123';

  return NextResponse.json({
    success: true,
    session: {
      id: sessionId,
      status: 'demo',
      payment_status: 'unpaid',
      amount_total: 0,
      currency: 'usd',
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      url: '/leak-finder?checkout=demo',
    },
    mode: 'demo',
  });
}