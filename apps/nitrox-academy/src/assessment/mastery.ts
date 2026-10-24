/**
 * Deterministic mastery scoring and review scheduling.
 *
 * Mastery is computed from actual answer history, separately from lesson completion:
 * reading a lesson never raises mastery; only correct answers do.
 */

export interface Attempt {
  questionId: string;
  topic: string;
  correct: boolean;
  /** Epoch milliseconds. */
  at: number;
  /** Where the attempt happened. */
  context: 'lesson' | 'chapter-assessment' | 'practice' | 'review';
}

export interface TopicMastery {
  topic: string;
  /** 0..1, recency-weighted accuracy over the last N attempts; null if never attempted. */
  score: number | null;
  attempts: number;
  correct: number;
  /** Ids of questions missed on their most recent attempt. */
  missedQuestionIds: string[];
  level: 'untested' | 'weak' | 'developing' | 'solid' | 'mastered';
}

const WINDOW = 8;
/** Weights for the most recent attempts (newest first). Sum is normalised at runtime. */
const WEIGHTS = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];

export function masteryLevel(score: number | null, attempts: number): TopicMastery['level'] {
  if (score === null || attempts === 0) return 'untested';
  if (score < 0.5) return 'weak';
  if (score < 0.75) return 'developing';
  if (score < 0.9 || attempts < 3) return 'solid';
  return 'mastered';
}

export function topicMastery(topic: string, attempts: readonly Attempt[]): TopicMastery {
  const mine = attempts.filter((a) => a.topic === topic).sort((a, b) => b.at - a.at);
  if (mine.length === 0) {
    return { topic, score: null, attempts: 0, correct: 0, missedQuestionIds: [], level: 'untested' };
  }
  const recent = mine.slice(0, WINDOW);
  let num = 0;
  let den = 0;
  recent.forEach((a, i) => {
    const w = WEIGHTS[i] ?? 0.3;
    num += a.correct ? w : 0;
    den += w;
  });
  const score = den === 0 ? null : num / den;

  // Most recent attempt per question decides whether it is currently "missed".
  const latest = new Map<string, Attempt>();
  for (const a of mine) if (!latest.has(a.questionId)) latest.set(a.questionId, a);
  const missedQuestionIds = [...latest.values()].filter((a) => !a.correct).map((a) => a.questionId);

  return {
    topic,
    score,
    attempts: mine.length,
    correct: mine.filter((a) => a.correct).length,
    missedQuestionIds,
    level: masteryLevel(score, mine.length),
  };
}

export function allTopicMastery(topics: readonly string[], attempts: readonly Attempt[]): TopicMastery[] {
  return topics.map((t) => topicMastery(t, attempts));
}

/** Overall mastery: mean of tested topics' scores (null if nothing tested). */
export function overallMastery(masteries: readonly TopicMastery[]): number | null {
  const tested = masteries.filter((m) => m.score !== null);
  if (tested.length === 0) return null;
  return tested.reduce((s, m) => s + (m.score ?? 0), 0) / tested.length;
}

/**
 * Spaced review: a question becomes due after an interval that grows with its streak of
 * correct answers (1 day, 3 days, 7 days, 14 days, 30 days). A miss resets the streak and
 * makes the question due immediately.
 */
const INTERVALS_DAYS = [1, 3, 7, 14, 30];
const DAY = 24 * 60 * 60 * 1000;

export interface ReviewItem {
  questionId: string;
  topic: string;
  dueAt: number;
  streak: number;
  lastCorrect: boolean;
}

export function reviewSchedule(attempts: readonly Attempt[]): ReviewItem[] {
  const byQuestion = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const list = byQuestion.get(a.questionId) ?? [];
    list.push(a);
    byQuestion.set(a.questionId, list);
  }
  const items: ReviewItem[] = [];
  for (const [questionId, list] of byQuestion) {
    list.sort((a, b) => a.at - b.at);
    let streak = 0;
    for (const a of list) streak = a.correct ? streak + 1 : 0;
    const last = list[list.length - 1]!;
    const interval = last.correct ? (INTERVALS_DAYS[Math.min(streak, INTERVALS_DAYS.length) - 1] ?? 30) : 0;
    items.push({ questionId, topic: last.topic, dueAt: last.at + interval * DAY, streak, lastCorrect: last.correct });
  }
  return items;
}

/** Questions due for review now, weakest (missed, then shortest streak) first. */
export function dueForReview(attempts: readonly Attempt[], now = Date.now()): ReviewItem[] {
  return reviewSchedule(attempts)
    .filter((i) => i.dueAt <= now)
    .sort((a, b) => Number(a.lastCorrect) - Number(b.lastCorrect) || a.streak - b.streak || a.dueAt - b.dueAt);
}
