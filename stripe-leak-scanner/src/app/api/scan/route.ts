import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { fetchStripeData, getAccountConnection } from '@/lib/stripe-oauth';
import { analyzeRevenueLeaks } from '@/lib/analysis-engine';
import { generateAIReport } from '@/lib/ai-service';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
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

    // Store scan results in database
    const scanResult = {
      user_id: user.id,
      account_id: accountId,
      analysis,
      ai_report: aiReport,
      total_recoverable: analysis.totalRecoverable,
      executive_score: analysis.executiveScore,
      created_at: new Date().toISOString(),
    };

    // TODO: Store in Supabase
    // const { data, error } = await supabase
    //   .from('scans')
    //   .insert([scanResult])
    //   .select()
    //   .single();

    // if (error) {
    //   console.error('Failed to save scan:', error);
    // }

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
  } catch (error: any) {
    console.error('Scan Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform scan',
        details: error.message,
        suggestion: 'Please check your Stripe connection and try again.'
      }, 
      { status: 500 }
    );
  }
}

// GET method to retrieve previous scans
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch scans from database
    // const { data: scans, error } = await supabase
    //   .from('scans')
    //   .select('*')
    //   .eq('user_id', user.id)
    //   .order('created_at', { ascending: false })
    //   .limit(10);

    // if (error) {
    //   console.error('Failed to fetch scans:', error);
    //   return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 });
    // }

    // Mock data for now
    const scans: any[] = [];

    return NextResponse.json({
      success: true,
      scans,
      count: scans.length,
    });
  } catch (error: any) {
    console.error('Get Scans Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scans', details: error.message },
      { status: 500 }
    );
  }
}