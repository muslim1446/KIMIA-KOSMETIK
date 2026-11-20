export type PenMode = 'permanent' | 'temporary';
export type TempDurationSeconds = 3 | 5 | 6;
export type AnnotationTool = 'pointer' | 'pen' | 'eraser' | 'text-edit' | 'laser';

export interface Point2D {
  x: number;
  y: number;
}

export interface LogicalRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ScopeRect extends LogicalRect {
  scopeKey: string;
  depth: number;
}

export interface PenStroke {
  id: string;
  slideIndex: number;
  scopeKey: string;
  points: Point2D[];
  color: string;
  size: number;
  mode: PenMode;
  ttlSeconds?: TempDurationSeconds;
  createdAt: number;
  expiresAt?: number;
  authorId: string;
}

export interface SlideImageItem {
  id: string;
  slideIndex: number;
  scopeKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  authorId: string;
  createdAt: number;
  updatedAt: number;
}

export interface SlideTextItem {
  id: string;
  slideIndex: number;
  scopeKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  isBold?: boolean;
  bgColor?: string;
  authorId: string;
  createdAt: number;
  updatedAt: number;
}

export const LOGICAL_WIDTH = 1280;
export const LOGICAL_HEIGHT = 720;

export const PEN_COLORS = [
  { id: 'blue', label: 'Biru Dakwat', value: '#1E3A8A' },
  { id: 'red', label: 'Merah Penanda', value: '#B91C1C' },
  { id: 'emerald', label: 'Hijau Zamrud', value: '#047857' },
  { id: 'amber', label: 'Jingga Ambar', value: '#D97706' },
  { id: 'violet', label: 'Ungu Molekul', value: '#7C3AED' },
  { id: 'ink', label: 'Hitam Arang', value: '#1C1917' },
  { id: 'chalk', label: 'Putih Kapur', value: '#FFFFFF' },
] as const;

export const PEN_SIZES = [2, 4, 8, 14, 20] as const;
export const TEMP_DURATIONS: TempDurationSeconds[] = [3, 5, 6];

/** Text colours available for movable text boxes added from the presentation island. */
export const TEXT_COLORS = ['#1C1917', '#1E3A8A', '#B91C1C', '#047857', '#7C3AED', '#FFFFFF'] as const;

/** Background options for movable text boxes (first value is transparent). */
export const TEXT_BACKGROUNDS = ['transparent', '#FEF3C7', '#FFFFFF', '#1C1917'] as const;

export function getRootSlideScope(slideIndex: number): string {
  return `slide:${Math.max(0, Math.trunc(slideIndex))}`;
}

export function getScopeDepth(scopeKey: string): number {
  return scopeKey.split('/').length;
}

/**
 * Converts a viewport CSS coordinate into logical 1280x720 slide coordinates.
 * Works accurately at any browser zoom, stage zoom, or aspect ratio, including
 * points drawn outside the 1280x720 slide bounds.
 */
export function clientToLogicalPoint(
  clientX: number,
  clientY: number,
  slideRect: LogicalRect,
): Point2D {
  const safeW = slideRect.width > 0 ? slideRect.width : LOGICAL_WIDTH;
  const safeH = slideRect.height > 0 ? slideRect.height : LOGICAL_HEIGHT;
  return {
    x: ((clientX - slideRect.left) / safeW) * LOGICAL_WIDTH,
    y: ((clientY - slideRect.top) / safeH) * LOGICAL_HEIGHT,
  };
}

/**
 * Converts a logical 1280x720 slide coordinate back into viewport CSS pixels.
 */
export function logicalToClientPoint(
  lx: number,
  ly: number,
  slideRect: LogicalRect,
): Point2D {
  const safeW = slideRect.width > 0 ? slideRect.width : LOGICAL_WIDTH;
  const safeH = slideRect.height > 0 ? slideRect.height : LOGICAL_HEIGHT;
  return {
    x: slideRect.left + (lx / LOGICAL_WIDTH) * safeW,
    y: slideRect.top + (ly / LOGICAL_HEIGHT) * safeH,
  };
}

/**
 * Picks the deepest visible sub-element scope containing logical point (lx, ly).
 * Falls back to the root slide scope `slide:${slideIndex}` when not over a sub-element.
 */
