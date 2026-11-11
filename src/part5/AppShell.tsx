import { useMemo, useState } from "react";
import graphOverviewVideo from "./graph_overview.mp4";
import GraphSandbox from "../part3/GraphSandbox";
import GraphQueueView from "../part3/GraphQueueView";
import { quizGraphLayout } from "../part1/graphs";
import Quests from "../part4/Quests";
import { diagnosticItems, recheckItems } from "../part1/content";
import {
  completeQuest,
  getQuestPlan,
  recheckItemIds,
  runDiagnostic,
  runRecheck,
  startJourney,
} from "../part2/journey";
import type { QuizResponse, SkillId, SkillProfile, SkillState } from "../shared/types";
import { SKILL_ORDER } from "../shared/types";
import type { QuestCompletion } from "../part4/questTypes";
import "./AppShell.css";

type StepId = "video" | "sandbox" | "diagnostic" | "profile" | "quests" | "recheck" | "report";
type ViewId = StepId | "lecturer";

const STEPS: { id: StepId; number: string; title: string; subtitle: string }[] = [
  { id: "video", number: "01", title: "Overview video", subtitle: "Meet graphs and BFS" },
  { id: "sandbox", number: "02", title: "Sandbox", subtitle: "Explore a network" },
  { id: "diagnostic", number: "03", title: "Diagnostic", subtitle: "Find your starting point" },
  { id: "profile", number: "04", title: "Your profile", subtitle: "See your skill tree" },
  { id: "quests", number: "05", title: "Quests", subtitle: "Practise your skill gaps" },
  { id: "recheck", number: "06", title: "Re-check", subtitle: "Measure your growth" },
  { id: "report", number: "07", title: "Your report", subtitle: "Prepare for the lecture" },
];

const SKILL_INFO: Record<SkillId, { name: string; description: string }> = {
  A1: { name: "Graph vocabulary", description: "Vertices, edges, directed and undirected graphs, and neighbours." },
  A2: { name: "Adjacency lists", description: "Read an adjacency list and identify a vertex's neighbours." },
  A3: { name: "Queue behaviour", description: "Understand first in, first out (FIFO)." },
  A4: { name: "BFS procedure", description: "Enqueue, dequeue, visit neighbours, and mark visited." },
  A5: { name: "BFS visit order", description: "Trace BFS and determine the order in which vertices are visited." },
  A6: { name: "Applying BFS", description: "Find fewest-edge paths and explain how visited-marking prevents loops." },
};

const STATE_LABEL: Record<SkillState, string> = {
  unknown: "Not assessed",
  missing: "Needs practice",
  tentative: "Practised · awaiting re-check",
  confirmed: "Confirmed",
};

const SIMULATED_CLASS = [
  [82, 76, 71, 58, 49, 43], [91, 84, 78, 69, 61, 55], [64, 59, 72, 48, 44, 38],
  [75, 81, 67, 62, 51, 47], [88, 79, 83, 73, 66, 59], [57, 63, 54, 42, 35, 31],
  [93, 89, 86, 77, 72, 68], [71, 68, 61, 55, 46, 40], [84, 80, 75, 64, 58, 52],
  [62, 56, 65, 47, 39, 34], [79, 74, 70, 60, 53, 45], [90, 86, 81, 74, 69, 63],
  [68, 65, 58, 51, 43, 37], [86, 82, 77, 68, 60, 54], [73, 70, 64, 56, 48, 42],
  [95, 91, 88, 81, 76, 71], [59, 61, 57, 45, 38, 32], [81, 77, 73, 63, 55, 49],
];

function scoreLabel(value: number) {
  if (value >= 75) return "Strong";
  if (value >= 60) return "Developing";
  return "Needs attention";
}

function heatColor(value: number) {
  if (value >= 75) return "#b8e5d1";
  if (value >= 60) return "#f4e3a1";
  return "#f2b9b2";
}

function SkillTree({ profile }: { profile: SkillProfile }) {
  return (
    <div className="skill-tree" aria-label="Six-skill learning tree">
      {SKILL_ORDER.map((skill, index) => {
        const state = profile.states[skill];
        return (
          <div className={`tree-node tree-node--${state}`} key={skill}>
            <div className="tree-node__stem">{index === 0 ? "ROOT" : `LEVEL ${index + 1}`}</div>
            <div className="tree-node__circle">{state === "confirmed" ? "✓" : skill}</div>
            <strong>{SKILL_INFO[skill].name}</strong>
            <span>{STATE_LABEL[state]}</span>
          </div>
        );
      })}
    </div>
  );
}

