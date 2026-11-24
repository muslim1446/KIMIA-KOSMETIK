import {
  BANNED_CHEMICALS,
  COSMETIC_INGREDIENTS,
  DAILY_MYSTERIES,
  MODERN_DRUGS,
  SLIDES_META,
  TRADITIONAL_HERBS,
} from '../data/slidesData';
import { SharedSlideInteractions } from '../hooks/usePresentationSync';
import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  LogicalRect,
  PenStroke,
  SlideImageItem,
  SlideTextItem,
} from './annotationEngine';

export interface FloatingFrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ParsedGeminiMeta {
  cleanMarkdown: string;
  pasteToSlide: boolean;
  imageQueries: string[];
  caption: string;
}

export interface SlideContextDigest {
  currentSlideNumber: number;
  totalSlides: number;
  currentSlideTitle: string;
  currentSubElementLabel: string;
  deckOutlineText: string;
  currentSlideDetailText: string;
}

export function clampFloatingFrameRect(
  rect: FloatingFrameRect,
  viewportW: number,
  viewportH: number,
): FloatingFrameRect {
  const safeVw = Number.isFinite(viewportW) && viewportW > 0 ? viewportW : 1280;
  const safeVh = Number.isFinite(viewportH) && viewportH > 0 ? viewportH : 720;
  const margin = safeVw < 420 ? 8 : 12;

  const minW = Math.min(310, Math.max(240, safeVw - margin * 2));
  const maxW = Math.max(minW, Math.min(780, safeVw - margin * 2));
  const minH = Math.min(260, Math.max(200, safeVh - margin * 2));
  const maxH = Math.max(minH, Math.min(680, safeVh - margin * 2));

  const width = Math.round(Math.max(minW, Math.min(maxW, rect.width)));
  const height = Math.round(Math.max(minH, Math.min(maxH, rect.height)));
  const maxX = Math.max(margin, safeVw - width - margin);
  const maxY = Math.max(margin, safeVh - height - margin);
  const x = Math.round(Math.max(margin, Math.min(maxX, rect.x)));
  const y = Math.round(Math.max(margin, Math.min(maxY, rect.y)));

  return { x, y, width, height };
}

export function laserClientToSlidePercent(
  clientX: number,
  clientY: number,
  slideRect: LogicalRect,
): { x: number; y: number } {
  const safeW = slideRect.width > 0 ? slideRect.width : LOGICAL_WIDTH;
  const safeH = slideRect.height > 0 ? slideRect.height : LOGICAL_HEIGHT;
  const pctX = ((clientX - slideRect.left) / safeW) * 100;
  const pctY = ((clientY - slideRect.top) / safeH) * 100;
  return {
    x: Math.round(Math.max(-12, Math.min(112, pctX)) * 100) / 100,
    y: Math.round(Math.max(-12, Math.min(112, pctY)) * 100) / 100,
  };
}

export function laserSlidePercentToClient(
  pctX: number,
  pctY: number,
  slideRect: LogicalRect,
): { x: number; y: number } {
  const safeW = slideRect.width > 0 ? slideRect.width : LOGICAL_WIDTH;
  const safeH = slideRect.height > 0 ? slideRect.height : LOGICAL_HEIGHT;
  return {
    x: slideRect.left + (pctX / 100) * safeW,
    y: slideRect.top + (pctY / 100) * safeH,
  };
}

