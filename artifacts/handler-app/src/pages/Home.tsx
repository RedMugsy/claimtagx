import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Bell,
  Search,
  PackagePlus,
  ClipboardList,
  Users,
  Camera,
  Nfc,
  QrCode,
  MessageCircle,
  FileEdit,
  Inbox,
  Briefcase,
  Wrench,
  LayoutList,
  Menu,
  Info,
  Settings as SettingsIcon,
  LogOut,
  ChevronUp,
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
import { VENUE_COPY } from "@/lib/modes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FirstSignInTour } from "@/components/handler/FirstSignInTour";

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

export default function Home() {
  const { session, activeVenue, effectiveModes, signOut } = useStore();
  const [, navigate] = useLocation();
  const venueType = activeVenue?.venueType ?? "other";
  const copy = VENUE_COPY[venueType];
  const [now, setNow] = useState(() => Date.now());
  const custodySwipeStart = useRef<{ x: number; y: number; at: number } | null>(
    null,
  );
  const intercomHandleRef = useRef<HTMLDivElement>(null);

  // Non-passive touchmove on the intercom handle so we can preventDefault()
  // and block page scroll while detecting the upward flick.
  useEffect(() => {
    const el = intercomHandleRef.current;
    if (!el) return;
    let start: { x: number; y: number; at: number } | null = null;
    let triggered = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start = { x: t.clientX, y: t.clientY, at: Date.now() };
      triggered = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!start || triggered) return;
      const t = e.touches[0];
      const dy = t.clientY - start.y;
      const dx = t.clientX - start.x;
      const dt = Date.now() - start.at;
      // If the gesture looks upward, block page scroll
      if (dy < -6 && Math.abs(dy) > Math.abs(dx) * 0.5) e.preventDefault();
      const upFlick = dy <= -80 && Math.abs(dy) > Math.abs(dx) * 1.5 && dt <= 700;
      if (upFlick) {
        triggered = true;
        start = null;
        navigate("/intercom");
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (triggered) { triggered = false; start = null; return; }
      if (!start) return;
      const t = e.changedTouches[0];
      const dy = t.clientY - start.y;
      const dx = t.clientX - start.x;
      const dt = Date.now() - start.at;
      start = null;
      const upFlick = dy <= -80 && Math.abs(dy) > Math.abs(dx) * 1.5 && dt <= 700;
      if (upFlick) navigate("/intercom");
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [navigate]);

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

  const handlerName = session?.handlerName ?? "Handler";
  const venueName = session?.venueName ?? activeVenue?.name ?? "Your venue";
  const handlerRole = myShiftHere?.role ?? activeVenue?.role ?? "Handler";

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
    const downSwipe = dy >= 70 && Math.abs(dx) <= 90 && dt <= 550;
    const upSwipe = dy <= -80 && Math.abs(dx) <= 80 && dt <= 550;
    if (rightSwipe) navigate("/custody");
    if (downSwipe) navigate("/assignments/all");
    if (upSwipe) navigate("/intercom");
  };

  return (
    <div
      className="space-y-5"
      onTouchStart={onCommandCenterTouchStart}
      onTouchEnd={onCommandCenterTouchEnd}
      data-testid="gesture-command-center"
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-10 h-10 rounded-2xl border border-white/10 bg-steel/40 flex items-center justify-center hover-elevate"
                data-testid="button-home-hamburger"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4 text-paper" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider text-slate">
                Station
              </DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => navigate("/station")}
                data-testid="menu-home-station"
              >
                <Info className="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {activeVenue?.name ?? session?.venueName ?? "No station"}
                  </div>
                  <div className="text-[10px] font-mono text-slate">
                    {(activeVenue?.code ?? session?.venueCode ?? "—")}
                    {activeVenue?.role ? ` · ${activeVenue.role}` : ""}
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => navigate("/settings")}
                data-testid="menu-home-settings"
              >
                <SettingsIcon className="w-4 h-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => void signOut()}
                data-testid="menu-home-signout"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Greeting + shift card (compact: role moved to top-right, no inline checkout) */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-3xl border border-white/10 bg-steel/40 p-3 sm:p-4"
        data-testid="card-greeting"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate">
              {greeting(today)}
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
              {handlerName}
            </h1>
            <div className="mt-0.5 text-[11px] text-slate" data-testid="text-shift-status">
              {shiftLoading ? (
                "Checking your shift…"
              ) : myShiftHere && checkedInDate ? (
                <>
                  Started at{" "}
                  <span className="text-paper font-semibold">
                    {shiftLabel(checkedInDate)}
                  </span>
                </>
              ) : shiftElsewhere ? (
                <>
                  On shift at{" "}
                  <span className="text-paper font-semibold">
                    {shiftElsewhere.venueCode}
                  </span>
                </>
              ) : (
                "Not on shift."
              )}
            </div>
          </div>

          <div
            className="shrink-0 inline-flex flex-col items-end gap-0.5"
            data-testid="chip-handler-role"
          >
            <div className="text-[9px] font-mono uppercase tracking-wider text-slate">Role</div>
            <div className="rounded-full border border-lime/30 bg-lime/10 px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider text-lime">
              {handlerRole}
            </div>
          </div>
        </div>

        {/* Shift stats */}
        <div className="mt-3 grid grid-cols-3 rounded-2xl border border-white/10 bg-obsidian/40 overflow-hidden">
          <ShiftStat
            label="Worked"
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

      {/* Assignments — 4 icon tiles with badge counts */}
      <section className="rounded-3xl border border-white/10 bg-steel/40 p-4 sm:p-5" data-testid="card-assignments">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate">Assignments</div>
            <InfoTip label="About Assignments">
              All — main house for every assignment at this station, with aging.
            </InfoTip>
          </div>
          <ClipboardList className="w-4 h-4 text-lime" />
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <AssignmentIcon
            to="/assignments/patron"
            Icon={Inbox}
            label="Assignments"
            tone="violet"
            badge={openServicesCount}
            testId="assign-patron"
          />
          <AssignmentIcon
            to="/assignments/supervisor"
            Icon={Briefcase}
            label="Tasks"
            tone="amber"
            badge={0}
            testId="assign-supervisor"
          />
          <AssignmentIcon
            to="/services"
            Icon={Wrench}
            label="Jobs"
            tone="indigo"
            badge={openServicesCount}
            testId="assign-service"
          />
          <AssignmentIcon
            to="/assignments/all"
            Icon={LayoutList}
            label="All"
            tone="lime"
            badge={openServicesCount}
            testId="assign-all"
          />
        </div>
      </section>

      {/* Command Station — circular hub: top half = capture (Manual/Camera),
          bottom half = quick-issue ClaimTag (NFC/BLE, QR, SMS/WA) */}
      <CommandStation
        onManual={() => navigate("/intake")}
        onCamera={() => navigate("/release")}
        onNfc={() => navigate("/issue/nfc")}
        onQr={() => navigate("/issue/qr")}
        onSms={() => navigate("/issue/sms")}
        modeCount={effectiveModes.length}
      />

      {/* First-sign-in gesture tour (one-time, gated by localStorage) */}
      <FirstSignInTour />

      {/* Intercom pull-up handle — non-passive touchmove attached via useEffect */}
      <div
        ref={intercomHandleRef}
        className="flex flex-col items-center gap-2 py-4 select-none touch-pan-x"
        data-testid="intercom-pull-handle"
        aria-label="Swipe up to open Intercom"
      >
        <ChevronUp className="w-5 h-5 text-slate/50" />
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate/50">
          <MessageCircle className="w-3 h-3" />
          Swipe up for intercom
        </div>
        <div className="w-10 h-1 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

