import { NextResponse } from 'next/server';

export async function GET() {
  // Demo: pretend to connect Stripe and send the user to the leak-finder demo.
  return NextResponse.redirect('/leak-finder');
}

export async function POST(request: Request) {
  // Demo POST: ignore body and return a fake URL to leak-finder.
  await request.json().catch(() => null);
  const url = '/leak-finder';
  return NextResponse.json({
    url,
    success: true,
    redirectTo: url,
    mode: 'demo',
  });
}