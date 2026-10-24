# Nitrox Academy — Low-Level Design for Phases 2–4

Audience: the engineer (human or model) implementing the remaining curriculum and simulators.
Everything needed to implement is in this document, the existing code, and `docs/RESEARCH.md`.
Read this whole file before writing code. Phase 1 is finished and must not be re-architected.

Repository: `apps/nitrox-academy` (source). The built app is committed to `/nitrox-academy` at
the repository root and served by GitHub Pages at `https://edenguy.github.io/nitrox-academy/`.

---

## 0. Ground rules (read first)

### 0.1 Non-negotiable safety rules

1. **Never invent a number.** Every physiological limit, table value, threshold, percentage or
   duration shown to a learner must come from §9 ("Verified facts") of this document or from
   `src/science/limits.ts`. If a fact you need is not there, implement the feature so that the
   number is **hidden behind a `verified: false` flag** (see §4.2) and add a line to
   `docs/RESEARCH.md` under "Open verification items". Do not guess.
2. **Never copy** agency course text, exam questions, illustrations or branding. Describe
   publicly known standards in your own words and cite the public source in the chapter's
   `references`.
3. The app **never** claims to certify anyone, never calls any tool a dive computer, and never
   presents 1.4 / 1.6 ata as universal. Use the existing wording patterns: `lab.scope`,
   `practice.disclaimer`, `dashboard.disclaimer`, the `legal.*` strings (first-run notice and
   the "Sources and responsibility" section of About) and the safety callout in `ch01-l04`.
   Tone rule: state limits and responsibility plainly, but never suggest the numbers are
   unreliable; they are sourced and tested, and the About page says so.
4. **Do not encourage experimentation on real dives.** Scenario consequences must say what
   the correct procedure is; never present an unsafe choice as acceptable.
5. Inline maths inside Hebrew prose must be wrapped in `{{ }}` and standalone numbers with
   units in `[[ ]]` (see §0.4). This is a correctness rule, not a style rule.

### 0.2 Commands and definition of done

```bash
cd apps/nitrox-academy
npm install
npm run dev          # http://localhost:5173/nitrox-academy/
npm run typecheck    # strict TS; must be clean
npm test             # vitest; must be green
npm run build        # writes ../../nitrox-academy (committed!)
npm run preview      # serve the build on :4173
```

A task is **done** only when all of these hold:

- `npm run typecheck`, `npm test` and `npm run build` are clean.
- The built output in `/nitrox-academy` is committed together with the source.
- The feature was opened in a browser at **390 px** and **1440 px** width, in **Hebrew (RTL)**
  and **English**, in **dark** and **light** themes, with no horizontal overflow and no console
  errors. (Use Playwright, pre-installed; see `docs/LLD.md` §8 for the harness pattern.)
- New learner-facing strings exist in **both** `src/i18n/locales/en.json` and `he.json`
  (a test enforces key parity) and in both `en`/`he` fields of content.
- New science functions have unit tests with hand-derived reference values written in
  comments, plus boundary and invalid-input tests.
- Commit as the repository's git user. End commit messages with the attribution trailer the
  session provides, if any.

### 0.3 Architecture you must keep

| Layer | Path | Rule |
|---|---|---|
| Science | `src/science/` | Pure functions only. No React, no i18n, no DOM. Every exported function validated by `assertFinite/assertRange/assertFo2/assertPpo2` in `validate.ts`. |
| Limits | `src/science/limits.ts` | The only place published limits live, each with a provenance comment. |
| Content | `src/content/` | JSON validated by Zod schemas in `schema.ts` at load (`index.ts`). Content never imports React. |
| Assessment | `src/assessment/` | `grade.ts` (deterministic grading), `mastery.ts` (mastery and spaced review). |
| Progress | `src/progress/store.ts` | Zustand + persist to IndexedDB. Add fields only through `sanitisePersisted()` and `partialize`. |
| Simulations | `src/simulations/` | SVG instruments. Registered by id in `src/simulations/index.tsx`; content refers to them by `InteractiveId`. |
| Features | `src/features/<area>/` | Pages. Routing in `src/app/router.tsx` (HashRouter). |
| UI | `src/components/ui/` | Primitives: `Button, Card, Badge, Callout, Readout, Slider, Segmented, ProgressRing, Rich (renderInline, Sci, Formula), Icon, SpeakButton`. |
| i18n | `src/i18n/locales/{en,he}.json` | UI strings only. Lesson text is in content JSON with `{en, he}`. |

Conventions: Tailwind v4 with the design tokens in `src/styles.css` (`bg-surface`, `text-ink`,
`text-muted`, `text-accent`, `text-o2` (oxygen, warm), `text-n2` (nitrogen, cool), `text-warn`,
`text-danger`, `text-safe`). Use **logical** spacing classes only (`ms-`, `me-`, `ps-`, `pe-`,
`start-`, `end-`, `text-start`). Physical scales (sliders, water columns, charts, numeric
segmented controls) are wrapped in `dir="ltr"`; everything else follows the document direction.
Icons that point in a direction get `rtl:-scale-x-100`.

### 0.4 Content authoring conventions

- Localized string: `{ "en": "...", "he": "..." }`. Hebrew uses the plural "אתם" register,
  nouns/infinitives on buttons, and the terminology in §10.
- Inline markup (rendered by `renderInline` in `src/components/ui/Rich.tsx`):
  `**bold**`, `_italic_`, `{{FO2}}` → LTR monospace chip (use for every scientific token and
  every inline equation), `[[1.4 ata]]` → LTR number run. Paragraph break: `\n\n`.
- Every lesson: `text` → (`interactive` | `example`) → `predict` → `question` → `keypoints`.
  At least one `interactive` per chapter. At least one `callout` with `variant: "safety"` in
  every chapter that touches procedure.
- Every chapter: `objectives` (3–6), `lessons` (4–7), `assessment.questionIds` (8–12, 80 %
  pass), `references` (≥ 2 with `scope` text explaining what the source is used for).
- Questions: `difficulty` 1–3, `objective`, `explanation` (> 40 chars), `misconceptions`
  for the traps, `tags` from `concept | calculation | procedure | safety | scenario | instrument`.
- Register new topics in `src/content/topics.json` and import new chapter/question files in
  `src/content/index.ts`; remove the chapter's placeholder from `chapters/roadmap.json`.
- Run `npm test`: `content.test.ts` validates schema, references, Hebrew coverage and that
  every lesson teaches, checks and summarises.

---

## 1. Work plan (do in this order)

