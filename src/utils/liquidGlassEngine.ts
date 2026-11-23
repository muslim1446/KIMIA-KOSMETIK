/**
 * Apple iOS 26/27 & macOS Tahoe Optical, Color Science & Render Pipeline Engine
 *
 * Implements:
 * - Pre-blur saturation boost & Light/Dark dynamic-range tone compression
 * - MTLumaDodgePillView 4-stage luma-dodge contrast + hysteresis observer
 * - Premultiplied Oklab color-space conversion & smooth interpolation
 * - SwiftUI MeshGradient 16-control-point Bicubic Coons Patch evaluator
 * - Dual opposite-angle (-60°/+120°) specular, Fresnel & outside-only shadows
 * - CALayer.shadowRadius -> CSS blur (2 * sigma) conversion
 * - Continuous kCACornerCurveContinuous Snell refraction displacement maps
 */

import {
  continuousCornerSdf,
  inwardRimMirrorOffset,
  snellRefract2D,
  squircleBevelSlope,
  squircleBoxNormal,
} from './applePhysics';

export const LIGHT_PRIMARY_ANGLE_DEG = -60;
export const LIGHT_OPPOSITE_ANGLE_DEG = 120;

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface OklabColor {
  L: number;
  a: number;
  b: number;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Relative ITU-R BT.709 luminance Y in [0, 1]
 */
export function computeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * clamp01(r) + 0.7152 * clamp01(g) + 0.0722 * clamp01(b);
}

/**
 * sRGB <-> Linear RGB transfer functions (IEC 61966-2-1)
 */
export function srgbToLinear(c: number): number {
  const v = clamp01(c);
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(c: number): number {
  const v = clamp01(c);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

/**
 * Subsystem 8: sRGB <-> Oklab Conversion & Premultiplied Oklab Interpolation
 * (avoids muddy grey/brown midpoints produced by raw sRGB interpolation).
 */
export function srgbToOklab(rgb: RgbColor): OklabColor {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export function oklabToSrgb(lab: OklabColor): RgbColor {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: linearToSrgb(r),
    g: linearToSrgb(g),
    b: linearToSrgb(b),
  };
}

export function lerpOklab(colorA: RgbColor, colorB: RgbColor, t: number): RgbColor {
  const ct = clamp01(t);
  const labA = srgbToOklab(colorA);
  const labB = srgbToOklab(colorB);
  return oklabToSrgb({
    L: lerp(labA.L, labB.L, ct),
    a: lerp(labA.a, labB.a, ct),
    b: lerp(labA.b, labB.b, ct),
  });
}

/**
 * Subsystem 9: CALayer.shadowRadius (sigma) -> CSS box-shadow blur (2 * sigma)
 */
export function cssBlurFromAppleShadowRadius(shadowRadiusPt: number): number {
  return Math.max(0, shadowRadiusPt * 2);
}

/**
 * Subsystem 6: SwiftUI MeshGradient 16-control-point Bicubic Coons Patch evaluator
 *   P(u, v) = sum_{i=0..3} sum_{j=0..3} B_i(u) * B_j(v) * P_{ij}
 */
export function evaluateBicubicCoonsPatch(
  net4x4: readonly (readonly RgbColor[])[],
  u: number,
  v: number,
): RgbColor {
  const cu = clamp01(u);
  const cv = clamp01(v);
  const bernstein = (t: number): [number, number, number, number] => {
    const it = 1 - t;
    return [it * it * it, 3 * it * it * t, 3 * it * t * t, t * t * t];
  };
  const bu = bernstein(cu);
  const bv = bernstein(cv);

  let L = 0;
  let a = 0;
  let b = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const w = bu[i] * bv[j];
      const lab = srgbToOklab(net4x4[i][j]);
      L += w * lab.L;
      a += w * lab.a;
      b += w * lab.b;
    }
  }
  return oklabToSrgb({ L, a, b });
}

/**
 * Stage 4: Pre-Blur Saturation Boost (must occur BEFORE spatial diffusion)
 */
export function preBlurSaturate(r: number, g: number, b: number, saturation = 1.9): RgbColor {
  const y = computeLuminance(r, g, b);
  return {
    r: clamp01(lerp(y, r, saturation)),
    g: clamp01(lerp(y, g, saturation)),
    b: clamp01(lerp(y, b, saturation)),
  };
}

/**
 * Stage 5 (Table Row 1): Regular Light Glass Floor + Ceiling Compression.
 */
