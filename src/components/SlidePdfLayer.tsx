import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import {
  AnnotationTool,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  LogicalRect,
  logicalToClientPoint,
  SlidePdfItem,
} from '../utils/annotationEngine';
import { useUiText } from '../utils/uiLanguage';

interface SlidePdfLayerProps {
  slideIndex: number;
  slideContainerRef: React.RefObject<HTMLDivElement | null>;
  interactionsKey: string;
  tool: AnnotationTool;
  slidePdfs: SlidePdfItem[];
  onUpdatePdf: (
    pdfId: string,
    patch: Partial<Pick<SlidePdfItem, 'scopeKey' | 'x' | 'y' | 'width' | 'height'>>,
    commit?: boolean,
  ) => void;
  onDeletePdf: (pdfId: string) => void;
  isRemoteProjector?: boolean;
  zoomScale?: number;
  panOffset?: { x: number; y: number };
}

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

const MIN_PDF_WIDTH = 140;
const MIN_PDF_HEIGHT = 140;

export const SlidePdfLayer: React.FC<SlidePdfLayerProps> = ({
  slideIndex,
  slideContainerRef,
  interactionsKey,
  tool,
  slidePdfs,
  onUpdatePdf,
  onDeletePdf,
  isRemoteProjector = false,
  zoomScale = 1,
  panOffset = { x: 0, y: 0 },
}) => {
  const t = useUiText();
  const [slideRect, setSlideRect] = useState<LogicalRect>({
    left: 0,
    top: 0,
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pdfsRef = useRef(slidePdfs);
  pdfsRef.current = slidePdfs;

  const actionRef = useRef<{
    type: 'drag' | 'resize';
    pdfId: string;
    corner?: ResizeCorner;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    aspect: number;
    latestPatch?: Partial<Pick<SlidePdfItem, 'x' | 'y' | 'width' | 'height'>>;
  } | null>(null);

  const interactive = !isRemoteProjector && tool === 'pointer';
  const visiblePdfs = useMemo(
    () => slidePdfs.filter((pdf) => pdf.slideIndex === slideIndex),
    [slidePdfs, slideIndex],
  );

  const measureGeometry = useCallback(() => {
    const el = slideContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    setSlideRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  }, [slideContainerRef]);

  useLayoutEffect(() => {
    measureGeometry();
  }, [measureGeometry, slideIndex, interactionsKey, zoomScale, panOffset.x, panOffset.y]);

  useEffect(() => {
    measureGeometry();
    const t1 = window.setTimeout(measureGeometry, 60);
    const el = slideContainerRef.current;
    let ro: ResizeObserver | null = null;
    let mo: MutationObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measureGeometry);
      ro.observe(el);
    }
    if (el && typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(measureGeometry);
      mo.observe(el, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-storage-scope', 'style', 'class'],
      });
    }
    window.addEventListener('resize', measureGeometry);
    window.addEventListener('scroll', measureGeometry, true);
    return () => {
      window.clearTimeout(t1);
      ro?.disconnect();
      mo?.disconnect();
      window.removeEventListener('resize', measureGeometry);
      window.removeEventListener('scroll', measureGeometry, true);
    };
  }, [measureGeometry, slideIndex, interactionsKey, slideContainerRef]);

  const screenScale = slideRect.width > 0 ? slideRect.width / LOGICAL_WIDTH : 1;

  useEffect(() => {
    setSelectedId(null);
  }, [slideIndex]);

  useEffect(() => {
    if (!interactive) setSelectedId(null);
  }, [interactive]);

  useEffect(() => {
    if (selectedId && !visiblePdfs.some((pdf) => pdf.id === selectedId)) {
      setSelectedId(null);
    }
  }, [visiblePdfs, selectedId]);

  // Global pointer listeners for dragging and proportional resizing.
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const act = actionRef.current;
      if (!act) return;

      const scaleX = LOGICAL_WIDTH / (slideRect.width || LOGICAL_WIDTH);
      const scaleY = LOGICAL_HEIGHT / (slideRect.height || LOGICAL_HEIGHT);
      const dx = (e.clientX - act.startClientX) * scaleX;
      const dy = (e.clientY - act.startClientY) * scaleY;

      let patch: Partial<Pick<SlidePdfItem, 'x' | 'y' | 'width' | 'height'>>;
      if (act.type === 'drag') {
        patch = {
          x: Math.round(act.startX + dx),
          y: Math.round(act.startY + dy),
        };
      } else if (act.corner) {
        let width = act.startW;
        let height = act.startH;
        let x = act.startX;
        let y = act.startY;

        if (act.corner === 'se') {
          width = Math.max(MIN_PDF_WIDTH, act.startW + dx);
        } else if (act.corner === 'sw') {
          width = Math.max(MIN_PDF_WIDTH, act.startW - dx);
        } else if (act.corner === 'ne') {
          width = Math.max(MIN_PDF_WIDTH, act.startW + dx);
        } else if (act.corner === 'nw') {
          width = Math.max(MIN_PDF_WIDTH, act.startW - dx);
        }

        width = Math.min(1500, width);
        height = Math.max(MIN_PDF_HEIGHT, width / act.aspect);
        if (height > 1600) {
          height = 1600;
          width = height * act.aspect;
        }

        if (act.corner === 'sw' || act.corner === 'nw') {
          x = act.startX + act.startW - width;
        }
        if (act.corner === 'ne' || act.corner === 'nw') {
          y = act.startY + act.startH - height;
        }

        patch = {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        };
      } else {
        return;
      }

      act.latestPatch = patch;
      onUpdatePdf(act.pdfId, patch, false);
    };

    const onPointerUp = () => {
      const act = actionRef.current;
      if (!act) return;
      actionRef.current = null;
      const item = pdfsRef.current.find((pdf) => pdf.id === act.pdfId);
      if (!item) return;
      onUpdatePdf(act.pdfId, act.latestPatch ?? {}, true);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [slideRect, onUpdatePdf]);

  // Click outside deselects.
  useEffect(() => {
    if (!selectedId) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-slide-pdf-root]')) return;
      setSelectedId(null);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [selectedId]);

  // Delete removes the selected PDF frame, Escape deselects.
  useEffect(() => {
    if (isRemoteProjector) return;
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
      if (!selectedId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeletePdf(selectedId);
        setSelectedId(null);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, isRemoteProjector, onDeletePdf]);

  const startDrag = (item: SlidePdfItem, e: React.PointerEvent) => {
    if (!interactive) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(item.id);
    actionRef.current = {
      type: 'drag',
      pdfId: item.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: item.x,
      startY: item.y,
      startW: item.width,
      startH: item.height,
      aspect: item.width / Math.max(1, item.height),
    };
  };

  const startResize = (e: React.PointerEvent, item: SlidePdfItem, corner: ResizeCorner) => {
    if (!interactive) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(item.id);
    actionRef.current = {
      type: 'resize',
      pdfId: item.id,
      corner,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: item.x,
      startY: item.y,
      startW: item.width,
      startH: item.height,
      aspect: item.width / Math.max(1, item.height),
    };
  };

  if (visiblePdfs.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 24 }}>
      {visiblePdfs.map((item) => {
        const topLeft = logicalToClientPoint(item.x, item.y, slideRect);
        const screenW = Math.max(40, item.width * screenScale);
        const screenH = Math.max(40, item.height * screenScale);
        const isSelected = selectedId === item.id;
        const showControls = isSelected && interactive;
        const toolbarAbove = topLeft.y > 56;
        const toolbarOnRight = topLeft.x > window.innerWidth - 360;

        return (
          <div
            key={item.id}
            data-testid="slide-pdf-item"
            data-slide-pdf-root="true"
            onPointerDown={(e) => startDrag(item, e)}
            style={{
              left: `${topLeft.x}px`,
              top: `${topLeft.y}px`,
              width: `${screenW}px`,
              height: `${screenH}px`,
              pointerEvents: interactive ? 'auto' : 'none',
              cursor: interactive ? 'grab' : 'default',
              zIndex: isSelected ? 25 : 24,
            }}
            className={`absolute select-none rounded-[14px] bg-white transition-shadow ${
              isSelected ? 'ring-2 ring-[var(--apple-red)] shadow-lg' : 'shadow-md'
            }`}
          >
            <img
              src={item.dataUrl}
              alt={t('pdf.frameAlt', {
                name: item.fileName,
                page: item.pageNumber,
                count: item.pageCount,
              })}
              draggable={false}
              className="w-full h-full object-contain rounded-[14px] pointer-events-none"
            />

            {showControls && (
              <>
                <div
                  data-slide-pdf-ui="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    top: toolbarAbove ? '-46px' : `${screenH + 8}px`,
                    left: toolbarOnRight ? 'auto' : 0,
                    right: toolbarOnRight ? 0 : 'auto',
                  }}
                  className="apple-hud-glass apple-ui apple-squircle absolute flex items-center gap-1.5 rounded-[14px] px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap z-20 max-w-[min(92vw,360px)]"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <FileText className="w-3.5 h-3.5 shrink-0 text-[#FF6961]" />
                    <span className="truncate max-w-[165px]" title={item.fileName}>
                      {item.fileName}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-white/75 tabular-nums-clean">
                    · {item.pageNumber}/{item.pageCount}
                  </span>
                  <span className="apple-hairline-v h-4 bg-white/25 mx-0.5" />
                  <button
                    type="button"
                    data-testid="slide-pdf-delete"
                    aria-label={t('pdf.deleteFrame')}
                    title={t('pdf.deleteFrame')}
                    onClick={() => {
                      onDeletePdf(item.id);
                      setSelectedId(null);
                    }}
                    className="apple-pressable apple-tap-target min-h-[28px] min-w-[28px] flex items-center justify-center p-1 rounded-[10px] text-[#FF6961] hover:bg-[var(--apple-red)] hover:text-white cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

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
                    data-testid={`slide-pdf-resize-${corner}`}
                    role="button"
                    tabIndex={0}
                    aria-label={t('pdf.resize', { corner })}
                    onPointerDown={(e) => startResize(e, item, corner)}
                    className={`apple-pressable apple-touch-halo absolute w-3.5 h-3.5 bg-white border-2 border-[var(--apple-red)] rounded-full shadow-md ${cls}`}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
