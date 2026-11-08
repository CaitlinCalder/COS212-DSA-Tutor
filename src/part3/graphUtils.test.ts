// Unit Testing

import { describe, expect, it } from "vitest";
import type { GraphModel } from "../shared/types";

import {
  addEdge,
  addVertex,
  removeEdge,
  removeVertex,
  renameVertex,
  setDirected,
  getNeighbours,
  getAdjacencyList,
  runBfs,
  getVisitOrder,
  getQueueAtStep,
  findShortestRoute,
} from "./graphUtils";

const graph: GraphModel = {
  directed: false,
  vertices: ["A", "B", "C", "D", "E"],
  edges: [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "C", to: "D" },
    { from: "D", to: "E" },
  ],
};

const directed: GraphModel = {
  ...graph,
  directed: true,
};

// A1: Graph vocabulary and editing
describe("A1 - Graph operations", () => {
  it("adds a vertex without modifying the original", () => {
    const result = addVertex(graph, "F");

    expect(result.vertices).toContain("F");
    expect(graph.vertices).not.toContain("F");
  });

  it("rejects duplicate and empty vertices", () => {
    expect(addVertex(graph, "A")).toBe(graph);
    expect(addVertex(graph, " ")).toBe(graph);
  });

  it("removes a vertex and all connected edges", () => {
    const result = removeVertex(graph, "D");

    expect(result.vertices).not.toContain("D");
    expect(
      result.edges.some(
        e => e.from === "D" || e.to === "D"
      )
    ).toBe(false);
  });

  it("renames a vertex and updates its edges", () => {
    const result = renameVertex(graph, "D", "Depot");

    expect(result.vertices).toContain("Depot");
    expect(result.edges.some(e => e.to === "Depot")).toBe(true);
    expect(result.edges.some(e => e.from === "Depot")).toBe(true);
    expect(renameVertex(graph, "D", "A")).toBe(graph);
    expect(renameVertex(graph, "Z", "Q")).toBe(graph);
  });

  it("adds and removes edges correctly", () => {
    const added = addEdge(graph, "B", "C");
    expect(added.edges).toContainEqual({
      from: "B",
      to: "C",
    });

    const removed = removeEdge(graph, "B", "A");
    expect(removed.edges).not.toContainEqual({
      from: "A",
      to: "B",
    });
  });

  it("rejects duplicate edges, self-loops and invalid edges", () => {
    expect(addEdge(graph, "B", "A")).toBe(graph);
    expect(addEdge(graph, "A", "A")).toBe(graph);
    expect(addEdge(graph, "A", "Z")).toBe(graph);
  });

  it("supports directed and undirected graphs", () => {
    expect(setDirected(graph, true).directed).toBe(true);
    expect(graph.directed).toBe(false);

    const result = addEdge(directed, "B", "A");
    expect(result.edges).toContainEqual({
      from: "B",
      to: "A",
    });
  });
});

// A2: Adjacency lists and neighbours
describe("A2 - Adjacency lists", () => {
  it("returns the correct neighbours", () => {
    expect(getNeighbours(graph, "A")).toEqual(["B", "C"]);
    expect(getNeighbours(graph, "D")).toEqual([
      "B", "C", "E",
    ]);
  });

  it("respects one-way roads", () => {
    expect(getNeighbours(directed, "D")).toEqual(["E"]);
    expect(getNeighbours(directed, "E")).toEqual([]);
  });

  it("handles invalid vertices", () => {
    expect(getNeighbours(graph, "Z")).toEqual([]);
  });

  it("generates the complete adjacency list", () => {
    const result = getAdjacencyList(graph);

    expect(result.A).toEqual(["B", "C"]);
    expect(result.D).toEqual(["B", "C", "E"]);
    expect(Object.keys(result)).toHaveLength(5);
  });

  it("includes isolated vertices", () => {
    const result = getAdjacencyList(addVertex(graph, "Z"));
    expect(result.Z).toEqual([]);
  });
});

