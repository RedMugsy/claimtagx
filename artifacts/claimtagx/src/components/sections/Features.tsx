import { motion } from 'framer-motion';
import { ShieldCheck, Database, Smartphone, LayoutDashboard, Globe, Camera, WifiOff, FileText, Zap } from 'lucide-react';
import featureHero from '@/assets/feature-hero.png';

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
    description: "Real-time view of all active tickets, handler performance metrics, and wait times."
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
    title: "Offline-First Ticketing",
    description: "Issue a tag to any patron, guest, or customer even when they have no signal. Tickets sync the moment connectivity returns."
  },
  {
    icon: <FileText className="w-6 h-6 text-lime" />,
    title: "Full Audit Trail",
    description: "Every action is timestamped and logged. Fully exportable. Ready for insurance review."
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
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function Features() {
  return (
    <section id="features" className="py-24 md:py-32 bg-obsidian border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_top_right,_rgba(198,242,78,0.05),_transparent_70%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
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

        {/* Hero Visual for Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="w-full relative mb-24 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group"
        >
          <img 
            src={featureHero} 
            alt="ClaimTagX Dashboard Visualization" 
            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent pointer-events-none" />
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
              whileHover={{ y: -5 }}
              className="bg-steel/40 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:border-lime/30 hover:bg-steel transition-all duration-300 group shadow-lg overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-lime/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-lime/10 transition-colors duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-obsidian rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-lime/30 group-hover:scale-110 transition-all duration-300 shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
