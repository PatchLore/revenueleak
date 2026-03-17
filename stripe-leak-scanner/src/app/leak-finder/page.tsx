 'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type LeakDetail = {
  type: string;
  amount: string;
};

type LeakResponse = {
  leakAmount: string;
  message: string;
  details: LeakDetail[];
};

export default function LeakFinderLanding() {
  const [result, setResult] = useState<LeakResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScan = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use a fixed demo ID; API ignores the actual value and returns static data
      const res = await fetch('/api/scan/demo');
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

  useEffect(() => {
    runScan();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-3xl w-full">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/50 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Revenue Leak Finder (Demo)
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            See how much revenue you&apos;re leaking
          </h1>
          <p className="mt-3 text-sm text-white/60 max-w-xl mx-auto">
            This demo uses hardcoded results so you can test the UX and conversion flow without
            connecting a real Stripe account.
          </p>
        </header>

        <main className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 backdrop-blur-2xl px-6 md:px-8 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.8)]">
          {loading && (
            <div className="text-center py-10">
              <div className="mb-4 flex items-center justify-center">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 rounded-full border border-white/10" />
                  <div className="absolute inset-1 rounded-full border-t-2 border-emerald-400 animate-spin-slow" />
                </div>
              </div>
              <p className="text-sm text-white/70">Scanning your revenue leaks...</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-8">
              <p className="text-sm text-red-300 mb-3">{error}</p>
              <button
                type="button"
                onClick={runScan}
                className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-2 text-sm font-semibold hover:bg-white/90 transition"
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
                          Simulated leak category for demo purposes.
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
                  onClick={runScan}
                  className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-2.5 text-sm font-semibold hover:bg-white/90 transition"
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

        <p className="mt-4 text-[11px] text-white/35 text-center">
          Demo mode — no real Stripe data is accessed. All results are hardcoded for UX testing.
        </p>
      </div>
    </div>
  );
}

