import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  CalendarClock,
  LogOut,
  Settings as SettingsIcon,
  User,
} from "lucide-react";
import { getActiveShift, getGetActiveShiftQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { MODE_BY_ID } from "@/lib/modes";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatHm(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${pad(h)}:${pad(m)}`;
}

function getWindowStart(window: "day" | "week" | "month" | "year") {
  const now = Date.now();
  if (window === "day") return now - 24 * 60 * 60 * 1000;
  if (window === "week") return now - 7 * 24 * 60 * 60 * 1000;
  if (window === "month") return now - 30 * 24 * 60 * 60 * 1000;
  return now - 365 * 24 * 60 * 60 * 1000;
}

export default function Settings() {
  const { session, signOut, assets, mode, activeVenue, authorization } = useStore();
  const [attendanceWindow, setAttendanceWindow] = useState<"day" | "week" | "month">("day");
  const [performanceWindow, setPerformanceWindow] = useState<"day" | "week" | "month" | "year">("day");

  const activeShiftQuery = useQuery({
    queryKey: getGetActiveShiftQueryKey(),
    queryFn: () => getActiveShift(),
    staleTime: 30_000,
  });

  const shift = activeShiftQuery.data?.shift ?? null;

  const attendance = useMemo(() => {
    const now = Date.now();
    const start = getWindowStart(attendanceWindow);
    const hasShiftInWindow = shift && shift.startedAt >= start;
    const workedMs = hasShiftInWindow ? now - shift.startedAt : 0;
    const targetMs = (shift?.targetMinutes ?? 480) * 60 * 1000;
    return {
      onShift: Boolean(shift),
      worked: formatHm(workedMs),
      target: formatHm(targetMs),
      overtime: formatHm(Math.max(0, workedMs - targetMs)),
      remaining: formatHm(Math.max(0, targetMs - workedMs)),
    };
  }, [attendanceWindow, shift]);

  const performance = useMemo(() => {
    const start = getWindowStart(performanceWindow);
    const myName = (session?.handlerName ?? "").trim().toLowerCase();
    const myEmail = (session?.email ?? "").trim().toLowerCase();
    const scoped = assets.filter((a) => a.mode === mode);
    const checkedIns = scoped.filter(
      (a) => a.intakeAt >= start && a.handler.trim().toLowerCase() === myName,
    );
    const checkedOuts = scoped.filter(
      (a) =>
        a.releasedAt != null &&
        a.releasedAt >= start &&
        (() => {
          const by = (a.releasedBy ?? "").trim().toLowerCase();
          return by === myName || by === myEmail;
        })(),
    );
    const inCustodyNow = scoped.filter((a) => a.status === "active").length;
    const completionRate =
      checkedIns.length > 0
        ? Math.round((checkedOuts.length / checkedIns.length) * 100)
        : 0;

    return {
      checkedIns: checkedIns.length,
      checkedOuts: checkedOuts.length,
      inCustodyNow,
      completionRate,
    };
  }, [performanceWindow, assets, mode, session?.handlerName, session?.email]);

  const modeLabel = MODE_BY_ID[mode].label;

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-lime" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate">Shift</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Settings</h1>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-steel/40 p-6">
          <h2 className="text-sm font-mono uppercase tracking-wide text-slate mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wide text-slate">Name</div>
              <div className="text-white font-semibold">{session?.handlerName}</div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wide text-slate">Email</div>
              <div className="text-white font-mono">{session?.email}</div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wide text-slate">Station</div>
              <div className="text-white font-semibold">{activeVenue?.name ?? session?.venueName}</div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wide text-slate">Asset class</div>
              <div className="text-white font-semibold">{modeLabel}</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-obsidian/40 p-3 text-xs space-y-1">
            <div className="text-slate">Station capabilities: <span className="text-paper font-mono">{authorization.stationModes.join(", ") || "none"}</span></div>
            <div className="text-slate">Your authorizations: <span className="text-paper font-mono">{authorization.handlerModes.join(", ") || "none"}</span></div>
            <div className="text-slate">Effective access: <span className="text-lime font-mono">{authorization.effectiveModes.join(", ") || "none"}</span></div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-steel/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-mono uppercase tracking-wide text-slate flex items-center gap-2">
              <CalendarClock className="w-4 h-4" /> Attendance overview
            </h2>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-obsidian/50 p-1">
              {(["day", "week", "month"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setAttendanceWindow(w)}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider hover-elevate ${
                    attendanceWindow === w ? "bg-lime/15 text-lime" : "text-slate"
                  }`}
                  data-testid={`attendance-window-${w}`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <MetricTile label="On shift" value={attendance.onShift ? "Yes" : "No"} tone={attendance.onShift ? "lime" : undefined} />
            <MetricTile label="Worked" value={attendance.worked} />
            <MetricTile label="Target" value={attendance.target} />
            <MetricTile label="Remaining" value={attendance.remaining} />
            <MetricTile label="Overtime" value={attendance.overtime} tone="rose" />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-steel/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-mono uppercase tracking-wide text-slate flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Performance overview
            </h2>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-obsidian/50 p-1">
              {(["day", "week", "month", "year"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setPerformanceWindow(w)}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider hover-elevate ${
                    performanceWindow === w ? "bg-lime/15 text-lime" : "text-slate"
                  }`}
                  data-testid={`performance-window-${w}`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricTile label="Check-ins" value={String(performance.checkedIns)} />
            <MetricTile label="Check-outs" value={String(performance.checkedOuts)} />
            <MetricTile label="In custody now" value={String(performance.inCustodyNow)} />
            <MetricTile
              label="Completion rate"
              value={`${performance.completionRate}%`}
              tone="emerald"
            />
          </div>
          <div className="mt-3 text-[11px] text-slate inline-flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Live snapshot from current shift and custody activity.
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-steel/40 p-6 flex items-center justify-between">
          <div>
            <div className="text-white font-semibold">Sign out</div>
            <div className="text-sm text-slate">Log out of the handler app on this device.</div>
          </div>
          <Button
            variant="secondary"
            onClick={() => void signOut()}
            data-testid="button-signout"
            className="border-red-500/30 text-red-300 hover:text-red-200"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </section>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "lime" | "emerald" | "rose";
}) {
  const toneCls =
    tone === "lime"
      ? "border-lime/30 bg-lime/10"
      : tone === "emerald"
      ? "border-emerald-400/30 bg-emerald-500/10"
      : tone === "rose"
      ? "border-rose-400/30 bg-rose-500/10"
      : "border-white/10 bg-obsidian/40";

  const valueCls =
    tone === "lime"
      ? "text-lime"
      : tone === "emerald"
      ? "text-emerald-300"
      : tone === "rose"
      ? "text-rose-300"
      : "text-white";

  return (
    <div className={`rounded-2xl border p-3 ${toneCls}`}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate">{label}</div>
      <div className={`mt-1 text-lg font-extrabold ${valueCls}`}>{value}</div>
    </div>
  );
}
