import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';
import { track } from '@/lib/analytics';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    perTicket: 'Run it on real shifts. Pay nothing.',
    description: 'Try the platform with a single station. Free forever.',
    highlights: ['1 station, 1 staff member', '15 tickets / month', 'Cloud-hosted'],
    cta: 'Start free',
    url: 'https://app.claimtagx.com/signup',
    external: true,
  },
  {
    name: 'Essential',
    price: '$50',
    period: '/month, billed annually',
    perTicket: '≈ 5¢ per ticket — what paper costs you now',
    description: 'For growing operations needing workflow and validation.',
    highlights: ['Up to 5 stations, 25 staff', '1,000 tickets / month', 'Dynamic QR + OTP, shift management'],
    cta: 'Start free',
    url: 'https://app.claimtagx.com/signup',
    external: true,
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    perTicket: 'Volume per-ticket pricing at scale',
    description: 'White label, on-prem or sovereign cloud, biometric validation.',
    highlights: ['Unlimited everything', 'Cloud or on-prem', 'Multi-region / sovereign'],
    cta: 'Talk to sales',
    url: 'mailto:sales@claimtagx.com',
    external: true,
  },
];

export default function PricingTeaser() {
  return (
    <section id="pricing" className="py-24 md:py-32 bg-[#080B12] border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(circle_at_top_right,_rgba(198,242,78,0.04),_transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-16"
        >
          <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm mb-6">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Start free. Scale when you do.
          </h2>
          <p className="text-lg text-slate max-w-2xl">
            No per-ticket fees. No hardware to buy. No setup charges. Five plans from solo
            stations to sovereign enterprise deployments.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-3xl p-8 flex flex-col border transition-all duration-300 relative ${
                tier.featured
                  ? 'bg-steel border-lime/40 shadow-[0_0_40px_rgba(198,242,78,0.1)] md:-translate-y-3'
                  : 'bg-steel/40 border-white/10 hover:border-white/20'
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lime text-obsidian text-xs font-bold font-mono tracking-wider px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-lg font-bold text-white mb-2 font-mono uppercase tracking-wider">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-extrabold text-white font-mono">{tier.price}</span>
                <span className="text-sm text-slate">{tier.period}</span>
              </div>
              <p className={`text-xs font-mono font-semibold mb-3 ${tier.featured ? 'text-lime' : 'text-slate/80'}`}>
                {tier.perTicket}
              </p>
              <p className="text-sm text-slate leading-relaxed mb-6">{tier.description}</p>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {tier.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-white/80">
                    <Check className="w-4 h-4 text-lime mt-0.5 flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
              <a
                href={tier.url}
                target={tier.url.startsWith('mailto:') ? undefined : '_blank'}
                rel={tier.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                onClick={() => track('cta_clicked', { action: tier.url.startsWith('mailto:') ? 'talk_to_sales' : 'start_free', location: 'pricing_teaser', plan: tier.name })}
                className={`text-center px-6 py-3.5 rounded-xl font-bold transition-all duration-200 ${
                  tier.featured
                    ? 'bg-lime text-obsidian hover:bg-lime-hover hover:shadow-[0_0_25px_rgba(198,242,78,0.35)]'
                    : 'border border-white/15 text-white hover:border-lime/40 hover:text-lime'
                }`}
              >
                {tier.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Link
            href="/price"
            onClick={() => track('cta_clicked', { action: 'see_full_pricing', location: 'pricing_teaser' })}
            className="inline-flex items-center gap-2 text-lime font-semibold hover:text-lime-hover transition-colors group"
          >
            Compare all five plans and features
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
