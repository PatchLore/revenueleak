import type { AppUser, PlanSlug } from '@/types';

export const TIERS = {
  free: {
    maxHistoryDays: 30 as const,
    metrics: ['mrr', 'active_subscriptions', 'churn_rate', 'ltv', 'trial_conversion'] as const,
    canSeeLeaks: true,
    canActOnLeaks: false,
    maxLeaksShown: 3,
    canExportCsv: false,
    canScheduleDigests: false,
  },
  indie: {
    maxHistoryDays: 365 as const,
    metrics: 'all' as const,
    canSeeLeaks: true,
    canActOnLeaks: true,
    maxLeaksShown: 'unlimited' as const,
    canExportCsv: true,
    canScheduleDigests: false,
    price: 19,
  },
  studio: {
    maxHistoryDays: 'unlimited' as const,
    metrics: 'all' as const,
    canSeeLeaks: true,
    canActOnLeaks: true,
    maxLeaksShown: 'unlimited' as const,
    canExportCsv: true,
    canScheduleDigests: true,
    multiAccount: true,
    price: 49,
  },
} as const;

export type TierConfig = (typeof TIERS)[PlanSlug];

export function getUserTier(user: Pick<AppUser, 'plan'> | null | undefined): TierConfig {
  const plan = user?.plan ?? 'free';
  const key = plan === 'free' || plan === 'indie' || plan === 'studio' ? plan : 'free';
  return TIERS[key];
}

export function isPaidTier(plan: PlanSlug | null | undefined): boolean {
  return plan === 'indie' || plan === 'studio';
}
