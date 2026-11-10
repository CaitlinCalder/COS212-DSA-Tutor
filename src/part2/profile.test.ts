import { describe, expect, it } from "vitest";
import type { SkillId, SkillResult } from "../shared/types";
import { SKILL_ORDER } from "../shared/types";
import {
  applyRecheck,
  buildDiagnosticProfile,
  freshProfile,
  markQuestTentative,
} from "./profile";

function result(skill: SkillId, mastered: boolean): SkillResult {
  return { skill, mastered, correct: mastered ? 2 : 0, total: 2 };
}

describe("skill profiles", () => {
  it("starts with every skill unknown", () => {
    expect(freshProfile().states).toEqual({
      A1: "unknown",
      A2: "unknown",
      A3: "unknown",
      A4: "unknown",
      A5: "unknown",
      A6: "unknown",
    });
  });

  it("builds confirmed and missing states while leaving unassessed skills unknown", () => {
    const results = [result("A1", true), result("A3", false)];

    const profile = buildDiagnosticProfile(results);

    expect(profile.states).toEqual({
      A1: "confirmed",
      A2: "unknown",
      A3: "missing",
      A4: "unknown",
      A5: "unknown",
      A6: "unknown",
    });
    expect(profile.diagnostic).toEqual(results);
    expect(profile.diagnostic).not.toBe(results);
  });

  it("marks only missing skills tentative without mutating the profile", () => {
    const profile = buildDiagnosticProfile([
      result("A1", false),
      result("A2", true),
    ]);

    const updated = markQuestTentative(profile, "A1");
    const unchanged = markQuestTentative(updated, "A2");

    expect(updated.states.A1).toBe("tentative");
    expect(unchanged.states.A2).toBe("confirmed");
    expect(profile.states.A1).toBe("missing");
    expect(profile.states.A2).toBe("confirmed");
  });

  it("applies re-check results to tentative and missing skills only", () => {
    const profile = buildDiagnosticProfile(SKILL_ORDER.map((skill) => result(skill, false)));
    const afterQuest = markQuestTentative(profile, "A1");
    const recheckResults = [
      result("A1", true),
      result("A2", false),
      result("A3", true),
    ];

    const updated = applyRecheck(afterQuest, recheckResults);

    expect(updated.states.A1).toBe("confirmed");
    expect(updated.states.A2).toBe("missing");
    expect(updated.states.A3).toBe("confirmed");
    expect(updated.states.A4).toBe("missing");
    expect(updated.recheck).toEqual(recheckResults);
    expect(updated.recheck).not.toBe(recheckResults);
    expect(afterQuest.states.A1).toBe("tentative");
  });
});
