import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, UserCheck } from 'lucide-react';
import { MODERN_DRUGS } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { assessDrugForPatient, PatientProfileId } from '../../utils/presentationEngine';

interface Slide03Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

const PATIENT_PROFILES: { id: PatientProfileId; label: string }[] = [
  { id: 'dewasa_sihat', label: 'Dewasa Sihat' },
  { id: 'pesakit_gastrik', label: 'Pesakit Gastrik' },
  { id: 'kanak_kanak', label: 'Kanak-kanak' },
  { id: 'alahan_penisilin', label: 'Alahan Penisilin' },
  { id: 'luka_luaran', label: 'Luka Terbuka' },
];

export const Slide03ModernDrugs: React.FC<Slide03Props> = ({ interactions, onPatch }) => {
  const activeDrug = MODERN_DRUGS.find((d) => d.id === interactions.selectedDrugId) ?? MODERN_DRUGS[0];
  const assessment = assessDrugForPatient(activeDrug.id, interactions.selectedPatient);

  return (
    <div className="h-full w-full flex flex-col gap-4 px-10 py-7 select-none">
      {/* Header + Ibnu Sina */}
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <div className="text-sm font-semibold text-blue-800 dark:text-blue-400">
            5.4.1 & 5.4.2 · Ubat Moden (Jadual 5.7)
          </div>
          <h2 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Lima Pengelasan Ubat Moden & Kesesuaian Pesakit
          </h2>
        </div>
        <div className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-2 text-sm text-stone-700 dark:text-stone-300 shrink-0">
          <strong>Ibnu Sina</strong> (Bapa Perubatan Moden) · Pil, kapsul, serbuk & larutan
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        {/* Left: 9 Modern Drugs in clean readable rows */}
        <div className="col-span-4 flex flex-col justify-between gap-1.5">
          {MODERN_DRUGS.map((drug) => {
            const selected = drug.id === activeDrug.id;
            return (
              <button
                key={drug.id}
                type="button"
                onClick={() => onPatch({ selectedDrugId: drug.id })}
                className={`w-full text-left px-4 py-2 rounded-xl border transition-colors flex items-center justify-between cursor-pointer ${
                  selected
                    ? 'border-blue-800 bg-blue-50 text-blue-950 dark:bg-blue-950/60 dark:text-blue-100'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-stone-50'
                }`}
              >
                <span className="text-base font-bold">{drug.name}</span>
                <span className="text-sm text-stone-500 dark:text-stone-400">{drug.categoryName}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Drug Details + Patient Matcher */}
        <div className="col-span-8 flex flex-col gap-4 justify-between">
          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 space-y-3">
            <div className="flex items-baseline justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2.5">
              <div>
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-400">
                  {activeDrug.categoryName}
                </span>
                <h3 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-100">{activeDrug.name}</h3>
              </div>
              <div className="text-sm font-medium text-stone-600 dark:text-stone-300">
                Contoh: {activeDrug.examples.join(', ')}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3.5">
                <div className="text-sm font-bold text-stone-500">Fungsi</div>
                <p className="text-sm text-stone-800 dark:text-stone-200 mt-1 leading-snug">{activeDrug.functionDesc}</p>
              </div>
              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3.5">
                <div className="text-sm font-bold text-stone-500">Cara Guna</div>
                <p className="text-sm text-stone-800 dark:text-stone-200 mt-1 leading-snug">{activeDrug.usageRule}</p>
              </div>
              <div className="bg-amber-50/80 dark:bg-amber-950/30 rounded-xl p-3.5">
                <div className="text-sm font-bold text-amber-900 dark:text-amber-300">Kesan Sampingan</div>
                <p className="text-sm text-stone-800 dark:text-stone-200 mt-1 leading-snug">{activeDrug.sideEffects}</p>
              </div>
            </div>
          </div>

          {/* Interactive Patient Matcher */}
          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-800 dark:text-blue-400" />
                  <span className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                    Cuba Padankan dengan Pesakit
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {PATIENT_PROFILES.map((p) => {
                  const active = p.id === interactions.selectedPatient;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onPatch({ selectedPatient: p.id })}
                      className={`text-center py-2.5 px-2 rounded-xl border transition-colors cursor-pointer text-sm font-bold ${
                        active
                          ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                          : 'border-stone-200 dark:border-stone-800 bg-[#FBF9F5] dark:bg-stone-950 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`mt-3 rounded-xl border p-4 flex items-start gap-3 ${
                assessment.riskLevel === 'selamat'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100'
                  : assessment.riskLevel === 'berjaga'
                  ? 'border-amber-300 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100'
                  : 'border-red-300 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100'
              }`}
            >
              {assessment.riskLevel === 'selamat' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
              ) : assessment.riskLevel === 'berjaga' ? (
                <AlertCircle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-base font-bold">{assessment.headline}</div>
                <p className="text-sm mt-1 leading-snug">{assessment.mechanismReason}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
