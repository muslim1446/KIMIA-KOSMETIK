import React from 'react';
import { CheckCircle2, ShieldAlert, Skull } from 'lucide-react';
import { BANNED_CHEMICALS } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide08Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

export const Slide08BannedForensics: React.FC<Slide08Props> = ({ interactions, onPatch }) => {
  const activeChemical =
    BANNED_CHEMICALS.find((c) => c.id === interactions.bannedChemicalId) ?? BANNED_CHEMICALS[0];

  return (
    <div className="h-full w-full flex flex-col gap-3.5 px-10 py-6 select-none">
      <div className="shrink-0 border-b border-stone-200 dark:border-stone-800 pb-2.5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold text-red-700 dark:text-red-400">
            5.4.4 · Penggunaan Kosmetik &amp; Bahan Kimia Terlarang (Rajah 5.17 &amp; Jadual 5.8 · m.s. 185–186)
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Kosmetik Buatan Sendiri, Keburukan Komersial &amp; Kesan Bahan Terlarang
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onPatch({ cosmeticCompareTab: 'buatan_sendiri' })}
            className={`px-3.5 py-2 rounded-xl border text-[14px] font-bold cursor-pointer ${
              interactions.cosmeticCompareTab === 'buatan_sendiri'
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                : 'border-stone-200 text-stone-700 bg-white'
            }`}
          >
            Kebaikan Buatan Sendiri
          </button>
          <button
            type="button"
            onClick={() => onPatch({ cosmeticCompareTab: 'komersial_haram' })}
            className={`px-3.5 py-2 rounded-xl border text-[14px] font-bold cursor-pointer ${
              interactions.cosmeticCompareTab === 'komersial_haram'
                ? 'border-red-600 bg-red-50 text-red-900'
                : 'border-stone-200 text-stone-700 bg-white'
            }`}
          >
            Keburukan Komersial
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 content-start">
        <div
          data-storage-scope={`slide:7/compare:${interactions.cosmeticCompareTab}`}
          className="col-span-12"
        >
          {interactions.cosmeticCompareTab === 'buatan_sendiri' ? (
            <div className="border border-emerald-200 bg-emerald-50/80 rounded-2xl px-4 py-3 grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2.5 text-[15px] text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <span>Mudah dihasilkan menggunakan bahan-bahan semula jadi.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <span>Selamat dan tiada bahan kimia berbahaya.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <span>Kos yang murah.</span>
              </div>
            </div>
          ) : (
            <div className="border border-red-200 bg-red-50/80 rounded-2xl px-4 py-3 grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2.5 text-[15px] text-red-950">
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <span>Kesan sampingan yang merbahayakan.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-red-950">
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <span>Terdapat bahan kimia berbahaya dimasukkan secara tidak sah.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-red-950">
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <span>Iklan yang ditonjolkan secara berlebih-lebihan dan mengelirukan.</span>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-5 flex flex-col justify-between gap-2.5">
          {BANNED_CHEMICALS.map((chem) => {
            const active = chem.id === activeChemical.id;
            return (
              <button
                key={chem.id}
                type="button"
                onClick={() => onPatch({ bannedChemicalId: chem.id })}
                className={`text-left rounded-2xl border px-4 py-3 transition-colors cursor-pointer ${
                  active
                    ? 'border-red-600 bg-red-50 dark:bg-red-950/50'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[19px] font-bold text-stone-900 dark:text-stone-100">{chem.name}</span>
                  <Skull className={`w-5 h-5 shrink-0 ${active ? 'text-red-700' : 'text-stone-400'}`} />
                </div>
                <div className="text-[14px] text-stone-700 dark:text-stone-300 mt-0.5 leading-snug">{chem.productFoundIn}</div>
              </button>
            );
          })}
        </div>

        <div
          data-storage-scope={`slide:7/chem:${activeChemical.id}`}
          className="col-span-7 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between"
        >
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-3">
              <svg viewBox="0 0 215 190" className="w-full h-44" role="img" aria-label="Kesan bahan kimia terlarang pada kulit dan badan">
                <line
                  x1="18"
                  y1="14"
                  x2="18"
                  y2={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? 156 : activeChemical.bodyTarget === 'melanosit_uv' ? 78 : 40}
                  stroke="#B91C1C"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle
                  cx="18"
                  cy={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? 156 : activeChemical.bodyTarget === 'melanosit_uv' ? 78 : 40}
                  r="6"
                  fill="#B91C1C"
                />

                <rect
                  x="34"
                  y="20"
                  width="172"
                  height="32"
                  rx="6"
                  fill={activeChemical.bodyTarget === 'lapisan_luar' || activeChemical.bodyTarget === 'pigmentasi_epidermis' ? '#FCA5A5' : '#FDE68A'}
                  stroke="#B45309"
                  strokeWidth="1.5"
                />
                <text x="120" y="40" textAnchor="middle" fontSize="12" fill="#451A03" fontWeight="800">
                  1. Permukaan Kulit
                </text>

                <rect
                  x="34"
                  y="58"
                  width="172"
                  height="36"
                  rx="6"
                  fill={activeChemical.bodyTarget === 'melanosit_uv' ? '#FECACA' : '#FEF3C7'}
                  stroke="#D97706"
                  strokeWidth="1.5"
                />
                <text x="120" y="80" textAnchor="middle" fontSize="11.5" fill="#78350F" fontWeight="800">
                  2. Pigmentasi &amp; Sinar UV
                </text>

                <rect x="34" y="100" width="172" height="30" rx="6" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
                <text x="120" y="119" textAnchor="middle" fontSize="12" fill="#7F1D1D" fontWeight="800">
                  3. Salur Darah
                </text>

                <rect
                  x="34"
                  y="136"
                  width="172"
                  height="38"
                  rx="6"
                  fill={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? '#B91C1C' : '#E7E5E4'}
                />
                <text
                  x="120"
                  y="159"
                  textAnchor="middle"
                  fontSize="11.5"
                  fill={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? '#FFFFFF' : '#44403C'}
                  fontWeight="800"
                >
                  4. Buah Pinggang &amp; Saraf
                </text>
              </svg>
            </div>

            <div className="col-span-7 space-y-2.5">
              <div>
                <div className="text-[14px] font-bold text-red-700 dark:text-red-400">Jadual 5.8 · Bahan Kimia Terlarang</div>
                <h3 className="font-display text-[24px] font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {activeChemical.name}
                </h3>
              </div>

              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3">
                <div className="text-[14px] font-bold text-stone-500">Kesan Sampingan</div>
                <p className="text-[15px] text-stone-900 dark:text-stone-100 mt-0.5 leading-snug">
                  {activeChemical.explanation}
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-3">
                <div className="text-[14px] font-bold text-red-800 dark:text-red-300">Catatan</div>
                <p className="text-[15px] text-red-950 dark:text-red-100 mt-0.5 font-bold leading-snug">
                  {activeChemical.productFoundIn}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2.5 border-t border-stone-200 dark:border-stone-800 text-[14px] text-stone-800 dark:text-stone-200 leading-snug">
            <strong>Nasihat Pengguna (m.s. 186):</strong> Peka dengan kandungan bahan dan pastikan kosmetik berdaftar dengan{' '}
            <strong>Bahagian Regulatori Farmasi Negara (NPRA)</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
