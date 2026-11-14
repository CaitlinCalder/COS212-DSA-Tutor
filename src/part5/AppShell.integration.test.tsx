/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { diagnosticItems } from "../part1/content";
import AppShell from "./AppShell";

vi.mock("../part3/GraphSandbox", () => ({
  default: () => <div>Sandbox test surface</div>,
}));

vi.mock("../part4/Quests", () => ({
  default: () => <div>Quest test surface</div>,
}));

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Part 5 app shell", () => {
  it("navigates between the overview, sandbox, and lecturer dashboard", () => {
    render(<AppShell />);

    expect(screen.getByRole("heading", { name: "Turn your lecture slides into a video" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Sandbox/ }));
    expect(screen.getByText("Sandbox test surface")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Lecturer dashboard/ }));
    expect(screen.getByRole("heading", { name: "Class skill heatmap" })).toBeTruthy();
    expect(screen.getByText(/SIMULATED CLASS DATA/)).toBeTruthy();
  });

  it("requires complete diagnostic answers and carries results into the report", () => {
    const { container } = render(<AppShell />);

    fireEvent.click(screen.getByRole("button", { name: /Diagnostic/ }));
    const submit = screen.getByRole("button", { name: "Submit diagnostic" });
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    for (const item of diagnosticItems) {
      const option = container.querySelector<HTMLInputElement>(
        `input[name="${item.id}"][value="${item.correctOptionId}"]`,
      );
      expect(option).not.toBeNull();
      if (option) fireEvent.click(option);
    }

    fireEvent.click(screen.getByRole("button", { name: "Submit diagnostic" }));
    expect(screen.getByRole("heading", { name: "Your skill town" })).toBeTruthy();
    expect(screen.getByText("Your whole town is open")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Re-check/ }));
    expect(screen.getByRole("heading", { name: "Nothing left to re-check" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /View report/ }));
    expect(screen.getByRole("heading", { name: "Your lecture-ready report" })).toBeTruthy();
    expect(screen.getAllByText("6/6")).toHaveLength(2);
  });
});
