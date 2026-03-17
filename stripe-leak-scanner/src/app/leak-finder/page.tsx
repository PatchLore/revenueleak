import Link from 'next/link';

export default function LeakFinderLanding() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        {/* Hero */}
        <section className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/50 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Leak Finder for Stripe
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold leading-tight mb-4">
            Find hidden revenue in your Stripe account
            <span className="block text-4xl md:text-6xl mt-2 bg-gradient-to-r from-emerald-300 via-emerald-500 to-sky-400 bg-clip-text text-transparent">
              in 60 seconds
            </span>
          </h1>
          <p className="text-sm md:text-base text-white/60 max-w-2xl mx-auto mb-8">
            Connect your Stripe account, let us scan your subscriptions and payments, and see
            exactly where money is leaking out every month.
          </p>
          <Link
            href="/api/stripe/connect"
            className="inline-flex items-center justify-center rounded-full bg-white text-black px-8 py-3 md:px-10 md:py-3.5 text-sm md:text-base font-semibold tracking-wide shadow-[0_18px_50px_rgba(0,0,0,0.7)] hover:shadow-[0_22px_65px_rgba(0,0,0,0.9)] hover:-translate-y-0.5 active:translate-y-0 transition"
          >
            Scan My Revenue
          </Link>
          <p className="mt-3 text-[11px] text-white/40">
            Read-only access. No changes made to your Stripe account.
          </p>
        </section>

        {/* How it works */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-xl md:text-2xl font-semibold text-center mb-8">
            How the leak finder works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Connect Stripe',
                desc: 'Secure OAuth connection to your Stripe account in a few clicks.',
              },
              {
                step: '2',
                title: 'We scan your data',
                desc: 'We analyze subscriptions, invoices, refunds, and failed payments.',
              },
              {
                step: '3',
                title: 'See lost revenue instantly',
                desc: 'Get a clear monthly number and a prioritized list of leaks to fix.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-left"
              >
                <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-black text-sm font-semibold">
                  {item.step}
                </div>
                <h3 className="text-sm md:text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-xs md:text-sm text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof placeholders */}
        <section className="mb-16 md:mb-20">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-6 md:px-8 md:py-8">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
              Trusted by SaaS founders
            </p>
            <div className="grid gap-6 md:grid-cols-3 text-sm text-white/70">
              <div>
                <div className="h-8 w-24 rounded-full bg-white/10 mb-3" />
                <p className="text-xs md:text-sm">
                  “Placeholder for a short quote about finding hidden revenue in an afternoon.”
                </p>
              </div>
              <div>
                <div className="h-8 w-24 rounded-full bg-white/10 mb-3" />
                <p className="text-xs md:text-sm">
                  “Placeholder for a testimonial about reducing churn and failed payments.”
                </p>
              </div>
              <div>
                <div className="h-8 w-24 rounded-full bg-white/10 mb-3" />
                <p className="text-xs md:text-sm">
                  “Placeholder for a case study headline with recovered MRR.”
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            Ready to see what you&apos;re leaving on the table?
          </h2>
          <p className="text-sm md:text-base text-white/60 mb-6">
            It takes less than a minute to connect Stripe and run your first leak scan.
          </p>
          <Link
            href="/api/stripe/connect"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 text-black px-8 py-3 md:px-10 md:py-3.5 text-sm md:text-base font-semibold tracking-wide shadow-[0_18px_50px_rgba(0,0,0,0.7)] hover:bg-emerald-400 hover:-translate-y-0.5 active:translate-y-0 transition"
          >
            Scan My Revenue
          </Link>
          <p className="mt-3 text-[11px] text-white/40">
            Stripe Connect • Read-only • No engineering work required
          </p>
        </section>
      </div>
    </div>
  );
}

