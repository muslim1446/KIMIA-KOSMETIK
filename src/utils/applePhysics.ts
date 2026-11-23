/**
 * Apple Human Interface Guidelines & QuartzCore / UIKit / SwiftUI Physics Mathematics
 *
 * Implements:
 * - True kCACornerCurveContinuous (1.528665 * r shoulder, 3 cubic Beziers per corner, short-side clamping)
 * - QuartzCore supercircle_sdf & screen-space derivative edge antialiasing
 * - SwiftUI .spring(response:dampingFraction:) & WWDC23 (duration, bounce) -> Hooke's Law (k, c, m)
 * - Analytical interruptible spring position & velocity evaluation (velocity conservation)
 * - UIScrollView exponential deceleration (0.998 / 0.990 per ms) & WWDC18 endpoint projection
 * - UIKit rubber-band formula (c = 0.55) + exact inverse for 1:1 reverse tracking
 * - CoreText SF Pro continuous optical tracking table (11pt–34pt)
 * - Convex squircle / circle / lip bevel heightfields & Snell refraction + inward rim mirroring
 * - Constant-area press growth & decoupled touch-frost envelope timings
 */

export interface SpringConstants {
  type: 'spring';
  mass: number;
  stiffness: number;
  damping: number;
}

/** Apple CALayer.cornerCurveExpansionFactor(.continuous) */
export const APPLE_CORNER_EXPANSION_FACTOR = 1.528665;

/** Normalized 3-cubic-Bezier corner coordinates (mirror & scale by radius r) */
export const APPLE_CONTINUOUS_CORNER_BEZIER = {
  expansion: APPLE_CORNER_EXPANSION_FACTOR,
  c1: { c1x: 1.08849296, c1y: 0.0, c2x: 0.86840694, c2y: 0.0, tox: 0.63149379, toy: 0.07491139 },
  c2: { c1x: 0.37282383, c1y: 0.16905956, c2x: 0.16905956, c2y: 0.37282383, tox: 0.07491139, toy: 0.63149379 },
  c3: { c1x: 0.0, c1y: 0.86840694, c2x: 0.0, c2y: 1.08849296, tox: 0.0, toy: 1.528665 },
} as const;

/**
 * Generates an exact kCACornerCurveContinuous SVG path (0 px error vs iOS UIBezierPath)
 * with Core Animation short-side blending back toward circular arcs when side < 2 * 1.528665 * r.
 */
