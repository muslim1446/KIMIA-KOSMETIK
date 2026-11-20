import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { SLIDES_META } from '../data/slidesData';
import { LaserPoint, SharedSlideInteractions } from '../hooks/usePresentationSync';
import { BoardSyncStatus, LiveStrokeMap } from '../hooks/useCollaborativeBoard';
import {
  AnnotationTool,
  getRootSlideScope,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  LogicalRect,
  PenMode,
  PenStroke,
  SlideImageItem,
  TempDurationSeconds,
} from '../utils/annotationEngine';
import {
  laserClientToSlidePercent,
  laserSlidePercentToClient,
} from '../utils/presentationContext';
import { compressImageBlob, loadImageFromUrl } from '../utils/imageCompression';
import { SlideStageContent } from './SlideStageContent';
import { SlideAnnotationLayer } from './SlideAnnotationLayer';
import { InvisibleTextEditor } from './InvisibleTextEditor';
import { GeminiAssistantFrame } from './GeminiAssistantFrame';
import { PresentationIsland } from './PresentationIsland';

interface AudienceStageProps {
  /** True when opened via ?mode=audiens (dedicated projector window with zero controls) */
  isRemoteProjector: boolean;
  slideIndex: number;
  blackout: boolean;
  projectorDark: boolean;
  laser: LaserPoint;
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleDark: () => void;
  // Collaborative Board props
  user: User | null;
  anonBlocked?: boolean;
  roomId: string;
  joinCode: string;
  syncStatus: BoardSyncStatus;
  syncError: string | null;
  currentAuthorId: string;
  permanentStrokes: PenStroke[];
  tempStrokes: PenStroke[];
  liveStrokes: LiveStrokeMap;
  textEdits: Record<string, string>;
  slideImages: SlideImageItem[];
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onJoinRoom: (roomId: string, joinCode: string) => void;
  onLiveStroke: (stroke: PenStroke | null) => void;
  onCommitStroke: (stroke: PenStroke) => void;
  onDeleteStrokes: (ids: Set<string>) => void;
  onClearSlideRootStrokes: () => void;
  onAddImage: (input: {
    slideIndex: number;
    scopeKey: string;
    x: number;
    y: number;
    width: number;
    height: number;
    dataUrl: string;
  }) => Promise<SlideImageItem | undefined>;
  onUpdateImage: (
    imageId: string,
    patch: Partial<Pick<SlideImageItem, 'scopeKey' | 'x' | 'y' | 'width' | 'height'>>,
    commit?: boolean,
  ) => void;
  onDeleteImage: (imageId: string) => void;
  onSaveTextEdit: (slideIndex: number, textKey: string, value: string | null) => void;
  onLaserBroadcast: (laser: LaserPoint) => void;
}

