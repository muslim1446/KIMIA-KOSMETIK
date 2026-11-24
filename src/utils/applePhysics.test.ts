import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLE_CONTINUOUS_CORNER_BEZIER,
  APPLE_CORNER_EXPANSION_FACTOR,
  APPLE_DECELERATION_RATES,
  APPLE_SPRINGS,
  APPLE_TOUCH_FROST_ENVELOPE,
  APPLE_TOUCH_SLOP_PX,
  appleRubberBand,
  appleRubberBandInverse,
  applyTouchSlop,
  buildContinuousRoundedRectPath,
  circleBevelProfile,
  concentricRadius,
  constantAreaPressScale,
  continuousCornerSdf,
  edgeLeadingSprings,
  evaluateSpringProgress,
  evaluateSpringState,
  getElementDragSlopPx,
  getSfProTrackingEm,
  inwardRimMirrorOffset,
  lipBevelProfile,
  metaballAlphaThreshold,
  physicalHairlinePx,
  projectScrollEndpoint,
  sdfEdgeAlpha,
  shouldAllowSingleFingerPan,
  SINGLE_PAN_BLOCKED_SELECTOR,
  smoothMin,
  smootherstep,
  snellRefract2D,
  squircleBevelProfile,
  squircleBevelSlope,
  squircleBoxNormal,
  squircleBoxSdf,
  swiftUiDurationBounceToSpring,
  swiftUiSpringToMotion,
  uikitScrollDecelerate,
} from './applePhysics';
import {
  compressDarkGlassTone,
  compressLightGlassTone,
  computeLuminance,
  cssBlurFromAppleShadowRadius,
  dualAngleSpecularWeights,
  evaluateBackdropLumaAppearance,
  evaluateBicubicCoonsPatch,
  evaluateLumaDodgePillTone,
  evaluateOutsideShadowAlpha,
  lerpOklab,
  oklabToSrgb,
  preBlurSaturate,
  srgbToOklab,
} from './liquidGlassEngine';

test('swiftUiSpringToMotion and WWDC23 (duration, bounce) compute exact stiffness and damping', () => {
  const spring = swiftUiSpringToMotion(0.5, 1.0, 1);
  // omega_n = 2 * pi / 0.5 = 4 * pi => stiffness = 16 * pi^2 ~= 157.91
  assert.ok(Math.abs(spring.stiffness - 157.91) < 0.05);
  // damping = 2 * 1 * 1.0 * 4 * pi = 8 * pi ~= 25.13
  assert.ok(Math.abs(spring.damping - 25.13) < 0.05);
  assert.equal(spring.type, 'spring');
  assert.ok(APPLE_SPRINGS.popover.stiffness > APPLE_SPRINGS.sheet.stiffness);
  assert.ok(APPLE_SPRINGS.gelRelease.damping < APPLE_SPRINGS.snappy.damping);
  assert.equal(APPLE_TOUCH_FROST_ENVELOPE.holdMs, 660);

  const critical = swiftUiDurationBounceToSpring(0.4, 0, 1);
  const bouncy = swiftUiDurationBounceToSpring(0.4, 0.25, 1);
  assert.equal(critical.stiffness, bouncy.stiffness);
  assert.ok(bouncy.damping < critical.damping);

  const pair = edgeLeadingSprings(0.4, 0.15);
  assert.ok(pair.leading.stiffness > pair.trailing.stiffness);
});

test('evaluateSpringState preserves interruptible initial position and velocity (x0, v0)', () => {
  const atZero = evaluateSpringState(0, 0.35, 0.85, 0.4, 2.5, 1.0);
  assert.equal(atZero.x, 0.4);
  assert.equal(atZero.v, 2.5);

  const fastForward = evaluateSpringState(0.05, 0.35, 0.85, 0.4, 6.0, 1.0);
  const zeroVel = evaluateSpringState(0.05, 0.35, 0.85, 0.4, 0, 1.0);
  assert.ok(fastForward.x > zeroVel.x);

  const settled = evaluateSpringState(1.2, 0.35, 0.85, 0.4, 6.0, 1.0);
  assert.ok(Math.abs(settled.x - 1.0) < 0.01);
});

test('Subsystem 1: kCACornerCurveContinuous Bezier path, continuousCornerSdf, and sdfEdgeAlpha', () => {
  assert.equal(APPLE_CORNER_EXPANSION_FACTOR, 1.528665);
  assert.equal(APPLE_CONTINUOUS_CORNER_BEZIER.c3.toy, 1.528665);

  const cardPath = buildContinuousRoundedRectPath(240, 160, 20);
  assert.ok(cardPath.startsWith('M 30.573 0')); // 20 * 1.528665 = 30.5733
  assert.ok(cardPath.endsWith('Z'));

  const pillPath = buildContinuousRoundedRectPath(120, 40, 20);
  assert.ok(pillPath.startsWith('M 20 0'));

  assert.ok(continuousCornerSdf(0, 0, 100, 60, 20) < 0);
  assert.ok(Math.abs(continuousCornerSdf(100, 0, 100, 60, 20)) < 1e-6);
  assert.ok(continuousCornerSdf(105, 0, 100, 60, 20) > 0);

  assert.equal(sdfEdgeAlpha(-2, 1, 0), 1);
  assert.equal(sdfEdgeAlpha(0, 1, 0), 0.5);
  assert.equal(sdfEdgeAlpha(2, 1, 0), 0);
});

