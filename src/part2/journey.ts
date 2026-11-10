//to make part 5 easier: thin orchestration of the diagnose -> profile -> plan -> re-check flow
import type {
  DiagnosisResponse,
  QuizBankId,
  QuizResponse,
  SkillId,
  SkillProfile,
} from "../shared/types";
import { primarySkill } from "../shared/types";
import type { QuestPlan } from "../part4/questTypes";
import { diagnosticItems, recheckItems } from "../part1/content";
import { diagnoseHandler } from "./diagnoseHandler";
import { applyRecheck, buildDiagnosticProfile, freshProfile, markQuestTentative } from "./profile";
import { planQuests } from "./planQuests";
import { scoreQuizThreshold, DEFAULT_THRESHOLD } from "./scoreQuizThreshold";

// Injectable so Part 5 can swap in an HTTP client and tests can force the fallback.
export type DiagnoseFn = (responses: QuizResponse[], bank: QuizBankId) => DiagnosisResponse;

export interface JourneyOptions {
  diagnoseFn?: DiagnoseFn;
  fallbackThreshold?: number;
}

const defaultDiagnoseFn: DiagnoseFn = (responses, bank) => diagnoseHandler({ responses, bank });

const bankItems = (bank: QuizBankId) => (bank === "recheck" ? recheckItems : diagnosticItems);

// Diagnose the responses for a bank; fall back to the threshold scorer if the diagnose function throws.
function diagnose(responses: QuizResponse[], bank: QuizBankId, options: JourneyOptions) {
  const diagnoseFn = options.diagnoseFn ?? defaultDiagnoseFn;
  try {
    return diagnoseFn(responses, bank).results;
  } catch {
    return scoreQuizThreshold(bankItems(bank), responses, options.fallbackThreshold ?? DEFAULT_THRESHOLD);
  }
}

export function startJourney(): SkillProfile {
  return freshProfile();
}

export function runDiagnostic(responses: QuizResponse[], options: JourneyOptions = {}): SkillProfile {
  return buildDiagnosticProfile(diagnose(responses, "diagnostic", options));
}

export function getQuestPlan(profile: SkillProfile): QuestPlan {
  return planQuests(profile);
}

export function completeQuest(profile: SkillProfile, skill: SkillId): SkillProfile {
  return markQuestTentative(profile, skill);
}

// The re-check items the student re-answers: only those from the recheck bank for their gap skills.
export function recheckItemIds(profile: SkillProfile): string[] {
  const gaps = new Set<SkillId>(
    (Object.keys(profile.states) as SkillId[]).filter(
      (s) => profile.states[s] === "tentative" || profile.states[s] === "missing",
    ),
  );
  return recheckItems.filter((item) => gaps.has(primarySkill(item))).map((item) => item.id);
}

// Re-check: score ONLY the gap-skill items the student re-answered (recheck bank), then promote/demote.
// applyRecheck only touches tentative/missing skills, so confirmed skills are never disturbed by the subset.
export function runRecheck(
  profile: SkillProfile,
  recheckResponses: QuizResponse[],
  options: JourneyOptions = {},
): SkillProfile {
  return applyRecheck(profile, diagnose(recheckResponses, "recheck", options));
}