export function resolveScopeForPoint(
  lx: number,
  ly: number,
  scopeRects: ScopeRect[],
  slideIndex: number,
): { scopeKey: string; originX: number; originY: number } {
  const matching = scopeRects.filter(
    (r) => lx >= r.left && lx <= r.left + r.width && ly >= r.top && ly <= r.top + r.height,
  );

  if (matching.length === 0) {
    return { scopeKey: getRootSlideScope(slideIndex), originX: 0, originY: 0 };
  }

  matching.sort((a, b) => {
    if (b.depth !== a.depth) return b.depth - a.depth;
    return a.width * a.height - b.width * b.height;
  });

  const best = matching[0];
  return {
    scopeKey: best.scopeKey,
    originX: best.left,
    originY: best.top,
  };
}

/**
 * Resolves which storage scope an image belongs to based on overlap and proximity.
 * If the image overlaps a sub-element or sits within `proximityPx` of a sub-element,
 * it attaches to the deepest matching sub-element so switching tabs hides it cleanly.
 */
export function resolveScopeForImageBox(
  box: LogicalRect,
  scopeRects: ScopeRect[],
  slideIndex: number,
  proximityPx = 22,
): { scopeKey: string; originX: number; originY: number } {
  const centerX = box.left + box.width / 2;
  const centerY = box.top + box.height / 2;
  const boxArea = Math.max(1, box.width * box.height);

  const candidates = scopeRects
    .map((r) => {
      const ix1 = Math.max(box.left, r.left);
      const iy1 = Math.max(box.top, r.top);
      const ix2 = Math.min(box.left + box.width, r.left + r.width);
      const iy2 = Math.min(box.top + box.height, r.top + r.height);
      const overlapArea = ix2 > ix1 && iy2 > iy1 ? (ix2 - ix1) * (iy2 - iy1) : 0;
      const overlapRatio = overlapArea / boxArea;

      const dx = centerX < r.left ? r.left - centerX : centerX > r.left + r.width ? centerX - (r.left + r.width) : 0;
      const dy = centerY < r.top ? r.top - centerY : centerY > r.top + r.height ? centerY - (r.top + r.height) : 0;
      const centerDist = Math.hypot(dx, dy);

      const nearEdge =
        box.left + box.width >= r.left - proximityPx &&
        box.left <= r.left + r.width + proximityPx &&
        box.top + box.height >= r.top - proximityPx &&
        box.top <= r.top + r.height + proximityPx;

      const centerInside = centerDist === 0;
      const qualifies = centerInside || overlapRatio >= 0.25 || (nearEdge && centerDist <= proximityPx * 2.5);

      return { rect: r, qualifies, centerInside, overlapRatio, centerDist };
    })
    .filter((c) => c.qualifies);

  if (candidates.length === 0) {
    return { scopeKey: getRootSlideScope(slideIndex), originX: 0, originY: 0 };
  }

  candidates.sort((a, b) => {
    if (a.centerInside !== b.centerInside) return a.centerInside ? -1 : 1;
    if (b.rect.depth !== a.rect.depth) return b.rect.depth - a.rect.depth;
    if (Math.abs(b.overlapRatio - a.overlapRatio) > 0.05) return b.overlapRatio - a.overlapRatio;
    return a.centerDist - b.centerDist;
  });

  const best = candidates[0].rect;
  return {
    scopeKey: best.scopeKey,
    originX: best.left,
    originY: best.top,
  };
}

export function toScopeLocalPoints(points: Point2D[], originX: number, originY: number): Point2D[] {
  return points.map((p) => ({
    x: Math.round((p.x - originX) * 10) / 10,
    y: Math.round((p.y - originY) * 10) / 10,
  }));
}

export function toSlideGlobalPoints(points: Point2D[], originX: number, originY: number): Point2D[] {
  return points.map((p) => ({
    x: p.x + originX,
    y: p.y + originY,
  }));
}

