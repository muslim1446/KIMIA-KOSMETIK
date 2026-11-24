import React from 'react';
import { Droplets, Palette, Sparkles, Wind } from 'lucide-react';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide06Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

interface CosmeticProductItem {
  id: string;
  name: string;
  category: 'rias' | 'perawatan' | 'pewangi';
  categoryLabel: string;
  purpose: string;
  textbookNote: string;
  actionZone: 'atas_kulit' | 'formulasi_perawatan' | 'udara';
}

const COSMETIC_ITEMS: CosmeticProductItem[] = [
  {
    id: 'bedak',
    name: 'Bedak',
    category: 'rias',
    categoryLabel: 'Kosmetik rias',
    purpose: 'Digunakan untuk mencantikkan wajah (Rajah 5.16).',
    textbookNote: 'Tergolong dalam kumpulan kosmetik rias bersama gincu, pensel alis, pemerah pipi, pembayang mata, celak dan maskara.',
    actionZone: 'atas_kulit',
  },
  {
    id: 'gincu',
    name: 'Gincu',
    category: 'rias',
    categoryLabel: 'Kosmetik rias',
    purpose: 'Digunakan untuk mencantikkan wajah (Rajah 5.16).',
    textbookNote: 'Menggunakan bahan asas kosmetik seperti pewarna dan pelembap untuk kegunaan luaran (Rajah 5.15).',
    actionZone: 'atas_kulit',
  },
  {
    id: 'maskara',
    name: 'Pensel alis, celak & maskara',
    category: 'rias',
    categoryLabel: 'Kosmetik rias',
    purpose: 'Digunakan untuk mencantikkan wajah (Rajah 5.16).',
    textbookNote: 'Dihasilkan daripada gabungan bahan asas kosmetik termasuk pewarna dan pemekat (Rajah 5.15).',
    actionZone: 'atas_kulit',
  },
  {
    id: 'pemerah_pipi',
    name: 'Pemerah pipi & pembayang mata',
    category: 'rias',
    categoryLabel: 'Kosmetik rias',
    purpose: 'Digunakan untuk mencantikkan wajah (Rajah 5.16).',
    textbookNote: 'Tertakluk kepada Peraturan-peraturan Kawalan Dadah dan Kosmetik 1984 (m.s. 185).',
    actionZone: 'atas_kulit',
  },
  {
    id: 'krim_pelembap',
    name: 'Krim & pelembap kulit',
    category: 'perawatan',
    categoryLabel: 'Kosmetik perawatan',
    purpose: 'Rawatan pada tubuh (Rajah 5.16).',
    textbookNote: 'Menggunakan pengemulsi (lesitin, asid stearik) bagi membentuk campuran homogen antara air dan minyak serta pelembap (Rajah 5.15).',
    actionZone: 'formulasi_perawatan',
  },
  {
    id: 'masker',
    name: 'Masker muka',
    category: 'perawatan',
    categoryLabel: 'Kosmetik perawatan',
    purpose: 'Rawatan pada tubuh (Rajah 5.16).',
    textbookNote: 'Gabungan air sebagai bahan pelarut bersama pemekat, pelembap serta pengawet untuk mengelakkan kerosakan kosmetik (Rajah 5.15).',
    actionZone: 'formulasi_perawatan',
  },
  {
    id: 'deodoran',
    name: 'Deodoran',
    category: 'pewangi',
    categoryLabel: 'Pewangi',
    purpose: 'Memberikan haruman (Rajah 5.16).',
    textbookNote: 'Dikelaskan dalam kumpulan pewangi bersama minyak wangi (Rajah 5.16, m.s. 185).',
    actionZone: 'udara',
  },
  {
    id: 'minyak_wangi',
    name: 'Minyak wangi',
    category: 'pewangi',
    categoryLabel: 'Pewangi',
    purpose: 'Memberikan haruman (Rajah 5.16).',
    textbookNote: 'Menggunakan pewangi seperti minyak pati untuk memberikan aroma yang menyenangkan kepada produk kosmetik (Rajah 5.15).',
    actionZone: 'udara',
  },
];

