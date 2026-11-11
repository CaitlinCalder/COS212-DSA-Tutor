//helpers for the multi-representation worked examples
import type { BfsStep, VertexId } from "../shared/types";

export type ViewMode = "see" | "hear" | "read" | "do";

export interface ViewModeInfo {
  id: ViewMode;
  label: string;
  preferenceLabel: string;
  description: string;
}

export const VIEW_MODES: readonly ViewModeInfo[] = [
  {
    id: "see",
    label: "Picture",
    preferenceLabel: "Seeing it drawn",
    description: "A diagram of the town network and the queue.",
  },
  {
    id: "hear",
    label: "Listen",
    preferenceLabel: "Hearing it explained",
    description: "Each step read aloud, with captions.",
  },
  {
    id: "read",
    label: "Read",
    preferenceLabel: "Reading it step by step",
    description: "A written trace table and pseudocode.",
  },
  {
    id: "do",
    label: "Try it",
    preferenceLabel: "Having a go myself",
    description: "Click the towns to run the example yourself.",
  },
];

export const DEFAULT_VIEW_MODE: ViewMode = "see";

const STORAGE_KEY = "cos212-tutor.view-preference";

const isViewMode = (value: unknown): value is ViewMode =>
  VIEW_MODES.some((mode) => mode.id === value);

// Storage can be unavailable (private mode, blocked cookies), so every access is guarded.
export function loadViewPreference(): ViewMode | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isViewMode(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function saveViewPreference(mode: ViewMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Preference simply won't persist; the app keeps working.
  }
}

const list = (vertices: VertexId[]) => (vertices.length > 0 ? vertices.join(", ") : "empty");

//sentence describing a single BFS step
export function describeBfsStep(step: BfsStep): string {
  switch (step.action) {
    case "enqueue":
      return `Town ${step.vertex} joins the back of the queue.`;
    case "dequeue":
      return `Town ${step.vertex} leaves the front of the queue.`;
    case "visit":
      return `Town ${step.vertex} is visited.`;
    case "skip":
      return `Town ${step.vertex} was already discovered, so it is skipped.`;
  }
}

//text spoken (and shown as a caption) in the Listen view
export function narrationFor(walkthroughText: string, step?: BfsStep): string {
  if (!step) return walkthroughText;
  return [
    walkthroughText,
    describeBfsStep(step),
    `The queue is now ${list(step.queueAfter)}.`,
    `Visited so far: ${list(step.visitedAfter)}.`,
  ].join(" ");
}

export const BFS_PSEUDOCODE: readonly string[] = [
  "BFS(graph, start):",
  "  create an empty queue",
  "  mark start as discovered, then enqueue(start)",
  "  while the queue is not empty:",
  "    town = dequeue()",
  "    visit(town)",
  "    for each neighbour of town:",
  "      if neighbour is already discovered: skip it",
  "      otherwise: mark it discovered, then enqueue(neighbour)",
];

export function pseudocodeLineFor(step: BfsStep, stepIndex: number): number {
  switch (step.action) {
    case "enqueue":
      return stepIndex === 0 ? 2 : 8;
    case "dequeue":
      return 4;
    case "visit":
      return 5;
    case "skip":
      return 7;
  }
}

//indices of the "dequeue" steps: the decisions the learner makes in try it mode
export function dequeueIndices(steps: BfsStep[]): number[] {
  const indices: number[] = [];
  steps.forEach((step, index) => {
    if (step.action === "dequeue") indices.push(index);
  });
  return indices;
}

export function stepShownAfterDecisions(steps: BfsStep[], decisionsMade: number): number {
  const dequeues = dequeueIndices(steps);
  return (dequeues[decisionsMade] ?? steps.length) - 1;
}
