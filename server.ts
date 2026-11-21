import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { parseGeminiStructuredMeta } from './src/utils/presentationContext.ts';

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

interface AskRequestBody {
  question?: string;
  proveMode?: boolean;
  wantsImagePaste?: boolean;
  deckOutlineText?: string;
  currentSlideDetailText?: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  inlineImages?: Array<{ data: string; mimeType: string; label?: string }>;
}

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_IMAGE_HOSTS = new Set([
  'upload.wikimedia.org',
  'thumb.wikimedia.org',
  'commons.wikimedia.org',
  'en.wikipedia.org',
  'ms.wikipedia.org',
]);

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error(
      'GEMINI_API_KEY belum ditetapkan di persekitaran pelayan (Settings > Secrets).',
    ) as Error & { statusCode?: number };
    err.statusCode = 500;
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 14000,
      retryOptions: {
        attempts: 1,
      },
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function cleanHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchSingleQueryWikimediaImages(cleanQ: string): Promise<ReferenceImageItem[]> {
  const found: ReferenceImageItem[] = [];
  try {
    // 1. Wikipedia pageimage search (clean, high-relevance educational images)
    const wpUrl = new URL('https://en.wikipedia.org/w/api.php');
    wpUrl.searchParams.set('action', 'query');
    wpUrl.searchParams.set('generator', 'search');
    wpUrl.searchParams.set('gsrsearch', cleanQ);
    wpUrl.searchParams.set('gsrlimit', '4');
    wpUrl.searchParams.set('prop', 'pageimages|info');
    wpUrl.searchParams.set('piprop', 'thumbnail');
    wpUrl.searchParams.set('pithumbsize', '320');
    wpUrl.searchParams.set('inprop', 'url');
    wpUrl.searchParams.set('format', 'json');
    wpUrl.searchParams.set('origin', '*');

    const cmUrl = new URL('https://commons.wikimedia.org/w/api.php');
    cmUrl.searchParams.set('action', 'query');
    cmUrl.searchParams.set('generator', 'search');
    cmUrl.searchParams.set('gsrnamespace', '6');
    cmUrl.searchParams.set('gsrsearch', `${cleanQ} filetype:bitmap|drawing`);
    cmUrl.searchParams.set('gsrlimit', '4');
    cmUrl.searchParams.set('prop', 'imageinfo');
    cmUrl.searchParams.set('iiprop', 'url|mime|extmetadata');
    cmUrl.searchParams.set('iiurlwidth', '320');
    cmUrl.searchParams.set('format', 'json');
    cmUrl.searchParams.set('origin', '*');

    const [wpRes, cmRes] = await Promise.all([
      fetch(wpUrl.toString(), {
        headers: { 'User-Agent': 'KimiaKSSM-Presentation/1.0 (educational)' },
        signal: AbortSignal.timeout(4000),
      }).catch(() => null),
      fetch(cmUrl.toString(), {
        headers: { 'User-Agent': 'KimiaKSSM-Presentation/1.0 (educational)' },
        signal: AbortSignal.timeout(4000),
      }).catch(() => null),
    ]);

    if (wpRes?.ok) {
      const wpData = (await wpRes.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              title?: string;
              fullurl?: string;
              thumbnail?: { source?: string };
            }
          >;
        };
      };
      const pages = Object.values(wpData.query?.pages ?? {});
      for (const p of pages) {
        const thumb = p.thumbnail?.source;
        if (!thumb || !/\.(jpg|jpeg|png|webp)/i.test(thumb)) continue;
        found.push({
          title: p.title || cleanQ,
          thumbUrl: thumb,
          proxyUrl: `/api/gemini/proxy-image?url=${encodeURIComponent(thumb)}`,
          pageUrl: p.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title || cleanQ)}`,
          description: `Rujukan Wikipedia: ${p.title || cleanQ}`,
        });
      }
    }

    if (cmRes?.ok) {
      const cmData = (await cmRes.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              title?: string;
              imageinfo?: Array<{
                thumburl?: string;
                url?: string;
                mime?: string;
                descriptionurl?: string;
                extmetadata?: { ImageDescription?: { value?: string } };
              }>;
            }
          >;
        };
      };
      const pages = Object.values(cmData.query?.pages ?? {});
      for (const p of pages) {
        const info = p.imageinfo?.[0];
        const thumb = info?.thumburl || info?.url;
        if (!thumb) continue;
        if (info?.mime && !info.mime.startsWith('image/')) continue;
        if (/\.tiff?$/i.test(thumb)) continue;
        const rawDesc = info?.extmetadata?.ImageDescription?.value ?? '';
        const titleClean = (p.title || cleanQ).replace(/^File:/i, '').replace(/\.[^.]+$/, '');
        found.push({
          title: titleClean.slice(0, 80),
          thumbUrl: thumb,
          proxyUrl: `/api/gemini/proxy-image?url=${encodeURIComponent(thumb)}`,
          pageUrl: info?.descriptionurl || 'https://commons.wikimedia.org',
          description: cleanHtml(rawDesc).slice(0, 140) || `Wikimedia Commons: ${titleClean}`,
        });
      }
    }
  } catch {
    // Graceful empty fallback on network failure
  }
  return found;
}

async function searchWikimediaImages(queries: string[], limit = 4): Promise<ReferenceImageItem[]> {
  const cleanQueries = queries.map((q) => q.trim()).filter(Boolean).slice(0, 3);
  if (cleanQueries.length === 0) return [];

  const batches = await Promise.all(cleanQueries.map((q) => fetchSingleQueryWikimediaImages(q)));
  const results: ReferenceImageItem[] = [];
  const seenUrls = new Set<string>();

  for (const batch of batches) {
    for (const item of batch) {
      if (seenUrls.has(item.thumbUrl)) continue;
      seenUrls.add(item.thumbUrl);
      results.push(item);
      if (results.length >= limit) return results;
    }
  }

  return results;
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) {
      return null;
    }
    const res = await fetch(parsed.toString(), {
      headers: { 'User-Agent': 'KimiaKSSM-Presentation/1.0 (educational)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > 2_000_000) return null;
    return `data:${contentType.split(';')[0]};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

function detectNeedsImageOrSearch(question: string, proveMode: boolean, wantsImagePaste: boolean): boolean {
  if (proveMode || wantsImagePaste) return true;
  return /\b(gambar|image|photo|foto|diagram|rajah|struktur|paste|tampal|prove|bukti|rujukan|source|cari|search|show me)\b/i.test(
    question,
  );
}

function detectWantsAutoPaste(question: string, explicitFlag: boolean): boolean {
  if (explicitFlag) return true;
  return /\b(paste|tampal|masukkan gambar|letak gambar|add image|put an image|insert image)\b/i.test(
    question,
  );
}

function extractGeminiError(err: unknown): { status: number; message: string } {
  const errObj = err as { status?: number; statusCode?: number; message?: string };
  let status = errObj?.statusCode || errObj?.status || 500;
  let rawMsg = errObj?.message || 'Ralat semasa menghubungi Gemini API.';

  // Unwrap JSON error strings emitted by @google/genai
  if (rawMsg.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawMsg) as {
        error?: { code?: number; message?: string; status?: string };
      };
      if (parsed?.error?.code) status = parsed.error.code;
      if (parsed?.error?.message) rawMsg = parsed.error.message;
    } catch {
      // Keep original string if not valid JSON
    }
  }

  if (status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota')) {
    return {
      status: 429,
      message:
        'Kuota percuma Gemini API telah mencapai had sementara (429). Cuba sebentar lagi atau semak kunci API di Settings > Secrets.',
    };
  }
  if (status === 503 || /high demand|unavailable|overloaded/i.test(rawMsg)) {
    return {
      status: 503,
      message:
        'Model Gemini sedang mengalami permintaan tinggi buat sementara waktu (503). Sila cuba sebentar lagi.',
    };
  }
  if (status === 403 || (status === 400 && rawMsg.includes('API_KEY_INVALID'))) {
    return {
      status: 403,
      message: 'Kunci Gemini API tidak sah atau tiada kebenaran. Sila semak di Settings > Secrets.',
    };
  }
  if (status === 504 || /abort|timeout|deadline/i.test(rawMsg)) {
    return {
      status: 504,
      message: 'Sambungan ke Gemini mengambil masa terlalu lama. Sila cuba lagi sebentar lagi.',
    };
  }

  return {
    status: status >= 400 && status < 600 ? status : 500,
    message: rawMsg.slice(0, 260),
  };
}

