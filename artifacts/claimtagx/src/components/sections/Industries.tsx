import { motion } from 'framer-motion';
import industryValet from '@/assets/industry-valet.png';
import industryLaundry from '@/assets/industry-laundry.png';
import industryLuggage from '@/assets/industry-luggage.png';
import industryRepair from '@/assets/industry-repair.png';

const industries = [
  {
    title: "Valet Parking",
    description: "From boutique hotels to stadium events. Eliminate wrong-car releases. Track every key.",
    image: industryValet
  },
  {
    title: "Dry Cleaning",
    description: "Photo proof at intake. Garment-level tracking. No more 'I never dropped that off.'",
    image: industryLaundry
  },
  {
    title: "Luggage Check",
    description: "Airports, hotels, event venues. One scan to check in, one scan to claim. Zero paper.",
    image: industryLuggage
  },
  {
    title: "Repair Services",
    description: "Jewelers, cobblers, electronics repair. Digital work orders with photo documentation.",
    image: industryRepair
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
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6 } }
};

export default function Industries() {
  return (
    <section id="industries" className="py-24 md:py-32 bg-[#080B12] border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime/20 to-transparent pointer-events-none" />
      
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
              className="bg-steel/80 border border-white/10 rounded-3xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(198,242,78,0.15)] transition-all duration-500 group flex flex-col h-[400px]"
            >
              <div className="relative h-1/2 overflow-hidden">
                <div className="absolute inset-0 bg-obsidian/20 mix-blend-multiply z-10 group-hover:bg-transparent transition-colors duration-500" />
                <img 
                  src={industry.image} 
                  alt={industry.title}
                  className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                />
                {/* Lime corner accent that draws in */}
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-lime border-r-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0" />
              </div>
              
              <div className="p-6 flex flex-col flex-1 relative bg-steel">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-lime transition-colors duration-300">{industry.title}</h3>
                <p className="text-slate text-sm leading-relaxed mt-auto group-hover:text-white/80 transition-colors duration-300">
                  {industry.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
