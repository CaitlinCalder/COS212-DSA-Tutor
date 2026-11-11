# Part 5 — App Shell, Slides-to-Video Prototype, Skill Tree, and Lecturer Dashboard

Part 5 is the top-level integration layer of the COS212 BFS Tutor. It assembles all previous parts into a coherent seven-step student journey, adds the slides-to-video generation prototype, presents the learner's skill profile and final report, and provides a simulated lecturer dashboard. Parts 1–4 are consumed as dependencies; their source files are not modified.

## What Part 5 adds

| Feature | Description |
|---|---|
| **App shell** | Persistent sidebar navigation, progress bar, and step routing across all seven steps. |
| **Step 1 — Slides-to-video prototype** | Learner uploads lecture slides; the UI simulates AI-driven generation and outputs the pre-bundled overview video. |
| **Step 2 — Sandbox** | Embeds the Part 3 Graph Sandbox for free-form graph exploration. |
| **Steps 3–6 — Diagnostic, Profile, Quests, Re-check** | Embeds Part 2 quiz logic and Part 4 quests, wired to a live skill profile. |
| **Step 7 — Report** | Displays a printable before-and-after learning summary. |
| **Lecturer dashboard** | A simulated class heatmap showing skill-level distributions across 18 fictional learners. |

---


## Slides-to-video prototype (Step 1)

### What the learner does

1. Drag PDF or PowerPoint files into the upload panel, or use **Choose slides** to browse. Multiple files are accepted; duplicates are ignored.
2. Click **Generate video →**. No additional upload is required.
3. The UI runs a two-stage simulation:
   - **Stage 1 — Analysing slides** (~2.2 s): simulates reading the slide deck and identifying key learning points.
   - **Stage 2 — Preparing video** (~2.2 s): simulates narration generation and video assembly.
4. Once complete, the bundled `graph_overview.mp4` appears as the generated output.

### How the video is supplied

The overview video (`graph_overview.mp4`) is bundled directly into the application as a static asset. It is imported at the top of `AppShell.tsx` using Vite's asset import mechanism:

```ts
import graphOverviewVideo from "./graph_overview.mp4";
```

Vite resolves this to a hashed asset URL at build time. No manual video upload is needed during the demo — clicking **Generate video →** is all that is required after slides have been added.

### What the prototype does not do

- It does not call NotebookLM or any external AI API.
- It does not analyse the uploaded slides or extract content from them.
- It does not generate a new video from the uploaded files.
- The generation stages are time-delayed UI transitions only.

The simulation exists to demonstrate the intended product flow to stakeholders. Replacing the two `window.setTimeout` calls in `generateDemoVideo` with real API requests would be the integration point for a production implementation.

---

## Skill profile and report

The skill profile (`SkillTree`) is a live view of the learner's six-skill state. It is updated after the diagnostic, after each quest completion, and after the re-check. The four possible states per skill are:

| State | Meaning |
|---|---|
| `unknown` | Not yet assessed. |
| `missing` | Identified as a gap by the diagnostic. |
| `tentative` | Quest completed; awaiting re-check confirmation. |
| `confirmed` | Confirmed by the re-check quiz. |

The final report (`StudentReport`) shows confirmed and practised skill counts, a full six-skill breakdown, and a before-and-after comparison between the diagnostic and re-check results. A **Print / Save as PDF** button is provided.

---

## Lecturer dashboard

The lecturer dashboard is a read-only demonstration view. It displays:

- A colour-coded heatmap of 18 fictional learners across all six skills.
- Per-skill class averages.
- An insight grid labelling each skill as Strong (≥ 75 %), Developing (60–74 %), or Needs attention (< 60 %).

All data is hard-coded in `SIMULATED_CLASS` inside `AppShell.tsx`. It is entirely fictional and is labelled as such in the UI. The dashboard is intended to show how a real cohort view could be built from live quiz and re-check data.

---

## Project files

| File | Purpose |
|---|---|
| `AppShell.tsx` | Seven-step shell, all embedded views, slides-to-video prototype, skill tree, report, and lecturer dashboard. |
| `AppShell.css` | Layout and styling for the shell, sidebar, panels, video workflow, heatmap, and report. |
| `graph_overview.mp4` | Pre-generated BFS overview video. Bundled as a static asset and used as the simulated generation output. |
| `README.md` | This file. |

---

## Integration with Parts 1–4

Part 5 wires all previous parts together without modifying their source files.

| Part | What Part 5 uses |
|---|---|
| **Part 1** | `diagnosticItems` for the diagnostic and re-check quiz item banks. |
| **Part 2** | `startJourney`, `runDiagnostic`, `runRecheck`, `getQuestPlan`, `recheckItemIds`, `completeQuest` for skill profile management. |
| **Part 3** | `GraphSandbox` component embedded in Step 2. |
| **Part 4** | `Quests` component embedded in Step 5, fed the plan from Part 2. |

The skill profile (`SkillProfile`) flows top-down through component props. Part 2 functions are called in response to quiz submissions and quest completions, and the returned profile replaces the previous state.

---

## Running and testing

From the repository root:

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run typecheck
```

Run Part 5-scoped checks:

```powershell
npx.cmd vitest run src/part5
npx.cmd tsc --noEmit
```

> **Windows PowerShell:** Use `npm.cmd` and `npx.cmd` instead of `npm` and `npx` if scripts are blocked.

---

## Software engineering notes

- `graph_overview.mp4` is imported as a Vite static asset, giving it a content-hashed URL in production. No server-side file serving or manual upload path is needed.
- The generation simulation uses two sequential `window.setTimeout` calls. Replacing these with `fetch` calls to a real generation API is the only change needed to make the prototype functional.
- Slide files are validated by extension (`.pdf`, `.ppt`, `.pptx`) and deduplicated by name and size before being added to state.
- The skill profile is immutable: each Part 2 function returns a new profile object rather than mutating the existing one.
- The lecturer dashboard data is entirely static and clearly labelled in the UI to prevent confusion with real learner data.
- All six skills and their display labels are driven by `SKILL_ORDER` and `SKILL_INFO`, sourced from the shared types layer, so adding or renaming skills propagates automatically.