async function generateWithQuotaSavings(args: {
  ai: GoogleGenAI;
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }>;
  }>;
  systemInstruction: string;
  useSearch: boolean;
}) {
  const { ai, contents, systemInstruction, useSearch } = args;

  try {
    return await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: AbortSignal.timeout(15000),
        ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });
  } catch (firstErr: unknown) {
    const parsedFirst = extractGeminiError(firstErr);
    const shouldFallback =
      parsedFirst.status === 404 ||
      parsedFirst.status === 400 ||
      parsedFirst.status === 429 ||
      parsedFirst.status === 503 ||
      parsedFirst.status === 504;
    if (!shouldFallback) {
      throw firstErr;
    }

    // Fallback to gemini-2.0-flash without search grounding if primary call fails
    return await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction,
        abortSignal: AbortSignal.timeout(15000),
      },
    });
  }
}

interface GeoLookupResult {
  source: 'ip' | 'gps' | 'none';
  label: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  accuracy: number;
}

const geoCache = new Map<string, { expiresAt: number; value: GeoLookupResult }>();

function clipText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function clampCoordinate(value: unknown, min: number, max: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(min, Math.min(max, num));
}

function buildGeoResult(input: {
  source: 'ip' | 'gps' | 'none';
  city?: unknown;
  region?: unknown;
  country?: unknown;
  countryCode?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  accuracy?: unknown;
  label?: unknown;
}): GeoLookupResult {
  const city = clipText(input.city, 80);
  const region = clipText(input.region, 80);
  const country = clipText(input.country, 80);
  const countryCode = clipText(input.countryCode, 8).toUpperCase();
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const value of [city, region, country]) {
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(value);
  }
  return {
    source: input.source,
    label: clipText(input.label, 160) || parts.join(', ').slice(0, 160),
    city,
    region,
    country,
    countryCode,
    latitude: clampCoordinate(input.latitude, -90, 90),
    longitude: clampCoordinate(input.longitude, -180, 180),
    accuracy:
      typeof input.accuracy === 'number' && Number.isFinite(input.accuracy)
        ? Math.max(0, input.accuracy)
        : input.source === 'ip'
        ? 5000
        : 0,
  };
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  let ip = raw?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  if (
    !ip ||
    ip === '::1' ||
    /^127\./.test(ip) ||
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^(fc|fd|fe80)/i.test(ip)
  ) {
    // Local/private clients have no public IP to resolve; fall back to the
    // server's own public egress IP so an approximate location still appears.
    return '';
  }
  return ip;
}