export const Slide06CosmeticTypes: React.FC<Slide06Props> = ({ interactions, onPatch }) => {
  const filteredItems =
    interactions.cosmeticSortCategory === 'all'
      ? COSMETIC_ITEMS
      : COSMETIC_ITEMS.filter((item) => item.category === interactions.cosmeticSortCategory);

  const selectedItem =
    COSMETIC_ITEMS.find((i) => i.id === interactions.selectedCosmeticItemId) ?? COSMETIC_ITEMS[1];

  return (
    <div className="h-full w-full flex flex-col gap-3.5 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-4 apple-hairline-b pb-2.5">
        <div>
          <div className="text-[15px] font-bold text-[var(--apple-green-fg)] tabular-nums-clean">
            5.4.3 · Bahan Kosmetik &amp; Jenis-jenis Kosmetik (Rajah 5.16 · m.s. 184–185)
          </div>
          <h2 className="font-display text-[28px] font-bold text-[var(--apple-label)] mt-0.5 leading-tight">
            Kosmetik: Kegunaan Luaran untuk Membersih, Melindungi atau Mencantikkan
          </h2>
        </div>
      </div>

      <div className="shrink-0 rounded-[18px] border border-amber-300/80 dark:border-amber-700/50 bg-amber-50/85 dark:bg-amber-950/30 px-4 py-2.5 text-[15px] text-[var(--apple-label)] leading-snug tabular-nums-clean">
        <strong>Definisi (m.s. 184):</strong> Kosmetik ialah bahan atau produk yang digunakan secara luaran untuk{' '}
        <strong>membersih, melindungi atau mencantikkan</strong> penampilan seseorang.
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 content-start">
        <div className="col-span-12 grid grid-cols-4 gap-3">
          {(
            [
              { id: 'all', title: 'Semua Contoh', desc: 'Rajah 5.16 (m.s. 185)', Icon: Sparkles },
              { id: 'rias', title: 'Kosmetik rias', desc: 'Mencantikkan wajah', Icon: Palette },
              { id: 'perawatan', title: 'Kosmetik perawatan', desc: 'Rawatan pada tubuh', Icon: Droplets },
              { id: 'pewangi', title: 'Pewangi', desc: 'Memberikan haruman', Icon: Wind },
            ] as const
          ).map(({ id, title, desc, Icon }) => {
            const active = interactions.cosmeticSortCategory === id;
            return (
              <button
                key={id}
                type="button"
                aria-selected={active}
                onClick={() => onPatch({ cosmeticSortCategory: id })}
                className={`apple-pressable apple-tap-target text-left rounded-[18px] border p-3.5 cursor-pointer ${
                  active
                    ? 'border-[var(--apple-label)] bg-[var(--apple-label)] text-[var(--apple-bg-base)] shadow-sm'
                    : 'apple-slide-card hover:bg-[var(--apple-fill)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[17px] font-bold">{title}</span>
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[var(--apple-orange-fg)]' : 'text-[var(--apple-green-fg)]'}`} />
                </div>
                <div className={`text-[14px] mt-1 font-medium tabular-nums-clean ${active ? 'opacity-80' : 'text-[var(--apple-secondary-label)]'}`}>
                  {desc}
                </div>
              </button>
            );
          })}
        </div>

        <div
          data-storage-scope={`slide:5/cat:${interactions.cosmeticSortCategory}`}
          className="col-span-7 grid grid-cols-2 gap-3 content-start"
        >
          {filteredItems.map((item) => {
            const selected = item.id === selectedItem.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-selected={selected}
                onClick={() => onPatch({ selectedCosmeticItemId: item.id })}
                className={`apple-pressable apple-tap-target text-left rounded-[18px] px-4 py-3 cursor-pointer ${
                  selected
                    ? 'apple-slide-card border-[var(--apple-green-fg)] bg-emerald-50/90 dark:bg-emerald-950/45'
                    : 'apple-slide-card hover:bg-[var(--apple-fill)]'
                }`}
              >
                <div className="font-display text-[18px] font-bold text-[var(--apple-label)]">{item.name}</div>
                <div className="text-[14px] font-semibold text-[var(--apple-green-fg)] mt-0.5">
                  {item.categoryLabel}
                </div>
              </button>
            );
          })}
        </div>

        <div
          data-storage-scope={`slide:5/item:${selectedItem.id}`}
          className="col-span-5 apple-slide-card rounded-[22px] p-5 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div>
              <div className="text-[14px] font-bold text-[var(--apple-green-fg)]">{selectedItem.categoryLabel}</div>
              <h3 className="font-display text-[25px] font-bold text-[var(--apple-label)] mt-0.5 leading-tight">
                {selectedItem.name}
              </h3>
            </div>

            <div className="apple-slide-inset rounded-[16px] p-3">
              <svg viewBox="0 0 280 95" className="w-full h-22" aria-label="Kumpulan kosmetik dan kegunaan luaran">
                <rect
                  x="10"
                  y="6"
                  width="260"
                  height="26"
                  rx="7"
                  fill={selectedItem.actionZone === 'udara' ? '#DCFCE7' : 'var(--slide-svg-neutral-fill)'}
                  stroke={selectedItem.actionZone === 'udara' ? '#1F7A36' : 'var(--slide-svg-ring)'}
                  strokeWidth="1.8"
                />
                <text
                  x="140"
                  y="23"
                  textAnchor="middle"
                  fontSize="12.5"
                  fontWeight="700"
                  fill={selectedItem.actionZone === 'udara' ? '#14532D' : 'var(--slide-svg-ink)'}
                >
                  Pewangi (Memberikan Haruman)
                </text>

                <rect
                  x="10"
                  y="36"
                  width="260"
                  height="25"
                  rx="7"
                  fill={selectedItem.actionZone === 'atas_kulit' ? '#FDE68A' : 'var(--slide-svg-neutral-fill)'}
                  stroke={selectedItem.actionZone === 'atas_kulit' ? '#B45309' : 'var(--slide-svg-ring)'}
                  strokeWidth="1.8"
                />
                <text
                  x="140"
                  y="53"
                  textAnchor="middle"
                  fontSize="12.5"
                  fontWeight="700"
                  fill={selectedItem.actionZone === 'atas_kulit' ? '#78350F' : 'var(--slide-svg-ink)'}
                >
                  Kosmetik Rias (Mencantikkan Wajah)
                </text>

                <rect
                  x="10"
                  y="65"
                  width="260"
                  height="25"
                  rx="7"
                  fill={selectedItem.actionZone === 'formulasi_perawatan' ? '#DBEAFE' : 'var(--slide-svg-neutral-fill)'}
                  stroke={selectedItem.actionZone === 'formulasi_perawatan' ? '#0066D6' : 'var(--slide-svg-ring)'}
                  strokeWidth="1.8"
                />
                <text
                  x="140"
                  y="82"
                  textAnchor="middle"
                  fontSize="12.5"
                  fontWeight="700"
                  fill={selectedItem.actionZone === 'formulasi_perawatan' ? '#1E3A8A' : 'var(--slide-svg-ink)'}
                >
                  Kosmetik Perawatan (Rawatan pada Tubuh)
                </text>
              </svg>
            </div>

            <div className="apple-slide-inset rounded-[14px] p-3.5">
              <div className="text-[14px] font-bold text-[var(--apple-secondary-label)]">Kegunaan</div>
              <p className="text-[16px] text-[var(--apple-label)] mt-0.5 leading-snug">{selectedItem.purpose}</p>
            </div>

            <div className="bg-emerald-50/75 dark:bg-emerald-950/30 border border-emerald-300/60 dark:border-emerald-800/50 rounded-[14px] p-3.5">
              <div className="text-[14px] font-bold text-[var(--apple-green-fg)]">Nota Buku Teks</div>
              <p className="text-[15px] text-[var(--apple-label)] mt-0.5 leading-snug">{selectedItem.textbookNote}</p>
            </div>
          </div>

          <div className="mt-2 pt-2.5 apple-hairline-t text-[14px] text-[var(--apple-secondary-label)] leading-snug tabular-nums-clean">
            Tertakluk kepada <strong className="text-[var(--apple-label)]">Peraturan-peraturan Kawalan Dadah dan Kosmetik 1984</strong> (m.s. 185).
          </div>
        </div>
      </div>
    </div>
  );
};
