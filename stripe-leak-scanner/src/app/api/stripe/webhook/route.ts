import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Stripe webhook endpoint is active (demo mode)',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}

// In demo mode, accept all webhook POSTs and do nothing.
export async function POST(_req: Request) {
  return NextResponse.json({
    received: true,
    mode: 'demo',
  });
}