import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="relative py-24 md:py-40 bg-obsidian border-t border-white/5 overflow-hidden flex items-center justify-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime opacity-[0.04] blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Ready to ditch the paper?
          </h2>
          
          <p className="text-xl text-slate mb-10 max-w-2xl mx-auto">
            Start your free trial today. No credit card required. Live in 60 seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="https://app.claimtagx.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-lime text-obsidian px-8 py-4 rounded-lg font-bold text-lg hover:bg-lime-hover hover:-translate-y-px hover:shadow-[0_0_24px_rgba(198,242,78,0.3)] transition-all duration-200"
            >
              Start free trial
            </a>
            <a
              href="mailto:sales@claimtagx.com"
              className="w-full sm:w-auto border border-white/15 text-white px-8 py-4 rounded-lg font-bold text-lg hover:border-lime/40 hover:text-lime transition-all duration-200 group flex items-center justify-center gap-2"
            >
              Talk to sales
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
          
          <p className="text-sm text-slate/70 font-medium">
            14-day free trial on all plans. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
