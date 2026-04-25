import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUp, Disc3, X } from "lucide-react";

const STORAGE_KEY = "handler.tour.v1.seen";

type Step = {
  Icon: typeof ArrowRight;
  title: string;
  body: string;
  hint: string;
};

const STEPS: Step[] = [
  {
    Icon: ArrowRight,
    title: "Swipe right for Custody",
    body: "Drag from anywhere on Home to the right to see every asset currently in your custody.",
    hint: "Try it: → swipe right",
  },
  {
    Icon: ArrowUp,
    title: "Flick up for Intercom",
    body: "Flick up from Home to talk to teammates or page a supervisor — push-to-talk style.",
    hint: "Try it: ↑ flick up",
  },
  {
    Icon: Disc3,
    title: "The Command Station dial",
    body: "Top half captures the asset first, then issues a tag (Manual or Camera). Bottom half issues a ClaimTag right now (NFC/BLE, QR, SMS/WA) and captures after.",
    hint: "Tap any wedge on the dial to start",
  },
];

export function FirstSignInTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (window.localStorage.getItem(STORAGE_KEY) !== "1") {
        setOpen(true);
      }
    } catch {
      // ignore — private mode etc.
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      dismiss();
      return;
    }
    setStep((s) => s + 1);
  };

  if (!open) return null;
  const current = STEPS[step];
  const Icon = current.Icon;

  return (
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-obsidian/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        data-testid="tour-first-sign-in"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-md rounded-3xl border border-white/10 bg-steel/90 p-5 shadow-2xl"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Skip tour"
            className="absolute top-3 right-3 w-8 h-8 rounded-xl border border-white/10 bg-obsidian/60 flex items-center justify-center text-slate hover:text-paper hover-elevate"
            data-testid="button-tour-skip"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl border border-lime/30 bg-lime/10 flex items-center justify-center text-lime shrink-0">
              <motion.div
                key={`icon-${step}`}
                animate={
                  step === 0
                    ? { x: [0, 10, 0] }
                    : step === 1
                    ? { y: [0, -10, 0] }
                    : { rotate: [0, 20, -20, 0] }
                }
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Icon className="w-6 h-6" />
              </motion.div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate">
                Quick tour · {step + 1} of {STEPS.length}
              </div>
              <h2
                id="tour-title"
                className="text-base sm:text-lg font-extrabold text-white tracking-tight"
              >
                {current.title}
              </h2>
            </div>
          </div>

          <p className="mt-3 text-sm text-paper/90 leading-relaxed">
            {current.body}
          </p>
          <div className="mt-2 text-[11px] font-mono uppercase tracking-wider text-lime">
            {current.hint}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-lime" : "w-1.5 bg-white/20"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={dismiss}
                className="rounded-xl border border-white/10 bg-obsidian/40 px-3 py-1.5 text-xs font-semibold text-slate hover:text-paper hover-elevate"
                data-testid="button-tour-skip-text"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={next}
                className="rounded-xl border border-lime/30 bg-lime/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-lime hover-elevate"
                data-testid="button-tour-next"
              >
                {step >= STEPS.length - 1 ? "Got it" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
