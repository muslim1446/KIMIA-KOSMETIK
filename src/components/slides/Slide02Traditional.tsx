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
      <svg viewBox="0 0 180 115" className="w-full h-32" aria-hidden="true">
        <path
          d="M35,74 C30,56 48,44 64,52 C74,38 96,38 104,54 C122,44 142,54 138,72 C135,88 110,90 94,84 C78,92 42,92 35,74 Z"
          fill="#FEF3C7"
          stroke="#B45309"
          strokeWidth="3"
        />
        <path d="M72,46 C70,28 76,18 86,12" stroke="#15803D" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M98,44 C102,28 114,20 126,18" stroke="#15803D" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (herb.id === 'lidah_buaya') {
    return (
      <svg viewBox="0 0 180 115" className="w-full h-32" aria-hidden="true">
        <path d="M90,100 L62,32 C68,26 78,40 90,78 Z" fill="#D1FAE5" stroke="#15803D" strokeWidth="2.5" />
        <path d="M90,100 L118,32 C112,26 102,40 90,78 Z" fill="#D1FAE5" stroke="#15803D" strokeWidth="2.5" />
        <path d="M90,100 L90,14 C82,34 82,72 90,100 Z" fill="#A7F3D0" stroke="#15803D" strokeWidth="3" />
        <path d="M90,100 L90,14 C98,34 98,72 90,100 Z" fill="#6EE7B7" stroke="#15803D" strokeWidth="3" />
      </svg>
    );
  }
  if (herb.id === 'ginseng') {
    return (
      <svg viewBox="0 0 180 115" className="w-full h-32" aria-hidden="true">
        <path d="M90,30 C82,42 82,62 90,70 C98,62 98,42 90,30 Z" fill="#FDE68A" stroke="#92400E" strokeWidth="3" />
        <path d="M86,66 L68,100 M94,66 L112,100 M80,78 L58,88 M100,78 L122,88" stroke="#92400E" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M90,30 L90,14 M90,18 L76,10 M90,18 L104,10" stroke="#15803D" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 180 115" className="w-full h-32" aria-hidden="true">
      <path
        d="M44,64 C46,40 70,34 84,48 C98,32 124,38 136,60 C138,78 114,86 96,74 C80,88 48,84 44,64 Z"
        fill="#FED7AA"
        stroke="#7C2D12"
        strokeWidth="3"
      />
      <circle cx="66" cy="62" r="7" fill="#7C2D12" opacity="0.25" />
      <circle cx="92" cy="58" r="7" fill="#7C2D12" opacity="0.25" />
      <circle cx="116" cy="62" r="7" fill="#7C2D12" opacity="0.25" />
    </svg>
  );
}

