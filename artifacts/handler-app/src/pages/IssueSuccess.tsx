import { useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  MessageCircle,
  Nfc,
  PackagePlus,
  QrCode,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { DEFAULT_TA_POLICY, VENUE_ASSET_NOUN } from "@/lib/modes";

const CHANNEL_LABEL: Record<string, { label: string; Icon: LucideIcon }> = {
  nfc: { label: "NFC / BLE", Icon: Nfc },
  qr: { label: "QR Code", Icon: QrCode },
  sms: { label: "SMS / WhatsApp", Icon: MessageCircle },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function IssueSuccess() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const { activeVenue } = useStore();

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const ticketId = params.get("ticket") ?? "CT-——————";
  const code = params.get("code") ?? "000";
  const channel = params.get("channel") ?? "nfc";
  const channelMeta = CHANNEL_LABEL[channel] ?? CHANNEL_LABEL.nfc;
  const ChannelIcon = channelMeta.Icon;

  const noun = VENUE_ASSET_NOUN[activeVenue?.venueType ?? "other"];
  const policy = DEFAULT_TA_POLICY;

  const goOnboard = () => {
    navigate(`/onboard?ticket=${encodeURIComponent(ticketId)}`);
  };
  const goNewAsset = () => {
    // Pending asset stays pegged to the handler; we simply return to the
    // Command Station so they can choose another quick-issue channel.
    navigate("/");
  };

  return (
    <div className="space-y-6" data-testid="page-issue-success">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate rounded-full px-2 py-1"
        data-testid="link-back-home"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Command Center
      </Link>

      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-lime" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate">
            <ChannelIcon className="w-3.5 h-3.5" /> Issued via {channelMeta.label}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            ClaimTag delivered
          </h1>
        </div>
      </header>

      {/* Ticket id */}
      <section
        className="rounded-3xl border border-white/10 bg-steel/40 p-5"
        data-testid="card-ticket-summary"
      >
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
          Ticket reference
        </div>
        <div
          className="text-xl font-bold font-mono text-white mt-1"
          data-testid="text-ticket-id"
        >
          {ticketId}
        </div>
      </section>

      {/* Recovery code — large, readable */}
      <section
        className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5 text-center"
        data-testid="card-recovery-code"
      >
        <div className="text-[11px] font-mono uppercase tracking-wider text-amber-200">
          Recovery code
        </div>
        <div
          className="mt-2 font-mono font-extrabold text-paper tracking-[0.4em] text-6xl sm:text-7xl"
          data-testid="text-recovery-code"
          aria-label={`Recovery code ${code.split("").join(" ")}`}
        >
          {code}
        </div>
        <div className="mt-3 text-xs text-amber-100/90 leading-snug max-w-sm mx-auto">
          Read this 3-digit code to the patron. They can recite it at pick-up
          if they lose their phone.
        </div>
      </section>

      {/* Primary CTAs */}
      <section className="space-y-3">
        <Button
          onClick={goOnboard}
          className="w-full bg-lime text-obsidian hover:bg-lime-hover font-bold h-12"
          data-testid="button-complete-onboarding"
        >
          <ClipboardCheck className="w-4 h-4" /> Complete onboarding
        </Button>

        {policy.allowMultiAssetPending && (
          <>
            <Button
              variant="secondary"
              onClick={goNewAsset}
              className="w-full h-12"
              data-testid="button-checkin-new-asset"
            >
              <PackagePlus className="w-4 h-4" /> Check-in new {noun}
            </Button>
            <p className="text-[11px] text-slate text-center max-w-sm mx-auto leading-relaxed">
              The current {noun} stays pegged to you until you complete the
              required fields or hand it off to another handler / supervisor.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
