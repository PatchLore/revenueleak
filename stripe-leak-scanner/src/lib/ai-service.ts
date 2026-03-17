import { DEMO_MODE } from '@/config/mode';
import { LeakAnalysis, AIReport } from '@/types';
import type { LeakReport } from './leakEngine';

// DEMO_MODE toggle allows swapping between stubbed logic and real integrations later.

export async function generateAIReport(analysis: LeakAnalysis): Promise<AIReport> {
  if (DEMO_MODE) {
    const urgencyLevel = calculateUrgencyLevel(analysis);

    const executiveSummary = `You have an estimated $${analysis.totalRecoverable.toFixed(
      0
    )}/year in recoverable revenue, driven mainly by ${
      analysis.failedPaymentRecovery.severity === 'High'
        ? 'failed payments'
        : analysis.churnLeak.severity === 'High'
        ? 'high churn'
        : 'discount leaks'
    }.`;

    const topLeaks = [
      {
        title: 'Failed payment recovery',
        impact: `$${analysis.failedPaymentRecovery.recoverableAmount.toFixed(0)}/month`,
        action: 'Tighten dunning and retry logic for failed payments over the next 14 days.',
      },
      {
        title: 'Churn management',
        impact: `$${analysis.churnLeak.potentialSavings.toFixed(0)}/month`,
        action:
          'Introduce a save offer and exit survey for customers cancelling in their first 90 days.',
      },
    ];

    const actionPlan = [
      'Audit failed payments from the last 30 days and add at least one additional retry step.',
      'Email recently cancelled customers to understand top 2–3 reasons for churn.',
      'Review active coupons and remove or tighten those with poor ROI.',
    ];

    return {
      executiveSummary,
      topLeaks,
      totalRecoverable: `$${analysis.totalRecoverable.toFixed(2)}/year`,
      actionPlan,
      urgencyLevel,
    };
  }

  // Real OpenAI-backed implementation can be wired here later.
  // For now, fall back to the same deterministic summary used in demo mode.
  const urgencyLevel = calculateUrgencyLevel(analysis);
  const executiveSummary = `You have an estimated $${analysis.totalRecoverable.toFixed(
    0
  )}/year in recoverable revenue.`;

  return {
    executiveSummary,
    topLeaks: [],
    totalRecoverable: `$${analysis.totalRecoverable.toFixed(2)}/year`,
    actionPlan: [],
    urgencyLevel,
  };
}

export async function generateExecutiveSummary(analysis: LeakAnalysis): Promise<string> {
  const urgency = calculateUrgencyLevel(analysis);
  const topIssue =
    analysis.failedPaymentRecovery.severity === 'High'
      ? 'failed payments'
      : analysis.churnLeak.severity === 'High'
      ? 'high churn'
      : 'discount leaks';

  return `You have ~$${analysis.totalRecoverable.toFixed(
    0
  )}/year in recoverable revenue with a health score of ${
    analysis.executiveScore
  }/100 — focus first on ${topIssue} (${urgency} priority).`;
}

// Generate specific recommendations for a leak category
export async function generateLeakRecommendations(
  category: string,
  analysis: LeakAnalysis
): Promise<string[]> {
  const categoryData = {
    'failed_payments': analysis.failedPaymentRecovery,
    'churn': analysis.churnLeak,
    'discounts': analysis.discountLeak,
    'annual_conversion': analysis.annualConversion,
    'dunning': analysis.dunningEfficiency,
    'refunds': analysis.refundImpact,
  }[category];

  if (!categoryData) return [];

  const impactValue =
    'recoverableAmount' in categoryData
      ? categoryData.recoverableAmount
      : 'potentialSavings' in categoryData
      ? categoryData.potentialSavings
      : 'totalDiscounted' in categoryData
      ? (categoryData as any).totalDiscounted
      : 'totalRefunded' in categoryData
      ? (categoryData as any).totalRefunded
      : 0;

  // Simple static recommendations for demo purposes
  switch (category) {
    case 'failed_payments':
      return [
        'Add at least one additional dunning email before cancelling overdue subscriptions.',
        'Retry failed payments at different times of day to increase success rates.',
        'Offer a self-service card update link in all failed payment emails.',
      ];
    case 'churn':
      return [
        'Introduce a 3-question exit survey for all cancellations.',
        'Add an in-app prompt to schedule a call before high-value accounts churn.',
        'Offer a pause plan instead of immediate cancellation.',
      ];
    default:
      return [
        'Review this leak category and decide on one small experiment to run this week.',
        'Set a target metric (recovered MRR or reduced churn) for the next 30 days.',
        'Review results in one month and double down on what worked.',
      ];
  }
}

// Calculate urgency level based on analysis
export function calculateUrgencyLevel(analysis: LeakAnalysis): 'Critical' | 'High' | 'Medium' | 'Low' {
  const highSeverityCount = [
    analysis.failedPaymentRecovery,
    analysis.churnLeak,
    analysis.discountLeak,
    analysis.annualConversion,
    analysis.dunningEfficiency,
    analysis.refundImpact,
  ].filter(metric => metric.severity === 'High').length;

  if (highSeverityCount >= 3 || analysis.executiveScore < 50) return 'Critical';
  if (highSeverityCount >= 2 || analysis.executiveScore < 70) return 'High';
  if (highSeverityCount >= 1 || analysis.executiveScore < 85) return 'Medium';
  return 'Low';
}

// Generate concise revenue recovery insights from leak report
export async function generateLeakInsights(
  leaks: LeakReport['leaks']
): Promise<string[]> {
  if (!leaks || leaks.length === 0) {
    return [];
  }

  const totalLeakMonthly = leaks.reduce((sum, leak) => sum + (leak.monthlyValue || 0), 0);

  return [
    `You are leaking approximately £${totalLeakMonthly.toFixed(
      0
    )} per month across ${leaks.length} categories.`,
    'Start by fixing failed payments and high churn first — they typically have the fastest payback.',
    'Ship one small improvement this week (e.g. better dunning emails or an exit survey) and measure recovered MRR.',
  ];
}