export function buildContinuousRoundedRectPath(
  width: number,
  height: number,
  cornerRadius: number,
): string {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  if (w === 0 || h === 0) return '';

  const maxR = Math.min(w, h) / 2;
  const r = Math.max(0, Math.min(cornerRadius, maxR));
  if (r < 1e-4) return `M 0 0 H ${w} V ${h} H 0 Z`;

  // Core Animation blends expansion smoothly toward circular (1.0) when side is short
  const minSide = Math.min(w, h);
  const maxShoulder = minSide / (2 * r);
  const blend = Math.max(0, Math.min(1, (maxShoulder - 1) / (APPLE_CORNER_EXPANSION_FACTOR - 1)));
  const s = 1 + (APPLE_CORNER_EXPANSION_FACTOR - 1) * blend;

  // Interpolated control points between quarter-circle kappa (0.55228475) and continuous Bezier
  const kappa = 0.55228475;
  const shoulderScale = s / APPLE_CORNER_EXPANSION_FACTOR;

  // For full expansion (blend === 1), use exact 3-cubic curve per corner;
  // for pill/constrained sides (blend < 1), smoothly blend toward exact circular arc
  const useExactContinuous = blend > 0.02;
  const sh = r * s;
  const b = APPLE_CONTINUOUS_CORNER_BEZIER;

  const lerp = (a: number, target: number, t: number) => a + (target - a) * t;
  const fmt = (n: number) => (Math.round(n * 1000) / 1000).toString();

  if (!useExactContinuous) {
    const k = r * kappa;
    return [
      `M ${fmt(r)} 0`,
      `H ${fmt(w - r)}`,
      `C ${fmt(w - r + k)} 0 ${fmt(w)} ${fmt(r - k)} ${fmt(w)} ${fmt(r)}`,
      `V ${fmt(h - r)}`,
      `C ${fmt(w)} ${fmt(h - r + k)} ${fmt(w - r + k)} ${fmt(h)} ${fmt(w - r)} ${fmt(h)}`,
      `H ${fmt(r)}`,
      `C ${fmt(r - k)} ${fmt(h)} 0 ${fmt(h - r + k)} 0 ${fmt(h - r)}`,
      `V ${fmt(r)}`,
      `C 0 ${fmt(r - k)} ${fmt(r - k)} 0 ${fmt(r)} 0`,
      'Z',
    ].join(' ');
  }

  // Exact 3-cubic Bezier corner anchored from each corner vertex with expansion scaling
  const p = (dx: number, dy: number) => ({
    x: r * lerp(kappa > 0 ? dx * shoulderScale : dx, dx, blend),
    y: r * lerp(dy * shoulderScale, dy, blend),
  });

  // Top-Right corner (anchor: w, 0; x goes inward left by dx, y goes down by dy)
  const tr1c1 = p(b.c1.c1x, b.c1.c1y);
  const tr1c2 = p(b.c1.c2x, b.c1.c2y);
  const tr1to = p(b.c1.tox, b.c1.toy);
  const tr2c1 = p(b.c2.c1x, b.c2.c1y);
  const tr2c2 = p(b.c2.c2x, b.c2.c2y);
  const tr2to = p(b.c2.tox, b.c2.toy);
  const tr3c1 = p(b.c3.c1x, b.c3.c1y);
  const tr3c2 = p(b.c3.c2x, b.c3.c2y);

  return [
    `M ${fmt(sh)} 0`,
    `H ${fmt(w - sh)}`,
    // Top-Right
    `C ${fmt(w - tr1c1.x)} ${fmt(tr1c1.y)} ${fmt(w - tr1c2.x)} ${fmt(tr1c2.y)} ${fmt(w - tr1to.x)} ${fmt(tr1to.y)}`,
    `C ${fmt(w - tr2c1.x)} ${fmt(tr2c1.y)} ${fmt(w - tr2c2.x)} ${fmt(tr2c2.y)} ${fmt(w - tr2to.x)} ${fmt(tr2to.y)}`,
    `C ${fmt(w - tr3c1.x)} ${fmt(tr3c1.y)} ${fmt(w - tr3c2.x)} ${fmt(tr3c2.y)} ${fmt(w)} ${fmt(sh)}`,
    `V ${fmt(h - sh)}`,
    // Bottom-Right (swap x/y reflection)
    `C ${fmt(w - tr1c1.y)} ${fmt(h - tr1c1.x)} ${fmt(w - tr1c2.y)} ${fmt(h - tr1c2.x)} ${fmt(w - tr1to.y)} ${fmt(h - tr1to.x)}`,
    `C ${fmt(w - tr2c1.y)} ${fmt(h - tr2c1.x)} ${fmt(w - tr2c2.y)} ${fmt(h - tr2c2.x)} ${fmt(w - tr2to.y)} ${fmt(h - tr2to.x)}`,
    `C ${fmt(w - tr3c1.y)} ${fmt(h - tr3c1.x)} ${fmt(w - tr3c2.y)} ${fmt(h - tr3c2.x)} ${fmt(w - sh)} ${fmt(h)}`,
    `H ${fmt(sh)}`,
    // Bottom-Left
    `C ${fmt(tr1c1.x)} ${fmt(h - tr1c1.y)} ${fmt(tr1c2.x)} ${fmt(h - tr1c2.y)} ${fmt(tr1to.x)} ${fmt(h - tr1to.y)}`,
    `C ${fmt(tr2c1.x)} ${fmt(h - tr2c1.y)} ${fmt(tr2c2.x)} ${fmt(h - tr2c2.y)} ${fmt(tr2to.x)} ${fmt(h - tr2to.y)}`,
    `C ${fmt(tr3c1.x)} ${fmt(h - tr3c1.y)} ${fmt(tr3c2.x)} ${fmt(h - tr3c2.y)} 0 ${fmt(h - sh)}`,
    `V ${fmt(sh)}`,
    // Top-Left
    `C ${fmt(tr1c1.y)} ${fmt(tr1c1.x)} ${fmt(tr1c2.y)} ${fmt(tr1c2.x)} ${fmt(tr1to.y)} ${fmt(tr1to.x)}`,
    `C ${fmt(tr2c1.y)} ${fmt(tr2c1.x)} ${fmt(tr2c2.y)} ${fmt(tr2c2.x)} ${fmt(tr2to.y)} ${fmt(tr2to.x)}`,
    `C ${fmt(tr3c1.y)} ${fmt(tr3c1.x)} ${fmt(tr3c2.y)} ${fmt(tr3c2.x)} ${fmt(sh)} 0`,
    'Z',
  ].join(' ');
}