async function lookupIpLocation(ip: string): Promise<GeoLookupResult> {
  const target = ip ? `/${encodeURIComponent(ip)}` : '/';
  try {
    const res = await fetch(`https://ipwho.is${target}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'KimiaKSSM-Presentation/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      if (data.success !== false) {
        return buildGeoResult({
          source: 'ip',
          city: data.city,
          region: data.region,
          country: data.country,
          countryCode: data.country_code,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    }
  } catch {
    // Try the secondary provider below.
  }

  try {
    const res = await fetch(`https://ipapi.co${target === '/' ? '/json/' : `${target}/json/`}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'KimiaKSSM-Presentation/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      if (!data.error) {
        return buildGeoResult({
          source: 'ip',
          city: data.city,
          region: data.region,
          country: data.country_name,
          countryCode: data.country_code,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    }
  } catch {
    // Fall through to the unavailable result.
  }

  return buildGeoResult({ source: 'none' });
}

async function reverseGeocode(lat: number, lng: number): Promise<GeoLookupResult> {
  try {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', lat.toFixed(6));
    url.searchParams.set('longitude', lng.toFixed(6));
    url.searchParams.set('localityLanguage', 'ms');
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      return buildGeoResult({
        source: 'gps',
        city: data.city || data.locality,
        region: data.principalSubdivision,
        country: data.countryName,
        countryCode: data.countryCode,
        latitude: lat,
        longitude: lng,
        accuracy: 0,
      });
    }
  } catch {
    // Try OpenStreetMap below.
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', lat.toFixed(6));
    url.searchParams.set('lon', lng.toFixed(6));
    url.searchParams.set('accept-language', 'ms');
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'KimiaKSSM-Presentation/1.0 (educational)',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        address?: Record<string, string>;
      };
      const address = data.address ?? {};
      return buildGeoResult({
        source: 'gps',
        city: address.city || address.town || address.village || address.municipality,
        region: address.state || address.region,
        country: address.country,
        countryCode: address.country_code,
        latitude: lat,
        longitude: lng,
        accuracy: 0,
      });
    }
  } catch {
    // Coordinates alone are still returned below.
  }

  return buildGeoResult({
    source: 'gps',
    latitude: lat,
    longitude: lng,
    accuracy: 0,
  });
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '4mb' }));

  // Approximate location from the request's public IP (works when GPS is off).
  app.get('/api/geo', async (req: Request, res: Response) => {
    const ip = getClientIp(req);
    const cacheKey = ip || 'self';
    const cached = geoCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader('Cache-Control', 'private, max-age=600');
      res.json(cached.value);
      return;
    }
    const value = await lookupIpLocation(ip);
    geoCache.set(cacheKey, {
      expiresAt: Date.now() + (value.source === 'none' ? 2 * 60_000 : 30 * 60_000),
      value,
    });
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.json(value);
  });

  // Human-readable place name for precise browser GPS coordinates.
  app.get('/api/geo/reverse', async (req: Request, res: Response) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      res.status(400).json({ error: 'Koordinat tidak sah.' });
      return;
    }
    const cacheKey = `rev:${lat.toFixed(2)},${lng.toFixed(2)}`;
    const cached = geoCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.json(cached.value);
      return;
    }
    const value = await reverseGeocode(lat, lng);
    geoCache.set(cacheKey, { expiresAt: Date.now() + 60 * 60_000, value });
    res.setHeader('Cache-Control', 'private, max-age=1800');
    res.json(value);
  });

  app.post('/api/gemini/ask', async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as AskRequestBody;
      const question = typeof body.question === 'string' ? body.question.trim() : '';
      if (!question) {
        res.status(400).json({ error: 'Soalan tidak boleh kosong.' });
        return;
      }

      const proveMode = Boolean(body.proveMode);
      const wantsImagePaste = detectWantsAutoPaste(question, Boolean(body.wantsImagePaste));
      const useSearch = detectNeedsImageOrSearch(question, proveMode, wantsImagePaste);

      const ai = getGeminiClient();

      const systemInstruction = [
        'Anda ialah Pembantu Makmal Kimia KSSM (Tingkatan 5 Bab 5.4: Ubat-ubatan dan Bahan Kosmetik) di dalam papan pembentangan kolaboratif.',
        'Anda boleh membaca keseluruhan 9 slaid pembentangan, sub-elemen/tab aktif semasa, suntingan teks pengguna, imej yang ditampal, serta lakaran pen pengguna (termasuk imej kanvas jika dilampirkan).',
        'Peraturan jawapan:',
        '1. Jawab dengan jelas, ringkas, tepat secara saintifik, dan mesra pembentang (Bahasa Melayu secara lalai, atau ikut bahasa soalan pengguna).',
        '2. Jika pengguna bertanya apa maksud slaid, tab, atau lukisan/garisan mereka, kaitkan terus jawapan dengan konteks slaid aktif, sub-elemen aktif, suntingan teks, dan lukisan mereka.',
        '3. Jimat konteks dan terus kepada isi penting (maksimum ~180 patah perkataan melainkan diminta huraian lanjut).',
        useSearch
          ? '4. DI HUJUNG jawapan, sentiasa sertakan satu blok ```json-meta ... ``` yang sah dengan format: {"pasteToSlide": boolean, "imageQueries": ["query english saintifik 1", "query 2"], "caption": "tajuk ringkas"}. Tetapkan pasteToSlide=true HANYA jika pengguna meminta gambar ditampal/dimasukkan ke slaid; jika Mod Bukti (Prove Mode) aktif tanpa permintaan tampal, tetapkan pasteToSlide=false dan berikan 2-3 imageQueries Bahasa Inggeris yang tepat untuk gambar rujukan Wikipedia/Wikimedia.'
          : '4. Jika tidak perlu mencari gambar atau bukti web, jawab terus dalam Markdown yang kemas tanpa blok json-meta.',
      ].join('\n');

      const contextText = [
        '=== RINGKASAN KESELURUHAN PEMBENTANGAN (9 SLAID) ===',
        (body.deckOutlineText ?? '').slice(0, 4500),
        '',
        '=== KONTEKS SLAID & SUB-ELEMEN SEMASA ===',
        (body.currentSlideDetailText ?? '').slice(0, 3500),
      ].join('\n');

      const recentHistory = Array.isArray(body.history) ? body.history.slice(-4) : [];
      const contents: Array<{
        role: 'user' | 'model';
        parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }>;
      }> = [];

      for (const turn of recentHistory) {
        if (turn && (turn.role === 'user' || turn.role === 'model') && typeof turn.text === 'string') {
          contents.push({
            role: turn.role,
            parts: [{ text: turn.text.slice(0, 1200) }],
          });
        }
      }

      const userParts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [
        {
          text: `${contextText}\n\n=== SOALAN / ARAHAN PENGGUNA ===\n${question.slice(0, 1000)}\nMod Bukti (Prove Mode): ${proveMode ? 'AKTIF' : 'TIDAK'}\nArahan Tampal Gambar: ${wantsImagePaste ? 'YA' : 'TIDAK'}`,
        },
      ];

      if (Array.isArray(body.inlineImages)) {
        for (const img of body.inlineImages.slice(0, 2)) {
          if (img && typeof img.data === 'string' && typeof img.mimeType === 'string') {
            if (img.label) {
              userParts.push({ text: `Lampiran visual (${img.label}):` });
            }
            userParts.push({
              inlineData: {
                data: img.data,
                mimeType: img.mimeType,
              },
            });
          }
        }
      }

      contents.push({ role: 'user', parts: userParts });

      const response = await generateWithQuotaSavings({
        ai,
        contents,
        systemInstruction,
        useSearch,
      });

      const rawText = response.text ?? '';
      const parsedMeta = parseGeminiStructuredMeta(rawText);

      // Extract grounded web references when Search Grounding was used
      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources: GroundingSource[] = [];
      const seenSourceUrls = new Set<string>();
      for (const chunk of rawChunks) {
        const uri = chunk?.web?.uri;
        const title = chunk?.web?.title;
        if (uri && !seenSourceUrls.has(uri)) {
          seenSourceUrls.add(uri);
          sources.push({
            title: title || uri,
            url: uri,
          });
        }
      }

      // Fetch real reference images via Wikimedia/Wikipedia (0 extra Gemini API quota)
      let referenceImages: ReferenceImageItem[] = [];
      let autoPasteImage: { dataUrl: string; title: string; pageUrl: string } | null = null;

      const effectiveQueries =
        parsedMeta.imageQueries.length > 0
          ? parsedMeta.imageQueries
          : useSearch
          ? [question.slice(0, 60)]
          : [];

      if (useSearch && effectiveQueries.length > 0) {
        referenceImages = await searchWikimediaImages(effectiveQueries, proveMode ? 4 : 2);
        for (const refImg of referenceImages) {
          if (!seenSourceUrls.has(refImg.pageUrl) && sources.length < 5) {
            seenSourceUrls.add(refImg.pageUrl);
            sources.push({ title: refImg.title, url: refImg.pageUrl });
          }
        }
      }

      const shouldPaste = wantsImagePaste || parsedMeta.pasteToSlide;
      if (shouldPaste && referenceImages.length > 0) {
        for (const candidate of referenceImages) {
          const dataUrl = await fetchImageAsDataUrl(candidate.thumbUrl);
          if (dataUrl) {
            autoPasteImage = {
              dataUrl,
              title: parsedMeta.caption || candidate.title,
              pageUrl: candidate.pageUrl,
            };
            break;
          }
        }
      }

      res.json({
        answer: parsedMeta.cleanMarkdown || rawText,
        proveMode,
        sources: sources.slice(0, 5),
        referenceImages: proveMode || !autoPasteImage ? referenceImages : referenceImages.slice(1),
        autoPasteImage,
      });
    } catch (err: unknown) {
      const parsed = extractGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  app.get('/api/gemini/proxy-image', async (req: Request, res: Response) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
    if (!rawUrl) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'https:' || !ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) {
        res.status(403).json({ error: 'Image host not allowed' });
        return;
      }
      const upstream = await fetch(parsed.toString(), {
        headers: { 'User-Agent': 'KimiaKSSM-Presentation/1.0 (educational)' },
        signal: AbortSignal.timeout(6000),
      });
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: 'Failed to load image' });
        return;
      }
      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      if (!contentType.startsWith('image/')) {
        res.status(415).json({ error: 'Unsupported media type' });
        return;
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buf);
    } catch {
      res.status(502).json({ error: 'Image proxy error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
