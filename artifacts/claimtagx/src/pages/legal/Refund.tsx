import SEO from '@/components/SEO';

export default function Refund() {
  return (
    <>
      <SEO
        title="Refund Policy | ClaimTagX"
        description="Refund Policy for ClaimTagX subscriptions and services."
      />
      <div className="pt-32 pb-20 max-w-[800px] mx-auto px-4 sm:px-6">
        <h1 className="text-4xl font-bold text-white mb-2">Refund Policy</h1>
        <p className="text-slate text-sm mb-10 pb-10 border-b border-white/10">Last updated: April 17, 2026</p>

        <div className="prose prose-invert prose-slate max-w-none text-slate-300">
          <p>This Refund Policy describes the terms under which ClaimTagX issues refunds for subscriptions and other paid services.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Subscription Plans</h2>
          <p>All ClaimTagX subscription plans are billed in advance on a recurring basis. You may cancel at any time from your account dashboard. Cancellation stops future renewals but does not retroactively refund the current billing period.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Free Trial</h2>
          <p>New accounts may be eligible for a free trial. You will not be charged during the trial period. If you do not cancel before the trial ends, your card will be charged for the selected plan.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Eligibility for Refunds</h2>
          <p>Refund requests must be submitted within 14 days of the original charge. Refunds may be granted in cases of duplicate charges, billing errors, or extended service outages attributable to ClaimTagX.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Non-Refundable Items</h2>
          <p>The following are non-refundable: hardware orders that have shipped, custom integration work that has been delivered, and partial-month usage on monthly plans.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. How to Request a Refund</h2>
          <p>To request a refund, email <a href="mailto:billing@claimtagx.com" className="text-lime hover:underline">billing@claimtagx.com</a> with your account email and the invoice number. We aim to respond within 5 business days.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Changes to This Policy</h2>
          <p>We may update this Refund Policy from time to time. The "Last updated" date above reflects the most recent revision.</p>
        </div>
      </div>
    </>
  );
}
