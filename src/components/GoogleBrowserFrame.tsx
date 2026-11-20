import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  ExternalLink,
  Globe,
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
  buildGoogleSlideAiPrompt,
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
  slideContainerRef?: React.RefObject<HTMLDivElement | null>;
  permanentStrokes?: PenStroke[];
  tempStrokes?: PenStroke[];
  textEdits?: Record<string, string>;
  slideImages?: SlideImageItem[];
  slideTexts?: SlideTextItem[];
  onShowToast?: (msg: string) => void;
}

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

const GOOGLE_HOME_URL = 'https://www.google.com/webhp?igu=1&hl=ms&gl=my';
const GEMINI_URL = 'https://gemini.google.com/app';

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

async function copyPlainText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy copy path for restricted contexts.
    }
  }
  if (typeof document === 'undefined') return false;
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'true');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export const GoogleBrowserFrame: React.FC<GoogleBrowserFrameProps> = ({
  open,
  mode,
  onClose,
  slideIndex,
  interactions,
  slideContainerRef,
  permanentStrokes = [],
  tempStrokes = [],
  textEdits = {},
  slideImages = [],
  slideTexts = [],
  onShowToast,
}) => {
  const [frameRect, setFrameRect] = useState<FloatingFrameRect>(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
    const initialWidth = Math.min(620, Math.max(340, vw - 48));
    const initialHeight = Math.min(600, Math.max(380, vh - 96));
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
  const [currentUrl, setCurrentUrl] = useState(GOOGLE_HOME_URL);
  const [iframeKey, setIframeKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const onShowToastRef = useRef(onShowToast);
  onShowToastRef.current = onShowToast;

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
        slideTexts,
      }),
    [slideIndex, interactions, permanentStrokes, tempStrokes, textEdits, slideImages, slideTexts],
  );
  const digestRef = useRef(digest);
  digestRef.current = digest;

  const readVisibleSlideText = useCallback((): string => {
    const el = slideContainerRef?.current;
    if (!el) return '';
    return (el.innerText || el.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2600);
  }, [slideContainerRef]);

  const runSlideAiSearch = useCallback(
    async (options?: { silent?: boolean }) => {
      const visibleText = readVisibleSlideText();
      const { query, prompt } = buildGoogleSlideAiPrompt(digestRef.current, visibleText);
      const searchUrl = `https://www.google.com/search?igu=1&hl=ms&gl=my&udm=50&q=${encodeURIComponent(query)}`;
      setCurrentUrl(searchUrl);
      setUrlInput(query);
      setIframeKey((k) => k + 1);

      const copied = await copyPlainText(prompt);
      if (!options?.silent) {
        onShowToastRef.current?.(
          copied
            ? '📋 Prompt slaid disalin + Google AI dibuka dengan konteks slaid semasa. Anda juga boleh tampal ke Gemini (Ctrl+V).'
            : 'Google AI dibuka dengan konteks slaid. Papan klip tidak dibenarkan — salin manual jika perlu.',
        );
      }
    },
    [readVisibleSlideText],
  );

  // Configure the real Google website whenever the frame opens or the mode/slide changes.
  useEffect(() => {
    if (!open) return;

    if (mode === 'google-ai') {
      void runSlideAiSearch();
    } else {
      setCurrentUrl(GOOGLE_HOME_URL);
      setUrlInput('');
      setIframeKey((k) => k + 1);
    }
  }, [open, mode, slideIndex, runSlideAiSearch]);

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
        const minW = 340;
        const minH = 300;
        let { x, y, width, height } = act.startRect;

        if (act.corner === 'se') {
          width = Math.max(minW, act.startRect.width + dx);
          height = Math.max(minH, act.startRect.height + dy);
        } else if (act.corner === 'sw') {
          width = Math.max(minW, act.startRect.width - dx);
          height = Math.max(minH, act.startRect.height + dy);
          x = act.startRect.x + act.startRect.width - width;
        } else if (act.corner === 'ne') {
          width = Math.max(minW, act.startRect.width + dx);
          height = Math.max(minH, act.startRect.height - dy);
          y = act.startRect.y + act.startRect.height - height;
        } else if (act.corner === 'nw') {
          width = Math.max(minW, act.startRect.width - dx);
          height = Math.max(minH, act.startRect.height - dy);
          x = act.startRect.x + act.startRect.width - width;
          y = act.startRect.y + act.startRect.height - height;
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
    if ((e.target as HTMLElement).closest('button, input, a, form')) return;
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
      setCurrentUrl(
        `https://www.google.com/search?igu=1&hl=ms&gl=my&q=${encodeURIComponent(q)}`,
      );
    }
    setIframeKey((k) => k + 1);
  };

  const copyPromptAgain = async () => {
    const visibleText = readVisibleSlideText();
    const { prompt } = buildGoogleSlideAiPrompt(digestRef.current, visibleText);
    const ok = await copyPlainText(prompt);
    onShowToastRef.current?.(
      ok
        ? '📋 Konteks & prompt slaid disalin ke papan klip. Tampal ke Google AI atau Gemini.'
        : 'Papan klip tidak dibenarkan oleh pelayar ini.',
    );
  };

  const goHome = () => {
    setCurrentUrl(GOOGLE_HOME_URL);
    setUrlInput('');
    setIframeKey((k) => k + 1);
  };

  if (!open) return null;

  const isAiMode = mode === 'google-ai';

  return (
    <div
      data-testid="google-browser-frame"
      data-google-mode={mode}
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
          {isAiMode && <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
          <span className="text-xs font-bold truncate">
            {isAiMode ? 'Google AI · Slaid Semasa' : 'Google'}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-stone-500 dark:text-stone-400 truncate">
            · Slaid {digest.currentSlideNumber} ({digest.currentSlideTitle.slice(0, 24)})
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isAiMode && (
            <button
              type="button"
              onClick={() => void runSlideAiSearch()}
              title="Jana semula carian AI dengan konteks slaid terkini & salin prompt"
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Konteks Terkini</span>
            </button>
          )}

          {isAiMode && (
            <button
              type="button"
              onClick={() => void copyPromptAgain()}
              title="Salin prompt penuh + konteks slaid ke papan klip"
              className="p-1 rounded-lg text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            title="Buka halaman Google ini di tab pelayar baharu"
            className="p-1 rounded-lg text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer inline-flex items-center"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {isAiMode && (
            <a
              href={GEMINI_URL}
              target="_blank"
              rel="noreferrer"
              title="Gemini tidak boleh dibenamkan. Prompt slaid telah disalin — buka Gemini dan tekan Ctrl+V."
              className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold hover:opacity-90 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3 h-3" />
              <span>Gemini</span>
            </a>
          )}

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
              onClick={goHome}
              className="p-1 rounded-lg text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              title="Muat semula laman Google"
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
                  placeholder="Cari di Google atau taip URL..."
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

            {isAiMode && (
              <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                <Globe className="w-3 h-3" />
                Google AI
              </span>
            )}
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
              title="Google"
              className="w-full h-full border-0 bg-white"
              allow="clipboard-read; clipboard-write; microphone; camera; geolocation; fullscreen"
              referrerPolicy="no-referrer-when-downgrade"
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