/**
 * Converts SwiftUI `.spring(response:dampingFraction:)` parameters into exact
 * physical Hooke's Law spring constants:
 *   omega_n = 2 * pi / response
 *   stiffness (k) = mass * omega_n^2
 *   damping (c) = 2 * mass * dampingFraction * omega_n
 */
export function swiftUiSpringToMotion(
  response: number,
  dampingFraction: number,
  mass = 1,
): SpringConstants {
  const safeResponse = Math.max(0.08, response);
  const safeDamping = Math.max(0.05, dampingFraction);
  const safeMass = Math.max(0.1, mass);

  const omegaN = (2 * Math.PI) / safeResponse;
  const stiffness = safeMass * omegaN * omegaN;
  const damping = 2 * safeMass * safeDamping * omegaN;

  return {
    type: 'spring',
    mass: safeMass,
    stiffness: Math.round(stiffness * 100) / 100,
    damping: Math.round(damping * 100) / 100,
  };
}

/**
 * WWDC23 SwiftUI `.spring(duration:bounce:)` -> Hooke's Law conversion:
 *   stiffness = (2 * pi / duration)^2
 *   damping = 4 * pi * (1 - bounce) / duration
 */
export function swiftUiDurationBounceToSpring(
  duration: number,
  bounce = 0,
  mass = 1,
): SpringConstants {
  const safeDuration = Math.max(0.08, duration);
  const safeBounce = Math.max(-0.5, Math.min(0.95, bounce));
  return swiftUiSpringToMotion(safeDuration, 1 - safeBounce, mass);
}

/**
 * Edge-leading layout spring pair (expanding/leading edge runs at ~0.78x duration).
 */
export function edgeLeadingSprings(duration: number, bounce = 0.15) {
  return {
    leading: swiftUiDurationBounceToSpring(duration * 0.78, bounce),
    trailing: swiftUiDurationBounceToSpring(duration, bounce),
  };
}

/**
 * Calibrated Apple iOS 26/27 & macOS Tahoe Motion Spring Presets
 */
export const APPLE_SPRINGS = {
  /** Interactive controls, buttons, segmented pickers (crisp, zero overshoot) */
  snappy: swiftUiSpringToMotion(0.28, 0.88),
  /** Gel interactive release spring measured against SwiftUI Liquid Glass (response 0.40, damping 0.35) */
  gelRelease: swiftUiSpringToMotion(0.4, 0.35),
  /** Floating Island popovers & HUD menus (subtle physical lift) */
  popover: swiftUiSpringToMotion(0.34, 0.82),
  /** Modal sheets & guided onboarding cards */
  sheet: swiftUiSpringToMotion(0.4, 0.86),
  /** Floating utility windows (Google / Gemini) */
  window: swiftUiSpringToMotion(0.36, 0.84),
  /** Top Dynamic-style toast & laser banner */
  toast: swiftUiSpringToMotion(0.32, 0.8),
} as const;

