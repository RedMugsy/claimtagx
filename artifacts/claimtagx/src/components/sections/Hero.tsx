import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, QrCode } from 'lucide-react';
import heroMockup from '@/assets/hero-mockup.png';
import NodeNetworkBg from '@/components/NodeNetworkBg';
import { track } from '@/lib/analytics';

const industryLinks = [
  { label: 'Hotel', href: '/solutions/hotels' },
  { label: 'Club / restaurant', href: '/solutions/clubs-restaurants' },
  { label: 'Beach club', href: '/solutions/beach-clubs' },
  { label: 'Valet operation', href: '/solutions/valet' },
  { label: 'Dry cleaner', href: '/solutions/dry-cleaning' },
  { label: 'Luggage check', href: '/solutions/luggage' },
  { label: 'Repair shop', href: '/solutions/repair' },
  { label: 'Airline', href: '/solutions/airlines' },
];

export default function Hero() {
  // Phone-wrap-relative mouse tracking — the rotation only responds when the
  // pointer is near/over the phone, so the effect feels direct instead of
  // diluted across the whole viewport.
  const phoneWrapRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);

  useEffect(() => {
    const wrap = phoneWrapRef.current;
    if (!wrap) return;

    const handleMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x, y });
    };
    const handleLeave = () => setTilt({ x: 0, y: 0 });

    wrap.addEventListener('mousemove', handleMove);
    wrap.addEventListener('mouseleave', handleLeave);
    return () => {
      wrap.removeEventListener('mousemove', handleMove);
      wrap.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[100vh] bg-gradient-mesh">
      {/* Custody-chain node network — ambient atmosphere behind the hero. */}
      <NodeNetworkBg />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="flex flex-col items-start text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm"
            >
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-2 h-2 rounded-full bg-lime"
              />
              <span className="text-sm font-medium text-white/90">Free plan available — live in 60 seconds</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-extrabold tracking-tight leading-[1.1] mb-6 w-full"
              style={{ fontSize: "clamp(40px, 5vw, 64px)" }}
            >
              <span className="block text-white">Paper tickets lose items.</span>
              <span className="block text-shimmer">ClaimTagX doesn't.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate mb-10 leading-relaxed max-w-lg"
            >
              A paper ticket can only prove a claim exists. ClaimTagX shows you everything that happens after — every handler, every handoff, every minute in between — at the same price per ticket as paper.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-5 w-full"
            >
              <a
                href="https://app.claimtagx.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('cta_clicked', { action: 'start_free', location: 'hero' })}
                className="w-full sm:w-auto bg-lime text-obsidian px-8 py-4 rounded-lg font-bold text-lg hover:bg-lime-hover hover:-translate-y-px hover:shadow-[0_0_30px_rgba(198,242,78,0.4)] transition-all duration-200 text-center"
              >
                Start free — no card needed
              </a>
              <a
                href="https://calendly.com/claimtagx/demo"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('cta_clicked', { action: 'book_demo', location: 'hero' })}
                className="w-full sm:w-auto border border-white/15 text-white px-8 py-4 rounded-lg font-bold text-lg hover:border-lime/40 hover:text-lime transition-all duration-200 group flex items-center justify-center gap-2"
              >
                Book a demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>

            {/* Risk reversal */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-sm text-slate/80 mb-10"
            >
              Free plan forever · No credit card · Cancel anytime
            </motion.p>

            {/* Industry selector — self-identification routes to the vertical pages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-16 w-full border-t border-white/10 pt-8"
            >
              <p className="text-base font-bold text-white mb-4">
                I run a<span className="text-lime">…</span>
              </p>
              <div className="flex flex-wrap gap-2.5">
                {industryLinks.map((ind) => (
                  <Link
                    key={ind.href}
                    href={ind.href}
                    onClick={() => track('industry_selected', { industry: ind.href.replace('/solutions/', ''), label: ind.label, location: 'hero' })}
                    className="group/pill flex items-center gap-1.5 text-sm font-semibold text-white bg-steel/80 border border-lime/25 rounded-full px-4 py-2.5 hover:border-lime hover:bg-lime hover:text-obsidian transition-all duration-200"
                  >
                    {ind.label}
                    <ArrowRight className="w-3.5 h-3.5 text-lime group-hover/pill:text-obsidian group-hover/pill:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            ref={phoneWrapRef}
            style={{ y: y1, perspective: '1000px' }}
            className="relative lg:h-[700px] flex items-center justify-center lg:justify-end"
          >
            {/* Three nested transforms, isolated per layer so they compose
                instead of overwriting each other:
                  1) entrance animation (Framer Motion: opacity/x/scale)
                  2) mouse tilt (rotateY/rotateX)
                  3) idle float (CSS keyframes via animate-float)
                CSS animations override inline styles per the cascade, so
                tilt + animate-float on the same element silently clobbers
                the tilt every keyframe. */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
              className="relative w-full max-w-[360px]"
              style={{ transformStyle: "preserve-3d" }}
            >
            <div
              style={{
                transform: `rotateY(${tilt.x * 25}deg) rotateX(${-tilt.y * 25}deg)`,
                transformStyle: "preserve-3d",
                transition: "transform 0.1s ease-out",
              }}
            >
            <div className="relative w-full animate-float">
              <img 
                src={heroMockup} 
                alt="ClaimTagX App Mockup" 
                className="w-full h-auto drop-shadow-[0_0_50px_rgba(198,242,78,0.15)] relative z-10 rounded-[2.5rem]"
              />
              
              {/* Floating QR Element */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -left-12 bottom-24 bg-steel/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl z-20 flex items-center gap-4"
                style={{ transform: "translateZ(50px)" }}
              >
                <div className="bg-white p-2 rounded-lg">
                  <QrCode className="w-8 h-8 text-obsidian" />
                </div>
                <div>
                  <div className="text-xs font-mono text-lime font-bold">VERIFIED</div>
                  <div className="text-sm text-white font-medium">Ticket #4839</div>
                </div>
              </motion.div>
              
              {/* Floating Issue Time Element */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -right-8 top-32 bg-steel/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl shadow-2xl z-20 flex items-center gap-3"
                style={{ transform: "translateZ(30px)" }}
              >
                <div className="w-2 h-2 rounded-full bg-lime animate-pulse" />
                <div className="text-sm text-white font-medium">
                  &lt;2s <span className="text-slate">issue time</span>
                </div>
              </motion.div>
            </div>
            </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
