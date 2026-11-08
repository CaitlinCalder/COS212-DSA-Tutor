
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { House, Maximize2, Minus, Plus } from "lucide-react";
import type { BfsStep, GraphModel, VertexId } from "../shared/types";
import "./GraphQueueView.css";

export type GraphTool = "select" | "add" | "connect";

export type GraphPosition = {
  x: number;
  y: number;
};

export type GraphVertexState = "unvisited" | "discovered" | "queued" | "active" | "visited";
export type GraphEdge = { from: VertexId; to: VertexId };

export interface GraphQueueViewProps {
  graph: GraphModel;
  steps?: BfsStep[];
  currentStep?: number;
  selectedVertex?: VertexId | null;
  onVertexClick?: (vertex: VertexId) => void;
  onVertexMove?: (vertex: VertexId, position: GraphPosition) => void;
  draggable?: boolean;
  showQueue?: boolean;
  showLegend?: boolean;
  title?: string;
  tool?: GraphTool;
  onCanvasClick?: (position: GraphPosition) => void;
  onConnect?: (from: VertexId, to: VertexId) => void;
  initialPositions?: Record<string, GraphPosition>;
  headerActions?: ReactNode;
  highlightedRoute?: VertexId[];
  // Override the queue shown by the view, independently of BFS playback. 
  queue?: VertexId[];
  // Override individual vertex states; unspecified vertices retain BFS-derived state. 
  vertexStates?: Partial<Record<VertexId, GraphVertexState>>;
  // Highlight arbitrary edges without requiring a contiguous shortest route. 
  highlightedEdges?: GraphEdge[];
  // Invoked when a learner clicks or keyboard-activates an edge. 
  onEdgeClick?: (from: VertexId, to: VertexId) => void;
  // Disable graph editing (dragging, adding and connecting), but retain selection callbacks. 
  readOnly?: boolean;
}

const WIDTH = 800;
const HEIGHT = 420;
const RADIUS = 32;
const MARGIN = RADIUS + 7;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

function createPositions(graph: GraphModel): Record<string, GraphPosition> {
  const result: Record<string, GraphPosition> = {};
  const neighbours = new Map<string, string[]>(
    graph.vertices.map((vertex) => [vertex, []]),
  );

  graph.edges.forEach(({ from, to }) => {
    if (!neighbours.has(from) || !neighbours.has(to)) return;

    neighbours.get(from)!.push(to);

    if (!graph.directed) {
      neighbours.get(to)!.push(from);
    }
  });

  const seen = new Set<string>();
  const layers: string[][] = [];

  for (const start of graph.vertices) {
    if (seen.has(start)) continue;

    const queue: Array<{ vertex: string; depth: number }> = [
      { vertex: start, depth: layers.length },
    ];

    seen.add(start);

    for (let i = 0; i < queue.length; i++) {
      const { vertex, depth } = queue[i];

      if (!layers[depth]) layers[depth] = [];
      layers[depth].push(vertex);

      for (const next of [...(neighbours.get(vertex) ?? [])].sort()) {
        if (seen.has(next)) continue;

        seen.add(next);
        queue.push({ vertex: next, depth: depth + 1 });
      }
    }
  }

  layers.forEach((layer, depth) => {
    const x = 100 + (depth * 600) / Math.max(1, layers.length - 1);

    layer.forEach((vertex, index) => {
      result[vertex] = {
        x,
        y: HEIGHT / 2 + (index - (layer.length - 1) / 2) * 125,
      };
    });
  });

  return result;
}

function StateBadge({ state }: { state: string }) {
  if (state === "queued") {
    return (
      <g className="gqv-state-badge" aria-hidden="true">
        <circle cx="27" cy="-27" r="12" />
        <text x="27" y="-22.5" textAnchor="middle">
          Q
        </text>
      </g>
    );
  }

  if (state === "active") {
    return (
      <g
        className="gqv-state-badge gqv-state-badge--active"
        aria-hidden="true"
      >
        <circle cx="27" cy="-27" r="12" />
        <circle
          cx="27"
          cy="-27"
          r="5"
          fill="none"
          stroke="#09213b"
          strokeWidth="1.8"
        />
        <path
          d="M27 -35 V-31 M27 -23 V-19 M19 -27 H23 M31 -27 H35"
          fill="none"
          stroke="#09213b"
          strokeWidth="1.8"
        />
      </g>
    );
  }

  if (state === "visited") {
    return (
      <g
        className="gqv-state-badge gqv-state-badge--visited"
        aria-hidden="true"
      >
        <circle cx="27" cy="-27" r="12" />
        <path d="M21 -27 L25 -23 L33 -32" />
      </g>
    );
  }

  return null;
}

