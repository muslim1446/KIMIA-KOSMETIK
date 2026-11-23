import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLE_SPRINGS,
  APPLE_TOUCH_FROST_ENVELOPE,
  appleRubberBand,
  circleBevelProfile,
  concentricRadius,
  constantAreaPressScale,
  evaluateSpringProgress,
  inwardRimMirrorOffset,
  lipBevelProfile,
  smoothMin,
  smootherstep,
  snellRefract2D,
  squircleBevelProfile,
  squircleBevelSlope,
  squircleBoxNormal,
  squircleBoxSdf,
  swiftUiSpringToMotion,
} from './applePhysics';
import {
  compressDarkGlassTone,
  compressLightGlassTone,
  computeLuminance,
  dualAngleSpecularWeights,
  evaluateBackdropLumaAppearance,
  evaluateOutsideShadowAlpha,
  preBlurSaturate,
} from './liquidGlassEngine';

test('swiftUiSpringToMotion computes exact stiffness and damping from response and dampingFraction', () => {
  const spring = swiftUiSpringToMotion(0.5, 1.0, 1);
  // omega_n = 2 * pi / 0.5 = 4 * pi => stiffness = 16 * pi^2 ~= 157.91
  assert.ok(Math.abs(spring.stiffness - 157.91) < 0.05);
  // damping = 2 * 1 * 1.0 * 4 * pi = 8 * pi ~= 25.13
  assert.ok(Math.abs(spring.damping - 25.13) < 0.05);
  assert.equal(spring.type, 'spring');
  assert.ok(APPLE_SPRINGS.popover.stiffness > APPLE_SPRINGS.sheet.stiffness);
  // Gel interactive release spring (response 0.40, damping 0.35) has lower damping than crisp snappy spring
  assert.ok(APPLE_SPRINGS.gelRelease.damping < APPLE_SPRINGS.snappy.damping);
  assert.equal(APPLE_TOUCH_FROST_ENVELOPE.holdMs, 660);
});

test('concentricRadius obeys R_inner = max(0, R_outer - padding)', () => {
  assert.equal(concentricRadius(28, 12), 16);
  assert.equal(concentricRadius(26, 10), 16);
  assert.equal(concentricRadius(12, 16), 0);
});

test('constantAreaPressScale expands small controls more than large sheets and respects maxScale', () => {
  const pillScale = constantAreaPressScale(44, 44);
  const largeSheetScale = constantAreaPressScale(400, 300);
  assert.ok(pillScale > largeSheetScale);
  assert.ok(pillScale <= 1.18);
  assert.ok(largeSheetScale > 1 && largeSheetScale < 1.02);
});

test('appleRubberBand asymptotically compresses displacement below dimension', () => {
  const dim = 400;
  const small = appleRubberBand(40, dim);
  const huge = appleRubberBand(4000, dim);
  const negative = appleRubberBand(-100, dim);

  assert.ok(small > 0 && small < 40);
  assert.ok(huge < dim);
  assert.ok(negative < 0 && negative > -100);
});

test('evaluateSpringProgress starts at 0, overshoots on underdamped gel spring, and settles near 1', () => {
  assert.equal(evaluateSpringProgress(0, 0.34, 0.82), 0);
  const gelPeak = evaluateSpringProgress(0.21, 0.4, 0.35);
  assert.ok(gelPeak > 1.15 && gelPeak < 1.4);
  const settled = evaluateSpringProgress(0.8, 0.34, 0.82);
  assert.ok(Math.abs(settled - 1) < 0.01);
});

test('Stage 1 smoothMin and L4 squircle SDF + analytical normals are consistent', () => {
  assert.ok(smoothMin(10, 10, 6) < 10);
  assert.equal(smoothMin(10, 30, 6), 10);

  // Inside center is negative (-min(hx, hy)), boundary midpoint is 0, outside is positive
  assert.ok(squircleBoxSdf(0, 0, 50, 30, 12) < 0);
  assert.ok(Math.abs(squircleBoxSdf(50, 0, 50, 30, 12)) < 1e-6);
  assert.ok(squircleBoxSdf(60, 0, 50, 30, 12) > 0);

  const rightNormal = squircleBoxNormal(49, 0, 50, 30, 12);
  assert.equal(rightNormal.nx, 1);
  assert.equal(rightNormal.ny, 0);

  const cornerNormal = squircleBoxNormal(48, 28, 50, 30, 12);
  assert.ok(Math.abs(Math.hypot(cornerNormal.nx, cornerNormal.ny) - 1) < 1e-6);
  assert.ok(cornerNormal.nx > 0 && cornerNormal.ny > 0);
});

