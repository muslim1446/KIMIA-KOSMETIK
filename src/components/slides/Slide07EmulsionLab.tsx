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
      <div className="shrink-0 flex items-end justify-between gap-3 apple-hairline-b pb-2.5">
        <div>
          <div className="text-[15px] font-bold text-[var(--apple-blue-fg)] tabular-nums-clean">
            5.4.3 · Bahan-bahan Asas Kosmetik (Rajah 5.15 · m.s. 184–185)
          </div>
          <h2 className="font-display text-[28px] font-bold text-[var(--apple-label)] mt-0.5 leading-tight">
            Tujuh Bahan Asas Kosmetik &amp; Peranan Pengemulsi
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => applyPreset('separated')}
            className="apple-pressable apple-tap-target flex items-center gap-1.5 px-3 py-2 rounded-[13px] apple-slide-card text-[14px] font-bold hover:bg-[var(--apple-fill)] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Tanpa Pengemulsi</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('complete')}
            className="apple-pressable apple-tap-target flex items-center gap-1.5 px-3.5 py-2 rounded-[13px] bg-[var(--apple-label)] text-[var(--apple-bg-base)] text-[14px] font-bold hover:opacity-90 cursor-pointer shadow-sm"
          >
            <Beaker className="w-4 h-4 shrink-0" />
            <span>Campur Semua</span>
          </button>
          <button
            type="button"
            aria-pressed={interactions.molecularLens}
            onClick={() => onPatch({ molecularLens: !interactions.molecularLens })}
            className={`apple-pressable apple-tap-target flex items-center gap-1.5 px-3 py-2 rounded-[13px] border text-[14px] font-bold cursor-pointer ${
              interactions.molecularLens
                ? 'border-[var(--apple-blue)] bg-[var(--apple-blue)] text-white shadow-sm'
                : 'apple-slide-card hover:bg-[var(--apple-fill)]'
            }`}
          >
            <Atom className="w-4 h-4 shrink-0" />
            <span>Huraian</span>
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
                className={`apple-pressable apple-tap-target text-left rounded-[18px] px-3.5 py-2.5 cursor-pointer ${
                  active
                    ? 'apple-slide-card border-[var(--apple-blue)] bg-blue-50/75 dark:bg-blue-950/35'
                    : 'apple-slide-card hover:bg-[var(--apple-fill)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-[6px] flex items-center justify-center border text-xs shrink-0 ${
                      active
                        ? 'bg-[var(--apple-blue)] border-[var(--apple-blue)] text-white'
                        : 'border-[var(--apple-separator)] text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-display text-[17px] font-bold text-[var(--apple-label)] tabular-nums-clean">
                    {idx + 1}. {ing.name}
                  </span>
                </div>
                <p className="text-[14px] text-[var(--apple-label)] mt-1 leading-snug">
                  {interactions.molecularLens ? ing.simpleNote : ing.role}
                </p>
                <div className="text-[13px] font-semibold text-[var(--apple-secondary-label)] mt-0.5">Contoh: {ing.examples}</div>
              </button>
            );
          })}

          <div className="rounded-[18px] border border-amber-300/80 dark:border-amber-700/50 bg-amber-50/85 dark:bg-amber-950/30 px-3.5 py-2.5 flex flex-col justify-center">
            <div className="text-[14px] font-bold text-[var(--apple-orange-fg)]">Fungsi Pengemulsi</div>
            <p className="text-[14px] text-[var(--apple-label)] mt-0.5 leading-snug">
              Membentuk <strong>campuran homogen</strong> antara <strong>air</strong> dan <strong>minyak</strong> supaya kosmetik tidak terpisah.
            </p>
          </div>
        </div>

        <div
          data-storage-scope={`slide:6/emulsion:${em.air ? '1' : '0'}${em.pengemulsi ? '1' : '0'}${em.pengawet ? '1' : '0'}`}
          className="col-span-6 apple-slide-card rounded-[24px] p-4 flex flex-col justify-between gap-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-bold text-[var(--apple-secondary-label)]">Pemerhatian Campuran Kosmetik</span>
            <span
              className={`text-[15px] font-bold ${
                evalResult.isHomogeneous && em.pengawet ? 'text-[var(--apple-green-fg)]' : 'text-[var(--apple-orange-fg)]'
              }`}
            >
              {evalResult.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-5 flex justify-center apple-slide-inset rounded-[16px] p-2">
              <svg viewBox="0 0 185 168" className="w-44 h-40" role="img" aria-label="Bikar campuran bahan kosmetik">
                {em.pewangi && (
                  <g stroke="var(--apple-green-fg)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85">
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
                              fill={em.pewarna ? '#DB2777' : '#0066D6'}
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
                        Tiada Air
                      </text>
                    </>
                  )}

                  {em.air && !em.pengawet && (
                    <g fill="#3F6212">
                      <circle cx="58" cy="140" r="4.5" />
                      <circle cx="126" cy="138" r="5" />
                      <text x="92" y="144" textAnchor="middle" fontSize="10.5" fill="#3F6212" fontWeight="800">
                        Mudah Rosak
                      </text>
                    </g>
                  )}
                </g>

                <path
                  d="M36,36 L42,42 L42,146 C42,151 46,154 52,154 L132,154 C138,154 142,151 142,146 L142,42 L148,36"
                  fill="none"
                  stroke="var(--slide-svg-axis)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="col-span-7 apple-slide-inset rounded-[16px] p-3">
              <div className="text-[13px] font-bold text-[var(--apple-blue-fg)] mb-1 tabular-nums-clean">
                Kesan Penambahan Pengemulsi (Rajah 5.15)
              </div>
              <svg viewBox="0 0 270 132" className="w-full h-32" aria-label="Gambar rajah pengemulsi menyatukan air dan minyak">
                {!em.pengemulsi ? (
                  <g>
                    <rect x="8" y="8" width="254" height="46" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
                    <text x="135" y="29" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#78350F">
                      Lapisan Minyak
                    </text>
                    <text x="135" y="46" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#92400E">
                      Terapung di atas dan tidak bercampur
                    </text>

                    <line x1="12" y1="66" x2="258" y2="66" stroke="var(--apple-red-fg)" strokeWidth="2.5" strokeDasharray="5 4" />

                    <rect x="8" y="76" width="254" height="48" rx="10" fill="#DBEAFE" stroke="#0066D6" strokeWidth="1.8" />
                    <text x="135" y="98" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#1E3A8A">
                      Lapisan Air (Pelarut)
                    </text>
                    <text x="135" y="115" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#1E40AF">
                      Tiada pengemulsi untuk menyatukan campuran
                    </text>
                  </g>
                ) : (
                  <g>
                    <rect x="8" y="8" width="254" height="116" rx="12" fill="#EFF6FF" stroke="#0066D6" strokeWidth="1.8" />
                    <circle cx="88" cy="56" r="18" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
                    <circle cx="135" cy="50" r="22" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
                    <circle cx="182" cy="58" r="17" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
                    <text x="135" y="54" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#78350F">
                      Homogen
                    </text>
                    <text x="135" y="95" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1E3A8A">
                      Pengemulsi (Lesitin / Asid stearik)
                    </text>
                    <text x="135" y="113" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#1E40AF">
                      Membentuk campuran homogen antara air dan minyak
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="apple-slide-inset rounded-[12px] py-2 px-1">
              <div className="text-[13px] font-semibold text-[var(--apple-secondary-label)]">Pemekat</div>
              <div className={`text-[16px] font-bold ${evalResult.hasThickener ? 'text-[var(--apple-green-fg)]' : 'text-[var(--apple-label)]'}`}>
                {evalResult.hasThickener ? 'Pekat' : 'Cair'}
              </div>
            </div>
            <div className="apple-slide-inset rounded-[12px] py-2 px-1">
              <div className="text-[13px] font-semibold text-[var(--apple-secondary-label)]">Pelembap</div>
              <div className={`text-[16px] font-bold ${evalResult.hasMoisturizer ? 'text-[var(--apple-green-fg)]' : 'text-[var(--apple-orange-fg)]'}`}>
                {evalResult.hasMoisturizer ? 'Lembap' : 'Cepat Kering'}
              </div>
            </div>
            <div className="apple-slide-inset rounded-[12px] py-2 px-1">
              <div className="text-[13px] font-semibold text-[var(--apple-secondary-label)]">Pengawet</div>
              <div className={`text-[16px] font-bold ${evalResult.hasPreservative ? 'text-[var(--apple-green-fg)]' : 'text-[var(--apple-red-fg)]'}`}>
                {evalResult.hasPreservative ? 'Terlindung' : 'Mudah Rosak'}
              </div>
            </div>
          </div>

          <div className="rounded-[14px] bg-blue-50/75 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-800/60 p-3 text-[15px] font-medium text-[var(--apple-label)] leading-snug">
            <div>{evalResult.diagnosis}</div>
            {interactions.molecularLens && (
              <div className="text-[14px] font-bold text-[var(--apple-blue-fg)] mt-1 tabular-nums-clean">
                Nota Rajah 5.15: {evalResult.molecularNote}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