export default function GraphQueueView({
  graph,
  steps = [],
  currentStep = -1,
  selectedVertex = null,
  onVertexClick,
  onVertexMove,
  draggable = false,
  showQueue = true,
  showLegend = true,
  title = "Town network",
  tool = "select",
  onCanvasClick,
  onConnect,
  initialPositions = {},
  headerActions,
  highlightedRoute = [],
  queue: controlledQueue,
  vertexStates,
  highlightedEdges = [],
  onEdgeClick,
  readOnly = false,
}: GraphQueueViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const markerId = useId().replace(/:/g, "");
  const routeMarkerId = `${markerId}-route`;

  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({
    width: WIDTH,
    height: HEIGHT,
  });
  const [connectionStart, setConnectionStart] = useState<string | null>(null);

  const [positions, setPositions] = useState<Record<string, GraphPosition>>(
    () => ({
      ...createPositions(graph),
      ...initialPositions,
    }),
  );

  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const pointerRef = useRef<{
    vertex: string;
    pointerId: number;
    origin: GraphPosition;
    originalPosition: GraphPosition;
    moved: boolean;
  } | null>(null);

  const graphKey = JSON.stringify(graph);
  const positionsKey = JSON.stringify(initialPositions);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const updateSize = () => {
      const bounds = svg.getBoundingClientRect();

      if (bounds.width <= 0 || bounds.height <= 0) return;

      setCanvasSize({
        width: HEIGHT * (bounds.width / bounds.height),
        height: HEIGHT,
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(svg);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const defaults = createPositions(graph);

    setPositions((previous) => {
      const next: Record<string, GraphPosition> = {};

      graph.vertices.forEach((vertex) => {
        next[vertex] =
          initialPositions[vertex] ??
          previous[vertex] ??
          defaults[vertex];
      });

      positionsRef.current = next;
      return next;
    });
  }, [graphKey, positionsKey]);

  useEffect(() => {
    setConnectionStart(null);
  }, [tool]);

  const index =
    Number.isFinite(currentStep) && currentStep >= 0 && steps.length
      ? Math.min(Math.floor(currentStep), steps.length - 1)
      : -1;

  const step = index >= 0 ? steps[index] : null;
  const queue = controlledQueue ?? step?.queueAfter ?? [];
  const visited = new Set(step?.visitedAfter ?? []);
  const discovered = new Set<string>();

  for (let i = 0; i <= index; i++) {
    if (steps[i].action === "enqueue") {
      discovered.add(steps[i].vertex);
    }
  }

  const routeVertices = new Set(highlightedRoute);
  const edgeKey = (from: VertexId, to: VertexId) =>
    `${JSON.stringify(from)}:${JSON.stringify(to)}`;
  const extraHighlightedEdges = new Set<string>();
  for (const edge of highlightedEdges) {
    extraHighlightedEdges.add(edgeKey(edge.from, edge.to));
    if (!graph.directed) extraHighlightedEdges.add(edgeKey(edge.to, edge.from));
  }
  const routeEdges = new Set<string>();

  for (let i = 0; i < highlightedRoute.length - 1; i++) {
    const from = highlightedRoute[i];
    const to = highlightedRoute[i + 1];

    routeEdges.add(`${JSON.stringify(from)}:${JSON.stringify(to)}`);

    if (!graph.directed) {
      routeEdges.add(`${JSON.stringify(to)}:${JSON.stringify(from)}`);
    }
  }

  const baseWidth = canvasSize.width;
  const baseHeight = canvasSize.height;
  const viewWidth = baseWidth / zoom;
  const viewHeight = baseHeight / zoom;
  const viewX = (WIDTH - viewWidth) / 2;
  const viewY = (HEIGHT - viewHeight) / 2;

  function constrainPosition(point: GraphPosition): GraphPosition {
    const marginX = Math.min(MARGIN, viewWidth / 2);
    const marginY = Math.min(MARGIN, viewHeight / 2);

    return {
      x: clamp(
        point.x,
        viewX + marginX,
        viewX + viewWidth - marginX,
      ),
      y: clamp(
        point.y,
        viewY + marginY,
        viewY + viewHeight - marginY,
      ),
    };
  }

  function getPosition(vertex: string): GraphPosition {
    return positions[vertex] ?? {
      x: WIDTH / 2,
      y: HEIGHT / 2,
    };
  }

  function toPoint(event: PointerEvent<SVGElement>): GraphPosition | null {
    const svg = svgRef.current;
    if (!svg) return null;

    const matrix = svg.getScreenCTM();
    if (!matrix) return null;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const result = point.matrixTransform(matrix.inverse());

    return { x: result.x, y: result.y };
  }

  function selectVertex(vertex: string) {
    if (!readOnly && tool === "connect" && onConnect) {
      if (!connectionStart) {
        setConnectionStart(vertex);
      } else if (connectionStart === vertex) {
        setConnectionStart(null);
      } else {
        onConnect(connectionStart, vertex);
        setConnectionStart(null);
      }

      return;
    }

    onVertexClick?.(vertex);
  }

  function moveVertex(vertex: string, next: GraphPosition) {
    const updated = {
      ...positionsRef.current,
      [vertex]: next,
    };

    positionsRef.current = updated;
    setPositions(updated);
  }

  function pointerDown(
    event: PointerEvent<SVGGElement>,
    vertex: string,
  ) {
    if (event.button !== 0) return;

    event.stopPropagation();

    const point = toPoint(event);
    if (!point) return;

    pointerRef.current = {
      vertex,
      pointerId: event.pointerId,
      origin: point,
      originalPosition: getPosition(vertex),
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<SVGGElement>) {
    const drag = pointerRef.current;

    if (
      !drag ||
      drag.pointerId !== event.pointerId ||
      (!draggable || readOnly)
    ) {
      return;
    }

    const point = toPoint(event);
    if (!point) return;

    const dx = point.x - drag.origin.x;
    const dy = point.y - drag.origin.y;

    if (Math.hypot(dx, dy) > 5) {
      drag.moved = true;
    }

    if (!drag.moved) return;

    moveVertex(
      drag.vertex,
      constrainPosition({
        x: drag.originalPosition.x + dx,
        y: drag.originalPosition.y + dy,
      }),
    );
  }

  function pointerUp(event: PointerEvent<SVGGElement>) {
    event.stopPropagation();

    const drag = pointerRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    pointerRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (drag.moved) {
      onVertexMove?.(
        drag.vertex,
        positionsRef.current[drag.vertex],
      );
    } else {
      selectVertex(drag.vertex);
    }
  }

  function keyDown(
    event: KeyboardEvent<SVGGElement>,
    vertex: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectVertex(vertex);
      return;
    }

    if (!draggable || readOnly) return;

    const directions: Record<string, GraphPosition> = {
      ArrowUp: { x: 0, y: -10 },
      ArrowDown: { x: 0, y: 10 },
      ArrowLeft: { x: -10, y: 0 },
      ArrowRight: { x: 10, y: 0 },
    };

    const delta = directions[event.key];
    if (!delta) return;

    event.preventDefault();

    const old = getPosition(vertex);

    const next = constrainPosition({
      x: old.x + delta.x,
      y: old.y + delta.y,
    });

    moveVertex(vertex, next);
    onVertexMove?.(vertex, next);
  }

  function status(vertex: string): GraphVertexState {
    if (vertexStates?.[vertex]) return vertexStates[vertex];
    if (step?.action === "visit" && step.vertex === vertex) {
      return "active";
    }

    if (visited.has(vertex)) return "visited";
    if (queue.includes(vertex)) return "queued";
    if (discovered.has(vertex)) return "discovered";

    return "unvisited";
  }

  function addAtPoint(event: PointerEvent<SVGRectElement>) {
    if (
      readOnly ||
      tool !== "add" ||
      !onCanvasClick ||
      event.button !== 0
    ) {
      return;
    }

    const point = toPoint(event);
    if (!point) return;

    onCanvasClick(constrainPosition(point));
  }

  return (
    <div className="graph-queue-view">
      <section className="gqv-graph-panel">
        <div className="gqv-heading">
          <div>
            <span className="gqv-eyebrow">
              NETWORK BLUEPRINT
            </span>
            <h2>{title}</h2>
          </div>

          <div className="gqv-header-actions">
            {headerActions}

            <div className="gqv-zoom-controls">
              <button
                type="button"
                aria-label="Zoom out"
                disabled={zoom <= 0.6}
                onClick={() =>
                  setZoom((previous) =>
                    clamp(previous - 0.2, 0.6, 2.4),
                  )
                }
              >
                <Minus size={17} />
              </button>

              <span>{Math.round(zoom * 100)}%</span>

              <button
                type="button"
                aria-label="Zoom in"
                disabled={zoom >= 2.4}
                onClick={() =>
                  setZoom((previous) =>
                    clamp(previous + 0.2, 0.6, 2.4),
                  )
                }
              >
                <Plus size={17} />
              </button>

              <button
                type="button"
                aria-label="Reset zoom"
                onClick={() => setZoom(1)}
              >
                <Maximize2 size={17} />
              </button>
            </div>
          </div>
        </div>

        <div className={`gqv-canvas gqv-canvas--${tool}`}>
          <svg
            ref={svgRef}
            viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
            preserveAspectRatio="xMidYMid meet"
            role="group"
            aria-label="Town network graph. Town status is shown using colours and symbols."
          >
            <defs>
              <marker
                id={markerId}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0 0 L8 4 L0 8 Z" fill="#a2bad5" />
              </marker>

              <marker
                id={routeMarkerId}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0 0 L8 4 L0 8 Z" fill="#facc15" />
              </marker>
            </defs>

            <rect
              x={viewX}
              y={viewY}
              width={viewWidth}
              height={viewHeight}
              fill="transparent"
              pointerEvents="all"
              onPointerUp={addAtPoint}
            />

            {graph.edges.map((edge, index) => {
              const from = getPosition(edge.from);
              const to = getPosition(edge.to);

              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const length = Math.hypot(dx, dy);

              if (length < 1) return null;

              const ux = dx / length;
              const uy = dy / length;

              const isRoute = routeEdges.has(edgeKey(edge.from, edge.to));
              const isHighlighted = isRoute || extraHighlightedEdges.has(edgeKey(edge.from, edge.to));

              return (
                <g key={`${edge.from}-${edge.to}-${index}`}>
                <line
                  key={`${edge.from}-${edge.to}-${index}`}
                  x1={from.x + ux * (RADIUS + 3)}
                  y1={from.y + uy * (RADIUS + 3)}
                  x2={to.x - ux * (RADIUS + 9)}
                  y2={to.y - uy * (RADIUS + 9)}
                  className="gqv-edge"
                  stroke={isHighlighted ? "#facc15" : undefined}
                  strokeWidth={isHighlighted ? 5 : undefined}
                  markerEnd={
                    graph.directed
                      ? `url(#${isHighlighted ? routeMarkerId : markerId})`
                      : undefined
                  }
                  pointerEvents="none"
                />
                {onEdgeClick && (
                  <line
                    x1={from.x + ux * (RADIUS + 3)}
                    y1={from.y + uy * (RADIUS + 3)}
                    x2={to.x - ux * (RADIUS + 9)}
                    y2={to.y - uy * (RADIUS + 9)}
                    stroke="transparent"
                    strokeWidth={18}
                    pointerEvents="stroke"
                    role="button"
                    tabIndex={0}
                    aria-label={`Road from ${edge.from} to ${edge.to}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdgeClick(edge.from, edge.to);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onEdgeClick(edge.from, edge.to);
                      }
                    }}
                  />
                )}
                </g>
              );
            })}

            {graph.vertices.map((vertex) => {
              const position = getPosition(vertex);
              const vertexState = status(vertex);
              const isRoute = routeVertices.has(vertex);

              return (
                <g
                  key={vertex}
                  transform={`translate(${position.x},${position.y})`}
                  className={[
                    "gqv-node",
                    `gqv-node--${vertexState}`,
                    selectedVertex === vertex
                      ? "gqv-node--selected"
                      : "",
                    connectionStart === vertex
                      ? "gqv-node--connecting"
                      : "",
                    draggable && !readOnly ? "gqv-node--draggable" : "",
                  ].join(" ")}
                  onPointerDown={(event) =>
                    pointerDown(event, vertex)
                  }
                  onPointerMove={pointerMove}
                  onPointerUp={pointerUp}
                  onPointerCancel={(event) => {
                    if (
                      pointerRef.current?.pointerId === event.pointerId
                    ) {
                      pointerRef.current = null;
                    }
                  }}
                  onKeyDown={(event) =>
                    keyDown(event, vertex)
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={`Town ${vertex}, ${vertexState}${
                    isRoute ? ", on shortest route" : ""
                  }. ${draggable && !readOnly ? "Use arrow keys to move." : ""}`}
                  aria-pressed={
                    selectedVertex === vertex ||
                    connectionStart === vertex
                  }
                >
                  <circle className="gqv-node-ring" r="39" />

                  <circle
                    className="gqv-node-circle"
                    r={RADIUS}
                    style={
                      isRoute
                        ? {
                            fill: "#facc15",
                            stroke: "#fff2a1",
                          }
                        : undefined
                    }
                  />

                  <g
                    className="gqv-house"
                    aria-hidden="true"
                    style={
                      isRoute
                        ? { color: "#10243d" }
                        : undefined
                    }
                  >
                    <path
                      d="M-10 -12 L0 -21 L10 -12 M-7 -14 V-3 H7 V-14 M-2 -3 V-10 H3 V-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>

                  <text
                    className="gqv-node-label"
                    textAnchor="middle"
                    y="17"
                    style={
                      isRoute
                        ? { fill: "#10243d" }
                        : undefined
                    }
                  >
                    {vertex.length > 7
                      ? `${vertex.slice(0, 6)}…`
                      : vertex}
                  </text>

                  {!isRoute && <StateBadge state={vertexState} />}
                </g>
              );
            })}
          </svg>

          {graph.vertices.length === 0 && (
            <div className="gqv-empty-overlay">
              <House size={25} />
              <strong>Start your town network</strong>
              <span>
                Choose Add Town, then click the blueprint.
              </span>
            </div>
          )}
        </div>

        <div className="gqv-canvas-footer">
          <span className="gqv-tool-hint">
            {tool === "add"
              ? "Click empty space to add a town. Drag existing towns to move them."
              : tool === "connect"
                ? connectionStart
                  ? `Now select the destination for ${connectionStart}.`
                  : "Select the first town, then the second."
                : draggable && !readOnly
                  ? "Drag towns to move. Arrow keys move focused towns."
                  : "Explore the town network."}
          </span>

          <span className="gqv-stats">
            {graph.vertices.length} towns ·{" "}
            {graph.edges.length} roads ·{" "}
            {graph.directed ? "One-way" : "Two-way"}
          </span>
        </div>

        {showLegend && (
          <div className="gqv-legend" aria-label="Town status key">
            <span>
              <i className="gqv-dot gqv-dot--unvisited" />
              Not reached
            </span>

            <span>
              <i className="gqv-dot gqv-dot--queued" />
              <b className="gqv-legend-symbol">Q</b>
              In queue
            </span>

            <span>
              <i className="gqv-dot gqv-dot--active" />
              <b className="gqv-legend-symbol">◎</b>
              Current
            </span>

            <span>
              <i className="gqv-dot gqv-dot--visited" />
              <b className="gqv-legend-symbol">✓</b>
              Visited
            </span>

            {highlightedRoute.length > 0 && (
              <span>
                <i
                  className="gqv-dot"
                  style={{
                    background: "#facc15",
                    borderColor: "#fff2a1",
                  }}
                />
                Shortest route
              </span>
            )}
          </div>
        )}
      </section>

      {showQueue && (
        <section className="gqv-queue-panel">
          <div className="gqv-heading">
            <div>
              <span className="gqv-eyebrow">
                FIRST IN, FIRST OUT
              </span>
              <h2>Dispatch queue</h2>
            </div>
          </div>

          <p className="gqv-description">
            Towns enter at the back and leave from the front.
          </p>

          <div className="gqv-queue-labels">
            <span>FRONT</span>
            <span>BACK</span>
          </div>

          {queue.length ? (
            <div
              className="gqv-queue-items"
              role="list"
              aria-label="BFS queue, front first"
            >
              {queue.map((vertex, index) => (
                <div
                  key={`${vertex}-${index}`}
                  role="listitem"
                  className={`gqv-queue-item ${
                    index === 0 ? "gqv-queue-item--front" : ""
                  }`}
                >
                  <strong>{vertex}</strong>
                  {index === 0 && <small>Next out</small>}
                </div>
              ))}
            </div>
          ) : (
            <div className="gqv-queue-empty">
              <strong>Queue empty</strong>
              <span>
                {step
                  ? "No towns are waiting."
                  : "Start BFS to see the queue."}
              </span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