export function compressLightGlassTone(r: number, g: number, b: number): RgbColor {
  const floorLiftR = lerp(clamp01(r), 0.9647 * 0.902 + 0.098, 0.45);
  const floorLiftG = lerp(clamp01(g), 0.9647 * 0.951 + 0.049, 0.45);
  const floorLiftB = lerp(clamp01(b), 0.9647, 0.45);

  const ceilR = Math.min(floorLiftR, 0.9333);
  const ceilG = Math.min(floorLiftG, 0.9333);
  const ceilB = Math.min(floorLiftB, 0.9333);

  return {
    r: clamp01(lerp(floorLiftR, ceilR, 0.5)),
    g: clamp01(lerp(floorLiftG, ceilG, 0.5)),
    b: clamp01(lerp(floorLiftB, ceilB, 0.5)),
  };
}

/**
 * Stage 5 (Table Row 2): Regular Dark Glass Ceiling Cap + Floor Lift + Luma-Proportional Dim.
 */
export function compressDarkGlassTone(
  r: number,
  g: number,
  b: number,
  lumaDimCoeff = 0.24,
): RgbColor {
  const y = computeLuminance(r, g, b);
  const capR = lerp(clamp01(r), 0.2157, 0.45);
  const capG = lerp(clamp01(g), 0.2157 + 0.015, 0.45);
  const capB = lerp(clamp01(b), 0.2157 + 0.03, 0.45);

  const liftR = Math.max(capR, 0.08627);
  const liftG = Math.max(capG, 0.08627);
  const liftB = Math.max(capB, 0.08627);

  const dim = 1 - lumaDimCoeff * y;
  return {
    r: clamp01(lerp(capR, liftR, 0.5) * dim),
    g: clamp01(lerp(capG, liftG, 0.5) * dim),
    b: clamp01(lerp(capB, liftB, 0.5) * dim),
  };
}

/**
 * Subsystem 3: MTLumaDodgePillView 4-stage luma-dodge contrast + hysteresis observer
 * (keeps Home Indicator / collapsed HUD pill crisp across black & white backgrounds without flicker).
 */
export function evaluateLumaDodgePillTone(
  backdropLuma: number,
  prevMode: 'dark' | 'light' = 'light',
  options?: { thinStyle?: boolean },
): {
  mode: 'dark' | 'light';
  inputAmount: number;
  addWhite: number;
  overlayOpacity: number;
  outputBrightnessBoost: number;
  outputSaturate: number;
  pillLuma: number;
} {
  const y = clamp01(backdropLuma);
  // Hysteresis band [0.46, 0.58] prevents frame-by-frame flickering
  const mode: 'dark' | 'light' =
    prevMode === 'light' ? (y < 0.46 ? 'dark' : 'light') : y > 0.58 ? 'light' : 'dark';

  const thin = Boolean(options?.thinStyle);
  const inputAmount = thin ? 0.31 : 1.0;
  const addWhite = thin ? 0.37275 : 0.71;
  const overlayOpacity = 0.4;

  // Non-linear homeAffordanceBase response + +0.06 brightness lift
  const mapped = clamp01(
    (mode === 'dark' ? addWhite + (1 - y) * 0.26 : (1 - addWhite) * 0.35 + (1 - y) * 0.18) *
      inputAmount +
      0.06,
  );

  return {
    mode,
    inputAmount,
    addWhite,
    overlayOpacity,
    outputBrightnessBoost: 0.06,
    outputSaturate: 1.15,
    pillLuma: Math.round(mapped * 10000) / 10000,
  };
}

/**
 * Stage 5 (`tracksLuma`): Small pills flip Light <-> Dark at threshold ~0.54;
 * large sheets adapt opacity smoothly without flipping.
 */
export function evaluateBackdropLumaAppearance(
  avgBackdropLuma: number,
  surfaceKind: 'pill' | 'sheet',
): { resolvedTone: 'light' | 'dark'; adaptiveTintOpacity: number } {
  const y = clamp01(avgBackdropLuma);
  if (surfaceKind === 'pill') {
    const isDarkBackdrop = y < 0.54;
    return {
      resolvedTone: isDarkBackdrop ? 'dark' : 'light',
      adaptiveTintOpacity: isDarkBackdrop ? 0.52 : 0.45,
    };
  }
  return {
    resolvedTone: 'light',
    adaptiveTintOpacity: Math.round(lerp(0.58, 0.42, y) * 1000) / 1000,
  };
}

