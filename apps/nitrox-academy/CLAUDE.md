# Nitrox Academy — guidance for Claude

Bilingual (Hebrew-first, English-second) Progressive Web App teaching recreational divers
Enriched Air Nitrox theory. It is an educational tool, not a certification and not a dive
computer. Read this file before touching code here; it states rules the rest of the repo
assumes you already know.

Full curriculum spec for the unbuilt chapters and simulators: `docs/LLD.md`. Source list and
open verification items: `docs/RESEARCH.md`. User-facing setup and architecture: `README.md`.
This file is the short list of things that are easy to get wrong.

## Non-negotiable rules

1. **Never invent a number.** Every limit, table value, threshold or duration shown to a
   learner comes from `docs/LLD.md` §9 ("Verified facts"), `src/science/limits.ts`, or an
   existing chapter/question JSON. If a fact isn't there, gate it behind `verified: false`
   (see `docs/LLD.md` §4.2) and add it to `docs/RESEARCH.md` under "Open verification items"
   instead of guessing.
2. **Never copy** training-agency course text, exam questions, illustrations or branding.
   Describe publicly known standards in original wording and cite the public source in the
   chapter's `references`.
3. **Never suggest the numbers are unreliable.** The app states limits and responsibility
   plainly (see the first-run notice and the About page's "Sources and responsibility"
   section), but it must not make a learner distrust sourced, tested content. Don't soften a
   real limit and don't editorialize about uncertainty that isn't documented.
4. **Scenario and exam content never rewards an unsafe choice.** Consequences for a wrong
   answer state the correct procedure; an unsafe shortcut is never framed as acceptable.
5. **Bilingual parity is mandatory.** Every learner-facing string is `{ "en": "...", "he":
   "..." }`. UI strings need matching keys in `src/i18n/locales/en.json` and `he.json` (a test
   enforces this). Inline maths inside Hebrew prose must be wrapped in `{{ }}`; a standalone
   number with units goes in `[[ ]]`. This is a correctness rule (RTL bidi reordering), not a
   style preference.
6. **Git identity is fixed.** Every commit's author and committer must be `Guy Eden
   <edenguy@gmail.com>` — never re-signed as a Claude/Anthropic identity. This is the
   repository owner's explicit, standing choice (he keeps authorship over a "Verified"
   badge); do not change it even if a hook or tool suggests otherwise. A `Co-Authored-By`
   trailer in the commit body is fine and expected; the author/committer identity itself is
   not negotiable.
7. **Build output is committed.** The production build lives at the repository root in
   `/nitrox-academy` (GitHub Pages serves it directly) and is committed alongside the source
   that produced it — run `npm run build` and commit the result whenever the app changes. Do
   not hand-edit files under `/nitrox-academy`; edit the source under `apps/nitrox-academy/`
   and rebuild. Hand-editing the built `index.html` without rebuilding leaves a stale
   service-worker precache and the change silently never reaches returning visitors.

## Commands and definition of done

```bash
cd apps/nitrox-academy
npm install
npm run dev          # http://localhost:5173/nitrox-academy/
npm run typecheck    # strict TS, no emit — must be clean
npm test             # vitest — must be green
npm run build        # writes ../../nitrox-academy (commit it)
npm run preview      # serve the production build on :4173
npm run check        # typecheck + test + build, in one shot
```

A change is done only when:

- `npm run typecheck`, `npm test` and `npm run build` are all clean.
- The built output in `/nitrox-academy` is committed together with the source.
- The feature was checked at ~390px and ~1440px width, in Hebrew (RTL) and English, in dark
  and light themes, with no horizontal overflow and no console errors.
- New science functions carry unit tests with hand-derived reference values in comments, plus
  boundary and invalid-input cases.

## Architecture (don't restructure this)

| Layer | Path | Rule |
|---|---|---|
| Science | `src/science/` | Pure functions only — no React, no i18n, no DOM. Inputs validated via `validate.ts`. |
| Limits | `src/science/limits.ts` | The only place published limits live, each with a provenance comment. |
| Content | `src/content/` | JSON validated by Zod schemas in `schema.ts` at load (`index.ts`). Never imports React. |
| Assessment | `src/assessment/` | `grade.ts` (deterministic grading), `mastery.ts` (mastery + spaced review). |
| Progress | `src/progress/store.ts` | Zustand + IndexedDB persistence. Extend only via `sanitisePersisted()` and `partialize`; bump `version` and add a `migrate` step for any shape change. |
| Simulations | `src/simulations/` | SVG instruments, registered by id in `index.tsx`; content refers to them by `InteractiveId`. |
| Features | `src/features/<area>/` | Pages. Routing is `HashRouter` in `src/app/router.tsx`. |
| UI | `src/components/ui/` | Primitives: `Button, Card, Badge, Callout, Readout, Slider, Segmented, ProgressRing, Rich, Icon, SpeakButton`. |
| i18n | `src/i18n/locales/{en,he}.json` | UI chrome strings only. Lesson text lives in content JSON with `{en, he}`. |

Tailwind v4 with design tokens from `src/styles.css` (`bg-surface`, `text-ink`, `text-muted`,
`text-accent`, `text-o2`, `text-n2`, `text-warn`, `text-danger`, `text-safe`). Use **logical**
spacing/alignment classes only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`) so
layout mirrors correctly under RTL. Numeric/physical scales (sliders, water columns, charts)
are wrapped in `dir="ltr"`; everything else follows document direction. Directional icons get
`rtl:-scale-x-100`.

## Adding a chapter

1. Write `src/content/chapters/chNN.json` against the `Chapter` schema in `schema.ts`.
2. Write its questions in `src/content/questions/chNN.json`.
3. Register the topics it teaches in `src/content/topics.json`.
4. Import it in `src/content/index.ts` and remove its placeholder from `roadmap.json`.
5. `npm test` — content tests check schema validity, question references, Hebrew coverage,
   and that every lesson teaches, checks and summarizes.

No React component needs to change for new content. To embed a simulation, use an
`interactive` content block with a component id from `InteractiveId`.

## Current status

- **Done:** app shell, Hebrew/English with real RTL, themes, Chapters 1–2 with full lessons
  and question banks, five interactive explorers, the assessment engine, IndexedDB progress
  persistence, the installable offline PWA, and the schema/science groundwork for Phases 2–4
  (`InteractiveId` extensions, `scenario`/`parameter`/`instrument` content types, `cns.ts`,
  `ndl.ts`, `analyzer.ts`).
- **Paused by the repository owner:** Chapters 3–10, the virtual oxygen analyzer UI, the
  oxygen exposure explorer, the dive planning sandbox, scenario engine, and exam engine. The
  roadmap entries exist in `chapters/roadmap.json` as `status: "coming-soon"` placeholders
  with no lessons yet. Do not start this work without being asked — follow `docs/LLD.md` when
  it resumes.
