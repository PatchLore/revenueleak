import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Demo callback: in real mode you would verify the Stripe OAuth flow here.
  // For now, just send the user to the leak-finder page with a success flag.
  const url = new URL('/leak-finder?connected=stripe-demo', req.url);
  return NextResponse.redirect(url);
}