import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileUp,
  Loader2,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  CachedPdfMeta,
  PdfSource,
  RenderedPdfPage,
  RoomPdfLibraryItem,
  RoomPdfLibraryPage,
  listCachedPdfs,
  renderPdfPage,
  resolveCachedPdf,
  resolvePdfFile,
} from '../utils/pdfUtils';
import { useUiText } from '../utils/uiLanguage';

export interface PdfFrameAddInput {
  fileName: string;
  pageNumber: number;
  pageCount: number;
  dataUrl: string;
  renderedWidth: number;
  renderedHeight: number;
}

interface PdfFrameDialogProps {
  open: boolean;
  onClose: () => void;
  onAddFrame: (input: PdfFrameAddInput) => void | Promise<void>;
  /** PDFs already added to this room by anyone, with their stored pages. */
  library: RoomPdfLibraryItem[];
}

export const PdfFrameDialog: React.FC<PdfFrameDialogProps> = ({
  open,
  onClose,
  onAddFrame,
  library,
}) => {
  const t = useUiText();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [recent, setRecent] = useState<CachedPdfMeta[]>([]);
  const [source, setSource] = useState<PdfSource | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [preview, setPreview] = useState<RenderedPdfPage | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reused, setReused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [libraryFileName, setLibraryFileName] = useState<string | null>(null);
  const previewTokenRef = useRef(0);

  // Derived from the live room library so the page list always reflects the
  // latest pages other teammates may have added while the dialog is open.
  const libraryFile =
    library.find((item) => item.fileName === libraryFileName) ?? null;

  const refreshRecent = useCallback(async () => {
    try {
      setRecent((await listCachedPdfs()).slice(0, 6));
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSource(null);
    setPreview(null);
    setError(null);
    setBusy(false);
    setReused(false);
    setLibraryFileName(null);
    setPageNumber(1);
    setPageInput('1');
    void refreshRecent();
  }, [open, refreshRecent]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [busy, onClose, open]);

  useEffect(() => {
    if (!open || !source) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }
    const token = ++previewTokenRef.current;
    setPreviewLoading(true);
    const timer = window.setTimeout(() => {
      void renderPdfPage(source, pageNumber, {
        maxDimension: 620,
        maxDataUrlLength: 900_000,
      })
        .then((rendered) => {
          if (previewTokenRef.current !== token) return;
          setPreview(rendered);
          setError(null);
        })
        .catch((err: unknown) => {
          if (previewTokenRef.current !== token) return;
          setPreview(null);
          setError(err instanceof Error ? err.message : t('pdf.error'));
        })
        .finally(() => {
          if (previewTokenRef.current === token) setPreviewLoading(false);
        });
    }, 120);
    return () => {
      window.clearTimeout(timer);
    };
  }, [open, pageNumber, source, t]);

  const applySource = useCallback((next: PdfSource, wasReused: boolean) => {
    setSource(next);
    setPageNumber(1);
    setPageInput('1');
    setPreview(null);
    setError(null);
    setReused(wasReused);
  }, []);

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      setBusy(true);
      setError(null);
      try {
        const resolved = await resolvePdfFile(file);
        applySource(resolved.source, resolved.reused);
        void refreshRecent();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('pdf.error'));
      } finally {
        setBusy(false);
      }
    },
    [applySource, refreshRecent, t],
  );

  const handlePickCached = useCallback(
    async (meta: CachedPdfMeta) => {
      setBusy(true);
      setError(null);
      try {
        const cached = await resolveCachedPdf(meta.key);
        if (!cached) {
          setError(t('pdf.cacheMissing'));
          void refreshRecent();
          return;
        }
        applySource(cached, true);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('pdf.error'));
      } finally {
        setBusy(false);
      }
    },
    [applySource, refreshRecent, t],
  );

  const clampPage = useCallback(
    (value: number) => {
      const count = source?.pageCount ?? 1;
      return Math.max(1, Math.min(count, Number.isFinite(value) ? Math.trunc(value) : 1));
    },
    [source?.pageCount],
  );

  const changePage = useCallback(
    (next: number) => {
      const safe = clampPage(next);
      setPageNumber(safe);
      setPageInput(String(safe));
    },
    [clampPage],
  );

  const handleConfirm = useCallback(async () => {
    if (!source || busy) return;
    setBusy(true);
    setError(null);
    try {
      const rendered = await renderPdfPage(source, pageNumber);
      await onAddFrame({
        fileName: source.fileName,
        pageNumber,
        pageCount: source.pageCount,
        dataUrl: rendered.dataUrl,
        renderedWidth: rendered.width,
        renderedHeight: rendered.height,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pdf.error'));
    } finally {
      setBusy(false);
    }
  }, [busy, onAddFrame, onClose, pageNumber, source, t]);

  // Adds a page that is already stored in the room — no upload, no rendering.
  const handlePickLibraryPage = useCallback(
    async (file: RoomPdfLibraryItem, page: RoomPdfLibraryPage) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      try {
        await onAddFrame({
          fileName: file.fileName,
          pageNumber: page.pageNumber,
          pageCount: file.pageCount,
          dataUrl: page.dataUrl,
          renderedWidth: page.width,
          renderedHeight: page.height,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('pdf.error'));
      } finally {
        setBusy(false);
      }
    },
    [busy, onAddFrame, onClose, t],
  );

  if (!open) return null;

  const pageCount = source?.pageCount ?? 0;

  return (
    <div
      data-testid="pdf-frame-dialog"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/55 backdrop-blur-sm p-3 sm:p-6"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-dialog-title"
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-stone-200 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-900 shadow-2xl text-stone-900 dark:text-stone-100"
      >
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-700 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">
              <FileText className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 id="pdf-dialog-title" className="text-sm font-extrabold truncate">
                {source ? t('pdf.choosePage') : t('pdf.title')}
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                {source ? source.fileName : t('pdf.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!source ? (
          libraryFile ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  data-testid="pdf-library-back"
                  onClick={() => {
                    setLibraryFileName(null);
                    setError(null);
                  }}
                  disabled={busy}
                  className="flex items-center gap-1 rounded-lg border border-stone-300 dark:border-stone-700 px-2 py-1 text-[11px] font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('pdf.backToFiles')}</span>
                </button>
                <span className="min-w-0 truncate text-[11px] font-bold text-stone-600 dark:text-stone-300">
                  {libraryFile.fileName}
                </span>
              </div>

              <p className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                {t('pdf.pickPageHint')}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[52vh] overflow-y-auto pr-0.5">
                {libraryFile.pages.map((page) => (
                  <button
                    key={page.pageNumber}
                    type="button"
                    data-testid="pdf-library-page"
                    disabled={busy}
                    onClick={() => void handlePickLibraryPage(libraryFile, page)}
                    className="flex flex-col items-center gap-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950/40 p-1.5 hover:border-red-400 hover:bg-white dark:hover:bg-stone-800/80 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <img
                      src={page.dataUrl}
                      alt={t('pdf.frameAlt', {
                        name: libraryFile.fileName,
                        page: page.pageNumber,
                        count: libraryFile.pageCount,
                      })}
                      draggable={false}
                      className="w-full h-auto max-h-[160px] object-contain rounded-lg border border-stone-200 dark:border-stone-700"
                    />
                    <span className="text-[10px] font-extrabold text-stone-600 dark:text-stone-300">
                      {t('pdf.pageN', { page: page.pageNumber })}
                    </span>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-[11px] leading-snug text-amber-900 dark:text-amber-200">
                {t('pdf.fixedHint')}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <input
                ref={fileInputRef}
                data-testid="pdf-file-input"
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  void handleFile(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                data-testid="pdf-upload-button"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  void handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`w-full rounded-2xl border-2 border-dashed px-4 py-8 flex flex-col items-center gap-2 transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-red-500 bg-red-50/80 dark:bg-red-950/30'
                    : 'border-stone-300 dark:border-stone-600 hover:border-red-400 hover:bg-white/70 dark:hover:bg-stone-800/60'
                } disabled:opacity-60`}
              >
                {busy ? (
                  <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                ) : (
                  <FileUp className="w-8 h-8 text-red-700 dark:text-red-300" />
                )}
                <span className="text-sm font-extrabold">{t('pdf.upload')}</span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 text-center">
                  {t('pdf.uploadHint')}
                </span>
              </button>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                    {t('pdf.recent')}
                  </span>
                  <button
                    type="button"
                    onClick={() => void refreshRecent()}
                    className="flex items-center gap-1 text-[11px] font-bold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t('pdf.refreshList')}</span>
                  </button>
                </div>
                {recent.length === 0 ? (
                  <p className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-950/40 px-3 py-2.5 text-[11px] text-stone-500 dark:text-stone-400">
                    {t('pdf.noRecent')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recent.map((meta) => (
                      <button
                        key={meta.key}
                        type="button"
                        data-testid="pdf-recent-item"
                        disabled={busy}
                        onClick={() => void handlePickCached(meta)}
                        className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-950/40 px-3 py-2 text-left hover:border-red-400 hover:bg-white dark:hover:bg-stone-800/70 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 shrink-0 text-red-700 dark:text-red-300" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold truncate">{meta.fileName}</span>
                          <span className="block text-[10px] text-stone-500">
                            {t('pdf.pageCount', { count: meta.pageCount })}
                          </span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                    {t('pdf.roomFiles')}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-400">
                    {t('pdf.roomFilesShared')}
                  </span>
                </div>
                {library.length === 0 ? (
                  <p className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-950/40 px-3 py-2.5 text-[11px] text-stone-500 dark:text-stone-400">
                    {t('pdf.noRoomFiles')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {library.map((file) => (
                      <button
                        key={file.fileName}
                        type="button"
                        data-testid="pdf-library-item"
                        disabled={busy}
                        onClick={() => {
                          setLibraryFileName(file.fileName);
                          setError(null);
                        }}
                        className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-950/40 px-3 py-2 text-left hover:border-red-400 hover:bg-white dark:hover:bg-stone-800/70 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 shrink-0 text-red-700 dark:text-red-300" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold truncate">{file.fileName}</span>
                          <span className="block text-[10px] text-stone-500">
                            {t('pdf.roomPagesAvailable', { count: file.pages.length })}
                          </span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="p-4 space-y-3">
            {reused && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{t('pdf.reused')}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3 items-start">
              <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950/50 p-2 min-h-[260px] flex items-center justify-center overflow-hidden">
                {previewLoading ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-stone-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[11px] font-semibold">{t('pdf.rendering')}</span>
                  </div>
                ) : preview ? (
                  <img
                    data-testid="pdf-page-preview"
                    src={preview.dataUrl}
                    alt={t('pdf.previewAlt', {
                      page: pageNumber,
                      count: pageCount,
                      name: source.fileName,
                    })}
                    draggable={false}
                    className="max-h-[52vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <span className="text-[11px] font-semibold text-stone-500 px-4 text-center">
                    {error ?? t('pdf.previewUnavailable')}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-950/40 p-3 space-y-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                    {t('pdf.page')}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      aria-label={t('pdf.prevPage')}
                      onClick={() => changePage(pageNumber - 1)}
                      disabled={pageNumber <= 1}
                      className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <input
                      data-testid="pdf-page-input"
                      type="number"
                      min={1}
                      max={pageCount}
                      value={pageInput}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setPageInput(raw);
                        const parsed = Number(raw);
                        if (Number.isFinite(parsed) && parsed >= 1 && parsed <= pageCount) {
                          setPageNumber(Math.trunc(parsed));
                        }
                      }}
                      onBlur={() => changePage(Number(pageInput))}
                      className="w-16 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-2 py-1.5 text-center text-sm font-extrabold tabular-nums-clean"
                    />
                    <button
                      type="button"
                      aria-label={t('pdf.nextPage')}
                      onClick={() => changePage(pageNumber + 1)}
                      disabled={pageNumber >= pageCount}
                      className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center text-[11px] font-semibold text-stone-500">
                    {t('pdf.ofPages', { count: pageCount })}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-[11px] leading-snug text-amber-900 dark:text-amber-200">
                  {t('pdf.fixedHint')}
                </div>

                <button
                  type="button"
                  data-testid="pdf-add-frame"
                  onClick={() => void handleConfirm()}
                  disabled={busy || previewLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-60 px-3 py-2.5 text-xs font-extrabold text-white cursor-pointer"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{busy ? t('pdf.adding') : t('pdf.add')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (busy) return;
                    setSource(null);
                    setPreview(null);
                    setError(null);
                    setPageNumber(1);
                    setPageInput('1');
                    void refreshRecent();
                  }}
                  disabled={busy}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 px-3 py-2 text-[11px] font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
                >
                  {t('pdf.changeFile')}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-[11px] font-semibold text-red-800 dark:text-red-300">
                {error}
              </div>
            )}
          </div>
        )}

        {!source && error && (
          <div className="px-4 pb-4">
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-[11px] font-semibold text-red-800 dark:text-red-300">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
