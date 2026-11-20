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
    <div className="h-full w-full flex flex-col gap-4 px-10 py-7 select-none">
      {/* Header */}
      <div className="shrink-0 border-b border-stone-200 dark:border-stone-800 pb-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-red-700 dark:text-red-400">
            5.4.4 · Rajah 5.17 & Jadual 5.8 (m.s. 185–186)
          </div>
          <h2 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Kosmetik Buatan Sendiri & Kesan Bahan Terlarang
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPatch({ cosmeticCompareTab: 'buatan_sendiri' })}
            className={`px-3.5 py-2 rounded-xl border text-sm font-bold cursor-pointer ${
              interactions.cosmeticCompareTab === 'buatan_sendiri'
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200'
                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-900'
            }`}
          >
            Buatan Sendiri
          </button>
          <button
            type="button"
            onClick={() => onPatch({ cosmeticCompareTab: 'komersial_haram' })}
            className={`px-3.5 py-2 rounded-xl border text-sm font-bold cursor-pointer ${
              interactions.cosmeticCompareTab === 'komersial_haram'
                ? 'border-red-600 bg-red-50 text-red-900 dark:bg-red-950/70 dark:text-red-200'
                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-900'
            }`}
          >
            Kosmetik Komersial
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5 content-start">
        {/* Comparison Strip */}
        <div className="col-span-12">
          {interactions.cosmeticCompareTab === 'buatan_sendiri' ? (
            <div className="border border-emerald-200 bg-emerald-50/70 rounded-2xl p-4 grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2.5 text-sm text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Mudah Dihasilkan:</strong> Menggunakan bahan-bahan semula jadi.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Selamat Digunakan:</strong> Tiada bahan kimia berbahaya.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Kos yang Murah:</strong> Lebih menjimatkan perbelanjaan.
                </span>
              </div>
            </div>
          ) : (
            <div className="border border-red-200 bg-red-50/70 rounded-2xl p-4 grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2.5 text-sm text-red-950">
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Kesan Sampingan:</strong> Kesan sampingan yang membahayakan.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-red-950">
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Bahan Berbahaya:</strong> Dimasukkan secara tidak sah.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-red-950">
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Iklan Mengelirukan:</strong> Ditonjolkan secara berlebih-lebihan.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Left: 4 Banned Chemicals */}
        <div className="col-span-5 flex flex-col gap-2.5">
          {BANNED_CHEMICALS.map((chem) => {
            const active = chem.id === activeChemical.id;
            return (
              <button
                key={chem.id}
                type="button"
                onClick={() => onPatch({ bannedChemicalId: chem.id })}
                className={`text-left rounded-2xl border px-4 py-3.5 transition-colors cursor-pointer ${
                  active
                    ? 'border-red-600 bg-red-50 dark:bg-red-950/50'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">{chem.name}</span>
                  <Skull className={`w-5 h-5 shrink-0 ${active ? 'text-red-700' : 'text-stone-400'}`} />
                </div>
                <div className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">{chem.productFoundIn}</div>
              </button>
            );
          })}
        </div>

        {/* Right: Skin Layer Diagram + Effects */}
        <div className="col-span-7 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-3">
              <svg viewBox="0 0 210 180" className="w-full h-48" role="img" aria-label="Kesan serapan bahan kimia pada kulit">
                <line
                  x1="18"
                  y1="14"
                  x2="18"
                  y2={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? 148 : activeChemical.bodyTarget === 'melanosit_uv' ? 73 : 38}
                  stroke="#B91C1C"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="18"
                  cy={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? 148 : activeChemical.bodyTarget === 'melanosit_uv' ? 73 : 38}
                  r="5.5"
                  fill="#B91C1C"
                />

                <rect
                  x="34"
                  y="22"
                  width="166"
                  height="30"
                  rx="6"
                  fill={activeChemical.bodyTarget === 'lapisan_luar' || activeChemical.bodyTarget === 'pigmentasi_epidermis' ? '#FCA5A5' : '#FDE68A'}
                  stroke="#B45309"
                  strokeWidth="1.5"
                />
                <text x="117" y="41" textAnchor="middle" fontSize="11" fill="#451A03" fontWeight="700">
                  Lapisan Luar Kulit
                </text>

                <rect
                  x="34"
                  y="57"
                  width="166"
                  height="34"
                  rx="6"
                  fill={activeChemical.bodyTarget === 'melanosit_uv' ? '#FECACA' : '#FEF3C7'}
                  stroke="#D97706"
                  strokeWidth="1.5"
                />
                <text x="117" y="78" textAnchor="middle" fontSize="11" fill="#78350F" fontWeight="700">
                  Pigmen & Melanin
                </text>

                <rect x="34" y="96" width="166" height="28" rx="6" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
                <text x="117" y="114" textAnchor="middle" fontSize="11" fill="#7F1D1D" fontWeight="700">
                  Salur Darah
                </text>

                <rect
                  x="34"
                  y="130"
                  width="166"
                  height="36"
                  rx="6"
                  fill={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? '#B91C1C' : '#E7E5E4'}
                />
                <text
                  x="117"
                  y="152"
                  textAnchor="middle"
                  fontSize="11"
                  fill={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? '#FFFFFF' : '#44403C'}
                  fontWeight="700"
                >
                  Buah Pinggang & Saraf
                </text>
              </svg>
            </div>

            <div className="col-span-7 space-y-3">
              <div>
                <div className="text-sm font-semibold text-red-700 dark:text-red-400">Kesan Sampingan Berbahaya</div>
                <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {activeChemical.name}
                </h3>
              </div>

              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3.5">
                <div className="text-sm font-bold text-stone-500">Kesan pada Kulit</div>
                <p className="text-sm text-stone-800 dark:text-stone-200 mt-1 leading-snug">
                  {activeChemical.immediateEffect}
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-3.5">
                <div className="text-sm font-bold text-red-800 dark:text-red-300">Bahaya Jangka Panjang</div>
                <p className="text-sm text-red-950 dark:text-red-100 mt-1 font-semibold leading-snug">
                  {activeChemical.severeHarm}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 text-sm text-stone-700 dark:text-stone-300">
            <strong>Penjelasan:</strong> {activeChemical.explanation}
          </div>
        </div>
      </div>
    </div>
  );
};
