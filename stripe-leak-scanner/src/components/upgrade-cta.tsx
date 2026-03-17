'use client';

import { useState } from 'react';
import type { PlanSlug } from '@/types';

type Props = {
  currentTier: PlanSlug | null;
  featureName?: string;
  leaksLockedCount?: number;
};

export function UpgradeCTA({ currentTier, featureName = 'this feature', leaksLockedCount }: Props) {
  const [loading, setLoading] = useState(false);
  const isFree = !currentTier || currentTier === 'free';
  const targetTier = currentTier === 'free' ? 'indie' : 'studio';
  const label =
    targetTier === 'indie'
      ? 'Upgrade to Indie ($19/mo)'
      : 'Upgrade to Studio ($49/mo)';

  const message = leaksLockedCount != null
    ? `See all ${leaksLockedCount} revenue leaks — upgrade to unlock.`
    : `Unlock ${featureName} by upgrading.`;

  if (!isFree && currentTier === 'studio') return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4">
      <p className="text-amber-200 text-sm mb-3">{message}</p>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={loading}
        className="inline-block bg-amber-600 hover:bg-amber-700 disabled:opacity-70 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
      >
        {loading ? 'Redirecting…' : label}
      </button>
    </div>
  );
}
