import { motion } from 'framer-motion';

const industries = [
  {
    title: "Valet Parking",
    description: "From boutique hotels to stadium events. Eliminate wrong-car releases. Track every key."
  },
  {
    title: "Dry Cleaning & Laundry",
    description: "Photo proof at intake. Garment-level tracking. No more 'I never dropped that off.'"
  },
  {
    title: "Luggage & Coat Check",
    description: "Airports, hotels, event venues. One scan to check in, one scan to claim. Zero paper."
  },
  {
    title: "Repair & Service",
    description: "Jewelers, cobblers, electronics repair. Digital work orders with photo documentation."
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Industries() {
  return (
    <section id="industries" className="py-20 md:py-32 bg-[#080B12] border-t border-white/5 relative overflow-hidden">
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
              Industries
            </span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold text-white mb-6">
            Anywhere items change hands,<br className="hidden sm:block" /> ClaimTagX tracks them.
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {industries.map((industry, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="bg-steel border border-white/5 rounded-2xl p-8 hover:-translate-y-1 hover:border-lime/20 transition-all duration-200 group flex flex-col"
            >
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-lime transition-colors">{industry.title}</h3>
              <p className="text-slate text-sm leading-relaxed mt-auto">
                {industry.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