function QuizPanel({
  title, description, items, onSubmit, submitLabel,
}: {
  title: string; description: string; items: typeof diagnosticItems;
  onSubmit: (responses: QuizResponse[]) => void; submitLabel: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = () => {
    onSubmit(items.map((item) => ({ itemId: item.id, selectedOptionId: answers[item.id] ?? null })));
    setSubmitted(true);
  };
  return (
    <section className="panel">
      <div className="section-heading">
        <div><p className="eyebrow">ASSESSMENT</p><h2>{title}</h2><p>{description}</p></div>
        <div className="stat-chip">{Object.keys(answers).length}/{items.length} answered</div>
      </div>
      {items.length === 0 ? (
        <div className="empty-state"><h3>No outstanding skill gaps</h3><p>Your current profile has no skills waiting for a re-check.</p></div>
      ) : (
        <>
          {items.map((item, index) => (
            <article className="question-card" key={item.id}>
              <div className="question-meta"><span>QUESTION {index + 1} OF {items.length}</span><span>{item.requires.join(" · ")}</span></div>
              <h3>{item.prompt}</h3>
              {item.graph && (
                <div className="question-graph">
                  <GraphQueueView
                    graph={item.graph}
                    title={item.graph.directed ? "Directed graph for this question" : "Graph for this question"}
                    initialPositions={quizGraphLayout(item.graph)}
                    showQueue={false}
                    showLegend={false}
                    readOnly
                  />
                </div>
              )}
              {item.adjacencyText && (
                <details className="adjacency-details" open>
                  <summary>Adjacency list (the same graph as text)</summary>
                  <pre className="adjacency">{item.adjacencyText}</pre>
                </details>
              )}
              <div className="answer-options">
                {item.options.map((option) => (
                  <label className={`answer-option${answers[item.id] === option.id ? " selected" : ""}`} key={option.id}>
                    <input type="radio" name={item.id} value={option.id} checked={answers[item.id] === option.id}
                      onChange={() => { setAnswers((previous) => ({ ...previous, [item.id]: option.id })); setSubmitted(false); }} />
                    <span>{option.text}</span>
                  </label>
                ))}
              </div>
            </article>
          ))}
          <div className="action-row">
            <button className="primary-button" onClick={handleSubmit} disabled={items.some((item) => !answers[item.id])}>{submitLabel}</button>
            {submitted && <span className="success-note">Your responses have been saved to this session.</span>}
          </div>
        </>
      )}
    </section>
  );
}

function StudentReport({ profile, before, after }: { profile: SkillProfile; before: SkillProfile | null; after: SkillProfile | null }) {
  const confirmed = SKILL_ORDER.filter((skill) => profile.states[skill] === "confirmed").length;
  const practised = SKILL_ORDER.filter((skill) => profile.states[skill] === "tentative").length;
  return (
    <section className="panel report-panel">
      <div className="report-top"><div><p className="eyebrow">YOUR LEARNING SUMMARY</p><h2>Ready for your lecture</h2><p>This report summarises your current understanding of graphs and breadth-first search.</p></div><div className="report-mark">COS<br/>212</div></div>
      <div className="report-stats">
        <div><strong>{confirmed}/6</strong><span>Skills confirmed</span></div>
        <div><strong>{practised}/6</strong><span>Practised, awaiting re-check</span></div>
        <div><strong>{SKILL_ORDER.filter((s) => profile.states[s] === "missing").length}</strong><span>Skills needing practice</span></div>
      </div>
      <h3>Your six-skill profile</h3>
      <div className="report-skills">
        {SKILL_ORDER.map((skill) => <div className="report-skill" key={skill}><div><strong>{skill} · {SKILL_INFO[skill].name}</strong><span>{STATE_LABEL[profile.states[skill]]}</span></div><p>{SKILL_INFO[skill].description}</p></div>)}
      </div>
      <div className="report-comparison">
        <div><h3>Before and after</h3><p>Diagnostic and re-check results from this session.</p></div>
        <div className="comparison-values"><span>Initial confirmed: <b>{before ? SKILL_ORDER.filter((s) => before.states[s] === "confirmed").length : "—"}/6</b></span><span>After re-check: <b>{after ? SKILL_ORDER.filter((s) => after.states[s] === "confirmed").length : "—"}/6</b></span></div>
      </div>
      <div className="report-footer"><span>Generated by COS212 BFS Tutor</span><button className="primary-button" onClick={() => window.print()}>Print / Save as PDF</button></div>
    </section>
  );
}

function LecturerDashboard() {
  const averages = SKILL_ORDER.map((_, column) => Math.round(SIMULATED_CLASS.reduce((sum, row) => sum + row[column], 0) / SIMULATED_CLASS.length));
  return (
    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">LECTURER VIEW</p><h2>Class skill heatmap</h2><p>Use the class pattern to identify where lecture time may be most useful.</p></div><span className="simulated-badge">SIMULATED CLASS DATA · DEMO ONLY</span></div>
      <div className="legend"><span><i style={{ background: "#b8e5d1" }}/> Strong · 75–100%</span><span><i style={{ background: "#f4e3a1" }}/> Developing · 60–74%</span><span><i style={{ background: "#f2b9b2" }}/> Needs attention · below 60%</span></div>
      <div className="heatmap-wrap"><table className="heatmap"><thead><tr><th>Student</th>{SKILL_ORDER.map((s) => <th key={s}>{s}</th>)}</tr></thead><tbody>{SIMULATED_CLASS.map((row, index) => <tr key={index}><th>Demo learner {String(index + 1).padStart(2, "0")}</th>{row.map((value, col) => <td key={col} style={{ background: heatColor(value) }}>{value}%</td>)}</tr>)}</tbody><tfoot><tr><th>Class average</th>{averages.map((value, index) => <td key={index}>{value}%</td>)}</tr></tfoot></table></div>
      <div className="insight-grid">{averages.map((average, index) => <article className="insight-card" key={index}><span>{SKILL_ORDER[index]} · {SKILL_INFO[SKILL_ORDER[index]].name}</span><strong>{average}%</strong><small>{scoreLabel(average)}</small></article>)}</div>
      <p className="demo-disclaimer">This class is entirely fictional and seeded only to demonstrate the lecturer interface. It is not real student performance data.</p>
    </section>
  );
}

export default function AppShell() {
  const [active, setActive] = useState<ViewId>("video");
  const [profile, setProfile] = useState<SkillProfile>(() => startJourney());
  const [initialProfile, setInitialProfile] = useState<SkillProfile | null>(null);
  const [recheckProfile, setRecheckProfile] = useState<SkillProfile | null>(null);
  const [slideFiles, setSlideFiles] = useState<File[]>([]);
  const [draggingSlides, setDraggingSlides] = useState(false);
  const [generationStage, setGenerationStage] = useState<"idle" | "analysing" | "creating" | "ready">("idle");
  const [generationMessage, setGenerationMessage] = useState("");
  const questPlan = useMemo(() => getQuestPlan(profile), [profile]);
  const recheckIds = useMemo(() => new Set(recheckItemIds(profile)), [profile]);
  //re-check ids come from the re-check bank, so filter that bank 
  const recheckQuizItems = useMemo(() => recheckItems.filter((item) => recheckIds.has(item.id)), [recheckIds]);

  const currentIndex = STEPS.findIndex((step) => step.id === active);
  const progress = active === "lecturer" ? 100 : Math.max(0, ((currentIndex + 1) / STEPS.length) * 100);

  function addSlideFiles(files: FileList | File[]) {
    const accepted = Array.from(files).filter((file) => /\.(pdf|ppt|pptx)$/i.test(file.name));
    if (accepted.length) {
      setSlideFiles((current) => [...current, ...accepted.filter((file) => !current.some((existing) => existing.name === file.name && existing.size === file.size))]);
      setGenerationStage("idle");
      setGenerationMessage("");
    }
  }

  function generateDemoVideo() {
    if (!slideFiles.length) { setGenerationMessage("Add your lecture slides first."); return; }
    setGenerationStage("analysing");
    setGenerationMessage("Reading your slide deck and identifying the key learning points…");
    window.setTimeout(() => {
      setGenerationStage("creating");
      setGenerationMessage("Preparing the narrated lesson and assembling the video output…");
      window.setTimeout(() => {
        setGenerationStage("ready");
        setGenerationMessage("Your demo video is ready. The output below is the pre-generated NotebookLM video.");
      }, 2200);
    }, 2200);
  }

  function submitDiagnostic(responses: QuizResponse[]) {
    const next = runDiagnostic(responses);
    setProfile(next);
    setInitialProfile(next);
    setRecheckProfile(null);
    setActive("profile");
  }

  function handleQuestComplete(completion: QuestCompletion) {
    setProfile((current) => completeQuest(current, completion.skillId));
  }

  function submitRecheck(responses: QuizResponse[]) {
    if (!initialProfile) return;
    const next = runRecheck(profile, responses);
    setProfile(next);
    setRecheckProfile(next);
    setActive("report");
  }

  const activeStep = STEPS.find((step) => step.id === active);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon">BFS</div><div><strong>COS212 Tutor</strong><span>Restore the town network</span></div></div>
        <p className="nav-label">YOUR LEARNING JOURNEY</p>
        <nav className="step-nav" aria-label="Learning journey">
          {STEPS.map((step, index) => <button key={step.id} className={`step-link${active === step.id ? " active" : ""}`} onClick={() => setActive(step.id)}><span className="step-number">{step.number}</span><span className="step-copy"><strong>{step.title}</strong><small>{step.subtitle}</small></span>{index < currentIndex && <span className="step-check">✓</span>}</button>)}
        </nav>
        <div className="sidebar-bottom"><button className={`lecturer-link${active === "lecturer" ? " active" : ""}`} onClick={() => setActive("lecturer")}>▦ <span>Lecturer dashboard</span></button><div className="sidebar-note">Learn at your own pace.<br/>Hints are always free.</div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div><span className="topbar-kicker">DATA STRUCTURES & ALGORITHMS</span><strong>{active === "lecturer" ? "Lecturer dashboard" : activeStep?.title}</strong></div><div className="topbar-right"><span className="progress-label">{active === "lecturer" ? "DEMO CLASS" : `STEP ${currentIndex + 1} OF 7`}</span><div className="progress-track"><span style={{ width: `${progress}%` }}/></div></div></header>
        <div className="content-area">
          {active === "video" && <section className="embedded-section video-workflow"><div className="page-intro"><p className="eyebrow">STEP 01 · PREPARE</p><h1>Turn your lecture slides into a video</h1><p>Upload the slides you want to study. The prototype simulates the generation steps and shows the prepared overview video as the output.</p></div><div className="video-workflow-grid"><section className={`panel slide-dropzone${draggingSlides ? " is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDraggingSlides(true); }} onDragLeave={() => setDraggingSlides(false)} onDrop={(event) => { event.preventDefault(); setDraggingSlides(false); addSlideFiles(event.dataTransfer.files); }}><div className="drop-icon">⇧</div><h2>Upload your lecture slides</h2><p>Drag PDF or PowerPoint files here, or browse your computer.</p><label className="primary-button slide-browse">Choose slides<input type="file" accept=".pdf,.ppt,.pptx" multiple onChange={(event) => { if (event.target.files) addSlideFiles(event.target.files); event.target.value = ""; }}/></label>{slideFiles.length > 0 && <div className="slide-file-list"><strong>{slideFiles.length} slide file{slideFiles.length === 1 ? "" : "s"} added</strong>{slideFiles.map((file, index) => <div className="slide-file" key={`${file.name}-${index}`}><span>▤ {file.name}</span><button type="button" onClick={() => setSlideFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}>Remove</button></div>)}</div>}</section><section className="panel generation-panel"><p className="eyebrow">VIDEO OUTPUT</p><h2>Generate your learning video</h2><p>Upload your slides, then click Generate. The prototype simulates the generation process and outputs the prepared graph overview video.</p><button className="primary-button generate-button" onClick={generateDemoVideo} disabled={generationStage === "analysing" || generationStage === "creating"}>{generationStage === "analysing" || generationStage === "creating" ? "Generating video…" : generationStage === "ready" ? "Generate again" : "Generate video →"}</button>{generationStage !== "idle" && <div className="generation-status" aria-live="polite"><div className="generation-track"><span className={generationStage === "ready" ? "complete" : "working"}/></div><strong>{generationStage === "analysing" ? "1. Analysing slides" : generationStage === "creating" ? "2. Preparing video" : "3. Video ready"}</strong><p>{generationMessage}</p></div>}{generationMessage && generationStage === "idle" && <p className="generation-hint">{generationMessage}</p>}</section></div>{generationStage === "ready" && <section className="panel generated-output"><p className="eyebrow">GENERATED VIDEO · DEMO OUTPUT</p><h2>Your lesson is ready</h2><p>Slide analysis and generation are simulated in this prototype. The output is the prepared graph overview video.</p><video controls src={graphOverviewVideo}/></section>}<div className="video-workflow-footer"><button className="secondary-button" onClick={() => setActive("sandbox")}>Skip to sandbox →</button><span>Prototype workflow · no live NotebookLM API connection</span></div></section>}

          {active === "sandbox" && <section className="embedded-section"><div className="page-intro"><p className="eyebrow">STEP 02 · EXPLORE</p><h1>Play with a graph</h1><p>Add vertices and edges, then step through BFS and watch the queue change.</p></div><GraphSandbox/></section>}

          {active === "diagnostic" && <section className="embedded-section"><div className="page-intro"><p className="eyebrow">STEP 03 · MEASURE</p><h1>Find your starting point</h1><p>Answer the questions to identify which of the six skills you already understand and which need practice.</p></div><QuizPanel title="Diagnostic quiz" description="13 questions · six skills · no penalty for getting something wrong." items={diagnosticItems} submitLabel="Submit diagnostic" onSubmit={submitDiagnostic}/></section>}

          {active === "profile" && <section className="embedded-section"><div className="page-intro"><p className="eyebrow">STEP 04 · REFLECT</p><h1>Your skill tree</h1><p>Your branches show what you know, what needs practice, and what is waiting for confirmation.</p></div><div className="panel"><div className="section-heading"><div><h2>Six skills, one growing tree</h2><p>Quest completion makes a branch tentative. Only the re-check can confirm it.</p></div></div><SkillTree profile={profile}/><div className="tree-legend"><span>○ Not assessed</span><span>● Needs practice</span><span>◐ Tentative</span><span>✓ Confirmed</span></div><div className="action-row"><button className="primary-button" onClick={() => setActive("quests")}>Go to your quests →</button><button className="secondary-button" onClick={() => setActive("diagnostic")}>Retake diagnostic</button></div></div></section>}

          {active === "quests" && <section className="embedded-section"><div className="page-intro"><p className="eyebrow">STEP 05 · PRACTISE</p><h1>Restore the town network</h1><p>Choose a district and practise a skill that needs attention. Your progress stays tentative until the re-check.</p></div><Quests questPlan={questPlan} onQuestComplete={handleQuestComplete}/><div className="below-action"><button className="primary-button" onClick={() => setActive("recheck")}>Continue to re-check →</button></div></section>}

          {active === "recheck" && <section className="embedded-section"><div className="page-intro"><p className="eyebrow">STEP 06 · RE-MEASURE</p><h1>Check what has grown</h1><p>Revisit the skills you were still developing and see whether your understanding has changed.</p></div>{recheckQuizItems.length === 0 ? <section className="panel"><div className="empty-state"><h3>{initialProfile ? "Nothing left to re-check" : "Take the diagnostic first"}</h3><p>{initialProfile ? "None of your skills are waiting for a re-check, so there is nothing more to measure." : "The re-check only covers skills the diagnostic found you still need to practise, so it cannot start until you have taken the diagnostic."}</p><div className="action-row">{initialProfile ? <button className="primary-button" onClick={() => setActive("report")}>View report →</button> : <button className="primary-button" onClick={() => setActive("diagnostic")}>Go to the diagnostic →</button>}</div></div></section> : <><div className="notice-banner"><strong>New questions, fewer of them.</strong> These are different questions from the diagnostic, and they only cover the skills you are still developing. Skills you already showed you understand are not asked again.</div><QuizPanel title="Re-check quiz" description={`${recheckQuizItems.length} questions covering the skills you are still developing.`} items={recheckQuizItems} submitLabel="Submit re-check" onSubmit={submitRecheck}/></>}</section>}

          {active === "report" && <section className="embedded-section"><div className="page-intro"><p className="eyebrow">STEP 07 · CARRY FORWARD</p><h1>Your lecture-ready report</h1><p>A one-page summary of your current strengths and areas to revisit.</p></div><StudentReport profile={profile} before={initialProfile} after={recheckProfile}/></section>}

          {active === "lecturer" && <section className="embedded-section"><LecturerDashboard/></section>}
        </div>
        {active !== "lecturer" && <footer className="page-footer"><span>COS212 · Graphs & Breadth-First Search</span><div>{active !== "video" && <button className="text-button" onClick={() => setActive(STEPS[Math.max(0, currentIndex - 1)].id)}>← Previous</button>}{active !== "report" && <button className="text-button" onClick={() => setActive(STEPS[Math.min(6, currentIndex + 1)].id)}>Next step →</button>}</div></footer>}
      </main>
    </div>
  );
}
