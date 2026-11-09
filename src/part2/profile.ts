//skill profile state machine. `confirmed` is only reachable via a re-check 
import type { SkillId, SkillProfile, SkillResult, SkillState } from "../shared/types";
import { SKILL_ORDER } from "../shared/types";

function cloneStates(states: Record<SkillId, SkillState>): Record<SkillId, SkillState> {
  const next = {} as Record<SkillId, SkillState>;
  for (const skill of SKILL_ORDER) next[skill] = states[skill];
  return next;
}

// mastered -> confirmed, not mastered -> missing, unassessed -> unknown. Pure.
export function buildDiagnosticProfile(results: SkillResult[]): SkillProfile {
  const bySkill = new Map<SkillId, SkillResult>();
  for (const r of results) bySkill.set(r.skill, r);

  const states = {} as Record<SkillId, SkillState>;
  for (const skill of SKILL_ORDER) {
    const r = bySkill.get(skill);
    states[skill] = r == null ? "unknown" : r.mastered ? "confirmed" : "missing";
  }

  return { states, diagnostic: results.map((r) => ({ ...r })), updatedAt: Date.now() };
}

//a finished quest moves a `missing` skill to `tentative`; anything else is left as-is
export function markQuestTentative(profile: SkillProfile, skill: SkillId): SkillProfile {
  const states = cloneStates(profile.states);
  if (states[skill] === "missing") states[skill] = "tentative";
  return { ...profile, states, updatedAt: Date.now() };
}

//re-check: tentative -> confirmed if mastered else missing; a mastered re-check also confirms a missing skill
export function applyRecheck(profile: SkillProfile, recheck: SkillResult[]): SkillProfile {
  const states = cloneStates(profile.states);
  for (const r of recheck) {
    const current = states[r.skill];
    if (current === "tentative") states[r.skill] = r.mastered ? "confirmed" : "missing";
    else if (current === "missing" && r.mastered) states[r.skill] = "confirmed";
  }
  return { ...profile, states, recheck: recheck.map((r) => ({ ...r })), updatedAt: Date.now() };
}

//a fresh profile: all six skills unknown.
export function freshProfile(): SkillProfile {
  const states = {} as Record<SkillId, SkillState>;
  for (const skill of SKILL_ORDER) states[skill] = "unknown";
  return { states, updatedAt: Date.now() };
}
