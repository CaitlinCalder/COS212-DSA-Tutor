//A Q-matrix maps assessment items (rows) to the skills they use (columns)
import type { QMatrix, SkillId, QuizItem, QuizBankId } from "../shared/types";
import { SKILL_ORDER } from "../shared/types";
import { diagnosticItems } from "./content";

//building the QMatrix for a bank from its quiz items.
export function buildQMatrix(bank: QuizBankId, items: QuizItem[]): QMatrix {
  const skills: SkillId[] = [...SKILL_ORDER];

  const rows = items.map((item) => {
    //start every skill column at 0 so the record always has all six columns
    const requires = {} as Record<SkillId, 0 | 1>;
    for (const skill of SKILL_ORDER) {
      requires[skill] = 0;
    }
    //mark every skill this item actually uses
    for (const skill of item.requires) {
      requires[skill] = 1;
    }

    return { itemId: item.id, requires };
  });

  return { bank, skills, rows };
}

//Q-matrix for the diagnostic bank
export const diagnosticQMatrix: QMatrix = buildQMatrix(
  "diagnostic",
  diagnosticItems,
);


//lookup the Q-matrix for a bank (only the diagnostic bank exists in this prototype)
export function qMatrixFor(_bank: QuizBankId): QMatrix {
  return diagnosticQMatrix;
}
