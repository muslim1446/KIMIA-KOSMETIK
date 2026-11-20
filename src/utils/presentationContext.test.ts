import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_INTERACTIONS } from '../hooks/usePresentationSync.ts';
import {
  buildGeminiCacheKey,
  buildPresentationDigest,
  clampFloatingFrameRect,
  laserClientToSlidePercent,
  laserSlidePercentToClient,
  parseGeminiStructuredMeta,
} from './presentationContext.ts';

test('laserClientToSlidePercent and laserSlidePercentToClient map accurately across zoom and viewport sizes', () => {
  const slideRect = { left: 100, top: 50, width: 1000, height: 500 };
  const pct = laserClientToSlidePercent(600, 300, slideRect);
  assert.equal(pct.x, 50);
  assert.equal(pct.y, 50);

  const client = laserSlidePercentToClient(pct.x, pct.y, slideRect);
  assert.equal(client.x, 600);
  assert.equal(client.y, 300);

  // Clamps extreme off-screen outliers safely
  const clamped = laserClientToSlidePercent(-500, 2000, slideRect);
  assert.equal(clamped.x, -12);
  assert.equal(clamped.y, 112);
});

test('clampFloatingFrameRect keeps draggable and resizable Gemini frame inside viewport', () => {
  const clamped = clampFloatingFrameRect({ x: 2000, y: -50, width: 950, height: 120 }, 1280, 720);
  assert.equal(clamped.width, 780);
  assert.equal(clamped.height, 260);
  assert.equal(clamped.y, 12);
  assert.equal(clamped.x, 1280 - 780 - 12);
});

test('buildPresentationDigest includes entire deck outline, active sub-element, strokes, and text edits', () => {
  const digest = buildPresentationDigest({
    slideIndex: 1,
    interactions: { ...DEFAULT_INTERACTIONS, herbId: 'halia', herbPrep: 'rebusan' },
    permanentStrokes: [
      {
        id: 's1',
        slideIndex: 1,
        scopeKey: 'slide:1/herb:halia',
        points: [{ x: 10, y: 10 }],
        color: '#B91C1C',
        size: 4,
        mode: 'permanent',
        createdAt: 1000,
        authorId: 'u1',
      },
    ],
    tempStrokes: [],
    textEdits: { 'slide:1|h1': 'Tajuk Diubah' },
    slideImages: [],
  });

  assert.equal(digest.currentSlideNumber, 2);
  assert.match(digest.deckOutlineText, /Slaid 1:/);
  assert.match(digest.deckOutlineText, /Slaid 9:/);
  assert.match(digest.currentSlideDetailText, /Zingiber officinale/);
  assert.match(digest.currentSlideDetailText, /rebusan/);
  assert.match(digest.currentSlideDetailText, /Tajuk Diubah/);
  assert.match(digest.currentSlideDetailText, /1 garisan kekal/);
});

test('parseGeminiStructuredMeta strips json-meta fence cleanly and extracts queries', () => {
  const raw = [
    'Halia mengandungi sebatian **gingerol** yang melegakan angin.',
    '',
    '```json-meta',
    '{"pasteToSlide": true, "imageQueries": ["Zingiber officinale rhizome", "gingerol chemical structure"], "caption": "Rizom Halia"}',
    '```',
  ].join('\n');

  const parsed = parseGeminiStructuredMeta(raw);
  assert.equal(parsed.cleanMarkdown, 'Halia mengandungi sebatian **gingerol** yang melegakan angin.');
  assert.equal(parsed.pasteToSlide, true);
  assert.deepEqual(parsed.imageQueries, ['Zingiber officinale rhizome', 'gingerol chemical structure']);
  assert.equal(parsed.caption, 'Rizom Halia');
});

test('buildGeminiCacheKey distinguishes modes and context state', () => {
  const k1 = buildGeminiCacheKey({
    question: 'Terangkan ini',
    proveMode: false,
    slideIndex: 0,
    subLabel: 'Tab: ubat',
    strokeCount: 0,
    textEditsCount: 0,
    imageCount: 0,
  });
  const k2 = buildGeminiCacheKey({
    question: '  terangkan   ini ',
    proveMode: false,
    slideIndex: 0,
    subLabel: 'Tab: ubat',
    strokeCount: 0,
    textEditsCount: 0,
    imageCount: 0,
  });
  const k3 = buildGeminiCacheKey({
    question: 'Terangkan ini',
    proveMode: true,
    slideIndex: 0,
    subLabel: 'Tab: ubat',
    strokeCount: 0,
    textEditsCount: 0,
    imageCount: 0,
  });
  assert.equal(k1, k2);
  assert.notEqual(k1, k3);
});
