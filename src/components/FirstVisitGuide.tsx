import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cloud,
  ImagePlus,
  Move,
  Pointer,
  Search,
  Sparkles,
  X,
  ZoomIn,
} from 'lucide-react';

const GUIDE_COOKIE = 'kimia-guide-complete';
const GUIDE_COOKIE_AGE = 60 * 60 * 24 * 365;

const steps = [
  {
    label: 'Mula',
    title: 'Slaid ini memang untuk diteroka',
    description:
      'Pilih tab, tekan pilihan, dan cuba aktiviti pada slaid. Perubahan pada slaid interaktif akan terus kelihatan; gunakan anak panah untuk bergerak antara slaid.',
    note: '',
    scene: 'explore',
  },
  {
    label: 'Gerak',
    title: 'Gerakkan kanvas dengan sentuhan',
    description:
      'Pada telefon, seret ruang kosong dengan satu jari dalam mod kursor atau mod lain. Cubit dua jari untuk zum dan seret untuk bergerak ke mana-mana arah. Pen dan pemadam kekal untuk melukis.',
    note: '',
    scene: 'move',
  },
  {
    label: 'Sunting',
    title: 'Tukar teks yang sudah ada',
    description:
      'Klik kanan pada teks dengan tetikus, atau tekan lama pada telefon. Cara lain: pilih alat Teks, kemudian ketik teks. Simpan perubahan atau pulihkan ayat asal.',
    note: '',
    scene: 'edit',
  },
  {
    label: 'Tambah teks',
    title: 'Letak nota anda pada slaid',
    description:
      'Tekan butang T+ untuk mencipta kotak teks. Taip terus, kemudian seret kotak untuk alihkannya. Pilih kotak untuk ubah gaya atau tarik pemegang penjuru untuk ubah saiz.',
    note: '',
    scene: 'text',
  },
  {
    label: 'Lakar',
    title: 'Pen untuk menerangkan, pemadam untuk membetulkan',
    description:
      'Pilih Pen dan lukis pada slaid. Tetapan Pen membolehkan anda pilih warna, saiz, dan lakaran kekal atau sementara. Pilih pemadam, kemudian sapu pada lakaran yang hendak dibuang.',
    note: '',
    scene: 'draw',
  },
  {
    label: 'Gambar',
    title: 'Bawa masuk gambar dan susun pada kanvas',
    description:
      'Gunakan butang gambar untuk pilih fail, atau tampal imej dengan Ctrl+V / ⌘V. Klik dua kali gambar untuk mengaktifkan seretan; tarik penjuru untuk ubah saiz. Ikon pin memilih sama ada gambar ikut tab atau kekal pada slaid.',
    note: '',
    scene: 'image',
  },
  {
    label: 'Laser',
    title: 'Tunjukkan satu titik tanpa meninggalkan dakwat',
    description:
      'Pilih Laser kemudian gerakkan jari atau tetikus pada slaid. Pada komputer, anda juga boleh tahan kekunci L sambil menggerakkan tetikus; lepaskan L untuk berhenti.',
    note: '',
    scene: 'laser',
  },
  {
    label: 'Zum',
    title: 'Perincikan, kemudian kembali ke pandangan asal',
    description:
      'Gunakan − dan + atau cubit skrin untuk zum. Seret kanvas kosong untuk meninjau bahagian lain; bacaan peratus boleh ditekan untuk menetapkan semula zum dan kedudukan tengah.',
    note: 'Kanvas boleh digerakkan bebas ke kiri, kanan, atas dan bawah',
    scene: 'zoom',
  },
  {
    label: 'Cari & AI',
    title: 'Buka carian dengan konteks slaid',
    description:
      'Google membuka pelayar terapung. Google AI membawa konteks slaid semasa ke carian, dan anda boleh salin prompt untuk digunakan di Gemini. Seret pengepala tetingkap untuk mengalihkannya.',
    note: 'Tetingkap boleh ditutup atau dibuka semula dari bar kawalan',
    scene: 'ai',
  },
  {
    label: 'Pasukan',
    title: 'Berkongsi bilik dan kawal paparan',
    description:
      'Buka Sync untuk menyertai bilik dan berkongsi slaid, dakwat, teks, serta gambar secara langsung. Tema gelap, skrin penuh, dan butang titik kecil membantu menyesuaikan paparan.',
    note: 'Pautan bilik boleh dikongsi daripada panel Sync',
    scene: 'share',
  },
] as const;

function hasCompletedGuide() {
  return document.cookie.split(';').some((item) => item.trim().startsWith(`${GUIDE_COOKIE}=`));
}