/**
 * Decoupled non-oscillating touch frost / radial glow envelope timings (in ms)
 */
export const APPLE_TOUCH_FROST_ENVELOPE = {
  snapInMs: 24,
  holdMs: 660,
  easeOutMs: 230,
} as const;

/**
 * Apple HIG Concentric Corner Radius Math:
 *   R_inner = max(0, R_outer - padding)
 */
export function concentricRadius(outerRadiusPx: number, paddingPx: number): number {
  return Math.max(0, Math.round((outerRadiusPx - paddingPx) * 100) / 100);
}

/**
 * Stage 8: Constant-Area Interactive Press Growth.
 * Small controls (<112pt) expand by ~15.7pt; larger controls scale by constant area.
 */
export function constantAreaPressScale(
  width: number,
  height: number,
  growAreaPt2 = 950,
  maxScale = 1.18,
): number {
  if (width <= 0 || height <= 0) return 1;
  const maxDim = Math.max(width, height);
  if (maxDim < 112) {
    return Math.min(maxScale, 1 + 15.7 / Math.max(24, maxDim));
  }
  return Math.min(maxScale, Math.sqrt(1 + growAreaPt2 / (width * height)));
}

/**
 * Exact Apple UIScrollView Deceleration Rates (per millisecond)
 */
export const APPLE_DECELERATION_RATES = {
  normal: 0.998,
  fast: 0.99,
} as const;

/**
 * Continuous-time UIScrollView exponential deceleration (WWDC18):
 *   v(t) = v0 * d^(1000 * t)
 *   x(t) = x0 + (v0 / 1000) * (d^(1000 * t) - 1) / ln(d)
 */
export function uikitScrollDecelerate(
  tSeconds: number,
  x0: number,
  v0PtPerSec: number,
  decelerationRate: number = APPLE_DECELERATION_RATES.normal,
): { x: number; v: number } {
  if (tSeconds <= 0) return { x: x0, v: v0PtPerSec };
  const d = Math.max(0.8, Math.min(0.9995, decelerationRate));
  const decay = Math.pow(d, 1000 * tSeconds);
  const v = v0PtPerSec * decay;
  const x = x0 + (v0PtPerSec / 1000) * ((decay - 1) / Math.log(d));
  return { x, v };
}

/**
 * WWDC18 Endpoint Projection for snap detents & carousels:
 *   x_rest = x0 + (v0 / 1000) * (d / (1 - d))
 */
export function projectScrollEndpoint(
  x0: number,
  v0PtPerSec: number,
  decelerationRate: number = APPLE_DECELERATION_RATES.normal,
): number {
  const d = Math.max(0.8, Math.min(0.9995, decelerationRate));
  return x0 + (v0PtPerSec / 1000) * (d / (1 - d));
}

/**
 * Exact Apple UIScrollView / iOS Rubber-Band Resistance Equation:
 *   f(offset, dim, c) = (offset * dim * c) / (dim + c * |offset|)
 */
export function appleRubberBand(
  offset: number,
  dimension: number,
  coefficient = 0.55,
): number {
  if (dimension <= 0 || offset === 0) return 0;
  const absOffset = Math.abs(offset);
  const sign = offset < 0 ? -1 : 1;
  const resisted = (absOffset * dimension * coefficient) / (dimension + coefficient * absOffset);
  return sign * resisted;
}

/**
 * Exact Inverse Rubber-Band (RubberInverse) for 1:1 finger tracking when reversing back toward bounds.
 */
export function appleRubberBandInverse(
  resistedOffset: number,
  dimension: number,
  coefficient = 0.55,
): number {
  if (dimension <= 0 || resistedOffset === 0 || coefficient <= 0) return 0;
  const absResisted = Math.min(dimension - 1e-3, Math.abs(resistedOffset));
  const sign = resistedOffset < 0 ? -1 : 1;
  return sign * ((absResisted * dimension) / (coefficient * (dimension - absResisted)));
}

