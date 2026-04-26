import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ConciergeBell,
  Plus,
  Hand,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelServiceRequest,
  claimServiceRequest,
  completeServiceRequest,
  createServiceRequest,
  getGetOpenServiceCountQueryKey,
  getListServiceRequestsQueryKey,
  listServiceRequests,
  type ServiceRequest,
  type ServiceRequestKind,
} from "@workspace/api-client-react";
import { useStore } from "@/lib/store";
import { toast } from "@/hooks/use-toast";

const KIND_LABEL: Record<ServiceRequestKind, string> = {
  bring_my_car: "Bring my car",
  fetch_my_coat: "Fetch my coat",
  repack_my_bag: "Repack my bag",
  deliver_to_table: "Deliver to table",
  other: "Other request",
};

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ServicesPage() {
  const { activeVenue } = useStore();
  const [location] = useLocation();
  const venueCode = activeVenue?.code ?? "";
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [kind, setKind] = useState<ServiceRequestKind>("bring_my_car");
  const [notes, setNotes] = useState("");

  const list = useQuery({
    queryKey: getListServiceRequestsQueryKey(venueCode),
    queryFn: () => listServiceRequests(venueCode),
    enabled: Boolean(venueCode),
    refetchInterval: 10_000,
  });

  function refresh() {
    queryClient.invalidateQueries({
      queryKey: getListServiceRequestsQueryKey(venueCode),
    });
    queryClient.invalidateQueries({
      queryKey: getGetOpenServiceCountQueryKey(venueCode),
    });
  }

  const claim = useMutation({
    mutationFn: (id: string) => claimServiceRequest(venueCode, id),
    onSuccess: () => {
      refresh();
      toast({ title: "Claimed" });
    },
    onError: (e: Error) =>
      toast({ title: "Could not claim", description: e.message, variant: "destructive" }),
  });

  const complete = useMutation({
    mutationFn: (id: string) => completeServiceRequest(venueCode, id),
    onSuccess: () => {
      refresh();
      toast({ title: "Marked done" });
    },
    onError: (e: Error) =>
      toast({ title: "Could not complete", description: e.message, variant: "destructive" }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelServiceRequest(venueCode, id),
    onSuccess: () => {
      refresh();
      toast({ title: "Cancelled" });
    },
    onError: (e: Error) =>
      toast({ title: "Could not cancel", description: e.message, variant: "destructive" }),
  });

  const create = useMutation({
    mutationFn: () =>
      createServiceRequest(venueCode, {
        ticketId: ticketId.trim(),
        kind,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      setCreating(false);
      setTicketId("");
      setKind("bring_my_car");
      setNotes("");
      refresh();
      toast({ title: "Request added" });
    },
    onError: (e: Error) =>
      toast({ title: "Could not create", description: e.message, variant: "destructive" }),
  });

  const items = list.data ?? [];
  const open = items.filter((r) => r.status === "open" || r.status === "claimed");
  const recent = items.filter((r) => r.status !== "open" && r.status !== "claimed").slice(0, 10);
  const assignmentsMode = location.startsWith("/assignments");
  const scope = assignmentsMode ? location.split("/")[2] ?? "all" : "services";
  const scopeLabel =
    scope === "patron"
      ? "Assignments"
      : scope === "supervisor"
        ? "Tasks"
        : scope === "all"
          ? "All"
          : scope === "services"
            ? "Jobs"
            : "Assignments";

  return (
    <div className="space-y-4" data-testid="page-services">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate rounded-full px-2 py-1"
          data-testid="link-back-home"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Command Center
        </Link>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-1 rounded-xl border border-violet-400/40 bg-violet-500/15 text-violet-200 px-3 py-1.5 text-xs font-semibold hover-elevate"
          data-testid="button-new-service"
        >
          <Plus className="w-3.5 h-3.5" /> New request
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-steel/40 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-400/30 flex items-center justify-center">
            <ConciergeBell className="w-6 h-6 text-violet-300" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
              {assignmentsMode ? "Assignment list" : "Patron requests on tickets"}
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {assignmentsMode ? "Assignments" : "Services"}
            </h1>
          </div>
          {assignmentsMode ? (
            <div className="ml-auto rounded-full border border-white/10 bg-obsidian/40 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-paper">
              {scopeLabel}
            </div>
          ) : null}
        </div>
      </div>

      {creating && (
        <form
          className="rounded-3xl border border-white/10 bg-steel/40 p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ticketId.trim()) return;
            create.mutate();
          }}
          data-testid="form-new-service"
        >
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate">
            Ticket id
          </label>
          <input
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="e.g. V-001"
            className="w-full rounded-xl border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-white placeholder:text-slate"
            data-testid="input-ticket-id"
          />
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate">
            What does the patron need?
          </label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ServiceRequestKind)}
            aria-label="Service request type"
            className="w-full rounded-xl border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-white"
            data-testid="select-kind"
          >
            {Object.entries(KIND_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-white placeholder:text-slate"
            placeholder="Anything the handler should know"
            data-testid="input-notes"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-xl border border-white/10 bg-obsidian/40 px-3 py-1.5 text-xs font-semibold text-paper hover-elevate"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending || !ticketId.trim()}
              className="inline-flex items-center gap-1 rounded-xl border border-lime/40 bg-lime/15 text-lime px-3 py-1.5 text-xs font-semibold hover-elevate disabled:opacity-60"
              data-testid="button-submit-service"
            >
              {create.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add request
            </button>
          </div>
        </form>
      )}

      <section className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate px-1">
          Open ({open.length})
        </div>
        {list.isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-steel/30 p-4 text-sm text-slate">
            Loading…
          </div>
        ) : open.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-steel/30 p-4 text-sm text-slate">
            No open service requests right now.
          </div>
        ) : (
          <ul className="space-y-2">
            {open.map((r) => (
              <ServiceRow
                key={r.id}
                row={r}
                onClaim={() => claim.mutate(r.id)}
                onComplete={() => complete.mutate(r.id)}
                onCancel={() => cancel.mutate(r.id)}
                busy={
                  (claim.isPending && claim.variables === r.id) ||
                  (complete.isPending && complete.variables === r.id) ||
                  (cancel.isPending && cancel.variables === r.id)
                }
              />
            ))}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate px-1">
            Recently closed
          </div>
          <ul className="space-y-2">
            {recent.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-white/10 bg-steel/20 p-3 text-xs text-slate"
                data-testid={`row-closed-${r.id}`}
              >
                <span className="text-paper font-semibold">{KIND_LABEL[r.kind]}</span>
                {r.patronName ? (
                  <> · <span className="text-paper">{r.patronName}</span></>
                ) : null}
                {" "}· {r.ticketId} · {r.status}
                {r.completedAt ? ` · ${timeAgo(r.completedAt)}` : null}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ServiceRow({
  row,
  onClaim,
  onComplete,
  onCancel,
  busy,
}: {
  row: ServiceRequest;
  onClaim: () => void;
  onComplete: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <li
      className="rounded-2xl border border-white/10 bg-steel/40 p-3"
      data-testid={`row-service-${row.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {KIND_LABEL[row.kind]}
          </div>
          {row.patronName ? (
            <div className="text-xs text-paper/90 truncate" data-testid={`text-patron-${row.id}`}>
              for <span className="font-semibold">{row.patronName}</span>
            </div>
          ) : null}
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate">
            Ticket {row.ticketId} · {timeAgo(row.createdAt)}
            {row.claimedByName ? (
              <> · claimed by <span className="text-paper">{row.claimedByName}</span></>
            ) : null}
          </div>
          {row.notes ? (
            <div className="mt-1 text-xs text-paper/90 leading-snug">
              {row.notes}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {row.status === "open" ? (
            <button
              type="button"
              onClick={onClaim}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-xl border border-lime/40 bg-lime/15 text-lime px-3 py-1.5 text-xs font-semibold hover-elevate disabled:opacity-60"
              data-testid={`button-claim-${row.id}`}
            >
              <Hand className="w-3.5 h-3.5" /> Claim
            </button>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 px-3 py-1.5 text-xs font-semibold hover-elevate disabled:opacity-60"
              data-testid={`button-complete-${row.id}`}
            >
              <Check className="w-3.5 h-3.5" /> Done
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-obsidian/40 text-slate px-3 py-1.5 text-xs font-semibold hover-elevate disabled:opacity-60"
            data-testid={`button-cancel-${row.id}`}
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </div>
    </li>
  );
}
