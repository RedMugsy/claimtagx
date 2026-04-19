import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2, RotateCcw, ClipboardCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { MODE_BY_ID, MODE_ICONS } from "@/lib/modes";
import { CameraCapture } from "@/components/handler/CameraCapture";
import { ModeField } from "@/components/handler/Field";
import { QrTag } from "@/components/handler/QrTag";
import type { CustodyAsset } from "@/lib/types";

type Step = "details" | "review" | "done";

export default function Intake() {
  const { mode, intake } = useStore();
  const cfg = MODE_BY_ID[mode];
  const ModeIcon = MODE_ICONS[mode];

  const [step, setStep] = useState<Step>("details");
  const [patron, setPatron] = useState({ name: "", phone: "" });
  const [fields, setFields] = useState<Record<string, string | number | boolean | undefined>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [created, setCreated] = useState<CustodyAsset | null>(null);

  const reset = () => {
    setStep("details");
    setPatron({ name: "", phone: "" });
    setFields({});
    setPhotos([]);
    setCreated(null);
  };

  const requiredOk =
    patron.name.trim().length > 0 &&
    cfg.fields.every((f) => !f.required || (fields[f.key] !== undefined && String(fields[f.key]).length > 0));

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = async () => {
    if (submitting) return;
    const cleanFields: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) cleanFields[k] = v;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const a = await intake({ mode, patron, fields: cleanFields, photos });
      setCreated(a);
      setStep("done");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to issue tag");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center">
            <ModeIcon className="w-5 h-5 text-lime" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate">{cfg.short}</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Intake new {cfg.label.toLowerCase()}
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate mt-2 max-w-xl">{cfg.blurb}. Capture photos, fill in the details, and issue a tag.</p>
      </header>

      <div className="flex items-center gap-2 mb-6 text-xs font-mono uppercase tracking-wider">
        {(["details", "review", "done"] as Step[]).map((s, i) => {
          const active = s === step;
          const done =
            (step === "review" && s === "details") ||
            (step === "done" && s !== "done");
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  active
                    ? "bg-lime text-obsidian border-lime"
                    : done
                      ? "bg-lime/20 text-lime border-lime/30"
                      : "bg-steel/40 text-slate border-white/10"
                }`}
              >
                {i + 1}
              </div>
              <span className={active ? "text-white" : "text-slate"}>{s}</span>
              {i < 2 && <span className="text-white/10">·</span>}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <section className="rounded-3xl border border-white/10 bg-steel/40 p-6 space-y-5">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-wide text-slate mb-3">Patron</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="patron-name" className="text-xs font-mono uppercase tracking-wide text-slate">
                      Full name <span className="text-lime">*</span>
                    </Label>
                    <Input
                      id="patron-name"
                      value={patron.name}
                      onChange={(e) => setPatron({ ...patron, name: e.target.value })}
                      placeholder="Patron name"
                      className="bg-obsidian/40 border-white/10 text-white placeholder:text-slate"
                      data-testid="input-patron-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="patron-phone" className="text-xs font-mono uppercase tracking-wide text-slate">
                      Phone
                    </Label>
                    <Input
                      id="patron-phone"
                      value={patron.phone}
                      onChange={(e) => setPatron({ ...patron, phone: e.target.value })}
                      placeholder="+1 415 555 0000"
                      className="bg-obsidian/40 border-white/10 text-white placeholder:text-slate font-mono"
                      data-testid="input-patron-phone"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-mono uppercase tracking-wide text-slate mb-3">{cfg.label} details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cfg.fields.map((f) => (
                    <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                      <ModeField
                        def={f}
                        value={fields[f.key]}
                        onChange={(v) => setFields({ ...fields, [f.key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-steel/40 p-6">
              <h2 className="text-sm font-mono uppercase tracking-wide text-slate mb-3">Asset photos</h2>
              <CameraCapture photos={photos} onChange={setPhotos} />
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setStep("review")}
                  disabled={!requiredOk}
                  className="bg-lime text-obsidian hover:bg-lime-hover font-bold rounded-xl"
                  data-testid="button-review"
                >
                  Review intake <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </section>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-white/10 bg-steel/40 p-6 space-y-6"
          >
            <div className="flex items-start gap-3">
              <ClipboardCheck className="w-5 h-5 text-lime mt-1" />
              <div>
                <h2 className="text-lg font-bold text-white">Confirm and issue tag</h2>
                <p className="text-sm text-slate">Once issued, this asset enters active custody.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-mono uppercase tracking-wide text-slate mb-2">Patron</div>
                <div className="text-white font-semibold">{patron.name}</div>
                <div className="text-sm text-slate font-mono">{patron.phone || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wide text-slate mb-2">Mode</div>
                <div className="text-white font-semibold">{cfg.label}</div>
                <div className="text-sm text-slate">{cfg.short}</div>
              </div>
              {cfg.fields.map((f) => {
                const val = fields[f.key];
                return (
                  <div key={f.key}>
                    <div className="text-xs font-mono uppercase tracking-wide text-slate mb-1">{f.label}</div>
                    <div className={`text-white ${f.mono ? "font-mono" : ""}`}>
                      {val === undefined || val === "" ? "—" : f.type === "checkbox" ? (val ? "Yes" : "No") : String(val)}
                    </div>
                  </div>
                );
              })}
            </div>

            {photos.length > 0 && (
              <div>
                <div className="text-xs font-mono uppercase tracking-wide text-slate mb-2">Photos</div>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((p, i) => (
                    <img key={i} src={p} alt={`Photo ${i + 1}`} className="rounded-xl border border-white/10 aspect-square object-cover" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-end">
              <Button variant="secondary" onClick={() => setStep("details")} data-testid="button-back">
                Back to edit
              </Button>
              <Button
                onClick={submit}
                disabled={submitting}
                className="bg-lime text-obsidian hover:bg-lime-hover font-bold rounded-xl"
                data-testid="button-issue-tag"
              >
                {submitting ? "Issuing…" : "Issue tag"} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            {submitError && (
              <div
                className="text-sm text-red-400 font-mono text-right"
                data-testid="text-intake-error"
              >
                {submitError}
              </div>
            )}
          </motion.div>
        )}

        {step === "done" && created && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-lime/30 bg-gradient-to-br from-lime/10 to-steel/40 p-6 sm:p-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/15 px-3 py-1 text-xs font-mono uppercase tracking-wider text-lime mb-4">
                  <CheckCircle2 className="w-3 h-3" /> Tag issued
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                  {created.ticketId}
                </h2>
                <p className="text-slate mb-6">
                  Asset is now in active custody under {created.handler}.
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wide text-slate">Patron</div>
                    <div className="text-white font-semibold">{created.patron.name}</div>
                  </div>
                  {cfg.columns.map((c) => (
                    <div key={c.key}>
                      <div className="text-xs font-mono uppercase tracking-wide text-slate">{c.label}</div>
                      <div className={`text-white ${c.mono ? "font-mono" : ""}`}>
                        {String(created.fields[c.key] ?? "—")}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button onClick={reset} className="bg-lime text-obsidian hover:bg-lime-hover font-bold rounded-xl" data-testid="button-new-intake">
                    <RotateCcw className="w-4 h-4" /> New intake
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <QrTag ticketId={created.ticketId} signature={created.signature} size={220} />
                <div className="mt-4 text-center">
                  <div className="font-mono text-lg text-white tracking-wider">{created.ticketId}</div>
                  <div className="text-xs text-slate font-mono">Visual tag · scan at release</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
