import SEO from '@/components/SEO';

export default function Privacy() {
  return (
    <>
      <SEO 
        title="Privacy Policy | ClaimTagX"
        description="Privacy policy for ClaimTagX."
      />
      <div className="pt-32 pb-20 max-w-[800px] mx-auto px-4 sm:px-6">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate text-sm mb-10 pb-10 border-b border-white/10">Last updated: April 17, 2026</p>
        
        <div className="prose prose-invert prose-slate max-w-none text-slate-300">
          <p>This Privacy Policy explains how ClaimTagX ("we", "us", or "our") collects, uses, and discloses your information when you use our multi-tenant SaaS platform and related services (the "Services").</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information that you provide directly to us when you register for an account, use the Services, or communicate with us. This may include:</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li><strong>Account Information:</strong> Name, email address, phone number, password, and business details.</li>
            <li><strong>Service Data:</strong> Information entered into the ClaimTagX platform, including notes, license plate data (via OCR), photos, and timestamps.</li>
            <li><strong>Payment Information:</strong> Billing details are processed securely by our third-party payment processor.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Provide, maintain, and improve our Services.</li>
            <li>Process transactions and send related information.</li>
            <li>Send technical notices, updates, security alerts, and administrative messages.</li>
            <li>Respond to your comments, questions, and requests.</li>
            <li>Generate cryptographic signatures for digital tags to ensure data integrity.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Data Security</h2>
          <p>We implement robust security measures designed to protect your information. This includes row-level security for multi-tenant isolation, Ed25519 cryptographic signing for ticket integrity, and encryption in transit and at rest. However, no security system is impenetrable, and we cannot guarantee absolute security.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@claimtagx.com" className="text-lime hover:underline">privacy@claimtagx.com</a>.</p>
        </div>
      </div>
    </>
  );
}
