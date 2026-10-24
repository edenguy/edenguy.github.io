import { z } from 'zod';

/**
 * Content model for Nitrox Academy.
 *
 * Everything the learner reads is data (JSON) validated against these schemas, so new
 * chapters, exercises and languages are added without touching React components.
 * Text fields are localized objects; English is the required fallback.
 */

export const LocalizedString = z.object({ en: z.string(), he: z.string().optional() });
export type LocalizedString = z.infer<typeof LocalizedString>;

export const InteractiveId = z.enum([
  'gas-composition',
  'depth-ppo2',
  'pressure-column',
  'mod-calculator',
  'mod-explorer',
  'air-vs-nitrox',
  'ead-explorer',
]);
export type InteractiveId = z.infer<typeof InteractiveId>;

/**
 * Props each simulation accepts from content. Validated at content load so an authoring typo
 * (e.g. initialFo2: 36 instead of 0.36) fails the content tests rather than throwing inside a
 * lesson at runtime.
 */
const Fo2 = z.number().min(0.16).max(1);
const Pct = z.number().int().min(16).max(100);
const Depth = z.number().min(0).max(200);
const Limits = z.array(z.number().min(1).max(1.6)).min(1);
export const INTERACTIVE_PROPS: Record<InteractiveId, z.ZodType> = {
  'gas-composition': z.object({ min: Pct.optional(), max: Pct.optional(), initial: Pct.optional(), presets: z.array(Pct).optional(), compact: z.boolean().optional() }).strict(),
  'depth-ppo2': z
    .object({ fo2Options: z.array(Fo2).optional(), initialFo2: Fo2.optional(), initialDepth: Depth.optional(), deep: z.boolean().optional(), showChart: z.boolean().optional(), showN2: z.boolean().optional(), lockFo2: z.boolean().optional() })
    .strict(),
  'pressure-column': z.object({ initialDepth: Depth.optional() }).strict(),
  'mod-calculator': z.object({ initialFo2: Fo2.optional(), limits: Limits.optional(), minPct: Pct.optional(), maxPct: Pct.optional() }).strict(),
  'mod-explorer': z.object({ minPct: Pct.optional(), maxPct: Pct.optional(), initialPct: Pct.optional(), limits: Limits.optional(), deep: z.boolean().optional() }).strict(),
  'air-vs-nitrox': z.object({ initialPct: Pct.optional(), initialDepth: Depth.optional() }).strict(),
  'ead-explorer': z.object({ initialPct: Pct.optional() }).strict(),
};

const InteractiveRef = z
  .object({ component: InteractiveId, props: z.record(z.string(), z.unknown()).optional() })
  .superRefine((v, ctx) => {
    const r = INTERACTIVE_PROPS[v.component].safeParse(v.props ?? {});
    if (!r.success) ctx.addIssue({ code: 'custom', message: `invalid props for ${v.component}: ${r.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join('; ')}` });
  });

const Base = { id: z.string().optional() };

