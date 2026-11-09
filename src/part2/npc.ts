//logic for the diagnosis->NPC diagnosis (Chiu & Douglas), classify by proximity to ideal response patterns
import type { QMatrix, SkillId } from "../shared/types";
import { SKILL_ORDER } from "../shared/types";

// All 2^6 = 64 mastery profiles over A1..A6, as 0/1 arrays in SKILL_ORDER column order.
function allProfiles(): number[][] {
  const n = SKILL_ORDER.length;
  const out: number[][] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    out.push(SKILL_ORDER.map((_, i) => (mask >> i) & 1));
  }
  return out;
}

//ideal response for a profile: an item is "correct" if the profile has every skill the item uses.
function idealResponses(profile: number[], qMatrix: QMatrix): Record<string, 0 | 1> {
  const has = (i: number) => profile[i] === 1;
  const ideal: Record<string, 0 | 1> = {};
  for (const row of qMatrix.rows) {
    const needed = SKILL_ORDER.map((s, i) => (row.requires[s] === 1 ? i : -1)).filter((i) => i >= 0);
    ideal[row.itemId] = needed.every(has) ? 1 : 0;
  }
  return ideal;
}

//classify: pick the profile whose ideal pattern is closest (fewest differing items) to the students
export function classify(
  qMatrix: QMatrix,
  correctness: Record<string, 0 | 1>,
): Record<SkillId, boolean> {
  let best: number[] | null = null;
  let bestDistance = Infinity;

  for (const profile of allProfiles()) {
    const ideal = idealResponses(profile, qMatrix);
    let distance = 0;
    for (const row of qMatrix.rows) {
      if (ideal[row.itemId] !== (correctness[row.itemId] ?? 0)) distance++;
    }
    //tie-break: prefer the simpler profile (fewer mastered skills)
    const mastered = profile.reduce((a, b) => a + b, 0);
    const bestMastered = best ? best.reduce((a, b) => a + b, 0) : Infinity;
    if (distance < bestDistance || (distance === bestDistance && mastered < bestMastered)) {
      best = profile;
      bestDistance = distance;
    }
  }

  const mastery = {} as Record<SkillId, boolean>;
  SKILL_ORDER.forEach((s, i) => (mastery[s] = best![i] === 1));
  return mastery;
}
