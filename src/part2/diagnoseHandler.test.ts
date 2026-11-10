import { describe, expect, it } from "vitest";
import { diagnosticItems } from "../part1/content";
import { primarySkill, SKILL_ORDER } from "../shared/types";
import { diagnoseHandler } from "./diagnoseHandler";

describe("diagnoseHandler", () => {
  it("maps diagnostic answers to per-skill correctness and totals", () => {
    const firstA1Item = diagnosticItems.find((item) => primarySkill(item) === "A1");
    const secondA1Item = diagnosticItems.find(
      (item) => primarySkill(item) === "A1" && item.id !== firstA1Item?.id,
    );
    expect(firstA1Item).toBeDefined();
    expect(secondA1Item).toBeDefined();

    const response = diagnoseHandler({
      responses: [
        { itemId: firstA1Item!.id, selectedOptionId: firstA1Item!.correctOptionId },
        { itemId: secondA1Item!.id, selectedOptionId: null },
        { itemId: "unknown-item", selectedOptionId: "a" },
      ],
    });

    expect(response.bank).toBe("diagnostic");
    expect(response.results.map(({ skill }) => skill)).toEqual(SKILL_ORDER);

    for (const skill of SKILL_ORDER) {
      const result = response.results.find((item) => item.skill === skill);
      const skillItems = diagnosticItems.filter((item) => primarySkill(item) === skill);
      expect(result).toMatchObject({
        skill,
        correct: skill === "A1" ? 1 : 0,
        total: skillItems.length,
      });
    }

    expect(response.results.find(({ skill }) => skill === "A1")?.mastered).toBe(false);
  });

  it("classifies a fully correct diagnostic as mastery of every skill", () => {
    const response = diagnoseHandler({
      responses: diagnosticItems.map((item) => ({
        itemId: item.id,
        selectedOptionId: item.correctOptionId,
      })),
    });

    expect(response.mastery).toEqual({
      A1: true,
      A2: true,
      A3: true,
      A4: true,
      A5: true,
      A6: true,
    });
  });
});
