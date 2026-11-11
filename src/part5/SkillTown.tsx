import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import type { SkillId, SkillProfile, SkillState } from "../shared/types";
import { SKILL_ORDER } from "../shared/types";
import Building from "./Buildings";
import {BUILDINGS,MAP_HEIGHT,MAP_WIDTH,STATE_TEXT,TOWN_GRAPH,isRoadLit,loadSeenStates,progressedSince,roadPath,saveSeenStates,summariseTown,townVisitOrder,} from "./town";
//used Claude for this component to help build the UI animating the skill tree (for motivation)
gsap.registerPlugin(DrawSVGPlugin);

export interface SkillInfo {
  name: string;
  description: string;
}

/**
 * Only animate when the person has not asked for less motion and the browser can draw SVG strokes.
 * Otherwise the town is simply shown in its final state, which is what the CSS describes.
 */
function canAnimate(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  const geometry = (window as unknown as { SVGGeometryElement?: { prototype: object } }).SVGGeometryElement;
  return Boolean(geometry && "getTotalLength" in geometry.prototype);
}

/**
 * The student's skill town. Each skill is a building whose state is how built it is:
 * blueprint -> under construction -> built (dark windows) -> open (lights on, flag up, chimney smoke).
 * It must look encouraging for every profile: a building site is progress, not failure.
 */
