/**
 * Apple iOS 26/27 & macOS Tahoe Liquid Glass Optical Engine
 *
 * Implements Stage 4-7 calculations & builds genuine 2D Snell-Descartes +
 * Inward Rim Mirroring displacement maps for SVG <feDisplacementMap>.
 */

import {
  inwardRimMirrorOffset,
  snellRefract2D,
  squircleBevelSlope,
  squircleBoxNormal,
  squircleBoxSdf,
} from './applePhysics';

export const LIGHT_PRIMARY_ANGLE_DEG = -60;
export const LIGHT_OPPOSITE_ANGLE_DEG = 120;

export interface RgbColor {
  r: number;
  g: number;
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
 * Lifts darks toward cool grey 0.9647 @ 0.45 and caps highlights with darkenBlendMode
 * (min) against ceiling grey 0.9333 @ 0.50 so bright backdrops never blow out.
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
 * Caps bright pages via ceiling 0.2157 @ 0.45, lifts pure black holes via max() against 0.08627,
 * and attenuates white backdrops proportionally to backdrop luminance.
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
 * Stage 5 (`tracksLuma`): Small pills flip Light <-> Dark at threshold ~0.55;
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
 * exact L4 Squircle SDF + Convex Squircle Bevel + Snell's Law Refraction +
 * Apple Inward Rim Mirroring. Keeps the central 70-85% completely flat (128, 128).
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
  const key = `${width}x${height}:${cornerRadius}:${bezelWidth}:${refractAmount}:${maxScale}`;
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

      const d = squircleBoxSdf(cx, cy, hx, hy, cornerRadius, 4);
      const u = -d;

      // Keep outside & flat center plateau completely neutral (128, 128) so 70-85% interior is distortion-free
      if (u <= 0 || u >= bezelWidth) {
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 128;
        data[idx + 3] = 255;
        continue;
      }

      const { nx, ny } = squircleBoxNormal(cx, cy, hx, hy, cornerRadius, 4);
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
