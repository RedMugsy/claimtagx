import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-lime opacity-[0.05] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
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
            style={{ fontSize: "clamp(36px, 6vw, 72px)" }}
          >
            <span className="block text-white">Paper tickets lose items.</span>
            <span className="block text-lime">ClaimTagX doesn't.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Replace paper claim tickets with cryptographically signed digital tags. Valet, laundry, luggage, repair — one platform, zero lost items.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-20 w-full justify-center"
          >
            <a
              href="https://app.claimtagx.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-lime text-obsidian px-8 py-4 rounded-lg font-bold text-lg hover:bg-lime-hover hover:-translate-y-px hover:shadow-[0_0_24px_rgba(198,242,78,0.3)] transition-all duration-200"
            >
              Start free trial
            </a>
            <a
              href="#how"
              className="w-full sm:w-auto border border-white/15 text-white px-8 py-4 rounded-lg font-bold text-lg hover:border-lime/40 hover:text-lime transition-all duration-200 group flex items-center justify-center gap-2"
            >
              See how it works
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Proof Strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 pt-8 border-t border-white/10 w-full max-w-3xl text-sm font-mono text-slate"
          >
            <div className="flex items-center gap-2">
              <span className="text-lime">✓</span>
              <span>&lt;2s average issue time</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-white/10"></div>
            <div className="flex items-center gap-2">
              <span className="text-lime">✓</span>
              <span>Ed25519 cryptographic signing</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-white/10"></div>
            <div className="flex items-center gap-2">
              <span className="text-lime">✓</span>
              <span>100% digital audit trail</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
