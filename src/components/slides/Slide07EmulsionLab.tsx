import React from 'react';
import { Beaker, Check, RotateCcw } from 'lucide-react';
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
          pengawet: false,
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
    <div className="h-full w-full flex flex-col gap-4 px-10 py-7 select-none">
      {/* Header */}
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <div className="text-sm font-semibold text-blue-800 dark:text-blue-400">
            5.4.4 · Bahan Asas Kosmetik (Rajah 5.15)
          </div>
          <h2 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Tujuh Bahan Asas Penghasilan Kosmetik
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => applyPreset('separated')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Fasa Terpisah</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('complete')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-sm font-bold text-white dark:text-stone-900 hover:bg-stone-800 cursor-pointer"
          >
            <Beaker className="w-4 h-4" />
            <span>Campur Semua 7 Bahan</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        {/* Left: 7 Ingredients sized cleanly to fit 1280x720 without clipping */}
        <div className="col-span-7 grid grid-cols-2 gap-2.5 content-between">
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${
                        active
                          ? 'bg-blue-800 border-blue-800 text-white'
                          : 'border-stone-300 dark:border-stone-700 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
                      {idx + 1}. {ing.name}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-300 mt-1 leading-snug">{ing.role}</p>
                <div className="text-xs font-medium text-stone-500 mt-0.5">Contoh: {ing.examples}</div>
              </button>
            );
          })}
        </div>

        {/* Right: Visual Beaker */}
        <div className="col-span-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-stone-500">Campuran dalam Bikar</span>
            <span
              className={`text-sm font-bold ${
                evalResult.isHomogeneous && em.pengawet ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {evalResult.statusLabel}
            </span>
          </div>

          <div className="my-1 flex justify-center">
            <svg viewBox="0 0 220 190" className="w-60 h-52" role="img" aria-label="Bikar campuran bahan kosmetik">
              {em.pewangi && (
                <g stroke="#2D6A4F" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.75">
                  <path d="M85,34 C80,22 92,16 86,6" />
                  <path d="M110,32 C105,20 117,14 111,4" />
                  <path d="M135,34 C130,22 142,16 136,6" />
                </g>
              )}

              <defs>
                <clipPath id="beakerClip">
                  <rect x="52" y="54" width="116" height="114" rx="8" />
                </clipPath>
              </defs>

              <g clipPath="url(#beakerClip)">
                {em.air ? (
                  <>
                    <rect x="52" y="84" width="116" height="84" fill={baseFill} />
                    {!em.pengemulsi ? (
                      <>
                        <rect x="52" y="62" width="116" height="24" fill={oilLayerFill} opacity="0.9" />
                        <line x1="52" y1="86" x2="168" y2="86" stroke="#D97706" strokeWidth="2.5" />
                        <text x="110" y="78" textAnchor="middle" fontSize="11" fill="#78350F" fontWeight="700">
                          Minyak Terapung
                        </text>
                        <text x="110" y="130" textAnchor="middle" fontSize="11" fill="#0369A1" fontWeight="700">
                          Lapisan Air
                        </text>
                      </>
                    ) : (
                      <>
                        <rect x="52" y="64" width="116" height="104" fill={em.pewarna ? '#FBCFE8' : '#F1F5F9'} />
                        {[
                          [76, 92],
                          [105, 82],
                          [138, 96],
                          [88, 124],
                          [122, 118],
                          [146, 138],
                          [74, 146],
                          [112, 148],
                        ].map(([cx, cy], idx) => (
                          <circle
                            key={idx}
                            cx={cx}
                            cy={cy}
                            r={em.pemekat ? 6.5 : 4.5}
                            fill={em.pewarna ? '#EC4899' : '#1E40AF'}
                            opacity="0.3"
                          />
                        ))}
                        <text x="110" y="108" textAnchor="middle" fontSize="11.5" fill="#1C1917" fontWeight="700">
                          Bercampur Sekata
                        </text>
                        <text x="110" y="123" textAnchor="middle" fontSize="9.5" fill="#44403C" fontWeight="600">
                          Ikat minyak &amp; air
                        </text>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <rect x="52" y="106" width="116" height="62" fill={oilLayerFill} opacity="0.85" />
                    <text x="110" y="140" textAnchor="middle" fontSize="11" fill="#78350F" fontWeight="700">
                      Minyak Sahaja
                    </text>
                  </>
                )}

                {em.air && !em.pengawet && (
                  <g fill="#4D7C0F" opacity="0.9">
                    <circle cx="72" cy="156" r="4.5" />
                    <circle cx="80" cy="160" r="3.5" />
                    <circle cx="144" cy="154" r="5" />
                    <text x="110" y="160" textAnchor="middle" fontSize="10" fill="#3F6212" fontWeight="700">
                      Mudah Berkulat
                    </text>
                  </g>
                )}
              </g>

              <path
                d="M46,44 L52,50 L52,164 C52,169 56,172 62,172 L158,172 C164,172 168,169 168,164 L168,50 L174,44"
                fill="none"
                stroke="#44403C"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-2 text-center tabular-nums-clean">
              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl py-2 px-1">
                <div className="text-xs text-stone-500">Kelikatan</div>
                <div className="text-base font-bold text-stone-900 dark:text-stone-100">{evalResult.viscosityScore}%</div>
              </div>
              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl py-2 px-1">
                <div className="text-xs text-stone-500">Kelembapan</div>
                <div className="text-base font-bold text-stone-900 dark:text-stone-100">{evalResult.hydrationScore}%</div>
              </div>
              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl py-2 px-1">
                <div className="text-xs text-stone-500">Tempoh Tahan</div>
                <div className="text-base font-bold text-stone-900 dark:text-stone-100">{evalResult.shelfLifeDays} hari</div>
              </div>
            </div>

            <div className="rounded-xl bg-[#FBF9F5] dark:bg-stone-950 p-3.5 text-sm text-stone-800 dark:text-stone-200 leading-snug">
              {evalResult.diagnosis}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
