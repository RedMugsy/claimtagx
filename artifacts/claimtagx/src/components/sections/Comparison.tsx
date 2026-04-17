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
    <section id="comparison" className="py-20 md:py-32 bg-[#080B12] border-t border-white/5 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="w-full overflow-x-auto pb-6"
        >
          <div className="min-w-[700px] bg-steel/30 rounded-2xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-4 bg-steel border-b border-white/10 p-4 font-bold text-sm">
              <div className="text-white">Feature</div>
              <div className="text-slate text-center">Paper Tickets</div>
              <div className="text-slate text-center">Legacy Software</div>
              <div className="text-lime text-center">ClaimTagX</div>
            </div>
            
            <div className="divide-y divide-white/5">
              {comparisonData.map((row, i) => (
                <div key={i} className="grid grid-cols-4 p-4 items-center hover:bg-white/[0.02] transition-colors">
                  <div className="text-white/90 text-sm font-medium">{row.feature}</div>
                  
                  {/* Paper Column */}
                  <div className="text-center flex justify-center">
                    {typeof row.paper === 'boolean' ? (
                      row.paper ? <Check className="w-5 h-5 text-slate" /> : <Minus className="w-5 h-5 text-slate/50" />
                    ) : (
                      <span className="text-sm text-slate">{row.paper}</span>
                    )}
                  </div>
                  
                  {/* Legacy Column */}
                  <div className="text-center flex justify-center">
                    {typeof row.legacy === 'boolean' ? (
                      row.legacy ? <Check className="w-5 h-5 text-slate" /> : <Minus className="w-5 h-5 text-slate/50" />
                    ) : row.legacy === "partial" ? (
                      <span className="text-amber-500 font-bold">~</span>
                    ) : (
                      <span className="text-sm text-slate">{row.legacy}</span>
                    )}
                  </div>
                  
                  {/* ClaimTagX Column */}
                  <div className="text-center flex justify-center bg-lime/5 -my-4 py-4 rounded-md">
                    {typeof row.us === 'boolean' ? (
                      row.us ? <Check className="w-5 h-5 text-lime" /> : <Minus className="w-5 h-5 text-lime/50" />
                    ) : (
                      <span className="text-sm text-lime font-bold">{row.us}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
