import { useEffect, useState } from "react";
import GraphQueueView from "../part3/GraphQueueView";
import { getAdjacencyList, getNeighbours } from "../part3/graphUtils";
import type { BfsStep, GraphModel, VertexId } from "../shared/types";
import {BFS_PSEUDOCODE,VIEW_MODES,dequeueIndices,pseudocodeLineFor,stepShownAfterDecisions,type ViewMode,} from "./representations";

const listOrEmpty = (vertices: VertexId[]) => (vertices.length > 0 ? vertices.join(", ") : "(empty)");

//Prompt user to see what learning preference they would prefer
export function ViewPreferencePicker({
  onChoose,
  onSkip,
}: {
  onChoose: (mode: ViewMode) => void;
  onSkip: () => void;
}) {
  return (
    <section className="view-picker" aria-labelledby="view-picker-title">
      <div>
        <p className="quest-eyebrow">Before you start</p>
        <h2 id="view-picker-title">How do you like to learn?</h2>
        <p>
          Every worked example can be shown in four ways, to better suit your preferred learning style.
        </p>
      </div>
      <div className="view-picker__options" role="group" aria-label="Preferred way to learn">
        {VIEW_MODES.map((mode) => (
          <button type="button" key={mode.id} className="view-picker__option" onClick={() => onChoose(mode.id)}>
            <strong>{mode.preferenceLabel}</strong>
            <span>{mode.description}</span>
          </button>
        ))}
      </div>
      <button type="button" className="quest-button" onClick={onSkip}>
        Decide later
      </button>
    </section>
  );
}

