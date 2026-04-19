import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bell,
  Search,
  CloudSun,
  PackagePlus,
  ScanLine,
  ClipboardList,
  History as HistoryIcon,
  MessageSquare,
  Radio,
  ConciergeBell,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { MODES, MODE_ICONS } from "@/lib/modes";
import { Badge } from "@/components/ui/badge";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatHm(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${pad(h)}:${pad(m)}`;
}

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
}

function shiftLabel(start: Date) {
  return start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const SHIFT_TARGET_HOURS = 8;

const WEEKDAYS: Array<{ key: number; short: string; long: string; icon: string }> = [
  { key: 1, short: "Mon", long: "Monday", icon: "☀️" },
  { key: 2, short: "Tue", long: "Tuesday", icon: "⛅" },
  { key: 3, short: "Wed", long: "Wednesday", icon: "🌤️" },
  { key: 4, short: "Thu", long: "Thursday", icon: "🌧️" },
  { key: 5, short: "Fri", long: "Friday", icon: "⛅" },
  { key: 6, short: "Sat", long: "Saturday", icon: "☀️" },
];

interface Tile {
  to: string;
  label: string;
  Icon: typeof PackagePlus;
  tone: "lime" | "indigo" | "amber" | "violet" | "emerald" | "rose";
  badge?: string;
}

const toneClasses: Record<Tile["tone"], string> = {
  lime: "bg-lime/15 text-lime border-lime/30",
  indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  violet: "bg-violet-500/15 text-violet-300 border-violet-400/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  rose: "bg-rose-500/15 text-rose-300 border-rose-400/30",
};

export default function Home() {
  const { session, assets, activeVenue } = useStore();
  const [now, setNow] = useState(() => Date.now());

  // Establish a stable check-in time per browser session so the timer reads naturally.
  const [checkedInAt] = useState<number>(() => {
    try {
      const raw = sessionStorage.getItem("ctx_checked_in_at");
      if (raw) {
        const n = parseInt(raw, 10);
        if (Number.isFinite(n)) return n;
      }
    } catch {
      // ignore
    }
    const t = Date.now();
    try {
      sessionStorage.setItem("ctx_checked_in_at", String(t));
    } catch {
      // ignore
    }
    return t;
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => window.clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    const active = assets.filter((a) => a.status === "active");
    const released = assets.filter((a) => a.status === "released");
    const byMode = MODES.map((m) => ({
      mode: m,
      active: active.filter((a) => a.mode === m.id).length,
      released: released.filter((a) => a.mode === m.id).length,
    }));
    return { active: active.length, released: released.length, byMode };
  }, [assets]);

  const checkedInDate = new Date(checkedInAt);
  const elapsed = Math.max(0, now - checkedInAt);
  const target = SHIFT_TARGET_HOURS * 3600 * 1000;
  const remaining = Math.max(0, target - elapsed);
  const overtime = Math.max(0, elapsed - target);

  const today = new Date(now);
  const todayWeekdayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1; // Mon-first

  const handlerName = session?.handlerName ?? "Handler";
  const venueName = session?.venueName ?? activeVenue?.name ?? "Your venue";

  const primaryTiles: Tile[] = [
    {
      to: "/intake",
      label: "Check-in",
      Icon: PackagePlus,
      tone: "lime",
    },
    {
      to: "/release",
      label: "Check-out",
      Icon: ScanLine,
      tone: "rose",
    },
    {
      to: "/custody",
      label: "In custody",
      Icon: ClipboardList,
      tone: "indigo",
      badge: counts.active > 0 ? String(counts.active) : undefined,
    },
  ];

  const secondaryTiles: Tile[] = [
    {
      to: "/services",
      label: "Services",
      Icon: ConciergeBell,
      tone: "violet",
    },
    {
      to: "/messages",
      label: "Messages",
      Icon: MessageSquare,
      tone: "amber",
    },
    {
      to: "/intercom",
      label: "Intercom",
      Icon: Radio,
      tone: "emerald",
    },
    {
      to: "/history",
      label: "History",
      Icon: HistoryIcon,
      tone: "indigo",
      badge: counts.released > 0 ? String(counts.released) : undefined,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div className="leading-tight">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
            Command Center
          </div>
          <div className="text-sm font-semibold text-white truncate max-w-[14rem]">
            {venueName}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-10 h-10 rounded-2xl border border-white/10 bg-steel/40 flex items-center justify-center hover-elevate"
            data-testid="button-notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-paper" />
          </button>
          <Link
            href="/release"
            className="w-10 h-10 rounded-2xl border border-white/10 bg-steel/40 flex items-center justify-center hover-elevate"
            data-testid="button-quick-search"
            aria-label="Quick search"
          >
            <Search className="w-4 h-4 text-paper" />
          </Link>
        </div>
      </div>

      {/* Greeting + shift card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-3xl border border-white/10 bg-steel/40 p-4 sm:p-5"
        data-testid="card-greeting"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono uppercase tracking-wider text-slate">
              {greeting(today)}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
              {handlerName}
            </h1>
            <div className="mt-1 text-xs text-slate">
              You checked in at{" "}
              <span className="text-paper font-semibold">{shiftLabel(checkedInDate)}</span>
            </div>
          </div>

          {/* Mini week / weather strip */}
          <div className="hidden sm:flex flex-col items-stretch gap-1 rounded-2xl border border-white/10 bg-obsidian/50 px-2 py-2 text-[10px] font-mono">
            {WEEKDAYS.map((d, i) => {
              const isToday = i === todayWeekdayIdx;
              return (
                <div
                  key={d.key}
                  className={`flex items-center gap-2 px-1 ${
                    isToday ? "text-lime" : "text-slate"
                  }`}
                >
                  <span className="w-6 uppercase">{d.short}</span>
                  <span>{d.icon}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shift stats */}
        <div className="mt-4 grid grid-cols-3 rounded-2xl border border-white/10 bg-obsidian/40 overflow-hidden">
          <ShiftStat label="Time worked" value={formatHm(elapsed)} tone="lime" />
          <ShiftStat label="Remaining" value={formatHm(remaining)} tone="paper" />
          <ShiftStat
            label="Over time"
            value={formatHm(overtime)}
            tone={overtime > 0 ? "rose" : "slate"}
            last
          />
        </div>
      </motion.div>

      {/* Mode counter strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {counts.byMode.map((row, i) => {
          const Icon = MODE_ICONS[row.mode.id];
          return (
            <motion.div
              key={row.mode.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="rounded-2xl border border-white/10 bg-steel/40 p-3"
              data-testid={`tile-count-${row.mode.id}`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className="w-4 h-4 text-lime" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate">
                  {row.mode.short}
                </span>
              </div>
              <div className="text-2xl font-extrabold text-white leading-tight">
                {row.active}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate">
                in custody
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Primary action tiles */}
      <div className="grid grid-cols-3 gap-3">
        {primaryTiles.map((t, i) => (
          <ActionTile key={t.to} tile={t} index={i} large />
        ))}
      </div>

      {/* Secondary action tiles */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
            More
          </div>
          <Link
            href="/settings"
            className="text-[11px] font-mono uppercase tracking-wider text-slate hover:text-paper flex items-center gap-1 hover-elevate rounded-full px-2 py-0.5"
            data-testid="link-settings-from-home"
          >
            Settings <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {secondaryTiles.map((t, i) => (
            <ActionTile key={t.to} tile={t} index={i} />
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="rounded-2xl border border-white/10 bg-steel/30 px-4 py-3 flex items-center gap-3">
        <CloudSun className="w-5 h-5 text-lime shrink-0" />
        <div className="text-xs text-slate leading-snug">
          Tip — tap{" "}
          <Link href="/intake" className="text-paper font-semibold underline">
            Check-in
          </Link>{" "}
          to log a new asset, or{" "}
          <Link href="/release" className="text-paper font-semibold underline">
            Check-out
          </Link>{" "}
          to scan a tag and return one.
        </div>
      </div>
    </div>
  );
}

function ShiftStat({
  label,
  value,
  tone,
  last,
}: {
  label: string;
  value: string;
  tone: "lime" | "paper" | "rose" | "slate";
  last?: boolean;
}) {
  const toneCls =
    tone === "lime"
      ? "text-lime"
      : tone === "rose"
      ? "text-rose-300"
      : tone === "slate"
      ? "text-slate"
      : "text-white";
  return (
    <div className={`px-3 py-2 ${last ? "" : "border-r border-white/10"}`}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate">
        {label}
      </div>
      <div className={`text-lg font-extrabold font-mono tracking-wider ${toneCls}`}>
        {value}
      </div>
    </div>
  );
}

function ActionTile({
  tile,
  index,
  large,
}: {
  tile: Tile;
  index: number;
  large?: boolean;
}) {
  const { Icon } = tile;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link
        href={tile.to}
        className={`relative block rounded-3xl border bg-steel/40 hover-elevate transition-colors ${
          large ? "aspect-square" : "aspect-[1.15/1]"
        } ${toneClasses[tile.tone]}`}
        data-testid={`tile-action-${tile.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
          <Icon className={`${large ? "w-9 h-9" : "w-7 h-7"}`} />
          <div className="text-sm font-semibold text-white">{tile.label}</div>
        </div>
        {tile.badge && (
          <div className="absolute top-2 right-2">
            <Badge
              className="font-mono text-[10px] bg-rose-500 text-white border-0"
              data-testid={`badge-${tile.label.toLowerCase()}`}
            >
              {tile.badge}
            </Badge>
          </div>
        )}
      </Link>
    </motion.div>
  );
}

