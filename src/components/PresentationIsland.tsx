import React, { useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  Copy,
  Eraser,
  ImagePlus,
  LocateFixed,
  LogIn,
  LogOut,
  Maximize2,
  Minimize2,
  Moon,
  MousePointer2,
  PenTool,
  Plus,
  Sparkles,
  Sun,
  TextCursorInput,
  Trash2,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleFrameMode, GoogleLogoIcon } from './GoogleBrowserFrame';
import {
  AnnotationTool,
  PEN_COLORS,
  PEN_SIZES,
  PenMode,
  TEMP_DURATIONS,
  TempDurationSeconds,
} from '../utils/annotationEngine';
import { BoardSyncStatus } from '../hooks/useCollaborativeBoard';

interface PresentationIslandProps {
  slideIndex: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  projectorDark: boolean;
  onToggleDark: () => void;
  zoomScale: number;
  onZoomChange: (next: number) => void;
  tool: AnnotationTool;
  onToolChange: (next: AnnotationTool) => void;
  penMode: PenMode;
  onPenModeChange: (next: PenMode) => void;
  tempDuration: TempDurationSeconds;
  onTempDurationChange: (next: TempDurationSeconds) => void;
  penColor: string;
  onPenColorChange: (next: string) => void;
  penSize: number;
  onPenSizeChange: (next: number) => void;
  onClearSlideRootStrokes: () => void;
  onPickImageFile: (file: File) => void;
  googleOpen: boolean;
  googleMode: GoogleFrameMode;
  onToggleGoogle: (mode: GoogleFrameMode) => void;
  onAddTextBox: () => void;
  // Firebase / Live Sync props
  user: User | null;
  anonBlocked?: boolean;
  roomId: string;
  joinCode: string;
  syncStatus: BoardSyncStatus;
  syncError: string | null;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onJoinRoom: (roomId: string, joinCode: string) => void;
  closePopoverSignal?: number;
}

type IslandPopover = 'none' | 'pen' | 'sync';