test('concentricRadius obeys R_inner = max(0, R_outer - padding)', () => {
  assert.equal(concentricRadius(28, 12), 16);
  assert.equal(concentricRadius(26, 16), 10);
  assert.equal(concentricRadius(12, 16), 0);
});

test('constantAreaPressScale expands small controls more than large sheets and respects maxScale', () => {
  const pillScale = constantAreaPressScale(44, 44);
  const largeSheetScale = constantAreaPressScale(400, 300);
  assert.ok(pillScale > largeSheetScale);
  assert.ok(pillScale <= 1.18);
  assert.ok(largeSheetScale > 1 && largeSheetScale < 1.02);
});

test('Subsystem 4: UIScrollView exponential deceleration, endpoint projection, rubber-band & inverse', () => {
  const endpoint = projectScrollEndpoint(100, 1200, APPLE_DECELERATION_RATES.normal);
  // x0 + (1200/1000) * (0.998 / 0.002) = 100 + 1.2 * 499 = 698.8
  assert.ok(Math.abs(endpoint - 698.8) < 0.05);

  const mid = uikitScrollDecelerate(0.3, 100, 1200, APPLE_DECELERATION_RATES.normal);
  const later = uikitScrollDecelerate(4.0, 100, 1200, APPLE_DECELERATION_RATES.normal);
  assert.ok(mid.v > 0 && mid.v < 1200);
  assert.ok(Math.abs(later.x - endpoint) < 1);

  const dim = 400;
  const small = appleRubberBand(40, dim);
  const huge = appleRubberBand(4000, dim);
  const negative = appleRubberBand(-100, dim);

  assert.ok(small > 0 && small < 40);
  assert.ok(huge < dim);
  assert.ok(negative < 0 && negative > -100);

  // Inverse round-trips forward rubber-band
  const recovered = appleRubberBandInverse(small, dim);
  assert.ok(Math.abs(recovered - 40) < 1e-6);
});

