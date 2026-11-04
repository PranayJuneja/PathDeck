# Path Deck — full MBBS scope

Requested location: `D:/Antigravity Projects/Path Deck`. This is a separate local project; no deployment or GitHub publication has been requested for Path Deck.

## Completion requirements

- Broad original study notes covering general pathology, hematopathology, and every major organ system in the MBBS pathology syllabus.
- A useful, locally stored atlas of licensed gross, microscopic, and explanatory images with source-level attribution and honest captions.
- Original, medically sourced vector mechanism diagrams. No invented photomicrographs or textbook scans.
- Polished responsive atlas: search, organ-system browsing, modality filters, zoom/pan, image filmstrip, notes and references.
- Side-by-side comparisons, image-based spotter practice, bookmarks and local progress.
- Recoverable offline downloads, installable PWA shell, accessible controls, reduced-motion support.
- Direct OpenAI GPT-6 Luna tutoring with reasoning disabled, Google authentication and a separate Path Deck quota/log namespace.
- Content/license/image integrity checks, API/security checks, browser testing on desktop/mobile, and a verified production build.

## Required visual baseline — user correction

The user explicitly requires the **same design as Tissue Deck**, by copying its actual code. The initial separate light-interface direction was rejected and has been removed.

`src/App.module.css`, `src/styles/global.css`, `src/components/TheoryPanel.module.css`, `src/components/ChatBot.module.css` and `src/components/Particles.jsx` are copied from Tissue Deck and remain byte-identical. `research/tissue-design-baseline.json` records their hashes; a test checks parity.

The original sidebar, dark aurora/grid/particles, glass panels, Roboto/JetBrains typography, linear slide controls, theory panel and chat bar remain. Pathology data, labels and per-image attribution are adapted. Additive tools live in `StudyTools.jsx` and `PathTools.css`: compact top-bar menu, comparison view, spotters, bookmarks, image filters and offline controls. They must not replace the baseline atlas appearance.

## Responsibilities

- Main agent: app, backend, integration, tests, quality review.
- Curriculum: `content/topics.json`, curriculum source notes.
- Sources: importer, Commons images and per-file licensing metadata.
- Diagrams: original SVG mechanism diagrams and metadata.

## Final verified state

Completed locally on 4 November 2026. The project is at `D:/Antigravity Projects/Path Deck`; the running production preview with local API routes is `http://127.0.0.1:5174/`.

- 207 original study entries across 19 systems; 181 linked references.
- 500 attributed Commons images plus 25 original SVG mechanism diagrams; all 207 topics have visual coverage.
- Final source-caption/contact-sheet curation removed 24 misleading/unrelated images; accepted public files exactly match the frozen catalogue.
- Original Tissue Deck core styles/particles remain byte-identical, checked against the saved baseline hashes. New tools are additive.
- The production build, lint, 20 automated tests, all image/caption/licence/checksum checks and a zero-vulnerability dependency audit passed.
- Browser checks cover desktop/mobile controls, comparisons, correct tutor-pane context, saved topics, spotter scoring, image-source details, explicit offline saving and retry after failure, cached fonts/images and reload.
- Real text, microscopy and SVG tutoring requests plus the separate Path Deck quota passed. Temporary test account and all three chat records were removed.
- No server secrets appear in the client bundle. API handlers fail closed for missing/invalid authentication.
- No Path Deck deployment or GitHub publication was requested or performed.

Verification limits and the source-citation review are preserved in `research/runtime-verification.json`, `research/content-integrity.json`, `research/qa-review.json`, `research/content-qa.md` and `research/curriculum-sources.md`. This is a broad MBBS atlas, not formal curricular accreditation, exhaustive rare-disease coverage or specialist diagnostic certification.
