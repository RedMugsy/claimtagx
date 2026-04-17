import { motion } from 'framer-motion';
import { ShieldCheck, Database, Smartphone, LayoutDashboard, Globe, Camera, WifiOff, FileText, Zap } from 'lucide-react';

const features = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-lime" />,
    title: "Ed25519 Signed Tickets",
    description: "Every ticket carries a cryptographic signature. Mathematically impossible to forge or tamper with."
  },
  {
    icon: <Database className="w-6 h-6 text-lime" />,
    title: "Multi-Tenant Isolation",
    description: "Your data is yours. Row-level security with architectural separation between tenants."
  },
  {
    icon: <Smartphone className="w-6 h-6 text-lime" />,
    title: "Handler Mobile App",
    description: "Native iOS/Android app for handlers. Includes OCR, offline mode, and auto-sync."
  },
  {
    icon: <LayoutDashboard className="w-6 h-6 text-lime" />,
    title: "GM Dashboard",
    description: "Real-time view of all active tickets, handler performance metrics, and average wait times."
  },
  {
    icon: <Globe className="w-6 h-6 text-lime" />,
    title: "No Patron App Needed",
    description: "Patrons claim items via a web link. No download. Works on any smartphone or email client."
  },
  {
    icon: <Camera className="w-6 h-6 text-lime" />,
    title: "Photo + Plate Capture",
    description: "ML Kit-powered OCR reads plates in under a second. Photos attached to every ticket."
  },
  {
    icon: <WifiOff className="w-6 h-6 text-lime" />,
    title: "Offline-First",
    description: "SQLite sync queue means handlers keep working even when the garage has no signal."
  },
  {
    icon: <FileText className="w-6 h-6 text-lime" />,
    title: "Full Audit Trail",
    description: "Every action is timestamped and logged. Fully exportable. Ready for insurance or legal review."
  },
  {
    icon: <Zap className="w-6 h-6 text-lime" />,
    title: "60-Second Setup",
    description: "No hardware. No installation. Sign up, add handlers, start issuing tickets. That's it."
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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-obsidian border-t border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="flex flex-col items-center text-center mb-16"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm">
              Platform
            </span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold text-white mb-6">
            Built for operators who <br className="hidden sm:block" /> can't afford mistakes.
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="bg-steel/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-lime/20 hover:bg-steel transition-colors group"
            >
              <div className="w-12 h-12 bg-obsidian rounded-xl flex items-center justify-center mb-5 border border-white/5 group-hover:border-lime/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
