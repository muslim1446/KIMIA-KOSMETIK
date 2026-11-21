import {
  PenStroke,
  SlideImageItem,
  SlidePdfItem,
  SlideTextItem,
} from './annotationEngine';

export type ImageGeometryPatch = Pick<
  SlideImageItem,
  'scopeKey' | 'x' | 'y' | 'width' | 'height'
>;

export type SlideTextPatch = Pick<
  SlideTextItem,
  'scopeKey' | 'x' | 'y' | 'width' | 'height' | 'text' | 'fontSize' | 'color' | 'isBold' | 'bgColor'
>;

export type PdfGeometryPatch = Pick<
  SlidePdfItem,
  'scopeKey' | 'x' | 'y' | 'width' | 'height'
>;

export type BoardUndoAction =
  | { type: 'stroke-add'; slideIndex: number; stroke: PenStroke }
  | {
      type: 'strokes-remove';
      slideIndex: number;
      permanentStrokes: PenStroke[];
      tempStrokes: PenStroke[];
      batchId?: string;
    }
  | {
      type: 'text-edit';
      slideIndex: number;
      textKey: string;
      prevValue: string | null;
      nextValue: string | null;
    }
  | { type: 'image-add'; slideIndex: number; image: SlideImageItem }
  | {
      type: 'image-update';
      slideIndex: number;
      imageId: string;
      before: ImageGeometryPatch;
      after: ImageGeometryPatch;
    }
  | { type: 'image-delete'; slideIndex: number; image: SlideImageItem }
  | { type: 'slide-text-add'; slideIndex: number; item: SlideTextItem }
  | {
      type: 'slide-text-update';
      slideIndex: number;
      textId: string;
      before: SlideTextPatch;
      after: SlideTextPatch;
    }
  | { type: 'slide-text-delete'; slideIndex: number; item: SlideTextItem }
  | { type: 'slide-pdf-add'; slideIndex: number; item: SlidePdfItem }
  | {
      type: 'slide-pdf-update';
      slideIndex: number;
      pdfId: string;
      before: PdfGeometryPatch;
      after: PdfGeometryPatch;
    }
  | { type: 'slide-pdf-delete'; slideIndex: number; item: SlidePdfItem };

export interface SlideUndoRedoState {
  undoBySlide: Record<number, BoardUndoAction[]>;
  redoBySlide: Record<number, BoardUndoAction[]>;
}

export const MAX_UNDO_STEPS_PER_SLIDE = 50;

export function createEmptyUndoRedoState(): SlideUndoRedoState {
  return { undoBySlide: {}, redoBySlide: {} };
}

export function pickImagePatch(img: SlideImageItem): ImageGeometryPatch {
  return {
    scopeKey: img.scopeKey,
    x: img.x,
    y: img.y,
    width: img.width,
    height: img.height,
  };
}

export function imagePatchChanged(a: ImageGeometryPatch, b: ImageGeometryPatch): boolean {
  return (
    a.scopeKey !== b.scopeKey ||
    a.x !== b.x ||
    a.y !== b.y ||
    a.width !== b.width ||
    a.height !== b.height
  );
}

export function pickSlideTextPatch(item: SlideTextItem): SlideTextPatch {
  return {
    scopeKey: item.scopeKey,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    text: item.text,
    fontSize: item.fontSize,
    color: item.color,
    isBold: item.isBold,
    bgColor: item.bgColor ?? 'transparent',
  };
}

export function slideTextPatchChanged(a: SlideTextPatch, b: SlideTextPatch): boolean {
  return (
    a.scopeKey !== b.scopeKey ||
    a.x !== b.x ||
    a.y !== b.y ||
    a.width !== b.width ||
    a.height !== b.height ||
    a.text !== b.text ||
    a.fontSize !== b.fontSize ||
    a.color !== b.color ||
    a.isBold !== b.isBold ||
    (a.bgColor ?? 'transparent') !== (b.bgColor ?? 'transparent')
  );
}