| # | Task | Size | Depends on |
|---|---|---|---|
| T1 | Schema extensions (§2) | S | – |
| T2 | Science additions: `cns.ts`, `ndl.ts`, `analyzer.ts` (§4) + tests | M | – |
| T3 | Chapter 3 content + `ndl-compare` interactive (§5.3, §3.1) | M | T1, T2 |
| T4 | Chapter 4 content + `oxygen-exposure` interactive (§5.4, §3.2) | M | T1, T2 |
| T5 | Chapter 5 content (§5.5), reuse `mod-explorer`, `mod-calculator` | S | T1 |
| T6 | Virtual analyzer simulator (§3.3) + `cylinder-label` (§3.4) | L | T2 |
| T7 | Chapter 6 content (§5.6) + instrument-reading questions | M | T6 |
| T8 | Dive planning sandbox (§3.5) | L | T2 |
| T9 | Chapter 7 content (§5.7) | M | T8 |
| T10 | Chapter 8 content (§5.8) | M | T1 |
| T11 | Scenario engine + player (§6) | L | T1 |
| T12 | Chapter 9 content: 7 scenarios (§5.9) | M | T11 |
| T13 | Exam engine: mock exams, timer, review (§7) | L | – |
| T14 | Chapter 10 content + question bank to ≥ 150 (§5.10) | L | T13 |
| T15 | Lab page: add new tools, remove "coming soon" (§3.6) | S | T6, T8 |
| T16 | Phase 4 polish: route code-splitting, accessibility pass, achievements (§8) | M | all |

Each task ends with a commit. Do not start T3 before T1 and T2 are green.

---

## 2. Schema extensions (`src/content/schema.ts`)

### 2.1 New interactive ids

Extend `InteractiveId`:

```ts
export const InteractiveId = z.enum([
  'gas-composition', 'depth-ppo2', 'pressure-column', 'mod-calculator', 'mod-explorer',
  'air-vs-nitrox', 'ead-explorer',
  // Phase 2–3
  'ndl-compare', 'oxygen-exposure', 'virtual-analyzer', 'cylinder-label', 'dive-planner',
  'scenario',
]);
```

Add their prop schemas to `INTERACTIVE_PROPS` (strict objects, see §3 for props).

### 2.2 New block type: `scenario`

```ts
z.object({ ...Base, type: z.literal('scenario'), scenarioId: z.string() })
```

Scenarios themselves live in `src/content/scenarios/*.json`, validated by `Scenario` (§6.1).

### 2.3 New question types

Add to the `Question` discriminated union:

```ts
// Learner sets a value with a slider/stepper; correct if within [min, max].
z.object({
  ...QuestionBase,
  type: z.literal('parameter'),
  parameter: z.enum(['fo2Percent', 'depth', 'ppo2', 'minutes']),
  range: z.object({ min: z.number(), max: z.number(), step: z.number().positive() }),
  accept: z.object({ min: z.number(), max: z.number() }),
  unit: z.string().optional(),
}),
// Learner reads a rendered instrument (virtual analyzer face) and types the value.
z.object({
  ...QuestionBase,
  type: z.literal('instrument'),
  instrument: z.literal('analyzer'),
  /** Deterministic simulator state to render (see §4.3 AnalyzerState). */
  state: AnalyzerStateSchema,
  /** What the learner must report. */
  ask: z.enum(['reading', 'fault']),
  answer: z.union([z.number(), z.string()]),
  tolerance: z.number().nonnegative().default(0),
  options: z.array(LocalizedString).optional(), // for ask = 'fault' (multiple choice of fault ids)
  correctIndex: z.number().int().optional(),
}),
```

Extend `src/assessment/grade.ts`:

```ts
| { type: 'parameter'; value: number }
| { type: 'instrument'; value: number | string; optionIndex?: number }
```

`parameter`: correct iff `accept.min <= value <= accept.max`.
`instrument`: `ask='reading'` → numeric within tolerance; `ask='fault'` → `optionIndex === correctIndex`.

Extend `QuestionCard.tsx` with two renderers: a `Slider`-based one for `parameter` and the
`VirtualAnalyzer` face (read-only mode, §3.3) for `instrument`.

### 2.4 Exam configuration (`src/content/exams.json`)

```ts
export const ExamConfig = z.object({
  id: z.string(),                       // 'mock-a', 'mock-b', 'topic-ch04', ...
  title: LocalizedString,
  kind: z.enum(['mock', 'topic', 'calculation', 'scenario']),
  questionCount: z.number().int().positive(),
  timeLimitMinutes: z.number().int().positive().nullable(),  // null = untimed
  /** Weighted sampling: chapterId → number of questions. Sum must equal questionCount. */
  blueprint: z.record(z.string(), z.number().int().nonnegative()),
  passScore: z.number().min(0).max(1),  // 0.8 for mocks (mirrors common agency pass marks; say "unofficial")
});
```

---

## 3. Simulators (`src/simulations/`)

All simulators: pure presentational React, state in `useState`, physics from `src/science`,
units from `useUnits()` and limit from `usePlanningLimit()` in `shared.ts`. Each must work at
390 px width (use `useIsNarrow()` for smaller SVG sizes, as `DepthPpo2Explorer` does).
Register each in `src/simulations/index.tsx`. Every simulator rendered inside a lesson gets the
`lab.scope` line automatically (already implemented in `LessonBlocks.tsx`).

### 3.1 `NdlCompare` (`ndl-compare`)

Purpose: show *why* Nitrox extends the no-decompression limit, without inventing NDL numbers.

Props: `{ initialDepth?: number; initialPct?: number }`.

UI: depth slider (0–40 m), mix segmented (Air, EAN28, EAN32, EAN36, EAN40, LTR).
Shows: PPN2 on air vs mix (bars, `text-n2`), the EAD (from `ead()`), and a sentence:
"At {depth} on {mix} your nitrogen loads as it would on air at {EAD}."
If `NDL_TABLE.verified === true` (§4.2) also show the air NDL at the actual depth and at the
EAD (rounded up with `eadRounded`) side by side, labelled with the table's `source`.
If not verified: show instead a `Callout variant="standard"`: "No-decompression limits come
from your training agency's tables or your dive computer; this app does not publish them."

### 3.2 `OxygenExposureExplorer` (`oxygen-exposure`)

Props: `{ initialPpo2?: number; initialMinutes?: number; segments?: boolean }`.

UI: PPO2 slider 0.5–1.6 step 0.01 (LTR), duration slider 0–240 min, optional multi-segment
list (add/remove rows of `{ppo2, minutes}`). Readouts: single-exposure limit at this PPO2
(`noaaSingleExposureLimit`), CNS % (`cnsPercent` / `totalExposure`), OTU (`otu`), daily limit
(`noaaDailyLimit`). A horizontal bar chart (LTR SVG) of the NOAA single-exposure limits per
PPO2 row with the current PPO2 highlighted. CNS ≥ 80 % → `text-warn`; ≥ 100 % → `text-danger`
with the badge "beyond the NOAA single-exposure limit". PPO2 > 1.6 → readouts show "—" and the
message "outside the NOAA recreational table". Always show the provenance line:
"NOAA Diving Manual oxygen exposure limits (see About)". Never extrapolate beyond the table.

