import { useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { ArrowLeft, Camera, FileEdit } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { DEFAULT_TA_POLICY, VENUE_ASSET_NOUN } from "@/lib/modes";

interface ToolOption {
  id: "manual" | "camera";
  label: string;
  blurb: string;
  Icon: LucideIcon;
  to: string;
  testId: string;
  tone: string;
}

export default function OnboardingPicker() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const { activeVenue } = useStore();

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const ticketId = params.get("ticket") ?? "";
  const noun = VENUE_ASSET_NOUN[activeVenue?.venueType ?? "other"];
  const policy = DEFAULT_TA_POLICY;

  const [serviceClass, setServiceClass] = useState<string | null>(
    policy.serviceClasses?.[0] ?? null,
  );
  const [patronType, setPatronType] = useState<string | null>(
    policy.patronTypes?.[0] ?? null,
  );

  const needsServiceClass = (policy.serviceClasses?.length ?? 0) > 1;
  const needsPatronType = (policy.patronTypes?.length ?? 0) > 1;
  const ready =
    (!needsServiceClass || !!serviceClass) &&
    (!needsPatronType || !!patronType);

  const tools: ToolOption[] = [
    {
      id: "manual",
      label: "Manual",
      blurb: `Type ${noun} details into a form.`,
      Icon: FileEdit,
      to: buildOnboardUrl("/intake"),
      testId: "tool-manual",
      tone: "border-violet-300/40 bg-violet-500/15 text-violet-200",
    },
    {
      id: "camera",
      label: "Camera",
      blurb: `Capture ${noun} photos and parse what we can.`,
      Icon: Camera,
      to: buildOnboardUrl("/release"),
      testId: "tool-camera",
      tone: "border-lime/40 bg-lime/15 text-lime",
    },
  ];

  function buildOnboardUrl(base: string): string {
    const q = new URLSearchParams();
    if (ticketId) q.set("ticket", ticketId);
    if (serviceClass) q.set("class", serviceClass);
    if (patronType) q.set("patronType", patronType);
    return `${base}?${q.toString()}`;
  }

  return (
    <div className="space-y-6" data-testid="page-onboard">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate rounded-full px-2 py-1"
        data-testid="link-back-home"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Command Center
      </Link>

      <header>
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
          Complete onboarding
          {ticketId && (
            <span className="ml-2 text-paper font-mono">{ticketId}</span>
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Capture {noun} details
        </h1>
      </header>

      {/* Top filters: service class, then patron type — only render when SEP
          actually defines >1 option for that axis. */}
      {needsServiceClass && (
        <ChipPicker
          label="Service class"
          options={policy.serviceClasses ?? []}
          value={serviceClass}
          onChange={setServiceClass}
          testId="picker-service-class"
        />
      )}

      {needsPatronType && (
        <ChipPicker
          label="Patron type"
          options={policy.patronTypes ?? []}
          value={patronType}
          onChange={setPatronType}
          testId="picker-patron-type"
        />
      )}

      {/* Tool picker */}
      <section className="space-y-3" data-testid="picker-tool">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
          Capture tool
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!ready}
              onClick={() => navigate(t.to)}
              className={`text-left rounded-2xl border p-4 transition-colors hover-elevate disabled:opacity-50 disabled:cursor-not-allowed ${t.tone}`}
              data-testid={t.testId}
            >
              <div className="flex items-center gap-3">
                <t.Icon className="w-6 h-6" />
                <div>
                  <div className="font-extrabold text-paper">{t.label}</div>
                  <div className="text-xs text-slate mt-0.5">{t.blurb}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        {!ready && (
          <div
            className="text-[11px] font-mono uppercase tracking-wider text-slate"
            data-testid="text-picker-hint"
          >
            Choose service class and patron type to continue
          </div>
        )}
      </section>
    </div>
  );
}

function ChipPicker({
  label,
  options,
  value,
  onChange,
  testId,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
  testId: string;
}) {
  return (
    <section className="space-y-2" data-testid={testId}>
      <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors hover-elevate ${
                selected
                  ? "border-lime bg-lime text-obsidian"
                  : "border-white/15 bg-steel/40 text-paper"
              }`}
              data-testid={`${testId}-opt-${opt.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </section>
  );
}
