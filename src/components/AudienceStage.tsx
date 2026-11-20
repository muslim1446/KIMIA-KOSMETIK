import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { SLIDES_META } from '../data/slidesData';
import { LaserPoint, SharedSlideInteractions } from '../hooks/usePresentationSync';
import { SlideStageContent } from './SlideStageContent';

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
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // In ?mode=audiens or fullscreen, hide the navigation island so the audience sees only the clean slide.
  const showEdgeDrawer = !isRemoteProjector && !isFullscreen;
  const progressPct = ((slideIndex + 1) / SLIDES_META.length) * 100;

  return (
    <main className="relative w-screen h-screen overflow-hidden no-scrollbar">
      <SlideStageContent
        slideIndex={slideIndex}
        interactions={interactions}
        onPatch={onPatch}
        projectorDark={projectorDark}
      />

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

      {/* Flush hairline progress indicator at very bottom edge */}
      {!blackout && (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-[2px] z-30 bg-stone-200/50 dark:bg-stone-800/50">
          <div
            className="h-full bg-stone-800 dark:bg-stone-300 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Quiet bottom-edge drawer: strictly absent in ?mode=audiens and Fullscreen */}
      {showEdgeDrawer && (
        <div className="group fixed bottom-0 left-0 right-0 h-12 z-30 flex items-end justify-end px-4 pb-2">
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex items-center gap-2 bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1 shadow-sm">
            <button
              type="button"
              onClick={onPrev}
              disabled={slideIndex === 0}
              aria-label="Slaid sebelumnya"
              className="p-1 text-stone-700 dark:text-stone-200 disabled:opacity-30 hover:text-stone-950 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="tabular-nums-clean text-xs text-stone-600 dark:text-stone-300 px-1">
              {slideIndex + 1}/{SLIDES_META.length}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={slideIndex === SLIDES_META.length - 1}
              aria-label="Slaid seterusnya"
              className="p-1 text-stone-700 dark:text-stone-200 disabled:opacity-30 hover:text-stone-950 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Skrin penuh"
              className="flex items-center gap-1 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-stone-950 px-1.5 py-0.5 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>Skrin Penuh (F)</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
