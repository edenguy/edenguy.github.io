import { useMemo } from 'react';
import { useProgress } from './store';
import { CHAPTERS, ALL_TOPICS, lessonCount } from '@/content';
import { allTopicMastery, dueForReview, overallMastery } from '@/assessment/mastery';

export function useCourseProgress() {
  const completed = useProgress((s) => s.lessonsCompleted);
  return useMemo(() => {
    const total = lessonCount();
    const done = CHAPTERS.flatMap((c) => c.lessons).filter((l) => completed[l.id]).length;
    return { total, done, fraction: total === 0 ? 0 : done / total };
  }, [completed]);
}

export function useChapterProgress(chapterId: string) {
  const completed = useProgress((s) => s.lessonsCompleted);
  const assessments = useProgress((s) => s.assessments);
  return useMemo(() => {
    const chapter = CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter) return { total: 0, done: 0, fraction: 0, allLessonsDone: false, best: null, passed: false };
    const total = chapter.lessons.length;
    const done = chapter.lessons.filter((l) => completed[l.id]).length;
    const mine = assessments.filter((a) => a.chapterId === chapterId);
    const best = mine.length ? Math.max(...mine.map((a) => a.score / a.total)) : null;
    return {
      total,
      done,
      fraction: total === 0 ? 0 : done / total,
      allLessonsDone: total > 0 && done === total,
      best,
      passed: mine.some((a) => a.passed),
    };
  }, [chapterId, completed, assessments]);
}

export function useMastery() {
  const attempts = useProgress((s) => s.attempts);
  return useMemo(() => {
    const topics = allTopicMastery(
      ALL_TOPICS.map((t) => t.id),
      attempts,
    );
    return {
      topics,
      overall: overallMastery(topics),
      weak: topics.filter((t) => t.level === 'weak' || t.level === 'developing').sort((a, b) => (a.score ?? 0) - (b.score ?? 0)),
      due: dueForReview(attempts),
    };
  }, [attempts]);
}

/** The next lesson the learner should open: last visited if incomplete, else first incomplete. */
export function useNextLesson() {
  const completed = useProgress((s) => s.lessonsCompleted);
  const last = useProgress((s) => s.lastVisited);
  return useMemo(() => {
    if (last) {
      const ch = CHAPTERS.find((c) => c.id === last.chapterId);
      const lesson = ch?.lessons.find((l) => l.id === last.lessonId);
      if (ch && lesson && !completed[lesson.id]) return { chapter: ch, lesson, resumed: true };
    }
    for (const ch of CHAPTERS) {
      if (ch.status !== 'available') continue;
      for (const lesson of ch.lessons) if (!completed[lesson.id]) return { chapter: ch, lesson, resumed: false };
    }
    return null;
  }, [completed, last]);
}