export function simplifyStrokePoints(points: Point2D[], minDistance = 1.8): Point2D[] {
  if (points.length <= 2) return points;
  const result: Point2D[] = [points[0]];
  let last = points[0];

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    if (Math.hypot(p.x - last.x, p.y - last.y) >= minDistance) {
      result.push(p);
      last = p;
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

export function pointsToSmoothSvgPath(points: Point2D[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y} L ${p.x + 0.01} ${p.y + 0.01}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function distanceToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

export function doesEraserHitStroke(
  eraserCenter: Point2D,
  eraserRadius: number,
  globalPoints: Point2D[],
  strokeSize: number,
): boolean {
  if (globalPoints.length === 0) return false;
  const threshold = eraserRadius + strokeSize * 0.5;
  if (globalPoints.length === 1) {
    return Math.hypot(eraserCenter.x - globalPoints[0].x, eraserCenter.y - globalPoints[0].y) <= threshold;
  }
  for (let i = 0; i < globalPoints.length - 1; i++) {
    if (distanceToSegment(eraserCenter, globalPoints[i], globalPoints[i + 1]) <= threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Computes opacity (0..1) for temporary pen strokes with a smooth ease-out fade
 * over the final 1.2s (or 35% of total duration).
 */
export function computeTempStrokeOpacity(
  nowMs: number,
  createdAtMs: number,
  expiresAtMs?: number,
): number {
  if (!expiresAtMs) return 1;
  if (nowMs >= expiresAtMs) return 0;

  const totalDuration = Math.max(1000, expiresAtMs - createdAtMs);
  const fadeWindow = Math.min(1300, totalDuration * 0.35);
  const remaining = expiresAtMs - nowMs;

  if (remaining >= fadeWindow) return 1;
  const linear = Math.max(0, Math.min(1, remaining / fadeWindow));
  // Smooth cubic ease-out fade
  return linear * linear * (3 - 2 * linear);
}

export const LIVE_STROKE_MAX_AGE_MS = 45_000;

export function pruneExpiredTempStrokes(strokes: PenStroke[], nowMs: number): PenStroke[] {
  return strokes.filter((s) => s.mode !== 'temporary' || !s.expiresAt || s.expiresAt > nowMs);
}

export function pruneStaleLiveStrokes(
  liveMap: Record<string, PenStroke>,
  nowMs: number,
  maxAgeMs = LIVE_STROKE_MAX_AGE_MS,
): Record<string, PenStroke> {
  const next: Record<string, PenStroke> = {};
  for (const [authorId, stroke] of Object.entries(liveMap)) {
    if (!stroke || typeof stroke !== 'object') continue;
    if (typeof stroke.createdAt !== 'number' || nowMs - stroke.createdAt > maxAgeMs) continue;
    next[authorId] = stroke;
  }
  return next;
}

export function isScopeVisible(
  scopeKey: string,
  slideIndex: number,
  visibleScopes: Set<string>,
): boolean {
  if (scopeKey === getRootSlideScope(slideIndex)) return true;
  return visibleScopes.has(scopeKey);
}

export function sanitizeTextOverride(raw: string, maxLength = 500): string {
  return raw.replace(/\r\n/g, '\n').slice(0, maxLength);
}

/**
 * Conflict-free merge helpers used inside Firestore transactions so concurrent
 * teammates never overwrite each other's strokes, text edits, or image IDs.
 */
export function mergeStrokeList(
  existing: PenStroke[],
  incoming: PenStroke,
  maxCount = 400,
): PenStroke[] {
  const deduped = existing.filter((s) => s.id !== incoming.id);
  return [...deduped, incoming].slice(-maxCount);
}

export function mergeStrokeBatch(
  existing: PenStroke[],
  additions: PenStroke[],
  maxCount = 400,
): PenStroke[] {
  const byId = new Map<string, PenStroke>();
  for (const s of existing) byId.set(s.id, s);
  for (const s of additions) byId.set(s.id, s);
  return Array.from(byId.values()).slice(-maxCount);
}

export function removeStrokesFromList(
  existing: PenStroke[],
  idsToDelete: Set<string>,
): PenStroke[] {
  return existing.filter((s) => !idsToDelete.has(s.id));
}

export function mergeTextEditMap(
  existing: Record<string, string>,
  textKey: string,
  value: string | null,
  maxKeys = 200,
): Record<string, string> {
  const next = { ...existing };
  if (value === null) {
    delete next[textKey];
  } else {
    next[textKey] = sanitizeTextOverride(value, 500);
  }
  const entries = Object.entries(next);
  if (entries.length <= maxKeys) return next;
  return Object.fromEntries(entries.slice(-maxKeys));
}

export function mergeLiveStrokeMap(
  existing: Record<string, PenStroke>,
  authorId: string,
  stroke: PenStroke | null,
  maxAuthors = 20,
): Record<string, PenStroke> {
  const next = { ...existing };
  if (stroke) {
    next[authorId] = stroke;
  } else {
    delete next[authorId];
  }
  const entries = Object.entries(next);
  if (entries.length <= maxAuthors) return next;
  return Object.fromEntries(entries.slice(-maxAuthors));
}

export function mergeIdList(
  existingIds: string[],
  addId?: string,
  removeId?: string,
  maxCount = 50,
): string[] {
  let next = existingIds.filter((id) => id !== removeId && id !== addId);
  if (addId) {
    next = [...next, addId];
  }
  return next.slice(-maxCount);
}

