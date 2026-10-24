import type { Question } from '@/content/schema';

export type Answer =
  | { type: 'multiple-choice'; optionIndex: number }
  | { type: 'numeric'; value: number }
  | { type: 'true-false'; value: boolean };

export interface GradeResult {
  correct: boolean;
  /** For multiple choice: the misconception note index if the learner picked a known trap. */
  misconceptionIndex?: number;
}

/** Deterministic grading. Numeric answers accept |answer − value| ≤ tolerance. */
export function grade(question: Question, answer: Answer): GradeResult {
  switch (question.type) {
    case 'multiple-choice': {
      if (answer.type !== 'multiple-choice') return { correct: false };
      const correct = answer.optionIndex === question.correctIndex;
      const mis = question.misconceptions.findIndex((m) => m.optionIndex === answer.optionIndex);
      return correct ? { correct } : { correct, ...(mis >= 0 ? { misconceptionIndex: mis } : {}) };
    }
    case 'numeric': {
      if (answer.type !== 'numeric' || !Number.isFinite(answer.value)) return { correct: false };
      return { correct: Math.abs(answer.value - question.answer) <= question.tolerance + 1e-9 };
    }
    case 'true-false': {
      if (answer.type !== 'true-false') return { correct: false };
      return { correct: answer.value === question.answer };
    }
  }
}
