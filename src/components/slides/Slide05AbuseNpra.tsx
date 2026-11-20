import React from 'react';
import { AlertOctagon, CheckCircle2, FileCheck2, ShieldAlert } from 'lucide-react';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { validateNpraCode } from '../../utils/presentationEngine';

interface Slide05Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

const MISUSE_CASES = [
  {
    title: 'Penyalahgunaan Antibiotik',
    cause: 'Tidak menghabiskan tempoh pengambilan atau mengambilnya tanpa preskripsi.',
    impact: 'Menyebabkan rintangan antibiotik dan penyakit boleh berulang.',
  },
  {
    title: 'Ubat Herba Tanpa Pengesahan',
    cause: 'Mengambil produk tradisional tanpa ujian klinikal atau dicampur bahan terlarang.',
    impact: 'Boleh menyebabkan kegagalan fungsi hati dan buah pinggang.',
  },
  {
    title: 'Penyalahgunaan Kodeina',
    cause: 'Mengambil ubat batuk atau ubat tahan sakit kodeina secara berlebihan.',
    impact: 'Menyebabkan ketagihan dan kebergantungan kepada ubat.',
  },
];

export const Slide05AbuseNpra: React.FC<Slide05Props> = ({ interactions, onPatch }) => {
  const npraResult = validateNpraCode(interactions.npraInput);

  return (
    <div className="h-full w-full flex flex-col gap-5 px-10 py-8 select-none">
      {/* Header */}
      <div className="shrink-0 border-b border-stone-200 dark:border-stone-800 pb-3.5 flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-red-700 dark:text-red-400">
            5.4.2 & 5.4.3 · Kesan Penyalahgunaan & Pengawasan KKM
          </div>
          <h2 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Penyalahgunaan Ubat & Semakan Pendaftaran NPRA
          </h2>
        </div>
        <div className="text-sm font-semibold text-stone-600 dark:text-stone-400">
          Akta Perubatan Tradisional & Komplementari 2016
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
        {/* Left: 3 Misuse Cases */}
        <div className="col-span-6 flex flex-col justify-between gap-3">
          <div className="space-y-2.5">
            {MISUSE_CASES.map((item, idx) => {
              const active = idx === interactions.misuseCaseIndex;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => onPatch({ misuseCaseIndex: idx })}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors cursor-pointer ${
                    active
                      ? 'border-red-600 bg-red-50/80 dark:bg-red-950/40'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                      {idx + 1}. {item.title}
                    </span>
                    <AlertOctagon className={`w-5 h-5 shrink-0 ${active ? 'text-red-600' : 'text-stone-400'}`} />
                  </div>
                  {active && (
                    <div className="mt-2 space-y-1 text-sm text-stone-700 dark:text-stone-300">
                      <p>
                        <strong>Punca:</strong> {item.cause}
                      </p>
                      <p className="text-red-800 dark:text-red-300 font-semibold">
                        <strong>Kesan:</strong> {item.impact}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-display text-base font-bold text-stone-900 dark:text-stone-100">
              <FileCheck2 className="w-5 h-5 text-blue-800 dark:text-blue-400" />
              <span>Kawalan Undang-undang Malaysia</span>
            </div>
            <ul className="text-sm text-stone-700 dark:text-stone-300 space-y-1">
              <li>· <strong>Akta PT&K 2016</strong> & <strong>Dasar Perubatan Tradisional dan Komplementari Kebangsaan</strong></li>
              <li>· <strong>NPRA</strong> (Bahagian Regulatori Farmasi Negara) — menyemak keselamatan produk.</li>
            </ul>
          </div>
        </div>

        {/* Right: NPRA Code Checker */}
        <div className="col-span-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold text-blue-800 dark:text-blue-400">Semakan Label Produk</div>
            <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
              Kenali Nombor MAL & NOT
            </h3>
            <p className="text-base text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
              Ubat berdaftar membawa kod <strong>MAL</strong>, manakala kosmetik bernotifikasi membawa kod <strong>NOT</strong>.
            </p>

            <div className="mt-4">
              <label htmlFor="npra-code-input" className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Masukkan nombor pendaftaran produk
              </label>
              <input
                id="npra-code-input"
                type="text"
                value={interactions.npraInput}
                onChange={(e) => onPatch({ npraInput: e.target.value })}
                placeholder="MAL19981234X atau NOT230501234K"
                className="w-full tabular-nums-clean text-lg font-semibold px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { code: 'MAL19981234X', label: 'Ubat (MAL)' },
                { code: 'NOT230501234K', label: 'Kosmetik (NOT)' },
                { code: 'KRIM-PUTIH-99', label: 'Tidak Sah' },
              ].map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => onPatch({ npraInput: preset.code })}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`mt-4 rounded-2xl border p-4 flex items-start gap-3 ${
              npraResult.validFormat
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                : 'border-red-300 bg-red-50 text-red-950'
            }`}
          >
            {npraResult.validFormat ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-base font-bold">{npraResult.label}</div>
              <p className="text-sm mt-1 leading-snug">{npraResult.guidance}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
