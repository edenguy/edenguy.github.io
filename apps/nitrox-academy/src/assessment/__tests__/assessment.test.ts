import { describe, expect, it } from 'vitest';
import { grade } from '../grade';
import { dueForReview, overallMastery, topicMastery, type Attempt } from '../mastery';
import type { AnalyzerState, Question } from '@/content/schema';

const mc: Question = {
  id: 'q1',
  type: 'multiple-choice',
  chapterId: 'ch01',
  topic: 't',
  objective: { en: 'o' },
  difficulty: 1,
  prompt: { en: 'p' },
  explanation: { en: 'e' },
  tags: [],
  options: [{ en: 'a' }, { en: 'b' }, { en: 'c' }],
  correctIndex: 1,
  misconceptions: [{ optionIndex: 2, note: { en: 'trap' } }],
};
const num: Question = {
  id: 'q2',
  type: 'numeric',
  chapterId: 'ch01',
  topic: 't',
  objective: { en: 'o' },
  difficulty: 2,
  prompt: { en: 'p' },
  explanation: { en: 'e' },
  tags: [],
  answer: 33.75,
  tolerance: 0.3,
  steps: [],
};
const param: Question = {
  id: 'q3',
  type: 'parameter',
  chapterId: 'ch05',
  topic: 't',
  objective: { en: 'o' },
  difficulty: 2,
  prompt: { en: 'p' },
  explanation: { en: 'e' },
  tags: [],
  parameter: 'fo2Percent',
  range: { min: 21, max: 40, step: 1 },
  accept: { min: 28, max: 35 },
};
const analyzerState: AnalyzerState = {
  seed: 1,
  powered: true,
  calOffset: 0,
  cellGain: 1,
  flowLpm: 2,
  sampling: true,
  trueFo2: 0.32,
  ambientFo2: 0.209,
  sensorFo2: 0.32,
  display: 32.0,
  tSeconds: 60,
  fault: 'none',
};
const instrumentReading: Question = {
  id: 'q4',
  type: 'instrument',
  chapterId: 'ch06',
  topic: 't',
  objective: { en: 'o' },
  difficulty: 2,
  prompt: { en: 'p' },
  explanation: { en: 'e' },
  tags: [],
  instrument: 'analyzer',
  state: analyzerState,
  ask: 'reading',
  answer: 32.0,
  tolerance: 0.3,
};
const instrumentFault: Question = {
  id: 'q5',
  type: 'instrument',
  chapterId: 'ch06',
  topic: 't',
  objective: { en: 'o' },
  difficulty: 2,
  prompt: { en: 'p' },
  explanation: { en: 'e' },
  tags: [],
  instrument: 'analyzer',
  state: { ...analyzerState, fault: 'flow-too-high' },
  ask: 'fault',
  answer: 'flow-too-high',
  tolerance: 0,
  options: [{ en: 'none' }, { en: 'flow too high' }],
  correctIndex: 1,
};

