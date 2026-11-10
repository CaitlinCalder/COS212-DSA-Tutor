import { describe, expect, it } from "vitest";
import type { SkillId, SkillResult } from "../shared/types";
import { buildDiagnosticProfile, freshProfile } from "./profile";
import { planQuests } from "./planQuests";

function result(skill: SkillId, mastered: boolean): SkillResult {
  return { skill, mastered, correct: mastered ? 2 : 0, total: 2 };
}

describe("planQuests", () => {
  it("plans missing skills in prerequisite order and selects the first confirmed confidence skill", () => {
    const profile = buildDiagnosticProfile([
      result("A1", true),
      result("A2", false),
      result("A3", false),
      result("A4", true),
      result("A5", false),
      result("A6", true),
    ]);

    expect(planQuests(profile)).toEqual({
      questSkills: ["A2", "A3", "A5"],
      confidenceSkill: "A1",
    });
  });

  it("does not offer tentative or unknown skills as quests or confidence activities", () => {
    const profile = freshProfile();
    profile.states.A1 = "tentative";
    profile.states.A2 = "unknown";
    profile.states.A3 = "confirmed";

    expect(planQuests(profile)).toEqual({
      questSkills: [],
      confidenceSkill: "A3",
    });
  });
});
