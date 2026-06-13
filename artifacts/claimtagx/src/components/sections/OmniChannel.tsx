import { motion } from 'framer-motion';
import { Bell, Bluetooth, Mail, MessageCircle, MessageSquare, Nfc, QrCode, WifiOff, Smartphone } from 'lucide-react';

const channels = [
  { icon: <QrCode className="w-4 h-4" />, label: 'QR Code' },
  { icon: <Nfc className="w-4 h-4" />, label: 'NFC' },
  { icon: <Bluetooth className="w-4 h-4" />, label: 'BLE' },
  { icon: <MessageSquare className="w-4 h-4" />, label: 'SMS' },
  { icon: <MessageCircle className="w-4 h-4" />, label: 'WhatsApp' },
  { icon: <Mail className="w-4 h-4" />, label: 'Email' },
  { icon: <Bell className="w-4 h-4" />, label: 'In-app push' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export default function OmniChannel() {
  return (
    <section id="channels" className="py-24 md:py-32 bg-[#080B12] border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-lime/20 to-transparent" />

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
              Works Everywhere
            </span>
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold text-white mb-4">
            No signal. No app.
            <span className="block text-shimmer mt-2">No problem.</span>
          </motion.h2>
          <motion.p variants={itemVariants} className="text-lg text-slate max-w-2xl">
            The two questions every operator asks — answered before you ask them.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"
        >
          {/* Offline — handler side */}
          <motion.div
            variants={itemVariants}
            className="bg-steel/60 border border-white/10 rounded-3xl p-8 md:p-10 relative overflow-hidden group hover:border-lime/30 transition-colors duration-300"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-lime/5 rounded-full blur-3xl" />
            <div className="w-14 h-14 bg-obsidian rounded-2xl flex items-center justify-center mb-6 border border-white/10">
              <WifiOff className="w-6 h-6 text-lime" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Three floors underground. Zero bars. Fully operational.
            </h3>
            <p className="text-slate leading-relaxed mb-4">
              Underground garages, basement cloakrooms, festival fields, steel-framed
              back-of-house — the places custody actually happens are the places Wi-Fi goes
              to die. ClaimTagX is offline-first by design.
            </p>
            <p className="text-white/90 leading-relaxed font-medium">
              Tickets still issue. Releases still verify. Everything syncs the second your
              team surfaces. Your operation never waits for a signal.
            </p>
          </motion.div>

          {/* No app — guest side */}
          <motion.div
            variants={itemVariants}
            className="bg-steel/60 border border-white/10 rounded-3xl p-8 md:p-10 relative overflow-hidden group hover:border-lime/30 transition-colors duration-300"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-lime/5 rounded-full blur-3xl" />
            <div className="w-14 h-14 bg-obsidian rounded-2xl flex items-center justify-center mb-6 border border-white/10">
              <Smartphone className="w-6 h-6 text-lime" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Your guest installs nothing. Ever.
            </h3>
            <p className="text-slate leading-relaxed mb-4">
              No download, no account, no "find it in the app store" moment at a busy podium.
              The ticket arrives wherever your guest already lives — a text, a WhatsApp
              message, an email — and opens in any browser on any phone.
            </p>
            <p className="text-white/90 leading-relaxed font-medium">
              The claim ticket can't be forgotten in a jacket pocket, because it isn't in
              one. It's in their messages.
            </p>
          </motion.div>
        </motion.div>

        {/* Channel strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-obsidian border border-white/10 rounded-2xl p-6 md:p-8"
        >
          <p className="text-center text-sm text-slate mb-5 font-medium">
            Issue and verify over every technology your operation — or your guests — prefer:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {channels.map((ch) => (
              <span
                key={ch.label}
                className="flex items-center gap-2 text-sm font-semibold text-white/85 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 hover:border-lime/40 hover:text-lime transition-all duration-200"
              >
                <span className="text-lime">{ch.icon}</span>
                {ch.label}
              </span>
            ))}
          </div>
          <p className="text-center text-xs text-slate/60 mt-5">
            QR is just the start. Pick the channels that fit each station — switch anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
