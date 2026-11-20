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
  actionZone: 'atas_kulit' | 'lapisan_epidermis' | 'udara';
}

const COSMETIC_ITEMS: CosmeticProductItem[] = [
  {
    id: 'bedak',
    name: 'Bedak',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Menyerap minyak berlebihan dan menyekatakan warna permukaan wajah.',
    chemicalNote: 'Serbuk mineral halus + pigmen pepejal tidak larut duduk di atas permukaan kulit.',
    actionZone: 'atas_kulit',
  },
  {
    id: 'gincu',
    name: 'Gincu',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Memberikan warna pada bibir dan melindunginya daripada kekeringan.',
    chemicalNote: 'Lilin + minyak + pigmen warna (Ferum(III) oksida) menyaluti permukaan bibir.',
    actionZone: 'atas_kulit',
  },
  {
    id: 'maskara',
    name: 'Pensel Alis, Celak & Maskara',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Membentuk alis, menebalkan bulu mata dan menyerlahkan garisan mata.',
    chemicalNote: 'Pemekat dan pigmen warna melekat di luar bulu mata dan garisan kulit.',
    actionZone: 'atas_kulit',
  },
  {
    id: 'pemerah_pipi',
    name: 'Pemerah Pipi & Pembayang Mata',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Menambahkan warna untuk mencantikkan wajah secara luaran.',
    chemicalNote: 'Zarahan pigmen mineral memantulkan warna tertentu di lapisan atas kulit.',
    actionZone: 'atas_kulit',
  },
  {
    id: 'krim_pelembap',
    name: 'Krim & Pelembap Kulit',
    category: 'perawatan',
    categoryLabel: 'Kosmetik Perawatan',
    purpose: 'Merawat kekeringan kulit dengan mengekalkan kelembapan.',
    chemicalNote: 'Emulsi minyak + air bersama pelembap (gliserin) mengikat air di lapisan luar kulit.',
    actionZone: 'lapisan_epidermis',
  },
  {
    id: 'masker',
    name: 'Masker Muka',
    category: 'perawatan',
    categoryLabel: 'Kosmetik Perawatan',
    purpose: 'Membersih dan menyegarkan permukaan kulit wajah.',
    chemicalNote: 'Pelarut air, pemekat dan pelembap melembutkan lapisan luar kulit.',
    actionZone: 'lapisan_epidermis',
  },
  {
    id: 'deodoran',
    name: 'Deodoran',
    category: 'pewangi',
    categoryLabel: 'Pewangi',
    purpose: 'Mengurangkan bau badan dan memberikan kesegaran luaran.',
    chemicalNote: 'Mengandungi pewangi (minyak pati mudah meruap) untuk mengatasi bau.',
    actionZone: 'udara',
  },
  {
    id: 'minyak_wangi',
    name: 'Minyak Wangi',
    category: 'pewangi',
    categoryLabel: 'Pewangi',
    purpose: 'Memberikan haruman yang menyenangkan.',
    chemicalNote: 'Molekul aromatik kecil mudah meruap menjadi gas di udara lalu dikesan oleh hidung.',
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
    <div className="h-full w-full flex flex-col gap-4 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <div className="text-[15px] font-bold text-emerald-800 dark:text-emerald-400">
            5.4.4 · Pengelasan Bahan Kosmetik (Rajah 5.16)
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Kosmetik Kegunaan Luaran: Pigmen Padat, Emulsi Lembap atau Molekul Meruap
          </h2>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 content-start">
        <div className="col-span-12 grid grid-cols-4 gap-3">
          {(
            [
              { id: 'all', title: 'Semua Contoh', desc: '8 produk harian KSSM', Icon: Sparkles },
              { id: 'rias', title: 'Kosmetik Rias', desc: 'Pigmen atas kulit (warna)', Icon: Palette },
              { id: 'perawatan', title: 'Kosmetik Perawatan', desc: 'Emulsi kunci air kulit', Icon: Droplets },
              { id: 'pewangi', title: 'Pewangi', desc: 'Molekul kecil meruap ke udara', Icon: Wind },
            ] as const
          ).map(({ id, title, desc, Icon }) => {
            const active = interactions.cosmeticSortCategory === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPatch({ cosmeticSortCategory: id })}
                className={`text-left rounded-2xl border p-3.5 transition-colors cursor-pointer ${
                  active
                    ? 'border-stone-900 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[17px] font-bold">{title}</span>
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-amber-300 dark:text-amber-700' : 'text-emerald-700'}`} />
                </div>
                <div className={`text-[14px] mt-1 font-medium ${active ? 'text-stone-300 dark:text-stone-700' : 'text-stone-600 dark:text-stone-400'}`}>
                  {desc}
                </div>
              </button>
            );
          })}
        </div>

        <div className="col-span-7 grid grid-cols-2 gap-3 content-start">
          {filteredItems.map((item) => {
            const selected = item.id === selectedItem.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPatch({ selectedCosmeticItemId: item.id })}
                className={`text-left rounded-2xl border px-4 py-3.5 transition-colors cursor-pointer ${
                  selected
                    ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:border-emerald-500'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="font-display text-[18px] font-bold text-stone-900 dark:text-stone-100">{item.name}</div>
                <div className="text-[14px] font-semibold text-emerald-800 dark:text-emerald-400 mt-0.5">
                  {item.categoryLabel}
                </div>
              </button>
            );
          })}
        </div>

        <div className="col-span-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <div className="text-[14px] font-bold text-emerald-800 dark:text-emerald-400">{selectedItem.categoryLabel}</div>
              <h3 className="font-display text-[26px] font-bold text-stone-900 dark:text-stone-100 mt-0.5 leading-tight">
                {selectedItem.name}
              </h3>
            </div>

            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-3">
              <svg viewBox="0 0 280 95" className="w-full h-24" aria-label="Lokasi tindakan kosmetik pada kulit dan udara">
                <rect
                  x="10"
                  y="6"
                  width="260"
                  height="26"
                  rx="6"
                  fill={selectedItem.actionZone === 'udara' ? '#DCFCE7' : '#F5F5F4'}
                  stroke={selectedItem.actionZone === 'udara' ? '#15803D' : '#D6D3D1'}
                  strokeWidth="1.8"
                />
                <text x="140" y="23" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1C1917">
                  Udara Sekitar (Molekul Meruap)
                </text>

                <rect
                  x="10"
                  y="36"
                  width="260"
                  height="25"
                  rx="6"
                  fill={selectedItem.actionZone === 'atas_kulit' ? '#FDE68A' : '#FEF3C7'}
                  stroke={selectedItem.actionZone === 'atas_kulit' ? '#B45309' : '#E5E7EB'}
                  strokeWidth="1.8"
                />
                <text x="140" y="53" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#78350F">
                  Atas Permukaan Kulit (Pigmen &amp; Lilin)
                </text>

                <rect
                  x="10"
                  y="65"
                  width="260"
                  height="25"
                  rx="6"
                  fill={selectedItem.actionZone === 'lapisan_epidermis' ? '#DBEAFE' : '#EFF6FF'}
                  stroke={selectedItem.actionZone === 'lapisan_epidermis' ? '#1E3A8A' : '#E5E7EB'}
                  strokeWidth="1.8"
                />
                <text x="140" y="82" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1E3A8A">
                  Lapisan Luar Kulit (Mengunci Kelembapan)
                </text>
              </svg>
            </div>

            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3.5">
              <div className="text-[14px] font-bold text-stone-500">Tujuan Penggunaan</div>
              <p className="text-[16px] text-stone-900 dark:text-stone-100 mt-0.5 leading-snug">{selectedItem.purpose}</p>
            </div>

            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl p-3.5">
              <div className="text-[14px] font-bold text-emerald-900 dark:text-emerald-300">Kandungan &amp; Cara Tindakan</div>
              <p className="text-[15px] text-stone-900 dark:text-stone-100 mt-0.5 leading-snug">{selectedItem.chemicalNote}</p>
            </div>
          </div>

          <div className="mt-2 pt-2.5 border-t border-stone-200 dark:border-stone-800 text-[14px] text-stone-700 dark:text-stone-300 leading-snug">
            Dikawal di bawah <strong>Peraturan-peraturan Kawalan Dadah dan Kosmetik 1984</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