export function pickPdfPatch(item: SlidePdfItem): PdfGeometryPatch {
  return {
    scopeKey: item.scopeKey,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
  };
}

export function pdfPatchChanged(a: PdfGeometryPatch, b: PdfGeometryPatch): boolean {
  return (
    a.scopeKey !== b.scopeKey ||
    a.x !== b.x ||
    a.y !== b.y ||
    a.width !== b.width ||
    a.height !== b.height
  );
}

function mergeStrokesUnique(existing: PenStroke[], incoming: PenStroke[]): PenStroke[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((s) => s.id));
  const merged = [...existing];
  for (const s of incoming) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      merged.push(s);
    }
  }
  return merged;
}

export function pushUndoAction(
  state: SlideUndoRedoState,
  action: BoardUndoAction,
  maxSteps = MAX_UNDO_STEPS_PER_SLIDE,
): SlideUndoRedoState {
  const sIdx = action.slideIndex;
  const currentStack = state.undoBySlide[sIdx] ?? [];

  // Coalesce eraser strokes from the same continuous pointer drag into one Undo step.
  if (
    action.type === 'strokes-remove' &&
    action.batchId &&
    currentStack.length > 0
  ) {
    const top = currentStack[currentStack.length - 1];
    if (top.type === 'strokes-remove' && top.batchId === action.batchId) {
      const mergedTop: BoardUndoAction = {
        ...top,
        permanentStrokes: mergeStrokesUnique(top.permanentStrokes, action.permanentStrokes),
        tempStrokes: mergeStrokesUnique(top.tempStrokes, action.tempStrokes),
      };
      return {
        undoBySlide: {
          ...state.undoBySlide,
          [sIdx]: [...currentStack.slice(0, -1), mergedTop],
        },
        redoBySlide: {
          ...state.redoBySlide,
          [sIdx]: [],
        },
      };
    }
  }

  const nextStack = [...currentStack, action].slice(-Math.max(1, maxSteps));
  return {
    undoBySlide: {
      ...state.undoBySlide,
      [sIdx]: nextStack,
    },
    redoBySlide: {
      ...state.redoBySlide,
      [sIdx]: [],
    },
  };
}

export function popUndoAction(
  state: SlideUndoRedoState,
  slideIndex: number,
  maxSteps = MAX_UNDO_STEPS_PER_SLIDE,
): { action: BoardUndoAction | null; nextState: SlideUndoRedoState } {
  const stack = state.undoBySlide[slideIndex] ?? [];
  if (stack.length === 0) {
    return { action: null, nextState: state };
  }
  const action = stack[stack.length - 1];
  const nextUndo = stack.slice(0, -1);
  const nextRedo = [...(state.redoBySlide[slideIndex] ?? []), action].slice(-Math.max(1, maxSteps));
  return {
    action,
    nextState: {
      undoBySlide: { ...state.undoBySlide, [slideIndex]: nextUndo },
      redoBySlide: { ...state.redoBySlide, [slideIndex]: nextRedo },
    },
  };
}

export function popRedoAction(
  state: SlideUndoRedoState,
  slideIndex: number,
  maxSteps = MAX_UNDO_STEPS_PER_SLIDE,
): { action: BoardUndoAction | null; nextState: SlideUndoRedoState } {
  const stack = state.redoBySlide[slideIndex] ?? [];
  if (stack.length === 0) {
    return { action: null, nextState: state };
  }
  const action = stack[stack.length - 1];
  const nextRedo = stack.slice(0, -1);
  const nextUndo = [...(state.undoBySlide[slideIndex] ?? []), action].slice(-Math.max(1, maxSteps));
  return {
    action,
    nextState: {
      undoBySlide: { ...state.undoBySlide, [slideIndex]: nextUndo },
      redoBySlide: { ...state.redoBySlide, [slideIndex]: nextRedo },
    },
  };
}
