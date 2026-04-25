import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Search, Clock, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import {
  MODE_BY_ID,
  MODE_ICONS,
  VENUE_AGING_BANDS,
  VENUE_ASSET_NOUN,
  VENUE_COPY,
  classifyAge,
  formatBandThreshold,
  type AgingBand,
} from "@/lib/modes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { QrTag } from "@/components/handler/QrTag";
import { TamperAlerts } from "@/components/handler/TamperAlerts";
import type { CustodyAsset } from "@/lib/types";

function fmtAge(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m ago`;
}

export default function Custody() {
  const { mode, assets, session, activeVenue, venues, setActiveVenue, canAccessMode } = useStore();
  // Owner-targeted tamper-spike alert emails link to /custody?venue=<code>.
  // Honour that query param so the owner lands on the right venue's feed
  // instead of whichever venue they had selected last.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("venue")?.toUpperCase();
    if (!requested) return;
    if (activeVenue?.code === requested) return;
    if (!venues.some((v) => v.code === requested)) return;
    setActiveVenue(requested);
  }, [activeVenue?.code, venues, setActiveVenue]);
  const cfg = MODE_BY_ID[mode];
  const ModeIcon = MODE_ICONS[mode];
  // Aging bands and headings come from the venue's classification, not from
  // a global "<1h vs ≥1h" rule — a valet stand cares about minutes, a hotel
  // baggage room cares about hours.
  const venueType = activeVenue?.venueType ?? "other";
  const bands = VENUE_AGING_BANDS[venueType];
  const copy = VENUE_COPY[venueType];
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CustodyAsset | null>(null);
  const [ageFilter, setAgeFilter] = useState<"all" | AgingBand>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [kpiWindow, setKpiWindow] = useState<"today" | "week" | "month">("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 220);
    return () => clearTimeout(t);
  }, [mode]);

  const list = useMemo(() => {
    let active = assets.filter((a) => a.mode === mode && a.status === "active");
    if (ageFilter !== "all") {
      const now = Date.now();
      active = active.filter(
        (a) => classifyAge(a.intakeAt, bands, now) === ageFilter,
      );
    }
    if (q.trim()) {
      const needle = q.toLowerCase();
      active = active.filter((a) => {
        if (a.ticketId.toLowerCase().includes(needle)) return true;
        if (a.patron.name.toLowerCase().includes(needle)) return true;
        return Object.values(a.fields).some((v) => String(v).toLowerCase().includes(needle));
      });
    }
    active = [...active].sort((a, b) =>
      sort === "newest" ? b.intakeAt - a.intakeAt : a.intakeAt - b.intakeAt
    );
    return active;
  }, [assets, mode, q, ageFilter, sort, bands]);

  const allActive = useMemo(
    () => assets.filter((a) => a.mode === mode && a.status === "active"),
    [assets, mode]
  );
  const bandCounts = useMemo(() => {
    const now = Date.now();
    const c = { fresh: 0, watch: 0, overdue: 0 };
    for (const a of allActive) c[classifyAge(a.intakeAt, bands, now)] += 1;
    return c;
  }, [allActive, bands]);

  const windowStart = useMemo(() => {
    const now = new Date();
    if (kpiWindow === "today") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    }
    if (kpiWindow === "week") {
      return now.getTime() - 7 * 24 * 60 * 60 * 1000;
    }
    return now.getTime() - 30 * 24 * 60 * 60 * 1000;
  }, [kpiWindow]);

  const kpis = useMemo(() => {
    const base = assets.filter((a) => a.mode === mode);
    const inRange = base.filter((a) => a.intakeAt >= windowStart);
    const myName = (session?.handlerName ?? "").trim().toLowerCase();
    const myEmail = (session?.email ?? "").trim().toLowerCase();

    const handlerCheckIns = inRange.filter(
      (a) => a.handler.trim().toLowerCase() === myName,
    ).length;

    const checkOuts = base.filter(
      (a) => a.releasedAt != null && a.releasedAt >= windowStart,
    );
    const handlerCheckOuts = checkOuts.filter((a) => {
      const releasedBy = (a.releasedBy ?? "").trim().toLowerCase();
      if (!releasedBy) return false;
      return releasedBy === myName || releasedBy === myEmail;
    }).length;

    const stationHandled = inRange.length;
    const totalProcessed = stationHandled + checkOuts.length;
    const handlerProcessed = handlerCheckIns + handlerCheckOuts;

    return {
      inCustody: allActive.length,
      handlerHandled: handlerCheckIns,
      stationHandled,
      checkIns: inRange.length,
      checkOuts: checkOuts.length,
      handlerCheckOuts,
      totalProcessed,
      handlerProcessed,
      othersProcessed: Math.max(0, totalProcessed - handlerProcessed),
      contribution:
        stationHandled > 0 ? Math.round((handlerCheckIns / stationHandled) * 100) : 0,
    };
  }, [assets, mode, windowStart, session?.handlerName, session?.email, allActive.length]);

  // Traffic-over-time buckets — hourly for "today", daily otherwise.
  const trafficSeries = useMemo(() => {
    const now = Date.now();
    const isToday = kpiWindow === "today";
    const buckets: { key: number; label: string; in: number; out: number }[] = [];

    if (isToday) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      for (let h = 0; h < 24; h++) {
        const t = startOfDay.getTime() + h * 3600_000;
        if (t > now + 3600_000) break;
        buckets.push({
          key: t,
          label: `${String(h).padStart(2, "0")}:00`,
          in: 0,
          out: 0,
        });
      }
    } else {
      const days = kpiWindow === "week" ? 7 : 30;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      for (let d = days - 1; d >= 0; d--) {
        const dt = new Date(startOfDay);
        dt.setDate(startOfDay.getDate() - d);
        buckets.push({
          key: dt.getTime(),
          label: dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          in: 0,
          out: 0,
        });
      }
    }

    const bucketMs = isToday ? 3600_000 : 86400_000;
    const findBucket = (ts: number) => {
      for (let i = buckets.length - 1; i >= 0; i--) {
        if (ts >= buckets[i].key && ts < buckets[i].key + bucketMs) return buckets[i];
      }
      return null;
    };

    const base = assets.filter((a) => a.mode === mode);
    for (const a of base) {
      if (a.intakeAt >= windowStart) {
        const b = findBucket(a.intakeAt);
        if (b) b.in += 1;
      }
      if (a.releasedAt != null && a.releasedAt >= windowStart) {
        const b = findBucket(a.releasedAt);
        if (b) b.out += 1;
      }
    }
    return buckets;
  }, [assets, mode, kpiWindow, windowStart]);

  // Occupancy is mocked off the venue type until the API exposes capacity.
  const capacity = useMemo(() => {
    const type = activeVenue?.venueType ?? "other";
    if (type === "valet") return 50;
    if (type === "baggage") return 200;
    if (type === "cloakroom") return 120;
    if (type === "retail") return 100;
    return 100;
  }, [activeVenue?.venueType]);
  const occupied = Math.min(kpis.inCustody, capacity);
  const vacant = Math.max(0, capacity - occupied);
  const occupancyPct = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

  if (!canAccessMode(mode)) {
    return (
      <section className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5" data-testid="panel-authorization-denied-custody">
        <div className="text-[11px] font-mono uppercase tracking-wider text-amber-200">Authorization</div>
        <h1 className="text-xl font-extrabold text-white tracking-tight mt-1">Custody view is not enabled for your authorization</h1>
        <p className="mt-2 text-sm text-amber-100/90 leading-relaxed">
          Your handler authorization does not include this station mode at the moment.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/station" className="inline-flex items-center rounded-xl border border-white/10 bg-obsidian/40 px-3 py-1.5 text-xs font-semibold text-paper hover-elevate">
            Open station details
          </Link>
          <Link href="/" className="inline-flex items-center rounded-xl border border-white/10 bg-obsidian/40 px-3 py-1.5 text-xs font-semibold text-paper hover-elevate">
            Back to Command Center
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center">
            <ModeIcon className="w-5 h-5 text-lime" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate">Active custody</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {copy.custodyHeading}
            </h1>
          </div>
          <Badge variant="outline" className="ml-auto border-lime/30 text-lime font-mono">
            {list.length}
          </Badge>
        </div>
        {activeVenue ? (
          <div className="mt-3 flex items-center justify-end">
            <TamperAlerts
              venueCode={activeVenue.code}
              canAcknowledge={activeVenue.role === "owner"}
            />
          </div>
        ) : null}
      </header>

      <section className="mb-5 rounded-3xl border border-white/10 bg-steel/40 px-4 py-3 sm:px-5 sm:py-4" data-testid="card-custody-kpis">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
            Custody analytics
          </div>
          <div className="inline-flex items-center rounded-full border border-white/10 bg-obsidian/50 p-0.5">
            {([
              { id: "today", label: "Today" },
              { id: "week", label: "7D" },
              { id: "month", label: "30D" },
            ] as const).map((w) => (
              <button
                key={w.id}
                onClick={() => setKpiWindow(w.id)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider hover-elevate ${
                  kpiWindow === w.id ? "bg-lime/15 text-lime" : "text-slate"
                }`}
                data-testid={`kpi-window-${w.id}`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-around gap-3 sm:gap-5 flex-nowrap">
          <ProcessedDonut
            total={kpis.totalProcessed}
            handler={kpis.handlerProcessed}
            others={kpis.othersProcessed}
            noun={VENUE_ASSET_NOUN[venueType]}
          />
          <TrafficTotals
            totalIn={trafficSeries.reduce((s, b) => s + b.in, 0)}
            totalOut={trafficSeries.reduce((s, b) => s + b.out, 0)}
          />
          <OccupancyCard
            occupied={occupied}
            vacant={vacant}
            capacity={capacity}
            pct={occupancyPct}
            noun={VENUE_ASSET_NOUN[venueType]}
          />
        </div>
      </section>

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${cfg.label.toLowerCase()} by ticket, patron, or detail...`}
          className="pl-9 bg-steel/40 border-white/10 text-white placeholder:text-slate"
          data-testid="input-search"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {([
          { id: "all", label: "All", count: allActive.length, tone: "" },
          {
            id: "fresh",
            label: `Fresh · <${formatBandThreshold(bands.watchAfterMin)}`,
            count: bandCounts.fresh,
            tone: "lime",
          },
          {
            id: "watch",
            label: `Watch · ${formatBandThreshold(bands.watchAfterMin)}+`,
            count: bandCounts.watch,
            tone: "amber",
          },
          {
            id: "overdue",
            label: `Overdue · ${formatBandThreshold(bands.overdueAfterMin)}+`,
            count: bandCounts.overdue,
            tone: "rose",
          },
        ] as const).map((f) => {
          const active = ageFilter === f.id;
          const activeTone =
            f.tone === "amber"
              ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
              : f.tone === "rose"
                ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                : "border-lime/40 bg-lime/15 text-lime";
          return (
            <button
              key={f.id}
              onClick={() => setAgeFilter(f.id as "all" | AgingBand)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wider hover-elevate ${
                active
                  ? activeTone
                  : "border-white/10 bg-steel/40 text-slate"
              }`}
              data-testid={`filter-age-${f.id}`}
            >
              <span>{f.label}</span>
              <span className="text-[10px] opacity-80">{f.count}</span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1 rounded-full border border-white/10 bg-steel/40 p-1">
          {(["newest", "oldest"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider hover-elevate ${
                sort === s ? "bg-lime/15 text-lime" : "text-slate"
              }`}
              data-testid={`sort-${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="custody-skeleton">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-steel/40 p-4 animate-pulse"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-20 rounded bg-white/10" />
                <div className="h-4 w-12 rounded bg-white/10" />
              </div>
              <div className="h-4 w-32 rounded bg-white/10 mb-3" />
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[0, 1, 2].map((j) => (
                  <div key={j}>
                    <div className="h-2 w-10 rounded bg-white/5 mb-1" />
                    <div className="h-3 w-16 rounded bg-white/10" />
                  </div>
                ))}
              </div>
              <div className="h-3 w-24 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-steel/40 flex items-center justify-center mx-auto mb-3">
            <ModeIcon className="w-5 h-5 text-slate" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Nothing in custody</h2>
          <p className="text-sm text-slate">
            {q ? "No matches for that search." : `Issue a ${cfg.label.toLowerCase()} tag to see it here.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((a, i) => {
            const band = classifyAge(a.intakeAt, bands);
            const cardBorder =
              band === "overdue"
                ? "border-rose-400/40 bg-rose-500/5"
                : band === "watch"
                  ? "border-amber-400/40 bg-amber-500/5"
                  : "border-white/10 bg-steel/40";
            const badgeCls =
              band === "overdue"
                ? "bg-rose-500/15 text-rose-200 border border-rose-400/30"
                : band === "watch"
                  ? "bg-amber-500/15 text-amber-200 border border-amber-400/30"
                  : "bg-lime/10 text-lime border border-lime/20";
            const badgeLabel =
              band === "overdue"
                ? "OVERDUE"
                : band === "watch"
                  ? "WATCH"
                  : "FRESH";
            return (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
              onClick={() => setSelected(a)}
              className={`text-left rounded-2xl border p-4 hover-elevate ${cardBorder}`}
              data-testid={`card-asset-${a.ticketId}`}
              data-band={band}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-sm text-lime tracking-wider">{a.ticketId}</div>
                <Badge variant="secondary" className={`font-mono text-[10px] ${badgeCls}`}>
                  {badgeLabel}
                </Badge>
              </div>
              <div className="text-white font-semibold mb-1">{a.patron.name}</div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {cfg.columns.slice(0, 3).map((c) => (
                  <div key={c.key}>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate">{c.label}</div>
                    <div className={`text-sm text-white truncate ${c.mono ? "font-mono" : ""}`}>
                      {String(a.fields[c.key] ?? "—")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate font-mono">
                <Clock className="w-3 h-3" /> {fmtAge(a.intakeAt)} · {a.handler}
              </div>
            </motion.button>
            );
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-obsidian border-l border-white/10 text-white">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-3">
                  <span className="font-mono text-lime">{selected.ticketId}</span>
                  <Badge variant="secondary" className="font-mono text-[10px] bg-lime/10 text-lime border border-lime/20">
                    ACTIVE
                  </Badge>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="flex items-center justify-center">
                  <QrTag ticketId={selected.ticketId} signature={selected.signature} size={160} />
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wide text-slate">Patron</div>
                    <div className="text-white font-semibold">{selected.patron.name}</div>
                    <div className="text-xs text-slate font-mono">{selected.patron.phone || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wide text-slate">Handler</div>
                    <div className="text-white font-semibold">{selected.handler}</div>
                    <div className="text-xs text-slate font-mono">{fmtAge(selected.intakeAt)}</div>
                  </div>
                  {MODE_BY_ID[selected.mode].fields.map((f) => (
                    <div key={f.key}>
                      <div className="text-xs font-mono uppercase tracking-wide text-slate">{f.label}</div>
                      <div className={`text-white ${f.mono ? "font-mono" : ""}`}>
                        {f.type === "checkbox"
                          ? selected.fields[f.key]
                            ? "Yes"
                            : "No"
                          : String(selected.fields[f.key] ?? "—")}
                      </div>
                    </div>
                  ))}
                </div>
                {selected.photos.length > 0 && (
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wide text-slate mb-2">Photos</div>
                    <div className="grid grid-cols-3 gap-2">
                      {selected.photos.map((p, i) => (
                        <img key={i} src={p} alt={`Photo ${i + 1}`} className="rounded-xl border border-white/10 aspect-square object-cover" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProcessedDonut({
  total,
  handler,
  others,
  noun,
}: {
  total: number;
  handler: number;
  others: number;
  noun: string;
}) {
  const data =
    total > 0
      ? [
          { name: "You", value: handler },
          { name: "Team", value: others },
        ]
      : [{ name: "Empty", value: 1 }];
  const colors = total > 0 ? ["#a3e635", "#475569"] : ["#1f2937"];
  const handlerPct = total > 0 ? Math.round((handler / total) * 100) : 0;
  return (
    <div
      className="flex items-center"
      data-testid="card-processed-donut"
      title={`${noun}s processed: ${total} (you ${handler}, team ${others}) — ${handlerPct}% by you`}
    >
      <div className="relative w-20 h-20 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={26}
              outerRadius={38}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-base font-extrabold font-mono tracking-tight text-white tabular-nums">
            {total}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrafficTotals({
  totalIn,
  totalOut,
}: {
  totalIn: number;
  totalOut: number;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      data-testid="card-traffic-totals"
      title={`Traffic — in ${totalIn}, out ${totalOut}`}
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full border border-lime/30 bg-lime/10 flex items-center justify-center">
          <ArrowDownToLine className="w-4 h-4 text-lime" />
        </div>
        <div className="text-base font-extrabold font-mono tabular-nums text-paper w-6 text-left">
          {totalIn}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full border border-amber-300/30 bg-amber-500/10 flex items-center justify-center">
          <ArrowUpFromLine className="w-4 h-4 text-amber-300" />
        </div>
        <div className="text-base font-extrabold font-mono tabular-nums text-paper w-6 text-left">
          {totalOut}
        </div>
      </div>
    </div>
  );
}

function OccupancyCard({
  occupied,
  vacant,
  capacity,
  pct,
  noun,
}: {
  occupied: number;
  vacant: number;
  capacity: number;
  pct: number;
  noun: string;
}) {
  const tone =
    pct >= 90
      ? { text: "text-rose-300" }
      : pct >= 70
      ? { text: "text-amber-300" }
      : { text: "text-lime" };
  const radius = 56;
  const circ = Math.PI * radius;
  const dash = (pct / 100) * circ;
  return (
    <div
      className="flex items-center"
      data-testid="card-occupancy"
      title={`Occupancy: ${occupied}/${capacity} (${vacant} ${noun}s vacant) — ${pct}%`}
    >
      <div className="relative w-24 h-14 shrink-0">
        <svg viewBox="0 0 140 80" className="w-full h-full">
          <path
            d="M 14 70 A 56 56 0 0 1 126 70"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={14}
            strokeLinecap="round"
          />
          <path
            d="M 14 70 A 56 56 0 0 1 126 70"
            fill="none"
            stroke="currentColor"
            className={tone.text}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center">
          <div className={`text-sm font-extrabold font-mono tabular-nums ${tone.text}`}>
            {pct}%
          </div>
        </div>
      </div>
    </div>
  );
}
