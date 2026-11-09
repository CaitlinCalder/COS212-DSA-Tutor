/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Quests from "./Quests";

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

describe("Part 4 quest experience", () => {
  it("runs a quest through all three stages and emits tentative completion", () => {
    const onQuestComplete = vi.fn();
    render(
      <Quests
        questPlan={{ questSkills: ["A3"] }}
        onQuestComplete={onQuestComplete}
      />,
    );

    expect(screen.getByRole("heading", { name: "The ticket line" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next example step" }));
    fireEvent.click(screen.getByRole("button", { name: "Next example step" }));
    fireEvent.click(screen.getByRole("button", { name: "Start guided practice" }));

    fireEvent.click(screen.getByRole("button", { name: "A" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByText(/earliest arrival is served first/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Make your own prediction" }));

    fireEvent.click(screen.getByRole("button", { name: "B" }));
    fireEvent.click(screen.getByRole("button", { name: "Lock answer and compare" }));
    expect(screen.getByText(/Your prediction:/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Finish quest" }));

    expect(onQuestComplete).toHaveBeenCalledWith({
      skillId: "A3",
      variantId: "a3-station",
      confidence: false,
    });
    expect(screen.getAllByText(/progress is tentative/i)).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Try a fresh scenario" }));
    expect(screen.getByText("Scenario 2 of 2")).toBeTruthy();
  });

  it("offers a confidence quest first and respects the parent's skill plan", () => {
    render(
      <Quests
        questPlan={{ questSkills: ["A5"], confidenceSkill: "A2" }}
      />,
    );

    expect(screen.getByRole("button", { name: /Confidence quest/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Predict the spread/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /The ticket line/ })).toBeNull();
    expect(screen.getByRole("heading", { name: "Read the registry" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start guided practice" })).toBeTruthy();
  });

  it("offers free hints and replays the relevant BFS step after a wrong guided answer", () => {
    render(<Quests questPlan={{ questSkills: ["A4"] }} />);

    fireEvent.click(screen.getByRole("button", { name: "Next example step" }));
    fireEvent.click(screen.getByRole("button", { name: "Next example step" }));
    fireEvent.click(screen.getByRole("button", { name: "Start guided practice" }));

    fireEvent.click(screen.getByRole("button", { name: "Show hint 1" }));
    expect(screen.getByText("New neighbours wait their turn.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show hint 2" }));
    expect(screen.getByText("The queue receives B and C.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Visit every town immediately" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    const replay = screen.getByRole("region", { name: "Replay the relevant BFS step" });
    expect(within(replay).getByText("enqueue")).toBeTruthy();
    expect(
      within(replay).getByRole("button", { name: /Town B, queued/i }),
    ).toBeTruthy();
  });

  it("shows a clear empty state when the plan has no quests", () => {
    render(<Quests questPlan={{ questSkills: [] }} />);

    expect(screen.getByText(/There are no quests in your current learning plan/i)).toBeTruthy();
  });
});
