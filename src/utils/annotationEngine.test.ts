import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clientToLogicalPoint,
  computeTempStrokeOpacity,
  doesEraserHitStroke,
  isScopeVisible,
  logicalToClientPoint,
  mergeIdList,
  mergeLiveStrokeMap,
  mergeStrokeBatch,
  mergeStrokeList,
  mergeTextEditMap,
  PenStroke,
  pruneExpiredTempStrokes,
  pruneStaleLiveStrokes,
  removeStrokesFromList,
  resolveScopeForImageBox,
  resolveScopeForPoint,
  sanitizeTextOverride,
  ScopeRect,
  simplifyStrokePoints,
  toScopeLocalPoints,
  toSlideGlobalPoints,
} from './annotationEngine.ts';

test('clientToLogicalPoint and logicalToClientPoint preserve coordinates across zoom levels', () => {
  const zoomedRect = { left: 100, top: 50, width: 2560, height: 1440 }; // 2x zoomed 1280x720
  const logical = clientToLogicalPoint(1380, 770, zoomedRect);
  assert.equal(logical.x, 640);
  assert.equal(logical.y, 360);

  // Supports drawing outside the 1280x720 slide bounds (negative or >1280)
  const outside = clientToLogicalPoint(20, 20, zoomedRect);
  assert.ok(outside.x < 0);
  assert.ok(outside.y < 0);

  const roundTrip = logicalToClientPoint(logical.x, logical.y, zoomedRect);
  assert.equal(roundTrip.x, 1380);
  assert.equal(roundTrip.y, 770);
});

test('resolveScopeForPoint picks deepest sub-element scope and falls back to root slide scope', () => {
  const scopes: ScopeRect[] = [
    { scopeKey: 'slide:1/herb:halia', left: 420, top: 120, width: 780, height: 540, depth: 2 },
    { scopeKey: 'slide:1/herb:halia/prep:lesung', left: 440, top: 480, width: 740, height: 150, depth: 3 },
  ];

  // Inside nested sub-sub-element
  const nested = resolveScopeForPoint(500, 520, scopes, 1);
  assert.equal(nested.scopeKey, 'slide:1/herb:halia/prep:lesung');
  assert.equal(nested.originX, 440);
  assert.equal(nested.originY, 480);

  // Inside parent herb card, above prep section
  const parent = resolveScopeForPoint(500, 220, scopes, 1);
  assert.equal(parent.scopeKey, 'slide:1/herb:halia');

  // Outside all sub-elements (e.g. header or left column)
  const root = resolveScopeForPoint(100, 100, scopes, 1);
  assert.equal(root.scopeKey, 'slide:1');
  assert.equal(root.originX, 0);
  assert.equal(root.originY, 0);
});

test('resolveScopeForImageBox attaches nearby or overlapping images to the sub-element scope', () => {
  const scopes: ScopeRect[] = [
    { scopeKey: 'slide:0/compare:ubat', left: 640, top: 150, width: 560, height: 480, depth: 2 },
  ];

  // Image placed slightly overlapping/very near the sub-element edge (within 22px proximity)
  const near = resolveScopeForImageBox({ left: 530, top: 260, width: 120, height: 100 }, scopes, 0, 22);
  assert.equal(near.scopeKey, 'slide:0/compare:ubat');

  // Image placed far away in permanent left column
  const far = resolveScopeForImageBox({ left: 60, top: 200, width: 140, height: 120 }, scopes, 0, 22);
  assert.equal(far.scopeKey, 'slide:0');
});

test('toScopeLocalPoints and toSlideGlobalPoints translate coordinates accurately when element moves', () => {
  const raw = [{ x: 460, y: 500 }, { x: 520, y: 540 }];
  const local = toScopeLocalPoints(raw, 440, 480);
  assert.deepEqual(local, [{ x: 20, y: 20 }, { x: 80, y: 60 }]);

  // Element shifted down by 40px: global points move with the element
  const movedGlobal = toSlideGlobalPoints(local, 440, 520);
  assert.deepEqual(movedGlobal, [{ x: 460, y: 540 }, { x: 520, y: 580 }]);
});

test('doesEraserHitStroke detects segment intersection within eraser radius', () => {
  const strokePoints = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 300, y: 200 },
  ];
  assert.equal(doesEraserHitStroke({ x: 150, y: 106 }, 12, strokePoints, 4), true);
  assert.equal(doesEraserHitStroke({ x: 150, y: 140 }, 12, strokePoints, 4), false);
});