export function describeActiveSubElement(
  slideIndex: number,
  interactions: SharedSlideInteractions,
): { label: string; detail: string } {
  switch (slideIndex) {
    case 0: {
      const map = {
        ubat: 'Tab Ubat (merawat atau mencegah penyakit mengikut dos yang betul)',
        kosmetik: 'Tab Kosmetik (kegunaan luaran untuk membersih, melindungi atau mencantikkan)',
        terlarang: 'Tab Terlarang (bahan kimia terlarang seperti merkuri & hidrokuinon)',
      };
      return {
        label: `Tab: ${interactions.coverCompareId}`,
        detail: map[interactions.coverCompareId],
      };
    }
    case 1: {
      const herb = TRADITIONAL_HERBS.find((h) => h.id === interactions.herbId) ?? TRADITIONAL_HERBS[0];
      return {
        label: `${herb.name} · ${interactions.herbPrep}`,
        detail: `Herba: ${herb.name} (${herb.scientificName}), Bahagian: ${herb.partUsed}, Kegunaan: ${herb.uses.join('; ')}, Cara penyediaan: ${interactions.herbPrep} — ${herb.prepNotes[interactions.herbPrep]}. Ketum terbuka: ${interactions.ketumOpen ? 'Ya' : 'Tidak'}.`,
      };
    }
    case 2: {
      const drug = MODERN_DRUGS.find((d) => d.id === interactions.selectedDrugId) ?? MODERN_DRUGS[0];
      return {
        label: `${drug.name} · ${interactions.selectedPatient}`,
        detail: `Kategori: ${drug.categoryName}, Ubat dipilih: ${drug.name} (${drug.functionDesc}; Kesan sampingan: ${drug.sideEffects}), Profil pesakit: ${interactions.selectedPatient}, Perincian: ${interactions.molecularLens ? 'Aktif' : 'Tutup'}.`,
      };
    }
    case 3:
      return {
        label: `Antibiotik ${interactions.antibioticMode} · Hari ${interactions.antibioticDay}`,
        detail: `Mod antibiotik: ${interactions.antibioticMode} (Hari ke-${interactions.antibioticDay}), Paras dos Parasetamol: ${interactions.paracetamolMg}, Tab aktif: ${interactions.placeboTab}.`,
      };
    case 4:
      return {
        label: `Kes ${interactions.misuseCaseIndex + 1} · Kod ${interactions.npraInput}`,
        detail: `Kes penyalahgunaan ke-${interactions.misuseCaseIndex + 1}, Input semakan NPRA: "${interactions.npraInput}".`,
      };
    case 5:
      return {
        label: `Kategori: ${interactions.cosmeticSortCategory} · ${interactions.selectedCosmeticItemId}`,
        detail: `Jenis kosmetik: ${interactions.cosmeticSortCategory}, Contoh dipilih: ${interactions.selectedCosmeticItemId}.`,
      };
    case 6: {
      const activeIngs = COSMETIC_INGREDIENTS.filter((c) => interactions.emulsion[c.id]).map((c) => c.name);
      return {
        label: `Bahan Asas (${activeIngs.length} bahan)`,
        detail: `Bahan asas kosmetik aktif: ${activeIngs.join(', ') || 'Tiada'}.`,
      };
    }
    case 7: {
      const chem =
        BANNED_CHEMICALS.find((c) => c.id === interactions.bannedChemicalId) ?? BANNED_CHEMICALS[0];
      return {
        label: `${interactions.cosmeticCompareTab} · ${chem.name}`,
        detail: `Tab perbandingan: ${interactions.cosmeticCompareTab}, Bahan terlarang dipilih: ${chem.name} (${chem.severeHarm}).`,
      };
    }
    case 8: {
      const mystery = DAILY_MYSTERIES[interactions.quizIndex] ?? DAILY_MYSTERIES[0];
      return {
        label: `Soalan ${interactions.quizIndex + 1}`,
        detail: `${mystery.title}. Jawapan dipilih: ${interactions.quizSelectedOption ?? 'Belum dipilih'}, Penerangan didedah: ${interactions.explanationRevealed ? 'Ya' : 'Belum'}.`,
      };
    }
    default:
      return { label: 'Slaid Umum', detail: '' };
  }
}

