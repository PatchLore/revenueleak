import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-block bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1 mb-6">
            <span className="text-blue-300 text-sm font-medium">Stripe Revenue Intelligence</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-emerald-400 bg-clip-text text-transparent">
            Revify<br />for Stripe Metrics
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Connect your Stripe account and instantly track MRR, churn, LTV, ARPU, trial conversion, and revenue leaks in one founder-friendly dashboard.
          </p>
          <Link
            href="/api/stripe/connect"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105 shadow-lg shadow-blue-900/20"
          >
            Connect Stripe & View Dashboard
          </Link>
          <p className="text-gray-500 mt-4 text-sm">Free tier includes last 30 days. Upgrade for full historical intelligence.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { title: "MRR Movement", desc: "See new, expansion, contraction, and churned MRR at a glance", icon: "📈" },
            { title: "Churn Intelligence", desc: "Track customer churn and revenue churn over time", icon: "📉" },
            { title: "Revenue Leak Alerts", desc: "Spot past_due, failed payments, and pending cancellations", icon: "🚨" }
          ].map((f, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">How Revify Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Connect Stripe", desc: "Read-only OAuth connection to your Stripe account." },
              { step: "2", title: "Sync Metrics", desc: "We compute MRR, churn, LTV, ARPU, and trial conversion." },
              { step: "3", title: "Find Leaks", desc: "Identify at-risk revenue from failed or overdue payments." },
              { step: "4", title: "Take Action", desc: "Use plan-level and cohort-style views to prioritize fixes." }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-center mb-8">Built for Indie SaaS Founders</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "Exactly the Stripe metrics I need without a $129/month analytics bill.", author: "Indie founder" },
              { quote: "We finally see whether growth came from new users or better ARPU.", author: "SaaS builder" },
              { quote: "The revenue leak panel helped us prioritize fixes in a single afternoon.", author: "Bootstrapped team" }
            ].map((testimonial, i) => (
              <div key={i} className="bg-gray-800/50 p-6 rounded-xl">
                <p className="text-gray-300 mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="text-emerald-400 font-medium">{testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

