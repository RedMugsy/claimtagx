import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';

const comparisonData = [
  { feature: "Crypto signing", paper: false, legacy: false, us: true },
  { feature: "Offline-capable", paper: true, legacy: "partial", us: true },
  { feature: "Photo + OCR", paper: false, legacy: "partial", us: true },
  { feature: "Real-time dashboard", paper: false, legacy: "partial", us: true },
  { feature: "Patron app-free", paper: true, legacy: false, us: true },
  { feature: "Multi-tenant", paper: false, legacy: false, us: true },
  { feature: "Audit trail", paper: false, legacy: "partial", us: true },
  { feature: "Setup time", paper: "Minutes", legacy: "Days/weeks", us: "60 seconds" },
  { feature: "Price", paper: "Low upfront, high risk", legacy: "$$$+", us: "From $79/mo" }
];

export default function Comparison() {
  return (
    <section id="comparison" className="py-24 md:py-32 bg-steel border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-16"
        >
          <div className="mb-6">
            <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm">
              Why Switch
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            ClaimTagX vs. the status quo
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="w-full overflow-x-auto pb-6"
        >
          <div className="min-w-[700px] bg-obsidian rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl relative">
            {/* Highlight Background for ClaimTagX Column */}
            <div className="absolute top-0 right-0 w-[25%] h-full bg-lime/[0.03] pointer-events-none" />
            
            <div className="grid grid-cols-4 bg-white/5 border-b border-white/10 p-6 font-bold text-sm">
              <div className="text-white/70 uppercase tracking-wider text-xs">Feature</div>
              <div className="text-slate uppercase tracking-wider text-xs text-center">Paper Tickets</div>
              <div className="text-slate uppercase tracking-wider text-xs text-center">Legacy Software</div>
              <div className="text-lime uppercase tracking-wider text-xs text-center relative">
                ClaimTagX
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full h-1 bg-lime shadow-[0_0_10px_rgba(198,242,78,0.5)]" />
              </div>
            </div>
            
            <div className="divide-y divide-white/5">
              {comparisonData.map((row, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="grid grid-cols-4 p-5 items-center hover:bg-white/[0.02] transition-colors relative z-10"
                >
                  <div className="text-white font-medium pl-2">{row.feature}</div>
                  
                  {/* Paper Column */}
                  <div className="text-center flex justify-center">
                    {typeof row.paper === 'boolean' ? (
                      row.paper ? <Check className="w-5 h-5 text-slate/60" /> : <Minus className="w-5 h-5 text-slate/30" />
                    ) : (
                      <span className="text-sm text-slate/70 font-medium">{row.paper}</span>
                    )}
                  </div>
                  
                  {/* Legacy Column */}
                  <div className="text-center flex justify-center">
                    {typeof row.legacy === 'boolean' ? (
                      row.legacy ? <Check className="w-5 h-5 text-slate/60" /> : <Minus className="w-5 h-5 text-slate/30" />
                    ) : row.legacy === "partial" ? (
                      <span className="text-amber-500/70 font-bold text-lg leading-none">~</span>
                    ) : (
                      <span className="text-sm text-slate/70 font-medium">{row.legacy}</span>
                    )}
                  </div>
                  
                  {/* ClaimTagX Column */}
                  <div className="text-center flex justify-center">
                    {typeof row.us === 'boolean' ? (
                      row.us ? (
                        <div className="bg-lime/10 p-1.5 rounded-full">
                          <Check className="w-5 h-5 text-lime" />
                        </div>
                      ) : <Minus className="w-5 h-5 text-lime/50" />
                    ) : (
                      <span className="text-sm text-lime font-bold">{row.us}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
