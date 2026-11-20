import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Flame, Hammer, Leaf, Pill } from 'lucide-react';
import { TRADITIONAL_HERBS, TraditionalHerb } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide02Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

function HerbIllustration({ herb }: { herb: TraditionalHerb }) {
  if (herb.id === 'halia') {
    return (
      <svg viewBox="0 0 180 120" className="w-full h-36" aria-hidden="true">
        <path
          d="M35,78 C30,60 48,48 64,56 C74,42 96,42 104,58 C122,48 142,58 138,76 C135,92 110,94 94,88 C78,96 42,96 35,78 Z"
          fill="#FEF3C7"
          stroke="#B45309"
          strokeWidth="3"
        />
        <path d="M72,50 C70,32 76,22 86,16" stroke="#2D6A4F" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M98,48 C102,32 114,24 126,22" stroke="#2D6A4F" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (herb.id === 'lidah_buaya') {
    return (
      <svg viewBox="0 0 180 120" className="w-full h-36" aria-hidden="true">
        <path d="M90,104 L62,36 C68,30 78,44 90,82 Z" fill="#D1FAE5" stroke="#2D6A4F" strokeWidth="2.5" />
        <path d="M90,104 L118,36 C112,30 102,44 90,82 Z" fill="#D1FAE5" stroke="#2D6A4F" strokeWidth="2.5" />
        <path d="M90,104 L90,18 C82,38 82,76 90,104 Z" fill="#A7F3D0" stroke="#2D6A4F" strokeWidth="3" />
        <path d="M90,104 L90,18 C98,38 98,76 90,104 Z" fill="#6EE7B7" stroke="#2D6A4F" strokeWidth="3" />
      </svg>
    );
  }
  if (herb.id === 'ginseng') {
    return (
      <svg viewBox="0 0 180 120" className="w-full h-36" aria-hidden="true">
        <path d="M90,34 C82,46 82,66 90,74 C98,66 98,46 90,34 Z" fill="#FDE68A" stroke="#92400E" strokeWidth="3" />
        <path d="M86,70 L68,104 M94,70 L112,104 M80,82 L58,92 M100,82 L122,92" stroke="#92400E" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M90,34 L90,18 M90,22 L76,14 M90,22 L104,14" stroke="#2D6A4F" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 180 120" className="w-full h-36" aria-hidden="true">
      <path
        d="M44,68 C46,44 70,38 84,52 C98,36 124,42 136,64 C138,82 114,90 96,78 C80,92 48,88 44,68 Z"
        fill="#FED7AA"
        stroke="#7C2D12"
        strokeWidth="3"
      />
      <circle cx="66" cy="66" r="7" fill="#7C2D12" opacity="0.25" />
      <circle cx="92" cy="62" r="7" fill="#7C2D12" opacity="0.25" />
      <circle cx="116" cy="66" r="7" fill="#7C2D12" opacity="0.25" />
    </svg>
  );
}

export const Slide02Traditional: React.FC<Slide02Props> = ({ interactions, onPatch }) => {
  const activeHerb = TRADITIONAL_HERBS.find((h) => h.id === interactions.herbId) ?? TRADITIONAL_HERBS[0];

  return (
    <div className="h-full w-full flex flex-col gap-5 px-10 py-8 select-none">
      {/* Header */}
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3.5">
        <div>
          <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
            5.4.1 · Ubat Tradisional (Rajah 5.13)
          </div>
          <h2 className="font-display text-4xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Tumbuhan Herba Tanpa Pemprosesan Kimia
          </h2>
        </div>
        <div className="text-base text-stone-600 dark:text-stone-300 max-w-sm text-right">
          Diperoleh daripada tumbuhan herba atau haiwan secara semula jadi.
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
        {/* Left: 4 Herbs */}
        <div className="col-span-4 flex flex-col gap-2.5">
          {TRADITIONAL_HERBS.map((herb) => {
            const selected = herb.id === activeHerb.id && !interactions.ketumOpen;
            return (
              <button
                key={herb.id}
                type="button"
                onClick={() => onPatch({ herbId: herb.id, ketumOpen: false })}
                className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors cursor-pointer ${
                  selected
                    ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:border-emerald-500'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">{herb.name}</span>
                  <Leaf className="w-5 h-5 shrink-0" style={{ color: herb.accentColor }} />
                </div>
                <div className="text-sm italic text-stone-500 dark:text-stone-400 mt-0.5">{herb.scientificName}</div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPatch({ ketumOpen: !interactions.ketumOpen })}
            className={`mt-auto w-full text-left rounded-2xl border px-4 py-3 transition-colors cursor-pointer ${
              interactions.ketumOpen
                ? 'border-red-600 bg-red-50 dark:bg-red-950/50'
                : 'border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-bold text-red-800 dark:text-red-300">Cabaran Minda: Daun Ketum</span>
              <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
            </div>
            <div className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">
              Mengapa ia diharamkan di sisi undang-undang?
            </div>
          </button>
        </div>

        {/* Right: Showcase */}
        <div className="col-span-8">
          {interactions.ketumOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full border border-red-200 dark:border-red-800 bg-white dark:bg-stone-900 rounded-3xl p-7 flex flex-col justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Cabaran Minda · Gambar foto 5.9 (m.s. 181)
                </div>
                <h3 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1.5">
                  Daun Ketum (<span className="italic">Mitragyna speciosa</span>)
                </h3>
                <div className="grid grid-cols-2 gap-5 mt-5">
                  <div className="rounded-2xl p-5 bg-[#FBF9F5] dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                    <div className="text-sm font-bold text-stone-500">Kegunaan Tradisional</div>
                    <p className="text-base text-stone-800 dark:text-stone-200 mt-2 leading-relaxed">
                      Digunakan secara tradisi untuk melegakan sakit belakang dan sebagai pemulih tenaga.
                    </p>
                  </div>
                  <div className="rounded-2xl p-5 bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                    <div className="text-sm font-bold text-red-800 dark:text-red-300">Sebab Diharamkan</div>
                    <p className="text-base text-stone-900 dark:text-stone-100 mt-2 leading-relaxed">
                      Mengandungi bahan psikoaktif yang menyebabkan <strong>ketagihan</strong> apabila disalah guna, lalu penjualan produknya diharamkan.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
                <span className="text-sm text-stone-600 dark:text-stone-400">
                  Bahan semula jadi juga boleh memudaratkan jika menyebabkan ketagihan.
                </span>
                <button
                  type="button"
                  onClick={() => onPatch({ ketumOpen: false })}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold cursor-pointer shrink-0"
                >
                  Kembali ke Senarai Herba
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeHerb.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-3xl p-7 flex flex-col justify-between"
            >
              <div className="grid grid-cols-12 gap-6 items-center">
                <div className="col-span-4 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-4">
                  <HerbIllustration herb={activeHerb} />
                  <div className="text-center text-sm font-semibold text-stone-700 dark:text-stone-300 mt-2">
                    {activeHerb.partUsed}
                  </div>
                </div>

                <div className="col-span-8 space-y-3">
                  <div>
                    <div className="text-sm italic text-emerald-800 dark:text-emerald-400">{activeHerb.scientificName}</div>
                    <h3 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-100">{activeHerb.name}</h3>
                  </div>

                  <ul className="space-y-1.5">
                    {activeHerb.uses.map((u) => (
                      <li key={u} className="text-lg font-medium text-stone-800 dark:text-stone-200 flex items-start gap-2.5">
                        <span className="mt-2.5 w-2.5 h-2.5 rounded-full bg-emerald-700 shrink-0" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-base text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
                    {activeHerb.explanation}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                    Cara Penyediaan
                  </span>
                  <div className="flex gap-2">
                    {(
                      [
                        { id: 'lesung', label: 'Lesung Batu', Icon: Hammer },
                        { id: 'rebusan', label: 'Direbus', Icon: Flame },
                        { id: 'kapsul', label: 'Pil / Kapsul', Icon: Pill },
                      ] as const
                    ).map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onPatch({ herbPrep: id })}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                          interactions.herbPrep === id
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl px-5 py-3.5 text-base font-medium text-stone-800 dark:text-stone-200">
                  {activeHerb.prepNotes[interactions.herbPrep]}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
