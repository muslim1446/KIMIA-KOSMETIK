import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, Flame, Hammer, Leaf, Pill } from 'lucide-react';
import { TRADITIONAL_HERBS, TraditionalHerb } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { APPLE_SPRINGS } from '../../utils/applePhysics';

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
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="h-full w-full flex flex-col gap-4 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-4 apple-hairline-b pb-3">
        <div>
          <div className="text-[15px] font-bold text-[var(--apple-green-fg)] tabular-nums-clean">
            5.4.1 · Ubat Tradisional (Rajah 5.13 &amp; Gambar foto 5.9 · m.s. 181)
          </div>
          <h2 className="font-display text-[30px] font-bold text-[var(--apple-label)] mt-0.5 leading-tight">
            Ubat Tradisional: Daripada Tumbuh-tumbuhan Herba atau Haiwan
          </h2>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div className="col-span-4 flex flex-col justify-between gap-2.5">
          {TRADITIONAL_HERBS.map((herb) => {
            const selected = herb.id === activeHerb.id && !interactions.ketumOpen;
            return (
              <button
                key={herb.id}
                type="button"
                aria-selected={selected}
                onClick={() => onPatch({ herbId: herb.id, ketumOpen: false })}
                className={`apple-pressable apple-tap-target w-full text-left rounded-[18px] px-4 py-3 cursor-pointer ${
                  selected
                    ? 'apple-slide-card border-[var(--apple-green-fg)] bg-emerald-50/90 dark:bg-emerald-950/45'
                    : 'apple-slide-card hover:bg-[var(--apple-fill)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[20px] font-bold text-[var(--apple-label)]">{herb.name}</span>
                  <Leaf className="w-5 h-5 shrink-0" style={{ color: herb.accentColor }} />
                </div>
                <div className="text-[15px] italic text-[var(--apple-secondary-label)] mt-0.5">{herb.scientificName}</div>
              </button>
            );
          })}

          <button
            type="button"
            aria-selected={interactions.ketumOpen}
            onClick={() => onPatch({ ketumOpen: !interactions.ketumOpen })}
            className={`apple-pressable apple-tap-target w-full text-left rounded-[18px] border px-4 py-3 cursor-pointer ${
              interactions.ketumOpen
                ? 'border-[var(--apple-red-fg)] bg-red-50 dark:bg-red-950/45'
                : 'border-amber-400/80 dark:border-amber-600/50 bg-amber-50/90 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-950/45'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[17px] font-bold text-[var(--apple-red-fg)]">Cabaran Minda: Daun Ketum</span>
              <AlertTriangle className="w-5 h-5 text-[var(--apple-red-fg)] shrink-0" />
            </div>
            <div className="text-[15px] text-[var(--apple-secondary-label)] mt-0.5 tabular-nums-clean">
              Gambar foto 5.9 · Mengapa diharamkan?
            </div>
          </button>
        </div>

        <div className="col-span-8">
          {interactions.ketumOpen ? (
            <motion.div
              data-storage-scope="slide:1/ketum"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0.14 } : APPLE_SPRINGS.snappy}
              className="apple-slide-card h-full border-red-300/70 dark:border-red-800/70 rounded-[24px] p-6 flex flex-col justify-between"
            >
              <div>
                <div className="text-[15px] font-bold text-[var(--apple-red-fg)] tabular-nums-clean">
                  Cabaran Minda · Gambar foto 5.9 Daun ketum (m.s. 181)
                </div>
                <h3 className="font-display text-[30px] font-bold text-[var(--apple-label)] mt-1">
                  Daun Ketum
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="apple-slide-inset rounded-[16px] p-5">
                    <div className="text-[15px] font-bold text-[var(--apple-secondary-label)]">Kegunaan Tradisional</div>
                    <p className="text-[17px] text-[var(--apple-label)] mt-2 leading-relaxed">
                      Digunakan secara tradisional untuk melegakan sakit belakang dan pemulih tenaga.
                    </p>
                  </div>
                  <div className="rounded-[16px] p-5 bg-red-50/85 dark:bg-red-950/35 border border-red-200 dark:border-red-900/60">
                    <div className="text-[15px] font-bold text-[var(--apple-red-fg)]">Sebab Diharamkan</div>
                    <p className="text-[17px] text-[var(--apple-label)] mt-2 leading-relaxed">
                      Penjualan produk yang diproses daripada daun ketum diharamkan di sisi undang-undang kerana mengandungi bahan yang menyebabkan <strong>ketagihan dan penyalahgunaan</strong>.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 apple-hairline-t flex items-center justify-between gap-4">
                <span className="text-[16px] font-semibold text-[var(--apple-secondary-label)]">
                  Ubat tradisional tidak diproses secara kimia, tetapi masih boleh memudaratkan jika disalahgunakan.
                </span>
                <button
                  type="button"
                  onClick={() => onPatch({ ketumOpen: false })}
                  className="apple-pressable apple-tap-target px-5 py-2.5 rounded-[13px] bg-[var(--apple-label)] text-[var(--apple-bg-base)] text-[15px] font-bold cursor-pointer shrink-0"
                >
                  Kembali ke Senarai Herba
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeHerb.id}
              data-storage-scope={`slide:1/herb:${activeHerb.id}`}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 8 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0.14 } : APPLE_SPRINGS.snappy}
              className="apple-slide-card h-full rounded-[24px] p-6 flex flex-col justify-between"
            >
              <div className="grid grid-cols-12 gap-5 items-center">
                <div className="col-span-4 apple-slide-inset rounded-[18px] p-4">
                  <HerbIllustration herb={activeHerb} />
                  <div className="text-center text-[15px] font-bold text-[var(--apple-label)] mt-1">
                    Bahagian: {activeHerb.partUsed}
                  </div>
                </div>

                <div className="col-span-8 space-y-2.5">
                  <div>
                    <div className="text-[15px] italic text-[var(--apple-green-fg)]">{activeHerb.scientificName}</div>
                    <h3 className="font-display text-[28px] font-bold text-[var(--apple-label)] leading-tight">{activeHerb.name}</h3>
                  </div>

                  <ul className="space-y-1">
                    {activeHerb.uses.map((u) => (
                      <li key={u} className="text-[17px] font-semibold text-[var(--apple-label)] flex items-start gap-2.5">
                        <span className="mt-2.5 w-2.5 h-2.5 rounded-full bg-[var(--apple-green-fg)] shrink-0" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="apple-slide-inset rounded-[14px] px-4 py-2.5 text-[16px] text-[var(--apple-label)] leading-snug">
                    {activeHerb.explanation}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 apple-hairline-t">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[16px] font-bold text-[var(--apple-secondary-label)]">
                    Cara Penyediaan Ubat Tradisional:
                  </span>
                  <div className="flex gap-1.5 p-1 rounded-[14px] apple-slide-inset">
                    {(
                      [
                        { id: 'lesung', label: 'Lesung', Icon: Hammer },
                        { id: 'rebusan', label: 'Direbus', Icon: Flame },
                        { id: 'kapsul', label: 'Pil / Kapsul', Icon: Pill },
                      ] as const
                    ).map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        aria-selected={interactions.herbPrep === id}
                        onClick={() => onPatch({ herbPrep: id })}
                        className={`apple-pressable apple-tap-target flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] text-[15px] font-bold cursor-pointer ${
                          interactions.herbPrep === id
                            ? 'bg-[var(--apple-label)] text-[var(--apple-bg-base)] shadow-sm'
                            : 'text-[var(--apple-secondary-label)] hover:bg-[var(--apple-fill)]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  data-storage-scope={`slide:1/herb:${activeHerb.id}/prep:${interactions.herbPrep}`}
                  className="bg-emerald-50/75 dark:bg-emerald-950/30 border border-emerald-300/70 dark:border-emerald-800/60 rounded-[16px] px-5 py-3 text-[16px] font-medium text-[var(--apple-label)] leading-snug"
                >
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
