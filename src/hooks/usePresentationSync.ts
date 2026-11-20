import { useCallback, useEffect, useRef, useState } from 'react';
import { SLIDES_META } from '../data/slidesData';
import { clampSlideIndex, EmulsionState, PatientProfileId } from '../utils/presentationEngine';

export type AppViewMode = 'stage' | 'pembentang' | 'audiens';

export interface LaserPoint {
  active: boolean;
  x: number; // percentage 0..100
  y: number; // percentage 0..100
}

export interface SharedSlideInteractions {
  // Slide 1
  coverCompareId: 'ubat' | 'kosmetik' | 'terlarang';
  // Slide 2
  herbId: 'halia' | 'lidah_buaya' | 'ginseng' | 'asam_jawa';
  herbPrep: 'lesung' | 'rebusan' | 'kapsul';
  ketumOpen: boolean;
  // Slide 3
  selectedDrugId: string;
  selectedPatient: PatientProfileId;
  // Slide 4
  antibioticMode: 'full' | 'stop3';
  antibioticDay: number;
  paracetamolMg: number;
  placeboTab: 'antibiotik' | 'parasetamol' | 'plasebo';
  // Slide 5
  misuseCaseIndex: number;
  npraInput: string;
  // Slide 6
  cosmeticSortCategory: 'all' | 'rias' | 'perawatan' | 'pewangi';
  selectedCosmeticItemId: string;
  // Slide 7
  emulsion: EmulsionState;
  // Slide 8
  cosmeticCompareTab: 'buatan_sendiri' | 'komersial_haram';
  bannedChemicalId: 'merkuri' | 'hidrokuinon' | 'betamethasone' | 'tretinoin';
  // Slide 9
  quizIndex: number;
  quizSelectedOption: string | null;
}

export interface SyncedPresentationState {
  slideIndex: number;
  blackout: boolean;
  projectorDark: boolean;
  laser: LaserPoint;
  interactions: SharedSlideInteractions;
  updatedAt: number;
  senderId: string;
}

export interface DisplayEnvironmentInfo {
  isExtended: boolean;
  screenCount: number | null;
  screenLabel: string;
  permissionState: 'idle' | 'granted' | 'unsupported';
}

const CHANNEL_NAME = 'kimia-5-4-sync-v1';
const STORAGE_KEY = 'kimia-5-4-shared-state-v1';

export const DEFAULT_INTERACTIONS: SharedSlideInteractions = {
  coverCompareId: 'ubat',
  herbId: 'halia',
  herbPrep: 'lesung',
  ketumOpen: false,
  selectedDrugId: 'aspirin',
  selectedPatient: 'pesakit_gastrik',
  antibioticMode: 'stop3',
  antibioticDay: 7,
  paracetamolMg: 2000,
  placeboTab: 'antibiotik',
  misuseCaseIndex: 0,
  npraInput: 'MAL19981234X',
  cosmeticSortCategory: 'all',
  selectedCosmeticItemId: 'gincu',
  emulsion: {
    air: true,
    pengemulsi: false,
    pemekat: false,
    pelembap: true,
    pewangi: false,
    pengawet: true,
    pewarna: false,
  },
  cosmeticCompareTab: 'buatan_sendiri',
  bannedChemicalId: 'merkuri',
  quizIndex: 0,
  quizSelectedOption: null,
};

