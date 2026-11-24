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
import { useUiText } from '../utils/uiLanguage';

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
  const t = useUiText();
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
    pointerId: number;
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
      if (!act || e.pointerId !== act.pointerId) return;

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
        const margin = vw < 420 ? 8 : 12;
        const minW = Math.min(310, Math.max(240, vw - margin * 2));
        const maxW = Math.max(minW, Math.min(780, vw - margin * 2));
        const minH = Math.min(260, Math.max(200, vh - margin * 2));
        const maxH = Math.max(minH, Math.min(680, vh - margin * 2));
        let { x, y, width, height } = act.startRect;
        if (act.corner === 'se') {
          width = act.startRect.width + dx;
          height = act.startRect.height + dy;
        } else if (act.corner === 'sw') {
          width = act.startRect.width - dx;
          height = act.startRect.height + dy;
          x = act.startRect.x + (act.startRect.width - Math.max(minW, Math.min(maxW, width)));
        } else if (act.corner === 'ne') {
          width = act.startRect.width + dx;
          height = act.startRect.height - dy;
          y = act.startRect.y + (act.startRect.height - Math.max(minH, Math.min(maxH, height)));
        } else if (act.corner === 'nw') {
          width = act.startRect.width - dx;
          height = act.startRect.height - dy;
          x = act.startRect.x + (act.startRect.width - Math.max(minW, Math.min(maxW, width)));
          y = act.startRect.y + (act.startRect.height - Math.max(minH, Math.min(maxH, height)));
        }
        setFrameRect(clampFloatingFrameRect({ x, y, width, height }, vw, vh));
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const act = actionRef.current;
      if (!act || e.pointerId !== act.pointerId) return;
      actionRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
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
    } catch {
      setMessages((previous) => [
        ...previous,
        { id: `err-${Date.now().toString(36)}`, role: 'model', text: t('error.generic'), error: true },
      ]);
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
        console.error('Gemini request failed', err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now().toString(36)}`,
            role: 'model',
            text: t('error.generic'),
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
      t,
    ],
  );

  if (!open) return null;

  const startDrag = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, input, a')) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic pointer capture error
    }
    actionRef.current = {
      type: 'drag',
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: frameRect,
    };
  };

  const startResize = (e: React.PointerEvent, corner: ResizeCorner) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic pointer capture error
    }
    actionRef.current = {
      type: 'resize',
      pointerId: e.pointerId,
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
      aria-label={t('gemini.title')}
      style={{
        left: `${frameRect.x}px`,
        top: `${frameRect.y}px`,
        width: `${frameRect.width}px`,
        height: minimized ? 'auto' : `${frameRect.height}px`,
      }}
      className="apple-ui apple-sheet apple-squircle fixed z-40 flex flex-col rounded-[26px] text-[var(--apple-label)] select-text"
    >
      {/* Drag ("Seret") Header Bar */}
      <div
        data-testid="gemini-drag-handle"
        onPointerDown={startDrag}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement | null)?.closest('button, input, a')) return;
          setMinimized((m) => !m);
        }}
        title={t('gemini.drag')}
        className="touch-none flex items-center justify-between gap-2 px-3.5 py-2.5 apple-hairline-b rounded-t-[26px] cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-4 h-4 text-[var(--apple-tertiary-label)] shrink-0" />
          <Sparkles className="w-4 h-4 text-[var(--apple-green-fg)] shrink-0" />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold tracking-[-0.01em] truncate">
              {t('gemini.title')}
            </div>
            <div className="text-[11px] text-[var(--apple-secondary-label)] truncate tabular-nums-clean">
              Slaid {digest.currentSlideNumber}/{digest.totalSlides} · {digest.currentSubElementLabel}
              {totalSlideStrokes > 0 ? ` · ${totalSlideStrokes} lukisan` : ''}
            </div>
          </div>
        </div>

        <div className="relative z-40 flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-testid="gemini-prove-toggle"
            aria-pressed={proveMode}
            title={t('gemini.proofMode')}
            onClick={() => setProveMode((p) => !p)}
            className={`apple-pressable apple-tap-target flex items-center gap-1 min-h-[32px] px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
              proveMode
                ? 'bg-[var(--apple-orange)] text-white shadow-sm'
                : 'bg-[var(--apple-fill)] text-[var(--apple-label)] hover:bg-[var(--apple-fill-hover)]'
            }`}
          >
            <BookCheck className="w-3.5 h-3.5" />
            <span>{t('gemini.proof')}</span>
          </button>

          <button
            type="button"
            aria-label={minimized ? t('google.expand') : t('google.minimize')}
            onClick={() => setMinimized((m) => !m)}
            className="apple-pressable apple-tap-target flex items-center justify-center min-h-[32px] min-w-[32px] rounded-full hover:bg-[var(--apple-fill)] text-[var(--apple-secondary-label)] cursor-pointer"
          >
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            aria-label={t('google.close')}
            onClick={onClose}
            className="apple-pressable apple-tap-target flex items-center justify-center min-h-[32px] min-w-[32px] rounded-full hover:bg-[var(--apple-red)]/14 text-[var(--apple-secondary-label)] hover:text-[var(--apple-red-fg)] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Quick Actions Strip */}
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 apple-hairline-b">
            <button
              type="button"
              disabled={loading}
              onClick={() => void submitQuestion(t('gemini.explainPrompt'))}
              className="apple-pressable min-h-[32px] px-2.5 py-1 rounded-[10px] bg-[var(--apple-fill)] hover:bg-[var(--apple-fill-hover)] text-[11px] font-semibold text-[var(--apple-label)] disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {t('gemini.explainAction')}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setProveMode(true);
                void submitQuestion(t('gemini.proofPrompt'), { forceProve: true });
              }}
              className="apple-pressable min-h-[32px] px-2.5 py-1 rounded-[10px] bg-[var(--apple-fill)] hover:bg-[var(--apple-orange)]/15 hover:text-[var(--apple-orange-fg)] text-[11px] font-semibold text-[var(--apple-label)] disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {t('gemini.proofAction')}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => void submitQuestion(t('gemini.pasteImagePrompt'), { wantsImagePaste: true })}
              className="apple-pressable min-h-[32px] px-2.5 py-1 rounded-[10px] bg-[var(--apple-fill)] hover:bg-[var(--apple-blue)]/15 hover:text-[var(--apple-blue-fg)] text-[11px] font-semibold text-[var(--apple-label)] disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {t('gemini.pasteImageAction')}
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                aria-label={t('gemini.clear')}
                onClick={() => {
                  setMessages([]);
                  setPreviewRefImage(null);
                }}
                className="apple-pressable apple-tap-target ml-auto flex items-center justify-center min-h-[32px] min-w-[32px] rounded-full text-[var(--apple-secondary-label)] hover:text-[var(--apple-red-fg)] hover:bg-[var(--apple-red)]/14 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scrollable Messages + Prove Mode In-Frame Reference Images */}
          <div
            ref={scrollRef}
            className="apple-scroll-fade flex-1 overflow-y-auto px-3 py-2.5 space-y-3 text-[13px] min-h-0"
          >
            {messages.length === 0 && (
              <div className="rounded-[16px] bg-[var(--apple-fill)] p-3.5 space-y-1.5 text-[var(--apple-secondary-label)]">
                <div className="font-semibold text-[var(--apple-label)]">
                  {t('gemini.readyTitle')}
                </div>
                <p className="text-[12px] leading-relaxed">{t('gemini.readyBody')}</p>
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
                  className={`max-w-[94%] rounded-[18px] px-3.5 py-2.5 space-y-2 ${
                    msg.role === 'user'
                      ? 'bg-[var(--apple-blue)] text-white font-medium'
                      : msg.error
                      ? 'bg-[var(--apple-red)]/12 text-[var(--apple-red-fg)]'
                      : 'bg-[var(--apple-bg-tertiary)] border border-[var(--apple-separator)] text-[var(--apple-label)]'
                  }`}
                >
                  {msg.role === 'model' && !msg.error && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--apple-secondary-label)]">
                      <span>{msg.proveMode ? t('gemini.proof') : 'Gemini'}</span>
                      {msg.fromCache && (
                        <span className="text-[var(--apple-green-fg)]">
                          · {t('gemini.cached')}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5 break-words">{renderFormattedLines(msg.text)}</div>

                  {msg.pastedTitle && (
                    <div
                      data-testid="gemini-auto-pasted-badge"
                      className="flex items-center gap-1.5 rounded-[10px] bg-[var(--apple-green)]/12 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--apple-green-fg)]"
                    >
                      <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                      <span>{t('gemini.copiedToSlide', { title: msg.pastedTitle })}</span>
                    </div>
                  )}

                  {msg.referenceImages && msg.referenceImages.length > 0 && (
                    <div
                      data-testid="gemini-prove-gallery"
                      className="pt-2 apple-hairline-t space-y-2"
                    >
                      <div className="text-[11px] font-semibold text-[var(--apple-orange-fg)]">
                        {t('gemini.referenceGallery', { count: msg.referenceImages.length })}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {msg.referenceImages.map((refImg, idx) => (
                          <div
                            key={`${refImg.thumbUrl}-${idx}`}
                            className="rounded-[12px] border border-[var(--apple-separator)] bg-[var(--apple-bg-secondary)] overflow-hidden flex flex-col"
                          >
                            <button
                              type="button"
                              onClick={() => setPreviewRefImage(refImg)}
                              className="relative h-20 w-full bg-[var(--apple-fill)] overflow-hidden cursor-pointer"
                              title={t('google.openNewTab')}
                            >
                              <img
                                src={refImg.proxyUrl}
                                alt={refImg.title}
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <div className="p-2 space-y-1.5">
                              <div className="text-[11px] font-semibold line-clamp-1 text-[var(--apple-label)]">
                                {refImg.title}
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <a
                                  href={refImg.pageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[var(--apple-blue-fg)] hover:underline"
                                >
                                  <span>{t('common.source')}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <button
                                  type="button"
                                  data-testid="gemini-prove-paste-btn"
                                  disabled={pastingUrl === refImg.proxyUrl}
                                  onClick={() => void handlePasteReferenceImage(refImg)}
                                  className="apple-pressable inline-flex items-center gap-0.5 px-2 py-1 rounded-[8px] bg-[var(--apple-blue)] text-white text-[10px] font-semibold cursor-pointer"
                                >
                                  <ImagePlus className="w-2.5 h-2.5" />
                                  <span>{pastingUrl === refImg.proxyUrl ? '…' : t('image.paste')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 apple-hairline-t space-y-1">
                      <div className="text-[11px] font-semibold text-[var(--apple-secondary-label)]">
                        {t('common.source')}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={`${src.url}-${sIdx}`}
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-[8px] bg-[var(--apple-fill)] px-2 py-1 text-[11px] font-medium text-[var(--apple-blue-fg)] hover:underline max-w-full truncate"
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
              <div className="flex items-center gap-2 text-[12px] text-[var(--apple-secondary-label)] px-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--apple-blue)]" />
                <span>{t('gemini.loading')}</span>
              </div>
            )}
          </div>

          {/* In-frame larger preview modal for Prove Mode reference image */}
          {previewRefImage && (
            <div className="mx-3 mb-2 rounded-[16px] border border-[var(--apple-separator)] bg-[var(--apple-fill)] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold truncate">{previewRefImage.title}</span>
                <button
                  type="button"
                  onClick={() => setPreviewRefImage(null)}
                  aria-label={t('gemini.closePreview')}
                  className="apple-pressable flex items-center justify-center w-7 h-7 rounded-full hover:bg-[var(--apple-fill-hover)] text-[var(--apple-secondary-label)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <img
                src={previewRefImage.proxyUrl}
                alt={previewRefImage.title}
                className="w-full max-h-40 object-contain rounded-[10px] bg-[var(--apple-bg-tertiary)]"
              />
              <p className="text-[11px] text-[var(--apple-secondary-label)]">
                {previewRefImage.description}
              </p>
            </div>
          )}

          {/* Input Bar (12px padding -> 14px concentric radius) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitQuestion(input);
            }}
            className="p-3 apple-hairline-t flex items-end gap-2 rounded-b-[26px]"
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
              placeholder={proveMode ? t('gemini.inputProof') : t('gemini.input')}
              className="flex-1 rounded-[14px] border border-[var(--apple-separator)] bg-[var(--apple-bg-tertiary)] px-3 py-2 text-[13px] text-[var(--apple-label)] placeholder-[var(--apple-tertiary-label)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-blue)] resize-none"
            />
            <button
              type="submit"
              data-testid="gemini-send-button"
              disabled={loading || !input.trim()}
              aria-label={t('gemini.send')}
              className="apple-pressable apple-tap-target shrink-0 w-10 h-10 rounded-[14px] bg-[var(--apple-blue)] disabled:opacity-35 text-white flex items-center justify-center shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4 translate-x-[0.5px] -translate-y-[0.5px]" />
            </button>
          </form>

          {/* 4 Circular Corner Resize Handles */}
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
              className={`apple-pressable apple-touch-halo touch-none absolute z-30 w-3.5 h-3.5 bg-white dark:bg-[#2C2C2E] border-2 border-[var(--apple-blue)] rounded-full shadow-md ${cls}`}
            />
          ))}
        </>
      )}
    </section>
  );
};
