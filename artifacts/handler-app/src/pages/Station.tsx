import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CircleSlash,
  ClipboardList,
  ConciergeBell,
  Hash,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  getOpenServiceCount,
  getGetOpenServiceCountQueryKey,
  getListActiveVenueShiftsQueryKey,
  listActiveVenueShifts,
} from "@workspace/api-client-react";
import { useStore } from "@/lib/store";
import { MODE_BY_ID, VENUE_TYPE_BLURB, VENUE_TYPE_LABEL } from "@/lib/modes";

export default function StationPage() {
  const { activeVenue, mode, assets, authorization } = useStore();
  const venueCode = activeVenue?.code ?? "";
  const venueType = activeVenue?.venueType ?? "other";
  const primaryAuthorizedMode = authorization.effectiveModes[0] ?? mode;
  const modeCfg = MODE_BY_ID[primaryAuthorizedMode];

  const openServicesQuery = useQuery({
    queryKey: getGetOpenServiceCountQueryKey(venueCode),
    queryFn: () => getOpenServiceCount(venueCode),
    enabled: Boolean(venueCode),
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  const activeShiftsQuery = useQuery({
    queryKey: getListActiveVenueShiftsQueryKey(venueCode),
    queryFn: () => listActiveVenueShifts(venueCode),
    enabled: Boolean(venueCode),
    staleTime: 30_000,
  });

  const activeAssetsInMode = assets.filter(
    (a) => a.status === "active" && a.mode === mode,
  ).length;

  const openServiceCount = openServicesQuery.data?.count ?? 0;
  const onShiftCount = activeShiftsQuery.data?.length ?? 0;

  return (
    <div className="space-y-4" data-testid="page-station">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate rounded-full px-2 py-1"
        data-testid="link-back-home"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Command Center
      </Link>

      <section className="rounded-3xl border border-white/10 bg-steel/40 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-lime" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
              Station information
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
              {activeVenue?.name ?? "No station selected"}
            </h1>
            <div className="mt-1 text-xs text-slate font-mono">
              {activeVenue?.code ?? "—"} · {VENUE_TYPE_LABEL[venueType]}
              {activeVenue?.role ? ` · ${activeVenue.role}` : ""}
            </div>
            <div className="mt-2 text-xs text-paper/90 leading-relaxed">
              {VENUE_TYPE_BLURB[venueType]}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-steel/40 p-4 sm:p-5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate mb-3 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-lime" /> Capability snapshot
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoMetric
            label="Authorized asset class"
            value={authorization.effectiveModes.length > 0 ? modeCfg.label : "None"}
          />
          <InfoMetric label="Ticket prefix" value={modeCfg.ticketPrefix} />
          <InfoMetric label="Items in custody" value={String(activeAssetsInMode)} />
          <InfoMetric label="Handlers on shift" value={String(onShiftCount)} />
        </div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-obsidian/40 p-3 space-y-2 text-xs">
          <div className="text-slate">Station capabilities: <span className="text-paper font-mono">{authorization.stationModes.join(", ") || "none"}</span></div>
          <div className="text-slate">Handler authorizations: <span className="text-paper font-mono">{authorization.handlerModes.join(", ") || "none"}</span></div>
          <div className="text-slate">Effective access (intersection): <span className="text-lime font-mono">{authorization.effectiveModes.join(", ") || "none"}</span></div>
          <div className="text-slate">Station source: <span className="text-paper font-mono">{authorization.stationModesSource}</span></div>
          <div className="text-slate">Handler source: <span className="text-paper font-mono">{authorization.handlerModesSource}</span></div>
        </div>
        {authorization.usingDerivedDefaults && (
          <div className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100/90" data-testid="banner-derived-authorization-station">
            This station is currently using derived defaults. Once backend capability and authorization matrices are provided,
            this view will automatically switch to explicit values.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-steel/40 p-4 sm:p-5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate mb-3 flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5 text-lime" /> Assignment sources
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QueueCard
            title="Patron assignments"
            subtitle="Ticket-linked patron requests"
            value={String(openServiceCount)}
            icon={<Users className="w-4 h-4 text-lime" />}
            tone="live"
          />
          <QueueCard
            title="Supervisor tasks"
            subtitle="Free-form or asset-linked"
            value="Pending"
            icon={<ClipboardList className="w-4 h-4 text-amber-300" />}
            tone="pending"
          />
          <QueueCard
            title="Service jobs"
            subtitle="Cleaning, prep, and operations"
            value={String(openServiceCount)}
            icon={<ConciergeBell className="w-4 h-4 text-violet-300" />}
            tone="live"
          />
        </div>
        <p className="mt-3 text-[11px] text-slate">
          Supervisor task feeds are not exposed by the current API yet; this card will auto-switch to live counts when that endpoint is connected.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-steel/40 p-4 sm:p-5" data-testid="card-ticket-policy">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate mb-3 flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-lime" /> Ticket policy snapshot
        </div>
        <div className="rounded-2xl border border-white/10 bg-obsidian/40 p-3 space-y-2">
          <div className="text-sm text-white font-semibold">Current generator: random with prefix</div>
          <div className="text-xs text-slate leading-relaxed">
            The platform currently issues <span className="font-mono text-paper">{modeCfg.ticketPrefix}-NNNN</span> style IDs with collision checks and retry fallback.
          </div>
          <div className="inline-flex items-center gap-2 text-[11px] text-slate">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime" />
            Active now
          </div>
        </div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-obsidian/30 p-3 text-xs text-slate flex items-start gap-2">
          <CircleSlash className="w-4 h-4 mt-0.5 shrink-0" />
          Sequential/random/external/system-configurable TA policies are acknowledged in product requirements and can be surfaced here once policy endpoints are available.
        </div>
      </section>
    </div>
  );
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-obsidian/40 p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate">{label}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function QueueCard({
  title,
  subtitle,
  value,
  icon,
  tone,
}: {
  title: string;
  subtitle: string;
  value: string;
  icon: React.ReactNode;
  tone: "live" | "pending";
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        tone === "live" ? "border-lime/30 bg-lime/10" : "border-amber-400/30 bg-amber-500/10"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-white font-semibold truncate">{title}</div>
        {icon}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate mt-1">{subtitle}</div>
      <div className="mt-2 text-lg font-extrabold text-white">{value}</div>
    </div>
  );
}