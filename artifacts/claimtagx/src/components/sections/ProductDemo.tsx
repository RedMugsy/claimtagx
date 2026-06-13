import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, ScanLine, Smartphone, QrCode } from 'lucide-react';
import howItWorks1 from '@/assets/how-it-works-1.png';
import howItWorks2 from '@/assets/how-it-works-2.png';
import howItWorks3 from '@/assets/how-it-works-3.png';
import demoTicketQr from '@/assets/demo-ticket-qr.svg';

const demoSteps = [
  {
    id: "scan",
    icon: <ScanLine className="w-5 h-5" />,
    title: "1. Intake",
    description: "Scan plate & issue digital ticket",
    image: howItWorks1
  },
  {
    id: "claim",
    icon: <Smartphone className="w-5 h-5" />,
    title: "2. Patron View",
    description: "QR ticket sent instantly via SMS",
    image: howItWorks2
  },
  {
    id: "release",
    icon: <QrCode className="w-5 h-5" />,
    title: "3. Release",
    description: "Scan patron QR to verify & release",
    image: howItWorks3
  }
];

export default function ProductDemo() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how" className="py-24 bg-obsidian border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-lime opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm mb-6 inline-block">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Three taps. No paper.<br className="hidden sm:block" /> Full custody chain.
          </h2>
          <p className="text-lg text-slate max-w-xl mx-auto">
            Click through a real ticket's life — intake to release.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          
          {/* Controls */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            {demoSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  activeStep === index 
                    ? 'bg-steel border-lime/30 shadow-[0_0_20px_rgba(198,242,78,0.05)]' 
                    : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                }`}
              >
                {activeStep === index && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-lime" 
                  />
                )}
                <div className="flex items-center gap-4 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    activeStep === index ? 'bg-lime text-obsidian' : 'bg-steel text-slate'
                  }`}>
                    {step.icon}
                  </div>
                  <h3 className={`font-bold text-lg ${activeStep === index ? 'text-white' : 'text-slate'}`}>
                    {step.title}
                  </h3>
                  {activeStep > index && (
                    <CheckCircle className="w-5 h-5 text-lime ml-auto" />
                  )}
                </div>
                <p className={`text-sm ml-14 ${activeStep === index ? 'text-slate' : 'text-slate/60'}`}>
                  {step.description}
                </p>
              </button>
            ))}
          </div>

          {/* Visuals */}
          <div className="w-full lg:w-2/3 relative h-[600px] flex items-center justify-center">
            <div className="absolute inset-0 bg-steel rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeStep}
                  src={demoSteps[activeStep].image}
                  alt={demoSteps[activeStep].title}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover opacity-80"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent pointer-events-none" />
            </div>
            
            {/* Animated elements floating around */}
            <motion.div
              className="absolute -right-6 top-1/4 bg-obsidian border border-lime/30 text-lime px-4 py-2 rounded-lg text-sm font-mono shadow-[0_0_15px_rgba(198,242,78,0.2)] flex items-center gap-2 z-20"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
              Live Sync
            </motion.div>
          </div>
        </div>

        {/* Scan-to-try: experience the guest ticket on your own phone */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="mt-16 bg-steel/60 border border-lime/20 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8"
        >
          {/* QR for desktop visitors */}
          <div className="hidden md:block flex-shrink-0">
            <div className="bg-white p-3 rounded-2xl shadow-[0_0_30px_rgba(198,242,78,0.15)]">
              <img src={demoTicketQr} alt="Scan to open a sample guest ticket" className="w-36 h-36" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-3">
              Don't take our word for it — be the guest.
            </h3>
            <p className="text-slate leading-relaxed mb-2 hidden md:block">
              Scan this code with your phone's camera and a real sample ticket opens
              instantly. No app, no account — exactly what your guests will experience.
            </p>
            <p className="text-slate leading-relaxed mb-2 md:hidden">
              Open a real sample ticket on this phone right now. No app, no account —
              exactly what your guests will experience.
            </p>
          </div>

          {/* Tap-through for mobile visitors */}
          <Link
            href="/demo-ticket"
            className="md:hidden w-full bg-lime text-obsidian px-6 py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2"
          >
            Open the sample ticket
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/demo-ticket"
            className="hidden md:flex items-center gap-2 text-lime font-semibold hover:text-lime-hover transition-colors group flex-shrink-0"
          >
            Or open it here
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}