import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Briefcase, Clock3, PlayCircle, CheckCircle2, PackageCheck, Flag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import {
  getListServiceRequestsQueryKey,
  listServiceRequests,
  type ServiceRequestKind,
} from "@workspace/api-client-react";
import { useStore } from "@/lib/store";

const TODO_TYPE_COLORS = ["#a3e635", "#facc15", "#38bdf8", "#c084fc", "#f97316"];

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

const TODO_SCOPE_FILTERS = [
  { key: "assignments", label: "Assignments", href: "/assignments/assignments" },
  { key: "tasks", label: "Tasks", href: "/assignments/tasks" },
  { key: "jobs", label: "Jobs", href: "/assignments/jobs" },
  { key: "all", label: "All", href: "/assignments" },
] as const;

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
            ? "Active Todo"
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
  const activeCount = currentMode ? inProgressByMe.length : visibleItems.length;

  const activeTodo = inProgressByMe[0] ?? null;
  const activeTodoWorkflow = activeTodo ? workflowById[activeTodo.id] : undefined;
  const activeTodoStage: WorkflowStage = activeTodoWorkflow?.stage ?? "idle";
  const activeTodoStageStart =
    activeTodoStage === "started"
      ? activeTodoWorkflow?.startedAt
      : activeTodoStage === "collected"
        ? activeTodoWorkflow?.collectedAt
        : activeTodoStage === "arrived"
          ? activeTodoWorkflow?.arrivedAt
          : activeTodo?.claimedAt;
  const activeTodoTimer = activeTodoStageStart ? msToMmSs(now - activeTodoStageStart) : null;

  const assignmentCount = items.filter((r) => r.status === "open").length;
  const taskCount = inProgressByMe.length;
  const jobCount = items.filter((r) => r.status === "claimed").length;
  const allCount = items.length;
  const totalAssignedToHandler = inProgressByMe.length;
  const completedAssignedCount = inProgressByMe.filter(
    (row) => (workflowById[row.id]?.stage ?? "idle") === "ready",
  ).length;
  const remainingAssignedCount = Math.max(totalAssignedToHandler - completedAssignedCount, 0);

  const assignedByTypeData = useMemo(() => {
    const grouped = new Map<string, number>();
    inProgressByMe.forEach((row) => {
      const label = KIND_LABEL[row.kind];
      grouped.set(label, (grouped.get(label) ?? 0) + 1);
    });

    return Array.from(grouped.entries()).map(([name, value], index) => ({
      name,
      value,
      fill: TODO_TYPE_COLORS[index % TODO_TYPE_COLORS.length],
    }));
  }, [inProgressByMe]);

  const inboxAgingData = useMemo(() => {
    const buckets = [
      { name: "Now", value: 0 },
      { name: "Soon", value: 0 },
      { name: "Late", value: 0 },
    ];

    items.forEach((row) => {
      const ageMinutes = Math.max(0, (now - row.createdAt) / 60000);
      if (ageMinutes < 5) {
        buckets[0].value += 1;
      } else if (ageMinutes < 15) {
        buckets[1].value += 1;
      } else {
        buckets[2].value += 1;
      }
    });

    return buckets;
  }, [items, now]);

  const completionData = useMemo(
    () => [
      { name: "Completed", value: completedAssignedCount, fill: "#a3e635" },
      { name: "Pending", value: remainingAssignedCount, fill: "rgba(148, 163, 184, 0.28)" },
    ],
    [completedAssignedCount, remainingAssignedCount],
  );

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
      </div>

      <header className="mb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-lime" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-mono uppercase tracking-wider text-slate">
                {currentMode ? "Active todo" : "All todos"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                {scopeTitle}
              </h1>
            </div>
          </div>

          {currentMode ? (
            <button
              type="button"
              onClick={() => navigate("/assignments")}
              className="inline-flex flex-col items-center gap-1 text-slate hover:text-paper"
              data-testid="button-open-all-todos"
              aria-label="Open all todos"
              title="Open all todos"
            >
              <Briefcase className="w-5 h-5 text-indigo-200/70" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate">All Todos</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/assignments/current")}
              className={`relative inline-flex items-center justify-center w-10 h-10 rounded-2xl border hover-elevate ${
                activeTodo
                  ? "border-lime/40 bg-lime/15 text-lime"
                  : "border-white/10 bg-steel/40 text-slate"
              }`}
              data-testid="button-open-current-assignment"
              aria-label="Open active todo"
              title={activeTodo ? "Active todo in progress" : "No active todo in progress"}
            >
              <PlayCircle className="w-4 h-4" />
              {activeTodo ? (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-lime/35 bg-obsidian/90 px-1.5 py-0.5 text-[9px] font-mono font-bold text-lime tabular-nums whitespace-nowrap">
                  {activeTodoTimer ?? "00:00"}
                </span>
              ) : null}
            </button>
          )}
        </div>
      </header>

      {!currentMode ? (
        <section className="rounded-3xl border border-white/10 bg-steel/40 px-3 py-3 sm:px-4 sm:py-4" data-testid="card-todos-dashboard">
          <div className="mb-3 text-[11px] font-mono uppercase tracking-wider text-slate">Todo dashboard</div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-obsidian/30 p-2.5 sm:p-3" data-testid="dashboard-card-breakdown">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate">By type</div>
              <div className="relative mt-2 h-[88px] sm:h-[96px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assignedByTypeData.length > 0 ? assignedByTypeData : [{ name: "None", value: 1, fill: "rgba(148, 163, 184, 0.2)" }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={22}
                      outerRadius={34}
                      stroke="none"
                      dataKey="value"
                    >
                      {(assignedByTypeData.length > 0 ? assignedByTypeData : [{ name: "None", value: 1, fill: "rgba(148, 163, 184, 0.2)" }]).map((entry, index) => (
                        <Cell key={`type-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg font-extrabold font-mono leading-none text-white">{totalAssignedToHandler}</div>
                  <div className="mt-1 text-[8px] font-mono uppercase tracking-[0.18em] text-slate">Assigned</div>
                </div>
              </div>
              <div className="mt-1 space-y-1">
                {(assignedByTypeData.length > 0 ? assignedByTypeData : [{ name: "No assigned todos", value: 0, fill: "rgba(148, 163, 184, 0.35)" }]).slice(0, 2).map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between gap-1 text-[9px] text-slate">
                    <span className="inline-flex min-w-0 items-center gap-1 truncate">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          index === 0
                            ? "bg-lime"
                            : index === 1
                              ? "bg-yellow-400"
                              : "bg-slate"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{entry.name}</span>
                    </span>
                    <span className="font-mono text-paper">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-obsidian/30 p-2.5 sm:p-3" data-testid="dashboard-card-aging">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate">Inbox age</div>
              <div className="mt-2 h-[88px] sm:h-[96px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inboxAgingData} margin={{ top: 6, right: 0, left: -18, bottom: -8 }}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                    />
                    <YAxis hide domain={[0, "dataMax + 1"]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {inboxAgingData.map((entry, index) => (
                        <Cell
                          key={`aging-cell-${index}`}
                          fill={index === 2 ? "#f97316" : index === 1 ? "#facc15" : "#38bdf8"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 flex items-center justify-between text-[9px] text-slate">
                <span>Pending</span>
                <span className="font-mono text-paper">{items.length}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-obsidian/30 p-2.5 sm:p-3" data-testid="dashboard-card-completion">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate">Completed</div>
              <div className="relative mt-2 h-[88px] sm:h-[96px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={24}
                      outerRadius={34}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      {completionData.map((entry, index) => (
                        <Cell key={`completion-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-base font-extrabold font-mono leading-none text-white">{completedAssignedCount}</div>
                  <div className="mt-1 text-[8px] font-mono uppercase tracking-[0.18em] text-slate">Done</div>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[9px] text-slate">
                <span>Assigned done</span>
                <span className="font-mono text-paper">
                  {totalAssignedToHandler === 0 ? "0%" : `${Math.round((completedAssignedCount / totalAssignedToHandler) * 100)}%`}
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {!currentMode ? (
        <section className="overflow-x-auto" data-testid="todos-filter-rail">
          <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 rounded-2xl border border-white/10 bg-steel/35 p-1.5">
            {TODO_SCOPE_FILTERS.map((filter) => {
              const isActive =
                (scope === "all" && filter.key === "all") ||
                (scope === filter.key);
              const count =
                filter.key === "assignments"
                  ? assignmentCount
                  : filter.key === "tasks"
                    ? taskCount
                    : filter.key === "jobs"
                      ? jobCount
                      : allCount;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => navigate(filter.href)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-mono uppercase tracking-wider whitespace-nowrap hover-elevate ${
                    isActive
                      ? "border border-lime/35 bg-lime/15 text-lime"
                      : "border border-transparent text-slate hover:text-paper"
                  }`}
                  data-testid={`todos-filter-${filter.key}`}
                >
                  <span>{filter.label}</span>
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-bold ${
                    isActive ? "bg-lime text-obsidian" : "bg-obsidian/60 text-slate"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {!currentMode ? (
        <section className="space-y-2" data-testid="assignments-all-list">
          {list.isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-steel/30 p-4 text-sm text-slate">Loading todos…</div>
          ) : visibleItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-steel/30 p-4 text-sm text-slate">No active todos right now.</div>
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
            <div className="rounded-2xl border border-white/10 bg-steel/30 p-6 text-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate">Standby timer</div>
              <div className="mt-2 inline-flex items-center justify-center gap-2">
                <span
                  className="w-2 h-2 rounded-full bg-lime/55 motion-safe:animate-pulse motion-safe:[animation-duration:2.4s]"
                  aria-hidden="true"
                />
                <div
                  className="text-3xl font-extrabold font-mono tracking-tight text-paper/90 tabular-nums motion-safe:animate-pulse motion-safe:[animation-duration:2.4s]"
                >
                  00:00:00
                </div>
              </div>
              <div className="mt-3 text-sm text-slate">No current todo in progress for this handler.</div>
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
