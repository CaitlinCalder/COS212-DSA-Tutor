
import type { BfsStep, GraphModel, VertexId } from "../shared/types";

export function getNeighbours(
  graph: GraphModel,
  vertex: VertexId,
): VertexId[] {
  if (!graph.vertices.includes(vertex)) return [];

  const neighbours = new Set<VertexId>();

  for (const edge of graph.edges) {
    if (edge.from === vertex) {
      neighbours.add(edge.to);
    }

    if (!graph.directed && edge.to === vertex) {
      neighbours.add(edge.from);
    }
  }

  return [...neighbours].sort();
}

export function getAdjacencyList(
  graph: GraphModel,
): Record<VertexId, VertexId[]> {
  return Object.fromEntries(
    graph.vertices.map((vertex) => [
      vertex,
      getNeighbours(graph, vertex),
    ]),
  );
}

export function addVertex(
  graph: GraphModel,
  vertex: VertexId,
): GraphModel {
  const id = vertex.trim();

  if (!id || graph.vertices.includes(id)) return graph;

  return {
    ...graph,
    vertices: [...graph.vertices, id],
  };
}

export function removeVertex(
  graph: GraphModel,
  vertex: VertexId,
): GraphModel {
  return {
    ...graph,
    vertices: graph.vertices.filter((id) => id !== vertex),
    edges: graph.edges.filter(
      (edge) => edge.from !== vertex && edge.to !== vertex,
    ),
  };
}

export function renameVertex(
  graph: GraphModel,
  oldId: VertexId,
  newId: VertexId,
): GraphModel {
  const id = newId.trim();

  if (
    !id ||
    !graph.vertices.includes(oldId) ||
    (id !== oldId && graph.vertices.includes(id))
  ) {
    return graph;
  }

  return {
    ...graph,
    vertices: graph.vertices.map((vertex) =>
      vertex === oldId ? id : vertex,
    ),
    edges: graph.edges.map((edge) => ({
      from: edge.from === oldId ? id : edge.from,
      to: edge.to === oldId ? id : edge.to,
    })),
  };
}

export function addEdge(
  graph: GraphModel,
  from: VertexId,
  to: VertexId,
): GraphModel {
  if (
    from === to ||
    !graph.vertices.includes(from) ||
    !graph.vertices.includes(to)
  ) {
    return graph;
  }

  const exists = graph.edges.some(
    (edge) =>
      (edge.from === from && edge.to === to) ||
      (!graph.directed && edge.from === to && edge.to === from),
  );

  if (exists) return graph;

  return {
    ...graph,
    edges: [...graph.edges, { from, to }],
  };
}

export function removeEdge(
  graph: GraphModel,
  from: VertexId,
  to: VertexId,
): GraphModel {
  return {
    ...graph,
    edges: graph.edges.filter(
      (edge) =>
        !(
          (edge.from === from && edge.to === to) ||
          (!graph.directed &&
            edge.from === to &&
            edge.to === from)
        ),
    ),
  };
}

export function setDirected(
  graph: GraphModel,
  directed: boolean,
): GraphModel {
  return { ...graph, directed };
}

export function runBfs(
  graph: GraphModel,
  start: VertexId,
): BfsStep[] {
  if (!graph.vertices.includes(start)) return [];

  const queue: VertexId[] = [];
  const discovered = new Set<VertexId>();
  const visited: VertexId[] = [];
  const steps: BfsStep[] = [];

  function record(
    action: BfsStep["action"],
    vertex: VertexId,
  ): void {
    steps.push({
      action,
      vertex,
      queueAfter: [...queue],
      visitedAfter: [...visited],
    });
  }

  queue.push(start);
  discovered.add(start);
  record("enqueue", start);

  while (queue.length > 0) {
    const current = queue.shift()!;
    record("dequeue", current);

    visited.push(current);
    record("visit", current);

    for (const neighbour of getNeighbours(graph, current)) {
      if (discovered.has(neighbour)) {
        record("skip", neighbour);
        continue;
      }

      discovered.add(neighbour);
      queue.push(neighbour);
      record("enqueue", neighbour);
    }
  }

  return steps;
}

export function getVisitOrder(
  steps: BfsStep[],
): VertexId[] {
  return steps
    .filter((step) => step.action === "visit")
    .map((step) => step.vertex);
}

export function getQueueAtStep(
  steps: BfsStep[],
  index: number,
): VertexId[] {
  return steps[index]?.queueAfter ?? [];
}

export interface ShortestRouteResult {
  start: VertexId;
  destination: VertexId;
  reachable: boolean;
  path: VertexId[];
  roadCount: number | null;
  exploredOrder: VertexId[];
}

export function findShortestRoute(
  graph: GraphModel,
  start: VertexId,
  destination: VertexId,
): ShortestRouteResult {
  const result: ShortestRouteResult = {
    start,
    destination,
    reachable: false,
    path: [],
    roadCount: null,
    exploredOrder: [],
  };

  if (
    !graph.vertices.includes(start) ||
    !graph.vertices.includes(destination)
  ) {
    return result;
  }

  const queue: VertexId[] = [start];
  const discovered = new Set<VertexId>([start]);
  const parent = new Map<VertexId, VertexId | null>([
    [start, null],
  ]);

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];

    result.exploredOrder.push(current);

    if (current === destination) break;

    for (const neighbour of getNeighbours(graph, current)) {
      if (discovered.has(neighbour)) continue;

      discovered.add(neighbour);
      parent.set(neighbour, current);
      queue.push(neighbour);
    }
  }

  if (!discovered.has(destination)) {
    return result;
  }

  const path: VertexId[] = [];
  let cursor: VertexId | null = destination;

  while (cursor !== null) {
    path.push(cursor);
    cursor = parent.get(cursor) ?? null;
  }

  path.reverse();

  return {
    ...result,
    reachable: true,
    path,
    roadCount: path.length - 1,
  };
}
