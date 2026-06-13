import { motion } from 'framer-motion';
import { Camera, Check, Clock, FileText, Smartphone, X } from 'lucide-react';

const paperGets = [
  'A number',
  'Easy to lose',
  'Easy to forge',
  'No record of anything',
  'Plus reorders, reprints, and a storage box',
];

const digitalGets = [
  { icon: <Camera className="w-4 h-4" />, label: 'Photo proof of condition at intake' },
  { icon: <Clock className="w-4 h-4" />, label: 'Timestamped chain of custody' },
  { icon: <Smartphone className="w-4 h-4" />, label: 'Lives on the guest’s phone — can’t be lost' },
  { icon: <FileText className="w-4 h-4" />, label: 'Insurance-ready audit trail, exportable' },
];

export default function PricePerTicket() {
  return (
    <section id="price-per-ticket" className="py-24 md:py-32 bg-obsidian border-t border-white/5 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_bottom,_rgba(198,242,78,0.05),_transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-16"
        >
          <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm mb-6">
            The Same Nickel
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            It costs the same as paper.
            <span className="block text-slate mt-2">It just isn't blind.</span>
          </h2>
          <p className="text-lg text-slate max-w-2xl">
            A printed claim ticket runs you about a nickel. So does a ClaimTagX ticket.
            The difference is everything that comes attached to it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
          {/* Paper ticket */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="bg-steel/30 border border-white/10 border-dashed rounded-3xl p-8 md:p-10 flex flex-col relative"
          >
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="font-mono text-sm font-bold text-slate uppercase tracking-[0.2em]">Paper ticket</h3>
              <div className="font-mono text-4xl font-extrabold text-slate">~5¢</div>
            </div>
            <p className="text-slate text-sm mb-6">What your nickel buys:</p>
            <ul className="flex flex-col gap-4 flex-1">
              {paperGets.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate/80">
                  <X className="w-4 h-4 text-slate/40 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <p className="font-mono text-xs text-slate/50 mt-8">
              When something goes wrong: your word against theirs.
            </p>
          </motion.div>

          {/* Digital ticket */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-steel border border-lime/30 rounded-3xl p-8 md:p-10 flex flex-col relative shadow-[0_0_40px_rgba(198,242,78,0.08)]"
          >
            <div className="absolute -top-3 left-8 bg-lime text-obsidian text-xs font-bold font-mono tracking-wider px-3 py-1 rounded-full">
              SAME PRICE RANGE
            </div>
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="font-mono text-sm font-bold text-lime uppercase tracking-[0.2em]">ClaimTagX ticket</h3>
              <div className="font-mono text-4xl font-extrabold text-white">~5¢<span className="text-base text-slate align-top">*</span></div>
            </div>
            <p className="text-slate text-sm mb-6">What the same nickel buys:</p>
            <ul className="flex flex-col gap-4 flex-1">
              {digitalGets.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-white/90">
                  <span className="text-lime flex-shrink-0">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </li>
              ))}
            </ul>
            <p className="font-mono text-xs text-slate/70 mt-8 flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-lime flex-shrink-0 mt-0.5" />
              When something goes wrong: photos, timestamps, and proof.
            </p>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-xs text-slate/60 mt-8 max-w-xl mx-auto"
        >
          *Essential: $50/mo ÷ 1,000 tickets = 5¢. Advanced: $80/mo ÷ 2,000 tickets = 4¢.
          Whatever your volume, the per-ticket math stays in paper territory — with no
          printing, no reorders, and no storage box under the counter.
        </motion.p>
      </div>
    </section>
  );
}
