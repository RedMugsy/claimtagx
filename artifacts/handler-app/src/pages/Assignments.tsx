import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clock3,
  Flag,
  GitBranch,
  MessageSquare,
  Mic,
  PackageCheck,
  PauseCircle,
  PlayCircle,
  Send,
  UserRoundPlus,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import {
  claimServiceRequest,
  completeServiceRequest,
  getListServiceRequestsQueryKey,
  listServiceRequests,
  type ServiceRequestKind,
} from "@workspace/api-client-react";
import { useStore } from "@/lib/store";
import { useSwipeHint } from "@/lib/useSwipeHint";
import {
  addSeedTextComment,
  addSeedVoiceComment,
  getActiveTodoSeedConfig,
  holdSeedTodo,
  listSeedComments,
  transferSeedTodo,
  type SeedComment,
} from "@/lib/active-todo-seed-api";

const TODO_TYPE_COLORS = ["#a3e635", "#facc15", "#38bdf8", "#c084fc", "#f97316"];

const TODO_SCOPE_FILTERS = [
  { key: "assignments", label: "Assignments", href: "/assignments/assignments" },
  { key: "tasks", label: "Tasks", href: "/assignments/tasks" },
  { key: "jobs", label: "Jobs", href: "/assignments/jobs" },
  { key: "all", label: "All", href: "/assignments" },
] as const;

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

