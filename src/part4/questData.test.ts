import { describe, expect, it } from "vitest";
import { SKILL_ORDER } from "../shared/types";
import { findShortestRoute, runBfs } from "../part3/graphUtils";
import { QUESTS } from "./questData";

describe("quest templates", () => {
  it("provides a quest and at least two curated variants for every skill", () => {
    expect(Object.keys(QUESTS)).toEqual(SKILL_ORDER);

    for (const skillId of SKILL_ORDER) {
      const quest = QUESTS[skillId];
      expect(quest.skillId).toBe(skillId);
      expect(quest.variants.length).toBeGreaterThanOrEqual(2);
      expect(new Set(quest.variants.map(({ id }) => id)).size).toBe(quest.variants.length);
      expect(new Set(quest.variants.map(({ graph }) => JSON.stringify(graph))).size)
        .toBe(quest.variants.length);
    }
  });

  it("keeps every authored answer among its challenge choices and includes three hints", () => {
    for (const quest of Object.values(QUESTS)) {
      for (const scenario of quest.variants) {
        for (const task of [scenario.guided, scenario.independent]) {
          expect(task.options).toContain(task.answer);
          expect(task.hints).toHaveLength(3);
          expect(task.explanation.length).toBeGreaterThan(0);
          if (task.feedbackReplayStep !== undefined) {
            expect(task.feedbackReplayStep).toBeGreaterThanOrEqual(0);
            expect(task.feedbackReplayStep).toBeLessThan(
              runBfs(scenario.graph, scenario.start).length,
            );
          }
          if (task.routeDestination) {
            const route = findShortestRoute(
              scenario.graph,
              scenario.start,
              task.routeDestination,
            );
            expect(route.reachable).toBe(true);
            expect(route.path.join(" → ")).toBe(task.answer);
          }
        }
      }
    }
  });
});