test('computeTempStrokeOpacity fades smoothly to 0 and pruneExpiredTempStrokes removes expired items', () => {
  const created = 1000;
  const expires = 4000; // 3s TTL -> fadeWindow is 1050ms
  assert.equal(computeTempStrokeOpacity(1500, created, expires), 1);

  const midFade = computeTempStrokeOpacity(3500, created, expires);
  assert.ok(midFade > 0 && midFade < 1);

  assert.equal(computeTempStrokeOpacity(4000, created, expires), 0);

  const strokes: PenStroke[] = [
    {
      id: 'perm-1',
      slideIndex: 0,
      scopeKey: 'slide:0',
      points: [{ x: 10, y: 10 }],
      color: '#1E3A8A',
      size: 4,
      mode: 'permanent',
      createdAt: 1000,
      authorId: 'u1',
    },
    {
      id: 'temp-expired',
      slideIndex: 0,
      scopeKey: 'slide:0',
      points: [{ x: 20, y: 20 }],
      color: '#B91C1C',
      size: 4,
      mode: 'temporary',
      ttlSeconds: 3,
      createdAt: 1000,
      expiresAt: 4000,
      authorId: 'u1',
    },
    {
      id: 'temp-active',
      slideIndex: 0,
      scopeKey: 'slide:0',
      points: [{ x: 30, y: 30 }],
      color: '#047857',
      size: 4,
      mode: 'temporary',
      ttlSeconds: 6,
      createdAt: 1000,
      expiresAt: 7000,
      authorId: 'u1',
    },
  ];

  const remaining = pruneExpiredTempStrokes(strokes, 4500);
  assert.deepEqual(
    remaining.map((s) => s.id),
    ['perm-1', 'temp-active'],
  );
});

test('isScopeVisible hides unmounted tab scopes while keeping root slide visible', () => {
  const visible = new Set(['slide:0/compare:kosmetik']);
  assert.equal(isScopeVisible('slide:0', 0, visible), true);
  assert.equal(isScopeVisible('slide:0/compare:kosmetik', 0, visible), true);
  assert.equal(isScopeVisible('slide:0/compare:ubat', 0, visible), false);
});

test('simplifyStrokePoints reduces redundant points and sanitizeTextOverride enforces limits', () => {
  const dense = [
    { x: 0, y: 0 },
    { x: 0.5, y: 0.4 },
    { x: 1.0, y: 0.8 },
    { x: 10, y: 10 },
    { x: 20, y: 20 },
  ];
  const simplified = simplifyStrokePoints(dense, 2);
  assert.equal(simplified.length, 3);
  assert.equal(sanitizeTextOverride('a'.repeat(600), 500).length, 500);
});

test('conflict-free merge helpers preserve concurrent teammates strokes, text edits, live strokes, and image IDs', () => {
  const s1: PenStroke = {
    id: 'stk-1',
    slideIndex: 0,
    scopeKey: 'slide:0',
    points: [{ x: 1, y: 1 }],
    color: '#1E3A8A',
    size: 4,
    mode: 'permanent',
    createdAt: 1000,
    authorId: 'u1',
  };
  const s2: PenStroke = { ...s1, id: 'stk-2', authorId: 'u2' };

  const merged = mergeStrokeList([s1], s2);
  assert.deepEqual(
    merged.map((s) => s.id),
    ['stk-1', 'stk-2'],
  );

  const batched = mergeStrokeBatch([s1], [s1, s2]);
  assert.equal(batched.length, 2);

  const afterRemove = removeStrokesFromList(merged, new Set(['stk-1']));
  assert.deepEqual(
    afterRemove.map((s) => s.id),
    ['stk-2'],
  );

  const text1 = mergeTextEditMap({ 'slide:0|h1': 'Tajuk A' }, 'slide:0|btn', 'Butang B');
  assert.deepEqual(text1, { 'slide:0|h1': 'Tajuk A', 'slide:0|btn': 'Butang B' });
  const text2 = mergeTextEditMap(text1, 'slide:0|h1', null);
  assert.deepEqual(text2, { 'slide:0|btn': 'Butang B' });

  const live = mergeLiveStrokeMap({ u1: s1 }, 'u2', s2);
  assert.deepEqual(Object.keys(live), ['u1', 'u2']);
  const liveCleared = mergeLiveStrokeMap(live, 'u1', null);
  assert.deepEqual(Object.keys(liveCleared), ['u2']);

  assert.deepEqual(mergeIdList(['img-1'], 'img-2'), ['img-1', 'img-2']);
  assert.deepEqual(mergeIdList(['img-1', 'img-2'], undefined, 'img-1'), ['img-2']);
});

test('pruneStaleLiveStrokes removes orphaned live strokes older than maxAgeMs', () => {
  const fresh: PenStroke = {
    id: 'stk-fresh',
    slideIndex: 0,
    scopeKey: 'slide:0',
    points: [{ x: 10, y: 10 }],
    color: '#1E3A8A',
    size: 4,
    mode: 'permanent',
    createdAt: 100_000,
    authorId: 'u1',
  };
  const stale: PenStroke = {
    ...fresh,
    id: 'stk-stale',
    createdAt: 40_000,
    authorId: 'u2',
  };
  const pruned = pruneStaleLiveStrokes({ u1: fresh, u2: stale }, 105_000, 45_000);
  assert.deepEqual(Object.keys(pruned), ['u1']);
});


