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
      <div className="shrink-0 apple-hairline-b pb-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold text-[var(--apple-red-fg)] tabular-nums-clean">
            5.4.2 · Keberkesanan, Penyalahgunaan Ubat &amp; Kawalan KKM (Gambar foto 5.10 · m.s. 183–184)
          </div>
          <h2 className="font-display text-[29px] font-bold text-[var(--apple-label)] mt-0.5 leading-tight">
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
                  aria-selected={active}
                  onClick={() => onPatch({ misuseCaseIndex: idx })}
                  className={`apple-pressable apple-tap-target w-full text-left rounded-[18px] p-4 cursor-pointer ${
                    active
                      ? 'apple-slide-card border-[var(--apple-red-fg)] bg-red-50/85 dark:bg-red-950/35'
                      : 'apple-slide-card hover:bg-[var(--apple-fill)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[19px] font-bold text-[var(--apple-label)] tabular-nums-clean">
                      {idx + 1}. {item.title}
                    </span>
                    <AlertOctagon className={`w-5 h-5 shrink-0 ${active ? 'text-[var(--apple-red-fg)]' : 'text-[var(--apple-tertiary-label)]'}`} />
                  </div>
                  {active && (
                    <div
                      data-storage-scope={`slide:4/misuse:${idx}`}
                      className="mt-2.5 space-y-1.5 text-[15px] text-[var(--apple-label)] leading-snug"
                    >
                      <p>
                        <strong>Punca:</strong> {item.cause}
                      </p>
                      <p className="flex items-start gap-1.5">
                        <ArrowRight className="w-4 h-4 text-[var(--apple-red-fg)] shrink-0 mt-1" />
                        <span>{item.bodyProcess}</span>
                      </p>
                      <p className="text-[var(--apple-red-fg)] font-bold">
                        <strong>Kesan penyalahgunaan:</strong> {item.impact}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="apple-slide-card rounded-[20px] p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-display text-[17px] font-bold text-[var(--apple-label)]">
              <FileCheck2 className="w-5 h-5 text-[var(--apple-blue-fg)]" />
              <span className="tabular-nums-clean">Penyelarasan &amp; Kawalan di Malaysia (m.s. 184)</span>
            </div>
            <ul className="text-[14.5px] text-[var(--apple-secondary-label)] space-y-1 leading-snug">
              <li>
                · <strong className="text-[var(--apple-label)]">Akta Perubatan Tradisional dan Komplementari 2016</strong> — memastikan rawatan tradisional memenuhi kriteria kerajaan.
              </li>
              <li>
                · <strong className="text-[var(--apple-label)]">Dasar Perubatan Tradisional dan Komplementari Kebangsaan</strong> — memastikan ubat dan rawatan selamat serta berkualiti.
              </li>
              <li>
                · <strong className="text-[var(--apple-label)]">Bahagian Regulatori Farmasi Negara (NPRA)</strong> — menyelia kualiti dan keselamatan ubat serta kosmetik.
              </li>
            </ul>
          </div>
        </div>

        <div className="col-span-6 apple-slide-card rounded-[24px] p-6 flex flex-col justify-between">
          <div>
            <div className="text-[15px] font-bold text-[var(--apple-blue-fg)] tabular-nums-clean">
              Cara Semak Pendaftaran KKM (m.s. 184)
            </div>
            <h3 className="font-display text-[26px] font-bold text-[var(--apple-label)] mt-0.5 leading-tight">
              Semak Nombor MAL (Ubat) &amp; NOT (Kosmetik)
            </h3>
            <p className="text-[16px] text-[var(--apple-secondary-label)] mt-1.5 leading-snug">
              <strong className="text-[var(--apple-label)]">MAL</strong> = Ubat berdaftar. <strong className="text-[var(--apple-label)]">NOT</strong> = Kosmetik bernotifikasi yang diselia oleh NPRA.
            </p>

            <div className="mt-4">
              <label htmlFor="npra-code-input" className="block text-[15px] font-bold text-[var(--apple-label)] mb-1.5">
                Masukkan nombor pendaftaran pada label:
              </label>
              <input
                id="npra-code-input"
                type="text"
                value={interactions.npraInput}
                onChange={(e) => onPatch({ npraInput: e.target.value })}
                placeholder="MAL19981234X atau NOT230501234K"
                className="w-full tabular-nums-clean text-[20px] font-bold px-4 py-3 rounded-[14px] apple-slide-inset text-[var(--apple-label)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-blue)]"
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
                  className="apple-pressable apple-tap-target px-3.5 py-2 rounded-[12px] apple-slide-inset text-[15px] font-bold text-[var(--apple-label)] hover:bg-[var(--apple-fill)] cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div
            data-storage-scope={`slide:4/npra:${npraResult.category}`}
            className={`mt-4 rounded-[16px] border p-4 flex items-start gap-3 ${
              npraResult.validFormat
                ? 'border-emerald-300 dark:border-emerald-800/70 bg-emerald-50/90 dark:bg-emerald-950/35 text-emerald-950 dark:text-emerald-100'
                : 'border-red-300 dark:border-red-800/70 bg-red-50/90 dark:bg-red-950/35 text-red-950 dark:text-red-100'
            }`}
          >
            {npraResult.validFormat ? (
              <CheckCircle2 className="w-6 h-6 text-[var(--apple-green-fg)] shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-[var(--apple-red-fg)] shrink-0 mt-0.5" />
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