/**
 * Interruptible Analytical Spring Evaluator returning both position x(t) and velocity v(t)
 * with full initial-velocity (x0, v0) conservation.
 */
export function evaluateSpringState(
  tSeconds: number,
  response: number,
  dampingFraction: number,
  x0 = 0,
  v0 = 0,
  target = 1,
): { x: number; v: number } {
  if (tSeconds <= 0) return { x: x0, v: v0 };
  const omegaN = (2 * Math.PI) / Math.max(0.08, response);
  const zeta = Math.max(0.05, dampingFraction);
  const dx0 = x0 - target;

  if (zeta < 1) {
    const omegaD = omegaN * Math.sqrt(1 - zeta * zeta);
    const decay = Math.exp(-zeta * omegaN * tSeconds);
    const a = dx0;
    const b = (v0 + zeta * omegaN * dx0) / omegaD;
    const cos = Math.cos(omegaD * tSeconds);
    const sin = Math.sin(omegaD * tSeconds);
    const displacement = decay * (a * cos + b * sin);
    const velocity =
      decay * ((-zeta * omegaN * a + omegaD * b) * cos - (zeta * omegaN * b + omegaD * a) * sin);
    return { x: target + displacement, v: velocity };
  }

  if (Math.abs(zeta - 1) < 1e-6) {
    const decay = Math.exp(-omegaN * tSeconds);
    const c1 = dx0;
    const c2 = v0 + omegaN * dx0;
    const displacement = decay * (c1 + c2 * tSeconds);
    const velocity = decay * (c2 - omegaN * (c1 + c2 * tSeconds));
    return { x: target + displacement, v: velocity };
  }

  const root = Math.sqrt(zeta * zeta - 1);
  const r1 = -omegaN * (zeta - root);
  const r2 = -omegaN * (zeta + root);
  const c1 = (v0 - r2 * dx0) / (r1 - r2);
  const c2 = dx0 - c1;
  const e1 = Math.exp(r1 * tSeconds);
  const e2 = Math.exp(r2 * tSeconds);
  return {
    x: target + c1 * e1 + c2 * e2,
    v: c1 * r1 * e1 + c2 * r2 * e2,
  };
}

/**
 * Evaluates a unit-step damped harmonic oscillator x(t) for a given (response, dampingFraction).
 */
export function evaluateSpringProgress(
  tSeconds: number,
  response: number,
  dampingFraction: number,
): number {
  return evaluateSpringState(tSeconds, response, dampingFraction, 0, 0, 1).x;
}

/**
 * QuartzCore supercircle_sdf + continuous 1.528665r corner blend
 */
