/**
 * Apple Human Interface Guidelines & SwiftUI / UIKit Physics Mathematics
 *
 * Implements exact conversions between SwiftUI's perceptual spring parameters
 * (response, dampingFraction) and damped harmonic oscillator constants
 * (stiffness k, damping c, mass m), concentric squircle corner radius math,
 * and UIScrollView rubber-band displacement math.
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
 * Calibrated Apple iOS 26 / macOS Tahoe 26 Motion Spring Presets
 */
export const APPLE_SPRINGS = {
  /** Interactive controls, buttons, segmented pickers (crisp, zero overshoot) */
  snappy: swiftUiSpringToMotion(0.28, 0.88),
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
 * Apple HIG Concentric Corner Radius Math:
 *   R_inner = max(0, R_outer - padding)
 * Preserves uniform border thickness around rounded corners when nesting.
 */
export function concentricRadius(outerRadiusPx: number, paddingPx: number): number {
  return Math.max(0, Math.round((outerRadiusPx - paddingPx) * 100) / 100);
}

/**
 * Exact Apple UIScrollView / iOS Rubber-Band Resistance Equation:
 *   f(offset, dim, c) = (offset * dim * c) / (dim + c * |offset|)
 * Uses Apple's classic c = 0.55 resistance coefficient.
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
 * Evaluates a unit-step damped harmonic oscillator x(t) in [0, settling]
 * for a given (response, dampingFraction) so CSS `linear()` curves can be
 * mathematically verified against true physics.
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
