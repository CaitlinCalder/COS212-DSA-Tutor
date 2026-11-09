//creating graphs that questions would require
import type { GraphModel } from "../shared/types";

//converting graph into text-adjacency for a more simple representation if its needed
export function adjacencyListText(graph: GraphModel): string {
  const neighbours = new Map<string, string[]>();
  for (const v of graph.vertices) neighbours.set(v, []);
  for (const { from, to } of graph.edges) {
    neighbours.get(from)!.push(to);
    if (!graph.directed) neighbours.get(to)!.push(from);
  }
  const arrow = graph.directed ? " -> " : ": ";
  return graph.vertices
    .map((v) => {
      const ns = [...neighbours.get(v)!].sort();
      return `${v}${arrow}${ns.length ? ns.join(", ") : "(none)"}`;
    })
    .join("\n");
  }

//graph definitions
export const graphA2Diag: GraphModel = {
  vertices: ["A", "B", "C", "D"],
  edges: [
    { from: "A", to: "B" },
    { from: "B", to: "C" },
    { from: "C", to: "D" },
    { from: "A", to: "C" },
  ],
  directed: false,
};

export const graphA2Recheck: GraphModel = {
  vertices: ["P", "Q", "R", "S"],
  edges: [
    { from: "P", to: "R" },
    { from: "Q", to: "R" },
    { from: "R", to: "S" },
    { from: "P", to: "Q" },
  ],
  directed: false,
};

export const graphA4Diag: GraphModel = {
  vertices: ["S", "A", "B", "C"],
  edges: [
    { from: "S", to: "A" },
    { from: "S", to: "B" },
    { from: "A", to: "C" },
  ],
  directed: false,
};

export const graphA4Recheck: GraphModel = {
  vertices: ["X", "Y", "Z", "W"],
  edges: [
    { from: "X", to: "Y" },
    { from: "X", to: "Z" },
    { from: "Z", to: "W" },
  ],
  directed: false,
};

export const graphA5Diag1: GraphModel = {
  vertices: ["1", "2", "3", "4"],
  edges: [
    { from: "1", to: "2" },
    { from: "1", to: "3" },
    { from: "2", to: "4" },
    { from: "3", to: "4" },
  ],
  directed: false,
};

export const graphA5Diag2: GraphModel = {
  vertices: ["A", "B", "C", "D", "E"],
  edges: [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "C", to: "E" },
  ],
  directed: false,
};

export const graphA5Diag3: GraphModel = {
  vertices: ["R", "M", "N", "T"],
  edges: [
    { from: "R", to: "M" },
    { from: "R", to: "N" },
    { from: "N", to: "T" },
  ],
  directed: true,
};

export const graphA5Recheck1: GraphModel = {
  vertices: ["P", "Q", "R", "S", "T"],
  edges: [
    { from: "P", to: "Q" },
    { from: "P", to: "R" },
    { from: "Q", to: "S" },
    { from: "R", to: "S" },
    { from: "S", to: "T" },
  ],
  directed: false,
};

export const graphA5Recheck2: GraphModel = {
  vertices: ["G", "H", "I", "J"],
  edges: [
    { from: "G", to: "H" },
    { from: "G", to: "I" },
    { from: "H", to: "J" },
  ],
  directed: false,
};

export const graphA5Recheck3: GraphModel = {
  vertices: ["K", "L", "W", "V", "Z"],
  edges: [
    { from: "K", to: "L" },
    { from: "K", to: "W" },
    { from: "L", to: "V" },
    { from: "W", to: "V" },
    { from: "V", to: "Z" },
  ],
  directed: true,
};

export const graphA6Diag1: GraphModel = {
  vertices: ["A", "B", "C", "D", "E"],
  edges: [
    { from: "A", to: "B" },
    { from: "B", to: "D" },
    { from: "A", to: "C" },
    { from: "C", to: "E" },
    { from: "E", to: "D" },
  ],
  directed: false,
};

export const graphA6Recheck1: GraphModel = {
  vertices: ["S", "T", "U", "V", "W"],
  edges: [
    { from: "S", to: "T" },
    { from: "T", to: "U" },
    { from: "U", to: "V" },
    { from: "S", to: "W" },
    { from: "W", to: "V" },
  ],
  directed: false,
};