function formatRecordingDuration(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AssignmentsPage() {
  const { activeVenue, session, assets } = useStore();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [now, setNow] = useState(() => Date.now());
  const [workflowById, setWorkflowById] = useState<Record<string, WorkflowState>>(
    () => readWorkflowState(),
  );

  const [showPipeline, setShowPipeline] = useState(true);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showHoldSelector, setShowHoldSelector] = useState(false);
  const [showTransferSelector, setShowTransferSelector] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  const [transferTarget, setTransferTarget] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceRecordingTick, setVoiceRecordingTick] = useState(0);
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationChecked, setVerificationChecked] = useState(false);
  const showSwipeHint = useSwipeHint("handler.hints.swipe.assignments.v1");
  const [localSeedComments, setLocalSeedComments] = useState<SeedComment[]>([]);
  const swipeStartRef = useRef<{ x: number; y: number; at: number } | null>(null);
  const swipeAxisLockRef = useRef<"x" | "y" | null>(null);
  const voiceHoldStartRef = useRef<number | null>(null);

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

  const items = (list.data ?? []).filter((r) => r.status === "open" || r.status === "claimed");

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
    if (scope === "assignments") return items.filter((r) => r.status === "open");
    if (scope === "tasks") {
      return items.filter((r) => {
        const claimedBy = (r.claimedByName ?? "").trim().toLowerCase();
        return r.status === "claimed" && claimedBy === currentHandlerName;
      });
    }
    if (scope === "jobs") return items.filter((r) => r.status === "claimed");
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

  const seedConfigQuery = useQuery({
    queryKey: ["active-todo-seed-config", currentAssignment?.id, currentAssignment?.kind],
    queryFn: () => getActiveTodoSeedConfig(currentAssignment?.kind ?? "other"),
    enabled: Boolean(currentAssignment),
  });

  const seedCommentsQuery = useQuery({
    queryKey: ["active-todo-seed-comments", currentAssignment?.id],
    queryFn: () => listSeedComments(currentAssignment?.id ?? "seed-default"),
    enabled: Boolean(currentAssignment),
  });

  useEffect(() => {
    setLocalSeedComments(seedCommentsQuery.data ?? []);
  }, [seedCommentsQuery.data]);

  useEffect(() => {
    if (!isVoiceRecording) return;
    const id = window.setInterval(() => setVoiceRecordingTick(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [isVoiceRecording]);

  useEffect(() => {
    setIsOnHold(false);
    setShowHoldSelector(false);
    setShowTransferSelector(false);
    setHoldReason("");
    setTransferTarget("");
    setCommentDraft("");
    setIsVoiceRecording(false);
    setVoiceRecordingTick(0);
    voiceHoldStartRef.current = null;
    setVerificationInput("");
    setVerificationChecked(false);
    setShowPipeline(true);
  }, [currentAssignment?.id]);

  const claimMutation = useMutation({
    mutationFn: async (id: string) => claimServiceRequest(venueCode, id),
    onSuccess: async (claimed) => {
      await queryClient.invalidateQueries({ queryKey: getListServiceRequestsQueryKey(venueCode) });
      navigate(`/assignments/current?id=${encodeURIComponent(claimed.id)}`);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => completeServiceRequest(venueCode, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getListServiceRequestsQueryKey(venueCode) });
      navigate("/assignments");
    },
  });

  const holdMutation = useMutation({
    mutationFn: async (payload: { id: string; reason: string }) => holdSeedTodo(payload.id, payload.reason),
    onSuccess: () => setIsOnHold(true),
  });

  const transferMutation = useMutation({
    mutationFn: async (payload: { id: string; target: string }) => transferSeedTodo(payload.id, payload.target),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getListServiceRequestsQueryKey(venueCode) });
      navigate("/assignments");
    },
  });

  const addTextCommentMutation = useMutation({
    mutationFn: async (payload: { id: string; body: string }) =>
      addSeedTextComment(payload.id, payload.body, session?.handlerName ?? "Handler"),
    onSuccess: (note) => {
      setLocalSeedComments((prev) => [note, ...prev]);
      setCommentDraft("");
    },
  });

  const addVoiceCommentMutation = useMutation({
    mutationFn: async (id: string) => addSeedVoiceComment(id, session?.handlerName ?? "Handler"),
    onSuccess: (note) => setLocalSeedComments((prev) => [note, ...prev]),
  });

  const startVoiceNoteHold = () => {
    if (!currentAssignment || addVoiceCommentMutation.isPending || addTextCommentMutation.isPending) return;
    if (commentDraft.trim()) return;
    if (isVoiceRecording) return;
    voiceHoldStartRef.current = Date.now();
    setVoiceRecordingTick(Date.now());
    setIsVoiceRecording(true);
  };

  const stopVoiceNoteHold = () => {
    if (!isVoiceRecording) return;
    setIsVoiceRecording(false);
    setVoiceRecordingTick(0);
    const startedAt = voiceHoldStartRef.current;
    voiceHoldStartRef.current = null;
    if (!currentAssignment || !startedAt) return;
    const heldMs = Date.now() - startedAt;
    if (heldMs < 220) return;
    addVoiceCommentMutation.mutate(currentAssignment.id);
  };

  const currentWorkflow = currentAssignment ? workflowById[currentAssignment.id] : undefined;
  const currentStage: WorkflowStage = currentWorkflow?.stage ?? "idle";
  const voiceRecordingDurationMs = isVoiceRecording && voiceHoldStartRef.current
    ? Math.max(0, voiceRecordingTick - voiceHoldStartRef.current)
    : 0;

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

  const stationTodosByTypeData = useMemo(() => {
    const grouped = new Map<string, number>();
    items.forEach((row) => {
      const label = KIND_LABEL[row.kind];
      grouped.set(label, (grouped.get(label) ?? 0) + 1);
    });
    return Array.from(grouped.entries()).map(([name, value], index) => ({
      name,
      value,
      fill: TODO_TYPE_COLORS[index % TODO_TYPE_COLORS.length],
    }));
  }, [items]);

  const inboxAgingData = useMemo(() => {
    const buckets = [
      { name: "Now", value: 0 },
      { name: "Soon", value: 0 },
      { name: "Late", value: 0 },
    ];

    items.forEach((row) => {
      const ageMinutes = Math.max(0, (now - row.createdAt) / 60000);
      if (ageMinutes < 5) buckets[0].value += 1;
      else if (ageMinutes < 15) buckets[1].value += 1;
      else buckets[2].value += 1;
    });

    return buckets;
  }, [items, now]);

  const stationStatusData = useMemo(
    () => [
      { name: "Unassigned", value: assignmentCount, fill: "#38bdf8" },
      { name: "Assigned", value: jobCount, fill: "#a3e635" },
    ],
    [assignmentCount, jobCount],
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
  const currentStageElapsedMs = currentStageStart ? Math.max(0, now - currentStageStart) : 0;
  const slaLimitMs = (seedConfigQuery.data?.maxMinutes ?? 10) * 60_000;
  const isSlaBreached = currentStage !== "ready" && currentStageElapsedMs > slaLimitMs;

  const completionTriggerType = seedConfigQuery.data?.completionTriggerType ?? "button";
  const completionTriggerLabel = seedConfigQuery.data?.completionLabel ?? "Complete todo";
  const completionAllowed =
    completionTriggerType === "button"
      ? true
      : completionTriggerType === "input"
        ? verificationInput.trim().toUpperCase() === (currentAssignment?.ticketId ?? "").toUpperCase()
        : verificationChecked;

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
      if (existing.stage === "idle") next = { ...existing, stage: "started", startedAt: ts };
      else if (existing.stage === "started") next = { ...existing, stage: "collected", collectedAt: ts };
      else if (existing.stage === "collected") next = { ...existing, stage: "arrived", arrivedAt: ts };
      else if (existing.stage === "arrived") next = { ...existing, stage: "ready", readyAt: ts };
      return { ...prev, [currentAssignment.id]: next };
    });
  };

  const onPageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    swipeStartRef.current = { x: t.clientX, y: t.clientY, at: Date.now() };
    swipeAxisLockRef.current = null;
  };

  const onPageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    if (!start) return;
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (!swipeAxisLockRef.current && (absX > 14 || absY > 14)) {
      swipeAxisLockRef.current = absX > absY ? "x" : "y";
    }
    if (swipeAxisLockRef.current && (absX > 24 || absY > 24)) {
      e.preventDefault();
    }
  };

  const onPageTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.at;
    swipeAxisLockRef.current = null;
    const maxSwipeDuration = currentMode ? 650 : 800;
    if (dt > maxSwipeDuration) return;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const minHorizontalSwipe = currentMode ? 70 : 48;
    const dominanceRatio = currentMode ? 1.15 : 0.85;
    const edgeSwipe = start.x <= 44 && dx > 36 && absX > absY * 0.7;
    const hasValidHorizontalSwipe = absX >= minHorizontalSwipe && absX > absY * dominanceRatio;
    if (!edgeSwipe && !hasValidHorizontalSwipe) return;
    if (dx > 0) {
      navigate("/");
    }
  };

  return (
    <div
      className="space-y-4"
      data-testid="page-assignments"
      onTouchStart={onPageTouchStart}
      onTouchMove={onPageTouchMove}
      onTouchEnd={onPageTouchEnd}
    >
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-mono uppercase tracking-wider text-slate hover:text-paper hover-elevate"
          data-testid="link-back-home"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Command Center
        </Link>
      </div>

      <header className="mb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-lime/30 bg-lime/15">
              <Briefcase className="h-5 w-5 text-lime" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-mono uppercase tracking-wider text-slate">
                {currentMode ? "Active todo" : "All todos"}
              </div>
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
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
              <Briefcase className="h-5 w-5 text-indigo-200/70" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate">All Todos</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/assignments/current")}
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border hover-elevate ${
                activeTodo
                  ? "border-lime/40 bg-lime/15 text-lime"
                  : "border-white/10 bg-steel/40 text-slate"
              }`}
              data-testid="button-open-current-assignment"
              aria-label="Open active todo"
              title={activeTodo ? "Active todo in progress" : "No active todo in progress"}
            >
              <PlayCircle className="h-4 w-4" />
              {activeTodo ? (
                <span className="absolute -bottom-2 left-1/2 whitespace-nowrap rounded-full border border-lime/35 bg-obsidian/90 px-1.5 py-0.5 text-[9px] font-mono font-bold tabular-nums text-lime -translate-x-1/2">
                  {activeTodoTimer ?? "00:00"}
                </span>
              ) : null}
            </button>
          )}
        </div>
      </header>

      {showSwipeHint ? (
        <div
          className="-mt-1 mb-1 inline-flex items-center rounded-full border border-white/10 bg-obsidian/35 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate"
          data-testid="hint-swipe-back-assignments"
        >
          Swipe right to return to Command Center
        </div>
      ) : null}

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
                      data={stationTodosByTypeData.length > 0 ? stationTodosByTypeData : [{ name: "None", value: 1, fill: "rgba(148, 163, 184, 0.2)" }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={22}
                      outerRadius={34}
                      stroke="none"
                      dataKey="value"
                    >
                      {(stationTodosByTypeData.length > 0 ? stationTodosByTypeData : [{ name: "None", value: 1, fill: "rgba(148, 163, 184, 0.2)" }]).map((entry, index) => (
                        <Cell key={`type-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg font-extrabold font-mono leading-none text-white">{allCount}</div>
                  <div className="mt-1 text-[8px] font-mono uppercase tracking-[0.18em] text-slate">Station</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-obsidian/30 p-2.5 sm:p-3" data-testid="dashboard-card-aging">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate">Inbox age</div>
              <div className="mt-2 h-[88px] sm:h-[96px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inboxAgingData} margin={{ top: 6, right: 0, left: -18, bottom: -8 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <YAxis hide domain={[0, "dataMax + 1"]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {inboxAgingData.map((_, index) => (
                        <Cell key={`aging-cell-${index}`} fill={index === 2 ? "#f97316" : index === 1 ? "#facc15" : "#38bdf8"} />
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

            <div className="rounded-2xl border border-white/10 bg-obsidian/30 p-2.5 sm:p-3" data-testid="dashboard-card-status">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate">Status</div>
              <div className="relative mt-2 h-[88px] sm:h-[96px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stationStatusData.some((d) => d.value > 0) ? stationStatusData : [{ name: "None", value: 1, fill: "rgba(148, 163, 184, 0.2)" }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={24}
                      outerRadius={34}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      {(stationStatusData.some((d) => d.value > 0) ? stationStatusData : [{ name: "None", value: 1, fill: "rgba(148, 163, 184, 0.2)" }]).map((entry, index) => (
                        <Cell key={`status-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-base font-extrabold font-mono leading-none text-sky-300">{assignmentCount}</div>
                  <div className="mt-1 text-[8px] font-mono uppercase tracking-[0.18em] text-slate">Open</div>
                </div>
              </div>
              <div className="mt-1 space-y-1 text-[9px] text-slate">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden="true" />Unassigned</span>
                  <span className="font-mono text-paper">{assignmentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />Assigned</span>
                  <span className="font-mono text-paper">{jobCount}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {!currentMode ? (
        <section className="overflow-x-auto" data-testid="todos-filter-rail">
          <div className="inline-flex min-w-full items-center gap-1 rounded-2xl border border-white/10 bg-steel/35 p-1.5 sm:min-w-0">
            {TODO_SCOPE_FILTERS.map((filter) => {
              const isActive = (scope === "all" && filter.key === "all") || scope === filter.key;
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
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover-elevate ${
                    isActive
                      ? "border border-lime/35 bg-lime/15 text-lime"
                      : "border border-transparent text-slate hover:text-paper"
                  }`}
                  data-testid={`todos-filter-${filter.key}`}
                >
                  <span>{filter.label}</span>
                  <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
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
              const isUnassigned = row.status === "open";
              return (
                <div key={row.id} className="w-full rounded-2xl border border-white/10 bg-steel/40 p-3" data-testid={`assignment-row-${row.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold text-white">{KIND_LABEL[row.kind]}</div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate">{row.status}</span>
                  </div>
                  <div className="mt-1 truncate text-xs text-slate">
                    Requested by <span className="text-paper">{row.requestedByName}</span> · Ticket <span className="text-paper">{row.ticketId}</span>
                  </div>
                  <div className="mt-1.5 text-[10px] font-mono uppercase tracking-wider text-slate">
                    {isMine ? "You" : row.claimedByName ? `Claimed by ${row.claimedByName}` : "Unclaimed"} · Workflow {stage}
                  </div>

                  <div className="mt-2.5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/assignments/current?id=${encodeURIComponent(row.id)}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-obsidian/35 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-paper hover-elevate"
                    >
                      Open
                    </button>
                    {isUnassigned ? (
                      <button
                        type="button"
                        onClick={() => claimMutation.mutate(row.id)}
                        disabled={claimMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-lg border border-lime/35 bg-lime/12 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-lime disabled:opacity-60"
                        data-testid={`assignment-claim-${row.id}`}
                      >
                        <UserRoundPlus className="h-3.5 w-3.5" /> Claim
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </section>
      ) : (
        <section className="space-y-3" data-testid="assignment-current-detail">
          {!currentAssignment ? (
            <>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-steel/40 p-4 opacity-75" data-testid="active-todo-empty-preview">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-white">Active Todo Preview</div>
                    <div className="mt-0.5 text-xs text-slate">Controls stay visible while waiting for a claimed todo.</div>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-obsidian/35 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-paper"
                    aria-label="Todo pipeline"
                  >
                    <GitBranch className="h-3.5 w-3.5" /> Pipeline
                  </button>
                </div>

                <div className="rounded-xl border border-white/10 bg-obsidian/40 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate">Retrieval timer</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate">TA max 10 min</div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-lg text-white">
                    <Clock3 className="h-4 w-4 text-lime" /> 00:00
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" disabled className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 disabled:opacity-60">
                    <PauseCircle className="h-4 w-4" /> Hold
                  </button>
                  <button type="button" disabled className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 disabled:opacity-60">
                    <UserRoundPlus className="h-4 w-4" /> Transfer
                  </button>
                </div>

                <div className="space-y-2 rounded-xl border border-white/10 bg-obsidian/35 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate">Completion trigger</div>
                  <button type="button" disabled className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-60">
                    <CheckCircle2 className="h-4 w-4" /> Complete todo
                  </button>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-steel/30 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate">Comments</div>
                  <div className="flex items-center gap-2">
                    <input
                      disabled
                      placeholder="Add comment for handoff/context"
                      className="flex-1 rounded-lg border border-white/10 bg-obsidian/60 px-2.5 py-2 text-xs text-paper placeholder:text-slate disabled:opacity-60"
                    />
                    <button type="button" disabled className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-obsidian/40 px-2.5 py-2 text-[10px] font-mono uppercase tracking-wider text-paper disabled:opacity-60">
                      <Mic className="h-3.5 w-3.5" /> Voice
                    </button>
                  </div>
                  <div className="text-xs text-slate">No comments yet.</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-steel/30 p-4">
                  <div className="mb-2 text-[10px] font-mono uppercase tracking-wider text-slate">Todo pipeline</div>
                  <div className="text-xs text-slate">No pipeline points yet.</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-steel/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-white">{KIND_LABEL[currentAssignment.kind]}</div>
                    <div className="mt-0.5 text-xs text-slate">
                      Requested by <span className="text-paper">{currentAssignment.requestedByName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPipeline((prev) => !prev)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-obsidian/35 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-paper hover-elevate"
                      aria-label="Toggle todo pipeline"
                      data-testid="button-toggle-todo-pipeline"
                    >
                      <GitBranch className="h-3.5 w-3.5" /> Pipeline
                    </button>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                      isOnHold
                        ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                        : "border-white/10 bg-obsidian/40 text-paper"
                    }`}>
                      {isOnHold ? "On hold" : currentStage}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-obsidian/40 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate">{stateTimerLabel(currentStage)}</div>
                    <div className={`text-[10px] font-mono uppercase tracking-wider ${isSlaBreached ? "text-amber-300" : "text-slate"}`}>
                      TA max {(seedConfigQuery.data?.maxMinutes ?? 10)} min
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-mono text-lg text-white">
                      <Clock3 className={`h-4 w-4 ${isSlaBreached ? "text-amber-300" : "text-lime"}`} />
                      {currentStageTimer ?? "00:00"}
                    </div>
                    {isSlaBreached ? (
                      <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-200">
                        Over SLA
                      </span>
                    ) : null}
                  </div>
                </div>

                {!((currentAssignment.claimedByName ?? "").trim().toLowerCase() === currentHandlerName) && currentAssignment.status === "open" ? (
                  <button
                    type="button"
                    onClick={() => claimMutation.mutate(currentAssignment.id)}
                    disabled={claimMutation.isPending}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-lime/35 bg-lime/12 px-3 py-2 text-sm font-semibold text-lime disabled:opacity-60"
                    data-testid="button-claim-current-assignment"
                  >
                    <UserRoundPlus className="h-4 w-4" /> Claim this todo
                  </button>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isOnHold) {
                        setIsOnHold(false);
                        setHoldReason("");
                        setShowHoldSelector(false);
                        return;
                      }
                      setShowTransferSelector(false);
                      setShowHoldSelector((prev) => !prev);
                    }}
                    disabled={holdMutation.isPending}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200"
                    data-testid="button-hold-todo"
                  >
                    <PauseCircle className="h-4 w-4" /> {isOnHold ? "Resume" : "Hold"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHoldSelector(false);
                      setShowTransferSelector((prev) => !prev);
                    }}
                    disabled={transferMutation.isPending}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 disabled:opacity-60"
                    data-testid="button-transfer-todo"
                  >
                    <UserRoundPlus className="h-4 w-4" /> Transfer
                  </button>
                </div>

                {showHoldSelector && !isOnHold ? (
                  <div className="space-y-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3" data-testid="panel-hold-reason">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-amber-100">Select hold justification</div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                      <select
                        value={holdReason}
                        onChange={(e) => setHoldReason(e.target.value)}
                        aria-label="Hold reason"
                        title="Hold reason"
                        className="rounded-lg border border-white/10 bg-obsidian/60 px-2.5 py-2 text-xs text-paper"
                      >
                        <option value="">Select hold reason</option>
                        {(seedConfigQuery.data?.holdReasons ?? ["Operational hold"]).map((reason) => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          holdMutation.mutate({
                            id: currentAssignment.id,
                            reason: holdReason,
                          })
                        }
                        disabled={!holdReason || holdMutation.isPending}
                        className="inline-flex items-center justify-center rounded-lg border border-amber-300/40 bg-amber-500/20 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-100 disabled:opacity-50"
                        data-testid="button-confirm-hold"
                      >
                        Confirm hold
                      </button>
                    </div>
                  </div>
                ) : null}

                {showTransferSelector ? (
                  <div className="space-y-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3" data-testid="panel-transfer-target">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-100">Select transfer target</div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                      <select
                        value={transferTarget}
                        onChange={(e) => setTransferTarget(e.target.value)}
                        aria-label="Transfer target"
                        title="Transfer target"
                        className="rounded-lg border border-white/10 bg-obsidian/60 px-2.5 py-2 text-xs text-paper"
                      >
                        <option value="">Select transfer target</option>
                        {(seedConfigQuery.data?.transferTargets ?? ["Shift Supervisor"]).map((target) => (
                          <option key={target} value={target}>{target}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          transferMutation.mutate({
                            id: currentAssignment.id,
                            target: transferTarget,
                          })
                        }
                        disabled={!transferTarget || transferMutation.isPending}
                        className="inline-flex items-center justify-center rounded-lg border border-cyan-300/40 bg-cyan-500/20 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-cyan-100 disabled:opacity-50"
                        data-testid="button-confirm-transfer"
                      >
                        Confirm transfer
                      </button>
                    </div>
                  </div>
                ) : null}

                {!isOnHold ? (
                  <button
                    type="button"
                    onClick={advanceCurrentStage}
                    disabled={currentStage === "ready"}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-lime/30 bg-lime/10 px-3 py-2 text-sm font-semibold text-lime hover-elevate disabled:opacity-50"
                    data-testid="button-assignment-next-stage"
                  >
                    {currentStage === "ready" ? <CheckCircle2 className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
                    {stateActionLabel(currentStage)}
                  </button>
                ) : (
                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    This todo is currently on hold. Resume to continue execution.
                  </div>
                )}

                <div className="space-y-2 rounded-xl border border-white/10 bg-obsidian/35 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate">Completion trigger</div>
                  {completionTriggerType === "input" ? (
                    <input
                      value={verificationInput}
                      onChange={(e) => setVerificationInput(e.target.value)}
                      placeholder={`Type ticket ${currentAssignment.ticketId}`}
                      className="w-full rounded-lg border border-white/10 bg-obsidian/60 px-2.5 py-2 text-xs text-paper placeholder:text-slate focus:outline-none focus:ring-1 focus:ring-lime/40"
                    />
                  ) : null}
                  {completionTriggerType === "verification" ? (
                    <label className="inline-flex items-center gap-2 text-xs text-paper">
                      <input
                        type="checkbox"
                        checked={verificationChecked}
                        onChange={(e) => setVerificationChecked(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-white/20 bg-obsidian/60"
                      />
                      Verification completed
                    </label>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => completeMutation.mutate(currentAssignment.id)}
                    disabled={!completionAllowed || completeMutation.isPending}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-50"
                    data-testid="button-complete-todo"
                  >
                    <CheckCircle2 className="h-4 w-4" /> {completionTriggerLabel}
                  </button>
                </div>

                {currentStage === "ready" ? (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100" data-testid="assignment-ready-signal">
                    <Flag className="mr-1 inline-block h-3.5 w-3.5" />
                    Ready for release state is active and can now be surfaced to the ticket-facing patron experience.
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-steel/30 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate">Comments</div>
                <div className="flex items-center gap-2">
                  <input
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="Add comment for handoff/context"
                    className="flex-1 rounded-lg border border-white/10 bg-obsidian/60 px-2.5 py-2 text-xs text-paper placeholder:text-slate focus:outline-none focus:ring-1 focus:ring-lime/40"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!commentDraft.trim()) return;
                      addTextCommentMutation.mutate({ id: currentAssignment.id, body: commentDraft.trim() });
                    }}
                    onMouseDown={() => {
                      if (commentDraft.trim()) return;
                      startVoiceNoteHold();
                    }}
                    onMouseUp={stopVoiceNoteHold}
                    onMouseLeave={stopVoiceNoteHold}
                    onTouchStart={(e) => {
                      if (commentDraft.trim()) return;
                      e.preventDefault();
                      startVoiceNoteHold();
                    }}
                    onTouchEnd={(e) => {
                      if (commentDraft.trim()) return;
                      e.preventDefault();
                      stopVoiceNoteHold();
                    }}
                    disabled={
                      commentDraft.trim()
                        ? addTextCommentMutation.isPending
                        : addVoiceCommentMutation.isPending
                    }
                    className={`inline-flex min-w-[76px] items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-[10px] font-mono uppercase tracking-wider disabled:opacity-50 ${
                      commentDraft.trim()
                        ? "border border-lime/35 bg-lime/12 text-lime"
                        : isVoiceRecording
                          ? "border border-rose-400/40 bg-rose-500/15 text-rose-100"
                          : "border border-white/10 bg-obsidian/40 text-paper"
                    }`}
                    data-testid={commentDraft.trim() ? "button-send-text-comment" : "button-hold-voice-comment"}
                  >
                    {commentDraft.trim() ? (
                      <>
                        <Send className="h-3.5 w-3.5" /> Send
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5" /> {isVoiceRecording ? `Rec ${formatRecordingDuration(voiceRecordingDurationMs)}` : "Voice"}
                      </>
                    )}
                  </button>
                </div>
                {!commentDraft.trim() ? (
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate">
                    {isVoiceRecording
                      ? `Recording ${formatRecordingDuration(voiceRecordingDurationMs)} · release to send`
                      : "Press and hold voice to record"}
                  </div>
                ) : null}
                {localSeedComments.length === 0 ? (
                  <div className="text-xs text-slate">No comments yet.</div>
                ) : (
                  <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                    {localSeedComments.map((note) => (
                      <li key={note.id} className="rounded-lg border border-white/10 bg-obsidian/35 px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-slate">
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" /> {note.kind === "voice" ? "Voice" : "Text"}
                          </span>
                          <span>{new Date(note.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className="mt-1 text-xs text-paper">
                          {note.kind === "voice" ? `Voice note (${note.durationSec ?? 0}s)` : note.body}
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate">{note.by}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {showPipeline ? (
                <div className="rounded-2xl border border-white/10 bg-steel/30 p-4">
                  <div className="mb-2 text-[10px] font-mono uppercase tracking-wider text-slate">Todo pipeline</div>
                  {timeline.length === 0 ? (
                    <div className="text-xs text-slate">No pipeline points yet.</div>
                  ) : (
                    <ul className="space-y-1.5">
                      {timeline.map((row) => (
                        <li key={`${row.label}-${row.at}`} className="rounded-lg border border-white/10 bg-obsidian/30 px-2.5 py-1.5">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-paper">{row.label}</span>
                            <span className="font-mono text-slate">
                              {row.at ? new Date(row.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </>
          )}
        </section>
      )}
    </div>
  );
}
