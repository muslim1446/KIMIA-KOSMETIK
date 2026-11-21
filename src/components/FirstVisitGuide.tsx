import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, CircleHelp, X } from 'lucide-react';
import { UiLanguage, uiText, useUiLanguage } from '../utils/uiLanguage';

const GUIDE_COOKIE = 'kimia-guide-complete';
const GUIDE_COOKIE_AGE = 60 * 60 * 24 * 365;

type GuideStep = {
  target: string;
  title: Record<UiLanguage, string>;
  instruction: Record<UiLanguage, string>;
};

const steps: GuideStep[] = [
  {
    target: 'main [data-slide-root]',
    title: { ms: 'Mula di sini', zh: '从这里开始' },
    instruction: {
      ms: 'Cuba tab dan pilihan pada slaid. Gunakan anak panah di bar bawah untuk tukar slaid.',
      zh: '试试幻灯片上的标签和选项。使用底部控制栏的箭头切换幻灯片。',
    },
  },
  {
    target: 'main [data-slide-root]',
    title: { ms: 'Gerakkan paparan', zh: '移动画面' },
    instruction: {
      ms: 'Pada telefon, seret ruang kosong dengan satu jari. Cubit dua jari untuk zum. Alat lukis dan pemadam digunakan untuk melakar.',
      zh: '在手机上，用一根手指拖动空白处。双指捏合可缩放。画笔和橡皮擦用于绘图。',
    },
  },
  {
    target: 'main [data-slide-root] h1, main [data-slide-root] h2',
    title: { ms: 'Sunting teks slaid', zh: '编辑幻灯片文字' },
    instruction: {
      ms: 'Komputer: klik kanan pada teks. Telefon: tekan lama pada teks. Anda juga boleh pilih alat “Sunting teks”, kemudian ketik teks.',
      zh: '电脑：右键点击文字。手机：长按文字。也可以选择“编辑文字”工具，再点击文字。',
    },
  },
  {
    target: '[data-testid="island-add-text-button"]',
    title: { ms: 'Tambah nota', zh: '添加备注' },
    instruction: {
      ms: 'Tekan butang ini untuk tambah kotak teks. Taip terus, kemudian seret kotak untuk alihkannya.',
      zh: '点击此按钮添加文字框。直接输入，然后拖动文字框来移动。',
    },
  },
  {
    target: '[data-testid="island-pen-button"]',
    title: { ms: 'Lakar pada slaid', zh: '在幻灯片上绘图' },
    instruction: {
      ms: 'Pilih alat lukis. Tekan sekali lagi untuk pilih warna, ketebalan, dan sama ada lukisan kekal atau pudar.',
      zh: '选择画笔。再次点击可选择颜色、粗细，以及永久或自动淡出的笔迹。',
    },
  },
  {
    target: '[data-testid="island-image-button"]',
    title: { ms: 'Tambah gambar', zh: '添加图片' },
    instruction: {
      ms: 'Pilih gambar daripada peranti. Selepas ditambah, pilih gambar untuk mengalih, ubah saiz, atau padam.',
      zh: '从设备选择图片。添加后，选中图片即可移动、调整大小或删除。',
    },
  },
  {
    target: '[data-testid="island-laser-button"]',
    title: { ms: 'Tunjuk dengan laser', zh: '使用激光指示' },
    instruction: {
      ms: 'Pilih penunjuk laser, kemudian gerakkan jari atau tetikus pada slaid. Ia tidak meninggalkan lukisan.',
      zh: '选择激光指示器，然后在幻灯片上移动手指或鼠标。它不会留下笔迹。',
    },
  },
  {
    target: '[data-testid="island-zoom-reset"]',
    title: { ms: 'Zum dan kembali ke tengah', zh: '缩放并回到中心' },
    instruction: {
      ms: 'Gunakan butang − dan + untuk zum. Tekan peratus untuk pulihkan zum dan kedudukan asal.',
      zh: '使用 − 和 + 按钮缩放。点击百分比可恢复原始缩放和位置。',
    },
  },
  {
    target: '[data-testid="island-google-ai-button"]',
    title: { ms: 'Cari dengan konteks slaid', zh: '结合幻灯片内容搜索' },
    instruction: {
      ms: 'Carian ini menggunakan konteks slaid semasa. Tetingkap Google boleh dialih dengan menyeret pengepalanya.',
      zh: '此搜索会使用当前幻灯片内容。拖动 Google 窗口顶部即可移动窗口。',
    },
  },
  {
    target: '[data-testid="island-sync-button"]',
    title: { ms: 'Berkongsi dengan pasukan', zh: '与团队共享' },
    instruction: {
      ms: 'Buka bilik pasukan untuk berkongsi slaid dan suntingan secara langsung. Di sini juga ada tema dan skrin penuh.',
      zh: '打开团队房间即可实时共享幻灯片和编辑内容。这里也有主题和全屏设置。',
    },
  },
];

function hasCompletedGuide() {
  return document.cookie.split(';').some((item) => item.trim().startsWith(`${GUIDE_COOKIE}=v1`));
}

