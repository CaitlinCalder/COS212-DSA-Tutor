//test to see if it fixed errors that it couldnt classify
//fallback scorer — per-skill % correct vs a threshold, used if NPC is unavailable.

import type { QuizItem, QuizResponse, SkillId, SkillResult } from "../shared/types";
import { SKILL_ORDER, primarySkill } from "../shared/types";

export const DEFAULT_THRESHOLD = 0.6;

//pure: one result per skill; skipped/wrong = incorrect; mastered = correct/total >= threshold.
export function scoreQuizThreshold(
  items: QuizItem[],
  responses: QuizResponse[],
  threshold: number = DEFAULT_THRESHOLD,
): SkillResult[] {
  const selectedById = new Map<string, string | null>();
  for (const r of responses) selectedById.set(r.itemId, r.selectedOptionId);

  const tally = {} as Record<SkillId, { correct: number; total: number }>;
  for (const s of SKILL_ORDER) tally[s] = { correct: 0, total: 0 };

  for (const item of items) {
    const skill = primarySkill(item);
    tally[skill].total += 1;
    const selected = selectedById.get(item.id);
    if (selected != null && selected === item.correctOptionId) tally[skill].correct += 1;
  }

  return SKILL_ORDER.map((skill) => {
    const { correct, total } = tally[skill];
    return { skill, mastered: total > 0 && correct / total >= threshold, correct, total };
  });
}
