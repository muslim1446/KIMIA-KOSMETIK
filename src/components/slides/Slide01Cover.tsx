import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Sparkles, Stethoscope } from 'lucide-react';
import { TEAM_PRESENTERS } from '../../data/slidesData';
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
  }
> = {
  ubat: {
    title: '1. Ubat: Sukatan Tepat Menuju Sasaran',
    moleculeExample: 'Contoh: Betamethasone valerate (preskripsi doktor), Parasetamol',
    mechanism:
      'Molekul tulen disukat dengan tepat supaya cukup kuat merawat sel bermasalah tanpa merosakkan organ sihat.',
    verdict: 'Selamat apabila dipantau doktor dan membawa nombor pendaftaran MAL yang sah.',
  },
  kosmetik: {
    title: '2. Kosmetik: Bertindak di Permukaan Luar Sahaja',
    moleculeExample: 'Contoh: Air, Lesitin (Pengemulsi), Gliserin (Pelembap)',
    mechanism:
      'Molekulnya kekal pada lapisan luar kulit untuk membersih, melembap atau memberi warna — tidak masuk ke salur darah.',
    verdict: 'Selamat digunakan secara luaran jika mempunyai nombor notifikasi NOT yang sah.',
  },
  terlarang: {
    title: '3. Produk Haram: Bahan Terlarang Tembus ke Darah',
    moleculeExample: 'Contoh: Merkuri, Hidrokuinon, Steroid dalam krim putih segera',
    mechanism:
      'Bahan kimia aktif atau logam berat dimasukkan secara haram, lalu menyerap menembusi kulit terus ke salur darah dan organ.',
    verdict: 'Dilarang sama sekali — merosakkan buah pinggang, sistem saraf dan perisai kulit.',
  },
};

export const Slide01Cover: React.FC<Slide01Props> = ({ interactions, onPatch }) => {
  const active = COMPARE_CASES[interactions.coverCompareId];

  return (
    <div className="h-full w-full grid grid-cols-12 gap-8 px-10 py-7 items-center select-none">
      <div className="col-span-6 flex flex-col justify-between h-full py-1">
        <div className="space-y-4">
          <div className="text-base font-bold text-emerald-800 dark:text-emerald-400">
            Kimia Tingkatan 5 · Bab 5.4
          </div>
          <h1 className="font-display text-[44px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08]">
            Ubat-ubatan & Bahan Kosmetik
          </h1>
          <p className="text-[19px] font-medium text-stone-700 dark:text-stone-300 leading-relaxed">
            Bahan yang hampir serupa boleh menjadi{' '}
            <span className="font-bold text-blue-900 dark:text-blue-400">ubat penyembuh</span>,{' '}
            <span className="font-bold text-emerald-800 dark:text-emerald-400">kosmetik luaran</span>, atau{' '}
            <span className="font-bold text-red-700 dark:text-red-400">racun senyap</span> — bergantung pada 3 rahsia kimia:
          </p>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5">
              <div className="text-sm font-bold text-blue-900 dark:text-blue-400">Rahsia 1</div>
              <div className="text-[17px] font-bold text-stone-900 dark:text-stone-100 mt-0.5">Struktur</div>
              <p className="text-[15px] text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                Bentuk dan sifat asid/kutub molekul
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5">
              <div className="text-sm font-bold text-amber-800 dark:text-amber-400">Rahsia 2</div>
              <div className="text-[17px] font-bold text-stone-900 dark:text-stone-100 mt-0.5">Dos &amp; Tempoh</div>
              <p className="text-[15px] text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                Jumlah yang masuk menentu selamat atau toksik
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5">
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Rahsia 3</div>
              <div className="text-[17px] font-bold text-stone-900 dark:text-stone-100 mt-0.5">Lapisan Sasaran</div>
              <p className="text-[15px] text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                Kekal di luar kulit atau masuk salur darah
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
            {([1, 2, 3, 4] as const).map((id) => (
              <div key={id} className="flex flex-col">
                <span className="text-[16px] font-bold text-stone-900 dark:text-stone-100">
                  {TEAM_PRESENTERS[id].name}
                </span>
                <span className="text-[15px] text-stone-600 dark:text-stone-400 leading-snug">
                  {TEAM_PRESENTERS[id].focus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-6 flex flex-col justify-center">
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
          <div className="text-[15px] font-semibold text-stone-500 dark:text-stone-400">
            Perbandingan Lapisan Tindakan
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-100 mt-0.5 leading-tight">
            Di Manakah Molekul Ini Bertindak?
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
              <span>Ubat</span>
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
              <span>Kosmetik</span>
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
              <span>Terlarang</span>
            </button>
          </div>

          <motion.div
            key={interactions.coverCompareId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-5 grid grid-cols-12 gap-5 items-center"
          >
            <div className="col-span-5 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-4 flex flex-col items-center">
              <svg viewBox="0 0 200 185" className="w-full h-48" aria-label="Gambar rajah kedalaman serapan molekul">
                <rect x="14" y="16" width="172" height="36" rx="8" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
                <text x="100" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill="#78350F">
                  1. Permukaan Luar Kulit
                </text>

                <rect x="14" y="72" width="172" height="36" rx="8" fill="#E0F2FE" stroke="#0369A1" strokeWidth="2" />
                <text x="100" y="95" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0C4A6E">
                  2. Tisu / Sasaran Sakit
                </text>

                <rect
                  x="14"
                  y="128"
                  width="172"
                  height="40"
                  rx="8"
                  fill={interactions.coverCompareId === 'terlarang' ? '#FEE2E2' : '#F5F5F4'}
                  stroke={interactions.coverCompareId === 'terlarang' ? '#B91C1C' : '#A8A29E'}
                  strokeWidth="2"
                />
                <text
                  x="100"
                  y="152"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill={interactions.coverCompareId === 'terlarang' ? '#7F1D1D' : '#44403C'}
                >
                  3. Salur Darah &amp; Ginjal
                </text>

                {interactions.coverCompareId === 'ubat' && (
                  <g>
                    <circle cx="34" cy="90" r="8" fill="#1E3A8A" />
                    <path d="M34,20 L34,78" stroke="#1E3A8A" strokeWidth="4" strokeLinecap="round" />
                    <polygon points="27,74 41,74 34,85" fill="#1E3A8A" />
                  </g>
                )}

                {interactions.coverCompareId === 'kosmetik' && (
                  <g>
                    <circle cx="34" cy="34" r="8" fill="#15803D" />
                    <line x1="20" y1="62" x2="180" y2="62" stroke="#15803D" strokeWidth="3" strokeDasharray="5 4" />
                  </g>
                )}

                {interactions.coverCompareId === 'terlarang' && (
                  <g>
                    <path d="M34,20 L34,136" stroke="#B91C1C" strokeWidth="4" strokeLinecap="round" />
                    <polygon points="27,132 41,132 34,144" fill="#B91C1C" />
                    <circle cx="34" cy="148" r="7" fill="#B91C1C" />
                  </g>
                )}
              </svg>
              <div className="text-[15px] font-bold text-stone-700 dark:text-stone-300 text-center mt-1">
                {interactions.coverCompareId === 'ubat'
                  ? 'Sukatan tepat ke sasaran rawatan'
                  : interactions.coverCompareId === 'kosmetik'
                  ? 'Berhenti di permukaan luar kulit'
                  : 'Menembusi kulit masuk ke darah'}
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
              <p className="text-[17px] leading-relaxed text-stone-800 dark:text-stone-200">{active.mechanism}</p>
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-[16px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
                {active.verdict}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
