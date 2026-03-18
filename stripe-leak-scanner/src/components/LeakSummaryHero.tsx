'use client';

import { useEffect, useState } from 'react';
import type { LeakReport } from '@/lib/leakEngine';

type Props = {
  report: LeakReport;
  currencySymbol?: string;
  onUnlock?: () => void;
  isProUser?: boolean;
  onLeakAction?: (leakType: LeakReport['leaks'][number]['type']) => void;
};

export function LeakSummaryHero({
  report,
  currencySymbol = '£',
  onUnlock,
  isProUser = false,
  onLeakAction,
}: Props) {
  const [isRevealing, setIsRevealing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealing(false), 1200);
    return () => clearTimeout(timer);
  }, [report]);

  const { totalLeakMonthly, leaks } = report;
  const sortedLeaks = [...leaks].sort((a, b) => b.monthlyValue - a.monthlyValue);
  const topLeaks = sortedLeaks
    .sort((a, b) => b.monthlyValue - a.monthlyValue)
    .slice(0, 3);
  const remainingLeaks = sortedLeaks.slice(3);
  const isLocked = isProUser === false;

  const formatMoney = (value: number) =>
    `${currencySymbol}${value.toLocaleString('en-GB', {
      maximumFractionDigits: 0,
    })}`;

  const formatAmount = (value: number) =>
    value.toLocaleString('en-GB', { maximumFractionDigits: 0 });

  const handleUnlockFullReport = () => {
    // eslint-disable-next-line no-console
    console.log('[LeakSummaryHero] Unlock Full Report – $19');
    onUnlock?.();
  };

  const handleGetFixPlan = () => {
    // eslint-disable-next-line no-console
    console.log('[LeakSummaryHero] Get Fix Plan – $49');
    window.location.href = '/contact?service=fix-sprint';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/95 px-4">
      <div
        className={`max-w-2xl w-full text-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 backdrop-blur-2xl px-8 py-12 shadow-[0_40px_120px_rgba(0,0,0,0.85)] transition-all duration-700 ${
          isRevealing ? 'opacity-0 translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'
        }`}
      >
        <div className="mb-6 text-xs uppercase tracking-[0.2em] text-white/40">
          Revenue Leak Scan
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
          You&apos;re losing{' '}
          <span className="block text-5xl md:text-6xl font-bold mt-2 bg-gradient-to-r from-emerald-300 via-emerald-500 to-red-400 bg-clip-text text-transparent">
            {formatMoney(totalLeakMonthly)}/month
          </span>
        </h1>

        <p className="text-sm md:text-base text-white/60 mb-10">
          Here&apos;s where your revenue is leaking.
        </p>

        <div className="grid gap-4 md:gap-5 mb-8">
          {topLeaks.map((leak, index) => {
            const severityColor =
              leak.severity === 'high'
                ? 'border-red-500/40 bg-red-500/5'
                : leak.severity === 'medium'
                ? 'border-amber-400/40 bg-amber-400/5'
                : 'border-emerald-400/30 bg-emerald-400/5';

            return (
              <div
                key={leak.type + index}
                className={`flex items-start justify-between rounded-2xl border px-5 py-4 md:px-6 md:py-5 text-left transition-transform duration-500 ${
                  severityColor
                } ${isRevealing ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100'}`}
                style={{
                  transitionDelay: isRevealing ? undefined : `${120 + index * 70}ms`,
                }}
              >
                <div className="pr-4">
                  <div className="text-xs uppercase tracking-wide text-white/50 mb-1">
                    {index === 0 ? 'Biggest leak' : `Leak ${index + 1}`}
                  </div>
                  <h2 className="text-sm md:text-base font-semibold text-white mb-1">
                    {leak.title}
                  </h2>
                  <p className="text-xs md:text-sm text-white/60">{leak.description}</p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="text-xs text-white/40 mb-1">At risk / month</div>
                  <div
                    className={`text-lg md:text-2xl font-semibold ${
                      leak.severity === 'high'
                        ? 'text-red-300'
                        : leak.severity === 'medium'
                        ? 'text-amber-200'
                        : 'text-emerald-200'
                    }`}
                  >
                    {formatMoney(leak.monthlyValue)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative">
          <div className={isLocked ? 'blur-md pointer-events-none select-none' : ''}>
            {/* Recommended actions per leak */}
            <div className="mb-8 text-left">
          <h2 className="text-sm md:text-base font-semibold text-white mb-3">
            Recommended Actions
          </h2>
          <div className="space-y-3">
            {topLeaks.map((leak) => {
              const actionLabel =
                leak.type === 'failed_payments'
                  ? 'Recover failed payments'
                  : leak.type === 'churn_risk'
                  ? 'Trigger dunning email'
                  : leak.type === 'underpriced_customers'
                  ? 'Upgrade pricing'
                  : 'Review refunds';

              const suggestedFix =
                leak.type === 'failed_payments'
                  ? 'Tighten your retry logic and add an automated email sequence for failed payments.'
                  : leak.type === 'churn_risk'
                  ? 'Reach out to recently cancelled customers with a save offer or exit survey.'
                  : leak.type === 'underpriced_customers'
                  ? 'Move underpriced customers to your current standard plan on renewal.'
                  : 'Audit refund reasons and tighten refund and quality policies where appropriate.';

              const handleClick = () => {
                if (typeof onLeakAction === 'function') {
                  onLeakAction(leak.type);
                } else {
                  // Placeholder actions for future automation hooks
                  // eslint-disable-next-line no-console
                  console.log(
                    `[LeakAction] ${leak.type} -> ${actionLabel} for ~${formatMoney(
                      leak.monthlyValue
                    )}/month at risk`
                  );
                }
              };

              return (
                <div
                  key={`action-${leak.type}`}
                  className="flex items-start justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="pr-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/40 mb-1">
                      {leak.title}
                    </p>
                    <p className="text-xs md:text-sm text-white/65">{suggestedFix}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClick}
                    className="shrink-0 inline-flex items-center justify-center rounded-full border border-white/20 px-3.5 py-1.5 text-[11px] md:text-xs font-semibold text-white hover:bg-white hover:text-black transition"
                  >
                    Fix This
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {remainingLeaks.length > 0 && (
          <div className="relative mb-8">
            <div
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 md:px-6 md:py-5 text-left overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">
                    Additional leaks
                  </div>
                  <p className="text-sm text-white/60">
                    Detailed breakdown of every leak, customer, and plan.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40 mb-1">Total at risk</div>
                  <div className="text-lg md:text-xl font-semibold text-emerald-200">
                    {formatMoney(
                      remainingLeaks.reduce((sum, leak) => sum + leak.monthlyValue, 0)
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4 text-sm max-h-40 overflow-hidden">
                {remainingLeaks.map((leak, idx) => (
                  <div
                    key={leak.type + idx}
                    className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2"
                  >
                    <div className="flex-1 pr-3">
                      <p className="text-xs text-white/50">{leak.type.replace('_', ' ')}</p>
                      <p className="text-sm text-white/80 truncate">{leak.title}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-[11px] text-white/40">At risk</p>
                      <p className="text-sm font-medium text-emerald-200">
                        {formatMoney(leak.monthlyValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        <div className="mt-6 mb-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                Unlock full report
              </p>
              <h2 className="text-sm md:text-base font-semibold text-white mb-2">
                Everything you need to close the leaks
              </h2>
              <ul className="text-xs md:text-sm text-white/60 space-y-1.5">
                <li>• Full leak breakdown across all categories</li>
                <li>• Customer-level insights with amounts at risk</li>
                <li>• 30-day action plan tailored to your Stripe data</li>
              </ul>
            </div>
            <button
              type="button"
              disabled={isProUser}
              onClick={onUnlock}
              className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs md:text-sm font-semibold transition ${
                isProUser
                  ? 'bg-white/10 text-white/60 cursor-default'
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {isProUser ? 'Pro unlocked' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onUnlock}
          className="inline-flex items-center justify-center rounded-full bg-white text-black px-8 py-3 md:px-10 md:py-3.5 text-sm md:text-base font-semibold tracking-wide shadow-[0_18px_50px_rgba(0,0,0,0.6)] hover:shadow-[0_22px_60px_rgba(0,0,0,0.75)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          Unlock Full Recovery Plan
        </button>

            <div className="mt-4 text-[11px] text-white/35">
              No changes made to Stripe. Read-only financial analysis.
            </div>
          </div>

          {!isProUser && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center px-6 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                Unlock Pro
              </p>
              <p className="text-sm md:text-base font-semibold text-white mb-6">
                You're potentially losing £{formatAmount(totalLeakMonthly)}/month
              </p>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  type="button"
                  onClick={handleUnlockFullReport}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 text-black px-5 py-3 text-sm font-semibold hover:bg-emerald-400 transition"
                >
                  Unlock Full Report – £19
                </button>
                <button
                  type="button"
                  onClick={handleGetFixPlan}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
                >
                  Get Fix Plan – £49
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

