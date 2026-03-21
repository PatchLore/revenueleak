import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { fetchStripeData, getAccountConnection } from '@/lib/stripe-oauth';
import { analyzeRevenueLeaks } from '@/lib/analysis-engine';
import { generateAIReport } from '@/lib/ai-service';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe account connection
    const accountId = await getAccountConnection(user.id);
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'No Stripe account connected. Please connect your Stripe account first.' },
        { status: 400 }
      );
    }

    // Fetch Stripe data
    const stripeData = await fetchStripeData(accountId);
    
    // Analyze revenue leaks
    const analysis = analyzeRevenueLeaks(stripeData);
    
    // Generate AI report
    const aiReport = await generateAIReport(analysis);

    return NextResponse.json({
      success: true,
      message: 'Scan completed successfully',
      data: {
        analysis,
        aiReport,
        scanId: 'temp-scan-id', // Replace with actual scan ID from database
        timestamp: new Date().toISOString(),
      },
      summary: {
        totalRecoverable: `$${analysis.totalRecoverable.toFixed(2)}`,
        executiveScore: analysis.executiveScore,
        urgencyLevel: aiReport.urgencyLevel,
        topLeak: aiReport.topLeaks[0]?.title || 'No critical leaks found',
      },
    });
  } catch (error) {
    console.error('Scan Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform scan',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please check your Stripe connection and try again.'
      }, 
      { status: 500 }
    );
  }
}

// GET method to retrieve previous scans
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock data for now
    const scans: never[] = [];

    return NextResponse.json({
      success: true,
      scans,
      count: scans.length,
    });
  } catch (error) {
    console.error('Get Scans Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scans', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}