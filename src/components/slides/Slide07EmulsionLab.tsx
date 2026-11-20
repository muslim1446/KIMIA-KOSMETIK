import React from 'react';
import { Atom, Beaker, Check, RotateCcw } from 'lucide-react';
import { COSMETIC_INGREDIENTS } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { EmulsionState, evaluateCosmeticEmulsion } from '../../utils/presentationEngine';

interface Slide07Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

export const Slide07EmulsionLab: React.FC<Slide07Props> = ({ interactions, onPatch }) => {
  const em = interactions.emulsion;
  const evalResult = evaluateCosmeticEmulsion(em);

  const toggleIngredient = (key: keyof EmulsionState) => {
    onPatch({
      emulsion: {
        ...em,
        [key]: !em[key],
      },
    });
  };

  const applyPreset = (preset: 'separated' | 'complete') => {
    if (preset === 'separated') {
      onPatch({
        emulsion: {
          air: true,
          pengemulsi: false,
          pemekat: false,
          pelembap: true,
          pewangi: false,
          pengawet: true,
          pewarna: false,
        },
      });
    } else {
      onPatch({
        emulsion: {
          air: true,
          pengemulsi: true,
          pemekat: true,
          pelembap: true,
          pewangi: true,
          pengawet: true,
          pewarna: true,
        },
      });
    }
  };

  const baseFill = em.pewarna ? '#FDE2E4' : '#E0F2FE';
  const oilLayerFill = '#FCD34D';

  return (
    <div className="h-full w-full flex flex-col gap-3.5 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-2.5">
        <div>
          <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
            5.4.4 · Bahan-bahan Asas Kosmetik (Rajah 5.15)
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Mengapa Minyak &amp; Air Terpisah — Dan Bagaimana Pengemulsi Menyatukannya
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => applyPreset('separated')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-[14px] font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Fasa Terpisah</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('complete')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-[14px] font-bold text-white dark:text-stone-900 hover:bg-stone-800 cursor-pointer"
          >
            <Beaker className="w-4 h-4" />
            <span>Campur Semua 7</span>
          </button>
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
            <span>Perincian</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div className="col-span-6 grid grid-cols-2 gap-2.5 content-between">
          {COSMETIC_INGREDIENTS.map((ing, idx) => {
            const active = em[ing.id];
            return (
              <button
                key={ing.id}
                type="button"
                onClick={() => toggleIngredient(ing.id)}
                aria-pressed={active}
                className={`text-left rounded-2xl border px-3.5 py-2.5 transition-colors cursor-pointer ${
                  active
                    ? 'border-blue-800 bg-blue-50/70 dark:bg-blue-950/50'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs shrink-0 ${
                      active
                        ? 'bg-blue-900 border-blue-900 text-white'
                        : 'border-stone-300 dark:border-stone-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-display text-[17px] font-bold text-stone-900 dark:text-stone-100">
                    {idx + 1}. {ing.name}
                  </span>
                </div>
                <p className="text-[14px] text-stone-800 dark:text-stone-200 mt-1 leading-snug">
                  {interactions.molecularLens ? ing.molecularRole : ing.role}
                </p>
                <div className="text-[13px] font-semibold text-stone-500 mt-0.5">{ing.examples}</div>
              </button>
            );
          })}

          <div className="rounded-2xl border border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 px-3.5 py-2.5 flex flex-col justify-center">
            <div className="text-[14px] font-bold text-amber-900 dark:text-amber-300">Prinsip Kekutuban</div>
            <p className="text-[14px] text-stone-800 dark:text-stone-200 mt-0.5 leading-snug">
              <strong>Air</strong> berkutub, <strong>Minyak</strong> tak berkutub — <strong>Pengemulsi</strong> menjadi jambatan mengikat kedua-duanya!
            </p>
          </div>
        </div>

        <div className="col-span-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-4 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-bold text-stone-700 dark:text-stone-300">Pemerhatian Bikar &amp; Molekul</span>
            <span
              className={`text-[15px] font-bold ${
                evalResult.isHomogeneous && em.pengawet ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {evalResult.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-5 flex justify-center bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-2">
              <svg viewBox="0 0 185 168" className="w-44 h-40" role="img" aria-label="Bikar campuran bahan kosmetik">
                {em.pewangi && (
                  <g stroke="#15803D" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8">
                    <path d="M68,26 C63,16 74,12 69,4" />
                    <path d="M92,24 C87,14 98,10 93,2" />
                    <path d="M116,26 C111,16 122,12 117,4" />
                  </g>
                )}

                <defs>
                  <clipPath id="beakerClipV2">
                    <rect x="42" y="44" width="100" height="106" rx="8" />
                  </clipPath>
                </defs>

                <g clipPath="url(#beakerClipV2)">
                  {em.air ? (
                    <>
                      <rect x="42" y="72" width="100" height="78" fill={baseFill} />
                      {!em.pengemulsi ? (
                        <>
                          <rect x="42" y="50" width="100" height="24" fill={oilLayerFill} opacity="0.95" />
                          <line x1="42" y1="74" x2="142" y2="74" stroke="#B45309" strokeWidth="2.5" />
                          <text x="92" y="66" textAnchor="middle" fontSize="11.5" fill="#78350F" fontWeight="800">
                            Minyak
                          </text>
                          <text x="92" y="114" textAnchor="middle" fontSize="11.5" fill="#0369A1" fontWeight="800">
                            Air Terpisah
                          </text>
                        </>
                      ) : (
                        <>
                          <rect x="42" y="52" width="100" height="98" fill={em.pewarna ? '#FBCFE8' : '#ECFDF5'} />
                          {[
                            [64, 78],
                            [92, 68],
                            [120, 82],
                            [72, 110],
                            [106, 104],
                            [124, 126],
                            [62, 130],
                            [94, 134],
                          ].map(([cx, cy], idx) => (
                            <circle
                              key={idx}
                              cx={cx}
                              cy={cy}
                              r={em.pemekat ? 6.5 : 4.5}
                              fill={em.pewarna ? '#DB2777' : '#1E3A8A'}
                              opacity="0.32"
                            />
                          ))}
                          <text x="92" y="96" textAnchor="middle" fontSize="12" fill="#1C1917" fontWeight="800">
                            Sekata!
                          </text>
                          <text x="92" y="112" textAnchor="middle" fontSize="10.5" fill="#44403C" fontWeight="700">
                            Homogen
                          </text>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <rect x="42" y="94" width="100" height="56" fill={oilLayerFill} opacity="0.9" />
                      <text x="92" y="126" textAnchor="middle" fontSize="11.5" fill="#78350F" fontWeight="800">
                        Minyak Sahaja
                      </text>
                    </>
                  )}

                  {em.air && !em.pengawet && (
                    <g fill="#3F6212">
                      <circle cx="58" cy="140" r="4.5" />
                      <circle cx="126" cy="138" r="5" />
                      <text x="92" y="144" textAnchor="middle" fontSize="10.5" fill="#3F6212" fontWeight="800">
                        Kulat Tumbuh
                      </text>
                    </g>
                  )}
                </g>

                <path
                  d="M36,36 L42,42 L42,146 C42,151 46,154 52,154 L132,154 C138,154 142,151 142,146 L142,42 L148,36"
                  fill="none"
                  stroke="#44403C"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="col-span-7 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-3">
              <div className="text-[13px] font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                Susunan Molekul: Bagaimana Pengemulsi Bekerja?
              </div>
              <svg viewBox="0 0 270 132" className="w-full h-32" aria-label="Gambar rajah molekul pengemulsi menyatukan air dan minyak">
                {!em.pengemulsi ? (
                  <g>
                    <rect x="8" y="8" width="254" height="46" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
                    <text x="135" y="29" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#78350F">
                      Minyak (Tak Berkutub / Tolak Air)
                    </text>
                    <text x="135" y="46" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#92400E">
                      Terapung di atas kerana enggan bercampur
                    </text>

                    <line x1="12" y1="66" x2="258" y2="66" stroke="#B91C1C" strokeWidth="2.5" strokeDasharray="5 4" />

                    <rect x="8" y="76" width="254" height="48" rx="10" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1.8" />
                    <text x="135" y="98" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#1E3A8A">
                      Air H2O (Berkutub / Tarik Sesama Air)
                    </text>
                    <text x="135" y="115" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#1E40AF">
                      Tiada jambatan untuk memegang minyak
                    </text>
                  </g>
                ) : (
                  <g>
                    <rect x="8" y="8" width="254" height="116" rx="12" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.8" />
                    <circle cx="135" cy="64" r="24" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
                    <text x="135" y="68" textAnchor="middle" fontSize="12" fontWeight="800" fill="#78350F">
                      Minyak
                    </text>

                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                      const rad = (deg * Math.PI) / 180;
                      const x1 = 135 + Math.cos(rad) * 23;
                      const y1 = 64 + Math.sin(rad) * 23;
                      const x2 = 135 + Math.cos(rad) * 38;
                      const y2 = 64 + Math.sin(rad) * 38;
                      return (
                        <g key={deg}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
                          <circle cx={x2} cy={y2} r="5.5" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1.5" />
                        </g>
                      );
                    })}

                    <text x="135" y="114" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#1E3A8A">
                      Kepala Biru pegang Air · Ekor pegang Minyak!
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center tabular-nums-clean">
            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl py-2 px-1">
              <div className="text-[13px] font-semibold text-stone-500">Kelikatan</div>
              <div className="text-[18px] font-bold text-stone-900 dark:text-stone-100">{evalResult.viscosityScore}%</div>
            </div>
            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl py-2 px-1">
              <div className="text-[13px] font-semibold text-stone-500">Kelembapan</div>
              <div className="text-[18px] font-bold text-stone-900 dark:text-stone-100">{evalResult.hydrationScore}%</div>
            </div>
            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl py-2 px-1">
              <div className="text-[13px] font-semibold text-stone-500">Tempoh Tahan</div>
              <div className="text-[18px] font-bold text-stone-900 dark:text-stone-100">{evalResult.shelfLifeDays} hari</div>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-[15px] font-medium text-stone-900 dark:text-stone-100 leading-snug">
            <div>{evalResult.diagnosis}</div>
            {interactions.molecularLens && (
              <div className="text-[14px] font-bold text-indigo-900 dark:text-indigo-300 mt-1">
                Tahap Molekul: {evalResult.molecularNote}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
