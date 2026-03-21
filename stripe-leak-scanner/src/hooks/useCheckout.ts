import { useState } from 'react';

type CheckoutResult = {
  loading: boolean;
  error: string | null;
  initiateCheckout: (priceId: string) => Promise<void>;
  verifyPurchase: (sessionId: string) => Promise<{ paid: boolean }>;
};

export function useCheckout(): CheckoutResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckout = async (priceId: string) => {
    try {
      setLoading(true);
      setError(null);

      const origin = window.location.origin;
      const successUrl = `${origin}/results?unlocked=true&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/results`;

      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, successUrl, cancelUrl }),
      });
      const data = await res.json();

      if (!res.ok || !data?.url) {
        // eslint-disable-next-line no-console
        console.error('[useCheckout] Failed to create checkout session', data);
        throw new Error(data?.error || 'Unable to start checkout. Please try again.');
      }

      window.location.href = data.url as string;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error starting checkout.';
      setError(msg);
      // eslint-disable-next-line no-console
      console.error('[useCheckout] initiateCheckout error', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyPurchase = async (sessionId: string): Promise<{ paid: boolean }> => {
    try {
      const res = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error('[useCheckout] verifyPurchase error response', data);
        return { paid: false };
      }

      return { paid: Boolean(data.paid) };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[useCheckout] verifyPurchase error', err);
      return { paid: false };
    }
  };

  return { loading, error, initiateCheckout, verifyPurchase };
}

