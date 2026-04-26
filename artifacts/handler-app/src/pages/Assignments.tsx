import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Briefcase, Clock3, PlayCircle, CheckCircle2, PackageCheck, Flag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getListServiceRequestsQueryKey,
  listServiceRequests,
  type ServiceRequest,
  type ServiceRequestKind,
} from "@workspace/api-client-react";
import { useStore } from "@/lib/store";

type WorkflowStage = "idle" | "started" | "collected" | "arrived" | "ready";

type WorkflowState = {
  stage: WorkflowStage;
  startedAt?: number;
  collectedAt?: number;
  arrivedAt?: number;
  readyAt?: number;
};

const ASSIGNMENTS_FLOW_STORAGE_KEY = "handler.assignments.flow.v1";

const KIND_LABEL: Record<ServiceRequestKind, string> = {
  bring_my_car: "Bring my car",
  fetch_my_coat: "Fetch my coat",
  repack_my_bag: "Repack my bag",
  deliver_to_table: "Deliver to table",
  other: "Other request",
};

function readWorkflowState(): Record<string, WorkflowState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_FLOW_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, WorkflowState>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function msToMmSs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function stateActionLabel(stage: WorkflowStage) {
  if (stage === "idle") return "Start retrieval";
  if (stage === "started") return "Collected asset";
  if (stage === "collected") return "Arrived";
  if (stage === "arrived") return "Ready for release";
  return "Ready";
}

function stateTimerLabel(stage: WorkflowStage) {
  if (stage === "started") return "Retrieval timer";
  if (stage === "collected") return "Transit timer";
  if (stage === "arrived") return "Release prep timer";
  return "Timer";
}

