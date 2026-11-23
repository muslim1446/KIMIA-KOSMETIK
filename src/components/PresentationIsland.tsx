import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  Copy,
  Eraser,
  FileText,
  ImagePlus,
  Loader2,
  LocateFixed,
  MapPin,
  Maximize2,
  Minimize2,
  Moon,
  MousePointer2,
  Navigation,
  PenTool,
  Plus,
  Redo2,
  Sparkles,
  Sun,
  TextCursorInput,
  Trash2,
  Type,
  Undo2,
  Users,
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
import { APPLE_SPRINGS } from '../utils/applePhysics';
import { triggerHaptic } from '../utils/haptics';
import {
  PresenceLocation,
  PresenceUser,
  presenceSourceLabel,
} from '../utils/presence';
import { useUiText } from '../utils/uiLanguage';

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
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onPickImageFile: (file: File) => void;
  googleOpen: boolean;
  googleMode: GoogleFrameMode;
  onToggleGoogle: (mode: GoogleFrameMode) => void;
  onAddTextBox: () => void;
  onOpenPdfDialog: () => void;
  presenceUsers: PresenceUser[];
  presenceLocation: PresenceLocation | null;
  presenceLocationBusy: boolean;
  presenceLocationError: string | null;
  presenceDisplayName: string;
  onUpdatePresenceDisplayName: (name: string) => void;
  onRefreshPresenceLocation: () => void;
  currentAuthorId: string;
  // Firebase / Live Sync props
  user: User | null;
  anonBlocked?: boolean;
  roomId: string;
  joinCode: string;
  syncStatus: BoardSyncStatus;
  syncError: string | null;
  onJoinRoom: (roomId: string, joinCode: string) => void;
  closePopoverSignal?: number;
}

