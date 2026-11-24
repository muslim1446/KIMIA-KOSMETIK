import React from 'react';
import { AlertCircle, Atom, CheckCircle2, FlaskConical, ShieldAlert } from 'lucide-react';
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
  { id: 'analgesik', name: '1. Analgesik', subDrugs: ['aspirin', 'parasetamol', 'kodeina'] },
  { id: 'antimikrob', name: '2. Antimikrob', subDrugs: ['antibiotik', 'antiseptik', 'disinfektan'] },
  { id: 'psikotik', name: '3. Ubat psikotik', subDrugs: ['psikotik'] },
  { id: 'antialergi', name: '4. Antialergi', subDrugs: ['antialergi'] },
  { id: 'kortikosteroid', name: '5. Kortikosteroid', subDrugs: ['kortikosteroid'] },
];

const PATIENT_PROFILES: { id: PatientProfileId; label: string }[] = [
  { id: 'dewasa_sihat', label: 'Pengambilan Biasa' },
  { id: 'pesakit_gastrik', label: 'Pesakit Gastrik' },
  { id: 'kanak_kanak', label: 'Kanak-kanak' },
  { id: 'alahan_penisilin', label: 'Alahan Penisilin' },
  { id: 'luka_luaran', label: 'Bahagian Luar' },
];

