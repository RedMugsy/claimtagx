import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Camera, Check, Send, ShieldCheck } from 'lucide-react';
import demoTicketQr from '@/assets/demo-ticket-qr.svg';

// Interactive multi-state demo: a real simulation of the handler flow,
// not three static images.
//
//   Camera (state 0)     → Snap photo → flash → OCR spinner → state 1
//   Ticket (state 1)     → Send to patron → state 2
//   Scanner (state 2)    → Scan → success flash → reset to state 0
//
// Prospects *feel* the loop instead of reading about it. The state
// transitions plus microcopy ("Detecting plate…", "Audit log updated")
// carry the proof that the static slides never did.

type DemoState = 'camera' | 'ticket' | 'scanner';
type Status = 'idle' | 'flash' | 'detecting' | 'success';

const STATES: { id: DemoState; num: string; title: string }[] = [
  { id: 'camera', num: '01', title: 'Intake' },
  { id: 'ticket', num: '02', title: 'Issued' },
  { id: 'scanner', num: '03', title: 'Release' },
];

export default function ProductDemo() {
  const [state, setState] = useState<DemoState>('camera');
  const [status, setStatus] = useState<Status>('idle');
  const timeoutsRef = useRef<number[]>([]);

  // Auto-loop kicker — if the user just lands on the section and doesn't
  // touch it, gently start the camera after a short beat so they see
  // motion. Then stay quiet.
  useEffect(() => {
    return () => {
      // Clean up any pending timers when component unmounts or state
      // changes mid-flight.
      timeoutsRef.current.forEach((t) => window.clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, []);

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  };

  const handleSnap = () => {
    if (status !== 'idle') return;
    setStatus('flash');
    schedule(() => setStatus('detecting'), 300);
    schedule(() => {
      setStatus('idle');
      setState('ticket');
    }, 1800);
  };

  const handleSend = () => {
    setState('scanner');
  };

  const handleScan = () => {
    if (status !== 'idle') return;
    setStatus('success');
    schedule(() => {
      setStatus('idle');
      setState('camera');
    }, 2400);
  };

  const stateIndex = STATES.findIndex((s) => s.id === state);

  return (
    <section id="how" className="py-24 md:py-32 bg-obsidian border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-lime opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase bg-lime/10 px-3 py-1 rounded-sm mb-6 inline-block">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Three taps. No paper.<br className="hidden sm:block" /> Full custody chain.
          </h2>
          <p className="text-lg text-slate max-w-xl mx-auto">
            Press the buttons. Watch the ticket move through its life.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-3 md:gap-6 mb-10">
          {STATES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                setStatus('idle');
                setState(s.id);
              }}
              className={`group flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                i === stateIndex
                  ? 'bg-lime/10 border-lime/40 text-white'
                  : i < stateIndex
                  ? 'border-white/10 text-slate hover:border-white/20'
                  : 'border-white/5 text-slate/60 hover:border-white/15'
              }`}
            >
              <span
                className={`font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                  i === stateIndex
                    ? 'bg-lime text-obsidian'
                    : i < stateIndex
                    ? 'bg-lime/20 text-lime'
                    : 'bg-white/5 text-slate/70'
                }`}
              >
                {i < stateIndex ? <Check className="w-3 h-3" /> : s.num}
              </span>
              <span className="text-sm font-semibold">{s.title}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-8 lg:gap-12">
          {/* Left context panel — keeps content next to the phone, fills empty space */}
          <ContextPanel state={state} />

          {/* The phone */}
          <PhoneFrame>
            <PhoneStatus />
            {/* No AnimatePresence wrapper here — each state has its own
                internal motion animations, and a parent mode="wait" + nested
                AnimatePresences caused exits to hang. State swaps are instant
                which matches how a real handler app behaves anyway. */}
            <div key={state} className="flex-1 flex flex-col">
              {state === 'camera' && (
                <CameraState status={status} onSnap={handleSnap} />
              )}
              {state === 'ticket' && <TicketState onSend={handleSend} />}
              {state === 'scanner' && (
                <ScannerState status={status} onScan={handleScan} />
              )}
            </div>
          </PhoneFrame>

          {/* Right metadata panel */}
          <MetadataPanel state={state} status={status} />
        </div>

        {/* Scan-to-try: experience the guest ticket on your own phone */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="mt-20 bg-steel/60 border border-lime/20 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8"
        >
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
              Point your camera at the QR. A real sample ticket opens on your phone — no app,
              no account, exactly what your guests will experience.
            </p>
            <p className="text-slate leading-relaxed mb-2 md:hidden">
              Open a real sample ticket on this phone. No app, no account — exactly what your guests will experience.
            </p>
          </div>

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

// ============================================================================
// Phone shell
// ============================================================================

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto">
      <div className="relative w-[280px] h-[570px] bg-black rounded-[40px] border-[10px] border-[#1a1a1a] overflow-hidden shadow-[0_25px_60px_-10px_rgba(0,0,0,0.9),0_0_40px_rgba(198,242,78,0.1)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-7 bg-[#1a1a1a] rounded-b-2xl z-20" />
        <div className="w-full h-full bg-obsidian relative overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

function PhoneStatus() {
  return (
    <div className="flex justify-between items-center px-5 pt-2 text-[11px] font-semibold text-white/90">
      <span>9:41</span>
      <span className="tracking-tight">●●●●●</span>
    </div>
  );
}

// ============================================================================
// State: Camera
// ============================================================================

function CameraState({ status, onSnap }: { status: Status; onSnap: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col p-4 pt-6"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="text-sm text-slate">←</span>
        <h4 className="text-sm font-bold text-white">New Ticket</h4>
        <span className="text-sm text-slate">☰</span>
      </div>

      <div className="relative flex-1 bg-[#0a0d14] rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
        {/* OCR viewfinder */}
        <div className="relative w-[180px] h-[110px]">
          <div className="absolute inset-0 border-2 border-lime/40 rounded-lg" />
          {/* corner brackets */}
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
            <span
              key={c}
              className={`absolute w-4 h-4 border-lime ${
                c === 'tl' ? 'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg' :
                c === 'tr' ? 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg' :
                c === 'bl' ? 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg' :
                'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg'
              }`}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-lime font-bold text-2xl tracking-widest">ABC 123</span>
          </div>
          {/* scan line */}
          <motion.div
            className="absolute left-0 right-0 h-px bg-lime shadow-[0_0_8px_2px_rgba(198,242,78,0.6)]"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <p className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-slate">
          Position license plate in frame
        </p>

        {/* flash */}
        <AnimatePresence>
          {status === 'flash' && (
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={onSnap}
        disabled={status !== 'idle'}
        className="mt-4 bg-lime text-obsidian font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
      >
        <Camera className="w-4 h-4" />
        Snap Photo
      </button>

      <AnimatePresence>
        {status === 'detecting' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-obsidian/90 backdrop-blur border border-lime/30 rounded-full px-4 py-2 flex items-center gap-2 text-xs text-white"
          >
            <span className="w-3 h-3 rounded-full border-2 border-lime border-t-transparent animate-spin" />
            Detecting plate…
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// State: Ticket
// ============================================================================

function TicketState({ onSend }: { onSend: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex-1 flex flex-col p-4 pt-6"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="text-sm text-slate">←</span>
        <h4 className="text-sm font-bold text-white">Ticket Created</h4>
        <span className="text-sm text-slate">☰</span>
      </div>

      <div className="flex-1 bg-[#0a0d14] rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center">
        <p className="font-mono text-[10px] text-lime tracking-[0.2em] mb-1">TICKET #4839</p>
        <p className="font-mono text-2xl font-bold text-white tracking-wider mb-4">ABC 123</p>
        <div className="bg-white p-2 rounded-xl mb-4">
          <img src={demoTicketQr} alt="" className="w-[120px] h-[120px]" />
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-slate">
            <ShieldCheck className="w-3 h-3 text-lime" />
            Ed25519 Signed
          </span>
          <span className="flex items-center gap-1.5 text-lime">
            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
            Verified
          </span>
        </div>
      </div>

      <button
        onClick={onSend}
        className="mt-4 bg-lime text-obsidian font-bold py-3 rounded-xl flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        Send to Patron
      </button>
    </motion.div>
  );
}

// ============================================================================
// State: Scanner
// ============================================================================

function ScannerState({ status, onScan }: { status: Status; onScan: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex-1 flex flex-col p-4 pt-6"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="text-sm text-slate">←</span>
        <h4 className="text-sm font-bold text-white">Release Item</h4>
        <span className="text-sm text-slate">☰</span>
      </div>

      <div className="relative flex-1 bg-[#0a0d14] rounded-2xl border border-white/5 overflow-hidden flex flex-col items-center justify-center">
        <p className="text-[11px] text-slate mb-5 absolute top-4">
          Present patron QR to scanner
        </p>

        {/* Scanner box */}
        <div className="relative w-[180px] h-[180px] border-2 border-lime/40 rounded-2xl overflow-hidden">
          <img
            src={demoTicketQr}
            alt=""
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] opacity-60"
          />
          <motion.div
            className="absolute left-0 right-0 h-px bg-lime shadow-[0_0_8px_2px_rgba(198,242,78,0.6)]"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Success overlay */}
        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-obsidian/95 flex flex-col items-center justify-center gap-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.05 }}
                className="w-16 h-16 rounded-full bg-lime flex items-center justify-center"
              >
                <Check className="w-9 h-9 text-obsidian" strokeWidth={3} />
              </motion.div>
              <p className="text-white font-bold text-sm">Item Released</p>
              <p className="text-lime text-[11px] font-mono">Audit log updated</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={onScan}
        disabled={status !== 'idle'}
        className="mt-4 w-14 h-14 mx-auto rounded-full bg-lime text-obsidian font-bold flex items-center justify-center text-3xl disabled:opacity-60 transition-opacity shadow-[0_0_20px_rgba(198,242,78,0.4)]"
        aria-label="Scan"
      >
        ◎
      </button>
    </motion.div>
  );
}

// ============================================================================
// Side panels (hidden on mobile, fill the empty space at desktop)
// ============================================================================

const stateCopy: Record<DemoState, { left: { title: string; body: string }; right: { label: string; value: string }[] }> = {
  camera: {
    left: {
      title: 'Photograph at intake',
      body: 'Plate scanned with on-device OCR. Photo timestamped. A signed digital ticket is created in under 2 seconds.',
    },
    right: [
      { label: 'Mode', value: 'INTAKE' },
      { label: 'OCR', value: 'ON-DEVICE' },
      { label: 'Time', value: '< 2s' },
    ],
  },
  ticket: {
    left: {
      title: 'Patron gets a digital claim',
      body: "Delivered to the patron's phone via SMS, WhatsApp, or email. No app to download. The ticket is signed and cannot be forged.",
    },
    right: [
      { label: 'Ticket', value: '#4839' },
      { label: 'Plate', value: 'ABC 123' },
      { label: 'Signature', value: 'Ed25519' },
    ],
  },
  scanner: {
    left: {
      title: 'Scan to release',
      body: 'The patron presents their QR. The handler scans. The cryptographic signature is verified. Custody is released — and logged.',
    },
    right: [
      { label: 'State', value: 'ACTIVE' },
      { label: 'Verify', value: 'AWAIT QR' },
      { label: 'Log', value: 'APPEND-ONLY' },
    ],
  },
};

function ContextPanel({ state }: { state: DemoState }) {
  const c = stateCopy[state].left;
  return (
    <div className="hidden lg:block max-w-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-white mb-3">{c.title}</h3>
          <p className="text-slate leading-relaxed">{c.body}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MetadataPanel({ state, status }: { state: DemoState; status: Status }) {
  const c = stateCopy[state].right;
  return (
    <div className="hidden lg:flex flex-col gap-3 max-w-xs">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-2"
        >
          {c.map((row) => (
            <div
              key={row.label}
              className="bg-steel/40 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate">
                {row.label}
              </span>
              <span className="text-sm font-mono font-bold text-white">{row.value}</span>
            </div>
          ))}
          {status !== 'idle' && (
            <div className="bg-lime/10 border border-lime/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
              <span className="text-xs font-mono font-bold text-lime uppercase tracking-wider">
                {status === 'detecting' ? 'Processing' : status === 'flash' ? 'Capturing' : 'Released'}
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
