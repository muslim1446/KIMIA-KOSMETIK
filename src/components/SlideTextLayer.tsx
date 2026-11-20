import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Bold, Highlighter, Minus, Palette, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AnnotationTool,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  LogicalRect,
  logicalToClientPoint,
  SlideTextItem,
  TEXT_BACKGROUNDS,
  TEXT_COLORS,
} from '../utils/annotationEngine';

interface SlideTextLayerProps {
  slideIndex: number;
  slideContainerRef: React.RefObject<HTMLDivElement | null>;
  interactionsKey: string;
  tool: AnnotationTool;
  slideTexts: SlideTextItem[];
  onUpdateSlideText: (textId: string, patch: Partial<SlideTextItem>, commit?: boolean) => void;
  onDeleteSlideText: (textId: string) => void;
  isRemoteProjector?: boolean;
  zoomScale?: number;
  panOffset?: { x: number; y: number };
  focusTextId?: string | null;
  focusToken?: number;
}

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

const MIN_TEXT_WIDTH = 120;
const MIN_TEXT_HEIGHT = 48;

function nextOption(options: readonly string[], current: string): string {
  const idx = options.indexOf(current);
  return options[(idx + 1) % options.length] ?? options[0] ?? current;
}

export const SlideTextLayer: React.FC<SlideTextLayerProps> = ({
  slideIndex,
  slideContainerRef,
  interactionsKey,
  tool,
  slideTexts,
  onUpdateSlideText,
  onDeleteSlideText,
  isRemoteProjector = false,
  zoomScale = 1,
  panOffset = { x: 0, y: 0 },
  focusTextId = null,
  focusToken = 0,
}) => {
  const [slideRect, setSlideRect] = useState<LogicalRect>({
    left: 0,
    top: 0,
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const draftTextRef = useRef('');
  draftTextRef.current = draftText;

  const lastFocusTokenRef = useRef(0);
  const textsRef = useRef(slideTexts);
  textsRef.current = slideTexts;

  const actionRef = useRef<{
    type: 'drag' | 'resize';
    textId: string;
    corner?: ResizeCorner;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    latestPatch?: Partial<SlideTextItem>;
  } | null>(null);

  const interactive = !isRemoteProjector && tool === 'pointer';
  const visibleTexts = useMemo(
    () => slideTexts.filter((t) => t.slideIndex === slideIndex),
    [slideTexts, slideIndex],
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
    setEditingId(null);
    setDraftText('');
  }, [slideIndex]);

  useEffect(() => {
    if (!interactive) {
      setSelectedId(null);
      setEditingId(null);
    }
  }, [interactive]);

  useEffect(() => {
    if (selectedId && !visibleTexts.some((t) => t.id === selectedId)) {
      setSelectedId(null);
    }
    if (editingId && !visibleTexts.some((t) => t.id === editingId)) {
      setEditingId(null);
    }
  }, [visibleTexts, selectedId, editingId]);

  const beginEditing = useCallback(
    (item: SlideTextItem) => {
      if (!interactive) return;
      setSelectedId(item.id);
      setEditingId(item.id);
      setDraftText(item.text);
      draftTextRef.current = item.text;
    },
    [interactive],
  );

  const commitEditing = useCallback(
    (textId?: string) => {
      const id = textId ?? editingId;
      if (!id) return;
      const item = textsRef.current.find((t) => t.id === id);
      if (!item) {
        setEditingId(null);
        return;
      }
      const nextText = draftTextRef.current.replace(/\r\n/g, '\n').slice(0, 2000);
      if (!nextText.trim()) {
        onDeleteSlideText(id);
        setSelectedId(null);
        setEditingId(null);
        return;
      }
      if (nextText !== item.text) {
        onUpdateSlideText(id, { text: nextText }, true);
      }
      setEditingId(null);
    },
    [editingId, onDeleteSlideText, onUpdateSlideText],
  );

  // Automatically select + edit a freshly-added text box.
  useEffect(() => {
    if (isRemoteProjector || !focusTextId || !focusToken) return;
    if (lastFocusTokenRef.current === focusToken) return;
    const item = visibleTexts.find((t) => t.id === focusTextId);
    if (!item) return;
    lastFocusTokenRef.current = focusToken;
    setSelectedId(item.id);
    setEditingId(item.id);
    setDraftText(item.text);
    draftTextRef.current = item.text;
  }, [focusTextId, focusToken, isRemoteProjector, visibleTexts]);

  // Global pointer listeners for dragging and resizing text boxes.
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const act = actionRef.current;
      if (!act) return;

      const scaleX = LOGICAL_WIDTH / (slideRect.width || LOGICAL_WIDTH);
      const scaleY = LOGICAL_HEIGHT / (slideRect.height || LOGICAL_HEIGHT);
      const dx = (e.clientX - act.startClientX) * scaleX;
      const dy = (e.clientY - act.startClientY) * scaleY;

      let patch: Partial<SlideTextItem>;
      if (act.type === 'drag') {
        patch = {
          x: Math.round(act.startX + dx),
          y: Math.round(act.startY + dy),
        };
      } else if (act.corner) {
        let x = act.startX;
        let y = act.startY;
        let width = act.startW;
        let height = act.startH;

        if (act.corner === 'se') {
          width = Math.max(MIN_TEXT_WIDTH, act.startW + dx);
          height = Math.max(MIN_TEXT_HEIGHT, act.startH + dy);
        } else if (act.corner === 'sw') {
          width = Math.max(MIN_TEXT_WIDTH, act.startW - dx);
          height = Math.max(MIN_TEXT_HEIGHT, act.startH + dy);
          x = act.startX + act.startW - width;
        } else if (act.corner === 'ne') {
          width = Math.max(MIN_TEXT_WIDTH, act.startW + dx);
          height = Math.max(MIN_TEXT_HEIGHT, act.startH - dy);
          y = act.startY + act.startH - height;
        } else if (act.corner === 'nw') {
          width = Math.max(MIN_TEXT_WIDTH, act.startW - dx);
          height = Math.max(MIN_TEXT_HEIGHT, act.startH - dy);
          x = act.startX + act.startW - width;
          y = act.startY + act.startH - height;
        }

        patch = {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(Math.min(1280, width)),
          height: Math.round(Math.min(720, height)),
        };
      } else {
        return;
      }

      act.latestPatch = patch;
      onUpdateSlideText(act.textId, patch, false);
    };

    const onPointerUp = () => {
      const act = actionRef.current;
      if (!act) return;
      actionRef.current = null;
      const item = textsRef.current.find((t) => t.id === act.textId);
      if (!item) return;
      onUpdateSlideText(act.textId, act.latestPatch ?? {}, true);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [slideRect, onUpdateSlideText]);

  // Click outside deselects and commits an active text edit.
  useEffect(() => {
    if (!selectedId) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-slide-text-root], [data-slide-text-ui]')) return;
      commitEditing();
      setSelectedId(null);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [selectedId, commitEditing]);

  // Keyboard shortcuts: Delete removes a selected text box, Escape deselects.
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
        onDeleteSlideText(selectedId);
        setSelectedId(null);
        setEditingId(null);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setEditingId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, isRemoteProjector, onDeleteSlideText]);

  const startDrag = (item: SlideTextItem, e: React.PointerEvent) => {
    if (!interactive || editingId === item.id) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(item.id);
    actionRef.current = {
      type: 'drag',
      textId: item.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: item.x,
      startY: item.y,
      startW: item.width,
      startH: item.height,
    };
  };

  const startResize = (
    e: React.PointerEvent,
    item: SlideTextItem,
    corner: ResizeCorner,
  ) => {
    if (!interactive) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(item.id);
    actionRef.current = {
      type: 'resize',
      textId: item.id,
      corner,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: item.x,
      startY: item.y,
      startW: item.width,
      startH: item.height,
    };
  };

  if (visibleTexts.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 26 }}>
      {visibleTexts.map((item) => {
        const isEditing = editingId === item.id;
        if (!item.text.trim() && !isEditing) return null;

        const topLeft = logicalToClientPoint(item.x, item.y, slideRect);
        const screenW = Math.max(40, item.width * screenScale);
        const screenH = Math.max(24, item.height * screenScale);
        const isSelected = selectedId === item.id;
        const showControls = isSelected && interactive && !isRemoteProjector;
        const toolbarAbove = topLeft.y > 80;
        const toolbarOnRight = topLeft.x > window.innerWidth - 340;
        const textBackground = item.bgColor && item.bgColor !== 'transparent' ? item.bgColor : 'transparent';
        const fontStyle: React.CSSProperties = {
          fontSize: `${Math.max(8, item.fontSize * screenScale)}px`,
          color: item.color,
          fontWeight: item.isBold ? 700 : 400,
          lineHeight: 1.28,
        };

        return (
          <div
            key={item.id}
            data-testid="slide-text-item"
            data-slide-text-root="true"
            onPointerDown={(e) => startDrag(item, e)}
            onDoubleClick={(e) => {
              if (!interactive) return;
              e.stopPropagation();
              e.preventDefault();
              beginEditing(item);
            }}
            style={{
              left: `${topLeft.x}px`,
              top: `${topLeft.y}px`,
              width: `${screenW}px`,
              height: `${screenH}px`,
              pointerEvents: interactive ? 'auto' : 'none',
              cursor: interactive ? (isEditing ? 'text' : 'grab') : 'default',
              zIndex: isSelected ? 28 : 26,
            }}
            className={`absolute select-none rounded-md transition-shadow ${
              isEditing
                ? 'ring-2 ring-emerald-500 bg-white/10 shadow-md'
                : isSelected
                ? 'ring-2 ring-blue-600 shadow-md'
                : ''
            }`}
          >
            {isEditing ? (
              <textarea
                data-testid="slide-text-editor"
                autoFocus
                value={draftText}
                onChange={(e) => {
                  setDraftText(e.target.value);
                  draftTextRef.current = e.target.value;
                }}
                onBlur={() => commitEditing(item.id)}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
                    e.preventDefault();
                    commitEditing(item.id);
                  }
                }}
                placeholder="Taip teks di sini..."
                style={{
                  ...fontStyle,
                  background:
                    textBackground === 'transparent' ? 'rgba(255, 255, 255, 0.92)' : textBackground,
                  caretColor: item.color,
                }}
                className="absolute inset-0 w-full h-full resize-none rounded-md p-1.5 outline-none border-0 select-text"
              />
            ) : (
              <div
                style={{
                  ...fontStyle,
                  background: textBackground,
                }}
                className="w-full h-full overflow-hidden rounded-md p-1.5 whitespace-pre-wrap break-words"
              >
                {item.text}
              </div>
            )}

            {showControls && (
              <>
                {/* Floating mini toolbar: edit, font size, bold, colours, background, delete */}
                <div
                  data-slide-text-ui="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    top: toolbarAbove ? '-42px' : `${screenH + 8}px`,
                    left: toolbarOnRight ? 'auto' : 0,
                    right: toolbarOnRight ? 0 : 'auto',
                  }}
                  className="absolute flex items-center gap-0.5 rounded-lg bg-stone-900/95 text-white px-1.5 py-1 text-[11px] font-semibold shadow-lg whitespace-nowrap z-20"
                >
                  <button
                    type="button"
                    data-testid="slide-text-edit-button"
                    title="Sunting teks (atau klik dua kali kotak)"
                    onClick={() => beginEditing(item)}
                    className="p-1 rounded hover:bg-stone-700 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-px h-4 bg-stone-600 mx-0.5" />

                  <button
                    type="button"
                    title="Kecilkan saiz fon"
                    onClick={() =>
                      onUpdateSlideText(
                        item.id,
                        { fontSize: Math.max(8, item.fontSize - 2) },
                        true,
                      )
                    }
                    className="p-1 rounded hover:bg-stone-700 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span
                    data-testid="slide-text-font-size"
                    className="min-w-[38px] text-center tabular-nums-clean text-[10px]"
                  >
                    {item.fontSize}px
                  </span>
                  <button
                    type="button"
                    title="Besarkan saiz fon"
                    onClick={() =>
                      onUpdateSlideText(
                        item.id,
                        { fontSize: Math.min(160, item.fontSize + 2) },
                        true,
                      )
                    }
                    className="p-1 rounded hover:bg-stone-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    title={item.isBold ? 'Nyahtebal' : 'Tebalkan'}
                    onClick={() =>
                      onUpdateSlideText(item.id, { isBold: !item.isBold }, true)
                    }
                    className={`p-1 rounded cursor-pointer ${
                      item.isBold ? 'bg-blue-600 text-white' : 'hover:bg-stone-700'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    title="Tukar warna teks (klik berulang)"
                    onClick={() =>
                      onUpdateSlideText(
                        item.id,
                        { color: nextOption(TEXT_COLORS, item.color) },
                        true,
                      )
                    }
                    className="p-1 rounded hover:bg-stone-700 cursor-pointer"
                  >
                    <span className="relative flex items-center justify-center">
                      <Palette className="w-3.5 h-3.5" />
                      <span
                        className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-stone-900"
                        style={{ backgroundColor: item.color }}
                      />
                    </span>
                  </button>

                  <button
                    type="button"
                    title="Tukar latar kotak (klik berulang)"
                    onClick={() =>
                      onUpdateSlideText(
                        item.id,
                        { bgColor: nextOption(TEXT_BACKGROUNDS, item.bgColor ?? 'transparent') },
                        true,
                      )
                    }
                    className="p-1 rounded hover:bg-stone-700 cursor-pointer"
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-px h-4 bg-stone-600 mx-0.5" />

                  <button
                    type="button"
                    aria-label="Padam kotak teks"
                    title="Padam kotak teks"
                    onClick={() => {
                      onDeleteSlideText(item.id);
                      setSelectedId(null);
                      setEditingId(null);
                    }}
                    className="p-1 rounded text-red-300 hover:bg-red-600 hover:text-white cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4 corner resize handles (hidden until selected, like images) */}
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
                    data-testid={`slide-text-resize-${corner}`}
                    onPointerDown={(e) => startResize(e, item, corner)}
                    className={`absolute w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-sm shadow ${cls}`}
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