export const PresentationIsland: React.FC<PresentationIslandProps> = ({
  slideIndex,
  totalSlides,
  onPrev,
  onNext,
  isFullscreen,
  onToggleFullscreen,
  projectorDark,
  onToggleDark,
  zoomScale,
  onZoomChange,
  tool,
  onToolChange,
  penMode,
  onPenModeChange,
  tempDuration,
  onTempDurationChange,
  penColor,
  onPenColorChange,
  penSize,
  onPenSizeChange,
  onClearSlideRootStrokes,
  onPickImageFile,
  googleOpen,
  googleMode,
  onToggleGoogle,
  onAddTextBox,
  user,
  anonBlocked = false,
  roomId,
  joinCode,
  syncStatus,
  syncError,
  onSignInGoogle,
  onSignOut,
  onJoinRoom,
  closePopoverSignal = 0,
}) => {
  const [openPopover, setOpenPopover] = useState<IslandPopover>('none');
  const [roomInput, setRoomInput] = useState(roomId);
  const [codeInput, setCodeInput] = useState(joinCode);
  const [copiedLink, setCopiedLink] = useState(false);
  const [islandHidden, setIslandHidden] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (closePopoverSignal > 0) {
      setOpenPopover('none');
    }
  }, [closePopoverSignal]);

  React.useEffect(() => {
    if (openPopover === 'none') return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-presentation-island]')) return;
      setOpenPopover('none');
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [openPopover]);

  const handlePenClick = () => {
    if (tool === 'pen') {
      setOpenPopover((p) => (p === 'pen' ? 'none' : 'pen'));
    } else {
      onToolChange('pen');
      setOpenPopover('pen');
    }
  };

  const handleCopyShareLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    url.searchParams.set('code', joinCode);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignore clipboard write failure in restricted contexts
    }
  };

  // ── Collapsed dot ──────────────────────────────────────────────────────────
  if (islandHidden) {
    return (
      <button
        type="button"
        data-presentation-island="true"
        aria-label="Tunjuk bar kawalan pembentangan"
        title="Klik untuk papar semula bar kawalan"
        onClick={() => setIslandHidden(false)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-5 h-5 rounded-full bg-white/90 border border-stone-400/70 shadow-md hover:scale-125 transition-transform pointer-events-auto"
      />
    );
  }

  return (
    <div
      data-presentation-island="true"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-auto"
    >
      {/* Pen Settings Popover */}
      {openPopover === 'pen' && (
        <div
          data-testid="pen-settings-popover"
          className="w-[min(340px,96vw)] rounded-2xl border border-stone-200 dark:border-stone-700 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3.5 shadow-xl space-y-3 text-stone-900 dark:text-stone-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Tetapan Pen
            </span>
            <button
              type="button"
              onClick={() => setOpenPopover('none')}
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
            >
              Tutup
            </button>
          </div>

          {/* Mode: Permanent vs Temporary */}
          <div className="grid grid-cols-2 gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            <button
              type="button"
              data-testid="pen-mode-permanent"
              onClick={() => onPenModeChange('permanent')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                penMode === 'permanent'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/70'
              }`}
            >
              Pen Kekal
            </button>
            <button
              type="button"
              data-testid="pen-mode-temporary"
              onClick={() => onPenModeChange('temporary')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                penMode === 'temporary'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/70'
              }`}
            >
              Pen Sementara
            </button>
          </div>

          {/* Temporary duration selector (3s, 5s, 6s) */}
          {penMode === 'temporary' && (
            <div className="flex items-center justify-between gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-2.5 py-2">
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                Pudar automatik:
              </span>
              <div className="flex items-center gap-1">
                {TEMP_DURATIONS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    data-testid={`temp-duration-${sec}`}
                    onClick={() => onTempDurationChange(sec)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      tempDuration === sec
                        ? 'bg-amber-600 text-white'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-stone-500">Warna Dakwat</div>
            <div className="flex items-center justify-between gap-1.5">
              {PEN_COLORS.map((c) => {
                const selected = penColor === c.value;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={c.label}
                    onClick={() => onPenColorChange(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={`w-7 h-7 rounded-full border cursor-pointer transition-transform ${
                      c.value === '#FFFFFF' ? 'border-stone-300' : 'border-black/15'
                    } ${selected ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'hover:scale-105'}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Stroke Size */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
              <span>Saiz Pen</span>
              <span className="tabular-nums-clean text-stone-800 dark:text-stone-200">
                {penSize}px
              </span>
            </div>
            <div className="flex items-center gap-2">
              {PEN_SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  aria-label={`Saiz ${sz}px`}
                  onClick={() => onPenSizeChange(sz)}
                  className={`flex-1 h-8 rounded-lg border flex items-center justify-center cursor-pointer ${
                    penSize === sz
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span
                    className="rounded-full bg-stone-900 dark:bg-stone-100 block"
                    style={{
                      width: `${Math.min(18, Math.max(3, sz))}px`,
                      height: `${Math.min(18, Math.max(3, sz))}px`,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Clear current slide root ink */}
          <div className="pt-1 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <span className="text-[11px] text-stone-500">
              Lukisan di atas tab ikut tab tersebut
            </span>
            <button
              type="button"
              onClick={onClearSlideRootStrokes}
              className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Padam Slaid Ini</span>
            </button>
          </div>
        </div>
      )}

      {/* Firebase Live Sync / Room Popover */}
      {openPopover === 'sync' && (
        <div
          data-testid="sync-settings-popover"
          className="w-[min(360px,96vw)] rounded-2xl border border-stone-200 dark:border-stone-700 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 shadow-xl space-y-3 text-stone-900 dark:text-stone-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud
                className={`w-4 h-4 ${
                  syncStatus === 'synced'
                    ? 'text-emerald-600'
                    : syncStatus === 'error'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Firebase Live Sync (Percuma)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpenPopover('none')}
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <div className="rounded-xl bg-[#FBF9F5] dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-2.5 text-xs space-y-2">
            {user && !user.isAnonymous ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold truncate">{user.displayName || user.email}</div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    {syncStatus === 'synced'
                      ? 'Terhubung secara langsung (Live)'
                      : syncStatus === 'connecting'
                      ? 'Menyambung ke bilik...'
                      : 'Ralat sambungan'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-bold hover:bg-stone-100 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : user && user.isAnonymous ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-stone-900 dark:text-stone-100">
                      Mod Terbuka (Tanpa Log Masuk)
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      {syncStatus === 'synced'
                        ? 'Aktif Live — Semua ahli pasukan terus sync automatik'
                        : syncStatus === 'connecting'
                        ? 'Menyambung secara automatik...'
                        : 'Ralat sambungan bilik'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="google-signin-button"
                  onClick={onSignInGoogle}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log Masuk Google (Pilihan)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-stone-600 dark:text-stone-400 leading-snug">
                  {anonBlocked
                    ? 'Mod Tanpa Log Masuk (Anonymous) belum diaktifkan di Firebase Console. Anda boleh aktifkannya atau log masuk dengan Google di bawah:'
                    : 'Menyambung mod terbuka secara automatik, atau log masuk Google:'}
                </p>
                <button
                  type="button"
                  data-testid="google-signin-button"
                  onClick={onSignInGoogle}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log Masuk Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Room ID & Join Code */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="sync-room-id" className="block text-[11px] font-bold text-stone-500 mb-1">
                ID Bilik Pasukan
              </label>
              <input
                id="sync-room-id"
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 px-2.5 py-1.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label htmlFor="sync-join-code" className="block text-[11px] font-bold text-stone-500 mb-1">
                Kod Sertai
              </label>
              <input
                id="sync-join-code"
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 px-2.5 py-1.5 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onJoinRoom(roomInput, codeInput)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold cursor-pointer"
            >
              Sertai / Tukar Bilik
            </button>
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="flex items-center gap-1 py-1.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold hover:bg-stone-100 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Disalin' : 'Pautan'}</span>
            </button>
          </div>

          {syncError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] font-semibold text-red-800 leading-snug">
              {syncError}
            </div>
          )}

          <details className="text-[11px] text-stone-600 dark:text-stone-400">
            <summary className="font-bold cursor-pointer text-stone-700 dark:text-stone-300">
              Panduan Cloudflare Pages (beijing-xinjiang.pages.dev)
            </summary>
            <ol className="mt-1.5 list-decimal pl-4 space-y-1 leading-relaxed">
              <li>
                <strong>Sync Tanpa Log Masuk:</strong> Dalam Firebase Console &rarr; Authentication &rarr; Sign-in method, aktifkan{' '}
                <strong>Anonymous</strong> (Enable) supaya semua rakan terus berhubung tanpa perlu log masuk.
              </li>
              <li>
                <strong>Pilihan Google Sign-In:</strong> Tambah domain{' '}
                <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">
                  beijing-xinjiang.pages.dev
                </code>{' '}
                di Authentication &rarr; Settings &rarr; Authorized domains.
              </li>
            </ol>
          </details>
        </div>
      )}

      {/* ── Main Floating Presentation Island ─────────────────────────────── */}
      {/*
        On wide screens (≥ sm / ≥ 640 px) everything fits in a single row.
        On narrow portrait phones we wrap into two rows automatically:
          Row 1 → Nav + core tools (pointer, pen, eraser, image, text, laser, AI)
          Row 2 → Zoom + sync + dark + fullscreen + hide-dot
        The outer div is flex-col so rows stack; each inner row is flex-row.
      */}
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-stone-200/90 dark:border-stone-700/90 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-2 py-1.5 shadow-lg text-stone-800 dark:text-stone-100 max-w-[96vw]">

        {/* ── Row 1: always visible core controls ── */}
        <div className="flex items-center gap-1 flex-wrap justify-center">

          {/* Slide Navigation */}
          <button
            type="button"
            onClick={onPrev}
            disabled={slideIndex === 0}
            aria-label="Slaid sebelumnya"
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="tabular-nums-clean text-xs font-bold px-1.5 min-w-[40px] text-center">
            {slideIndex + 1}/{totalSlides}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={slideIndex === totalSlides - 1}
            aria-label="Slaid seterusnya"
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-0.5" />

          {/* Pointer Tool */}
          <button
            type="button"
            aria-label="Mod kursor biasa"
            title="Kursor Biasa"
            onClick={() => {
              onToolChange('pointer');
              setOpenPopover('none');
            }}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              tool === 'pointer'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <MousePointer2 className="w-4 h-4" />
          </button>

          {/* Pen Tool */}
          <button
            type="button"
            data-testid="island-pen-button"
            aria-label="Alat Pen"
            title="Pen Lukisan (Kekal / Sementara)"
            onClick={handlePenClick}
            className={`relative flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              tool === 'pen'
                ? 'bg-blue-800 text-white'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/60"
              style={{ backgroundColor: penColor }}
            />
            {penMode === 'temporary' && (
              <span className="text-[10px] tabular-nums-clean opacity-90">{tempDuration}s</span>
            )}
          </button>

          {/* Eraser Tool */}
          <button
            type="button"
            data-testid="island-eraser-button"
            aria-label="Pemadam Pen"
            title="Pemadam Pen"
            onClick={() => {
              onToolChange(tool === 'eraser' ? 'pointer' : 'eraser');
              setOpenPopover('none');
            }}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              tool === 'eraser'
                ? 'bg-red-700 text-white'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Eraser className="w-4 h-4" />
          </button>

          {/* Add Image (file picker + Ctrl+V support) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickImageFile(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            data-testid="island-image-button"
            aria-label="Tambah Gambar"
            title="Tambah Gambar (atau tekan Ctrl+V di mana-mana)"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
          </button>

          {/* Add Movable Text Box (separate from editing embedded slide text) */}
          <button
            type="button"
            data-testid="island-add-text-button"
            aria-label="Tambah Kotak Teks"
            title="Tambah Kotak Teks (taip, seret, ubah saiz & saiz fon — berbeza daripada Sunting Teks)"
            onClick={() => {
              onAddTextBox();
              setOpenPopover('none');
            }}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <span className="relative flex items-center justify-center">
              <TextCursorInput className="w-4 h-4" />
              <Plus className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-white dark:bg-stone-900 text-blue-700 dark:text-blue-400" />
            </span>
          </button>

          {/* Text Edit Mode (embedded slide text) */}
          <button
            type="button"
            data-testid="island-text-edit-button"
            aria-label="Mod Sunting Teks"
            title="Sunting Teks Sedia Ada (Klik kanan mana-mana teks atau aktifkan mod ini)"
            onClick={() => {
              onToolChange(tool === 'text-edit' ? 'pointer' : 'text-edit');
              setOpenPopover('none');
            }}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              tool === 'text-edit'
                ? 'bg-emerald-700 text-white'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Collaborative Laser Pointer */}
          <button
            type="button"
            data-testid="island-laser-button"
            aria-label="Penunjuk Laser Kolaboratif"
            title="Penunjuk Laser (Klik di sini atau tahan kekunci L sambil gerakkan tetikus)"
            onClick={() => {
              onToolChange(tool === 'laser' ? 'pointer' : 'laser');
              setOpenPopover('none');
            }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              tool === 'laser'
                ? 'bg-red-600 text-white shadow-sm'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <LocateFixed className="w-4 h-4" />
            <span className="hidden md:inline text-[11px]">L</span>
          </button>

          {/* Google Browser Toggle — real google.com inside the draggable frame */}
          <button
            type="button"
            data-testid="island-google-button"
            aria-label="Buka Google"
            title="Buka Google sebenar dalam bingkai (boleh seret, ubah saiz & klik apa sahaja)"
            onClick={() => {
              onToggleGoogle('google');
              setOpenPopover('none');
            }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              googleOpen && googleMode === 'google'
                ? 'bg-stone-900 text-white shadow-sm dark:bg-stone-100 dark:text-stone-900'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <GoogleLogoIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Google</span>
          </button>

          {/* Google AI Toggle — same G logo + AI sparkle, auto-searches the current slide */}
          <button
            type="button"
            data-testid="island-google-ai-button"
            aria-label="Buka Google AI dengan konteks slaid"
            title="Google AI (Gemini): auto-cari slaid semasa + salin prompt tersembunyi ke papan klip"
            onClick={() => {
              onToggleGoogle('google-ai');
              setOpenPopover('none');
            }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              googleOpen && googleMode === 'google-ai'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            <span className="relative flex items-center justify-center">
              <GoogleLogoIcon className="w-4 h-4" />
              <Sparkles className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 text-emerald-600 dark:text-emerald-300" />
            </span>
            <span className="hidden sm:inline text-[11px]">AI</span>
          </button>
        </div>

        {/* ── Thin divider between rows on mobile ── */}
        <div className="sm:hidden w-full h-px bg-stone-200 dark:bg-stone-700" />

        {/* ── Row 2: zoom + sync + settings + hide ── */}
        <div className="flex items-center gap-1 flex-wrap justify-center">

          {/* Zoom Controls */}
          <button
            type="button"
            data-testid="island-zoom-out"
            aria-label="Zum keluar"
            title="Zum Keluar"
            onClick={() => onZoomChange(Math.max(0.3, Math.round((zoomScale - 0.15) * 100) / 100))}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="island-zoom-reset"
            aria-label="Set semula zum"
            title="Klik untuk set semula zum 100% dan kedudukan asal tengah"
            onClick={() => onZoomChange(1)}
            className="tabular-nums-clean text-[11px] font-bold px-1.5 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            {Math.round(zoomScale * 100)}%
          </button>
          <button
            type="button"
            data-testid="island-zoom-in"
            aria-label="Zum masuk"
            title="Zum Masuk"
            onClick={() => onZoomChange(Math.min(4.0, Math.round((zoomScale + 0.15) * 100) / 100))}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-0.5" />

          {/* Firebase Cloud Live Sync Button */}
          <button
            type="button"
            data-testid="island-sync-button"
            aria-label="Status Firebase Live Sync"
            title="Firebase Live Sync & Bilik Pasukan"
            onClick={() => setOpenPopover((p) => (p === 'sync' ? 'none' : 'sync'))}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              syncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : syncStatus === 'error'
                ? 'bg-red-50 text-red-700'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {syncStatus === 'synced' ? (
              <Cloud className="w-4 h-4 text-emerald-600" />
            ) : (
              <CloudOff className="w-4 h-4 text-stone-500" />
            )}
            <span className="hidden sm:inline">
              {syncStatus === 'synced' ? 'Live' : syncStatus === 'connecting' ? '...' : 'Sync'}
            </span>
          </button>

          {/* Dark Mode & Fullscreen */}
          <button
            type="button"
            onClick={onToggleDark}
            aria-label="Tukar tema gelap"
            title="Tema Gelap / Cerah"
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            {projectorDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label="Skrin penuh"
            title="Skrin Penuh (F)"
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Hide island → dot */}
          <button
            type="button"
            onClick={() => setIslandHidden(true)}
            aria-label="Sembunyikan bar kawalan"
            title="Sembunyikan bar kawalan (akan tinggal titik kecil)"
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            {/* Simple ⊙ hide icon */}
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
              <circle cx="8" cy="8" r="6" fillOpacity={0.15} stroke="currentColor" strokeWidth="1.5" fill="none" />
              <circle cx="8" cy="8" r="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
