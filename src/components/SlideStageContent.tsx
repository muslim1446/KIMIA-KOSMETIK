import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SharedSlideInteractions } from '../hooks/usePresentationSync';
import { Slide01Cover } from './slides/Slide01Cover';
import { Slide02Traditional } from './slides/Slide02Traditional';
import { Slide03ModernDrugs } from './slides/Slide03ModernDrugs';
import { Slide04KineticsLab } from './slides/Slide04KineticsLab';
import { Slide05AbuseNpra } from './slides/Slide05AbuseNpra';
import { Slide06CosmeticTypes } from './slides/Slide06CosmeticTypes';
import { Slide07EmulsionLab } from './slides/Slide07EmulsionLab';
import { Slide08BannedForensics } from './slides/Slide08BannedForensics';
import { Slide09Quiz } from './slides/Slide09Quiz';

interface SlideStageContentProps {
  slideIndex: number;
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
  projectorDark?: boolean;
  zoomScale?: number;
  slideContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export const LOGICAL_SLIDE_WIDTH = 1280;
export const LOGICAL_SLIDE_HEIGHT = 720;

export const SlideStageContent: React.FC<SlideStageContentProps> = ({
  slideIndex,
  interactions,
  onPatch,
  projectorDark = false,
  zoomScale = 1,
  slideContainerRef,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [stageScale, setStageScale] = useState(1);

  // Dynamically scale the 1280x720 slide canvas to fit ANY projector/TV/laptop screen
  // while preserving a 3% outer overscan safe padding so edges are never clipped.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const computeScale = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const safeFactor = 0.96; // 2% overscan safe margin on every edge
      const sx = (rect.width * safeFactor) / LOGICAL_SLIDE_WIDTH;
      const sy = (rect.height * safeFactor) / LOGICAL_SLIDE_HEIGHT;
      setStageScale(Math.min(sx, sy));
    };

    computeScale();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(computeScale);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, []);

  const renderSlide = () => {
    switch (slideIndex) {
      case 0:
        return <Slide01Cover interactions={interactions} onPatch={onPatch} />;
      case 1:
        return <Slide02Traditional interactions={interactions} onPatch={onPatch} />;
      case 2:
        return <Slide03ModernDrugs interactions={interactions} onPatch={onPatch} />;
      case 3:
        return <Slide04KineticsLab interactions={interactions} onPatch={onPatch} />;
      case 4:
        return <Slide05AbuseNpra interactions={interactions} onPatch={onPatch} />;
      case 5:
        return <Slide06CosmeticTypes interactions={interactions} onPatch={onPatch} />;
      case 6:
        return <Slide07EmulsionLab interactions={interactions} onPatch={onPatch} />;
      case 7:
        return <Slide08BannedForensics interactions={interactions} onPatch={onPatch} />;
      case 8:
        return <Slide09Quiz interactions={interactions} onPatch={onPatch} />;
      default:
        return <Slide01Cover interactions={interactions} onPatch={onPatch} />;
    }
  };

  const effectiveScale = stageScale * zoomScale;

  return (
    <div
      ref={hostRef}
      className={`relative w-full h-full overflow-auto no-scrollbar flex items-center justify-center ${
        projectorDark ? 'dark bg-[#181715] text-stone-100' : 'bg-[#FBF9F5] text-stone-900'
      }`}
    >
      {/* Subtle warm ambient backdrop filling 100% of physical screen */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: projectorDark
            ? 'radial-gradient(circle at 85% 15%, rgba(217, 119, 6, 0.08), transparent 45%), radial-gradient(circle at 12% 88%, rgba(45, 106, 79, 0.12), transparent 50%)'
            : 'radial-gradient(circle at 88% 12%, rgba(245, 158, 11, 0.09), transparent 46%), radial-gradient(circle at 10% 88%, rgba(16, 185, 129, 0.07), transparent 50%)',
        }}
      />

      {/* Scaled 1280x720 Slide Canvas with Safe Overscan Margin + Zoom */}
      <div
        ref={slideContainerRef}
        data-slide-root="true"
        className="relative z-10 shrink-0 overflow-hidden"
        style={{
          width: `${LOGICAL_SLIDE_WIDTH * effectiveScale}px`,
          height: `${LOGICAL_SLIDE_HEIGHT * effectiveScale}px`,
        }}
      >
        <div
          className="absolute top-0 left-0 origin-top-left overflow-hidden"
          style={{
            width: `${LOGICAL_SLIDE_WIDTH}px`,
            height: `${LOGICAL_SLIDE_HEIGHT}px`,
            transform: `scale(${effectiveScale})`,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="projection-slide w-full h-full overflow-hidden"
            >
              {renderSlide()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
