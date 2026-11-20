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
  PenMode,
  PenStroke,
  SlideImageItem,
  TempDurationSeconds,
} from '../utils/annotationEngine';
import { compressImageBlob, loadImageFromUrl } from '../utils/imageCompression';
import { SlideStageContent } from './SlideStageContent';
import { SlideAnnotationLayer } from './SlideAnnotationLayer';
import { InvisibleTextEditor } from './InvisibleTextEditor';
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
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [tool, setTool] = useState<AnnotationTool>('pointer');
  const [penMode, setPenMode] = useState<PenMode>('permanent');
  const [tempDuration, setTempDuration] = useState<TempDurationSeconds>(3);
  const [penColor, setPenColor] = useState('#1E3A8A');
  const [penSize, setPenSize] = useState(4);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [closePopoverSignal, setClosePopoverSignal] = useState(0);

  const slideContainerRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

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

  // Ctrl + Scroll wheel zoom support
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

  const interactionsKey = useMemo(() => JSON.stringify(interactions), [interactions]);
  const progressPct = ((slideIndex + 1) / SLIDES_META.length) * 100;

  return (
    <main className="relative w-screen h-screen overflow-hidden no-scrollbar">
      <SlideStageContent
        slideIndex={slideIndex}
        interactions={interactions}
        onPatch={onPatch}
        projectorDark={projectorDark}
        zoomScale={zoomScale}
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

      {/* Synchronized virtual laser pointer, if a connected controller supplies one. */}
      {laser.active && !blackout && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-600/85 ring-4 ring-red-500/30 shadow-md transition-all duration-75"
          style={{ left: `${laser.x}%`, top: `${laser.y}%` }}
        />
      )}

      {/* Blackout Curtain (Keyboard 'B' or Presenter toggle) */}
      {blackout && (
        <div
          aria-label="Skrin digelapkan sementara"
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        />
      )}

      {/* Subtle status toast when pasting/adding image */}
      {toastMsg && !isRemoteProjector && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-stone-900/90 text-white px-3.5 py-2 text-xs font-semibold shadow-lg pointer-events-none">
          {toastMsg}
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