export const Slide03ModernDrugs: React.FC<Slide03Props> = ({ interactions, onPatch }) => {
  const activeDrug = MODERN_DRUGS.find((d) => d.id === interactions.selectedDrugId) ?? MODERN_DRUGS[0];
  const assessment = assessDrugForPatient(activeDrug.id, interactions.selectedPatient);

  return (
    <div className="h-full w-full flex flex-col gap-3.5 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-4 apple-hairline-b pb-2.5">
        <div>
          <div className="text-[15px] font-bold text-[var(--apple-blue-fg)] tabular-nums-clean">
            5.4.1 &amp; 5.4.2 · Ubat Moden (Rajah 5.14 &amp; Jadual 5.7 · m.s. 182–183)
          </div>
          <h2 className="font-display text-[29px] font-bold text-[var(--apple-label)] mt-0.5 leading-tight">
            Ubat Moden: Jenis, Fungsi, Cara Penggunaan &amp; Kesan Sampingan
          </h2>
        </div>

        <button
          type="button"
          aria-pressed={interactions.molecularLens}
          onClick={() => onPatch({ molecularLens: !interactions.molecularLens })}
          className={`apple-pressable apple-tap-target flex items-center gap-2 px-4 py-2 rounded-[13px] border text-[15px] font-bold shrink-0 cursor-pointer ${
            interactions.molecularLens
              ? 'border-[var(--apple-blue)] bg-[var(--apple-blue)] text-white shadow-sm'
              : 'apple-slide-card hover:bg-[var(--apple-fill)]'
          }`}
        >
          <Atom className="w-4 h-4 shrink-0" />
          <span>{interactions.molecularLens ? 'Rujukan Jadual: Aktif' : 'Rujukan Jadual'}</span>
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
                className={`rounded-[18px] px-4 py-2.5 transition-colors ${
                  catSelected
                    ? 'apple-slide-card border-[var(--apple-blue)] bg-blue-50/75 dark:bg-blue-950/35'
                    : 'apple-slide-card'
                }`}
              >
                <button
                  type="button"
                  aria-selected={catSelected && drugsInCat.length === 1}
                  onClick={() =>
                    onPatch({
                      drugCategoryId: cat.id,
                      selectedDrugId: drugsInCat[0]?.id ?? 'aspirin',
                    })
                  }
                  className="apple-pressable apple-tap-target w-full text-left font-display text-[18px] font-bold text-[var(--apple-label)] cursor-pointer flex items-center justify-between rounded-[10px]"
                >
                  <span className="tabular-nums-clean">{cat.name}</span>
                  {drugsInCat.length === 1 && (
                    <span className="text-[14px] font-medium text-[var(--apple-secondary-label)]">
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
                          aria-selected={picked}
                          onClick={() => onPatch({ drugCategoryId: cat.id, selectedDrugId: d.id })}
                          className={`apple-pressable apple-tap-target px-3.5 py-1.5 rounded-[11px] text-[15px] font-bold cursor-pointer ${
                            picked
                              ? 'bg-[var(--apple-blue)] text-white shadow-sm'
                              : 'apple-slide-inset hover:bg-[var(--apple-fill)]'
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

          <div className="text-[14px] text-[var(--apple-secondary-label)] px-1 leading-snug">
            <strong className="text-[var(--apple-label)]">Ibnu Sina</strong> (Bapa Perubatan Moden) · Sumber tumbuhan, mikroorganisma atau bahan kimia sintetik · Bentuk: pil, kapsul, serbuk, larutan
          </div>
        </div>

        <div className="col-span-7 flex flex-col justify-between gap-3.5">
          <div
            data-storage-scope={`slide:2/drug:${activeDrug.id}`}
            className="apple-slide-card rounded-[22px] p-5 space-y-3"
          >
            <div className="flex items-baseline justify-between gap-2 apple-hairline-b pb-2.5">
              <div>
                <span className="text-[15px] font-bold text-[var(--apple-blue-fg)]">{activeDrug.categoryName}</span>
                <h3 className="font-display text-[28px] font-bold text-[var(--apple-label)] leading-tight">
                  {activeDrug.name}
                </h3>
              </div>
              <div className="text-[15px] font-semibold text-[var(--apple-secondary-label)] text-right">
                Contoh: {activeDrug.examples.join(', ')}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-stretch">
              <div className="col-span-6 apple-slide-inset rounded-[14px] p-3.5">
                <div className="text-[14px] font-bold text-[var(--apple-blue-fg)] tabular-nums-clean">
                  Fungsi (Jadual 5.7)
                </div>
                <p className="text-[16px] font-semibold text-[var(--apple-label)] mt-1 leading-snug">
                  {activeDrug.functionDesc}
                </p>
              </div>

              <div className="col-span-6 bg-amber-50/85 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-700/50 rounded-[14px] p-3.5">
                <div className="text-[14px] font-bold text-[var(--apple-orange-fg)]">
                  Kesan Sampingan (Jadual 5.7)
                </div>
                <p className="text-[15px] text-[var(--apple-label)] mt-1 leading-snug">
                  {activeDrug.sideEffects}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-[14.5px] text-[var(--apple-secondary-label)]">
              <div>
                <strong className="text-[var(--apple-label)]">Cara Penggunaan:</strong> {activeDrug.usageRule}
              </div>
              <div className="text-[var(--apple-blue-fg)] font-semibold">
                {activeDrug.summaryNote}
              </div>
            </div>
          </div>

          <div className="apple-slide-card rounded-[22px] p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <FlaskConical className="w-5 h-5 text-[var(--apple-blue-fg)]" />
                <span className="font-display text-[18px] font-bold text-[var(--apple-label)]">
                  Semakan Kesesuaian Mengikut Jadual 5.7
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {PATIENT_PROFILES.map((p) => {
                  const active = p.id === interactions.selectedPatient;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-selected={active}
                      onClick={() => onPatch({ selectedPatient: p.id })}
                      className={`apple-pressable apple-tap-target text-center py-2.5 px-2 rounded-[12px] border cursor-pointer text-[14px] font-bold ${
                        active
                          ? 'border-[var(--apple-label)] bg-[var(--apple-label)] text-[var(--apple-bg-base)] shadow-sm'
                          : 'apple-slide-inset hover:bg-[var(--apple-fill)]'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              data-storage-scope={`slide:2/drug:${activeDrug.id}/patient:${interactions.selectedPatient}`}
              className={`mt-2.5 rounded-[14px] border p-3.5 flex items-start gap-3 ${
                assessment.riskLevel === 'selamat'
                  ? 'border-emerald-300 dark:border-emerald-800/70 bg-emerald-50/90 dark:bg-emerald-950/35 text-emerald-950 dark:text-emerald-100'
                  : assessment.riskLevel === 'berjaga'
                  ? 'border-amber-300 dark:border-amber-800/70 bg-amber-50/90 dark:bg-amber-950/35 text-amber-950 dark:text-amber-100'
                  : 'border-red-300 dark:border-red-800/70 bg-red-50/90 dark:bg-red-950/35 text-red-950 dark:text-red-100'
              }`}
            >
              {assessment.riskLevel === 'selamat' ? (
                <CheckCircle2 className="w-6 h-6 text-[var(--apple-green-fg)] shrink-0 mt-0.5" />
              ) : assessment.riskLevel === 'berjaga' ? (
                <AlertCircle className="w-6 h-6 text-[var(--apple-orange-fg)] shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-[var(--apple-red-fg)] shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-[17px] font-bold leading-snug">{assessment.headline}</div>
                <p className="text-[15px] mt-0.5 leading-snug">{assessment.mechanismReason}</p>
                {interactions.molecularLens && (
                  <p className="text-[14px] mt-1 font-semibold opacity-90">{assessment.textbookNote}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
