import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
import { APPLE_SPRINGS } from '../utils/applePhysics';
import {
  CachedPdfMeta,
  PdfSource,
  RenderedPdfPage,
  RoomPdfEntry,
  RoomPdfLibraryPage,
  importPdfSourceFromStorage,
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
  /** Every PDF in this room (originals in Storage + already-rendered pages). */
  entries: RoomPdfEntry[];
  /** Publishes the original PDF to Firebase Storage so all devices can reuse it. */
  onPublishPdf: (file: File, source: PdfSource) => void | Promise<void>;
}

export const PdfFrameDialog: React.FC<PdfFrameDialogProps> = ({
  open,
  onClose,
  onAddFrame,
  entries,
  onPublishPdf,
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

  const libraryFile = entries.find((item) => item.fileName === libraryFileName) ?? null;

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
        if (!resolved.reused) void onPublishPdf(file, resolved.source);
        void refreshRecent();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('pdf.error'));
      } finally {
        setBusy(false);
      }
    },
    [applySource, onPublishPdf, refreshRecent, t],
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

  const handlePickLibraryEntry = useCallback(
    async (entry: RoomPdfEntry) => {
      setError(null);
      if (!entry.storagePath) {
        setLibraryFileName(entry.fileName);
        return;
      }
      setBusy(true);
      try {
        const resolved = await importPdfSourceFromStorage(
          entry.fileName,
          entry.storagePath,
          entry.pageCount,
        );
        applySource(resolved, true);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('pdf.error'));
      } finally {
        setBusy(false);
      }
    },
    [applySource, t],
  );

  const handlePickLibraryPage = useCallback(
    async (file: RoomPdfEntry, page: RoomPdfLibraryPage) => {
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

  const pageCount = source?.pageCount ?? 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pdf-backdrop"
          data-testid="pdf-frame-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="apple-ui fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-md p-3 sm:p-6"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget && !busy) onClose();
          }}
        >
          {/* Apple Sheet: 28px continuous squircle, 16px/20px padding -> 12px/16px concentric inner shapes */}
          <motion.div
            key="pdf-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-dialog-title"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={APPLE_SPRINGS.sheet}
            className="apple-sheet apple-squircle w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[28px] text-[var(--apple-label)]"
          >
            {/* Sticky Frosted Sheet Header + Progressive Variable Edge Feather */}
            <div className="sticky top-0 z-10 backdrop-blur-md bg-[var(--apple-glass-sheet-bg)] flex items-center justify-between gap-3 apple-hairline-b px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-[var(--apple-red)]/12 text-[var(--apple-red-fg)] shrink-0">
                  <FileText className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="pdf-dialog-title"
                    className="text-[16px] font-semibold tracking-[-0.015em] truncate"
                  >
                    {source ? t('pdf.choosePage') : t('pdf.title')}
                  </h2>
                  <p className="text-[12px] text-[var(--apple-secondary-label)] truncate">
                    {source ? source.fileName : t('pdf.subtitle')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label={t('common.close')}
                onClick={onClose}
                disabled={busy}
                className="apple-pressable apple-tap-target flex h-9 w-9 min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-[var(--apple-fill)] hover:bg-[var(--apple-fill-hover)] text-[var(--apple-secondary-label)] hover:text-[var(--apple-label)] disabled:opacity-40 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div aria-hidden="true" className="apple-variable-blur-top pointer-events-none sticky top-[73px] z-[9] h-3 -mb-3 w-full" />

            {!source ? (
              libraryFile ? (
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      data-testid="pdf-library-back"
                      onClick={() => {
                        setLibraryFileName(null);
                        setError(null);
                      }}
                      disabled={busy}
                      className="apple-pressable apple-tap-target min-h-[40px] flex items-center gap-1.5 rounded-[12px] bg-[var(--apple-fill)] hover:bg-[var(--apple-fill-hover)] px-3 py-1.5 text-[12px] font-semibold text-[var(--apple-label)] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 -translate-x-[0.5px]" />
                      <span>{t('pdf.backToFiles')}</span>
                    </button>
                    <span className="min-w-0 truncate text-[12px] font-semibold text-[var(--apple-secondary-label)]">
                      {libraryFile.fileName}
                    </span>
                  </div>

                  <p className="apple-readable-width rounded-[14px] bg-[var(--apple-green)]/12 px-3.5 py-2.5 text-[12px] font-medium text-[var(--apple-green-fg)]">
                    {t('pdf.pickPageHint')}
                  </p>

                  <div className="apple-scroll-fade grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[52vh] overflow-y-auto pr-0.5 py-1">
                    {libraryFile.pages.map((page) => (
                      <button
                        key={page.pageNumber}
                        type="button"
                        data-testid="pdf-library-page"
                        disabled={busy}
                        onClick={() => void handlePickLibraryPage(libraryFile, page)}
                        className="apple-pressable flex flex-col items-center gap-1.5 rounded-[16px] border border-[var(--apple-separator)] bg-[var(--apple-bg-tertiary)] p-2 hover:border-[var(--apple-blue)] transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <img
                          src={page.dataUrl}
                          alt={t('pdf.frameAlt', {
                            name: libraryFile.fileName,
                            page: page.pageNumber,
                            count: libraryFile.pageCount,
                          })}
                          draggable={false}
                          className="w-full h-auto max-h-[160px] object-contain rounded-[8px] border border-[var(--apple-separator)]"
                        />
                        <span className="text-[11px] font-semibold text-[var(--apple-secondary-label)] tabular-nums-clean">
                          {t('pdf.pageN', { page: page.pageNumber })}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-[14px] bg-[var(--apple-orange)]/12 px-3.5 py-2.5 text-[12px] leading-snug text-[var(--apple-orange-fg)]">
                    {t('pdf.fixedHint')}
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-4">
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
                    className={`apple-pressable w-full rounded-[16px] border-2 border-dashed px-5 py-8 flex flex-col items-center gap-2 transition-colors cursor-pointer ${
                      dragOver
                        ? 'border-[var(--apple-blue)] bg-[var(--apple-blue)]/8'
                        : 'border-[var(--apple-separator)] bg-[var(--apple-fill)] hover:border-[var(--apple-blue)]/70 hover:bg-[var(--apple-fill-hover)]'
                    } disabled:opacity-60`}
                  >
                    {busy ? (
                      <Loader2 className="w-8 h-8 text-[var(--apple-blue)] animate-spin" />
                    ) : (
                      <FileUp className="w-8 h-8 text-[var(--apple-blue-fg)]" />
                    )}
                    <span className="text-[14px] font-semibold">{t('pdf.upload')}</span>
                    <span className="apple-readable-width text-[12px] text-[var(--apple-secondary-label)] text-center max-w-md">
                      {t('pdf.uploadHint')}
                    </span>
                  </button>

                  {/* Recent PDFs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-[var(--apple-secondary-label)]">
                        {t('pdf.recent')}
                      </span>
                      <button
                        type="button"
                        onClick={() => void refreshRecent()}
                        className="apple-pressable apple-tap-target min-h-[32px] flex items-center gap-1.5 px-2 rounded-[8px] text-[12px] font-semibold text-[var(--apple-blue-fg)] hover:bg-[var(--apple-fill)] cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t('pdf.refreshList')}</span>
                      </button>
                    </div>
                    {recent.length === 0 ? (
                      <p className="rounded-[14px] bg-[var(--apple-fill)] px-3.5 py-2.5 text-[12px] text-[var(--apple-secondary-label)]">
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
                            className="apple-pressable min-h-[48px] flex items-center gap-2.5 rounded-[14px] border border-[var(--apple-separator)] bg-[var(--apple-bg-tertiary)] px-3 py-2 text-left hover:border-[var(--apple-blue)] disabled:opacity-50 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 shrink-0 text-[var(--apple-red-fg)]" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-semibold truncate">
                                {meta.fileName}
                              </span>
                              <span className="block text-[11px] text-[var(--apple-secondary-label)] tabular-nums-clean">
                                {t('pdf.pageCount', { count: meta.pageCount })}
                              </span>
                            </span>
                            <ChevronRight className="w-4 h-4 shrink-0 text-[var(--apple-tertiary-label)] translate-x-[0.5px]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Shared Room PDFs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-[var(--apple-secondary-label)]">
                        {t('pdf.roomFiles')}
                      </span>
                      <span className="text-[11px] text-[var(--apple-tertiary-label)]">
                        {t('pdf.roomFilesShared')}
                      </span>
                    </div>
                    {entries.length === 0 ? (
                      <p className="rounded-[14px] bg-[var(--apple-fill)] px-3.5 py-2.5 text-[12px] text-[var(--apple-secondary-label)]">
                        {t('pdf.noRoomFiles')}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {entries.map((file) => (
                          <button
                            key={file.fileName}
                            type="button"
                            data-testid="pdf-library-item"
                            disabled={busy}
                            onClick={() => void handlePickLibraryEntry(file)}
                            className="apple-pressable min-h-[48px] flex items-center gap-2.5 rounded-[14px] border border-[var(--apple-separator)] bg-[var(--apple-bg-tertiary)] px-3 py-2 text-left hover:border-[var(--apple-blue)] disabled:opacity-50 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 shrink-0 text-[var(--apple-red-fg)]" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-semibold truncate">
                                {file.fileName}
                              </span>
                              <span className="block text-[11px] text-[var(--apple-secondary-label)] tabular-nums-clean">
                                {file.storagePath
                                  ? t('pdf.anyPageAvailable', { count: file.pageCount })
                                  : t('pdf.roomPagesAvailable', { count: file.pages.length })}
                              </span>
                            </span>
                            {busy ? (
                              <Loader2 className="w-4 h-4 shrink-0 text-[var(--apple-tertiary-label)] animate-spin" />
                            ) : (
                              <ChevronRight className="w-4 h-4 shrink-0 text-[var(--apple-tertiary-label)] translate-x-[0.5px]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="p-5 space-y-3.5">
                {reused && (
                  <div className="flex items-start gap-2 rounded-[14px] bg-[var(--apple-green)]/12 px-3.5 py-2.5 text-[12px] font-medium text-[var(--apple-green-fg)]">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{t('pdf.reused')}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_232px] gap-3.5 items-start">
                  <div className="rounded-[18px] border border-[var(--apple-separator)] bg-[var(--apple-bg-tertiary)] p-2.5 min-h-[260px] flex items-center justify-center overflow-hidden">
                    {previewLoading ? (
                      <div className="flex flex-col items-center gap-2 py-10 text-[var(--apple-secondary-label)]">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--apple-blue)]" />
                        <span className="text-[12px] font-medium">{t('pdf.rendering')}</span>
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
                        className="max-h-[52vh] w-auto max-w-full object-contain rounded-[10px] shadow-sm"
                      />
                    ) : (
                      <span className="text-[12px] font-medium text-[var(--apple-secondary-label)] px-4 text-center">
                        {error ?? t('pdf.previewUnavailable')}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[16px] bg-[var(--apple-fill)] p-3.5 space-y-2.5">
                      <div className="text-[12px] font-semibold text-[var(--apple-secondary-label)]">
                        {t('pdf.page')}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          aria-label={t('pdf.prevPage')}
                          onClick={() => changePage(pageNumber - 1)}
                          disabled={pageNumber <= 1}
                          className="apple-pressable apple-tap-target min-h-[40px] min-w-[40px] flex items-center justify-center rounded-[10px] bg-[var(--apple-bg-tertiary)] border border-[var(--apple-separator)] hover:bg-[var(--apple-fill-hover)] disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 -translate-x-[0.5px]" />
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
                          className="w-16 min-h-[40px] rounded-[10px] border border-[var(--apple-separator)] bg-[var(--apple-bg-tertiary)] px-2 py-1.5 text-center text-[14px] font-bold tabular-nums-clean focus:outline-none focus:ring-2 focus:ring-[var(--apple-blue)]"
                        />
                        <button
                          type="button"
                          aria-label={t('pdf.nextPage')}
                          onClick={() => changePage(pageNumber + 1)}
                          disabled={pageNumber >= pageCount}
                          className="apple-pressable apple-tap-target min-h-[40px] min-w-[40px] flex items-center justify-center rounded-[10px] bg-[var(--apple-bg-tertiary)] border border-[var(--apple-separator)] hover:bg-[var(--apple-fill-hover)] disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 translate-x-[0.5px]" />
                        </button>
                      </div>
                      <div className="text-center text-[12px] font-medium text-[var(--apple-secondary-label)] tabular-nums-clean">
                        {t('pdf.ofPages', { count: pageCount })}
                      </div>
                    </div>

                    <div className="rounded-[14px] bg-[var(--apple-orange)]/12 px-3.5 py-2.5 text-[12px] leading-snug text-[var(--apple-orange-fg)]">
                      {t('pdf.fixedHint')}
                    </div>

                    <button
                      type="button"
                      data-testid="pdf-add-frame"
                      onClick={() => void handleConfirm()}
                      disabled={busy || previewLoading}
                      className="apple-pressable w-full min-h-[44px] flex items-center justify-center gap-2 rounded-[14px] bg-[var(--apple-blue)] text-white px-4 py-2.5 text-[13px] font-semibold disabled:opacity-60 whitespace-nowrap cursor-pointer"
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
                      className="apple-pressable w-full min-h-[40px] rounded-[14px] bg-[var(--apple-fill)] hover:bg-[var(--apple-fill-hover)] px-3 py-2 text-[12px] font-semibold text-[var(--apple-label)] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                    >
                      {t('pdf.changeFile')}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-[14px] bg-[var(--apple-red)]/12 px-3.5 py-2.5 text-[12px] font-medium text-[var(--apple-red-fg)]">
                    {error}
                  </div>
                )}
              </div>
            )}

            {!source && error && (
              <div className="px-5 pb-5">
                <div className="rounded-[14px] bg-[var(--apple-red)]/12 px-3.5 py-2.5 text-[12px] font-medium text-[var(--apple-red-fg)]">
                  {error}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
