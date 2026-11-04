# Path Deck

A separate MBBS pathology atlas built directly from Tissue Deck’s frontend code. The original dark theme, glass surfaces, sidebar, microscope controls, particles, typography, theory layout and chat bar are preserved. Pathology-specific tools are additions to that interface.

## Run locally

Requires Node 24.12+ within the Node 24 LTS line. `.node-version` pins the tested patch.

```sh
npm ci
npm run dev -- --port 5174
```

Open [Path Deck locally](http://127.0.0.1:5174/). Both the development server and the local production preview serve `/api/chat` and `/api/usage`. This project has not been published or linked to a Vercel project.

For the complete offline/installable experience, run the production preview:

```sh
npm run build
npm run preview -- --port 5174
```

The finished local handoff uses this production preview at port 5174.

## Catalogue

- 207 conditions across 19 pathology systems.
- 500 individually attributed Wikimedia Commons images.
- 25 original mechanism diagrams; all 207 topics have visual coverage.
- Approximately 136 MiB of image assets, downloaded offline only when requested.
- 181 linked study references, plus diagram concept references and a source/QA ledger.

## Study workspace

- Search conditions, aliases, morphological features and stains.
- Browse general pathology, hematopathology and all major MBBS organ systems.
- Explore gross specimens, microscopy and diagrams with the original Tissue Deck zoom, pan, pinch and linear-image controls.
- Read original concise notes on definition, mechanism, gross appearance, microscopy, clinical connections, stains, differentials and viva cues.
- Open an image’s information button for its source, creator, original caption, licence and transformation details.
- Use **Study tools** in the top bar for side-by-side comparison, system-specific spotter practice, bookmarks, progress export and image-type filters.
- Save the atlas for offline study. The app shell, local fonts and icons are precached; image downloads show progress and can be retried. Visited images also cache automatically. AI and sign-in require an internet connection.

Bookmarks and spotter progress stay in this browser. Revealing a spotter answer disables scored answers for that question. A source image may itself contain labels; practice does not pretend these are hidden.

## Content and provenance

`content/topics.json` contains original study summaries and reference links. `content/media.json` contains per-file image provenance. `content/diagrams.json` describes original vector schematics.

The collection is a broad MBBS study atlas, not an exhaustive rare-disease reference or a claim of formal curricular accreditation. Source-caption matching and technical checks do not replace specialist slide review. Notes list a condition’s expected features across specimens; not every feature appears in each photographed field.

The image importer downloads only files with documented CC BY, CC BY-SA, CC0 or public-domain permissions. It retains source URLs, full creator credits, licence links, original descriptions, source revisions, checksums and transformation details. Copyrighted textbook scans, unknown/ambiguous licences, externally AI-generated pathology images and misleading differential-only matches are excluded. Libre Pathology and WebPath are linked as references; their text or entire image collections have not been copied wholesale.

Original mechanism diagrams are explicitly labelled schematics, not photomicrographs. Every image keeps its own licence. See [MEDIA-LICENSES.md](MEDIA-LICENSES.md), [source research](research/source-notes.md), [curriculum references](research/curriculum-sources.md), [content QA](research/content-qa.md), and the generated [integrity report](research/content-integrity.json).

Rebuild the media index with:

```sh
npm run media:import
npm run content:check
```

The importer is resumable, uses a descriptive Wikimedia User-Agent and caches API evidence outside the published app. Review its output and contact sheets before accepting new topic-image associations. It does not treat a search result as proof of a diagnosis.

## AI tutor

Chat uses the direct OpenAI Responses API with `gpt-6-luna`, `reasoning.effort: "none"` and `store: false`. There is no model selector or Vercel AI Gateway dependency.

Copy `.env.example` to `.env.local` for a fresh setup. Server keys must never use the `VITE_` prefix. Google sign-in uses the configured Firebase project. Path Deck has separate `path_deck_usage` and `path_deck_chat_logs` collections; it does not consume Tissue Deck’s monthly counter or write to its logs.

The server verifies Firebase ID tokens, enforces 100 accepted requests per UTC calendar month with an atomic Firestore transaction, validates message roles and lengths, and loads attached images only from the bundled catalogue. The tutor receives trusted topic notes and optionally the currently selected image. Original SVG diagrams are rasterized before sending to the model. Image bytes are not retained in chat logs; text questions and answers are logged as in Tissue Deck. Accepted attempts count even if generation later fails.

The ignored local environment reuses the existing Meded Firebase project. Production server secrets are configured in the separate Vercel `path-deck` project. If publishing under another hostname, add that hostname to Firebase’s authorised domains and configure its server environment.

## Production

- Live app: https://path-deck-code-2302s-projects.vercel.app/
- GitHub: https://github.com/PranayJuneja/PathDeck
- Production branch: `main`, connected to the separate Vercel `path-deck` project.
- Node.js runtime: 24.x. Local environment files and Vercel credentials are ignored by Git.

The stable production hostname is public. Vercel deployment protection remains enabled for preview URLs. Firebase authorises the production hostname for Google sign-in; tutor usage and logs continue to use the separate Path Deck collections.

## Verify

```sh
npm run lint
npm test
npm run content:check
npm audit
```

`npm test` builds the app and runs API/auth/quota validation, content/licence/checksum checks, safe Markdown and runtime compatibility tests, plus desktop/mobile browser checks covering the preserved design, comparisons, bookmarks, fair spotter scoring, source attribution, offline saving, local fonts and mobile gestures. Browser screenshots are saved under ignored `tests/artifacts/`.

## Project layout

```text
src/components/       Tissue Deck viewer, theory and chat components
src/App.module.css    Original Tissue Deck layout styles
src/styles/global.css Original Tissue Deck theme tokens
src/StudyTools.jsx    Additive top-bar study menu
src/Compare.jsx       Side-by-side pathology comparison
src/Practice.jsx      Image-based practice and local progress
content/              Original notes and attributed image catalogues
public/images/        Locally stored licensed specimens
public/diagrams/      Original vector mechanism schematics
server/ and api/      Authenticated direct OpenAI tutor
scripts/              Resumable import and integrity verification
research/             Source ledger, rejection evidence, contact-sheet QA
tests/                App, security, content and browser verification
```

Application source code is MIT licensed, retaining Tissue Deck’s original copyright notice. Media licensing is separate.
