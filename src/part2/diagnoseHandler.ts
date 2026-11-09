//diagnosis — responses -> correctness -> NPC -> six-skill result.
import type {
  DiagnosisResponse,
  QuizResponse,
  SkillId,
  SkillResult,
} from "../shared/types";
import { SKILL_ORDER, primarySkill } from "../shared/types";
import { diagnosticItems } from "../part1/content";
import { diagnosticQMatrix } from "../part1/qmatrix";
import { classify } from "./npc";

export interface DiagnoseRequest {
  responses: QuizResponse[];
}

// Pure: never mutates inputs. Skips/wrong/unknown answers count as incorrect.
export function diagnoseHandler(request: DiagnoseRequest): DiagnosisResponse {
  const { responses } = request;

  const selectedById = new Map<string, string | null>();
  for (const r of responses) selectedById.set(r.itemId, r.selectedOptionId);

  const correctness: Record<string, 0 | 1> = {};
  for (const item of diagnosticItems) {
    const selected = selectedById.get(item.id);
    correctness[item.id] = selected != null && selected === item.correctOptionId ? 1 : 0;
  }

  const mastery = classify(diagnosticQMatrix, correctness);

  //per-skill correct/total tally, grouped by each item's derived primary skill.
  const tally = {} as Record<SkillId, { correct: number; total: number }>;
  for (const s of SKILL_ORDER) tally[s] = { correct: 0, total: 0 };
  for (const item of diagnosticItems) {
    const skill = primarySkill(item);
    tally[skill].total += 1;
    if (correctness[item.id] === 1) tally[skill].correct += 1;
  }

  const results: SkillResult[] = SKILL_ORDER.map((skill) => ({
    skill,
    mastered: mastery[skill],
    correct: tally[skill].correct,
    total: tally[skill].total,
  }));

  return { bank: "diagnostic", mastery, results };
}
