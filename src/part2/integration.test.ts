//integration: Part 1 content -> Part 2 diagnosis/plan -> Part 4 quests, plus the gap-recheck flow
import { describe, it, expect } from "vitest";
import { SKILL_ORDER, primarySkill } from "../shared/types";
import type { QuizResponse, SkillId } from "../shared/types";
import { diagnosticItems, recheckItems } from "../part1/content";
import { getQuest } from "../part4/questData";
import {
  runDiagnostic,
  getQuestPlan,
  completeQuest,
  recheckItemIds,
  runRecheck,
} from "./journey";

//need to build diagnostic responses matching a target mastery set: an item is answered correctly if the student has EVERY skill it requires (the NPC ideal pattern), else skipped
function diagnosticResponsesForMastery(mastered: SkillId[]): QuizResponse[] {
  const has = new Set(mastered);
  return diagnosticItems.map((item) => {
    const canAnswer = item.requires.every((s) => has.has(s));
    return { itemId: item.id, selectedOptionId: canAnswer ? item.correctOptionId : null };
  });
}

//a student who has every skill except the given gaps
function diagnosticResponsesWithGaps(gaps: SkillId[]): QuizResponse[] {
  const gapSet = new Set(gaps);
  return diagnosticResponsesForMastery(SKILL_ORDER.filter((s) => !gapSet.has(s)));
}

describe("Part 1 <-> Part 2 integration", () => {
  it("every diagnostic item's primary skill is one of A1..A6 (content ties to the skill model)", () => {
    for (const item of diagnosticItems) {
      expect(SKILL_ORDER).toContain(primarySkill(item));
    }
  });

  it("every re-check item's primary skill is one of A1..A6", () => {
    for (const item of recheckItems) {
      expect(SKILL_ORDER).toContain(primarySkill(item));
    }
  });

  it("diagnoses a student with A2 and A4 gaps", () => {
    const profile = runDiagnostic(diagnosticResponsesWithGaps(["A2", "A4"]));
    expect(profile.states.A2).toBe("missing");
    expect(profile.states.A4).toBe("missing");
    expect(profile.states.A1).toBe("confirmed");
  });
});

describe("Part 2 <-> Part 4 integration (quest plan ties to real quests)", () => {
  it("every planned quest skill resolves to a real Part 4 quest", () => {
    // A gap in A5 cascades to A6 (A6 items require A5), the intended multi-skill behaviour.
    const profile = runDiagnostic(diagnosticResponsesWithGaps(["A5"]));
    const plan = getQuestPlan(profile);

    expect(plan.questSkills).toEqual(["A5", "A6"]);
    for (const skill of plan.questSkills) {
      const quest = getQuest(skill);
      expect(quest.skillId).toBe(skill);
      expect(quest.variants.length).toBeGreaterThan(0);
    }
  });

  it("the confidence skill (if any) also resolves to a real quest", () => {
    const profile = runDiagnostic(diagnosticResponsesWithGaps(["A5"]));
    const plan = getQuestPlan(profile);
    expect(plan.confidenceSkill).toBeDefined();
    const quest = getQuest(plan.confidenceSkill!);
    expect(quest.skillId).toBe(plan.confidenceSkill);
  });

  it("Part 4 has a quest for all six skills", () => {
    for (const skill of SKILL_ORDER) {
      expect(getQuest(skill).skillId).toBe(skill);
    }
  });
});

describe("full journey with gap-subset re-check", () => {
  it("re-check only re-asks the gap skills, drawn from the recheck bank", () => {
    const profile = runDiagnostic(diagnosticResponsesWithGaps(["A5"]));
    const gaps = SKILL_ORDER.filter((s) => profile.states[s] === "missing");
    expect(gaps).toEqual(["A5", "A6"]);

    const toReask = recheckItemIds(profile);
    //all re-asked items come from the recheck bank, not the diagnostic bank
    for (const id of toReask) {
      expect(recheckItems.some((i) => i.id === id)).toBe(true);
      expect(id.startsWith("r-")).toBe(true);
    }
    //AND they cover exactly the gap skills
    const reaskSkills = new Set(
      recheckItems.filter((i) => toReask.includes(i.id)).map((i) => primarySkill(i)),
    );
    expect(reaskSkills).toEqual(new Set<SkillId>(gaps));
  });

  it("quests -> re-check only the gap skills -> confirm on a pass", () => {
    const profile0 = runDiagnostic(diagnosticResponsesWithGaps(["A5"]));
    const gaps = SKILL_ORDER.filter((s) => profile0.states[s] === "missing");
    expect(gaps).toEqual(["A5", "A6"]);

    //finish quests for the gaps -> tentative.
    let profile = profile0;
    for (const s of gaps) profile = completeQuest(profile, s);
    for (const s of gaps) expect(profile.states[s]).toBe("tentative");

    //answer the re-asked (recheck-bank) items correctly.
    const recheckResponses: QuizResponse[] = recheckItemIds(profile).map((id) => {
      const item = recheckItems.find((i) => i.id === id)!;
      return { itemId: id, selectedOptionId: item.correctOptionId };
    });

    profile = runRecheck(profile, recheckResponses);
    for (const s of gaps) expect(profile.states[s]).toBe("confirmed");
    // Non-gap skills are untouched by the subset re-check.
    expect(profile.states.A1).toBe("confirmed");
  });

  it("a failed re-check reverts a tentative skill to missing", () => {
    let profile = runDiagnostic(diagnosticResponsesWithGaps(["A2"]));
    profile = completeQuest(profile, "A2");
    expect(profile.states.A2).toBe("tentative");

    //re-check: skip the re-asked A2 items (wrong).
    const recheckResponses: QuizResponse[] = recheckItemIds(profile).map((id) => ({
      itemId: id,
      selectedOptionId: null,
    }));
    profile = runRecheck(profile, recheckResponses);
    expect(profile.states.A2).toBe("missing");
  });
});

describe("fallback path", () => {
  it("falls back to threshold scoring when the diagnose function throws", () => {
    const throwing = () => {
      throw new Error("npc unavailable");
    };
    const profile = runDiagnostic(diagnosticResponsesWithGaps(["A5"]), { diagnoseFn: throwing });
    //fully-correct skills still master; the all-skipped A5 does not.
    expect(profile.states.A1).toBe("confirmed");
    expect(profile.states.A5).toBe("missing");
  });
});