export const Block = z.discriminatedUnion('type', [
  z.object({ ...Base, type: z.literal('text'), body: LocalizedString }),
  z.object({ ...Base, type: z.literal('heading'), text: LocalizedString }),
  z.object({
    ...Base,
    type: z.literal('callout'),
    variant: z.enum(['info', 'science', 'insight', 'warning', 'safety', 'standard']),
    title: LocalizedString.optional(),
    body: LocalizedString,
  }),
  z.object({
    ...Base,
    type: z.literal('interactive'),
    component: InteractiveId,
    props: z.record(z.string(), z.unknown()).optional(),
    caption: LocalizedString.optional(),
  }).superRefine((v, ctx) => {
    const r = INTERACTIVE_PROPS[v.component].safeParse(v.props ?? {});
    if (!r.success) ctx.addIssue({ code: 'custom', message: `invalid props for ${v.component}: ${r.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join('; ')}` });
  }),
  z.object({
    ...Base,
    type: z.literal('formula'),
    /** Plain-text formula, always rendered LTR, e.g. "PPO2 = FO2 × P_abs". */
    expression: z.string(),
    legend: z.array(z.object({ symbol: z.string(), meaning: LocalizedString })).default([]),
    note: LocalizedString.optional(),
  }),
  z.object({
    ...Base,
    type: z.literal('example'),
    title: LocalizedString,
    steps: z.array(z.object({ text: LocalizedString, math: z.string().optional() })),
    result: LocalizedString,
  }),
  z.object({
    ...Base,
    type: z.literal('predict'),
    /** Stable id: predictions are stored under it, so it must not change when blocks move. */
    id: z.string().min(1),
    /** Learner predicts an outcome before the simulator reveals it. */
    prompt: LocalizedString,
    options: z.array(LocalizedString).min(2),
    correctIndex: z.number().int().nonnegative(),
    reveal: LocalizedString,
    interactive: InteractiveRef.optional(),
    topic: z.string(),
  }),
  z.object({ ...Base, type: z.literal('question'), questionId: z.string() }),
  z.object({ ...Base, type: z.literal('deeper'), title: LocalizedString, body: LocalizedString }),
  z.object({ ...Base, type: z.literal('keypoints'), items: z.array(LocalizedString).min(1) }),
  z.object({
    ...Base,
    type: z.literal('terms'),
    items: z.array(z.object({ term: z.string(), definition: LocalizedString })),
  }),
  z.object({
    ...Base,
    type: z.literal('compare'),
    title: LocalizedString.optional(),
    columns: z.array(LocalizedString).min(2),
    rows: z.array(z.object({ label: LocalizedString, cells: z.array(LocalizedString) })),
  }),
]);
export type Block = z.infer<typeof Block>;

export const Lesson = z.object({
  id: z.string(),
  title: LocalizedString,
  summary: LocalizedString,
  estimatedMinutes: z.number().int().positive(),
  /** Topic ids this lesson teaches, for mastery tracking. */
  topics: z.array(z.string()).min(1),
  blocks: z.array(Block).min(1),
});
export type Lesson = z.infer<typeof Lesson>;

export const Reference = z.object({
  id: z.string(),
  citation: z.string(),
  url: z.string().url({ protocol: /^https?$/ }).optional(),
  /** What this reference is used for and where it applies. */
  scope: z.string(),
});
export type Reference = z.infer<typeof Reference>;

export const Chapter = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  title: LocalizedString,
  tagline: LocalizedString,
  description: LocalizedString,
  icon: z.enum(['intro', 'physics', 'deco', 'oxygen', 'mod', 'analyzer', 'planning', 'equipment', 'scenarios', 'exam']),
  status: z.enum(['available', 'coming-soon']),
  objectives: z.array(LocalizedString),
  lessons: z.array(Lesson),
  assessment: z.object({
    questionIds: z.array(z.string()),
    /** Fraction correct needed to mark the chapter assessment as passed. */
    passScore: z.number().min(0).max(1),
  }),
  references: z.array(Reference).default([]),
});
export type Chapter = z.infer<typeof Chapter>;

/** Question bank entries. */
const QuestionBase = {
  id: z.string(),
  chapterId: z.string(),
  topic: z.string(),
  objective: LocalizedString,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  prompt: LocalizedString,
  explanation: LocalizedString,
  /** Tags for the practice hub (e.g. "calculation", "concept", "scenario"). */
  tags: z.array(z.string()).default([]),
};

export const Question = z.discriminatedUnion('type', [
  z.object({
    ...QuestionBase,
    type: z.literal('multiple-choice'),
    options: z.array(LocalizedString).min(2),
    correctIndex: z.number().int().nonnegative(),
    misconceptions: z
      .array(z.object({ optionIndex: z.number().int().nonnegative(), note: LocalizedString }))
      .default([]),
  }),
  z.object({
    ...QuestionBase,
    type: z.literal('numeric'),
    answer: z.number(),
    tolerance: z.number().nonnegative().default(0),
    unit: z.string().optional(),
    /** Optional worked solution steps shown after answering. */
    steps: z.array(z.object({ text: LocalizedString, math: z.string().optional() })).default([]),
  }),
  z.object({
    ...QuestionBase,
    type: z.literal('true-false'),
    answer: z.boolean(),
  }),
]);
export type Question = z.infer<typeof Question>;
export type QuestionType = Question['type'];

export const QuestionBank = z.array(Question);

/** Topic metadata for the mastery dashboard. */
export const Topic = z.object({
  id: z.string(),
  chapterId: z.string(),
  title: LocalizedString,
});
export type Topic = z.infer<typeof Topic>;
