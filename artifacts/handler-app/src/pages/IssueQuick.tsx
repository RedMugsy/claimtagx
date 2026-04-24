import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Nfc,
  QrCode,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "nfc" | "qr" | "sms";

interface ModeSpec {
  mode: Mode;
  Icon: LucideIcon;
  iconTone: string;
  title: string;
  subtitle: string;
  broadcasting: string;
  instruction: string;
}

const SPECS: Record<Mode, ModeSpec> = {
  nfc: {
    mode: "nfc",
    Icon: Nfc,
    iconTone: "text-indigo-200 bg-indigo-500/15 border-indigo-300/40",
    title: "Issue via NFC / BLE",
    subtitle: "Tap-to-transfer ClaimTag",
    broadcasting:
      "Tag is broadcasting. Tap the patron's device to your reader to transfer.",
    instruction:
      "Hold the patron's phone near the NFC reader, or pair via BLE within ~3 m.",
  },
  qr: {
    mode: "qr",
    Icon: QrCode,
    iconTone: "text-amber-200 bg-amber-500/15 border-amber-300/40",
    title: "Issue via QR Code",
    subtitle: "Show-to-scan ClaimTag",
    broadcasting:
      "Display this QR to the patron. Their device will pick up the ticket.",
    instruction: "Patron scans the QR with any camera app or our scanner page.",
  },
  sms: {
    mode: "sms",
    Icon: MessageCircle,
    iconTone: "text-emerald-200 bg-emerald-500/15 border-emerald-300/40",
    title: "Issue via SMS / WhatsApp",
    subtitle: "Send ClaimTag link to patron",
    broadcasting: "Sending ClaimTag link to the patron's number.",
    instruction:
      "Confirm the destination, choose SMS or WhatsApp, then send the secure ticket link.",
  },
};

function generateTicketId(): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const stamp = Date.now().toString(36).slice(-3).toUpperCase();
  return `CT-${stamp}${rand}`;
}

function generateRecoveryCode(): string {
  // 3-digit code (000–999) recited to the patron in case they lose their
  // phone — short enough to dictate, never used as primary auth.
  return Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
}

function IssueQuick({ mode }: { mode: Mode }) {
  const spec = SPECS[mode];
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<"issuing" | "ready">("issuing");
  const ticketId = useMemo(() => generateTicketId(), []);
  const recovery = useMemo(() => generateRecoveryCode(), []);

  useEffect(() => {
    const t = setTimeout(() => setPhase("ready"), 700);
    return () => clearTimeout(t);
  }, []);

  const goToSuccess = () => {
    const params = new URLSearchParams({
      ticket: ticketId,
      code: recovery,
      channel: mode,
    });
    navigate(`/issue/success?${params.toString()}`);
  };

  return (
    <div className="space-y-5" data-testid={`page-issue-${mode}`}>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate rounded-full px-2 py-1"
        data-testid="link-back-home"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Command Center
      </Link>

      <header className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${spec.iconTone}`}
        >
          <spec.Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
            {spec.subtitle}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {spec.title}
          </h1>
        </div>
      </header>

      <section
        className="rounded-3xl border border-white/10 bg-steel/40 p-5"
        data-testid="card-issue-status"
      >
        {phase === "issuing" ? (
          <div className="flex items-center gap-3 text-paper">
            <Loader2 className="w-5 h-5 text-lime animate-spin" />
            <div>
              <div className="font-semibold">Issuing ClaimTag…</div>
              <div className="text-xs text-slate">
                No asset details captured yet. The ticket will be reserved for
                this handler.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="text-xs font-mono uppercase tracking-wider text-slate">
              ClaimTag reserved
            </div>
            <div
              className="text-lg font-bold text-white font-mono"
              data-testid="text-ticket-id"
            >
              {ticketId}
            </div>
            <div className="text-xs text-slate">{spec.broadcasting}</div>
          </div>
        )}
      </section>

      {phase === "ready" && (
        <section
          className="rounded-3xl border border-white/10 bg-obsidian/40 p-5"
          data-testid="card-transfer-panel"
        >
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate mb-3">
            Transfer to patron
          </div>
          {mode === "qr" ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-44 h-44 rounded-2xl bg-paper text-obsidian flex items-center justify-center font-mono text-xs">
                <div className="grid grid-cols-8 gap-[2px] p-3">
                  {Array.from({ length: 64 }).map((_, i) => {
                    const on =
                      (i * 7 + ticketId.charCodeAt(i % ticketId.length)) % 3 !==
                      0;
                    return (
                      <div
                        key={i}
                        className={on ? "w-3 h-3 bg-obsidian" : "w-3 h-3"}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="text-xs text-slate mt-3 max-w-xs">
                {spec.instruction}
              </div>
            </div>
          ) : mode === "nfc" ? (
            <div className="flex flex-col items-center text-center">
              <div className="relative w-32 h-32 rounded-full border-2 border-indigo-300/40 flex items-center justify-center">
                <div className="absolute inset-2 rounded-full border border-indigo-300/30 animate-pulse" />
                <Nfc className="w-10 h-10 text-indigo-200" />
              </div>
              <div className="text-xs text-slate mt-3 max-w-xs">
                {spec.instruction}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate mb-1">
                  Patron phone number
                </div>
                <input
                  name="patronPhone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+1 555 0100"
                  className="w-full rounded-xl border border-white/10 bg-obsidian/60 px-3 py-2 text-paper placeholder:text-slate focus:outline-none focus:border-lime/50"
                  data-testid="input-patron-phone"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  className="border-emerald-400/30 text-emerald-200"
                  data-testid="button-send-sms"
                >
                  <Send className="w-4 h-4" /> SMS
                </Button>
                <Button
                  variant="secondary"
                  className="border-emerald-400/30 text-emerald-200"
                  data-testid="button-send-whatsapp"
                >
                  <Send className="w-4 h-4" /> WhatsApp
                </Button>
              </div>
              <div className="text-xs text-slate">{spec.instruction}</div>
            </div>
          )}

          <Button
            onClick={goToSuccess}
            className="w-full mt-5 bg-lime text-obsidian hover:bg-lime-hover font-bold"
            data-testid="button-confirm-handshake"
          >
            Patron received — continue
          </Button>
        </section>
      )}
    </div>
  );
}

export function IssueNfcPage() {
  return <IssueQuick mode="nfc" />;
}
export function IssueQrPage() {
  return <IssueQuick mode="qr" />;
}
export function IssueSmsPage() {
  return <IssueQuick mode="sms" />;
}
