import { describe, expect, it } from 'vitest';
import { blockSpeech, lessonSpeech, plainText } from '../speakable';
import { splitForSpeech } from '@/app/useSpeech';
import { CHAPTERS } from '../index';

describe('plainText', () => {
  it('strips the inline markup so nothing is read out as punctuation', () => {
    expect(plainText('**bold** and _italic_ and {{FO2}} and [[1.4]]')).toBe('bold and italic and FO2 and 1.4');
    expect(plainText('one\n\ntwo')).toBe('one two');
  });
});

describe('blockSpeech', () => {
  it('skips blocks that only make sense on screen', () => {
    expect(blockSpeech({ type: 'formula', expression: 'PPO2 = FO2 × P_abs', legend: [] }, 'he')).toBe('');
    expect(blockSpeech({ type: 'interactive', component: 'mod-calculator' }, 'he')).toBe('');
  });
});

describe('lessonSpeech', () => {
  it('produces readable Hebrew text for every available lesson', () => {
    for (const c of CHAPTERS.filter((x) => x.status === 'available')) {
      for (const l of c.lessons) {
        const he = lessonSpeech(l, 'he');
        expect(he.length, `${l.id} he`).toBeGreaterThan(200);
        expect(he).not.toContain('{{');
        expect(he).not.toContain('**');
        // No doubled full stops where a translated fragment already ended with one.
        expect(he, `${l.id} he`).not.toMatch(/\.\s*\./);
        expect(lessonSpeech(l, 'en').length).toBeGreaterThan(200);
      }
    }
  });
});

describe('splitForSpeech', () => {
  it('keeps chunks small enough that engines do not truncate them', () => {
    const text = Array.from({ length: 40 }, (_, i) => `משפט מספר ${i}.`).join(' ');
    const chunks = splitForSpeech(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(220);
    expect(chunks.join(' ').replace(/\s+/g, ' ')).toBe(text);
  });
  it('never returns an empty list', () => {
    expect(splitForSpeech('short')).toEqual(['short']);
  });
});
