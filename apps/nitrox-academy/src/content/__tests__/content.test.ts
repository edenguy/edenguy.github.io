import { describe, expect, it } from 'vitest';
import { CHAPTERS, QUESTIONS, ALL_TOPICS, availableChapters, lessonCount, seededShuffle } from '../index';
import en from '@/i18n/locales/en.json';
import he from '@/i18n/locales/he.json';
import { grade } from '@/assessment/grade';
import { Lesson } from '../schema';

/** Content is data, so it gets the same test discipline as code. */
describe('chapter content', () => {
  it('parses every chapter and keeps chapter numbers unique and ordered', () => {
    expect(CHAPTERS.length).toBeGreaterThanOrEqual(10);
    const numbers = CHAPTERS.map((c) => c.number);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
  });

  it('has Chapters 1 and 2 available with substantive lessons', () => {
    const available = availableChapters();
    expect(available.map((c) => c.id)).toEqual(['ch01', 'ch02']);
    for (const c of available) {
      expect(c.lessons.length).toBeGreaterThanOrEqual(5);
      expect(c.objectives.length).toBeGreaterThanOrEqual(3);
      expect(c.references.length).toBeGreaterThanOrEqual(1);
      for (const l of c.lessons) {
        // Every lesson teaches something, checks understanding and summarises.
        expect(l.blocks.some((b) => b.type === 'text')).toBe(true);
        expect(l.blocks.some((b) => b.type === 'question' || b.type === 'predict')).toBe(true);
        expect(l.blocks.some((b) => b.type === 'keypoints')).toBe(true);
        expect(l.topics.length).toBeGreaterThan(0);
      }
      // Each available chapter has an interactive simulation somewhere in it.
      expect(c.lessons.some((l) => l.blocks.some((b) => b.type === 'interactive'))).toBe(true);
    }
    expect(lessonCount()).toBeGreaterThanOrEqual(10);
  });

  it('declares every lesson topic in the topic registry', () => {
    const known = new Set(ALL_TOPICS.map((t) => t.id));
    for (const c of availableChapters()) for (const l of c.lessons) for (const topic of l.topics) expect(known).toContain(topic);
  });

  it('resolves every referenced question id', () => {
    const ids = new Set(QUESTIONS.map((q) => q.id));
    for (const c of CHAPTERS) {
      for (const id of c.assessment.questionIds) expect(ids).toContain(id);
      for (const l of c.lessons) for (const b of l.blocks) if (b.type === 'question') expect(ids).toContain(b.questionId);
    }
  });

  it('keeps question ids unique and assessments non-trivial', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const c of availableChapters()) {
      expect(c.assessment.questionIds.length).toBeGreaterThanOrEqual(8);
      expect(new Set(c.assessment.questionIds).size).toBe(c.assessment.questionIds.length);
      expect(c.assessment.passScore).toBeGreaterThan(0.5);
    }
  });
});

describe('question bank', () => {
  it('gives every question an explanation, objective and valid answer', () => {
    for (const q of QUESTIONS) {
      expect(q.explanation.en.length).toBeGreaterThan(40);
      expect(q.objective.en.length).toBeGreaterThan(10);
      if (q.type === 'multiple-choice') {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        for (const m of q.misconceptions) {
          expect(m.optionIndex).toBeLessThan(q.options.length);
          expect(m.optionIndex).not.toBe(q.correctIndex);
        }
      }
      if (q.type === 'numeric') expect(Number.isFinite(q.answer)).toBe(true);
    }
  });

  it('is fully translated into Hebrew, the default UI language', () => {
    for (const q of QUESTIONS) {
      expect(q.prompt.he, `prompt ${q.id}`).toBeTruthy();
      expect(q.explanation.he, `explanation ${q.id}`).toBeTruthy();
      if (q.type === 'multiple-choice') for (const [i, o] of q.options.entries()) expect(o.he ?? o.en, `${q.id} option ${i}`).toBeTruthy();
    }
  });

  it('grades its own correct answer as correct', () => {
    for (const q of QUESTIONS) {
      if (q.type === 'multiple-choice') expect(grade(q, { type: 'multiple-choice', optionIndex: q.correctIndex }).correct).toBe(true);
      if (q.type === 'numeric') expect(grade(q, { type: 'numeric', value: q.answer }).correct).toBe(true);
      if (q.type === 'true-false') expect(grade(q, { type: 'true-false', value: q.answer }).correct).toBe(true);
    }
  });
});

describe('lesson text is translated', () => {
  it('provides Hebrew for every learner-facing string in available chapters', () => {
    const missing: string[] = [];
    const need = (path: string, v?: { en: string; he?: string }) => {
      if (v && !v.he) missing.push(path);
    };
    for (const c of availableChapters()) {
      need(`${c.id}.title`, c.title);
      need(`${c.id}.description`, c.description);
      c.objectives.forEach((o, i) => need(`${c.id}.objective[${i}]`, o));
      for (const l of c.lessons) {
        need(`${l.id}.title`, l.title);
        need(`${l.id}.summary`, l.summary);
        l.blocks.forEach((b, bi) => {
          const at = `${l.id}.block[${bi}]`;
          if (b.type === 'text') need(at, b.body);
          if (b.type === 'heading') need(at, b.text);
          if (b.type === 'callout') need(at, b.body);
          if (b.type === 'predict') {
            need(`${at}.prompt`, b.prompt);
            need(`${at}.reveal`, b.reveal);
          }
          if (b.type === 'keypoints') b.items.forEach((it, i) => need(`${at}.item[${i}]`, it));
          if (b.type === 'deeper') need(at, b.body);
        });
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('UI translations', () => {
  const flatten = (o: Record<string, unknown>, p = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v !== null ? flatten(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`]));

  it('lists the same number of sources in both languages', () => {
    expect((he as { legal: { sources: string[] } }).legal.sources).toHaveLength((en as { legal: { sources: string[] } }).legal.sources.length);
  });

  it('has the same keys in English and Hebrew', () => {
    const a = flatten(en as Record<string, unknown>).sort();
    const b = flatten(he as Record<string, unknown>).sort();
    expect(b).toEqual(a);
  });
});

describe('seededShuffle', () => {
  it('is deterministic for a seed and keeps every element', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(seededShuffle(items, 42)).toEqual(seededShuffle(items, 42));
    expect([...seededShuffle(items, 42)].sort((a, b) => a - b)).toEqual(items);
    expect(seededShuffle(items, 42)).not.toEqual(seededShuffle(items, 99));
  });
});

describe('interactive props validation', () => {
  it('rejects a content typo such as a percentage where a fraction is expected', () => {
    const bad = {
      id: 'x',
      title: { en: 't' },
      summary: { en: 's' },
      estimatedMinutes: 1,
      topics: ['nitrox-basics'],
      blocks: [{ type: 'interactive', component: 'depth-ppo2', props: { initialFo2: 36 } }],
    };
    expect(Lesson.safeParse(bad).success).toBe(false);
    const good = { ...bad, blocks: [{ type: 'interactive', component: 'depth-ppo2', props: { initialFo2: 0.36 } }] };
    expect(Lesson.safeParse(good).success).toBe(true);
    const unknownProp = { ...bad, blocks: [{ type: 'interactive', component: 'ead-explorer', props: { nope: 1 } }] };
    expect(Lesson.safeParse(unknownProp).success).toBe(false);
  });
});
