import { useEffect } from 'react';
import { useParams } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SEO from '@/components/SEO';
import NotFound from '@/pages/not-found';
import ROICalculator from '@/components/sections/ROICalculator';
import PricePerTicket from '@/components/sections/PricePerTicket';
import FinalCTA from '@/components/sections/FinalCTA';
import StickyCTA from '@/components/StickyCTA';
import { getSolution, solutions } from '@/lib/solutions';
import { Link } from 'wouter';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export default function SolutionPage() {
  const params = useParams<{ slug: string }>();
  const solution = getSolution(params.slug ?? '');

  // BreadcrumbList structured data for rich search results
  useEffect(() => {
    if (!solution) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://claimtagx.com/' },
        { '@type': 'ListItem', position: 2, name: 'Solutions', item: 'https://claimtagx.com/#industries' },
        { '@type': 'ListItem', position: 3, name: solution.name, item: `https://claimtagx.com/solutions/${solution.slug}` },
      ],
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [solution]);

  if (!solution) {
    return <NotFound />;
  }

  return (
    <>
      <SEO
        title={solution.seoTitle}
        description={solution.seoDescription}
        url={`https://claimtagx.com/solutions/${solution.slug}`}
      />
      <div className="bg-obsidian w-full relative overflow-hidden">
        {/* Hero */}
        <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden bg-gradient-mesh">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col items-start text-left">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6"
                >
                  <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm">
                    ClaimTagX for {solution.name}
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="font-extrabold tracking-tight leading-[1.1] mb-6"
                  style={{ fontSize: 'clamp(36px, 4.5vw, 58px)' }}
                >
                  <span className="block text-white">{solution.headline[0]}</span>
                  <span className="block text-shimmer">{solution.headline[1]}</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg md:text-xl text-slate mb-10 leading-relaxed max-w-lg"
                >
                  {solution.subhead}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col sm:flex-row items-center gap-4 mb-5 w-full sm:w-auto"
                >
                  <a
                    href={solution.primaryCta?.url ?? 'https://app.claimtagx.com/signup'}
                    target={solution.primaryCta?.url.startsWith('mailto:') ? undefined : '_blank'}
                    rel={solution.primaryCta?.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                    className="w-full sm:w-auto bg-lime text-obsidian px-8 py-4 rounded-lg font-bold text-lg hover:bg-lime-hover hover:-translate-y-px hover:shadow-[0_0_30px_rgba(198,242,78,0.4)] transition-all duration-200 text-center"
                  >
                    {solution.primaryCta?.label ?? 'Start free — no card needed'}
                  </a>
                  <a
                    href="https://calendly.com/claimtagx/demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto border border-white/15 text-white px-8 py-4 rounded-lg font-bold text-lg hover:border-lime/40 hover:text-lime transition-all duration-200 group flex items-center justify-center gap-2"
                  >
                    Book a demo
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-sm text-slate/80 mb-6"
                >
                  Free plan forever · No credit card · Live in 60 seconds
                </motion.p>

                {/* Channels for this vertical */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {solution.channels.map((ch) => (
                      <span
                        key={ch}
                        className="text-xs font-mono font-semibold text-white/70 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate/70">{solution.channelNote}</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl"
              >
                <img
                  src={solution.image}
                  alt={`${solution.name} with ClaimTagX`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent pointer-events-none" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pain points */}
        <section className="py-24 md:py-32 bg-[#080B12] border-t border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={containerVariants}
              className="flex flex-col items-center text-center mb-16"
            >
              <motion.div variants={itemVariants} className="mb-6">
                <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm">
                  The Problem
                </span>
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold text-white mb-4">
                What paper costs {solution.audience.split(',')[0]}
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {solution.pains.map((pain) => (
                <motion.div
                  key={pain.title}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="bg-steel/80 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:border-lime/30 transition-all duration-300 group shadow-lg"
                >
                  <div className="w-12 h-12 bg-obsidian rounded-xl flex items-center justify-center mb-5 border border-white/5 group-hover:bg-lime/10 transition-colors duration-300">
                    {pain.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{pain.title}</h3>
                  <p className="text-sm text-slate leading-relaxed">{pain.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it works (vertical-specific) */}
        <section className="py-24 md:py-32 bg-obsidian border-t border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={containerVariants}
              className="flex flex-col items-center text-center mb-16"
            >
              <motion.div variants={itemVariants} className="mb-6">
                <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm">
                  How It Works
                </span>
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold text-white">
                Three taps. No paper.
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {solution.steps.map((step) => (
                <motion.div
                  key={step.num}
                  variants={itemVariants}
                  className="bg-steel/60 border border-white/5 rounded-3xl p-8 hover:border-lime/30 transition-all duration-500 hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-full bg-lime text-obsidian flex items-center justify-center font-mono text-sm font-bold shadow-[0_0_15px_rgba(198,242,78,0.4)] mb-5">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Price parity */}
        <PricePerTicket />

        {/* ROI with vertical defaults */}
        <ROICalculator
          defaultItemsPerDay={solution.roi.itemsPerDay}
          defaultDaysPerWeek={solution.roi.daysPerWeek}
          itemLabel={solution.roi.itemLabel}
        />

        {/* Vertical FAQ */}
        <section className="py-24 bg-[#080B12] border-t border-white/5">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center mb-12"
            >
              <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm mb-6">
                FAQ
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {solution.name} questions
              </h2>
            </motion.div>

            <div className="flex flex-col gap-6">
              {solution.faqs.map((faq) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5 }}
                  className="bg-steel/40 border border-white/10 rounded-2xl p-6"
                >
                  <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                  <p className="text-slate leading-relaxed text-sm">{faq.a}</p>
                </motion.div>
              ))}
            </div>

            {/* Cross-links to other verticals */}
            <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <p className="text-sm text-slate mb-4">ClaimTagX also works for:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {solutions
                  .filter((s) => s.slug !== solution.slug)
                  .map((s) => (
                    <Link
                      key={s.slug}
                      href={`/solutions/${s.slug}`}
                      className="text-sm font-medium text-white/70 bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:border-lime/40 hover:text-lime transition-all"
                    >
                      {s.name}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </section>

        <FinalCTA />
        <StickyCTA />
      </div>
    </>
  );
}