function CommandStation({
  onManual,
  onCamera,
  onNfc,
  onQr,
  onSms,
  modeCount,
}: {
  onManual: () => void;
  onCamera: () => void;
  onNfc: () => void;
  onQr: () => void;
  onSms: () => void;
  modeCount: number;
}) {
  // Top half (180° → 360° in SVG y-down coords): two equal 90° sectors
  //   - Manual  : 180° → 270°  (top-left)
  //   - Camera  : 270° → 360°  (top-right)
  // Bottom half (0° → 180°): three equal 60° sectors — quick-issue ClaimTag
  //   - NFC/BLE : 0°   → 60°   (bottom-right)
  //   - QR Code : 60°  → 120°  (bottom-center)
  //   - SMS/WA  : 120° → 180°  (bottom-left)
  const cx = 100;
  const cy = 100;
  const r = 100;

  const wedge = (a1: number, a2: number) => {
    const toXY = (deg: number) => {
      const rad = (deg * Math.PI) / 180;
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
    };
    const [x1, y1] = toXY(a1);
    const [x2, y2] = toXY(a2);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  };

  const sectors = [
    // Top — capture modes
    {
      d: wedge(180, 270),
      fill: "fill-violet-500/15 hover:fill-violet-500/30",
      stroke: "stroke-violet-300/40",
      onClick: onManual,
      label: "Open manual capture form",
      testId: "cmd-station-manual",
      // Centroid of 90° wedge bisected at 225° → ~(58, 58) in viewBox
      labelLeft: "29%",
      labelTop: "29%",
      Icon: FileEdit,
      iconCls: "text-violet-200",
      caption: "Manual",
    },
    {
      d: wedge(270, 360),
      fill: "fill-lime/15 hover:fill-lime/30",
      stroke: "stroke-lime/40",
      onClick: onCamera,
      label: "Open camera capture",
      testId: "cmd-station-camera",
      // Centroid bisected at 315° → ~(142, 58)
      labelLeft: "71%",
      labelTop: "29%",
      Icon: Camera,
      iconCls: "text-lime",
      caption: "Camera",
    },
    // Bottom — quick-issue (capture-after) modes
    {
      d: wedge(120, 180),
      fill: "fill-emerald-500/15 hover:fill-emerald-500/30",
      stroke: "stroke-emerald-300/40",
      onClick: onSms,
      label: "Issue ClaimTag via SMS or WhatsApp",
      testId: "cmd-station-sms",
      // 60° wedge bisected at 150° → ~(45, 132)
      labelLeft: "22%",
      labelTop: "66%",
      Icon: MessageCircle,
      iconCls: "text-emerald-200",
      caption: "SMS/WA",
    },
    {
      d: wedge(60, 120),
      fill: "fill-amber-500/15 hover:fill-amber-500/30",
      stroke: "stroke-amber-300/40",
      onClick: onQr,
      label: "Issue ClaimTag via QR code",
      testId: "cmd-station-qr",
      // bisect 90° → (100, 164)
      labelLeft: "50%",
      labelTop: "82%",
      Icon: QrCode,
      iconCls: "text-amber-200",
      caption: "QR Code",
    },
    {
      d: wedge(0, 60),
      fill: "fill-indigo-500/15 hover:fill-indigo-500/30",
      stroke: "stroke-indigo-300/40",
      onClick: onNfc,
      label: "Issue ClaimTag via NFC or BLE",
      testId: "cmd-station-nfc",
      // bisect 30° → ~(155, 132)
      labelLeft: "78%",
      labelTop: "66%",
      Icon: Nfc,
      iconCls: "text-indigo-200",
      caption: "NFC/BLE",
    },
  ];

  return (
    <div
      className="flex flex-col items-center"
      data-testid="card-command-station"
    >
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-1.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
            Command Station
          </div>
          <InfoTip label="About the Command Station">
            Top — capture asset, then issue. Bottom — issue ClaimTag now,
            capture after.
          </InfoTip>
        </div>
        <div
          className="text-[10px] font-mono uppercase tracking-wider text-slate"
          data-testid="text-active-modes"
        >
          <span className="text-paper font-bold">{modeCount}</span> active modes
        </div>
      </div>

      <div className="relative w-60 h-60 sm:w-72 sm:h-72">
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 w-full h-full"
          aria-label="Command station dial"
        >
          {/* Full base disc */}
          <circle cx={cx} cy={cy} r={r} className="fill-obsidian/60 stroke-white/10" strokeWidth={1} />

          {/* Five interactive sectors — 2 capture on top, 3 quick-issue on bottom */}
          {sectors.map((s) => (
            <path
              key={s.testId}
              d={s.d}
              role="button"
              tabIndex={0}
              aria-label={s.label}
              data-testid={s.testId}
              onClick={s.onClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  s.onClick();
                }
              }}
              className={`cursor-pointer transition-colors ${s.fill} ${s.stroke}`}
              strokeWidth={1}
            />
          ))}

          {/* Diameter separator */}
          <line x1={0} y1={cy} x2={200} y2={cy} className="stroke-white/15" strokeWidth={1} />
        </svg>

        {/* Sector labels (HTML overlay so we can use lucide icons + Tailwind) */}
        {sectors.map((s) => (
          <div
            key={`${s.testId}-label`}
            className="absolute pointer-events-none flex flex-col items-center text-center"
            style={{ left: s.labelLeft, top: s.labelTop, transform: "translate(-50%, -50%)" }}
          >
            <s.Icon className={`w-5 h-5 ${s.iconCls}`} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-paper mt-0.5">
              {s.caption}
            </span>
          </div>
        ))}

        {/* Center hub disc */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-lime/30 bg-obsidian flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <PackagePlus className="w-5 h-5 text-lime" />
        </div>
      </div>

      <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-slate text-center max-w-xs sr-only">
        Top — capture asset, then issue. Bottom — issue ClaimTag now, capture after.
      </div>
    </div>
  );
}

