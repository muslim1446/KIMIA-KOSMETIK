import { getBytes, ref, uploadBytes } from 'firebase/storage';
import { PDF_DATA_URL_MAX_LENGTH } from './annotationEngine';
import { storage } from '../firebase';

export interface PdfSource {
  /** Stable cache key derived from the normalized file name. */
  key: string;
  fileName: string;
  size: number;
  lastModified: number;
  pageCount: number;
  bytes: ArrayBuffer;
}

export interface CachedPdfMeta {
  key: string;
  fileName: string;
  size: number;
  lastModified: number;
  pageCount: number;
  savedAt: number;
}

export interface RenderedPdfPage {
  dataUrl: string;
  /** Pixel dimensions of the rendered (and compressed) page image. */
  width: number;
  height: number;
}

/** One already-rendered page of a PDF that exists in the shared room. */
export interface RoomPdfLibraryPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/** An original PDF stored in Firebase Storage so every device can re-render it. */
export interface RoomPdfFileItem {
  fileName: string;
  pageCount: number;
  size: number;
  storagePath: string;
}

/**
 * The merged room view of one PDF: the original bytes in Storage (when someone
 * uploaded it) plus the pages already rendered into Firestore.
 */
export interface RoomPdfEntry {
  fileName: string;
  pageCount: number;
  /** Storage path of the original PDF, or null when only pages exist. */
  storagePath: string | null;
  pages: RoomPdfLibraryPage[];
}

interface StoredPdfRecord extends PdfSource {
  savedAt: number;
}

