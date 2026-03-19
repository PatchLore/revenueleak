 'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

type LeakDetail = {
  type: string;
  amount: string;
};

type LeakResponse = {
  leakAmount: string;
  message: string;
  details: LeakDetail[];
};

type BusinessType = 'SaaS' | 'ecommerce' | 'agency' | 'other';
type RevenueModel = 'subscription' | 'one-time';

type ScanFormState = {
  monthlyRevenue: string;
  businessType: BusinessType;
  revenueModel: RevenueModel;
  churnPct: string; // optional input
};

type ScanInputs = {
  monthlyRevenue: number;
  businessType: BusinessType;
  revenueModel: RevenueModel;
  churnPct: number | null;
};

const DEFAULT_FORM: ScanFormState = {
  monthlyRevenue: '',
  businessType: 'SaaS',
  revenueModel: 'subscription',
  churnPct: '',
};

const LOADING_MESSAGES = [
  'Analysing revenue patterns…',
  'Detecting leaks…',
] as const;

export default function LeakFinderLanding() {
  const [form, setForm] = useState<ScanFormState>(DEFAULT_FORM);
  const [activeInputs, setActiveInputs] = useState<ScanInputs | null>(null);
  const [result, setResult] = useState<LeakResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressIdx, setProgressIdx] = useState(0);

  // Temporary MVP: if Stripe redirects back with ?unlocked=true, send the user to /results.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isUnlocked = params.get('unlocked') === 'true';
    if (isUnlocked) {
      window.location.href = '/results?unlocked=true';
    }
  }, []);

  // Rotate loading text while scan is running
  useEffect(() => {
    if (!loading) return;

    const interval = window.setInterval(() => {
      setProgressIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 900);

    return () => window.clearInterval(interval);
  }, [loading]);

  const runScan = async (inputs: ScanInputs) => {
    try {
      setLoading(true);
      setError(null);
      setProgressIdx(0);

      // UX: simulate scan time before showing estimated results
      await new Promise((r) => setTimeout(r, 3000));

      const params = new URLSearchParams({
        monthlyRevenue: inputs.monthlyRevenue.toString(),
        businessType: inputs.businessType,
        revenueModel: inputs.revenueModel,
      });
      if (inputs.churnPct != null) {
        params.set('churnPct', inputs.churnPct.toString());
      }

      // The estimate endpoint currently ignores inputs, but we pass them in for future integration.
      const res = await fetch(`/api/scan/demo?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to run scan');
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const monthlyRevenue = Number(form.monthlyRevenue);
    if (!Number.isFinite(monthlyRevenue) || monthlyRevenue <= 0) {
      setError('Enter your monthly revenue as a number.');
      return;
    }

    const churnPctRaw = form.churnPct.trim();
    const churnPct = churnPctRaw === '' ? null : Number(churnPctRaw);
    if (churnPct != null && (!Number.isFinite(churnPct) || churnPct < 0)) {
      setError('Churn % must be a valid number (or leave it blank).');
      return;
    }

    const inputs: ScanInputs = {
      monthlyRevenue,
      businessType: form.businessType,
      revenueModel: form.revenueModel,
      churnPct,
    };

    setActiveInputs(inputs);
    await runScan(inputs);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-3xl w-full">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/50 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Revenue Leak Finder
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            See how much revenue you&apos;re leaking
          </h1>
          <p className="mt-3 text-sm text-white/60 max-w-xl mx-auto">
            Get an instant estimate of where your revenue may be leaking — no integrations required.
          </p>
        </header>

        <main className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 backdrop-blur-2xl px-6 md:px-8 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.8)]">
          {!loading && !result && (
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-white/40 mb-2">
                  Monthly revenue
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.monthlyRevenue}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyRevenue: e.target.value }))}
                  placeholder="e.g. 50000"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-white/40 mb-2">
                    Business type
                  </label>
                  <select
                    value={form.businessType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, businessType: e.target.value as BusinessType }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-500/60"
                  >
                    <option value="SaaS">SaaS</option>
                    <option value="ecommerce">ecommerce</option>
                    <option value="agency">agency</option>
                    <option value="other">other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-white/40 mb-2">
                    Revenue model
                  </label>
                  <select
                    value={form.revenueModel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, revenueModel: e.target.value as RevenueModel }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-500/60"
                  >
                    <option value="subscription">subscription</option>
                    <option value="one-time">one-time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-white/40 mb-2">
                  Optional churn %
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.churnPct}
                  onChange={(e) => setForm((f) => ({ ...f, churnPct: e.target.value }))}
                  placeholder="e.g. 4.5"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-emerald-500/60"
                />
              </div>

              {error && <p className="text-sm text-red-300">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-full bg-emerald-500 text-black px-6 py-3 text-sm font-semibold hover:bg-emerald-400 transition disabled:opacity-60"
              >
                {loading ? 'Scanning…' : 'Run Free Scan'}
              </button>

              <p className="text-[11px] text-white/40">
                No Stripe connection required • Takes 60 seconds
              </p>
            </form>
          )}

          {loading && !result && (
            <div className="text-center py-10">
              <div className="mb-4 flex items-center justify-center">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 rounded-full border border-white/10" />
                  <div className="absolute inset-1 rounded-full border-t-2 border-emerald-400 animate-spin-slow" />
                </div>
              </div>
              <p className="text-sm text-white/70">{LOADING_MESSAGES[progressIdx]}</p>
            </div>
          )}

          {!loading && !result && error && (
            <div className="text-center py-8">
              <p className="text-sm text-red-300 mb-3">{error}</p>
              <button
                type="button"
                onClick={() => {
                  if (activeInputs) void runScan(activeInputs);
                }}
                disabled={!activeInputs}
                className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-2 text-sm font-semibold hover:bg-white/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && result && (
            <>
              <section className="text-center mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                  Estimated leak
                </p>
                <p className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-emerald-300 via-emerald-500 to-red-400 bg-clip-text text-transparent">
                  {result.leakAmount}
                </p>
                <p className="mt-3 text-sm text-white/60">{result.message}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-sm md:text-base font-semibold mb-3">Leak breakdown</h2>
                <div className="space-y-3">
                  {result.details.map((item, idx) => (
                    <div
                      key={`${item.type}-${idx}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/40 mb-1">
                          {item.type}
                        </p>
                        <p className="text-xs text-white/60">
                          Example leak category shown for illustration.
                        </p>
                      </div>
                      <p className="text-sm md:text-base font-semibold text-emerald-200">
                        {item.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (activeInputs) void runScan(activeInputs);
                  }}
                  disabled={!activeInputs || loading}
                  className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-2.5 text-sm font-semibold hover:bg-white/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Scan Again
                </button>
                <Link
                  href="/"
                  className="text-xs text-white/50 hover:text-white/80 transition"
                >
                  Back to main site
                </Link>
              </section>
            </>
          )}
        </main>

        <p className="mt-4 text-[11px] text-white/40 text-center">
          No integrations required • Instant analysis
        </p>
      </div>
    </div>
  );
}

