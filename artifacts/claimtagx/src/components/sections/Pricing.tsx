import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    name: "STARTER",
    price: "$79",
    period: "/month",
    description: "Perfect for single locations needing to digitize their operations.",
    features: [
      "1 location",
      "Up to 5 handlers",
      "Unlimited tickets",
      "Handler mobile app",
      "GM dashboard",
      "Photo + plate capture",
      "Email support"
    ],
    cta: "Start free trial",
    url: "https://app.claimtagx.com/signup",
    primary: false
  },
  {
    name: "PRO",
    price: "$199",
    period: "/month",
    description: "For growing operations requiring more locations and advanced features.",
    features: [
      "Up to 5 locations",
      "Up to 25 handlers",
      "Unlimited tickets",
      "Everything in Starter",
      "Priority support",
      "API access",
      "Custom branding",
      "Advanced analytics"
    ],
    cta: "Start free trial",
    url: "https://app.claimtagx.com/signup",
    primary: true,
    badge: "MOST POPULAR"
  },
  {
    name: "ENTERPRISE",
    price: "Custom",
    period: "",
    description: "For large scale operators with specific security and integration needs.",
    features: [
      "Unlimited locations",
      "Unlimited handlers",
      "Dedicated database",
      "SSO/SAML",
      "SLA guarantee",
      "Custom integrations",
      "Onboarding + training",
      "Dedicated account manager"
    ],
    cta: "Contact sales",
    url: "mailto:sales@claimtagx.com",
    primary: false
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-obsidian border-t border-white/5 relative overflow-hidden">
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
              Pricing
            </span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold text-white mb-6">
            Transparent pricing.<br className="hidden sm:block" /> No per-ticket fees.
          </motion.h2>

          <motion.p variants={itemVariants} className="text-lg text-slate max-w-2xl">
            Start free. Upgrade when your operation grows. Cancel anytime.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className={`relative flex flex-col rounded-2xl p-8 ${
                plan.primary 
                  ? 'bg-steel border-lime/30 shadow-[0_0_30px_rgba(198,242,78,0.05)] border-2' 
                  : 'bg-steel/50 border border-white/5'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lime text-obsidian px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                  {plan.badge}
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="font-mono font-bold text-sm tracking-widest text-slate mb-4 uppercase">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-slate text-sm font-medium">{plan.period}</span>}
                </div>
                <p className="text-slate text-sm h-10">{plan.description}</p>
              </div>

              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-lime shrink-0" />
                      <span className="text-sm text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={plan.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full text-center py-3.5 rounded-lg font-bold text-sm transition-all duration-200 mt-auto ${
                  plan.primary
                    ? 'bg-lime text-obsidian hover:bg-lime-hover hover:-translate-y-px hover:shadow-[0_0_20px_rgba(198,242,78,0.3)]'
                    : 'border border-white/15 text-white hover:border-lime/50 hover:text-lime'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
