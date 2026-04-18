import { motion } from 'framer-motion';
import { EyeOff, ClipboardList, Clock, DollarSign } from 'lucide-react';

const painPoints = [
  {
    icon: <EyeOff className="w-6 h-6 text-lime" />,
    title: "Blind Custody",
    description: "Who moved the item? When? Where is it now? Paper doesn't know. You're relying on staff memory in an industry with annual turnover above 100%. If your system lives in your handlers' heads, you aren't managing — you're guessing."
  },
  {
    icon: <Clock className="w-6 h-6 text-lime" />,
    title: "The Last Impression",
    description: "Your guest's experience ends at your counter. Every minute they spend watching your team hunt for an asset is a minute they spend reconsidering their tip and their review. Paper is the bottleneck between a happy guest and a frustrated one."
  },
  {
    icon: <DollarSign className="w-6 h-6 text-lime" />,
    title: "The \u201CHidden Minute Tax\u201D",
    description: "You're paying for every second of disorder. A 60-second delay in retrieval doesn't seem like much until you multiply it by 100 transactions a night. You aren't just losing time; you're paying for excess labor to compensate for a \u201Ccheap\u201D paper system."
  },
  {
    icon: <ClipboardList className="w-6 h-6 text-lime" />,
    title: "Zero Visibility",
    description: "Most days, paper \u201Cworks.\u201D But the day a VIP claims a $5,000 scratch or a traveler loses their stub, paper fails completely. Without a digital audit trail and photo intake, your insurer will ask — you won't have answers. You don't win disputes — you just settle them."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

export default function Problem() {
  return (
    <section id="problem" className="py-24 md:py-32 bg-obsidian border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-lime/[0.02] via-obsidian to-obsidian pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center"
        >
          {/* Left Column */}
          <div className="flex flex-col justify-center">
            <motion.div variants={itemVariants} className="mb-6">
              <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm">
                The Problem
              </span>
            </motion.div>
            
            <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              A paper ticket doesn't break your operation.
              <span className="block text-slate font-bold mt-2">
                It raises complaints, leaves you guessing — and costs you every minute.
              </span>
            </motion.h2>
            
            <motion.p variants={itemVariants} className="text-lg text-slate leading-relaxed">
              Paper works — until it doesn't. Every shift creates small gaps: assets aren't ready when needed, handoffs aren't consistent, and there's no record of what actually happened. Your team compensates by searching instead of executing and asking instead of knowing — adding time to every transaction.
            </motion.p>
            <motion.p variants={itemVariants} className="text-lg text-slate leading-relaxed mt-4">
              You don't notice the problem per ticket. You feel it at scale, every shift. In a high-stakes custody business, relying on a paper stub isn't a strategy — it's a choice to stay in the dark.
            </motion.p>
          </div>

          {/* Right Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-lime/5 blur-[80px] rounded-full pointer-events-none" />
            {painPoints.map((point, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-steel/80 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-lime/30 transition-all duration-300 group shadow-lg"
              >
                <div className="w-12 h-12 bg-obsidian rounded-xl flex items-center justify-center mb-4 border border-white/5 group-hover:bg-lime/10 transition-colors duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-lime/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">{point.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{point.title}</h3>
                <p className="text-sm text-slate leading-relaxed group-hover:text-slate/80 transition-colors">
                  {point.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
