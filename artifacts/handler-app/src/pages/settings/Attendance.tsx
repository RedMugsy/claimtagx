import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getActiveShift,
  getGetActiveShiftQueryKey,
  type Shift,
} from "@workspace/api-client-react";
import { useStore } from "@/lib/store";
import { SettingsCard, SettingsSubHeader } from "./_chrome";

type Window = "day" | "week" | "month";
type Tab = "upcoming" | "past";
type AttendStatus = "attended" | "absent" | "late" | "left-early";

interface PastShiftRow {
  id: string;
  date: string;
  status: AttendStatus;
  start: string;
  end: string;
  location: string;
}

interface UpcomingShiftRow {
  id: string;
  date: string;
  start: string;
  end: string;
  location: string;
}

const STATUS_META: Record<AttendStatus, { label: string; color: string; bg: string }> = {
  attended: { label: "Attended", color: "text-lime", bg: "bg-lime/15 border-lime/30" },
  absent: { label: "Absent", color: "text-rose-300", bg: "bg-rose-500/15 border-rose-400/30" },
  late: { label: "Late", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-400/30" },
  "left-early": { label: "Left early", color: "text-violet-300", bg: "bg-violet-500/15 border-violet-400/30" },
};

function formatDateShort(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function formatTime(ms: number | undefined | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function SettingsAttendance() {
  const { activeVenue } = useStore();
  const [tab, setTab] = useState<Tab>("past");
  const [window, setWindow] = useState<Window>("week");

  const activeShiftQuery = useQuery({
    queryKey: getGetActiveShiftQueryKey(),
    queryFn: () => getActiveShift(),
    staleTime: 30_000,
  });
  const shift: Shift | null = activeShiftQuery.data?.shift ?? null;

  // Past shifts list — until a list endpoint exists, surface the current
  // active shift as a single in-progress row so the table is not empty.
  const past: PastShiftRow[] = useMemo(() => {
    if (!shift) return [];
    return [
      {
        id: shift.id,
        date: formatDateShort(new Date(shift.startedAt)),
        status: "attended",
        start: formatTime(shift.startedAt),
        end: shift.endedAt ? formatTime(shift.endedAt) : "in progress",
        location: shift.venueCode,
      },
    ];
  }, [shift]);

  const counts = useMemo(() => {
    const init: Record<AttendStatus, number> = { attended: 0, absent: 0, late: 0, "left-early": 0 };
    for (const r of past) init[r.status] += 1;
    const total = past.length || 1;
    return { byStatus: init, total };
  }, [past]);

  // Upcoming shifts come from the schedule once integrated. Empty for now.
  const upcoming: UpcomingShiftRow[] = [];

  const segments = (Object.entries(counts.byStatus) as Array<[AttendStatus, number]>).filter(([, v]) => v > 0);

  return (
    <div>
      <SettingsSubHeader title="Attendance overview" Icon={CalendarClock} description={activeVenue?.name ?? "Your station"} />

      {/* Tabs */}
      <div className="inline-flex items-center rounded-full border border-white/10 bg-obsidian/50 p-1 mb-4">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider hover-elevate ${
              tab === t ? "bg-lime/15 text-lime" : "text-slate"
            }`}
            data-testid={`attendance-tab-${t}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Window toggle (past only) */}
      {tab === "past" && (
        <div className="inline-flex items-center rounded-full border border-white/10 bg-obsidian/50 p-1 mb-4 ml-2">
          {(["day", "week", "month"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider hover-elevate ${
                window === w ? "bg-lime/15 text-lime" : "text-slate"
              }`}
              data-testid={`attendance-window-${w}`}
            >
              {w}
            </button>
          ))}
        </div>
      )}

      {tab === "upcoming" ? (
        <SettingsCard>
          <div className="text-xs font-mono uppercase tracking-wider text-slate mb-3">
            Upcoming shifts (from platform schedule)
          </div>
          {upcoming.length === 0 ? (
            <div className="text-sm text-slate">No upcoming shifts published yet.</div>
          ) : (
            <ScheduleTable rows={upcoming} />
          )}
        </SettingsCard>
      ) : (
        <div className="space-y-4">
          <SettingsCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mini pie */}
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-slate mb-2">By status</div>
                <div className="flex items-center gap-4">
                  <MiniPie segments={segments} total={counts.total} />
                  <ul className="space-y-1 text-xs">
                    {(Object.keys(STATUS_META) as AttendStatus[]).map((s) => (
                      <li key={s} className="flex items-center gap-2 text-slate">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${pieFill(s)}`} />
                        <span>{STATUS_META[s].label}</span>
                        <span className="font-mono text-paper">{counts.byStatus[s]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Mini bar — totals per status */}
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-slate mb-2">Totals</div>
                <MiniBars segments={segments} />
              </div>
            </div>
          </SettingsCard>

          <SettingsCard>
            <div className="text-xs font-mono uppercase tracking-wider text-slate mb-3">
              Past shifts ({past.length})
            </div>
            {past.length === 0 ? (
              <div className="text-sm text-slate">No past shifts in this window yet.</div>
            ) : (
              <PastTable rows={past} />
            )}
          </SettingsCard>
        </div>
      )}
    </div>
  );
}

function pieFill(s: AttendStatus): string {
  switch (s) {
    case "attended":
      return "bg-lime";
    case "absent":
      return "bg-rose-400";
    case "late":
      return "bg-amber-400";
    case "left-early":
      return "bg-violet-400";
  }
}

function MiniPie({ segments, total }: { segments: Array<[AttendStatus, number]>; total: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0" data-testid="attendance-pie">
      <circle cx="40" cy="40" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" />
      {segments.map(([s, v]) => {
        const len = (v / total) * c;
        const dash = `${len} ${c - len}`;
        const dashOffset = -offset;
        offset += len;
        return (
          <circle
            key={s}
            cx="40"
            cy="40"
            r={r}
            fill="none"
            strokeWidth="14"
            stroke="currentColor"
            className={pieStroke(s)}
            strokeDasharray={dash}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 40 40)"
          />
        );
      })}
    </svg>
  );
}

function pieStroke(s: AttendStatus) {
  switch (s) {
    case "attended":
      return "text-lime";
    case "absent":
      return "text-rose-400";
    case "late":
      return "text-amber-400";
    case "left-early":
      return "text-violet-400";
  }
}

function MiniBars({ segments }: { segments: Array<[AttendStatus, number]> }) {
  const max = Math.max(1, ...segments.map(([, v]) => v));
  return (
    <div className="space-y-1.5" data-testid="attendance-bars">
      {(Object.keys(STATUS_META) as AttendStatus[]).map((s) => {
        const v = segments.find(([k]) => k === s)?.[1] ?? 0;
        const w = (v / max) * 100;
        return (
          <div key={s} className="flex items-center gap-2">
            <span className="w-20 text-[10px] font-mono uppercase tracking-wider text-slate">
              {STATUS_META[s].label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-obsidian/60 border border-white/10 overflow-hidden">
              <div
                className={`h-full ${pieFill(s)}`}
                style={{ width: `${w}%` }}
              />
            </div>
            <span className="w-6 text-right text-[10px] font-mono text-paper">{v}</span>
          </div>
        );
      })}
    </div>
  );
}

function PastTable({ rows }: { rows: PastShiftRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" data-testid="table-past-shifts">
        <thead>
          <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-slate border-b border-white/10">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Start</th>
            <th className="py-2 pr-3">End</th>
            <th className="py-2 pr-3">Location</th>
          </tr>
        </thead>
        <tbody className="text-paper">
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-white/5">
              <td className="py-2 pr-3 font-semibold">{r.date}</td>
              <td className="py-2 pr-3">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${STATUS_META[r.status].bg} ${STATUS_META[r.status].color}`}>
                  {STATUS_META[r.status].label}
                </span>
              </td>
              <td className="py-2 pr-3 font-mono">{r.start}</td>
              <td className="py-2 pr-3 font-mono">{r.end}</td>
              <td className="py-2 pr-3 font-mono text-slate">{r.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleTable({ rows }: { rows: UpcomingShiftRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" data-testid="table-upcoming-shifts">
        <thead>
          <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-slate border-b border-white/10">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Start</th>
            <th className="py-2 pr-3">End</th>
            <th className="py-2 pr-3">Location</th>
          </tr>
        </thead>
        <tbody className="text-paper">
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-white/5">
              <td className="py-2 pr-3 font-semibold">{r.date}</td>
              <td className="py-2 pr-3 font-mono">{r.start}</td>
              <td className="py-2 pr-3 font-mono">{r.end}</td>
              <td className="py-2 pr-3 font-mono text-slate">{r.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
