import { useEffect, useMemo, useState } from "react";
import { findShortestRoute, getVisitOrder, runBfs } from "../part3/graphUtils";
import { SKILL_ORDER, type SkillId } from "../shared/types";
import GraphQueueView from "../part3/GraphQueueView";
import { getQuest } from "./questData";
import type { QuestChallenge, QuestCompletion, QuestPlan } from "./questTypes";
import {NarrationControls,ReadView,TryItView,ViewPreferencePicker,ViewSwitcher,} from "./RepresentationViews";
import {DEFAULT_VIEW_MODE,loadViewPreference,narrationFor,saveViewPreference,type ViewMode,} from "./representations";
import "./Quests.css";

type Stage = "watch" | "guided" | "independent" | "complete";

interface QuestSelection {
  id: string;
  skillId: SkillId;
  confidence: boolean;
}

export interface QuestsProps {
  questPlan?: QuestPlan;
  onQuestComplete?: (completion: QuestCompletion) => void;
}

const DEFAULT_PLAN: QuestPlan = { questSkills: [...SKILL_ORDER] };
const STAGES: { id: Exclude<Stage, "complete">; label: string }[] = [
  { id: "watch", label: "Watch one" },
  { id: "guided", label: "Try one with help" },
  { id: "independent", label: "Do one alone" },
];

function makeSelections(plan: QuestPlan): QuestSelection[] {
  const selections: QuestSelection[] = [];

  if (plan.confidenceSkill) {
    selections.push({
      id: `${plan.confidenceSkill}-confidence`,
      skillId: plan.confidenceSkill,
      confidence: true,
    });
  }

  const allowed = new Set(plan.questSkills);
  SKILL_ORDER.filter((skillId) => allowed.has(skillId)).forEach((skillId) => {
    selections.push({ id: `${skillId}-quest`, skillId, confidence: false });
  });

  return selections;
}

