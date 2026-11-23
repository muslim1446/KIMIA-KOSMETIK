import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SharedSlideInteractions } from '../hooks/usePresentationSync';
import { APPLE_SPRINGS } from '../utils/applePhysics';
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
  /** Free-pan offset in CSS pixels applied on top of the centred layout */
  panOffset?: { x: number; y: number };
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
  panOffset = { x: 0, y: 0 },
  slideContainerRef,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const prefersReducedMotion = useReducedMotion();

  // Dynamically scale the 1280x720 slide canvas to fit ANY projector/TV/laptop screen
  // while preserving a 2% outer overscan safe padding so edges are never clipped.
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
      className={`relative w-full h-full overflow-hidden no-scrollbar flex items-center justify-center bg-[var(--slide-canvas-bg)] text-[var(--apple-label)] transition-[background-color,color] duration-200 ${
        projectorDark ? 'dark' : ''
      }`}
    >
      {/* Subtle Display-P3 ambient tonal stage backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: projectorDark
            ? 'radial-gradient(circle at 84% 14%, rgba(10, 132, 255, 0.08), transparent 46%), radial-gradient(circle at 12% 86%, rgba(48, 209, 88, 0.06), transparent 52%)'
            : 'radial-gradient(circle at 86% 12%, rgba(0, 122, 255, 0.055), transparent 48%), radial-gradient(circle at 10% 88%, rgba(52, 199, 89, 0.045), transparent 52%)',
        }}
      />

      {/*
        Scaled 1280×720 Slide Canvas.
        panOffset shifts the canvas so users can freely move around in 360 degrees
        at any zoom level without boundary limits.
        transition is 'none' to guarantee zero-lag, butter-smooth real-time movement.
      */}
      <div
        style={{
          transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
          willChange: 'transform',
          transition: 'none',
        }}
      >
        {/*
          Unconstrained infinite canvas slide container:
          Allows elements to expand, overflow, and break out of the 16:9 boundary
          freely without clipping or truncation.
        */}
        <div
          ref={slideContainerRef}
          data-slide-root="true"
          className="relative z-10 shrink-0 overflow-visible"
          style={{
            width: `${LOGICAL_SLIDE_WIDTH * effectiveScale}px`,
            minHeight: `${LOGICAL_SLIDE_HEIGHT * effectiveScale}px`,
          }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left overflow-visible"
            style={{
              width: `${LOGICAL_SLIDE_WIDTH}px`,
              minHeight: `${LOGICAL_SLIDE_HEIGHT}px`,
              transform: `scale(${effectiveScale})`,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                data-slide-panel-index={slideIndex}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={prefersReducedMotion ? { duration: 0.14 } : APPLE_SPRINGS.snappy}
                className="projection-slide w-full min-h-[720px] h-auto overflow-visible"
              >
                {renderSlide()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
