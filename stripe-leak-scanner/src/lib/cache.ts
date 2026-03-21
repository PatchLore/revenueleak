import type { RevenueIntelligence, StripeMetrics } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function getCachedMetrics(
  supabase: SupabaseClient,
  userId: string,
  stripeAccountId: string
): Promise<{ metrics: RevenueIntelligence; hash: string } | null> {
  const { data, error } = await supabase
    .from('metric_cache')
    .select('metrics, stripe_data_hash, expires_at')
    .eq('user_id', userId)
    .eq('stripe_account_id', stripeAccountId)
    .single();

  if (error || !data) return null;
  const row = data as { metrics: RevenueIntelligence; stripe_data_hash: string | null; expires_at: string };
  if (new Date(row.expires_at) <= new Date()) return null;
  return {
    metrics: row.metrics,
    hash: row.stripe_data_hash ?? '',
  };
}

export async function setCachedMetrics(
  supabase: SupabaseClient,
  userId: string,
  stripeAccountId: string,
  metrics: RevenueIntelligence,
  dataHash: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await supabase.from('metric_cache').upsert(
    {
      user_id: userId,
      stripe_account_id: stripeAccountId,
      cached_at: new Date().toISOString(),
      expires_at: expiresAt,
      metrics,
      stripe_data_hash: dataHash,
    },
    { onConflict: 'user_id,stripe_account_id' }
  );
}

export function generateDataHash(stripeData: StripeMetrics): string {
  const payload = {
    subs: stripeData.subscriptions.length,
    invoices: stripeData.invoices.length,
    customers: stripeData.customers.length,
    start: stripeData.timeframe.start,
    end: stripeData.timeframe.end,
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
