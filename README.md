# revenueleak
Revenue Leak Finder is a Next.js app that connects to your Stripe account and instantly identifies hidden revenue loss across failed payments, churn, underpriced subscriptions, and refunds.  In under 60 seconds, it calculates how much monthly revenue you're losing and surfaces actionable insights to recover it.
# 💸 Revenue Leak Finder

Find hidden revenue in your Stripe account in 60 seconds.

Revenue Leak Finder is a Next.js application that connects to Stripe (read-only) and analyzes your subscription and payment data to uncover lost revenue from failed payments, churn, underpriced customers, and refunds.

Instead of dashboards, it gives you a single clear output:

> 💸 "You're losing £X/month"

---

## 🚀 Features

- 🔍 **Instant Revenue Scan**
  - Connect Stripe and get results in seconds

- 💸 **Leak Detection**
  - Failed payments (recoverable revenue)
  - Underpriced / legacy subscriptions
  - Early churn patterns
  - Refund impact

- 📊 **Executive Summary**
  - Total monthly revenue leakage
  - Severity scoring
  - Key problem areas

- 🤖 **AI Insights (Optional)**
  - Plain-English explanation of issues
  - Suggested actions to recover revenue

- 🔒 **Paywall Ready**
  - Free: headline leak amount
  - Paid: full breakdown + recovery plan

---

## 🧠 Philosophy

Most SaaS tools show you data.

Revenue Leak Finder shows you **missed money**.

It is designed around one core idea:

> Every business is leaking revenue — we make it visible.

---

## 🏗 Tech Stack

- Framework: Next.js
- Language: TypeScript
- Payments Data: Stripe API
- AI (optional): OpenAI API
- Hosting: Vercel

---

## ⚙️ Setup

### 1. Clone repo

```bash
git clone https://github.com/yourusername/stripeleak.git
cd stripeleak
