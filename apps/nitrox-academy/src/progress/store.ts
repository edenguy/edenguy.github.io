import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { del, get, set } from 'idb-keyval';
import type { Attempt } from '@/assessment/mastery';
import type { Locale } from '@/content/localize';
import type { DepthUnit } from '@/science';

/**
 * IndexedDB-backed storage for zustand's persist middleware. Where IndexedDB does not exist
 * (tests, some embedded webviews) an in-memory map stands in so the app still runs; the
 * hydration error path marks storage as unavailable for the UI.
 */
const memory = new Map<string, string>();
const hasIdb = typeof indexedDB !== 'undefined';
const idbStorage: StateStorage = {
  getItem: async (name) => (hasIdb ? ((await get<string>(name)) ?? null) : (memory.get(name) ?? null)),
  setItem: async (name, value) => {
    if (hasIdb) await set(name, value);
    else memory.set(name, value);
  },
  removeItem: async (name) => {
    if (hasIdb) await del(name);
    else memory.delete(name);
  },
};

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AssessmentResult {
  chapterId: string;
  score: number;
  total: number;
  passed: boolean;
  at: number;
}

export interface PredictionRecord {
  choice: number;
  correct: boolean;
  at: number;
}

export type AchievementId =
  | 'first-lesson'
  | 'ch01-complete'
  | 'ch02-complete'
  | 'first-pass'
  | 'lab-visit'
  | 'ten-correct'
  | 'mod-calc';

export interface ProgressState {
  hydrated: boolean;
  /** True when IndexedDB could not be read; the app runs but nothing will be saved. */
  storageError: boolean;
  settings: {
    locale: Locale;
    theme: ThemePreference;
    units: DepthUnit;
    ppo2Limit: number;
  };
  lessonsCompleted: Record<string, number>;
  lastVisited: { chapterId: string; lessonId: string } | null;
  assessments: AssessmentResult[];
  attempts: Attempt[];
  predictions: Record<string, PredictionRecord>;
  achievements: Partial<Record<AchievementId, number>>;
  labVisits: number;
  /** When the learner acknowledged the free-tool / own-responsibility notice; null until then. */
  acknowledgedAt: number | null;

  acknowledge: () => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
  setUnits: (units: DepthUnit) => void;
  setPpo2Limit: (ppo2: number) => void;
  completeLesson: (chapterId: string, lessonId: string) => void;
  visitLesson: (chapterId: string, lessonId: string) => void;
  recordAttempt: (attempt: Attempt) => void;
  recordPrediction: (key: string, record: PredictionRecord) => void;
  recordAssessment: (result: AssessmentResult) => void;
  unlock: (id: AchievementId) => void;
  visitLab: () => void;
  resetProgress: () => void;
}

const initialProgress = {
  lessonsCompleted: {} as Record<string, number>,
  lastVisited: null as ProgressState['lastVisited'],
  assessments: [] as AssessmentResult[],
  attempts: [] as Attempt[],
  predictions: {} as Record<string, PredictionRecord>,
  achievements: {} as Partial<Record<AchievementId, number>>,
  labVisits: 0,
  acknowledgedAt: null as number | null,
};

function readInitialLocale(): Locale {
  try {
    const l = localStorage.getItem('nitrox:locale');
    if (l === 'he' || l === 'en') return l;
  } catch {
    /* ignore */
  }
  // Hebrew is the default language of the product; English is an opt-in switch.
  return 'he';
}

