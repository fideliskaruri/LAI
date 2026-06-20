# Platform feature roadmap

The book (PLAN.md) is the foundation. This document is the parallel track for industry-grade platform features that layer on top — informed by a survey of fast.ai, deeplearning.ai, Hugging Face Learn, Polo Club, Distill, Quantum Country, Khanmigo, Observable, transformers.js, and others.

**The frame:** the book is the cathedral; platform features are chapels off the nave, in the same stone. Anything that smells like a course shell (badges, progress %, "98% complete!", streaks, certificates) is rejected.

## The single biggest unforced error to avoid

> Bolting a course-platform UX onto the editorial register.

Brilliant looks like a video game; Coursera looks like an HR system; DeepLearning.AI looks like a SaaS dashboard. The instant you show a learner "3/26 chapters complete," you've broken the spell — they're now grinding, not reading. PLAN's explicit non-goals (no quizzes, no progress, no accounts) protect this. Every feature below must preserve it.

**Corollary:** don't build the LLM tutor as a permanent right-rail chat panel. Khanmigo proves this fails — it becomes the lazy default and readers stop reading the prose. Marginalia, summoned, footnote-shaped.

## The 10 features, ordered by build sequence

### Build now (parallel to chapters 2–10)

#### 1. Spaced-review margin cards — *Quantum Country* style
Hairline-ruled cards embedded inline in the prose, "Recall:" prompt in italic serif, answer hidden behind vermilion link. Quietly remembered via `localStorage`; due cards float to a small "↻ due" tray at the top of the constellation on revisit. No streaks, no XP — Anki without the Anki feel.

