import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { track } from '@/lib/analytics';

const HOURLY_LABOR_COST = 18; // blended front-of-house labor $/hr
const MINUTES_SAVED_PER_ITEM = 1.5; // search, verify, dispute time saved per transaction
const DISPUTE_RATE = 0.001; // disputes per transaction on paper
const AVG_DISPUTE_COST = 350; // average settle-without-evidence cost

// Annual-billing plan tiers (must match /price)
const PLANS = [
  { name: 'Basic', price: 25, cap: 250 },
  { name: 'Essential', price: 50, cap: 1000 },
  { name: 'Advanced', price: 80, cap: 2000 },
] as const;

function recommendPlan(monthlyTickets: number) {
  const plan = PLANS.find((p) => monthlyTickets <= p.cap);
  if (!plan) {
    return { name: 'Enterprise', line: 'Volume per-ticket pricing — talk to sales' };
  }
  const centsPerTicket = Math.max(1, Math.round((plan.price / monthlyTickets) * 100));
  return {
    name: plan.name,
    line: `$${plan.price}/mo ≈ ${centsPerTicket}¢ per ticket at your volume`,
  };
}

interface ROICalculatorProps {
  defaultItemsPerDay?: number;
  defaultDaysPerWeek?: number;
  itemLabel?: string;
}

export default function ROICalculator({
  defaultItemsPerDay = 40,
  defaultDaysPerWeek = 5,
  itemLabel = 'Items handled per day',
}: ROICalculatorProps) {
  const [itemsPerDay, setItemsPerDay] = useState(defaultItemsPerDay);
  const [daysPerWeek, setDaysPerWeek] = useState(defaultDaysPerWeek);

  const itemsPerMonth = itemsPerDay * daysPerWeek * 4.33;
  const laborSavings = (itemsPerMonth * MINUTES_SAVED_PER_ITEM / 60) * HOURLY_LABOR_COST;
  const disputeSavings = itemsPerMonth * DISPUTE_RATE * AVG_DISPUTE_COST;
  const totalMonthly = Math.round(laborSavings + disputeSavings);
  const hoursSaved = Math.round(itemsPerMonth * MINUTES_SAVED_PER_ITEM / 60);
  const plan = recommendPlan(Math.round(itemsPerMonth));

  // Debounced — only fire once a user actually settles on a value, not on every drag tick.
  const interactedRef = useRef(false);
  useEffect(() => { interactedRef.current = true; }, [itemsPerDay, daysPerWeek]);
  useEffect(() => {
    if (!interactedRef.current) return;
    const timer = window.setTimeout(() => {
      track('roi_calculated', {
        items_per_day: itemsPerDay,
        days_per_week: daysPerWeek,
        items_per_month: Math.round(itemsPerMonth),
        estimated_monthly_waste: totalMonthly,
        recommended_plan: plan.name,
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [itemsPerDay, daysPerWeek, itemsPerMonth, totalMonthly, plan.name]);

  return (
    <section id="roi" className="py-24 md:py-32 bg-obsidian border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_top_left,_rgba(198,242,78,0.05),_transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-16"
        >
          <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm mb-6">
            ROI Calculator
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            What is paper costing you?
          </h2>
          <p className="text-lg text-slate max-w-2xl">
            Every hunt for a misplaced stub, every "let me check with my colleague," every settled
            dispute — it adds up. Drag the sliders to see your number.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
        >
          {/* Inputs */}
          <div className="bg-steel/60 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-10 flex flex-col justify-center gap-10">
            <div>
              <div className="flex justify-between items-baseline mb-4">
                <label htmlFor="roi-items" className="text-white font-semibold">{itemLabel}</label>
                <span className="font-mono text-2xl font-bold text-lime">{itemsPerDay}</span>
              </div>
              <input
                id="roi-items"
                type="range"
                min={10}
                max={500}
                step={10}
                value={itemsPerDay}
                onChange={(e) => setItemsPerDay(Number(e.target.value))}
                className="w-full accent-[#C6F24E] cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate mt-2 font-mono">
                <span>10</span><span>500</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-4">
                <label htmlFor="roi-days" className="text-white font-semibold">Operating days per week</label>
                <span className="font-mono text-2xl font-bold text-lime">{daysPerWeek}</span>
              </div>
              <input
                id="roi-days"
                type="range"
                min={1}
                max={7}
                step={1}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full accent-[#C6F24E] cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate mt-2 font-mono">
                <span>1</span><span>7</span>
              </div>
            </div>

            <p className="text-xs text-slate/70 leading-relaxed">
              Estimate based on {MINUTES_SAVED_PER_ITEM} min saved per transaction at ${HOURLY_LABOR_COST}/hr
              blended labor, plus industry-average dispute rates on undocumented handoffs.
            </p>
          </div>

          {/* Output */}
          <div className="bg-lime rounded-3xl p-8 md:p-10 flex flex-col justify-center text-obsidian relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-obsidian/5 rounded-full" />
            <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-obsidian/5 rounded-full" />

            <div className="relative z-10">
              <p className="font-mono text-xs font-bold tracking-[0.2em] uppercase mb-4 opacity-70">
                Estimated monthly waste on paper
              </p>
              <div className="font-mono text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
                ${totalMonthly.toLocaleString()}
              </div>

              <div className="flex flex-col gap-3 mb-8 text-sm font-medium">
                <div className="flex justify-between border-b border-obsidian/10 pb-2">
                  <span className="opacity-70">Staff hours lost / month</span>
                  <span className="font-mono font-bold">{hoursSaved} hrs</span>
                </div>
                <div className="flex justify-between border-b border-obsidian/10 pb-2">
                  <span className="opacity-70">Labor cost of searching</span>
                  <span className="font-mono font-bold">${Math.round(laborSavings).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-obsidian/10 pb-2">
                  <span className="opacity-70">Dispute &amp; loss exposure</span>
                  <span className="font-mono font-bold">${Math.round(disputeSavings).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Plan that fits this volume</span>
                  <span className="font-mono font-bold">{plan.name}</span>
                </div>
                <p className="text-xs opacity-60 -mt-1 text-right">{plan.line}</p>
              </div>

              <a
                href="https://app.claimtagx.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('cta_clicked', { action: 'start_free', location: 'roi_calculator', recommended_plan: plan.name, estimated_monthly_waste: totalMonthly })}
                className="inline-flex items-center justify-center gap-2 bg-obsidian text-lime px-8 py-4 rounded-xl font-bold text-lg hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 w-full sm:w-auto"
              >
                Stop paying the paper tax
                <ArrowRight className="w-5 h-5" />
              </a>
              <p className="text-xs mt-3 opacity-60 font-medium">
                Plans from $0/mo — less than one hour of recovered labor.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
