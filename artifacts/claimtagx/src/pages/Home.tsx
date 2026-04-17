import SEO from '@/components/SEO';
import Hero from '@/components/sections/Hero';
import Problem from '@/components/sections/Problem';
import HowItWorks from '@/components/sections/HowItWorks';
import Features from '@/components/sections/Features';
import Industries from '@/components/sections/Industries';
import Pricing from '@/components/sections/Pricing';
import Comparison from '@/components/sections/Comparison';
import FinalCTA from '@/components/sections/FinalCTA';

export default function Home() {
  return (
    <>
      <SEO 
        title="ClaimTagX — Digital Custody Management Platform"
        description="Replace paper claim tickets with cryptographically signed digital tags. Valet, laundry, luggage, repair — one platform, zero lost items."
      />
      <div className="bg-obsidian w-full relative overflow-hidden">
        {/* Subtle global noise/texture could go here if desired */}
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Industries />
        <Pricing />
        <Comparison />
        <FinalCTA />
      </div>
    </>
  );
}