function AssignmentIcon({
  to,
  Icon,
  label,
  tone,
  badge,
  testId,
}: {
  to: string;
  Icon: typeof PackagePlus;
  label: string;
  tone: "lime" | "indigo" | "amber" | "violet" | "emerald" | "rose";
  badge?: number;
  testId: string;
}) {
  const toneCls =
    tone === "lime"
      ? "border-lime/30 bg-lime/10 text-lime"
      : tone === "indigo"
      ? "border-indigo-400/30 bg-indigo-500/10 text-indigo-300"
      : tone === "amber"
      ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
      : tone === "violet"
      ? "border-violet-400/30 bg-violet-500/10 text-violet-300"
      : tone === "emerald"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
      : "border-rose-400/30 bg-rose-500/10 text-rose-300";
  const showBadge = typeof badge === "number" && badge > 0;
  return (
    <Link
      href={to}
      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 hover-elevate ${toneCls}`}
      data-testid={`tile-${testId}`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-mono uppercase tracking-wider text-paper truncate max-w-full">
        {label}
      </span>
      {showBadge && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center border border-obsidian">
          {badge}
        </span>
      )}
    </Link>
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

function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate hover:text-paper transition-colors"
          data-testid={`tip-${label.replace(/\s+/g, "-").toLowerCase()}`}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[16rem] text-[11px] leading-snug normal-case tracking-normal">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
