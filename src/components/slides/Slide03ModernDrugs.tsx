import React from 'react';
import { AlertCircle, Atom, CheckCircle2, ShieldAlert, UserCheck } from 'lucide-react';
import { MODERN_DRUGS, ModernDrugItem } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { assessDrugForPatient, PatientProfileId } from '../../utils/presentationEngine';

interface Slide03Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

const CATEGORIES: {
  id: ModernDrugItem['categoryId'];
  name: string;
  subDrugs: string[];
}[] = [
  { id: 'analgesik', name: '1. Analgesik (Tahan Sakit)', subDrugs: ['aspirin', 'parasetamol', 'kodeina'] },
  { id: 'antimikrob', name: '2. Antimikrob (Lawan Kuman)', subDrugs: ['antibiotik', 'antiseptik', 'disinfektan'] },
  { id: 'psikotik', name: '3. Ubat Psikotik', subDrugs: ['psikotik'] },
  { id: 'antialergi', name: '4. Antialergi', subDrugs: ['antialergi'] },
  { id: 'kortikosteroid', name: '5. Kortikosteroid', subDrugs: ['kortikosteroid'] },
];

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
    <div className="h-full w-full flex flex-col gap-3.5 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-2.5">
        <div>
          <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
            5.4.1 &amp; 5.4.2 · Ubat Moden (Rajah 5.14 &amp; Jadual 5.7)
          </div>
          <h2 className="font-display text-[29px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Setiap Ubat Moden Ialah Kunci Molekul Khusus — Salah Pesakit Menjadi Bahaya
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onPatch({ molecularLens: !interactions.molecularLens })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[15px] font-bold shrink-0 cursor-pointer transition-colors ${
            interactions.molecularLens
              ? 'border-indigo-700 bg-indigo-900 text-white'
              : 'border-stone-300 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-stone-50'
          }`}
        >
          <Atom className="w-4 h-4" />
          <span>{interactions.molecularLens ? 'Perincian Molekul: Hidup' : 'Perincian Molekul'}</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div className="col-span-5 flex flex-col justify-between gap-2">
          {CATEGORIES.map((cat) => {
            const drugsInCat = MODERN_DRUGS.filter((d) => cat.subDrugs.includes(d.id));
            const catSelected = activeDrug.categoryId === cat.id;
            return (
              <div
                key={cat.id}
                className={`rounded-2xl border px-4 py-2.5 transition-colors ${
                  catSelected
                    ? 'border-blue-800 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    onPatch({
                      drugCategoryId: cat.id,
                      selectedDrugId: drugsInCat[0]?.id ?? 'aspirin',
                    })
                  }
                  className="w-full text-left font-display text-[18px] font-bold text-stone-900 dark:text-stone-100 cursor-pointer flex items-center justify-between"
                >
                  <span>{cat.name}</span>
                  {drugsInCat.length === 1 && (
                    <span className="text-[14px] font-medium text-stone-600 dark:text-stone-400">
                      {drugsInCat[0].examples.join(', ')}
                    </span>
                  )}
                </button>

                {drugsInCat.length > 1 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {drugsInCat.map((d) => {
                      const picked = d.id === activeDrug.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => onPatch({ drugCategoryId: cat.id, selectedDrugId: d.id })}
                          className={`px-3.5 py-1.5 rounded-xl text-[15px] font-bold transition-colors cursor-pointer ${
                            picked
                              ? 'bg-blue-900 text-white'
                              : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="text-[14px] text-stone-600 dark:text-stone-400 px-1">
            <strong>Ibnu Sina</strong> (Bapa Perubatan Moden) · Pil, kapsul, serbuk &amp; larutan
          </div>
        </div>

        <div className="col-span-7 flex flex-col justify-between gap-3.5">
          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 space-y-3">
            <div className="flex items-baseline justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
              <div>
                <span className="text-[15px] font-bold text-blue-900 dark:text-blue-400">{activeDrug.categoryName}</span>
                <h3 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {activeDrug.name}
                </h3>
              </div>
              <div className="text-[15px] font-semibold text-stone-700 dark:text-stone-300 text-right">
                Contoh: {activeDrug.examples.join(', ')}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-stretch">
              <div className="col-span-6 bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3.5">
                <div className="text-[14px] font-bold text-blue-900 dark:text-blue-400">
                  Mekanisme Kunci &amp; Sasaran
                </div>
                <p className="text-[16px] font-semibold text-stone-900 dark:text-stone-100 mt-1 leading-snug">
                  {activeDrug.functionDesc}
                </p>
                <p className="text-[15px] text-stone-700 dark:text-stone-300 mt-1.5 leading-snug">
                  {activeDrug.targetLock}
                </p>
              </div>

              <div className="col-span-6 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl p-3.5">
                <div className="text-[14px] font-bold text-amber-900 dark:text-amber-300">
                  Mengapa Kesan Sampingan Berlaku?
                </div>
                <p className="text-[15px] text-stone-900 dark:text-stone-100 mt-1 leading-snug">
                  {activeDrug.whySideEffectHappens}
                </p>
              </div>
            </div>

            <div className="text-[15px] text-stone-700 dark:text-stone-300">
              <strong>Aturan Guna:</strong> {activeDrug.usageRule}
            </div>
          </div>

          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-blue-900 dark:text-blue-400" />
                <span className="font-display text-[18px] font-bold text-stone-900 dark:text-stone-100">
                  Uji Kesesuaian pada Pesakit Berbeza
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {PATIENT_PROFILES.map((p) => {
                  const active = p.id === interactions.selectedPatient;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onPatch({ selectedPatient: p.id })}
                      className={`text-center py-2.5 px-2 rounded-xl border transition-colors cursor-pointer text-[14px] font-bold ${
                        active
                          ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                          : 'border-stone-200 dark:border-stone-800 bg-[#FBF9F5] dark:bg-stone-950 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`mt-2.5 rounded-xl border p-3.5 flex items-start gap-3 ${
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
                <div className="text-[17px] font-bold leading-snug">{assessment.headline}</div>
                <p className="text-[15px] mt-0.5 leading-snug">{assessment.mechanismReason}</p>
                {interactions.molecularLens && (
                  <p className="text-[14px] mt-1 font-semibold opacity-90">
                    Mekanisme molekul: {assessment.molecularDeepDive}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