- Precedent: [Quantum Country](https://quantum.country/qm) by Andy Matuschak. Inline cards in long-form essays.
- Cost: small (SM-2 scheduler in `localStorage`, ~200 LOC + MDX `<Recall>` directive)
- First consumer: any chapter, retrofit Vectors

#### 2. word2vec atlas page (Feature 4 pilot)
A permanent URL `/atlas/word2vec` — a constellation node in muted colour (it's infrastructure, not a chapter). Real 768-dim embeddings; the Vectors `#closing` scene already cites `king − man + woman` and promises the atlas. Browse, search, do vector arithmetic, see nearest neighbours.

- Precedent: [TF Embedding Projector](https://projector.tensorflow.org/). The bar is lower because we don't need t-SNE / UMAP from scratch — pre-projected to 2D.
- Cost: medium (data file ~30MB, 2D viz, search UI)
- First consumer: Vectors chapter cites `/atlas/word2vec#king`

#### 3. Inline runnable Python via Pyodide primitive
A `<PyREPL>` MDX component. Ink-on-cream code block, JetBrains Mono, hairline vermilion "run" affordance at the gutter — no notebook chrome, no cell numbers. Lazily booted (Pyodide is ~10MB — must be on-demand, not eager). One REPL per chapter, persistent state across blocks within a chapter.

- Precedent: [Pyodide quickstart](https://pyodide.org/en/stable/usage/quickstart.html). Bar to clear: [JupyterLite](https://jupyter.org/try-jupyter/lab/) but without the heavy chrome.
- Cost: medium (loader + worker isolation + state-per-chapter; the trap is shared globals across blocks)
- First consumer: LinReg (ch.10) — least-squares with NumPy

#### 4. Printable "Colophon edition" — PDF + ePub
`/print` builds a paged PDF per chapter + a full-book ePub. Playables become static screenshots with a "live at `learn-ai.dev/vectors#stevin`" sidenote. Preserves the dignity of the prose for offline reading. Signals to readers: this is a book, not a webapp.

- Precedent: [Gwern](https://gwern.net/) ePubs; [Feynman Lectures online](https://www.feynmanlectures.caltech.edu/) print mirror. Tools: Paged.js or Vivliostyle.
- Cost: medium (paged layout + screenshot pipeline + ePub generator)
- Most valuable after Part I (10 chapters) is complete

### Build mid (chapters 10–15 landing)

#### 5. Footnote-shaped LLM tutor (Marginalia, not chat)
Reader highlights any phrase → a vermilion footnote-marker (✦) appears in the margin → expanding opens a small inline panel grounded *only* in (a) the current chapter's MDX, (b) MML's matching section, (c) primary sources from §11. Prompt enforces editorial voice ("answer in 2 sentences, in the same register; cite the marginal source"). System can refuse — "this chapter doesn't cover that; try ch.12" — which is the honest behavior [Khanmigo](https://khanmigo.ai/) botches.

- Precedent against: [Khanmigo](https://khanmigo.ai/), [Coursera Coach](https://www.coursera.org/coursera-coach) — permanent right-rail chats. Both feel like popup ads.
- Precedent for: NYT inline "explain this" glosses; Claude.ai artifact side panel — summoned, not permanent.
- Cost: medium (RAG pipeline + voice-locked system prompt + per-chapter retrieval index + cheap model — Haiku-class)
- Don't enable until ch.10 (LinReg) is up; needs ≥4 chapters of grounding corpus

#### 6. Personalized "next chapter" via dependency graph
The constellation already encodes prereqs. Use them. After a chapter, the footer "Next →" picks from unread direct-dependents weighted by what the reader spent time on. Hub's "Start here →" pointer extends to highlight a *path*, vermilion edges flickering along the dependency arrows. Reading-depth (scroll % × time × playable-interaction count) is the signal — no quizzes.

- Precedent: [3Blue1Brown Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra) — beautifully ordered, with "pre-reqs" sidebars.
- Cost: small
- Needs 6+ chapters to be meaningful

#### 7. First capstone: `/build/least-squares-by-hand`
A long-form essay with Pyodide blocks (Feature 3) — prose is the spine; code is footnoted into it. Closes with "if you ran every block, you trained a thing. Here's what it can do." Direct continuation of the Stevin/Gauss/Hamilton register: the reader becomes a discoverer.

- Precedent: [fast.ai lesson 1](https://course.fast.ai/Lessons/lesson1.html), [Karpathy nanoGPT](https://github.com/karpathy/nanoGPT) — but in book voice, not lecture voice.
- Cost: large (real writing + real testing of Pyodide blocks under realistic browser memory)
- Strictly downstream of ch.10 (LinReg)

### Build late (chapters 15+)

#### 8. WebGPU/ONNX in-browser inference
Real models, not faked data. Polo Club's [Transformer Explainer](https://poloclub.github.io/transformer-explainer/) runs GPT-2 small in-browser via ONNX Runtime Web; [transformers.js](https://huggingface.co/docs/transformers.js) does the same for hundreds of models. Reserved for the load-bearing closing acts of Convolutions (LeNet on MNIST digits *you* draw), Embeddings, Attention, Transformers, Diffusion.

- Cost: large (per-model packaging, INT8 quant, WebGPU fallback to WASM, cache strategy)
- Blocked by the corresponding chapters; embeddings projector and MNIST classifier can be prototyped standalone

#### 9. Per-paragraph annotation — footnotes, not forum
Vermilion `¶` appears in the margin of paragraphs with reader notes; click expands them inline as a marginal thread. Identity is GitHub OAuth (no accounts of *our* making — PLAN non-goal preserved). Cap depth at 2. No upvotes, no karma — chronological only. Moderated by a tiny allowlist. The book grows footnotes the way TAOCP does.

- Precedent for: [Hypothes.is](https://web.hypothes.is/), Substack inline comments, NYT *Annotations*.
- Precedent against: GitHub Discussions, HN threads — sever conversation from text.
- Cost: medium (Cloudflare D1 + Workers; GitHub OAuth)
- Late — only valuable once ≥5 chapters and ≥100 readers

#### 10. Reader gallery — `/exhibits`
Readers pin a canvas state (specific arrows in Vectors `#addition`, a specific regression fit, a specific attention pattern) → it becomes a shareable URL + an entry in `/exhibits` with a one-line caption. The exhibit page is curated (allowlist), serif-set, captioned like museum cards. *Not* a social feed.

- Precedent: [Observable explore](https://observablehq.com/explore), [Are.na](https://www.are.na/) editorial channels. Not portfolios — exhibits.
- Cost: medium (snapshot serialization per canvas + curation queue)
- Late (M6+); requires ≥5 chapters with rich draggable state

## How this affects PLAN.md milestones

These features **don't replace milestones; they add a parallel track.**

- **Spaced-review cards, word2vec atlas, Pyodide primitive, printable PDF** added to M2 — small enough not to block chapter work.
- **LLM marginalia** becomes a new milestone, gated behind "≥4 chapters live."
- **First capstone** is the natural "end of Part II preview" moment after ch.10.
- **WebGPU inference** rides inside the milestones for ch.19/20/21/22/25 — not its own milestone; each chapter's closing act *is* the milestone.
- **Annotation, exhibits** are late milestones, *contingent on having an audience.* Don't pre-build community features before there's a community.

The PLAN non-goals list should be amended to clarify what remains rejected even as the platform grows: no completion progress %, no course shell, no streaks, no certificates of completion — to immunize against scope-creep pressure once these features land.
