import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/encryption';
import { fetchStripeData } from '@/lib/stripe-oauth';
import { analyzeRevenueLeaks, StripeData } from '@/lib/leakEngine';

export async function POST(_req: Request) {
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
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Supabase auth error:', userError);
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch encrypted Stripe account ID from the user record
    const { data: userRow, error: userRowError } = await supabase
      .from('users')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (userRowError) {
      console.error('Failed to load user row:', userRowError);
      return NextResponse.json(
        { success: false, error: 'Failed to load Stripe connection' },
        { status: 500 }
      );
    }

    const encryptedAccountId = userRow?.stripe_account_id as string | null | undefined;

    if (!encryptedAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No Stripe account connected. Please connect your Stripe account first.',
        },
        { status: 400 }
      );
    }

    const accountId = decrypt(encryptedAccountId);

    // Fetch raw Stripe metrics using existing integration
    const stripeMetrics = await fetchStripeData(accountId);

    // Map StripeMetrics -> StripeData expected by leak engine
    const stripeData: StripeData = {
      customers: stripeMetrics.customers,
      subscriptions: stripeMetrics.subscriptions,
      invoices: stripeMetrics.invoices,
      charges: stripeMetrics.charges,
      refunds: stripeMetrics.refunds,
    };

    const report = analyzeRevenueLeaks(stripeData);

    return NextResponse.json({
      success: true,
      totalLeakMonthly: report.totalLeakMonthly,
      leaks: report.leaks,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Leak analysis error:', err);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze revenue leaks',
        details: err.message,
      },
      { status: 500 }
    );
  }
}

