//building the tailored quest plan that Part 4 consumes
//fix -> needs to be keyed by SkillId

import type { SkillId, SkillProfile } from "../shared/types";
import { SKILL_ORDER } from "../shared/types";
import type { QuestPlan } from "../part4/questTypes";

//questSkills = the student's `missing` skills in A1..A6 order; confidenceSkill = a `confirmed` one to start.
export function planQuests(profile: SkillProfile): QuestPlan {
  const questSkills = SKILL_ORDER.filter((s) => profile.states[s] === "missing");
  const confidenceSkill: SkillId | undefined = SKILL_ORDER.find(
    (s) => profile.states[s] === "confirmed",
  );
  return { questSkills, confidenceSkill };
}
