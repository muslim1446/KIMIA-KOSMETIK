import React from 'react';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide09Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

export const Slide09Quiz: React.FC<Slide09Props> = ({ interactions, onPatch }) => {
  const question = QUIZ_QUESTIONS[interactions.quizIndex] ?? QUIZ_QUESTIONS[0];
  const chosenOption = question.options.find((o) => o.id === interactions.quizSelectedOption);
  const isCorrect = chosenOption?.id === question.correctOptionId;

  return (
    <div className="h-full w-full flex flex-col gap-5 px-10 py-8 select-none">
      {/* Header */}
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3.5">
        <div>
          <div className="text-sm font-semibold text-blue-800 dark:text-blue-400">
            5.4.5 · Uji Diri & Perbincangan Kelas
          </div>
          <h2 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Soalan Situasi & Rumusan
          </h2>
        </div>

        <div className="flex gap-2">
          {QUIZ_QUESTIONS.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => onPatch({ quizIndex: idx, quizSelectedOption: null })}
              className={`px-4 py-2 rounded-xl border text-sm font-bold cursor-pointer ${
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

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
        {/* Left: Scenario */}
        <div className="col-span-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-400">
              <HelpCircle className="w-5 h-5" />
              <span>
                Soalan {interactions.quizIndex + 1} daripada {QUIZ_QUESTIONS.length}
              </span>
            </div>
            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-4 text-base text-stone-800 dark:text-stone-200 leading-relaxed">
              {question.scenario}
            </div>
            <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {question.question}
            </h3>
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-sm text-stone-500">
            Rujukan: {question.kssmRef}
          </div>
        </div>

        {/* Right: Options & Explanation */}
        <div className="col-span-7 flex flex-col justify-between gap-3">
          <div className="space-y-3">
            {question.options.map((opt) => {
              const selected = interactions.quizSelectedOption === opt.id;
              const optionIsRight = opt.id === question.correctOptionId;
              let borderClass =
                'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50';
              if (selected) {
                borderClass = optionIsRight
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
                  : 'border-red-600 bg-red-50 dark:bg-red-950/50';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onPatch({ quizSelectedOption: opt.id })}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors cursor-pointer flex items-start gap-3 ${borderClass}`}
                >
                  <span className="text-sm font-bold uppercase px-2.5 py-0.5 rounded-lg border border-stone-300 bg-[#FBF9F5] text-stone-800 shrink-0 mt-0.5">
                    {opt.id}
                  </span>
                  <span className="text-base font-semibold text-stone-900 dark:text-stone-100 leading-snug">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div
            className={`rounded-2xl border p-4 min-h-[112px] flex items-start gap-3 ${
              !chosenOption
                ? 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300'
                : isCorrect
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                : 'border-red-300 bg-red-50 text-red-950'
            }`}
          >
            {!chosenOption ? (
              <div className="text-base leading-relaxed">
                Klik satu pilihan jawapan di atas untuk melihat penerangan lanjut.
              </div>
            ) : (
              <>
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-base font-bold">{isCorrect ? 'Jawapan Tepat' : 'Semak Semula'}</div>
                  <p className="text-sm mt-1 leading-relaxed">{chosenOption.explanation}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
