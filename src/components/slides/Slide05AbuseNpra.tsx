import React from 'react';
import { AlertOctagon, ArrowRight, CheckCircle2, FileCheck2, ShieldAlert } from 'lucide-react';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { validateNpraCode } from '../../utils/presentationEngine';

interface Slide05Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

const MISUSE_CASES = [
  {
    title: 'Antibiotik',
    cause: 'Tidak dihabiskan tempoh pengambilannya atau diambil tanpa arahan doktor.',
    bodyProcess: 'Bakteria tidak dibunuh sepenuhnya lalu membina ketahanan.',
    impact: 'Rintangan antibiotik.',
  },
  {
    title: 'Ubat tradisional berasaskan herba',
    cause: 'Tiada data kajian mengesahkan keberkesanan atau dos yang betul.',
    bodyProcess: 'Dos yang tidak tepat membebankan fungsi hati dan buah pinggang.',
    impact: 'Kegagalan fungsi hati dan buah pinggang.',
  },
  {
    title: 'Kodeina',
    cause: 'Diambil tidak mengikut preskripsi doktor atau disalah guna.',
    bodyProcess: 'Pengambilan berterusan atau berlebihan menyebabkan kebergantungan ubat.',
    impact: 'Ketagihan.',
  },
];

export const Slide05AbuseNpra: React.FC<Slide05Props> = ({ interactions, onPatch }) => {
  const npraResult = validateNpraCode(interactions.npraInput);

  return (
    <div className="h-full w-full flex flex-col gap-4 px-10 py-6 select-none">
      <div className="shrink-0 border-b border-stone-200 dark:border-stone-800 pb-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold text-red-700 dark:text-red-400">
            5.4.2 · Keberkesanan, Penyalahgunaan Ubat &amp; Kawalan KKM (Gambar foto 5.10 · m.s. 183–184)
          </div>
          <h2 className="font-display text-[29px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Kesan Penyalahgunaan Ubat &amp; Penyeliaan NPRA
          </h2>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div className="col-span-6 flex flex-col justify-between gap-2.5">
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
                    <span className="font-display text-[19px] font-bold text-stone-900 dark:text-stone-100">
                      {idx + 1}. {item.title}
                    </span>
                    <AlertOctagon className={`w-5 h-5 shrink-0 ${active ? 'text-red-600' : 'text-stone-400'}`} />
                  </div>
                  {active && (
                    <div
                      data-storage-scope={`slide:4/misuse:${idx}`}
                      className="mt-2.5 space-y-1.5 text-[15px] text-stone-800 dark:text-stone-200 leading-snug"
                    >
                      <p>
                        <strong>Punca:</strong> {item.cause}
                      </p>
                      <p className="flex items-start gap-1.5">
                        <ArrowRight className="w-4 h-4 text-red-700 shrink-0 mt-1" />
                        <span>{item.bodyProcess}</span>
                      </p>
                      <p className="text-red-800 dark:text-red-300 font-bold">
                        <strong>Kesan penyalahgunaan:</strong> {item.impact}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-display text-[17px] font-bold text-stone-900 dark:text-stone-100">
              <FileCheck2 className="w-5 h-5 text-blue-900 dark:text-blue-400" />
              <span>Penyelarasan &amp; Kawalan di Malaysia (m.s. 184)</span>
            </div>
            <ul className="text-[14.5px] text-stone-800 dark:text-stone-200 space-y-1 leading-snug">
              <li>
                · <strong>Akta Perubatan Tradisional dan Komplementari 2016</strong> — memastikan rawatan tradisional memenuhi kriteria kerajaan.
              </li>
              <li>
                · <strong>Dasar Perubatan Tradisional dan Komplementari Kebangsaan</strong> — memastikan ubat dan rawatan selamat serta berkualiti.
              </li>
              <li>
                · <strong>Bahagian Regulatori Farmasi Negara (NPRA)</strong> — menyelia kualiti dan keselamatan ubat serta kosmetik.
              </li>
            </ul>
          </div>
        </div>

        <div className="col-span-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
              Cara Semak Pendaftaran KKM (m.s. 184)
            </div>
            <h3 className="font-display text-[26px] font-bold text-stone-900 dark:text-stone-100 mt-0.5 leading-tight">
              Semak Nombor MAL (Ubat) &amp; NOT (Kosmetik)
            </h3>
            <p className="text-[16px] text-stone-700 dark:text-stone-300 mt-1.5 leading-snug">
              <strong>MAL</strong> = Ubat berdaftar. <strong>NOT</strong> = Kosmetik bernotifikasi yang diselia oleh NPRA.
            </p>

            <div className="mt-4">
              <label htmlFor="npra-code-input" className="block text-[15px] font-bold text-stone-800 dark:text-stone-200 mb-1.5">
                Masukkan nombor pendaftaran pada label:
              </label>
              <input
                id="npra-code-input"
                type="text"
                value={interactions.npraInput}
                onChange={(e) => onPatch({ npraInput: e.target.value })}
                placeholder="MAL19981234X atau NOT230501234K"
                className="w-full tabular-nums-clean text-[20px] font-bold px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { code: 'MAL19981234X', label: 'Contoh Ubat (MAL)' },
                { code: 'NOT230501234K', label: 'Contoh Kosmetik (NOT)' },
                { code: 'TIADA-KOD', label: 'Tiada Kod Sah' },
              ].map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => onPatch({ npraInput: preset.code })}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-[15px] font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div
            data-storage-scope={`slide:4/npra:${npraResult.category}`}
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
            <div className="space-y-1">
              <div className="text-[17px] font-bold">{npraResult.label}</div>
              <p className="text-[15px] leading-snug">{npraResult.chemicalCheckSummary}</p>
              <p className="text-[14px] opacity-90 leading-snug">{npraResult.guidance}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
