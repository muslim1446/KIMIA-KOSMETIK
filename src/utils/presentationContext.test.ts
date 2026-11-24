import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_INTERACTIONS } from '../hooks/usePresentationSync.ts';
import {
  buildGeminiCacheKey,
  buildGoogleSlideAiPrompt,
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

  const mobile = clampFloatingFrameRect({ x: 200, y: 500, width: 390, height: 470 }, 320, 568);
  assert.equal(mobile.width, 304);
  assert.equal(mobile.x, 8);
  assert.ok(mobile.x + mobile.width <= 320 - 8);
  assert.ok(mobile.y + mobile.height <= 568 - 8);
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
    slideTexts: [
      {
        id: 'txt-1',
        slideIndex: 1,
        scopeKey: 'slide:1',
        x: 100,
        y: 120,
        width: 320,
        height: 100,
        text: 'Gingerol larut dalam alkohol',
        fontSize: 24,
        color: '#1C1917',
        isBold: true,
        bgColor: 'transparent',
        authorId: 'u1',
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'txt-2',
        slideIndex: 0,
        scopeKey: 'slide:0',
        x: 100,
        y: 120,
        width: 320,
        height: 100,
        text: 'Teks slaid lain tidak patut disertakan',
        fontSize: 20,
        color: '#1C1917',
        authorId: 'u1',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ],
  });

  assert.equal(digest.currentSlideNumber, 2);
  assert.match(digest.deckOutlineText, /Slaid 1:/);
  assert.match(digest.deckOutlineText, /Slaid 9:/);
  assert.match(digest.currentSlideDetailText, /Zingiber officinale/);
  assert.match(digest.currentSlideDetailText, /rebusan/);
  assert.match(digest.currentSlideDetailText, /Tajuk Diubah/);
  assert.match(digest.currentSlideDetailText, /1 garisan kekal/);
  assert.match(digest.currentSlideDetailText, /KOTAK TEKS TAMBAHAN/);
  assert.match(digest.currentSlideDetailText, /Gingerol larut dalam alkohol/);
  assert.doesNotMatch(digest.currentSlideDetailText, /Teks slaid lain tidak patut disertakan/);
});

test('buildGoogleSlideAiPrompt builds a compact hidden query and a full clipboard prompt', () => {
  const digest = buildPresentationDigest({
    slideIndex: 0,
    interactions: DEFAULT_INTERACTIONS,
    permanentStrokes: [],
    tempStrokes: [],
    textEdits: {},
    slideImages: [],
    slideTexts: [],
  });

  const { query, prompt } = buildGoogleSlideAiPrompt(digest, 'Ubat dan kosmetik KSSM');
  assert.ok(query.length > 0 && query.length <= 1800);
  assert.match(query, /tutor Kimia KSSM Tingkatan 5/);
  assert.match(query, /Slaid 1\/9/);
  assert.match(prompt, /KONTEKS PENUH SLAID:/);
  assert.match(prompt, /OUTLINE KESELURUHAN DEK:/);
  assert.match(prompt, /Ubat dan kosmetik KSSM/);
  assert.match(prompt, /Slaid 1\/9/);
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
