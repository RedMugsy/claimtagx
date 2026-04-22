import { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';

type Tier = 'free' | 'basic' | 'essential' | 'advanced' | 'enterprise';

const plans: {
  key: Tier;
  name: string;
  pricing: { monthly: string; annual: string };
  originalAnnualPrice?: string;
  discountLabel?: string;
  period: string;
  description: string;
  highlights: string[];
  cta: string;
  url: string;
  primary?: boolean;
  badge?: string;
}[] = [
  {
    key: 'free',
    name: 'FREE',
    pricing: { monthly: '$0', annual: '$0' },
    period: '/month',
    description: 'Try the platform with a single station.',
    highlights: ['1 station', '1 staff member', '15 tickets / month', 'Text-only tickets', 'Cloud only'],
    cta: 'Start free',
    url: 'https://app.claimtagx.com/signup',
  },
  {
    key: 'basic',
    name: 'BASIC',
    pricing: { monthly: '$30', annual: '$25' },
    period: '/month',
    description: 'For small operators getting started with digital tags.',
    highlights: ['1 station', 'Up to 5 staff', '250 tickets / month', 'OOTB ticket template', 'Static QR + optional PIN', 'Logo branding'],
    cta: 'Start free trial',
    url: 'https://app.claimtagx.com/signup',
  },
  {
    key: 'essential',
    name: 'ESSENTIAL',
    pricing: { monthly: '$65', annual: '$50' },
    period: '/month',
    description: 'For growing operations needing workflow and validation.',
    highlights: ['Up to 5 stations', 'Up to 25 staff', '1,000 tickets / month', 'Configurable tickets', 'Dynamic QR + OTP', 'Shift management', 'Marketplace access (buy)'],
    cta: 'Start free trial',
    url: 'https://app.claimtagx.com/signup',
    primary: true,
    badge: 'MOST POPULAR',
  },
  {
    key: 'advanced',
    name: 'ADVANCED',
    pricing: { monthly: '$120', annual: '$80' },
    originalAnnualPrice: '$100',
    discountLabel: '20% OFF',
    period: '/month',
    description: 'For multi-station operators needing full control.',
    highlights: ['Unlimited stations', 'Unlimited staff', '2,000 tickets / month', 'Multi-template per station', 'NFC / BLE validation', 'Supervisor controls', 'Marketplace buy + sell', 'Limited API access'],
    cta: 'Start free trial',
    url: 'https://app.claimtagx.com/signup',
  },
  {
    key: 'enterprise',
    name: 'ENTERPRISE',
    pricing: { monthly: 'Custom', annual: 'Custom' },
    period: '',
    description: 'For large operators with security and sovereignty needs.',
    highlights: ['Unlimited stations', 'Unlimited staff', 'Unlimited tickets', 'Fully customizable tickets', 'Biometric validation', 'White label', 'Cloud or on-prem', 'Multi-region / sovereign'],
    cta: 'Contact sales',
    url: 'mailto:sales@claimtagx.com',
  },
];

type Cell = boolean | string;
type Row = { feature: string; values: Record<Tier, Cell> };
type Group = { category: string; rows: Row[] };

const matrix: Group[] = [
  {
    category: 'Capacity',
    rows: [
      { feature: 'Stations', values: { free: '1', basic: '1', essential: '5', advanced: 'Unlimited', enterprise: 'Unlimited' } },
      { feature: 'Staff', values: { free: '1', basic: '5', essential: '25', advanced: 'Unlimited', enterprise: 'Unlimited' } },
      { feature: 'Tickets / month', values: { free: '15', basic: '250', essential: '1,000', advanced: '2,000', enterprise: 'Unlimited' } },
      { feature: 'Ticket type', values: { free: 'Text only', basic: 'OOTB template', essential: 'Configurable (shared)', advanced: 'Multi-template per station', enterprise: 'Fully customizable' } },
    ],
  },
  {
    category: 'Core & workflow',
    rows: [
      { feature: 'Full lifecycle states', values: { free: false, basic: true, essential: true, advanced: true, enterprise: true } },
      { feature: 'Multi-asset support', values: { free: false, basic: 'Limited', essential: true, advanced: true, enterprise: true } },
      { feature: 'Workflow engine', values: { free: false, basic: false, essential: 'Basic', advanced: 'Advanced', enterprise: 'Full' } },
      { feature: 'Per-station configuration', values: { free: false, basic: false, essential: false, advanced: true, enterprise: true } },
    ],
  },
  {
    category: 'Workforce',
    rows: [
      { feature: 'Staff accounts', values: { free: '1 only', basic: 'Basic', essential: 'Full', advanced: 'Full', enterprise: 'Full' } },
      { feature: 'Shift management', values: { free: false, basic: false, essential: 'Basic', advanced: 'Advanced', enterprise: 'Full' } },
      { feature: 'Handler assignment', values: { free: false, basic: 'Manual', essential: 'Rotation / first available', advanced: 'Full (SLA + supervisor)', enterprise: 'Full' } },
      { feature: 'Task management', values: { free: false, basic: false, essential: 'Basic', advanced: 'Advanced', enterprise: 'Full' } },
      { feature: 'Supervisor controls', values: { free: false, basic: false, essential: false, advanced: true, enterprise: true } },
    ],
  },
  {
    category: 'Custody & CSR',
    rows: [
      { feature: 'CSR (unstructured)', values: { free: false, basic: 'Optional', essential: true, advanced: true, enterprise: true } },
      { feature: 'CSR (structured)', values: { free: false, basic: false, essential: true, advanced: true, enterprise: true } },
      { feature: 'Capacity tracking', values: { free: false, basic: false, essential: true, advanced: true, enterprise: true } },
      { feature: 'Multi-layer custody', values: { free: false, basic: false, essential: false, advanced: true, enterprise: true } },
      { feature: 'Cross-station transfers', values: { free: false, basic: false, essential: false, advanced: true, enterprise: true } },
    ],
  },
  {
    category: 'Validation & security',
    rows: [
      { feature: 'Static QR', values: { free: false, basic: true, essential: true, advanced: true, enterprise: true } },
      { feature: 'Dynamic QR', values: { free: false, basic: false, essential: true, advanced: true, enterprise: true } },
      { feature: 'PIN', values: { free: false, basic: 'Optional', essential: true, advanced: true, enterprise: true } },
      { feature: 'OTP', values: { free: false, basic: false, essential: true, advanced: true, enterprise: true } },
      { feature: 'NFC / BLE', values: { free: false, basic: false, essential: false, advanced: true, enterprise: true } },
      { feature: 'Biometric', values: { free: false, basic: false, essential: false, advanced: false, enterprise: true } },
      { feature: 'Validation rules engine', values: { free: false, basic: false, essential: 'Basic', advanced: 'Advanced', enterprise: 'Full' } },
    ],
  },
  {
    category: 'Control layer',
    rows: [
      { feature: 'Validation logs', values: { free: false, basic: false, essential: 'Basic', advanced: 'Full', enterprise: 'Full' } },
      { feature: 'Dispute management', values: { free: false, basic: false, essential: 'Basic (log only)', advanced: 'Full workflow', enterprise: 'Full' } },
      { feature: 'Internal notes (text)', values: { free: false, basic: false, essential: true, advanced: true, enterprise: true } },
      { feature: 'Internal notes (voice)', values: { free: false, basic: false, essential: false, advanced: true, enterprise: true } },
      { feature: 'Audit logs', values: { free: false, basic: false, essential: 'Basic', advanced: 'Full', enterprise: 'Full' } },
    ],
  },
  {
    category: 'Communication',
    rows: [
      { feature: 'Notifications', values: { free: false, basic: 'Basic', essential: 'Full', advanced: 'Advanced', enterprise: 'Full' } },
      { feature: 'Patron ↔ operator messaging', values: { free: false, basic: false, essential: true, advanced: true, enterprise: true } },
      { feature: 'Internal messaging', values: { free: false, basic: false, essential: 'Limited', advanced: 'Full', enterprise: 'Full' } },
      { feature: 'Intercom (staff comms)', values: { free: false, basic: false, essential: false, advanced: true, enterprise: true } },
    ],
  },
  {
    category: 'Revenue',
    rows: [
      { feature: 'Paid services', values: { free: false, basic: 'Basic', essential: 'Tiered', advanced: 'Advanced', enterprise: 'Full' } },
      { feature: 'Service pricing logic', values: { free: false, basic: 'Flat', essential: 'Tiered', advanced: 'Advanced', enterprise: 'Advanced' } },
      { feature: 'Ancillary services', values: { free: false, basic: false, essential: 'Limited', advanced: true, enterprise: true } },
      { feature: 'Invoice generation', values: { free: false, basic: 'Basic', essential: 'Full', advanced: 'Full', enterprise: 'Full' } },
    ],
  },
  {
    category: 'Marketplace',
    rows: [
      { feature: 'Marketplace access (buy)', values: { free: false, basic: false, essential: true, advanced: true, enterprise: true } },
      { feature: 'Marketplace access (sell)', values: { free: false, basic: false, essential: false, advanced: true, enterprise: true } },
      { feature: 'Ticket market participation', values: { free: false, basic: false, essential: false, advanced: true, enterprise: true } },
      { feature: 'Free template credit', values: { free: false, basic: false, essential: false, advanced: '1 included', enterprise: 'Custom' } },
    ],
  },
  {
    category: 'AI layer',
    rows: [
      { feature: 'AI suggestions', values: { free: false, basic: false, essential: 'Basic', advanced: 'Advanced', enterprise: 'Full' } },
      { feature: 'Operational insights', values: { free: false, basic: false, essential: 'Basic', advanced: 'Advanced', enterprise: 'Predictive' } },
      { feature: 'Dispute assistance', values: { free: false, basic: false, essential: false, advanced: true, enterprise: true } },
      { feature: 'Predictive optimization', values: { free: false, basic: false, essential: false, advanced: false, enterprise: true } },
    ],
  },
  {
    category: 'Branding & white label',
    rows: [
      { feature: 'Logo branding', values: { free: false, basic: true, essential: true, advanced: true, enterprise: true } },
      { feature: 'Template customization', values: { free: false, basic: false, essential: 'Limited', advanced: 'Full', enterprise: 'Full' } },
      { feature: 'Per-station branding', values: { free: false, basic: false, essential: false, advanced: true, enterprise: true } },
      { feature: 'White label', values: { free: false, basic: false, essential: false, advanced: 'Partial', enterprise: 'Full' } },
    ],
  },
  {
    category: 'Integrations & deployment',
    rows: [
      { feature: 'API access', values: { free: false, basic: false, essential: false, advanced: 'Limited', enterprise: 'Full' } },
      { feature: 'Third-party integrations', values: { free: false, basic: false, essential: 'Limited', advanced: 'Advanced', enterprise: 'Full' } },
      { feature: 'Deployment options', values: { free: 'Cloud only', basic: 'Cloud', essential: 'Cloud', advanced: 'Cloud', enterprise: 'Cloud / on-prem' } },
      { feature: 'Multi-region / sovereign', values: { free: false, basic: false, essential: false, advanced: false, enterprise: true } },
    ],
  },
];

const tierOrder: Tier[] = ['free', 'basic', 'essential', 'advanced', 'enterprise'];
const tierLabels: Record<Tier, string> = {
  free: 'Free',
  basic: 'Basic',
  essential: 'Essential',
  advanced: 'Advanced',
  enterprise: 'Enterprise',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

function CellContent({ value, highlighted }: { value: Cell; highlighted?: boolean }) {
  if (value === true) {
    return <Check className={`w-4 h-4 mx-auto ${highlighted ? 'text-lime' : 'text-lime/80'}`} />;
  }
  if (value === false) {
    return <Minus className="w-4 h-4 mx-auto text-white/20" />;
  }
  return <span className={`text-xs ${highlighted ? 'text-white' : 'text-white/80'}`}>{value}</span>;
}

export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const isAnnual = billing === 'annual';

  return (
    <section id="pricing" className="py-24 md:py-32 bg-obsidian border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_rgba(198,242,78,0.03),_transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="flex flex-col items-center text-center mb-20"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm">
              Pricing
            </span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold text-white mb-6">
            Five tiers.<br className="hidden sm:block" /> Built to scale with your operation.
          </motion.h2>

          <motion.p variants={itemVariants} className="text-lg text-slate max-w-2xl">
            Start free. Upgrade when you outgrow it. No per-ticket fees, no surprises.
          </motion.p>

          {/* Billing toggle */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 mt-10">
            <span className={`text-sm font-medium transition-colors ${billing === 'monthly' ? 'text-white' : 'text-slate'}`}>Monthly</span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
              aria-label="Toggle billing period"
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime ${
                billing === 'annual' ? 'bg-lime' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute left-1 top-1 w-5 h-5 rounded-full transition-transform duration-300 ${
                  billing === 'annual' ? 'translate-x-7 bg-obsidian' : 'translate-x-0 bg-obsidian'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${billing === 'annual' ? 'text-white' : 'text-slate'}`}>
              Annual <span className="text-lime text-xs font-bold ml-1">Save up to 23%</span>
            </span>
          </motion.div>
        </motion.div>

        {/* Tier cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-24"
        >
          {plans.map((plan) => {
            const isMostPopular = isAnnual ? plan.key === 'advanced' : plan.key === 'essential';

            return (
            <motion.div
              key={plan.key}
              variants={itemVariants}
              whileHover={{ y: -6 }}
              className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 ${
                isMostPopular
                  ? 'bg-steel border-2 border-lime/50 shadow-[0_0_30px_rgba(198,242,78,0.15)] animate-pulse-glow lg:scale-[1.04] z-10'
                  : 'bg-steel/50 border border-white/10 hover:border-lime/30 hover:shadow-xl'
              }`}
            >
              {isMostPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lime text-obsidian px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase shadow-lg whitespace-nowrap">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-6 mt-1">
                <h3 className={`font-mono font-bold text-xs tracking-widest uppercase mb-3 ${isMostPopular ? 'text-lime' : 'text-slate'}`}>
                  {plan.name}
                </h3>
                {plan.discountLabel && billing === 'annual' && (
                  <div className="inline-flex items-center gap-1 bg-lime/20 text-lime px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide mb-2">
                    ⚡ LIMITED TIME · {plan.discountLabel}
                  </div>
                )}
                <div className="flex items-baseline gap-1 mb-3">
                  {plan.discountLabel && billing === 'annual' && plan.originalAnnualPrice && (
                    <span className="text-slate/60 line-through text-xl font-bold mr-1">{plan.originalAnnualPrice}</span>
                  )}
                  <span className="text-4xl font-extrabold text-white tracking-tight">{plan.pricing[billing]}</span>
                  {plan.period && <span className="text-slate text-sm font-medium">{plan.period}</span>}
                </div>
                <p className="text-slate text-xs leading-relaxed min-h-[3rem]">{plan.description}</p>
              </div>

              <div className="flex-1">
                <ul className="space-y-3 mb-8">
                  {plan.highlights.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isMostPopular ? 'text-lime' : 'text-lime/70'}`} />
                      <span className="text-xs text-white/85 font-medium leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={plan.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full text-center py-3 rounded-xl font-bold text-sm transition-all duration-300 mt-auto ${
                  isMostPopular
                    ? 'bg-lime text-obsidian hover:bg-lime-hover hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(198,242,78,0.4)]'
                    : 'bg-white/5 border border-white/10 text-white hover:border-lime/50 hover:text-lime hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
            );
          })}
        </motion.div>

        {/* Full feature matrix */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mt-12"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Full feature matrix</h3>
            <p className="text-slate text-sm">Compare every capability across all five tiers.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-steel/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead className="sticky top-0 bg-[#0E1320] z-10">
                  <tr className="border-b border-white/10">
                    <th className="py-4 px-5 text-xs font-mono font-bold uppercase tracking-widest text-slate w-[28%]">Feature</th>
                    {tierOrder.map((t) => (
                      <th
                        key={t}
                        className={`py-4 px-3 text-center text-xs font-mono font-bold uppercase tracking-widest ${
                          t === 'essential' ? 'text-lime bg-lime/5' : 'text-slate'
                        }`}
                      >
                        {tierLabels[t]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((group) => (
                    <Fragment key={group.category}>
                      <tr className="bg-white/[0.02]">
                        <td colSpan={6} className="py-3 px-5 text-[11px] font-mono font-bold uppercase tracking-widest text-lime/80">
                          {group.category}
                        </td>
                      </tr>
                      {group.rows.map((row, rIdx) => (
                        <tr
                          key={`${group.category}-${row.feature}`}
                          className={`border-t border-white/5 ${rIdx % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
                        >
                          <td className="py-3 px-5 text-sm text-white/90 font-medium">{row.feature}</td>
                          {tierOrder.map((t) => (
                            <td
                              key={t}
                              className={`py-3 px-3 text-center align-middle ${t === 'essential' ? 'bg-lime/5' : ''}`}
                            >
                              <CellContent value={row.values[t]} highlighted={t === 'essential'} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-10">
            <p className="text-slate text-sm mb-5">Need something custom? Talk to us.</p>
            <a
              href="mailto:sales@claimtagx.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:border-lime/50 hover:text-lime hover:bg-white/10 font-bold text-sm transition-all duration-300"
            >
              Contact sales
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
