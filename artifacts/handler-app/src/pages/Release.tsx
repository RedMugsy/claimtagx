import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ScanLine, CheckCircle2, AlertTriangle, RotateCcw, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { MODE_BY_ID, MODE_ICONS } from "@/lib/modes";
import { QrTag } from "@/components/handler/QrTag";
import type { CustodyAsset } from "@/lib/types";

type Stage = "scan" | "confirm" | "released" | "missing";

export default function Release() {
  const { findByTicket, release, mode } = useStore();
  const modeCfg = MODE_BY_ID[mode];
  const [stage, setStage] = useState<Stage>("scan");
  const [code, setCode] = useState("");
  const [match, setMatch] = useState<CustodyAsset | null>(null);
  const [released, setReleased] = useState<CustodyAsset | null>(null);
  const [scanOn, setScanOn] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<unknown>(null);
  const rafRef = useRef<number | null>(null);

  const [missingReason, setMissingReason] = useState<"unknown" | "wrong-mode">("unknown");

  const lookup = useCallback(
    (ticket: string) => {
      const a = findByTicket(ticket.trim());
      if (a && a.status === "active" && a.mode === mode) {
        setMatch(a);
        setStage("confirm");
        return true;
      }
      setMissingReason(a && a.status === "active" && a.mode !== mode ? "wrong-mode" : "unknown");
      setStage("missing");
      return false;
    },
    [findByTicket, mode]
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function setupDetector() {
      const w = window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (s: HTMLVideoElement) => Promise<{ rawValue: string }[]> } };
      if (!w.BarcodeDetector) {
        setScanNote("Live QR decode is not supported in this browser. Use manual entry.");
        return null;
      }
      try {
        return new w.BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        setScanNote("Live QR decode unavailable. Use manual entry.");
        return null;
      }
    }

    async function tick() {
      const v = videoRef.current;
      const d = detectorRef.current as { detect: (s: HTMLVideoElement) => Promise<{ rawValue: string }[]> } | null;
      if (cancelled || !v || !d || stage !== "scan") return;
      if (v.readyState >= 2) {
        try {
          const results = await d.detect(v);
          if (results && results.length > 0) {
            const raw = results[0].rawValue;
            const ticket = raw.trim().toUpperCase();
            setCode(ticket);
            setScanOn(false);
            lookup(ticket);
            return;
          }
        } catch {
          // ignore detection frame errors
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    if (scanOn) {
      setScanNote(null);
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then(async (s) => {
          if (cancelled) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            await videoRef.current.play().catch(() => {});
          }
          detectorRef.current = await setupDetector();
          if (detectorRef.current) {
            rafRef.current = requestAnimationFrame(tick);
          }
        })
        .catch(() => {
          setScanOn(false);
          setScanNote("Camera permission denied. Use manual entry.");
        });
    }
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      detectorRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanOn, stage, lookup]);

  const reset = () => {
    setCode("");
    setMatch(null);
    setReleased(null);
    setStage("scan");
  };

  const confirm = () => {
    if (!match) return;
    const r = release(match.ticketId);
    if (r) {
      setReleased(r);
      setStage("released");
    } else {
      setStage("missing");
    }
  };

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center">
            <ScanLine className="w-5 h-5 text-lime" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate">Release</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Scan tag to release
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate mt-2 max-w-xl">
          Scan the patron's QR tag with the camera, or type the ticket id manually.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {stage === "scan" && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <section className="rounded-3xl border border-white/10 bg-steel/40 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-mono uppercase tracking-wide text-slate">Camera</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setScanOn((v) => !v)}
                  data-testid="button-toggle-scanner"
                >
                  <Camera className="w-4 h-4" /> {scanOn ? "Stop" : "Start"}
                </Button>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-obsidian aspect-[4/3]">
                {scanOn ? (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-8 border-2 border-lime/60 rounded-2xl" />
                      <motion.div
                        animate={{ y: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute left-8 right-8 h-0.5 bg-lime shadow-[0_0_12px_rgba(198,242,78,0.7)]"
                        style={{ top: "10%" }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate gap-2">
                    <ScanLine className="w-8 h-8" />
                    <div className="text-sm">Camera off — start to scan or use manual entry.</div>
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-slate font-mono">
                {scanNote
                  ? scanNote
                  : scanOn
                    ? "Point the camera at a tag — auto-advances on detect."
                    : "Start the camera to auto-decode QR tags, or use manual entry."}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-steel/40 p-6">
              <h2 className="text-sm font-mono uppercase tracking-wide text-slate mb-3">Manual entry</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (code.trim()) lookup(code);
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="ticket" className="text-xs font-mono uppercase tracking-wide text-slate">
                    Ticket id
                  </Label>
                  <Input
                    id="ticket"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VAL-4839"
                    className="bg-obsidian/40 border-white/10 text-white placeholder:text-slate font-mono text-lg tracking-widest"
                    autoFocus
                    data-testid="input-ticket"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!code.trim()}
                  className="w-full bg-lime text-obsidian hover:bg-lime-hover font-bold rounded-xl"
                  data-testid="button-lookup"
                >
                  Look up tag <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
              <div className="mt-6 text-xs text-slate font-mono">
                Try a seeded ticket: VAL-4839 · BAG-2210 · CLK-0712 · RET-3380
              </div>
            </section>
          </motion.div>
        )}

        {stage === "confirm" && match && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-white/10 bg-steel/40 p-6 sm:p-8"
          >
            <ConfirmDetails asset={match} />
            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <Button variant="secondary" onClick={reset} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={confirm}
                className="bg-lime text-obsidian hover:bg-lime-hover font-bold rounded-xl"
                data-testid="button-confirm-release"
              >
                Confirm release <CheckCircle2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {stage === "released" && released && (
          <motion.div
            key="released"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-lime/30 bg-gradient-to-br from-lime/10 to-steel/40 p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-lime text-obsidian flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="font-mono text-sm text-lime tracking-wider mb-2">{released.ticketId}</div>
            <h2 className="text-2xl font-extrabold text-white mb-1">Released to {released.patron.name}</h2>
            <p className="text-slate mb-6">Removed from active custody.</p>
            <Button onClick={reset} className="bg-lime text-obsidian hover:bg-lime-hover font-bold rounded-xl" data-testid="button-next-release">
              <RotateCcw className="w-4 h-4" /> Next release
            </Button>
          </motion.div>
        )}

        {stage === "missing" && (
          <motion.div
            key="missing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-red-500/30 bg-red-500/5 p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-1">
              {missingReason === "wrong-mode" ? "Tag belongs to a different mode" : "No active tag found"}
            </h2>
            <p className="text-slate mb-6">
              {missingReason === "wrong-mode" ? (
                <>
                  <span className="font-mono">{code || "—"}</span> isn't a {modeCfg.label.toLowerCase()} tag. Switch modes from the top bar to release it.
                </>
              ) : (
                <>
                  <span className="font-mono">{code || "—"}</span> isn't in active custody. Check the code and try again.
                </>
              )}
            </p>
            <Button onClick={reset} className="bg-lime text-obsidian hover:bg-lime-hover font-bold rounded-xl" data-testid="button-try-again">
              Try again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfirmDetails({ asset }: { asset: CustodyAsset }) {
  const cfg = MODE_BY_ID[asset.mode];
  const ModeIcon = MODE_ICONS[asset.mode];
  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
      <div className="flex flex-col items-center gap-3">
        <QrTag value={asset.ticketId} size={160} />
        <div className="font-mono text-sm text-lime tracking-wider">{asset.ticketId}</div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ModeIcon className="w-4 h-4 text-lime" />
          <span className="text-xs font-mono uppercase tracking-wide text-slate">{cfg.label}</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1">{asset.patron.name}</h2>
        <div className="text-sm text-slate font-mono mb-4">{asset.patron.phone || "—"}</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {cfg.fields.map((f) => (
            <div key={f.key}>
              <div className="text-xs font-mono uppercase tracking-wide text-slate">{f.label}</div>
              <div className={`text-white ${f.mono ? "font-mono" : ""}`}>
                {f.type === "checkbox"
                  ? asset.fields[f.key]
                    ? "Yes"
                    : "No"
                  : String(asset.fields[f.key] ?? "—")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