test('Subsystem 5 & 7: metaball threshold clamps gain<=19 and CoreText tracking interpolates cleanly', () => {
  assert.equal(metaballAlphaThreshold(0.2, 18, 7), 0);
  assert.equal(metaballAlphaThreshold(0.5, 18, 7), 1);
  assert.ok(Math.abs(getSfProTrackingEm(11) - 0.005) < 1e-5);
  assert.ok(Math.abs(getSfProTrackingEm(17) - -0.026) < 1e-5);
  assert.ok(Math.abs(getSfProTrackingEm(34) - -0.031) < 1e-5);
  assert.ok(getSfProTrackingEm(28) > getSfProTrackingEm(17));
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

test('Subsystem 3, 6, 8, 9: Oklab round-trip & lerp, Coons patch, MTLumaDodgePillView hysteresis, shadowBlur=2*sigma', () => {
  const sample = { r: 0.25, g: 0.62, b: 0.94 };
  const back = oklabToSrgb(srgbToOklab(sample));
  assert.ok(Math.abs(back.r - sample.r) < 1e-5);
  assert.ok(Math.abs(back.g - sample.g) < 1e-5);
  assert.ok(Math.abs(back.b - sample.b) < 1e-5);

  const mid = lerpOklab({ r: 0, g: 0.48, b: 1 }, { r: 0.2, g: 0.78, b: 0.35 }, 0.5);
  assert.ok(mid.g > 0.55 && mid.b > 0.5);

  const net = Array.from({ length: 4 }, (_, i) =>
    Array.from({ length: 4 }, (_, j) => ({
      r: i / 3,
      g: j / 3,
      b: 0.5,
    })),
  );
  const corner00 = evaluateBicubicCoonsPatch(net, 0, 0);
  assert.ok(Math.abs(corner00.r - 0) < 1e-4 && Math.abs(corner00.b - 0.5) < 1e-4);

  // Hysteresis band [0.46, 0.58] holds previous state around midpoint 0.51
  assert.equal(evaluateLumaDodgePillTone(0.51, 'light').mode, 'light');
  assert.equal(evaluateLumaDodgePillTone(0.51, 'dark').mode, 'dark');
  assert.equal(evaluateLumaDodgePillTone(0.2, 'light').mode, 'dark');
  assert.equal(evaluateLumaDodgePillTone(0.85, 'dark').mode, 'light');

  assert.equal(cssBlurFromAppleShadowRadius(18), 36);
});

test('Stage 4-7 preBlurSaturate, Light/Dark dynamic range compression, tracksLuma, specular & outside-only shadows', () => {
  assert.ok(Math.abs(computeLuminance(1, 1, 1) - 1) < 1e-6);
  assert.equal(computeLuminance(0, 0, 0), 0);

  const boosted = preBlurSaturate(0.7, 0.3, 0.3, 2.0);
  assert.ok(boosted.r > 0.7 && boosted.g < 0.3);

  const lightBlack = compressLightGlassTone(0, 0, 0);
  const lightWhite = compressLightGlassTone(1, 1, 1);
  assert.ok(lightBlack.r > 0.35 && lightWhite.r < 0.96);

  const darkBlack = compressDarkGlassTone(0, 0, 0);
  const darkWhite = compressDarkGlassTone(1, 1, 1);
  assert.ok(darkBlack.r > 0.05 && darkWhite.r < 0.55);

  const darkPill = evaluateBackdropLumaAppearance(0.2, 'pill');
  const lightPill = evaluateBackdropLumaAppearance(0.85, 'pill');
  const sheetOnDark = evaluateBackdropLumaAppearance(0.2, 'sheet');
  assert.equal(darkPill.resolvedTone, 'dark');
  assert.equal(lightPill.resolvedTone, 'light');
  assert.equal(sheetOnDark.resolvedTone, 'light');

  const topLeftLit = dualAngleSpecularWeights(0.5, -0.8660254, 0.35, 1.0);
  const bottomRightBounce = dualAngleSpecularWeights(-0.5, 0.8660254, 0.35, 1.0);
  assert.ok(topLeftLit.primary > 0.9);
  assert.ok(bottomRightBounce.secondary > 0.5 && topLeftLit.fresnel > 0.1);

  assert.equal(evaluateOutsideShadowAlpha(0, 20), 0);
  assert.equal(evaluateOutsideShadowAlpha(-4, 20), 0);
  assert.ok(evaluateOutsideShadowAlpha(4, 20, 0.24, 0.8) > evaluateOutsideShadowAlpha(24, 20, 0.24, 0));
});

test('UIKit 10pt touch-slop hysteresis and physical Retina 1px hairlines match spec', () => {
  assert.equal(APPLE_TOUCH_SLOP_PX, 10);

  const subSlop = applyTouchSlop(6, 7);
  assert.equal(subSlop.locked, false);
  assert.equal(subSlop.dx, 0);
  assert.equal(subSlop.dy, 0);

  const exactThreshold = applyTouchSlop(10, 0);
  assert.equal(exactThreshold.locked, true);
  assert.equal(exactThreshold.dx, 0);

  const overSlop = applyTouchSlop(15, 0);
  assert.equal(overSlop.locked, true);
  assert.ok(Math.abs(overSlop.dx - 5) < 1e-6);

  assert.equal(physicalHairlinePx(1), 1);
  assert.equal(physicalHairlinePx(2), 0.5);
  assert.equal(physicalHairlinePx(3), 0.333);
});

test('shouldAllowSingleFingerPan and getElementDragSlopPx enforce clean touch gesture mediation', () => {
  assert.equal(getElementDragSlopPx('touch'), 6);
  assert.equal(getElementDragSlopPx('pen'), 6);
  assert.equal(getElementDragSlopPx('mouse'), 2);

  assert.equal(
    shouldAllowSingleFingerPan({
      tool: 'pointer',
      isTargetInsideStage: true,
      matchesBlockedSelector: false,
    }),
    true,
  );
  assert.equal(
    shouldAllowSingleFingerPan({
      tool: 'laser',
      isTargetInsideStage: true,
      matchesBlockedSelector: false,
    }),
    false,
  );
  assert.equal(
    shouldAllowSingleFingerPan({
      tool: 'pen',
      isTargetInsideStage: true,
      matchesBlockedSelector: false,
    }),
    false,
  );
  assert.equal(
    shouldAllowSingleFingerPan({
      tool: 'eraser',
      isTargetInsideStage: true,
      matchesBlockedSelector: false,
    }),
    false,
  );
  assert.equal(
    shouldAllowSingleFingerPan({
      tool: 'pointer',
      isTargetInsideStage: false,
      matchesBlockedSelector: false,
    }),
    false,
  );
  assert.equal(
    shouldAllowSingleFingerPan({
      tool: 'pointer',
      isTargetInsideStage: true,
      matchesBlockedSelector: true,
    }),
    false,
  );
  assert.match(SINGLE_PAN_BLOCKED_SELECTOR, /\[data-slide-image-root\]/);
  assert.match(SINGLE_PAN_BLOCKED_SELECTOR, /\[data-testid="gemini-floating-frame"\]/);
  assert.match(SINGLE_PAN_BLOCKED_SELECTOR, /\[role="slider"\]/);
});
