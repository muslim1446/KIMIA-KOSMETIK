import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FlaskConical, ShieldAlert, Sparkles } from 'lucide-react';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { APPLE_SPRINGS } from '../../utils/applePhysics';

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
    moleculeExample: 'Ubat tradisional & ubat moden (m.s. 181–183)',
    mechanism:
      'Ubat ialah bahan kimia yang digunakan untuk membantu kita merawat atau mencegah penyakit. Dikelaskan kepada ubat tradisional dan ubat moden.',
    verdict: 'Selamat jika diambil dengan betul; menyalahgunakan ubat hanya akan memudaratkan diri sendiri.',
    svgCaption: 'Bahan kimia merawat atau mencegah penyakit',
  },
  kosmetik: {
    title: '2. Kosmetik',
    moleculeExample: 'Kosmetik rias, perawatan & pewangi (m.s. 184–185)',
    mechanism:
      'Kosmetik ialah bahan atau produk yang digunakan secara luaran untuk membersih, melindungi atau mencantikkan penampilan seseorang.',
    verdict: 'Terdiri daripada air, pengemulsi, pemekat, pelembap, pewangi, pengawet dan pewarna (Rajah 5.15).',
    svgCaption: 'Bahan atau produk kegunaan luaran',
  },
  terlarang: {
    title: '3. Bahan Kimia Terlarang',
    moleculeExample: 'Merkuri, Hidrokuinon, Betamethasone valerate, Tretinoin',
    mechanism:
      'Bahan kimia berbahaya yang dimasukkan ke dalam kosmetik secara tidak sah; mengakibatkan kulit merengsa, pengurangan pigmentasi atau diserap ke salur darah.',
    verdict: 'Pastikan kosmetik berdaftar dengan Bahagian Regulatori Farmasi Negara (NPRA).',
    svgCaption: 'Bahan kimia terlarang (Jadual 5.8, m.s. 186)',
  },
};

