import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Lock, Move, Pin, Trash2, Unlock } from 'lucide-react';
import {
  AnnotationTool,
  clientToLogicalPoint,
  computeTempStrokeOpacity,
  doesEraserHitStroke,
  getRootSlideScope,
  getScopeDepth,
  isScopeVisible,
  LIVE_STROKE_MAX_AGE_MS,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  LogicalRect,
  logicalToClientPoint,
  PenMode,
  PenStroke,
  Point2D,
  pointsToSmoothSvgPath,
  resolveScopeForImageBox,
  resolveScopeForPoint,
  ScopeRect,
  simplifyStrokePoints,
  SlideImageItem,
  TempDurationSeconds,
  toScopeLocalPoints,
  toSlideGlobalPoints,
} from '../utils/annotationEngine';
import { LiveStrokeMap } from '../hooks/useCollaborativeBoard';
import { useUiText } from '../utils/uiLanguage';

interface SlideAnnotationLayerProps {
  slideIndex: number;
  slideContainerRef: React.RefObject<HTMLDivElement | null>;
  interactionsKey: string;
  tool: AnnotationTool;
  penMode: PenMode;
  tempDuration: TempDurationSeconds;
  penColor: string;
  penSize: number;
  currentAuthorId: string;
  permanentStrokes: PenStroke[];
  tempStrokes: PenStroke[];
  liveStrokes: LiveStrokeMap;
  slideImages: SlideImageItem[];
  onLiveStroke: (stroke: PenStroke | null) => void;
  onCommitStroke: (stroke: PenStroke) => void;
  onDeleteStrokes: (ids: Set<string>) => void;
  onUpdateImage: (
    imageId: string,
    patch: Partial<Pick<SlideImageItem, 'scopeKey' | 'x' | 'y' | 'width' | 'height'>>,
    commit?: boolean,
  ) => void;
  onDeleteImage: (imageId: string) => void;
  onDrawingStart?: () => void;
  isRemoteProjector?: boolean;
  zoomScale?: number;
  panOffset?: { x: number; y: number };
  isPinchingOrPanning?: boolean;
}

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

