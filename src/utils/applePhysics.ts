/**
 * Apple Human Interface Guidelines & QuartzCore / SwiftUI Physics Mathematics
 *
 * Implements:
 * - SwiftUI `.spring(response:dampingFraction:)` -> Hooke's Law constants (k, c, m)
 * - Superellipse / L4 Squircle SDF, closed-form 2D edge normals & polynomial smooth-min
 * - Convex squircle / circle / lip bevel heightfields & 3D surface normals
 * - Snell-Descartes refraction & Apple inward rim mirroring
 * - Constant-area press scaling & decoupled gel spring / touch-frost envelope timings
 * - Concentric corner math & UIScrollView rubber-band equation
 */

export interface SpringConstants {
  type: 'spring';
  mass: number;
  stiffness: number;
  damping: number;
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
 * Evaluates a unit-step damped harmonic oscillator x(t) for a given (response, dampingFraction).
 */
export function evaluateSpringProgress(
  tSeconds: number,
  response: number,
  dampingFraction: number,
): number {
  if (tSeconds <= 0) return 0;
  const omegaN = (2 * Math.PI) / Math.max(0.08, response);
  const zeta = Math.max(0.05, dampingFraction);

  if (zeta < 1) {
    const omegaD = omegaN * Math.sqrt(1 - zeta * zeta);
    const decay = Math.exp(-zeta * omegaN * tSeconds);
    return (
      1 -
      decay *
        (Math.cos(omegaD * tSeconds) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(omegaD * tSeconds))
    );
  }

  if (Math.abs(zeta - 1) < 1e-6) {
    const decay = Math.exp(-omegaN * tSeconds);
    return 1 - decay * (1 + omegaN * tSeconds);
  }

  const root = Math.sqrt(zeta * zeta - 1);
  const r1 = -omegaN * (zeta - root);
  const r2 = -omegaN * (zeta + root);
  const c1 = r2 / (r2 - r1);
  const c2 = -r1 / (r2 - r1);
  return 1 - (c1 * Math.exp(r1 * tSeconds) + c2 * Math.exp(r2 * tSeconds));
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
 * Stage 1: Stretched Rounded-Box SDF using Superellipse / Lp Corner Metric (p = 4 for Apple squircles).
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
 * Stage 1: Closed-form analytical 2D outward edge normal for squircle rounded box.
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
