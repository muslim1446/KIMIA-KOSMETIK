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
    accent: string;
  }
> = {
  ubat: {
    title: 'Ubat untuk Merawat & Mencegah',
    moleculeExample: 'Betamethasone valerate (preskripsi doktor), Aspirin',
    mechanism:
      'Bahan kimia dalam sukatan tepat untuk merawat atau mencegah penyakit di bawah pengawasan perubatan.',
    verdict: 'Selamat digunakan apabila mematuhi preskripsi dan nombor pendaftaran MAL.',
    accent: '#1E40AF',
  },
  kosmetik: {
    title: 'Bahan Kosmetik untuk Luaran',
    moleculeExample: 'Air, Lesitin (Pengemulsi), Gliserin (Pelembap)',
    mechanism:
      'Digunakan di bahagian luar tubuh untuk membersih, melindungi atau mencantikkan penampilan.',
    verdict: 'Selamat digunakan secara luaran jika mempunyai nombor notifikasi NOT yang sah.',
    accent: '#2D6A4F',
  },
  terlarang: {
    title: 'Penyalahgunaan & Bahan Terlarang',
    moleculeExample: 'Merkuri, Hidrokuinon, Betamethasone dalam krim haram',
    mechanism:
      'Apabila ubat kawalan atau logam berat dimasukkan secara haram ke dalam produk harian, ia menyerap ke salur darah.',
    verdict: 'Dilarang sama sekali — berisiko merosakkan buah pinggang, hati dan saraf.',
    accent: '#B91C1C',
  },
};

