import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLE_SPRINGS,
  appleRubberBand,
  concentricRadius,
  evaluateSpringProgress,
  swiftUiSpringToMotion,
} from './applePhysics';

test('swiftUiSpringToMotion computes exact stiffness and damping from response and dampingFraction', () => {
  const spring = swiftUiSpringToMotion(0.5, 1.0, 1);
  // omega_n = 2 * pi / 0.5 = 4 * pi => stiffness = 16 * pi^2 ~= 157.91
  assert.ok(Math.abs(spring.stiffness - 157.91) < 0.05);
  // damping = 2 * 1 * 1.0 * 4 * pi = 8 * pi ~= 25.13
  assert.ok(Math.abs(spring.damping - 25.13) < 0.05);
  assert.equal(spring.type, 'spring');
  assert.ok(APPLE_SPRINGS.popover.stiffness > APPLE_SPRINGS.sheet.stiffness);
});

test('concentricRadius obeys R_inner = max(0, R_outer - padding)', () => {
  assert.equal(concentricRadius(28, 12), 16);
  assert.equal(concentricRadius(26, 10), 16);
  assert.equal(concentricRadius(12, 16), 0);
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

test('evaluateSpringProgress starts at 0 and settles near 1', () => {
  assert.equal(evaluateSpringProgress(0, 0.34, 0.82), 0);
  const settled = evaluateSpringProgress(0.8, 0.34, 0.82);
  assert.ok(Math.abs(settled - 1) < 0.01);
});
