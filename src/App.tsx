import { useEffect } from 'react';
import { AudienceStage } from './components/AudienceStage';
import { usePresentationSync } from './hooks/usePresentationSync';

export default function App() {
  const {
    mode,
    state,
    goToSlide,
    nextSlide,
    prevSlide,
    toggleBlackout,
    toggleProjectorDark,
    patchInteractions,
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
    />
  );
}