export const Slide01Cover: React.FC<Slide01Props> = ({ interactions, onPatch }) => {
  const active = COMPARE_CASES[interactions.coverCompareId];

  return (
    <div className="h-full w-full grid grid-cols-12 gap-8 px-10 py-8 items-center select-none">
      {/* Left Column */}
      <div className="col-span-6 flex flex-col justify-center gap-7 h-full">
        <div>
          <div className="text-base font-semibold text-emerald-800 dark:text-emerald-400 mb-2">
            Kimia Tingkatan 5 · Bab 5.4
          </div>
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.06]">
            Ubat-ubatan dan Bahan Kosmetik
          </h1>
          <p className="mt-4 text-xl text-stone-700 dark:text-stone-300 leading-relaxed">
            Memahami peranan bahan kimia dalam{' '}
            <span className="font-bold text-blue-800 dark:text-blue-400">merawat penyakit</span>,{' '}
            <span className="font-bold text-emerald-800 dark:text-emerald-400">penjagaan luaran</span>, serta{' '}
            <span className="font-bold text-red-700 dark:text-red-400">bahaya penyalahgunaan</span>.
          </p>
        </div>

        <div className="pt-5 border-t border-stone-200 dark:border-stone-800">
          <div className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3">
            Pembahagian Pembentangan
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3">
            {([1, 2, 3, 4] as const).map((id) => (
              <div key={id} className="flex flex-col">
                <span className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {TEAM_PRESENTERS[id].name}
                </span>
                <span className="text-sm text-stone-600 dark:text-stone-400 leading-snug">
                  {TEAM_PRESENTERS[id].focus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="col-span-6 flex flex-col justify-center">
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-7 shadow-sm">
          <div className="text-sm font-semibold text-stone-500 dark:text-stone-400">Perbandingan Awal</div>
          <h2 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            Bahan Sama, Tujuan Berbeza
          </h2>

          <div className="grid grid-cols-3 gap-2.5 mt-5" role="tablist" aria-label="Perbandingan Tujuan Bahan">
            <button
              type="button"
              role="tab"
              aria-selected={interactions.coverCompareId === 'ubat'}
              onClick={() => onPatch({ coverCompareId: 'ubat' })}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-base font-bold transition-colors cursor-pointer ${
                interactions.coverCompareId === 'ubat'
                  ? 'bg-blue-800 text-white'
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
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-base font-bold transition-colors cursor-pointer ${
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
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-base font-bold transition-colors cursor-pointer ${
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
            className="mt-6 grid grid-cols-12 gap-5 items-center"
          >
            <div className="col-span-5 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-4 flex flex-col items-center">
              {interactions.coverCompareId === 'ubat' ? (
                <svg viewBox="0 0 180 140" className="w-full h-36" aria-hidden="true">
                  <rect x="24" y="24" width="132" height="32" rx="16" fill="#DBEAFE" stroke="#1E40AF" strokeWidth="2.5" />
                  <line x1="90" y1="24" x2="90" y2="56" stroke="#1E40AF" strokeWidth="2" strokeDasharray="3 3" />
                  <text x="90" y="44" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#1E3A8A">
                    Dos Terkawal
                  </text>
                  <path d="M90,62 L90,86" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
                  <polygon points="84,82 96,82 90,92" fill="#1E40AF" />
                  <rect x="30" y="96" width="120" height="28" rx="8" fill="#EFF6FF" stroke="#1E40AF" strokeWidth="2" />
                  <text x="90" y="114" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#1E3A8A">
                    Rawat Sasaran Penyakit
                  </text>
                </svg>
              ) : interactions.coverCompareId === 'kosmetik' ? (
                <svg viewBox="0 0 180 140" className="w-full h-36" aria-hidden="true">
                  <circle cx="90" cy="30" r="14" fill="#D1FAE5" stroke="#2D6A4F" strokeWidth="2.5" />
                  <text x="90" y="34" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#065F46">
                    NOT
                  </text>
                  <path d="M90,48 L90,66" stroke="#2D6A4F" strokeWidth="3" strokeLinecap="round" />
                  <rect x="20" y="70" width="140" height="24" rx="6" fill="#A7F3D0" stroke="#2D6A4F" strokeWidth="2.5" />
                  <text x="90" y="86" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#064E3B">
                    Permukaan Kulit Sahaja
                  </text>
                  <rect x="20" y="102" width="140" height="22" rx="6" fill="#F5F5F4" stroke="#A8A29E" strokeWidth="1.5" strokeDasharray="4 3" />
                  <text x="90" y="117" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#57534E">
                    Salur Darah Terlindung
                  </text>
                </svg>
              ) : (
                <svg viewBox="0 0 180 140" className="w-full h-36" aria-hidden="true">
                  <line x1="18" y1="28" x2="18" y2="108" stroke="#B91C1C" strokeWidth="3" strokeLinecap="round" />
                  <polygon points="12,104 24,104 18,114" fill="#B91C1C" />
                  <rect x="34" y="18" width="134" height="22" rx="6" fill="#FDE68A" stroke="#D97706" strokeWidth="2" />
                  <text x="101" y="33" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#78350F">
                    Krim Haram / Merkuri
                  </text>
                  <rect x="34" y="54" width="134" height="22" rx="6" fill="#FECACA" stroke="#DC2626" strokeWidth="2" />
                  <text x="101" y="69" textAnchor="middle" fontSize="10" fontWeight="700" fill="#7F1D1D">
                    Tembus Kulit → Darah
                  </text>
                  <rect x="34" y="96" width="134" height="26" rx="6" fill="#B91C1C" />
                  <text x="101" y="113" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
                    Rosak Buah Pinggang
                  </text>
                </svg>
              )}
              <div className="text-sm font-semibold text-stone-700 dark:text-stone-300 text-center">
                {interactions.coverCompareId === 'ubat'
                  ? 'Rawatan dalaman / luaran'
                  : interactions.coverCompareId === 'kosmetik'
                  ? 'Permukaan kulit sahaja'
                  : 'Menyerap ke salur darah'}
              </div>
            </div>

            <div className="col-span-7 space-y-3">
              <div>
                <div className="text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug">{active.title}</div>
                <div className="text-sm font-medium text-stone-500 dark:text-stone-400 mt-1">{active.moleculeExample}</div>
              </div>
              <p className="text-base leading-relaxed text-stone-700 dark:text-stone-300">{active.mechanism}</p>
              <div className="pt-2.5 border-t border-stone-200 dark:border-stone-800 text-sm font-bold text-stone-900 dark:text-stone-100">
                {active.verdict}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