describe('grade()', () => {
  it('grades multiple choice and reports misconceptions', () => {
    expect(grade(mc, { type: 'multiple-choice', optionIndex: 1 })).toEqual({ correct: true });
    expect(grade(mc, { type: 'multiple-choice', optionIndex: 2 })).toEqual({ correct: false, misconceptionIndex: 0 });
    expect(grade(mc, { type: 'multiple-choice', optionIndex: 0 })).toEqual({ correct: false });
  });
  it('grades numeric answers within tolerance', () => {
    expect(grade(num, { type: 'numeric', value: 33.75 }).correct).toBe(true);
    expect(grade(num, { type: 'numeric', value: 34 }).correct).toBe(true);
    expect(grade(num, { type: 'numeric', value: 33 }).correct).toBe(false);
    expect(grade(num, { type: 'numeric', value: Number.NaN }).correct).toBe(false);
  });
  it('rejects mismatched answer shapes', () => {
    expect(grade(num, { type: 'multiple-choice', optionIndex: 0 }).correct).toBe(false);
  });
  it('grades parameter answers as correct within accept.min..accept.max', () => {
    expect(grade(param, { type: 'parameter', value: 32 }).correct).toBe(true);
    expect(grade(param, { type: 'parameter', value: 28 }).correct).toBe(true); // lower bound
    expect(grade(param, { type: 'parameter', value: 35 }).correct).toBe(true); // upper bound
    expect(grade(param, { type: 'parameter', value: 27.9 }).correct).toBe(false);
    expect(grade(param, { type: 'parameter', value: 36 }).correct).toBe(false);
    expect(grade(param, { type: 'parameter', value: Number.NaN }).correct).toBe(false);
    expect(grade(param, { type: 'numeric', value: 32 }).correct).toBe(false);
  });
  it('grades an instrument "reading" answer numerically within tolerance', () => {
    expect(grade(instrumentReading, { type: 'instrument', value: 32.0 }).correct).toBe(true);
    expect(grade(instrumentReading, { type: 'instrument', value: 32.3 }).correct).toBe(true); // at tolerance
    expect(grade(instrumentReading, { type: 'instrument', value: 32.4 }).correct).toBe(false);
    expect(grade(instrumentReading, { type: 'instrument', value: 'thirty-two' }).correct).toBe(false);
    expect(grade(instrumentReading, { type: 'parameter', value: 32 }).correct).toBe(false);
  });
  it('grades an instrument "fault" answer by option index, not the answer text', () => {
    expect(grade(instrumentFault, { type: 'instrument', value: 'flow-too-high', optionIndex: 1 }).correct).toBe(true);
    expect(grade(instrumentFault, { type: 'instrument', value: 'flow-too-high', optionIndex: 0 }).correct).toBe(false);
    expect(grade(instrumentFault, { type: 'instrument', value: 'flow-too-high' }).correct).toBe(false); // no optionIndex
  });
});

const t0 = 1_700_000_000_000;
const DAY = 86_400_000;
function att(questionId: string, correct: boolean, daysAgo: number, topic = 't'): Attempt {
  return { questionId, topic, correct, at: t0 - daysAgo * DAY, context: 'practice' };
}

describe('mastery', () => {
  it('is untested without attempts', () => {
    expect(topicMastery('t', []).level).toBe('untested');
    expect(overallMastery([])).toBeNull();
  });
  it('weights recent attempts more heavily', () => {
    const oldMisses = [att('a', false, 10), att('b', false, 9), att('c', false, 8)];
    const recentHits = [att('a', true, 2), att('b', true, 1), att('c', true, 0)];
    const m = topicMastery('t', [...oldMisses, ...recentHits]);
    expect(m.score).toBeGreaterThan(0.5);
    expect(m.missedQuestionIds).toEqual([]);
    const reversed = topicMastery('t', [
      att('a', true, 10), att('b', true, 9), att('c', true, 8),
      att('a', false, 2), att('b', false, 1), att('c', false, 0),
    ]);
    expect(reversed.score).toBeLessThan(0.5);
    expect(reversed.level).toBe('weak');
    expect(reversed.missedQuestionIds.sort()).toEqual(['a', 'b', 'c']);
  });
  it('requires repeated success for mastered', () => {
    expect(topicMastery('t', [att('a', true, 0)]).level).toBe('solid');
    expect(topicMastery('t', [att('a', true, 2), att('b', true, 1), att('c', true, 0)]).level).toBe('mastered');
  });
});

describe('spaced review', () => {
  it('makes missed questions due immediately and spaces correct ones', () => {
    const attempts = [att('miss', false, 0), att('hit1', true, 0), att('hit3', true, 0.5), att('hit3', true, 0)];
    const due = dueForReview(attempts, t0);
    expect(due.map((d) => d.questionId)).toEqual(['miss']);
    const later = dueForReview(attempts, t0 + 1.5 * DAY);
    expect(later.map((d) => d.questionId)).toEqual(['miss', 'hit1']);
    const muchLater = dueForReview(attempts, t0 + 4 * DAY);
    expect(muchLater.map((d) => d.questionId)).toEqual(['miss', 'hit1', 'hit3']);
  });
});
