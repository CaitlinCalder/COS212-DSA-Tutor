import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { SKILL_ORDER } from "./types";

describe("shared type contract (scaffold smoke test)", () => {
  it("SKILL_ORDER lists all six skills A1..A6 in order", () => {
    expect(SKILL_ORDER).toEqual(["A1", "A2", "A3", "A4", "A5", "A6"]);
    expect(SKILL_ORDER).toHaveLength(6);
  });

  // Proves fast-check is wired up and runnable.
  it("every skill id matches the A<n> shape (fast-check)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...SKILL_ORDER), (skill) => {
        return /^A[1-6]$/.test(skill);
      }),
    );
  });
});
