# Part 2 — Personalisation & Data (Caitlin)

Owns: `SkillProfile`, `QuestPlan`, `GrowthData`, the DINA diagnosis client, the
threshold fallback, profile persistence, quest planner, and growth/class data.

Planned files (tasks 4.x–7.x):

- `diagnose.ts` — client calling the FastAPI `/diagnose` endpoint + `scoreQuizThreshold` fallback
- `profile.ts` — `buildDiagnosticProfile`, `markQuestTentative`, `applyRecheck`, persistence
- `planner.ts` — `planQuests`
- `growth.ts` — `buildGrowthData`, `ClassData`

Import shared types from `../shared/types`.
