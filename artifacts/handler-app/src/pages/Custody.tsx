import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { MODE_BY_ID, MODE_ICONS } from "@/lib/modes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { QrTag } from "@/components/handler/QrTag";
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
  const { mode, assets } = useStore();
  const cfg = MODE_BY_ID[mode];
  const ModeIcon = MODE_ICONS[mode];
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CustodyAsset | null>(null);
  const [ageFilter, setAgeFilter] = useState<"all" | "recent" | "stale">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
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
      active = active.filter((a) => {
        const ageMin = (now - a.intakeAt) / 60000;
        return ageFilter === "recent" ? ageMin < 60 : ageMin >= 60;
      });
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
  }, [assets, mode, q, ageFilter, sort]);

  const allActive = useMemo(
    () => assets.filter((a) => a.mode === mode && a.status === "active"),
    [assets, mode]
  );
  const recentCount = useMemo(
    () => allActive.filter((a) => (Date.now() - a.intakeAt) / 60000 < 60).length,
    [allActive]
  );
  const staleCount = allActive.length - recentCount;

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
              {cfg.label} on hand
            </h1>
          </div>
          <Badge variant="outline" className="ml-auto border-lime/30 text-lime font-mono">
            {list.length}
          </Badge>
        </div>
      </header>

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
          { id: "all", label: "All", count: allActive.length },
          { id: "recent", label: "< 1h", count: recentCount },
          { id: "stale", label: "≥ 1h", count: staleCount },
        ] as const).map((f) => {
          const active = ageFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setAgeFilter(f.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wider hover-elevate ${
                active
                  ? "border-lime/40 bg-lime/15 text-lime"
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
          {list.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
              onClick={() => setSelected(a)}
              className="text-left rounded-2xl border border-white/10 bg-steel/40 p-4 hover-elevate"
              data-testid={`card-asset-${a.ticketId}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-sm text-lime tracking-wider">{a.ticketId}</div>
                <Badge variant="secondary" className="font-mono text-[10px] bg-lime/10 text-lime border border-lime/20">
                  ACTIVE
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
          ))}
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