const IDB_NAME = 'kimia-pdf-cache-v1';
const IDB_STORE = 'pdfs';
const MEMORY_LIMIT = 6;
const MAX_PDF_BYTES = 80 * 1024 * 1024;
// Assets used by pdf.js for rare fonts/encodings/WASM decoders. They are fetched
// on demand from a pinned CDN copy; normal text PDFs never need them.
const PDFJS_CDN_VERSION = '6.5.438';
const PDFJS_CDN_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_CDN_VERSION}`;

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;
const memoryCache = new Map<string, PdfSource>();
let memoryOrder: string[] = [];

function getPdfjs(): Promise<typeof import('pdfjs-dist')> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist');
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export function normalizePdfFileName(fileName: string): string {
  return fileName.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function pdfCacheKey(fileName: string): string {
  return `pdf:${normalizePdfFileName(fileName)}`;
}

function rememberInMemory(source: PdfSource): void {
  memoryCache.set(source.key, source);
  memoryOrder = [...memoryOrder.filter((key) => key !== source.key), source.key];
  while (memoryOrder.length > MEMORY_LIMIT) {
    const oldest = memoryOrder.shift();
    if (oldest) memoryCache.delete(oldest);
  }
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readStoredRecord(key: string): Promise<StoredPdfRecord | null> {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const request = tx.objectStore(IDB_STORE).get(key);
      request.onsuccess = () => resolve((request.result as StoredPdfRecord) ?? null);
      request.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
    } catch {
      db.close();
      resolve(null);
    }
  });
}

async function readAllStoredRecords(): Promise<StoredPdfRecord[]> {
  const db = await openDatabase();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const request = tx.objectStore(IDB_STORE).getAll();
      request.onsuccess = () => resolve((request.result as StoredPdfRecord[]) ?? []);
      request.onerror = () => resolve([]);
      tx.oncomplete = () => db.close();
    } catch {
      db.close();
      resolve([]);
    }
  });
}

async function writeStoredRecord(record: StoredPdfRecord): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(record);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function getCachedPdf(fileName: string): Promise<PdfSource | null> {
  const key = pdfCacheKey(fileName);
  const memory = memoryCache.get(key);
  if (memory) return memory;
  const stored = await readStoredRecord(key);
  if (!stored) return null;
  const source: PdfSource = {
    key: stored.key,
    fileName: stored.fileName,
    size: stored.size,
    lastModified: stored.lastModified,
    pageCount: stored.pageCount,
    bytes: stored.bytes,
  };
  rememberInMemory(source);
  return source;
}

export async function listCachedPdfs(): Promise<CachedPdfMeta[]> {
  const records = await readAllStoredRecords();
  const byKey = new Map<string, CachedPdfMeta>();
  for (const record of records) {
    byKey.set(record.key, {
      key: record.key,
      fileName: record.fileName,
      size: record.size,
      lastModified: record.lastModified,
      pageCount: record.pageCount,
      savedAt: record.savedAt,
    });
  }
  for (const source of memoryCache.values()) {
    if (byKey.has(source.key)) continue;
    byKey.set(source.key, {
      key: source.key,
      fileName: source.fileName,
      size: source.size,
      lastModified: source.lastModified,
      pageCount: source.pageCount,
      savedAt: Date.now(),
    });
  }
  return Array.from(byKey.values()).sort((a, b) => b.savedAt - a.savedAt);
}

export async function readPdfPageCount(bytes: ArrayBuffer): Promise<number> {
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bytes.slice(0)),
    cMapUrl: `${PDFJS_CDN_BASE}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${PDFJS_CDN_BASE}/standard_fonts/`,
    wasmUrl: `${PDFJS_CDN_BASE}/wasm/`,
  });
  try {
    const pdf = await loadingTask.promise;
    try {
      return Math.max(1, pdf.numPages);
    } finally {
      await loadingTask.destroy();
    }
  } catch (err) {
    throw toPdfError(err);
  }
}

/**
 * Resolves an uploaded PDF to a reusable source. When the same file name (and
 * file size) was cached before, its bytes and page count are reused instead of
 * reading/uploading the document again.
 */
export async function resolvePdfFile(file: File): Promise<{ source: PdfSource; reused: boolean }> {
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
    throw new Error('Fail yang dipilih bukan PDF.');
  }
  if (file.size <= 0) {
    throw new Error('Fail PDF ini kosong.');
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error('Saiz PDF melebihi 80 MB. Sila gunakan fail yang lebih kecil.');
  }

  const cached = await getCachedPdf(file.name);
  if (cached && cached.size === file.size) {
    return { source: cached, reused: true };
  }

  const bytes = await file.arrayBuffer();
  const pageCount = await readPdfPageCount(bytes);
  const source: PdfSource = {
    key: pdfCacheKey(file.name),
    fileName: file.name.slice(0, 160),
    size: file.size,
    lastModified: file.lastModified,
    pageCount,
    bytes,
  };
  rememberInMemory(source);
  await writeStoredRecord({ ...source, savedAt: Date.now() });
  return { source, reused: false };
}

export async function resolveCachedPdf(key: string): Promise<PdfSource | null> {
  const memory = memoryCache.get(key);
  if (memory) return memory;
  const stored = await readStoredRecord(key);
  if (!stored) return null;
  const source: PdfSource = {
    key: stored.key,
    fileName: stored.fileName,
    size: stored.size,
    lastModified: stored.lastModified,
    pageCount: stored.pageCount,
    bytes: stored.bytes,
  };
  rememberInMemory(source);
  return source;
}

function toPdfError(err: unknown): Error {
  const name = (err as { name?: string })?.name ?? '';
  if (name === 'PasswordException') {
    return new Error('PDF ini dilindungi kata laluan dan tidak boleh dibuka.');
  }
  if (name === 'InvalidPDFException') {
    return new Error('Fail PDF ini rosak atau tidak sah.');
  }
  return err instanceof Error ? err : new Error('Gagal membaca fail PDF.');
}

/** A stable, filesystem-safe id for a PDF, derived from its normalised name. */
export function pdfStorageId(fileName: string): string {
  const base = normalizePdfFileName(fileName)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'pdf'}`;
}

/** Uploads the original PDF bytes to Firebase Storage. */
export async function uploadPdfToStorage(
  storagePath: string,
  bytes: ArrayBuffer,
  contentType = 'application/pdf',
): Promise<void> {
  await uploadBytes(ref(storage, storagePath), new Blob([bytes], { type: contentType }), {
    contentType,
    // Revalidate so a re-uploaded document is never served stale from a cache.
    cacheControl: 'public, max-age=0, must-revalidate',
  });
}

/** Downloads the original PDF bytes from Firebase Storage. */
export async function downloadPdfFromStorage(storagePath: string): Promise<ArrayBuffer> {
  return getBytes(ref(storage, storagePath));
}