//switching from one view to the other
export function ViewSwitcher({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="view-switcher" role="group" aria-label="Choose how to see this example">
      {VIEW_MODES.map((item) => (
        <button
          type="button"
          key={item.id}
          className={`view-switcher__button${mode === item.id ? " is-active" : ""}`}
          aria-pressed={mode === item.id}
          title={item.description}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

//for the listening style
const speechSupported = () =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof window.SpeechSynthesisUtterance !== "undefined";

export function NarrationControls({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = speechSupported();

  //new step means the old narration is stale, also stop speaking when leaving the view
  useEffect(() => {
    setSpeaking(false);
    if (speechSupported()) window.speechSynthesis.cancel();
    return () => {
      if (speechSupported()) window.speechSynthesis.cancel();
    };
  }, [text]);

  function play() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return (
    <div className="narration">
      <div className="quest-actions">
        {supported ? (
          speaking ? (
            <button type="button" className="quest-button" onClick={stop}>
              Stop narration
            </button>
          ) : (
            <button type="button" className="quest-button quest-button--primary" onClick={play}>
              Play narration
            </button>
          )
        ) : (
          <p className="quest-hint-note">This browser cannot read aloud. The captions below say the same thing.</p>
        )}
      </div>
      <p className="narration__caption" aria-label="Captions">
        {text}
      </p>
    </div>
  );
}

//reading learning style

export function ReadView({
  graph,
  steps,
  currentStep,
  queue,
}: {
  graph: GraphModel;
  steps: BfsStep[];
  currentStep: number;
  queue?: VertexId[];
}) {
  const adjacency = getAdjacencyList(graph);
  const shown = currentStep >= 0 ? steps.slice(0, currentStep + 1) : [];
  const activeLine = currentStep >= 0 && steps[currentStep] ? pseudocodeLineFor(steps[currentStep], currentStep) : -1;

  return (
    <div className="read-view">
      <section aria-labelledby="read-adjacency">
        <h3 id="read-adjacency">The network as a list</h3>
        <ul className="read-view__list">
          {graph.vertices.map((vertex) => (
            <li key={vertex}>
              <strong>{vertex}</strong> {graph.directed ? "leads to" : "is connected to"} {listOrEmpty(adjacency[vertex] ?? [])}
            </li>
          ))}
        </ul>
      </section>

      {queue && (
        <p className="read-view__queue">
          <strong>Ticket line (front first):</strong> {listOrEmpty(queue)}
        </p>
      )}

      {currentStep >= 0 && (
        <>
          <section aria-labelledby="read-trace">
            <h3 id="read-trace">Step-by-step trace</h3>
            <div className="read-view__scroll">
              <table className="read-view__table">
                <caption className="sr-only">BFS steps so far</caption>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Action</th>
                    <th scope="col">Town</th>
                    <th scope="col">Queue after</th>
                    <th scope="col">Visited after</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((step, index) => (
                    <tr key={index} aria-current={index === currentStep ? "step" : undefined} className={index === currentStep ? "is-current" : ""}>
                      <td>{index + 1}</td>
                      <td>{step.action}</td>
                      <td>{step.vertex}</td>
                      <td>{listOrEmpty(step.queueAfter)}</td>
                      <td>{listOrEmpty(step.visitedAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="read-pseudocode">
            <h3 id="read-pseudocode">Pseudocode</h3>
            <pre className="read-view__code" aria-label="BFS pseudocode">
              {BFS_PSEUDOCODE.map((line, index) => (
                <span key={index} className={`read-view__line${index === activeLine ? " is-active" : ""}`}>
                  {line}
                  {"\n"}
                </span>
              ))}
            </pre>
            {activeLine >= 0 && <p className="quest-hint-note">Highlighted line: where the latest step happens.</p>}
          </section>
        </>
      )}
    </div>
  );
}

//visual, kinestetic learning style
export function TryItView({
  graph,
  steps,
  useTrace,
  title,
}: {
  graph: GraphModel;
  steps: BfsStep[];
  useTrace: boolean;
  title: string;
}) {
  return useTrace && steps.length > 0 ? (
    <RunItYourself graph={graph} steps={steps} title={title} />
  ) : (
    <ExploreNetwork graph={graph} title={title} />
  );
}

function RunItYourself({ graph, steps, title }: { graph: GraphModel; steps: BfsStep[]; title: string }) {
  const dequeues = dequeueIndices(steps);
  const [decisions, setDecisions] = useState(0);
  const [wrongInARow, setWrongInARow] = useState(0);
  const [message, setMessage] = useState("");

  const finished = decisions >= dequeues.length;
  const shownIndex = stepShownAfterDecisions(steps, decisions);
  const expected = finished ? null : steps[dequeues[decisions]].vertex;

  function choose(vertex: VertexId) {
    if (finished || expected === null) return;
    if (vertex === expected) {
      const next = decisions + 1;
      setDecisions(next);
      setWrongInARow(0);
      setMessage(
        next >= dequeues.length
          ? `Yes, ${vertex} was the last town in the queue. The run is complete.`
          : `Yes, ${vertex} is next. Everything that follows has played out. Which town is served next?`,
      );
    } else {
      const wrong = wrongInARow + 1;
      setWrongInARow(wrong);
      setMessage(
        wrong >= 2
          ? `Hint: a queue serves the town that has waited longest, which is ${expected}.`
          : `Not ${vertex}. Look at the queue: which town has been waiting longest?`,
      );
    }
  }

  function restart() {
    setDecisions(0);
    setWrongInARow(0);
    setMessage("");
  }

  return (
    <div className="try-view">
      <p className="try-view__prompt">
        {finished ? "You ran the whole search." : "Click the town the queue serves next."}
      </p>
      <GraphQueueView
        graph={graph}
        steps={steps}
        currentStep={shownIndex}
        title={title}
        readOnly
        onVertexClick={choose}
      />
      <p className="try-view__message" role="status">
        {message || "The first town is already in the queue. Which one is served first?"}
      </p>
      <div className="quest-actions">
        <button type="button" className="quest-button" onClick={restart} disabled={decisions === 0 && !message}>
          Start again
        </button>
        <span className="quest-step-count">
          {Math.min(decisions, dequeues.length)} of {dequeues.length} towns served
        </span>
      </div>
    </div>
  );
}

function ExploreNetwork({ graph, title }: { graph: GraphModel; title: string }) {
  const [selected, setSelected] = useState<VertexId | null>(null);
  const neighbours = selected ? getNeighbours(graph, selected) : [];

  return (
    <div className="try-view">
      <p className="try-view__prompt">Click any town to see its roads.</p>
      <GraphQueueView
        graph={graph}
        steps={[]}
        currentStep={-1}
        title={title}
        readOnly
        selectedVertex={selected}
        onVertexClick={setSelected}
      />
      <p className="try-view__message" role="status">
        {selected
          ? neighbours.length > 0
            ? `Town ${selected} ${graph.directed ? "has roads leading to" : "is connected to"}: ${neighbours.join(", ")}.`
            : `Town ${selected} has no roads leading out.`
          : "No town selected yet."}
      </p>
    </div>
  );
}