function readInitialTheme(): ThemePreference {
  try {
    const t = localStorage.getItem('nitrox:theme');
    if (t === 'dark' || t === 'light') return t;
  } catch {
    /* ignore */
  }
  return 'system';
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      storageError: false,
      settings: { locale: readInitialLocale(), theme: readInitialTheme(), units: 'm', ppo2Limit: 1.4 },
      ...initialProgress,

      acknowledge: () => set({ acknowledgedAt: Date.now() }),
      setLocale: (locale) => set((s) => ({ settings: { ...s.settings, locale } })),
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      setUnits: (units) => set((s) => ({ settings: { ...s.settings, units } })),
      setPpo2Limit: (ppo2Limit) => set((s) => ({ settings: { ...s.settings, ppo2Limit } })),

      completeLesson: (chapterId, lessonId) =>
        set((s) => {
          if (s.lessonsCompleted[lessonId]) return {};
          const achievements = { ...s.achievements };
          if (!achievements['first-lesson']) achievements['first-lesson'] = Date.now();
          return {
            lessonsCompleted: { ...s.lessonsCompleted, [lessonId]: Date.now() },
            lastVisited: { chapterId, lessonId },
            achievements,
          };
        }),
      visitLesson: (chapterId, lessonId) => set({ lastVisited: { chapterId, lessonId } }),
      recordAttempt: (attempt) =>
        set((s) => {
          const attempts = [...s.attempts, attempt].slice(-2000);
          const achievements = { ...s.achievements };
          const correctCount = attempts.filter((a) => a.correct).length;
          if (correctCount >= 10 && !achievements['ten-correct']) achievements['ten-correct'] = Date.now();
          return { attempts, achievements };
        }),
      recordPrediction: (key, record) => set((s) => ({ predictions: { ...s.predictions, [key]: record } })),
      recordAssessment: (result) =>
        set((s) => {
          const achievements = { ...s.achievements };
          if (result.passed && !achievements['first-pass']) achievements['first-pass'] = Date.now();
          return { assessments: [...s.assessments, result], achievements };
        }),
      unlock: (id) => {
        if (get().achievements[id]) return;
        set((s) => ({ achievements: { ...s.achievements, [id]: Date.now() } }));
      },
      visitLab: () =>
        set((s) => ({
          labVisits: s.labVisits + 1,
          achievements: s.achievements['lab-visit'] ? s.achievements : { ...s.achievements, 'lab-visit': Date.now() },
        })),
      resetProgress: () => set((s) => ({ ...initialProgress, acknowledgedAt: s.acknowledgedAt })),
    }),
    {
      name: 'nitrox-academy:v1',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      /** Sanitise whatever came out of storage: a bad ppo2Limit would throw inside every simulation. */
      migrate: (persisted) => sanitisePersisted(persisted),
      merge: (persisted, current) => ({ ...current, ...sanitisePersisted(persisted) }),
      onRehydrateStorage: () => (_state, error) => {
        // On a storage error zustand never fires onFinishHydration, so finish here.
        if (error) useProgress.setState({ hydrated: true, storageError: true });
      },
      partialize: (s) => ({
        settings: s.settings,
        lessonsCompleted: s.lessonsCompleted,
        lastVisited: s.lastVisited,
        assessments: s.assessments,
        attempts: s.attempts,
        predictions: s.predictions,
        achievements: s.achievements,
        labVisits: s.labVisits,
        acknowledgedAt: s.acknowledgedAt,
      }),
    },
  ),
);

/** Defensive cleanup of persisted data from any version; unknown or out-of-range values fall back. */
export function sanitisePersisted(input: unknown): Partial<ProgressState> {
  const p = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const s = obj(p.settings);
  const settings: ProgressState['settings'] = {
    locale: s.locale === 'en' || s.locale === 'he' ? s.locale : 'he',
    theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : 'system',
    units: s.units === 'ft' ? 'ft' : 'm',
    ppo2Limit: typeof s.ppo2Limit === 'number' && s.ppo2Limit >= 1 && s.ppo2Limit <= 1.6 ? s.ppo2Limit : 1.4,
  };
  const attempts = (Array.isArray(p.attempts) ? p.attempts : [])
    .filter(
      (a): a is Attempt =>
        !!a && typeof a === 'object' && typeof (a as Attempt).questionId === 'string' && typeof (a as Attempt).topic === 'string' && typeof (a as Attempt).correct === 'boolean' && Number.isFinite((a as Attempt).at),
    )
    .slice(-2000);
  const assessments = (Array.isArray(p.assessments) ? p.assessments : []).filter(
    (r): r is AssessmentResult =>
      !!r && typeof r === 'object' && typeof (r as AssessmentResult).chapterId === 'string' && Number.isFinite((r as AssessmentResult).total) && (r as AssessmentResult).total > 0 && Number.isFinite((r as AssessmentResult).score),
  );
  const lessonsCompleted = Object.fromEntries(Object.entries(obj(p.lessonsCompleted)).filter(([, v]) => Number.isFinite(v))) as Record<string, number>;
  const predictions = Object.fromEntries(
    Object.entries(obj(p.predictions)).filter(([, v]) => !!v && typeof v === 'object' && Number.isInteger((v as PredictionRecord).choice) && typeof (v as PredictionRecord).correct === 'boolean'),
  ) as Record<string, PredictionRecord>;
  const achievements = Object.fromEntries(Object.entries(obj(p.achievements)).filter(([, v]) => Number.isFinite(v))) as Partial<Record<AchievementId, number>>;
  const lv = obj(p.lastVisited);
  const lastVisited = typeof lv.chapterId === 'string' && typeof lv.lessonId === 'string' ? { chapterId: lv.chapterId, lessonId: lv.lessonId } : null;
  return {
    settings,
    lessonsCompleted,
    lastVisited,
    assessments,
    attempts,
    predictions,
    achievements,
    labVisits: typeof p.labVisits === 'number' && Number.isFinite(p.labVisits) ? p.labVisits : 0,
    acknowledgedAt: typeof p.acknowledgedAt === 'number' && Number.isFinite(p.acknowledgedAt) ? p.acknowledgedAt : null,
  };
}

useProgress.persist.onFinishHydration(() => useProgress.setState({ hydrated: true }));
if (useProgress.persist.hasHydrated()) useProgress.setState({ hydrated: true });
