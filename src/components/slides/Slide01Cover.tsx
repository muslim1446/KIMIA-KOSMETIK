import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Sparkles, Stethoscope } from 'lucide-react';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide01Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

const COMPARE_CASES: Record<
  SharedSlideInteractions['coverCompareId'],
  {
    title: string;
    moleculeExample: string;
    mechanism: string;
    verdict: string;
    svgCaption: string;
  }
> = {
  ubat: {
    title: '1. Ubat (Tradisional & Moden)',
    moleculeExample: 'Contoh: Parasetamol, Antibiotik, Halia',
    mechanism:
      'Bahan kimia yang digunakan untuk membantu kita merawat atau mencegah penyakit mengikut dos yang betul.',
    verdict: 'Selamat jika diambil dengan betul; memudaratkan jika disalahgunakan.',
    svgCaption: 'Merawat atau mencegah penyakit',
  },
  kosmetik: {
    title: '2. Kosmetik (Kegunaan Luaran)',
    moleculeExample: 'Contoh: Bedak, Gincu, Krim, Minyak wangi',
    mechanism:
      'Bahan atau produk yang digunakan secara luaran untuk membersih, melindungi atau mencantikkan penampilan seseorang.',
    verdict: 'Kegunaan luaran sahaja dan berdaftar dengan NPRA.',
    svgCaption: 'Bertindak di permukaan luar kulit',
  },
  terlarang: {
    title: '3. Bahan Kimia Terlarang',
    moleculeExample: 'Contoh: Merkuri, Hidrokuinon, Betamethasone valerate, Tretinoin',
    mechanism:
      'Dimasukkan secara tidak sah ke dalam kosmetik; boleh merengsakan kulit atau diserap ke dalam salur darah.',
    verdict: 'Merosakkan kulit, buah pinggang dan sistem saraf.',
    svgCaption: 'Boleh diserap masuk ke salur darah',
  },
};

