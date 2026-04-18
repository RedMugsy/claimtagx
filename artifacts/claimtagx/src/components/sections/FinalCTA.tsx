import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="relative py-32 md:py-48 bg-obsidian overflow-hidden flex items-center justify-center">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.03, 0.06, 0.03]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-lime blur-[120px] rounded-full pointer-events-none" 
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center border border-white/10 bg-steel/20 backdrop-blur-xl rounded-[3rem] p-12 md:p-24 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Ready to ditch the paper?
          </h2>
          
          <p className="text-xl text-slate mb-12 max-w-2xl mx-auto leading-relaxed">
            Start your free trial today. No credit card required. Live in 60 seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
            <a
              href="https://app.claimtagx.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-lime text-obsidian px-10 py-5 rounded-xl font-extrabold text-lg hover:bg-lime-hover hover:scale-105 hover:shadow-[0_0_40px_rgba(198,242,78,0.4)] transition-all duration-300"
            >
              Start free trial
            </a>
            <a
              href="https://calendly.com/claimtagx/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-10 py-5 rounded-xl font-bold text-lg hover:border-lime/50 hover:bg-white/10 hover:text-lime transition-all duration-300 group flex items-center justify-center gap-2"
            >
              Book a demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
          
          <p className="text-sm text-slate/60 font-medium">
            14-day free trial on all plans. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