function ChallengePanel({
  challenge,
  selectedAnswer,
  onSelect,
  onSubmit,
  hintsShown,
  onHint,
  feedback,
  canContinue,
  onContinue,
  continueLabel,
}: {
  challenge: QuestChallenge;
  selectedAnswer: string;
  onSelect: (answer: string) => void;
  onSubmit: () => void;
  hintsShown: number;
  onHint: () => void;
  feedback: { correct: boolean; message: string } | null;
  canContinue: boolean;
  onContinue: () => void;
  continueLabel: string;
}) {
  return (
    <section className="quest-card" aria-labelledby="challenge-prompt">
      <p className="quest-eyebrow">Your decision</p>
      <h3 id="challenge-prompt">{challenge.prompt}</h3>
      <div className="quest-options" role="group" aria-label="Answer choices">
        {challenge.options.map((option) => (
          <button
            className={`quest-option${selectedAnswer === option ? " is-selected" : ""}`}
            type="button"
            key={option}
            aria-pressed={selectedAnswer === option}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {feedback && (
        <div className={`quest-feedback${feedback.correct ? " is-correct" : " is-incorrect"}`} role="status">
          <strong>{feedback.correct ? "That’s it." : "Replay this step."}</strong>
          <p>{feedback.message}</p>
        </div>
      )}
      <div className="quest-actions">
        {!feedback?.correct && (
          <button type="button" className="quest-button quest-button--primary" disabled={!selectedAnswer} onClick={onSubmit}>
            Check answer
          </button>
        )}
        {!canContinue && hintsShown < challenge.hints.length && (
          <button type="button" className="quest-button" onClick={onHint}>
            Show hint {hintsShown + 1}
          </button>
        )}
        {canContinue && (
          <button type="button" className="quest-button quest-button--primary" onClick={onContinue}>
            {continueLabel}
          </button>
        )}
      </div>
      {hintsShown > 0 && (
        <ol className="quest-hints" aria-label="Hints">
          {challenge.hints.slice(0, hintsShown).map((hint, index) => (
            <li key={index}><span>Hint {index + 1}</span>{hint}</li>
          ))}
        </ol>
      )}
      <p className="quest-hint-note">Hints are always free. Use as many as you need.</p>
    </section>
  );
}

export default function Quests({ questPlan = DEFAULT_PLAN, onQuestComplete }: QuestsProps) {
  const selections = useMemo(() => makeSelections(questPlan), [questPlan]);
  const firstSelection = selections[0];
  const [selectedId, setSelectedId] = useState(firstSelection?.id ?? "");
  const [stage, setStage] = useState<Stage>("watch");
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [hintsShown, setHintsShown] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [independentSubmitted, setIndependentSubmitted] = useState(false);
  const [replayStep, setReplayStep] = useState(0);
  const [guidedReplayStep, setGuidedReplayStep] = useState(0);
  const [variantIndices, setVariantIndices] = useState<Record<string, number>>({});
  const [completedSkills, setCompletedSkills] = useState<Set<SkillId>>(() => new Set());
  const [storedPreference] = useState(() => loadViewPreference());
  const [viewMode, setViewMode] = useState<ViewMode>(storedPreference ?? DEFAULT_VIEW_MODE);
  const [preferenceAnswered, setPreferenceAnswered] = useState(storedPreference !== null);

  function chooseViewMode(mode: ViewMode) {
    setViewMode(mode);
    saveViewPreference(mode);
    setPreferenceAnswered(true);
  }

  const selection = selections.find((item) => item.id === selectedId) ?? firstSelection;
  const quest = selection ? getQuest(selection.skillId) : null;
  const variantIndex = selection ? (variantIndices[selection.id] ?? 0) : 0;
  const currentVariant = quest?.variants[variantIndex % (quest?.variants.length ?? 1)];
  const walkthrough = selection?.confidence
    ? currentVariant?.walkthrough.slice(0, 1) ?? []
    : currentVariant?.walkthrough ?? [];
  const challenge = stage === "guided" ? currentVariant?.guided : currentVariant?.independent;
  const bfsSteps = currentVariant ? runBfs(currentVariant.graph, currentVariant.start) : [];
  const visitOrder = getVisitOrder(bfsSteps);
  const getHighlightedRoute = (task: QuestChallenge) => {
    if (task.routeDestination && currentVariant) {
      return findShortestRoute(
        currentVariant.graph,
        currentVariant.start,
        task.routeDestination,
      ).path;
    }

    return task.highlightedRoute ?? [];
  };
  const showBfsTrace = selection
    ? ["A4", "A5", "A6"].includes(selection.skillId)
    : false;

  useEffect(() => {
    if (!selections.some((item) => item.id === selectedId)) {
      setSelectedId(selections[0]?.id ?? "");
      resetQuest();
    }
  }, [selectedId, selections]);

  function resetQuest() {
    setStage("watch");
    setWalkthroughStep(0);
    setSelectedAnswer("");
    setHintsShown(0);
    setFeedback(null);
    setIndependentSubmitted(false);
    setReplayStep(0);
    setGuidedReplayStep(0);
  }

  function selectQuest(id: string) {
    setSelectedId(id);
    resetQuest();
  }

  function beginStage(nextStage: Stage) {
    setStage(nextStage);
    setSelectedAnswer("");
    setHintsShown(0);
    setFeedback(null);
    setIndependentSubmitted(false);
    setReplayStep(0);
    setGuidedReplayStep(0);
  }

  function submitGuided() {
    if (!challenge || !selectedAnswer) return;
    const correct = selectedAnswer === challenge.answer;
    setFeedback({
      correct,
      message: correct
        ? challenge.explanation
        : `At this decision, ${challenge.explanation}`,
    });
    if (!correct) {
      setGuidedReplayStep(
        Math.min(
          bfsSteps.length - 1,
          challenge.feedbackReplayStep ?? bfsSteps.length - 1,
        ),
      );
    }
  }

  function submitIndependent() {
    if (!challenge || !selectedAnswer) return;
    const correct = selectedAnswer === challenge.answer;
    setFeedback({
      correct,
      message: correct
        ? challenge.explanation
        : `Your prediction was different. The trace shows: ${challenge.explanation}`,
    });
    setIndependentSubmitted(true);
    setReplayStep(Math.max(0, bfsSteps.length - 1));
  }

  function finishQuest() {
    if (!selection || !currentVariant) return;
    const completion: QuestCompletion = {
      skillId: selection.skillId,
      variantId: currentVariant.id,
      confidence: selection.confidence,
    };
    setCompletedSkills((previous) => new Set(previous).add(selection.skillId));
    onQuestComplete?.(completion);
    beginStage("complete");
  }

  function retryWithFreshVariant() {
    if (!selection || !quest) return;
    setVariantIndices((previous) => ({
      ...previous,
      [selection.id]: ((previous[selection.id] ?? 0) + 1) % quest.variants.length,
    }));
    resetQuest();
  }

  if (!selection || !quest || !currentVariant) {
    return (
      <main className="quests-page">
        <h1>Your quests</h1>
        <p>There are no quests in your current learning plan.</p>
      </main>
    );
  }

  const exampleStepIndex = Math.min(
    bfsSteps.length - 1,
    Math.floor((walkthroughStep / Math.max(1, walkthrough.length - 1)) * (bfsSteps.length - 1)),
  );
  const activeChallenge = stage === "guided" || stage === "independent" ? challenge : undefined;

  return (
    <main className="quests-page">
      <header className="quests-header">
        <div>
          <p className="quest-eyebrow">Restore the town network</p>
          <h1>Your quests</h1>
          <p>Practise one skill at a time. Choose any available district, and take hints whenever you need them.</p>
        </div>
        <aside className="quest-progress" aria-live="polite">
          <strong>{completedSkills.size} skills practised</strong>
          <span>Quest progress is tentative until your re-check.</span>
        </aside>
      </header>

      {!preferenceAnswered && (
        <ViewPreferencePicker onChoose={chooseViewMode} onSkip={() => setPreferenceAnswered(true)} />
      )}

      <nav className="quest-picker" aria-label="Choose a quest">
        {selections.map((item) => {
          const itemQuest = getQuest(item.skillId);
          const done = completedSkills.has(item.skillId);
          return (
            <button
              type="button"
              key={item.id}
              className={`quest-picker__item${selectedId === item.id ? " is-active" : ""}`}
              aria-current={selectedId === item.id ? "step" : undefined}
              onClick={() => selectQuest(item.id)}
            >
              <span className="quest-picker__skill">{item.skillId}{done ? " · Practised" : ""}</span>
              <strong>{item.confidence ? "Confidence quest" : itemQuest.title}</strong>
              <span>{itemQuest.district}</span>
            </button>
          );
        })}
      </nav>

      <section className="quest-workspace">
        <div className="quest-main">
          <div className="quest-title-row">
            <div>
              <p className="quest-eyebrow">{selection.confidence ? "Easy win" : selection.skillId} · {quest.district}</p>
              <h2>{quest.title}</h2>
              <p>{quest.learningGoal}</p>
            </div>
            <span className="quest-variant">Scenario {variantIndex + 1} of {quest.variants.length}</span>
          </div>

          <ol className="quest-stage-list" aria-label="Quest stages">
            {STAGES.map((item, index) => {
              const isActive = stage === item.id;
              const isDone = STAGES.findIndex((stageItem) => stageItem.id === stage) > index || stage === "complete";
              return (
                <li key={item.id} className={isActive ? "is-active" : isDone ? "is-done" : ""}>
                  <span>{index + 1}</span>{item.label}
                </li>
              );
            })}
          </ol>

          {stage === "watch" && (
            <section className="quest-card">
              <p className="quest-eyebrow">Worked example · {walkthroughStep + 1} of {walkthrough.length}</p>
              <h3>Watch the decision, then try it yourself.</h3>
              <ViewSwitcher mode={viewMode} onChange={chooseViewMode} />
              <p className="quest-walkthrough" aria-live="polite">{walkthrough[walkthroughStep]}</p>
              {(viewMode === "see" || viewMode === "hear") && (
                <>
                  {viewMode === "hear" && (
                    <NarrationControls
                      text={narrationFor(
                        walkthrough[walkthroughStep] ?? "",
                        showBfsTrace ? bfsSteps[exampleStepIndex] : undefined,
                      )}
                    />
                  )}
                  <GraphQueueView
                    graph={currentVariant.graph}
                    steps={showBfsTrace ? bfsSteps : []}
                    currentStep={showBfsTrace ? exampleStepIndex : -1}
                    title={`${quest.district} network`}
                    readOnly
                    highlightedRoute={getHighlightedRoute(currentVariant.guided)}
                    queue={quest.skillId === "A3" ? currentVariant.guided.queue : undefined}
                  />
                </>
              )}
              {viewMode === "read" && (
                <ReadView
                  graph={currentVariant.graph}
                  steps={bfsSteps}
                  currentStep={showBfsTrace ? exampleStepIndex : -1}
                  queue={quest.skillId === "A3" ? currentVariant.guided.queue : undefined}
                />
              )}
              {viewMode === "do" && (
                <TryItView
                  key={`${selection.id}-${currentVariant.id}`}
                  graph={currentVariant.graph}
                  steps={bfsSteps}
                  useTrace={showBfsTrace}
                  title={`${quest.district} network`}
                />
              )}
              <div className="quest-actions">
                {walkthroughStep < walkthrough.length - 1 ? (
                  <button className="quest-button quest-button--primary" type="button" onClick={() => setWalkthroughStep((step) => step + 1)}>
                    Next example step
                  </button>
                ) : (
                  <button className="quest-button quest-button--primary" type="button" onClick={() => beginStage("guided")}>
                    Start guided practice
                  </button>
                )}
              </div>
            </section>
          )}

          {stage === "guided" && activeChallenge && (
            <>
              <ChallengePanel
                challenge={activeChallenge}
                selectedAnswer={selectedAnswer}
                onSelect={(answer) => { setSelectedAnswer(answer); setFeedback(null); }}
                onSubmit={submitGuided}
                hintsShown={hintsShown}
                onHint={() => setHintsShown((count) => Math.min(count + 1, activeChallenge.hints.length))}
                feedback={feedback}
                canContinue={feedback?.correct === true}
                onContinue={() => beginStage("independent")}
                continueLabel="Make your own prediction"
              />
              {feedback && !feedback.correct && showBfsTrace && (
                <section className="quest-card" aria-label="Replay the relevant BFS step">
                  <p className="quest-eyebrow">Trace replay</p>
                  <p>
                    Compare the decision with the BFS step for town{" "}
                    <strong>{bfsSteps[guidedReplayStep]?.vertex}</strong>:{" "}
                    <strong>{bfsSteps[guidedReplayStep]?.action}</strong>.
                  </p>
                  <GraphQueueView
                    graph={currentVariant.graph}
                    steps={bfsSteps}
                    currentStep={guidedReplayStep}
                    title="Where the trace decision happens"
                    readOnly
                  />
                  <div className="quest-actions">
                    <button className="quest-button" type="button" disabled={guidedReplayStep <= 0} onClick={() => setGuidedReplayStep((step) => Math.max(0, step - 1))}>
                      Previous BFS step
                    </button>
                    <span className="quest-step-count">Step {guidedReplayStep + 1} of {bfsSteps.length}</span>
                    <button className="quest-button" type="button" disabled={guidedReplayStep >= bfsSteps.length - 1} onClick={() => setGuidedReplayStep((step) => Math.min(bfsSteps.length - 1, step + 1))}>
                      Next BFS step
                    </button>
                  </div>
                </section>
              )}
            </>
          )}

          {stage === "independent" && activeChallenge && (
            <section className="quest-card" aria-labelledby="independent-prompt">
              <p className="quest-eyebrow">Your turn · answer first, then compare</p>
              <h3 id="independent-prompt">{activeChallenge.prompt}</h3>
              {!independentSubmitted ? (
                <>
                  <div className="quest-options" role="group" aria-label="Prediction choices">
                    {activeChallenge.options.map((option) => (
                      <button
                        className={`quest-option${selectedAnswer === option ? " is-selected" : ""}`}
                        type="button"
                        key={option}
                        aria-pressed={selectedAnswer === option}
                        onClick={() => { setSelectedAnswer(option); setFeedback(null); }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <div className="quest-actions">
                    <button className="quest-button quest-button--primary" type="button" disabled={!selectedAnswer} onClick={submitIndependent}>
                      {showBfsTrace ? "Lock prediction and run" : "Lock answer and compare"}
                    </button>
                    {hintsShown < activeChallenge.hints.length && (
                      <button className="quest-button" type="button" onClick={() => setHintsShown((count) => Math.min(count + 1, activeChallenge.hints.length))}>
                        Show hint {hintsShown + 1}
                      </button>
                    )}
                  </div>
                  {hintsShown > 0 && (
                    <ol className="quest-hints" aria-label="Hints">
                      {activeChallenge.hints.slice(0, hintsShown).map((hint, index) => (
                        <li key={index}><span>Hint {index + 1}</span>{hint}</li>
                      ))}
                    </ol>
                  )}
                  <p className="quest-hint-note">Hints are always free. Use as many as you need.</p>
                </>
              ) : (
                <>
                  <div className={`quest-feedback${feedback?.correct ? " is-correct" : " is-incorrect"}`} role="status">
                    <strong>{feedback?.correct ? "Prediction matched." : "Compare your prediction with the run."}</strong>
                    <p>{feedback?.message}</p>
                    <p><b>Your prediction:</b> {selectedAnswer}</p>
                    <p><b>Correct answer:</b> {activeChallenge.answer}</p>
                    {quest.skillId === "A5" && <p><b>BFS visit order:</b> {visitOrder.join(" → ")}</p>}
                  </div>
                  <GraphQueueView
                    graph={currentVariant.graph}
                    steps={showBfsTrace ? bfsSteps : []}
                    currentStep={showBfsTrace ? replayStep : -1}
                    queue={quest.skillId === "A3" ? activeChallenge.queue : undefined}
                    highlightedRoute={getHighlightedRoute(activeChallenge)}
                    title={showBfsTrace ? "Replay the run" : quest.skillId === "A3" ? "Ticket line after your decision" : "Compare the network"}
                    readOnly
                  />
                  <div className="quest-actions">
                    {showBfsTrace && (
                      <>
                        <button className="quest-button" type="button" disabled={replayStep <= 0} onClick={() => setReplayStep((step) => Math.max(0, step - 1))}>
                          Previous BFS step
                        </button>
                        <span className="quest-step-count">Step {Math.min(replayStep + 1, bfsSteps.length)} of {bfsSteps.length}</span>
                        <button className="quest-button" type="button" disabled={replayStep >= bfsSteps.length - 1} onClick={() => setReplayStep((step) => Math.min(bfsSteps.length - 1, step + 1))}>
                          Next BFS step
                        </button>
                      </>
                    )}
                    <button className="quest-button quest-button--primary" type="button" onClick={finishQuest}>
                      Finish quest
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {stage === "complete" && (
            <section className="quest-card quest-complete" role="status">
              <p className="quest-eyebrow">Skill practised · progress is tentative</p>
              <h3>You can now practise: {quest.learningGoal.toLowerCase()}</h3>
              <p>Your quest completion is ready for the profile/re-check integration. The re-check confirms whether this skill branch becomes solid.</p>
              <div className="quest-actions">
                <button className="quest-button quest-button--primary" type="button" onClick={retryWithFreshVariant}>
                  Try a fresh scenario
                </button>
                <button className="quest-button" type="button" onClick={() => selectQuest(selections.find((item) => item.id !== selection.id)?.id ?? selection.id)}>
                  Choose another quest
                </button>
              </div>
            </section>
          )}
        </div>

        <aside className="quest-side">
          <div className="quest-card">
            <p className="quest-eyebrow">Today’s skill</p>
            <h3>{selection.skillId}: {quest.title}</h3>
            <p>{quest.learningGoal}</p>
            <p className="quest-side__note">No points or penalties. The goal is to understand the reasoning, not to rush.</p>
          </div>
          <div className="quest-card quest-side__rules">
            <p className="quest-eyebrow">How a quest works</p>
            <ul>
              <li>Watch a worked example.</li>
              <li>Try a decision with immediate feedback.</li>
              <li>Predict first, then compare with the run.</li>
              <li>Retry with a different curated scenario.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