function createInitialState(senderId: string): SyncedPresentationState {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SyncedPresentationState>;
        if (typeof parsed.slideIndex === 'number' && parsed.interactions) {
          return {
            slideIndex: clampSlideIndex(parsed.slideIndex, SLIDES_META.length),
            blackout: Boolean(parsed.blackout),
            projectorDark: Boolean(parsed.projectorDark),
            laser: parsed.laser ?? { active: false, x: 50, y: 50 },
            interactions: { ...DEFAULT_INTERACTIONS, ...parsed.interactions },
            updatedAt: parsed.updatedAt ?? Date.now(),
            senderId,
          };
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  return {
    slideIndex: 0,
    blackout: false,
    projectorDark: false,
    laser: { active: false, x: 50, y: 50 },
    interactions: DEFAULT_INTERACTIONS,
    updatedAt: Date.now(),
    senderId,
  };
}

export function getInitialModeFromUrl(): AppViewMode {
  if (typeof window === 'undefined') return 'stage';
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode');
  if (modeParam === 'audiens') return 'audiens';
  if (modeParam === 'pembentang') return 'pembentang';
  return 'stage';
}

export function usePresentationSync() {
  const senderIdRef = useRef<string>(`tab-${Math.random().toString(36).slice(2, 9)}`);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const [mode, setMode] = useState<AppViewMode>(() => getInitialModeFromUrl());
  const [state, setState] = useState<SyncedPresentationState>(() => createInitialState(senderIdRef.current));
  const [connectedPeers, setConnectedPeers] = useState<number>(0);

  const [displayInfo, setDisplayInfo] = useState<DisplayEnvironmentInfo>(() => {
    const ext =
      typeof window !== 'undefined' &&
      Boolean((window.screen as Screen & { isExtended?: boolean }).isExtended);
    return {
      isExtended: ext,
      screenCount: ext ? 2 : 1,
      screenLabel: ext ? 'Paparan Luaran / HDMI Dikesan' : 'Paparan Tunggal',
      permissionState: 'idle',
    };
  });

  // Broadcast helper
  const broadcastState = useCallback((next: SyncedPresentationState) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
    try {
      channelRef.current?.postMessage({ type: 'SYNC_STATE', payload: next });
    } catch {
      // ignore channel closed
    }
  }, []);

  const updateSharedState = useCallback(
    (updater: (prev: SyncedPresentationState) => SyncedPresentationState) => {
      setState((prev) => {
        const nextDraft = updater(prev);
        const next: SyncedPresentationState = {
          ...nextDraft,
          slideIndex: clampSlideIndex(nextDraft.slideIndex, SLIDES_META.length),
          updatedAt: Date.now(),
          senderId: senderIdRef.current,
        };
        broadcastState(next);
        return next;
      });
    },
    [broadcastState],
  );

  const patchInteractions = useCallback(
    (partial: Partial<SharedSlideInteractions>) => {
      updateSharedState((prev) => ({
        ...prev,
        interactions: {
          ...prev.interactions,
          ...partial,
        },
      }));
    },
    [updateSharedState],
  );

  const goToSlide = useCallback(
    (targetIndex: number) => {
      updateSharedState((prev) => ({
        ...prev,
        slideIndex: clampSlideIndex(targetIndex, SLIDES_META.length),
      }));
    },
    [updateSharedState],
  );

  const nextSlide = useCallback(() => {
    updateSharedState((prev) => ({
      ...prev,
      slideIndex: clampSlideIndex(prev.slideIndex + 1, SLIDES_META.length),
    }));
  }, [updateSharedState]);

  const prevSlide = useCallback(() => {
    updateSharedState((prev) => ({
      ...prev,
      slideIndex: clampSlideIndex(prev.slideIndex - 1, SLIDES_META.length),
    }));
  }, [updateSharedState]);

  const toggleBlackout = useCallback(() => {
    updateSharedState((prev) => ({ ...prev, blackout: !prev.blackout }));
  }, [updateSharedState]);

  const toggleProjectorDark = useCallback(() => {
    updateSharedState((prev) => ({ ...prev, projectorDark: !prev.projectorDark }));
  }, [updateSharedState]);

  const setLaserPoint = useCallback(
    (laser: LaserPoint) => {
      updateSharedState((prev) => ({ ...prev, laser }));
    },
    [updateSharedState],
  );

  const resetPresentation = useCallback(() => {
    updateSharedState(() => ({
      slideIndex: 0,
      blackout: false,
      projectorDark: false,
      laser: { active: false, x: 50, y: 50 },
      interactions: DEFAULT_INTERACTIONS,
      updatedAt: Date.now(),
      senderId: senderIdRef.current,
    }));
  }, [updateSharedState]);

  // Setup BroadcastChannel + storage fallback + peer heartbeat
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleIncoming = (incoming: SyncedPresentationState) => {
      if (!incoming || incoming.senderId === senderIdRef.current) return;
      setState((prev) => {
        if (incoming.updatedAt < prev.updatedAt) return prev;
        return incoming;
      });
    };

    const peers = new Set<string>();
    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = bc;
      bc.onmessage = (event) => {
        const msg = event.data;
        if (!msg) return;
        if (msg.type === 'SYNC_STATE') {
          handleIncoming(msg.payload);
        } else if (msg.type === 'PING' && msg.senderId !== senderIdRef.current) {
          peers.add(msg.senderId);
          setConnectedPeers(peers.size);
          bc?.postMessage({ type: 'PONG', senderId: senderIdRef.current });
        } else if (msg.type === 'PONG' && msg.senderId !== senderIdRef.current) {
          peers.add(msg.senderId);
          setConnectedPeers(peers.size);
        } else if (msg.type === 'BYE' && msg.senderId) {
          peers.delete(msg.senderId);
          setConnectedPeers(peers.size);
        }
      };
      bc.postMessage({ type: 'PING', senderId: senderIdRef.current });
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          handleIncoming(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);

    const onUnload = () => {
      try {
        bc?.postMessage({ type: 'BYE', senderId: senderIdRef.current });
      } catch {
        // ignore
      }
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      onUnload();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('beforeunload', onUnload);
      bc?.close();
      channelRef.current = null;
    };
  }, []);

  // Poll window.screen.isExtended for live HDMI plug/unplug detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkExtended = () => {
      const ext = Boolean((window.screen as Screen & { isExtended?: boolean }).isExtended);
      setDisplayInfo((prev) => {
        if (prev.permissionState === 'granted') return prev;
        return {
          ...prev,
          isExtended: ext,
          screenCount: ext ? 2 : 1,
          screenLabel: ext ? 'Paparan Luaran / HDMI Dikesan' : 'Paparan Tunggal',
        };
      });
    };
    checkExtended();
    const interval = window.setInterval(checkExtended, 2500);
    window.addEventListener('resize', checkExtended);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', checkExtended);
    };
  }, []);

  const probeExternalDisplays = useCallback(async () => {
    const win = window as Window & {
      getScreenDetails?: () => Promise<{ screens: Array<{ label?: string; isPrimary?: boolean }> }>;
    };
    if (typeof win.getScreenDetails !== 'function') {
      const ext = Boolean((window.screen as Screen & { isExtended?: boolean }).isExtended);
      setDisplayInfo({
        isExtended: ext,
        screenCount: ext ? 2 : 1,
        screenLabel: ext ? 'Paparan Luaran / HDMI Dikesan' : 'Mod Sambungan HDMI Manual Sedia',
        permissionState: 'unsupported',
      });
      return;
    }
    try {
      const details = await win.getScreenDetails();
      const count = details.screens.length;
      const ext = count > 1;
      const secondary = details.screens.find((s) => !s.isPrimary);
      setDisplayInfo({
        isExtended: ext,
        screenCount: count,
        screenLabel: ext
          ? `HDMI Aktif: ${secondary?.label || 'Projektor / TV'} (${count} skrin)`
          : '1 Skrin Dikesan — Sambung kabel HDMI & pilih Extend Display',
        permissionState: 'granted',
      });
    } catch {
      const ext = Boolean((window.screen as Screen & { isExtended?: boolean }).isExtended);
      setDisplayInfo({
        isExtended: ext,
        screenCount: ext ? 2 : 1,
        screenLabel: ext ? 'Paparan Luaran / HDMI Dikesan' : 'Paparan Tunggal',
        permissionState: 'idle',
      });
    }
  }, []);

  return {
    mode,
    setMode,
    state,
    connectedPeers,
    displayInfo,
    probeExternalDisplays,
    goToSlide,
    nextSlide,
    prevSlide,
    toggleBlackout,
    toggleProjectorDark,
    setLaserPoint,
    patchInteractions,
    resetPresentation,
  };
}
