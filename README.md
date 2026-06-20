# learn-ai

An interactive web book teaching AI/ML from first principles through scroll-driven playgrounds. Each topic is one page; the canvas is pinned, the prose narrates beside it, the canvas mutates as you scroll. The history of who discovered each idea is woven in as marginalia — Stevin's chain, Descartes's coordinates, Hamilton's bridge, Gibbs's notation.

The plan lives at [`PLAN.md`](./PLAN.md). The reference text for the math is *Mathematics for Machine Learning* (Deisenroth/Faisal/Ong, [mml-book.com](https://mml-book.com)).

## What's here

M1 of the plan, complete. **Vectors** ships as one fully-built topic with all 15 acts:

| # | Act | Playable |
|---|---|---|
| 0 | The 1893 fight in *Nature* | static SVG page-fragment mockup |
| 1 | Stevin's wreath of spheres (1586) | wedge + 14-bead draggable chain |
| 2 | Descartes & Pappus (1637) | empty plane, click to drop point, drag |
| 3 | Point → arrow | draggable tip + translation-invariant shaft |
| 4 | The parallelogram | two vectors v, w + sum diagonal + degenerate catch |
| 5 | Scalar multiplication | slider −2 to +2, flips at −1, vanishes at 0 |
| 6 | Pythagoras's magnitude | arrow + dashed right triangle |
| 7 | Direction | arrow + angle arc + degrees/radians readout |
| 8 | Hamilton at Brougham Bridge (1843) | stylized bridge sketch + the carved equation |
| 9 | Gibbs / Tait notation split | two-column hover-link translator |
| 10–13 | nD leap (2D → 3D → axes fade → numbers) | react-three-fiber lazy-loaded |
| 14 | Stevin's chain → king as embedding | static visual |

Plus the hub (constellation of 26 topics, only Vectors active), the split-canvas template (built, not yet consumed — proves the abstraction for LinReg/PCA/Attention etc), accessibility primitives (`CanvasNarrative`, `useKeyNudge`), mobile fallback, Playwright smoke tests, GitHub Actions CI with Lighthouse, Cloudflare Pages config.

## How to navigate the worktrees

Each phase of M1 lives in its own git worktree so you can test them independently. From `D:\code\`:

| Worktree | What it adds | Test |
|---|---|---|
| `learn-ai-phase-1` | TopicPage shell + scroll/hash hooks + Stevin's wreath end-to-end | `cd ...phase-1; npm run dev` → `/vectors` |
| `learn-ai-phase-2` | Full Vectors chapter (11 acts: cold-open → closing, except #nD) | same |
| `learn-ai-phase-3` | nD leap with react-three-fiber (4 sub-acts, lazy-loaded 3D scene) | same; scroll to nd-1 → nd-4 |
| `learn-ai-phase-4` | Split-canvas template + `/__split-canvas-test` page for all 4 sync modes | `npm run dev` → `/__split-canvas-test` |
| `learn-ai-phase-5` | `CanvasNarrative` + `useKeyNudge`. ScalarMul wired as the example | tab into scalar slider, arrow keys |
| `learn-ai-phase-6` | Constellation hub with all 26 topic glyphs + dependency edges on hover | `/` (root) |
| `learn-ai-phase-7` | Mobile pass: 900px breakpoint, vertical hub list on small screens | resize browser below 900px |
| `learn-ai-phase-8` | Production build passes TS strict + Playwright config + GH Actions CI | `npm run build`, `npm run test:e2e` |
| `learn-ai-phase-9` | Polish + this README + final docs | `npm run build` |

Each worktree is on its own branch (`phase-N`) and has a tag (`phase-N-done`). The `master` branch holds the phase-0 baseline (clean scaffold before any feature work).

**Phases 1–7** share `node_modules` via a Windows junction to `D:\code\learn-ai\node_modules` — no per-phase `npm install` needed.

**Phases 8–9** have their own `node_modules` because production builds and Playwright don't play nicely with junctions. Phase 8 ran `npm install` fresh; phase 9 junctions back to phase 8.

## Project structure (per PLAN §10)

```
src/
├── main.tsx, App.tsx, index.css
├── routes/
│   ├── Hub.tsx
│   ├── topics/Vectors.tsx
│   └── __test/{TestMDX,SplitCanvasTest}.tsx
├── components/
│   ├── topic/{TopicPage,TopicPageSplit,Act,CanvasNarrative}.tsx
│   ├── hub/{Constellation,Glyph,EdgeLayer,HubList}.tsx
│   └── ui/{DragHandle,NotFound}.tsx
├── playables/vectors/
│   ├── StevinWreath, CoordinatePlane, DraggableArrow, Parallelogram,
│   ├── ScalarMul, Magnitude, Direction, HamiltonBridge,
│   ├── NotationSplit, NDLeap, NDLeapScene3D, ColdOpenScene, ClosingThread
├── content/vectors/   ← MDX prose, one file per act
├── hooks/{useActState,useUrlHash,useKeyNudge,useNearViewport}.ts
└── data/constellation.ts   ← 26 topic positions + dependency edges
```

## Tech stack (PLAN §10)

- Vite 8 + React 19 + TypeScript strict + Tailwind v4 (CSS-first `@theme`)
- MDX from day one (`@mdx-js/rollup`) with `remark-math → rehype-katex` plugin chain
- react-three-fiber + three.js for 3D (lazy-loaded chunk)
- @use-gesture/react for drag; hand-rolled rAF for scroll-driven animation
- react-router-dom v7 with `BrowserRouter` + Cloudflare `_redirects` for SPA fallback
- react-katex with STIX Two Math
- Fonts: Source Serif 4 (body), Inter (UI), JetBrains Mono (numerics) — all via `@fontsource`

**Forbidden in v1:** Framer Motion, react-spring, Redux/Zustand, Next.js.

## Deploy (PLAN §10 — Cloudflare Pages section)

- Cloudflare Pages, free tier, native SPA routing
- Build cmd: `pnpm build` (or `npm run build`)
- Output dir: `dist`
- Node: pinned to 20.x via `.nvmrc`
- `_redirects` already in `public/`

## What's next (PLAN §12)

M2 = Functions and Derivatives. Specs at PLAN §7.2 and §7.3. The `TopicPage` template they'll consume is the same one Vectors uses; the work is the playables + the prose. Estimated 4–6 sessions per the §12 honest budget.
