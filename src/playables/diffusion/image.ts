/**
 * Shared pixel-image helpers for the Diffusion chapter.
 *
 * We render a small 16×16 image of a vermilion arrow on a cream background.
 * Each "pixel" is a value in [0, 1] for vermilion-ness — 0 = cream, 1 = full
 * vermilion. The forward process adds Gaussian noise per pixel; we clip
 * at the boundaries when displaying.
 */

export const PIXEL_GRID = 16

/** Hand-painted vermilion arrow pointing right, on a cream background. */
function makeArrow(): number[][] {
  const g = PIXEL_GRID
  const img: number[][] = Array.from({ length: g }, () => Array(g).fill(0))
  // Horizontal shaft, rows 7–8, cols 2–10
  for (let r = 7; r <= 8; r++) {
    for (let c = 2; c <= 10; c++) img[r][c] = 1
  }
  // Arrowhead — triangle with tip at (col 13)
  // Row 7–8 has full body up to col 11; the head extends rows 5–10 narrowing
  for (let r = 5; r <= 10; r++) {
    const dist = Math.abs(r - 7.5)
    const reach = 13 - Math.round(dist * 1.5)
    for (let c = 10; c <= reach; c++) img[r][c] = 1
  }
  return img
}

export const CLEAN_IMAGE = makeArrow()

/**
 * Cumulative variance under the forward process:
 *   x_t = sqrt(alpha_bar_t) * x_0 + sqrt(1 - alpha_bar_t) * eps
 * where alpha_bar_t = prod_{s<=t} (1 - beta_s).
 *
 * We use a linear beta schedule from beta_min to beta_max over T steps.
 * For visualization we collapse T into a normalized t in [0, 1], so the
 * "effective variance" sigma2(t) maps directly to how much noise we add.
 */
const BETA_MIN = 1e-4
const BETA_MAX = 0.02
export const T_STEPS = 1000

/** Cumulative alpha_bar_t for a discrete step t in [0, T_STEPS]. */
export function alphaBarAt(t: number): number {
  let logAlphaBar = 0
  for (let s = 1; s <= t; s++) {
    const frac = (s - 1) / (T_STEPS - 1)
    const beta = BETA_MIN + frac * (BETA_MAX - BETA_MIN)
    logAlphaBar += Math.log(1 - beta)
  }
  return Math.exp(logAlphaBar)
}

/** Pre-computed alpha_bar curve sampled at a coarse grid for plotting. */
export function alphaBarCurve(samples = 41): { t: number; alphaBar: number; beta: number }[] {
  const arr: { t: number; alphaBar: number; beta: number }[] = []
  let logAlphaBar = 0
  let lastT = 0
  for (let i = 0; i < samples; i++) {
    const t = Math.round((i / (samples - 1)) * T_STEPS)
    // Step forward in log-alpha-bar from lastT to t
    for (let s = lastT + 1; s <= t; s++) {
      const frac = (s - 1) / (T_STEPS - 1)
      const beta = BETA_MIN + frac * (BETA_MAX - BETA_MIN)
      logAlphaBar += Math.log(1 - beta)
    }
    lastT = t
    const frac = t === 0 ? 0 : (t - 1) / (T_STEPS - 1)
    const beta = BETA_MIN + frac * (BETA_MAX - BETA_MIN)
    arr.push({ t, alphaBar: Math.exp(logAlphaBar), beta })
  }
  return arr
}

/** beta_t for a given discrete step. */
export function betaAt(t: number): number {
  if (t <= 0) return BETA_MIN
  const frac = Math.min(1, (t - 1) / (T_STEPS - 1))
  return BETA_MIN + frac * (BETA_MAX - BETA_MIN)
}

/**
 * Deterministic per-(t, r, c) noise. We use a simple integer hash → Box-Muller
 * so the noise field is reproducible for a given (seed, t, r, c). This means
 * dragging the slider smoothly *reveals* the noise instead of resampling
 * every frame — closer to the way diffusion-explainer-style demos handle it.
 */
function hash3(seed: number, a: number, b: number): number {
  let h = seed | 0
  h = Math.imul(h ^ a, 0x85ebca6b)
  h = Math.imul(h ^ b, 0xc2b2ae35)
  h = (h ^ (h >>> 16)) >>> 0
  return h / 0xffffffff
}

function gauss(seed: number, a: number, b: number): number {
  const u1 = Math.max(1e-6, hash3(seed, a, b))
  const u2 = hash3(seed, a + 31337, b + 1009)
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

/**
 * Noisy image at step t. Returns values clipped to [0, 1] for display.
 *
 *   x_t = sqrt(alphaBar) * x_0 + sqrt(1 - alphaBar) * noise
 */
export function noisyImageAt(
  t: number,
  seed = 7,
  clean: number[][] = CLEAN_IMAGE,
): number[][] {
  const aBar = alphaBarAt(t)
  const sqrtA = Math.sqrt(aBar)
  const sqrtOne = Math.sqrt(1 - aBar)
  const g = PIXEL_GRID
  const out: number[][] = Array.from({ length: g }, () => Array(g).fill(0))
  for (let r = 0; r < g; r++) {
    for (let c = 0; c < g; c++) {
      const x = sqrtA * clean[r][c] + sqrtOne * gauss(seed, r, c)
      out[r][c] = Math.max(0, Math.min(1, x))
    }
  }
  return out
}

/**
 * "Predicted clean image" from a noisy x_t — what an ideal denoiser would
 * recover. We cheat (it's pedagogy): we know x_0 and we know the noise, so
 * the predicted noise is exact and the predicted clean is exact too.
 *
 * Strength parameter in [0, 1] models how well-trained the denoiser is:
 *   strength=0 → returns x_t unchanged (untrained)
 *   strength=1 → returns the clean image (oracle denoiser)
 */
export function denoisedImageAt(
  t: number,
  strength: number,
  seed = 7,
  clean: number[][] = CLEAN_IMAGE,
): number[][] {
  const noisy = noisyImageAt(t, seed, clean)
  const g = PIXEL_GRID
  const out: number[][] = Array.from({ length: g }, () => Array(g).fill(0))
  for (let r = 0; r < g; r++) {
    for (let c = 0; c < g; c++) {
      const x = noisy[r][c] + strength * (clean[r][c] - noisy[r][c])
      out[r][c] = Math.max(0, Math.min(1, x))
    }
  }
  return out
}

/**
 * Convert a [0,1] pixel value to a CSS color string interpolating
 * cream → vermilion. Used by every diffusion playable that paints pixels.
 *
 * cream:     #F2EBD7  (R 242, G 235, B 215)
 * vermilion: #D14B2D  (R 209, G  75, B  45)
 */
export function pixelToColor(v: number): string {
  const t = Math.max(0, Math.min(1, v))
  const r = Math.round(242 * (1 - t) + 209 * t)
  const g = Math.round(235 * (1 - t) + 75 * t)
  const b = Math.round(215 * (1 - t) + 45 * t)
  return `rgb(${r},${g},${b})`
}
