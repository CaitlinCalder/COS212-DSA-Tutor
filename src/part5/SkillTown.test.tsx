/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { SkillId, SkillProfile, SkillState } from "../shared/types";
import { SKILL_ORDER } from "../shared/types";
import SkillTown from "./SkillTown";

const skillInfo = Object.fromEntries(
  SKILL_ORDER.map((skill) => [skill, { name: `Skill ${skill}`, description: `${skill} description` }]),
) as Record<SkillId, { name: string; description: string }>;

function profileWith(states: Record<SkillId, SkillState>): SkillProfile {
  return { states, updatedAt: 0 };
}

function statesWith(defaultState: SkillState, overrides: Partial<Record<SkillId, SkillState>> = {}) {
  return Object.fromEntries(
    SKILL_ORDER.map((skill) => [skill, overrides[skill] ?? defaultState]),
  ) as Record<SkillId, SkillState>;
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => cleanup());

describe("Skill town", () => {
  it("shows a welcoming blueprint summary and one building for every skill", () => {
    render(<SkillTown profile={profileWith(statesWith("unknown"))} info={skillInfo} />);

    expect(screen.getByRole("status").textContent).toContain("Your town is still a blueprint");
    expect(screen.getByText("Complete the diagnostic and construction can begin.")).toBeTruthy();

    const buildings = document.querySelectorAll<SVGGElement>(".bld");
    expect(buildings).toHaveLength(SKILL_ORDER.length);
    expect([...buildings].map((building) => building.dataset.skill)).toEqual([...SKILL_ORDER]);
    expect([...buildings].every((building) => building.dataset.state === "unknown")).toBe(true);
  });

  it("maps profile states to building visuals, town summary, and lit roads", () => {
    const states = statesWith("confirmed", { A5: "missing", A6: "unknown" });
    render(<SkillTown profile={profileWith(states)} info={skillInfo} />);

    expect(screen.getByRole("status").textContent).toContain("4 of 6 buildings open");
    expect(screen.getByText(/1 under construction, 1 still a blueprint/)).toBeTruthy();
    expect(document.querySelector('.bld[data-skill="A5"][data-state="missing"]')).toBeTruthy();
    expect(document.querySelector('.bld[data-skill="A6"][data-state="unknown"]')).toBeTruthy();
    expect(document.querySelectorAll(".road.is-lit")).toHaveLength(5);
    expect(document.querySelector(".town-next")?.textContent).toContain("Skill A5 at Signal Hill");
  });

  it("highlights forward progress since the previous visit and saves the latest states", () => {
    const previousStates = statesWith("missing");
    window.localStorage.setItem("cos212-tutor.town-seen", JSON.stringify(previousStates));
    const currentStates = { ...previousStates, A1: "confirmed" as const };

    render(<SkillTown profile={profileWith(currentStates)} info={skillInfo} />);

    expect(screen.getByText(/Since your last visit:/)).toBeTruthy();
    expect(screen.getByText(/Skill A1 \(Town hall\) is now open, lights on/)).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem("cos212-tutor.town-seen") ?? "{}")).toEqual(currentStates);
  });
});
