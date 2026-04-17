import SEO from '@/components/SEO';

export default function AUP() {
  return (
    <>
      <SEO 
        title="Acceptable Use Policy | ClaimTagX"
        description="Acceptable Use Policy for ClaimTagX."
      />
      <div className="pt-32 pb-20 max-w-[800px] mx-auto px-4 sm:px-6">
        <h1 className="text-4xl font-bold text-white mb-2">Acceptable Use Policy</h1>
        <p className="text-slate text-sm mb-10 pb-10 border-b border-white/10">Last updated: April 17, 2026</p>
        
        <div className="prose prose-invert prose-slate max-w-none text-slate-300">
          <p>This Acceptable Use Policy ("AUP") outlines the acceptable use of the ClaimTagX platform and services. All users must comply with this AUP.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Prohibited Activities</h2>
          <p>You may not use the Services to:</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Violate any applicable local, state, national, or international law.</li>
            <li>Infringe upon or violate our intellectual property rights or the intellectual property rights of others.</li>
            <li>Transmit any material that contains viruses, Trojan horses, worms, or any other malicious code.</li>
            <li>Interfere with or disrupt the integrity or performance of the Services.</li>
            <li>Attempt to gain unauthorized access to the Services or their related systems or networks.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Content Standards</h2>
          <p>Data entered into the platform must not be defamatory, obscene, abusive, offensive, or otherwise objectionable. You are responsible for ensuring all data collected via the platform (including photos) complies with relevant privacy laws.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Enforcement</h2>
          <p>We reserve the right to investigate and take appropriate action against anyone who violates this AUP, including terminating or suspending access to the Services.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Contact Us</h2>
          <p>If you suspect a violation of this AUP, please report it to <a href="mailto:abuse@claimtagx.com" className="text-lime hover:underline">abuse@claimtagx.com</a>.</p>
        </div>
      </div>
    </>
  );
}
