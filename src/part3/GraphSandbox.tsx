import townSkyline from "../assets/town-skyline.png";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  CirclePlus,
  GitBranch,
  Route,
  House,
  Info,
  Link2,
  List,
  Move,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import type { BfsStep, GraphModel, VertexId } from "../shared/types";
import GraphQueueView from "./GraphQueueView";
import type { GraphPosition, GraphTool } from "./GraphQueueView";

import {
  addEdge,
  addVertex,
  getAdjacencyList,
  getVisitOrder,
  findShortestRoute,
  removeEdge,
  removeVertex,
  renameVertex,
  runBfs,
  setDirected,
} from "./graphUtils";

import "./GraphSandbox.css";

const DEFAULT_GRAPH: GraphModel = {
  directed: false,
  vertices: ["A", "B", "C", "D", "E"],
  edges: [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "C", to: "E" },
  ],
};

type Mode = "build" | "explore";
type Editor = "add" | "rename" | "roads" | null;
type PlaybackSpeed = 0.5 | 1 | 2;

export interface GraphSandboxProps {
  initialGraph?: GraphModel;
  onGraphChange?: (graph: GraphModel) => void;
}

function copyGraph(graph: GraphModel): GraphModel {
  return {
    directed: graph.directed,
    vertices: [...graph.vertices],
    edges: graph.edges.map((edge) => ({ ...edge })),
  };
}

function explainStep(step: BfsStep | null) {
  if (!step) {
    return {
      title: "Ready to explore",
      text: "Choose a starting town, then step through BFS or run the animation.",
    };
  }

  switch (step.action) {
    case "enqueue":
      return {
        title: `Town ${step.vertex} joins the queue`,
        text: `Town ${step.vertex} enters at the back of the queue and waits its turn.`,
      };

    case "dequeue":
      return {
        title: `Town ${step.vertex} leaves the queue`,
        text: `Town ${step.vertex} is removed from the front. This demonstrates First In, First Out (FIFO).`,
      };

    case "visit":
      return {
        title: `Visiting town ${step.vertex}`,
        text: `BFS visits town ${step.vertex} and examines its neighbours.`,
      };

    case "skip":
      return {
        title: `Skipping town ${step.vertex}`,
        text: `Town ${step.vertex} was already discovered, so BFS skips it to avoid processing it again.`,
      };
  }
}

