import { describe, expect, it } from 'vitest';
import {
  AnalyzerStateSchema,
  Block,
  ExamConfig,
  INTERACTIVE_PROPS,
  InteractiveId,
  Question,
} from '../schema';

const baseQuestion = {
  id: 'q1',
  chapterId: 'ch05',
  topic: 't',
  objective: { en: 'o' },
  difficulty: 2 as const,
  prompt: { en: 'p' },
  explanation: { en: 'e' },
  tags: [],
};

const validAnalyzerState = {
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

describe('InteractiveId', () => {
  it('includes the Phase 2–3 simulators and the scenario player', () => {
    for (const id of ['ndl-compare', 'oxygen-exposure', 'virtual-analyzer', 'cylinder-label', 'dive-planner', 'scenario']) {
      expect(InteractiveId.safeParse(id).success).toBe(true);
    }
  });
  it('has a strict props schema for every id (Record<InteractiveId, …> must be total)', () => {
    for (const id of InteractiveId.options) {
      expect(INTERACTIVE_PROPS[id]).toBeDefined();
    }
  });
});

describe('INTERACTIVE_PROPS for the new simulators', () => {
  it('ndl-compare accepts its documented props and rejects unknown ones', () => {
    expect(INTERACTIVE_PROPS['ndl-compare'].safeParse({ initialDepth: 20, initialPct: 32 }).success).toBe(true);
    expect(INTERACTIVE_PROPS['ndl-compare'].safeParse({ bogus: 1 }).success).toBe(false);
  });
  it('oxygen-exposure bounds initialPpo2 to the slider range (0.5–1.6)', () => {
    expect(INTERACTIVE_PROPS['oxygen-exposure'].safeParse({ initialPpo2: 1.4, segments: true }).success).toBe(true);
    expect(INTERACTIVE_PROPS['oxygen-exposure'].safeParse({ initialPpo2: 1.7 }).success).toBe(false);
    expect(INTERACTIVE_PROPS['oxygen-exposure'].safeParse({ initialPpo2: 0.4 }).success).toBe(false);
  });
  it('virtual-analyzer accepts a fault id as its scenario and rejects an unknown one', () => {
    expect(INTERACTIVE_PROPS['virtual-analyzer'].safeParse({ mode: 'guided', trueFo2: 0.32 }).success).toBe(true);
    expect(INTERACTIVE_PROPS['virtual-analyzer'].safeParse({ scenario: 'aging-cell' }).success).toBe(true);
    expect(INTERACTIVE_PROPS['virtual-analyzer'].safeParse({ scenario: 'not-a-fault' }).success).toBe(false);
  });
  it('cylinder-label bounds the planning limit to 1.0–1.6', () => {
    expect(INTERACTIVE_PROPS['cylinder-label'].safeParse({ fo2: 0.32, limit: 1.4, editable: true }).success).toBe(true);
    expect(INTERACTIVE_PROPS['cylinder-label'].safeParse({ limit: 2 }).success).toBe(false);
  });
  it('dive-planner accepts its documented props', () => {
    expect(INTERACTIVE_PROPS['dive-planner'].safeParse({ repetitive: true, initialMix: 0.32 }).success).toBe(true);
  });
  it('scenario requires a scenarioId', () => {
    expect(INTERACTIVE_PROPS['scenario'].safeParse({ scenarioId: 'sc-deep-ean36' }).success).toBe(true);
    expect(INTERACTIVE_PROPS['scenario'].safeParse({}).success).toBe(false);
  });
});

describe('Block "scenario" type', () => {
  it('parses a reference to a scenario by id', () => {
    const r = Block.safeParse({ type: 'scenario', scenarioId: 'sc-deep-ean36' });
    expect(r.success).toBe(true);
  });
  it('rejects a scenario block without a scenarioId', () => {
    expect(Block.safeParse({ type: 'scenario' }).success).toBe(false);
  });
});

describe('AnalyzerStateSchema', () => {
  it('parses a well-formed analyzer state', () => {
    expect(AnalyzerStateSchema.safeParse(validAnalyzerState).success).toBe(true);
  });
  it('rejects an unknown fault id and an out-of-range calOffset', () => {
    expect(AnalyzerStateSchema.safeParse({ ...validAnalyzerState, fault: 'leaking' }).success).toBe(false);
    expect(AnalyzerStateSchema.safeParse({ ...validAnalyzerState, calOffset: 4 }).success).toBe(false);
  });
});

describe('Question "parameter" type', () => {
  const q = {
    ...baseQuestion,
    type: 'parameter',
    parameter: 'fo2Percent',
    range: { min: 21, max: 40, step: 1 },
    accept: { min: 28, max: 35 },
  };
  it('parses with range and accept bounds', () => {
    expect(Question.safeParse(q).success).toBe(true);
  });
  it('rejects an unknown parameter name', () => {
    expect(Question.safeParse({ ...q, parameter: 'bogus' }).success).toBe(false);
  });
  it('rejects a non-positive step', () => {
    expect(Question.safeParse({ ...q, range: { min: 21, max: 40, step: 0 } }).success).toBe(false);
  });
});

describe('Question "instrument" type', () => {
  const q = {
    ...baseQuestion,
    type: 'instrument',
    instrument: 'analyzer',
    state: validAnalyzerState,
    ask: 'reading',
    answer: 32.0,
    tolerance: 0.3,
  };
  it('parses a "reading" instrument question with its analyzer state', () => {
    expect(Question.safeParse(q).success).toBe(true);
  });
  it('parses a "fault" instrument question with options and correctIndex', () => {
    const faultQ = {
      ...q,
      ask: 'fault',
      answer: 'aging-cell',
      options: [{ en: 'None' }, { en: 'Aging cell' }],
      correctIndex: 1,
    };
    expect(Question.safeParse(faultQ).success).toBe(true);
  });
  it('rejects a malformed analyzer state', () => {
    expect(Question.safeParse({ ...q, state: { ...validAnalyzerState, flowLpm: 9 } }).success).toBe(false);
  });
});

describe('ExamConfig', () => {
  const valid = {
    id: 'mock-a',
    title: { en: 'Mock exam A' },
    kind: 'mock',
    questionCount: 4,
    timeLimitMinutes: 60,
    blueprint: { ch01: 2, ch02: 2 },
    passScore: 0.8,
  };
  it('parses a well-formed exam config', () => {
    expect(ExamConfig.safeParse(valid).success).toBe(true);
  });
  it('allows an untimed exam (timeLimitMinutes: null)', () => {
    expect(ExamConfig.safeParse({ ...valid, timeLimitMinutes: null }).success).toBe(true);
  });
  it('rejects a blueprint whose sum does not equal questionCount', () => {
    const r = ExamConfig.safeParse({ ...valid, blueprint: { ch01: 2, ch02: 3 } });
    expect(r.success).toBe(false);
  });
});