### 3.3 `VirtualAnalyzer` (`virtual-analyzer`)

The signature feature of Phase 3. A deterministic simulation of a galvanic-cell oxygen
analyzer, driven by `src/science/analyzer.ts` (§4.3).

Props:
```ts
{
  mode?: 'free' | 'guided' | 'readonly';     // readonly used by instrument questions
  scenario?: AnalyzerScenarioId;             // preset fault, see §4.3
  trueFo2?: number;                          // cylinder contents, 0.21–0.40 (hidden from learner)
  state?: AnalyzerState;                     // for readonly rendering
  onResult?: (r: { reading: number; calibrated: boolean; faultIdentified?: string }) => void;
}
```

Visual (SVG, LTR): an instrument body with a 3-digit LCD readout ("20.9", "32.4"), a
CAL knob (rotary, drag or ± buttons), a flow indicator (bubble column), buttons: `Power`,
`Calibrate in air`, `Sample cylinder`, `Stop`, and a cylinder valve slider for flow rate
(0–5 L/min). The LCD updates every 250 ms from `analyzerStep()`. A small log panel lists the
learner's actions (power on, calibrated at 20.9, sampled at 2 L/min, reading 32.4).

Guided mode runs a checklist (each step unlocks the next; each step has a short `he/en`
instruction string in `sim.analyzer.*`):

1. Power on; wait for the reading to settle in air.
2. Adjust CAL until the display reads 20.9 (air). (Accept 20.8–21.0.)
3. Open the cylinder valve to a low, steady flow (accept 1–3 L/min). Hold the sensor in the
   stream.
4. Wait for the reading to stabilise (change < 0.1 over 10 s).
5. Record the reading. The learner types it; grade ±0.3 against the simulated stable reading.
6. Compute MOD at the planning limit with `mod()`; the learner types it; grade exact (floor).
7. Fill the label (§3.4). Verify against the dive plan (a provided target mix ±1 %).

Free mode: all controls available, no checklist; the Lab uses this.