type IslandPopover = 'none' | 'pen' | 'sync' | 'presence';

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
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onPickImageFile,
  googleOpen,
  googleMode,
  onToggleGoogle,
  onAddTextBox,
  onOpenPdfDialog,
  presenceUsers,
  presenceLocation,
  presenceLocationBusy,
  presenceLocationError,
  presenceDisplayName,
  onUpdatePresenceDisplayName,
  onRefreshPresenceLocation,
  currentAuthorId,
  roomId,
  joinCode,
  syncStatus,
  syncError,
  onJoinRoom,
  closePopoverSignal = 0,
}) => {
  const t = useUiText();
  const [openPopover, setOpenPopover] = useState<IslandPopover>('none');
  const [roomInput, setRoomInput] = useState(roomId);
  const [codeInput, setCodeInput] = useState(joinCode);
  const [copiedLink, setCopiedLink] = useState(false);
  const [islandHidden, setIslandHidden] = useState(false);
  const [nameDraft, setNameDraft] = useState(presenceDisplayName);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setRoomInput(roomId);
  }, [roomId]);

  React.useEffect(() => {
    setCodeInput(joinCode);
  }, [joinCode]);

  React.useEffect(() => {
    setNameDraft(presenceDisplayName);
  }, [presenceDisplayName]);

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

  // ── Collapsed Liquid Glass Orb (44x44pt Apple hit target) ──────────────────
  if (islandHidden) {
    return (
      <motion.button
        type="button"
        data-presentation-island="true"
        aria-label={t('island.show')}
        title={t('island.showTitle')}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={APPLE_SPRINGS.snappy}
        onClick={() => {
          triggerHaptic('toggle');
          setIslandHidden(false);
        }}
        className="apple-ui apple-pressable fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 flex h-11 w-11 items-center justify-center rounded-full pointer-events-auto cursor-pointer"
      >
        <span className="apple-glass w-6 h-6 rounded-full flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-[var(--apple-label)] opacity-80" />
        </span>
      </motion.button>
    );
  }

  return (
    <div
      data-presentation-island="true"
      className="apple-ui fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2.5 pointer-events-auto"
    >
      {/* ── Animated Liquid Glass Popovers ── */}
      <AnimatePresence mode="wait">
        {openPopover === 'pen' && (
          <motion.div
            key="popover-pen"
            data-testid="pen-settings-popover"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={APPLE_SPRINGS.popover}
            className="apple-sheet apple-squircle w-[min(352px,94vw)] rounded-[26px] p-4 space-y-3.5 text-[var(--apple-label)] origin-bottom"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--apple-label)]">
                {t('pen.settings')}
              </span>
              <button
                type="button"
                onClick={() => setOpenPopover('none')}
                className="apple-pressable min-h-[32px] px-2.5 rounded-full bg-[var(--apple-fill)] hover:bg-[var(--apple-fill-hover)] text-[12px] font-semibold text-[var(--apple-blue-fg)] cursor-pointer whitespace-nowrap"
              >
                {t('common.close')}
              </button>
            </div>

            {/* Apple Segmented Control: 26px outer - 16px p-4 = 10px concentric */}
            <div className="grid grid-cols-2 gap-1 bg-[var(--apple-fill)] p-1 rounded-[10px]">
              <button
                type="button"
                data-testid="pen-mode-permanent"
                onClick={() => onPenModeChange('permanent')}
                className={`apple-pressable min-h-[36px] py-1.5 px-3 rounded-[6px] text-[12px] font-semibold whitespace-nowrap cursor-pointer ${
                  penMode === 'permanent'
                    ? 'bg-[var(--apple-bg-tertiary)] text-[var(--apple-label)] shadow-sm'
                    : 'text-[var(--apple-secondary-label)] hover:text-[var(--apple-label)]'
                }`}
              >
                {t('pen.permanent')}
              </button>
              <button
                type="button"
                data-testid="pen-mode-temporary"
                onClick={() => onPenModeChange('temporary')}
                className={`apple-pressable min-h-[36px] py-1.5 px-3 rounded-[6px] text-[12px] font-semibold whitespace-nowrap cursor-pointer ${
                  penMode === 'temporary'
                    ? 'bg-[var(--apple-orange)] text-white shadow-sm'
                    : 'text-[var(--apple-secondary-label)] hover:text-[var(--apple-label)]'
                }`}
              >
                {t('pen.temporary')}
              </button>
            </div>

            {/* Temporary fade duration */}
            {penMode === 'temporary' && (
              <div className="flex items-center justify-between gap-2 bg-[var(--apple-fill)] rounded-[10px] px-3 py-2">
                <span className="text-[12px] font-medium text-[var(--apple-orange-fg)]">
                  {t('pen.fade')}
                </span>
                <div className="flex items-center gap-1">
                  {TEMP_DURATIONS.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      data-testid={`temp-duration-${sec}`}
                      onClick={() => onTempDurationChange(sec)}
                      className={`apple-pressable min-h-[32px] px-2.5 rounded-[8px] text-[12px] font-semibold tabular-nums-clean cursor-pointer ${
                        tempDuration === sec
                          ? 'bg-[var(--apple-orange)] text-white shadow-sm'
                          : 'bg-[var(--apple-bg-tertiary)] text-[var(--apple-label)]'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ink Colors */}
            <div className="space-y-2">
              <div className="text-[12px] font-medium text-[var(--apple-secondary-label)]">
                {t('pen.color')}
              </div>
              <div className="flex items-center justify-between gap-1.5">
                {PEN_COLORS.map((c) => {
                  const selected = penColor === c.value;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-label={t(
                        `pen.color.${c.id}` as
                          | 'pen.color.blue'
                          | 'pen.color.red'
                          | 'pen.color.emerald'
                          | 'pen.color.amber'
                          | 'pen.color.violet'
                          | 'pen.color.ink'
                          | 'pen.color.chalk',
                      )}
                      onClick={() => onPenColorChange(c.value)}
                      style={{ backgroundColor: c.value }}
                      className={`apple-pressable w-8 h-8 rounded-full border cursor-pointer ${
                        c.value === '#FFFFFF'
                          ? 'border-[var(--apple-separator)]'
                          : 'border-black/15 dark:border-white/20'
                      } ${
                        selected
                          ? 'ring-2 ring-offset-2 ring-[var(--apple-blue)] scale-110'
                          : 'hover:scale-105'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Stroke Thickness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[var(--apple-secondary-label)]">
                  {t('pen.size')}
                </span>
                <span className="tabular-nums-clean font-semibold text-[var(--apple-label)]">
                  {penSize}px
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {PEN_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    aria-label={`${t('pen.size')} ${sz}px`}
                    onClick={() => onPenSizeChange(sz)}
                    className={`apple-pressable flex-1 h-9 rounded-[10px] border flex items-center justify-center cursor-pointer ${
                      penSize === sz
                        ? 'border-[var(--apple-blue)] bg-[var(--apple-blue)]/12'
                        : 'border-[var(--apple-separator)] bg-[var(--apple-fill)] hover:bg-[var(--apple-fill-hover)]'
                    }`}
                  >
                    <span
                      className="rounded-full bg-[var(--apple-label)] block"
                      style={{
                        width: `${Math.min(18, Math.max(3, sz))}px`,
                        height: `${Math.min(18, Math.max(3, sz))}px`,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Hairline divider & Clear action */}
            <div className="pt-2.5 border-t border-[var(--apple-separator)] flex items-center justify-between gap-2">
              <span className="text-[11px] text-[var(--apple-secondary-label)] leading-snug">
                {t('pen.tabHint')}
              </span>
              <button
                type="button"
                onClick={onClearSlideRootStrokes}
                className="apple-pressable min-h-[34px] flex items-center gap-1.5 text-[12px] font-semibold text-[var(--apple-red-fg)] px-2.5 py-1.5 rounded-[10px] hover:bg-[var(--apple-red)]/10 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('pen.clearSlide')}</span>
              </button>
            </div>
          </motion.div>
        )}

        {openPopover === 'sync' && (
          <motion.div
            key="popover-sync"
            data-testid="sync-settings-popover"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={APPLE_SPRINGS.popover}
            className="apple-sheet apple-squircle w-[min(368px,94vw)] rounded-[26px] p-4 space-y-3.5 text-[var(--apple-label)] origin-bottom"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud
                  className="w-4 h-4 shrink-0"
                  style={{
                    color:
                      syncStatus === 'synced'
                        ? 'var(--apple-green-fg)'
                        : syncStatus === 'error'
                        ? 'var(--apple-red-fg)'
                        : 'var(--apple-blue-fg)',
                  }}
                />
                <span className="text-[13px] font-semibold tracking-[-0.01em]">
                  {t('sync.title')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenPopover('none')}
                className="apple-pressable min-h-[32px] px-2.5 rounded-full bg-[var(--apple-fill)] hover:bg-[var(--apple-fill-hover)] text-[12px] font-semibold text-[var(--apple-blue-fg)] cursor-pointer whitespace-nowrap"
              >
                {t('common.close')}
              </button>
            </div>

            <div className="rounded-[10px] bg-[var(--apple-fill)] px-3.5 py-2.5 space-y-0.5">
              <div className="text-[12px] font-semibold text-[var(--apple-label)]">
                {t('sync.openGuest')}
              </div>
              <div
                className="text-[11px] font-medium"
                style={{
                  color:
                    syncStatus === 'synced'
                      ? 'var(--apple-green-fg)'
                      : syncStatus === 'error'
                      ? 'var(--apple-red-fg)'
                      : 'var(--apple-blue-fg)',
                }}
              >
                {syncStatus === 'synced'
                  ? t('sync.guestConnected')
                  : syncStatus === 'connecting'
                  ? t('sync.guestConnecting')
                  : t('sync.guestError')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="sync-room-id"
                  className="block text-[11px] font-medium text-[var(--apple-secondary-label)] mb-1"
                >
                  {t('sync.roomId')}
                </label>
                <input
                  id="sync-room-id"
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  className="w-full min-h-[38px] rounded-[10px] border border-[var(--apple-separator)] bg-[var(--apple-bg-tertiary)] px-2.5 py-1.5 text-[13px] font-medium text-[var(--apple-label)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-blue)]"
                />
              </div>
              <div>
                <label
                  htmlFor="sync-join-code"
                  className="block text-[11px] font-medium text-[var(--apple-secondary-label)] mb-1"
                >
                  {t('sync.joinCode')}
                </label>
                <input
                  id="sync-join-code"
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  className="w-full min-h-[38px] rounded-[10px] border border-[var(--apple-separator)] bg-[var(--apple-bg-tertiary)] px-2.5 py-1.5 text-[13px] font-medium text-[var(--apple-label)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-blue)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onJoinRoom(roomInput, codeInput)}
                className="apple-pressable flex-1 min-h-[40px] py-2 px-3 rounded-[12px] bg-[var(--apple-blue)] text-white text-[13px] font-semibold whitespace-nowrap cursor-pointer"
              >
                {t('sync.joinRoom')}
              </button>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="apple-pressable min-h-[40px] flex items-center gap-1.5 py-2 px-3 rounded-[12px] bg-[var(--apple-fill)] hover:bg-[var(--apple-fill-hover)] text-[13px] font-semibold text-[var(--apple-label)] whitespace-nowrap cursor-pointer"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-[var(--apple-green-fg)]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedLink ? t('sync.copied') : t('sync.copyLink')}</span>
              </button>
            </div>

            {syncError && (
              <div className="rounded-[12px] bg-[var(--apple-red)]/12 px-3 py-2 text-[12px] font-medium text-[var(--apple-red-fg)] leading-snug">
                {t('sync.roomError')}
              </div>
            )}

            <details className="text-[11px] text-[var(--apple-secondary-label)] pt-1 border-t border-[var(--apple-separator)]">
              <summary className="font-semibold cursor-pointer text-[var(--apple-label)] py-1">
                {t('sync.roomHelp')}
              </summary>
              <ol className="mt-1.5 list-decimal pl-4 space-y-1 leading-relaxed">
                <li>{t('sync.firebaseGuest')}</li>
                <li>
                  {t('sync.firebaseRules')}{' '}
                  <code className="px-1.5 py-0.5 bg-[var(--apple-fill)] rounded text-[10px]">
                    Firebase Console → Firestore Database → Rules → Publish
                  </code>
                </li>
              </ol>
            </details>
          </motion.div>
        )}

        {openPopover === 'presence' && (
          <motion.div
            key="popover-presence"
            data-testid="presence-popover"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={APPLE_SPRINGS.popover}
            className="apple-sheet apple-squircle w-[min(388px,94vw)] rounded-[26px] p-4 space-y-3.5 text-[var(--apple-label)] origin-bottom"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-4 h-4 text-[var(--apple-blue-fg)] shrink-0" />
                <span className="text-[13px] font-semibold tracking-[-0.01em] truncate">
                  {t('presence.title')}
                </span>
                <span aria-hidden="true" className="text-[var(--apple-tertiary-label)]">
                  ·
                </span>
                <span className="text-[12px] font-medium text-[var(--apple-secondary-label)] tabular-nums-clean whitespace-nowrap">
                  {t('presence.onlineCount', { count: presenceUsers.length })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenPopover('none')}
                className="apple-pressable min-h-[32px] px-2.5 rounded-full bg-[var(--apple-fill)] hover:bg-[var(--apple-fill-hover)] text-[12px] font-semibold text-[var(--apple-blue-fg)] cursor-pointer whitespace-nowrap shrink-0"
              >
                {t('common.close')}
              </button>
            </div>

            {syncStatus !== 'synced' && (
              <div className="rounded-[12px] bg-[var(--apple-orange)]/14 px-3 py-2 text-[12px] font-medium text-[var(--apple-orange-fg)] leading-snug">
                {t('presence.offlineNote')}
              </div>
            )}

            <div className="rounded-[10px] bg-[var(--apple-fill)] p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-[var(--apple-secondary-label)]">
                    {t('presence.yourLocation')}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--apple-red-fg)]" />
                    <span className="truncate">
                      {presenceLocation?.label || t('presence.unknown')}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--apple-secondary-label)]">
                    <span>
                      {presenceSourceLabel(presenceLocation, {
                        gps: t('presence.gps'),
                        ip: t('presence.ip'),
                        none: t('presence.none'),
                      })}
                    </span>
                    {presenceLocation?.updatedAt ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{t('presence.cachedLocation')}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="presence-refresh-location"
                  onClick={onRefreshPresenceLocation}
                  disabled={presenceLocationBusy}
                  className="apple-pressable shrink-0 min-h-[34px] flex items-center gap-1.5 rounded-[10px] bg-[var(--apple-bg-tertiary)] border border-[var(--apple-separator)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--apple-label)] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {presenceLocationBusy ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3 text-[var(--apple-blue-fg)]" />
                  )}
                  <span>
                    {presenceLocationBusy ? t('presence.locating') : t('presence.precise')}
                  </span>
                </button>
              </div>
              <p className="text-[11px] leading-snug text-[var(--apple-secondary-label)]">
                {t('presence.locationHint')}
              </p>
              {presenceLocationError && (
                <div className="rounded-[10px] bg-[var(--apple-red)]/12 px-2.5 py-1.5 text-[11px] font-medium text-[var(--apple-red-fg)]">
                  {presenceLocationError}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="presence-name"
                className="block text-[11px] font-medium text-[var(--apple-secondary-label)]"
              >
                {t('presence.displayName')}
              </label>
              <input
                id="presence-name"
                data-testid="presence-name-input"
                type="text"
                value={nameDraft}
                maxLength={80}
                placeholder={t('presence.displayNamePlaceholder')}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => {
                  const clean = nameDraft.trim();
                  onUpdatePresenceDisplayName(clean);
                  setNameDraft(clean);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                className="w-full min-h-[38px] rounded-[10px] border border-[var(--apple-separator)] bg-[var(--apple-bg-tertiary)] px-3 py-1.5 text-[13px] font-medium text-[var(--apple-label)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-blue)]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-[var(--apple-secondary-label)]">
                {t('presence.onlineList')}
              </div>
              {presenceUsers.length === 0 ? (
                <p className="rounded-[14px] bg-[var(--apple-fill)] px-3 py-2.5 text-[12px] text-[var(--apple-secondary-label)]">
                  {t('presence.empty')}
                </p>
              ) : (
                <div className="max-h-[240px] overflow-y-auto divide-y divide-[var(--apple-separator)] rounded-[14px] bg-[var(--apple-fill)]">
                  {presenceUsers.map((entry) => {
                    const isSelf = entry.uid === currentAuthorId;
                    const initial = entry.displayName.trim().charAt(0).toUpperCase() || '?';
                    const locationLabel = entry.location?.label || '';
                    return (
                      <div
                        key={entry.uid}
                        data-testid="presence-user-row"
                        className="flex items-center gap-2.5 px-3 py-2.5"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                            isSelf
                              ? 'bg-[var(--apple-blue)] text-white'
                              : 'bg-[var(--apple-bg-tertiary)] text-[var(--apple-label)] border border-[var(--apple-separator)]'
                          }`}
                        >
                          {initial}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                            <span className="truncate">{entry.displayName}</span>
                            {isSelf && (
                              <span className="text-[11px] font-medium text-[var(--apple-blue-fg)] shrink-0">
                                · {t('presence.you')}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--apple-secondary-label)]">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {locationLabel || t('presence.unknown')}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="shrink-0">
                              {presenceSourceLabel(entry.location, {
                                gps: t('presence.gps'),
                                ip: t('presence.ip'),
                                none: t('presence.none'),
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Liquid Glass Floating Capsule Island ── */}
      <div className="apple-glass apple-squircle flex flex-col items-center gap-1 rounded-[26px] sm:rounded-full p-1.5 max-w-[96vw]">
        {/* Row 1: Slide nav + Core creative & AI tools */}
        <div className="flex items-center gap-0.5 flex-wrap justify-center">
          {/* Slide Navigation */}
          <button
            type="button"
            onClick={onPrev}
            disabled={slideIndex === 0}
            aria-label={t('island.prev')}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="tabular-nums-clean text-[12px] font-semibold px-1.5 min-w-[40px] text-center whitespace-nowrap shrink-0">
            {slideIndex + 1}/{totalSlides}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={slideIndex === totalSlides - 1}
            aria-label={t('island.next')}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-[var(--apple-separator)] mx-1 shrink-0" />

          {/* Pointer Tool */}
          <button
            type="button"
            data-guide-target="move"
            aria-label={t('island.pointer')}
            title={t('island.pointerTitle')}
            onClick={() => {
              onToolChange('pointer');
              setOpenPopover('none');
            }}
            className={`apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full cursor-pointer ${
              tool === 'pointer'
                ? 'bg-[var(--apple-label)] text-[var(--apple-bg-tertiary)] shadow-sm'
                : 'hover:bg-[var(--apple-fill)]'
            }`}
          >
            <MousePointer2 className="w-4 h-4" />
          </button>

          {/* Pen Tool */}
          <button
            type="button"
            data-testid="island-pen-button"
            aria-label={t('island.pen')}
            title={t('island.penTitle')}
            onClick={handlePenClick}
            className={`apple-pressable relative flex items-center justify-center gap-1.5 px-2.5 min-h-[40px] max-sm:min-h-[44px] sm:min-h-[38px] rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              tool === 'pen'
                ? 'bg-[var(--apple-blue)] text-white shadow-sm'
                : 'hover:bg-[var(--apple-fill)]'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/70 shadow-xs"
              style={{ backgroundColor: penColor }}
            />
            {penMode === 'temporary' && (
              <span className="text-[11px] tabular-nums-clean opacity-95">{tempDuration}s</span>
            )}
          </button>

          {/* Eraser Tool */}
          <button
            type="button"
            data-testid="island-eraser-button"
            aria-label={t('island.eraser')}
            title={t('island.eraser')}
            onClick={() => {
              onToolChange(tool === 'eraser' ? 'pointer' : 'eraser');
              setOpenPopover('none');
            }}
            className={`apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full cursor-pointer ${
              tool === 'eraser'
                ? 'bg-[var(--apple-red)] text-white shadow-sm'
                : 'hover:bg-[var(--apple-fill)]'
            }`}
          >
            <Eraser className="w-4 h-4" />
          </button>

          {/* Undo & Redo */}
          <button
            type="button"
            data-testid="island-undo-button"
            aria-label={t('island.undo')}
            title={t('island.undoTitle')}
            onClick={() => {
              onUndo?.();
              setOpenPopover('none');
            }}
            disabled={!canUndo || !onUndo}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="island-redo-button"
            aria-label={t('island.redo')}
            title={t('island.redoTitle')}
            onClick={() => {
              onRedo?.();
              setOpenPopover('none');
            }}
            disabled={!canRedo || !onRedo}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Add Image */}
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
            aria-label={t('island.image')}
            title={t('island.imageTitle')}
            onClick={() => fileInputRef.current?.click()}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
          </button>

          {/* Add Fixed PDF Page Frame */}
          <button
            type="button"
            data-testid="island-pdf-button"
            aria-label={t('island.pdf')}
            title={t('island.pdfTitle')}
            onClick={() => {
              onOpenPdfDialog();
              setOpenPopover('none');
            }}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] cursor-pointer"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Add Movable Text Box */}
          <button
            type="button"
            data-testid="island-add-text-button"
            aria-label={t('island.addText')}
            title={t('island.addTextTitle')}
            onClick={() => {
              onAddTextBox();
              setOpenPopover('none');
            }}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] cursor-pointer"
          >
            <span className="relative flex items-center justify-center">
              <TextCursorInput className="w-4 h-4" />
              <Plus className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-[var(--apple-bg-tertiary)] text-[var(--apple-blue-fg)]" />
            </span>
          </button>

          {/* Embedded Slide Text Edit Tool */}
          <button
            type="button"
            data-testid="island-text-edit-button"
            aria-label={t('island.editText')}
            title={t('island.editTextTitle')}
            onClick={() => {
              onToolChange(tool === 'text-edit' ? 'pointer' : 'text-edit');
              setOpenPopover('none');
            }}
            className={`apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full cursor-pointer ${
              tool === 'text-edit'
                ? 'bg-[var(--apple-green-fg)] text-white shadow-sm'
                : 'hover:bg-[var(--apple-fill)]'
            }`}
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Collaborative Laser Pointer */}
          <button
            type="button"
            data-testid="island-laser-button"
            aria-label={t('island.laser')}
            title={t('island.laserTitle')}
            onClick={() => {
              onToolChange(tool === 'laser' ? 'pointer' : 'laser');
              setOpenPopover('none');
            }}
            className={`apple-pressable flex items-center justify-center gap-1 px-2.5 min-h-[40px] max-sm:min-h-[44px] sm:min-h-[38px] rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              tool === 'laser'
                ? 'bg-[var(--apple-red)] text-white shadow-sm'
                : 'hover:bg-[var(--apple-fill)]'
            }`}
          >
            <LocateFixed className="w-4 h-4" />
            <span className="hidden md:inline text-[11px]">L</span>
          </button>

          {/* Google Browser Toggle */}
          <button
            type="button"
            data-testid="island-google-button"
            aria-label={t('island.google')}
            title={t('island.googleTitle')}
            onClick={() => {
              onToggleGoogle('google');
              setOpenPopover('none');
            }}
            className={`apple-pressable flex items-center justify-center gap-1.5 px-2.5 min-h-[40px] max-sm:min-h-[44px] sm:min-h-[38px] rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              googleOpen && googleMode === 'google'
                ? 'bg-[var(--apple-label)] text-[var(--apple-bg-tertiary)] shadow-sm'
                : 'hover:bg-[var(--apple-fill)]'
            }`}
          >
            <GoogleLogoIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Google</span>
          </button>

          {/* Google AI Toggle */}
          <button
            type="button"
            data-testid="island-google-ai-button"
            data-guide-target="ai"
            aria-label={t('island.googleAi')}
            title={t('island.googleAiTitle')}
            onClick={() => {
              onToggleGoogle('google-ai');
              setOpenPopover('none');
            }}
            className={`apple-pressable flex items-center justify-center gap-1.5 px-2.5 min-h-[40px] max-sm:min-h-[44px] sm:min-h-[38px] rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              googleOpen && googleMode === 'google-ai'
                ? 'bg-[var(--apple-green-fg)] text-white shadow-sm'
                : 'hover:bg-[var(--apple-green)]/15 text-[var(--apple-green-fg)]'
            }`}
          >
            <span className="relative flex items-center justify-center">
              <GoogleLogoIcon className="w-4 h-4" />
              <Sparkles className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 text-[var(--apple-green-fg)]" />
            </span>
            <span className="hidden sm:inline text-[11px]">{t('island.aiBadge')}</span>
          </button>
        </div>

        {/* Hairline separator on narrow screens */}
        <div className="sm:hidden w-[calc(100%-16px)] h-px bg-[var(--apple-separator)]" />

        {/* Row 2: Zoom, Presence, Cloud Sync, Appearance, Fullscreen, Collapse */}
        <div className="flex items-center gap-0.5 flex-wrap justify-center">
          <button
            type="button"
            data-testid="island-zoom-out"
            aria-label={t('island.zoomOut')}
            title={t('island.zoomOut')}
            onClick={() => onZoomChange(Math.max(0.3, Math.round((zoomScale - 0.15) * 100) / 100))}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="island-zoom-reset"
            data-guide-target="zoom"
            aria-label={t('island.zoomReset')}
            title={t('island.zoomReset')}
            onClick={() => onZoomChange(1)}
            className="apple-pressable tabular-nums-clean text-[11px] font-semibold px-2 min-h-[40px] max-sm:min-h-[44px] sm:min-h-[38px] rounded-full hover:bg-[var(--apple-fill)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {Math.round(zoomScale * 100)}%
          </button>
          <button
            type="button"
            data-testid="island-zoom-in"
            aria-label={t('island.zoomIn')}
            title={t('island.zoomIn')}
            onClick={() => onZoomChange(Math.min(4.0, Math.round((zoomScale + 0.15) * 100) / 100))}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-[var(--apple-separator)] mx-1 shrink-0" />

          {/* Live Presence */}
          <button
            type="button"
            data-testid="island-presence-button"
            aria-label={t('island.presence')}
            title={t('island.presenceTitle')}
            onClick={() => setOpenPopover((p) => (p === 'presence' ? 'none' : 'presence'))}
            className={`apple-pressable flex items-center justify-center gap-1.5 px-2.5 min-h-[40px] max-sm:min-h-[44px] sm:min-h-[38px] rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              openPopover === 'presence'
                ? 'bg-[var(--apple-blue)] text-white shadow-sm'
                : 'hover:bg-[var(--apple-fill)]'
            }`}
          >
            <span className="relative flex items-center justify-center">
              <Users className="w-4 h-4" />
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-stone-900"
                style={{
                  backgroundColor:
                    presenceUsers.length > 0 ? 'var(--apple-green)' : 'var(--apple-tertiary-label)',
                }}
              />
            </span>
            <span className="tabular-nums-clean text-[11px] min-w-[12px] text-center">
              {presenceUsers.length}
            </span>
          </button>

          {/* Firebase Cloud Sync */}
          <button
            type="button"
            data-testid="island-sync-button"
            data-guide-target="sync"
            aria-label={t('island.sync')}
            title={t('island.sync')}
            onClick={() => setOpenPopover((p) => (p === 'sync' ? 'none' : 'sync'))}
            className={`apple-pressable flex items-center justify-center gap-1.5 px-2.5 min-h-[40px] max-sm:min-h-[44px] sm:min-h-[38px] rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              syncStatus === 'synced'
                ? 'bg-[var(--apple-green)]/15 text-[var(--apple-green-fg)]'
                : syncStatus === 'error'
                ? 'bg-[var(--apple-red)]/15 text-[var(--apple-red-fg)]'
                : 'hover:bg-[var(--apple-fill)]'
            }`}
          >
            {syncStatus === 'synced' ? (
              <Cloud className="w-4 h-4 text-[var(--apple-green-fg)]" />
            ) : (
              <CloudOff className="w-4 h-4 text-[var(--apple-secondary-label)]" />
            )}
            <span className="hidden sm:inline">
              {syncStatus === 'synced'
                ? t('sync.connected')
                : syncStatus === 'connecting'
                ? '…'
                : t('island.sync')}
            </span>
          </button>

          {/* Dark Mode & Fullscreen */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('toggle');
              onToggleDark();
            }}
            aria-label={t('island.dark')}
            title={t('island.dark')}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] cursor-pointer"
          >
            {projectorDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={t('island.fullscreen')}
            title={t('island.fullscreen')}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Collapse island */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('toggle');
              setIslandHidden(true);
            }}
            aria-label={t('island.hide')}
            title={t('island.hideTitle')}
            className="apple-pressable flex items-center justify-center min-h-[40px] min-w-[40px] max-sm:min-h-[44px] max-sm:min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] rounded-full hover:bg-[var(--apple-fill)] text-[var(--apple-secondary-label)] hover:text-[var(--apple-label)] cursor-pointer"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
              <circle cx="8" cy="8" r="6" fillOpacity={0.14} stroke="currentColor" strokeWidth="1.4" fill="none" />
              <circle cx="8" cy="8" r="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
