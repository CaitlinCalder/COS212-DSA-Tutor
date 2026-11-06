// Shared core type contract for the COS212 BFS Tutor.
//The six skills A1–A6 are the single source of truth across quizzes,quests, the skill tree, the report, and the lecturer view.

//---- Skills (Part 1 & 2 own; everyone imports) ----
export type SkillId = "A1" | "A2" | "A3" | "A4" | "A5" | "A6";

export const SKILL_ORDER: readonly SkillId[] = ["A1", "A2", "A3", "A4", "A5", "A6"];

export interface Skill {
  id: SkillId;
  name: string;
  description: string;
  prerequisites: SkillId[]; // enforces A1..A6 chain for quest ordering
}

//Graph + BFS (Part 3 owns the visual; Part 1/2 reference the data)
export type VertexId = string;

export interface GraphModel {
  vertices: VertexId[];
  edges: { from: VertexId; to: VertexId }[];
  directed: boolean;
}

export interface BfsStep {
  action: "enqueue" | "dequeue" | "visit" | "skip";
  vertex: VertexId;
  queueAfter: VertexId[]; // queue contents after this step
  visitedAfter: VertexId[]; // visited set after this step
}
