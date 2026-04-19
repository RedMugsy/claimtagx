import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Clock, History as HistoryIcon, X, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import {
  listAssets,
  type CustodyAsset as ApiCustodyAsset,
  type ListAssetsParams,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { MODES, MODE_BY_ID, MODE_ICONS } from "@/lib/modes";
import type { AssetModeId, CustodyAsset } from "@/lib/types";

function toLocal(a: ApiCustodyAsset): CustodyAsset {
  return {
    id: a.id,
    ticketId: a.ticketId,
    mode: a.mode as AssetModeId,
    patron: { name: a.patron.name, phone: a.patron.phone },
    fields: (a.fields ?? {}) as Record<string, string | number | boolean>,
    photos: (a.photos ?? []) as string[],
    intakeAt: a.intakeAt,
    handler: a.handler,
    status: a.status as "active" | "released",
    releasedAt: a.releasedAt ?? undefined,
    releasedBy: a.releasedBy ?? null,
    signature: a.signature,
  };
}

function fmtAbs(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDuration(from: number, to?: number) {
  if (!to) return "—";
  const mins = Math.max(0, Math.round((to - from) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function dateInputToMs(raw: string, endOfDay: boolean): number | undefined {
  if (!raw) return undefined;
  // raw is "YYYY-MM-DD" in local tz; build a Date in local tz.
  const [y, m, d] = raw.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return undefined;
  const dt = endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
  return dt.getTime();
}

export default function History() {
  const { activeVenue } = useStore();
  const venueCode = activeVenue?.code ?? "";

  const [modeFilter, setModeFilter] = useState<AssetModeId | "all">("all");
  const [handlerFilter, setHandlerFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CustodyAsset | null>(null);

  const params = useMemo<ListAssetsParams>(() => {
    const p: ListAssetsParams = { status: "released" };
    if (modeFilter !== "all") p.mode = modeFilter;
    if (handlerFilter.trim()) p.handler = handlerFilter.trim();
    const from = dateInputToMs(fromDate, false);
    const to = dateInputToMs(toDate, true);
    if (from !== undefined) p.from = from;
    if (to !== undefined) p.to = to;
    return p;
  }, [modeFilter, handlerFilter, fromDate, toDate]);

  const { data: rows = [], isLoading, isFetching } = useQuery({
    queryKey: ["history", venueCode, params],
    queryFn: () => listAssets(venueCode, params).then((list) => list.map(toLocal)),
    enabled: Boolean(venueCode),
  });

  const list = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter((a) => {
      if (a.ticketId.toLowerCase().includes(needle)) return true;
      if (a.patron.name.toLowerCase().includes(needle)) return true;
      if (a.handler.toLowerCase().includes(needle)) return true;
      if ((a.releasedBy ?? "").toLowerCase().includes(needle)) return true;
      return Object.values(a.fields).some((v) =>
        String(v).toLowerCase().includes(needle),
      );
    });
  }, [rows, q]);

  const hasActiveFilters =
    modeFilter !== "all" || handlerFilter.trim() !== "" || fromDate !== "" || toDate !== "";

  const clearFilters = () => {
    setModeFilter("all");
    setHandlerFilter("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate rounded-full px-2 py-1 mb-3"
        data-testid="link-back-home-history"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Command Center
      </Link>
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center">
            <HistoryIcon className="w-5 h-5 text-lime" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate">
              Released tickets
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              History
            </h1>
          </div>
          <Badge
            variant="outline"
            className="ml-auto border-lime/30 text-lime font-mono"
            data-testid="badge-history-count"
          >
            {list.length}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-slate">
          Look up older tickets for disputes, lost-and-found, and end-of-shift reports.
        </p>
      </header>

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by ticket, patron, handler, or detail..."
          className="pl-9 bg-steel/40 border-white/10 text-white placeholder:text-slate"
          data-testid="input-history-search"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-steel/30 p-3 mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate mr-1">
            Mode
          </span>
          <button
            onClick={() => setModeFilter("all")}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wider hover-elevate ${
              modeFilter === "all"
                ? "border-lime/40 bg-lime/15 text-lime"
                : "border-white/10 bg-steel/40 text-slate"
            }`}
            data-testid="filter-mode-all"
          >
            All
          </button>
          {MODES.map((m) => {
            const Icon = MODE_ICONS[m.id];
            const active = modeFilter === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setModeFilter(m.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wider hover-elevate ${
                  active
                    ? "border-lime/40 bg-lime/15 text-lime"
                    : "border-white/10 bg-steel/40 text-slate"
                }`}
                data-testid={`filter-mode-${m.id}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.short}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate block mb-1">
              Handler
            </label>
            <Input
              value={handlerFilter}
              onChange={(e) => setHandlerFilter(e.target.value)}
              placeholder="e.g. Alex"
              className="bg-steel/40 border-white/10 text-white placeholder:text-slate"
              data-testid="input-handler-filter"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate block mb-1">
              Released from
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-steel/40 border-white/10 text-white"
              data-testid="input-from-date"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate block mb-1">
              Released to
            </label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-steel/40 border-white/10 text-white"
              data-testid="input-to-date"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-slate hover:text-white hover-elevate rounded-full px-3 py-1"
              data-testid="button-clear-filters"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="history-skeleton">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-steel/40 p-4 animate-pulse"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-20 rounded bg-white/10" />
                <div className="h-4 w-14 rounded bg-white/10" />
              </div>
              <div className="h-4 w-32 rounded bg-white/10 mb-3" />
              <div className="h-3 w-40 rounded bg-white/5 mb-2" />
              <div className="h-3 w-28 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-steel/40 flex items-center justify-center mx-auto mb-3">
            <HistoryIcon className="w-5 h-5 text-slate" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">
            {hasActiveFilters || q ? "No matching history" : "No released tickets yet"}
          </h2>
          <p className="text-sm text-slate">
            {hasActiveFilters || q
              ? "Try widening your filters or clearing them."
              : "Once a tag is returned to its patron, it will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="history-list">
          {list.map((a, i) => {
            const Icon = MODE_ICONS[a.mode];
            const cfg = MODE_BY_ID[a.mode];
            return (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.02 }}
                onClick={() => setSelected(a)}
                className="text-left rounded-2xl border border-white/10 bg-steel/40 p-4 hover-elevate"
                data-testid={`card-history-${a.ticketId}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate" />
                    <div className="font-mono text-sm text-lime tracking-wider">
                      {a.ticketId}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] bg-slate/15 text-slate border border-white/10"
                  >
                    RELEASED
                  </Badge>
                </div>
                <div className="text-white font-semibold mb-2">{a.patron.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate">
                      Intake
                    </div>
                    <div className="text-white">{fmtAbs(a.intakeAt)}</div>
                    <div className="text-slate font-mono">{a.handler}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate">
                      Released
                    </div>
                    <div className="text-white">{fmtAbs(a.releasedAt)}</div>
                    <div className="text-slate font-mono">{a.releasedBy ?? "—"}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate font-mono">
                  <span className="uppercase tracking-wider">{cfg.short}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Held {fmtDuration(a.intakeAt, a.releasedAt)}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {isFetching && !isLoading && (
        <div className="text-center text-xs text-slate font-mono mt-4">Refreshing…</div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-obsidian border-l border-white/10 text-white"
        >
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-3">
                  <span className="font-mono text-lime">{selected.ticketId}</span>
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] bg-slate/15 text-slate border border-white/10"
                  >
                    RELEASED
                  </Badge>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wide text-slate">
                      Patron
                    </div>
                    <div className="text-white font-semibold">{selected.patron.name}</div>
                    <div className="text-xs text-slate font-mono">
                      {selected.patron.phone || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wide text-slate">
                      Held for
                    </div>
                    <div className="text-white font-semibold">
                      {fmtDuration(selected.intakeAt, selected.releasedAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wide text-slate">
                      Intake
                    </div>
                    <div className="text-white">{fmtAbs(selected.intakeAt)}</div>
                    <div className="text-xs text-slate font-mono">by {selected.handler}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wide text-slate">
                      Released
                    </div>
                    <div className="text-white">{fmtAbs(selected.releasedAt)}</div>
                    <div className="text-xs text-slate font-mono">
                      by {selected.releasedBy ?? "—"}
                    </div>
                  </div>
                  {MODE_BY_ID[selected.mode].fields.map((f) => (
                    <div key={f.key}>
                      <div className="text-xs font-mono uppercase tracking-wide text-slate">
                        {f.label}
                      </div>
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
                    <div className="text-xs font-mono uppercase tracking-wide text-slate mb-2">
                      Photos
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {selected.photos.map((p, i) => (
                        <img
                          key={i}
                          src={p}
                          alt={`Photo ${i + 1}`}
                          className="rounded-xl border border-white/10 aspect-square object-cover"
                        />
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
