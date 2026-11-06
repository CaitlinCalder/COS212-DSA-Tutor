import { SKILL_ORDER } from "./shared/types";

/**
 * Placeholder app shell. Part 5 (Mbusi) owns the real navigation, tree,
 * report, and lecturer view. This exists so the scaffold builds and runs.
 */
export function App() {
  return (
    <main>
      <h1>COS212 BFS Tutor</h1>
      <p>Skills: {SKILL_ORDER.join(", ")}</p>
    </main>
  );
}
