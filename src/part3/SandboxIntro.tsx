import { Lightbulb } from "lucide-react";

export type SandboxIntroMode = "build" | "explore";

/**
 * Orientation for a student who has never seen a graph: what the sandbox is for,
 * the three words they need, and a short guided tour of the starting network.
 * Collapsible so it never gets in the way once they know their way around.
 */
export default function SandboxIntro({ mode }: { mode: SandboxIntroMode }) {
  return (
    <details className="sandbox-intro" open>
      <summary>
        <Lightbulb size={16} aria-hidden="true" />
        What is this sandbox for?
      </summary>

      <div className="sandbox-intro-body">
        <p className="sandbox-intro-lead">
          This is a free play space. Nothing here is marked and there are no wrong moves. Use it to get a feel for
          what a graph is and how Breadth-First Search (BFS) explores one, before the lecture. The quests later on
          ask you to practise these same ideas.
        </p>

        <dl className="sandbox-intro-words" aria-label="Words to know">
          <div>
            <dt>Town</dt>
            <dd>a point on the map, this is a vertex.</dd>
          </div>
          <div>
            <dt>Road</dt>
            <dd>a line joining two towns, this is an edge.</dd>
          </div>
          <div>
            <dt>Queue</dt>
            <dd>a waiting line. The first town to join is the first to leave (first in, first out).</dd>
          </div>
        </dl>

        <div>
          <h3>Try these in order</h3>
          <ol className="sandbox-intro-tasks">
            <li>
              In <strong>Explore BFS</strong>, press <strong>Next Step</strong> a few times. Watch the queue on the right.
              Which town leaves first, and what joins the queue behind it?
            </li>
            <li>
              Keep stepping until you see <em>“Skipping town…”</em>. This map has a loop in it. Why would BFS skip a
              town it has already found?
            </li>
            <li>
              Open <strong>Shortest route</strong> and show the route from A to G. There are two ways to get there. Which
              one does BFS pick, and why?
            </li>
            <li>
              Switch to <strong>Build Network</strong> and add one road so that G is only 2 roads from A. Then come back
              to Explore BFS and check that you were right.
            </li>
          </ol>
        </div>

        <p className="sandbox-intro-mode">
          {mode === "explore"
            ? "You are in Explore BFS. Use the buttons above to switch to Build Network whenever you like."
            : "You are in Build Network. Use the buttons above to switch back to Explore BFS to see your map in action."}
        </p>
      </div>
    </details>
  );
}
