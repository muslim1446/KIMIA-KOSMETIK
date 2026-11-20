import { useCallback, useEffect, useRef, useState } from 'react';
import { SLIDES_META } from '../data/slidesData';
import { clampSlideIndex, EmulsionState, PatientProfileId } from '../utils/presentationEngine';

export type AppViewMode = 'stage' | 'audiens';

export interface LaserPoint {
  active: boolean;
  x: number;
  y: number;
}

export interface SharedSlideInteractions {
  molecularLens: boolean;
  coverCompareId: 'ubat' | 'kosmetik' | 'terlarang';
  herbId: 'halia' | 'lidah_buaya' | 'ginseng' | 'asam_jawa';
  herbPrep: 'lesung' | 'rebusan' | 'kapsul';
  ketumOpen: boolean;
  drugCategoryId: 'analgesik' | 'antimikrob' | 'psikotik' | 'antialergi' | 'kortikosteroid';
  selectedDrugId: string;
  selectedPatient: PatientProfileId;
  antibioticMode: 'full' | 'stop3';
  antibioticDay: number;
  paracetamolMg: number;
  placeboTab: 'antibiotik' | 'parasetamol' | 'plasebo';
  misuseCaseIndex: number;
  npraInput: string;
  cosmeticSortCategory: 'all' | 'rias' | 'perawatan' | 'pewangi';
  selectedCosmeticItemId: string;
  emulsion: EmulsionState;
  cosmeticCompareTab: 'buatan_sendiri' | 'komersial_haram';
  bannedChemicalId: 'merkuri' | 'hidrokuinon' | 'betamethasone' | 'tretinoin';
  quizIndex: number;
  quizSelectedOption: string | null;
  explanationRevealed: boolean;
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

const CHANNEL_NAME = 'kimia-5-4-sync-v2';
const STORAGE_KEY = 'kimia-5-4-shared-state-v2';

export const DEFAULT_INTERACTIONS: SharedSlideInteractions = {
  molecularLens: false,
  coverCompareId: 'ubat',
  herbId: 'halia',
  herbPrep: 'lesung',
  ketumOpen: false,
  drugCategoryId: 'analgesik',
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
  explanationRevealed: false,
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
  return 'stage';
}

export function usePresentationSync(
  onLocalBroadcast?: (next: SyncedPresentationState) => void,
) {
  const senderIdRef = useRef<string>(`tab-${Math.random().toString(36).slice(2, 9)}`);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onLocalBroadcastRef = useRef(onLocalBroadcast);
  onLocalBroadcastRef.current = onLocalBroadcast;

  const [mode] = useState<AppViewMode>(() => getInitialModeFromUrl());
  const [state, setState] = useState<SyncedPresentationState>(() => createInitialState(senderIdRef.current));

  const broadcastState = useCallback((next: SyncedPresentationState) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
    }
    try {
      channelRef.current?.postMessage({ type: 'SYNC_STATE', payload: next });
    } catch {
    }
    onLocalBroadcastRef.current?.(next);
  }, []);

  const applyRemoteState = useCallback((remote: Partial<SyncedPresentationState>) => {
    setState((prev) => {
      const nextIndex =
        typeof remote.slideIndex === 'number'
          ? clampSlideIndex(remote.slideIndex, SLIDES_META.length)
          : prev.slideIndex;
      const nextBlackout =
        typeof remote.blackout === 'boolean' ? remote.blackout : prev.blackout;
      const nextDark =
        typeof remote.projectorDark === 'boolean' ? remote.projectorDark : prev.projectorDark;
      const nextLaser = remote.laser ?? prev.laser;
      const nextInteractions = remote.interactions
        ? { ...DEFAULT_INTERACTIONS, ...remote.interactions }
        : prev.interactions;

      const next: SyncedPresentationState = {
        ...prev,
        slideIndex: nextIndex,
        blackout: nextBlackout,
        projectorDark: nextDark,
        laser: nextLaser,
        interactions: nextInteractions,
        updatedAt: Date.now(),
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
      }
      return next;
    });
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleIncoming = (incoming: SyncedPresentationState) => {
      if (!incoming || incoming.senderId === senderIdRef.current) return;
      setState((prev) => {
        if (incoming.updatedAt < prev.updatedAt) return prev;
        return incoming;
      });
    };

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
          bc?.postMessage({ type: 'PONG', senderId: senderIdRef.current });
        }
      };
      bc.postMessage({ type: 'PING', senderId: senderIdRef.current });
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          handleIncoming(JSON.parse(e.newValue));
        } catch {
        }
      }
    };
    window.addEventListener('storage', onStorage);

    const onUnload = () => {
      try {
        bc?.postMessage({ type: 'BYE', senderId: senderIdRef.current });
      } catch {
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

  return {
    mode,
    state,
    goToSlide,
    nextSlide,
    prevSlide,
    toggleBlackout,
    toggleProjectorDark,
    setLaserPoint,
    patchInteractions,
    resetPresentation,
    applyRemoteState,
  };
}
