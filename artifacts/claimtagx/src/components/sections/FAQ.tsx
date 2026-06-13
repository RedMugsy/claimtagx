import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Do my guests need to download an app?',
    a: 'No. Guests receive their claim ticket as a link — by text, WhatsApp, or email — and present it from their phone’s browser. It works on any smartphone, with nothing to install and no account to create. Stations can also verify with NFC, BLE, or in-app push where that fits the operation.',
  },
  {
    q: 'What happens if the venue has no signal or Wi-Fi drops?',
    a: 'ClaimTagX is offline-first. Handlers can issue and release tickets with zero connectivity — everything syncs automatically the moment the connection returns. Underground garages and basement cloakrooms are exactly what it was built for.',
  },
  {
    q: 'How long does setup actually take?',
    a: 'About 60 seconds. There is no hardware to install and nothing to wire up: sign up, add your handlers, and start issuing digital tickets from any phone. Most operators run their first real ticket within minutes of signing up.',
  },
  {
    q: 'What if a guest loses their digital ticket?',
    a: 'Unlike a paper stub, a digital ticket can’t really be lost — it lives in the guest’s messages. If they delete it, staff can re-send it or verify identity against the photo and details captured at intake, with every action logged in the audit trail.',
  },
  {
    q: 'Can tickets be forged or screenshotted by someone else?',
    a: 'Every ticket carries a cryptographic signature that is mathematically impossible to forge. Higher tiers add dynamic QR codes and one-time PINs, so a stale screenshot won’t validate at release.',
  },
  {
    q: 'How does this help with damage claims and disputes?',
    a: 'Photos are captured at intake and every handoff is timestamped and logged. When someone claims a scratch or a missing garment, you have exportable, insurance-ready evidence of the item’s condition and chain of custody — instead of settling because you can’t prove anything.',
  },
  {
    q: 'How much does it cost?',
    a: 'About the same per ticket as the paper you’re buying now — roughly a nickel. The Essential plan is $50/month with 1,000 tickets included (5¢ each), with no printing, reorders, or hardware on top. There’s also a free-forever plan for single stations, and every paid plan includes a 14-day free trial with no credit card required.',
  },
];

export default function FAQ() {
  // Inject FAQPage structured data for search engines
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <section id="faq" className="py-24 md:py-32 bg-obsidian border-t border-white/5 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-12"
        >
          <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm mb-6">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Questions operators ask
          </h2>
          <p className="text-lg text-slate">
            Something else on your mind?{' '}
            <a href="mailto:sales@claimtagx.com" className="text-lime hover:text-lime-hover transition-colors font-medium">
              Talk to sales
            </a>{' '}
            — a human answers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-steel/40 border border-white/10 rounded-2xl px-6 data-[state=open]:border-lime/30 transition-colors duration-300"
              >
                <AccordionTrigger className="text-left text-white font-semibold hover:no-underline hover:text-lime transition-colors py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
