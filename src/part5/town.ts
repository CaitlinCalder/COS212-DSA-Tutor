import { getVisitOrder, runBfs } from "../part3/graphUtils";
import type { GraphModel, SkillId, SkillState } from "../shared/types";
import { SKILL_ORDER } from "../shared/types";
//building the profile as a town -matches the theme of the entire app where each skill is a building, its state is how built it is and the roads form a graph fro A1->A6

export interface BuildingInfo {
  skill: SkillId;
  building: string;
  district: string;
  x: number;
  y: number;
}

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 450;
export const DOOR_OFFSET = 14;

const TOP = 180;
const BOTTOM = 365;

export const BUILDINGS: Record<SkillId, BuildingInfo> = {
  A1: { skill: "A1", building: "Town hall", district: "Old Town", x: 105, y: BOTTOM },
  A2: { skill: "A2", building: "Registry office", district: "Registry Row", x: 255, y: TOP },
  A3: { skill: "A3", building: "Ticket office", district: "Station Square", x: 405, y: BOTTOM },
  A4: { skill: "A4", building: "Post office", district: "Message Mile", x: 555, y: TOP },
  A5: { skill: "A5", building: "Signal tower", district: "Signal Hill", x: 705, y: BOTTOM },
  A6: { skill: "A6", building: "Crossroads inn", district: "Crossroads", x: 850, y: TOP },
};

export const TOWN_GRAPH: GraphModel = {
  directed: false,
  vertices: [...SKILL_ORDER],
  edges: [
    //cross-town links, in learning order
    { from: "A1", to: "A2" },
    { from: "A2", to: "A3" },
    { from: "A3", to: "A4" },
    { from: "A4", to: "A5" },
    { from: "A5", to: "A6" },
    //upper street (sp that it isnt so one dimensional)
    { from: "A2", to: "A4" },
    { from: "A4", to: "A6" },
    //lower street.
    { from: "A1", to: "A3" },
    { from: "A3", to: "A5" },
  ],
};

//The order the lights come on: a breadth-first sweep outwards from the town hall
export function townVisitOrder(): SkillId[] {
  return getVisitOrder(runBfs(TOWN_GRAPH, "A1")) as SkillId[];
}

function roundedPath(points: [number, number][], radius = 14): string {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    const r = Math.min(radius, inLen / 2, outLen / 2);
    const ax = cx - ((cx - px) / inLen) * r;
    const ay = cy - ((cy - py) / inLen) * r;
    const bx = cx + ((nx - cx) / outLen) * r;
    const by = cy + ((ny - cy) / outLen) * r;
    d += ` L${ax} ${ay} Q${cx} ${cy} ${bx} ${by}`;
  }
  const last = points[points.length - 1];
  return `${d} L${last[0]} ${last[1]}`;
}

//path between two skills
export function roadPath(from: SkillId, to: SkillId): string {
  const a = BUILDINGS[from];
  const b = BUILDINGS[to];
  const ay = a.y + DOOR_OFFSET;
  const by = b.y + DOOR_OFFSET;
  if (ay === by) return `M${a.x} ${ay} L${b.x} ${by}`;
  const gap = (a.x + b.x) / 2;
  return roundedPath([
    [a.x, ay],
    [gap, ay],
    [gap, by],
    [b.x, by],
  ]);
}

export const isRoadLit = (states: Record<SkillId, SkillState>, from: SkillId, to: SkillId) =>
  states[from] === "confirmed" && states[to] === "confirmed";

//context for student
export const STATE_TEXT: Record<SkillState, { short: string; long: string }> = {
  unknown: { short: "Blueprint", long: "Still a blueprint. Complete the diagnostic to start construction." },
  missing: { short: "Under construction", long: "Under construction. A quest is how you build it up." },
  tentative: { short: "Built, awaiting re-check", long: "Built, but the lights are off until the re-check confirms it." },
  confirmed: { short: "Open, lights on", long: "Open for business. You have shown you understand this." },
};

const RANK: Record<SkillState, number> = { unknown: 0, missing: 1, tentative: 2, confirmed: 3 };

export interface TownSummary {
  open: number;
  builtDark: number;
  underConstruction: number;
  blueprints: number;
  headline: string;
  detail: string;
  nextUp: SkillId | null;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

//summary for student. Always encouraging: a building site is not a failure so a student who got everything wrong sees "every building site is ready", never "0 of 6"
export function summariseTown(states: Record<SkillId, SkillState>): TownSummary {
  const all = SKILL_ORDER.map((s) => states[s]);
  const count = (state: SkillState) => all.filter((s) => s === state).length;
  const open = count("confirmed");
  const builtDark = count("tentative");
  const underConstruction = count("missing");
  const blueprints = count("unknown");
  const nextUp = SKILL_ORDER.find((s) => states[s] === "missing") ?? null;

  let headline: string;
  let detail: string;
  if (blueprints === SKILL_ORDER.length) {
    headline = "Your town is still a blueprint";
    detail = "Complete the diagnostic and construction can begin.";
  } else if (open === SKILL_ORDER.length) {
    headline = "Your whole town is open";
    detail = "Every building has its lights on. You are ready for the lecture.";
  } else {
    headline =
      open > 0
        ? `${open} of ${SKILL_ORDER.length} buildings open`
        : builtDark > 0
          ? "Your buildings are going up"
          : "Every building site is ready";
    const parts: string[] = [];
    if (underConstruction > 0) parts.push(`${underConstruction} under construction`);
    if (builtDark > 0) parts.push(`${builtDark} built and waiting for the re-check`);
    if (blueprints > 0) parts.push(plural(blueprints, "still a blueprint", "still blueprints"));
    detail = `${parts.join(", ")}. `;
    if (underConstruction > 0) detail += "Quests are how you build these up.";
    else if (builtDark > 0) detail += "The re-check switches the lights on.";
  }
  return { open, builtDark, underConstruction, blueprints, headline, detail, nextUp };
}

//gap between student doing diagnostic and recheck quizzes
const SEEN_KEY = "cos212-tutor.town-seen";

export function loadSeenStates(): Record<SkillId, SkillState> | null {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    const out = {} as Record<SkillId, SkillState>;
    for (const skill of SKILL_ORDER) {
      const value = data[skill];
      if (value !== "unknown" && value !== "missing" && value !== "tentative" && value !== "confirmed") return null;
      out[skill] = value;
    }
    return out;
  } catch {
    return null;
  }
}

export function saveSeenStates(states: Record<SkillId, SkillState>): void {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(states));
  } catch {
    // Not persisted (private mode etc.); the town simply will not highlight changes next time.
  }
}

//skills that moved forward since the student last looked,never reports a step backwards
export function progressedSince(
  previous: Record<SkillId, SkillState> | null,
  current: Record<SkillId, SkillState>,
): SkillId[] {
  if (!previous) return [];
  return SKILL_ORDER.filter((s) => RANK[current[s]] > RANK[previous[s]]);
}
