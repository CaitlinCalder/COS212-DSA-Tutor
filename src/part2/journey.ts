//to make part 5 easier: thin orchestration of the diagnose -> profile -> plan -> re-check flow
import type {
  DiagnosisResponse,
  QuizResponse,
  SkillId,
  SkillProfile,
} from "../shared/types";
import { primarySkill } from "../shared/types";
import type { QuestPlan } from "../part4/questTypes";
import { diagnosticItems } from "../part1/content";
import { diagnoseHandler } from "./diagnoseHandler";
import { applyRecheck, buildDiagnosticProfile, freshProfile, markQuestTentative } from "./profile";
import { planQuests } from "./planQuests";
import { scoreQuizThreshold, DEFAULT_THRESHOLD } from "./scoreQuizThreshold";

// Injectable so Part 5 can swap in an HTTP client and tests can force the fallback.
export type DiagnoseFn = (responses: QuizResponse[]) => DiagnosisResponse;

export interface JourneyOptions {
  diagnoseFn?: DiagnoseFn;
  fallbackThreshold?: number;
}

const defaultDiagnoseFn: DiagnoseFn = (responses) => diagnoseHandler({ responses });

// Diagnose the responses; fall back to the threshold scorer if the diagnose function throws.
function diagnose(responses: QuizResponse[], options: JourneyOptions) {
  const diagnoseFn = options.diagnoseFn ?? defaultDiagnoseFn;
  try {
    return diagnoseFn(responses).results;
  } catch {
    return scoreQuizThreshold(diagnosticItems, responses, options.fallbackThreshold ?? DEFAULT_THRESHOLD);
  }
}

export function startJourney(): SkillProfile {
  return freshProfile();
}

export function runDiagnostic(responses: QuizResponse[], options: JourneyOptions = {}): SkillProfile {
  return buildDiagnosticProfile(diagnose(responses, options));
}

export function getQuestPlan(profile: SkillProfile): QuestPlan {
  return planQuests(profile);
}

export function completeQuest(profile: SkillProfile, skill: SkillId): SkillProfile {
  return markQuestTentative(profile, skill);
}

// The diagnostic items the student re-answers at re-check: only those for their gap skills.
export function recheckItemIds(profile: SkillProfile): string[] {
  const gaps = new Set<SkillId>(
    (Object.keys(profile.states) as SkillId[]).filter(
      (s) => profile.states[s] === "tentative" || profile.states[s] === "missing",
    ),
  );
  return diagnosticItems.filter((item) => gaps.has(primarySkill(item))).map((item) => item.id);
}

// Re-check: merge the student's fresh gap-skill answers over their diagnostic answers, re-diagnose, promote.
export function runRecheck(
  profile: SkillProfile,
  diagnosticResponses: QuizResponse[],
  recheckResponses: QuizResponse[],
  options: JourneyOptions = {},
): SkillProfile {
  const merged = new Map<string, QuizResponse>();
  for (const r of diagnosticResponses) merged.set(r.itemId, r);
  for (const r of recheckResponses) merged.set(r.itemId, r);
  return applyRecheck(profile, diagnose([...merged.values()], options));
}
