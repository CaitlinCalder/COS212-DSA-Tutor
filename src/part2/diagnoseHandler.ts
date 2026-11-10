//diagnosis — responses -> correctness -> NPC -> six-skill result.
import type {
  DiagnosisResponse,
  QuizBankId,
  QuizItem,
  QuizResponse,
  SkillId,
  SkillResult,
} from "../shared/types";
import { SKILL_ORDER, primarySkill } from "../shared/types";
import { diagnosticItems, recheckItems } from "../part1/content";
import { qMatrixFor } from "../part1/qmatrix";
import { classify } from "./npc";

export interface DiagnoseRequest {
  responses: QuizResponse[];
  // Which bank the responses belong to; defaults to the diagnostic bank.
  bank?: QuizBankId;
}

const itemsFor = (bank: QuizBankId): QuizItem[] =>
  bank === "recheck" ? recheckItems : diagnosticItems;

// Pure: never mutates inputs. Skips/wrong/unknown answers count as incorrect.
export function diagnoseHandler(request: DiagnoseRequest): DiagnosisResponse {
  const { responses, bank = "diagnostic" } = request;
  const items = itemsFor(bank);

  const selectedById = new Map<string, string | null>();
  for (const r of responses) selectedById.set(r.itemId, r.selectedOptionId);

  const correctness: Record<string, 0 | 1> = {};
  for (const item of items) {
    const selected = selectedById.get(item.id);
    correctness[item.id] = selected != null && selected === item.correctOptionId ? 1 : 0;
  }

  const mastery = classify(qMatrixFor(bank), correctness);

  //per-skill correct/total tally, grouped by each item's derived primary skill.
  const tally = {} as Record<SkillId, { correct: number; total: number }>;
  for (const s of SKILL_ORDER) tally[s] = { correct: 0, total: 0 };
  for (const item of items) {
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

  return { bank, mastery, results };
}