export function buildPresentationDigest(args: {
  slideIndex: number;
  interactions: SharedSlideInteractions;
  permanentStrokes: PenStroke[];
  tempStrokes: PenStroke[];
  textEdits: Record<string, string>;
  slideImages: SlideImageItem[];
  slideTexts?: SlideTextItem[];
}): SlideContextDigest {
  const {
    slideIndex,
    interactions,
    permanentStrokes,
    tempStrokes,
    textEdits,
    slideImages,
    slideTexts = [],
  } = args;
  const meta = SLIDES_META[slideIndex] ?? SLIDES_META[0];
  const sub = describeActiveSubElement(slideIndex, interactions);

  const deckOutlineText = SLIDES_META.map(
    (s) =>
      `Slaid ${s.index + 1}: ${s.title} — ${s.subtitle} [${s.textbookRef}] (Analogi: ${s.presenterNotes.simpleAnalogy})`,
  ).join('\n');

  const slideStrokes = permanentStrokes.filter((s) => s.slideIndex === slideIndex);
  const slideTemp = tempStrokes.filter((s) => s.slideIndex === slideIndex);
  const strokeScopes = Array.from(new Set([...slideStrokes, ...slideTemp].map((s) => s.scopeKey)));
  const strokeColors = Array.from(new Set([...slideStrokes, ...slideTemp].map((s) => s.color)));

  const textEditEntries = Object.entries(textEdits).filter(([k]) => !k.startsWith('__'));
  const textEditsSummary =
    textEditEntries.length > 0
      ? textEditEntries
          .slice(0, 15)
          .map(([k, v]) => `- [${k}] => "${v}"`)
          .join('\n')
      : 'Tiada suntingan teks tersuai pada slaid ini.';

  const imagesSummary =
    slideImages.length > 0
      ? slideImages
          .map(
            (img, idx) =>
              `Gambar ${idx + 1}: skop=${img.scopeKey}, posisi=(${img.x},${img.y}), saiz=${img.width}x${img.height}`,
          )
          .join('; ')
      : 'Tiada gambar tambahan pada slaid ini.';

  const visibleTexts = slideTexts.filter((t) => t.slideIndex === slideIndex && t.text.trim().length > 0);
  const textBoxesSummary =
    visibleTexts.length > 0
      ? visibleTexts
          .slice(0, 25)
          .map((t) => `- "${t.text.trim().slice(0, 300)}" (saiz fon ${t.fontSize}px)`)
          .join('\n')
      : 'Tiada kotak teks tambahan pada slaid ini.';

  const currentSlideDetailText = [
    `SLAID SEMASA: Slaid ${slideIndex + 1}/${SLIDES_META.length} — "${meta.title}"`,
    `Subtajuk: ${meta.subtitle}`,
    `Rujukan Buku Teks: ${meta.textbookRef}`,
    `SUB-ELEMEN / TAB AKTIF: ${sub.detail}`,
    `LUKISAN PEN PENGGUNA: ${slideStrokes.length} garisan kekal, ${slideTemp.length} garisan sementara (Skop: ${strokeScopes.join(', ') || 'tiada'}; Warna: ${strokeColors.join(', ') || 'tiada'}).`,
    `SUNTINGAN TEKS PENGGUNA:\n${textEditsSummary}`,
    `KOTAK TEKS TAMBAHAN PENGGUNA:\n${textBoxesSummary}`,
    `GAMBAR PADA SLAID:\n${imagesSummary}`,
  ].join('\n');

  return {
    currentSlideNumber: slideIndex + 1,
    totalSlides: SLIDES_META.length,
    currentSlideTitle: meta.title,
    currentSubElementLabel: sub.label,
    deckOutlineText,
    currentSlideDetailText,
  };
}

function compactWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Builds the hidden instruction + current-slide context that is sent to Google
 * (AI Mode) when the "Google + AI" island button is pressed. The compact query
 * is used in the search URL, while the full prompt is copied to the clipboard so
 * it can also be pasted into Gemini or any assistant.
 */