export const Slide01Cover: React.FC<Slide01Props> = ({ interactions, onPatch }) => {
  const active = COMPARE_CASES[interactions.coverCompareId];
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="h-full w-full grid grid-cols-12 gap-8 px-10 py-7 items-center select-none">
      <div className="col-span-6 flex flex-col justify-between h-full py-1">
        <div className="space-y-4">
          <div className="text-base font-bold text-[var(--apple-green-fg)] tabular-nums-clean">
            Kimia Tingkatan 5 · Bab 5.4 (m.s. 181–186)
          </div>
          <h1 className="font-display text-[44px] font-extrabold tracking-tight text-[var(--apple-label)] leading-[1.08]">
            Ubat-ubatan dan Bahan Kosmetik
          </h1>
          <p className="text-[20px] font-medium text-[var(--apple-secondary-label)] leading-relaxed">
            Ubat ialah bahan kimia untuk merawat atau mencegah penyakit, manakala kosmetik digunakan secara luaran untuk membersih, melindungi atau mencantikkan penampilan.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="apple-slide-card rounded-[18px] p-4">
              <div className="text-[17px] font-bold text-[var(--apple-blue-fg)] tabular-nums-clean">5.4.1 Jenis Ubat</div>
              <p className="text-[15px] text-[var(--apple-secondary-label)] mt-1 leading-snug">
                Ubat tradisional &amp; ubat moden
              </p>
            </div>
            <div className="apple-slide-card rounded-[18px] p-4">
              <div className="text-[17px] font-bold text-[var(--apple-orange-fg)] tabular-nums-clean">5.4.2 Penggunaan</div>
              <p className="text-[15px] text-[var(--apple-secondary-label)] mt-1 leading-snug">
                Kegunaan, dos &amp; NPRA
              </p>
            </div>
            <div className="apple-slide-card rounded-[18px] p-4">
              <div className="text-[17px] font-bold text-[var(--apple-green-fg)] tabular-nums-clean">5.4.3–4 Kosmetik</div>
              <p className="text-[15px] text-[var(--apple-secondary-label)] mt-1 leading-snug">
                Bahan asas &amp; bahan terlarang
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 apple-hairline-t text-[18px] font-bold text-[var(--apple-label)]">
          Ubat adalah selamat jika diambil dengan betul; menyalahgunakan ubat memudaratkan diri sendiri.
        </div>
      </div>

      <div className="col-span-6 flex flex-col justify-center">
        <div className="apple-slide-card rounded-[26px] p-6">
          <div className="text-[16px] font-semibold text-[var(--apple-secondary-label)]">
            Apakah Ubat &amp; Apakah Kosmetik?
          </div>
          <h2 className="font-display text-[30px] font-bold text-[var(--apple-label)] mt-0.5 leading-tight">
            Perbandingan Kegunaan &amp; Kesan
          </h2>

          <div className="grid grid-cols-3 gap-2.5 mt-4 p-1.5 rounded-[18px] apple-slide-inset" role="tablist" aria-label="Perbandingan Tujuan Bahan">
            <button
              type="button"
              role="tab"
              aria-selected={interactions.coverCompareId === 'ubat'}
              onClick={() => onPatch({ coverCompareId: 'ubat' })}
              className={`apple-pressable apple-tap-target flex items-center justify-center gap-2 py-2.5 px-3 rounded-[13px] text-[16px] font-bold cursor-pointer ${
                interactions.coverCompareId === 'ubat'
                  ? 'bg-[var(--apple-blue)] text-white shadow-sm'
                  : 'text-[var(--apple-secondary-label)] hover:bg-[var(--apple-fill)]'
              }`}
            >
              <FlaskConical className="w-5 h-5 shrink-0" />
              <span>1. Ubat</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={interactions.coverCompareId === 'kosmetik'}
              onClick={() => onPatch({ coverCompareId: 'kosmetik' })}
              className={`apple-pressable apple-tap-target flex items-center justify-center gap-2 py-2.5 px-3 rounded-[13px] text-[16px] font-bold cursor-pointer ${
                interactions.coverCompareId === 'kosmetik'
                  ? 'bg-[var(--apple-green-fg)] text-white shadow-sm'
                  : 'text-[var(--apple-secondary-label)] hover:bg-[var(--apple-fill)]'
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
              className={`apple-pressable apple-tap-target flex items-center justify-center gap-2 py-2.5 px-3 rounded-[13px] text-[16px] font-bold cursor-pointer ${
                interactions.coverCompareId === 'terlarang'
                  ? 'bg-[var(--apple-red-fg)] text-white shadow-sm'
                  : 'text-[var(--apple-secondary-label)] hover:bg-[var(--apple-fill)]'
              }`}
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>3. Terlarang</span>
            </button>
          </div>

          <motion.div
            key={interactions.coverCompareId}
            data-storage-scope={`slide:0/compare:${interactions.coverCompareId}`}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0.14 } : APPLE_SPRINGS.snappy}
            className="mt-5 grid grid-cols-12 gap-5 items-center"
          >
            <div className="col-span-5 apple-slide-inset rounded-[18px] p-4 flex flex-col items-center">
              <svg viewBox="0 0 200 185" className="w-full h-48" aria-label="Gambar rajah bahagian tindakan bahan">
                <rect
                  x="14"
                  y="16"
                  width="172"
                  height="38"
                  rx="9"
                  fill={interactions.coverCompareId === 'kosmetik' ? '#DCFCE7' : '#FEF3C7'}
                  stroke={interactions.coverCompareId === 'kosmetik' ? '#15803D' : '#D97706'}
                  strokeWidth={interactions.coverCompareId === 'kosmetik' ? 3 : 1.8}
                />
                <text x="100" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1C1917">
                  1. Kosmetik (Kegunaan Luaran)
                </text>

                <rect
                  x="14"
                  y="72"
                  width="172"
                  height="38"
                  rx="9"
                  fill={interactions.coverCompareId === 'ubat' ? '#DBEAFE' : '#E0F2FE'}
                  stroke={interactions.coverCompareId === 'ubat' ? '#0066D6' : '#0369A1'}
                  strokeWidth={interactions.coverCompareId === 'ubat' ? 3 : 1.8}
                />
                <text x="100" y="95" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0C4A6E">
                  2. Ubat (Bahan Kimia)
                </text>

                <rect
                  x="14"
                  y="128"
                  width="172"
                  height="40"
                  rx="9"
                  fill={interactions.coverCompareId === 'terlarang' ? '#FEE2E2' : 'var(--slide-svg-neutral-fill)'}
                  stroke={interactions.coverCompareId === 'terlarang' ? '#C91D12' : 'var(--slide-svg-ring)'}
                  strokeWidth={interactions.coverCompareId === 'terlarang' ? 3 : 1.8}
                />
                <text
                  x="100"
                  y="152"
                  textAnchor="middle"
                  fontSize="12.5"
                  fontWeight="700"
                  fill={interactions.coverCompareId === 'terlarang' ? '#7F1D1D' : 'var(--slide-svg-ink)'}
                >
                  3. Bahan Terlarang (Jadual 5.8)
                </text>

                {interactions.coverCompareId === 'ubat' && (
                  <g>
                    <circle cx="24" cy="91" r="6" fill="#0066D6" />
                    <path d="M24,58 L24,81" stroke="#0066D6" strokeWidth="3" strokeLinecap="round" />
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
                    <path d="M24,20 L24,148" stroke="#C91D12" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="24" cy="148" r="6" fill="#C91D12" />
                  </g>
                )}
              </svg>
              <div className="text-[16px] font-bold text-[var(--apple-secondary-label)] text-center mt-1">
                {active.svgCaption}
              </div>
            </div>

            <div className="col-span-7 space-y-3">
              <div>
                <div className="text-[20px] font-bold text-[var(--apple-label)] leading-snug tabular-nums-clean">
                  {active.title}
                </div>
                <div className="text-[15px] font-semibold text-[var(--apple-secondary-label)] mt-1">
                  {active.moleculeExample}
                </div>
              </div>
              <p className="text-[18px] leading-relaxed text-[var(--apple-label)]">{active.mechanism}</p>
              <div className="pt-3 apple-hairline-t text-[17px] font-bold text-[var(--apple-label)] leading-snug">
                {active.verdict}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
