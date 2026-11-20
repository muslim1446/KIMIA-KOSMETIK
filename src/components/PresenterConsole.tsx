import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  ExternalLink,
  EyeOff,
  MonitorCheck,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Tv2,
} from 'lucide-react';
import { SLIDES_META, TEAM_PRESENTERS } from '../data/slidesData';
import {
  DisplayEnvironmentInfo,
  LaserPoint,
  SharedSlideInteractions,
} from '../hooks/usePresentationSync';
import { formatTimerSeconds } from '../utils/presentationEngine';
import { SlideStageContent } from './SlideStageContent';

interface PresenterConsoleProps {
  slideIndex: number;
  blackout: boolean;
  projectorDark: boolean;
  laser: LaserPoint;
  interactions: SharedSlideInteractions;
  connectedPeers: number;
  displayInfo: DisplayEnvironmentInfo;
  onProbeDisplays: () => void;
  onGoToSlide: (idx: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleBlackout: () => void;
  onToggleProjectorDark: () => void;
  onSetLaser: (laser: LaserPoint) => void;
  onPatchInteractions: (partial: Partial<SharedSlideInteractions>) => void;
  onResetAll: () => void;
  onExitPresenterMode: () => void;
}

export const PresenterConsole: React.FC<PresenterConsoleProps> = ({
  slideIndex,
  blackout,
  projectorDark,
  laser,
  interactions,
  connectedPeers,
  displayInfo,
  onProbeDisplays,
  onGoToSlide,
  onNext,
  onPrev,
  onToggleBlackout,
  onToggleProjectorDark,
  onSetLaser,
  onPatchInteractions,
  onResetAll,
  onExitPresenterMode,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [laserArmed, setLaserArmed] = useState(false);
  const mirrorBoxRef = React.useRef<HTMLDivElement | null>(null);
  const [mirrorScale, setMirrorScale] = useState(0.54);

  useEffect(() => {
    const el = mirrorBoxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const updateScale = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setMirrorScale(Math.min(width / 1280, height / 720));
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const currentMeta = SLIDES_META[slideIndex] ?? SLIDES_META[0];
  const nextMeta = SLIDES_META[slideIndex + 1] ?? null;

  const handleMirrorPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!laserArmed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onSetLaser({ active: true, x, y });
  };

  const handleMirrorPointerLeave = () => {
    if (laser.active) {
      onSetLaser({ ...laser, active: false });
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F3EFE8] text-stone-900 flex flex-col select-none">
      {/* Clean Warm Keynote-Style Top Bar */}
      <header className="border-b border-stone-200 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs font-semibold text-amber-800">Mod Pembentang · Kimia Tingkatan 5</div>
            <div className="text-base font-bold text-stone-900">
              Slaid {slideIndex + 1} daripada {SLIDES_META.length} — {currentMeta.presenterLabel}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 border-l border-stone-200 pl-4 text-xs">
            <MonitorCheck
              className={`w-4 h-4 ${displayInfo.isExtended ? 'text-emerald-700' : 'text-amber-600'}`}
            />
            <span className="text-stone-700 font-medium">{displayInfo.screenLabel}</span>
            <button
              type="button"
              onClick={onProbeDisplays}
              className="px-2.5 py-1 rounded-md border border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-stone-700 cursor-pointer"
            >
              Kesan Skrin HDMI
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-stone-200 bg-stone-50 rounded-lg px-3 py-1.5">
            <span className="tabular-nums-clean text-sm font-bold text-stone-900">
              {formatTimerSeconds(elapsedSeconds)}
            </span>
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              aria-label={timerRunning ? 'Jeda pemasa' : 'Sambung pemasa'}
              className="text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setElapsedSeconds(0)}
              aria-label="Set semula pemasa"
              className="text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextArmed = !laserArmed;
              setLaserArmed(nextArmed);
              if (!nextArmed) onSetLaser({ ...laser, active: false });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              laserArmed
                ? 'border-red-600 bg-red-50 text-red-700'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Penunjuk Laser</span>
          </button>

          <button
            type="button"
            onClick={onToggleBlackout}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              blackout
                ? 'border-amber-600 bg-amber-50 text-amber-800'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Gelapkan (B)</span>
          </button>

          <button
            type="button"
            onClick={onToggleProjectorDark}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
          >
            {projectorDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{projectorDark ? 'Latar Cerah' : 'Latar Gelap'}</span>
          </button>

          <a
            href="?mode=audiens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-white"
          >
            <Tv2 className="w-3.5 h-3.5" />
            <span>Buka Paparan Projektor</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onExitPresenterMode}
            className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
          >
            Tutup (P)
          </button>
        </div>
      </header>

      {/* Main Two-Column Presenter Studio */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 p-4">
        {/* Left: Live Slide Mirror + Navigation */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-semibold">
              Paparan Audiens {connectedPeers > 0 ? `(${connectedPeers} skrin projektor bersambung)` : '(Sedia disambung ke projektor)'}
            </span>
            <span>
              {laserArmed
                ? 'Gerakkan tetikus pada slaid di bawah untuk menggerakkan laser di skrin projektor.'
                : 'Anda boleh mengklik terus butang di dalam pratonton untuk mengawal slaid.'}
            </span>
          </div>

          <div
            ref={mirrorBoxRef}
            onMouseMove={handleMirrorPointerMove}
            onMouseLeave={handleMirrorPointerLeave}
            className={`relative flex-1 min-h-0 rounded-2xl border-2 overflow-hidden bg-stone-200/70 flex items-center justify-center ${
              blackout ? 'border-amber-600' : 'border-stone-300'
            }`}
          >
            <div
              className="relative overflow-hidden rounded-lg shadow-md shrink-0"
              style={{
                width: `${1280 * mirrorScale}px`,
                height: `${720 * mirrorScale}px`,
              }}
            >
              <SlideStageContent
                slideIndex={slideIndex}
                interactions={interactions}
                onPatch={onPatchInteractions}
                projectorDark={projectorDark}
              />
            </div>

            {laser.active && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-600 ring-2 ring-white"
                style={{ left: `${laser.x}%`, top: `${laser.y}%` }}
              />
            )}

            {blackout && (
              <div className="pointer-events-none absolute inset-0 bg-stone-950/75 flex items-center justify-center">
                <span className="text-sm font-semibold text-white bg-stone-900 border border-stone-700 px-4 py-2 rounded-lg">
                  Skrin projektor digelapkan sementara (tekan B untuk buka semula)
                </span>
              </div>
            )}
          </div>

          {/* Slide Navigation Strip */}
          <div className="flex items-center justify-between gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2 shrink-0">
            <button
              type="button"
              onClick={onPrev}
              disabled={slideIndex === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-35 text-xs font-semibold text-stone-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelum</span>
            </button>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {SLIDES_META.map((s) => (
                <button
                  key={s.index}
                  type="button"
                  onClick={() => onGoToSlide(s.index)}
                  title={s.title}
                  className={`px-2 py-1 rounded-md tabular-nums-clean text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    s.index === slideIndex
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {s.index + 1}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onResetAll}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 whitespace-nowrap cursor-pointer"
              >
                Set Semula
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={slideIndex === SLIDES_META.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-35 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
              >
                <span>Seterusnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Clean, Plain-Language Speaker Notes for the 4 Presenters */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          <div className="border border-stone-200 bg-white rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold text-amber-800">{currentMeta.presenterLabel}</span>
              <span>Cadangan masa: {Math.round(currentMeta.durationSeconds / 60)} minit</span>
            </div>
            <h2 className="font-display text-xl font-bold text-stone-900">{currentMeta.title}</h2>
            <div className="text-xs text-stone-500">{currentMeta.textbookRef}</div>
            <div className="flex flex-wrap gap-3 pt-1 text-xs text-stone-700">
              {currentMeta.presenters.map((pid) => (
                <span key={pid}>
                  <strong>{TEAM_PRESENTERS[pid].name}:</strong> {TEAM_PRESENTERS[pid].focus}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-stone-200 bg-white rounded-2xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-stone-700">Isi Utama Pembentang</div>
            <ol className="space-y-2 text-sm text-stone-800 leading-relaxed list-decimal list-inside">
              {currentMeta.presenterNotes.talkingPoints.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </div>

          <div className="border border-amber-200 bg-amber-50/70 rounded-2xl p-4 space-y-3">
            <div>
              <div className="text-xs font-bold text-amber-900">Soalan untuk Ditanya kepada Kelas</div>
              <p className="text-sm text-stone-800 mt-1 leading-relaxed">
                {currentMeta.presenterNotes.questionForClass}
              </p>
            </div>
            <div className="pt-2.5 border-t border-amber-200/80">
              <div className="text-xs font-bold text-stone-800">Nota Tambahan Pembentang</div>
              <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                {currentMeta.presenterNotes.reminder}
              </p>
            </div>
          </div>

          {nextMeta && (
            <div className="border border-stone-200 bg-white rounded-2xl p-3.5">
              <div className="text-xs text-stone-500">Slaid Seterusnya ({nextMeta.presenterLabel})</div>
              <div className="text-sm font-bold text-stone-900 mt-0.5">{nextMeta.title}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
