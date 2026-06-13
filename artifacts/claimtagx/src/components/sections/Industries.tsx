import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import industryValet from '@/assets/industry-valet.png';
import industryLaundry from '@/assets/industry-laundry.png';
import industryLuggage from '@/assets/industry-luggage.png';
import industryRepair from '@/assets/industry-repair.png';

const industries = [
  // Multi-flow venues — one buyer, several custody flows
  {
    title: "Hotels & Resorts",
    description: "Valet, luggage, and cloakroom on one platform. One custody record per guest.",
    image: industryValet,
    href: "/solutions/hotels",
    tag: "Multi-flow venue"
  },
  {
    title: "Clubs & Restaurants",
    description: "Coat check, valet, and VIP storage. Tickets that survive the whole night.",
    image: industryValet,
    href: "/solutions/clubs-restaurants",
    tag: "Multi-flow venue"
  },
  {
    title: "Beach Clubs",
    description: "Valuables, gear, and cabanas. Paper doesn't swim — digital tickets do.",
    image: industryLuggage,
    href: "/solutions/beach-clubs",
    tag: "Multi-flow venue"
  },
  // Single asset class — one flow, deep
  {
    title: "Valet Parking",
    description: "From boutique hotels to stadium events. Eliminate wrong-car releases. Track every key.",
    image: industryValet,
    href: "/solutions/valet",
    tag: "Single asset class"
  },
  {
    title: "Dry Cleaning",
    description: "Photo proof at intake. Garment-level tracking. No more 'I never dropped that off.'",
    image: industryLaundry,
    href: "/solutions/dry-cleaning",
    tag: "Single asset class"
  },
  {
    title: "Luggage Check",
    description: "Airports, hotels, event venues. One scan to check in, one scan to claim. Zero paper.",
    image: industryLuggage,
    href: "/solutions/luggage",
    tag: "Single asset class"
  },
  {
    title: "Repair Services",
    description: "Jewelers, cobblers, electronics repair. Digital work orders with photo documentation.",
    image: industryRepair,
    href: "/solutions/repair",
    tag: "Single asset class"
  },
  {
    title: "Airlines & Ground Handling",
    description: "Gate checks, transfers, delayed bags. Chain of custody from gate to carousel.",
    image: industryLuggage,
    href: "/solutions/airlines",
    tag: "Single asset class"
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
            <motion.div key={index} variants={itemVariants}>
              <Link
                href={industry.href}
                className="bg-steel/80 border border-white/10 rounded-3xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(198,242,78,0.15)] transition-all duration-500 group flex flex-col h-[420px]"
              >
                <div className="relative h-1/2 overflow-hidden">
                  <div className="absolute inset-0 bg-obsidian/20 mix-blend-multiply z-10 group-hover:bg-transparent transition-colors duration-500" />
                  <img
                    src={industry.image}
                    alt={industry.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  />
                  {/* Lime corner accent that draws in */}
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-lime border-r-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0" />
                </div>

                <div className="p-6 flex flex-col flex-1 relative bg-steel">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-lime transition-colors duration-300">{industry.title}</h3>
                  <p className="text-slate text-sm leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                    {industry.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-lime opacity-80 group-hover:opacity-100 transition-opacity">
                    See the solution
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
