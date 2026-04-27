import type { ServiceRequestKind } from "@workspace/api-client-react";

export type CompletionTriggerType = "button" | "input" | "verification";

export type SeedComment = {
  id: string;
  kind: "text" | "voice";
  body: string;
  by: string;
  at: number;
  durationSec?: number;
};

export type ActiveTodoSeedConfig = {
  maxMinutes: number;
  completionTriggerType: CompletionTriggerType;
  completionLabel: string;
  holdReasons: string[];
  transferTargets: string[];
  pipelineLabels: string[];
};

const DEFAULT_PIPELINE = [
  "Requested",
  "Claimed",
  "Started retrieval",
  "Collected asset",
  "Arrived",
  "Ready for release",
  "Completed",
];

const CONFIG_BY_KIND: Record<ServiceRequestKind, ActiveTodoSeedConfig> = {
  bring_my_car: {
    maxMinutes: 12,
    completionTriggerType: "verification",
    completionLabel: "Vehicle delivered to patron",
    holdReasons: ["Patron unavailable", "Vehicle queue", "Supervisor review required"],
    transferTargets: ["Floor Supervisor", "Runner Team A", "Valet Lead"],
    pipelineLabels: DEFAULT_PIPELINE,
  },
  fetch_my_coat: {
    maxMinutes: 8,
    completionTriggerType: "button",
    completionLabel: "Mark coat delivered",
    holdReasons: ["Coat check delay", "Ticket mismatch", "Patron unavailable"],
    transferTargets: ["Coatroom Lead", "Shift Supervisor", "Runner Team B"],
    pipelineLabels: DEFAULT_PIPELINE,
  },
  repack_my_bag: {
    maxMinutes: 15,
    completionTriggerType: "input",
    completionLabel: "Enter verification token",
    holdReasons: ["Awaiting guest confirmation", "Bag inspection", "Missing item"],
    transferTargets: ["Security Lead", "Shift Supervisor", "Runner Team A"],
    pipelineLabels: DEFAULT_PIPELINE,
  },
  deliver_to_table: {
    maxMinutes: 10,
    completionTriggerType: "button",
    completionLabel: "Mark table delivery complete",
    holdReasons: ["Table unavailable", "Route blocked", "Waiting coordinator"],
    transferTargets: ["Floor Supervisor", "Host Lead", "Runner Team C"],
    pipelineLabels: DEFAULT_PIPELINE,
  },
  other: {
    maxMinutes: 10,
    completionTriggerType: "button",
    completionLabel: "Mark request complete",
    holdReasons: ["Needs clarification", "Supervisor decision", "Customer unavailable"],
    transferTargets: ["Shift Supervisor", "Ops Manager", "Backup Handler"],
    pipelineLabels: DEFAULT_PIPELINE,
  },
};

const seededCommentsByTodoId = new Map<string, SeedComment[]>([
  [
    "seed-default",
    [
      {
        id: "seed-1",
        kind: "text",
        body: "Checked request details. Starting retrieval.",
        by: "System Seed",
        at: Date.now() - 5 * 60_000,
      },
    ],
  ],
]);

async function withTinyDelay<T>(value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return value;
}

export async function getActiveTodoSeedConfig(
  kind: ServiceRequestKind,
): Promise<ActiveTodoSeedConfig> {
  return withTinyDelay(CONFIG_BY_KIND[kind] ?? CONFIG_BY_KIND.other);
}

export async function listSeedComments(todoId: string): Promise<SeedComment[]> {
  const base = seededCommentsByTodoId.get(todoId) ?? seededCommentsByTodoId.get("seed-default") ?? [];
  return withTinyDelay([...base].sort((a, b) => b.at - a.at));
}

export async function addSeedTextComment(
  todoId: string,
  body: string,
  by: string,
): Promise<SeedComment> {
  const next: SeedComment = {
    id: `c-${Date.now()}`,
    kind: "text",
    body,
    by,
    at: Date.now(),
  };
  const existing = seededCommentsByTodoId.get(todoId) ?? [];
  seededCommentsByTodoId.set(todoId, [next, ...existing]);
  return withTinyDelay(next);
}

export async function addSeedVoiceComment(
  todoId: string,
  by: string,
): Promise<SeedComment> {
  const durationSec = Math.max(4, Math.floor(6 + Math.random() * 12));
  const next: SeedComment = {
    id: `v-${Date.now()}`,
    kind: "voice",
    body: "Voice note",
    by,
    at: Date.now(),
    durationSec,
  };
  const existing = seededCommentsByTodoId.get(todoId) ?? [];
  seededCommentsByTodoId.set(todoId, [next, ...existing]);
  return withTinyDelay(next);
}

export async function holdSeedTodo(
  todoId: string,
  reason: string,
): Promise<{ todoId: string; reason: string; heldAt: number }> {
  return withTinyDelay({ todoId, reason, heldAt: Date.now() });
}

export async function transferSeedTodo(
  todoId: string,
  target: string,
): Promise<{ todoId: string; target: string; transferredAt: number }> {
  return withTinyDelay({ todoId, target, transferredAt: Date.now() });
}
