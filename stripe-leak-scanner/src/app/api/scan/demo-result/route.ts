import { NextResponse } from 'next/server';
/**
 * Demo scan endpoint.
 * Returns a hardcoded revenue leak result for UX testing.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const monthlyRevenueRaw = url.searchParams.get('monthlyRevenue');
  const businessType = (url.searchParams.get('businessType') ?? 'SaaS').toLowerCase();
  const revenueModel = (url.searchParams.get('revenueModel') ?? 'subscription').toLowerCase();
  const churnPctRaw = url.searchParams.get('churnPct');

  const monthlyRevenue = monthlyRevenueRaw ? Number(monthlyRevenueRaw) : NaN;
  const churnPct = churnPctRaw != null && churnPctRaw.trim() !== '' ? Number(churnPctRaw) : null;

  // Fallback to a reasonable demo value if input is missing.
  const baseRevenue = Number.isFinite(monthlyRevenue) && monthlyRevenue > 0 ? monthlyRevenue : 50000;

  // Deterministic "random" based on inputs so the UI feels consistent per run.
  const seed = [
    baseRevenue.toFixed(0),
    businessType,
    revenueModel,
    churnPct != null ? churnPct.toFixed(2) : 'none',
  ].join('|');
  const rand01 = mulberry32(hashStringToInt(seed)); // 0..1

  // Leak factor: 0.1 .. 0.3
  const factor = 0.1 + rand01 * 0.2;
  const totalLeakMonthly = baseRevenue * factor;

  // Base category weights
  let failedWeight = 0.45;
  let churnWeight = 0.35;
  let pricingWeight = 0.2;

  switch (businessType) {
    case 'ecommerce':
      failedWeight = 0.4;
      churnWeight = 0.25;
      pricingWeight = 0.35;
      break;
    case 'agency':
      failedWeight = 0.35;
      churnWeight = 0.3;
      pricingWeight = 0.35;
      break;
    case 'other':
      failedWeight = 0.4;
      churnWeight = 0.3;
      pricingWeight = 0.3;
      break;
    case 'saas':
    default:
      break;
  }

  const effectiveChurnPct =
    churnPct != null && Number.isFinite(churnPct) && churnPct >= 0 ? churnPct : defaultChurnPct(businessType);

  // Increase churn weight with churn %
  const churnFactor = 1 + effectiveChurnPct / 25; // 4% -> 1.16, 10% -> 1.4
  churnWeight *= clamp(churnFactor, 0.6, 1.6);
  // Reduce pricing weight slightly as churn dominates
  pricingWeight *= clamp(1 - effectiveChurnPct / 250, 0.4, 1);

  // One-time products generally have less ongoing churn impact.
  if (revenueModel === 'one-time') {
    churnWeight *= 0.55;
    failedWeight *= 0.85;
    pricingWeight *= 1.15;
  }

  // Normalize weights to sum to 1
  const sumW = failedWeight + churnWeight + pricingWeight;
  failedWeight /= sumW;
  churnWeight /= sumW;
  pricingWeight /= sumW;

  const failedAmount = totalLeakMonthly * failedWeight;
  const churnAmount = totalLeakMonthly * churnWeight;
  const pricingAmount = totalLeakMonthly * pricingWeight;

  const leakAmountStr = `£${formatMoney0(totalLeakMonthly)}/month`;
  const message = `You're losing ${leakAmountStr} due to revenue leaks`;

  return NextResponse.json({
    leakAmount: leakAmountStr,
    totalLeakMonthly,
    message,
    breakdown: {
      'failed payments': failedAmount,
      churn: churnAmount,
      pricing: pricingAmount,
    },
    details: [
      { type: 'failed payments', amount: `£${formatMoney0(failedAmount)}` },
      { type: 'churn', amount: `£${formatMoney0(churnAmount)}` },
      { type: 'pricing', amount: `£${formatMoney0(pricingAmount)}` },
    ],
  });
}

function defaultChurnPct(businessType: string): number {
  switch (businessType) {
    case 'ecommerce':
      return 3.0;
    case 'agency':
      return 4.5;
    case 'other':
      return 5.0;
    case 'saas':
    default:
      return 6.5;
  }
}

function formatMoney0(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString('en-GB');
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function hashStringToInt(str: string): number {
  // Simple deterministic hash for stable demo randomness.
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number): number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }();
}
