import { describe, expect, it } from 'vitest';
import { parseBackup } from '../backup';

const valid = {
  app: 'nitrox-academy',
  version: 1,
  exportedAt: '2026-10-24T00:00:00.000Z',
  data: {
    settings: { locale: 'he', theme: 'system', units: 'm', ppo2Limit: 1.4 },
    lessonsCompleted: { 'ch01-l01': 1 },
    lastVisited: { chapterId: 'ch01', lessonId: 'ch01-l02' },
    assessments: [],
    attempts: [{ questionId: 'ch01-q01', topic: 'nitrox-basics', correct: true, at: 1, context: 'lesson' }],
    predictions: {},
    achievements: {},
    labVisits: 2,
  },
};

describe('parseBackup', () => {
  it('accepts a valid backup', () => {
    const b = parseBackup(JSON.stringify(valid));
    expect(b.data.lessonsCompleted).toEqual({ 'ch01-l01': 1 });
    expect(b.data.attempts).toHaveLength(1);
  });
  it('rejects foreign or malformed files', () => {
    expect(() => parseBackup('{}')).toThrow();
    expect(() => parseBackup('[]')).toThrow();
    expect(() => parseBackup('not json')).toThrow();
    expect(() => parseBackup(JSON.stringify({ ...valid, app: 'other' }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ ...valid, data: { settings: {} } }))).toThrow();
  });
  it('sanitises settings and drops malformed attempts', () => {
    const b = parseBackup(
      JSON.stringify({
        ...valid,
        data: {
          ...valid.data,
          settings: { locale: 'fr', theme: 'neon', units: 'km', ppo2Limit: 9 },
          attempts: [{ questionId: 1 }, null, valid.data.attempts[0]],
          predictions: 'nope',
        },
      }),
    );
    expect(b.data.settings).toEqual({ locale: 'he', theme: 'system', units: 'm', ppo2Limit: 1.4 });
    expect(b.data.attempts).toHaveLength(1);
    expect(b.data.predictions).toEqual({});
  });
});
