import { motion } from 'framer-motion';
import howItWorks1 from '@/assets/how-it-works-1.png';
import howItWorks2 from '@/assets/how-it-works-2.png';
import howItWorks3 from '@/assets/how-it-works-3.png';

const steps = [
  {
    num: "01",
    title: "Handler tags the item",
    description: "Snap a photo, scan the plate with OCR, add notes. One signed digital ticket created in under 2 seconds.",
    image: howItWorks1
  },
  {
    num: "02",
    title: "Patron gets a digital claim",
    description: "QR code sent via text or email. No app download required. Works on any smartphone.",
    image: howItWorks2
  },
  {
    num: "03",
    title: "Scan to release",
    description: "Patron presents QR. Handler scans. Cryptographic signature verified. Item released. Audit log updated automatically.",
    image: howItWorks3
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
};

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 md:py-32 bg-[#080B12] relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMHgtNDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0wIDB2NDBoNDBWMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="flex flex-col items-center text-center mb-20"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm">
              How It Works
            </span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold text-white mb-6">
            Three taps. No paper.<br className="hidden sm:block" /> Full custody chain.
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {/* Animated Connecting Line SVG for desktop */}
          <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-[2px] pointer-events-none z-0 -translate-y-1/2">
            <svg width="100%" height="20" preserveAspectRatio="none" viewBox="0 0 100 20" className="overflow-visible">
              <motion.path
                d="M 0 10 L 100 10"
                fill="transparent"
                stroke="rgba(198, 242, 78, 0.3)"
                strokeWidth="0.5"
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </svg>
          </div>

          {steps.map((step, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="bg-steel/90 backdrop-blur-md border border-white/5 rounded-3xl p-6 relative flex flex-col h-full group hover:border-lime/30 transition-all duration-500 hover:-translate-y-2 z-10 overflow-hidden shadow-xl"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-square rounded-2xl mb-8 overflow-hidden bg-obsidian/50 border border-white/5 flex items-center justify-center">
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-[85%] h-[85%] object-contain group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent" />
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-lime border border-lime text-obsidian flex items-center justify-center font-mono text-sm font-bold shadow-[0_0_15px_rgba(198,242,78,0.4)] group-hover:scale-110 transition-transform duration-300">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-white">{step.title}</h3>
              </div>
              
              <p className="text-slate text-base leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
