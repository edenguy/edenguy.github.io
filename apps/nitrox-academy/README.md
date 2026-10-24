# Nitrox Academy

Created and maintained by **Guy Eden** ([edenguy.github.io](https://edenguy.github.io)).

An interactive, bilingual (Hebrew first, English second) Progressive Web App for understanding
Enriched Air Nitrox: pressure, partial pressure, oxygen limits, MOD, EAD and dive planning.

**Nitrox Academy is an independent educational tool. It is not affiliated with any training
agency, it does not certify anyone, and nothing in it authorizes diving with enriched air.
Enriched Air diving requires a certification course with a recognized agency, including
in-person practical training.**

## Sources and responsibility

The content is original and based on published professional sources: the NOAA Diving Manual
oxygen exposure limits, DAN publications, public training-agency materials (BSAC, RAID, PADI,
SDI), industry standards (CGA G-4.1, EN 144-3) and peer-reviewed studies, all cited in the
chapters and listed in the app's About page and `docs/RESEARCH.md`. Every formula is tested
against reference values.

Nitrox Academy is a free educational website provided as is, without warranty. It does not
certify divers, it is not a dive computer, and it is not affiliated with any agency. All
diving decisions and their consequences are the sole responsibility of the diver; the site
and its operators accept no liability for injury, loss or damage connected to its use. The
learner acknowledges this on first use.

## Running it locally

```bash
cd apps/nitrox-academy
npm install
npm run dev          # http://localhost:5173/nitrox-academy/
```

Other scripts:

```bash
npm test             # scientific engine, assessment engine and content validation
npm run typecheck    # strict TypeScript, no emit
npm run build        # production build into ../../nitrox-academy (served by GitHub Pages)
npm run preview      # serve the production build locally
npm run check        # typecheck + test + build
```

The published build lives at the repository root in `nitrox-academy/` so GitHub Pages serves it
at `https://edenguy.github.io/nitrox-academy/`. The build output is committed deliberately;
run `npm run build` and commit the result whenever the app changes.

## Architecture

The modules are deliberately separate so the remaining chapters can be written without touching
application code.

| Layer | Location | What lives there |
|---|---|---|
| Scientific engine | `src/science/` | Pure, dependency-free functions: pressure, Dalton's law, MOD, best mix, EAD, CNS and OTU. No React, fully testable, works offline. |
| Published limits | `src/science/limits.ts` | NOAA exposure table, the 1.4 / 1.6 ata planning limits and the OTU model, each with its source in a comment. |
| Content | `src/content/` | Chapters, lessons and questions as JSON, validated by Zod schemas at load. |
| Assessment | `src/assessment/` | Deterministic grading, mastery scoring and spaced-repetition review scheduling. |
| Progress | `src/progress/` | Zustand store persisted to IndexedDB; settings, completions, attempts, achievements. |
| Simulations | `src/simulations/` | SVG instruments and explorers, referenced from content by id. |
| Localization | `src/i18n/` | UI strings per language; lesson text carries its own translations. |
| UI | `src/components/`, `src/features/` | Primitives and the page-level features. |

### Adding a chapter

1. Write `src/content/chapters/chNN.json` against the `Chapter` schema in `src/content/schema.ts`.
   Every learner-facing string is `{ "en": "...", "he": "..." }`.
2. Write its questions in `src/content/questions/chNN.json`.
3. Register the topics it teaches in `src/content/topics.json`.
4. Import it in `src/content/index.ts` (and remove its placeholder from `roadmap.json`).
5. Run `npm test`. The content tests check schema validity, question references, Hebrew coverage
   and that every lesson teaches, checks and summarises.

No React component needs to change. To embed a simulation in a lesson, use an `interactive` block
with a component id from `InteractiveId`; the registry in `src/simulations/index.tsx` resolves it.

### Inline markup in lesson text

`**bold**`, `_italic_`, `{{FO2}}` for a scientific token rendered left-to-right in monospace, and
`[[1.4]]` for a number with tabular figures. Inline mathematics inside Hebrew prose must be
wrapped in `{{ }}` so the bidirectional algorithm does not reorder it.

## Scientific basis

Calculations use the standard dive-planning conventions and are covered by automated tests with
independently derived reference values:

- Absolute pressure: 10 msw per bar, 33 fsw per atmosphere. These are **training conventions**;
  real seawater is about 10.06 m per bar. Labelled as conventions wherever shown.
- Dalton's law: `PPO2 = FO2 × P_abs`, `PPN2 = FN2 × P_abs`.
- MOD: `(PPO2_limit ÷ FO2 − 1) × 10`, rounded **down** to the whole metre or foot.
- Best mix: `PPO2_limit ÷ P_abs`, rounded **down** to the whole percent.
- EAD: `((1 − FO2) × (D + 10) ÷ 0.79) − 10`, rounded **up** for conservative table lookup.
- Oxygen exposure: the NOAA Diving Manual oxygen exposure limits (single exposure and 24-hour),
  the CNS percentage method, and the Bardin & Lambertsen OTU model
  `t × ((PO2 − 0.5) ÷ 0.5)^0.83`.

Planning limits of 1.4 and 1.6 ata are **training-agency standards**, not physical constants, and
the interface says so wherever they appear. `docs/RESEARCH.md` records the sources, what was
verified directly and what still needs checking against a primary document.

### Still to verify before this is presented as certification preparation

- The NOAA 24-hour exposure column against a printed copy of the NOAA Diving Manual.
- Review by a qualified, currently certified diving instructor.

## Status

- **Phase 1 complete**: shell, dashboard, Hebrew/English with real RTL, themes, Chapters 1 and 2
  with full content, five interactive explorers, the assessment engine, progress persistence
  and the installable offline PWA.
- **Phases 2 to 4 outstanding**: Chapters 3 to 10, the virtual oxygen analyzer, the oxygen
  exposure explorer, the dive planning sandbox, interactive scenarios and full mock exams.
