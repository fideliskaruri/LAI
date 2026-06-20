# Implementation Plan — Interactive AI/ML Learning Platform (v3)

> v3 integrates the second critique cycle (15 new findings, 6 HIGH; 19/21 round-1 findings verified closed). v2 integrated the first critique (24 findings) and research (citation corrections + 26 per-topic reference interactives). v1 is preserved in git history for diff.

## 1. Product

A constellation of single-topic playgrounds that teach AI/ML from first principles. Each topic is a deep, scroll-driven, polished playground where the visualization is the primary surface and prose narrates what's happening. The history of who discovered each idea is woven in as marginalia and reactive prose, not the spine.

**The bar:** Polo Club polish per topic (CNN Explainer / Transformer Explainer level). AlgoViz-style breadth of coverage. r2d3 / MLU-Explain scroll narration. Sebastian Lague aesthetic where 3D earns its place.

**The user:** A Microsoft engineer who finds *Mathematics for Machine Learning* (MML) overwhelming on first read, wants depth, wants every minute active (touch / break / drag), not passive.

**Non-goals:** Quizzes. Progress bars. Course completion. Accounts. Multi-user. Mobile-app builds. Offline mode in v1.

## 2. Reference Texts

The platform anchors to **MML — *Mathematics for Machine Learning*** (Deisenroth, Faisal, Ong; CUP 2020; freely available at https://mml-book.com) as the primary mathematical spine for foundations and classical models. MML covers our topics 1–11, 14, 16, 17. The platform's job is to make MML approachable — the reader should be able to open MML after the platform and find it readable rather than overwhelming.

For modern neural networks and the frontier (topics 18–26), MML stops, and we anchor to the best existing interactive explainer per topic.

### Per-topic reference table

| # | Topic | MML chapter | Iconic interactive (the bar to clear) |
|---|---|---|---|
| 1 | Vectors | 2.1–2.4 (Linear Algebra basics) | 3Blue1Brown *Essence of Linear Algebra* Ch 1 |
| 2 | Functions and change | — (supplementary; MML assumes function definitions) | Bret Victor, *Up and Down the Ladder of Abstraction* |
| 3 | Derivatives | 5.1–5.2 (Univariate + Partial Differentiation) | Mathigon *Calculus* — derivatives |
| 4 | Integrals | — (supplementary; not in MML) | 3Blue1Brown *Essence of Calculus* Ch 8 |
| 5 | Matrices as transformations | 2.7 (Linear Mappings) | 3Blue1Brown *Essence of Linear Algebra* Ch 3 |
| 6 | Eigenvalues | 4.2 (Eigenvalues and Eigenvectors) | Setosa *Eigenvectors and Eigenvalues* |
| 7 | Probability | 6.1–6.3 (Probability space, Bayes) | Seeing Theory Ch 1 |
| 8 | Expectation & variance | 6.4 (Summary Statistics and Independence) | Seeing Theory Ch 2 |
| 9 | Distributions | 6.5–6.6 (Gaussian + Conjugacy/Exponential Family) | Seeing Theory Ch 3 |
| 10 | Linear regression | 9 (Linear Regression) | Setosa *Ordinary Least Squares* |
| 11 | Optimization | 7 (Continuous Optimization) | Distill — *Why Momentum Really Works* |
| 12 | Logistic regression | extends Ch 9 (MML treats LR in supervised framing) | MLU-Explain *Logistic Regression* |
| 13 | Perceptron | — (not in MML) | TensorFlow Playground (closest prior art) |
| 14 | PCA | 10 (Dimensionality Reduction with PCA) | Setosa *PCA* |
| 15 | K-means clustering | — (supplementary; MML Ch 11 is GMM-specific; K-means is GMM's hard-assignment limit) | Naftali Harris *Visualizing K-Means* |
| 16 | Gaussian Mixture Models | 11 (Density Estimation with GMMs) | (no clear bar — green-field) |
| 17 | Support Vector Machines | 12 (Classification with SVMs) | scikit-learn SVM example pages |
| 18 | MLP / Backprop | — | TF Playground |
| 19 | Convolutions | — | Polo Club *CNN Explainer* |
| 20 | Word embeddings | — | TF *Embedding Projector* + Jay Alammar *Illustrated Word2vec* |
| 21 | Attention | — | Distill — *Attention and Augmented RNNs* |
| 22 | Transformers | — | Brendan Bycroft *LLM Visualization* + Polo Club *Transformer Explainer* |
| 23 | Language models | — | FT *Generative AI exists because of the transformer* |
| 24 | RLHF | — | Hugging Face *Illustrating RLHF* (no clear bar — green-field at the polish level) |
| 25 | Diffusion | — | Polo Club *Diffusion Explainer* |
| 26 | Agents | — | Anthropic *Building Effective Agents* (no clear bar — green-field) |

(Note catalog re-ordering vs v1: Expectation now precedes Distributions because expectation defines what a distribution's parameters mean; Optimization moves after Linear Regression because gradient descent is unmotivating without a loss function to minimize; PCA stays near Eigenvalues structurally even if not adjacent in the catalog.)

### MML notation conventions (adopted)
- Bold lowercase Latin/Greek for vectors: **x**, **v**, **β**
- Bold uppercase Latin for matrices: **A**, **B**, **X**
- Calligraphic for sets / spaces: 𝒱, 𝒰
- ℝ, ℕ for real and natural numbers
- ⟨·,·⟩ for inner product; ‖·‖ for norm

KaTeX rendering uses these. No deviation in v1.

## 3. Information Architecture

### Sitemap
- `/` — Constellation hub
- `/vectors`, `/functions`, `/derivatives`, `/integrals`, `/matrices`, `/eigenvalues`, `/probability`, `/expectation`, `/distributions`, `/linear-regression`, `/optimization`, `/logistic-regression`, `/perceptron`, `/pca`, `/clustering`, `/gmm`, `/svm`, `/backprop`, `/convolutions`, `/embeddings`, `/attention`, `/transformers`, `/language-models`, `/rlhf`, `/diffusion`, `/agents`
- `/about` — Colophon (sources, methodology, MML cross-references) — v3

26 topics. One URL per topic, kebab-case.

### Navigation
- **Hub → topic:** click topic glyph
- **Topic → topic:** end-of-topic "Next →" link; small "↩ Constellation" link
- **Lateral:** narrative cross-links inside prose
- **Inside a topic:** URL hash = current act (`/vectors#stevin`); scroll drives state; deep links land precisely
- **Browser back/forward** works; share-links work

### Deep-link hydration protocol
On mount with hash present:
1. Read hash, find target act ID
2. Use `history.scrollRestoration = 'manual'`
3. Scroll to anchor with `behavior: 'instant'` *before* attaching the IntersectionObserver
4. Mark the canvas state as "initial-hydration" — skip tweens, snap to final state
5. Attach IO after a 100ms debounce so the scroll settles
6. Suppress hash-update writes for 200ms after the initial scroll

This avoids: IO callbacks firing for all anchors the scroll passed through; visible 400ms morph from cold-open to act 7 on landing; ping-pong between scroll and hash-update.

### Persistence
`localStorage` key: **`learn-ai:v1:state`** (namespaced so siblings don't collide; `v1` schema version so we can migrate). Shape: `{ topicId, lastActId, completedTopics: [] }`. The hub uses this to (a) shift the "Start here →" pointer to the next un-read topic on revisit, (b) show "↩ pick up where you left off" on a topic page that's been previously visited. Schema version bump = migration script at boot.

## 4. The Hub — Constellation

### Concept
A spatial map. Topics float as hand-drawn glyphs in cream space, positioned to suggest dependency flow (foundations bottom-left, modern AI top-right). Labels are always visible next to glyphs — there is no "guess what this is" interaction.

### First-visit affordance
On first load (no `localStorage` entry), a vermilion-glowing "Start here →" pointer hovers next to the Vectors glyph. The pointer disappears after the user clicks any topic, or after 8 seconds (gentle nudge, not nagging).

### Revisit affordance
On revisit, the pointer moves to the next un-read topic per the dependency-aware reading order (see §5b). If the user has visited every available topic, the pointer disappears; "Welcome back" appears subtly upper-right.

### Visual
- Cream `#FAF8F4` background. Very faint grid (5% black, decorative only).
- Available topic: vermilion glyph + ink label; subtle glow on hover; cursor pointer.
- Coming-soon topic: pale grey glyph + `text-fade` label; no hover affordance; cursor default; subtle ⋯ next to label.
- Dependency edges: hand-feel thin lines, invisible by default; on topic hover, the topic's direct prereqs and direct dependents both highlight in faint vermilion.
- Floating subtitle, upper-left, Inter italic 14px dim: *"A constellation of playgrounds for the math behind machines that learn."*

### Atmosphere
- Parallax on `mousemove`: glyphs drift ~6px opposite cursor motion
- No persistent animation; page is still when user is still
- `prefers-reduced-motion`: parallax disabled

### Implementation
- Topic positions: hand-tuned coordinates in `src/data/constellation.ts`
- Single SVG, viewBox `0 0 1280 800`, scales fluidly
- No WebGL in v1

### Mobile
Constellation collapses to a vertical list grouped by Part numerals. Atmospheric feel is partially lost; accepted trade-off.

## 5. Topic Page Templates

The plan has **two templates**. Most topics use the single-canvas template; topics with structurally paired views use the split-canvas template.

### 5.1 Single-canvas template (default)

Sticky canvas on the left (55vw × `min(100vh, 100svh)`, `position: sticky; top: 0`). Prose column on the right (max-width 580px, centered in remaining 45vw, scrolls normally). Sidenotes appear in a 160px right margin when viewport ≥ 1280px; below that, sidenotes inline as italic asides.

**Used by:** Vectors, Functions, Derivatives, Integrals, Matrices, Eigenvalues, Probability, Expectation, Distributions, Optimization, Perceptron, K-means, GMM, MLP/Backprop, Word embeddings, Transformers, Language models, RLHF, Agents — 19 topics.

### 5.2 Split-canvas template

#### Component contract

```ts
interface SplitCanvasProps<L, R> {
  layout: 'auto'                          // resolves to side-by-side or stacked per breakpoint
  leftCanvas: ComponentType<{ state: L; onChange: (s: L) => void }>
  rightCanvas: ComponentType<{ state: R; onChange: (s: R) => void }>
  currentActId: ActId
  actStates: Map<ActId, { left: L; right: R }>
  onStateChange: (actId: ActId, side: 'left' | 'right', state: L | R) => void
  syncMode: 'independent' | 'left-drives-right' | 'right-drives-left' | 'co-mutating'
}
```

#### Sync model (per-consumer; default = `independent`)

- **`independent`** — each pane manages its own state; the two are different views of the same `currentActId`. Use for Logistic regression (feature space vs sigmoid are independent visualizations), PCA (original vs principal axes are visual mirrors), SVM (feature space vs margin highlight).
- **`left-drives-right`** — drag in the left pane dispatches a derived state update to the right pane. Use for Linear regression (drag the fit line, residuals on the right recompute) and Convolutions (drag the kernel position, feature map updates).
- **`right-drives-left`** — same in reverse. Use for Attention (hover a token in the alignment matrix on the right, the matching token highlights in the left token-sequence pane).
- **`co-mutating`** — both panes share one underlying state object via a single reducer. Use for Diffusion (the `t` scrubber lives in either pane and updates both image and noise schedule from one source).

#### Layout breakpoints

- **≥ 1280px:** side-by-side. Each pane 27vw, prose column 35vw at the right.
- **900–1279px:** side-by-side, compressed. Each pane 32vw, prose column 30vw.
- **< 900px:** stacked top-bottom on a non-sticky basis. Each pane 100vw × 40vh, prose below. The "simultaneously visible" property degrades — for topics where simultaneity is the teaching (Attention, Convolutions), the prose explicitly acknowledges "rotate to landscape for the full effect" or "this scene works best on a wider screen."

#### Why this exists before M1

The single-canvas template can't show two views simultaneously, but seven topics require it: LinReg, Logistic, PCA, SVM, Convolutions, Attention, Diffusion. Discovering this at M2 would force a retrofit that breaks the M1-built `TopicPage` API. Built once, in M1, with no consumer — proven via an internal test page with a contrived two-canvas demo, deferred to its real first use at M3 (LinReg).

#### M1 done-gate for the template

- Test page at `/__split-canvas-test` renders both layout modes
- All four sync modes work in isolation
- Mobile fallback renders without console errors at 375px
- Component contract passes TypeScript strict mode

### 5.3 Acts (both templates)

A topic = sequence of named acts. Each act has:
- `id` (URL hash anchor)
- `canvasState` (single-canvas) or `canvasStateLeft` + `canvasStateRight` (split)
- Prose block (**MDX from day one** — see §10)
- Optional sidenote (historical aside, primary-source link, MML chapter reference)
- Optional epigraph
- **Accessibility narrative** (see §11.1) — text describing what the canvas is showing right now, dynamically updated as state mutates

### 5.4 Wiring

**`currentActId` is owned by scroll-position math, not by IntersectionObserver.** A single `useActState` hook computes which act's anchor range contains `scrollY + viewport*0.4` deterministically, using `getBoundingClientRect` on each act anchor. IO is *optional* and only used as a perf hint to skip the calc when nothing's moving.

#### Layout cache invalidation

Anchor positions are cached per topic-page mount. The cache invalidates on:
- `window.resize` and `orientationchange` (always)
- `document.fonts.ready` (KaTeX + Source Serif fully loaded, shifts layout)
- Any act's lazy-imported `<Canvas3D>` finishing mount (adds vertical height)
- Image load events for any decorative SVGs that aren't size-known at parse time
- A manual `revalidate()` exposed by `useActState` for any other height-shifting events we discover

Without these invalidations, deep-link hydration to a later act with KaTeX-pending in earlier acts lands at the wrong position because the cached `boundingClientRect` was taken before KaTeX added its boxes.

This solves: fast-scroll callback ordering, deep-link landing, IO callback async batching, multi-anchor simultaneous crossings, post-font-load layout shift.

### 5.5 Transitions
- Where geometry can morph: `T_MED = 250ms` `cubic-bezier(0.4, 0, 0.2, 1)` (most cases)
- Slow morphs (Diffusion noise schedule): `T_LONG = 400ms`
- Fast hovers / mode-switches inside a single act: `T_SHORT = 150ms`
- Where geometry can't morph: 250ms crossfade
- Duration constants live in `src/lib/easing.ts`
- `prefers-reduced-motion`: instant cuts; no scroll-bound interpolation

### 5.6 Tween cancellation
Each canvas property holds a `requestAnimationFrame` cancellation token. New transitions cancel the previous rAF before starting their own. Without this, fast scrolls produce overlapping tweens with last-write-wins glitch.

### 5.7 Scroll-back state

When a user scrolls from act 5 to act 2: act 5's draggable state is *preserved* in memory.

**Storage:** `actStateMap: Map<ActId, ActState>` lifted to `TopicPage`. Each act component reads its slice via `actStateMap.get(myActId)` and writes via `setActState(myActId, next)`. The map persists for the topic-page lifetime.

**Mount policy:**
- **SVG-only acts:** keep mounted regardless of scroll position. Per-act SVG is cheap (~10–30KB DOM); 12 acts mounted is ~200KB DOM peak. Fine.
- **3D acts (currently only Vectors `#nD`, eventually Optimization loss landscape):** mount-on-near-viewport, unmount-on-far. Sentinel: `useNearViewport(actRef, { rootMargin: '200vh 0' })` — mounts when within 2 viewports of scroll position; unmounts when more than 2 viewports away. State for the 3D act is still preserved in `actStateMap`; only the GPU-bound `<Canvas3D>` element mounts/unmounts. Re-mount reads cached state and skips the morph-from-default tween.

This keeps SVG acts simple (mounted, state preserved) while solving the only real perf problem (r3f with GPU and shader compilation should not stay live when scrolled out).

Reset via overflow menu (§5.9).

### 5.8 Header chrome
- `←` back to constellation, top-left, vermilion arrow
- Topic name, Inter 13px uppercase tracking 0.18em, dim
- `⋯` overflow (top-right): share-with-act, reset-current-act (long-press: reset-all-acts), toggle reduced-motion preview

The overflow opens as a popover anchored under the `⋯` on desktop, and as a bottom-sheet on mobile.

### 5.9 Reset semantics
- Click `Reset` → resets the current act's draggable state to its initial spec, with a 250ms tween back
- Long-press `Reset` (≥500ms) → resets *all* acts on the page; confirmation popover required

### 5.10 Share semantics
- Click `Share` → `navigator.clipboard.writeText(currentUrl)` → inline toast "Link copied — drops the reader at this act" for 1500ms

### 5.11 Footer
- "↩ Constellation"
- "Next → [next topic name]" — bigger, vermilion underline, vermilion-glowing arrow on hover
- Collapsible **References** list — the canonical per-topic citations: MML chapter, primary sources for any historical anchors, the reference interactive that set the bar (with credit). This is the ONLY references list — overflow does not duplicate.

## 6. Topic Catalog

### Part I — Foundations
1. **Vectors** — arrows, addition, scalar mul, magnitude, leap to nD
2. **Functions and change** — what a function is geometrically; rate of change
3. **Derivatives** — Newton vs Leibniz; tangent limit; chain rule; gradient
4. **Integrals** — areas, accumulation, fundamental theorem
5. **Matrices as transformations** — multiplying space, not tables of numbers
6. **Eigenvalues** — the natural axes of a transformation
7. **Probability** — Pascal at the gambling table
8. **Expectation & variance** — what random outcomes average to
9. **Distributions** — Gauss and the missing asteroid Ceres

### Part II — First Models
10. **Linear regression** — Legendre vs Gauss, least squares as projection
11. **Optimization** — gradient descent as mountaineering (placed here so it lands with a loss function to minimize)
12. **Logistic regression** — continuous → binary; the sigmoid
13. **Perceptron** — Rosenblatt 1958, the 1969 crisis, the 30-year winter
14. **PCA** — Pearson 1901; finding the axes that matter (placed near Eigenvalues structurally; reads after LinReg's projection treatment)
15. **K-means clustering** — Lloyd 1957; centroids and Voronoi cells
16. **Gaussian Mixture Models** — soft K-means; the EM algorithm; density estimation
17. **Support Vector Machines** — Vapnik 1995; the margin, the kernel trick

### Part III — Neural Networks
18. **MLP / Backprop** — 1986; the chain rule across layers
19. **Convolutions** — LeCun's postal codes; weight sharing as prior
20. **Word embeddings** — Mikolov 2013; geometry of meaning
21. **Attention** — Bahdanau 2014; alignment problem; QKV mechanics
22. **Transformers** — Vaswani 2017
23. **Language models** — pretraining, scaling laws, emergence

### Part IV — The Frontier
24. **RLHF** — reward modelling, PPO, the alignment loop
25. **Diffusion** — noise-and-denoise; score matching
26. **Agents** — tool use, multi-step reasoning, long-context

### Cross-Topic Dependencies

Three entry points (no prereqs): **Vectors**, **Functions and change**, **Probability**.

| # | Topic | Direct prerequisites |
|---|---|---|
| 1 | Vectors | — |
| 2 | Functions and change | — |
| 3 | Derivatives | Functions |
| 4 | Integrals | Functions, Derivatives |
| 5 | Matrices as transformations | Vectors |
| 6 | Eigenvalues | Matrices |
| 7 | Probability | — |
| 8 | Expectation & variance | Probability |
| 9 | Distributions | Probability, Expectation, Functions |
| 10 | Linear regression | Vectors, Matrices |
| 11 | Optimization | Derivatives, Vectors, Linear regression |
| 12 | Logistic regression | Linear regression, Probability, Optimization |
| 13 | Perceptron | Logistic regression |
| 14 | PCA | Eigenvalues, Vectors, Matrices |
| 15 | K-means | Vectors |
| 16 | GMM | K-means, Distributions, Optimization |
| 17 | SVM | Vectors, Matrices, Optimization |
| 18 | MLP / Backprop | Perceptron, Derivatives, Matrices, Optimization |
| 19 | Convolutions | MLP |
| 20 | Word embeddings | Vectors, Linear regression, Probability |
| 21 | Attention | Vectors, Distributions (softmax) |
| 22 | Transformers | Attention, MLP, Embeddings |
| 23 | Language models | Transformers, Probability |
| 24 | RLHF | Language models, Optimization, Probability |
| 25 | Diffusion | Probability, Distributions, Optimization |
| 26 | Agents | Language models |

**Critical paths:**
- **Geometry:** Vectors → Matrices → Eigenvalues → PCA
- **Calculus:** Functions → Derivatives → {Integrals, Optimization (via LinReg)}
- **Statistics:** Probability → Expectation → Distributions
- **Classical models:** Linear regression → Logistic → Perceptron → MLP → Convolutions
- **Modern AI:** Embeddings → Attention → Transformers → Language models → {RLHF, Agents, Diffusion}

**Hub topics (3+ prereqs):** Linear regression, MLP/Backprop, GMM, SVM, Transformers, RLHF.

**Shortest path to Transformers (11 topics):**
Vectors → Functions → Derivatives → Matrices → Linear regression → Optimization → Logistic regression → Perceptron → MLP/Backprop → Word embeddings → Attention → Transformers.

## 7. Per-Topic Specs

### Tone checklist (applies to every topic's prose)

Every per-act prose block is audited against this before shipping. Drift between acts written on different days is the single largest threat to the platform's warmth; the checklist exists to fight that drift, not to police the author.

1. **First-person transitions allowed.** "I find this strange too," "we'll come back to this." Strogatz register, not textbook.
2. **Dates in human terms.** "A Tuesday in October" beats "in the 1840s." "Plague year" beats "1666." "Eighteen years later" beats "in 1684."
3. **Second person is "you," never "the reader."** Direct address. We're in the room with them.
4. **Contractions are allowed.** "It's," "we've," "doesn't." Removes the textbook starch.
5. **At least one self-deprecating aside per act.** The math is hard for everyone, including the people who invented it. "Newton wasn't sure what he had either." "Gauss never published this — he didn't think it was finished."
6. **No engineer-jargon in user-visible prose.** "Model" only when defined; "gradient" only after gradient is built; never "embedding," "vertex," "FAR," "GA" before they're earned. Test: a reader who has only done topics 1–4 should be able to read topic 5 without consulting a glossary.
7. **The historical anchor is dated, located, and humanly motivated.** "Newton, 23, sent home from plague-closed Cambridge" beats "Newton invented calculus." A real person wrestling with a real problem in a real place.
8. **No "obviously" or "trivially."** If it's obvious, the reader sees it without you saying so. If it isn't, the word is hostile.

### 7.1 Vectors — full spec

**Template:** single-canvas. **MML:** §2.1–2.4.

12 acts:

1. **`#cold-open`** — *The 1893 fight.* Canvas: hand-drawn fragment of a *Nature* page; vermilion-highlighted polemic fades in. No interaction. ~200 words prose. Sidenote: Tait vs Gibbs/Heaviside in *Nature* vols 47–49 (1893); R.S. Ball wrote a cooling-off editorial in Aug 1893 but the letters kept coming.
2. **`#stevin`** — *Wreath of spheres, 1586.* Canvas: triangular wedge, 14-bead chain (the clootcrans diagram from the frontispiece of Stevin's own 1586 *De Beghinselen der Weeghconst*). **Drag any bead.** Chain redistributes; can't be made to slide. Fight-thread re-enters. Sidenote: Stevin's motto "Wonder en is gheen wonder" — wonder is no wonder.
3. **`#descartes`** — *Coordinates.* Canvas morphs: wedge dissolves, axes appear. **Click to drop a point; drag it.** Coordinates shown in JetBrains Mono beside cursor. Sidenote: *La Géométrie* 1637, Pappus's problem (the showcase of Books I–II); fly-on-ceiling folklore flagged as folklore.
4. **`#arrow`** — *Point → arrow.* Canvas: one arrow rooted at origin, tip draggable. **Drag tip AND drag the whole arrow.** Translation-invariance teaching: moving the arrow doesn't change components. *Earned* test: static can't show invariance.
5. **`#addition`** — *Parallelogram.* Canvas: two arrows. **Drag either tip; parallelogram completes; sum vector appears.** Make them parallel → degenerate; prose catches: "you just collapsed it. Heaviside loved this; Tait considered it crude."
6. **`#scalar`** — *Scaling.* Canvas: one arrow + slider from −2 to +2. **Drag slider.** At 0 the arrow vanishes; at −1 it flips. "What does negative-one-times-an-arrow mean physically?" *Load-bearing:* prose hole only the slider fills.
7. **`#magnitude`** — *Pythagoras's diagonal.* Canvas: arrow + dashed right triangle. **Drag tip; |v| and triangle redraw.** Re-derives `c² = a² + b²` from a square-of-the-sum picture for a reader who's forgotten it.
8. **`#direction`** — *Angle.* Canvas: arrow + arc from positive-x. **Drag tip; θ updates.** Inverse trig explained, not assumed.
9. **`#hamilton`** — *Brougham Bridge, Oct 16 1843.* Canvas: stylized hand-drawn bridge with carved `i² = j² = k² = ijk = −1`. Read-only. Prose quotes Hamilton's 1865 letter to son Archibald (R.P. Graves, *Life of Sir William Rowan Hamilton* vol II ch XXVIII; TCD transcript), framing it as Hamilton remembering 22 years later. Emotional beat.
10. **`#gibbs-resolution`** — *Stripping down.* Canvas: split view, quaternion vs vector notation for same physics expression. **Hover either side → translation highlights.** Cold-open fight resolves.
11. **`#nD`** — *The leap.* Canvas (3D, react-three-fiber, lazy-loaded). **Scroll-driven 4 states:** 2D → 3D rotates in → axes fade, arrow + column of numbers → only numbers. "The picture runs out of room; the numbers don't."
12. **`#closing`** — *Thread.* Canvas: Stevin's chain dissolves rightward into a column of 768 numbers for `king` (real word2vec). One-sentence link forward to embeddings.

Prose volume: ~3500–4500 words. Drop cap on cold open. Tone checklist applies.

### 7.2 Functions and change — full spec

**Template:** single-canvas. **MML:** §5.1. **Reference bar:** Bret Victor *Up and Down the Ladder of Abstraction*.

7 acts:

1. **`#cold-open`** — *Galileo at Pisa, ~1604.* Canvas: hand-drawn inclined plane with a bronze ball; the ball rolls slowly (no interaction yet). Prose: Galileo couldn't measure speed at a point — he could only measure distance over time. The whole science of motion needed a way to say "how fast, *right now*?" *Earned:* the static still doesn't move; the autoplay rolling ball makes you ask the question. *MML link:* §5.1 motivation.
2. **`#input-output`** — *What a function is.* Canvas: two axes; a horizontal scrubber labelled "input"; a needle on the vertical axis labelled "output." **Drag the input scrubber; output moves.** Function defined as `f(x) = 2x + 1` (vermilion line drawn). Prose: a function is a *machine* that gives you one output for each input. *Load-bearing:* "the *correspondence* itself is the thing you can't draw without an interaction."
3. **`#families`** — *Linear, quadratic, sin.* Canvas: same axes; three function curves stacked, only one visible at a time. **Tab between** linear / quadratic / sin. Prose: same machine, different rules. Sidenote: MML §5.1 covers differentiability classes; we just look at the curves.
4. **`#slope`** — *Linear functions have constant slope.* Canvas: linear function; two draggable points on it; a chord drawn between them. **Drag either point.** The chord's slope (rise/run) shows; it's the same wherever the points sit. Prose: linear means "the slope is the same everywhere." *Load-bearing:* the *constancy* across positions isn't visible from one drawing.
5. **`#curves-change-slope`** — *Curves don't.* Canvas: switches to `f(x) = x²`; same two draggable points + chord. **Drag the points.** Now the chord's slope changes as you move. Prose: most functions don't have constant slope. The question becomes: *what's the slope at a point*?
6. **`#secant-to-tangent`** — *The limit.* Canvas: `f(x) = x²`; two points, the second much closer to the first than the first. **Drag the second point toward the first.** As they merge, the chord becomes a tangent. Prose: this is the trick. Bring the points together. Whatever the chord's slope approaches is the slope *at* the first point. This is what Newton and Leibniz both stumbled on, separately. *Load-bearing:* the *limit* is impossible to convey without watching the secant tip over.
7. **`#derivative-as-function`** — *Slope at every point.* Canvas: full curve `f(x) = x²` + a draggable point on it + a small tangent arrow at that point. As the point slides along the curve, a second curve traces out underneath showing the tangent's slope at each x. **Drag the point.** The slope curve `f'(x) = 2x` reveals itself. Prose: the slope of `x²` at every point traces a line. That line is its own function — the *derivative*. Closing thread forward to Derivatives chapter.

Prose: ~2500 words. Historical anchor: Galileo (motivation, motion). No need for a quaternion-style emotional peak here — the secant-tipping into tangent is the moment.

### 7.3 Derivatives — full spec

**Template:** single-canvas. **MML:** §5.2. **Reference bar:** Mathigon Calculus.

9 acts:

1. **`#cold-open`** — *Newton 1666, plague year, Lincolnshire farm.* Canvas: a static still of an apple-tree silhouette, vermilion ink-wash; "*annus mirabilis*" inscribed. No interaction. Prose: Cambridge closed by plague; 23-year-old Isaac Newton was sent home. He spent the year inventing what he called *fluxions* — the math of changing things. He didn't publish. *MML link:* opening of §5.2.
2. **`#leibniz-1684`** — *The other discoverer.* Canvas: a reproduction of the title page of Leibniz's 1684 *Nova Methodus* paper. Read-only. Prose: 18 years later, Gottfried Leibniz publishes the same idea, with *better notation*. The notation we still use — `dy/dx` — is Leibniz's. The priority fight ran the rest of both their lives. Sidenote: Royal Society 1712 verdict (Newton-stacked committee).
3. **`#review-from-functions`** — *The secant-to-tangent move, recalled.* Canvas: same as Functions act 6. **Drag the second point toward the first.** Prose: this is where we left off. The slope at a point is the limit of the secant slope. We'll now do this for any function, name what falls out, and use it.
4. **`#derivative-defined`** — *The limit, written down.* Canvas: same curve + scrubber for `h` showing `[f(x+h) − f(x)] / h`. **Drag the scrubber.** As h → 0, the ratio approaches the derivative. The expression `lim_{h→0} (f(x+h) − f(x))/h` renders alongside in STIX Two Math. *Load-bearing:* the algebraic definition only makes sense once you've watched h shrink.
5. **`#rules`** — *Power rule, sum rule.* Canvas: a small tabular grid; drag handles on each function's coefficient. Prose: derivative of `xⁿ` is `n·xⁿ⁻¹`. Why? The math falls out of the definition for any n; we hint at the algebra and link to MML §5.2.3. Sidenote: MML lists ~12 rules; we cover the three that matter for ML.
6. **`#chain-rule`** — *Composition.* Canvas: two stacked function machines (top: `g(x) = 2x`; bottom: `f(u) = u²`); the input flows top-to-bottom; the output is `(2x)² = 4x²`. **Drag the input slider.** Prose: when you compose functions, slopes multiply. *Load-bearing:* watching the slopes propagate through both machines is the teaching the algebraic statement can't deliver. *MML link:* §5.2.2.
7. **`#product-rule`** — *Area of an expanding rectangle.* Canvas: a rectangle with sides `u(t)` and `v(t)`; the rectangle grows with time `t`; thin strips highlight the *new* area from each side. **Drag t.** Prose: the area added each instant is `u·dv + v·du`. That's the product rule, geometrically. *Load-bearing:* the geometric proof is the *only* honest derivation; the algebraic one is opaque.
8. **`#gradient-intro`** — *2D: derivative becomes a vector.* Canvas: a 2D heatmap of `f(x, y) = x² + y²`; a draggable point on the heatmap; a vermilion arrow showing the gradient at that point (pointing uphill). **Drag the point.** The arrow's direction = steepest ascent; its length = how steep. Prose: in 2D, "the derivative" becomes "the gradient." It's a vector — direction matters now. Bridge to Vectors. *MML link:* §5.2.5.
9. **`#closing`** — *Thread.* The gradient becomes the thing optimization will use. One-sentence forward link to Optimization.

Prose: ~3500 words. Historical anchor: Newton 1666 + Leibniz 1684, treated symmetrically.

### 7.4 Probability — full spec

**Template:** single-canvas. **MML:** §6.1. **Reference bar:** Seeing Theory Ch 1.

8 acts:

1. **`#cold-open`** — *Chevalier de Méré, 1654.* Canvas: a hand-drawn 17th-century salon, dice on a table (still). Prose: a French nobleman noticed he was winning a certain dice bet less often than he expected. He wrote to his friend Pascal. Pascal wrote to Fermat. The exchange that followed invented probability theory. *MML link:* §6.1 intro.
2. **`#sample-space`** — *Everything that could happen.* Canvas: two six-sided dice; all 36 outcomes laid out in a 6×6 grid (vermilion: outcomes summing to 7; ink: others). **Click any cell to highlight a single outcome.** Prose: the *sample space* is the set of all possible outcomes. The dice example is concrete — you can count. *Load-bearing:* you can't see the structure of 36 outcomes without seeing the grid.
3. **`#events`** — *Subsets of the sample space.* Canvas: same grid; tabs let you choose "sum equals 7" / "first die is 4" / "both dice even." The matching cells highlight. **Click tabs.** Prose: an *event* is a subset. Probability of an event is (matching cells) / (total cells).
4. **`#méré-problem`** — *De Méré's original bet.* Canvas: switches to one die rolled 4 times; matching outcomes (at least one 6) highlight. Sidenote: de Méré actually got it right; his confusion was about *two dice rolled 24 times*. Prose tells the actual problem: he thought 24 rolls of double-dice for two 6's should be equivalent to 4 rolls of one die for one 6. Pascal showed why it wasn't.
5. **`#conditional`** — *Probability under a constraint.* Canvas: two-die grid + a draggable "constraint" handle that filters which cells we're considering ("given the first die is 4"). **Drag the constraint.** The grid grays out cells that don't match; among the remaining, "sum equals 7" outcomes highlight in vermilion. Prose: `P(A | B) = P(A ∩ B) / P(B)`. *Load-bearing:* the *filtering* shows the denominator change.
6. **`#independence`** — *When the filter doesn't matter.* Canvas: same as conditional. **Drag the constraint to different values.** The conditional probability of "second die is even" doesn't change. Prose: events are independent when the conditional equals the unconditional. The dice example makes "doesn't change" visually obvious.
7. **`#bayes`** — *Switching the direction of the filter.* Canvas: same grid + a switch that flips which die is the constraint and which is the question. **Toggle the switch.** Prose: Bayes' theorem is the algebra of switching the filter direction. `P(A|B) · P(B) = P(B|A) · P(A)`. *MML link:* §6.3. Sidenote: Thomas Bayes died in 1761; his result was published posthumously by Richard Price.
8. **`#closing`** — *Thread to Expectation.* Forward link: now that we can talk about which outcomes happen, the next question is — *on average*, what do they give us?

Prose: ~2800 words. Historical anchor: Pascal-Fermat 1654 + Bayes (posthumous, 1763).

### 7.5 Linear regression — full spec

**Template:** **split-canvas**. **MML:** §9. **Reference bar:** Setosa OLS + MLU-Explain.

10 acts:

1. **`#cold-open`** — *Legendre 1805 vs Gauss 1809.* Canvas (split — both sides used here): left: a hand-drawn ellipse of Ceres's predicted orbit from Gauss; right: Legendre's 1805 *Nouvelles méthodes* title page. Prose: Adrien-Marie Legendre publishes the method of least squares in 1805. Four years later, Gauss publishes too — but claims he'd been using it since 1795 to track Ceres. They fight about priority for decades. *MML link:* §9.1.
2. **`#data`** — *The fit problem.* Canvas left: scatter of points (synthetic; e.g., heights vs weights). Canvas right: empty (residual panel placeholder). Prose: we have data. We want a line that "fits." But what does fit mean?
3. **`#draggable-line`** — *Drag a line.* Canvas left: same scatter + a draggable line (drag either endpoint). **Drag the line.** Prose: pick a line. Look at how far each point is from it. That distance is what we want to make small. *Load-bearing:* you can't reason about "good fit" without trying bad fits first.
4. **`#residuals`** — *Bars.* Canvas right activates: vertical bars from each point to the line (the residuals), vermilion if above, ink if below. **Drag the line; bars resize.** The right canvas also shows a running sum: `Σ|r_i|`. Prose: residuals are the gap between data and model. We want them small overall.
5. **`#sum-of-squares`** — *Why squared, not absolute?* Canvas right adds: switch between Σ|r| and Σr². **Toggle.** With Σr², the bars become *squares* whose total area you're minimizing. Prose: squaring penalizes large residuals more, and (the big reason) makes the algebra solvable in closed form. *MML link:* §9.2.
6. **`#calculus-on-loss`** — *Minimum via derivative.* Canvas right switches to: a parabola of SSE as a function of the line's slope; a draggable slope handle that moves a vertical line on the parabola. Canvas left: the fit line co-moves with the slope handle. **Drag.** Prose: the SSE is a function of the line's parameters. The minimum is where the parabola's derivative is zero. **Note this is "derivative-finds-min," not gradient descent — no Optimization prereq is sneaked in.** Bridge back to Derivatives.
7. **`#normal-equations`** — *Closed form.* Canvas right: a worked symbolic block showing `β = (XᵀX)⁻¹Xᵀy`; canvas left: the resulting best-fit line drawn in vermilion. Prose: solving "derivative = 0" gives the formula. *MML link:* §9.2.1.
8. **`#projection-interpretation`** — *Geometry.* Canvas left switches to 3D (r3f): the data vector `y` and the column space of `X` as a plane; the best-fit `Xβ` is the *projection* of y onto that plane. Canvas right: stays with the symbolic formula. Prose: least squares is *geometric*. You're projecting. Bridge back to Vectors. *MML link:* §9.4. *Earned:* the projection picture only lands once you can rotate it.
9. **`#overfitting-teaser`** — *Higher-degree polynomial.* Canvas left: switch to polynomial fit, slider for degree 1–10. Canvas right: shows training error decreasing as degree grows. **Drag the slider.** Prose: the fit looks perfect at degree 10 on the training points. But what if we plotted *new* points? Teaser for the regularization story (out of scope this chapter).
10. **`#closing`** — *Thread to Optimization.* Forward link: the closed-form solution only exists because the loss is quadratic. For most ML models, no closed form exists; we need to *climb down the loss landscape* — that's Optimization.

Prose: ~3500 words. Historical anchor: Legendre vs Gauss + Gauss's Ceres asteroid story (1801 — he predicted Ceres's re-emergence after astronomers lost it).

### 7.6 Topics 4, 6, 8, 9, 11–26 — outlines (each gets full spec at its build cycle)

Each remaining topic gets a Vectors-density spec at the start of its build cycle. The catalog above provides MML chapter, reference bar, and template choice; the act sequence is drafted as the first activity of the topic's build session.

This is now explicitly the plan, not a hand-wave: **we do not pre-commit to acts for topics 4, 6, 8, 9, 11–26.** The single-line outlines below are placeholders for that future drafting.

- **Integrals (4):** cold-open (Archimedes) → Riemann sums → fundamental theorem → numerical → closing
- **Eigenvalues (6):** cold-open (Cauchy 1829) → invariant directions → characteristic polynomial → PCA preview → closing
- **Expectation (8):** cold-open (gambler's expected loss) → weighted average as the operator → law of large numbers → variance → closing
- **Distributions (9):** cold-open (Gauss and Ceres 1801) → normal → binomial → Poisson → CLT → closing
- **Optimization (11):** cold-open (Cauchy 1847 gradient descent paper) → mountain climbing → learning rate → momentum → loss landscape (r3f) → closing
- **Logistic regression (12):** cold-open (the classification problem) → sigmoid → log loss → decision boundary → closing
- **Perceptron (13):** cold-open (Rosenblatt 1958 NYT) → forward + step → training rule → 1969 Minsky-Papert XOR crisis → 30-year winter → closing
- **PCA (14):** cold-open (Pearson 1901) → variance maximization → eigen → reconstruction → closing
- **K-means (15):** cold-open (Lloyd 1957) → centroids → Voronoi → init sensitivity → closing
- **GMM (16):** cold-open (soft K-means) → mixture model → EM → closing
- **SVM (17):** cold-open (Vapnik 1995) → margin → kernel trick → closing
- **MLP/Backprop (18):** cold-open (Rumelhart-Hinton-Williams 1986) → forward → reverse-mode → closing
- **Convolutions (19):** cold-open (LeCun ZIP codes) → kernel + feature map → pooling → closing
- **Embeddings (20):** cold-open (king − man + woman) → word2vec → projector → closing
- **Attention (21):** cold-open (Bahdanau 2014 alignment) → QKV → multi-head → closing
- **Transformers (22):** cold-open (Vaswani 2017) → encoder → decoder → walkthrough → closing
- **Language models (23):** cold-open (pretraining) → scaling → emergence → closing
- **RLHF (24):** cold-open (alignment) → preference modeling → PPO → closing
- **Diffusion (25):** cold-open (Sohl-Dickstein 2015) → forward noise → reverse denoise → score matching → closing
- **Agents (26):** cold-open (tool use, ReAct 2022) → planning → memory → closing

## 8. Design System

### Colors (`@theme` tokens)
- `--color-cream: #FAF8F4` — page background
- `--color-cream-deep: #F3EFE6` — secondary surfaces
- `--color-ink: #1A1A1A` — body text
- `--color-vermilion: #C44536` — accent
- `--color-vermilion-deep: #A8392C` — hover/pressed
- `--color-dim: #6B6B6B` — sidenote text
- `--color-fade: #B5AEA5` — coming-soon
- `--color-graph-ink: #2A2A2A` — SVG strokes
- `--color-graph-fade: #D9D4CB` — grid lines

Dark mode deferred to v3; `color-scheme: light` set explicitly.

### Typography
- **Body:** Source Serif 4 — 19px / 1.7 / measure 580–680px / weights 400, 400-italic, 600
- **UI:** Inter — 12–15px / weights 400, 500
- **Mono:** JetBrains Mono — coordinates, numeric readouts
- **Math:** KaTeX with STIX Two Math (lazy-loaded only on topic pages)
- **Drop cap:** `<DropCap>` *component* (not `::first-letter` — fails with KaTeX, leading quotes, mobile sizing). Component takes explicit text + falls back gracefully.
- **Numerics:** test before locking — Source Serif 4 via `@fontsource` may not ship oldstyle/lining feature; default to `tabular-nums` everywhere if `oldstyle-nums` is unavailable.

### Spacing
Tailwind 4px baseline. Topic top padding 64px, act-to-act gap 96px, sidenote offset 24px, canvas inner padding 32px.

### Motion (constants in `src/lib/easing.ts`)
- `T_SHORT = 150ms` — hover transitions, mode-switches in-act
- `T_MED = 250ms` — most canvas state transitions
- `T_LONG = 400ms` — slow morphs (Diffusion noise schedule)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- `prefers-reduced-motion`: instant cuts everywhere

### Iconography
- rough.js for decorative scaffolding (axes, grids, dashed triangles); seed pinned per scene so re-renders don't jitter
- Clean SVG paths for interactive shapes
- ~6 inline SVG icons (arrow-left, share, more-menu, eye, ear, expand)

## 9. Interaction Patterns

### Scroll-driven canvas mutation
Scroll-position math owns `currentActId` (§5.4). Tween cancellation (§5.6) prevents overlapping rAF callbacks. Hand-rolled rAF — `react-spring` is forbidden in v1 to avoid bundle creep and dual-system "vibes routing."

### Drag
`@use-gesture/react`. State-driven re-renders. Touch: 24px visible hit + 44px invisible tap-area padding. Keyboard: arrow nudge 1, Shift+arrow nudge 10. Tab cycles in document order.

### Sliders
Custom SVG sliders matched to diagram register. Numeric readout in JetBrains Mono always adjacent.

### Hover
- Hub glyphs: vermilion glow + label dim-to-bright + parallax exaggerates briefly
- Inline equations: hover reveals expanded English form
- Citation links: vermilion underline

### History / share
URL hash reflects current act. Browser back/forward replays. Share copy: see §5.10.

## 10. Engineering Architecture

### Stack
- **Build:** Vite 8
- **UI:** React 19 + TypeScript
- **Styling:** Tailwind v4 (`@theme`)
- **Content:** **MDX from day one** (`@mdx-js/rollup` via Vite plugin). Topic prose lives in `src/content/<topic>/<act>.mdx`. ~30 lines of config; saves the v1→v2 migration trap.
- **2D graphics:** SVG declaratively + rough.js for decoration (seed pinned)
- **3D graphics:** `react-three-fiber` + `@react-three/drei`, code-split, lazy-loaded
- **Gesture:** `@use-gesture/react`
- **Math:** `react-katex` with STIX Two Math (lazy-loaded only when KaTeX content present)
- **Routing:** `react-router-dom` v6
- **Animation:** hand-rolled `requestAnimationFrame`; CSS transitions for hover

**Explicitly forbidden:** Framer Motion, react-spring (v1), Redux/Zustand, Next.js, GraphQL.

### Deploy
**Cloudflare Pages** (free; supports SPA routing natively; CDN-fronted; no `404.html` hack). GitHub Pages rejected — its lack of SPA-routing support breaks `BrowserRouter` deep-links.

### File structure (additions vs v1)
```
src/
├── content/                        // MDX prose per act, from day one
│   ├── vectors/
│   │   ├── coldOpen.mdx
│   │   ├── stevin.mdx
│   │   └── ... (12 acts)
│   └── ...
├── components/
│   ├── topic/
│   │   ├── TopicPage.tsx
│   │   ├── TopicPageSplit.tsx     // split-canvas template
│   │   ├── StickyCanvas.tsx
│   │   ├── Act.tsx
│   │   ├── ActDots.tsx
│   │   ├── Sidenote.tsx
│   │   ├── DropCap.tsx             // component, not pseudo-element
│   │   ├── Eq.tsx                  // KaTeX wrapper
│   │   ├── CanvasNarrative.tsx     // a11y screen-reader narrative
│   │   └── PullQuote.tsx
│   ├── ui/
│   │   ├── ErrorBoundary.tsx       // catches per-route errors
│   │   ├── LoadingSkeleton.tsx
│   │   └── NotFound.tsx
└── data/
    ├── constellation.ts            // positions + prereq edges
    ├── topics.ts                   // topic manifest
    └── redirects.ts                // rename-redirect map
```

### State model
Component-local. `currentActId` lifted to `TopicPage`. URL hash sync via `useUrlHash`. Per-act draggable state preserved on scroll-back (§5.7).

### Routing
```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Hub/>}/>
    <Route path="/about" element={<About/>}/>
    <Route path="/:topicId" element={<TopicGate/>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes>
</BrowserRouter>
```
`TopicGate` checks `redirects.ts` first; if no entry, dynamically imports the topic page; on import failure, falls through to `<NotFound/>`.

### Bundle strategy (per-resource budgets)
- **Hub:** JS ≤ 250KB gzipped; SVG glyphs inlined ≤ 75KB; fonts: Source Serif 4 body weight (~80KB) + Inter (~30KB) preloaded; STIX Two Math NOT loaded; total first-paint weight ≤ 450KB.
- **Per topic:** JS ≤ 350KB incl. shared vendor; STIX Two Math (~150KB) lazy-loaded when KaTeX content mounts; total ≤ 550KB.
- **3D topics:** + 500KB react-three-fiber + drei chunk, lazy-loaded.

### Testing
- **Vitest + RTL:** hooks (`useActState`, `useDraggable`, `useUrlHash`); MDX rendering smoke
- **Playwright:** per topic, one smoke — load, scroll to last act, verify hash updated, verify primary drag responds via keyboard
- **A11y:** per topic, one screen-reader narrative test (manual, recorded in checklist)
- **Storybook:** deferred to v2

### Cloudflare Pages config

- **Build command:** `pnpm build` (project standardizes on pnpm in v1)
- **Output directory:** `dist`
- **Node version:** pinned to 20.x via `.nvmrc` and `"engines": { "node": ">=20" }` in `package.json`; Cloudflare reads `.nvmrc` automatically
- **Build environment:** Ubuntu 22.04 (Cloudflare default — matches `ubuntu-22.04` runner in CI)
- **Preview deploys:** enabled per PR; production = pushes to `main`
- **Env vars:** `VITE_PLAUSIBLE_DOMAIN` set in Cloudflare dashboard (production only); empty in preview = no telemetry from preview
- **`_redirects` file:** generated at build time from `src/data/redirects.ts` to `dist/_redirects` for edge-level redirects (preserves SEO, no JS roundtrip)
- **Lighthouse CI:** runs against Cloudflare preview URL via GitHub Action; fails PR if Performance < 90 on `/vectors`
- **Custom domain:** deferred to v2 (preview/production URLs at `learn-ai.pages.dev` are enough for M1)

## 11. Cross-Cutting Concerns

### 11.1 Accessibility — *narrative*, not checklist

The plan's load-bearing pedagogy (the prose catches you when you do the manipulation) must work for non-sighted users. Mechanism:

- Each canvas exposes a **live `aria-label` text** that *updates as state mutates* and describes what a sighted user sees. Example for Vectors `#addition`: when the user makes v and w parallel, the label updates to "Vector v and vector w are now parallel. The parallelogram has collapsed into a line. The sum vector lies along the same line."
- A **CanvasNarrative** panel (visually hidden by default, toggle button in overflow) presents the same updating description in a focusable region. Screen readers read it as the canvas changes.
- **Narrative text source:** each act ships a `<act>.narrative.ts` file alongside its `.mdx` prose, exporting `narrate(state: ActState): string`. Example: `src/content/vectors/addition.narrative.ts` exports a function that returns "Vector v and vector w are now parallel; the parallelogram has collapsed into a line" when `state.angle ≈ 0`. Decoupled from visual prose so screen-reader text can be rewritten without touching the MDX or the canvas component.
- **Live-region announcement state machine** (`aria-live="polite"` on the narrative panel):

  | Event | Behavior | Why |
  |---|---|---|
  | Drag in progress (continuous) | Trailing-edge 350ms debounce; describe *settled state*, not delta | Avoid per-frame flooding |
  | `pointerup` after drag | Immediate fire of final state | User wants confirmation of where they landed |
  | Slider movement (continuous) | Throttle 250ms with leading edge | Slider deltas matter (e.g. scalar going through zero) |
  | Slider release | Immediate fire | Confirmation |
  | Act transition (scroll-driven) | Immediate fire — highest priority, cancels any pending drag-debounce | New act = new context |
  | Degenerate-case entry (e.g. parallelogram collapse) | Immediate fire — high priority, cancels pending debounce | This is the load-bearing teaching beat |
  | Degenerate-case exit | Immediate fire | Confirm exit |
  | Keyboard nudge (arrow-key drag equivalent) | Trailing 350ms debounce; immediate on key-up | Match drag pattern |

  Announcement queue priority: Act transition > Degenerate-case > Settled state. Newer high-priority announcements cancel pending lower-priority ones.
- Per-topic screen-reader narrative test: with eyes closed, can the user reach the same closing-sentence understanding as a sighted user? Documented as a per-topic manual checklist before shipping.
- Tab order: within a canvas, draggables tab in spatial order (left-to-right, top-to-bottom). For Stevin's 14 beads, tab cycles in chain order.
- Keyboard equivalent for "drag the whole arrow" (act 4): arrow keys move the tip; `Shift+arrow` moves the whole arrow.
- All standard a11y: `role="img"` + `aria-labelledby` (pointing at first paragraph of act prose, fallback); 2px vermilion focus rings, 4px offset; ink/cream 16.5:1 contrast, vermilion/cream 5.2:1 (AA body, AAA large); skip link to first act; h1 = topic name (visually hidden), h2 = act name.
- `prefers-reduced-motion`: all scroll-driven morphs become discrete state-snaps at act boundaries; hover transitions disabled; hub parallax disabled.

### 11.2 Mobile
- 900px breakpoint splits desktop ↔ mobile
- Mobile uses **canvas-as-hero per act** (not pinned)
- Drag: ≥24px visible hit target + 44px invisible tap area; `touch-action: none` on handles, `pan-y` elsewhere
- Hub: vertical Part-grouped list
- 3D: WebGL detection; fallback = sequence of stills with per-act captions defined in each topic's spec
- < 200KB gzipped per topic on first paint mobile
- `100svh` not `100vh` (Safari URL-bar issue)

### 11.3 Performance
- Hub first paint < 1.5s on 3G; budgets per-resource above
- Topic first paint < 2s on 3G
- LCP target: sticky canvas
- Lighthouse Performance ≥ 90 per topic
- Web Vitals tracking via Plausible custom events

### 11.4 SEO / share
- `<title>` per topic = topic name + " — An interactive book"
- `<meta name="description">` per topic = the hook phrase (one per topic in `topics.ts`)
- OG image per topic: static export of iconic canvas state via Playwright at build (v2 milestone)

### 11.5 Dark mode
Deferred to v3. `color-scheme: light` explicit.

### 11.6 Search
Deferred to v3 (≥10 topics).

### 11.7 Telemetry — Plausible (locked)
EU-hosted, cookie-less, no GDPR banner needed. Events: `pageview`, `act_reached` (per act), `interaction` (drag/slider/click on a canvas), `topic_completed` (last act reached). No PII. Goal: know which acts get skipped, which interactions never get touched.

### 11.8 Error and edge surfaces (NEW §)

- **404 (unknown topic):** `<NotFound/>` shows a faint constellation glyph crossed out in vermilion + "We don't have a topic at that URL yet. ↩ Back to the constellation." Honest, on-register.
- **Loading skeleton:** While `TopicGate` dynamically imports the topic chunk: a rough.js-decorated grey wireframe matches the sticky-canvas region's dimensions. Fades in/out at 150ms.
- **3D loading placeholder:** Each 3D scene defines a static SVG still that renders while r3f mounts; fades out at 250ms when 3D is ready.
- **WebGL absent:** Per-topic spec defines a sequence of stills + captions. The captions are part of the prose, not chrome.
- **JS disabled:** `<noscript>` shows "This site is an interactive playground — please enable JavaScript. If you can't, the book *Mathematics for Machine Learning* (mml-book.com) covers most of the same material in PDF form."
- **Share link UI:** Inline toast for 1500ms after copy; no modal.
- **Rename redirects:** `redirects.ts` maps old slugs to new slugs; `TopicGate` consults before falling through to 404.

### 11.9 Dependency-graph rendering at the hub
Each topic glyph hovered:
1. Highlights the topic's direct prereqs in faint vermilion (back-edges)
2. Highlights the topic's direct dependents in faint dim (forward-edges)
3. Shows a 1-line caption upper-left under the subtitle: "Eigenvalues — requires Matrices, leads to PCA"

## 12. Milestones (honest)

### M1 — Pattern proven (Vectors complete, hub up)
**Ships:**
- Hub with all 26 topics positioned + Vectors active + Start-here pointer
- Vectors topic page, 12 acts, ~7 playables, MDX prose, accessibility narrative
- Split-canvas template *built* but not yet used by a topic (proven via internal test page)

**Done means:**
- Scroll cold-open → closing on 1280×800 (13" MacBook baseline) works smoothly
- Mouse / touch / keyboard for every draggable
- URL hash updates on scroll; deep links land precisely per the hydration protocol
- Reduced-motion honored
- A11y audit passed (screen-reader narrative test for Vectors)
- Mobile 375px: readable single-column, drags work via touch
- Lighthouse Performance ≥ 90
- One Playwright smoke test green
- Split-canvas template passes its done-gate (§5.2 M1 done-gate)
- Cloudflare Pages preview deploys + Lighthouse CI green on `/vectors`

**Estimate:** 8–10 focused sessions.

### M2+ — to be specced and estimated *after M1 ships*

M2's content (likely Functions + Derivatives, since both have full specs in §7) will be estimated once M1's template work has revealed actual per-topic cost. The v1 plan's downstream estimates (M3–M8 totaling 80+ sessions) were anchored to nothing and have been removed.

What we know without estimating:
- The full 26-topic platform is the goal.
- M2 will at minimum re-use the template proven in M1; topic cost should *decrease* per topic as abstraction matures.
- After M1, each subsequent topic gets a full spec session (Vectors-density) before its build session.

## 13. Open Decisions Resolved

1. **Hub atmosphere:** static SVG + mouse-parallax. WebGL hub deferred to v3.
2. **Cold-open canvas:** read-only. First interactive is Stevin.
3. **Hamilton act:** prose-only. The 1865 letter to Archibald is the emotional content; no quaternion sphere.
4. **Gibbs 1881 parallelogram citation:** **dropped.** Unverified per research. Prose for `#addition` now says "Heaviside loved this; Tait considered it crude" without date-stamping a Gibbs observation that may not exist.
5. **Prose format:** **MDX from day one.** v1 migration trap avoided.
6. **Deploy target:** **Cloudflare Pages** (GitHub Pages rejected for SPA routing).
7. **Animation library:** **hand-rolled rAF only** in v1; react-spring forbidden.
8. **Touch target:** 24px visible, 44px invisible tap area (WCAG 2.5.8 AA + meets AAA tap-area).
9. **Telemetry:** Plausible (EU, cookie-less, no banner).
10. **Numerics:** verify `@fontsource/source-serif-4` ships oldstyle/lining; default to `tabular-nums` everywhere if not.
11. **Drop cap:** `<DropCap>` component (not `::first-letter`).
12. **Sticky canvas:** `min(100vh, 100svh)`; baseline viewport 1280×800.

## 14. Engineering Risks (expanded)

1. **Scroll-position-driven act state.** Hardest engineering pattern. Mitigation: deterministic math layer (§5.4) plus IO as perf hint.
2. **Deep-link hydration ping-pong.** Mitigation: explicit protocol (§3 Deep-link hydration protocol).
3. **Tween cancellation under fast scroll.** Mitigation: rAF cancellation tokens per canvas property (§5.6).
4. **Scroll-back state corruption.** Mitigation: per-act state preserved in memory (§5.7); explicit reset semantics (§5.9).
5. **rough.js seed drift.** Mitigation: seed pinned per scene; rough.js for non-interactive scaffolding only.
6. **KaTeX FOUT.** Mitigation: STIX Two Math lazy-loaded; render with `font-display: block`; pre-measure the box so layout doesn't shift on font ready.
7. **3D for `#nD` of Vectors and `#projection-interpretation` of LinReg.** First r3f appearance. If morph is jumpy, downgrade to discrete-state animation.
8. **Mobile drag-vs-scroll conflict.** Mitigation: non-sticky mobile canvas + `touch-action: none` on handles + `pan-y` elsewhere; verify before locking.
9. **Cloudflare Pages CI build time.** Free tier limits; mitigation: monorepo not yet established, single project, small bundles → well under limits.
10. **MDX + KaTeX + React-Router-DOM v6 + Vite 8 — three sub-risks.**
    - (a) **Component context in MDX.** Components embedded in `.mdx` (e.g. `<DragHandle>`) need `currentActId` via React Context, not props — MDX doesn't thread component props through. Mitigation: wrap each topic-page render in an `<ActContext.Provider value={...}>` and have embedded components read via `useActContext()`.
    - (b) **Math notation in MDX.** Pick one syntax: shortcut `$x^2$` via `remark-math` + `rehype-katex` plugin chain, OR explicit `<Eq math="x^2" />` component. Mixing both is the footgun. Decision: **shortcut `$...$`** via remark-math; `\$` for literal dollar signs in prose; reserved.
    - (c) **Plugin ordering in `@mdx-js/rollup`.** `remarkPlugins: [remarkMath]` MUST come before `rehypePlugins: [rehypeKatex]`. Reversing causes silent math-skip (the markdown is parsed as plain text, KaTeX never sees the `$...$` nodes). Mitigation: pin plugin order in `vite.config.ts` with a comment.
    - **First-day-of-M1 smoke test:** a single MDX file with `$x^2 + y^2 = r^2$` + `<DragHandle>` + a link via `<Link to="/vectors#stevin">`. Render at `/`, `/vectors`, and `/__test-mdx` to verify all four integrations survive HMR, route changes, and deep links.

---

**v2→v3 changes summary** (for git commit message):
- **HIGH-finding closures:**
  - Split-canvas template now has a full TypeScript component contract (§5.2): props interface, four sync modes (independent / left-drives-right / right-drives-left / co-mutating), per-consumer assignment, breakpoint behavior, M1 done-gate
  - Per-act state preservation specified: `actStateMap: Map<ActId, ActState>` lifted to `TopicPage`; SVG acts stay mounted; 3D acts (r3f) mount-on-near-viewport, unmount-on-far via `useNearViewport` sentinel (§5.7)
  - Layout cache invalidation list added to `useActState` (§5.4): resize / orientation / font-load / lazy-3D-mount / image-load all trigger recompute
  - `aria-live` debounce policy now a full state machine (§11.1): drag trailing-edge 350ms, pointerup immediate, slider throttle 250ms, act-transition immediate-highest-priority, degenerate-case immediate-high-priority, with cancellation precedence rules
  - MML chapter mappings corrected (§2 reference table): Functions and change marked supplementary (MML assumes function defs); Derivatives now 5.1–5.2; Probability 6.1–6.3; Expectation 6.4 (not 6.3); Distributions 6.5–6.6 (not 6.4); K-means marked supplementary (MML Ch 11 is GMM-specific)
  - Cloudflare Pages config fully specified (§10): build command, output dir, Node 20.x pinned, preview-per-PR, `_redirects` at edge, Lighthouse CI on `/vectors`
  - LinReg `#calculus-on-loss` (§7.5 act 6) explicitly clarifies "derivative-finds-min, not gradient descent" — no Optimization prereq sneaked in
- **MED-finding closures:**
  - MDX risk expanded into three concrete sub-risks (§14.10): Component Context wiring, math-syntax pick (decision: `$...$` shortcut, not `<Eq>` component), plugin order pinning in `vite.config.ts`. First-day-of-M1 smoke test spec added.
  - `localStorage` key namespaced: `learn-ai:v1:state` with schema-version migration policy (§3)
- **LOW-finding closures:**
  - Tone checklist defined: 8 bullets at the top of §7 Per-Topic Specs covering first-person allowed, dated human terms, "you" not "the reader," contractions, self-deprecating asides, no engineer jargon, dated/located/humanly-motivated historical anchor, ban on "obviously"
  - M1 done-criteria cleaned: removed dead "all open decisions resolved" criterion; added split-canvas template done-gate and Cloudflare Lighthouse CI green
- **Acknowledged open (deferred, non-blocking for M1):**
  - Constellation positioning at 4K and 320px (LOW finding 12) — defer to mobile/responsive pass during M1 final hardening
  - Per-consumer mobile split-canvas fallbacks for 7 topics — addressed structurally via §5.2 "stacks on mobile, prose acknowledges the degraded simultaneity"; per-topic mobile prose written at each topic's build cycle
  - `redirects.ts` edge vs client choice — chose edge via Cloudflare `_redirects` generated at build (§10 Cloudflare config)
  - The critic-recognized planning win to preserve: M1 confident at 8–10 sessions, M2+ "to be specced and estimated after M1 ships." No more fictional downstream totals.

**v1→v2 changes summary** (for git history reference):
- Added MML as primary mathematical reference (§2) with per-topic chapter map
- Added 2 topics (GMM, SVM — MML chs 11, 12); catalog now 26
- Catalog re-ordered: Expectation before Distributions; Optimization after LinReg; PCA near Eigenvalues
- Added second template: split-canvas (§5.2) for 7 paired-view topics
- Switched to MDX from day one
- Deploy locked to Cloudflare Pages (not GitHub Pages)
- Deep-link hydration protocol specced (§3)
- Accessibility upgraded from checklist to per-act dynamic narrative (§11.1)
- Full per-act specs written for Functions, Derivatives, Probability, Linear Regression (§7.2–7.5)
- Hamilton letter dated 1865 (not 1843; 1843 is the event); Gibbs 1881 attribution dropped; *Nature* moratorium replaced with "Ball tried, they ignored him"
- Per-topic dependency table re-anchored to 26 topics
- Hub: Start here pointer, revisit behavior, always-visible labels
- Engineering risks expanded with hidden ones (scroll-back state, tween cancel, rough seed, KaTeX FOUT, Cloudflare deploy)
- §14 Error/edge surfaces NEW (404, JS-off, loading skeletons, share UI)
- Milestones honest: M1 confident, M2+ "to be estimated after M1"
- Open decisions resolved (12 items)
