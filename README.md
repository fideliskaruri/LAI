# learn-ai

An interactive web book teaching AI/ML from first principles through scroll-driven playgrounds. Each topic is one page: canvas pinned on the left, prose narrating on the right, canvas mutating as you scroll. The history of who discovered each idea is woven in as marginalia — Stevin's chain, Descartes's coordinates, Hamilton's bridge, Gibbs's notation.

The plan lives in [`PLAN.md`](./PLAN.md). The mathematical reference is *Mathematics for Machine Learning* (Deisenroth/Faisal/Ong, [mml-book.com](https://mml-book.com)).

## Run it

```powershell
npm install     # only on a fresh clone
npm run dev     # http://localhost:5173
```

## What's built

**M1 of the plan: Vectors as a complete chapter.** 15 acts, ~10 playables, full a11y wiring, mobile fallback, screen-reader narrative, end-of-chapter closer.

### Routes

| URL | What it is |
|---|---|
| `/` | The constellation hub. 26 topic glyphs; **Vectors** is the only active one (vermilion, pulsing). Hover any glyph to see its dependency edges. Use the persistent "Begin → Vectors" link if the metaphor isn't obvious. |
| `/vectors` | The full Vectors chapter — scroll from cold-open to closing. 15 acts; "Act N of 15" updates as you go; the `⋯` overflow menu has a share-link copier and a reduced-motion preview. |
| `/__split-canvas-test` | Internal proof of the split-canvas template. Four sync modes (independent / left-drives-right / right-drives-left / co-mutating). Used to validate the template before LinReg/PCA/etc consume it. |
| `/__test-mdx` | Day-one smoke test: MDX + KaTeX + embedded React component + react-router internal link. If this renders, all four integrations are wired. |

### Vectors — the 15 acts

| # | Act | Playable |
|---|---|---|
| 0 | The 1893 fight in *Nature* | static SVG of a journal page fragment |
| 1 | Stevin's wreath of spheres (1586) | wedge + 14-bead chain; drag any bead |
| 2 | Descartes & Pappus (1637) | empty plane; click to drop a point, drag |
| 3 | Point → arrow | drag the tip (changes components) vs drag the shaft (translation invariance) |
| 4 | The parallelogram | two vectors; parallelogram completes itself; degenerate-case prose-catch |
| 5 | Scalar multiplication | slider −2 to +2; flips at −1, vanishes at 0 |
| 6 | Pythagoras's magnitude | arrow + dashed right triangle + live `|v|` readout |
| 7 | Direction | arrow + angle arc + degrees/radians readout |
| 8 | Hamilton at Brougham Bridge (1843) | stylized bridge sketch + the carved `i² = j² = k² = ijk = −1` |
| 9 | Gibbs / Tait notation split | two columns; hover any row, the matching translation highlights |
| 10–13 | nD leap (2D → 3D → axes fade → numbers) | react-three-fiber, lazy-loaded; camera auto-orbits under no-reduced-motion |
| 14 | Stevin's chain → king as embedding | static visual; ties the chapter back to word2vec |

Every playable is keyboard-navigable (Tab to focus a handle, arrow keys to nudge, Shift+arrow for larger steps) and has a `CanvasNarrative` live-region that announces state changes to screen readers.

### Constellation hub

Twenty-six topics positioned in a 1280×800 SVG, hand-tuned to suggest the dependency flow: foundations bottom-left, modern AI top-right. Vectors is the only one with content; the other 25 are dimmed to 60% opacity to signal "not yet." Hovering any topic fades in its prereqs (back-edges, dashed vermilion) and dependents (forward-edges, dim grey). Mouse parallax drifts glyphs ~12px opposite the cursor, killed under `prefers-reduced-motion`.

## Tech stack (PLAN §10)

- **Build:** Vite 8 + React 19 + TypeScript strict
- **Styling:** Tailwind v4 (CSS-first config via `@theme`)
- **Content:** MDX from day one (`@mdx-js/rollup`) with `remark-math → rehype-katex` plugin chain
- **2D:** SVG declaratively + rough.js for decorative scaffolding
- **3D:** react-three-fiber + three.js (lazy-loaded, code-split)
- **Gesture:** `@use-gesture/react`
- **Math typography:** `react-katex` with STIX Two Math
- **Routing:** `react-router-dom` v7 with `BrowserRouter` + Cloudflare `_redirects` for SPA fallback
- **Fonts:** Source Serif 4 (body), Inter (UI), JetBrains Mono (numerics) — all via `@fontsource`

**Forbidden in v1:** Framer Motion, react-spring, Redux/Zustand, Next.js.

## Deploy (PLAN §10)

Cloudflare Pages. Build: `npm run build`. Output: `dist/`. Node 20.x via `.nvmrc`. `_redirects` in `public/`. GitHub Actions workflow at `.github/workflows/ci.yml` runs build + Playwright + Lighthouse CI (perf and a11y must score ≥ 90 on `/vectors`).

## Project structure

```
src/
├── main.tsx, App.tsx, index.css
├── routes/
│   ├── Hub.tsx
│   ├── topics/Vectors.tsx
│   └── __test/{TestMDX, SplitCanvasTest}.tsx
├── components/
│   ├── topic/{TopicPage, TopicPageSplit, Act, ActDots, CanvasNarrative, ChapterFooter, HeaderPopover}.tsx
│   ├── hub/{Constellation, Glyph, EdgeLayer, HubList}.tsx
│   └── ui/{DragHandle, NotFound}.tsx
├── playables/vectors/
│   ├── StevinWreath, CoordinatePlane, DraggableArrow, Parallelogram,
│   ├── ScalarMul, Magnitude, Direction, HamiltonBridge,
│   ├── NotationSplit, NDLeap, NDLeapScene3D, ColdOpenScene, ClosingThread
├── content/vectors/    ← MDX prose, one file per act
├── hooks/{useActState, useUrlHash, useKeyNudge, useNearViewport}.ts
└── data/constellation.ts
```

## What's next (PLAN §12)

M2 = Functions and Derivatives. Specs at PLAN §7.2 and §7.3. They consume the existing `TopicPage` template (no new abstraction needed). Estimated 4–6 sessions per the §12 budget.

The historical phase worktrees (`D:\code\learn-ai-phase-1` through `phase-9`) are still on disk as snapshots if you want to A/B against a specific phase. They're not needed for development — everything's at `master`.
