# Part 2 — Personalisation & Data (Caitlin)

Owns: `SkillProfile`, `QuestPlan`, `GrowthData`, the DINA diagnosis client, the
threshold fallback, profile persistence, quest planner, and growth/class data.

Planned files (tasks 4.x–7.x):

- `diagnose.ts` — client calling the FastAPI `/diagnose` endpoint + `scoreQuizThreshold` fallback
- `profile.ts` — `buildDiagnosticProfile`, `markQuestTentative`, `applyRecheck`, persistence
- `planner.ts` — `planQuests`
- `growth.ts` — `buildGrowthData`, `ClassData`

Import shared types from `../shared/types`.

## Testing

Part 2 has unit tests for diagnosis, threshold fallback scoring, profile state
transitions, and quest planning. Its journey integration test uses the real
Part 1 diagnostic bank, passes the resulting plan to Part 4's `Quests`
component, and checks that quest completion is tentative until a re-check.

Run the Part 2 tests from the repository root:

```powershell
npx.cmd vitest run src/part2
```

Run the complete test suite and typecheck with:

```powershell
npm.cmd test
npm.cmd run typecheck
```