export const SlideAnnotationLayer: React.FC<SlideAnnotationLayerProps> = ({
  slideIndex,
  slideContainerRef,
  interactionsKey,
  tool,
  penMode,
  tempDuration,
  penColor,
  penSize,
  currentAuthorId,
  permanentStrokes,
  tempStrokes,
  liveStrokes,
  slideImages,
  onLiveStroke,
  onCommitStroke,
  onDeleteStrokes,
  onUpdateImage,
  onDeleteImage,
  onDrawingStart,
  isRemoteProjector = false,
  zoomScale = 1,
  panOffset = { x: 0, y: 0 },
  isPinchingOrPanning = false,
}) => {
  const t = useUiText();
  const [slideRect, setSlideRect] = useState<LogicalRect>({
    left: 0,
    top: 0,
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
  });
  const [scopeRects, setScopeRects] = useState<ScopeRect[]>([]);
  const [draftStroke, setDraftStroke] = useState<PenStroke | null>(null);
  const [eraserPos, setEraserPos] = useState<Point2D | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Image interaction state
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [unlockedDragId, setUnlockedDragId] = useState<string | null>(null);
  const [pinnedToSlideIds, setPinnedToSlideIds] = useState<Set<string>>(() => new Set());

  const activePointerIdRef = useRef<number | null>(null);
  const activeDraftRef = useRef<{
    stroke: PenStroke;
    originX: number;
    originY: number;
    globalPoints: Point2D[];
  } | null>(null);
  const lastLiveEmitRef = useRef<number>(0);
  const isErasingRef = useRef<boolean>(false);
  const lastImagePointerRef = useRef<{ id: string; time: number } | null>(null);

  const imageActionRef = useRef<{
    type: 'drag' | 'resize';
    imageId: string;
    corner?: ResizeCorner;
    startClientX: number;
    startClientY: number;
    startGlobalX: number;
    startGlobalY: number;
    startW: number;
    startH: number;
    originX: number;
    originY: number;
    latestPatch?: Partial<Pick<SlideImageItem, 'scopeKey' | 'x' | 'y' | 'width' | 'height'>>;
  } | null>(null);

  // Measure slideRect and all visible [data-storage-scope] bounding rects
  const measureGeometry = useCallback(() => {
    const el = slideContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const nextSlideRect: LogicalRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    setSlideRect(nextSlideRect);

    const scaleX = LOGICAL_WIDTH / rect.width;
    const scaleY = LOGICAL_HEIGHT / rect.height;

    const nodes = el.querySelectorAll<HTMLElement>('[data-storage-scope]');
    const nextScopes: ScopeRect[] = [];
    nodes.forEach((node) => {
      const scopeKey = node.dataset.storageScope;
      if (!scopeKey) return;
      const nr = node.getBoundingClientRect();
      if (nr.width <= 0 || nr.height <= 0) return;
      nextScopes.push({
        scopeKey,
        left: (nr.left - rect.left) * scaleX,
        top: (nr.top - rect.top) * scaleY,
        width: nr.width * scaleX,
        height: nr.height * scaleY,
        depth: getScopeDepth(scopeKey),
      });
    });
    setScopeRects(nextScopes);
  }, [slideContainerRef]);

  // Synchronously update slideRect before browser paint on any zoom or pan frame
  useLayoutEffect(() => {
    measureGeometry();
  }, [measureGeometry, slideIndex, interactionsKey, zoomScale, panOffset.x, panOffset.y]);

  useEffect(() => {
    measureGeometry();
    const t1 = window.setTimeout(measureGeometry, 60);
    const t2 = window.setTimeout(measureGeometry, 240);

    const el = slideContainerRef.current;
    let ro: ResizeObserver | null = null;
    let mo: MutationObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measureGeometry);
      ro.observe(el);
    }
    if (el && typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(measureGeometry);
      mo.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-storage-scope', 'style', 'class'] });
    }
    window.addEventListener('resize', measureGeometry);
    window.addEventListener('scroll', measureGeometry, true);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro?.disconnect();
      mo?.disconnect();
      window.removeEventListener('resize', measureGeometry);
      window.removeEventListener('scroll', measureGeometry, true);
    };
  }, [measureGeometry, slideIndex, interactionsKey, slideContainerRef]);

  // Enhanced safety: Immediately abort any draft drawing, eraser, or image drag when 360 gesture starts
  useEffect(() => {
    if (isPinchingOrPanning) {
      if (activeDraftRef.current) {
        activeDraftRef.current = null;
        setDraftStroke(null);
        onLiveStroke(null);
      }
      activePointerIdRef.current = null;
      isErasingRef.current = false;
      imageActionRef.current = null;
    }
  }, [isPinchingOrPanning, onLiveStroke]);

  // Clear image selection when switching slides
  useEffect(() => {
    setSelectedImageId(null);
    setUnlockedDragId(null);
  }, [slideIndex]);

  // Smooth 60fps fade animation loop ONLY when temporary strokes are still fading
  const hasActiveTempStrokes =
    draftStroke?.mode === 'temporary' ||
    tempStrokes.some((s) => !s.expiresAt || s.expiresAt > nowMs);
  useEffect(() => {
    if (!hasActiveTempStrokes) return;
    let rafId = 0;
    const tick = () => {
      setNowMs(Date.now());
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [hasActiveTempStrokes]);

  // Delete key removes selected image
  useEffect(() => {
    if (!selectedImageId || isRemoteProjector) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteImage(selectedImageId);
        setSelectedImageId(null);
        setUnlockedDragId(null);
      } else if (e.key === 'Escape') {
        setSelectedImageId(null);
        setUnlockedDragId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedImageId, isRemoteProjector, onDeleteImage]);

  const scopeMap = useMemo(() => {
    const map = new Map<string, ScopeRect>();
    for (const s of scopeRects) {
      map.set(s.scopeKey, s);
    }
    return map;
  }, [scopeRects]);

  const visibleScopeSet = useMemo(() => new Set(scopeMap.keys()), [scopeMap]);

  const getScopeOrigin = useCallback(
    (scopeKey: string): Point2D => {
      if (scopeKey === getRootSlideScope(slideIndex)) return { x: 0, y: 0 };
      const r = scopeMap.get(scopeKey);
      return r ? { x: r.left, y: r.top } : { x: 0, y: 0 };
    },
    [scopeMap, slideIndex],
  );

  // Convert visible strokes (permanent + non-expired temp + live remote strokes) to viewport SVG paths
  const renderableStrokes = useMemo(() => {
    const visibleTempStrokes = tempStrokes.filter((s) => !s.expiresAt || s.expiresAt > nowMs);
    const committedIds = new Set<string>();
    for (const s of permanentStrokes) committedIds.add(s.id);
    for (const s of visibleTempStrokes) committedIds.add(s.id);

    const byId = new Map<string, PenStroke>();
    for (const s of permanentStrokes) byId.set(s.id, s);
    for (const s of visibleTempStrokes) byId.set(s.id, s);
    for (const s of Object.values(liveStrokes)) {
      if (
        s &&
        s.authorId !== currentAuthorId &&
        !committedIds.has(s.id) &&
        nowMs - s.createdAt <= LIVE_STROKE_MAX_AGE_MS
      ) {
        byId.set(s.id, s);
      }
    }
    if (draftStroke) {
      byId.set(draftStroke.id, draftStroke);
    }

    return Array.from(byId.values())
      .filter((s) => s.slideIndex === slideIndex && isScopeVisible(s.scopeKey, slideIndex, visibleScopeSet))
      .map((stroke) => {
        const origin = getScopeOrigin(stroke.scopeKey);
        const globalPts = toSlideGlobalPoints(stroke.points, origin.x, origin.y);
        const screenPts = globalPts.map((p) => logicalToClientPoint(p.x, p.y, slideRect));
        const opacity =
          stroke.mode === 'temporary' && stroke.expiresAt
            ? computeTempStrokeOpacity(nowMs, stroke.createdAt, stroke.expiresAt)
            : 1;
        const scaleFactor = slideRect.width > 0 ? slideRect.width / LOGICAL_WIDTH : 1;
        return {
          stroke,
          pathD: pointsToSmoothSvgPath(screenPts),
          opacity,
          screenWidth: Math.max(1.5, stroke.size * scaleFactor),
        };
      })
      .filter((item) => item.opacity > 0.01);
  }, [
    permanentStrokes,
    tempStrokes,
    liveStrokes,
    draftStroke,
    currentAuthorId,
    nowMs,
    slideIndex,
    visibleScopeSet,
    getScopeOrigin,
    slideRect,
  ]);

  const visibleImages = useMemo(() => {
    return slideImages.filter((img) => isScopeVisible(img.scopeKey, slideIndex, visibleScopeSet));
  }, [slideImages, slideIndex, visibleScopeSet]);

  // Erase hit check in logical coordinates
  const runEraserAt = useCallback(
    (clientX: number, clientY: number) => {
      const logicalPt = clientToLogicalPoint(clientX, clientY, slideRect);
      setEraserPos({ x: clientX, y: clientY });
      const radius = Math.max(14, penSize * 1.6);

      const hitIds = new Set<string>();
      const candidates = [...permanentStrokes, ...tempStrokes];
      for (const s of candidates) {
        if (s.slideIndex !== slideIndex || !isScopeVisible(s.scopeKey, slideIndex, visibleScopeSet)) {
          continue;
        }
        const origin = getScopeOrigin(s.scopeKey);
        const globalPts = toSlideGlobalPoints(s.points, origin.x, origin.y);
        if (doesEraserHitStroke(logicalPt, radius, globalPts, s.size)) {
          hitIds.add(s.id);
        }
      }
      if (hitIds.size > 0) {
        onDeleteStrokes(hitIds);
      }
    },
    [
      slideRect,
      penSize,
      permanentStrokes,
      tempStrokes,
      slideIndex,
      visibleScopeSet,
      getScopeOrigin,
      onDeleteStrokes,
    ],
  );

  // Pen & Eraser Pointer handlers on the full-viewport SVG overlay
  const handleCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isRemoteProjector || isPinchingOrPanning || (tool !== 'pen' && tool !== 'eraser')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    onDrawingStart?.();

    if (tool === 'eraser') {
      isErasingRef.current = true;
      runEraserAt(e.clientX, e.clientY);
      return;
    }

    const logicalPt = clientToLogicalPoint(e.clientX, e.clientY, slideRect);
    const resolved = resolveScopeForPoint(logicalPt.x, logicalPt.y, scopeRects, slideIndex);
    const now = Date.now();
    const localPts = toScopeLocalPoints([logicalPt], resolved.originX, resolved.originY);

    const newStroke: PenStroke = {
      id: `stk-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      slideIndex,
      scopeKey: resolved.scopeKey,
      points: localPts,
      color: penColor,
      size: penSize,
      mode: penMode,
      ...(penMode === 'temporary'
        ? { ttlSeconds: tempDuration, expiresAt: now + tempDuration * 1000 }
        : {}),
      createdAt: now,
      authorId: currentAuthorId,
    };

    activeDraftRef.current = {
      stroke: newStroke,
      originX: resolved.originX,
      originY: resolved.originY,
      globalPoints: [logicalPt],
    };
    setDraftStroke(newStroke);
    lastLiveEmitRef.current = now;
    onLiveStroke(newStroke);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (tool === 'eraser') {
      setEraserPos({ x: e.clientX, y: e.clientY });
      if (isErasingRef.current && activePointerIdRef.current === e.pointerId) {
        runEraserAt(e.clientX, e.clientY);
      }
      return;
    }

    if (tool !== 'pen' || !activeDraftRef.current || activePointerIdRef.current !== e.pointerId) {
      return;
    }

    const logicalPt = clientToLogicalPoint(e.clientX, e.clientY, slideRect);
    const draft = activeDraftRef.current;
    const prevPt = draft.globalPoints[draft.globalPoints.length - 1];
    if (prevPt && Math.hypot(logicalPt.x - prevPt.x, logicalPt.y - prevPt.y) < 1.2) {
      return;
    }

    draft.globalPoints.push(logicalPt);
    const updatedStroke: PenStroke = {
      ...draft.stroke,
      points: toScopeLocalPoints(draft.globalPoints, draft.originX, draft.originY),
    };
    draft.stroke = updatedStroke;
    setDraftStroke(updatedStroke);

    const now = Date.now();
    if (now - lastLiveEmitRef.current >= 100) {
      lastLiveEmitRef.current = now;
      onLiveStroke({
        ...updatedStroke,
        points: simplifyStrokePoints(updatedStroke.points, 2.2),
      });
    }
  };

  const finishCanvasPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    activePointerIdRef.current = null;

    if (tool === 'eraser') {
      isErasingRef.current = false;
      return;
    }

    if (tool === 'pen' && activeDraftRef.current) {
      const draft = activeDraftRef.current;
      const now = Date.now();
      const simplifiedGlobal = simplifyStrokePoints(draft.globalPoints, 1.8);
      const finalStroke: PenStroke = {
        ...draft.stroke,
        points: toScopeLocalPoints(simplifiedGlobal, draft.originX, draft.originY),
        createdAt: now,
        ...(draft.stroke.mode === 'temporary' && draft.stroke.ttlSeconds
          ? { expiresAt: now + draft.stroke.ttlSeconds * 1000 }
          : {}),
      };
      activeDraftRef.current = null;
      setDraftStroke(null);
      onCommitStroke(finalStroke);
    }
  };

  // Global drag/resize listeners for images
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const act = imageActionRef.current;
      if (!act) return;

      const scaleX = LOGICAL_WIDTH / (slideRect.width || LOGICAL_WIDTH);
      const scaleY = LOGICAL_HEIGHT / (slideRect.height || LOGICAL_HEIGHT);
      const dxLogical = (e.clientX - act.startClientX) * scaleX;
      const dyLogical = (e.clientY - act.startClientY) * scaleY;

      if (act.type === 'drag') {
        const nextGlobalX = act.startGlobalX + dxLogical;
        const nextGlobalY = act.startGlobalY + dyLogical;
        const patch = {
          x: nextGlobalX - act.originX,
          y: nextGlobalY - act.originY,
        };
        act.latestPatch = patch;
        onUpdateImage(act.imageId, patch, false);
      } else if (act.type === 'resize' && act.corner) {
        const aspect = act.startW / Math.max(1, act.startH);
        let newW = act.startW;
        let newH = act.startH;
        let newGlobalX = act.startGlobalX;
        let newGlobalY = act.startGlobalY;

        if (act.corner === 'se') {
          newW = Math.max(48, act.startW + dxLogical);
          newH = e.shiftKey ? Math.max(36, act.startH + dyLogical) : newW / aspect;
        } else if (act.corner === 'sw') {
          newW = Math.max(48, act.startW - dxLogical);
          newH = e.shiftKey ? Math.max(36, act.startH + dyLogical) : newW / aspect;
          newGlobalX = act.startGlobalX + (act.startW - newW);
        } else if (act.corner === 'ne') {
          newW = Math.max(48, act.startW + dxLogical);
          newH = e.shiftKey ? Math.max(36, act.startH - dyLogical) : newW / aspect;
          newGlobalY = act.startGlobalY + (act.startH - newH);
        } else if (act.corner === 'nw') {
          newW = Math.max(48, act.startW - dxLogical);
          newH = e.shiftKey ? Math.max(36, act.startH - dyLogical) : newW / aspect;
          newGlobalX = act.startGlobalX + (act.startW - newW);
          newGlobalY = act.startGlobalY + (act.startH - newH);
        }

        const patch = {
          x: newGlobalX - act.originX,
          y: newGlobalY - act.originY,
          width: Math.min(1400, newW),
          height: Math.min(1000, newH),
        };
        act.latestPatch = patch;
        onUpdateImage(act.imageId, patch, false);
      }
    };

    const onPointerUp = () => {
      const act = imageActionRef.current;
      if (!act) return;
      imageActionRef.current = null;

      const currentImg = slideImages.find((img) => img.id === act.imageId);
      if (!currentImg) return;

      const curOrigin = getScopeOrigin(currentImg.scopeKey);
      const patch = act.latestPatch ?? {};
      const finalX = patch.x ?? currentImg.x;
      const finalY = patch.y ?? currentImg.y;
      const finalW = patch.width ?? currentImg.width;
      const finalH = patch.height ?? currentImg.height;

      const globalBox: LogicalRect = {
        left: curOrigin.x + finalX,
        top: curOrigin.y + finalY,
        width: finalW,
        height: finalH,
      };

      if (pinnedToSlideIds.has(act.imageId)) {
        onUpdateImage(
          act.imageId,
          {
            scopeKey: getRootSlideScope(slideIndex),
            x: globalBox.left,
            y: globalBox.top,
            width: finalW,
            height: finalH,
          },
          true,
        );
      } else {
        const resolved = resolveScopeForImageBox(globalBox, scopeRects, slideIndex, 22);
        onUpdateImage(
          act.imageId,
          {
            scopeKey: resolved.scopeKey,
            x: globalBox.left - resolved.originX,
            y: globalBox.top - resolved.originY,
            width: finalW,
            height: finalH,
          },
          true,
        );
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [slideRect, slideImages, getScopeOrigin, pinnedToSlideIds, scopeRects, slideIndex, onUpdateImage]);

  // Click outside images deselects them
  useEffect(() => {
    if (!selectedImageId) return;
    const onDocDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-slide-image-root]')) return;
      setSelectedImageId(null);
      setUnlockedDragId(null);
    };
    window.addEventListener('pointerdown', onDocDown);
    return () => window.removeEventListener('pointerdown', onDocDown);
  }, [selectedImageId]);

  const startImageDrag = (img: SlideImageItem, clientX: number, clientY: number) => {
    const origin = getScopeOrigin(img.scopeKey);
    imageActionRef.current = {
      type: 'drag',
      imageId: img.id,
      startClientX: clientX,
      startClientY: clientY,
      startGlobalX: origin.x + img.x,
      startGlobalY: origin.y + img.y,
      startW: img.width,
      startH: img.height,
      originX: origin.x,
      originY: origin.y,
    };
  };

  const startImageResize = (
    e: React.PointerEvent,
    img: SlideImageItem,
    corner: ResizeCorner,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const origin = getScopeOrigin(img.scopeKey);
    imageActionRef.current = {
      type: 'resize',
      imageId: img.id,
      corner,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startGlobalX: origin.x + img.x,
      startGlobalY: origin.y + img.y,
      startW: img.width,
      startH: img.height,
      originX: origin.x,
      originY: origin.y,
    };
  };

  const toggleImagePin = (img: SlideImageItem) => {
    const origin = getScopeOrigin(img.scopeKey);
    const globalBox: LogicalRect = {
      left: origin.x + img.x,
      top: origin.y + img.y,
      width: img.width,
      height: img.height,
    };

    const nextPinned = new Set(pinnedToSlideIds);
    if (nextPinned.has(img.id) || img.scopeKey !== getRootSlideScope(slideIndex)) {
      // Pin to permanent slide
      nextPinned.add(img.id);
      setPinnedToSlideIds(nextPinned);
      onUpdateImage(
        img.id,
        {
          scopeKey: getRootSlideScope(slideIndex),
          x: globalBox.left,
          y: globalBox.top,
        },
        true,
      );
    } else {
      // Auto-attach to nearest sub-element
      nextPinned.delete(img.id);
      setPinnedToSlideIds(nextPinned);
      const resolved = resolveScopeForImageBox(globalBox, scopeRects, slideIndex, 22);
      onUpdateImage(
        img.id,
        {
          scopeKey: resolved.scopeKey,
          x: globalBox.left - resolved.originX,
          y: globalBox.top - resolved.originY,
        },
        true,
      );
    }
  };

  const isDrawingTool = !isRemoteProjector && (tool === 'pen' || tool === 'eraser');

  return (
    <>
      {/* Scoped Images Layer (rendered in viewport coordinates aligned with their scope/slide) */}
      <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
        {visibleImages.map((img) => {
          const origin = getScopeOrigin(img.scopeKey);
          const topLeft = logicalToClientPoint(origin.x + img.x, origin.y + img.y, slideRect);
          const botRight = logicalToClientPoint(
            origin.x + img.x + img.width,
            origin.y + img.y + img.height,
            slideRect,
          );
          const screenW = Math.max(24, botRight.x - topLeft.x);
          const screenH = Math.max(24, botRight.y - topLeft.y);
          const isSelected = !isRemoteProjector && selectedImageId === img.id;
          const isUnlocked = !isRemoteProjector && unlockedDragId === img.id;
          const isSubScoped = img.scopeKey !== getRootSlideScope(slideIndex);

          return (
            <div
              key={img.id}
              data-testid="slide-image-item"
              data-image-scope={img.scopeKey}
              data-image-unlocked={isUnlocked ? 'true' : 'false'}
              data-slide-image-root="true"
              onPointerDown={(e) => {
                if (isRemoteProjector || isDrawingTool) return;
                e.stopPropagation();
                setSelectedImageId(img.id);
                const now = Date.now();
                const prevTap = lastImagePointerRef.current;
                const isDoubleTapHold =
                  prevTap !== null && prevTap.id === img.id && now - prevTap.time <= 380;
                lastImagePointerRef.current = { id: img.id, time: now };

                if (isUnlocked || isDoubleTapHold) {
                  e.preventDefault();
                  if (!isUnlocked) setUnlockedDragId(img.id);
                  startImageDrag(img, e.clientX, e.clientY);
                }
              }}
              onDoubleClick={(e) => {
                if (isRemoteProjector || isDrawingTool) return;
                e.stopPropagation();
                e.preventDefault();
                setSelectedImageId(img.id);
                setUnlockedDragId(img.id);
              }}
              style={{
                left: `${topLeft.x}px`,
                top: `${topLeft.y}px`,
                width: `${screenW}px`,
                height: `${screenH}px`,
                pointerEvents: isRemoteProjector || isDrawingTool ? 'none' : 'auto',
                cursor: isUnlocked ? 'grab' : isSelected ? 'pointer' : 'default',
              }}
              className={`absolute select-none rounded-lg transition-shadow ${
                isUnlocked
                  ? 'ring-2 ring-emerald-500 shadow-lg'
                  : isSelected
                  ? 'ring-2 ring-blue-600 shadow-md'
                  : ''
              }`}
            >
              <img
                src={img.dataUrl}
                alt={t('image.alt')}
                draggable={false}
                className="w-full h-full object-contain rounded-lg pointer-events-none"
              />

              {isSelected && (
                <>
                  {/* Floating image control bar */}
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute -top-9 left-0 flex items-center gap-1 bg-stone-900/95 text-white rounded-lg px-2 py-1 text-[11px] font-semibold shadow-md whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setUnlockedDragId((cur) => (cur === img.id ? null : img.id))
                      }
                      title={isUnlocked ? t('image.dragEnabled') : t('image.dragEnable')}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer ${
                        isUnlocked ? 'bg-emerald-600 text-white' : 'hover:bg-stone-700'
                      }`}
                    >
                      {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <Move className="w-3 h-3" />
                      <span>{isUnlocked ? t('image.dragEnabled') : t('image.dragEnable')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleImagePin(img)}
                      title={
                        isSubScoped
                          ? t('image.followTab')
                          : t('image.pinToSlide')
                      }
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer ${
                        isSubScoped ? 'bg-amber-600/90 text-white' : 'bg-stone-700 text-stone-100'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      <span>{isSubScoped ? t('image.tab') : t('image.slide')}</span>
                    </button>

                    <button
                      type="button"
                      aria-label={t('image.delete')}
                      onClick={() => {
                        onDeleteImage(img.id);
                        setSelectedImageId(null);
                        setUnlockedDragId(null);
                      }}
                      className="p-0.5 rounded hover:bg-red-600 text-red-300 hover:text-white cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 4 Corner Resize Handles */}
                  {(
                    [
                      { corner: 'nw', cls: '-top-1.5 -left-1.5 cursor-nwse-resize' },
                      { corner: 'ne', cls: '-top-1.5 -right-1.5 cursor-nesw-resize' },
                      { corner: 'sw', cls: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
                      { corner: 'se', cls: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
                    ] as const
                  ).map(({ corner, cls }) => (
                    <div
                      key={corner}
                      data-testid={`resize-handle-${corner}`}
                      role="button"
                      tabIndex={0}
                      aria-label={t('image.resize', { corner })}
                      onPointerDown={(e) => startImageResize(e, img, corner)}
                      className={`absolute w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-sm shadow ${cls}`}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Full-Viewport Ink & Eraser SVG Overlay (draws on ANY pixel of the presentation) */}
      <svg
        data-testid="pen-overlay"
        data-active-tool={tool}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={finishCanvasPointer}
        onPointerCancel={finishCanvasPointer}
        onPointerLeave={() => setEraserPos(null)}
        style={{
          pointerEvents: isDrawingTool ? 'auto' : 'none',
          touchAction: isDrawingTool ? 'none' : 'auto',
          cursor: tool === 'pen' ? 'crosshair' : tool === 'eraser' ? 'none' : 'default',
        }}
        className="fixed inset-0 w-screen h-screen z-30 overflow-visible"
      >
        {renderableStrokes.map(({ stroke, pathD, opacity, screenWidth }) => (
          <path
            key={stroke.id}
            data-testid="pen-stroke"
            data-stroke-scope={stroke.scopeKey}
            data-stroke-mode={stroke.mode}
            d={pathD}
            fill="none"
            stroke={stroke.color}
            strokeWidth={screenWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        ))}

        {/* Eraser visual cursor ring */}
        {tool === 'eraser' && eraserPos && !isRemoteProjector && (
          <circle
            cx={eraserPos.x}
            cy={eraserPos.y}
            r={Math.max(12, penSize * 1.4)}
            fill="rgba(255,255,255,0.4)"
            stroke="#1c1917"
            strokeWidth={1.8}
            strokeDasharray="3 3"
          />
        )}
      </svg>
    </>
  );
};
