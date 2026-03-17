import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/encryption';
import { fetchStripeData } from '@/lib/stripe-oauth';
import { analyzeRevenueLeaks } from '@/lib/analysis-engine';
import { computeRevenueIntelligence } from '@/lib/revenue-intelligence';
import { generateAIReport } from '@/lib/ai-service';
import { getCachedMetrics, setCachedMetrics, generateDataHash } from '@/lib/cache';
import { getUserTier } from '@/lib/tiers';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  let usersRow = scan.users as { stripe_account_id?: string; plan?: string } | null | undefined;
  if (!usersRow) {
    const { data: userRow } = await supabase.from('users').select('stripe_account_id, plan').eq('id', scan.user_id).single();
    usersRow = userRow ?? undefined;
  }
  const accountIdEnc = usersRow?.stripe_account_id;
  const userPlan = (usersRow?.plan ?? 'free') as 'free' | 'indie' | 'studio';
  const tier = getUserTier({ plan: userPlan });
  const maxDays = tier.maxHistoryDays === 30 ? 30 : tier.maxHistoryDays === 'unlimited' ? 365 : 365;

  if (!accountIdEnc) {
    return NextResponse.json({ error: 'No Stripe account linked' }, { status: 400 });
  }

  try {
    await supabase.from('scans').update({ status: 'analyzing' }).eq('id', id);

    const accountId = decrypt(accountIdEnc);
    const stripeData = await fetchStripeData(accountId, maxDays);
    const dataHash = generateDataHash(stripeData);

    const cached = await getCachedMetrics(supabase, user.id, accountId);
    let revenueIntelligence =
      cached && cached.hash === dataHash ? cached.metrics : null;
    if (!revenueIntelligence) {
      revenueIntelligence = computeRevenueIntelligence(stripeData, tier);
      await setCachedMetrics(supabase, user.id, accountId, revenueIntelligence, dataHash);
    }

    const analysis = analyzeRevenueLeaks(stripeData);
    const enrichedAnalysis = {
      ...analysis,
      revenueIntelligence,
    };
    const aiReport = await generateAIReport(analysis);

    await supabase.from('scans').update({
      status: 'completed',
      raw_metrics: stripeData,
      analysis_results: enrichedAnalysis,
      ai_report: aiReport,
      completed_at: new Date().toISOString(),
    }).eq('id', id);

    return NextResponse.json({ success: true, analysis: enrichedAnalysis, aiReport });
  } catch (error) {
    console.error('Analysis error:', error);
    await supabase.from('scans').update({ status: 'error' }).eq('id', id);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}