export default function SkillTown({
  profile,
  info,
}: {
  profile: SkillProfile;
  info: Record<SkillId, SkillInfo>;
}) {
  const states = profile.states;
  const summary = summariseTown(states);
  const signature = SKILL_ORDER.map((s) => states[s]).join(",");
  const svgRef = useRef<SVGSVGElement>(null);

  // Worked out once, on first render, from what the student saw last time.
  const [progressed] = useState(() => progressedSince(loadSeenStates(), states));

  // Remember what the student saw so the next visit can point out what has changed.
  useEffect(() => {
    saveSeenStates(states);
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !canAnimate()) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(svg);
      const order = townVisitOrder();
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      // 1. The roads draw themselves, then the buildings appear in BFS order from the town hall.
      tl.from(q(".road-base"), { drawSVG: "0%", duration: 0.8, stagger: 0.08 }, 0);
      tl.from(q(".road-dash"), { opacity: 0, duration: 0.4, stagger: 0.08 }, 0.5);
      order.forEach((skill, i) => {
        tl.from(q(`.bld[data-skill="${skill}"] .b-anim`), { opacity: 0, y: 14, duration: 0.5 }, 0.25 + i * 0.14);
      });

      // 2. The lights come on in BFS order, starting from the town hall.
      const lightsStart = 0.25 + order.length * 0.14 + 0.35;
      let lit = 0;
      order.forEach((skill) => {
        if (states[skill] !== "confirmed") return;
        const at = lightsStart + lit * 0.35;
        lit += 1;
        const root = `.bld[data-skill="${skill}"]`;
        tl.from(q(`${root} .lit-layer`), { opacity: 0, duration: 0.45 }, at);
        tl.from(q(`${root} .flag`), { y: 20, duration: 0.55, ease: "back.out(1.7)" }, at + 0.1);

        // 3. Chimney smoke and the signal-tower beacon keep going, softly, once a building is open.
        const puffs = q(`${root} .smoke circle`);
        if (puffs.length > 0) {
          gsap.set(puffs, { opacity: 0 });
          gsap.fromTo(
            puffs,
            { y: 0, opacity: 0.55, scale: 0.6, transformOrigin: "50% 50%" },
            { y: -30, opacity: 0, scale: 1.5, duration: 2.6, ease: "none", repeat: -1, stagger: 0.87, delay: at + 0.4, immediateRender: false },
          );
        }
        const beacon = q(`${root} .beacon`);
        if (beacon.length > 0) {
          gsap.to(beacon, { opacity: 0.45, duration: 1.5, yoyo: true, repeat: -1, ease: "sine.inOut", delay: at + 0.4 });
        }
      });

      // 4. Anything that moved forward since the last visit gets a gentle pulse.
      progressed.forEach((skill) => {
        tl.fromTo(
          q(`.bld[data-skill="${skill}"] .pulse-ring`),
          { opacity: 0.9, scale: 0.6, transformOrigin: "50% 50%" },
          { opacity: 0, scale: 1.25, duration: 1.1, repeat: 2, ease: "power1.out" },
          lightsStart + lit * 0.35 + 0.2,
        );
      });
    }, svg);

    return () => ctx.revert();
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextName = summary.nextUp ? info[summary.nextUp].name : null;
  const nextPlace = summary.nextUp ? BUILDINGS[summary.nextUp] : null;

  return (
    <div className="town-wrap">
      <div className="town-summary" role="status">
        <h3>{summary.headline}</h3>
        <p>{summary.detail}</p>
        {progressed.length > 0 && (
          <p className="town-changed">
            <strong>Since your last visit:</strong>{" "}
            {progressed
              .map((s) => `${info[s].name} (${BUILDINGS[s].building}) is now ${STATE_TEXT[states[s]].short.toLowerCase()}`)
              .join("; ")}
            .
          </p>
        )}
        {nextName && nextPlace && (
          <p className="town-next">
            <strong>Next up:</strong> {nextName} at {nextPlace.district} (the {nextPlace.building.toLowerCase()})
          </p>
        )}
      </div>

      <div className="town-scroll">
        <svg
          ref={svgRef}
          className="town-svg"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <pattern id="town-hazard" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="4" height="8" fill="#e0a93b" />
              <rect x="4" width="4" height="8" fill="#3b4a59" />
            </pattern>
            <linearGradient id="town-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e6f0f8" />
              <stop offset="1" stopColor="#f6f3ec" />
            </linearGradient>
          </defs>

          <rect className="town-bg" x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} rx="14" fill="url(#town-sky)" />

          <g className="town-roads">
            {/* Roads that share a street overlap, so draw the lit ones last and they stay visible. */}
            {[...TOWN_GRAPH.edges]
              .sort(
                (a, b) =>
                  Number(isRoadLit(states, a.from as SkillId, a.to as SkillId)) -
                  Number(isRoadLit(states, b.from as SkillId, b.to as SkillId)),
              )
              .map((edge) => (
              <g
                key={`${edge.from}-${edge.to}`}
                className={`road${isRoadLit(states, edge.from as SkillId, edge.to as SkillId) ? " is-lit" : ""}`}
              >
                <path className="road-base" d={roadPath(edge.from as SkillId, edge.to as SkillId)} />
                <path className="road-dash" d={roadPath(edge.from as SkillId, edge.to as SkillId)} />
              </g>
            ))}
          </g>

          {SKILL_ORDER.map((skill) => (
            <Building key={skill} skill={skill} state={states[skill] as SkillState} skillName={info[skill].name} />
          ))}
        </svg>
      </div>

      <ul className="town-legend" aria-label="What the buildings mean">
        <li><span className="swatch swatch--blueprint" aria-hidden="true" />Blueprint: not assessed yet</li>
        <li><span className="swatch swatch--site" aria-hidden="true" />Scaffolding: under construction</li>
        <li><span className="swatch swatch--dark" aria-hidden="true" />Dark windows: built, awaiting re-check</li>
        <li><span className="swatch swatch--lit" aria-hidden="true" />Lights on and flag up: open</li>
      </ul>

      {/* The drawing is decorative; this is the same information as text. */}
      <ul className="sr-only">
        {SKILL_ORDER.map((skill) => (
          <li key={skill}>
            {BUILDINGS[skill].building}, {BUILDINGS[skill].district}, for {info[skill].name}: {STATE_TEXT[states[skill]].long}
          </li>
        ))}
      </ul>
    </div>
  );
}