Faults (see §4.3) are injected by `scenario`; the learner must notice them ("Identify the
problem" multiple choice appears after the reading stabilises). Each fault shows its
explanation afterwards (from content `sim.analyzer.fault.<id>.explanation`).

Always display, above the instrument, the standard line
`sim.analyzer.disclaimer`: "A simulated analyzer. It cannot replace handling a real analyzer
with an instructor, and it never verifies a real cylinder."

### 3.4 `CylinderLabel` (`cylinder-label`)

Props: `{ fo2?: number; limit?: number; editable?: boolean; onChange?: (label) => void }`.

A tag-shaped SVG form with fields: **O2 %** (numeric), **MOD** (numeric, unit from settings),
**Date** (ISO date input), **Analyst** (initials, ≤ 4 chars), **Planned limit** (1.4 / 1.6).
In `editable` mode, a "Check label" button validates: O2 % within ±0.5 of the analyzed value
passed in `fo2`, MOD equals `mod(fo2Measured, limit)` (floor), date is today, initials
non-empty. Shows each field green/red with the explanation key `sim.label.<field>Hint`.
Also renders the mix name (`mixName`) and a green/yellow band only as a *visual convention*
with the caption "A band or sticker identifies a cylinder as Nitrox-designated; it does not
tell you the mix. Only the analysis tag does."

### 3.5 `DivePlanner` (`dive-planner`)

Props: `{ initialMix?: number; initialDepth?: number; initialMinutes?: number; repetitive?: boolean }`.

An educational sandbox, not a dive computer. Layout: left column (on desktop) with a list of
dive segments `{ depth, minutes }` (add/remove, max 6) and a mix selector per dive; right
column with the instrument panel. Up to 3 dives with a surface interval (minutes) between
them when `repetitive` is true.

Per segment compute and display: `P_abs`, `PPO2` (status badge via `ppo2Status`), `PPN2`,
`EAD`, CNS % contribution (`cnsPercent`), OTU (`otu`). Per dive: max depth vs `mod(fo2, limit)`
(red if exceeded, with the first offending segment named), total CNS %, total OTU, gas
`mixName`. Across dives: cumulative CNS % using `cnsAfterInterval()` (§4.1) with the label
"simplified 90-minute half-time model used by many dive computers; your computer's model may
differ", cumulative OTU vs the REPEX day-1 allowance only if `REPEX.verified` (§4.2).

Feedback panel (bulleted, `Callout`): one line per rule triggered:
- "Segment 2 is deeper than the MOD of EAN36 at 1.4 ata (28 m)." (`danger`)
- "PPO2 exceeds 1.6 ata in segment 3." (`danger`)
- "CNS exposure reaches 85 % of the NOAA single-exposure limit." (`warn`)
- "A richer mix (EAN32) would keep PPO2 ≤ 1.4 ata at 33 m with less nitrogen." (`insight`;
  compute with `bestMix`)
- "Nothing here checks your no-decompression limit; use your computer or tables." (always)

No NDL/decompression computation anywhere unless `NDL_TABLE.verified`.

### 3.6 Lab page

`src/features/lab/LabPage.tsx`: add tools `analyzer` (VirtualAnalyzer free mode + CylinderLabel),
`exposure` (OxygenExposureExplorer with segments), `planner` (DivePlanner repetitive). Remove
the "coming soon" chip and the `lab.comingSoon` string from both locale files. Add the lab
achievements in §8.4.

---

## 4. Science additions (`src/science/`)

All new functions: pure, validated, documented with the formula and source in a JSDoc comment,
exported from `src/science/index.ts`, tested in `src/science/__tests__/`.

### 4.1 `cns.ts` — multi-dive CNS accounting

```ts
/** Half-time used by the common simplified surface-interval model (see limits.ts CNS_HALFTIME_MIN). */
export function cnsAfterInterval(cnsPercent: number, surfaceIntervalMin: number): number
// = cnsPercent * 0.5 ** (surfaceIntervalMin / CNS_HALFTIME_MIN); never below 0; identity at 0 min.

export interface DivePlanInput { fo2: number; segments: { depth: number; minutes: number }[]; unit?: DepthUnit }
export interface DiveExposure { cnsPercent: number | null; otu: number; maxPpo2: number; maxDepth: number; segments: (ExposureSegment & { depth: number; ppo2: number })[] }
export function diveExposure(input: DivePlanInput, unit?: DepthUnit): DiveExposure
// Uses gasAtDepth + totalExposure. cnsPercent null if any segment PPO2 > 1.6.

export function repetitiveExposure(dives: DivePlanInput[], surfaceIntervalsMin: number[]): { perDive: DiveExposure[]; cumulativeCns: (number | null)[]; cumulativeOtu: number }
// cumulativeCns[i] = cnsAfterInterval(cumulativeCns[i-1], interval[i-1]) + perDive[i].cnsPercent
```

Add to `limits.ts`:
```ts
/** Simplified CNS surface-interval decay used by many dive computers and recreational texts. Not from NOAA. */
export const CNS_HALFTIME_MIN = 90;
```

Tests: 90 min halves the value; 180 min quarters it; 0 min identity; a 30-min dive at 1.4 ata
→ CNS 20 %; two such dives with a 90-min interval → 10 % + 20 % = 30 %; any segment at 1.7 ata
→ `cnsPercent === null`.

### 4.2 `ndl.ts` — verification-gated table

```ts
export interface NdlTable {
  source: string;        // e.g. 'US Navy Diving Manual Rev 7 (2016), Table 9-7, air no-decompression limits'
  unit: 'ft';
  verified: boolean;     // MUST stay false until a human has checked every row against the printed source
  rows: { depthFt: number; ndlMin: number }[];
}
export const NDL_TABLE: NdlTable = { source: '…', unit: 'ft', verified: false, rows: [] };
export function airNdl(depth: number, unit: DepthUnit): number | null // null when !verified or deeper than table; rounds depth UP to the next table row
```

Do not type any row values unless you are transcribing them from the printed source and a
human will check them. The UI (§3.1, §3.5) hides NDLs while `verified === false`.
The same pattern applies to `REPEX_DAILY_OTU_ALLOWANCE`: wrap it as
`REPEX = { verified: false, source: 'Hamilton et al. 1988, NOAA REPEX', allowance: {...} }`
and hide multi-day values until verified. (Day-1 850 OTU is widely reproduced; still gate it.)

### 4.3 `analyzer.ts` — galvanic-cell simulation model

Deterministic, time-stepped, seedable. No DOM.

```ts
export type AnalyzerFaultId =
  | 'none'
  | 'not-calibrated'        // CAL left at factory offset: reads e.g. 19.4 in air
  | 'calibrated-on-wrong-gas' // user calibrated to 20.9 while sampling the cylinder
  | 'aging-cell'            // output low: cannot reach 20.9 even at max CAL; drifts down
  | 'unstable-cell'         // reading jumps ±0.5–1.0 randomly (seeded)
  | 'flow-too-high'         // > 3 L/min: reads ~0.5–1.0 high (pressurisation of the sensor)
  | 'flow-too-low'          // < 0.5 L/min: rises very slowly, never reaches true value in time
  | 'residual-gas'          // previous sample (e.g. 36 %) still in the sensor cup: starts high, decays
  | 'temperature'           // cold cell: slow response (time constant ×3)
  | 'low-battery';          // display dims/blinks, reading sticks

export interface AnalyzerState {
  seed: number;
  powered: boolean;
  calOffset: number;          // knob position, −3.0 … +3.0 (% O2 added to raw output)
  cellGain: number;           // 1.0 healthy; 0.85 aging
  flowLpm: number;            // 0 … 5
  sampling: boolean;          // valve open on the cylinder
  trueFo2: number;            // cylinder contents
  ambientFo2: number;         // 0.209
  sensorFo2: number;          // gas actually at the sensor (lags behind the source)
  display: number;            // what the LCD shows (% O2, 1 decimal)
  tSeconds: number;
  fault: AnalyzerFaultId;
}

export function createAnalyzer(opts: { trueFo2: number; fault?: AnalyzerFaultId; seed?: number }): AnalyzerState
export function analyzerStep(s: AnalyzerState, dtSeconds: number): AnalyzerState
export function analyzerSetCal(s: AnalyzerState, calOffset: number): AnalyzerState
export function analyzerSetFlow(s: AnalyzerState, flowLpm: number): AnalyzerState
export function analyzerSample(s: AnalyzerState, on: boolean): AnalyzerState
export function analyzerIsStable(history: number[], windowSec: number, tol: number): boolean
export function describeFault(id: AnalyzerFaultId): { symptom: string; cause: string; action: string }  // keys into i18n, not text
```

Model (document these constants in the file; they are *teaching* approximations, not
manufacturer data, and the UI must say so once in `sim.analyzer.modelNote`):

- Source gas at the sensor: `source = sampling ? trueFo2 : ambientFo2`. Flow effect on the
  time constant: `tau = clamp(12 / max(flowLpm, 0.2), 4, 90)` seconds; `temperature` fault ×3.
  `sensorFo2 += (source − sensorFo2) * (1 − exp(−dt / tau))`.
- Raw output: `raw = sensorFo2 * 100 * cellGain`.
- Display: `display = round1(raw + calOffset + flowBias + noise)` where
  `flowBias = flowLpm > 3 ? 0.3 * (flowLpm − 3) : 0`; `noise` = seeded ±0.05 normally,
  ±0.7 for `unstable-cell`; `low-battery` freezes `display` every other second.
- `aging-cell`: `cellGain = 0.85` and decreases by 0.001 per minute of sampling.
- `residual-gas`: initial `sensorFo2 = 0.36`.
- `not-calibrated`: initial `calOffset = −1.5`.
- `calibrated-on-wrong-gas`: scenario starts with `sampling = true` and the guided step 2 is
  performed on cylinder gas; detection is by the learner noticing the later air reading ≠ 20.9.

Tests: healthy analyzer calibrated at 20.9 sampling 0.32 at 2 L/min reads 32.0 ± 0.2 after
60 s; flow 5 L/min reads ≥ 32.5; aging cell cannot exceed 20.9 − 2 at calOffset +3 in air;
`analyzerIsStable` true when last 10 s vary < 0.1; same seed → identical trajectory.

---

## 5. Chapter specifications

Chapter files: `src/content/chapters/chNN.json`; questions `src/content/questions/chNN.json`;
topic ids in `topics.json`. Lesson ids `chNN-lMM`; question ids `chNN-qMM`; predict ids
`chNN-lMM-predict-K`. Reuse the English and Hebrew tone of Chapters 1–2.

Each lesson below lists: **title** · topics · blocks to include (in order) · the facts you may
state (all from §9). Write the prose yourself in both languages.

### 5.3 Chapter 3 — Nitrox and Decompression (`ch03`, icon `deco`)

Topics: `nitrogen-loading`, `ndl-concept`, `ead`, `computers-repetitive`.

- **l01 How nitrogen gets in and out** · text (absorption with time and PPN2; elimination on
  ascent; "off-gassing" needs time; bubbles if too fast) · interactive `depth-ppo2` with
  `showN2: true` · predict ("double the depth from 10 to 20 m: PPN2 goes from 1.58 to 2.37",
  options with 3.16 as the gauge-pressure trap) · question · keypoints.
- **l02 The no-decompression limit** · text (definition; depends on depth and time; shorter
  deeper; set by tables/computers; direct ascent possible within it; "it is not a safe/unsafe
  line but a risk boundary") · callout `standard` ("NDLs differ between tables, computers and
  conservatism settings; this app does not publish them") · example (air at 18 m vs 30 m
  qualitatively) · predict · question.
- **l03 Why Nitrox extends the NDL** · interactive `ndl-compare` · text (less PPN2 → slower
  loading → longer NDL at the same depth) · callout `safety` ("Nitrox does not remove
  decompression risk; exceeding the Nitrox NDL is as risky as exceeding the air NDL").
- **l04 Equivalent Air Depth** · formula `EAD = ((1 − FO2) × (D + 10) ÷ 0.79) − 10` with
  legend · example EAN32 at 30 m → 24.4 m (round **up** to 25 m for table lookup) ·
  interactive `ead-explorer` · predict · 2 numeric questions (EAN36 at 30 m → 22.4; EAN32 at
  100 ft → 81.5).
- **l05 Nitrox and dive computers** · text (set the measured FO2 and the PPO2 limit; the
  computer then tracks nitrogen *and* oxygen; wrong gas setting = wrong both ways; air-setting
  on Nitrox = conservative for nitrogen, blind to oxygen) · compare table (computer set to Air
  / set to measured mix / set to richer mix than breathed) · question (scenario).
- **l06 Repetitive diving on Nitrox** · text (residual nitrogen; surface interval; Nitrox
  helps second/third dives; oxygen exposure also accumulates: preview of Chapter 4) · predict ·
  question · keypoints.
- Assessment: 10 questions. References: TDI EAD article, BSAC workbook (already in ch02),
  DAN "Stick to your MOD".

### 5.4 Chapter 4 — Oxygen Exposure and Toxicity (`ch04`, icon `oxygen`)

Topics: `cns-toxicity`, `pulmonary-toxicity`, `exposure-accounting`, `warning-signs`.

- **l01 Oxygen under pressure** · text (oxygen essential at 0.21; toxic at elevated PPO2 over
  time; two kinds: CNS and pulmonary) · interactive `depth-ppo2` (`fo2Options: [0.21, 0.36, 0.40]`,
  `showN2: false`) · predict · question.
- **l02 CNS oxygen toxicity** · text (convulsion is the gravest outcome; can occur without
  warning; underwater a convulsion is likely to lead to drowning; risk rises with PPO2,
  duration, exertion, CO2 retention, cold, individual variation day to day) · callout `safety`
  (response: signal buddy, controlled ascent, end the dive; symptoms may follow a PPO2 drop) ·
  question.
- **l03 Warning signs and why you cannot rely on them** · terms block with the ConVENTID
  mnemonic (Convulsions, Visual disturbance, Ears (tinnitus), Nausea, Twitching (facial),
  Irritability/anxiety, Dizziness) · text ("signs are listed so you recognise them, not so you
  can wait for them: frequently there is no warning") · question.
- **l04 Pulmonary toxicity and OTUs** · text (Lorrain Smith effect: lung irritation after long
  exposure at lower PPO2, chest tightness, cough, reduced vital capacity; matters for
  multi-day intensive diving more than a single recreational dive) · formula
  `OTU = t × ((PPO2 − 0.5) ÷ 0.5)^0.83` · example 1.4 ata for 100 min → 163 OTU · callout
  `standard` (daily allowances exist (REPEX); shown only when verified) · question.
- **l05 The NOAA limits and the CNS clock** · compare table of the NOAA single-exposure column
  (1.6→45, 1.5→120, 1.4→150, 1.3→180, 1.2→210, 1.1→240, 1.0→300) and the 24-h column ·
  formula `CNS % = minutes ÷ limit × 100` · interactive `oxygen-exposure` · example EAN32 at
  30 m (1.28 → use the 1.3 row, 180 min) for 45 min → 25 % · predict · 2 numeric questions.
- **l06 Managing exposure across a day** · text (sum the clock across dives; simplified
  90-minute half-time decay used by many computers, clearly labelled simplified; plan richer
  mixes shallower; keep PPO2 ≤ 1.4 for working dives) · interactive `oxygen-exposure`
  (`segments: true`) · callout distinguishing teaching model vs computer models · question ·
  keypoints.
- Assessment: 10. References: DAN "Understanding Oxygen Toxicity", DAN Oxygen Toxicity health
  resource, Donald 1947, NOAA Diving Manual exposure table, Hamilton REPEX.

### 5.5 Chapter 5 — Maximum Operating Depth (`ch05`, icon `mod`)

Topics: `mod-definition`, `mod-calculation`, `limits-planning-vs-contingency`.

- **l01 What MOD is** · text (depth at which PPO2 reaches the chosen limit; per mix; per
  limit) · interactive `mod-explorer` · predict · question.
- **l02 Calculating MOD** · formula · interactive `mod-calculator` (`limits: [1.4, 1.6]`) ·
  example EAN36 at 1.4 → 28.9 → 28 m · compare table of MODs for EAN28/32/36/40 at 1.4 and
  1.6 (compute with `mod()`: 40/33/28/25 and 47/40/34/30 m) · 3 numeric questions (metric and
  one imperial: EAN32 at 1.4 → 111 ft).
- **l03 Working limit versus contingency** · text (1.4 ata working, 1.6 ata contingency as
  commonly taught; agencies differ; 1.6 reserved for short, low-exertion, e.g. unplanned
  excursion, never a target; many agencies discourage 1.6 entirely for recreational divers) ·
  callout `standard` (provenance) · question.
- **l04 A limit, not a target** · text (gauge error, currents, inattention; plan shallower;
  compute from the analyzed mix; write it on the label) · interactive `cylinder-label`
  (`editable: false`, `fo2: 0.32`) · scenario-style question (EAN36 for a 36 m plan) ·
  keypoints.
- Assessment: 10 (mostly calculation).

### 5.6 Chapter 6 — Analyzing a Nitrox Cylinder (`ch06`, icon `analyzer`)

Topics: `why-analyze`, `analyzer-principles`, `calibration`, `analysis-procedure`, `labeling`.

- **l01 Why every cylinder is analyzed** · text (blending errors, mislabels, bank mixes vary;
  the diver is responsible; "you dive the mix you measured") · scenario-style question.
- **l02 Inside the analyzer** · terms (galvanic/electrochemical cell, membrane, electrolyte,
  anode/cathode, output proportional to PPO2 not percentage, consumable: 2–5 year life,
  accuracy ≈ ±1 % O2) · text (cell measures partial pressure: temperature, humidity and
  pressure at the sensor matter) · question.
- **l03 Calibration and why it is not validation** · text (single-point in air at 20.9 %;
  two-point with 100 % O2 where available; calibration sets the scale, validation checks it
  on a known gas; an aging cell may still "calibrate" and read wrong) · interactive
  `virtual-analyzer` (`mode: 'guided'`, `trueFo2: 0.32`) · question.
- **l04 Flow, drift and failure modes** · text (steady low flow 1–3 L/min via a restrictor;
  too much flow pressurises the cell and reads high; too little is slow; temperature; residual
  gas; unstable readings = replace the cell; battery) · interactive `virtual-analyzer`
  (`mode: 'free'`, `scenario: 'flow-too-high'`) · 3 `instrument` questions (ask `fault`).
- **l05 Reading, recording and labeling** · text (wait for stable; read; record in the log;
  label O2 %, MOD, date, initials; the cylinder band is not a measurement) · interactive
  `cylinder-label` (`editable: true`) · `parameter` question (set the MOD for the analyzed mix).
- **l06 Verification before the dive** · text (re-check label vs plan vs computer setting;
  buddy check includes the mix; if in doubt, re-analyze) · callout `safety` ("a simulator
  cannot replace practical training with a real analyzer under supervision") · question ·
  keypoints.
- Assessment: 10 incl. 3 instrument questions.

### 5.7 Chapter 7 — Dive Planning (`ch07`, icon `planning`)

Topics: `choosing-a-mix`, `profile-comparison`, `exposure-budget`, `computer-setup`, `verification`.

- **l01 Choosing the mix** · text (target depth → best mix via `bestMix`, round down; prefer
  standard mixes; shallower plan → richer mix) · interactive `mod-explorer` · `parameter`
  question (choose an FO2 for 28 m at 1.4: accept 28–35 %).
- **l02 Air versus Nitrox for the same dive** · interactive `air-vs-nitrox` · text (what
  changes and what does not: PPN2 down, PPO2 up, gas consumption same, narcosis same).
- **l03 Budgeting oxygen exposure** · interactive `dive-planner` · worked example of two
  dives · question.
- **l04 Setting up the dive computer** · text (enter measured FO2; set the PPO2 alarm to the
  planning limit; understand what the computer does at the MOD; never set a richer mix than
  breathed) · compare table · question.
- **l05 Repetitive dives and surface intervals** · interactive `dive-planner`
  (`repetitive: true`) · text (nitrogen and oxygen both carry over; richer mix on the shallower
  second dive; model caveat) · question.
- **l06 Operational margins and verification** · text (plan 2–3 m above MOD; verify cylinder
  label vs plan vs computer; buddy check) · callout `safety` · question · keypoints.
- Assessment: 10.

### 5.8 Chapter 8 — Equipment and Operational Procedures (`ch08`, icon `equipment`)

Topics: `oxygen-compatibility`, `cylinder-identification`, `filling-handling`, `pre-dive-checks`.

- **l01 Oxygen and equipment** · text (oxygen supports combustion; at high PPO2, oils,
  greases and some materials can ignite; "oxygen-clean" = cleaned of hydrocarbons;
  "oxygen-compatible" = materials rated for oxygen; the risk is at filling pressure, not at
  breathing pressure).
- **l02 Rules and where they come from** · compare table: US practice (equipment used with
  ≤ 40 % O2 often treated as standard, per common US industry practice, while CGA G-4.1 and
  DOT treat > 23.5 % as an oxidizer, and DAN calls the "40 % rule" a long-held misconception),
  Europe (EN 144-3 M26×2 valve for mixes > 22 %), always (fill equipment and any cylinder
  filled by partial-pressure blending must be oxygen-clean) · callout `standard` ("follow your
  agency, the manufacturer and local regulation; this app describes, it does not authorise").
- **l03 Cylinder identification** · interactive `cylinder-label` · text (green/yellow band or
  Nitrox sticker = designated cylinder; the analysis tag = contents; some regions use other
  colours; a dedicated Nitrox cylinder is never filled with unknown gas).
- **l04 Filling methods (awareness only)** · text (partial-pressure blending, continuous
  blending, membrane systems; recreational Nitrox divers do not blend; all require trained
  operators and oxygen-clean paths) · question.
- **l05 Pre-dive checks and common errors** · terms (BWRAF-style check extended with "Mix":
  analyze, label, computer set, MOD agreed with buddy) · compare table of common errors and
  their fixes (skipped analysis; wrong computer FO2; label from the fill station only; mixed-up
  cylinders on a boat; dived the MOD; forgot CNS from dive 1) · question · keypoints.
- Assessment: 8. References: CGA G-4.1, DAN oxygen-cleaning article, EN 144-3.

### 5.9 Chapter 9 — Real-World Scenarios (`ch09`, icon `scenarios`)

Each lesson is one `scenario` block (§6) plus a short intro `text` and a `keypoints`.
Scenario ids and required teaching point:

| id | Situation | Correct path | Must teach |
|---|---|---|---|
| `sc-deep-ean36` | EAN36 cylinder, boat briefing says 34 m | Decline the depth or swap cylinder; agree a shallower max | MOD 28 m at 1.4; PPO2 at 34 m = 1.58 |
| `sc-wrong-label` | Label says 32 %, analyzer reads 36 % (stable, calibrated) | Trust the analysis; re-label; recompute MOD; adjust plan/computer | MOD changes 33 → 28 m |
| `sc-unstable-analyzer` | Reading jumps 30–34 | Do not dive on it; try another analyzer/cell; recalibrate; if no stable reading, no Nitrox dive | unstable = unusable |
| `sc-wrong-computer-gas` | Computer left on Air while breathing EAN32 | Nitrogen tracking conservative, oxygen untracked; fix before descent; if noticed at depth, respect MOD manually and ascend if near it | which direction each error goes |
| `sc-ndl-vs-mod` | Diver thinks "I'm within NDL so I'm fine" at the MOD | Two independent limits; MOD binds first on rich mixes | NDL ≠ MOD |
| `sc-repetitive-cns` | Three EAN36 dives to 25 m, 50 min each, short intervals | Budget CNS; longer intervals or leaner mix / shallower | CNS sums; 1.26 ata → 1.3 row, 180 min: 50 min = 27.8 % per dive |
| `sc-swap-cylinder` | Boat crew hands a "same mix" cylinder between dives | Analyze it anyway; label; set computer | never dive an unverified cylinder |

Assessment: 8 scenario-based questions reusing the same situations with different framing.

### 5.10 Chapter 10 — Exam Preparation (`ch10`, icon `exam`)

Not a lesson chapter: `lessons` holds one short lesson "How to use the practice tools" and the
chapter page links to `/practice`. Question bank target: **≥ 150** questions total, at least
12 per chapter, covering every topic id, ≥ 30 calculations, ≥ 15 scenarios, ≥ 6 instrument,
≥ 6 parameter. All original, both languages, with explanations and misconceptions.

---

## 6. Scenario engine

### 6.1 Schema (`src/content/scenarios/*.json`, `Scenario` in `schema.ts`)

```ts
export const ScenarioNode = z.object({
  id: z.string(),
  text: LocalizedString,                           // situation at this node
  interactive: InteractiveRef.optional(),          // e.g. show the analyzer face or planner state
  choices: z.array(z.object({
    id: z.string(),
    label: LocalizedString,
    quality: z.enum(['best', 'acceptable', 'poor', 'dangerous']),
    consequence: LocalizedString,                  // what happens next, factual
    explanation: LocalizedString,                  // why; cite the rule
    next: z.string().nullable(),                   // next node id or null = end
  })).min(2),
});
export const Scenario = z.object({
  id: z.string(),
  chapterId: z.string(),
  topic: z.string(),
  title: LocalizedString,
  setup: LocalizedString,
  startNode: z.string(),
  nodes: z.array(ScenarioNode).min(1),
  debrief: LocalizedString,                        // shown at the end regardless of path
});
```

Validation in `content/index.ts`: every `next` resolves; `startNode` exists; no cycles; every
node has exactly one `best` choice; a `dangerous` choice never leads to a node that ends
without a `safety` statement (enforce: nodes reached only via `dangerous` must have `text`
containing the string "{{SAFETY}}" replaced at render by the standard safety line — simpler:
require `consequence` of `dangerous` choices to be ≥ 80 chars).

### 6.2 Player (`src/simulations/ScenarioPlayer.tsx`, id `scenario`)

Props: `{ scenarioId: string }`. State: `path: { nodeId, choiceId }[]`. Shows the setup, the
current node text (optional interactive), choices as radio-like cards (keyboard: reuse
`rovingRadioKeyDown`), then after choosing: consequence, explanation, a quality badge
(`best` safe-green, `acceptable` accent, `poor` warn, `dangerous` danger) and "Continue".
At the end: a path summary (each choice with its quality), the debrief, "Try another path".
Records one `Attempt` per choice: `questionId = `${scenarioId}:${nodeId}``,
`correct = quality === 'best' || quality === 'acceptable'`, `context: 'lesson'`.
Store: add `scenarioRuns: Record<string, { bestPathFound: boolean; runs: number }>` to
`ProgressState` (+ `sanitisePersisted`, `partialize`, backup).

---

## 7. Exam engine (`src/features/practice/`)

### 7.1 Building an exam

`src/assessment/exam.ts`:

```ts
export function buildExam(config: ExamConfig, bank: Question[], seed: number): Question[]
// For each chapterId in blueprint take N questions by seededShuffle of that chapter's questions,
// preferring questions NOT answered correctly in the last 7 days (pass attempts in), then fill.
// Throws if the bank cannot satisfy the blueprint (content test asserts it can).
export function scoreExam(questions: Question[], answers: (Answer | null)[]): { correct: number; total: number; byChapter: Record<string, { correct: number; total: number }>; byTopic: … ; passed: boolean }
export function readiness(attemptsAndExams): { level: 'not-ready' | 'getting-there' | 'ready'; reasons: LocalizedKey[] }
// Deterministic: 'ready' iff ≥ 2 mock exams passed (≥ passScore) in the last 30 days AND no topic at mastery level 'weak' AND every chapter assessment passed. Say in UI: "a study readiness estimate, not a prediction of official exam results".
```

### 7.2 Mock exam page (`/practice/exam/:examId`)

Focus layout (like `AssessmentPage`). Differences: answers are **not graded until submission**
(the learner may navigate between questions, flag questions, change answers); a question
grid shows answered/flagged; timer (if `timeLimitMinutes`) in the header with a warning at
5 min and auto-submit at 0; `beforeunload` confirm while in progress; on submit: results with
score, pass/fail (labelled unofficial), per-chapter breakdown, then **Review mode** listing
every question with the learner's answer, the correct answer and the explanation; "Add missed
questions to review" (they already enter spaced review through `recordAttempt` with
`context: 'practice'`). Store: `examResults: { examId, at, correct, total, passed, timeUsedSec }[]`.
Persist in-progress exam state in `sessionStorage` (key `nitrox:exam:<id>`) so a reload does
not lose it; clear on submit.

### 7.3 Practice hub additions

Cards: Mock exam A/B (timed 60 min, 40 questions: 4 per chapter), Untimed mock, Calculation
drill (20, chapters 2/3/4/5/7), Scenario drill (15), plus the existing quick quiz, review and
by-topic. Readiness panel (from `readiness()`), mastery dashboard: a grid of all topics with
level badges and sparkline of the last 10 attempts (SVG, LTR).

---

## 8. Phase 4 polish

### 8.1 Code splitting
Route-level `React.lazy` for `LabPage`, `AssessmentPage`, `QuizPage`, `ExamPage`,
`ScenarioPlayer`, `VirtualAnalyzer`, `DivePlanner` with a `Suspense` fallback that reuses the
launch-screen look. Keep the main chunk < 350 kB gzipped. Verify with `npm run build` output.

### 8.2 Accessibility pass (checklist)
Every interactive SVG has `role="img"` + translated `aria-label`; every slider has a label and
`aria-valuetext`; focus is visible on all controls; all `role="radio"` groups use
`rovingRadioKeyDown`; colour is never the only signal (badges carry text); `prefers-reduced-motion`
disables drift/pulse/transition animations (already wired via `useReducedMotion`); contrast of
`text-muted` on `bg-surface` ≥ 4.5:1 in both themes (adjust tokens if not).

### 8.3 Browser verification harness
Copy the pattern from the Phase 1 scripts: launch Chromium via
`createRequire('/usr/lib/node_modules/x.js')('playwright')` on this machine (plain
`require('playwright')` elsewhere), open each route at 390 and 1440 px, `colorScheme`
dark/light, locale via `localStorage.setItem('nitrox:locale', …)` in `addInitScript`, assert
`document.documentElement.scrollWidth <= clientWidth + 2`, collect `pageerror` and console
errors. Keep scripts in the scratchpad, not in the repo.

### 8.4 Achievements to add (`AchievementId` + `achievements.*` strings in both locales)
`ch03-complete` … `ch09-complete`, `analyzer-certified-sim` ("Completed the guided analysis
without a fault"), `planner-first-plan`, `scenario-all-best` (found the best path in all 7),
`mock-passed`, `streak-7` (studied on 7 different days: add `studyDays: string[]` ISO dates to
the store, appended on any `recordAttempt`/`completeLesson`).

---

## 9. Verified facts you may state (and nothing else)

Physics and conventions (training conventions are labelled as such in the UI):
- `P_abs = depth/10 + 1` (msw), `depth/33 + 1` (fsw). True seawater ≈ 9.95 m per bar,
  ≈ 10.08 m per atm; fresh water ≈ 10.2 m per bar.
- Dalton: `PPgas = Fgas × P_abs`. Henry: dissolved gas ∝ partial pressure.
- `MOD = (PPO2_limit ÷ FO2 − 1) × 10` (33 for feet), **floor**. Best mix `= limit ÷ P_abs`,
  **floor** to whole %. `EAD = ((1 − FO2)(D + 10) ÷ 0.79) − 10` (33 for feet), **round up** for
  table lookup.
- Air for planning: 21 % O2 / 79 % N2; analyzer calibration 20.9 %. Dry air ≈ 78.08 % N2,
  20.95 % O2, 0.93 % Ar, 0.04 % CO2. Seawater is ≈ 800× denser than air.
- Recreational Nitrox training mixes: 22–40 % O2 (PADI, SDI, RAID; SSI EAN32/EAN40).
  EAN32 and EAN36 are the common standard mixes.
- Planning limits: 1.4 ata working / 1.6 ata contingency are **agency conventions** (DAN:
  1.6 "largely replaced" by 1.4; RAID: 1.4 planned, 1.6 contingency). NOAA's own Nitrox MOD
  tables use 1.6.
- NOAA oxygen exposure limits (single / 24 h, minutes): 1.6: 45/150; 1.5: 120/180; 1.4:
  150/180; 1.3: 180/210; 1.2: 210/240; 1.1: 240/270; 1.0: 300/300; 0.9: 360/360; 0.8:
  450/450; 0.7: 570/570; 0.6: 720/720. CNS % = time ÷ single limit; use the row at or above
  the PPO2. Table number/edition: to be confirmed against the printed manual (say "NOAA
  Diving Manual oxygen exposure limits").
- OTU = t × ((PPO2 − 0.5) ÷ 0.5)^0.83 (Bardin & Lambertsen; REPEX). 1 OTU = 1 min at 1.0 ata.
- 90-minute CNS half-time between dives: a **simplified model used by many computers**, not
  NOAA.
- CNS toxicity: convulsions frequently occur with no warning (Donald 1947; DAN); risk increases
  with exercise, CO2 retention; symptoms can appear during/after a PPO2 reduction (off-effect).
  Mnemonic ConVENTID. Response taught: signal buddy, controlled ascent, end the dive.
- Pulmonary (Lorrain Smith) toxicity: lung irritation from prolonged elevated PPO2; relevant to
  intensive multi-day diving; tracked with OTU.
- Narcosis: oxygen assumed at least as narcotic as nitrogen; Nitrox gives no narcosis benefit.
- Fatigue: reduced post-dive fatigue on Nitrox not reliably confirmed (Harris 2003; Chapman &
  Plato 2008).
- Analyzer: galvanic (electrochemical) cell; output ∝ PPO2; typical accuracy ≈ ±1 % O2;
  cell life ≈ 2–5 years; calibrate in air (20.9 %) before each use, optionally 100 % O2;
  steady low flow through a restrictor (manufacturers quote ≈ 1–5 L/min; teach 1–3); too much
  flow pressurises the cell and reads high; replace unstable cells.
- Labels: O2 %, MOD, date, analyst initials. A green/yellow band identifies a Nitrox-designated
  cylinder, not its contents.
- Oxygen service: US industry practice often treats ≤ 40 % as standard equipment while CGA
  G-4.1/DOT treat > 23.5 % as an oxidizer and DAN criticises the 40 % rule; EU EN 144-3 M26×2
  valves for > 22 %; fill equipment and partial-pressure-filled cylinders must always be
  oxygen-clean.
- Course performance requirements (generic): analyze a cylinder, compute MOD, label, set a
  computer for 22–40 %, plan within limits. Describe only generically.

Not available (gate behind `verified: false`): any NDL table values; REPEX multi-day OTU
allowances; exact PADI/SSI PO2 wording; NOAA table number.

---

## 10. Hebrew terminology (use exactly these)

| English | Hebrew |
|---|---|
| cylinder | מיכל (never בלון in prose; may mention once as colloquial) |
| gas blender (person) | מערבל הגזים (first mention), then מערבל הגזים / הבלנדר |
| at the surface | על פני המים |
| surface interval | הפסקת שטח |
| bottom time | זמן תחתית |
| no-decompression limit | גבול הזמן ללא דקומפרסיה (NDL); then ה־NDL. Never "גבול ה־NDL" |
| maximum operating depth | עומק הפעלה מרבי (MOD) |
| partial pressure | לחץ חלקי |
| absolute / gauge pressure | לחץ מוחלט / לחץ מד (לחץ יחסי) |
| equivalent air depth | עומק אוויר שקול (EAD) |
| narcosis | נרקוזה |
| oxygen toxicity (CNS / pulmonary) | רעילות חמצן (למערכת העצבים המרכזית / ריאתית) |
| decompression sickness | מחלת הדקומפרסיה |
| recreational diving agencies | ארגוני ההדרכה לצלילה ספורטיבית |
| liveaboard | ספארי צלילה (ליבאבורד) |
| buddy / stage cylinder / reef / current | באדי / מיכל סטייג׳ / שונית / זרם |
| analyzer / sensor cell / calibration | מנתח חמצן / תא חיישן / כיול |
| label (tag) | תווית (תג ניתוח) |
| dive computer | מחשב צלילה |
| simulator (UI tool) | סימולטור (never חוקר) |
| oxygen-clean | נקי־חמצן |
| fill station | תחנת המילוי |
| argon | הגז ארגון (never bare ארגון) |

Grammar: EANxx is feminine (תערובת): "EAN36 מגיעה", "EAN32 נותנת". Buttons use nouns or
infinitives (התחלה, סגירה, להמשיך ללמוד), never masculine imperatives. No comma before "או".
Letters for options: א/ב/ג/ד (already implemented). Use `{{ }}` for any inline formula or
mixed Latin/number run; `[[+1]]`, `[[1.4 ata]]` for numbers with signs/units.

---

## 11. Review checklist before each push

1. Recompute every number in new content by hand or with `src/science` in a scratch script.
2. Grep new Hebrew for: "בפני המים", "מרווח", "קרקעית", "גבול ה־NDL", "חוקר", "ארגון " (bare),
   "הספורטיביים"; all must be absent.
3. Every "N ata", "+1", formula or mixed run in Hebrew is isolated with `{{ }}`/`[[ ]]`.
4. Every new interactive renders at 390 px without overflow; sliders and numeric scales are
   LTR; nothing physical is mirrored.
5. Every new simulator shows the scope/disclaimer line; the analyzer shows its model note.
6. No new string presents 1.4/1.6, NDLs, or the 40 % rule as universal.
7. `npm run typecheck && npm test && npm run build` clean; built output committed.
