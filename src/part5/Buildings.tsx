import type { ReactNode } from "react";
import type { SkillId, SkillState } from "../shared/types";
import { BUILDINGS, STATE_TEXT } from "./town";
//used Claude for this component to help build the UI for each building that represents each skill

interface Win {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Art {
  shape: ReactNode;
  windows: Win[];
  flag: { x: number; y: number };
  chimney?: { x: number; y: number };
  beacon?: { x: number; y: number };
  /** Bounding box used to draw scaffolding. */
  box: { left: number; right: number; top: number };
  shadow: number;
}

const ART: Record<SkillId, Art> = {
  // Old Town: town hall with a clock and a signboard showing a tiny graph.
  A1: {
    shadow: 72,
    box: { left: -63, right: 63, top: -102 },
    flag: { x: 0, y: -102 },
    chimney: { x: 34.5, y: -94 },
    windows: [
      { x: -44, y: -50, w: 14, h: 20 },
      { x: 30, y: -50, w: 14, h: 20 },
    ],
    shape: (
      <>
        <rect className="b-trim" x="30" y="-94" width="9" height="26" />
        <rect className="b-wall" x="-55" y="-62" width="110" height="62" />
        <polygon className="b-roof" points="-63,-62 0,-102 63,-62" />
        <circle className="b-trim" cx="0" cy="-78" r="8" />
        <path className="b-line" d="M0 -78 V-83 M0 -78 H4" />
        <rect className="b-door" x="-9" y="-32" width="18" height="32" rx="2" />
        <rect className="b-trim" x="-58" y="-4" width="116" height="4" />
        <rect className="b-trim" x="-81" y="-36" width="3" height="36" />
        <rect className="b-wall" x="-98" y="-62" width="36" height="26" rx="3" />
        <path className="b-line" d="M-90 -44 L-80 -53 L-70 -43" />
        <circle className="b-dot" cx="-90" cy="-44" r="3" />
        <circle className="b-dot" cx="-80" cy="-53" r="3" />
        <circle className="b-dot" cx="-70" cy="-43" r="3" />
      </>
    ),
  },
  // Registry Row: two-storey registry office with a ledger over the door.
  A2: {
    shadow: 60,
    box: { left: -50, right: 50, top: -96 },
    flag: { x: -38, y: -96 },
    chimney: { x: 28.5, y: -112 },
    windows: [
      { x: -34, y: -72, w: 14, h: 16 },
      { x: 20, y: -72, w: 14, h: 16 },
      { x: -34, y: -46, w: 14, h: 16 },
      { x: 20, y: -46, w: 14, h: 16 },
    ],
    shape: (
      <>
        <rect className="b-trim" x="24" y="-112" width="9" height="18" />
        <rect className="b-wall" x="-45" y="-88" width="90" height="88" />
        <rect className="b-roof" x="-50" y="-96" width="100" height="10" rx="2" />
        <rect className="b-door" x="-8" y="-30" width="16" height="30" rx="2" />
        <rect className="b-trim" x="-14" y="-62" width="28" height="18" rx="2" />
        <path className="b-line" d="M0 -62 V-44 M-9 -56 H-3 M-9 -51 H-3 M3 -56 H9 M3 -51 H9" />
      </>
    ),
  },
  // Station Square: ticket office with an awning and a line of people (a literal queue).
  A3: {
    shadow: 70,
    box: { left: -62, right: 62, top: -72 },
    flag: { x: -46, y: -70 },
    chimney: { x: 36.5, y: -90 },
    windows: [
      { x: -48, y: -44, w: 10, h: 12 },
      { x: 38, y: -44, w: 10, h: 12 },
      { x: -24, y: -28, w: 48, h: 20 },
    ],
    shape: (
      <>
        <rect className="b-trim" x="32" y="-90" width="9" height="20" />
        <rect className="b-wall" x="-56" y="-52" width="112" height="52" />
        <polygon className="b-roof" points="-62,-52 -50,-72 50,-72 62,-52" />
        <rect className="b-trim" x="-44" y="-38" width="88" height="7" rx="2" />
        {[-36, -18, 0, 18, 36].map((x) => (
          <g key={x}>
            <circle className="b-dot" cx={x} cy="8" r="4" />
            <path className="b-dot" d={`M${x - 6} 21 q6 -10 12 0z`} />
          </g>
        ))}
      </>
    ),
  },
  // Message Mile: post office with an envelope and a mailbox.
  A4: {
    shadow: 64,
    box: { left: -54, right: 54, top: -92 },
    flag: { x: 0, y: -92 },
    chimney: { x: 28.5, y: -88 },
    windows: [
      { x: -38, y: -46, w: 12, h: 16 },
      { x: 26, y: -46, w: 12, h: 16 },
    ],
    shape: (
      <>
        <rect className="b-trim" x="24" y="-88" width="9" height="22" />
        <rect className="b-wall" x="-46" y="-60" width="92" height="60" />
        <polygon className="b-roof" points="-54,-60 0,-92 54,-60" />
        <rect className="b-door" x="-8" y="-34" width="16" height="34" rx="2" />
        <rect className="b-trim" x="-14" y="-58" width="28" height="17" rx="2" />
        <path className="b-line" d="M-14 -58 L0 -47 L14 -58" />
        <rect className="b-trim" x="52" y="-24" width="12" height="15" rx="3" />
        <rect className="b-trim" x="56" y="-9" width="3" height="9" />
      </>
    ),
  },
  // Signal Hill: signal tower on a hill with a beacon (the rumour spreading outwards).
  A5: {
    shadow: 66,
    box: { left: -26, right: 26, top: -152 },
    flag: { x: -22, y: -112 },
    beacon: { x: 0, y: -124 },
    windows: [
      { x: -4, y: -88, w: 8, h: 14 },
      { x: -4, y: -62, w: 8, h: 14 },
      { x: -5, y: -36, w: 10, h: 16 },
      { x: -9, y: -130, w: 18, h: 14 },
    ],
    shape: (
      <>
        <ellipse className="b-ground" cx="0" cy="2" rx="64" ry="14" />
        <polygon className="b-wall" points="-22,0 22,0 16,-100 -16,-100" />
        <rect className="b-roof" x="-26" y="-112" width="52" height="12" rx="2" />
        <rect className="b-trim" x="-14" y="-136" width="28" height="24" rx="2" />
        <polygon className="b-roof" points="-18,-136 0,-152 18,-136" />
        <rect className="b-door" x="-6" y="-20" width="12" height="20" rx="2" />
      </>
    ),
  },
  // Crossroads: inn with a signpost pointing several ways.
  A6: {
    shadow: 64,
    box: { left: -56, right: 56, top: -84 },
    flag: { x: 36, y: -84 },
    chimney: { x: -25.5, y: -100 },
    windows: [
      { x: -38, y: -42, w: 14, h: 16 },
      { x: 24, y: -42, w: 14, h: 16 },
    ],
    shape: (
      <>
        <rect className="b-trim" x="-30" y="-100" width="9" height="24" />
        <rect className="b-wall" x="-48" y="-56" width="96" height="56" />
        <polygon className="b-roof" points="-56,-56 -44,-84 44,-84 56,-56" />
        <rect className="b-door" x="-8" y="-32" width="16" height="32" rx="2" />
        <rect className="b-trim" x="62" y="-72" width="4" height="72" />
        <polygon className="b-trim" points="66,-68 92,-68 98,-62 92,-56 66,-56" />
        <polygon className="b-trim" points="66,-50 86,-50 92,-44 86,-38 66,-38" />
      </>
    ),
  },
};

/** Scaffolding around a building site: poles, planks and cross-braces. */
function Scaffold({ box }: { box: Art["box"] }) {
  const left = box.left - 5;
  const right = box.right + 5;
  const top = box.top - 6;
  const planks = [top * 0.34, top * 0.67, top];
  return (
    <g className="scaffold">
      <line x1={left} y1="0" x2={left} y2={top} />
      <line x1={right} y1="0" x2={right} y2={top} />
      <line x1={(left + right) / 2} y1="0" x2={(left + right) / 2} y2={top} />
      {planks.map((y) => (
        <line key={y} x1={left} y1={y} x2={right} y2={y} className="scaffold-plank" />
      ))}
      <line x1={left} y1="0" x2={(left + right) / 2} y2={planks[0]} />
      <line x1={right} y1={planks[0]} x2={(left + right) / 2} y2={planks[1]} />
      <line x1={left} y1={planks[1]} x2={(left + right) / 2} y2={planks[2]} />
    </g>
  );
}

/** A small hazard-striped "building work" sign (the stripes carry the meaning, not the colour). */
function WorkSign({ x }: { x: number }) {
  return (
    <g className="sign" transform={`translate(${x} 0)`}>
      <rect className="sign-post" x="-1.5" y="-24" width="3" height="24" />
      <rect className="sign-board" x="-17" y="-40" width="34" height="18" rx="2" />
    </g>
  );
}

export interface BuildingProps {
  skill: SkillId;
  state: SkillState;
  skillName: string;
}

export default function Building({ skill, state, skillName }: BuildingProps) {
  const art = ART[skill];
  const info = BUILDINGS[skill];
  const { flag, chimney, beacon } = art;

  return (
    <g className="bld" data-skill={skill} data-state={state} transform={`translate(${info.x} ${info.y})`}>
      <ellipse className="b-shadow" cx="0" cy="2" rx={art.shadow} ry="7" />
      <ellipse className="pulse-ring" cx="0" cy="-30" rx="78" ry="62" />

      {/* Everything below lives in .b-anim so GSAP can animate it without touching the placement transform. */}
      <g className="b-anim">
        <g className="b-art">
          {art.shape}
          {art.windows.map((w, i) => (
            <rect key={i} className="b-win" x={w.x} y={w.y} width={w.w} height={w.h} rx="1.5" />
          ))}
        </g>

        <Scaffold box={art.box} />
        <WorkSign x={art.box.left + 4} />

        <g className="lit-layer">
          {art.windows.map((w, i) => (
            <rect key={i} className="b-win-lit" x={w.x} y={w.y} width={w.w} height={w.h} rx="1.5" />
          ))}
          <g className="flag">
            <line className="flag-pole" x1={flag.x} y1={flag.y} x2={flag.x} y2={flag.y - 22} />
            <polygon className="flag-cloth" points={`${flag.x},${flag.y - 22} ${flag.x + 16},${flag.y - 17} ${flag.x},${flag.y - 11}`} />
          </g>
          {chimney && (
            <g className="smoke">
              <circle cx={chimney.x} cy={chimney.y - 4} r="4" />
              <circle cx={chimney.x + 3} cy={chimney.y - 4} r="5" />
              <circle cx={chimney.x - 2} cy={chimney.y - 4} r="4.5" />
            </g>
          )}
          {beacon && (
            <g className="beacon" transform={`translate(${beacon.x} ${beacon.y})`}>
              <circle className="beacon-glow" r="22" />
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4;
                return (
                  <line
                    key={i}
                    className="beacon-ray"
                    x1={Math.cos(a) * 16}
                    y1={Math.sin(a) * 16}
                    x2={Math.cos(a) * 30}
                    y2={Math.sin(a) * 30}
                  />
                );
              })}
            </g>
          )}
        </g>

        <text className="b-kind" y="36" textAnchor="middle">
          {info.building}
        </text>
        <text className="b-skill" y="51" textAnchor="middle">
          {skillName}
        </text>
        <text className="b-state" y="65" textAnchor="middle">
          {STATE_TEXT[state].short}
        </text>
      </g>
    </g>
  );
}