export const Slide01Cover: React.FC<Slide01Props> = ({ interactions, onPatch }) => {
  const active = COMPARE_CASES[interactions.coverCompareId];

  return (
    <div className="h-full w-full grid grid-cols-12 gap-8 px-10 py-7 items-center select-none">
      <div className="col-span-6 flex flex-col justify-between h-full py-1">
        <div className="space-y-4">
          <div className="text-base font-bold text-emerald-800 dark:text-emerald-400">
            Kimia Tingkatan 5 · Bab 5.4 (m.s. 181–186)
          </div>
          <h1 className="font-display text-[44px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08]">
            Ubat-ubatan dan Bahan Kosmetik
          </h1>
          <p className="text-[20px] font-medium text-stone-700 dark:text-stone-300 leading-relaxed">
            Ubat ialah bahan kimia untuk merawat atau mencegah penyakit, manakala kosmetik digunakan secara luaran untuk membersih, melindungi atau mencantikkan penampilan.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5">
              <div className="text-[17px] font-bold text-blue-900 dark:text-blue-400">5.4.1 Jenis Ubat</div>
              <p className="text-[15px] text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                Tradisional &amp; moden
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5">
              <div className="text-[17px] font-bold text-amber-800 dark:text-amber-400">5.4.2 Penggunaan</div>
              <p className="text-[15px] text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                Dos betul &amp; selamat
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5">
              <div className="text-[17px] font-bold text-emerald-800 dark:text-emerald-400">5.4.3–4 Kosmetik</div>
              <p className="text-[15px] text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                Jenis, asas &amp; kawalan
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-[18px] font-bold text-stone-900 dark:text-stone-100">
          Prinsip utama: selamat jika digunakan dengan betul.
        </div>
      </div>

      <div className="col-span-6 flex flex-col justify-center">
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
          <div className="text-[16px] font-semibold text-stone-500 dark:text-stone-400">
            Apakah Ubat &amp; Apakah Kosmetik?
          </div>
          <h2 className="font-display text-[30px] font-bold text-stone-900 dark:text-stone-100 mt-0.5 leading-tight">
            Perbandingan Kegunaan &amp; Kesan
          </h2>

          <div className="grid grid-cols-3 gap-2.5 mt-4" role="tablist" aria-label="Perbandingan Tujuan Bahan">
            <button
              type="button"
              role="tab"
              aria-selected={interactions.coverCompareId === 'ubat'}
              onClick={() => onPatch({ coverCompareId: 'ubat' })}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-[16px] font-bold transition-colors cursor-pointer ${
                interactions.coverCompareId === 'ubat'
                  ? 'bg-blue-900 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Stethoscope className="w-5 h-5 shrink-0" />
              <span>1. Ubat</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={interactions.coverCompareId === 'kosmetik'}
              onClick={() => onPatch({ coverCompareId: 'kosmetik' })}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-[16px] font-bold transition-colors cursor-pointer ${
                interactions.coverCompareId === 'kosmetik'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Sparkles className="w-5 h-5 shrink-0" />
              <span>2. Kosmetik</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={interactions.coverCompareId === 'terlarang'}
              onClick={() => onPatch({ coverCompareId: 'terlarang' })}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-[16px] font-bold transition-colors cursor-pointer ${
                interactions.coverCompareId === 'terlarang'
                  ? 'bg-red-700 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>3. Terlarang</span>
            </button>
          </div>

          <motion.div
            key={interactions.coverCompareId}
            data-storage-scope={`slide:0/compare:${interactions.coverCompareId}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-5 grid grid-cols-12 gap-5 items-center"
          >
            <div className="col-span-5 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-4 flex flex-col items-center">
              <svg viewBox="0 0 200 185" className="w-full h-48" aria-label="Gambar rajah bahagian tindakan bahan">
                <rect
                  x="14"
                  y="16"
                  width="172"
                  height="38"
                  rx="8"
                  fill={interactions.coverCompareId === 'kosmetik' ? '#DCFCE7' : '#FEF3C7'}
                  stroke={interactions.coverCompareId === 'kosmetik' ? '#15803D' : '#D97706'}
                  strokeWidth={interactions.coverCompareId === 'kosmetik' ? 3 : 1.8}
                />
                <text x="100" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1C1917">
                  1. Permukaan Luar Kulit
                </text>

                <rect
                  x="14"
                  y="72"
                  width="172"
                  height="38"
                  rx="8"
                  fill={interactions.coverCompareId === 'ubat' ? '#DBEAFE' : '#E0F2FE'}
                  stroke={interactions.coverCompareId === 'ubat' ? '#1E3A8A' : '#0369A1'}
                  strokeWidth={interactions.coverCompareId === 'ubat' ? 3 : 1.8}
                />
                <text x="100" y="95" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0C4A6E">
                  2. Rawatan Tubuh / Penyakit
                </text>

                <rect
                  x="14"
                  y="128"
                  width="172"
                  height="40"
                  rx="8"
                  fill={interactions.coverCompareId === 'terlarang' ? '#FEE2E2' : '#F5F5F4'}
                  stroke={interactions.coverCompareId === 'terlarang' ? '#B91C1C' : '#A8A29E'}
                  strokeWidth={interactions.coverCompareId === 'terlarang' ? 3 : 1.8}
                />
                <text
                  x="100"
                  y="152"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill={interactions.coverCompareId === 'terlarang' ? '#7F1D1D' : '#44403C'}
                >
                  3. Salur Darah &amp; Organ
                </text>

                {interactions.coverCompareId === 'ubat' && (
                  <g>
                    <circle cx="24" cy="91" r="6" fill="#1E3A8A" />
                    <path d="M24,58 L24,81" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" />
                  </g>
                )}

                {interactions.coverCompareId === 'kosmetik' && (
                  <g>
                    <circle cx="24" cy="35" r="6" fill="#15803D" />
                    <line x1="16" y1="62" x2="184" y2="62" stroke="#15803D" strokeWidth="2" strokeDasharray="4 4" />
                  </g>
                )}

                {interactions.coverCompareId === 'terlarang' && (
                  <g>
                    <path d="M24,20 L24,148" stroke="#B91C1C" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="24" cy="148" r="6" fill="#B91C1C" />
                  </g>
                )}
              </svg>
              <div className="text-[16px] font-bold text-stone-700 dark:text-stone-300 text-center mt-1">
                {active.svgCaption}
              </div>
            </div>

            <div className="col-span-7 space-y-3">
              <div>
                <div className="text-[20px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {active.title}
                </div>
                <div className="text-[15px] font-semibold text-stone-500 dark:text-stone-400 mt-1">
                  {active.moleculeExample}
                </div>
              </div>
              <p className="text-[18px] leading-relaxed text-stone-800 dark:text-stone-200">{active.mechanism}</p>
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-[17px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
                {active.verdict}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
