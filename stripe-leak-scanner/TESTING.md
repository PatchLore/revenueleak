### Stripe Checkout Testing

1. **Environment**

- Set the following in `.env.local`:
  - `STRIPE_SECRET_KEY=sk_test_...`
  - `STRIPE_PUBLISHABLE_KEY=pk_test_...`
  - `STRIPE_WEBHOOK_SECRET=whsec_...`
  - `STRIPE_PRICE_LEAKSWEEP_PRO=price_...`
  - `STRIPE_PRICE_LAUNCH_CONCIERGE_STANDARD=price_...`
  - `STRIPE_PRICE_LAUNCH_CONCIERGE_PREMIUM=price_...`
  - `NEXT_PUBLIC_STRIPE_PRICE_LEAKSWEEP_PRO=price_...`
  - `NEXT_PUBLIC_STRIPE_PRICE_LAUNCH_CONCIERGE_STANDARD=price_...`
  - `NEXT_PUBLIC_STRIPE_PRICE_LAUNCH_CONCIERGE_PREMIUM=price_...`

2. **Run the app**

```bash
npm run dev
```

3. **End-to-end flow**

- Visit `/results`.
- Click the **Unlock** / Pro upsell button.
- You should be redirected to **Stripe Checkout**.
- Use test card `4242 4242 4242 4242`, any future expiry date, any CVC and ZIP.
- After successful payment you are redirected back to:
  - `/results?unlocked=true&session_id=cs_test_...`
- The page calls `/api/checkout/verify` and, if `paid === true`, unlocks the Pro experience.

4. **Webhook test (optional)**

- In another terminal, run:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

- Complete a Checkout session.
- Confirm the webhook handler returns `200` and that a purchase record is stored in the in-memory map (`lib/purchasesStore.ts`).