export default function GraphSandbox({
  initialGraph = DEFAULT_GRAPH,
  onGraphChange,
}: GraphSandboxProps) {
  const [graph, setGraph] = useState(() => copyGraph(initialGraph));

  const [mode, setMode] = useState<Mode>("build");
  const [tool, setTool] = useState<GraphTool>("select");
  const [editor, setEditor] = useState<Editor>(null);

  const [selectedTown, setSelectedTown] = useState<VertexId | null>(null);

  const [positions, setPositions] = useState<
    Record<string, GraphPosition>
  >({});

  const [newTown, setNewTown] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [roadFrom, setRoadFrom] = useState("");
  const [roadTo, setRoadTo] = useState("");

  const [startTown, setStartTown] = useState(
    initialGraph.vertices[0] ?? "",
  );

  const [destinationTown, setDestinationTown] = useState(initialGraph.vertices[initialGraph.vertices.length - 1] ?? "");
  const [showRoute, setShowRoute] = useState(false);
  const [resultsTab, setResultsTab] = useState<"order" | "route">("order");
  const [steps, setSteps] = useState<BfsStep[]>([]);
  const [stepIndex, setStepIndex] = useState(-1);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] =
    useState<PlaybackSpeed>(1);

  const playbackTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [notice, setNotice] = useState(
    "Choose a tool to build your network.",
  );

  const current =
    stepIndex >= 0 && stepIndex < steps.length
      ? steps[stepIndex]
      : null;

  const queue =
    mode === "explore" ? current?.queueAfter ?? [] : [];

  const adjacency = getAdjacencyList(graph);
  const route = findShortestRoute(graph, startTown, destinationTown);
  const displayedRoute = showRoute && mode !== "build" && route.reachable ? route.path : [];

  const visitOrder = getVisitOrder(
    stepIndex >= 0 ? steps.slice(0, stepIndex + 1) : [],
  );

  const finished =
    steps.length > 0 && stepIndex === steps.length - 1;

  const explanation = explainStep(current);

  const progress =
    steps.length > 0
      ? ((stepIndex + 1) / steps.length) * 100
      : 0;

  // Stop the current timer immediately when playback is cancelled.
  function stopPlayback() {
    if (playbackTimer.current !== null) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }

    setIsPlaying(false);
  }

  // Advance exactly one operation per timer tick.
  useEffect(() => {
    if (
      !isPlaying ||
      mode !== "explore" ||
      steps.length === 0 ||
      finished
    ) {
      return;
    }

    playbackTimer.current = setTimeout(() => {
      playbackTimer.current = null;

      setStepIndex((previous) =>
        Math.min(previous + 1, steps.length - 1),
      );
    }, 1000 / playbackSpeed);

    return () => {
      if (playbackTimer.current !== null) {
        clearTimeout(playbackTimer.current);
        playbackTimer.current = null;
      }
    };
  }, [
    isPlaying,
    mode,
    steps.length,
    stepIndex,
    playbackSpeed,
    finished,
  ]);

  // Automatically finish playback when the last operation is reached.
  useEffect(() => {
    if (finished && isPlaying) {
      setIsPlaying(false);
    }
  }, [finished, isPlaying]);

  function updateGraph(next: GraphModel, message: string) {
    if (next === graph) {
      setNotice(
        "No change made. Check for a duplicate name or road.",
      );
      return false;
    }

    stopPlayback();

    setGraph(next);
    onGraphChange?.(next);

    setSteps([]);
    setStepIndex(-1);
    setShowRoute(false);
    if (!next.vertices.includes(destinationTown)) setDestinationTown(next.vertices[next.vertices.length - 1] ?? "");

    if (!next.vertices.includes(startTown)) {
      setStartTown(next.vertices[0] ?? "");
    setDestinationTown(next.vertices[next.vertices.length - 1] ?? "");
    setShowRoute(false);
    }

    if (
      selectedTown &&
      !next.vertices.includes(selectedTown)
    ) {
      setSelectedTown(null);
    }

    setNotice(message);
    return true;
  }

  function nextTownName() {
    let i = 0;

    while (true) {
      let n = i;
      let name = "";

      do {
        name = String.fromCharCode(65 + (n % 26)) + name;
        n = Math.floor(n / 26) - 1;
      } while (n >= 0);

      if (!graph.vertices.includes(name)) return name;

      i++;
    }
  }

  function addTown(name: string, point?: GraphPosition) {
    const value = name.trim();

    if (!value) {
      setNotice("Enter a town name.");
      return;
    }

    if (
      updateGraph(
        addVertex(graph, value),
        `Town ${value} added.`,
      )
    ) {
      if (point) {
        setPositions((previous) => ({
          ...previous,
          [value]: point,
        }));
      }

      setSelectedTown(value);
      setNewTown("");
      setEditor(null);
    }
  }

  function renameTown(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTown) return;

    const name = renameValue.trim();

    if (!name) {
      setNotice("Enter a new name.");
      return;
    }

    const oldName = selectedTown;

    if (
      updateGraph(
        renameVertex(graph, oldName, name),
        `Renamed ${oldName} to ${name}.`,
      )
    ) {
      setPositions((previous) => {
        const next = { ...previous };

        if (next[oldName]) {
          next[name] = next[oldName];
          delete next[oldName];
        }

        return next;
      });

      setSelectedTown(name);

      if (startTown === oldName) {
        setStartTown(name);
      }

      setRenameValue("");
      setEditor(null);
    }
  }

  function deleteTown() {
    if (!selectedTown) return;

    const id = selectedTown;

    if (
      updateGraph(
        removeVertex(graph, id),
        `Town ${id} and its roads removed.`,
      )
    ) {
      setPositions((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
    }
  }

  function connectTowns(from: string, to: string) {
    if (from === to) {
      setNotice("Choose two different towns.");
      return;
    }

    updateGraph(
      addEdge(graph, from, to),
      `Road ${from} ${graph.directed ? "→" : "↔"} ${to} added.`,
    );
  }

  function addRoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!roadFrom || !roadTo) {
      setNotice("Choose two towns.");
      return;
    }

    connectTowns(roadFrom, roadTo);
  }

  function resetBfs() {
    stopPlayback();
    setSteps([]);
    setStepIndex(-1);
  }

  function nextStep() {
    stopPlayback();

    if (!graph.vertices.includes(startTown)) return;

    if (!steps.length) {
      const result = runBfs(graph, startTown);

      setSteps(result);
      setStepIndex(result.length ? 0 : -1);
    } else {
      setStepIndex((previous) =>
        Math.min(previous + 1, steps.length - 1),
      );
    }
  }

  function previousStep() {
    stopPlayback();

    setStepIndex((previous) => Math.max(-1, previous - 1));
  }

  // Run All now animates rather than jumping to the final state.
  function runAll() {
    if (!graph.vertices.includes(startTown)) return;

    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (finished) {
      // Replay from the beginning.
      setStepIndex(-1);
    }

    if (!steps.length) {
      const result = runBfs(graph, startTown);

      setSteps(result);
      setStepIndex(-1);

      if (!result.length) return;
    }

    setIsPlaying(true);
  }

  function resetGraph() {
    stopPlayback();

    const next = copyGraph(initialGraph);

    setGraph(next);
    onGraphChange?.(next);

    setPositions({});
    setSelectedTown(null);
    setStartTown(next.vertices[0] ?? "");
    setDestinationTown(next.vertices[next.vertices.length - 1] ?? "");
    setShowRoute(false);

    setSteps([]);
    setStepIndex(-1);

    setTool("select");
    setEditor(null);

    setNotice("Starting network restored.");
  }

  function clearGraph() {
    stopPlayback();

    const next: GraphModel = {
      vertices: [],
      edges: [],
      directed: graph.directed,
    };

    setGraph(next);
    onGraphChange?.(next);

    setPositions({});
    setSelectedTown(null);
    setStartTown("");
    setDestinationTown("");
    setShowRoute(false);

    setSteps([]);
    setStepIndex(-1);

    setTool("add");
    setEditor(null);

    setNotice(
      "Graph cleared. Click the blueprint to add a town.",
    );
  }

  function changeMode(next: Mode) {
    stopPlayback();

    setMode(next);
    setShowRoute(false);
    setTool("select");
    setEditor(null);
    setSelectedTown(null);

    setNotice(
      next === "build"
        ? "Build mode: edit your town network."
        : "Explore mode: step through BFS and find a route.",
    );
  }

  function chooseTool(next: GraphTool) {
    setTool(next);
    setEditor(null);

    setNotice(
      next === "add"
        ? "Click empty space to add a town. Existing towns can still be dragged."
        : next === "connect"
          ? "Click the first town, then the second to connect them."
          : "Select or drag towns to rearrange the network.",
    );
  }

  return (
    <main className="sandbox">
      <div className="sandbox-shell">
        <header className="sandbox-header">
          <div className="sandbox-brand">
            <span
              className="sandbox-brand-icon"
              aria-hidden="true"
            >
              <GitBranch size={26} />
            </span>

            <div>
              <span className="sandbox-eyebrow">
                COS212 · INTERACTIVE LEARNING
              </span>

              <h1>Graph Sandbox</h1>

              <p>
                Restore the town network and explore
                Breadth-First Search (BFS).
              </p>
            </div>
          </div>
        </header>

        <div className="sandbox-modes">
          <div
            className="sandbox-mode-buttons"
            role="group"
            aria-label="Sandbox mode"
          >
            <button
              type="button"
              className={`sandbox-mode-button ${
                mode === "build" ? "is-active" : ""
              }`}
              aria-pressed={mode === "build"}
              onClick={() => changeMode("build")}
            >
              <GitBranch size={18} />
              Build Network
            </button>

            <button
              type="button"
              className={`sandbox-mode-button ${
                mode === "explore" ? "is-active" : ""
              }`}
              aria-pressed={mode === "explore"}
              onClick={() => changeMode("explore")}
            >
              <Play size={17} />
              Explore BFS
            </button>

          </div>

          <span className="sandbox-mode-hint">
            <Info size={15} />

            {mode === "build"
              ? "Add, connect and rearrange towns."
              : "Follow BFS using the FIFO queue."}
          </span>
        </div>

        <div className="sandbox-workspace">
          <div className="sandbox-left">
            <GraphQueueView
              graph={graph}
              highlightedRoute={displayedRoute}
              steps={mode === "explore" ? steps : []}
              currentStep={
                mode === "explore" ? stepIndex : -1
              }
              selectedVertex={selectedTown}
              initialPositions={positions}
              showQueue={false}
              tool={mode === "build" ? tool : "select"}
              draggable={mode === "build"}
              onCanvasClick={
                mode === "build" && tool === "add"
                  ? (point) =>
                      addTown(nextTownName(), point)
                  : undefined
              }
              onConnect={
                mode === "build"
                  ? connectTowns
                  : undefined
              }
              onVertexClick={(vertex) => {
                setSelectedTown(vertex);
                setNotice(`Town ${vertex} selected.`);
              }}
              onVertexMove={(vertex, point) => {
                setPositions((previous) => ({
                  ...previous,
                  [vertex]: point,
                }));

                setNotice(`Town ${vertex} moved.`);
              }}
              headerActions={
                mode === "build" ? (
                  <div className="sandbox-graph-actions">
                    <button
                      type="button"
                      onClick={resetGraph}
                      title="Restore starting graph"
                    >
                      <RotateCcw size={15} />
                      Reset
                    </button>

                    <button
                      type="button"
                      onClick={clearGraph}
                      disabled={
                        graph.vertices.length === 0
                      }
                      title="Clear the network"
                    >
                      <Trash2 size={15} />
                      Clear
                    </button>
                  </div>
                ) : undefined
              }
            />

            <section className="sandbox-panel sandbox-main-controls">
              {mode === "build" ? (
                <>
                  <div className="sandbox-panel-heading">
                    <div>
                      <span className="sandbox-eyebrow">
                        BUILD YOUR NETWORK
                      </span>
                      <h2>Network tools</h2>
                    </div>

                    <span className="sandbox-small-label">
                      {selectedTown
                        ? `Selected: ${selectedTown}`
                        : "No town selected"}
                    </span>
                  </div>

                  <div className="sandbox-toolbar">
                    <button
                      type="button"
                      onClick={() => chooseTool("add")}
                      aria-pressed={tool === "add"}
                      className={`sandbox-button ${
                        tool === "add"
                          ? "sandbox-button--yellow"
                          : "sandbox-button--outline"
                      }`}
                    >
                      <CirclePlus size={16} />
                      Add Town
                    </button>

                    <button
                      type="button"
                      onClick={() => chooseTool("connect")}
                      aria-pressed={tool === "connect"}
                      className={`sandbox-button ${
                        tool === "connect"
                          ? "sandbox-button--yellow"
                          : "sandbox-button--outline"
                      }`}
                    >
                      <Link2 size={16} />
                      Connect
                    </button>

                    <button
                      type="button"
                      onClick={() => chooseTool("select")}
                      aria-pressed={tool === "select"}
                      className={`sandbox-button ${
                        tool === "select"
                          ? "sandbox-button--yellow"
                          : "sandbox-button--outline"
                      }`}
                    >
                      <Move size={16} />
                      Move / Select
                    </button>

                    <button
                      type="button"
                      disabled={!selectedTown}
                      className="sandbox-button sandbox-button--outline"
                      onClick={() => {
                        setTool("select");
                        setEditor(
                          editor === "rename"
                            ? null
                            : "rename",
                        );
                      }}
                    >
                      <Pencil size={16} />
                      Rename
                    </button>

                    <button
                      type="button"
                      disabled={!selectedTown}
                      className="sandbox-button sandbox-button--outline-danger"
                      onClick={deleteTown}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>

                  <div className="sandbox-build-options">
                    <label className="sandbox-checkbox">
                      <input
                        type="checkbox"
                        checked={graph.directed}
                        onChange={(event) =>
                          updateGraph(
                            setDirected(
                              graph,
                              event.target.checked,
                            ),
                            event.target.checked
                              ? "One-way roads enabled."
                              : "Two-way roads enabled.",
                          )
                        }
                      />
                      One-way roads
                    </label>

                    <button
                      type="button"
                      className="sandbox-text-button"
                      onClick={() =>
                        setEditor(
                          editor === "add"
                            ? null
                            : "add",
                        )
                      }
                    >
                      Add a named town
                    </button>

                    <button
                      type="button"
                      className="sandbox-text-button"
                      onClick={() =>
                        setEditor(
                          editor === "roads"
                            ? null
                            : "roads",
                        )
                      }
                    >
                      Manage roads ({graph.edges.length})
                    </button>
                  </div>

                  {editor === "add" && (
                    <form
                      className="sandbox-inline-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        addTown(newTown);
                      }}
                    >
                      <label>
                        Town name
                        <input
                          value={newTown}
                          maxLength={24}
                          autoFocus
                          onChange={(event) =>
                            setNewTown(event.target.value)
                          }
                          placeholder="e.g. F"
                        />
                      </label>

                      <button
                        className="sandbox-button sandbox-button--yellow"
                        type="submit"
                      >
                        <Check size={16} />
                        Add
                      </button>

                      <button
                        className="sandbox-icon-button"
                        type="button"
                        aria-label="Close"
                        onClick={() => setEditor(null)}
                      >
                        <X size={17} />
                      </button>
                    </form>
                  )}

                  {editor === "rename" && selectedTown && (
                    <form
                      className="sandbox-inline-form"
                      onSubmit={renameTown}
                    >
                      <label>
                        Rename {selectedTown}
                        <input
                          value={renameValue}
                          maxLength={24}
                          autoFocus
                          onChange={(event) =>
                            setRenameValue(event.target.value)
                          }
                          placeholder="New name"
                        />
                      </label>

                      <button
                        className="sandbox-button sandbox-button--yellow"
                        type="submit"
                      >
                        <Check size={16} />
                        Save
                      </button>

                      <button
                        className="sandbox-icon-button"
                        type="button"
                        aria-label="Close"
                        onClick={() => setEditor(null)}
                      >
                        <X size={17} />
                      </button>
                    </form>
                  )}

                  {editor === "roads" && (
                    <div className="sandbox-road-manager">
                      <form
                        className="sandbox-road-form"
                        onSubmit={addRoad}
                      >
                        <label>
                          From
                          <select
                            value={roadFrom}
                            onChange={(event) =>
                              setRoadFrom(event.target.value)
                            }
                          >
                            <option value="">Choose</option>
                            {graph.vertices.map((vertex) => (
                              <option key={vertex}>
                                {vertex}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          To
                          <select
                            value={roadTo}
                            onChange={(event) =>
                              setRoadTo(event.target.value)
                            }
                          >
                            <option value="">Choose</option>
                            {graph.vertices.map((vertex) => (
                              <option key={vertex}>
                                {vertex}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          className="sandbox-button sandbox-button--yellow"
                          type="submit"
                        >
                          <Link2 size={15} />
                          Connect
                        </button>
                      </form>

                      <div className="sandbox-road-list">
                        {graph.edges.map((edge, index) => (
                          <div
                            className="sandbox-road"
                            key={`${edge.from}-${edge.to}-${index}`}
                          >
                            {edge.from}{" "}
                            {graph.directed ? "→" : "↔"}{" "}
                            {edge.to}

                            <button
                              type="button"
                              aria-label={`Remove road from ${edge.from} to ${edge.to}`}
                              onClick={() =>
                                updateGraph(
                                  removeEdge(
                                    graph,
                                    edge.from,
                                    edge.to,
                                  ),
                                  `Road ${edge.from} to ${edge.to} removed.`,
                                )
                              }
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        {!graph.edges.length && (
                          <span>No roads yet.</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="sandbox-panel-heading">
                    <div>
                      <span className="sandbox-eyebrow">
                        BREADTH-FIRST SEARCH
                      </span>
                      <h2>Explore BFS</h2>
                    </div>

                    <span className="sandbox-small-label">
                      Step {Math.max(0, stepIndex + 1)} of{" "}
                      {steps.length}
                    </span>
                  </div>

                  <div className="sandbox-playback-controls">
                    <label className="sandbox-start-field">
                      Starting town
                      <select
                        value={startTown}
                        disabled={
                          !graph.vertices.length ||
                          isPlaying
                        }
                        onChange={(event) => {
                          setStartTown(event.target.value);
                          resetBfs();
                        }}
                      >
                        {!graph.vertices.length && (
                          <option value="">
                            No towns
                          </option>
                        )}

                        {graph.vertices.map((vertex) => (
                          <option key={vertex}>
                            {vertex}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      className="sandbox-button sandbox-button--outline"
                      disabled={stepIndex < 0}
                      onClick={previousStep}
                    >
                      <ArrowLeft size={16} />
                      Previous
                    </button>

                    <button
                      type="button"
                      className="sandbox-button sandbox-button--yellow"
                      disabled={
                        !graph.vertices.length || finished
                      }
                      onClick={nextStep}
                    >
                      Next Step
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      className={`sandbox-button ${
                        isPlaying
                          ? "sandbox-button--yellow"
                          : "sandbox-button--outline"
                      }`}
                      disabled={!graph.vertices.length}
                      onClick={runAll}
                    >
                      {isPlaying ? (
                        <>
                          <Pause size={16} />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          {finished
                            ? "Replay"
                            : steps.length > 0 &&
                                stepIndex >= 0
                              ? "Resume"
                              : "Run All"}
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="sandbox-button sandbox-button--outline"
                      disabled={
                        !steps.length && stepIndex < 0
                      }
                      onClick={resetBfs}
                    >
                      <RotateCcw size={16} />
                      Reset
                    </button>

                    <label className="sandbox-start-field">
                      Speed
                      <select
                        value={playbackSpeed}
                        aria-label="Playback speed"
                        onChange={(event) =>
                          setPlaybackSpeed(
                            Number(event.target.value) as PlaybackSpeed,
                          )
                        }
                      >
                        <option value={0.5}>0.5× Slow</option>
                        <option value={1}>1× Normal</option>
                        <option value={2}>2× Fast</option>
                      </select>
                    </label>
                  </div>

                  <div
                    role="progressbar"
                    aria-label="BFS traversal progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                    style={{
                      height: 5,
                      marginTop: 12,
                      overflow: "hidden",
                      borderRadius: 999,
                      background: "#254765",
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: "#ffca20",
                        borderRadius: 999,
                        transition:
                          "width 180ms ease-out",
                      }}
                    />
                  </div>
                </>
              )}
            </section>

            <section
              className="sandbox-panel sandbox-explanation"
              aria-live={isPlaying ? "off" : "polite"}
            >
              <div className="sandbox-explanation-icon">
                <CircleHelp size={21} />
              </div>

              <div>
                <h2>What's happening?</h2>

                <strong>
                  {mode === "build"
                    ? "Building your network"
                    : explanation.title}
                </strong>

                <p>
                  {mode === "build"
                    ? notice
                    : explanation.text}
                </p>

                {mode === "explore" && finished && (
                  <span className="sandbox-complete">
                    <Check size={14} />
                    Traversal complete
                  </span>
                )}
              </div>
            </section>
          </div>

          <aside
            className="sandbox-learning-sidebar"
            aria-label="Network information"
          >
            <section className="sandbox-panel sandbox-queue-panel">
              <div className="sandbox-panel-heading">
                <div className="sandbox-heading-with-icon">
                  <GitBranch size={20} />
                  <h2>BFS queue (FIFO)</h2>
                </div>
              </div>

              <p className="sandbox-sidebar-description">
                First In, First Out — the first town added
                is the first removed.
              </p>

              <div className="sandbox-queue-labels">
                <span>FRONT · NEXT OUT</span>
                <span>BACK · NEXT IN</span>
              </div>

              {queue.length ? (
                <div
                  className="sandbox-queue-items"
                  role="list"
                  aria-label="BFS queue, front first"
                >
                  {queue.map((vertex, index) => (
                    <span
                      key={`${vertex}-${index}`}
                      role="listitem"
                      className={`sandbox-queue-town ${
                        index === 0 ? "is-front" : ""
                      }`}
                    >
                      {vertex}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="sandbox-queue-empty">
                  {current
                    ? "No towns are waiting."
                    : "Start BFS to populate the queue."}
                </div>
              )}
            </section>

            <section className="sandbox-panel sandbox-adjacency-panel">
              <div className="sandbox-panel-heading">
                <div className="sandbox-heading-with-icon">
                  <List size={20} />
                  <h2>Adjacency list</h2>
                </div>
              </div>

              <div className="sandbox-adjacency-list">
                {graph.vertices.map((vertex) => (
                  <button
                    key={vertex}
                    type="button"
                    className={`sandbox-adjacency-row ${
                      selectedTown === vertex
                        ? "is-selected"
                        : ""
                    }`}
                    aria-pressed={selectedTown === vertex}
                    onClick={() => {
                      setSelectedTown(vertex);
                      setNotice(
                        `Town ${vertex} selected.`,
                      );
                    }}
                  >
                    <span className="sandbox-adjacency-name">
                      {vertex}
                    </span>

                    <span className="sandbox-adjacency-neighbours">
                      {adjacency[vertex]?.length
                        ? adjacency[vertex].join(", ")
                        : "No neighbours"}
                    </span>
                  </button>
                ))}

                {!graph.vertices.length && (
                  <p className="sandbox-empty-note">
                    No towns yet.
                  </p>
                )}
              </div>
            </section>

            <section className="sandbox-panel sandbox-order-panel">
              <div className="sandbox-panel-heading sandbox-results-heading">
                <div className="sandbox-heading-with-icon">
                  <House size={20} />
                  <h2>{mode === "explore" ? "BFS Results" : "Traversal order"}</h2>
                </div>
              </div>

              {mode === "explore" && (
                <div className="sandbox-results-tabs" role="tablist" aria-label="BFS results">
                  <button type="button" role="tab" aria-selected={resultsTab === "order"} className={resultsTab === "order" ? "is-active" : ""} onClick={() => { setResultsTab("order"); setShowRoute(false); }}>
                    Traversal order
                  </button>
                  <button type="button" role="tab" aria-selected={resultsTab === "route"} className={resultsTab === "route" ? "is-active" : ""} onClick={() => setResultsTab("route")}>
                    Shortest route
                  </button>
                </div>
              )}

              {mode !== "explore" || resultsTab === "order" ? (
                <div className="sandbox-order-items" role={mode === "explore" ? "tabpanel" : undefined}>
                  {visitOrder.length ? (
                    visitOrder.map((vertex, index) => (
                      <span className="sandbox-order-entry" key={`${vertex}-${index}`}>
                        {index > 0 && <ArrowRight size={14} />}
                        <span className="sandbox-order-town">{vertex}</span>
                      </span>
                    ))
                  ) : (
                    <span className="sandbox-empty-note">
                      {mode === "build"
                        ? "Switch to Explore BFS to begin."
                        : "Visited towns will appear here."}
                    </span>
                  )}
                </div>
              ) : (
                <div className="sandbox-results-route" role="tabpanel">
                  <label className="sandbox-results-destination">
                    <span>From {startTown || "—"} to</span>
                    <select value={destinationTown} disabled={!graph.vertices.length} onChange={(event) => { setDestinationTown(event.target.value); setShowRoute(false); }}>
                      {graph.vertices.map((vertex) => (
                        <option key={vertex} value={vertex}>{vertex}</option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className="sandbox-button sandbox-button--yellow" disabled={!graph.vertices.length} onClick={() => { stopPlayback(); setShowRoute((value) => !value); }}>
                    <Route size={15} /> {showRoute ? "Hide route" : "Show route"}
                  </button>
                  {showRoute && (
                    <div className="sandbox-results-answer" role="status">
                      {route.reachable ? (
                        <>
                          <strong>{route.path.join(" → ")}</strong>
                          <span>{route.roadCount} {route.roadCount === 1 ? "road" : "roads"} — the fewest possible.</span>
                        </>
                      ) : (
                        <span>No route from {startTown} to {destinationTown} using the available roads.</span>
                      )}
                    </div>
                  )}
                  <p className="sandbox-results-tip">BFS explores towns one road away, then two, and so on. The first route to a destination uses the fewest roads.</p>
                </div>
              )}
            </section>

            <div className="sandbox-learning-note">
              <Info size={15} />

              <span>
                Town = vertex · Road = edge · BFS explores
                by distance.
              </span>
            </div>
            <div className="town-skyline-decoration">
                <img src={townSkyline} alt="" aria-hidden="true" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
