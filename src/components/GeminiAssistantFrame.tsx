import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookCheck,
  ExternalLink,
  GripHorizontal,
  ImagePlus,
  Loader2,
  Minimize2,
  Maximize2,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { SharedSlideInteractions } from '../hooks/usePresentationSync';
import {
  getRootSlideScope,
  getScopeDepth,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  PenStroke,
  ScopeRect,
  SlideImageItem,
  toSlideGlobalPoints,
} from '../utils/annotationEngine';
import { compressImageBlob } from '../utils/imageCompression';
import {
  buildGeminiCacheKey,
  buildPresentationDigest,
  clampFloatingFrameRect,
  FloatingFrameRect,
} from '../utils/presentationContext';

interface ReferenceImageItem {
  title: string;
  thumbUrl: string;
  proxyUrl: string;
  pageUrl: string;
  description: string;
}

interface GroundingSource {
  title: string;
  url: string;
}

interface GeminiAskResponse {
  answer: string;
  proveMode: boolean;
  sources: GroundingSource[];
  referenceImages: ReferenceImageItem[];
  autoPasteImage: {
    dataUrl: string;
    title: string;
    pageUrl: string;
  } | null;
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  proveMode?: boolean;
  fromCache?: boolean;
  sources?: GroundingSource[];
  referenceImages?: ReferenceImageItem[];
  pastedTitle?: string;
  error?: boolean;
}

interface GeminiAssistantFrameProps {
  open: boolean;
  onClose: () => void;
  slideIndex: number;
  interactions: SharedSlideInteractions;
  slideContainerRef: React.RefObject<HTMLDivElement | null>;
  permanentStrokes: PenStroke[];
  tempStrokes: PenStroke[];
  textEdits: Record<string, string>;
  slideImages: SlideImageItem[];
  onAddImage: (input: {
    slideIndex: number;
    scopeKey: string;
    x: number;
    y: number;
    width: number;
    height: number;
    dataUrl: string;
  }) => Promise<SlideImageItem | undefined>;
}

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

function renderStrokeCanvasInlineImage(
  slideContainer: HTMLDivElement | null,
  strokes: PenStroke[],
  slideIndex: number,
): { data: string; mimeType: string; label: string } | null {
  if (strokes.length === 0) return null;

  const canvasW = 640;
  const canvasH = 360;
  const scaleX = canvasW / LOGICAL_WIDTH;
  const scaleY = canvasH / LOGICAL_HEIGHT;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#FBF9F5';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Measure visible scopes to translate scoped strokes accurately
  const scopeOrigins = new Map<string, { left: number; top: number }>();
  if (slideContainer) {
    const rootRect = slideContainer.getBoundingClientRect();
    if (rootRect.width > 0 && rootRect.height > 0) {
      const sx = LOGICAL_WIDTH / rootRect.width;
      const sy = LOGICAL_HEIGHT / rootRect.height;
      const nodes = slideContainer.querySelectorAll<HTMLElement>('[data-storage-scope]');
      nodes.forEach((node) => {
        const key = node.dataset.storageScope;
        if (!key) return;
        const r = node.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        const left = (r.left - rootRect.left) * sx;
        const top = (r.top - rootRect.top) * sy;
        scopeOrigins.set(key, { left, top });

        // Draw subtle scope outline so Gemini understands where strokes sit
        ctx.save();
        ctx.strokeStyle = 'rgba(120, 113, 108, 0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(left * scaleX, top * scaleY, r.width * sx * scaleX, r.height * sy * scaleY);
        ctx.restore();
      });
    }
  }

  let drawn = 0;
  for (const s of strokes) {
    if (s.slideIndex !== slideIndex) continue;
    const isRoot = s.scopeKey === getRootSlideScope(slideIndex);
    const origin = isRoot ? { left: 0, top: 0 } : scopeOrigins.get(s.scopeKey);
    if (!isRoot && !origin) continue;

    const globalPts = toSlideGlobalPoints(s.points, origin?.left ?? 0, origin?.top ?? 0);
    if (globalPts.length === 0) continue;

    ctx.save();
    ctx.strokeStyle = s.color === '#FFFFFF' ? '#44403C' : s.color;
    ctx.lineWidth = Math.max(1.5, s.size * scaleX);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(globalPts[0].x * scaleX, globalPts[0].y * scaleY);
    if (globalPts.length === 1) {
      ctx.lineTo(globalPts[0].x * scaleX + 0.5, globalPts[0].y * scaleY + 0.5);
    } else {
      for (let i = 1; i < globalPts.length; i++) {
        ctx.lineTo(globalPts[i].x * scaleX, globalPts[i].y * scaleY);
      }
    }
    ctx.stroke();
    ctx.restore();
    drawn++;
  }

  if (drawn === 0) return null;
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];
  if (!base64) return null;
  return {
    data: base64,
    mimeType: 'image/png',
    label: `Lakaran pen pengguna pada Slaid ${slideIndex + 1}`,
  };
}

