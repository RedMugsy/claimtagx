import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  ArrowRight,
  Database,
  FileCheck,
  FileText,
  Globe2,
  KeyRound,
  Lock,
  Server,
  ShieldCheck,
} from 'lucide-react';
import SEO from '@/components/SEO';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const pillars = [
  {
    icon: <KeyRound className="w-6 h-6 text-lime" />,
    title: 'Tamper-proof tickets',
    plain: 'Every ticket carries a cryptographic signature. A stale screenshot, a forged stub, or a tampered record fails verification — mathematically.',
    technical: 'Ed25519 digital signatures on every issued ticket. Signature is verified at release; mismatch blocks the release and writes a flagged event to the audit log.',
  },
  {
    icon: <Database className="w-6 h-6 text-lime" />,
    title: 'Your data, your instance',
    plain: 'One tenant cannot see another tenant — ever. Your tickets, photos, handlers, and audit trail live in a strictly isolated slice of the database.',
    technical: 'Multi-tenant isolation enforced at the database layer via row-level security on PostgreSQL. Every query is scoped to the tenant by policy, not by application logic.',
  },
  {
    icon: <FileCheck className="w-6 h-6 text-lime" />,
    title: 'Append-only audit trail',
    plain: 'Every intake, transfer, and release is logged with who, what, when, and where. Logs are write-once — they can never be edited or deleted from the application.',
    technical: 'Append-only event log per tenant. Each event is timestamped, attributed to a handler, and linked to the asset. Exportable for insurance review or regulator inquiry.',
  },
  {
    icon: <Lock className="w-6 h-6 text-lime" />,
    title: 'Encryption in transit and at rest',
    plain: 'Your data is encrypted whenever it moves over the network and whenever it sits on disk. No plaintext between your team and your records.',
    technical: 'TLS 1.2+ for all traffic; database and storage volumes encrypted at rest by the underlying infrastructure provider.',
  },
  {
    icon: <Server className="w-6 h-6 text-lime" />,
    title: 'Infrastructure agnostic',
    plain: 'Deploy ClaimTagX where it makes sense for your operation — our hosted public cloud for fastest time to value, your private cloud, or fully on-premise. The platform is the same; only the environment changes.',
    technical: 'Public cloud (managed), private cloud (BYOC, customer-owned), and on-premise deployment all supported. Containerized, infrastructure-agnostic architecture. Enterprise customers choose the model at onboarding.',
  },
  {
    icon: <Globe2 className="w-6 h-6 text-lime" />,
    title: 'Built for global data-protection laws',
    plain: 'Wherever you operate, your custody records need to live within the rules. ClaimTagX is built to support data-protection and privacy regimes across every region we serve — and to give regulated operators the controls they need to prove it.',
    technical: 'Designed to operate in alignment with data-protection and privacy frameworks across the United States, European Union, United Kingdom, GCC, Levant, broader Asia, Africa, and Australia. Data residency pinning and sovereign deployment available on Enterprise.',
  },
];

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy', desc: 'How we collect, use, and protect personal data.' },
  { href: '/terms', label: 'Terms of Service', desc: 'The agreement governing your use of ClaimTagX.' },
  { href: '/gdpr', label: 'GDPR Statement', desc: 'How we comply with EU data protection law.' },
  { href: '/dpa', label: 'Data Processing Addendum', desc: 'For enterprise customers and EU data controllers.' },
  { href: '/cookies', label: 'Cookie Policy', desc: 'Which cookies we use and why.' },
  { href: '/aup', label: 'Acceptable Use Policy', desc: 'What the platform may and may not be used for.' },
];

const certifications = [
  {
    label: 'Roadmap',
    title: 'SOC 2 Type II',
    body: 'In planning. Talk to sales for current readiness status and timeline.',
  },
  {
    label: 'Roadmap',
    title: 'ISO 27001',
    body: 'On the roadmap for enterprise deployments. Contact sales for the latest.',
  },
  {
    label: 'Available now',
    title: 'Custom DPA',
    body: 'Enterprise customers can request a Data Processing Addendum tailored to their environment.',
  },
];