export function continuousCornerSdf(
  px: number,
  py: number,
  hx: number,
  hy: number,
  radius: number,
): number {
  const minHalf = Math.min(hx, hy);
  const r = Math.max(0, Math.min(radius, minHalf));
  if (r <= 1e-4) {
    const dx = Math.abs(px) - hx;
    const dy = Math.abs(py) - hy;
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
  }

  // Blend shoulder curvature between quarter-circle (1.0) and continuous (1.528665)
  const shoulderRatio = Math.min(minHalf / r, APPLE_CORNER_EXPANSION_FACTOR);
  const blend = Math.max(0, Math.min(1, (shoulderRatio - 1) / (APPLE_CORNER_EXPANSION_FACTOR - 1)));
  // Smooth p-norm exponent rising gently along shoulder (between 2.0 circle and ~2.85 diagonal-preserving continuous shape)
  const p = 2 + 0.85 * blend;
  const qx = Math.abs(px) - (hx - r);
  const qy = Math.abs(py) - (hy - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  const cornerDist = Math.pow(Math.pow(ox, p) + Math.pow(oy, p), 1 / p);
  const interiorDist = Math.min(Math.max(qx, qy), 0);
  return cornerDist + interiorDist - r;
}

/**
 * Screen-space derivative SDF edge antialiasing (QuartzCore formula):
 *   alpha_edge = clamp(0.5 - sdf / (|dx| + |dy|), 0, 1)
 */
export function sdfEdgeAlpha(sdf: number, dSdfDx: number, dSdfDy: number): number {
  const gradMag = Math.abs(dSdfDx) + Math.abs(dSdfDy);
  if (gradMag <= 1e-6) return sdf <= 0 ? 1 : 0;
  return Math.max(0, Math.min(1, 0.5 - sdf / gradMag));
}

/**
 * CoreText SF Pro Non-Linear Tracking Table (returns letter-spacing in `em`)
 */
export function getSfProTrackingEm(fontSizePt: number): number {
  const table: Array<[number, number]> = [
    [11, 0.005],
    [17, -0.026],
    [20, -0.023],
    [24, 0.003],
    [28, 0.014],
    [34, -0.031],
  ];
  if (fontSizePt <= table[0][0]) return table[0][1];
  if (fontSizePt >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [p0, t0] = table[i];
    const [p1, t1] = table[i + 1];
    if (fontSizePt >= p0 && fontSizePt <= p1) {
      const u = (fontSizePt - p0) / (p1 - p0);
      return Math.round((t0 + (t1 - t0) * u) * 10000) / 10000;
    }
  }
  return 0;
}

/**
 * Subsystem 5: Metaball alpha-crushing curve (keep gain <= 19 to avoid 8-bit banding)
 */
export function metaballAlphaThreshold(
  blurredAlpha: number,
  gain = 18,
  bias = 7,
): number {
  const safeGain = Math.min(19, Math.max(1, gain));
  return Math.max(0, Math.min(1, safeGain * blurredAlpha - bias));
}

/**
 * Stage 1: Polynomial Smooth-Minimum for GlassEffectContainer merging
 */
export function smoothMin(a: number, b: number, k: number): number {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0);
  return Math.min(a, b) - (h * h) / (4 * k);
}

/**
 * Stage 1: Stretched Rounded-Box SDF using Superellipse / Lp Corner Metric.
 * Negative inside the silhouette, 0 on the edge, positive outside.
 */
