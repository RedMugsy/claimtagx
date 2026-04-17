import SEO from '@/components/SEO';
import PricingSection from '@/components/sections/Pricing';
import FinalCTA from '@/components/sections/FinalCTA';

export default function PricingPage() {
  return (
    <>
      <SEO
        title="Pricing — ClaimTagX"
        description="Five tiers built to scale with your operation. Start free. Upgrade when you outgrow it. No per-ticket fees."
      />
      <div className="bg-obsidian w-full relative overflow-hidden pt-16">
        <PricingSection />
        <FinalCTA />
      </div>
    </>
  );
}
