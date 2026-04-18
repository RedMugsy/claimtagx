import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, QrCode } from 'lucide-react';
import heroMockup from '@/assets/hero-mockup.png';

export default function Hero() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[100vh] bg-gradient-mesh">
      {/* Dynamic Spotlight */}
      <div 
        className="absolute w-[800px] h-[800px] bg-lime opacity-[0.03] blur-[120px] rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{ 
          transform: `translate(${mousePos.x * 200}px, ${mousePos.y * 200}px)`
        }}
      />

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
              <span className="text-sm font-medium text-white/90">Now in public beta</span>
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
              Replace paper claim tickets with cryptographically signed digital tags. Valet, laundry, luggage, repair — one platform, zero lost items.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full"
            >
              <a
                href="https://app.claimtagx.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-lime text-obsidian px-8 py-4 rounded-lg font-bold text-lg hover:bg-lime-hover hover:-translate-y-px hover:shadow-[0_0_30px_rgba(198,242,78,0.4)] transition-all duration-200"
              >
                Start free trial
              </a>
              <a
                href="https://calendly.com/claimtagx/demo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto border border-white/15 text-white px-8 py-4 rounded-lg font-bold text-lg hover:border-lime/40 hover:text-lime transition-all duration-200 group flex items-center justify-center gap-2"
              >
                Book a demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </div>

          <motion.div 
            style={{ y: y1 }}
            className="relative lg:h-[700px] flex items-center justify-center lg:justify-end"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
              className="relative w-full max-w-[360px] animate-float"
              style={{
                transform: `rotateY(${mousePos.x * 20}deg) rotateX(${-mousePos.y * 20}deg)`,
                transformStyle: "preserve-3d"
              }}
            >
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
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