export const AudienceStage: React.FC<AudienceStageProps> = ({
  isRemoteProjector,
  slideIndex,
  blackout,
  projectorDark,
  laser,
  interactions,
  onPatch,
  onNext,
  onPrev,
  onToggleDark,
  user,
  anonBlocked = false,
  roomId,
  joinCode,
  syncStatus,
  syncError,
  currentAuthorId,
  permanentStrokes,
  tempStrokes,
  liveStrokes,
  textEdits,
  slideImages,
  onSignInGoogle,
  onSignOut,
  onJoinRoom,
  onLiveStroke,
  onCommitStroke,
  onDeleteStrokes,
  onClearSlideRootStrokes,
  onAddImage,
  onUpdateImage,
  onDeleteImage,
  onSaveTextEdit,
  onLaserBroadcast,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  // Free-pan offset (in CSS pixels) so users can scroll the zoomed canvas freely
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tool, setTool] = useState<AnnotationTool>('pointer');
  const [penMode, setPenMode] = useState<PenMode>('permanent');
  const [tempDuration, setTempDuration] = useState<TempDurationSeconds>(3);
  const [penColor, setPenColor] = useState('#1E3A8A');
  const [penSize, setPenSize] = useState(4);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [closePopoverSignal, setClosePopoverSignal] = useState(0);
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [laserKeyHeld, setLaserKeyHeld] = useState(false);
  const [stageSlideRect, setStageSlideRect] = useState<LogicalRect>({
    left: 0,
    top: 0,
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
  });
  const [laserTrail, setLaserTrail] = useState<Array<{ x: number; y: number; t: number }>>([]);
  const [laserExpired, setLaserExpired] = useState(false);

  const slideContainerRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 640, y: 360 });
  const laserKeyHeldRef = useRef(false);
  const laserTouchDraggingRef = useRef(false);
  const onLaserBroadcastRef = useRef(onLaserBroadcast);
  onLaserBroadcastRef.current = onLaserBroadcast;

  // Reset pan when zoom goes back to 1× (no need to stay offset)
  useEffect(() => {
    if (zoomScale <= 1) setPanOffset({ x: 0, y: 0 });
  }, [zoomScale]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 3000);
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen denial in restricted iframes
    }
  };

  const addCompressedImageToSlide = useCallback(
    async (blob: Blob) => {
      try {
        const compressed = await compressImageBlob(blob, 380);
        const offset = (slideImages.length % 5) * 24;
        const x = Math.round((LOGICAL_WIDTH - compressed.width) / 2) + offset;
        const y = Math.round((LOGICAL_HEIGHT - compressed.height) / 2) + offset;

        await onAddImage({
          slideIndex,
          scopeKey: getRootSlideScope(slideIndex),
          x,
          y,
          width: compressed.width,
          height: compressed.height,
          dataUrl: compressed.dataUrl,
        });
        showToast('Gambar ditambah! Klik 2x gambar untuk seret, tarik sudut untuk ubah saiz.');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Gagal memuat naik gambar.');
      }
    },
    [onAddImage, showToast, slideImages.length, slideIndex],
  );

  // Global Ctrl+V / Cmd+V Paste Image handler
  useEffect(() => {
    if (isRemoteProjector) return;
    const onPaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            await addCompressedImageToSlide(blob);
            return;
          }
        }
      }

      const textData = e.clipboardData?.getData('text/plain')?.trim();
      if (
        textData &&
        (textData.startsWith('data:image/') ||
          /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(textData))
      ) {
        e.preventDefault();
        try {
          const loaded = await loadImageFromUrl(textData);
          const offset = (slideImages.length % 5) * 24;
          await onAddImage({
            slideIndex,
            scopeKey: getRootSlideScope(slideIndex),
            x: Math.round((LOGICAL_WIDTH - loaded.width) / 2) + offset,
            y: Math.round((LOGICAL_HEIGHT - loaded.height) / 2) + offset,
            width: loaded.width,
            height: loaded.height,
            dataUrl: loaded.dataUrl,
          });
          showToast('Gambar dari pautan ditampal! Klik 2x untuk seret.');
        } catch {
          showToast('Tidak dapat memuatkan gambar dari pautan tersebut.');
        }
      }
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addCompressedImageToSlide, isRemoteProjector, onAddImage, showToast, slideImages.length, slideIndex]);

  // ── Universal two-finger pinch-zoom + free pan (works in ALL tool modes) ──
  // Runs at the document level so it fires even when pen/eraser/image tools
  // are active.  Only intercepts genuine two-finger gestures so single-finger
  // drawing is never disrupted.
  useEffect(() => {
    if (isRemoteProjector) return;

    const activeTouches = new Map<number, { x: number; y: number }>();
    let lastPinchDist = 0;
    let lastPinchMidX = 0;
    let lastPinchMidY = 0;

    const getDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(b.x - a.x, b.y - a.y);

    const onTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
      if (activeTouches.size === 2) {
        const [a, b] = Array.from(activeTouches.values());
        lastPinchDist = getDistance(a, b);
        lastPinchMidX = (a.x + b.x) / 2;
        lastPinchMidY = (a.y + b.y) / 2;
        // Suppress native browser zoom on iOS Safari while we handle it
        e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (activeTouches.has(t.identifier)) {
          activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
        }
      }

      if (activeTouches.size === 2) {
        e.preventDefault(); // block native pinch-zoom so we control it
        const [a, b] = Array.from(activeTouches.values());
        const dist = getDistance(a, b);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;

        if (lastPinchDist > 0) {
          // Zoom around the pinch midpoint
          const scaleDelta = dist / lastPinchDist;
          setZoomScale((prev) => {
            const next = Math.max(0.6, Math.min(2.4, prev * scaleDelta));
            return Math.round(next * 100) / 100;
          });

          // Pan: follow the midpoint drift so the pinch centre stays put
          const dx = midX - lastPinchMidX;
          const dy = midY - lastPinchMidY;
          if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
            setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
          }
        }

        lastPinchDist = dist;
        lastPinchMidX = midX;
        lastPinchMidY = midY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        activeTouches.delete(e.changedTouches[i].identifier);
      }
      if (activeTouches.size < 2) {
        lastPinchDist = 0;
      }
    };

    // passive: false so we can call preventDefault()
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isRemoteProjector]);

  // Ctrl + Scroll wheel zoom support (desktop)
  useEffect(() => {
    if (isRemoteProjector) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoomScale((prev) => Math.max(0.6, Math.min(2.4, Math.round((prev + delta) * 100) / 100)));
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [isRemoteProjector]);

  // Measure slide bounding rect for accurate cross-screen laser coordinates
  useEffect(() => {
    const updateRect = () => {
      const el = slideContainerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setStageSlideRect({ left: r.left, top: r.top, width: r.width, height: r.height });
      }
    };
    updateRect();
    const el = slideContainerRef.current;
    let ro: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateRect);
      ro.observe(el);
    }
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [slideIndex, zoomScale]);

  // Real-time Collaborative Laser Pointer: hold 'L' key + move mouse/touch OR use Laser tool
  const emitLaserAtClientPos = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      const el = slideContainerRef.current;
      const r = el?.getBoundingClientRect();
      const rect: LogicalRect =
        r && r.width > 0 && r.height > 0
          ? { left: r.left, top: r.top, width: r.width, height: r.height }
          : stageSlideRect;
      const pct = laserClientToSlidePercent(clientX, clientY, rect);
      onLaserBroadcastRef.current({ active, x: pct.x, y: pct.y, updatedAt: Date.now() });
    },
    [stageSlideRect],
  );

  useEffect(() => {
    if (isRemoteProjector) return;

    const isEditableTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return Boolean(
        el &&
          (el.tagName === 'INPUT' ||
            el.tagName === 'TEXTAREA' ||
            el.tagName === 'SELECT' ||
            el.isContentEditable),
      );
    };

    const onPointerMoveWindow = (e: PointerEvent) => {
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      if (laserKeyHeldRef.current) {
        emitLaserAtClientPos(e.clientX, e.clientY, true);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!laserKeyHeldRef.current) {
          laserKeyHeldRef.current = true;
          setLaserKeyHeld(true);
          emitLaserAtClientPos(lastPointerPosRef.current.x, lastPointerPosRef.current.y, true);
        }
      } else if (e.key === 'Escape' && tool === 'laser') {
        setTool('pointer');
        onLaserBroadcastRef.current({ active: false, x: 50, y: 50, updatedAt: Date.now() });
      }
    };

    const stopLaserHold = () => {
      if (laserKeyHeldRef.current) {
        laserKeyHeldRef.current = false;
        setLaserKeyHeld(false);
        onLaserBroadcastRef.current({
          active: false,
          x: 50,
          y: 50,
          updatedAt: Date.now(),
        });
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        stopLaserHold();
      }
    };

    window.addEventListener('pointermove', onPointerMoveWindow);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', stopLaserHold);
    return () => {
      window.removeEventListener('pointermove', onPointerMoveWindow);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', stopLaserHold);
    };
  }, [emitLaserAtClientPos, isRemoteProjector, tool]);

  // Turn off laser if user switches away from laser tool
  useEffect(() => {
    if (tool !== 'laser' && !laserKeyHeldRef.current && laser.active) {
      // Only clear if we were the ones driving laser tool locally
      if (laserTouchDraggingRef.current) {
        laserTouchDraggingRef.current = false;
        onLaserBroadcastRef.current({ active: false, x: 50, y: 50, updatedAt: Date.now() });
      }
    }
  }, [tool, laser.active]);

  // Transient laser trail + 4s inactivity auto-hide so stale lasers never stick
  useEffect(() => {
    if (!laser.active || blackout) {
      setLaserTrail([]);
      setLaserExpired(false);
      return;
    }
    setLaserExpired(false);
    const clientPt = laserSlidePercentToClient(laser.x, laser.y, stageSlideRect);
    const now = Date.now();
    setLaserTrail((prev) => [...prev.filter((p) => now - p.t < 280), { x: clientPt.x, y: clientPt.y, t: now }].slice(-7));

    const expireTimer = window.setTimeout(() => {
      if (!laserKeyHeldRef.current && !laserTouchDraggingRef.current) {
        setLaserExpired(true);
      }
    }, 4000);
    return () => window.clearTimeout(expireTimer);
  }, [laser.active, laser.x, laser.y, blackout, stageSlideRect]);

  const interactionsKey = useMemo(() => JSON.stringify(interactions), [interactions]);
  const progressPct = ((slideIndex + 1) / SLIDES_META.length) * 100;
  const showLaserOverlay = Boolean(laser.active && !blackout && !laserExpired);
  const laserClientPt = useMemo(
    () => laserSlidePercentToClient(laser.x, laser.y, stageSlideRect),
    [laser.x, laser.y, stageSlideRect],
  );

  return (
    <main className="relative w-screen h-screen overflow-hidden no-scrollbar">
      <SlideStageContent
        slideIndex={slideIndex}
        interactions={interactions}
        onPatch={onPatch}
        projectorDark={projectorDark}
        zoomScale={zoomScale}
        panOffset={panOffset}
        slideContainerRef={slideContainerRef}
      />

      {/* Full-screen Pen, Temporary Fade, Eraser & Scoped Images Layer */}
      {!blackout && (
        <SlideAnnotationLayer
          slideIndex={slideIndex}
          slideContainerRef={slideContainerRef}
          interactionsKey={interactionsKey}
          tool={tool}
          penMode={penMode}
          tempDuration={tempDuration}
          penColor={penColor}
          penSize={penSize}
          currentAuthorId={currentAuthorId}
          permanentStrokes={permanentStrokes}
          tempStrokes={tempStrokes}
          liveStrokes={liveStrokes}
          slideImages={slideImages}
          onLiveStroke={onLiveStroke}
          onCommitStroke={onCommitStroke}
          onDeleteStrokes={onDeleteStrokes}
          onUpdateImage={onUpdateImage}
          onDeleteImage={onDeleteImage}
          onDrawingStart={() => setClosePopoverSignal((n) => n + 1)}
          isRemoteProjector={isRemoteProjector}
        />
      )}

      {/* Invisible Right-Click / Touch Text Editor */}
      {!blackout && (
        <InvisibleTextEditor
          slideIndex={slideIndex}
          slideRootRef={slideContainerRef}
          interactionsKey={interactionsKey}
          tool={tool}
          textEdits={textEdits}
          onSaveTextEdit={onSaveTextEdit}
          isRemoteProjector={isRemoteProjector}
        />
      )}

      {/* Interactive Laser Pointer capture surface when 'laser' Island tool is active */}
      {tool === 'laser' && !isRemoteProjector && !blackout && (
        <div
          data-testid="laser-capture-surface"
          onPointerDown={(e) => {
            e.preventDefault();
            laserTouchDraggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            emitLaserAtClientPos(e.clientX, e.clientY, true);
          }}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse' || laserTouchDraggingRef.current) {
              emitLaserAtClientPos(e.clientX, e.clientY, true);
            }
          }}
          onPointerUp={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
            if (e.pointerType !== 'mouse') {
              laserTouchDraggingRef.current = false;
              onLaserBroadcastRef.current({ active: false, x: 50, y: 50, updatedAt: Date.now() });
            }
          }}
          onPointerLeave={() => {
            if (!laserKeyHeldRef.current) {
              onLaserBroadcastRef.current({ active: false, x: 50, y: 50, updatedAt: Date.now() });
            }
          }}
          className="fixed inset-0 z-30 cursor-crosshair touch-none"
        />
      )}

      {/* Synchronized transient collaborative laser pointer & comet trail across all clients */}
      {showLaserOverlay && (
        <div
          data-testid="collaborative-laser"
          data-laser-active="true"
          data-laser-x={laser.x}
          data-laser-y={laser.y}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
        >
          {laserTrail.length > 1 && (
            <svg className="fixed inset-0 w-screen h-screen overflow-visible">
              {laserTrail.slice(0, -1).map((pt, idx) => {
                const next = laserTrail[idx + 1];
                const alpha = ((idx + 1) / laserTrail.length) * 0.45;
                return (
                  <line
                    key={`${pt.t}-${idx}`}
                    x1={pt.x}
                    y1={pt.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="#EF4444"
                    strokeWidth={3 + idx * 0.6}
                    strokeLinecap="round"
                    opacity={alpha}
                  />
                );
              })}
            </svg>
          )}
          <div
            className="fixed -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-600/90 ring-4 ring-red-500/35 shadow-[0_0_14px_rgba(239,68,68,0.85)] transition-all duration-75"
            style={{ left: `${laserClientPt.x}px`, top: `${laserClientPt.y}px` }}
          >
            <span className="absolute inset-1.5 rounded-full bg-white/90" />
          </div>
        </div>
      )}

      {/* Blackout Curtain (Keyboard 'B' or Presenter toggle) */}
      {blackout && (
        <div
          aria-label="Skrin digelapkan sementara"
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        />
      )}

      {/* Subtle laser hold indicator or paste toast */}
      {(toastMsg || (laserKeyHeld && !isRemoteProjector)) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-stone-900/90 text-white px-3.5 py-2 text-xs font-semibold shadow-lg pointer-events-none">
          {laserKeyHeld ? 'Mod Laser Aktif — Gerakkan tetikus (Lepaskan L untuk berhenti)' : toastMsg}
        </div>
      )}

      {/* Flush hairline progress indicator at very bottom edge */}
      {!blackout && (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-[2px] z-30 bg-stone-200/50 dark:bg-stone-800/50">
          <div
            className="h-full bg-stone-800 dark:bg-stone-300 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Floating Draggable & Resizable Gemini AI Frame (Stage mode only) */}
      {!isRemoteProjector && (
        <GeminiAssistantFrame
          open={geminiOpen}
          onClose={() => setGeminiOpen(false)}
          slideIndex={slideIndex}
          interactions={interactions}
          slideContainerRef={slideContainerRef}
          permanentStrokes={permanentStrokes}
          tempStrokes={tempStrokes}
          textEdits={textEdits}
          slideImages={slideImages}
          onAddImage={onAddImage}
        />
      )}

      {/* Presentation Island: absent in ?mode=audiens dedicated projector window */}
      {!isRemoteProjector && (
        <PresentationIsland
          slideIndex={slideIndex}
          totalSlides={SLIDES_META.length}
          onPrev={onPrev}
          onNext={onNext}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          projectorDark={projectorDark}
          onToggleDark={onToggleDark}
          zoomScale={zoomScale}
          onZoomChange={setZoomScale}
          tool={tool}
          onToolChange={setTool}
          penMode={penMode}
          onPenModeChange={setPenMode}
          tempDuration={tempDuration}
          onTempDurationChange={setTempDuration}
          penColor={penColor}
          onPenColorChange={setPenColor}
          penSize={penSize}
          onPenSizeChange={setPenSize}
          onClearSlideRootStrokes={onClearSlideRootStrokes}
          onPickImageFile={(file) => void addCompressedImageToSlide(file)}
          geminiOpen={geminiOpen}
          onToggleGemini={() => setGeminiOpen((o) => !o)}
          user={user}
          anonBlocked={anonBlocked}
          roomId={roomId}
          joinCode={joinCode}
          syncStatus={syncStatus}
          syncError={syncError}
          onSignInGoogle={() => void onSignInGoogle()}
          onSignOut={() => void onSignOut()}
          onJoinRoom={onJoinRoom}
          closePopoverSignal={closePopoverSignal}
        />
      )}
    </main>
  );
};
