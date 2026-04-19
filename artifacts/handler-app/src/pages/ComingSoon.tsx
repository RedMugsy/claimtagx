import { Link } from "wouter";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  subtitle: string;
  description: string;
  Icon: LucideIcon;
  testId?: string;
}

export function ComingSoon({ title, subtitle, description, Icon, testId }: ComingSoonProps) {
  return (
    <div className="min-h-[60vh] flex flex-col" data-testid={testId}>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate rounded-full px-2 py-1 self-start"
        data-testid="link-back-home"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Command Center
      </Link>

      <div className="flex-1 flex items-center justify-center">
        <div className="rounded-3xl border border-dashed border-white/10 bg-steel/30 p-8 sm:p-10 max-w-md w-full text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-lime" />
          </div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate mb-1">
            {subtitle}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            {title}
          </h1>
          <p className="text-sm text-slate leading-relaxed mb-5">{description}</p>
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-lime">
            <Sparkles className="w-3.5 h-3.5" /> Coming soon
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessagesPage() {
  return (
    <ComingSoon
      title="Messages"
      subtitle="Team & venue chat"
      Icon={requireIcon("MessageSquare")}
      description="Direct messages with your shift lead, broadcast notes from the venue, and per-ticket comments will live here."
      testId="page-messages"
    />
  );
}

export function IntercomPage() {
  return (
    <ComingSoon
      title="Intercom"
      subtitle="Push-to-talk channels"
      Icon={requireIcon("Radio")}
      description="One-tap voice chatter with on-shift handlers — replaces walkie-talkies on busy nights."
      testId="page-intercom"
    />
  );
}

export function ServicesPage() {
  return (
    <ComingSoon
      title="Services"
      subtitle="Patron requests on tickets"
      Icon={requireIcon("ConciergeBell")}
      description="Patrons can request services tied to their ticket — bring my car, repack my bag, fetch my coat. Open requests will appear here for handlers to claim and complete."
      testId="page-services"
    />
  );
}

// Tiny helper so this file owns its own icon resolution without each page
// reimporting from lucide-react.
import { MessageSquare, Radio, ConciergeBell, type LucideIcon as L } from "lucide-react";
const REGISTRY: Record<string, L> = {
  MessageSquare,
  Radio,
  ConciergeBell,
};
function requireIcon(name: keyof typeof REGISTRY): LucideIcon {
  return REGISTRY[name];
}
