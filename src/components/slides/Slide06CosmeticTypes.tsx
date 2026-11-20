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
  chemicalNote: string;
}

const COSMETIC_ITEMS: CosmeticProductItem[] = [
  {
    id: 'bedak',
    name: 'Bedak',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Menyerap minyak berlebihan dan menyekatakan warna permukaan wajah.',
    chemicalNote: 'Mengandungi serbuk mineral halus dan pigmen pewarna permukaan.',
  },
  {
    id: 'gincu',
    name: 'Gincu',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Memberikan warna pada bibir dan melindunginya daripada kekeringan.',
    chemicalNote: 'Gabungan lilin, minyak, pewarna (contoh: Ferum(III) oksida) dan pelembap.',
  },
  {
    id: 'maskara',
    name: 'Pensel Alis, Celak & Maskara',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Membentuk alis, menebalkan bulu mata serta menyerlahkan garisan mata.',
    chemicalNote: 'Menggunakan pemekat, pigmen warna dan pengawet terkawal di sekitar mata.',
  },
  {
    id: 'pemerah_pipi',
    name: 'Pemerah Pipi & Pembayang Mata',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Menambahkan warna untuk mencantikkan wajah secara luaran.',
    chemicalNote: 'Pigmen warna yang melekat pada lapisan luar kulit.',
  },
  {
    id: 'krim_pelembap',
    name: 'Krim & Pelembap Kulit',
    category: 'perawatan',
    categoryLabel: 'Kosmetik Perawatan',
    purpose: 'Merawat kekeringan kulit dengan mengekalkan kelembapan.',
    chemicalNote: 'Campuran minyak dan air bersama pelembap seperti gliserin atau natrium laktat.',
  },
  {
    id: 'masker',
    name: 'Masker Muka',
    category: 'perawatan',
    categoryLabel: 'Kosmetik Perawatan',
    purpose: 'Membersih dan menyegarkan permukaan kulit wajah.',
    chemicalNote: 'Menggunakan pelarut air, pemekat dan bahan pelembap.',
  },
  {
    id: 'deodoran',
    name: 'Deodoran',
    category: 'pewangi',
    categoryLabel: 'Pewangi',
    purpose: 'Mengurangkan bau badan dan memberikan kesegaran luaran.',
    chemicalNote: 'Mengandungi pewangi (minyak pati) dan bahan kawalan bau badan.',
  },
  {
    id: 'minyak_wangi',
    name: 'Minyak Wangi',
    category: 'pewangi',
    categoryLabel: 'Pewangi',
    purpose: 'Memberikan haruman yang menyenangkan.',
    chemicalNote: 'Campuran pewangi aromatik dan pelarut yang mudah meruap.',
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
    <div className="h-full w-full flex flex-col gap-5 px-10 py-8 select-none">
      {/* Header */}
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3.5">
        <div>
          <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
            5.4.4 · Bahan Kosmetik (Rajah 5.16)
          </div>
          <h2 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Tiga Pengelasan Utama Bahan Kosmetik
          </h2>
        </div>
        <div className="text-base text-stone-600 dark:text-stone-300 max-w-md text-right">
          Digunakan <strong>secara luaran</strong> untuk membersih, melindungi atau mencantikkan penampilan.
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5 content-start">
        {/* Category Filters */}
        <div className="col-span-12 grid grid-cols-4 gap-3">
          {(
            [
              { id: 'all', title: 'Semua Contoh', desc: '8 produk harian', Icon: Sparkles },
              { id: 'rias', title: 'Kosmetik Rias', desc: 'Mencantikkan wajah', Icon: Palette },
              { id: 'perawatan', title: 'Kosmetik Perawatan', desc: 'Rawatan penjagaan tubuh', Icon: Droplets },
              { id: 'pewangi', title: 'Pewangi', desc: 'Memberikan haruman', Icon: Wind },
            ] as const
          ).map(({ id, title, desc, Icon }) => {
            const active = interactions.cosmeticSortCategory === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPatch({ cosmeticSortCategory: id })}
                className={`text-left rounded-2xl border p-4 transition-colors cursor-pointer ${
                  active
                    ? 'border-stone-900 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-bold">{title}</span>
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-amber-300 dark:text-amber-700' : 'text-emerald-700'}`} />
                </div>
                <div className={`text-sm mt-1 ${active ? 'text-stone-300 dark:text-stone-600' : 'text-stone-500 dark:text-stone-400'}`}>
                  {desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Left Grid */}
        <div className="col-span-7 grid grid-cols-2 gap-3 content-start">
          {filteredItems.map((item) => {
            const selected = item.id === selectedItem.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPatch({ selectedCosmeticItemId: item.id })}
                className={`text-left rounded-2xl border p-4 transition-colors cursor-pointer ${
                  selected
                    ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:border-emerald-500'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">{item.name}</div>
                <div className="text-sm font-medium text-emerald-800 dark:text-emerald-400 mt-0.5">
                  {item.categoryLabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detail */}
        <div className="col-span-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">{selectedItem.categoryLabel}</div>
              <h3 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                {selectedItem.name}
              </h3>
            </div>

            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-4">
              <div className="text-sm font-bold text-stone-500">Tujuan Penggunaan</div>
              <p className="text-base text-stone-800 dark:text-stone-200 mt-1 leading-snug">{selectedItem.purpose}</p>
            </div>

            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-4">
              <div className="text-sm font-bold text-stone-500">Kandungan Asas</div>
              <p className="text-base text-stone-800 dark:text-stone-200 mt-1 leading-snug">{selectedItem.chemicalNote}</p>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-stone-200 dark:border-stone-800 text-sm text-stone-600 dark:text-stone-400 leading-snug">
            Dikawal di bawah <strong>Peraturan-peraturan Kawalan Dadah dan Kosmetik 1984</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
