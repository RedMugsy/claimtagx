import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Bell,
  Search,
  CloudSun,
  PackagePlus,
  ClipboardList,
  Radio,
  ConciergeBell,
  ChevronRight,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getActiveShift,
  getGetActiveShiftQueryKey,
  getGetOpenServiceCountQueryKey,
  getListActiveVenueShiftsQueryKey,
  getOpenServiceCount,
  listActiveVenueShifts,
  type Shift,
} from "@workspace/api-client-react";
import { useStore } from "@/lib/store";
import { MODES, MODE_ICONS, VENUE_COPY } from "@/lib/modes";
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
  const { session, assets, activeVenue, mode, effectiveModes, authorization } = useStore();
  const [, navigate] = useLocation();
  const venueType = activeVenue?.venueType ?? "other";
  const copy = VENUE_COPY[venueType];
  const [now, setNow] = useState(() => Date.now());
  const custodySwipeStart = useRef<{ x: number; y: number; at: number } | null>(
    null,
  );
  const intercomSwipeStart = useRef<{ x: number; y: number; at: number } | null>(
    null,
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => window.clearInterval(id);
  }, []);

  // Active shift for the signed-in handler (across all venues — there can
  // only be one). Survives refresh and follows the handler to other devices
  // because it lives in the database, not sessionStorage.
  const activeShiftQuery = useQuery({
    queryKey: getGetActiveShiftQueryKey(),
    queryFn: () => getActiveShift(),
    enabled: Boolean(session),
    staleTime: 30_000,
  });
  const myShift: Shift | null = activeShiftQuery.data?.shift ?? null;

  // Other handlers currently on shift at this venue, so the team can see
  // who's covering without asking.
  const venueCode = activeVenue?.code ?? "";
  const venueShiftsQuery = useQuery({
    queryKey: getListActiveVenueShiftsQueryKey(venueCode),
    queryFn: () => listActiveVenueShifts(venueCode),
    enabled: Boolean(venueCode),
    staleTime: 30_000,
  });
  const venueShifts = venueShiftsQuery.data ?? [];

  // Live counts for the secondary tile badges. Lightweight scalar endpoints
  // so we can poll them without paying for full list fetches.
  const openServicesQuery = useQuery({
    queryKey: getGetOpenServiceCountQueryKey(venueCode),
    queryFn: () => getOpenServiceCount(venueCode),
    enabled: Boolean(venueCode),
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
  const openServicesCount = openServicesQuery.data?.count ?? 0;

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

  // Authorization-safe mode strip: handlers should only see UI for the mode
  // their active venue is configured for (e.g. valet => vehicles only).
  const visibleModeRows = useMemo(
    () => counts.byMode.filter((row) => effectiveModes.includes(row.mode.id)),
    [counts.byMode, effectiveModes],
  );

  const myShiftHere =
    myShift && venueCode && myShift.venueCode === venueCode ? myShift : null;
  const teammatesOnShift = venueShifts.filter(
    (s) => !myShiftHere || s.id !== myShiftHere.id,
  );

  const checkedInDate = myShiftHere ? new Date(myShiftHere.startedAt) : null;
  const elapsed = myShiftHere ? Math.max(0, now - myShiftHere.startedAt) : 0;
  const target = (myShiftHere?.targetMinutes ?? 480) * 60 * 1000;
  const remaining = myShiftHere ? Math.max(0, target - elapsed) : 0;
  const overtime = myShiftHere ? Math.max(0, elapsed - target) : 0;

  const today = new Date(now);
  const todayWeekdayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1; // Mon-first

  const handlerName = session?.handlerName ?? "Handler";
  const venueName = session?.venueName ?? activeVenue?.name ?? "Your venue";

  const secondaryTiles: Tile[] = [
    {
      to: "/services",
      label: "Services",
      Icon: ConciergeBell,
      tone: "violet",
      badge: openServicesCount > 0 ? String(openServicesCount) : undefined,
    },
  ];

  const shiftLoading = activeShiftQuery.isLoading;

  // If the user has an active shift at a different venue, surface that so
  // they understand why "Start shift" is unavailable here.
  const shiftElsewhere =
    myShift && venueCode && myShift.venueCode !== venueCode ? myShift : null;

  if (!shiftLoading && !myShiftHere) {
    return <Redirect to="/pre-shift" />;
  }

  if (!shiftLoading && effectiveModes.length === 0) {
    return (
      <section className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5" data-testid="panel-authorization-denied-home">
        <div className="text-[11px] font-mono uppercase tracking-wider text-amber-200">Authorization</div>
        <h1 className="text-xl font-extrabold text-white tracking-tight mt-1">No authorized asset classes for this station</h1>
        <p className="mt-2 text-sm text-amber-100/90 leading-relaxed">
          Your handler authorization and station capability matrix currently have no overlap.
          Ask a supervisor to update your mode permissions.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/station" className="inline-flex items-center rounded-xl border border-white/10 bg-obsidian/40 px-3 py-1.5 text-xs font-semibold text-paper hover-elevate">
            Open station details
          </Link>
          <Link href="/settings" className="inline-flex items-center rounded-xl border border-white/10 bg-obsidian/40 px-3 py-1.5 text-xs font-semibold text-paper hover-elevate">
            Open settings
          </Link>
        </div>
      </section>
    );
  }

  const onCommandCenterTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    custodySwipeStart.current = { x: t.clientX, y: t.clientY, at: Date.now() };
  };

  const onCommandCenterTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = custodySwipeStart.current;
    custodySwipeStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.at;
    const rightSwipe = dx >= 70 && Math.abs(dy) <= 90 && dt <= 550;
    if (rightSwipe) navigate("/custody");
  };

  const onIntercomTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    intercomSwipeStart.current = { x: t.clientX, y: t.clientY, at: Date.now() };
  };

  const onIntercomTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = intercomSwipeStart.current;
    intercomSwipeStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.at;
    const upFlick = dy <= -65 && Math.abs(dx) <= 90 && dt <= 550;
    if (upFlick) navigate("/intercom");
  };

  return (
    <div
      className="space-y-5"
      onTouchStart={onCommandCenterTouchStart}
      onTouchEnd={onCommandCenterTouchEnd}
      data-testid="gesture-custody-right-swipe"
    >
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div className="leading-tight">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
            {copy.homeTitle}
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

      {authorization.usingDerivedDefaults && (
        <section className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3" data-testid="banner-derived-authorization-home">
          <div className="text-[11px] font-mono uppercase tracking-wider text-amber-200">Authorization source</div>
          <div className="text-xs text-amber-100/90 mt-1 leading-relaxed">
            Station capabilities and/or handler authorizations are currently inferred from venue type/role defaults.
            Explicit capability matrix data from backend will override this automatically.
          </div>
        </section>
      )}

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
            <div className="mt-1 text-xs text-slate" data-testid="text-shift-status">
              {shiftLoading ? (
                "Checking your shift…"
              ) : myShiftHere && checkedInDate ? (
                <>
                  You started this shift at{" "}
                  <span className="text-paper font-semibold">
                    {shiftLabel(checkedInDate)}
                  </span>
                </>
              ) : shiftElsewhere ? (
                <>
                  You're on shift at{" "}
                  <span className="text-paper font-semibold">
                    {shiftElsewhere.venueCode}
                  </span>{" "}
                  — end it there to start one here.
                </>
              ) : (
                "You're not on shift yet."
              )}
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
          <ShiftStat
            label="Time worked"
            value={myShiftHere ? formatHm(elapsed) : "--:--"}
            tone={myShiftHere ? "lime" : "slate"}
          />
          <ShiftStat
            label="Remaining"
            value={myShiftHere ? formatHm(remaining) : "--:--"}
            tone={myShiftHere ? "paper" : "slate"}
          />
          <ShiftStat
            label="Over time"
            value={myShiftHere ? formatHm(overtime) : "--:--"}
            tone={myShiftHere && overtime > 0 ? "rose" : "slate"}
            last
          />
        </div>

        {/* Start / end shift control */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate">
            {myShiftHere ? `Role: ${myShiftHere.role}` : "No active shift"}
          </div>
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/15 text-rose-200 px-3 py-1.5 text-xs font-semibold hover-elevate"
            data-testid="link-shift-checkout"
          >
            Checkout / End shift
          </Link>
        </div>

        {/* Teammates currently on shift here */}
        {teammatesOnShift.length > 0 && (
          <div
            className="mt-3 rounded-2xl border border-white/10 bg-obsidian/40 p-3"
            data-testid="card-teammates-on-shift"
          >
            <div className="flex items-center gap-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate">
              <Users className="w-3.5 h-3.5 text-lime" />
              On shift now ({teammatesOnShift.length})
            </div>
            <ul className="space-y-1">
              {teammatesOnShift.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between text-xs text-paper"
                  data-testid={`row-teammate-${s.handlerUserId}`}
                >
                  <span className="truncate">
                    <span className="font-semibold">{s.handlerName}</span>{" "}
                    <span className="text-slate">· {s.role}</span>
                  </span>
                  <span className="font-mono text-slate">
                    since {shiftLabel(new Date(s.startedAt))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* Assignments snapshot */}
      <section className="rounded-3xl border border-white/10 bg-steel/40 p-4 sm:p-5" data-testid="card-assignments-snapshot">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate">Assignments</div>
          <ClipboardList className="w-4 h-4 text-lime" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <AssignmentCell
            title="Patron requests"
            subtitle="Ticket-based asks"
            value={String(openServicesCount)}
          />
          <AssignmentCell
            title="Supervisor tasks"
            subtitle="Manual + asset-linked"
            value="Pending"
          />
          <AssignmentCell
            title="Service jobs"
            subtitle="Ops/clean/prep"
            value={String(openServicesCount)}
          />
        </div>
      </section>

      {/* Mode counter strip: only show authorized mode(s) for the active
          venue. A valet handler should never see baggage/cloakroom/retail
          cards in Command Center. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visibleModeRows.map((row, i) => {
          const Icon = MODE_ICONS[row.mode.id];
          return (
            <motion.div
              key={row.mode.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="rounded-2xl border p-3 border-lime/40 bg-lime/10"
              data-testid={`tile-count-${row.mode.id}`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className="w-4 h-4 text-lime" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate">
                  {copy.custodyTileLabel}
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

      {/* End-of-page intercom gesture surface: flick up to open intercom. */}
      {/* End-of-page intercom pull surface: swipe/flick upward to pull the
          intercom page from the bottom. */}
      <div
        className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3"
        onTouchStart={onIntercomTouchStart}
        onTouchEnd={onIntercomTouchEnd}
        data-testid="gesture-intercom-pull-up"
      >
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-emerald-300/35" aria-hidden="true" />
        <div className="flex items-center justify-center gap-2 min-w-0">
          <Radio className="w-5 h-5 text-emerald-300 shrink-0" />
          <div className="min-w-0 text-center">
            <div className="text-sm font-semibold text-white">Intercom</div>
            <div className="text-xs text-slate truncate">Swipe up from here to pull up Intercom</div>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="rounded-2xl border border-white/10 bg-steel/30 px-4 py-3 flex items-center gap-3">
        <CloudSun className="w-5 h-5 text-lime shrink-0" />
        <div className="text-xs text-slate leading-snug">
          Tip — use the Scan tab to log a new asset or return one. Swipe right anywhere on this page to open custody.
        </div>
      </div>
    </div>
  );
}

function AssignmentCell({
  title,
  subtitle,
  value,
}: {
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-obsidian/40 p-3">
      <div className="text-xs text-white font-semibold truncate">{title}</div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate mt-0.5">{subtitle}</div>
      <div className="mt-2 text-lg font-extrabold text-white">{value}</div>
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
