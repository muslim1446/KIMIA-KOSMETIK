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
      <div className="shrink-0 flex items-end justify-between gap-3 apple-hairline-b pb-3">
        <div>
          <div className="text-[15px] font-bold text-[var(--apple-blue-fg)] tabular-nums-clean">
            5.4.1–5.4.4 · Uji Diri 5.4 (S1–S4) &amp; Latihan Modul (S5–S9)
          </div>
          <h2 className="font-display text-[26px] font-bold text-[var(--apple-label)] mt-0.5 leading-tight">
            Uji Diri, Latihan Modul PdPC &amp; Rumusan Topik
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0 p-1 rounded-[15px] apple-slide-inset">
          {DAILY_MYSTERIES.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              aria-selected={idx === interactions.quizIndex}
              onClick={() => onPatch({ quizIndex: idx, quizSelectedOption: null, explanationRevealed: false })}
              className={`apple-pressable apple-tap-target px-2.5 py-2 rounded-[11px] text-[14px] font-bold cursor-pointer tabular-nums-clean ${
                idx === interactions.quizIndex
                  ? 'bg-[var(--apple-label)] text-[var(--apple-bg-base)] shadow-sm'
                  : 'text-[var(--apple-secondary-label)] hover:bg-[var(--apple-fill)]'
              }`}
            >
              S{idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div
          data-storage-scope={`slide:8/quiz:${interactions.quizIndex}`}
          className="col-span-5 apple-slide-card rounded-[24px] p-5 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[15px] font-bold text-[var(--apple-blue-fg)] tabular-nums-clean">
              <HelpCircle className="w-5 h-5 shrink-0" />
              <span>{mystery.kssmRef}</span>
            </div>
            <h3 className="font-display text-[21px] font-bold text-[var(--apple-label)] leading-snug">
              {mystery.title}
            </h3>
            <div className="apple-slide-inset rounded-[16px] p-4 text-[16px] text-[var(--apple-label)] leading-relaxed">
              {mystery.dailySituation}
            </div>
            <p className="text-[16px] font-bold text-[var(--apple-label)] leading-snug">
              {mystery.questionWhy}
            </p>
          </div>

          <div className="pt-3 apple-hairline-t space-y-1.5">
            <div className="text-[14px] font-bold text-[var(--apple-green-fg)] tabular-nums-clean">
              Rumusan Bab 5.4 (m.s. 181–186):
            </div>
            <div className="text-[14px] text-[var(--apple-secondary-label)] leading-snug tabular-nums-clean">
              1. <strong className="text-[var(--apple-label)]">Ubat Tradisional &amp; Moden (5.4.1)</strong> · 2.{' '}
              <strong className="text-[var(--apple-label)]">Penggunaan Ubat, Plasebo &amp; Kawalan KKM (5.4.2)</strong> · 3.{' '}
              <strong className="text-[var(--apple-label)]">Kosmetik &amp; Bahan Terlarang Jadual 5.8 (5.4.3–5.4.4)</strong>
            </div>
          </div>
        </div>

        <div className="col-span-7 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="text-[15px] font-bold text-[var(--apple-secondary-label)]">
              Pilih Jawapan:
            </div>
            {mystery.hypotheses.map((hyp, i) => {
              const selected = interactions.quizSelectedOption === hyp.id;
              return (
                <button
                  key={hyp.id}
                  type="button"
                  aria-selected={selected}
                  onClick={() => onPatch({ quizSelectedOption: hyp.id })}
                  className={`apple-pressable apple-tap-target w-full text-left rounded-[18px] px-4 py-3 cursor-pointer ${
                    selected
                      ? 'apple-slide-card border-[var(--apple-blue)] bg-blue-50/85 dark:bg-blue-950/40'
                      : 'apple-slide-card hover:bg-[var(--apple-fill)]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-[14px] font-bold px-2.5 py-0.5 rounded-[8px] apple-slide-inset text-[var(--apple-label)] shrink-0 tabular-nums-clean">
                      Pilihan {i + 1}
                    </span>
                    <span className="text-[15px] font-semibold text-[var(--apple-label)] leading-snug">
                      {hyp.label}
                    </span>
                  </div>
                  {selected && (
                    <p
                      data-storage-scope={`slide:8/quiz:${interactions.quizIndex}/hyp:${hyp.id}`}
                      className="mt-2 ml-1 pl-3 border-l-2 border-[var(--apple-blue)] text-[14px] font-medium text-[var(--apple-blue-fg)] leading-snug"
                    >
                      {hyp.discussionNote}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="apple-slide-card rounded-[22px] p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[15px] font-bold text-[var(--apple-green-fg)]">
                <Lightbulb className="w-5 h-5 shrink-0" />
                <span>Jawapan &amp; Penerangan Buku Teks</span>
              </div>

              <button
                type="button"
                aria-expanded={interactions.explanationRevealed}
                onClick={() => onPatch({ explanationRevealed: !interactions.explanationRevealed })}
                className="apple-pressable apple-tap-target flex items-center gap-1.5 px-4 py-2 rounded-[13px] bg-[var(--apple-label)] hover:opacity-90 text-[var(--apple-bg-base)] text-[14px] font-bold cursor-pointer shadow-sm"
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span>{interactions.explanationRevealed ? 'Tutup Jawapan' : 'Dedah Jawapan'}</span>
              </button>
            </div>

            {interactions.explanationRevealed ? (
              <div
                data-storage-scope={`slide:8/quiz:${interactions.quizIndex}/revealed`}
                className="grid grid-cols-3 gap-2.5"
              >
                <div className="apple-slide-inset rounded-[14px] p-3">
                  <div className="text-[13px] font-bold text-[var(--apple-blue-fg)] flex items-center gap-1 tabular-nums-clean">
                    <span>1. Fakta Buku Teks</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  <p className="text-[14px] text-[var(--apple-label)] mt-1 leading-snug">
                    {mystery.causalChain.step1Fact}
                  </p>
                </div>
                <div className="apple-slide-inset rounded-[14px] p-3">
                  <div className="text-[13px] font-bold text-[var(--apple-orange-fg)] flex items-center gap-1 tabular-nums-clean">
                    <span>2. Huraian &amp; Contoh</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  <p className="text-[14px] text-[var(--apple-label)] mt-1 leading-snug">
                    {mystery.causalChain.step2Reason}
                  </p>
                </div>
                <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300/70 dark:border-emerald-800/60 rounded-[14px] p-3">
                  <div className="text-[13px] font-bold text-[var(--apple-green-fg)] tabular-nums-clean">
                    3. Prinsip Utama
                  </div>
                  <p className="text-[14px] font-bold text-emerald-950 dark:text-emerald-100 mt-1 leading-snug">
                    {mystery.causalChain.step3Principle}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[15px] text-[var(--apple-secondary-label)] leading-snug">
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
