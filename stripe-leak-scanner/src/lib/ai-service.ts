import OpenAI from 'openai';
import { LeakAnalysis, AIReport } from '@/types';
import type { LeakReport } from './leakEngine';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAIReport(analysis: LeakAnalysis): Promise<AIReport> {
  const prompt = `Act as a Revenue Operations Consultant for SaaS companies. Analyze this Stripe data and provide actionable intelligence.

FINANCIAL DATA:
- Failed Payment Recovery Opportunity: $${analysis.failedPaymentRecovery.recoverableAmount.toFixed(2)}/month
- Churn Rate: ${analysis.churnLeak.monthlyRate.toFixed(1)}% ($${analysis.churnLeak.revenueLost.toFixed(2)}/month lost)
- Discount Leak: ${analysis.discountLeak.percentageOfRevenue.toFixed(1)}% of revenue
- Annual Conversion Opportunity: $${analysis.annualConversion.conversionOpportunity.toFixed(2)}
- Dunning Score: ${analysis.dunningEfficiency.score}/100
- Total Recoverable Revenue: $${analysis.totalRecoverable.toFixed(2)}/year

Provide JSON response:
{
  "executiveSummary": "2-3 sentences on overall financial health",
  "topLeaks": [
    {"title": "Leak name", "impact": "$X/month impact", "action": "Specific fix"}
  ],
  "totalRecoverable": "Formatted string with total",
  "actionPlan": ["30-day action item 1", "action item 2", "action item 3"],
  "urgencyLevel": "Critical|High|Medium|Low"
}

Rules:
- Focus only on financial impact
- Prioritize by ROI
- Be direct, no fluff
- Specific dollar amounts`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'system', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return JSON.parse(completion.choices[0].message.content!) as AIReport;
}

// Generate executive summary for dashboard
export async function generateExecutiveSummary(analysis: LeakAnalysis): Promise<string> {
  const prompt = `Summarize this revenue leak analysis in one compelling sentence for a CEO dashboard:

- Total recoverable: $${analysis.totalRecoverable.toFixed(2)}/year
- Health score: ${analysis.executiveScore}/100
- Top issue: ${analysis.failedPaymentRecovery.severity === 'High' ? 'Failed payments' : analysis.churnLeak.severity === 'High' ? 'High churn' : 'Discount leaks'}

Make it actionable and urgent.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'system', content: prompt }],
    max_tokens: 100,
    temperature: 0.2,
  });

  return completion.choices[0].message.content || 'Revenue optimization analysis complete.';
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

  const prompt = `Generate 3 specific, actionable recommendations to fix this revenue leak:

Category: ${category.replace('_', ' ').toUpperCase()}
Impact: $${impactValue.toFixed(2)}/month
Severity: ${categoryData.severity}

Provide exactly 3 recommendations as a JSON array of strings.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'system', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  try {
    const result = JSON.parse(completion.choices[0].message.content!);
    return result.recommendations || [];
  } catch {
    return [];
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

  const leakSummary = leaks
    .map((leak) => {
      return `${leak.type} | ${leak.title} | ~£${leak.monthlyValue.toFixed(
        0
      )}/month | severity: ${leak.severity}`;
    })
    .join('\n');

  const prompt = `
You are a SaaS revenue expert. Based on this leak data, explain:
1. What is causing the revenue loss
2. What the founder should fix first
3. A simple action they can take this week

Keep it concise and actionable.

Return your answer strictly as a JSON array of 3 to 5 short bullet points (strings, no numbering).

Total monthly leak: ~£${totalLeakMonthly.toFixed(0)}

LEAK DATA:
${leakSummary}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  try {
    const raw = completion.choices[0].message.content || '[]';
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.slice(0, 5);
    }

    if (Array.isArray(parsed.insights)) {
      return parsed.insights.slice(0, 5);
    }

    return [];
  } catch {
    return [];
  }
}