function markGuideComplete() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${GUIDE_COOKIE}=v1; Max-Age=${GUIDE_COOKIE_AGE}; Path=/; SameSite=Lax${secure}`;
}

const sceneTitles: Record<(typeof steps)[number]['scene'], string> = {
  explore: '',
  move: 'Gerakan sentuhan',
  edit: 'Sunting teks',
  text: 'Kotak teks',
  draw: 'Alat anotasi',
  image: 'Susun gambar',
  laser: 'Penunjuk laser',
  zoom: 'Kanvas bebas',
  ai: 'Carian berpandukan slaid',
  share: 'Kawalan pembentangan',
};

const GuideScene: React.FC<{ scene: (typeof steps)[number]['scene'] }> = ({ scene }) => (
  <div className="guide-scene relative flex min-h-[230px] items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-[#f7f5ef] p-5 sm:min-h-[280px]">
    <div aria-hidden="true" className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#a8a29e 0.7px, transparent 0.7px)', backgroundSize: '15px 15px' }} />
    <div className="relative w-full max-w-[410px]">
      <div className="relative min-h-[174px] overflow-hidden rounded-lg border border-stone-300 bg-white shadow-[0_14px_35px_-24px_rgba(28,25,23,0.65)]">
        <div className="flex h-7 items-center gap-1.5 border-b border-stone-200 bg-stone-50 px-3">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="ml-auto text-[9px] font-semibold text-stone-400">KIMIA · SLAID 1</span>
        </div>
        <div className="relative grid min-h-[146px] grid-cols-[1fr_0.78fr] gap-3 p-4">
          <div className="space-y-2">
            <div className="h-2.5 w-4/5 rounded-sm bg-stone-800" />
            <div className="h-1.5 w-full rounded-sm bg-stone-200" />
            <div className="h-1.5 w-5/6 rounded-sm bg-stone-200" />
            <div className="mt-3 flex gap-1.5">
              <span className="rounded bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-800">UBAT</span>
              <span className="rounded bg-amber-100 px-2 py-1 text-[9px] font-bold text-amber-800">KOSMETIK</span>
            </div>
          </div>
          <div className="relative flex items-center justify-center rounded-md bg-[#e7eee8]">
            <div className="h-14 w-14 rounded-full border-[7px] border-white bg-emerald-700 shadow-sm" />
            <span className="absolute bottom-2 right-2 h-2 w-8 rounded bg-amber-400" />
          </div>
          {scene === 'edit' && (
            <div className="absolute left-5 top-11 rounded border-2 border-emerald-600 bg-white px-2 py-1 text-[10px] font-bold text-stone-700 shadow-sm">
              Teks boleh disunting <Pointer className="ml-1 inline h-3 w-3 text-emerald-700" />
            </div>
          )}
          {scene === 'text' && (
            <div className="absolute bottom-2 left-7 flex items-center gap-1 rounded border border-blue-500 bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-900">
              Nota baharu <span className="h-2 w-2 border-b-2 border-r-2 border-blue-600" />
            </div>
          )}
          {scene === 'image' && (
            <div className="absolute bottom-2 right-4 flex h-12 w-16 items-center justify-center rounded border-2 border-blue-600 bg-white shadow-md">
              <ImagePlus className="h-5 w-5 text-emerald-700" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-sm border border-blue-700 bg-white" />
            </div>
          )}
          {scene === 'draw' && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[38%] top-[48%] h-1 w-16 -rotate-[18deg] rounded-full bg-blue-700" />
              <div className="absolute left-[46%] top-[58%] h-1 w-12 rotate-[12deg] rounded-full bg-red-600" />
            </div>
          )}
          {scene === 'laser' && (
            <div className="absolute left-[60%] top-[50%] h-4 w-4 rounded-full bg-red-500 ring-8 ring-red-500/15 shadow-[0_0_18px_rgba(239,68,68,0.8)]" />
          )}
        </div>
        <div className="flex h-8 items-center justify-center gap-2 border-t border-stone-200 bg-stone-50">
          <ChevronLeft className="h-3 w-3 text-stone-500" />
          <span className="h-1 w-10 rounded-full bg-emerald-700" />
          <span className="h-1 w-5 rounded-full bg-stone-300" />
          <ChevronRight className="h-3 w-3 text-stone-500" />
        </div>
      </div>

      {scene === 'move' && (
        <>
          <div className="absolute -left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-emerald-600 bg-white shadow-md">
            <Move className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="absolute -right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-500 bg-white shadow-md">
            <ArrowUpRight className="h-5 w-5 text-amber-700" />
          </div>
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-stone-900 px-3 py-1 text-[10px] font-bold text-white">1 jari · seret ruang kosong</span>
        </>
      )}
      {scene === 'zoom' && (
        <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-500 bg-white shadow-md">
          <ZoomIn className="h-5 w-5 text-amber-700" />
        </div>
      )}
      {scene === 'ai' && (
        <div className="absolute -right-3 -top-4 w-32 rounded-lg border border-emerald-200 bg-white p-2.5 shadow-lg">
          <div className="mb-1 flex items-center gap-1 text-[9px] font-extrabold text-emerald-800"><Sparkles className="h-3 w-3" /> AI · KONTEKS SLAID</div>
          <div className="h-1 w-full rounded bg-stone-200" />
          <div className="mt-1 h-1 w-4/5 rounded bg-stone-200" />
          <div className="mt-2 flex items-center gap-1 text-[8px] font-bold text-blue-700"><Search className="h-2.5 w-2.5" /> Cari topik ini</div>
        </div>
      )}
      {scene === 'share' && (
        <div className="absolute -right-2 -top-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 shadow-lg">
          <Cloud className="h-5 w-5 text-emerald-700" />
          <span className="text-[9px] font-bold text-stone-700">PASUKAN<br /><span className="text-emerald-700">● LANGSUNG</span></span>
        </div>
      )}
      {scene === 'explore' && (
        <div className="absolute -right-2 -top-3 flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1.5 text-[9px] font-bold text-stone-700 shadow-md">
          <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-700" /> CUBA TAB
        </div>
      )}
    </div>

    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase text-stone-500">
      {sceneTitles[scene]}
    </div>
  </div>
);

export const FirstVisitGuide: React.FC<{ disabled?: boolean }> = ({ disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const current = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!disabled && !hasCompletedGuide()) setOpen(true);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'ArrowRight') setStepIndex((currentIndex) => Math.min(steps.length - 1, currentIndex + 1));
      if (event.key === 'ArrowLeft') setStepIndex((currentIndex) => Math.max(0, currentIndex - 1));
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const finish = () => {
    markGuideComplete();
    setOpen(false);
  };

  return (
    <>
      {!disabled && (
        <button
          type="button"
          aria-label="Buka panduan ciri pembentangan"
          title="Panduan ciri"
          onClick={() => {
            setStepIndex(0);
            setOpen(true);
          }}
          className="fixed right-3 top-3 z-[55] flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-stone-900 text-white shadow-lg transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          <CircleHelp className="h-5 w-5" />
        </button>
      )}

      {open && !disabled && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#17201c]/75 p-3 backdrop-blur-sm sm:p-6" data-testid="first-visit-guide">
          <section
            aria-labelledby="guide-title"
            aria-modal="true"
            role="dialog"
            className="guide-enter relative my-auto grid w-full max-w-5xl overflow-hidden rounded-xl border border-white/60 bg-[#fbfaf6] shadow-[0_28px_90px_-28px_rgba(0,0,0,0.6)] md:grid-cols-[210px_1fr]"
          >
            <aside className="hidden flex-col justify-between bg-[#203b32] p-5 text-white md:flex">
              <div>
                <div className="mb-8 flex items-center gap-2 text-xs font-extrabold uppercase text-emerald-200">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20"><Sparkles className="h-4 w-4" /></span>
                  Panduan ringkas
                </div>
                <nav aria-label="Bahagian panduan" className="space-y-1">
                  {steps.map((step, index) => (
                    <button
                      key={step.label}
                      type="button"
                      onClick={() => setStepIndex(index)}
                      aria-current={index === stepIndex ? 'step' : undefined}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-semibold transition ${index === stepIndex ? 'bg-white text-[#203b32]' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${index === stepIndex ? 'bg-emerald-100 text-emerald-900' : 'bg-white/10'}`}>
                        {index < stepIndex ? <Check className="h-3 w-3" /> : index + 1}
                      </span>
                      {step.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="text-[10px] leading-relaxed text-emerald-100/70">Boleh buka semula panduan ini bila-bila masa.</div>
            </aside>

            <div className="min-w-0 p-4 sm:p-7 md:p-8">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 text-[10px] font-extrabold uppercase text-emerald-800">PANDUAN · {String(stepIndex + 1).padStart(2, '0')} / {steps.length}</div>
                  <h1 id="guide-title" className="max-w-2xl font-display text-2xl font-extrabold leading-tight text-stone-900 sm:text-3xl">{current.title}</h1>
                </div>
                <button
                  type="button"
                  aria-label="Tutup panduan buat masa ini"
                  title="Tutup, panduan akan muncul semula sehingga selesai"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-200 hover:text-stone-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid items-center gap-5 lg:grid-cols-[0.88fr_1.12fr]">
                <div className="order-2 space-y-4 lg:order-1">
                  <p className="max-w-lg text-sm leading-6 text-stone-700">{current.description}</p>
                  <div className="flex items-start gap-2 border-l-[3px] border-amber-500 bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-5 text-stone-700">
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    {current.note}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 md:hidden" aria-label="Kemajuan panduan">
                    {steps.map((step, index) => (
                      <button key={step.label} type="button" aria-label={`Pergi ke bahagian ${index + 1}: ${step.label}`} onClick={() => setStepIndex(index)} className={`h-1.5 rounded-full transition-all ${index === stepIndex ? 'w-7 bg-emerald-700' : 'w-1.5 bg-stone-300'}`} />
                    ))}
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <GuideScene scene={current.scene} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
                <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-stone-500 underline decoration-stone-300 underline-offset-4 hover:text-stone-800"></button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Bahagian sebelumnya"
                    disabled={stepIndex === 0}
                    onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => (isLast ? finish() : setStepIndex((index) => index + 1))}
                    className="flex min-h-10 items-center gap-2 rounded-md bg-[#203b32] px-4 text-sm font-bold text-white transition hover:bg-emerald-800"
                  >
                    {isLast ? 'Selesai' : 'Seterusnya'}
                    {isLast ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
};