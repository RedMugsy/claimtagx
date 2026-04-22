import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { fetchVenueShiftReport } from "@/lib/api";

interface Props {
  venueCode: string;
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function formatRange(startMs: number, endMs: number): string {
  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  return `${fmt(startMs)} – ${fmt(endMs - 1)}`;
}

export function WeeklyShiftReport({ venueCode }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["venue-shift-report", venueCode],
    queryFn: () => fetchVenueShiftReport(venueCode),
    refetchInterval: 60_000,
  });

  return (
    <div
      className="mb-5 rounded-2xl border border-white/10 bg-obsidian/40 p-4"
      data-testid={`weekly-shift-report-${venueCode}`}
    >
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs font-mono uppercase tracking-wide text-slate flex items-center gap-2">
          <Clock className="w-3 h-3" /> Hours this week
        </Label>
        {data && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate">
            {formatRange(data.weekStart, data.weekEnd)}
          </span>
        )}
      </div>
      <p className="text-xs text-slate mb-3">
        Each handler's hours so far this week. Anyone past{" "}
        {data ? Math.round(data.overtimeThresholdMinutes / 60) : 40}h is
        flagged as overtime.
      </p>

      {isLoading && (
        <div className="text-xs text-slate">Loading…</div>
      )}
      {error && (
        <div
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
          data-testid={`weekly-shift-report-error-${venueCode}`}
        >
          {error instanceof Error ? error.message : "Could not load report"}
        </div>
      )}
      {data && data.handlers.length === 0 && !isLoading && (
        <div
          className="text-xs text-slate"
          data-testid={`weekly-shift-report-empty-${venueCode}`}
        >
          No shifts logged this week yet.
        </div>
      )}

      <div className="space-y-2">
        {data?.handlers.map((h) => (
          <div
            key={h.handlerUserId}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
              h.overtime
                ? "border-amber-400/40 bg-amber-400/10"
                : "border-white/10 bg-steel/40"
            }`}
            data-testid={`weekly-shift-row-${h.handlerUserId}`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold truncate">
                  {h.handlerName}
                </span>
                {h.activeShiftId && (
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider text-lime"
                    data-testid={`weekly-shift-active-${h.handlerUserId}`}
                  >
                    on shift
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate truncate">
                {h.handlerEmail} · {h.role}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div
                className={`font-mono text-sm font-bold ${
                  h.overtime ? "text-amber-300" : "text-white"
                }`}
                data-testid={`weekly-shift-hours-${h.handlerUserId}`}
              >
                {formatHours(h.minutes)}
              </div>
              {h.overtime && (
                <div
                  className="text-[10px] font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1 justify-end"
                  data-testid={`weekly-shift-overtime-${h.handlerUserId}`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  +{formatHours(h.overtimeMinutes)} overtime
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
