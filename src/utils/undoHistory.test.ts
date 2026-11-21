import assert from 'node:assert/strict';
import test from 'node:test';
import { PenStroke, SlideImageItem, SlidePdfItem, SlideTextItem } from './annotationEngine.ts';
import {
  createEmptyUndoRedoState,
  imagePatchChanged,
  pdfPatchChanged,
  pickImagePatch,
  pickPdfPatch,
  pickSlideTextPatch,
  popRedoAction,
  popUndoAction,
  pushUndoAction,
  slideTextPatchChanged,
} from './undoHistory.ts';

function makeStroke(id: string, slideIndex = 0): PenStroke {
  return {
    id,
    slideIndex,
    scopeKey: `slide:${slideIndex}`,
    points: [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ],
    color: '#1E3A8A',
    size: 4,
    mode: 'permanent',
    createdAt: 1000,
    authorId: 'u1',
  };
}

test('pushUndoAction, popUndoAction, and popRedoAction maintain independent per-slide stacks', () => {
  let state = createEmptyUndoRedoState();
  state = pushUndoAction(state, { type: 'stroke-add', slideIndex: 0, stroke: makeStroke('s1', 0) });
  state = pushUndoAction(state, { type: 'stroke-add', slideIndex: 1, stroke: makeStroke('s2', 1) });
  state = pushUndoAction(state, {
    type: 'text-edit',
    slideIndex: 0,
    textKey: 'slide:0|h1',
    prevValue: null,
    nextValue: 'Tajuk Baru',
  });

  assert.equal(state.undoBySlide[0]?.length, 2);
  assert.equal(state.undoBySlide[1]?.length, 1);

  const undo1 = popUndoAction(state, 0);
  state = undo1.nextState;
  assert.equal(undo1.action?.type, 'text-edit');
  assert.equal(state.undoBySlide[0]?.length, 1);
  assert.equal(state.redoBySlide[0]?.length, 1);
  // Slide 1 untouched
  assert.equal(state.undoBySlide[1]?.length, 1);

  const redo1 = popRedoAction(state, 0);
  state = redo1.nextState;
  assert.equal(redo1.action?.type, 'text-edit');
  assert.equal(state.undoBySlide[0]?.length, 2);
  assert.equal(state.redoBySlide[0]?.length, 0);

  // Pushing a new action clears redo stack on that slide only
  const undo2 = popUndoAction(state, 0);
  state = undo2.nextState;
  assert.equal(state.redoBySlide[0]?.length, 1);
  state = pushUndoAction(state, { type: 'stroke-add', slideIndex: 0, stroke: makeStroke('s3', 0) });
  assert.equal(state.redoBySlide[0]?.length, 0);
});

test('pushUndoAction coalesces eraser deletions from the same drag batchId into a single step', () => {
  let state = createEmptyUndoRedoState();
  state = pushUndoAction(state, {
    type: 'strokes-remove',
    slideIndex: 2,
    permanentStrokes: [makeStroke('a', 2)],
    tempStrokes: [],
    batchId: 'erase-drag-1',
  });
  state = pushUndoAction(state, {
    type: 'strokes-remove',
    slideIndex: 2,
    permanentStrokes: [makeStroke('a', 2), makeStroke('b', 2)],
    tempStrokes: [],
    batchId: 'erase-drag-1',
  });

  assert.equal(state.undoBySlide[2]?.length, 1);
  const top = state.undoBySlide[2]?.[0];
  assert.equal(top?.type, 'strokes-remove');
  if (top?.type === 'strokes-remove') {
    assert.deepEqual(
      top.permanentStrokes.map((s) => s.id),
      ['a', 'b'],
    );
  }
});

test('pushUndoAction respects maxSteps cap per slide', () => {
  let state = createEmptyUndoRedoState();
  for (let i = 0; i < 5; i++) {
    state = pushUndoAction(state, { type: 'stroke-add', slideIndex: 0, stroke: makeStroke(`s${i}`, 0) }, 3);
  }
  assert.deepEqual(
    state.undoBySlide[0]?.map((a) => (a.type === 'stroke-add' ? a.stroke.id : '')),
    ['s2', 's3', 's4'],
  );
});

test('patch pickers and equality helpers detect geometry and style changes cleanly', () => {
  const img: SlideImageItem = {
    id: 'img-1',
    slideIndex: 0,
    scopeKey: 'slide:0',
    x: 100,
    y: 120,
    width: 300,
    height: 200,
    dataUrl: 'data:image/png;base64,AAA',
    authorId: 'u1',
    createdAt: 1,
    updatedAt: 1,
  };
  const imgA = pickImagePatch(img);
  const imgB = pickImagePatch({ ...img, x: 140 });
  assert.equal(imagePatchChanged(imgA, imgA), false);
  assert.equal(imagePatchChanged(imgA, imgB), true);

  const txt: SlideTextItem = {
    id: 'txt-1',
    slideIndex: 0,
    scopeKey: 'slide:0',
    x: 50,
    y: 60,
    width: 240,
    height: 90,
    text: 'Nota',
    fontSize: 24,
    color: '#1C1917',
    isBold: false,
    bgColor: 'transparent',
    authorId: 'u1',
    createdAt: 1,
    updatedAt: 1,
  };
  const txtA = pickSlideTextPatch(txt);
  const txtB = pickSlideTextPatch({ ...txt, fontSize: 28, isBold: true });
  assert.equal(slideTextPatchChanged(txtA, txtA), false);
  assert.equal(slideTextPatchChanged(txtA, txtB), true);

  const pdf: SlidePdfItem = {
    id: 'pdf-1',
    slideIndex: 0,
    scopeKey: 'slide:0',
    x: 400,
    y: 100,
    width: 360,
    height: 509,
    dataUrl: 'data:image/webp;base64,BBB',
    fileName: 'kimia.pdf',
    pageNumber: 1,
    pageCount: 6,
    authorId: 'u1',
    createdAt: 1,
    updatedAt: 1,
  };
  const pdfA = pickPdfPatch(pdf);
  const pdfB = pickPdfPatch({ ...pdf, width: 420 });
  assert.equal(pdfPatchChanged(pdfA, pdfA), false);
  assert.equal(pdfPatchChanged(pdfA, pdfB), true);
});