/**
 * Resolves a room PDF into a reusable source. When this device already cached
 * the same document (same file name and page count), the cached bytes are
 * reused; otherwise the original is pulled from Firebase Storage. Either way the
 * full document becomes renderable, so ANY page can be added without the
 * original uploader being online.
 */
export async function importPdfSourceFromStorage(
  fileName: string,
  storagePath: string,
  pageCount: number,
): Promise<PdfSource> {
  const safeCount = Math.max(1, pageCount);
  const cached = await getCachedPdf(fileName);
  if (cached && cached.pageCount === safeCount) return cached;

  const bytes = await downloadPdfFromStorage(storagePath);
  const source: PdfSource = {
    key: pdfCacheKey(fileName),
    fileName: fileName.slice(0, 160),
    size: bytes.byteLength,
    lastModified: Date.now(),
    pageCount: safeCount,
    bytes,
  };
  rememberInMemory(source);
  await writeStoredRecord({ ...source, savedAt: Date.now() });
  return source;
}

interface RenderPdfPageOptions {
  /** Longest side of the intermediate rendered image, in pixels. */
  maxDimension?: number;
  /** Maximum accepted data URL length. */
  maxDataUrlLength?: number;
}

/**
 * Renders one PDF page to a white-background JPEG data URL. The output is
 * iteratively downscaled/recompressed until it fits the Firestore budget.
 */
export async function renderPdfPage(
  source: PdfSource,
  pageNumber: number,
  options: RenderPdfPageOptions = {},
): Promise<RenderedPdfPage> {
  const maxDimension = Math.max(240, options.maxDimension ?? 1440);
  const maxDataUrlLength = Math.max(60_000, options.maxDataUrlLength ?? PDF_DATA_URL_MAX_LENGTH);
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(source.bytes.slice(0)),
    cMapUrl: `${PDFJS_CDN_BASE}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${PDFJS_CDN_BASE}/standard_fonts/`,
    wasmUrl: `${PDFJS_CDN_BASE}/wasm/`,
  });

  try {
    const pdf = await loadingTask.promise;
    try {
      const safePage = Math.max(1, Math.min(pdf.numPages, Math.trunc(pageNumber)));
      const page = await pdf.getPage(safePage);
      const baseViewport = page.getViewport({ scale: 1 });
      const baseSide = Math.max(1, Math.max(baseViewport.width, baseViewport.height));
      const scale = Math.min(3, maxDimension / baseSide);
      const viewport = page.getViewport({ scale });
      const renderCanvas = document.createElement('canvas');
      renderCanvas.width = Math.max(1, Math.round(viewport.width));
      renderCanvas.height = Math.max(1, Math.round(viewport.height));
      const renderCtx = renderCanvas.getContext('2d');
      if (!renderCtx) throw new Error('Kanvas pelayar tidak tersedia.');

      renderCtx.fillStyle = '#FFFFFF';
      renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
      await page.render({
        canvas: renderCanvas,
        canvasContext: renderCtx,
        viewport,
        background: '#FFFFFF',
      }).promise;

      let targetW = renderCanvas.width;
      let targetH = renderCanvas.height;
      const qualities = [0.9, 0.82, 0.72, 0.6, 0.48];
      const compressCanvas = document.createElement('canvas');
      const compressCtx = compressCanvas.getContext('2d');
      if (!compressCtx) throw new Error('Kanvas pelayar tidak tersedia.');

      for (let attempt = 0; attempt < 6; attempt++) {
        compressCanvas.width = targetW;
        compressCanvas.height = targetH;
        compressCtx.fillStyle = '#FFFFFF';
        compressCtx.fillRect(0, 0, targetW, targetH);
        compressCtx.drawImage(renderCanvas, 0, 0, targetW, targetH);
        const quality = qualities[Math.min(attempt, qualities.length - 1)];
        const dataUrl = compressCanvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length <= maxDataUrlLength) {
          return { dataUrl, width: targetW, height: targetH };
        }
        targetW = Math.max(160, Math.round(targetW * 0.82));
        targetH = Math.max(160, Math.round(targetH * 0.82));
      }

      throw new Error('Halaman PDF terlalu besar selepas pemampatan.');
    } finally {
      await loadingTask.destroy();
    }
  } catch (err) {
    throw toPdfError(err);
  }
}
