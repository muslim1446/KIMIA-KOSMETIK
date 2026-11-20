export interface CompressedImageResult {
  dataUrl: string;
  width: number;
  height: number;
}

const MAX_DATA_URL_LENGTH = 340_000;

/**
 * Compresses an image Blob/File into a compact data URL so it fits safely inside
 * Firestore documents (< 350 KB) on the free Spark plan while preserving clarity.
 */
export async function compressImageBlob(
  blob: Blob,
  maxDisplayWidth = 420,
): Promise<CompressedImageResult> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await loadImage(objectUrl);
    const natW = Math.max(1, img.naturalWidth || 320);
    const natH = Math.max(1, img.naturalHeight || 240);

    // Target crisp presentation pixel dimensions (max 960px longest side)
    const maxCanvasSide = 960;
    const scaleDown = Math.min(1, maxCanvasSide / Math.max(natW, natH));
    let targetW = Math.max(1, Math.round(natW * scaleDown));
    let targetH = Math.max(1, Math.round(natH * scaleDown));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context unavailable');
    }

    let dataUrl = '';
    const qualities = [0.84, 0.72, 0.58, 0.45];

    for (let attempt = 0; attempt < qualities.length; attempt++) {
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Prefer WebP when supported, fallback to PNG/JPEG
      const mime = blob.type === 'image/png' ? 'image/webp' : 'image/jpeg';
      dataUrl = canvas.toDataURL(mime, qualities[attempt]);
      if (!dataUrl.startsWith('data:image/webp') && mime === 'image/webp') {
        dataUrl = canvas.toDataURL('image/jpeg', qualities[attempt]);
      }

      if (dataUrl.length <= MAX_DATA_URL_LENGTH) {
        break;
      }

      // Reduce dimensions if still above target byte limit
      targetW = Math.max(120, Math.round(targetW * 0.78));
      targetH = Math.max(90, Math.round(targetH * 0.78));
    }

    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      throw new Error('Imej terlalu besar walaupun selepas pemampatan.');
    }

    const displayScale = Math.min(1, maxDisplayWidth / natW);
    return {
      dataUrl,
      width: Math.max(80, Math.round(natW * displayScale)),
      height: Math.max(60, Math.round(natH * displayScale)),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function loadImageFromUrl(src: string): Promise<CompressedImageResult> {
  const img = await loadImage(src);
  const natW = Math.max(1, img.naturalWidth || 320);
  const natH = Math.max(1, img.naturalHeight || 240);
  const displayScale = Math.min(1, 420 / natW);
  return {
    dataUrl: src.slice(0, MAX_DATA_URL_LENGTH),
    width: Math.max(80, Math.round(natW * displayScale)),
    height: Math.max(60, Math.round(natH * displayScale)),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuatkan imej'));
    img.src = src;
  });
}
