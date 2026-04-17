import { motion } from 'framer-motion';

const steps = [
  {
    num: "01",
    title: "Handler tags the item",
    description: "Snap a photo, scan the plate with OCR, add notes. One signed digital ticket created in under 2 seconds."
  },
  {
    num: "02",
    title: "Patron gets a digital claim",
    description: "QR code sent via text or email. No app download required. Works on any smartphone."
  },
  {
    num: "03",
    title: "Scan to release",
    description: "Patron presents QR. Handler scans. Cryptographic signature verified. Item released. Audit log updated automatically."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 md:py-32 bg-[#080B12] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
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
          {/* Subtle connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

          {steps.map((step, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="bg-steel border border-white/5 rounded-2xl p-8 relative flex flex-col h-full group hover:border-lime/20 transition-colors duration-300"
            >
              {/* Giant background number */}
              <div className="absolute top-4 right-6 font-mono text-[80px] font-bold text-white/[0.03] leading-none select-none group-hover:text-lime/[0.05] transition-colors duration-300">
                {step.num}
              </div>
              
              <div className="mb-12">
                <div className="w-10 h-10 rounded-full bg-obsidian border border-white/10 flex items-center justify-center font-mono text-sm text-lime font-bold">
                  {step.num}
                </div>
              </div>
              
              <div className="mt-auto">
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">{step.title}</h3>
                <p className="text-slate text-base leading-relaxed relative z-10">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
