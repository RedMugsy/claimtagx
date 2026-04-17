import SEO from '@/components/SEO';
import Hero from '@/components/sections/Hero';
import TrustStrip from '@/components/sections/TrustStrip';
import Problem from '@/components/sections/Problem';
import HowItWorks from '@/components/sections/HowItWorks';
import ProductDemo from '@/components/sections/ProductDemo';
import Features from '@/components/sections/Features';
import Stats from '@/components/sections/Stats';
import Industries from '@/components/sections/Industries';
import Pricing from '@/components/sections/Pricing';
import Comparison from '@/components/sections/Comparison';
import FinalCTA from '@/components/sections/FinalCTA';
import LiveActivityFeed from '@/components/LiveActivityFeed';

export default function Home() {
  return (
    <>
      <SEO 
        title="ClaimTagX — Digital Custody Management Platform"
        description="Replace paper claim tickets with cryptographically signed digital tags. Valet, laundry, luggage, repair — one platform, zero lost items."
      />
      <div className="bg-obsidian w-full relative overflow-hidden">
        {/* Subtle global noise/texture */}
        <div className="fixed inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
        
        <Hero />
        <TrustStrip />
        <Problem />
        <HowItWorks />
        <ProductDemo />
        <Features />
        <Stats />
        <Industries />
        <Pricing />
        <Comparison />
        <FinalCTA />
        
        <LiveActivityFeed />
      </div>
    </>
  );
}
