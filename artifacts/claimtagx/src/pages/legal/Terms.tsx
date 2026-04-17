import SEO from '@/components/SEO';

export default function Terms() {
  return (
    <>
      <SEO 
        title="Terms of Service | ClaimTagX"
        description="Terms of service for ClaimTagX."
      />
      <div className="pt-32 pb-20 max-w-[800px] mx-auto px-4 sm:px-6">
        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-slate text-sm mb-10 pb-10 border-b border-white/10">Last updated: April 17, 2026</p>
        
        <div className="prose prose-invert prose-slate max-w-none text-slate-300">
          <p>Please read these Terms of Service ("Terms") carefully before using the ClaimTagX platform operated by ClaimTagX ("us", "we", or "our").</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Description of Service</h2>
          <p>ClaimTagX provides a digital custody management platform that replaces paper claim tickets with cryptographically signed digital tags. Features include mobile app access, GM dashboard, OCR capabilities, and audit trailing.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Subscription and Billing</h2>
          <p>You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set either on a monthly or annual basis, depending on the type of subscription plan you select when purchasing a Subscription.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities or actions that occur under your account.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at <a href="mailto:legal@claimtagx.com" className="text-lime hover:underline">legal@claimtagx.com</a>.</p>
        </div>
      </div>
    </>
  );
}
