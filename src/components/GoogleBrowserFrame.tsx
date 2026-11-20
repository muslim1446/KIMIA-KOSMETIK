import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  ExternalLink,
  GripHorizontal,
  Home,
  Maximize2,
  Minimize2,
  RotateCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { SharedSlideInteractions } from '../hooks/usePresentationSync';
import {
  PenStroke,
  SlideImageItem,
  SlideTextItem,
} from '../utils/annotationEngine';
import {
  buildPresentationDigest,
  clampFloatingFrameRect,
  FloatingFrameRect,
} from '../utils/presentationContext';

export type GoogleFrameMode = 'google' | 'google-ai';

interface GoogleBrowserFrameProps {
  open: boolean;
  mode: GoogleFrameMode;
  onClose: () => void;
  slideIndex: number;
  interactions: SharedSlideInteractions;
  permanentStrokes?: PenStroke[];
  tempStrokes?: PenStroke[];
  textEdits?: Record<string, string>;
  slideImages?: SlideImageItem[];
  slideTexts?: SlideTextItem[];
  onShowToast?: (msg: string) => void;
}

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

/**
 * Authentic Google 4-Color 'G' Icon Component
 */
export const GoogleLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-label="Google">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.27 21.43 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.1z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
    />
  </svg>
);

export const GoogleBrowserFrame: React.FC<GoogleBrowserFrameProps> = ({
  open,
  mode,
  onClose,
  slideIndex,
  interactions,
  permanentStrokes = [],
  tempStrokes = [],
  textEdits = {},
  slideImages = [],
  onShowToast,
}) => {
  const [frameRect, setFrameRect] = useState<FloatingFrameRect>(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
    const initialWidth = Math.min(580, Math.max(340, vw - 48));
    const initialHeight = Math.min(580, Math.max(400, vh - 96));
    return clampFloatingFrameRect(
      {
        x: Math.max(20, vw - initialWidth - 32),
        y: Math.max(24, Math.round((vh - initialHeight) / 2)),
        width: initialWidth,
        height: initialHeight,
      },
      vw,
      vh,
    );
  });

  const [minimized, setMinimized] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
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

  // Build context-aware search query and AI prompt
  const { smartQuery, fullAiPrompt } = useMemo(() => {
    const topic = digest.currentSlideTitle || 'Kimia Bab 5.4 Ubat dan Kosmetik';
    const sub = digest.currentSubElementLabel || '';
    const q = `Kimia KSSM Tingkatan 5 Bab 5.4: ${topic} ${sub}`.trim();

    const prompt = [
      `Anda ialah Pembantu Pakar Kimia KSSM Tingkatan 5 untuk Bab 5.4 (Ubat dan Kosmetik).`,
      `Konteks Slaid Semasa: Slaid ${digest.currentSlideNumber}/${digest.totalSlides} - ${digest.currentSlideTitle}.`,
      `Sub-Elemen: ${digest.currentSubElementLabel}.`,
      `Kandungan Slaid:\n${digest.currentSlideDetailText}`,
      `Sila terangkan konsep kimia di atas secara mendalam mengikut silibus SPM, nyatakan nama bahan kimia, kegunaan, kesan sampingan dan formula jika ada.`,
    ].join('\n\n');

    return { smartQuery: q, fullAiPrompt: prompt };
  }, [digest]);

  // When frame is opened, configure the appropriate Google URL
  useEffect(() => {
    if (!open) return;

    if (mode === 'google-ai') {
      const searchUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(smartQuery)}`;
      setCurrentUrl(searchUrl);
      setUrlInput(smartQuery);

      // Auto-copy the slide context & prompt to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(fullAiPrompt).then(
          () => {
            onShowToast?.(
              '📋 Konteks & soalan slaid telah disalin! Anda boleh menampal (Ctrl+V) ke dalam carian atau Gemini.',
            );
          },
          () => {
            // Ignore clipboard permission reject
          },
        );
      }
    } else {
      const defaultUrl = 'https://www.google.com/webhp?igu=1';
      setCurrentUrl(defaultUrl);
      setUrlInput('');
    }
  }, [open, mode, smartQuery, fullAiPrompt, onShowToast]);

  // Keep frame inside viewport on window resize
  useEffect(() => {
    const onResize = () => {
      setFrameRect((prev) => clampFloatingFrameRect(prev, window.innerWidth, window.innerHeight));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Drag & 4-corner resize listeners
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
          x = act.startRect.x + (act.startRect.width - Math.max(320, Math.min(1000, width)));
        } else if (act.corner === 'ne') {
          width = act.startRect.width + dx;
          height = act.startRect.height - dy;
          y = act.startRect.y + (act.startRect.height - Math.max(260, Math.min(850, height)));
        } else if (act.corner === 'nw') {
          width = act.startRect.width - dx;
          height = act.startRect.height - dy;
          x = act.startRect.x + (act.startRect.width - Math.max(320, Math.min(1000, width)));
          y = act.startRect.y + (act.startRect.height - Math.max(260, Math.min(850, height)));
        }
        setFrameRect(clampFloatingFrameRect({ x, y, width, height }, vw, vh));
      }
    };

    const onPointerUp = () => {
      actionRef.current = null;
      setIsInteracting(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a')) return;
    e.preventDefault();
    setIsInteracting(true);
    actionRef.current = {
      type: 'drag',
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: frameRect,
    };
  };

  const startResize = (corner: ResizeCorner, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsInteracting(true);
    actionRef.current = {
      type: 'resize',
      corner,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: frameRect,
    };
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = urlInput.trim();
    if (!q) return;

    if (q.startsWith('http://') || q.startsWith('https://')) {
      setCurrentUrl(q);
    } else {
      setCurrentUrl(`https://www.google.com/search?igu=1&q=${encodeURIComponent(q)}`);
    }
  };

  const copyPromptAgain = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullAiPrompt).then(() => {
        onShowToast?.('📋 Konteks & soalan slaid disalin ke papan klip!');
      });
    }
  };

  if (!open) return null;

  return (
    <div
      data-testid="google-browser-frame"
      style={{
        left: `${frameRect.x}px`,
        top: `${frameRect.y}px`,
        width: `${frameRect.width}px`,
        height: minimized ? 'auto' : `${frameRect.height}px`,
      }}
      className="fixed z-40 flex flex-col rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl text-stone-900 dark:text-stone-100 select-none overflow-hidden"
    >
      {/* ── Titlebar & Controls ───────────────────────────────────────────── */}
      <div
        data-testid="google-drag-handle"
        onPointerDown={startDrag}
        onDoubleClick={() => setMinimized((m) => !m)}
        title="Seret untuk alihkan bingkai Google"
        className="flex items-center justify-between gap-1.5 px-3 py-2 border-b border-stone-200 dark:border-stone-800 bg-[#FBF9F5] dark:bg-stone-950 cursor-grab active:cursor-grabbing shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-4 h-4 text-stone-400 shrink-0" />
          <GoogleLogoIcon className="w-4 h-4 shrink-0" />
          {mode === 'google-ai' && (
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-bold truncate">
            {mode === 'google-ai' ? 'Google AI & Gemini' : 'Google'}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-stone-500 dark:text-stone-400 truncate">
            · Slaid {digest.currentSlideNumber} ({digest.currentSlideTitle.slice(0, 24)})
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {mode === 'google-ai' && (
            <button
              type="button"
              onClick={copyPromptAgain}
              title="Salin semula konteks & soalan slaid ke papan klip"
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Salin Konteks</span>
            </button>
          )}

          <a
            href={
              mode === 'google-ai'
                ? `https://www.google.com/search?q=${encodeURIComponent(smartQuery)}`
                : 'https://www.google.com'
            }
            target="_blank"
            rel="noreferrer"
            title="Buka carian ini di tab pelayar baharu"
            className="p-1 rounded-lg text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer inline-flex items-center"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            aria-label={minimized ? 'Besarkan bingkai' : 'Kecilkan bingkai'}
            onClick={() => setMinimized((m) => !m)}
            className="p-1 rounded-lg text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
          >
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            aria-label="Tutup bingkai Google"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* ── Browser Address / Search Bar ───────────────────────────────── */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 text-xs shrink-0">
            <button
              type="button"
              title="Kembali ke Laman Utama Google"
              onClick={() => {
                setCurrentUrl('https://www.google.com/webhp?igu=1');
                setUrlInput('');
              }}
              className="p-1 rounded-lg text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              title="Muat semula (Refresh)"
              onClick={() => setIframeKey((k) => k + 1)}
              className="p-1 rounded-lg text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center min-w-0">
              <div className="relative w-full flex items-center">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2 pointer-events-none" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Cari di Google atau taip kata kunci kimia..."
                  className="w-full pl-7 pr-12 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-blue-500 select-text"
                />
                <button
                  type="submit"
                  className="absolute right-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Cari
                </button>
              </div>
            </form>

            <a
              href="https://gemini.google.com"
              target="_blank"
              rel="noreferrer"
              title="Buka Gemini AI secara langsung (Konteks slaid telah disalin, hanya tekan Ctrl+V)"
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold hover:opacity-90 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3 h-3" />
              <span>Gemini Web</span>
            </a>
          </div>

          {/* ── Real Google Website Iframe Container ───────────────────────── */}
          <div className="relative flex-1 w-full h-full bg-white overflow-hidden">
            {/* Transparent overlay during drag/resize to prevent iframe from intercepting mouse pointer */}
            {isInteracting && (
              <div className="absolute inset-0 z-50 bg-transparent pointer-events-auto" />
            )}

            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={currentUrl}
              title="Google Search"
              className="w-full h-full border-0 bg-white"
              allow="clipboard-read; clipboard-write; microphone; camera"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
            />
          </div>

          {/* ── 4-Corner Resize Handles ────────────────────────────────────── */}
          <div
            onPointerDown={(e) => startResize('se', e)}
            title="Tarik untuk ubah saiz bingkai"
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-30"
          >
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r-2 border-b-2 border-stone-400/80 rounded-br-sm" />
          </div>
          <div
            onPointerDown={(e) => startResize('sw', e)}
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30"
          />
          <div
            onPointerDown={(e) => startResize('ne', e)}
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30"
          />
          <div
            onPointerDown={(e) => startResize('nw', e)}
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30"
          />
        </>
      )}
    </div>
  );
};
