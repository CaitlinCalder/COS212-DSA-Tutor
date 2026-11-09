# Part 4 — Quests

Part 4 turns the skills a learner still needs to practise into short, interactive activities in the town network. The quests teach by asking the learner to make the decisions involved in graph work and breadth-first search (BFS), rather than by awarding points or streaks.

The experience is implemented in `Quests.tsx`. It can be rendered on its own while the app shell is being developed; Part 5 owns adding it to the full student journey.

## What a learner does

Each quest follows the same three stages:

1. **Watch one:** read a short worked example. The network view shows the graph, and steps through BFS where that is the skill being practised.
2. **Try one with help:** choose an answer, get immediate explanatory feedback, and use up to three hints. A wrong BFS answer replays the relevant trace step; other wrong answers explain the relevant reasoning so the learner can try again.
3. **Do one alone:** choose an answer before comparing with the result. For BFS tasks, the learner can step through the trace.

The learner can choose among the quests in their plan. There are no points, penalties, or time limits. Completing a quest marks that skill as practised (tentative); the re-check quiz, not quest completion, confirms mastery.

## The six quests

| Skill | Quest | What it practises |
|---|---|---|
| A1 | Map the town | Vertices, edges, neighbours, and directed roads |
| A2 | Read the registry | Direct neighbours and adjacency-list meaning |
| A3 | The ticket line | First-in, first-out queue behaviour |
| A4 | The messenger | Enqueue, dequeue, visit, and mark discovered |
| A5 | Predict the spread | Predict and compare BFS visit order |
| A6 | Fewest hops | Fewest-edge routes and avoiding duplicate visits in cycles |

Part 2 supplies the skill plan. Quests are offered in A1-to-A6 prerequisite order, while the learner can choose among the offered skills. If the plan includes an already-mastered confidence skill, its confidence quest is listed first.

## Scenarios and retrying

`questData.ts` contains two hand-authored scenarios for each skill. The scenarios keep the same learning goal while changing the graph, question, or decision. Selecting **Try a fresh scenario** moves to the next curated variant instead of repeating the same graph immediately. After all authored variants have been used, retrying cycles back to the first one.

Curated variants keep the tasks instructionally checked: a generated graph cannot accidentally change the intended difficulty, answer, or skill being assessed.

## Reuse of Part 3

Quests use Part 3's `GraphQueueView` to show networks, queues, vertex states, routes, and BFS playback. They use `runBfs` and `getVisitOrder` from `graphUtils.ts` for worked examples and trace comparison. Quest-specific answers, progress, and screen state stay in Part 4; the Sandbox's editing state is not reused.

## Component and Part 2 handoff

Render the quest experience with a plan and an optional completion callback:

```tsx
import Quests from "./part4/Quests";
import type { QuestCompletion, QuestPlan } from "./part4/questTypes";

const plan: QuestPlan = {
  questSkills: ["A2", "A4", "A5"],
  confidenceSkill: "A1",
};

function StudentQuests() {
  function handleCompletion(completion: QuestCompletion) {
    // Part 2 can connect this event to its tentative skill-profile update.
    console.log(completion.skillId, completion.variantId, completion.confidence);
  }

  return <Quests questPlan={plan} onQuestComplete={handleCompletion} />;
}
```

`QuestPlan` and `QuestCompletion` intentionally live in `questTypes.ts` for now. `questSkills` is the set Part 2 wants the learner to practise; `confidenceSkill` is optional and appears first when provided. `onQuestComplete` emits the skill, curated variant ID, and whether the quest was the confidence activity. The callback is the integration boundary for Part 2 to connect to `markQuestTentative` (or its confirmed equivalent). The app does not claim that a quest alone confirms mastery.

If `questPlan` is omitted, the component offers A1-A6. An empty `questSkills` list and no confidence skill displays an empty-plan message.

## Project files

| File | Purpose |
|---|---|
| `Quests.tsx` | Quest picker, three-stage experience, hints, feedback, retry rotation, and completion event |
| `Quests.css` | Responsive quest layout and accessible interaction states |
| `questTypes.ts` | Part 4-local plan, challenge, variant, and completion types |
| `questData.ts` | Six skill templates and curated graph/task scenarios |
| `Quests.test.tsx` | Component flow, plan filtering, confidence ordering, and completion tests |
| `questData.test.ts` | Skill coverage, distinct variants, and authored-answer checks |

## Running and testing

From the repository root:

```powershell
npm.cmd run dev
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Run the Part 4 tests only:

```powershell
npx.cmd vitest run src/part4
```

## Software engineering notes

- Quest definitions and UI logic are separate: `questData.ts` supplies typed content, while `Quests.tsx` handles stage transitions and interactions.
- Graphs and BFS algorithms are reused from Part 3 instead of being reimplemented.
- Part 2 integration is a small callback and local type contract, avoiding a dependency on Part 2's internal state.
- Tests check all six skills, multiple distinct variants per skill, valid answer keys, the full learner flow, and empty/restricted plans.

## Instructional design notes

- Each activity targets one of the shared A1-A6 learning skills.
- The example, supported practice, and independent prediction move from modelling to scaffolded practice to retrieval and self-comparison.
- Hints are progressive and unpenalised. Explanations identify why an answer is right or wrong; retries preserve the target skill while changing the scenario.
- Quest completion is explicitly tentative. The re-check quiz is the evidence used to confirm learning.
