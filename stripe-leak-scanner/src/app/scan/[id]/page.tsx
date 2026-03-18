'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LeakAnalysis, AIReport, RevenueIntelligence } from '@/types';
import type { PlanSlug } from '@/types';
import { UpgradeCTA } from '@/components/upgrade-cta';
import { ExportButtons } from '@/components/dashboard/ExportButtons';

export default function ScanDashboard() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<{
    analysis: LeakAnalysis;
    aiReport: AIReport;
    paid: boolean;
    plan: PlanSlug | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'analyzing' | 'completed' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);

  // Poll for scan status and results (GET /api/scan/[id]/status)
  useEffect(() => {
    if (!id) return;

    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`/api/scan/${id}/status`);
        if (!statusResponse.ok) return;
        const statusData = await statusResponse.json();

        if (statusData.status === 'completed') {
          const plan = (statusData.plan ?? 'free') as PlanSlug;
          const scanPaid = statusData.paid === true;
          const tierPaid = plan === 'indie' || plan === 'studio';
          setData({
            analysis: statusData.analysis ?? {},
            aiReport: statusData.aiReport ?? {},
            paid: scanPaid || tierPaid,
            plan,
          });
          setStatus('completed');
          setLoading(false);
          clearInterval(pollInterval);
        } else if (statusData.status === 'error') {
          setStatus('error');
          setError(statusData.error_message ?? 'Analysis failed');
          setLoading(false);
          clearInterval(pollInterval);
        } else {
          setStatus(statusData.status === 'analyzing' ? 'analyzing' : 'pending');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    const triggerAnalysis = async () => {
      try {
        await fetch(`/api/scan/${id}/analyze`, { method: 'POST' });
      } catch (err) {
        console.error('Failed to trigger analysis:', err);
      }
    };
    triggerAnalysis();

    return () => clearInterval(pollInterval);
  }, [id]);

  // Loading states
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">
            {status === 'analyzing' ? 'Analyzing your Stripe data...' : 'Initializing analysis...'}
          </h2>
          <p className="text-gray-400">This may take 30-60 seconds</p>
          {status === 'analyzing' && (
            <p className="text-sm text-gray-500 mt-2">Fetching 12 months of transaction data...</p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error || status === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-gray-400 mb-6">{error || 'Unable to analyze your Stripe data'}</p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Results view
  const { analysis, aiReport, paid, plan } = data!;
  const revenueIntelligence = analysis.revenueIntelligence;

  const handleRefresh = async () => {
    try {
      const res = await fetch(`/api/scan/${id}/refresh`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.revenueIntelligence && data) {
        setData({
          ...data,
          analysis: {
            ...data.analysis,
            revenueIntelligence: json.revenueIntelligence,
          },
        });
      }
    } catch (e) {
      console.error('Refresh failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 md:mb-12 border-b border-gray-800 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">Revenue Leak Scan</h1>
              <p className="text-gray-400">AI-powered analysis of your Stripe account • Scan ID: {id}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleRefresh}
                className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition"
              >
                Refresh Data
              </button>
              <span className="text-sm text-gray-500">
                Generated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </header>

        {/* Executive Summary */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-3">Executive Summary</h2>
          <p className="text-gray-300 mb-4">{aiReport.executiveSummary}</p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm text-gray-400">Total Recoverable</div>
              <div className={`text-2xl font-bold ${paid ? 'text-emerald-400' : 'blur-lg select-none'}`}>
                {paid ? `$${analysis.totalRecoverable.toFixed(2)}` : '$XX,XXX'}
              </div>
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm text-gray-400">Financial Health</div>
              <div className={`text-2xl font-bold ${paid ? (analysis.executiveScore > 70 ? 'text-emerald-400' : analysis.executiveScore > 50 ? 'text-amber-400' : 'text-red-400') : 'blur-lg select-none'}`}>
                {paid ? `${analysis.executiveScore}/100` : 'XX/100'}
              </div>
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm text-gray-400">Urgency Level</div>
              <div className={`text-xl font-bold ${aiReport.urgencyLevel === 'Critical' ? 'text-red-400' : aiReport.urgencyLevel === 'High' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {aiReport.urgencyLevel.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Payment CTA */}
        {!paid && (
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl p-6 md:p-8 mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">🔒 Premium Report Locked</h2>
            <p className="text-amber-100 mb-6 max-w-2xl mx-auto">
              See exactly how much revenue you&apos;re losing and get actionable steps to recover it
            </p>
            <button 
              onClick={() => window.location.href = `/checkout?scanId=${id}`}
              className="bg-white text-gray-900 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition text-lg shadow-lg"
            >
              Unlock Full Report - $299
            </button>
            <p className="text-amber-200 text-sm mt-4">30-day money back guarantee • One-time payment</p>
          </div>
        )}

        {/* Key Metrics Grid */}
        {revenueIntelligence && (
          <RevenueIntelligenceSection data={revenueIntelligence} paid={paid} plan={plan} onUpgradeCTA={<UpgradeCTA currentTier={plan} featureName="full metrics" />} />
        )}

        {/* Legacy Leak Metrics Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Revenue Leak Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <MetricCard 
              title="Failed Payment Recovery"
              value={`$${analysis.failedPaymentRecovery.recoverableAmount.toFixed(0)}`}
              description={analysis.failedPaymentRecovery.explanation}
              severity={analysis.failedPaymentRecovery.severity}
              blur={!paid}
            />
            <MetricCard 
              title="Churn Leak"
              value={`$${analysis.churnLeak.potentialSavings.toFixed(0)}/mo`}
              description={analysis.churnLeak.explanation}
              severity={analysis.churnLeak.severity}
              blur={!paid}
            />
            <MetricCard 
              title="Discount Leak"
              value={`${analysis.discountLeak.percentageOfRevenue.toFixed(1)}% of revenue`}
              description={analysis.discountLeak.explanation}
              severity={analysis.discountLeak.severity}
              blur={!paid}
            />
            <MetricCard 
              title="Annual Conversion"
              value={`$${analysis.annualConversion.conversionOpportunity.toFixed(0)}`}
              description={analysis.annualConversion.explanation}
              severity={analysis.annualConversion.severity}
              blur={!paid}
            />
            <MetricCard 
              title="Dunning Efficiency"
              value={`${analysis.dunningEfficiency.score}/100`}
              description={analysis.dunningEfficiency.explanation}
              severity={analysis.dunningEfficiency.severity}
              blur={!paid}
            />
            <MetricCard 
              title="Refund Impact"
              value={`${analysis.refundImpact.percentageOfRevenue.toFixed(1)}% of revenue`}
              description={analysis.refundImpact.explanation}
              severity={analysis.refundImpact.severity}
              blur={!paid}
            />
          </div>
        </div>

        {/* Paid Features */}
        {paid && (
          <>
            {/* Action Plan */}
            <div className="bg-gray-900 rounded-xl p-6 md:p-8 mb-8 border border-gray-800">
              <h2 className="text-2xl font-bold text-emerald-400 mb-4">{aiReport.urgencyLevel} Priority Actions</h2>
              <div className="space-y-4">
                {aiReport.topLeaks.map((leak, i) => (
                  <div key={i} className="bg-gray-800 p-4 md:p-6 rounded-lg">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-3">
                      <h3 className="font-bold text-lg text-white">{leak.title}</h3>
                      <span className="text-amber-400 font-mono font-bold">{leak.impact}</span>
                    </div>
                    <p className="text-gray-300">{leak.action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 30-Day Action Plan */}
            <div className="bg-gray-900 rounded-xl p-6 md:p-8 mb-8 border border-gray-800">
              <h2 className="text-2xl font-bold text-blue-400 mb-4">30-Day Action Plan</h2>
              <div className="space-y-3">
                {aiReport.actionPlan.map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-gray-300">{action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Download & Actions */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start">
              {plan === 'indie' || plan === 'studio' ? (
                <ExportButtons scanId={id} plan={plan} />
              ) : (
                <UpgradeCTA currentTier={plan} featureName="CSV & PDF export" />
              )}

              <button 
                onClick={() => window.location.href = '/contact?service=fix-sprint'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-bold transition"
              >
                🚀 Book 48-Hour Fix Sprint ($2,500)
              </button>
              
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-4 rounded-lg font-bold transition"
              >
                ← Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function RevenueIntelligenceSection({
  data,
  paid,
  plan,
  onUpgradeCTA,
}: {
  data: RevenueIntelligence;
  paid: boolean;
  plan: PlanSlug | null;
  onUpgradeCTA?: React.ReactNode;
}) {
  const currency = data.mrr.currency || data.revenueLeaks.currency || 'USD';
  const isFree = !plan || plan === 'free';
  const maxLeaksShown = isFree ? 3 : data.revenueLeaks.items.length;
  const leaksLockedCount = isFree && data.revenueLeaks.items.length > 3 ? data.revenueLeaks.items.length - 3 : 0;

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-blue-300 mb-6">Stripe Revenue Intelligence</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">MRR</p>
          <p className={`text-2xl font-bold text-white ${!paid ? 'blur-lg select-none' : ''}`}>
            {paid ? formatMoney(data.mrr.current, currency) : '$XX,XXX'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {paid ? `${data.mrr.percentChange >= 0 ? '+' : ''}${data.mrr.percentChange.toFixed(1)}% vs 30 days ago` : 'Upgrade to unlock'}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">Active Subscriptions</p>
          <p className={`text-2xl font-bold text-white ${!paid ? 'blur-lg select-none' : ''}`}>
            {paid ? data.activeSubscriptions.active.toLocaleString() : 'XXX'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Trialing {data.activeSubscriptions.trialing} · Past due {data.activeSubscriptions.pastDue}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">Customer Churn</p>
          <p className={`text-2xl font-bold text-white ${!paid ? 'blur-lg select-none' : ''}`}>
            {paid ? `${data.churn.customerChurnRate.toFixed(1)}%` : 'X.X%'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Revenue churn {data.churn.revenueChurnRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">LTV</p>
          <p className={`text-2xl font-bold text-white ${!paid ? 'blur-lg select-none' : ''}`}>
            {paid ? formatMoney(data.ltv.ltv, currency) : '$X,XXX'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ARPU {formatMoney(data.ltv.arpu, currency)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">Trial Conversion</p>
          <p className={`text-2xl font-bold text-white ${!paid ? 'blur-lg select-none' : ''}`}>
            {paid ? `${data.trialConversion.conversionRate.toFixed(1)}%` : 'X.X%'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.trialConversion.convertedTrials}/{data.trialConversion.totalTrialsStarted} trials converted
          </p>
        </div>
      </div>
      {isFree && onUpgradeCTA}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4 text-white">MRR Movement (last {data.mrrMovement.length} month{data.mrrMovement.length !== 1 ? 's' : ''})</h3>
          <div className="space-y-2 text-sm">
            {data.mrrMovement.map((month) => (
              <div key={month.month} className="grid grid-cols-6 gap-2 items-center bg-gray-800/50 rounded px-3 py-2">
                <span className="text-gray-300">{month.month}</span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-emerald-400'}`}>+{formatMoney(month.newMrr, currency)}</span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-blue-300'}`}>+{formatMoney(month.expansionMrr, currency)}</span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-amber-300'}`}>-{formatMoney(month.contractionMrr, currency)}</span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-red-400'}`}>-{formatMoney(month.churnedMrr, currency)}</span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-white font-semibold'}`}>
                  {month.netNewMrr >= 0 ? '+' : ''}{formatMoney(month.netNewMrr, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4 text-white">Churn Trend (last 6 months)</h3>
          <div className="space-y-2 text-sm">
            {data.churnSeries.map((point) => (
              <div key={point.month} className="grid grid-cols-3 gap-2 bg-gray-800/50 rounded px-3 py-2">
                <span className="text-gray-300">{point.month}</span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-amber-300'}`}>
                  Customer {point.customerChurnRate.toFixed(1)}%
                </span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-rose-300'}`}>
                  Revenue {point.revenueChurnRate.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-2">Revenue Leaks</h3>
          <p className={`text-2xl font-bold mb-4 ${!paid ? 'blur-lg select-none text-white' : 'text-red-400'}`}>
            {paid ? `${formatMoney(data.revenueLeaks.totalAtRisk, currency)} at risk` : '$XX,XXX at risk'}
          </p>
          <div className="space-y-2 text-sm max-h-64 overflow-auto">
            {data.revenueLeaks.items.length === 0 && (
              <div className="text-gray-400">No leak candidates detected from current Stripe snapshot.</div>
            )}
            {data.revenueLeaks.items.slice(0, maxLeaksShown).map((item, idx) => (
              <div key={`${item.customerEmail}-${idx}`} className="bg-gray-800/50 rounded px-3 py-2 grid grid-cols-4 gap-2">
                <span className="text-gray-300 truncate" title={item.customerEmail}>{item.customerEmail}</span>
                <span className="text-gray-400">{item.category}</span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-amber-300'}`}>{formatMoney(item.amountAtRisk, currency)}</span>
                <span className="text-gray-500">{item.daysOverdue}d</span>
              </div>
            ))}
            {leaksLockedCount > 0 && (
              <UpgradeCTA currentTier={plan} leaksLockedCount={data.revenueLeaks.items.length} />
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Plan Breakdown</h3>
          <div className="space-y-2 text-sm">
            {data.planBreakdown.length === 0 && (
              <div className="text-gray-400">No plan-level data found.</div>
            )}
            {data.planBreakdown.map((plan) => (
              <div key={plan.planName} className="bg-gray-800/50 rounded px-3 py-2 grid grid-cols-5 gap-2">
                <span className="text-gray-300 truncate" title={plan.planName}>{plan.planName}</span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-white'}`}>{plan.subscribers}</span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-emerald-300'}`}>{formatMoney(plan.mrrContribution, currency)}</span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-blue-300'}`}>{formatMoney(plan.avgLtv, currency)}</span>
                <span className={`${!paid ? 'blur-sm select-none' : 'text-rose-300'}`}>{plan.churnRate.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Last synced {new Date(data.lastSyncedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  description, 
  severity, 
  blur 
}: { 
  title: string; 
  value: string; 
  description: string; 
  severity: string; 
  blur: boolean; 
}) {
  const colors = {
    High: 'border-red-500/50 bg-red-950/20',
    Medium: 'border-amber-500/50 bg-amber-950/20',
    Low: 'border-emerald-500/50 bg-emerald-950/20',
  };

  const textColors = {
    High: 'text-red-400',
    Medium: 'text-amber-400',
    Low: 'text-emerald-400',
  };

  return (
    <div className={`border-2 ${colors[severity as keyof typeof colors]} rounded-xl p-5 md:p-6`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-gray-300 font-medium">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded ${severity === 'High' ? 'bg-red-900/40' : severity === 'Medium' ? 'bg-amber-900/40' : 'bg-emerald-900/40'}`}>
          {severity} Risk
        </span>
      </div>
      <p className={`text-2xl md:text-3xl font-bold mb-3 ${textColors[severity as keyof typeof textColors]} ${blur ? 'blur-lg select-none' : ''}`}>
        {blur ? (title.includes('%') ? 'XX.X%' : title.includes('/mo') ? '$XXX/mo' : '$XX,XXX') : value}
      </p>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}