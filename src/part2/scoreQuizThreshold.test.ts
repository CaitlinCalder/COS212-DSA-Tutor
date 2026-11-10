import { describe, expect, it } from "vitest";
import { diagnosticItems } from "../part1/content";
import { primarySkill } from "../shared/types";
import { DEFAULT_THRESHOLD, scoreQuizThreshold } from "./scoreQuizThreshold";

describe("scoreQuizThreshold", () => {
  it("counts correct, wrong, and skipped answers per primary skill", () => {
    const a1Items = diagnosticItems.filter((item) => primarySkill(item) === "A1");
    const responses = diagnosticItems.map((item) => ({
      itemId: item.id,
      selectedOptionId:
        primarySkill(item) === "A1" && item.id === a1Items[0].id
          ? item.correctOptionId
          : item.id === a1Items[1].id
            ? null
            : "incorrect-option",
    }));

    const results = scoreQuizThreshold(diagnosticItems, responses);

    expect(DEFAULT_THRESHOLD).toBe(0.6);
    expect(results.find(({ skill }) => skill === "A1")).toEqual({
      skill: "A1",
      mastered: false,
      correct: 1,
      total: a1Items.length,
    });
    expect(results.every(({ mastered }) => !mastered)).toBe(true);
  });

  it("includes empty skills and applies the configured threshold inclusively", () => {
    const item = diagnosticItems.find((candidate) => primarySkill(candidate) === "A1")!;
    const result = scoreQuizThreshold(
      [item, { ...item, id: "another-a1-item" }],
      [{ itemId: item.id, selectedOptionId: item.correctOptionId }],
      0.5,
    );

    expect(result.find(({ skill }) => skill === "A1")).toEqual({
      skill: "A1",
      mastered: true,
      correct: 1,
      total: 2,
    });
    expect(result.find(({ skill }) => skill === "A2")).toEqual({
      skill: "A2",
      mastered: false,
      correct: 0,
      total: 0,
    });
  });
});
