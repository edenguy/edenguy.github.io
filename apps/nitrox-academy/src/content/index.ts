import { Chapter, QuestionBank, Topic, type Chapter as ChapterT, type Question as QuestionT, type Topic as TopicT } from './schema';
import ch01 from './chapters/ch01.json';
import ch02 from './chapters/ch02.json';
import roadmap from './chapters/roadmap.json';
import q01 from './questions/ch01.json';
import q02 from './questions/ch02.json';
import topics from './topics.json';
import { z } from 'zod';

/** Validate once at module load; throws loudly in dev/tests if content is malformed. */
function parseChapters(): ChapterT[] {
  const list = [ch01, ch02, ...roadmap];
  return list.map((c) => Chapter.parse(c)).sort((a, b) => a.number - b.number);
}

export const CHAPTERS: ChapterT[] = parseChapters();
export const QUESTIONS: QuestionT[] = QuestionBank.parse([...q01, ...q02]);
export const ALL_TOPICS: TopicT[] = z.array(Topic).parse(topics);

const questionById = new Map(QUESTIONS.map((q) => [q.id, q]));
const topicById = new Map(ALL_TOPICS.map((t) => [t.id, t]));

export function getChapter(id: string | undefined): ChapterT | undefined {
  return CHAPTERS.find((c) => c.id === id);
}
export function getLesson(chapterId: string | undefined, lessonId: string | undefined) {
  const chapter = getChapter(chapterId);
  const index = chapter?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  return { chapter, lesson: index >= 0 ? chapter!.lessons[index] : undefined, index };
}
export function getQuestion(id: string): QuestionT | undefined {
  return questionById.get(id);
}
export function getTopic(id: string): TopicT | undefined {
  return topicById.get(id);
}
export function lessonCount(): number {
  return CHAPTERS.reduce((n, c) => n + c.lessons.length, 0);
}
export function availableChapters(): ChapterT[] {
  return CHAPTERS.filter((c) => c.status === 'available');
}
export function questionsForChapters(chapterIds: string[]): QuestionT[] {
  return QUESTIONS.filter((q) => chapterIds.includes(q.chapterId));
}
export function questionsForTopic(topic: string): QuestionT[] {
  return QUESTIONS.filter((q) => q.topic === topic);
}

/** Deterministic shuffle so a seed (e.g. the day) yields the same quiz. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const arr = [...items];
  let s = seed >>> 0 || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}