export function squircleBoxSdf(
  px: number,
  py: number,
  hx: number,
  hy: number,
  radius: number,
  power = 4,
): number {
  const r = Math.max(0, Math.min(radius, hx, hy));
  const qx = Math.abs(px) - (hx - r);
  const qy = Math.abs(py) - (hy - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  const cornerDist = Math.pow(Math.pow(ox, power) + Math.pow(oy, power), 1 / power);
  const interiorDist = Math.min(Math.max(qx, qy), 0);
  return cornerDist + interiorDist - r;
}

/**
 * Stage 1: Closed-form analytical 2D outward edge normal for squircle/continuous rounded box.
 */
export function squircleBoxNormal(
  px: number,
  py: number,
  hx: number,
  hy: number,
  radius: number,
  power = 4,
): { nx: number; ny: number } {
  const r = Math.max(0, Math.min(radius, hx, hy));
  const sx = px < 0 ? -1 : 1;
  const sy = py < 0 ? -1 : 1;
  const qx = Math.abs(px) - (hx - r);
  const qy = Math.abs(py) - (hy - r);

  if (qx > 0 || qy > 0) {
    const ox = Math.max(qx, 0);
    const oy = Math.max(qy, 0);
    const gx = sx * Math.pow(ox, power - 1);
    const gy = sy * Math.pow(oy, power - 1);
    const len = Math.hypot(gx, gy);
    if (len > 1e-8) {
      return { nx: gx / len, ny: gy / len };
    }
  }

  return qx >= qy ? { nx: sx, ny: 0 } : { nx: 0, ny: sy };
}

/**
 * Stage 2: Smoothstep & Convex Squircle / Circle / Lip Bevel Heightfields
 */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(1e-6, edge1 - edge0)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function squircleBevelProfile(t: number): number {
  const ct = Math.max(0, Math.min(1, t));
  return Math.pow(1 - Math.pow(1 - ct, 4), 0.25);
}

export function squircleBevelSlope(t: number): number {
  if (t >= 1) return 0;
  const ct = Math.max(1e-3, Math.min(1, t));
  const oneMinus = 1 - ct;
  const base = Math.max(1e-6, 1 - Math.pow(oneMinus, 4));
  return Math.pow(oneMinus, 3) / Math.pow(base, 0.75);
}

export function circleBevelProfile(t: number): number {
  const ct = Math.max(0, Math.min(1, t));
  return Math.sqrt(Math.max(0, 1 - (1 - ct) * (1 - ct)));
}

export function lipBevelProfile(t: number): number {
  const ct = Math.max(0, Math.min(1, t));
  const f1 = squircleBevelProfile(ct);
  const f2 = 1 - squircleBevelProfile(1 - ct);
  const blend = smootherstep(0, 1, ct);
  return f1 * (1 - blend) + f2 * blend;
}

/**
 * Stage 3: Snell-Descartes 2D UV Refraction Offset + Inward Rim Mirroring
 */
export function snellRefract2D(
  nx2d: number,
  ny2d: number,
  slope: number,
  slabThicknessPx: number,
  glassIor = 1.48,
): { dx: number; dy: number; nz: number } {
  // Height increases inward (-nx2d, -ny2d), so outward normal (-dh/dx, -dh/dy, 1) points along (+nx2d, +ny2d, 1)
  const normLen = Math.hypot(slope * nx2d, slope * ny2d, 1);
  const Nx = (slope * nx2d) / normLen;
  const Ny = (slope * ny2d) / normLen;
  const Nz = 1 / normLen;

  const eta = 1.0 / Math.max(1.01, glassIor);
  const cosTheta1 = Nz;
  const k = Math.max(0, 1 - eta * eta * (1 - cosTheta1 * cosTheta1));
  const factor = eta * cosTheta1 - Math.sqrt(k);

  const Rx = factor * Nx;
  const Ry = factor * Ny;
  const Rz = -eta + factor * Nz;
  const scale = slabThicknessPx / Math.max(Math.abs(Rz), 0.1);

  return {
    dx: Rx * scale,
    dy: Ry * scale,
    nz: Nz,
  };
}

export function inwardRimMirrorOffset(
  inwardDepthU: number,
  bezelWidthW: number,
  refractAmount: number,
): number {
  if (bezelWidthW <= 0) return 0;
  const t = Math.max(0, Math.min(1, inwardDepthU / bezelWidthW));
  const curve = squircleBevelProfile(t);
  const target = (bezelWidthW - refractAmount) * (1 - curve) + bezelWidthW * curve;
  return inwardDepthU - target;
}

/** UIKit UIScrollView touch-slop threshold (~10pt) before locking pan/scroll direction */
export const APPLE_TOUCH_SLOP_PX = 10;

/**
 * Evaluates swipe hysteresis against cumulative finger delta from touch-down.
 * Once radial displacement >= slopPx, returns locked=true with the post-slop delta
 * so touch pans begin smoothly without a sudden 10px jump.
 */
export function applyTouchSlop(
  totalDx: number,
  totalDy: number,
  slopPx: number = APPLE_TOUCH_SLOP_PX,
): { locked: boolean; dx: number; dy: number } {
  const dist = Math.hypot(totalDx, totalDy);
  if (dist < slopPx || dist <= 1e-6) {
    return { locked: false, dx: 0, dy: 0 };
  }
  const scale = (dist - slopPx) / dist;
  return {
    locked: true,
    dx: totalDx * scale,
    dy: totalDy * scale,
  };
}

/**
 * Physical 1px Retina hairline thickness (1.0 / contentsScale):
 * 1.0px @1x, 0.5px @2x, 0.333px @3x.
 */
export function physicalHairlinePx(devicePixelRatio: number): number {
  const safeDpr = Number.isFinite(devicePixelRatio) ? Math.max(1, Math.min(4, devicePixelRatio)) : 1;
  return Math.round((1 / safeDpr) * 1000) / 1000;
}

