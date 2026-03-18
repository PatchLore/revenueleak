'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LeakReport, LeakSeverity } from '@/lib/leakEngine';
import { LeakSummaryHero } from '@/components/LeakSummaryHero';

type ScanDemoResponse = {
  leakAmount: string;
  message: string;
  totalLeakMonthly?: number;
  breakdown?: {
    'failed payments'?: number;
    churn?: number;
    pricing?: number;
  };
  details?: Array<{ type: string; amount: string }>;
};

function getSeverity(value: number): LeakSeverity {
  if (value >= 10000) return 'high';
  if (value >= 1000) return 'medium';
  return 'low';
}

export default function ResultsPage() {
  const [unlocked, setUnlocked] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanDemoResponse | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUnlocked(params.get('unlocked') === 'true');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        // In demo mode the scan endpoint returns static/hardcoded data.
        const res = await fetch('/api/scan/demo');
        const json = (await res.json()) as ScanDemoResponse;
        if (!res.ok) throw new Error(json && (json as any).error ? (json as any).error : 'Failed to load results');
        if (!cancelled) setScan(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load results');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const report = useMemo<LeakReport | null>(() => {
    if (!scan) return null;

    const totalLeakMonthly = typeof scan.totalLeakMonthly === 'number' ? scan.totalLeakMonthly : 0;
    const breakdown = scan.breakdown ?? {};

    const failed = Number(breakdown['failed payments'] ?? 0);
    const churn = Number(breakdown.churn ?? 0);
    const pricing = Number(breakdown.pricing ?? 0);

    const leaks: LeakReport['leaks'] = [
      {
        type: 'failed_payments',
        title: 'Failed Payments',
        description: 'Unrecovered failed charges from the last 30 days',
        monthlyValue: failed,
        severity: getSeverity(failed),
      },
      {
        type: 'churn_risk',
        title: 'Churn Risk',
        description: 'Customers cancelling early in their lifecycle',
        monthlyValue: churn,
        severity: getSeverity(churn),
      },
      {
        type: 'underpriced_customers',
        title: 'Underpriced Customers',
        description: 'Legacy users paying below your current pricing',
        monthlyValue: pricing,
        severity: getSeverity(pricing),
      },
    ];

    return { totalLeakMonthly, leaks };
  }, [scan]);

  const onUnlock = async () => {
    try {
      const res = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: '/results?unlocked=true' }),
      });
      const json = await res.json();
      if (!res.ok || !json?.url) throw new Error(json?.error || 'Failed to create checkout');
      window.location.href = json.url as string;
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e instanceof Error ? e.message : 'Failed to start payment');
    }
  };

  if (loading || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
        <div className="text-center max-w-md">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Preparing your report...</h2>
          <p className="text-white/60 text-sm">Almost there.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-white/60 text-sm mb-6">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-2 text-sm font-semibold hover:bg-white/90 transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <LeakSummaryHero
      report={report}
      currencySymbol="£"
      isProUser={unlocked}
      onUnlock={onUnlock}
    />
  );
}

