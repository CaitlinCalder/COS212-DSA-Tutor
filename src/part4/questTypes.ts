import type { GraphModel, SkillId, VertexId } from "../shared/types";

export interface QuestPlan {
  questSkills: SkillId[];
  confidenceSkill?: SkillId;
}

export interface QuestCompletion {
  skillId: SkillId;
  variantId: string;
  confidence: boolean;
}

export interface QuestChallenge {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  hints: [string, string, string];
  queue?: VertexId[];
  highlightedRoute?: VertexId[];
  routeDestination?: VertexId;
  feedbackReplayStep?: number;
}

export interface QuestVariant {
  id: string;
  graph: GraphModel;
  start: VertexId;
  walkthrough: string[];
  guided: QuestChallenge;
  independent: QuestChallenge;
}

export interface QuestDefinition {
  skillId: SkillId;
  title: string;
  district: string;
  learningGoal: string;
  variants: QuestVariant[];
}
