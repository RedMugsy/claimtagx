import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Clock, X, Check, Filter } from "lucide-react";
import {
  acknowledgeTamperEvent,
  listTamperEvents,
  getListTamperEventsQueryKey,
  type TamperEvent,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";

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

function dateInputToMs(value: string, endOfDay = false): number | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return date.getTime();
}

interface Props {
  venueCode: string;
  canAcknowledge?: boolean;
}

type SourceFilter = "all" | "scan" | "manual";

export function TamperAlerts({ venueCode, canAcknowledge = false }: Props) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ticketIdFilter, setTicketIdFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const queryClient = useQueryClient();

  // Unread count badge — keep it cheap by always fetching the unread set.
  const unreadKey = getListTamperEventsQueryKey(venueCode, {
    acknowledged: false,
  });
  const { data: unreadEvents = [] } = useQuery({
    queryKey: unreadKey,
    queryFn: () =>
      listTamperEvents(venueCode, { acknowledged: false }),
    enabled: Boolean(venueCode),
  });

  const recentUnread = unreadEvents.filter(
    (e) => Date.now() - e.at < 24 * 60 * 60 * 1000,
  );
  const hasAlerts = recentUnread.length > 0;

  const filterParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    const fromMs = dateInputToMs(from, false);
    const toMs = dateInputToMs(to, true);
    if (fromMs !== null) params.from = fromMs;
    if (toMs !== null) params.to = toMs;
    if (ticketIdFilter.trim()) params.ticketId = ticketIdFilter.trim();
    if (sourceFilter !== "all") params.source = sourceFilter;
    if (!showAcknowledged) params.acknowledged = false;
    return params;
  }, [from, to, ticketIdFilter, sourceFilter, showAcknowledged]);

  const filteredKey = getListTamperEventsQueryKey(venueCode, filterParams);
  const { data: events = [], isFetching } = useQuery({
    queryKey: filteredKey,
    queryFn: () => listTamperEvents(venueCode, filterParams),
    enabled: Boolean(venueCode) && open,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (eventId: string) =>
      acknowledgeTamperEvent(venueCode, eventId),
    onSuccess: (updated) => {
      queryClient.setQueryData<TamperEvent[] | undefined>(
        filteredKey,
        (prev) => {
          if (!prev) return prev;
          if (!showAcknowledged) {
            return prev.filter((e) => e.id !== updated.id);
          }
          return prev.map((e) => (e.id === updated.id ? updated : e));
        },
      );
      queryClient.setQueryData<TamperEvent[] | undefined>(unreadKey, (prev) =>
        prev ? prev.filter((e) => e.id !== updated.id) : prev,
      );
      // Other cached filter combinations may now be stale. Generated query
      // keys are URL-prefixed (e.g. `/api/venues/<code>/tamper-events`),
      // so match by URL substring.
      queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey as readonly unknown[];
          return (
            typeof key[0] === "string" &&
            key[0].includes(`/venues/${venueCode}/tamper-events`)
          );
        },
      });
    },
    onError: () => {
      toast({
        title: "Could not mark as reviewed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setTicketIdFilter("");
    setSourceFilter("all");
    setShowAcknowledged(false);
  };

  const hasActiveFilters =
    from !== "" ||
    to !== "" ||
    ticketIdFilter !== "" ||
    sourceFilter !== "all" ||
    showAcknowledged;

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
          {recentUnread.length}
        </Badge>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-obsidian border-l border-white/10 text-white overflow-y-auto"
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

          <div
            className="mt-4 rounded-2xl border border-white/10 bg-steel/30 p-3 space-y-3"
            data-testid="tamper-filters"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate">
                <Filter className="w-3.5 h-3.5" />
                Filters
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-slate underline hover:text-white"
                  data-testid="button-clear-filters"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="tamper-from" className="text-[11px] text-slate">
                  From
                </Label>
                <Input
                  id="tamper-from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="bg-obsidian border-white/10 text-white text-xs"
                  data-testid="input-filter-from"
                />
              </div>
              <div>
                <Label htmlFor="tamper-to" className="text-[11px] text-slate">
                  To
                </Label>
                <Input
                  id="tamper-to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="bg-obsidian border-white/10 text-white text-xs"
                  data-testid="input-filter-to"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tamper-ticket" className="text-[11px] text-slate">
                Ticket id
              </Label>
              <Input
                id="tamper-ticket"
                value={ticketIdFilter}
                onChange={(e) => setTicketIdFilter(e.target.value)}
                placeholder="e.g. VAL-1234"
                className="bg-obsidian border-white/10 text-white text-xs font-mono"
                data-testid="input-filter-ticket"
              />
            </div>
            <div>
              <Label className="text-[11px] text-slate">Source</Label>
              <Select
                value={sourceFilter}
                onValueChange={(v) => setSourceFilter(v as SourceFilter)}
              >
                <SelectTrigger
                  className="bg-obsidian border-white/10 text-white text-xs h-9"
                  data-testid="select-filter-source"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="scan">QR scan</SelectItem>
                  <SelectItem value="manual">Manual entry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate">
              <input
                type="checkbox"
                checked={showAcknowledged}
                onChange={(e) => setShowAcknowledged(e.target.checked)}
                data-testid="checkbox-show-acknowledged"
              />
              Include reviewed
            </label>
          </div>

          <div className="mt-5 space-y-2" data-testid="list-tamper-events">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                <div className="w-10 h-10 rounded-2xl bg-steel/40 flex items-center justify-center mx-auto mb-2">
                  <X className="w-4 h-4 text-slate" />
                </div>
                <p className="text-sm text-slate">
                  {isFetching
                    ? "Loading…"
                    : hasActiveFilters
                      ? "No tamper attempts match those filters."
                      : "No tamper attempts logged."}
                </p>
              </div>
            ) : (
              events.map((e) => {
                const acknowledged = e.acknowledgedAt != null;
                return (
                  <div
                    key={e.id}
                    className={`rounded-2xl border p-3 ${
                      acknowledged
                        ? "border-white/10 bg-steel/20 opacity-70"
                        : "border-red-500/20 bg-red-500/5"
                    }`}
                    data-testid={`tamper-event-${e.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div
                        className={`font-mono text-sm tracking-wider ${
                          acknowledged ? "text-slate" : "text-red-300"
                        }`}
                      >
                        {e.ticketId ?? "—"}
                      </div>
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] ${
                          acknowledged
                            ? "border-white/10 text-slate"
                            : "border-red-500/30 text-red-300"
                        }`}
                      >
                        {sourceLabel(e.source)}
                      </Badge>
                    </div>
                    <div className="text-sm text-white">{e.reason}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate font-mono">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {fmtAge(e.at)}
                        {acknowledged && (
                          <span className="text-emerald-400">
                            • reviewed
                          </span>
                        )}
                      </div>
                      {!acknowledged && canAcknowledge && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] border-white/10 text-white"
                          onClick={() => acknowledgeMutation.mutate(e.id)}
                          disabled={
                            acknowledgeMutation.isPending &&
                            acknowledgeMutation.variables === e.id
                          }
                          data-testid={`button-acknowledge-${e.id}`}
                        >
                          <Check className="w-3 h-3 mr-1" /> Mark reviewed
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