/**
 * Stage 6: Dual Opposite-Angle Directional Specular (-60° primary, +120° secondary) + Fresnel
 */
export function dualAngleSpecularWeights(
  nx2d: number,
  ny2d: number,
  nz3d: number,
  rimMask: number,
  primaryAngleRad = (LIGHT_PRIMARY_ANGLE_DEG * Math.PI) / 180,
): { primary: number; secondary: number; fresnel: number } {
  const lx1 = Math.cos(primaryAngleRad);
  const ly1 = Math.sin(primaryAngleRad);
  const lx2 = -lx1;
  const ly2 = -ly1;

  const dot1 = Math.max(0, nx2d * lx1 + ny2d * ly1);
  const dot2 = Math.max(0, nx2d * lx2 + ny2d * ly2);

  const m = clamp01(rimMask);
  const fresnel = Math.pow(1 - Math.min(1, Math.abs(nz3d)), 3.5);

  return {
    primary: Math.pow(dot1, 2.2) * m,
    secondary: Math.pow(dot2, 3.0) * m * 0.62,
    fresnel,
  };
}

/**
 * Stage 7: Content-Aware Outside-Only Dual-Gaussian Shadow Alpha (strictly d > 0)
 */
export function evaluateOutsideShadowAlpha(
  outsideDistPx: number,
  sigmaPx: number,
  baseOpacity = 0.24,
  vibrancyScore = 0,
  vibrancyContribution = 0.14,
): number {
  if (outsideDistPx <= 0 || sigmaPx <= 0) return 0;
  const core = 0.65 * Math.exp(-(outsideDistPx * outsideDistPx) / (sigmaPx * sigmaPx));
  const tail = 0.35 * Math.exp((-0.08 * outsideDistPx) / Math.max(0.04 * sigmaPx, 0.01));
  const vibrancyBoost = clamp01(vibrancyScore) * vibrancyContribution;
  return clamp01((core + tail) * (baseOpacity + vibrancyBoost));
}

const displacementMapCache = new Map<string, string>();

/**
 * Generates an RGBA PNG displacement map for SVG <feDisplacementMap> encoding
 * Apple kCACornerCurveContinuous SDF + Convex Squircle Bevel + Snell's Law Refraction +
 * Inward Rim Mirroring. Keeps the central 70-85% completely flat (128, 128).
 */
export function generateSnellDisplacementDataUrl(options: {
  width: number;
  height: number;
  cornerRadius: number;
  bezelWidth: number;
  refractAmount: number;
  maxScale?: number;
}): string {
  const { width, height, cornerRadius, bezelWidth, refractAmount, maxScale = 28 } = options;
  const key = `${width}x${height}:${cornerRadius}:${bezelWidth}:${refractAmount}:${maxScale}:c1528`;
  const cached = displacementMapCache.get(key);
  if (cached) return cached;

  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const img = ctx.createImageData(width, height);
  const data = img.data;
  const hx = width / 2;
  const hy = height / 2;

  for (let py = 0; py < height; py++) {
    const cy = py + 0.5 - hy;
    for (let px = 0; px < width; px++) {
      const cx = px + 0.5 - hx;
      const idx = (py * width + px) * 4;

      const d = continuousCornerSdf(cx, cy, hx, hy, cornerRadius);
      const u = -d;

      // Keep outside & flat center plateau completely neutral (128, 128) so 70-85% interior is distortion-free
      if (u <= 0 || u >= bezelWidth) {
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 128;
        data[idx + 3] = 255;
        continue;
      }

      const { nx, ny } = squircleBoxNormal(cx, cy, hx, hy, cornerRadius, 2.85);
      const t = u / bezelWidth;
      const slope = squircleBevelSlope(t);
      const refr = snellRefract2D(nx, ny, slope, refractAmount * 0.45, 1.48);
      const mirror = inwardRimMirrorOffset(u, bezelWidth, refractAmount);

      const dispX = refr.dx + nx * mirror * 0.35;
      const dispY = refr.dy + ny * mirror * 0.35;

      const rByte = Math.max(0, Math.min(255, Math.round(128 + (dispX / maxScale) * 127)));
      const gByte = Math.max(0, Math.min(255, Math.round(128 + (dispY / maxScale) * 127)));

      data[idx] = rByte;
      data[idx + 1] = gByte;
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL('image/png');
  displacementMapCache.set(key, url);
  return url;
}
