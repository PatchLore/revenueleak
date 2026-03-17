import { NextResponse } from 'next/server';
/**
 * Demo scan endpoint.
 * Returns a hardcoded revenue leak result for UX testing.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // We ignore the actual scan ID and just return static demo data
  await params; // keep signature compatible but unused

  return NextResponse.json({
    leakAmount: '£3,240/month',
    message: "You're losing £3,240 per month due to revenue leaks",
    details: [
      { type: 'unused coupon', amount: '£1,200' },
      { type: 'failed payments', amount: '£2,040' },
    ],
  });
}
