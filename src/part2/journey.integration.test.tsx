/**
 * @vitest-environment jsdom
 */

import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { diagnosticItems, recheckItems } from "../part1/content";
import Quests from "../part4/Quests";
import { getQuest } from "../part4/questData";
import type { DiagnosisResponse, QuizResponse, SkillId, SkillProfile } from "../shared/types";
import { primarySkill } from "../shared/types";
import {
  completeQuest,
  getQuestPlan,
  recheckItemIds,
  runDiagnostic,
  runRecheck,
} from "./journey";

function responsesForSkill(skill?: SkillId | null): QuizResponse[] {
  return diagnosticItems.map((item) => ({
    itemId: item.id,
    selectedOptionId:
      (skill === undefined || primarySkill(item) === skill)
        ? item.correctOptionId
        : "incorrect-option",
  }));
}

// Answers only the recheck items the journey would actually ask (gap skills),
// getting `correctSkill`'s items right and the rest wrong.
function recheckResponses(profile: SkillProfile, correctSkill: SkillId): QuizResponse[] {
  const asked = new Set(recheckItemIds(profile));
  return recheckItems
    .filter((item) => asked.has(item.id))
    .map((item) => ({
      itemId: item.id,
      selectedOptionId:
        primarySkill(item) === correctSkill ? item.correctOptionId : "incorrect-option",
    }));
}

function failDiagnosis(): DiagnosisResponse {
  throw new Error("Diagnosis service unavailable");
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Part 1 → Part 2 → Part 4 journey contract", () => {
  it("uses Part 1 diagnostic items for the normal diagnosis and creates a quest plan", () => {
    const profile = runDiagnostic(responsesForSkill());

    expect(profile.diagnostic).toHaveLength(6);
    expect(Object.values(profile.states).every((state) => state === "confirmed")).toBe(true);
    expect(getQuestPlan(profile)).toEqual({
      questSkills: [],
      confidenceSkill: "A1",
    });
  });

  it("falls back on failure, sends the plan to Part 4, and re-check confirms quest practice", () => {
    let profile: SkillProfile | undefined;

    function JourneyHarness() {
      const [currentProfile, setCurrentProfile] = useState(() =>
        runDiagnostic(responsesForSkill(null), {
          diagnoseFn: failDiagnosis,
        }),
      );
      profile = currentProfile;
      const questPlan = getQuestPlan(currentProfile);

      return (
        <>
          <output data-testid="a1-state">{currentProfile.states.A1}</output>
          <output data-testid="planned-skills">{questPlan.questSkills.join(",")}</output>
          <Quests
            questPlan={questPlan}
            onQuestComplete={({ skillId }) =>
              setCurrentProfile((previous) => completeQuest(previous, skillId))
            }
          />
        </>
      );
    }

    render(<JourneyHarness />);

    expect(screen.getByTestId("planned-skills").textContent).toBe("A1,A2,A3,A4,A5,A6");
    expect(screen.getByRole("heading", { name: "Map the town" })).toBeTruthy();

    const quest = getQuest("A1");
    for (let step = 1; step < quest.variants[0].walkthrough.length; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Next example step" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Start guided practice" }));
    fireEvent.click(screen.getByRole("button", { name: quest.variants[0].guided.answer }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(screen.getByRole("button", { name: "Make your own prediction" }));
    fireEvent.click(screen.getByRole("button", { name: quest.variants[0].independent.answer }));
    fireEvent.click(screen.getByRole("button", { name: "Lock answer and compare" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish quest" }));

    expect(screen.getByTestId("a1-state").textContent).toBe("tentative");
    expect(screen.getByTestId("planned-skills").textContent).toBe("A2,A3,A4,A5,A6");
    expect(screen.getByText(/progress is tentative/i)).toBeTruthy();

    // Only gap skills (tentative A1 + missing A2..A6) are re-asked, from the recheck bank.
    const askedIds = recheckItemIds(profile!);
    expect(askedIds.length).toBeGreaterThan(0);
    expect(askedIds.every((id) => id.startsWith("r-"))).toBe(true);

    const rechecked = runRecheck(profile!, recheckResponses(profile!, "A1"), {
      diagnoseFn: failDiagnosis,
    });

    expect(rechecked.states.A1).toBe("confirmed");
    expect(rechecked.states.A2).toBe("missing");
  });
});
