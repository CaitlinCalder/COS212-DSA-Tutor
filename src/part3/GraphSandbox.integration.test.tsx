/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { GraphModel } from "../shared/types";
import GraphSandbox from "./GraphSandbox";

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

describe("Graph sandbox", () => {
  it("steps through BFS, updates the queue, and supports stepping backward", () => {
    const { container } = render(<GraphSandbox initialGraph={graph} />);

    expect(container.querySelector("main")).toBeNull();
    expect(screen.getByRole("region", { name: "Graph Sandbox" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Graph Sandbox", level: 2 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Try these in order", level: 3 })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next Step" }));
    expect(screen.getByText("Town A joins the queue")).toBeTruthy();
    expect(within(screen.getByRole("list", { name: "BFS queue, front first" })).getByText("A")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next Step" }));
    expect(screen.getByText("Town A leaves the queue")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("Town A joins the queue")).toBeTruthy();
  });

  it("shows a shortest route between the selected endpoints", () => {
    const routeGraph: GraphModel = {
      directed: false,
      vertices: ["A", "B", "C"],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
      ],
    };
    render(<GraphSandbox initialGraph={routeGraph} />);

    fireEvent.click(screen.getByRole("tab", { name: "Shortest route" }));
    fireEvent.click(screen.getByRole("button", { name: /Show route/ }));

    expect(screen.getByRole("status").textContent).toContain("A → B → C");
    expect(screen.getByRole("status").textContent).toContain("2 roads — the fewest possible.");
  });

  it("adds and renames a town, reports graph changes, and restores the starting graph", () => {
    const onGraphChange = vi.fn();
    const { container } = render(<GraphSandbox initialGraph={graph} onGraphChange={onGraphChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Build Network" }));
    fireEvent.click(screen.getByRole("button", { name: "Add a named town" }));
    fireEvent.change(screen.getByLabelText("Town name"), { target: { value: "C" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onGraphChange.mock.calls[0][0].vertices).toEqual(["A", "B", "C"]);
    fireEvent.keyDown(screen.getByRole("button", { name: /Town C,/ }), { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Rename" }));
    fireEvent.change(screen.getByLabelText("Rename C"), { target: { value: "Hub" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const renamed = onGraphChange.mock.calls[onGraphChange.mock.calls.length - 1][0] as GraphModel;
    expect(renamed.vertices).toEqual(["A", "B", "Hub"]);
    expect(screen.getByRole("button", { name: /Town Hub,/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    const restored = onGraphChange.mock.calls[onGraphChange.mock.calls.length - 1][0] as GraphModel;
    expect(restored).toEqual(graph);
    expect(container.querySelector(".sandbox-empty-note")?.textContent).toBe("Switch to Explore BFS to begin.");
  });
});
