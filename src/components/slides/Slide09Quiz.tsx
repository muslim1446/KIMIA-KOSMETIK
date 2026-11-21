import React from 'react';
import { ArrowRight, Eye, HelpCircle, Lightbulb } from 'lucide-react';
import { DAILY_MYSTERIES } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide09Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

export const Slide09Quiz: React.FC<Slide09Props> = ({ interactions, onPatch }) => {
  const mystery = DAILY_MYSTERIES[interactions.quizIndex] ?? DAILY_MYSTERIES[0];
  const pickedHypothesis = mystery.hypotheses.find((h) => h.id === interactions.quizSelectedOption);

  return (
    <div className="h-full w-full flex flex-col gap-4 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
            5.4.1–5.4.4 · Uji Diri 5.4 (m.s. 186)
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Uji Diri 5.4 &amp; Rumusan Topik Ubat-ubatan dan Bahan Kosmetik
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {DAILY_MYSTERIES.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onPatch({ quizIndex: idx, quizSelectedOption: null, explanationRevealed: false })}
              className={`px-3.5 py-2 rounded-xl border text-[15px] font-bold cursor-pointer ${
                idx === interactions.quizIndex
                  ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50'
              }`}
            >
              Soalan {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div
          data-storage-scope={`slide:8/quiz:${interactions.quizIndex}`}
          className="col-span-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[15px] font-bold text-blue-900 dark:text-blue-400">
              <HelpCircle className="w-5 h-5" />
              <span>{mystery.kssmRef}</span>
            </div>
            <h3 className="font-display text-[21px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {mystery.title}
            </h3>
            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-4 text-[16px] text-stone-800 dark:text-stone-200 leading-relaxed">
              {mystery.dailySituation}
            </div>
            <p className="text-[16px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {mystery.questionWhy}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-1.5">
            <div className="text-[14px] font-bold text-emerald-800 dark:text-emerald-400">
              Rumusan Standard Pembelajaran 5.4:
            </div>
            <div className="text-[14px] text-stone-700 dark:text-stone-300 leading-snug">
              1. <strong>Jenis &amp; Fungsi Ubat (5.4.1)</strong> · 2. <strong>Penggunaan Selamat (5.4.2)</strong> · 3.{' '}
              <strong>Bahan &amp; Keselamatan Kosmetik (5.4.3–5.4.4)</strong>
            </div>
          </div>
        </div>

        <div className="col-span-7 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="text-[15px] font-bold text-stone-700 dark:text-stone-300">
              Pilih Jawapan:
            </div>
            {mystery.hypotheses.map((hyp, i) => {
              const selected = interactions.quizSelectedOption === hyp.id;
              return (
                <button
                  key={hyp.id}
                  type="button"
                  onClick={() => onPatch({ quizSelectedOption: hyp.id })}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors cursor-pointer ${
                    selected
                      ? 'border-blue-800 bg-blue-50/80 dark:bg-blue-950/50'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-[14px] font-bold px-2.5 py-0.5 rounded-lg border border-stone-300 bg-[#FBF9F5] text-stone-800 shrink-0">
                      Pilihan {i + 1}
                    </span>
                    <span className="text-[15px] font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                      {hyp.label}
                    </span>
                  </div>
                  {selected && (
                    <p
                      data-storage-scope={`slide:8/quiz:${interactions.quizIndex}/hyp:${hyp.id}`}
                      className="mt-1.5 pl-20 text-[14px] font-medium text-blue-950 dark:text-blue-200 leading-snug"
                    >
                      {hyp.discussionNote}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[15px] font-bold text-emerald-900 dark:text-emerald-400">
                <Lightbulb className="w-5 h-5" />
                <span>Jawapan &amp; Penerangan Buku Teks</span>
              </div>

              <button
                type="button"
                onClick={() => onPatch({ explanationRevealed: !interactions.explanationRevealed })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-[14px] font-bold cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{interactions.explanationRevealed ? 'Tutup Jawapan' : 'Dedah Jawapan'}</span>
              </button>
            </div>

            {interactions.explanationRevealed ? (
              <div
                data-storage-scope={`slide:8/quiz:${interactions.quizIndex}/revealed`}
                className="grid grid-cols-3 gap-2.5"
              >
                <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3">
                  <div className="text-[13px] font-bold text-blue-900 dark:text-blue-400 flex items-center gap-1">
                    <span>1. Fakta Buku Teks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[14px] text-stone-800 dark:text-stone-200 mt-1 leading-snug">
                    {mystery.causalChain.step1Fact}
                  </p>
                </div>
                <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3">
                  <div className="text-[13px] font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                    <span>2. Huraian &amp; Contoh</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[14px] text-stone-800 dark:text-stone-200 mt-1 leading-snug">
                    {mystery.causalChain.step2Reason}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3">
                  <div className="text-[13px] font-bold text-emerald-900 dark:text-emerald-300">
                    3. Prinsip Utama
                  </div>
                  <p className="text-[14px] font-bold text-emerald-950 dark:text-emerald-100 mt-1 leading-snug">
                    {mystery.causalChain.step3Principle}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[15px] text-stone-600 dark:text-stone-400 leading-snug">
                {pickedHypothesis
                  ? 'Bincangkan pilihan di atas bersama kelas, kemudian klik "Dedah Jawapan" untuk menyemak jawapan buku teks.'
                  : 'Minta rakan sekelas memilih jawapan dahulu sebelum mendedahkan penerangan buku teks.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