export function buildGoogleSlideAiPrompt(
  digest: SlideContextDigest,
  visibleSlideText = '',
): { query: string; prompt: string } {
  const visible = compactWhitespace(visibleSlideText).slice(0, 2600);
  const hiddenInstruction =
    'Anda ialah tutor Kimia KSSM Tingkatan 5 (Bab 5.4: Ubat-ubatan dan Bahan Kosmetik). ' +
    'Jawab dalam Bahasa Melayu yang jelas. Gunakan konteks slaid pembentangan di bawah untuk menerangkan konsep, ' +
    'nama bahan kimia, kegunaan, kesan sampingan, dan formula kimia jika relevan. ' +
    'Jika ada lukisan atau kotak teks pengguna, anggap ia sebahagian daripada soalan.';

  const compactContext = [
    `Slaid ${digest.currentSlideNumber}/${digest.totalSlides}: ${digest.currentSlideTitle}.`,
    `Sub-elemen aktif: ${digest.currentSubElementLabel}.`,
    digest.currentSlideDetailText,
    visible ? `Teks yang kelihatan pada slaid: ${visible.slice(0, 900)}` : '',
    'Soalan: Terangkan slaid ini secara mendalam dan berikan fakta kimia yang tepat untuk pembentangan SPM.',
  ]
    .filter(Boolean)
    .join(' ');

  const query = compactWhitespace(`${hiddenInstruction} ${compactContext}`).slice(0, 1800);

  const prompt = [
    hiddenInstruction,
    '',
    `SLIDE ${digest.currentSlideNumber}/${digest.totalSlides} — ${digest.currentSlideTitle}`,
    `Sub-elemen aktif: ${digest.currentSubElementLabel}`,
    '',
    'KONTEKS PENUH SLAID:',
    digest.currentSlideDetailText,
    '',
    'TEKS YANG KELIHATAN PADA SLAID:',
    visible || '(tiada teks tambahan yang dapat dibaca)',
    '',
    'OUTLINE KESELURUHAN DEK:',
    digest.deckOutlineText,
    '',
    'ARAHAN: Terangkan slaid ini seperti pembentang Kimia KSSM Tingkatan 5. Senaraikan bahan kimia, ' +
      'fungsi, kesan sampingan, dan formula yang berkaitan. Jika sesuai, cadangkan soalan kuiz ringkas.',
  ].join('\n');

  return { query, prompt };
}

export function parseGeminiStructuredMeta(rawText: string): ParsedGeminiMeta {
  const fenceRegex = /```json-meta\s*([\s\S]*?)```/i;
  const match = rawText.match(fenceRegex);
  if (!match) {
    return {
      cleanMarkdown: rawText.trim(),
      pasteToSlide: false,
      imageQueries: [],
      caption: '',
    };
  }

  const cleanMarkdown = rawText.replace(fenceRegex, '').trim();
  try {
    const parsed = JSON.parse(match[1].trim()) as {
      pasteToSlide?: unknown;
      imageQueries?: unknown;
      caption?: unknown;
    };
    const queries = Array.isArray(parsed.imageQueries)
      ? parsed.imageQueries
          .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
          .map((q) => q.trim().slice(0, 100))
          .slice(0, 3)
      : [];
    return {
      cleanMarkdown,
      pasteToSlide: Boolean(parsed.pasteToSlide),
      imageQueries: queries,
      caption: typeof parsed.caption === 'string' ? parsed.caption.trim().slice(0, 120) : '',
    };
  } catch {
    return {
      cleanMarkdown,
      pasteToSlide: false,
      imageQueries: [],
      caption: '',
    };
  }
}

export function buildGeminiCacheKey(args: {
  question: string;
  proveMode: boolean;
  slideIndex: number;
  subLabel: string;
  strokeCount: number;
  textEditsCount: number;
  imageCount: number;
}): string {
  const normQ = args.question.trim().toLowerCase().replace(/\s+/g, ' ');
  return [
    args.proveMode ? 'prove' : 'std',
    args.slideIndex,
    args.subLabel,
    args.strokeCount,
    args.textEditsCount,
    args.imageCount,
    normQ,
  ].join('|');
}
