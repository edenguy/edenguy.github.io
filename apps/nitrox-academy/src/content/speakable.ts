import type { Block, Lesson } from './schema';
import { pick, type Locale } from './localize';

/**
 * Plain text of a lesson for read-aloud: the prose a learner would read out, with inline
 * markup removed and interactive widgets, formulas and answer options skipped.
 */
export function plainText(markup: string): string {
  return markup
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\{\{([^}]+)\}\}/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

/** Join sentence fragments without doubling the full stop a fragment already ends with. */
function joinSentences(parts: (string | undefined)[]): string {
  return parts
    .filter((p): p is string => !!p && p.trim().length > 0)
    .map((p) => p.trim().replace(/[.,;:]+$/, ''))
    .join('. ');
}

export function blockSpeech(block: Block, locale: Locale): string {
  switch (block.type) {
    case 'text':
      return plainText(pick(block.body, locale));
    case 'heading':
      return plainText(pick(block.text, locale));
    case 'callout':
      return joinSentences([block.title ? plainText(pick(block.title, locale)) : '', plainText(pick(block.body, locale))]);
    case 'example':
      return joinSentences([
        plainText(pick(block.title, locale)),
        ...block.steps.map((s) => plainText(pick(s.text, locale))),
        plainText(pick(block.result, locale)),
      ]);
    case 'keypoints':
      return joinSentences(block.items.map((i) => plainText(pick(i, locale))));
    case 'deeper':
      return joinSentences([plainText(pick(block.title, locale)), plainText(pick(block.body, locale))]);
    case 'predict':
      return plainText(pick(block.prompt, locale));
    default:
      // Formulas, tables, glossaries and interactive widgets are read on screen, not aloud.
      return '';
  }
}

export function lessonSpeech(lesson: Lesson, locale: Locale): string {
  return `${joinSentences([
    plainText(pick(lesson.title, locale)),
    plainText(pick(lesson.summary, locale)),
    ...lesson.blocks.map((b) => blockSpeech(b, locale)),
  ])}.`;
}
