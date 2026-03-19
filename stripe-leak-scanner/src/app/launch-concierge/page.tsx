import Link from 'next/link';

export default function LaunchConciergePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        {/* HERO */}
        <section className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-200 text-xs font-semibold tracking-[0.18em] uppercase">
              LeakSweep Launch Concierge
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-300 via-blue-300 to-emerald-300 bg-clip-text text-transparent">
            Get Your SaaS in Front of Thousands of Potential Users in 7 Days
          </h1>

          <p className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Most founders spend 15–20 hours submitting their product to launch platforms. We do it
            all for you — with tailored copy, tracking, and a full results report.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/leak-finder"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 md:px-10 py-4 md:py-5 rounded-xl font-bold text-base md:text-lg transition transform hover:scale-[1.01] shadow-lg shadow-blue-900/30"
            >
              <span>Start Your Launch – $299</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('whats-included');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="text-sm font-medium text-gray-300 hover:text-white underline underline-offset-4"
            >
              View What&apos;s Included
            </button>
            <p className="text-xs text-gray-500">
              No fluff. No spam. Just real distribution.
            </p>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="mb-16 md:mb-20">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl px-6 md:px-8 py-8 md:py-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Built for Founders Who Want Distribution, Not Busywork
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Solo developers launching SaaS products</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Indie hackers shipping side projects</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Founders who want users without spending days on submissions</span>
              </li>
            </ul>
          </div>
        </section>

        {/* WHAT'S INCLUDED / PRICING */}
        <section id="whats-included" className="mb-16 md:mb-20">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* STANDARD */}
            <div className="flex-1 rounded-2xl border border-gray-800 bg-gray-900/60 px-6 md:px-8 py-8 md:py-10">
              <h3 className="text-sm uppercase tracking-[0.18em] text-gray-400 mb-2">
                Standard
              </h3>
              <p className="text-2xl md:text-3xl font-bold mb-4">$299</p>
              <ul className="space-y-2 text-gray-300 mb-6 text-sm md:text-base">
                <li>Submission to 20+ platforms</li>
                <li>Custom-written copy per platform</li>
                <li>UTM tracking links</li>
                <li>7-day results report</li>
              </ul>
              <Link
                href="/leak-finder"
                className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-sm md:text-base transition shadow-lg shadow-blue-900/30"
              >
                Start Standard Launch
              </Link>
            </div>

            {/* PREMIUM */}
            <div className="flex-1 rounded-2xl border border-emerald-500/50 bg-gradient-to-b from-emerald-500/15 via-gray-900 to-gray-900 px-6 md:px-8 py-8 md:py-10 relative">
              <div className="absolute -top-3 right-4 inline-flex items-center rounded-full bg-emerald-500 text-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Most Popular
              </div>
              <h3 className="text-sm uppercase tracking-[0.18em] text-emerald-300 mb-2">
                Premium
              </h3>
              <p className="text-2xl md:text-3xl font-bold mb-4">$499</p>
              <ul className="space-y-2 text-gray-300 mb-6 text-sm md:text-base">
                <li>Everything in Standard</li>
                <li>30-min strategy call</li>
                <li>30-min results review call</li>
                <li>Priority turnaround (5 days)</li>
              </ul>
              <Link
                href="/leak-finder"
                className="inline-flex items-center justify-center w-full bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-semibold text-sm md:text-base transition shadow-lg shadow-emerald-900/30"
              >
                Start Premium Launch
              </Link>
            </div>
          </div>
        </section>

        {/* PLATFORMS */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Where We Launch Your Product
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 px-5 py-5">
              <h3 className="text-sm uppercase tracking-[0.18em] text-gray-400 mb-3">
                High Impact
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-200">
                <li>Product Hunt</li>
                <li>Indie Hackers</li>
                <li>Hacker News</li>
                <li>Reddit</li>
                <li>BetaList</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 px-5 py-5">
              <h3 className="text-sm uppercase tracking-[0.18em] text-gray-400 mb-3">
                SEO Directories
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-200">
                <li>AlternativeTo</li>
                <li>Capterra</li>
                <li>G2</li>
                <li>SaaS Hub</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 px-5 py-5">
              <h3 className="text-sm uppercase tracking-[0.18em] text-gray-400 mb-3">
                Niche &amp; Social
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-200">
                <li>Relevant subreddits</li>
                <li>Twitter/X</li>
                <li>LinkedIn</li>
              </ul>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                title: 'Submit your product details',
                desc: 'Share your SaaS, ideal users, and launch goals.',
              },
              {
                step: '2',
                title: 'We write tailored copy',
                desc: 'We adapt your positioning for each platform.',
              },
              {
                step: '3',
                title: 'We submit across 20+ platforms',
                desc: 'Done-for-you distribution with tracking links.',
              },
              {
                step: '4',
                title: 'You receive a full report',
                desc: 'Get a 7-day performance report with insights.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex flex-col"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2 text-sm md:text-base">{item.title}</h3>
                <p className="text-xs md:text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RESULTS / VALUE */}
        <section className="mb-16 md:mb-20">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl px-6 md:px-8 py-8 md:py-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Turn One Launch Into Long-Term Traffic
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl">
              Your launch shouldn&apos;t be a one-day spike. We focus on channels that keep sending
              traffic, backlinks, and users long after the initial push.
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-3 text-gray-200 text-sm md:text-base">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Get in front of thousands of users</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Build backlinks and SEO presence</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Validate your product faster</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Discover which channels actually convert</span>
              </li>
            </ul>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="pb-4 md:pb-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Launch the Right Way?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
              <Link
                href="/leak-finder"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold text-sm md:text-base transition shadow-lg shadow-blue-900/30 w-full sm:w-auto"
              >
                Start Your Launch – $299
              </Link>
              <Link
                href="/leak-finder"
                className="inline-flex items-center justify-center border border-gray-700 bg-gray-900/60 hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-semibold text-sm md:text-base transition w-full sm:w-auto"
              >
                Start Premium – $499
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              Payment handled via our existing Leak Finder flow. No Stripe connection required for
              this page.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

