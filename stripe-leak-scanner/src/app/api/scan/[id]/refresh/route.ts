import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/encryption';
import { fetchStripeData } from '@/lib/stripe-oauth';
import { computeRevenueIntelligence } from '@/lib/revenue-intelligence';
import { setCachedMetrics, generateDataHash } from '@/lib/cache';
import { getUserTier } from '@/lib/tiers';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: scan } = await supabase
    .from('scans')
    .select('*, users(stripe_account_id, plan)')
    .eq('id', id)
    .single();

  if (!scan || scan.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const usersRow = scan.users as { stripe_account_id?: string; plan?: string } | null | undefined;
  const accountIdEnc = usersRow?.stripe_account_id;
  const userPlan = (usersRow?.plan ?? 'free') as 'free' | 'indie' | 'studio';
  const tier = getUserTier({ plan: userPlan });
  const maxDays = tier.maxHistoryDays === 30 ? 30 : 365;

  if (!accountIdEnc) {
    return NextResponse.json({ error: 'No Stripe account linked' }, { status: 400 });
  }

  try {
    const accountId = decrypt(accountIdEnc);
    const stripeData = await fetchStripeData(accountId, maxDays);
    const dataHash = generateDataHash(stripeData);
    const revenueIntelligence = computeRevenueIntelligence(stripeData, tier);
    await setCachedMetrics(supabase, user.id, accountId, revenueIntelligence, dataHash);

    const { data: existing } = await supabase
      .from('scans')
      .select('analysis_results')
      .eq('id', id)
      .single();

    const currentResults = (existing as { analysis_results?: { revenueIntelligence?: unknown } })?.analysis_results;
    const enrichedResults = currentResults
      ? { ...currentResults, revenueIntelligence }
      : { revenueIntelligence };

    await supabase
      .from('scans')
      .update({
        analysis_results: enrichedResults,
        raw_metrics: stripeData,
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      revenueIntelligence,
      lastSyncedAt: revenueIntelligence.lastSyncedAt,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
