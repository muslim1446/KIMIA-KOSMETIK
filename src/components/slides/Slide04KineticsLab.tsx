import React from 'react';
import { Activity, AlertTriangle, Atom, FlaskConical, ShieldCheck } from 'lucide-react';
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

  const chartW = 420;
  const chartH = 170;
  const mapX = (day: number) => 38 + (day / 7) * (chartW - 60);
  const mapY = (val: number) => chartH - 28 - (Math.min(130, val) / 130) * (chartH - 46);

  const totalPath = sim.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.day)} ${mapY(p.totalBacteria)}`).join(' ');
  const resistantPath = sim.points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.day)} ${mapY(p.resistantBacteria)}`)
    .join(' ');

  return (
    <div className="h-full w-full flex flex-col gap-4 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
            5.4.2 · Kinetik Dos, Rintangan Bakteria &amp; Plasebo
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Dos &amp; Tempoh Menentukan Siapa Menang: Rawatan atau Kerosakan
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0" role="tablist" aria-label="Pilih Demonstrasi">
          {(
            [
              { id: 'antibiotik', label: '1. Antibiotik' },
              { id: 'parasetamol', label: '2. Perisai Hati' },
              { id: 'plasebo', label: '3. Plasebo' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={interactions.placeboTab === tab.id}
              onClick={() => onPatch({ placeboTab: tab.id })}
              className={`px-3.5 py-2 rounded-xl text-[15px] font-bold transition-colors cursor-pointer ${
                interactions.placeboTab === tab.id
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPatch({ molecularLens: !interactions.molecularLens })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[14px] font-bold cursor-pointer ${
              interactions.molecularLens
                ? 'border-indigo-700 bg-indigo-900 text-white'
                : 'border-stone-300 bg-white text-stone-800'
            }`}
          >
            <Atom className="w-4 h-4" />
            <span>Biokimia</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        {interactions.placeboTab === 'antibiotik' && (
          <>
            <div className="col-span-7 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-stone-500">Populasi Bakteria (Hari 0–7)</div>
                  <h3 className="font-display text-[24px] font-bold text-stone-900 dark:text-stone-100">
                    Bukan Badan Anda yang Kebal — Bakteria Bermutasi!
                  </h3>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPatch({ antibioticMode: 'full', antibioticDay: 7 })}
                    className={`px-3.5 py-2 rounded-xl border text-[15px] font-bold cursor-pointer ${
                      interactions.antibioticMode === 'full'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                        : 'border-stone-200 text-stone-700'
                    }`}
                  >
                    Habis 7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => onPatch({ antibioticMode: 'stop3', antibioticDay: 7 })}
                    className={`px-3.5 py-2 rounded-xl border text-[15px] font-bold cursor-pointer ${
                      interactions.antibioticMode === 'stop3'
                        ? 'border-red-600 bg-red-50 text-red-800'
                        : 'border-stone-200 text-stone-700'
                    }`}
                  >
                    Berhenti Hari 3
                  </button>
                </div>
              </div>

              <div className="my-2 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-3">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-48" role="img" aria-label="Graf populasi bakteria">
                  <line x1="38" y1="14" x2="38" y2={chartH - 28} stroke="#A8A29E" strokeWidth="2" />
                  <line x1="38" y1={chartH - 28} x2={chartW - 14} y2={chartH - 28} stroke="#A8A29E" strokeWidth="2" />

                  {interactions.antibioticMode === 'stop3' && (
                    <g>
                      <line
                        x1={mapX(3)}
                        y1="14"
                        x2={mapX(3)}
                        y2={chartH - 28}
                        stroke="#B91C1C"
                        strokeDasharray="5 4"
                        strokeWidth="2.5"
                      />
                      <text x={mapX(3) + 8} y="26" fontSize="13" fill="#B91C1C" fontWeight="700">
                        Berhenti Hari 3 (Rasa Sihat)
                      </text>
                    </g>
                  )}

                  <path d={totalPath} fill="none" stroke="#1E3A8A" strokeWidth="4" />
                  <path d={resistantPath} fill="none" stroke="#B91C1C" strokeWidth="4" strokeDasharray="7 4" />

                  <circle cx={mapX(currentDayPoint.day)} cy={mapY(currentDayPoint.totalBacteria)} r="6" fill="#1E3A8A" />
                  <circle cx={mapX(currentDayPoint.day)} cy={mapY(currentDayPoint.resistantBacteria)} r="6" fill="#B91C1C" />

                  {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <text key={d} x={mapX(d)} y={chartH - 7} textAnchor="middle" fontSize="13" fill="#44403C" fontWeight="700">
                      H{d}
                    </text>
                  ))}
                </svg>
                <div className="flex items-center justify-between text-[15px] font-semibold text-stone-800 dark:text-stone-200 px-2">
                  <span>Biru: Semua bakteria · Merah putus: Bakteria kebal</span>
                  <span className="tabular-nums-clean font-bold">
                    Hari {currentDayPoint.day}: {currentDayPoint.totalBacteria} koloni
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label htmlFor="abx-day-slider" className="text-[16px] font-bold text-stone-800 dark:text-stone-200 shrink-0">
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
                  className="w-full accent-stone-900 cursor-pointer h-2.5"
                />
              </div>
            </div>

            <div className="col-span-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between">
              <div className="text-center">
                <div className="text-[17px] font-bold text-stone-800 dark:text-stone-200">
                  Keadaan Dalam Badan (Hari ke-{currentDayPoint.day})
                </div>
                <svg viewBox="0 0 180 170" className="w-48 h-44 mx-auto my-1" aria-hidden="true">
                  <circle cx="90" cy="85" r="76" fill="#FBF9F5" stroke="#A8A29E" strokeWidth="3.5" />
                  <circle cx="90" cy="85" r="68" fill="#F5F5F4" stroke="#E7E5E4" strokeWidth="1.5" />
                  {Array.from({ length: Math.min(24, Math.ceil(currentDayPoint.sensitiveBacteria / 4)) }).map((_, i) => {
                    const angle = i * 2.4;
                    const rad = 14 + ((i * 11) % 45);
                    return (
                      <circle
                        key={`s-${i}`}
                        cx={90 + Math.cos(angle) * rad}
                        cy={85 + Math.sin(angle) * rad}
                        r="5"
                        fill="#1E3A8A"
                        opacity="0.78"
                      />
                    );
                  })}
                  {Array.from({ length: Math.min(24, Math.ceil(currentDayPoint.resistantBacteria / 4)) }).map((_, i) => {
                    const angle = i * 1.9 + 0.6;
                    const rad = 10 + ((i * 13) % 48);
                    return (
                      <circle
                        key={`r-${i}`}
                        cx={90 + Math.cos(angle) * rad}
                        cy={85 + Math.sin(angle) * rad}
                        r="6"
                        fill="#B91C1C"
                      />
                    );
                  })}
                </svg>
                <div className="text-[15px] font-semibold text-stone-700 dark:text-stone-300">
                  Biru: Lemah ({currentDayPoint.sensitiveBacteria}) · Merah: Kebal ({currentDayPoint.resistantBacteria})
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 text-[15px] leading-snug ${
                  sim.outcome === 'sembuh_sepenuhnya'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                    : 'border-red-300 bg-red-50 text-red-950'
                }`}
              >
                <div className="text-[17px] font-bold mb-1">
                  {sim.outcome === 'sembuh_sepenuhnya'
                    ? 'Semua bakteria berjaya dibunuh'
                    : `Amaran: ${sim.resistanceRatio}% bakteria kebal membiak semula!`}
                </div>
                <p>{sim.summary}</p>
                {interactions.molecularLens && (
                  <p className="mt-1.5 font-semibold">{sim.mechanismDetail}</p>
                )}
              </div>
            </div>
          </>
        )}

        {interactions.placeboTab === 'parasetamol' && (
          <div className="col-span-12 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-7 grid grid-cols-12 gap-7 items-center">
            <div className="col-span-6 space-y-5">
              <div>
                <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
                  Mekanisme Penyahtoksin Hati (Had Selamat 4000 mg/hari)
                </div>
                <h3 className="font-display text-[30px] font-bold text-stone-900 dark:text-stone-100 mt-1 leading-tight">
                  Mengapa Terlebih Parasetamol Merosakkan Hati?
                </h3>
                <p className="text-[17px] text-stone-700 dark:text-stone-300 mt-2 leading-relaxed">
                  Hati mempunyai <strong>perisai antioksidan</strong> untuk meneutralkan sisa ubat. Apabila dos melampaui 4000 mg sehari, perisai habis dan sisa reaktif mula menyerang sel hati.
                </p>
              </div>

              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="para-slider" className="text-[17px] font-bold text-stone-800 dark:text-stone-200">
                    Jumlah Dos Sehari
                  </label>
                  <span className="tabular-nums-clean text-[24px] font-bold text-stone-900 dark:text-stone-50">
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
                  className="w-full accent-stone-900 dark:accent-stone-100 cursor-pointer h-2.5"
                />
                <div className="flex justify-between tabular-nums-clean text-[15px] font-bold text-stone-600 dark:text-stone-400">
                  <span>500 mg (1 biji)</span>
                  <span>Had selamat: 4000 mg</span>
                  <span>8000 mg (Toksik)</span>
                </div>
              </div>
            </div>

            <div className="col-span-6 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[18px] font-bold text-stone-900 dark:text-stone-100">Simulasi Perisai Hati</span>
                <Activity className="w-6 h-6 text-blue-900 dark:text-blue-400" />
              </div>

              <svg viewBox="0 0 360 135" className="w-full h-36" aria-label="Gambar rajah perisai hati menentang dos berlebihan">
                <rect x="12" y="24" width="94" height="86" rx="14" fill="#DBEAFE" stroke="#1E3A8A" strokeWidth="2" />
                <text x="59" y="58" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1E3A8A">
                  Dos Masuk
                </text>
                <text x="59" y="82" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1E3A8A">
                  {interactions.paracetamolMg} mg
                </text>

                <path d="M110,67 L138,67" stroke="#44403C" strokeWidth="3.5" strokeLinecap="round" />
                <polygon points="134,60 146,67 134,74" fill="#44403C" />

                <rect
                  x="150"
                  y="24"
                  width="98"
                  height="86"
                  rx="14"
                  fill={para.glutathioneShieldPercent > 35 ? '#DCFCE7' : '#FEE2E2'}
                  stroke={para.glutathioneShieldPercent > 35 ? '#15803D' : '#B91C1C'}
                  strokeWidth="2.5"
                />
                <text
                  x="199"
                  y="56"
                  textAnchor="middle"
                  fontSize="13.5"
                  fontWeight="700"
                  fill={para.glutathioneShieldPercent > 35 ? '#14532D' : '#7F1D1D'}
                >
                  Perisai Hati
                </text>
                <text
                  x="199"
                  y="82"
                  textAnchor="middle"
                  fontSize="17"
                  fontWeight="800"
                  fill={para.glutathioneShieldPercent > 35 ? '#15803D' : '#B91C1C'}
                >
                  {para.glutathioneShieldPercent}% Baki
                </text>

                <path d="M252,67 L276,67" stroke="#44403C" strokeWidth="3.5" strokeLinecap="round" />
                <polygon points="272,60 284,67 272,74" fill="#44403C" />

                <rect
                  x="286"
                  y="24"
                  width="64"
                  height="86"
                  rx="14"
                  fill={para.status === 'amaran_hati' ? '#B91C1C' : '#DCFCE7'}
                />
                <text
                  x="318"
                  y="62"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="800"
                  fill={para.status === 'amaran_hati' ? '#FFFFFF' : '#14532D'}
                >
                  {para.status === 'amaran_hati' ? 'Sel Hati' : 'Sisa'}
                </text>
                <text
                  x="318"
                  y="82"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="800"
                  fill={para.status === 'amaran_hati' ? '#FFFFFF' : '#14532D'}
                >
                  {para.status === 'amaran_hati' ? 'ROSAK!' : 'Keluar'}
                </text>
              </svg>

              <div
                className={`p-4 rounded-xl border text-[16px] font-bold leading-snug ${
                  para.status === 'amaran_hati'
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                }`}
              >
                <div>{para.label}</div>
                {interactions.molecularLens && (
                  <p className="text-[14px] font-medium mt-1">{para.toxicRiskNote}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {interactions.placeboTab === 'plasebo' && (
          <div className="col-span-12 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-7 grid grid-cols-12 gap-7 items-center">
            <div className="col-span-6 space-y-4">
              <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
                Ujian Klinikal Perubatan (m.s. 184)
              </div>
              <h3 className="font-display text-[30px] font-bold text-stone-900 dark:text-stone-100 leading-tight">
                Bagaimana Saintis Tahu Ubat Benar-benar Berkesan?
              </h3>
              <p className="text-[18px] text-stone-700 dark:text-stone-300 leading-relaxed">
                <strong>Plasebo</strong> ialah bahan yang menyerupai ubat sebenar, tetapi{' '}
                <strong>tiada sebarang nilai terapeutik</strong> atau bahan ubat aktif.
              </p>
              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-5 text-[16px] text-stone-800 dark:text-stone-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                  <FlaskConical className="w-5 h-5 text-blue-900 dark:text-blue-400" />
                  <span>Prinsip Eksperimen Terkawal</span>
                </div>
                <p>
                  Pesakit yang diberi pil gula sering berasa sedikit lega kerana <strong>harapan otak</strong>. Saintis membandingkan ubat sebenar dengan plasebo supaya hanya molekul yang benar-benar berkesan secara kimia diluluskan!
                </p>
              </div>
            </div>

            <div className="col-span-6 grid grid-cols-2 gap-4">
              <div className="border-2 border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-[17px]">
                  <ShieldCheck className="w-6 h-6" />
                  <span>Kumpulan Ubat Sebenar</span>
                </div>
                <div className="text-[24px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  Ada Molekul Aktif
                </div>
                <p className="text-[16px] text-stone-800 dark:text-stone-200 leading-relaxed">
                  Harapan otak <strong>+ Tindak balas kimia sebenar</strong> terhadap punca penyakit.
                </p>
              </div>

              <div className="border-2 border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold text-[17px]">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  <span>Kumpulan Plasebo</span>
                </div>
                <div className="text-[24px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  0% Bahan Ubat
                </div>
                <p className="text-[16px] text-stone-700 dark:text-stone-300 leading-relaxed">
                  Rupa pil sama persis, tetapi hanya mengandungi gula atau kanji sebagai kawalan perbandingan.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
