import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Clock, X } from "lucide-react";
import {
  listTamperEvents,
  getListTamperEventsQueryKey,
  type TamperEvent,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function fmtAge(ms: number) {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

function sourceLabel(s: TamperEvent["source"]) {
  if (s === "scan") return "QR scan";
  if (s === "manual") return "Manual entry";
  return "Unknown";
}

interface Props {
  venueCode: string;
}

export function TamperAlerts({ venueCode }: Props) {
  const [open, setOpen] = useState(false);
  const { data: events = [] } = useQuery({
    queryKey: getListTamperEventsQueryKey(venueCode),
    queryFn: () => listTamperEvents(venueCode),
    enabled: Boolean(venueCode),
  });

  const recent = events.filter((e) => Date.now() - e.at < 24 * 60 * 60 * 1000);
  const hasAlerts = recent.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover-elevate ${
          hasAlerts
            ? "border-red-500/40 bg-red-500/15 text-red-300"
            : "border-white/10 bg-steel/40 text-slate"
        }`}
        data-testid="button-tamper-alerts"
        aria-label="Tamper attempts"
      >
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Tamper</span>
        <Badge
          variant="outline"
          className={`font-mono text-[10px] px-1.5 py-0 ${
            hasAlerts
              ? "border-red-500/40 text-red-300"
              : "border-white/10 text-slate"
          }`}
          data-testid="badge-tamper-count"
        >
          {recent.length}
        </Badge>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-obsidian border-l border-white/10 text-white"
        >
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              Tamper attempts
              <Badge
                variant="outline"
                className="font-mono text-[10px] border-red-500/40 text-red-300"
              >
                {events.length}
              </Badge>
            </SheetTitle>
          </SheetHeader>
          <p className="mt-2 text-sm text-slate">
            QR scans whose signature did not match this venue. Investigate
            tampered or copied tags here.
          </p>
          <div className="mt-5 space-y-2" data-testid="list-tamper-events">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                <div className="w-10 h-10 rounded-2xl bg-steel/40 flex items-center justify-center mx-auto mb-2">
                  <X className="w-4 h-4 text-slate" />
                </div>
                <p className="text-sm text-slate">No tamper attempts logged.</p>
              </div>
            ) : (
              events.map((e) => (
                <div
                  key={e.id}
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3"
                  data-testid={`tamper-event-${e.id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-mono text-sm text-red-300 tracking-wider">
                      {e.ticketId ?? "—"}
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] border-red-500/30 text-red-300"
                    >
                      {sourceLabel(e.source)}
                    </Badge>
                  </div>
                  <div className="text-sm text-white">{e.reason}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate font-mono">
                    <Clock className="w-3 h-3" /> {fmtAge(e.at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