test('Stage 2 & Stage 3 bevel profiles, Snell refraction, and inward rim mirroring match spec invariants', () => {
  assert.equal(smootherstep(0, 1, 0), 0);
  assert.equal(smootherstep(0, 1, 0.5), 0.5);
  assert.equal(smootherstep(0, 1, 1), 1);

  assert.equal(squircleBevelProfile(0), 0);
  assert.equal(squircleBevelProfile(1), 1);
  assert.ok(squircleBevelSlope(0.1) > squircleBevelSlope(0.9));
  assert.equal(circleBevelProfile(0), 0);
  assert.equal(circleBevelProfile(1), 1);
  assert.ok(lipBevelProfile(0.5) > 0 && lipBevelProfile(0.5) < 1);

  const refr = snellRefract2D(1, 0, 1.2, 20, 1.48);
  assert.ok(refr.dx < 0); // bends inward away from positive outward normal
  assert.ok(Math.abs(refr.dy) < 1e-6);
  assert.ok(refr.nz > 0 && refr.nz < 1);

  const mirror = inwardRimMirrorOffset(2, 12, 8);
  assert.ok(mirror < 0);
});

test('Stage 4-7 preBlurSaturate, Light/Dark dynamic range compression, tracksLuma, specular & outside-only shadows', () => {
  assert.ok(Math.abs(computeLuminance(1, 1, 1) - 1) < 1e-6);
  assert.equal(computeLuminance(0, 0, 0), 0);

  const boosted = preBlurSaturate(0.7, 0.3, 0.3, 2.0);
  assert.ok(boosted.r > 0.7 && boosted.g < 0.3);

  // Light tone lifts pure black shadows and caps pure white highlights below 1.0
  const lightBlack = compressLightGlassTone(0, 0, 0);
  const lightWhite = compressLightGlassTone(1, 1, 1);
  assert.ok(lightBlack.r > 0.35 && lightWhite.r < 0.96);

  // Dark tone lifts pure black holes above 0 and dims bright pages smoothly
  const darkBlack = compressDarkGlassTone(0, 0, 0);
  const darkWhite = compressDarkGlassTone(1, 1, 1);
  assert.ok(darkBlack.r > 0.05 && darkWhite.r < 0.55);

  const darkPill = evaluateBackdropLumaAppearance(0.2, 'pill');
  const lightPill = evaluateBackdropLumaAppearance(0.85, 'pill');
  const sheetOnDark = evaluateBackdropLumaAppearance(0.2, 'sheet');
  assert.equal(darkPill.resolvedTone, 'dark');
  assert.equal(lightPill.resolvedTone, 'light');
  assert.equal(sheetOnDark.resolvedTone, 'light');

  // -60 deg primary light vector aligns with (0.5, -0.866)
  const topLeftLit = dualAngleSpecularWeights(0.5, -0.8660254, 0.35, 1.0);
  const bottomRightBounce = dualAngleSpecularWeights(-0.5, 0.8660254, 0.35, 1.0);
  assert.ok(topLeftLit.primary > 0.9);
  assert.ok(bottomRightBounce.secondary > 0.5 && topLeftLit.fresnel > 0.1);

  // Shadow is strictly outside (d <= 0 -> 0) and decays smoothly for d > 0
  assert.equal(evaluateOutsideShadowAlpha(0, 20), 0);
  assert.equal(evaluateOutsideShadowAlpha(-4, 20), 0);
  assert.ok(evaluateOutsideShadowAlpha(4, 20, 0.24, 0.8) > evaluateOutsideShadowAlpha(24, 20, 0.24, 0));
});