export default function AssignmentsPage() {
  const { activeVenue, session, assets } = useStore();
  const [location, navigate] = useLocation();
  const [now, setNow] = useState(() => Date.now());
  const [workflowById, setWorkflowById] = useState<Record<string, WorkflowState>>(
    () => readWorkflowState(),
  );

  const venueCode = activeVenue?.code ?? "";
  const list = useQuery({
    queryKey: getListServiceRequestsQueryKey(venueCode),
    queryFn: () => listServiceRequests(venueCode),
    enabled: Boolean(venueCode),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ASSIGNMENTS_FLOW_STORAGE_KEY, JSON.stringify(workflowById));
    } catch {
      // ignore storage errors
    }
  }, [workflowById]);

  const path = location.split("?")[0];
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const scope = path.split("/")[2] ?? "all";
  const requestedId = params.get("id");
  const currentMode = scope === "current";

  const items = (list.data ?? []).filter(
    (r) => r.status === "open" || r.status === "claimed",
  );

  const currentHandlerName = (session?.handlerName ?? "").trim().toLowerCase();

  const inProgressByMe = items.filter((r) => {
    const claimedBy = (r.claimedByName ?? "").trim().toLowerCase();
    return r.status === "claimed" && claimedBy && claimedBy === currentHandlerName;
  });

  const scopeTitle =
    scope === "assignments"
      ? "Assignments"
      : scope === "tasks"
        ? "Tasks"
        : scope === "jobs"
          ? "Jobs"
          : scope === "current"
            ? "Current assignment"
            : "All Todos";

  const visibleItems = useMemo(() => {
    if (scope === "assignments") {
      return items.filter((r) => r.status === "open");
    }
    if (scope === "tasks") {
      return items.filter((r) => {
        const claimedBy = (r.claimedByName ?? "").trim().toLowerCase();
        return r.status === "claimed" && claimedBy === currentHandlerName;
      });
    }
    if (scope === "jobs") {
      return items.filter((r) => r.status === "claimed");
    }
    return items;
  }, [items, scope, currentHandlerName]);

  const currentAssignment = useMemo(() => {
    if (items.length === 0) return null;
    if (requestedId) {
      const direct = items.find((r) => r.id === requestedId);
      if (direct) return direct;
    }
    return inProgressByMe[0] ?? null;
  }, [items, inProgressByMe, requestedId]);

  const currentWorkflow = currentAssignment ? workflowById[currentAssignment.id] : undefined;
  const currentStage: WorkflowStage = currentWorkflow?.stage ?? "idle";

  const currentStageStart =
    currentStage === "started"
      ? currentWorkflow?.startedAt
      : currentStage === "collected"
        ? currentWorkflow?.collectedAt
        : currentStage === "arrived"
          ? currentWorkflow?.arrivedAt
          : undefined;

  const currentStageTimer = currentStageStart ? msToMmSs(now - currentStageStart) : null;

  const activeAsset = currentAssignment
    ? assets.find((a) => a.ticketId === currentAssignment.ticketId)
    : null;

  const timeline = useMemo(() => {
    if (!currentAssignment) return [] as Array<{ label: string; at: number | null }>;
    const flow = workflowById[currentAssignment.id];
    return [
      { label: "Checked in", at: activeAsset?.intakeAt ?? null },
      { label: "Requested", at: currentAssignment.createdAt },
      { label: "Claimed", at: currentAssignment.claimedAt ?? null },
      { label: "Started retrieval", at: flow?.startedAt ?? null },
      { label: "Collected asset", at: flow?.collectedAt ?? null },
      { label: "Arrived", at: flow?.arrivedAt ?? null },
      { label: "Ready for release", at: flow?.readyAt ?? null },
    ].filter((row) => row.at != null);
  }, [currentAssignment, workflowById, activeAsset?.intakeAt]);

  const advanceCurrentStage = () => {
    if (!currentAssignment) return;
    setWorkflowById((prev) => {
      const existing = prev[currentAssignment.id] ?? { stage: "idle" as WorkflowStage };
      const ts = Date.now();
      let next: WorkflowState = existing;
      if (existing.stage === "idle") {
        next = { ...existing, stage: "started", startedAt: ts };
      } else if (existing.stage === "started") {
        next = { ...existing, stage: "collected", collectedAt: ts };
      } else if (existing.stage === "collected") {
        next = { ...existing, stage: "arrived", arrivedAt: ts };
      } else if (existing.stage === "arrived") {
        next = { ...existing, stage: "ready", readyAt: ts };
      }
      return { ...prev, [currentAssignment.id]: next };
    });
  };

  return (
    <div className="space-y-4" data-testid="page-assignments">
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
          onClick={() => navigate("/assignments/current")}
          className="inline-flex items-center gap-1 rounded-xl border border-lime/30 bg-lime/10 text-lime px-3 py-1.5 text-xs font-semibold hover-elevate"
          data-testid="button-open-current-assignment"
        >
          <PlayCircle className="w-3.5 h-3.5" /> Current assignment
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-steel/40 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-indigo-200" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate">Assignments / Tasks / Jobs</div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">{scopeTitle}</h1>
          </div>
          <span className="rounded-full border border-white/10 bg-obsidian/40 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-paper">
            {currentMode ? inProgressByMe.length : visibleItems.length} open
          </span>
        </div>
      </div>

      {!currentMode ? (
        <section className="space-y-2" data-testid="assignments-all-list">
          {list.isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-steel/30 p-4 text-sm text-slate">Loading assignments…</div>
          ) : visibleItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-steel/30 p-4 text-sm text-slate">No active assignments right now.</div>
          ) : (
            visibleItems.map((row) => {
              const flow = workflowById[row.id];
              const stage = flow?.stage ?? "idle";
              const isMine = (row.claimedByName ?? "").trim().toLowerCase() === currentHandlerName;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => navigate(`/assignments/current?id=${encodeURIComponent(row.id)}`)}
                  className="w-full text-left rounded-2xl border border-white/10 bg-steel/40 p-3 hover-elevate"
                  data-testid={`assignment-row-${row.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white truncate">{KIND_LABEL[row.kind]}</div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate">{row.status}</span>
                  </div>
                  <div className="text-xs text-slate mt-1 truncate">
                    Requested by <span className="text-paper">{row.requestedByName}</span> · Ticket <span className="text-paper">{row.ticketId}</span>
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider mt-1.5 text-slate">
                    {isMine ? "You" : row.claimedByName ? `Claimed by ${row.claimedByName}` : "Unclaimed"} · Workflow {stage}
                  </div>
                </button>
              );
            })
          )}
        </section>
      ) : (
        <section className="space-y-3" data-testid="assignment-current-detail">
          {!currentAssignment ? (
            <div className="rounded-2xl border border-white/10 bg-steel/30 p-4 text-sm text-slate">
              No current assignment in progress for this handler.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-steel/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-white">{KIND_LABEL[currentAssignment.kind]}</div>
                    <div className="text-xs text-slate mt-0.5">Requested by <span className="text-paper">{currentAssignment.requestedByName}</span></div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-obsidian/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-paper">
                    {currentStage}
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-obsidian/40 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate mb-1">{stateTimerLabel(currentStage)}</div>
                  <div className="flex items-center gap-1.5 text-white font-mono text-lg">
                    <Clock3 className="w-4 h-4 text-lime" />
                    {currentStageTimer ?? "00:00"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={advanceCurrentStage}
                  disabled={currentStage === "ready"}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-lime/30 bg-lime/10 text-lime px-3 py-2 text-sm font-semibold hover-elevate disabled:opacity-50"
                  data-testid="button-assignment-next-stage"
                >
                  {currentStage === "ready" ? <CheckCircle2 className="w-4 h-4" /> : <PackageCheck className="w-4 h-4" />}
                  {stateActionLabel(currentStage)}
                </button>

                {currentStage === "ready" ? (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100" data-testid="assignment-ready-signal">
                    <Flag className="w-3.5 h-3.5 inline-block mr-1" />
                    Ready for release state is active and can now be surfaced to the ticket-facing patron experience.
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-steel/30 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate mb-2">Asset custody timeline</div>
                {timeline.length === 0 ? (
                  <div className="text-xs text-slate">No timeline points yet.</div>
                ) : (
                  <ul className="space-y-1.5">
                    {timeline.map((row) => (
                      <li key={`${row.label}-${row.at}`} className="rounded-lg border border-white/10 bg-obsidian/30 px-2.5 py-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-paper">{row.label}</span>
                          <span className="text-slate font-mono">
                            {row.at ? new Date(row.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}