function renderFormattedLines(text: string) {
  const blocks = text.split(/\n{2,}/);
  return blocks.map((block, bIdx) => {
    const lines = block.split('\n');
    const isList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
    if (isList) {
      return (
        <ul key={bIdx} className="list-disc pl-4 space-y-1">
          {lines.map((line, lIdx) => (
            <li key={lIdx}>{renderInlineBold(line.replace(/^\s*[-*•]\s+/, ''))}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bIdx} className="leading-relaxed">
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            {renderInlineBold(line)}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-stone-900 dark:text-stone-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const GeminiAssistantFrame: React.FC<GeminiAssistantFrameProps> = ({
  open,
  onClose,
  slideIndex,
  interactions,
  slideContainerRef,
  permanentStrokes,
  tempStrokes,
  textEdits,
  slideImages,
  onAddImage,
}) => {
  const [frameRect, setFrameRect] = useState<FloatingFrameRect>(() => {
    if (typeof window === 'undefined') {
      return { x: 820, y: 120, width: 390, height: 470 };
    }
    return clampFloatingFrameRect(
      {
        x: window.innerWidth - 414,
        y: Math.max(24, window.innerHeight - 554),
        width: 390,
        height: 470,
      },
      window.innerWidth,
      window.innerHeight,
    );
  });
  const [minimized, setMinimized] = useState(false);
  const [proveMode, setProveMode] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [previewRefImage, setPreviewRefImage] = useState<ReferenceImageItem | null>(null);
  const [pastingUrl, setPastingUrl] = useState<string | null>(null);

  const responseCacheRef = useRef<Map<string, GeminiAskResponse>>(new Map());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const actionRef = useRef<{
    type: 'drag' | 'resize';
    corner?: ResizeCorner;
    startClientX: number;
    startClientY: number;
    startRect: FloatingFrameRect;
  } | null>(null);

  const digest = useMemo(
    () =>
      buildPresentationDigest({
        slideIndex,
        interactions,
        permanentStrokes,
        tempStrokes,
        textEdits,
        slideImages,
      }),
    [slideIndex, interactions, permanentStrokes, tempStrokes, textEdits, slideImages],
  );

  // Keep frame inside viewport on resize
  useEffect(() => {
    const onResize = () => {
      setFrameRect((prev) => clampFloatingFrameRect(prev, window.innerWidth, window.innerHeight));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Drag ("seret") & 4-corner resize listeners (same smooth pattern as images)
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const act = actionRef.current;
      if (!act) return;

      const dx = e.clientX - act.startClientX;
      const dy = e.clientY - act.startClientY;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (act.type === 'drag') {
        setFrameRect(
          clampFloatingFrameRect(
            {
              ...act.startRect,
              x: act.startRect.x + dx,
              y: act.startRect.y + dy,
            },
            vw,
            vh,
          ),
        );
      } else if (act.type === 'resize' && act.corner) {
        let { x, y, width, height } = act.startRect;
        if (act.corner === 'se') {
          width = act.startRect.width + dx;
          height = act.startRect.height + dy;
        } else if (act.corner === 'sw') {
          width = act.startRect.width - dx;
          height = act.startRect.height + dy;
          x = act.startRect.x + (act.startRect.width - Math.max(310, Math.min(780, width)));
        } else if (act.corner === 'ne') {
          width = act.startRect.width + dx;
          height = act.startRect.height - dy;
          y = act.startRect.y + (act.startRect.height - Math.max(260, Math.min(680, height)));
        } else if (act.corner === 'nw') {
          width = act.startRect.width - dx;
          height = act.startRect.height - dy;
          x = act.startRect.x + (act.startRect.width - Math.max(310, Math.min(780, width)));
          y = act.startRect.y + (act.startRect.height - Math.max(260, Math.min(680, height)));
        }
        setFrameRect(clampFloatingFrameRect({ x, y, width, height }, vw, vh));
      }
    };

    const onPointerUp = () => {
      actionRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  const pickTargetScopeForPastedImage = useCallback((): {
    scopeKey: string;
    x: number;
    y: number;
  } => {
    const rootEl = slideContainerRef.current;
    if (rootEl) {
      const rootRect = rootEl.getBoundingClientRect();
      if (rootRect.width > 0 && rootRect.height > 0) {
        const scaleX = LOGICAL_WIDTH / rootRect.width;
        const scaleY = LOGICAL_HEIGHT / rootRect.height;
        const nodes = rootEl.querySelectorAll<HTMLElement>('[data-storage-scope]');
        const scopes: ScopeRect[] = [];
        nodes.forEach((node) => {
          const scopeKey = node.dataset.storageScope;
          if (!scopeKey) return;
          const r = node.getBoundingClientRect();
          if (r.width <= 80 || r.height <= 80) return;
          scopes.push({
            scopeKey,
            left: (r.left - rootRect.left) * scaleX,
            top: (r.top - rootRect.top) * scaleY,
            width: r.width * scaleX,
            height: r.height * scaleY,
            depth: getScopeDepth(scopeKey),
          });
        });

        // Prefer the primary deepest active sub-element container on the right/detail side if present
        scopes.sort((a, b) => b.depth - a.depth || b.width * b.height - a.width * a.height);
        const preferred = scopes[0];
        if (preferred) {
          return {
            scopeKey: preferred.scopeKey,
            x: Math.max(16, Math.round(preferred.width - 280)),
            y: 24,
          };
        }
      }
    }
    const offset = (slideImages.length % 4) * 28;
    return {
      scopeKey: getRootSlideScope(slideIndex),
      x: 740 + offset,
      y: 190 + offset,
    };
  }, [slideContainerRef, slideImages.length, slideIndex]);

  const pasteDataUrlToSlide = useCallback(
    async (srcUrl: string) => {
      const res = await fetch(srcUrl);
      if (!res.ok) throw new Error('Gagal memuat turun gambar untuk ditampal.');
      const blob = await res.blob();
      const compressed = await compressImageBlob(blob, 300);
      const target = pickTargetScopeForPastedImage();
      await onAddImage({
        slideIndex,
        scopeKey: target.scopeKey,
        x: target.x,
        y: target.y,
        width: compressed.width,
        height: compressed.height,
        dataUrl: compressed.dataUrl,
      });
    },
    [onAddImage, pickTargetScopeForPastedImage, slideIndex],
  );

  const handlePasteReferenceImage = async (refItem: ReferenceImageItem) => {
    setPastingUrl(refItem.proxyUrl);
    try {
      await pasteDataUrlToSlide(refItem.proxyUrl);
    } finally {
      setPastingUrl(null);
    }
  };

  const submitQuestion = useCallback(
    async (rawQuestion: string, options?: { forceProve?: boolean; wantsImagePaste?: boolean }) => {
      const q = rawQuestion.trim();
      if (!q || loading) return;

      const effectiveProve = options?.forceProve ?? proveMode;
      const wantsImagePaste = Boolean(options?.wantsImagePaste);

      const userMsg: ChatMessageItem = {
        id: `u-${Date.now().toString(36)}`,
        role: 'user',
        text: q,
        proveMode: effectiveProve,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');

      const activeTemp = tempStrokes.filter((s) => !s.expiresAt || s.expiresAt > Date.now());
      const cacheKey = buildGeminiCacheKey({
        question: q,
        proveMode: effectiveProve,
        slideIndex,
        subLabel: digest.currentSubElementLabel,
        strokeCount: permanentStrokes.length + activeTemp.length,
        textEditsCount: Object.keys(textEdits).length,
        imageCount: slideImages.length,
      });

      const cached = !wantsImagePaste ? responseCacheRef.current.get(cacheKey) : undefined;
      if (cached) {
        setMessages((prev) => [
          ...prev,
          {
            id: `m-${Date.now().toString(36)}`,
            role: 'model',
            text: cached.answer,
            proveMode: cached.proveMode,
            fromCache: true,
            sources: cached.sources,
            referenceImages: cached.referenceImages,
          },
        ]);
        return;
      }

      setLoading(true);
      try {
        // Attach visual canvas drawings / slide image only when relevant to save tokens
        const inlineImages: Array<{ data: string; mimeType: string; label?: string }> = [];
        const slideAllStrokes = [...permanentStrokes, ...activeTemp].filter(
          (s) => s.slideIndex === slideIndex,
        );
        if (slideAllStrokes.length > 0) {
          const strokeSnap = renderStrokeCanvasInlineImage(
            slideContainerRef.current,
            slideAllStrokes,
            slideIndex,
          );
          if (strokeSnap) {
            inlineImages.push(strokeSnap);
          }
        }
        if (
          slideImages.length > 0 &&
          /\b(gambar|image|foto|photo|lukis|explain|terang|apa|ni|ini)\b/i.test(q)
        ) {
          const latestImg = slideImages[slideImages.length - 1];
          const match = latestImg.dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
          if (match && match[2].length < 280_000) {
            inlineImages.push({
              mimeType: match[1],
              data: match[2],
              label: `Gambar pada slaid (${latestImg.scopeKey})`,
            });
          }
        }

        const history = messages
          .filter((m) => !m.error)
          .slice(-4)
          .map((m) => ({ role: m.role, text: m.text }));

        const res = await fetch('/api/gemini/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q,
            proveMode: effectiveProve,
            wantsImagePaste,
            deckOutlineText: digest.deckOutlineText,
            currentSlideDetailText: digest.currentSlideDetailText,
            history,
            inlineImages,
          }),
        });

        const payload = (await res.json()) as GeminiAskResponse & { error?: string };
        if (!res.ok) {
          throw new Error(payload.error || `Ralat pelayan (${res.status}).`);
        }

        let pastedTitle: string | undefined;
        if (payload.autoPasteImage?.dataUrl) {
          try {
            await pasteDataUrlToSlide(payload.autoPasteImage.dataUrl);
            pastedTitle = payload.autoPasteImage.title;
          } catch {
            // Keep answer visible even if image compression failed
          }
        }

        if (!wantsImagePaste && !payload.autoPasteImage) {
          responseCacheRef.current.set(cacheKey, payload);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `m-${Date.now().toString(36)}`,
            role: 'model',
            text: payload.answer,
            proveMode: payload.proveMode,
            sources: payload.sources,
            referenceImages: payload.referenceImages,
            pastedTitle,
          },
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal menghubungi Gemini.';
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now().toString(36)}`,
            role: 'model',
            text: msg,
            error: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      digest.currentSlideDetailText,
      digest.deckOutlineText,
      loading,
      messages,
      pasteDataUrlToSlide,
      permanentStrokes,
      proveMode,
      slideContainerRef,
      slideImages,
      slideIndex,
      tempStrokes,
      textEdits,
    ],
  );

  if (!open) return null;

  const startDrag = (e: React.PointerEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button')) return;
    e.preventDefault();
    e.stopPropagation();
    actionRef.current = {
      type: 'drag',
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: frameRect,
    };
  };

  const startResize = (e: React.PointerEvent, corner: ResizeCorner) => {
    e.preventDefault();
    e.stopPropagation();
    actionRef.current = {
      type: 'resize',
      corner,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: frameRect,
    };
  };

  const totalSlideStrokes =
    permanentStrokes.filter((s) => s.slideIndex === slideIndex).length +
    tempStrokes.filter((s) => s.slideIndex === slideIndex && (!s.expiresAt || s.expiresAt > Date.now()))
      .length;

  return (
    <section
      data-testid="gemini-floating-frame"
      aria-label="Bingkai Pembantu Gemini AI"
      style={{
        left: `${frameRect.x}px`,
        top: `${frameRect.y}px`,
        width: `${frameRect.width}px`,
        height: minimized ? 'auto' : `${frameRect.height}px`,
      }}
      className="fixed z-40 flex flex-col rounded-2xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-2xl text-stone-900 dark:text-stone-100 select-text"
    >
      {/* Drag ("Seret") Header Bar */}
      <div
        data-testid="gemini-drag-handle"
        onPointerDown={startDrag}
        onDoubleClick={startDrag}
        title="Seret untuk alihkan bingkai Gemini"
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-stone-200 dark:border-stone-800 bg-[#FBF9F5] dark:bg-stone-950 rounded-t-2xl cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-4 h-4 text-stone-400 shrink-0" />
          <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-extrabold tracking-tight truncate">
              Pembantu Gemini AI
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
              Slaid {digest.currentSlideNumber}/{digest.totalSlides} · {digest.currentSubElementLabel}
              {totalSlideStrokes > 0 ? ` · ${totalSlideStrokes} lukisan` : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-testid="gemini-prove-toggle"
            aria-pressed={proveMode}
            title="Mod Bukti: papar gambar & pautan rujukan di dalam bingkai ini tanpa tampal ke slaid"
            onClick={() => setProveMode((p) => !p)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
              proveMode
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <BookCheck className="w-3.5 h-3.5" />
            <span>Mod Bukti</span>
          </button>

          <button
            type="button"
            aria-label={minimized ? 'Besarkan bingkai Gemini' : 'Kecilkan bingkai Gemini'}
            onClick={() => setMinimized((m) => !m)}
            className="p-1 rounded-lg hover:bg-stone-200/70 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
          >
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            aria-label="Tutup bingkai Gemini"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-stone-500 hover:text-red-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Quick Actions Strip (API-conscious presets) */}
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/60">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void submitQuestion(
                  'Terangkan konsep kimia pada slaid, tab aktif, serta lukisan atau suntingan saya sekarang.',
                )
              }
              className="px-2 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[11px] font-semibold hover:border-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-300 disabled:opacity-50 cursor-pointer"
            >
              Terangkan bahagian ini
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setProveMode(true);
                void submitQuestion(
                  'Buktikan dan beri gambar rujukan saintifik untuk topik slaid serta sub-elemen semasa.',
                  { forceProve: true },
                );
              }}
              className="px-2 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[11px] font-semibold hover:border-amber-500 hover:text-amber-800 dark:hover:text-amber-300 disabled:opacity-50 cursor-pointer"
            >
              Buktikan + Rujukan
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void submitQuestion(
                  'Cari dan tampal satu gambar rujukan saintifik yang sesuai terus ke slaid semasa.',
                  { wantsImagePaste: true },
                )
              }
              className="px-2 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[11px] font-semibold hover:border-blue-500 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 cursor-pointer"
            >
              Cari & Tampal Gambar
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                aria-label="Kosongkan perbualan Gemini"
                onClick={() => {
                  setMessages([]);
                  setPreviewRefImage(null);
                }}
                className="ml-auto p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scrollable Messages + Prove Mode In-Frame Reference Images */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-2.5 space-y-3 text-xs min-h-0"
          >
            {messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-stone-200 dark:border-stone-700 p-3 space-y-1.5 text-stone-600 dark:text-stone-400 bg-[#FBF9F5]/60 dark:bg-stone-950/40">
                <div className="font-bold text-stone-800 dark:text-stone-200">
                  Sedia membaca slaid, tab, lukisan pen &amp; gambar anda
                </div>
                <p className="leading-relaxed">
                  Tanya apa sahaja tentang Bab 5.4, minta Gemini menerangkan lakaran anda, aktifkan{' '}
                  <strong>Mod Bukti</strong> untuk rujukan bergambar dalam bingkai ini, atau suruh{' '}
                  <em>&ldquo;tampal gambar...&rdquo;</em> terus ke slaid.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1.5 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[94%] rounded-xl px-3 py-2 space-y-2 ${
                    msg.role === 'user'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium'
                      : msg.error
                      ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                      : 'bg-[#FBF9F5] dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  {msg.role === 'model' && !msg.error && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                      <span>{msg.proveMode ? 'Mod Bukti' : 'Gemini 4'}</span>
                      {msg.fromCache && (
                        <span className="text-emerald-700 dark:text-emerald-400">· Jimat API (Cache)</span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5 break-words">{renderFormattedLines(msg.text)}</div>

                  {msg.pastedTitle && (
                    <div
                      data-testid="gemini-auto-pasted-badge"
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300"
                    >
                      <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                      <span>Ditampal ke slaid: {msg.pastedTitle}</span>
                    </div>
                  )}

                  {/* Prove Mode: Reference Images inside Gemini Frame (NOT pasted to slide) */}
                  {msg.referenceImages && msg.referenceImages.length > 0 && (
                    <div
                      data-testid="gemini-prove-gallery"
                      className="pt-1.5 border-t border-stone-200/80 dark:border-stone-700 space-y-1.5"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        Gambar Rujukan ({msg.referenceImages.length}) — Dalam Bingkai Sahaja
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {msg.referenceImages.map((refImg, idx) => (
                          <div
                            key={`${refImg.thumbUrl}-${idx}`}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden flex flex-col"
                          >
                            <button
                              type="button"
                              onClick={() => setPreviewRefImage(refImg)}
                              className="relative h-20 w-full bg-stone-100 dark:bg-stone-950 overflow-hidden cursor-pointer"
                              title="Klik untuk lihat lebih besar di dalam bingkai"
                            >
                              <img
                                src={refImg.proxyUrl}
                                alt={refImg.title}
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <div className="p-1.5 space-y-1">
                              <div className="text-[10px] font-semibold line-clamp-1 text-stone-800 dark:text-stone-200">
                                {refImg.title}
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <a
                                  href={refImg.pageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 dark:text-blue-400 hover:underline"
                                >
                                  <span>Sumber</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <button
                                  type="button"
                                  data-testid="gemini-prove-paste-btn"
                                  disabled={pastingUrl === refImg.proxyUrl}
                                  onClick={() => void handlePasteReferenceImage(refImg)}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] font-bold hover:opacity-90 cursor-pointer"
                                >
                                  <ImagePlus className="w-2.5 h-2.5" />
                                  <span>{pastingUrl === refImg.proxyUrl ? '...' : 'Tampal'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grounded web references */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-1.5 border-t border-stone-200/80 dark:border-stone-700 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Sumber Web
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={`${src.url}-${sIdx}`}
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 px-1.5 py-0.5 text-[10px] text-blue-700 dark:text-blue-400 hover:underline max-w-full truncate"
                          >
                            <span className="truncate max-w-[160px]">{src.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-stone-500 px-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                <span>Gemini sedang menganalisis slaid &amp; konteks...</span>
              </div>
            )}
          </div>

          {/* In-frame larger preview modal for Prove Mode reference image */}
          {previewRefImage && (
            <div className="mx-3 mb-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-stone-950 p-2 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold truncate">{previewRefImage.title}</span>
                <button
                  type="button"
                  onClick={() => setPreviewRefImage(null)}
                  aria-label="Tutup pratonton gambar"
                  className="p-0.5 text-stone-500 hover:text-stone-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <img
                src={previewRefImage.proxyUrl}
                alt={previewRefImage.title}
                className="w-full max-h-40 object-contain rounded-lg bg-white dark:bg-stone-900"
              />
              <p className="text-[10px] text-stone-600 dark:text-stone-400">
                {previewRefImage.description}
              </p>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitQuestion(input);
            }}
            className="p-2.5 border-t border-stone-200 dark:border-stone-800 flex items-end gap-2 bg-white dark:bg-stone-900 rounded-b-2xl"
          >
            <textarea
              data-testid="gemini-prompt-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void submitQuestion(input);
                }
              }}
              placeholder={
                proveMode
                  ? 'Tanya untuk bukti bergambar dalam bingkai...'
                  : 'Tanya Gemini tentang slaid, lukisan, atau "tampal gambar..."'
              }
              className="flex-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-950 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
            <button
              type="submit"
              data-testid="gemini-send-button"
              disabled={loading || !input.trim()}
              aria-label="Hantar soalan kepada Gemini"
              className="shrink-0 w-9 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white flex items-center justify-center shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* 4 Corner Resize Handles (matching SlideAnnotationLayer images) */}
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
              data-testid={`gemini-resize-${corner}`}
              onPointerDown={(e) => startResize(e, corner)}
              className={`absolute w-3.5 h-3.5 bg-white dark:bg-stone-800 border-2 border-emerald-600 rounded-sm shadow ${cls}`}
            />
          ))}
        </>
      )}
    </section>
  );
};
