import React from 'react';
import { Ban, CheckCircle2, ShieldAlert } from 'lucide-react';
import { BANNED_CHEMICALS } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide08Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

export const Slide08BannedForensics: React.FC<Slide08Props> = ({ interactions, onPatch }) => {
  const activeChemical =
    BANNED_CHEMICALS.find((c) => c.id === interactions.bannedChemicalId) ?? BANNED_CHEMICALS[0];

  const targetDepthY =
    activeChemical.hazardProfile === 'penyerapan_toksik'
      ? 156
      : activeChemical.hazardProfile === 'gangguan_pigmentasi_uv' || activeChemical.hazardProfile === 'perubahan_pigmentasi'
      ? 78
      : 40;

  return (
    <div className="h-full w-full flex flex-col gap-3.5 px-10 py-6 select-none">
      <div className="shrink-0 apple-hairline-b pb-2.5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold text-[var(--apple-red-fg)] tabular-nums-clean">
            5.4.4 · Penggunaan Kosmetik &amp; Bahan Kimia Terlarang (Rajah 5.17 &amp; Jadual 5.8 · m.s. 185–186)
          </div>
          <h2 className="font-display text-[28px] font-bold text-[var(--apple-label)] mt-0.5 leading-tight">
            Kosmetik Buatan Sendiri vs Komersial &amp; Bahan Kimia Terlarang
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 p-1 rounded-[15px] apple-slide-inset">
          <button
            type="button"
            aria-selected={interactions.cosmeticCompareTab === 'buatan_sendiri'}
            onClick={() => onPatch({ cosmeticCompareTab: 'buatan_sendiri' })}
            className={`apple-pressable apple-tap-target px-3.5 py-2 rounded-[11px] border text-[14px] font-bold cursor-pointer ${
              interactions.cosmeticCompareTab === 'buatan_sendiri'
                ? 'border-[var(--apple-green-fg)] bg-emerald-50 dark:bg-emerald-950/45 text-emerald-900 dark:text-emerald-200 shadow-sm'
                : 'border-transparent text-[var(--apple-secondary-label)] hover:bg-[var(--apple-fill)]'
            }`}
          >
            Kebaikan Buatan Sendiri
          </button>
          <button
            type="button"
            aria-selected={interactions.cosmeticCompareTab === 'komersial_haram'}
            onClick={() => onPatch({ cosmeticCompareTab: 'komersial_haram' })}
            className={`apple-pressable apple-tap-target px-3.5 py-2 rounded-[11px] border text-[14px] font-bold cursor-pointer ${
              interactions.cosmeticCompareTab === 'komersial_haram'
                ? 'border-[var(--apple-red-fg)] bg-red-50 dark:bg-red-950/45 text-red-900 dark:text-red-200 shadow-sm'
                : 'border-transparent text-[var(--apple-secondary-label)] hover:bg-[var(--apple-fill)]'
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
            <div className="border border-emerald-300/80 dark:border-emerald-800/70 bg-emerald-50/90 dark:bg-emerald-950/35 rounded-[18px] px-4 py-3 grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2.5 text-[15px] text-emerald-950 dark:text-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-[var(--apple-green-fg)] shrink-0 mt-0.5" />
                <span>Mudah dihasilkan menggunakan bahan-bahan semula jadi.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-emerald-950 dark:text-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-[var(--apple-green-fg)] shrink-0 mt-0.5" />
                <span>Selamat dan tiada bahan kimia berbahaya.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-emerald-950 dark:text-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-[var(--apple-green-fg)] shrink-0 mt-0.5" />
                <span>Kos yang murah.</span>
              </div>
            </div>
          ) : (
            <div className="border border-red-300/80 dark:border-red-800/70 bg-red-50/90 dark:bg-red-950/35 rounded-[18px] px-4 py-3 grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2.5 text-[15px] text-red-950 dark:text-red-100">
                <ShieldAlert className="w-5 h-5 text-[var(--apple-red-fg)] shrink-0 mt-0.5" />
                <span>Kesan sampingan yang merbahayakan.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-red-950 dark:text-red-100">
                <ShieldAlert className="w-5 h-5 text-[var(--apple-red-fg)] shrink-0 mt-0.5" />
                <span>Terdapat bahan kimia berbahaya dimasukkan secara tidak sah.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-red-950 dark:text-red-100">
                <ShieldAlert className="w-5 h-5 text-[var(--apple-red-fg)] shrink-0 mt-0.5" />
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
                aria-selected={active}
                onClick={() => onPatch({ bannedChemicalId: chem.id })}
                className={`apple-pressable apple-tap-target text-left rounded-[18px] px-4 py-3 cursor-pointer ${
                  active
                    ? 'apple-slide-card border-[var(--apple-red-fg)] bg-red-50/90 dark:bg-red-950/40'
                    : 'apple-slide-card hover:bg-[var(--apple-fill)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[19px] font-bold text-[var(--apple-label)]">{chem.name}</span>
                  <Ban className={`w-5 h-5 shrink-0 ${active ? 'text-[var(--apple-red-fg)]' : 'text-[var(--apple-tertiary-label)]'}`} />
                </div>
                <div className="text-[14px] text-[var(--apple-secondary-label)] mt-0.5 leading-snug">{chem.productFoundIn}</div>
              </button>
            );
          })}
        </div>

        <div
          data-storage-scope={`slide:7/chem:${activeChemical.id}`}
          className="col-span-7 apple-slide-card rounded-[24px] p-5 flex flex-col justify-between"
        >
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5 apple-slide-inset rounded-[18px] p-3">
              <svg viewBox="0 0 215 190" className="w-full h-44" role="img" aria-label="Tahap risiko bahan kimia terlarang Jadual 5.8">
                <line
                  x1="18"
                  y1="14"
                  x2="18"
                  y2={targetDepthY}
                  stroke="var(--apple-red-fg)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle
                  cx="18"
                  cy={targetDepthY}
                  r="6"
                  fill="var(--apple-red-fg)"
                />

                <rect
                  x="34"
                  y="20"
                  width="172"
                  height="32"
                  rx="7"
                  fill={
                    activeChemical.hazardProfile === 'kerengsaan_permukaan' ||
                    activeChemical.hazardProfile === 'gangguan_pigmentasi_uv' ||
                    activeChemical.hazardProfile === 'perubahan_pigmentasi' ||
                    activeChemical.hazardProfile === 'penyerapan_toksik'
                      ? '#FCA5A5'
                      : 'var(--slide-svg-neutral-fill)'
                  }
                  stroke="#DC2626"
                  strokeWidth="1.5"
                />
                <text x="120" y="40" textAnchor="middle" fontSize="11" fill="#450A0A" fontWeight="800">
                  1. Kulit Merengsa / Mengelupas
                </text>

                <rect
                  x="34"
                  y="58"
                  width="172"
                  height="36"
                  rx="7"
                  fill={
                    activeChemical.hazardProfile === 'gangguan_pigmentasi_uv' || activeChemical.hazardProfile === 'perubahan_pigmentasi'
                      ? '#FECACA'
                      : 'var(--slide-svg-neutral-fill)'
                  }
                  stroke={
                    activeChemical.hazardProfile === 'gangguan_pigmentasi_uv' || activeChemical.hazardProfile === 'perubahan_pigmentasi'
                      ? '#DC2626'
                      : 'var(--slide-svg-ring)'
                  }
                  strokeWidth="1.5"
                />
                <text
                  x="120"
                  y="80"
                  textAnchor="middle"
                  fontSize="11"
                  fill={
                    activeChemical.hazardProfile === 'gangguan_pigmentasi_uv' || activeChemical.hazardProfile === 'perubahan_pigmentasi'
                      ? '#450A0A'
                      : 'var(--slide-svg-ink)'
                  }
                  fontWeight="800"
                >
                  2. Pigmentasi &amp; Sinar UV
                </text>

                <rect
                  x="34"
                  y="100"
                  width="172"
                  height="30"
                  rx="7"
                  fill={activeChemical.hazardProfile === 'penyerapan_toksik' ? '#FCA5A5' : 'var(--slide-svg-neutral-fill)'}
                  stroke={activeChemical.hazardProfile === 'penyerapan_toksik' ? '#DC2626' : 'var(--slide-svg-ring)'}
                  strokeWidth="1.5"
                />
                <text
                  x="120"
                  y="119"
                  textAnchor="middle"
                  fontSize="11"
                  fill={activeChemical.hazardProfile === 'penyerapan_toksik' ? '#450A0A' : 'var(--slide-svg-ink)'}
                  fontWeight="800"
                >
                  3. Diserap ke Salur Darah
                </text>

                <rect
                  x="34"
                  y="136"
                  width="172"
                  height="38"
                  rx="7"
                  fill={activeChemical.hazardProfile === 'penyerapan_toksik' ? '#C91D12' : 'var(--slide-svg-neutral-fill)'}
                  stroke={activeChemical.hazardProfile === 'penyerapan_toksik' ? '#991B1B' : 'var(--slide-svg-ring)'}
                  strokeWidth="1.5"
                />
                <text
                  x="120"
                  y="159"
                  textAnchor="middle"
                  fontSize="10.5"
                  fill={activeChemical.hazardProfile === 'penyerapan_toksik' ? '#FFFFFF' : 'var(--slide-svg-ink)'}
                  fontWeight="800"
                >
                  4. Kerosakan Buah Pinggang &amp; Saraf
                </text>
              </svg>
            </div>

            <div className="col-span-7 space-y-2.5">
              <div>
                <div className="text-[14px] font-bold text-[var(--apple-red-fg)] tabular-nums-clean">Jadual 5.8 · Bahan Kimia Terlarang</div>
                <h3 className="font-display text-[24px] font-bold text-[var(--apple-label)] leading-tight">
                  {activeChemical.name}
                </h3>
              </div>

              <div className="apple-slide-inset rounded-[14px] p-3">
                <div className="text-[14px] font-bold text-[var(--apple-secondary-label)]">Kesan Sampingan (Jadual 5.8)</div>
                <p className="text-[15px] text-[var(--apple-label)] mt-0.5 leading-snug">
                  {activeChemical.explanation}
                </p>
              </div>

              <div className="bg-red-50/90 dark:bg-red-950/35 border border-red-200 dark:border-red-900/60 rounded-[14px] p-3">
                <div className="text-[14px] font-bold text-[var(--apple-red-fg)]">Catatan</div>
                <p className="text-[15px] text-red-950 dark:text-red-100 mt-0.5 font-bold leading-snug">
                  {activeChemical.productFoundIn}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2.5 apple-hairline-t text-[14px] text-[var(--apple-secondary-label)] leading-snug tabular-nums-clean">
            <strong className="text-[var(--apple-label)]">Nasihat Pengguna (m.s. 186):</strong> Peka dengan kandungan bahan dan pastikan kosmetik berdaftar dengan{' '}
            <strong className="text-[var(--apple-label)]">Bahagian Regulatori Farmasi Negara</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