function markGuideComplete() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${GUIDE_COOKIE}=v1; Max-Age=${GUIDE_COOKIE_AGE}; Path=/; SameSite=Lax${secure}`;
}

function getTargetRect(selector: string) {
  const target = document.querySelector<HTMLElement>(selector);
  if (!target) return null;
  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const padding = 8;
  return {
    x: Math.max(4, rect.left - padding),
    y: Math.max(4, rect.top - padding),
    width: Math.min(window.innerWidth - 8, rect.width + padding * 2),
    height: Math.min(window.innerHeight - 8, rect.height + padding * 2),
  };
}

export const FirstVisitGuide: React.FC<{
  disabled?: boolean;
  isFullscreen?: boolean;
}> = ({ disabled = false, isFullscreen = false }) => {
  const language = useUiLanguage();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<ReturnType<typeof getTargetRect>>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const current = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const sectionName = language === 'zh' ? '引导' : 'Panduan';
  const placeCardAboveTarget = Boolean(targetRect && targetRect.y > window.innerHeight * 0.52);

  useEffect(() => {
    if (!disabled && !hasCompletedGuide()) setOpen(true);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    const updateTarget = () => setTargetRect(getTargetRect(current.target));
    const frame = window.requestAnimationFrame(updateTarget);
    const target = document.querySelector<HTMLElement>(current.target);
    const observer = target && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateTarget)
      : null;
    if (target) observer?.observe(target);
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [current.target, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'ArrowRight') setStepIndex((index) => Math.min(steps.length - 1, index + 1));
      if (event.key === 'ArrowLeft') setStepIndex((index) => Math.max(0, index - 1));
      if (event.key === 'Tab' && dialogRef.current) {
        const buttons = Array.from(dialogRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        if (buttons.length === 0) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    dialogRef.current?.querySelector<HTMLButtonElement>('[data-guide-primary]')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const finish = () => {
    markGuideComplete();
    setOpen(false);
  };

  const t = (key: Parameters<typeof uiText>[1], values?: Record<string, string | number>) =>
    uiText(language, key, values);

  return (
    <>
      {!disabled && !isFullscreen && (
        <button
          type="button"
          aria-label={t('guide.help')}
          title={t('guide.helpTitle')}
          onClick={() => {
            setStepIndex(0);
            setOpen(true);
          }}
          className="fixed right-3 top-3 z-[55] flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-stone-900 text-white shadow-lg transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          <CircleHelp className="h-5 w-5" />
        </button>
      )}

      {open && !disabled && (
        <div className="fixed inset-0 z-[70]" data-testid="first-visit-guide">
          <svg aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full">
            <defs>
              <mask id="guide-live-spotlight" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={targetRect.x}
                    y={targetRect.y}
                    width={targetRect.width}
                    height={targetRect.height}
                    rx="12"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(18, 27, 24, 0.72)" mask="url(#guide-live-spotlight)" />
            {targetRect && (
              <rect
                x={targetRect.x}
                y={targetRect.y}
                width={targetRect.width}
                height={targetRect.height}
                rx="12"
                fill="none"
                stroke="#f2bd50"
                strokeWidth="3"
              />
            )}
          </svg>

          <section
            ref={dialogRef}
            aria-labelledby="guide-title"
            aria-modal="true"
            role="dialog"
            className="guide-enter fixed left-3 right-3 z-[71] mx-auto w-auto max-w-[440px] rounded-xl border border-stone-200 bg-[#fffefa] p-5 text-stone-900 shadow-[0_20px_70px_-24px_rgba(0,0,0,0.65)] sm:left-6 sm:right-auto sm:w-[min(440px,calc(100vw-48px))]"
            style={placeCardAboveTarget
              ? { top: 'max(16px, env(safe-area-inset-top))' }
              : { bottom: 'max(16px, env(safe-area-inset-bottom))' }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-bold text-emerald-800">
                  {t('guide.section', { current: stepIndex + 1, total: steps.length })}
                </p>
                <h1 id="guide-title" aria-live="polite" className="font-display text-xl font-extrabold leading-snug sm:text-2xl">
                  {current.title[language]}
                </h1>
              </div>
              <button
                type="button"
                aria-label={t('guide.close')}
                title={t('guide.closeTitle')}
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-stone-600 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-base leading-7 text-stone-700">
              {current.instruction[language]}
            </p>
            <div className="mb-4 flex items-center justify-between gap-2" aria-label={t('guide.progress')}>
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {steps.map((step, index) => (
                  <span
                    key={step.target + index}
                    className={`h-1.5 rounded-full transition-all ${index === stepIndex ? 'w-7 bg-emerald-700' : index < stepIndex ? 'w-3 bg-emerald-300' : 'w-1.5 bg-stone-300'}`}
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-stone-500">
                {targetRect ? t('guide.spotlight') : t('guide.noTarget')}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 px-1 text-sm font-semibold text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-900"
              >
                {t('guide.pause')}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={t('guide.previous')}
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  data-guide-primary
                  onClick={() => (isLast ? finish() : setStepIndex((index) => index + 1))}
                  className="flex min-h-11 items-center gap-2 rounded-md bg-[#203b32] px-4 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  {isLast ? t('guide.finish') : t('guide.next')}
                  {isLast ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="sr-only">{sectionName}</p>
          </section>
        </div>
      )}
    </>
  );
};
