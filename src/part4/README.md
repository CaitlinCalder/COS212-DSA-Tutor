# Part 4 — Quests (Khotso)

Owns: the three-stage quest screens.

Consumes: `QuestPlan` from `../shared/types`, reuses Part 3's `GraphQueueView`,
generates fresh variant graphs per skill, and emits quest-completion events back
to Part 2 (`markQuestTentative`).