// A3: FIFO queues
describe("A3 - FIFO queue behaviour", () => {
  const steps = runBfs(graph, "A");

  it("enqueues the starting vertex", () => {
    expect(steps[0]).toEqual({
      action: "enqueue",
      vertex: "A",
      queueAfter: ["A"],
      visitedAfter: [],
    });
  });

  it("dequeues vertices in FIFO order", () => {
    const order = steps
      .filter(s => s.action === "dequeue")
      .map(s => s.vertex);

    expect(order).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("provides queue snapshots", () => {
    expect(getQueueAtStep(steps, 0)).toEqual(["A"]);
    expect(getQueueAtStep(steps, 999)).toEqual([]);
  });
});

// A4: BFS procedure
describe("A4 - BFS procedure", () => {
  it("records all four BFS actions", () => {
    const steps = runBfs(graph, "A");

    for (const action of [
      "enqueue", "dequeue", "visit", "skip",
    ]) {
      expect(steps.some(s => s.action === action)).toBe(true);
    }
  });

  it("records queue and visited states", () => {
    const steps = runBfs(graph, "A");

    expect(
      steps.every(
        s =>
          Array.isArray(s.queueAfter) &&
          Array.isArray(s.visitedAfter)
      )
    ).toBe(true);
  });

  it("prevents repeated visits in cyclic graphs", () => {
    const cycle: GraphModel = {
      directed: false,
      vertices: ["A", "B", "C"],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" },
      ],
    };

    const steps = runBfs(cycle, "A");

    expect(getVisitOrder(steps)).toEqual(["A", "B", "C"]);
    expect(
      steps.filter(s => s.action === "enqueue")
    ).toHaveLength(3);
  });

  it("rejects an invalid starting vertex", () => {
    expect(runBfs(graph, "Z")).toEqual([]);
  });
});

// A5: BFS visit order
describe("A5 - BFS traversal order", () => {
  it("produces the expected BFS order", () => {
    const order = getVisitOrder(runBfs(graph, "A"));

    expect(order).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("does not visit disconnected vertices", () => {
    const disconnected: GraphModel = {
      directed: false,
      vertices: ["A", "B", "C"],
      edges: [{ from: "A", to: "B" }],
    };

    expect(
      getVisitOrder(runBfs(disconnected, "A"))
    ).toEqual(["A", "B"]);
  });

  it("does not modify the original graph", () => {
    const before = JSON.stringify(graph);

    runBfs(graph, "A");

    expect(JSON.stringify(graph)).toBe(before);
  });
});

// A6: Shortest routes
describe("A6 - Shortest routes", () => {
  it("finds a route using the fewest edges", () => {
    const result = findShortestRoute(graph, "A", "E");

    expect(result.reachable).toBe(true);
    expect(result.path).toEqual(["A", "B", "D", "E"]);
    expect(result.roadCount).toBe(3);
  });

  it("handles identical start and destination", () => {
    const result = findShortestRoute(graph, "C", "C");

    expect(result.path).toEqual(["C"]);
    expect(result.roadCount).toBe(0);
  });

  it("respects directed edges", () => {
    expect(
      findShortestRoute(directed, "A", "E").reachable
    ).toBe(true);

    expect(
      findShortestRoute(directed, "E", "A").reachable
    ).toBe(false);
  });

  it("handles unreachable destinations", () => {
    const disconnected: GraphModel = {
      directed: false,
      vertices: ["A", "B", "C"],
      edges: [{ from: "A", to: "B" }],
    };

    const result = findShortestRoute(
      disconnected, "A", "C"
    );

    expect(result.reachable).toBe(false);
    expect(result.path).toEqual([]);
    expect(result.roadCount).toBeNull();
  });

  it("handles invalid destinations", () => {
    expect(
      findShortestRoute(graph, "A", "Z").reachable
    ).toBe(false);
  });

  it("does not loop when cycles exist", () => {
    const cycle: GraphModel = {
      directed: false,
      vertices: ["A", "B", "C", "D"],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" },
        { from: "C", to: "D" },
      ],
    };

    const result = findShortestRoute(cycle, "A", "D");

    expect(result.path).toEqual(["A", "C", "D"]);
    expect(new Set(result.exploredOrder).size)
      .toBe(result.exploredOrder.length);
  });
});
