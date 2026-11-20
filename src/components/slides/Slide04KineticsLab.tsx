import React from 'react';
import { Activity, AlertTriangle, FlaskConical, ShieldCheck } from 'lucide-react';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { evaluateParacetamolDose, simulateAntibioticCourse } from '../../utils/presentationEngine';

interface Slide04Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

export const Slide04KineticsLab: React.FC<Slide04Props> = ({ interactions, onPatch }) => {
  const sim = simulateAntibioticCourse(interactions.antibioticMode === 'stop3' ? 3 : null);
  const currentDayPoint = sim.points[Math.min(7, Math.max(0, interactions.antibioticDay))] ?? sim.points[7];
  const para = evaluateParacetamolDose(interactions.paracetamolMg);

  const chartW = 400;
  const chartH = 165;
  const mapX = (day: number) => 34 + (day / 7) * (chartW - 56);
  const mapY = (val: number) => chartH - 26 - (Math.min(130, val) / 130) * (chartH - 46);

  const totalPath = sim.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.day)} ${mapY(p.totalBacteria)}`).join(' ');
  const resistantPath = sim.points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.day)} ${mapY(p.resistantBacteria)}`)
    .join(' ');

  return (
    <div className="h-full w-full flex flex-col gap-5 px-10 py-8 select-none">
      {/* Header */}
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3.5">
        <div>
          <div className="text-sm font-semibold text-blue-800 dark:text-blue-400">
            5.4.2 · Penggunaan Ubat dengan Betul
          </div>
          <h2 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Rintangan Antibiotik, Sukatan Dos & Plasebo
          </h2>
        </div>

        <div className="flex gap-2" role="tablist" aria-label="Pilih Demonstrasi">
          {(
            [
              { id: 'antibiotik', label: '1. Habiskan Antibiotik' },
              { id: 'parasetamol', label: '2. Dos Parasetamol' },
              { id: 'plasebo', label: '3. Apa Itu Plasebo?' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={interactions.placeboTab === tab.id}
              onClick={() => onPatch({ placeboTab: tab.id })}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                interactions.placeboTab === tab.id
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
        {interactions.placeboTab === 'antibiotik' && (
          <>
            <div className="col-span-7 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-stone-500">Bilangan Bakteria (Hari 0–7)</div>
                  <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                    Mengapa Antibiotik Mesti Dihabiskan?
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onPatch({ antibioticMode: 'full', antibioticDay: 7 })}
                    className={`px-3.5 py-2 rounded-xl border text-sm font-bold cursor-pointer ${
                      interactions.antibioticMode === 'full'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Habiskan 7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => onPatch({ antibioticMode: 'stop3', antibioticDay: 7 })}
                    className={`px-3.5 py-2 rounded-xl border text-sm font-bold cursor-pointer ${
                      interactions.antibioticMode === 'stop3'
                        ? 'border-red-600 bg-red-50 text-red-800 dark:bg-red-950/70 dark:text-red-200'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Berhenti Hari ke-3
                  </button>
                </div>
              </div>

              <div className="my-3 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-4">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-48" role="img" aria-label="Graf populasi bakteria">
                  <line x1="34" y1="12" x2="34" y2={chartH - 26} stroke="#D6D3D1" strokeWidth="2" />
                  <line x1="34" y1={chartH - 26} x2={chartW - 14} y2={chartH - 26} stroke="#D6D3D1" strokeWidth="2" />

                  {interactions.antibioticMode === 'stop3' && (
                    <g>
                      <line
                        x1={mapX(3)}
                        y1="14"
                        x2={mapX(3)}
                        y2={chartH - 26}
                        stroke="#B91C1C"
                        strokeDasharray="4 4"
                        strokeWidth="2"
                      />
                      <text x={mapX(3) + 6} y="24" fontSize="12" fill="#B91C1C" fontWeight="700">
                        Berhenti Hari 3
                      </text>
                    </g>
                  )}

                  <path d={totalPath} fill="none" stroke="#1E40AF" strokeWidth="3.5" />
                  <path d={resistantPath} fill="none" stroke="#B91C1C" strokeWidth="3.5" strokeDasharray="6 4" />

                  <circle cx={mapX(currentDayPoint.day)} cy={mapY(currentDayPoint.totalBacteria)} r="5.5" fill="#1E40AF" />
                  <circle cx={mapX(currentDayPoint.day)} cy={mapY(currentDayPoint.resistantBacteria)} r="5.5" fill="#B91C1C" />

                  {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <text key={d} x={mapX(d)} y={chartH - 8} textAnchor="middle" fontSize="11.5" fill="#57534E" fontWeight="600">
                      H{d}
                    </text>
                  ))}
                </svg>
                <div className="flex items-center justify-between text-sm text-stone-700 dark:text-stone-300 mt-1 px-2">
                  <span>Biru: Semua bakteria · Merah putus: Bakteria imun</span>
                  <span className="tabular-nums-clean font-bold">
                    Hari {currentDayPoint.day}: {currentDayPoint.totalBacteria} koloni
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label htmlFor="abx-day-slider" className="text-base font-bold text-stone-700 dark:text-stone-300 shrink-0">
                  Hari ke-{interactions.antibioticDay}
                </label>
                <input
                  id="abx-day-slider"
                  type="range"
                  min={0}
                  max={7}
                  step={1}
                  value={interactions.antibioticDay}
                  onChange={(e) => onPatch({ antibioticDay: Number(e.target.value) })}
                  className="w-full accent-stone-900 cursor-pointer h-2"
                />
              </div>
            </div>

            <div className="col-span-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-6 flex flex-col justify-between">
              <div className="text-center">
                <div className="text-base font-bold text-stone-700 dark:text-stone-300">
                  Piring Petri (Hari ke-{currentDayPoint.day})
                </div>
                <svg viewBox="0 0 180 180" className="w-56 h-56 mx-auto my-2" aria-hidden="true">
                  <circle cx="90" cy="90" r="80" fill="#FBF9F5" stroke="#A8A29E" strokeWidth="3.5" />
                  <circle cx="90" cy="90" r="72" fill="#F5F5F4" stroke="#E7E5E4" strokeWidth="1.5" />
                  {Array.from({ length: Math.min(24, Math.ceil(currentDayPoint.sensitiveBacteria / 4)) }).map((_, i) => {
                    const angle = i * 2.4;
                    const rad = 14 + ((i * 11) % 48);
                    return (
                      <circle
                        key={`s-${i}`}
                        cx={90 + Math.cos(angle) * rad}
                        cy={90 + Math.sin(angle) * rad}
                        r="4.5"
                        fill="#1E40AF"
                        opacity="0.75"
                      />
                    );
                  })}
                  {Array.from({ length: Math.min(24, Math.ceil(currentDayPoint.resistantBacteria / 4)) }).map((_, i) => {
                    const angle = i * 1.9 + 0.6;
                    const rad = 10 + ((i * 13) % 52);
                    return (
                      <circle
                        key={`r-${i}`}
                        cx={90 + Math.cos(angle) * rad}
                        cy={90 + Math.sin(angle) * rad}
                        r="5.5"
                        fill="#B91C1C"
                      />
                    );
                  })}
                </svg>
              </div>

              <div
                className={`rounded-xl border p-4 text-sm leading-relaxed ${
                  sim.outcome === 'sembuh_sepenuhnya'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                    : 'border-red-300 bg-red-50 text-red-950'
                }`}
              >
                <div className="text-base font-bold mb-1">
                  {sim.outcome === 'sembuh_sepenuhnya'
                    ? 'Semua bakteria berjaya dibunuh'
                    : `Amaran: ${sim.resistanceRatio}% bakteria imun membiak semula`}
                </div>
                {sim.summary}
              </div>
            </div>
          </>
        )}

        {interactions.placeboTab === 'parasetamol' && (
          <div className="col-span-12 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-8 grid grid-cols-12 gap-8 items-center">
            <div className="col-span-7 space-y-5">
              <div>
                <div className="text-sm font-semibold text-blue-800 dark:text-blue-400">Sukatan Dos Harian Dewasa</div>
                <h3 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                  Parasetamol: Mengapa Dos Tepat Penting?
                </h3>
                <p className="text-lg text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                  Parasetamol selamat melegakan sakit dan demam, namun pengambilan melebihi had harian menyebabkan kerosakan hati.
                </p>
              </div>

              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="para-slider" className="text-base font-bold text-stone-800 dark:text-stone-200">
                    Jumlah Dos Sehari
                  </label>
                  <span className="tabular-nums-clean text-2xl font-bold text-stone-900 dark:text-stone-50">
                    {interactions.paracetamolMg} mg / hari
                  </span>
                </div>
                <input
                  id="para-slider"
                  type="range"
                  min={500}
                  max={8000}
                  step={500}
                  value={interactions.paracetamolMg}
                  onChange={(e) => onPatch({ paracetamolMg: Number(e.target.value) })}
                  className="w-full accent-stone-900 dark:accent-stone-100 cursor-pointer h-2"
                />
                <div className="flex justify-between tabular-nums-clean text-sm font-medium text-stone-500 dark:text-stone-400">
                  <span>500 mg</span>
                  <span>Had selamat: 4000 mg</span>
                  <span>8000 mg (Berlebihan)</span>
                </div>
              </div>
            </div>

            <div className="col-span-5 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-stone-700 dark:text-stone-200">Kesan kepada Hati</span>
                <Activity className="w-5 h-5 text-blue-800 dark:text-blue-400" />
              </div>
              <div className="w-full h-6 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    para.status === 'amaran_hati'
                      ? 'bg-red-600'
                      : para.status === 'terapeutik'
                      ? 'bg-emerald-700'
                      : 'bg-blue-700'
                  }`}
                  style={{ width: `${para.liverLoadPercent}%` }}
                />
              </div>
              <div className="tabular-nums-clean text-base font-semibold text-stone-700 dark:text-stone-300">
                Tahap beban pada hati: {para.liverLoadPercent}%
              </div>
              <div
                className={`p-4 rounded-xl border text-base font-bold ${
                  para.status === 'amaran_hati'
                    ? 'border-red-300 bg-red-50 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
                }`}
              >
                {para.label}
              </div>
            </div>
          </div>
        )}

        {interactions.placeboTab === 'plasebo' && (
          <div className="col-span-12 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-8 grid grid-cols-12 gap-8 items-center">
            <div className="col-span-6 space-y-4">
              <div className="text-sm font-semibold text-blue-800 dark:text-blue-400">Ujian Klinikal Perubatan (m.s. 184)</div>
              <h3 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-100">Apakah Itu Plasebo?</h3>
              <p className="text-lg text-stone-700 dark:text-stone-300 leading-relaxed">
                Plasebo ialah bahan yang menyerupai ubat sebenar dari segi rupa, tetapi{' '}
                <strong>tidak mempunyai sebarang nilai terapeutik atau bahan ubat aktif</strong>.
              </p>
              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-5 text-base text-stone-700 dark:text-stone-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                  <FlaskConical className="w-5 h-5 text-blue-800 dark:text-blue-400" />
                  <span>Mengapa digunakan dalam kajian ubat baharu?</span>
                </div>
                <p>
                  Sebagai perbandingan untuk memastikan sesuatu ubat moden benar-benar berkesan merawat penyakit.
                </p>
              </div>
            </div>

            <div className="col-span-6 grid grid-cols-2 gap-4">
              <div className="border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl p-6 space-y-2.5">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-base">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Ubat Sebenar</span>
                </div>
                <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">Ada Bahan Ubat</div>
                <p className="text-base text-stone-700 dark:text-stone-300 leading-relaxed">
                  Mengandungi sukatan bahan kimia ubat yang diuji melalui kajian klinikal.
                </p>
              </div>

              <div className="border border-stone-200 dark:border-stone-800 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-6 space-y-2.5">
                <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold text-base">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Plasebo</span>
                </div>
                <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">Tiada Kesan Ubat</div>
                <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                  Rupa sama seperti pil sebenar, tetapi tidak mengandungi bahan rawatan.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
