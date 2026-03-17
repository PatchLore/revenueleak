import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // PDF export is not yet implemented in this MVP.
  // This endpoint exists as a placeholder for future implementation.
  const { method } = request;
  if (method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  return NextResponse.json(
    {
      error: 'PDF export not yet implemented',
      suggestion: 'Use the on-screen report for now. PDF download will be added soon.',
    },
    { status: 501 }
  );
}

// No GET handler for now; reserved for future implementation.