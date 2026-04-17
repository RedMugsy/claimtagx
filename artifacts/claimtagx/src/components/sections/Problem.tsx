import { motion } from 'framer-motion';
import { Car, ClipboardList, Clock, DollarSign } from 'lucide-react';

const painPoints = [
  {
    icon: <Car className="w-6 h-6 text-lime" />,
    title: "Wrong-item releases",
    description: "Unreadable handwriting, duplicate numbers. One mistake = one lawsuit."
  },
  {
    icon: <ClipboardList className="w-6 h-6 text-lime" />,
    title: "Zero visibility",
    description: "No timestamps, no audit trail. Your insurer will ask — you won't have answers."
  },
  {
    icon: <Clock className="w-6 h-6 text-lime" />,
    title: "Slow handoffs",
    description: "Patron waits. Handler hunts. Lobby backs up. Tips drop."
  },
  {
    icon: <DollarSign className="w-6 h-6 text-lime" />,
    title: "Hidden costs",
    description: "Ticket stock, printers, ink, manual logs. The 'cheap' system isn't."
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
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
              A $0.03 paper ticket is costing you thousands.
            </motion.h2>
            
            <motion.p variants={itemVariants} className="text-lg text-slate leading-relaxed">
              Every year, millions of dollars in claims, lawsuits, and lost business trace back to a single point of failure: the paper ticket. Unreadable. Duplicable. Loseable. No timestamp. No photo. No audit trail. And when something goes wrong, it's your word against theirs — and you have no proof.
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
