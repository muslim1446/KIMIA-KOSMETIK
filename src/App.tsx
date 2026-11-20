import { useEffect } from 'react';
import { AudienceStage } from './components/AudienceStage';
import { PresenterConsole } from './components/PresenterConsole';
import { usePresentationSync } from './hooks/usePresentationSync';

export default function App() {
  const {
    mode,
    setMode,
    state,
    connectedPeers,
    displayInfo,
    probeExternalDisplays,
    goToSlide,
    nextSlide,
    prevSlide,
    toggleBlackout,
    toggleProjectorDark,
    setLaserPoint,
    patchInteractions,
    resetPresentation,
  } = usePresentationSync();

  // Global keyboard shortcuts for crisp presentation control
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
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
      } else if ((e.key === 'p' || e.key === 'P') && mode !== 'audiens') {
        e.preventDefault();
        setMode((prev) => (prev === 'pembentang' ? 'stage' : 'pembentang'));
      } else if ((e.key === 'f' || e.key === 'F') && mode !== 'pembentang') {
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
  }, [goToSlide, mode, nextSlide, prevSlide, setMode, toggleBlackout]);

  if (mode === 'pembentang') {
    return (
      <PresenterConsole
        slideIndex={state.slideIndex}
        blackout={state.blackout}
        projectorDark={state.projectorDark}
        laser={state.laser}
        interactions={state.interactions}
        connectedPeers={connectedPeers}
        displayInfo={displayInfo}
        onProbeDisplays={probeExternalDisplays}
        onGoToSlide={goToSlide}
        onNext={nextSlide}
        onPrev={prevSlide}
        onToggleBlackout={toggleBlackout}
        onToggleProjectorDark={toggleProjectorDark}
        onSetLaser={setLaserPoint}
        onPatchInteractions={patchInteractions}
        onResetAll={resetPresentation}
        onExitPresenterMode={() => setMode('stage')}
      />
    );
  }

  return (
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
      onOpenPresenterMode={() => setMode('pembentang')}
    />
  );
}