export const Slide02Traditional: React.FC<Slide02Props> = ({ interactions, onPatch }) => {
  const activeHerb = TRADITIONAL_HERBS.find((h) => h.id === interactions.herbId) ?? TRADITIONAL_HERBS[0];

  return (
    <div className="h-full w-full flex flex-col gap-4 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <div className="text-[15px] font-bold text-emerald-800 dark:text-emerald-400">
            5.4.1 · Ubat Tradisional (Rajah 5.13 &amp; Gambar foto 5.9)
          </div>
          <h2 className="font-display text-[30px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Tumbuhan Membekalkan Molekul Aktif Semula Jadi — Tetapi Dosnya Tidak Sekata
          </h2>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div className="col-span-4 flex flex-col justify-between gap-2">
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
                  <span className="font-display text-[20px] font-bold text-stone-900 dark:text-stone-100">{herb.name}</span>
                  <Leaf className="w-5 h-5 shrink-0" style={{ color: herb.accentColor }} />
                </div>
                <div className="text-[15px] italic text-stone-600 dark:text-stone-400 mt-0.5">{herb.scientificName}</div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPatch({ ketumOpen: !interactions.ketumOpen })}
            className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors cursor-pointer ${
              interactions.ketumOpen
                ? 'border-red-600 bg-red-50 dark:bg-red-950/50'
                : 'border-amber-400 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[17px] font-bold text-red-800 dark:text-red-300">Cabaran Minda: Daun Ketum</span>
              <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
            </div>
            <div className="text-[15px] text-stone-700 dark:text-stone-300 mt-0.5">
              Mengapa herba semula jadi ini diharamkan?
            </div>
          </button>
        </div>

        <div className="col-span-8">
          {interactions.ketumOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full border border-red-200 dark:border-red-800 bg-white dark:bg-stone-900 rounded-3xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="text-[15px] font-bold text-red-700 dark:text-red-400">
                  Cabaran Minda · Semula Jadi Tidak Bermaksud Sentiasa Selamat
                </div>
                <h3 className="font-display text-[30px] font-bold text-stone-900 dark:text-stone-100 mt-1">
                  Daun Ketum (<span className="italic">Mitragyna speciosa</span>)
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="rounded-2xl p-5 bg-[#FBF9F5] dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                    <div className="text-[15px] font-bold text-stone-500">Kegunaan Tradisional</div>
                    <p className="text-[17px] text-stone-800 dark:text-stone-200 mt-2 leading-relaxed">
                      Digunakan secara tradisi untuk melegakan sakit belakang dan sebagai pemulih tenaga.
                    </p>
                  </div>
                  <div className="rounded-2xl p-5 bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                    <div className="text-[15px] font-bold text-red-800 dark:text-red-300">Punca Kimia Diharamkan</div>
                    <p className="text-[17px] text-stone-900 dark:text-stone-100 mt-2 leading-relaxed">
                      Mengandungi molekul psikoaktif (mitraginina) yang melekat pada reseptor otak dan mencetuskan <strong>ketagihan</strong> — sebab itu produknya diharamkan di sisi undang-undang.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
                <span className="text-[16px] font-semibold text-stone-700 dark:text-stone-300">
                  Prinsip Kimia: Molekul menentukan kesan — sama ada daripada pokok atau makmal.
                </span>
                <button
                  type="button"
                  onClick={() => onPatch({ ketumOpen: false })}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-[15px] font-bold cursor-pointer shrink-0"
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
              className="h-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-3xl p-6 flex flex-col justify-between"
            >
              <div className="grid grid-cols-12 gap-5 items-center">
                <div className="col-span-4 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-4">
                  <HerbIllustration herb={activeHerb} />
                  <div className="text-center text-[15px] font-bold text-stone-800 dark:text-stone-200 mt-1">
                    {activeHerb.partUsed}
                  </div>
                </div>

                <div className="col-span-8 space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <div className="text-[15px] italic text-emerald-800 dark:text-emerald-400">{activeHerb.scientificName}</div>
                      <h3 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-100 leading-tight">{activeHerb.name}</h3>
                    </div>
                    <span className="text-[15px] font-bold text-amber-800 dark:text-amber-300 text-right">
                      {activeHerb.activeMolecule}
                    </span>
                  </div>

                  <ul className="space-y-1">
                    {activeHerb.uses.map((u) => (
                      <li key={u} className="text-[17px] font-semibold text-stone-900 dark:text-stone-100 flex items-start gap-2.5">
                        <span className="mt-2.5 w-2.5 h-2.5 rounded-full bg-emerald-700 shrink-0" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="rounded-xl bg-[#FBF9F5] dark:bg-stone-950 px-4 py-2.5 text-[16px] text-stone-800 dark:text-stone-200 leading-snug">
                    <strong>Bagaimana ia bertindak:</strong> {activeHerb.molecularMechanism}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[16px] font-bold text-stone-700 dark:text-stone-300">
                    Cara Membebaskan Bahan Aktif (Penyediaan):
                  </span>
                  <div className="flex gap-2">
                    {(
                      [
                        { id: 'lesung', label: 'Lesung Batu', Icon: Hammer },
                        { id: 'rebusan', label: 'Direbus', Icon: Flame },
                        { id: 'kapsul', label: 'Pil / Kapsul', Icon: Pill },
                      ] as const
                    ).map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onPatch({ herbPrep: id })}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[15px] font-bold transition-colors cursor-pointer ${
                          interactions.herbPrep === id
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl px-5 py-3 text-[16px] font-medium text-stone-900 dark:text-stone-100 leading-snug">
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
