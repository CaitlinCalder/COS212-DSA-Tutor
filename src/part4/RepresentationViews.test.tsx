/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { GraphModel } from "../shared/types";
import { runBfs } from "../part3/graphUtils";
import {
  NarrationControls,
  ReadView,
  TryItView,
  ViewPreferencePicker,
  ViewSwitcher,
} from "./RepresentationViews";

const graph: GraphModel = {
  directed: false,
  vertices: ["A", "B"],
  edges: [{ from: "A", to: "B" }],
};

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

describe("Alternative representation views", () => {
  it("offers each learning preference and lets the learner defer the choice", () => {
    const onChoose = vi.fn();
    const onSkip = vi.fn();
    render(<ViewPreferencePicker onChoose={onChoose} onSkip={onSkip} />);

    fireEvent.click(screen.getByRole("button", { name: /Hearing it explained/ }));
    fireEvent.click(screen.getByRole("button", { name: "Decide later" }));

    expect(onChoose).toHaveBeenCalledWith("hear");
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("marks the active representation and reports mode changes", () => {
    const onChange = vi.fn();
    render(<ViewSwitcher mode="see" onChange={onChange} />);

    expect((screen.getByRole("button", { name: "Picture" }) as HTMLButtonElement).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Read" }));
    expect(onChange).toHaveBeenCalledWith("read");
  });

  it("renders adjacency, the current BFS trace, queue, and matching pseudocode", () => {
    const steps = runBfs(graph, "A");
    const firstDequeue = steps.findIndex((step) => step.action === "dequeue");
    render(<ReadView graph={graph} steps={steps} currentStep={firstDequeue} queue={["B"]} />);

    const adjacencyItems = screen.getAllByRole("listitem").map((item) => item.textContent?.replace(/\s+/g, " ").trim());
    expect(adjacencyItems).toEqual(["A is connected to B", "B is connected to A"]);
    expect(screen.getByText("Ticket line (front first):").parentElement?.textContent).toContain("B");

    const table = screen.getByRole("table", { name: "BFS steps so far" });
    expect(within(table).getByText("dequeue")).toBeTruthy();
    expect(table.querySelector('[aria-current="step"]')).toBeTruthy();
    expect(document.querySelector(".read-view__line.is-active")?.textContent).toContain("dequeue()");
  });

  it("shows a clear fallback when speech synthesis is unavailable", () => {
    render(<NarrationControls text="The queue now contains B." />);

    expect(screen.getByText(/This browser cannot read aloud/)).toBeTruthy();
    expect(screen.getByLabelText("Captions").textContent).toBe("The queue now contains B.");
  });

  it("plays and stops narration, and cancels stale narration when the text changes", () => {
    class MockUtterance {
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(readonly text: string) {}
    }
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel });
    vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
    const { rerender } = render(<NarrationControls text="First narration." />);

    fireEvent.click(screen.getByRole("button", { name: "Play narration" }));
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0][0]).toMatchObject({ text: "First narration.", rate: 0.95 });
    fireEvent.click(screen.getByRole("button", { name: "Stop narration" }));
    expect(cancel).toHaveBeenCalled();

    rerender(<NarrationControls text="Next narration." />);
    expect(screen.getByLabelText("Captions").textContent).toBe("Next narration.");
    expect(cancel.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("lets a learner inspect a town's neighbours in try-it mode", () => {
    render(<TryItView graph={graph} steps={[]} useTrace={false} title="Two-town example" />);

    fireEvent.keyDown(screen.getByRole("button", { name: /Town B,/ }), { key: "Enter" });
    expect(screen.getByRole("status").textContent).toContain("Town B is connected to: A.");
  });

  it("offers feedback for wrong BFS choices and completes a correct trace", () => {
    const steps = runBfs(graph, "A");
    render(<TryItView graph={graph} steps={steps} useTrace title="Two-town example" />);

    fireEvent.keyDown(screen.getByRole("button", { name: /Town B,/ }), { key: "Enter" });
    expect(screen.getByRole("status").textContent).toContain("Not B. Look at the queue");
    fireEvent.keyDown(screen.getByRole("button", { name: /Town B,/ }), { key: "Enter" });
    expect(screen.getByRole("status").textContent).toContain("which is A");

    fireEvent.keyDown(screen.getByRole("button", { name: /Town A,/ }), { key: "Enter" });
    expect(screen.getByText("1 of 2 towns served")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("button", { name: /Town B,/ }), { key: "Enter" });
    expect(screen.getByText("2 of 2 towns served")).toBeTruthy();
    expect(screen.getByText("You ran the whole search.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start again" }));
    expect(screen.getByText("0 of 2 towns served")).toBeTruthy();
  });
});
