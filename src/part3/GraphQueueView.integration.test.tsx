
/**
 * @vitest-environment jsdom
 */

import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import type { GraphModel } from "../shared/types";
import GraphQueueView from "./GraphQueueView";
import { runBfs, findShortestRoute } from "./graphUtils";

const graph: GraphModel = {
  directed: false,
  vertices: ["A", "B", "C"],
  edges: [
    { from: "A", to: "B" },
    { from: "B", to: "C" },
  ],
};

// jsdom does not provide ResizeObserver by default.
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    }
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// A1: Map the town
describe("A1 - Graph interaction", () => {
  it("renders towns and roads", () => {
    render(<GraphQueueView graph={graph} />);

    expect(
      screen.getByRole("button", {
        name: /Town A, unvisited/i,
      })
    ).toBeTruthy();

    expect(
      screen.getByText(/3 towns/)
    ).toBeTruthy();

    expect(
      screen.getByText(/2 roads/)
    ).toBeTruthy();
  });

  it("allows the Quest team to select roads", () => {
    const onEdgeClick = vi.fn();

    render(
      <GraphQueueView
        graph={graph}
        onEdgeClick={onEdgeClick}
        readOnly
      />
    );

    const road = screen.getByRole("button", {
      name: "Road from A to B",
    });

    fireEvent.click(road);

    expect(onEdgeClick).toHaveBeenCalledWith("A", "B");
  });

  it("supports keyboard road selection", () => {
    const onEdgeClick = vi.fn();

    render(
      <GraphQueueView
        graph={graph}
        onEdgeClick={onEdgeClick}
        readOnly
      />
    );

    const road = screen.getByRole("button", {
      name: "Road from A to B",
    });

    fireEvent.keyDown(road, { key: "Enter" });
    fireEvent.keyDown(road, { key: " " });

    expect(onEdgeClick).toHaveBeenCalledTimes(2);
  });

  it("hides edge controls without a callback", () => {
    render(<GraphQueueView graph={graph} readOnly />);

    expect(
      screen.queryByRole("button", {
        name: /Road from/i,
      })
    ).toBeNull();
  });
});

// A3: Independent queue
describe("A3 - Ticket queue integration", () => {
  it("renders a queue independently of BFS", () => {
    render(
      <GraphQueueView
        graph={graph}
        queue={["C", "A", "B"]}
        readOnly
      />
    );

    const list = screen.getByRole("list", {
      name: /BFS queue/i,
    });

    const tickets = within(list)
      .getAllByRole("listitem")
      .map(item => item.querySelector("strong")?.textContent);

    expect(tickets).toEqual(["C", "A", "B"]);
    expect(within(list).getByText("Next out")).toBeTruthy();
  });

  it("updates the queue when props change", () => {
    const { rerender } = render(
      <GraphQueueView
        graph={graph}
        queue={["A", "B", "C"]}
      />
    );

    rerender(
      <GraphQueueView
        graph={graph}
        queue={["B", "C"]}
      />
    );

    const list = screen.getByRole("list");

    expect(
      within(list).getAllByRole("listitem")
    ).toHaveLength(2);
  });

  it("supports an explicitly empty queue", () => {
    render(
      <GraphQueueView graph={graph} queue={[]} />
    );

    expect(
      screen.getByText("Queue empty")
    ).toBeTruthy();
  });
});

// A4: Messenger interaction
describe("A4 - Quest-controlled BFS states", () => {
  it("allows custom vertex states", () => {
    render(
      <GraphQueueView
        graph={graph}
        queue={["C"]}
        vertexStates={{
          A: "visited",
          B: "active",
        }}
        readOnly
      />
    );

    expect(
      screen.getByRole("button", {
        name: /Town A, visited/i,
      }).getAttribute("class")
    ).toContain("gqv-node--visited");

    expect(
      screen.getByRole("button", {
        name: /Town B, active/i,
      }).getAttribute("class")
    ).toContain("gqv-node--active");

    expect(
      screen.getByRole("button", {
        name: /Town C, queued/i,
      }).getAttribute("class")
    ).toContain("gqv-node--queued");
  });

  it("allows town selection in read-only mode", () => {
    const onVertexClick = vi.fn();
    const onConnect = vi.fn();

    render(
      <GraphQueueView
        graph={graph}
        readOnly
        tool="connect"
        onVertexClick={onVertexClick}
        onConnect={onConnect}
      />
    );

    const town = screen.getByRole("button", {
      name: /Town A,/i,
    });

    fireEvent.keyDown(town, { key: "Enter" });

    expect(onVertexClick).toHaveBeenCalledWith("A");
    expect(onConnect).not.toHaveBeenCalled();
  });

  it("prevents movement in read-only mode", () => {
    const onVertexMove = vi.fn();

    render(
      <GraphQueueView
        graph={graph}
        readOnly
        draggable
        onVertexMove={onVertexMove}
      />
    );

    const town = screen.getByRole("button", {
      name: /Town A,/i,
    });

    const original = town.getAttribute("transform");

    fireEvent.keyDown(town, {
      key: "ArrowRight",
    });

    expect(town.getAttribute("transform")).toBe(original);
    expect(onVertexMove).not.toHaveBeenCalled();
  });
});

// A5: BFS playback
describe("A5 - BFS visualisation", () => {
  it("renders the current BFS step", () => {
    const steps = runBfs(graph, "A");

    const index = steps.findIndex(
      s => s.action === "visit" && s.vertex === "A"
    );

    render(
      <GraphQueueView
        graph={graph}
        steps={steps}
        currentStep={index}
        readOnly
      />
    );

    expect(
      screen.getByRole("button", {
        name: /Town A, active/i,
      })
    ).toBeTruthy();

    expect(
      screen.getByText("Queue empty")
    ).toBeTruthy();
  });

  it("prioritises an independent queue over BFS", () => {
    const steps = runBfs(graph, "A");

    render(
      <GraphQueueView
        graph={graph}
        steps={steps}
        currentStep={0}
        queue={["C"]}
        readOnly
      />
    );

    const list = screen.getByRole("list");

    const items = within(list).getAllByRole("listitem");

    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain("C");
  });
});

// A6: Shortest routes
describe("A6 - Route visualisation", () => {
  it("highlights the shortest route", () => {
    const result = findShortestRoute(graph, "A", "C");

    const { container } = render(
      <GraphQueueView
        graph={graph}
        highlightedRoute={result.path}
        readOnly
      />
    );

    expect(
      screen.getByRole("button", {
        name: /Town A, .*shortest route/i,
      })
    ).toBeTruthy();

    expect(
      container.querySelectorAll(
        ".gqv-edge[stroke='#facc15']"
      )
    ).toHaveLength(2);
  });

  it("highlights arbitrary roads", () => {
    const { container } = render(
      <GraphQueueView
        graph={graph}
        highlightedEdges={[
          { from: "A", to: "B" },
        ]}
        readOnly
      />
    );

    expect(
      container.querySelectorAll(
        ".gqv-edge[stroke='#facc15']"
      )
    ).toHaveLength(1);
  });
});

// Reusable presentation settings
describe("Quest presentation options", () => {
  it("can hide the queue and legend", () => {
    render(
      <GraphQueueView
        graph={graph}
        showQueue={false}
        showLegend={false}
      />
    );

    expect(
      screen.queryByText("Dispatch queue")
    ).toBeNull();

    expect(
      screen.queryByLabelText("Town status key")
    ).toBeNull();
  });
});