export default function Security() {
  return (
    <>
      <SEO
        title="Security & Trust — ClaimTagX"
        description="How ClaimTagX protects your custody records: Ed25519-signed tickets, tenant data isolation, append-only audit trail, encryption in transit and at rest, GDPR/DPA posture, and sovereign deployment options for enterprise."
        url="https://claimtagx.com/security"
      />
      <div className="bg-obsidian w-full relative overflow-hidden pt-28 md:pt-36 pb-20">
        {/* Hero */}
        <section className="relative bg-gradient-mesh pb-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="text-center"
            >
              <motion.div variants={itemVariants} className="mb-6">
                <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm">
                  Security &amp; Trust
                </span>
              </motion.div>
              <motion.h1
                variants={itemVariants}
                className="font-extrabold tracking-tight leading-[1.1] text-white mb-6"
                style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
              >
                Built for the operations you{' '}
                <span className="text-shimmer">can't afford to lose.</span>
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-lg md:text-xl text-slate max-w-2xl mx-auto leading-relaxed mb-10"
              >
                Custody records are evidence. ClaimTagX protects yours with cryptographic
                ticket integrity, strict tenant isolation, and an audit trail your team —
                and your insurer — can rely on.
              </motion.p>
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="mailto:sales@claimtagx.com?subject=Security%20documentation%20request"
                  className="w-full sm:w-auto bg-lime text-obsidian px-7 py-3.5 rounded-lg font-bold hover:bg-lime-hover hover:shadow-[0_0_25px_rgba(198,242,78,0.35)] transition-all duration-200"
                >
                  Request security documentation
                </a>
                <a
                  href="#pillars"
                  className="w-full sm:w-auto border border-white/15 text-white px-7 py-3.5 rounded-lg font-bold hover:border-lime/40 hover:text-lime transition-all duration-200 group flex items-center justify-center gap-2"
                >
                  Read the details
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Pillars */}
        <section id="pillars" className="py-20 border-t border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {pillars.map((p) => (
                <motion.div
                  key={p.title}
                  variants={itemVariants}
                  className="bg-steel/40 border border-white/10 rounded-3xl p-7 md:p-8 hover:border-lime/30 transition-colors duration-300"
                >
                  <div className="w-12 h-12 bg-obsidian rounded-xl flex items-center justify-center mb-5 border border-white/10">
                    {p.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{p.title}</h3>
                  <p className="text-slate leading-relaxed mb-4">{p.plain}</p>
                  <p className="text-xs font-mono text-slate/70 leading-relaxed border-t border-white/5 pt-3">
                    {p.technical}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-20 border-t border-white/5 bg-[#080B12]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm mb-6 inline-block">
                Certifications &amp; Compliance
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Honest status on the standards your procurement team will ask about.
              </h2>
              <p className="text-slate max-w-2xl mx-auto">
                We tell you what's done, what's in progress, and what's on the roadmap —
                rather than pretending everything is ready.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {certifications.map((c) => (
                <div
                  key={c.title}
                  className="bg-steel/40 border border-white/10 rounded-2xl p-6"
                >
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-lime/80 bg-lime/10 border border-lime/20 rounded-full px-2.5 py-1 inline-block mb-4">
                    {c.label}
                  </span>
                  <h3 className="text-lg font-bold text-white mb-2">{c.title}</h3>
                  <p className="text-sm text-slate leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Legal documents */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center mb-12"
            >
              <FileText className="w-8 h-8 text-lime mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Legal &amp; policy documents
              </h2>
              <p className="text-slate max-w-2xl">
                The complete legal posture, available to anyone — no NDA required.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {legalLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="bg-steel/40 border border-white/10 rounded-2xl p-5 flex items-start justify-between gap-4 hover:border-lime/30 hover:bg-steel/60 transition-all duration-300 group"
                >
                  <div>
                    <h3 className="text-white font-bold mb-1 group-hover:text-lime transition-colors">{l.label}</h3>
                    <p className="text-sm text-slate leading-relaxed">{l.desc}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate group-hover:text-lime group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-20 border-t border-white/5 bg-[#080B12]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ShieldCheck className="w-10 h-10 text-lime mx-auto mb-5" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Reviewing ClaimTagX for an enterprise rollout?
            </h2>
            <p className="text-slate text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              We work with procurement and security teams directly. Architecture diagrams,
              data-flow maps, vendor security questionnaires, and custom DPAs available on
              request.
            </p>
            <a
              href="mailto:sales@claimtagx.com?subject=Enterprise%20security%20review"
              className="inline-flex items-center gap-2 bg-lime text-obsidian px-8 py-4 rounded-xl font-bold hover:bg-lime-hover hover:shadow-[0_0_30px_rgba(198,242,78,0.4)] transition-all duration-200"
            >
              Talk to our team
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
