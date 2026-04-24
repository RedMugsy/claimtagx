import { Link, Redirect } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock3,
  LogOut,
  Loader2,
  AlertTriangle,
  Building2,
} from "lucide-react";
import {
  endShift,
  getActiveShift,
  getGetActiveShiftQueryKey,
  getListActiveVenueShiftsQueryKey,
} from "@workspace/api-client-react";
import { useStore } from "@/lib/store";
import { toast } from "@/hooks/use-toast";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatHm(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${pad(h)}:${pad(m)}`;
}

function atLabel(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CheckoutPage() {
  const { activeVenue } = useStore();
  const queryClient = useQueryClient();
  const venueCode = activeVenue?.code ?? "";

  const activeShiftQuery = useQuery({
    queryKey: getGetActiveShiftQueryKey(),
    queryFn: () => getActiveShift(),
    staleTime: 30_000,
  });

  const shift = activeShiftQuery.data?.shift ?? null;
  const shiftHere = shift && venueCode && shift.venueCode === venueCode ? shift : null;
  const shiftElsewhere = shift && venueCode && shift.venueCode !== venueCode ? shift : null;

  const endMutation = useMutation({
    mutationFn: (id: string) => endShift(id),
    onSuccess: (closed) => {
      queryClient.setQueryData(getGetActiveShiftQueryKey(), { shift: null });
      queryClient.invalidateQueries({
        queryKey: getListActiveVenueShiftsQueryKey(closed.venueCode),
      });
      toast({
        title: "Shift ended",
        description: `Worked ${formatHm(Date.now() - closed.startedAt)}.`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Could not end shift",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (!shift) {
    return <Redirect to="/pre-shift" />;
  }

  // Use whichever shift is active — even if it belongs to another station,
  // allow ending it from here so the handler can recover.
  const activeShift = shiftHere ?? shiftElsewhere!;
  const isElsewhere = !shiftHere && Boolean(shiftElsewhere);

  const elapsed = Date.now() - activeShift.startedAt;
  const target = (activeShift.targetMinutes ?? 480) * 60 * 1000;
  const remaining = Math.max(0, target - elapsed);
  const overtime = Math.max(0, elapsed - target);

  return (
    <div className="space-y-4" data-testid="page-checkout">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate rounded-full px-2 py-1"
        data-testid="link-back-home"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Command Center
      </Link>

      <section className="rounded-3xl border border-white/10 bg-steel/40 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center shrink-0">
            <LogOut className="w-6 h-6 text-rose-200" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate">Shift checkout</div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Confirm end shift</h1>
            <p className="mt-1 text-sm text-slate">Review your shift summary before closing out.</p>
          </div>
        </div>

        {isElsewhere ? (
          <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-100 leading-relaxed">
              This shift belongs to <span className="font-semibold">{activeShift.venueCode}</span>, not your current station. Ending it here will close it out and let you start a new shift at {activeVenue?.code ?? "this station"}.
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SummaryStat icon={<Building2 className="w-4 h-4 text-lime" />} label="Station" value={isElsewhere ? activeShift.venueCode : (activeVenue?.name ?? activeShift.venueCode)} detail={activeShift.venueCode} />
          <SummaryStat icon={<Clock3 className="w-4 h-4 text-lime" />} label="Started" value={atLabel(activeShift.startedAt)} detail={activeShift.role} />
          <SummaryStat icon={<Clock3 className="w-4 h-4 text-lime" />} label="Worked" value={formatHm(elapsed)} detail="Elapsed" />
          <SummaryStat icon={<Clock3 className="w-4 h-4 text-lime" />} label="Remaining" value={formatHm(remaining)} detail={overtime > 0 ? `Overtime ${formatHm(overtime)}` : "On target"} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-white/10 bg-obsidian/40 px-4 py-2 text-sm font-semibold text-paper hover-elevate"
            data-testid="button-cancel-checkout"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => endMutation.mutate(activeShift.id)}
            disabled={endMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/15 text-rose-100 px-4 py-2 text-sm font-semibold hover-elevate disabled:opacity-60"
            data-testid="button-confirm-checkout"
          >
            {endMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {endMutation.isPending ? "Ending…" : isElsewhere ? `End shift at ${activeShift.venueCode}` : "End shift"}
          </button>
        </div>
      </section>
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-obsidian/40 p-3">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white truncate">{value}</div>
      <div className="text-[10px] font-mono text-slate">{detail}</div>
    </div>
  );
}