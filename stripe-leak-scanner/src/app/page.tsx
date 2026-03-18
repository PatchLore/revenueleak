import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* HERO */}
        <div className="text-center mb-16">
          <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1 mb-6">
            <span className="text-emerald-200 text-sm font-medium">Revenue Leak Scan</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-300 to-blue-300 bg-clip-text text-transparent">
            Find Hidden Revenue Leaks in 60 Seconds
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Most founders are losing 10–30% of revenue without realising it. Get a clear breakdown of where your money is leaking — instantly.
          </p>

          <div className="flex flex-col items-center">
            <Link
              href="/leak-finder"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-xl font-bold text-lg transition transform hover:scale-[1.01] shadow-lg shadow-blue-900/20"
            >
              <span aria-hidden>🔍</span>
              <span>Run Free Scan</span>
            </Link>
            <p className="text-gray-500 mt-4 text-sm">No Stripe connection required • Instant results</p>
          </div>
        </div>

        {/* PAIN */}
        <div className="mb-16">
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-10">
            <h2 className="text-3xl font-bold mb-6">You're Making Money… But Still Losing It</h2>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Failed payments you never recover</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Hidden churn reducing your revenue</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Pricing gaps costing you thousands</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Missed conversion opportunities</span>
              </li>
            </ul>
            <p className="text-gray-400 mt-6 text-sm md:text-base">
              These are revenue leaks — and most businesses don’t see them.
            </p>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Answer a few quick questions', desc: 'Share your revenue setup in under a minute.' },
              { step: '2', title: 'We analyse your revenue setup', desc: 'Our demo scan estimates where value is leaking.' },
              { step: '3', title: 'See your estimated revenue leaks', desc: 'Get a clear breakdown with prioritised impact.' },
              { step: '4', title: 'Unlock your full fix plan', desc: 'Get step-by-step actions to recover lost revenue.' }
            ].map((item, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-center">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RESULTS PREVIEW */}
        <div className="mb-16">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-10">
            <div className="flex flex-col md:flex-row gap-10 md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl font-bold mb-3">You could be losing £2,340/month</h2>
                <p className="text-gray-400 text-sm">
                  Here’s an example breakdown of what a Revenue Leak Scan can surface.
                </p>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3">
                    <span className="text-gray-300">Failed payments</span>
                    <span className="text-amber-300 font-bold">£740</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3">
                    <span className="text-gray-300">Pricing inefficiencies</span>
                    <span className="text-blue-300 font-bold">£900</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3">
                    <span className="text-gray-300">Churn leaks</span>
                    <span className="text-emerald-300 font-bold">£700</span>
                  </div>
                </div>
              </div>

              <div className="md:w-[320px]">
                <div className="text-center">
                  <Link
                    href="/leak-finder"
                    className="inline-flex items-center justify-center w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition shadow-lg shadow-blue-900/20"
                  >
                    Run Your Scan →
                  </Link>
                  <p className="text-gray-500 mt-3 text-xs">Free scan, instant results.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAYWALL TEASER */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600/20 to-emerald-500/20 border border-blue-400/20 rounded-2xl p-6 md:p-10">
            <h2 className="text-3xl font-bold mb-6">Unlock Your Full Revenue Breakdown</h2>
            <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-3 text-gray-200">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Full leak analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Step-by-step fix plan</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Priority leaks ranked</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Action checklist</span>
              </li>
            </ul>
            <div className="mt-8 flex justify-center">
              <Link
                href="/leak-finder"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/90 transition shadow-lg"
              >
                Unlock Full Report
              </Link>
            </div>
            <p className="text-gray-400 mt-4 text-sm text-center">
              Scan first. Then view the complete fix plan when you’re ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

