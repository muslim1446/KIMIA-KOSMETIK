import { useEffect, useRef } from 'react';
import { AudienceStage } from './components/AudienceStage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useCollaborativeBoard } from './hooks/useCollaborativeBoard';
import { SyncedPresentationState, usePresentationSync } from './hooks/usePresentationSync';
import { useUiLanguage } from './utils/uiLanguage';

export default function App() {
  const pushRemoteRef = useRef<((next: SyncedPresentationState) => void) | null>(null);

  const {
    mode,
    state,
    goToSlide,
    nextSlide,
    prevSlide,
    toggleBlackout,
    toggleProjectorDark,
    setLaserPoint,
    patchInteractions,
    applyRemoteState,
  } = usePresentationSync((next) => {
    pushRemoteRef.current?.(next);
  });

  const board = useCollaborativeBoard({
    currentSlideIndex: state.slideIndex,
    presentationState: state,
    onRemotePresentationSync: applyRemoteState,
  });

  useEffect(() => {
    pushRemoteRef.current = (next) => {
      void board.pushPresentationStateToFirebase(next);
    };
  }, [board]);

  const uiLanguage = useUiLanguage();

  useEffect(() => {
    document.documentElement.lang = uiLanguage === 'zh' ? 'zh-Hans' : 'ms';
    document.title =
      uiLanguage === 'zh'
        ? '5.4 药物与化妆品 — 中五化学演示'
        : '5.4 Ubat-ubatan dan Bahan Kosmetik — Pembentangan Kimia KSSM';
  }, [uiLanguage]);

  // Global keyboard shortcuts for crisp presentation control
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleBlackout();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        goToSlide(idx);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToSlide, nextSlide, prevSlide, toggleBlackout]);

  return (
    <ErrorBoundary>
      <AudienceStage
        isRemoteProjector={mode === 'audiens'}
        slideIndex={state.slideIndex}
        blackout={state.blackout}
        projectorDark={state.projectorDark}
        laser={state.laser}
        interactions={state.interactions}
        onPatch={patchInteractions}
        onNext={nextSlide}
        onPrev={prevSlide}
        onToggleDark={toggleProjectorDark}
        user={board.user}
        anonBlocked={board.anonBlocked}
        roomId={board.roomId}
        joinCode={board.joinCode}
        syncStatus={board.syncStatus}
        syncError={board.syncError}
        syncWarning={board.syncWarning}
        currentAuthorId={board.currentAuthorId}
        permanentStrokes={board.activePermanentStrokes}
        tempStrokes={board.activeTempStrokes}
        liveStrokes={board.activeLiveStrokes}
        textEdits={board.activeTextEdits}
        slideImages={board.activeSlideImages}
        slideTexts={board.activeSlideTexts}
        slidePdfs={board.activeSlidePdfs}
        roomPdfLibrary={board.roomPdfLibrary}
        onJoinRoom={board.joinRoom}
        onLiveStroke={(stroke) => board.updateLiveStroke(state.slideIndex, stroke)}
        onCommitStroke={board.commitStroke}
        onDeleteStrokes={(ids) => board.deleteStrokesById(state.slideIndex, ids)}
        onClearSlideRootStrokes={() => board.clearSlideStrokes(state.slideIndex)}
        onAddImage={board.addImage}
        onUpdateImage={board.updateImage}
        onDeleteImage={board.deleteImage}
        onAddSlideText={board.addSlideText}
        onUpdateSlideText={board.updateSlideText}
        onDeleteSlideText={board.deleteSlideText}
        onAddSlidePdf={board.addSlidePdf}
        onUpdateSlidePdf={board.updateSlidePdf}
        onDeleteSlidePdf={board.deleteSlidePdf}
        presenceUsers={board.presenceUsers}
        presenceLocation={board.presenceLocation}
        presenceLocationBusy={board.presenceLocationBusy}
        presenceLocationError={board.presenceLocationError}
        presenceDisplayName={board.presenceDisplayName}
        onUpdatePresenceDisplayName={board.updatePresenceDisplayName}
        onRefreshPresenceLocation={board.refreshPresenceLocation}
        onSaveTextEdit={board.setTextEdit}
        onLaserBroadcast={(nextLaser) => {
          setLaserPoint(nextLaser, true);
          board.broadcastLaserToFirebase(nextLaser);
        }}
      />
    </ErrorBoundary>
  );
}
