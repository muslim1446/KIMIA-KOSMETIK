import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInAnonymously,
  User,
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  filterCurrentTextEdits,
  getRootSlideScope,
  mergeIdList,
  mergeLiveStrokeMap,
  mergeStrokeBatch,
  mergeStrokeList,
  mergeTextEditMap,
  PenStroke,
  pruneExpiredTempStrokes,
  pruneStaleLiveStrokes,
  removeStrokesFromList,
  sanitizeTextOverride,
  SlideImageItem,
  SlidePdfItem,
  SlideTextItem,
  stampCurrentTextEdits,
  TEXT_EDIT_EPOCH_KEY,
  TEXT_EDIT_EPOCH_VALUE,
} from '../utils/annotationEngine';
import {
  BoardUndoAction,
  createEmptyUndoRedoState,
  imagePatchChanged,
  ImageGeometryPatch,
  pdfPatchChanged,
  PdfGeometryPatch,
  pickImagePatch,
  pickPdfPatch,
  pickSlideTextPatch,
  popRedoAction,
  popUndoAction,
  pushUndoAction,
  SlideTextPatch,
  slideTextPatchChanged,
  SlideUndoRedoState,
} from '../utils/undoHistory';
import {
  PRESENCE_HEARTBEAT_MS,
  PRESENCE_ONLINE_WINDOW_MS,
  PresenceLocation,
  PresenceUser,
  cachePresenceLocation,
  loadCachedPresenceLocation,
  loadOrCreateLocalAuthorId,
  loadPresenceDisplayName,
  normalizePresenceLocation,
  savePresenceDisplayName,
} from '../utils/presence';
import { LaserPoint, SyncedPresentationState } from './usePresentationSync';
import {
  PdfSource,
  RoomPdfEntry,
  RoomPdfFileItem,
  pdfStorageId,
  uploadPdfToStorage,
} from '../utils/pdfUtils';

export type BoardSyncStatus = 'local' | 'connecting' | 'synced' | 'error';

export interface LiveStrokeMap {
  [authorId: string]: PenStroke;
}

interface LocalBoardStorage {
  strokesBySlide: Record<number, PenStroke[]>;
  textEditsBySlide: Record<number, Record<string, string>>;
  images: SlideImageItem[];
  texts?: SlideTextItem[];
  pdfPages?: SlidePdfItem[];
}

const LOCAL_BOARD_KEY = 'kimia-5-4-board-v3';
const LOCAL_PDF_PAGES_KEY = 'kimia-5-4-pdf-pages-v1';
const BOARD_BC_NAME = 'kimia-5-4-board-channel-v3';
const DEFAULT_ROOM_ID = 'kimia-5-4-main';
const DEFAULT_JOIN_CODE = 'KIMIA54';

function loadLocalPdfPages(): SlidePdfItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_PDF_PAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SlidePdfItem[]) : [];
  } catch {
    return [];
  }
}

function saveLocalPdfPages(pdfPages: SlidePdfItem[]): void {
  if (typeof window === 'undefined') return;
  // Data URLs make PDF frames much larger than strokes, so keep this in a
  // separate key and gracefully trim the oldest frames if the quota is tight.
  let items = pdfPages.slice(-12);
  while (items.length > 0) {
    try {
      window.localStorage.setItem(LOCAL_PDF_PAGES_KEY, JSON.stringify(items));
      return;
    } catch {
      items = items.slice(Math.ceil(items.length / 2));
    }
  }
  try {
    window.localStorage.removeItem(LOCAL_PDF_PAGES_KEY);
  } catch {
    // Ignore storage failures
  }
}

function getInitialRoomParams(): { roomId: string; joinCode: string } {
  if (typeof window === 'undefined') {
    return { roomId: DEFAULT_ROOM_ID, joinCode: DEFAULT_JOIN_CODE };
  }
  const params = new URLSearchParams(window.location.search);
  const rawRoom = params.get('room')?.trim();
  const rawCode = params.get('code')?.trim();
  const savedRoom = window.localStorage.getItem('kimia-5-4-room-id');
  const savedCode = window.localStorage.getItem('kimia-5-4-room-code');
  const cleanId = (val: string | null | undefined, fallback: string) =>
    val && /^[a-zA-Z0-9_-]{3,64}$/.test(val) ? val : fallback;

  return {
    roomId: cleanId(rawRoom || savedRoom, DEFAULT_ROOM_ID),
    joinCode: cleanId(rawCode || savedCode, DEFAULT_JOIN_CODE),
  };
}

function loadLocalBoard(): LocalBoardStorage {
  if (typeof window === 'undefined') {
    return { strokesBySlide: {}, textEditsBySlide: {}, images: [], texts: [], pdfPages: [] };
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_BOARD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalBoardStorage>;
      const rawTextEdits = parsed.textEditsBySlide ?? {};
      const cleanedTextEdits: Record<number, Record<string, string>> = {};
      for (const [slideKey, slideMap] of Object.entries(rawTextEdits)) {
        const idx = Number(slideKey);
        if (!Number.isFinite(idx)) continue;
        const { edits } = filterCurrentTextEdits(slideMap);
        if (Object.keys(edits).length > 0) {
          cleanedTextEdits[idx] = edits;
        }
      }
      return {
        strokesBySlide: parsed.strokesBySlide ?? {},
        textEditsBySlide: cleanedTextEdits,
        images: Array.isArray(parsed.images) ? parsed.images : [],
        texts: Array.isArray(parsed.texts) ? parsed.texts : [],
        pdfPages: loadLocalPdfPages(),
      };
    }
  } catch {
    // Ignore corrupt localStorage
  }
  return {
    strokesBySlide: {},
    textEditsBySlide: {},
    images: [],
    texts: [],
    pdfPages: loadLocalPdfPages(),
  };
}

function saveLocalBoard(data: LocalBoardStorage) {
  if (typeof window === 'undefined') return;
  try {
    const { pdfPages, textEditsBySlide, ...rest } = data;
    const stampedTextEditsBySlide: Record<number, Record<string, string>> = {};
    for (const [slideKey, slideMap] of Object.entries(textEditsBySlide)) {
      if (slideMap && Object.keys(slideMap).length > 0) {
        stampedTextEditsBySlide[Number(slideKey)] = stampCurrentTextEdits(slideMap);
      }
    }
    window.localStorage.setItem(
      LOCAL_BOARD_KEY,
      JSON.stringify({ ...rest, textEditsBySlide: stampedTextEditsBySlide }),
    );
    if (pdfPages) saveLocalPdfPages(pdfPages);
  } catch {
    // Ignore quota overflow in localStorage
  }
}

function makeClientId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function timestampToMillis(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

function clampSlideText(text: SlideTextItem): SlideTextItem {
  const finite = (value: number, fallback: number) =>
    Number.isFinite(value) ? value : fallback;
  return {
    ...text,
    slideIndex: Math.max(0, Math.min(8, Math.trunc(finite(text.slideIndex, 0)))),
    scopeKey: (text.scopeKey ?? '').slice(0, 160),
    x: Math.round(finite(text.x, 380)),
    y: Math.round(finite(text.y, 200)),
    width: Math.max(120, Math.min(1280, Math.round(finite(text.width, 320)))),
    height: Math.max(48, Math.min(720, Math.round(finite(text.height, 100)))),
    text: (text.text ?? '').replace(/\r\n/g, '\n').slice(0, 2000),
    fontSize: Math.max(8, Math.min(160, Math.round(finite(text.fontSize, 20)))),
    color: (text.color ?? '#1C1917').slice(0, 32),
    isBold: Boolean(text.isBold),
    bgColor: (text.bgColor ?? 'transparent').slice(0, 32),
  };
}

function clampSlidePdf(pdf: SlidePdfItem): SlidePdfItem {
  const finite = (value: number, fallback: number) =>
    Number.isFinite(value) ? value : fallback;
  const pageCount = Math.max(1, Math.min(10_000, Math.trunc(finite(pdf.pageCount, 1))));
  const pageNumber = Math.max(1, Math.min(pageCount, Math.trunc(finite(pdf.pageNumber, 1))));
  return {
    ...pdf,
    slideIndex: Math.max(0, Math.min(8, Math.trunc(finite(pdf.slideIndex, 0)))),
    scopeKey: (pdf.scopeKey ?? '').slice(0, 160),
    x: Math.round(finite(pdf.x, 420)),
    y: Math.round(finite(pdf.y, 120)),
    width: Math.max(40, Math.min(1500, Math.round(finite(pdf.width, 360)))),
    height: Math.max(40, Math.min(1600, Math.round(finite(pdf.height, 509)))),
    dataUrl: (pdf.dataUrl ?? '').slice(0, 340_000),
    fileName: (pdf.fileName ?? 'dokumen.pdf').slice(0, 160),
    pageNumber,
    pageCount,
  };
}

function timestampToMillisOrZero(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

interface UseCollaborativeBoardArgs {
  currentSlideIndex: number;
  presentationState: SyncedPresentationState;
  onRemotePresentationSync: (remote: Partial<SyncedPresentationState>) => void;
}

export function useCollaborativeBoard({
  currentSlideIndex,
  presentationState,
  onRemotePresentationSync,
}: UseCollaborativeBoardArgs) {
  const initialBoard = useMemo(() => loadLocalBoard(), []);
  const initialRoom = useMemo(() => getInitialRoomParams(), []);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [roomId, setRoomId] = useState(initialRoom.roomId);
  const [joinCode, setJoinCode] = useState(initialRoom.joinCode);
  const [syncStatus, setSyncStatus] = useState<BoardSyncStatus>('connecting');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [anonBlocked, setAnonBlocked] = useState(false);
  // Channels whose live data stream is blocked (e.g. Firestore rules not published).
  // Drives a prominent, unmissable warning so a silent sync failure can never happen.
  const [blockedSyncChannels, setBlockedSyncChannels] = useState<string[]>([]);

  const [strokesBySlide, setStrokesBySlide] = useState<Record<number, PenStroke[]>>(
    initialBoard.strokesBySlide,
  );
  const [tempStrokesBySlide, setTempStrokesBySlide] = useState<Record<number, PenStroke[]>>({});
  const [liveStrokesBySlide, setLiveStrokesBySlide] = useState<Record<number, LiveStrokeMap>>({});
  const [textEditsBySlide, setTextEditsBySlide] = useState<Record<number, Record<string, string>>>(
    initialBoard.textEditsBySlide,
  );
  const [images, setImages] = useState<SlideImageItem[]>(initialBoard.images);
  const [texts, setTexts] = useState<SlideTextItem[]>(initialBoard.texts ?? []);
  const [pdfPages, setPdfPages] = useState<SlidePdfItem[]>(initialBoard.pdfPages ?? []);
  const [pdfFiles, setPdfFiles] = useState<RoomPdfFileItem[]>([]);
  const [undoRedoState, setUndoRedoState] = useState<SlideUndoRedoState>(() =>
    createEmptyUndoRedoState(),
  );

  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [presenceTick, setPresenceTick] = useState(0);
  const [presenceLocation, setPresenceLocation] = useState<PresenceLocation | null>(() =>
    loadCachedPresenceLocation(),
  );
  const [presenceLocationBusy, setPresenceLocationBusy] = useState(false);
  const [presenceLocationError, setPresenceLocationError] = useState<string | null>(null);
  const [presenceName, setPresenceName] = useState<string>(() => loadPresenceDisplayName());

  const localAuthorIdRef = useRef<string>(loadOrCreateLocalAuthorId());
  const anonAttemptedRef = useRef(false);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const roomImageIdsRef = useRef<string[]>([]);
  const slideTxQueueRef = useRef<Record<number, Promise<void>>>({});
  const ephemeralTxQueueRef = useRef<Record<number, Promise<void>>>({});
  const clearedLegacyTextSlidesRef = useRef<Set<string>>(new Set());
  const lastLocalLaserPushRef = useRef<number>(0);
  const lastLocalLaserActiveRef = useRef<boolean>(false);
  const lastLocalRoomPushRef = useRef<number>(0);
  const laserPushTimerRef = useRef<number | null>(null);
  const pendingLaserRef = useRef<LaserPoint | null>(null);
  const presentationStateRef = useRef(presentationState);
  presentationStateRef.current = presentationState;

  const strokesRef = useRef(strokesBySlide);
  strokesRef.current = strokesBySlide;
  const tempStrokesRef = useRef(tempStrokesBySlide);
  tempStrokesRef.current = tempStrokesBySlide;
  const liveStrokesRef = useRef(liveStrokesBySlide);
  liveStrokesRef.current = liveStrokesBySlide;
  const textEditsRef = useRef(textEditsBySlide);
  textEditsRef.current = textEditsBySlide;
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const textsRef = useRef(texts);
  textsRef.current = texts;
  const pdfPagesRef = useRef(pdfPages);
  pdfPagesRef.current = pdfPages;
  const undoRedoRef = useRef(undoRedoState);
  undoRedoRef.current = undoRedoState;
  const pendingImageBeforeRef = useRef<Record<string, ImageGeometryPatch>>({});
  const pendingTextBeforeRef = useRef<Record<string, SlideTextPatch>>({});
  const pendingPdfBeforeRef = useRef<Record<string, PdfGeometryPatch>>({});

  const presenceLocationRef = useRef<PresenceLocation | null>(presenceLocation);
  presenceLocationRef.current = presenceLocation;

  // Open-world sync: never depends on auth. A stable per-tab author id is used
  // for labels/presence, so writes flow even when anonymous sign-in is unavailable.
  const isFirebaseActive = Boolean(authReady && syncStatus === 'synced');
  const currentAuthorId = user?.uid ?? localAuthorIdRef.current;

  // Track per-channel health so a blocked stream (most commonly unpublished
  // Firestore rules) surfaces as a loud warning instead of a silent no-sync.
  const markSyncChannel = useCallback((channel: string, blocked: boolean) => {
    setBlockedSyncChannels((prev) => {
      const has = prev.includes(channel);
      if (blocked && !has) return [...prev, channel];
      if (!blocked && has) return prev.filter((item) => item !== channel);
      return prev;
    });
  }, []);

  const syncWarning =
    blockedSyncChannels.length > 0
      ? 'Penyegerakan langsung TERGENDALA — nota teks, PDF dan kehadiran mungkin TIDAK sampai ke peranti lain. ' +
        'Sebab paling biasa: peraturan Firestore (firestore.rules) belum diterbitkan. ' +
        'Buka Firebase Console → Firestore Database → Rules, tampal kandungan firestore.rules, kemudian klik Publish.'
      : null;

  // Record a failed write/stream so the user is told instead of losing data silently.
  const reportSyncFailure = useCallback(
    (channel: string, err: unknown, op: OperationType, path: string) => {
      const code = (err as { code?: string } | null | undefined)?.code ?? '';
      if (code === 'permission-denied' || code === 'PERMISSION_DENIED') {
        markSyncChannel(channel, true);
      }
      try {
        handleFirestoreError(err, op, path);
      } catch {
        // Already surfaced to the user through syncWarning.
      }
    },
    [markSyncChannel],
  );

  const defaultPresenceName = (
    user?.displayName ||
    user?.email ||
    (user?.isAnonymous
      ? `Tetamu-${user.uid.slice(0, 5)}`
      : `Tetamu-${localAuthorIdRef.current.slice(-4)}`)
  ).slice(0, 80);
  const effectivePresenceName = (presenceName.trim() || defaultPresenceName).slice(0, 80);
  const effectivePresenceNameRef = useRef(effectivePresenceName);
  effectivePresenceNameRef.current = effectivePresenceName;

  // Persist local board & broadcast to same-browser tabs (?mode=audiens)
  useEffect(() => {
    saveLocalBoard({
      strokesBySlide,
      textEditsBySlide,
      images,
      texts,
      pdfPages,
    });
  }, [strokesBySlide, textEditsBySlide, images, texts, pdfPages]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel(BOARD_BC_NAME);
    bcRef.current = bc;
    bc.onmessage = (event) => {
      const msg = event.data;
      if (!msg || msg.sender === localAuthorIdRef.current) return;
      if (msg.type === 'BOARD_FULL') {
        if (msg.strokesBySlide) setStrokesBySlide(msg.strokesBySlide);
        if (msg.textEditsBySlide) setTextEditsBySlide(msg.textEditsBySlide);
        if (msg.images) setImages(msg.images);
        if (msg.texts) setTexts(msg.texts);
        if (msg.pdfPages) setPdfPages(msg.pdfPages);
      } else if (msg.type === 'EPHEMERAL_UPDATE') {
        setTempStrokesBySlide((prev) => ({
          ...prev,
          [msg.slideIndex]: msg.tempStrokes,
        }));
        setLiveStrokesBySlide((prev) => ({
          ...prev,
          [msg.slideIndex]: msg.liveStrokes,
        }));
      }
    };
    return () => {
      bc.close();
      bcRef.current = null;
    };
  }, []);

  const postLocalBoardSync = useCallback(
    (next: Partial<LocalBoardStorage>) => {
      try {
        bcRef.current?.postMessage({
          type: 'BOARD_FULL',
          sender: localAuthorIdRef.current,
          strokesBySlide: next.strokesBySlide ?? strokesRef.current,
          textEditsBySlide: next.textEditsBySlide ?? textEditsRef.current,
          images: next.images ?? imagesRef.current,
          texts: next.texts ?? textsRef.current,
          pdfPages: next.pdfPages ?? pdfPagesRef.current,
        });
      } catch {
        // Ignore BroadcastChannel errors
      }
    },
    [],
  );

  // Best-effort anonymous identity ONLY. Sync itself is open-world and never
  // waits on auth — if sign-in is disabled or hangs, we fall back to a stable
  // per-tab id and keep syncing, so a room is never blocked by a login problem.
  useEffect(() => {
    let authSettled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (authSettled) return;
      authSettled = true;
      setAuthReady(true);
    }, 5000);

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        authSettled = true;
        window.clearTimeout(fallbackTimer);
        setUser(firebaseUser);
        setAuthReady(true);
        setAnonBlocked(false);
        return;
      }

      if (!anonAttemptedRef.current) {
        anonAttemptedRef.current = true;
        setSyncStatus('connecting');
        void signInAnonymously(auth).catch(() => {
          authSettled = true;
          window.clearTimeout(fallbackTimer);
          setUser(null);
          setAuthReady(true);
          setAnonBlocked(true);
        });
        return;
      }

      authSettled = true;
      window.clearTimeout(fallbackTimer);
      setUser(null);
      setAuthReady(true);
    });

    return () => {
      authSettled = true;
      window.clearTimeout(fallbackTimer);
      unsub();
    };
  }, []);

  // Connect & Subscribe to Firestore Room. Open-world: gated only on auth settling
  // (never on having a user), so streaming starts even with anonymous auth disabled.
  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;
    const unsubs: Unsubscribe[] = [];
    const imageUnsubs = new Map<string, Unsubscribe>();

    const setupRoomAndListen = async () => {
      setSyncStatus('connecting');
      setSyncError(null);
      // Stable author label: real uid when available, otherwise per-tab id.
      const authorId = user?.uid ?? localAuthorIdRef.current;

      const safeRoomId = /^[a-zA-Z0-9_-]{3,128}$/.test(roomId) ? roomId : DEFAULT_ROOM_ID;
      const safeJoinCode = /^[a-zA-Z0-9_-]{3,32}$/.test(joinCode) ? joinCode : DEFAULT_JOIN_CODE;
      const roomRef = doc(db, 'rooms', safeRoomId);
      const memberRef = doc(db, 'rooms', safeRoomId, 'members', authorId);
      const memberDisplayName = (
        user?.displayName ||
        user?.email ||
        (user?.isAnonymous ? `Tetamu-${user.uid.slice(0, 5)}` : `Tetamu-${authorId.slice(-4)}`)
      ).slice(0, 80);

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), 7000),
        );

        // Open rules allow reads without auth, so check whether the room exists directly.
        const roomSnap = await Promise.race([getDoc(roomRef), timeoutPromise]);

        if (cancelled) return;

        if (roomSnap.exists()) {
          // Room already exists — register/refresh this visitor's membership card.
          // Membership is cosmetic; live sync never depends on it.
          await setDoc(
            memberRef,
            {
              uid: authorId,
              displayName: memberDisplayName,
              role: 'editor',
              joinCode: safeJoinCode,
              joinedAt: serverTimestamp(),
            },
            { merge: true },
          ).catch(() => {
            // Ignored — board data flows through its own collections.
          });
        } else {
          // First-ever join: create the room shell + owner membership atomically,
          // then seed any offline-local boards/images/texts so nothing is lost.
          const createBatch = writeBatch(db);
          const ps = presentationStateRef.current;

          createBatch.set(roomRef, {
            ownerId: authorId,
            title: 'Pembentangan Kimia 5.4',
            joinCode: safeJoinCode,
            slideIndex: ps.slideIndex,
            blackout: ps.blackout,
            projectorDark: ps.projectorDark,
            laser: ps.laser,
            interactions: ps.interactions,
            imageIds: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          createBatch.set(memberRef, {
            uid: authorId,
            displayName: memberDisplayName,
            role: 'owner',
            joinCode: safeJoinCode,
            joinedAt: serverTimestamp(),
          });
          await createBatch.commit();

          // Seed any local offline strokes/edits/images/texts so nothing is lost.
          const localImgs = imagesRef.current.slice(-50);
          const localTexts = textsRef.current.slice(-60);
          const hasLocalSlides = Array.from({ length: 9 }).some(
            (_, i) =>
              (strokesRef.current[i]?.length ?? 0) > 0 ||
              Object.keys(textEditsRef.current[i] ?? {}).length > 0,
          );
          if (hasLocalSlides || localImgs.length > 0 || localTexts.length > 0) {
            const seedBatch = writeBatch(db);
            for (let i = 0; i < 9; i++) {
              const localStrokes = (strokesRef.current[i] ?? []).slice(-400);
              const localEdits = Object.fromEntries(
                Object.entries(textEditsRef.current[i] ?? {}).slice(-199),
              );
              if (localStrokes.length > 0 || Object.keys(localEdits).length > 0) {
                seedBatch.set(doc(db, 'rooms', safeRoomId, 'slides', `slide_${i}`), {
                  roomId: safeRoomId,
                  slideIndex: i,
                  strokes: localStrokes,
                  textEdits:
                    Object.keys(localEdits).length > 0
                      ? stampCurrentTextEdits(localEdits)
                      : { [TEXT_EDIT_EPOCH_KEY]: TEXT_EDIT_EPOCH_VALUE },
                  updatedAt: serverTimestamp(),
                  updatedBy: authorId,
                });
              }
            }
            if (localImgs.length > 0) {
              for (const img of localImgs) {
                seedBatch.set(doc(db, 'rooms', safeRoomId, 'images', img.id), {
                  id: img.id,
                  roomId: safeRoomId,
                  slideIndex: img.slideIndex,
                  scopeKey: img.scopeKey.slice(0, 160),
                  x: Math.round(img.x),
                  y: Math.round(img.y),
                  width: Math.max(24, Math.min(1600, Math.round(img.width))),
                  height: Math.max(24, Math.min(1200, Math.round(img.height))),
                  dataUrl: img.dataUrl.slice(0, 360_000),
                  authorId: authorId,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
              }
              seedBatch.update(roomRef, {
                imageIds: localImgs.map((img) => img.id),
                updatedAt: serverTimestamp(),
              });
            }
            for (const text of localTexts) {
              seedBatch.set(doc(db, 'rooms', safeRoomId, 'texts', text.id), {
                id: text.id,
                roomId: safeRoomId,
                slideIndex: Math.max(0, Math.min(8, Math.trunc(text.slideIndex))),
                scopeKey: text.scopeKey.slice(0, 160),
                x: Math.round(text.x),
                y: Math.round(text.y),
                width: Math.max(120, Math.min(1280, Math.round(text.width))),
                height: Math.max(48, Math.min(720, Math.round(text.height))),
                text: text.text.replace(/\r\n/g, '\n').slice(0, 2000),
                fontSize: Math.max(8, Math.min(160, Math.round(text.fontSize))),
                color: text.color.slice(0, 32),
                isBold: Boolean(text.isBold),
                bgColor: (text.bgColor ?? 'transparent').slice(0, 32),
                authorId: authorId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
            await seedBatch.commit();
          }
        }

        if (cancelled) return;

        // 1. Listen to Room state & image index
        const unsubRoom = onSnapshot(
          roomRef,
          (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            if (!snap.metadata.hasPendingWrites) {
              const suppressRoomEcho = Date.now() - lastLocalRoomPushRef.current < 900;
              const suppressLaserEcho =
                lastLocalLaserActiveRef.current || Date.now() - lastLocalLaserPushRef.current < 450;
              if (!suppressRoomEcho) {
                onRemotePresentationSync({
                  slideIndex: typeof data.slideIndex === 'number' ? data.slideIndex : 0,
                  blackout: Boolean(data.blackout),
                  projectorDark: Boolean(data.projectorDark),
                  ...(suppressLaserEcho ? {} : { laser: data.laser }),
                  interactions: data.interactions,
                });
              }
            }

            const nextIds: string[] = Array.isArray(data.imageIds) ? data.imageIds : [];
            roomImageIdsRef.current = nextIds;

            for (const imgId of nextIds) {
              if (!imageUnsubs.has(imgId)) {
                const imgRef = doc(db, 'rooms', safeRoomId, 'images', imgId);
                const u = onSnapshot(
                  imgRef,
                  (imgSnap) => {
                    if (!imgSnap.exists()) {
                      setImages((prev) => prev.filter((item) => item.id !== imgId));
                      return;
                    }
                    const d = imgSnap.data();
                    const item: SlideImageItem = {
                      id: d.id,
                      slideIndex: d.slideIndex,
                      scopeKey: d.scopeKey,
                      x: d.x,
                      y: d.y,
                      width: d.width,
                      height: d.height,
                      dataUrl: d.dataUrl,
                      authorId: d.authorId,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    };
                    setImages((prev) => {
                      const idx = prev.findIndex((p) => p.id === item.id);
                      if (idx === -1) return [...prev, item];
                      const copy = [...prev];
                      copy[idx] = item;
                      return copy;
                    });
                  },
                  (err) =>
                    handleFirestoreError(err, OperationType.GET, `rooms/${safeRoomId}/images/${imgId}`),
                );
                imageUnsubs.set(imgId, u);
              }
            }

            const idSet = new Set(nextIds);
            for (const [existingId, u] of imageUnsubs.entries()) {
              if (!idSet.has(existingId)) {
                u();
                imageUnsubs.delete(existingId);
              }
            }
            setImages((prev) => prev.filter((item) => idSet.has(item.id)));
          },
          (err) => {
            setSyncStatus('error');
            setSyncError('Akses bilik ditolak atau kod bilik tidak sepadan.');
            handleFirestoreError(err, OperationType.GET, `rooms/${safeRoomId}`);
          },
        );
        unsubs.push(unsubRoom);

        // 1b. Listen to movable text boxes (subcollection keeps the room document small)
        const textsCollectionRef = collection(db, 'rooms', safeRoomId, 'texts');
        let textsHydrated = false;
        const unsubTexts = onSnapshot(
          textsCollectionRef,
          (snap) => {
            markSyncChannel('texts', false);
            const remoteTexts: SlideTextItem[] = [];
            for (const textSnap of snap.docs) {
              const d = textSnap.data();
              if (!d || typeof d !== 'object') continue;
              const slideIdx = Number(d.slideIndex);
              if (!Number.isFinite(slideIdx)) continue;
              remoteTexts.push({
                id: typeof d.id === 'string' && d.id ? d.id : textSnap.id,
                slideIndex: Math.max(0, Math.min(8, Math.trunc(slideIdx))),
                scopeKey:
                  typeof d.scopeKey === 'string' && d.scopeKey
                    ? d.scopeKey
                    : getRootSlideScope(Math.trunc(slideIdx)),
                x: Number.isFinite(Number(d.x)) ? Number(d.x) : 120,
                y: Number.isFinite(Number(d.y)) ? Number(d.y) : 120,
                width: Number.isFinite(Number(d.width)) ? Number(d.width) : 320,
                height: Number.isFinite(Number(d.height)) ? Number(d.height) : 100,
                text: typeof d.text === 'string' ? d.text : '',
                fontSize: Number.isFinite(Number(d.fontSize)) ? Number(d.fontSize) : 20,
                color: typeof d.color === 'string' ? d.color : '#1C1917',
                isBold: Boolean(d.isBold),
                bgColor: typeof d.bgColor === 'string' ? d.bgColor : 'transparent',
                authorId: typeof d.authorId === 'string' ? d.authorId : '',
                createdAt: timestampToMillis(d.createdAt),
                updatedAt: timestampToMillis(d.updatedAt),
              });
            }

            // On the first snapshot, push any offline-local text boxes up to Firestore so
            // work created while offline is never lost when the room connects.
            if (!textsHydrated) {
              textsHydrated = true;
              const remoteIds = new Set(remoteTexts.map((t) => t.id));
              const localOnly = textsRef.current
                .filter((t) => !remoteIds.has(t.id))
                .slice(-60);
              if (localOnly.length > 0) {
                for (const text of localOnly) {
                  void setDoc(doc(db, 'rooms', safeRoomId, 'texts', text.id), {
                    id: text.id,
                    roomId: safeRoomId,
                    slideIndex: Math.max(0, Math.min(8, Math.trunc(text.slideIndex))),
                    scopeKey: text.scopeKey.slice(0, 160),
                    x: Math.round(text.x),
                    y: Math.round(text.y),
                    width: Math.max(120, Math.min(1280, Math.round(text.width))),
                    height: Math.max(48, Math.min(720, Math.round(text.height))),
                    text: text.text.replace(/\r\n/g, '\n').slice(0, 2000),
                    fontSize: Math.max(8, Math.min(160, Math.round(text.fontSize))),
                    color: text.color.slice(0, 32),
                    isBold: Boolean(text.isBold),
                    bgColor: (text.bgColor ?? 'transparent').slice(0, 32),
                    authorId: authorId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  }).catch((err) =>
                    reportSyncFailure(
                      'texts',
                      err,
                      OperationType.WRITE,
                      `rooms/${safeRoomId}/texts/${text.id}`,
                    ),
                  );
                }
                setTexts([...remoteTexts, ...localOnly].slice(-200));
                return;
              }
            }

            setTexts(remoteTexts.slice(-200));
          },
          (err) => {
            markSyncChannel('texts', true);
            try {
              handleFirestoreError(err, OperationType.GET, `rooms/${safeRoomId}/texts`);
            } catch {
              // Surfaced to the user through syncWarning.
            }
          },
        );
        unsubs.push(unsubTexts);

        // 1c. Listen to fixed PDF page frames (collection keeps room document small)
        const pdfsCollectionRef = collection(db, 'rooms', safeRoomId, 'pdfPages');
        let pdfsHydrated = false;
        const unsubPdfs = onSnapshot(
          pdfsCollectionRef,
          (snap) => {
            markSyncChannel('pdfPages', false);
            const remotePdfs: SlidePdfItem[] = [];
            for (const pdfSnap of snap.docs) {
              const d = pdfSnap.data();
              if (!d || typeof d !== 'object') continue;
              const slideIdx = Number(d.slideIndex);
              if (!Number.isFinite(slideIdx)) continue;
              const pageCount = Number.isFinite(Number(d.pageCount))
                ? Math.max(1, Math.trunc(Number(d.pageCount)))
                : 1;
              const pageNumber = Number.isFinite(Number(d.pageNumber))
                ? Math.max(1, Math.min(pageCount, Math.trunc(Number(d.pageNumber))))
                : 1;
              remotePdfs.push(
                clampSlidePdf({
                  id: typeof d.id === 'string' && d.id ? d.id : pdfSnap.id,
                  slideIndex: Math.max(0, Math.min(8, Math.trunc(slideIdx))),
                  scopeKey:
                    typeof d.scopeKey === 'string' && d.scopeKey
                      ? d.scopeKey
                      : getRootSlideScope(Math.trunc(slideIdx)),
                  x: Number.isFinite(Number(d.x)) ? Number(d.x) : 420,
                  y: Number.isFinite(Number(d.y)) ? Number(d.y) : 120,
                  width: Number.isFinite(Number(d.width)) ? Number(d.width) : 360,
                  height: Number.isFinite(Number(d.height)) ? Number(d.height) : 509,
                  dataUrl: typeof d.dataUrl === 'string' ? d.dataUrl : '',
                  fileName: typeof d.fileName === 'string' ? d.fileName : 'dokumen.pdf',
                  pageNumber,
                  pageCount,
                  authorId: typeof d.authorId === 'string' ? d.authorId : '',
                  createdAt: timestampToMillisOrZero(d.createdAt),
                  updatedAt: timestampToMillisOrZero(d.updatedAt),
                }),
              );
            }

            // On the first snapshot, push offline-local PDF frames into Firestore.
            if (!pdfsHydrated) {
              pdfsHydrated = true;
              const remoteIds = new Set(remotePdfs.map((pdf) => pdf.id));
              const localOnly = pdfPagesRef.current
                .filter((pdf) => !remoteIds.has(pdf.id) && pdf.dataUrl)
                .slice(-20);
              if (localOnly.length > 0) {
                for (const pdf of localOnly) {
                  void setDoc(doc(db, 'rooms', safeRoomId, 'pdfPages', pdf.id), {
                    id: pdf.id,
                    roomId: safeRoomId,
                    slideIndex: pdf.slideIndex,
                    scopeKey: pdf.scopeKey.slice(0, 160),
                    x: pdf.x,
                    y: pdf.y,
                    width: pdf.width,
                    height: pdf.height,
                    dataUrl: pdf.dataUrl.slice(0, 340_000),
                    fileName: pdf.fileName.slice(0, 160),
                    pageNumber: pdf.pageNumber,
                    pageCount: pdf.pageCount,
                    authorId: authorId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  }).catch((err) =>
                    reportSyncFailure(
                      'pdfPages',
                      err,
                      OperationType.WRITE,
                      `rooms/${safeRoomId}/pdfPages/${pdf.id}`,
                    ),
                  );
                }
                setPdfPages([...remotePdfs, ...localOnly].slice(-20));
                return;
              }
            }

            setPdfPages(remotePdfs.slice(-20));
          },
          (err) => {
            markSyncChannel('pdfPages', true);
            try {
              handleFirestoreError(err, OperationType.GET, `rooms/${safeRoomId}/pdfPages`);
            } catch {
              // Surfaced to the user through syncWarning.
            }
          },
        );
        unsubs.push(unsubPdfs);

        // 1d. Listen to the room's uploaded PDF files (original documents in
        // Storage). Any device can then re-render any page without re-uploading.
        const pdfLibraryRef = collection(db, 'rooms', safeRoomId, 'pdfLibrary');
        const unsubPdfLibrary = onSnapshot(
          pdfLibraryRef,
          (snap) => {
            const files: RoomPdfFileItem[] = [];
            for (const fileSnap of snap.docs) {
              const d = fileSnap.data();
              if (!d || typeof d !== 'object') continue;
              const storagePath = typeof d.storagePath === 'string' ? d.storagePath : '';
              if (!storagePath) continue;
              const fileName = typeof d.fileName === 'string' ? d.fileName : '';
              if (!fileName) continue;
              const pageCount = Number.isFinite(Number(d.pageCount))
                ? Math.max(1, Math.trunc(Number(d.pageCount)))
                : 1;
              files.push({
                fileName,
                pageCount,
                size: Number.isFinite(Number(d.size)) ? Number(d.size) : 0,
                storagePath,
              });
            }
            setPdfFiles(files);
          },
          (err) => {
            // The library is an enhancement; a failure here never blocks frames.
            markSyncChannel('pdfLibrary', true);
            console.warn('pdfLibrary subscribe failed', err);
          },
        );
        unsubs.push(unsubPdfLibrary);

        // 2. Listen to all 9 slide boards & ephemeral boards
        for (let i = 0; i < 9; i++) {
          const slideDocRef = doc(db, 'rooms', safeRoomId, 'slides', `slide_${i}`);
          const unsubSlide = onSnapshot(
            slideDocRef,
            (snap) => {
              if (snap.exists() && !snap.metadata.hasPendingWrites) {
                const d = snap.data();
                setStrokesBySlide((prev) => ({
                  ...prev,
                  [i]: Array.isArray(d.strokes) ? d.strokes : [],
                }));
                const { edits, isLegacy } = filterCurrentTextEdits(
                  d.textEdits && typeof d.textEdits === 'object' ? d.textEdits : {},
                );
                setTextEditsBySlide((prev) => ({
                  ...prev,
                  [i]: edits,
                }));
                if (isLegacy) {
                  const legacyKey = `${safeRoomId}:${i}`;
                  if (!clearedLegacyTextSlidesRef.current.has(legacyKey)) {
                    clearedLegacyTextSlidesRef.current.add(legacyKey);
                    void runTransaction(db, async (tx) => {
                      const curSnap = await tx.get(slideDocRef);
                      if (!curSnap.exists()) return;
                      const curData = curSnap.data();
                      const check = filterCurrentTextEdits(
                        curData?.textEdits && typeof curData.textEdits === 'object'
                          ? curData.textEdits
                          : {},
                      );
                      if (check.isLegacy) {
                        tx.update(slideDocRef, {
                          textEdits: { [TEXT_EDIT_EPOCH_KEY]: TEXT_EDIT_EPOCH_VALUE },
                          updatedAt: serverTimestamp(),
                          updatedBy: authorId,
                        });
                      }
                    }).catch(() => {
                      // Local state already overrides legacy Firebase textEdits
                    });
                  }
                }
              }
            },
            (err) =>
              handleFirestoreError(err, OperationType.GET, `rooms/${safeRoomId}/slides/slide_${i}`),
          );
          unsubs.push(unsubSlide);

          const ephDocRef = doc(db, 'rooms', safeRoomId, 'ephemeral', `slide_${i}`);
          const unsubEph = onSnapshot(
            ephDocRef,
            (snap) => {
              if (snap.exists() && !snap.metadata.hasPendingWrites) {
                const d = snap.data();
                const now = Date.now();
                const temp = pruneExpiredTempStrokes(
                  Array.isArray(d.tempStrokes) ? d.tempStrokes : [],
                  now,
                );
                const live = pruneStaleLiveStrokes(
                  d.liveStrokes && typeof d.liveStrokes === 'object' ? d.liveStrokes : {},
                  now,
                );
                setTempStrokesBySlide((prev) => ({ ...prev, [i]: temp }));
                setLiveStrokesBySlide((prev) => ({ ...prev, [i]: live }));
              }
            },
            (err) =>
              handleFirestoreError(err, OperationType.GET, `rooms/${safeRoomId}/ephemeral/slide_${i}`),
          );
          unsubs.push(unsubEph);
        }

        if (!cancelled) {
          setSyncStatus('synced');
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('kimia-5-4-room-id', safeRoomId);
            window.localStorage.setItem('kimia-5-4-room-code', safeJoinCode);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setSyncStatus('error');
          const msg = err instanceof Error ? err.message : 'Gagal menyambung ke bilik Firebase.';
          setSyncError(
            msg === 'FIRESTORE_TIMEOUT'
              ? 'Firestore Database belum diaktifkan atau belum bersedia. Sila pastikan Build -> Firestore Database telah dicipta dan firestore.rules telah diterbitkan (Publish) di Firebase Console.'
              : msg.includes('permission') || msg.includes('PERMISSION_DENIED')
              ? 'Kod bilik salah atau peraturan Firestore (firestore.rules) belum diterbitkan.'
              : msg,
          );
        }
      }
    };

    void setupRoomAndListen();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
      imageUnsubs.forEach((u) => u());
    };
  }, [authReady, roomId, joinCode, onRemotePresentationSync]);

  // Push presentation state updates (slide change, tab clicks, etc.)
  const pushPresentationStateToFirebase = useCallback(
    async (next: SyncedPresentationState) => {
      if (!isFirebaseActive) return;
      lastLocalRoomPushRef.current = Date.now();
      const path = `rooms/${roomId}`;
      try {
        // setDoc(merge) instead of updateDoc: never fails with "document not found"
        // if this device writes a split second before the room shell is committed.
        await setDoc(
          doc(db, 'rooms', roomId),
          {
            slideIndex: next.slideIndex,
            blackout: next.blackout,
            projectorDark: next.projectorDark,
            laser: {
              active: Boolean(next.laser?.active),
              x: Number((next.laser?.x ?? 50).toFixed(2)),
              y: Number((next.laser?.y ?? 50).toFixed(2)),
            },
            interactions: next.interactions,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [isFirebaseActive, roomId],
  );

  // Throttled real-time laser coordinate broadcast (immediate on start/stop, ~120ms while moving)
  const broadcastLaserToFirebase = useCallback(
    (laser: LaserPoint) => {
      lastLocalLaserActiveRef.current = Boolean(laser.active);
      if (!isFirebaseActive) return;

      const cleanLaser = {
        active: Boolean(laser.active),
        x: Number(laser.x.toFixed(2)),
        y: Number(laser.y.toFixed(2)),
      };

      const flush = async (payload: { active: boolean; x: number; y: number }) => {
        lastLocalLaserPushRef.current = Date.now();
        try {
          await updateDoc(doc(db, 'rooms', roomId), {
            laser: payload,
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Non-fatal for transient laser updates
        }
      };

      const now = Date.now();
      if (!cleanLaser.active) {
        if (laserPushTimerRef.current) {
          window.clearTimeout(laserPushTimerRef.current);
          laserPushTimerRef.current = null;
        }
        pendingLaserRef.current = null;
        void flush(cleanLaser);
        return;
      }

      const elapsed = now - lastLocalLaserPushRef.current;
      if (elapsed >= 115) {
        if (laserPushTimerRef.current) {
          window.clearTimeout(laserPushTimerRef.current);
          laserPushTimerRef.current = null;
        }
        pendingLaserRef.current = null;
        void flush(cleanLaser);
      } else {
        pendingLaserRef.current = cleanLaser;
        if (!laserPushTimerRef.current) {
          laserPushTimerRef.current = window.setTimeout(() => {
            laserPushTimerRef.current = null;
            const pending = pendingLaserRef.current;
            pendingLaserRef.current = null;
            if (pending) {
              void flush({
                active: Boolean(pending.active),
                x: Number(pending.x.toFixed(2)),
                y: Number(pending.y.toFixed(2)),
              });
            }
          }, 115 - elapsed);
        }
      }
    },
    [isFirebaseActive, roomId, user],
  );

  // Atomic transaction helper for SlideBoard (serialized per slide locally, merged via transaction remotely)
  const mutateSlideBoardTx = useCallback(
    (
      slideIndex: number,
      mutator: (current: {
        strokes: PenStroke[];
        textEdits: Record<string, string>;
      }) => { strokes: PenStroke[]; textEdits: Record<string, string> },
    ) => {
      if (!isFirebaseActive) return Promise.resolve();
      const prev = slideTxQueueRef.current[slideIndex] ?? Promise.resolve();
      const nextTask = prev
        .catch(() => {})
        .then(async () => {
          const slideDocPath = `rooms/${roomId}/slides/slide_${slideIndex}`;
          const ref = doc(db, 'rooms', roomId, 'slides', `slide_${slideIndex}`);
          try {
            await runTransaction(db, async (tx) => {
              const snap = await tx.get(ref);
              const curData = snap.exists() ? snap.data() : null;
              const curStrokes: PenStroke[] =
                curData && Array.isArray(curData.strokes) ? curData.strokes : [];
              const curTextEdits: Record<string, string> =
                curData && curData.textEdits && typeof curData.textEdits === 'object'
                  ? curData.textEdits
                  : {};

              const next = mutator({ strokes: curStrokes, textEdits: curTextEdits });
              const boundedStrokes = next.strokes.slice(-400);
              const boundedTextEdits = Object.fromEntries(
                Object.entries(next.textEdits).slice(-200),
              );

              if (snap.exists()) {
                tx.update(ref, {
                  strokes: boundedStrokes,
                  textEdits: boundedTextEdits,
                  updatedAt: serverTimestamp(),
                  updatedBy: currentAuthorId,
                });
              } else {
                tx.set(ref, {
                  roomId,
                  slideIndex,
                  strokes: boundedStrokes,
                  textEdits: boundedTextEdits,
                  updatedAt: serverTimestamp(),
                  updatedBy: currentAuthorId,
                });
              }
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, slideDocPath);
          }
        });
      slideTxQueueRef.current[slideIndex] = nextTask;
      return nextTask;
    },
    [isFirebaseActive, user, roomId],
  );

  // Atomic transaction helper for EphemeralBoard (serialized per slide locally)
  const mutateEphemeralBoardTx = useCallback(
    (
      slideIndex: number,
      mutator: (current: {
        tempStrokes: PenStroke[];
        liveStrokes: LiveStrokeMap;
      }) => { tempStrokes: PenStroke[]; liveStrokes: LiveStrokeMap },
    ) => {
      if (!isFirebaseActive) return Promise.resolve();
      const prev = ephemeralTxQueueRef.current[slideIndex] ?? Promise.resolve();
      const nextTask = prev
        .catch(() => {})
        .then(async () => {
          const path = `rooms/${roomId}/ephemeral/slide_${slideIndex}`;
          const ref = doc(db, 'rooms', roomId, 'ephemeral', `slide_${slideIndex}`);
          try {
            await runTransaction(db, async (tx) => {
              const snap = await tx.get(ref);
              const curData = snap.exists() ? snap.data() : null;
              const now = Date.now();
              const curTemp = pruneExpiredTempStrokes(
                curData && Array.isArray(curData.tempStrokes) ? curData.tempStrokes : [],
                now,
              );
              const curLive: LiveStrokeMap = pruneStaleLiveStrokes(
                curData && curData.liveStrokes && typeof curData.liveStrokes === 'object'
                  ? curData.liveStrokes
                  : {},
                now,
              );

              const next = mutator({ tempStrokes: curTemp, liveStrokes: curLive });
              const boundedTemp = pruneExpiredTempStrokes(next.tempStrokes, now).slice(-120);
              const boundedLive = Object.fromEntries(
                Object.entries(pruneStaleLiveStrokes(next.liveStrokes, now)).slice(-20),
              );

              if (snap.exists()) {
                tx.update(ref, {
                  tempStrokes: boundedTemp,
                  liveStrokes: boundedLive,
                  updatedAt: serverTimestamp(),
                  updatedBy: currentAuthorId,
                });
              } else {
                tx.set(ref, {
                  roomId,
                  slideIndex,
                  tempStrokes: boundedTemp,
                  liveStrokes: boundedLive,
                  updatedAt: serverTimestamp(),
                  updatedBy: currentAuthorId,
                });
              }
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
          }
        });
      ephemeralTxQueueRef.current[slideIndex] = nextTask;
      return nextTask;
    },
    [isFirebaseActive, user, roomId],
  );

  const broadcastEphemeralLocal = useCallback(
    (slideIndex: number, tempStrokes: PenStroke[], liveStrokes: LiveStrokeMap) => {
      try {
        bcRef.current?.postMessage({
          type: 'EPHEMERAL_UPDATE',
          sender: localAuthorIdRef.current,
          slideIndex,
          tempStrokes,
          liveStrokes,
        });
      } catch {
        // Ignore BC error
      }
    },
    [],
  );

  // Live in-progress stroke broadcast (throttled by caller)
  const updateLiveStroke = useCallback(
    (slideIndex: number, stroke: PenStroke | null) => {
      const currentMap = mergeLiveStrokeMap(
        liveStrokesRef.current[slideIndex] ?? {},
        currentAuthorId,
        stroke,
      );
      setLiveStrokesBySlide((prev) => ({
        ...prev,
        [slideIndex]: currentMap,
      }));
      broadcastEphemeralLocal(
        slideIndex,
        tempStrokesRef.current[slideIndex] ?? [],
        currentMap,
      );

      void mutateEphemeralBoardTx(slideIndex, (cur) => ({
        tempStrokes: cur.tempStrokes,
        liveStrokes: mergeLiveStrokeMap(cur.liveStrokes, currentAuthorId, stroke),
      }));
    },
    [broadcastEphemeralLocal, currentAuthorId, mutateEphemeralBoardTx],
  );

  const recordUndoAction = useCallback((action: BoardUndoAction) => {
    const next = pushUndoAction(undoRedoRef.current, action);
    undoRedoRef.current = next;
    setUndoRedoState(next);
  }, []);

  // Commit finished stroke (Permanent or Temporary) via conflict-free transaction
  const commitStroke = useCallback(
    (stroke: PenStroke) => {
      const sIdx = stroke.slideIndex;
      const nextLiveLocal = mergeLiveStrokeMap(
        liveStrokesRef.current[sIdx] ?? {},
        currentAuthorId,
        null,
      );
      setLiveStrokesBySlide((prev) => ({ ...prev, [sIdx]: nextLiveLocal }));

      if (stroke.mode === 'permanent') {
        const nextList = mergeStrokeList(strokesRef.current[sIdx] ?? [], stroke, 400);
        const nextMap = { ...strokesRef.current, [sIdx]: nextList };
        setStrokesBySlide(nextMap);
        postLocalBoardSync({ strokesBySlide: nextMap });
        broadcastEphemeralLocal(sIdx, tempStrokesRef.current[sIdx] ?? [], nextLiveLocal);

        void mutateSlideBoardTx(sIdx, (cur) => ({
          strokes: mergeStrokeList(cur.strokes, stroke, 400),
          textEdits: cur.textEdits,
        }));
        void mutateEphemeralBoardTx(sIdx, (cur) => ({
          tempStrokes: cur.tempStrokes,
          liveStrokes: mergeLiveStrokeMap(cur.liveStrokes, currentAuthorId, null),
        }));
      } else {
        const now = Date.now();
        const existingTemp = pruneExpiredTempStrokes(tempStrokesRef.current[sIdx] ?? [], now);
        const nextTemp = mergeStrokeBatch(existingTemp, [stroke], 120);
        setTempStrokesBySlide((prev) => ({ ...prev, [sIdx]: nextTemp }));
        broadcastEphemeralLocal(sIdx, nextTemp, nextLiveLocal);

        void mutateEphemeralBoardTx(sIdx, (cur) => ({
          tempStrokes: mergeStrokeBatch(cur.tempStrokes, [stroke], 120),
          liveStrokes: mergeLiveStrokeMap(cur.liveStrokes, currentAuthorId, null),
        }));
      }

      recordUndoAction({ type: 'stroke-add', slideIndex: sIdx, stroke });
    },
    [
      broadcastEphemeralLocal,
      currentAuthorId,
      mutateEphemeralBoardTx,
      mutateSlideBoardTx,
      postLocalBoardSync,
      recordUndoAction,
    ],
  );

  // Erase strokes by ID (transaction removes only hit IDs, keeping concurrent teammates' strokes)
  const deleteStrokesById = useCallback(
    (slideIndex: number, idsToDelete: Set<string>, batchId?: string) => {
      if (idsToDelete.size === 0) return;

      const curPerm = strokesRef.current[slideIndex] ?? [];
      const removedPerm = curPerm.filter((s) => idsToDelete.has(s.id));
      const nextPerm = removeStrokesFromList(curPerm, idsToDelete);
      const permChanged = nextPerm.length !== curPerm.length;

      const curTemp = tempStrokesRef.current[slideIndex] ?? [];
      const removedTemp = curTemp.filter((s) => idsToDelete.has(s.id));
      const nextTemp = removeStrokesFromList(curTemp, idsToDelete);
      const tempChanged = nextTemp.length !== curTemp.length;

      if (permChanged) {
        const nextMap = { ...strokesRef.current, [slideIndex]: nextPerm };
        setStrokesBySlide(nextMap);
        postLocalBoardSync({ strokesBySlide: nextMap });
        void mutateSlideBoardTx(slideIndex, (cur) => ({
          strokes: removeStrokesFromList(cur.strokes, idsToDelete),
          textEdits: cur.textEdits,
        }));
      }
      if (tempChanged) {
        setTempStrokesBySlide((prev) => ({ ...prev, [slideIndex]: nextTemp }));
        broadcastEphemeralLocal(
          slideIndex,
          nextTemp,
          liveStrokesRef.current[slideIndex] ?? {},
        );
        void mutateEphemeralBoardTx(slideIndex, (cur) => ({
          tempStrokes: removeStrokesFromList(cur.tempStrokes, idsToDelete),
          liveStrokes: cur.liveStrokes,
        }));
      }

      if (removedPerm.length > 0 || removedTemp.length > 0) {
        recordUndoAction({
          type: 'strokes-remove',
          slideIndex,
          permanentStrokes: removedPerm,
          tempStrokes: removedTemp,
          batchId,
        });
      }
    },
    [
      broadcastEphemeralLocal,
      mutateEphemeralBoardTx,
      mutateSlideBoardTx,
      postLocalBoardSync,
      recordUndoAction,
    ],
  );

  const clearScopeStrokes = useCallback(
    (slideIndex: number, scopeKey: string) => {
      const curPerm = strokesRef.current[slideIndex] ?? [];
      const removedPerm = curPerm.filter((s) => s.scopeKey === scopeKey);
      const nextPerm = curPerm.filter((s) => s.scopeKey !== scopeKey);
      const curTemp = tempStrokesRef.current[slideIndex] ?? [];
      const removedTemp = curTemp.filter((s) => s.scopeKey === scopeKey);
      const nextTemp = curTemp.filter((s) => s.scopeKey !== scopeKey);
      const nextLive = Object.fromEntries(
        Object.entries(liveStrokesRef.current[slideIndex] ?? {}).filter(
          ([, s]) => s.scopeKey !== scopeKey,
        ),
      );

      const nextMap = { ...strokesRef.current, [slideIndex]: nextPerm };
      setStrokesBySlide(nextMap);
      setTempStrokesBySlide((prev) => ({ ...prev, [slideIndex]: nextTemp }));
      setLiveStrokesBySlide((prev) => ({ ...prev, [slideIndex]: nextLive }));
      postLocalBoardSync({ strokesBySlide: nextMap });
      broadcastEphemeralLocal(slideIndex, nextTemp, nextLive);

      void mutateSlideBoardTx(slideIndex, (cur) => ({
        strokes: cur.strokes.filter((s) => s.scopeKey !== scopeKey),
        textEdits: cur.textEdits,
      }));
      void mutateEphemeralBoardTx(slideIndex, (cur) => ({
        tempStrokes: cur.tempStrokes.filter((s) => s.scopeKey !== scopeKey),
        liveStrokes: Object.fromEntries(
          Object.entries(cur.liveStrokes).filter(([, s]) => s.scopeKey !== scopeKey),
        ),
      }));

      if (removedPerm.length > 0 || removedTemp.length > 0) {
        recordUndoAction({
          type: 'strokes-remove',
          slideIndex,
          permanentStrokes: removedPerm,
          tempStrokes: removedTemp,
        });
      }
    },
    [
      broadcastEphemeralLocal,
      mutateEphemeralBoardTx,
      mutateSlideBoardTx,
      postLocalBoardSync,
      recordUndoAction,
    ],
  );

  const clearSlideStrokes = useCallback(
    (slideIndex: number) => {
      const removedPerm = strokesRef.current[slideIndex] ?? [];
      const removedTemp = tempStrokesRef.current[slideIndex] ?? [];

      const nextMap = { ...strokesRef.current, [slideIndex]: [] };
      setStrokesBySlide(nextMap);
      setTempStrokesBySlide((prev) => ({ ...prev, [slideIndex]: [] }));
      setLiveStrokesBySlide((prev) => ({ ...prev, [slideIndex]: {} }));
      postLocalBoardSync({ strokesBySlide: nextMap });
      broadcastEphemeralLocal(slideIndex, [], {});

      void mutateSlideBoardTx(slideIndex, (cur) => ({
        strokes: [],
        textEdits: cur.textEdits,
      }));
      void mutateEphemeralBoardTx(slideIndex, () => ({
        tempStrokes: [],
        liveStrokes: {},
      }));

      if (removedPerm.length > 0 || removedTemp.length > 0) {
        recordUndoAction({
          type: 'strokes-remove',
          slideIndex,
          permanentStrokes: removedPerm,
          tempStrokes: removedTemp,
        });
      }
    },
    [
      broadcastEphemeralLocal,
      mutateEphemeralBoardTx,
      mutateSlideBoardTx,
      postLocalBoardSync,
      recordUndoAction,
    ],
  );

  // Low-level reversible helpers shared by both live user actions and undo/redo
  const restoreImageExact = useCallback(
    async (item: SlideImageItem) => {
      const nextImages = [...imagesRef.current.filter((img) => img.id !== item.id), item].slice(-50);
      setImages(nextImages);
      postLocalBoardSync({ images: nextImages });

      if (isFirebaseActive) {
        const roomRef = doc(db, 'rooms', roomId);
        const imgRef = doc(db, 'rooms', roomId, 'images', item.id);
        try {
          await runTransaction(db, async (tx) => {
            const roomSnap = await tx.get(roomRef);
            const curIds: string[] =
              roomSnap.exists() && Array.isArray(roomSnap.data().imageIds)
                ? roomSnap.data().imageIds
                : roomImageIdsRef.current;
            const nextIds = mergeIdList(curIds, item.id, undefined, 50);

            tx.set(imgRef, {
              id: item.id,
              roomId,
              slideIndex: item.slideIndex,
              scopeKey: item.scopeKey,
              x: item.x,
              y: item.y,
              width: item.width,
              height: item.height,
              dataUrl: item.dataUrl,
              authorId: item.authorId || currentAuthorId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            tx.update(roomRef, {
              imageIds: nextIds,
              updatedAt: serverTimestamp(),
            });
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `rooms/${roomId}/images/${item.id}`);
        }
      }
    },
    [currentAuthorId, isFirebaseActive, postLocalBoardSync, roomId],
  );

  const removeImageExact = useCallback(
    async (imageId: string) => {
      delete pendingImageBeforeRef.current[imageId];
      const nextImages = imagesRef.current.filter((img) => img.id !== imageId);
      setImages(nextImages);
      postLocalBoardSync({ images: nextImages });

      if (isFirebaseActive) {
        const roomRef = doc(db, 'rooms', roomId);
        const imgRef = doc(db, 'rooms', roomId, 'images', imageId);
        try {
          await runTransaction(db, async (tx) => {
            const roomSnap = await tx.get(roomRef);
            const curIds: string[] =
              roomSnap.exists() && Array.isArray(roomSnap.data().imageIds)
                ? roomSnap.data().imageIds
                : roomImageIdsRef.current;
            const nextIds = mergeIdList(curIds, undefined, imageId, 50);

            tx.delete(imgRef);
            tx.update(roomRef, {
              imageIds: nextIds,
              updatedAt: serverTimestamp(),
            });
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `rooms/${roomId}/images/${imageId}`);
        }
      }
    },
    [isFirebaseActive, postLocalBoardSync, roomId],
  );

  // Add Pasted/Uploaded Image via room transaction so concurrent uploads never overwrite imageIds
  const addImage = useCallback(
    async (input: {
      slideIndex: number;
      scopeKey: string;
      x: number;
      y: number;
      width: number;
      height: number;
      dataUrl: string;
    }) => {
      const id = makeClientId('img');
      const now = Date.now();
      const item: SlideImageItem = {
        id,
        slideIndex: input.slideIndex,
        scopeKey: input.scopeKey.slice(0, 160),
        x: Math.round(input.x),
        y: Math.round(input.y),
        width: Math.max(40, Math.min(1400, Math.round(input.width))),
        height: Math.max(40, Math.min(1000, Math.round(input.height))),
        dataUrl: input.dataUrl.slice(0, 360_000),
        authorId: currentAuthorId,
        createdAt: now,
        updatedAt: now,
      };

      recordUndoAction({ type: 'image-add', slideIndex: item.slideIndex, image: item });
      await restoreImageExact(item);
      return item;
    },
    [currentAuthorId, recordUndoAction, restoreImageExact],
  );

  const applyImageUpdateExact = useCallback(
    async (
      imageId: string,
      patch: Partial<Pick<SlideImageItem, 'scopeKey' | 'x' | 'y' | 'width' | 'height'>>,
      commitToRemote = true,
    ): Promise<SlideImageItem | null> => {
      let updatedItem: SlideImageItem | null = null;
      const nextImages = imagesRef.current.map((img) => {
        if (img.id !== imageId) return img;
        updatedItem = {
          ...img,
          ...patch,
          scopeKey: (patch.scopeKey ?? img.scopeKey).slice(0, 160),
          x: Math.round(patch.x ?? img.x),
          y: Math.round(patch.y ?? img.y),
          width: Math.max(24, Math.min(1600, Math.round(patch.width ?? img.width))),
          height: Math.max(24, Math.min(1200, Math.round(patch.height ?? img.height))),
          updatedAt: Date.now(),
        };
        return updatedItem;
      });

      setImages(nextImages);
      if (commitToRemote) {
        postLocalBoardSync({ images: nextImages });
      }

      if (commitToRemote && isFirebaseActive && updatedItem) {
        const finalItem = updatedItem as SlideImageItem;
        const path = `rooms/${roomId}/images/${imageId}`;
        try {
          await updateDoc(doc(db, 'rooms', roomId, 'images', imageId), {
            scopeKey: finalItem.scopeKey,
            x: finalItem.x,
            y: finalItem.y,
            width: finalItem.width,
            height: finalItem.height,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }
      return updatedItem;
    },
    [isFirebaseActive, postLocalBoardSync, roomId],
  );

  // Update Image Position/Size/Scope
  const updateImage = useCallback(
    async (
      imageId: string,
      patch: Partial<Pick<SlideImageItem, 'scopeKey' | 'x' | 'y' | 'width' | 'height'>>,
      commitToRemote = true,
    ) => {
      const existing = imagesRef.current.find((img) => img.id === imageId);
      if (existing) {
        if (!commitToRemote) {
          if (!pendingImageBeforeRef.current[imageId]) {
            pendingImageBeforeRef.current[imageId] = pickImagePatch(existing);
          }
        } else {
          const before = pendingImageBeforeRef.current[imageId] ?? pickImagePatch(existing);
          delete pendingImageBeforeRef.current[imageId];
          const updatedItem = await applyImageUpdateExact(imageId, patch, true);
          if (updatedItem) {
            const after = pickImagePatch(updatedItem);
            if (imagePatchChanged(before, after)) {
              recordUndoAction({
                type: 'image-update',
                slideIndex: updatedItem.slideIndex,
                imageId,
                before,
                after,
              });
            }
          }
          return;
        }
      }
      await applyImageUpdateExact(imageId, patch, commitToRemote);
    },
    [applyImageUpdateExact, recordUndoAction],
  );

  // Delete Image via room transaction
  const deleteImage = useCallback(
    async (imageId: string) => {
      const existing = imagesRef.current.find((img) => img.id === imageId);
      if (existing) {
        recordUndoAction({ type: 'image-delete', slideIndex: existing.slideIndex, image: existing });
      }
      await removeImageExact(imageId);
    },
    [recordUndoAction, removeImageExact],
  );

  const applyTextEditExact = useCallback(
    (slideIndex: number, textKey: string, value: string | null) => {
      const nextSlideMap = mergeTextEditMap(
        textEditsRef.current[slideIndex] ?? {},
        textKey,
        value,
        199,
      );
      const nextMap = { ...textEditsRef.current, [slideIndex]: nextSlideMap };
      setTextEditsBySlide(nextMap);
      postLocalBoardSync({ textEditsBySlide: nextMap });

      void mutateSlideBoardTx(slideIndex, (cur) => {
        const currentClean = filterCurrentTextEdits(cur.textEdits).edits;
        const merged = mergeTextEditMap(currentClean, textKey, value, 199);
        return {
          strokes: cur.strokes,
          textEdits: stampCurrentTextEdits(merged),
        };
      });
    },
    [mutateSlideBoardTx, postLocalBoardSync],
  );

  // Inline Text Edit (create/update/reset) via conflict-free transaction
  const setTextEdit = useCallback(
    (slideIndex: number, textKey: string, value: string | null) => {
      const slideMap = textEditsRef.current[slideIndex] ?? {};
      const prevValue = Object.prototype.hasOwnProperty.call(slideMap, textKey)
        ? slideMap[textKey]
        : null;
      const nextValue = value === null ? null : sanitizeTextOverride(value);
      applyTextEditExact(slideIndex, textKey, value);
      if (prevValue !== nextValue) {
        recordUndoAction({
          type: 'text-edit',
          slideIndex,
          textKey,
          prevValue,
          nextValue,
        });
      }
    },
    [applyTextEditExact, recordUndoAction],
  );

  const joinRoom = useCallback((nextRoomId: string, nextJoinCode: string) => {
    const cleanRoom = nextRoomId.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    const cleanCode = nextJoinCode.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
    if (cleanRoom.length < 3 || cleanCode.length < 3) {
      setSyncError('ID Bilik dan Kod Sertai mesti sekurang-kurangnya 3 aksara (huruf/nombor).');
      return;
    }
    const emptyHistory = createEmptyUndoRedoState();
    undoRedoRef.current = emptyHistory;
    setUndoRedoState(emptyHistory);
    pendingImageBeforeRef.current = {};
    pendingTextBeforeRef.current = {};
    pendingPdfBeforeRef.current = {};
    setSyncError(null);
    setRoomId(cleanRoom);
    setJoinCode(cleanCode);
  }, []);

  const restoreSlideTextExact = useCallback(
    (rawItem: SlideTextItem) => {
      const item = clampSlideText(rawItem);
      const nextTexts = [...textsRef.current.filter((t) => t.id !== item.id), item].slice(-60);
      setTexts(nextTexts);
      postLocalBoardSync({ texts: nextTexts });

      if (isFirebaseActive) {
        void setDoc(doc(db, 'rooms', roomId, 'texts', item.id), {
          id: item.id,
          roomId,
          slideIndex: item.slideIndex,
          scopeKey: item.scopeKey,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          text: item.text,
          fontSize: item.fontSize,
          color: item.color,
          isBold: item.isBold,
          bgColor: item.bgColor,
          authorId: item.authorId || currentAuthorId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          reportSyncFailure('texts', err, OperationType.WRITE, `rooms/${roomId}/texts/${item.id}`),
        );
      }
    },
    [currentAuthorId, isFirebaseActive, postLocalBoardSync, reportSyncFailure, roomId],
  );

  const applySlideTextUpdateExact = useCallback(
    (textId: string, patch: Partial<SlideTextItem>, commitToRemote = true): SlideTextItem | null => {
      let updatedItem: SlideTextItem | null = null;
      const nextTexts = textsRef.current.map((t) => {
        if (t.id !== textId) return t;
        updatedItem = clampSlideText({
          ...t,
          ...patch,
          id: t.id,
          slideIndex: t.slideIndex,
          authorId: t.authorId,
          createdAt: t.createdAt,
          updatedAt: Date.now(),
        });
        return updatedItem;
      });
      setTexts(nextTexts);
      if (commitToRemote) {
        postLocalBoardSync({ texts: nextTexts });
      }

      if (commitToRemote && isFirebaseActive && updatedItem) {
        const finalItem = updatedItem as SlideTextItem;
        void updateDoc(doc(db, 'rooms', roomId, 'texts', textId), {
          scopeKey: finalItem.scopeKey,
          x: finalItem.x,
          y: finalItem.y,
          width: finalItem.width,
          height: finalItem.height,
          text: finalItem.text,
          fontSize: finalItem.fontSize,
          color: finalItem.color,
          isBold: finalItem.isBold,
          bgColor: finalItem.bgColor,
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          reportSyncFailure('texts', err, OperationType.UPDATE, `rooms/${roomId}/texts/${textId}`),
        );
      }
      return updatedItem;
    },
    [isFirebaseActive, postLocalBoardSync, reportSyncFailure, roomId],
  );

  const removeSlideTextExact = useCallback(
    (textId: string) => {
      delete pendingTextBeforeRef.current[textId];
      const nextTexts = textsRef.current.filter((t) => t.id !== textId);
      setTexts(nextTexts);
      postLocalBoardSync({ texts: nextTexts });

      if (isFirebaseActive) {
        void deleteDoc(doc(db, 'rooms', roomId, 'texts', textId)).catch((err) =>
          reportSyncFailure('texts', err, OperationType.DELETE, `rooms/${roomId}/texts/${textId}`),
        );
      }
    },
    [isFirebaseActive, postLocalBoardSync, reportSyncFailure, roomId],
  );

  // Add Movable Text Box
  const addSlideText = useCallback(
    (input: {
      slideIndex: number;
      scopeKey?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      text?: string;
      fontSize?: number;
      color?: string;
      isBold?: boolean;
      bgColor?: string;
    }) => {
      const id = makeClientId('txt');
      const now = Date.now();
      const item: SlideTextItem = clampSlideText({
        id,
        slideIndex: input.slideIndex,
        scopeKey: input.scopeKey ?? getRootSlideScope(input.slideIndex),
        x: input.x ?? 380,
        y: input.y ?? 200,
        width: input.width ?? 300,
        height: input.height ?? 100,
        text: input.text ?? 'Taip nota di sini...',
        fontSize: input.fontSize ?? 20,
        color: input.color ?? '#1C1917',
        isBold: Boolean(input.isBold),
        bgColor: input.bgColor ?? 'transparent',
        authorId: currentAuthorId,
        createdAt: now,
        updatedAt: now,
      });

      restoreSlideTextExact(item);
      if (item.text.trim().length > 0) {
        recordUndoAction({ type: 'slide-text-add', slideIndex: item.slideIndex, item });
      }
      return item;
    },
    [currentAuthorId, recordUndoAction, restoreSlideTextExact],
  );

  // Update Movable Text Box
  const updateSlideText = useCallback(
    (textId: string, patch: Partial<SlideTextItem>, commitToRemote = true) => {
      const existing = textsRef.current.find((t) => t.id === textId);
      if (existing) {
        if (!commitToRemote) {
          if (!pendingTextBeforeRef.current[textId]) {
            pendingTextBeforeRef.current[textId] = pickSlideTextPatch(existing);
          }
          applySlideTextUpdateExact(textId, patch, false);
          return;
        }
        const before = pendingTextBeforeRef.current[textId] ?? pickSlideTextPatch(existing);
        delete pendingTextBeforeRef.current[textId];
        const updatedItem = applySlideTextUpdateExact(textId, patch, true);
        if (updatedItem) {
          const after = pickSlideTextPatch(updatedItem);
          if (before.text.trim().length === 0 && after.text.trim().length > 0) {
            recordUndoAction({
              type: 'slide-text-add',
              slideIndex: updatedItem.slideIndex,
              item: updatedItem,
            });
          } else if (after.text.trim().length > 0 && slideTextPatchChanged(before, after)) {
            recordUndoAction({
              type: 'slide-text-update',
              slideIndex: updatedItem.slideIndex,
              textId,
              before,
              after,
            });
          }
        }
        return;
      }
      applySlideTextUpdateExact(textId, patch, commitToRemote);
    },
    [applySlideTextUpdateExact, recordUndoAction],
  );

  // Delete Movable Text Box
  const deleteSlideText = useCallback(
    (textId: string) => {
      const existing = textsRef.current.find((t) => t.id === textId);
      if (existing && existing.text.trim().length > 0) {
        recordUndoAction({ type: 'slide-text-delete', slideIndex: existing.slideIndex, item: existing });
      }
      removeSlideTextExact(textId);
    },
    [recordUndoAction, removeSlideTextExact],
  );

  const restoreSlidePdfExact = useCallback(
    (rawItem: SlidePdfItem) => {
      const item = clampSlidePdf(rawItem);
      const nextPdfs = [...pdfPagesRef.current.filter((p) => p.id !== item.id), item].slice(-20);
      setPdfPages(nextPdfs);
      postLocalBoardSync({ pdfPages: nextPdfs });

      if (isFirebaseActive) {
        void setDoc(doc(db, 'rooms', roomId, 'pdfPages', item.id), {
          id: item.id,
          roomId,
          slideIndex: item.slideIndex,
          scopeKey: item.scopeKey,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          dataUrl: item.dataUrl,
          fileName: item.fileName,
          pageNumber: item.pageNumber,
          pageCount: item.pageCount,
          authorId: item.authorId || currentAuthorId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          reportSyncFailure('pdfPages', err, OperationType.WRITE, `rooms/${roomId}/pdfPages/${item.id}`),
        );
      }
    },
    [currentAuthorId, isFirebaseActive, postLocalBoardSync, reportSyncFailure, roomId],
  );

  const applySlidePdfUpdateExact = useCallback(
    (
      pdfId: string,
      patch: Partial<Pick<SlidePdfItem, 'scopeKey' | 'x' | 'y' | 'width' | 'height'>>,
      commitToRemote = true,
    ): SlidePdfItem | null => {
      let updatedItem: SlidePdfItem | null = null;
      const nextPdfs = pdfPagesRef.current.map((pdf) => {
        if (pdf.id !== pdfId) return pdf;
        updatedItem = clampSlidePdf({
          ...pdf,
          ...patch,
          id: pdf.id,
          slideIndex: pdf.slideIndex,
          dataUrl: pdf.dataUrl,
          fileName: pdf.fileName,
          pageNumber: pdf.pageNumber,
          pageCount: pdf.pageCount,
          authorId: pdf.authorId,
          createdAt: pdf.createdAt,
          updatedAt: Date.now(),
        });
        return updatedItem;
      });
      setPdfPages(nextPdfs);
      if (commitToRemote) {
        postLocalBoardSync({ pdfPages: nextPdfs });
      }

      if (commitToRemote && isFirebaseActive && updatedItem) {
        const finalItem = updatedItem as SlidePdfItem;
        void updateDoc(doc(db, 'rooms', roomId, 'pdfPages', pdfId), {
          scopeKey: finalItem.scopeKey,
          x: finalItem.x,
          y: finalItem.y,
          width: finalItem.width,
          height: finalItem.height,
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          reportSyncFailure('pdfPages', err, OperationType.UPDATE, `rooms/${roomId}/pdfPages/${pdfId}`),
        );
      }
      return updatedItem;
    },
    [isFirebaseActive, postLocalBoardSync, reportSyncFailure, roomId],
  );

  const removeSlidePdfExact = useCallback(
    (pdfId: string) => {
      delete pendingPdfBeforeRef.current[pdfId];
      const nextPdfs = pdfPagesRef.current.filter((pdf) => pdf.id !== pdfId);
      setPdfPages(nextPdfs);
      postLocalBoardSync({ pdfPages: nextPdfs });

      if (isFirebaseActive) {
        void deleteDoc(doc(db, 'rooms', roomId, 'pdfPages', pdfId)).catch((err) =>
          reportSyncFailure('pdfPages', err, OperationType.DELETE, `rooms/${roomId}/pdfPages/${pdfId}`),
        );
      }
    },
    [isFirebaseActive, postLocalBoardSync, reportSyncFailure, roomId],
  );

  // Add Fixed PDF Page Frame
  const addSlidePdf = useCallback(
    (input: {
      slideIndex: number;
      scopeKey?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      dataUrl: string;
      fileName: string;
      pageNumber: number;
      pageCount: number;
    }) => {
      const id = makeClientId('pdf');
      const now = Date.now();
      const item = clampSlidePdf({
        id,
        slideIndex: input.slideIndex,
        scopeKey: input.scopeKey ?? getRootSlideScope(input.slideIndex),
        x: input.x ?? 420,
        y: input.y ?? 120,
        width: input.width ?? 360,
        height: input.height ?? 509,
        dataUrl: input.dataUrl,
        fileName: input.fileName,
        pageNumber: input.pageNumber,
        pageCount: input.pageCount,
        authorId: currentAuthorId,
        createdAt: now,
        updatedAt: now,
      });

      restoreSlidePdfExact(item);
      recordUndoAction({ type: 'slide-pdf-add', slideIndex: item.slideIndex, item });
      return item;
    },
    [currentAuthorId, recordUndoAction, restoreSlidePdfExact],
  );

  // Uploads the original PDF to Firebase Storage and registers it in the room's
  // shared library. Best-effort: if Storage is unavailable the frame still works
  // from its rendered pages, so this never blocks or breaks adding a page.
  const publishRoomPdf = useCallback(
    async (file: File, source: PdfSource) => {
      if (!isFirebaseActive) return;
      try {
        const storagePath = `rooms/${roomId}/pdfs/${pdfStorageId(source.fileName)}.pdf`;
        await uploadPdfToStorage(storagePath, source.bytes, file.type || 'application/pdf');
        await setDoc(
          doc(db, 'rooms', roomId, 'pdfLibrary', pdfStorageId(source.fileName)),
          {
            fileName: source.fileName.slice(0, 160),
            pageCount: source.pageCount,
            size: source.size,
            storagePath,
            contentType: file.type || 'application/pdf',
            uploadedBy: currentAuthorId,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (err) {
        // Non-fatal: the room simply falls back to already-rendered pages.
        console.warn('PDF publish to Storage failed', err);
      }
    },
    [currentAuthorId, isFirebaseActive, roomId],
  );

  // Update PDF Frame Position/Size (the chosen page itself never changes)
  const updateSlidePdf = useCallback(
    (
      pdfId: string,
      patch: Partial<Pick<SlidePdfItem, 'scopeKey' | 'x' | 'y' | 'width' | 'height'>>,
      commitToRemote = true,
    ) => {
      const existing = pdfPagesRef.current.find((pdf) => pdf.id === pdfId);
      if (existing) {
        if (!commitToRemote) {
          if (!pendingPdfBeforeRef.current[pdfId]) {
            pendingPdfBeforeRef.current[pdfId] = pickPdfPatch(existing);
          }
          applySlidePdfUpdateExact(pdfId, patch, false);
          return;
        }
        const before = pendingPdfBeforeRef.current[pdfId] ?? pickPdfPatch(existing);
        delete pendingPdfBeforeRef.current[pdfId];
        const updatedItem = applySlidePdfUpdateExact(pdfId, patch, true);
        if (updatedItem) {
          const after = pickPdfPatch(updatedItem);
          if (pdfPatchChanged(before, after)) {
            recordUndoAction({
              type: 'slide-pdf-update',
              slideIndex: updatedItem.slideIndex,
              pdfId,
              before,
              after,
            });
          }
        }
        return;
      }
      applySlidePdfUpdateExact(pdfId, patch, commitToRemote);
    },
    [applySlidePdfUpdateExact, recordUndoAction],
  );

  // Delete PDF Frame
  const deleteSlidePdf = useCallback(
    (pdfId: string) => {
      const existing = pdfPagesRef.current.find((pdf) => pdf.id === pdfId);
      if (existing) {
        recordUndoAction({ type: 'slide-pdf-delete', slideIndex: existing.slideIndex, item: existing });
      }
      removeSlidePdfExact(pdfId);
    },
    [recordUndoAction, removeSlidePdfExact],
  );

  // Execute Undo or Redo action cleanly without recording new history entries
  const applyHistoryAction = useCallback(
    (action: BoardUndoAction, direction: 'undo' | 'redo') => {
      const sIdx = action.slideIndex;

      const restoreStrokes = (permList: PenStroke[], tempList: PenStroke[]) => {
        if (permList.length > 0) {
          const nextList = mergeStrokeBatch(strokesRef.current[sIdx] ?? [], permList, 400);
          const nextMap = { ...strokesRef.current, [sIdx]: nextList };
          setStrokesBySlide(nextMap);
          postLocalBoardSync({ strokesBySlide: nextMap });
          void mutateSlideBoardTx(sIdx, (cur) => ({
            strokes: mergeStrokeBatch(cur.strokes, permList, 400),
            textEdits: cur.textEdits,
          }));
        }
        if (tempList.length > 0) {
          const now = Date.now();
          const refreshedTemp = tempList.map((s) => ({
            ...s,
            createdAt: now,
            expiresAt: now + (s.ttlSeconds ?? 3) * 1000,
          }));
          const existingTemp = pruneExpiredTempStrokes(tempStrokesRef.current[sIdx] ?? [], now);
          const nextTemp = mergeStrokeBatch(existingTemp, refreshedTemp, 120);
          setTempStrokesBySlide((prev) => ({ ...prev, [sIdx]: nextTemp }));
          broadcastEphemeralLocal(sIdx, nextTemp, liveStrokesRef.current[sIdx] ?? {});
          void mutateEphemeralBoardTx(sIdx, (cur) => ({
            tempStrokes: mergeStrokeBatch(cur.tempStrokes, refreshedTemp, 120),
            liveStrokes: cur.liveStrokes,
          }));
        }
      };

      const removeStrokes = (ids: Set<string>, hasPerm: boolean, hasTemp: boolean) => {
        if (ids.size === 0) return;
        if (hasPerm) {
          const nextPerm = removeStrokesFromList(strokesRef.current[sIdx] ?? [], ids);
          const nextMap = { ...strokesRef.current, [sIdx]: nextPerm };
          setStrokesBySlide(nextMap);
          postLocalBoardSync({ strokesBySlide: nextMap });
          void mutateSlideBoardTx(sIdx, (cur) => ({
            strokes: removeStrokesFromList(cur.strokes, ids),
            textEdits: cur.textEdits,
          }));
        }
        if (hasTemp) {
          const nextTemp = removeStrokesFromList(tempStrokesRef.current[sIdx] ?? [], ids);
          setTempStrokesBySlide((prev) => ({ ...prev, [sIdx]: nextTemp }));
          broadcastEphemeralLocal(sIdx, nextTemp, liveStrokesRef.current[sIdx] ?? {});
          void mutateEphemeralBoardTx(sIdx, (cur) => ({
            tempStrokes: removeStrokesFromList(cur.tempStrokes, ids),
            liveStrokes: cur.liveStrokes,
          }));
        }
      };

      switch (action.type) {
        case 'stroke-add': {
          const isPerm = action.stroke.mode === 'permanent';
          if (direction === 'undo') {
            removeStrokes(new Set([action.stroke.id]), isPerm, !isPerm);
          } else {
            restoreStrokes(isPerm ? [action.stroke] : [], isPerm ? [] : [action.stroke]);
          }
          break;
        }
        case 'strokes-remove': {
          if (direction === 'undo') {
            restoreStrokes(action.permanentStrokes, action.tempStrokes);
          } else {
            const ids = new Set<string>([
              ...action.permanentStrokes.map((s) => s.id),
              ...action.tempStrokes.map((s) => s.id),
            ]);
            removeStrokes(ids, action.permanentStrokes.length > 0, action.tempStrokes.length > 0);
          }
          break;
        }
        case 'text-edit': {
          applyTextEditExact(
            sIdx,
            action.textKey,
            direction === 'undo' ? action.prevValue : action.nextValue,
          );
          break;
        }
        case 'image-add': {
          if (direction === 'undo') {
            void removeImageExact(action.image.id);
          } else {
            void restoreImageExact(action.image);
          }
          break;
        }
        case 'image-update': {
          void applyImageUpdateExact(
            action.imageId,
            direction === 'undo' ? action.before : action.after,
            true,
          );
          break;
        }
        case 'image-delete': {
          if (direction === 'undo') {
            void restoreImageExact(action.image);
          } else {
            void removeImageExact(action.image.id);
          }
          break;
        }
        case 'slide-text-add': {
          if (direction === 'undo') {
            removeSlideTextExact(action.item.id);
          } else {
            restoreSlideTextExact(action.item);
          }
          break;
        }
        case 'slide-text-update': {
          applySlideTextUpdateExact(
            action.textId,
            direction === 'undo' ? action.before : action.after,
            true,
          );
          break;
        }
        case 'slide-text-delete': {
          if (direction === 'undo') {
            restoreSlideTextExact(action.item);
          } else {
            removeSlideTextExact(action.item.id);
          }
          break;
        }
        case 'slide-pdf-add': {
          if (direction === 'undo') {
            removeSlidePdfExact(action.item.id);
          } else {
            restoreSlidePdfExact(action.item);
          }
          break;
        }
        case 'slide-pdf-update': {
          applySlidePdfUpdateExact(
            action.pdfId,
            direction === 'undo' ? action.before : action.after,
            true,
          );
          break;
        }
        case 'slide-pdf-delete': {
          if (direction === 'undo') {
            restoreSlidePdfExact(action.item);
          } else {
            removeSlidePdfExact(action.item.id);
          }
          break;
        }
      }
    },
    [
      applyImageUpdateExact,
      applySlidePdfUpdateExact,
      applySlideTextUpdateExact,
      applyTextEditExact,
      broadcastEphemeralLocal,
      mutateEphemeralBoardTx,
      mutateSlideBoardTx,
      postLocalBoardSync,
      removeImageExact,
      removeSlidePdfExact,
      removeSlideTextExact,
      restoreImageExact,
      restoreSlidePdfExact,
      restoreSlideTextExact,
    ],
  );

  const undo = useCallback((): boolean => {
    const { action, nextState } = popUndoAction(undoRedoRef.current, currentSlideIndex);
    if (!action) return false;
    undoRedoRef.current = nextState;
    setUndoRedoState(nextState);
    applyHistoryAction(action, 'undo');
    return true;
  }, [applyHistoryAction, currentSlideIndex]);

  const redo = useCallback((): boolean => {
    const { action, nextState } = popRedoAction(undoRedoRef.current, currentSlideIndex);
    if (!action) return false;
    undoRedoRef.current = nextState;
    setUndoRedoState(nextState);
    applyHistoryAction(action, 'redo');
    return true;
  }, [applyHistoryAction, currentSlideIndex]);

  // ── Live room presence & location ─────────────────────────────────────────

  // Keep the online window fresh even when no Firestore snapshot arrives.
  useEffect(() => {
    const timer = window.setInterval(() => setPresenceTick((n) => n + 1), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  // Approximate location purely from the network address. This works even
  // when device GPS is switched off, and it NEVER triggers a browser
  // permission prompt — the visitor is never asked to enable anything.
  const pushPresenceHeartbeat = useCallback(
    async (locationOverride?: PresenceLocation | null) => {
      if (!isFirebaseActive) return;
      const location = locationOverride ?? presenceLocationRef.current;
      const safeLocation = location ?? normalizePresenceLocation(null);
      try {
        await setDoc(
          doc(db, 'rooms', roomId, 'presence', currentAuthorId),
          {
            uid: currentAuthorId,
            displayName: effectivePresenceNameRef.current,
            isAnonymous: !user || user.isAnonymous,
            location: {
              source: safeLocation.source,
              label: safeLocation.label.slice(0, 160),
              city: safeLocation.city.slice(0, 80),
              region: safeLocation.region.slice(0, 80),
              country: safeLocation.country.slice(0, 80),
              countryCode: safeLocation.countryCode.slice(0, 8),
              latitude: safeLocation.latitude,
              longitude: safeLocation.longitude,
              accuracy: safeLocation.accuracy,
              updatedAt: Timestamp.fromMillis(safeLocation.updatedAt || Date.now()),
            },
            lastSeen: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (err) {
        reportSyncFailure('presence', err, OperationType.WRITE, `rooms/${roomId}/presence/${currentAuthorId}`);
      }
    },
    [currentAuthorId, isFirebaseActive, roomId, user],
  );

  // Subscribe to the presence collection for this room.
  useEffect(() => {
    if (!isFirebaseActive) {
      setPresenceUsers([]);
      return;
    }
    const presenceRef = collection(db, 'rooms', roomId, 'presence');
    const unsub = onSnapshot(
      presenceRef,
      (snap) => {
        markSyncChannel('presence', false);
        const list: PresenceUser[] = [];
        for (const presenceSnap of snap.docs) {
          const d = presenceSnap.data();
          if (!d || typeof d !== 'object') continue;
          const uid = typeof d.uid === 'string' && d.uid ? d.uid : presenceSnap.id;
          const pending = presenceSnap.metadata.hasPendingWrites;
          const lastSeen = timestampToMillisOrZero(d.lastSeen) || (pending ? Date.now() : 0);
          const location = normalizePresenceLocation(d.location);
          list.push({
            uid,
            displayName:
              typeof d.displayName === 'string' && d.displayName.trim()
                ? d.displayName.trim().slice(0, 80)
                : `Tetamu-${uid.slice(0, 5)}`,
            isAnonymous: Boolean(d.isAnonymous),
            location: location.source === 'none' ? null : location,
            lastSeen,
          });
        }
        setPresenceUsers(list);
      },
      (err) => {
        markSyncChannel('presence', true);
        try {
          handleFirestoreError(err, OperationType.GET, `rooms/${roomId}/presence`);
        } catch {
          // Surfaced to the user through syncWarning.
        }
      },
    );
    return () => unsub();
  }, [isFirebaseActive, roomId]);

  // Heartbeat every 25s (and immediately when the tab becomes visible again).
  useEffect(() => {
    if (!isFirebaseActive) return;
    void pushPresenceHeartbeat();
    const timer = window.setInterval(() => void pushPresenceHeartbeat(), PRESENCE_HEARTBEAT_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void pushPresenceHeartbeat();
    };
    // Remove this tab's presence the moment it closes or reloads so a departed
    // visitor never lingers as a phantom "online" entry for other people.
    const markOffline = () => {
      void deleteDoc(doc(db, 'rooms', roomId, 'presence', currentAuthorId)).catch(() => {
        // Best-effort departure marker; stale heartbeats are filtered anyway.
      });
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', markOffline);
    window.addEventListener('beforeunload', markOffline);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', markOffline);
      window.removeEventListener('beforeunload', markOffline);
      markOffline();
    };
  }, [currentAuthorId, isFirebaseActive, pushPresenceHeartbeat, roomId]);

  // Publish immediately after a name or location change.
  useEffect(() => {
    if (!isFirebaseActive) return;
    void pushPresenceHeartbeat();
  }, [isFirebaseActive, presenceLocation, presenceName, pushPresenceHeartbeat]);

  // Approximate location from the network address only. No GPS, so the
  // browser never asks the visitor to grant a location permission. If the
  // lookup fails we silently keep whatever label is already shown.
  const refreshPresenceLocation = useCallback(async () => {
    setPresenceLocationBusy(true);
    setPresenceLocationError(null);
    try {
      const res = await fetch('/api/geo', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`geo ${res.status}`);
      const raw = (await res.json()) as Record<string, unknown>;
      const location = normalizePresenceLocation({ ...raw, updatedAt: Date.now() });
      if (location.source === 'none' || !location.label) throw new Error('geo-unavailable');
      setPresenceLocation(location);
      presenceLocationRef.current = location;
      cachePresenceLocation(location);
      await pushPresenceHeartbeat(location);
    } catch {
      // Network approximation unavailable — keep the current label and stay
      // silent. We never nag the visitor to enable GPS or grant permissions.
      setPresenceLocationError(null);
    } finally {
      setPresenceLocationBusy(false);
    }
  }, [pushPresenceHeartbeat]);

  // Force a fresh approximate location on every load. The cached value (if any)
  // already renders instantly, so this only upgrades it in the background.
  const geoRefreshOnLoadRef = useRef(false);
  useEffect(() => {
    if (geoRefreshOnLoadRef.current) return;
    geoRefreshOnLoadRef.current = true;
    void refreshPresenceLocation();
  }, [refreshPresenceLocation]);

  const updatePresenceDisplayName = useCallback((next: string) => {
    const clean = next.trim().slice(0, 80);
    setPresenceName(clean);
    savePresenceDisplayName(clean);
  }, []);

  const onlinePresenceUsers = useMemo(() => {
    const now = Date.now();
    const fresh = presenceUsers.filter(
      (entry) =>
        entry.lastSeen > 0 && now - entry.lastSeen <= PRESENCE_ONLINE_WINDOW_MS,
    );
    if (isFirebaseActive && !fresh.some((entry) => entry.uid === currentAuthorId)) {
      fresh.push({
        uid: currentAuthorId,
        displayName: effectivePresenceName,
        isAnonymous: !user || user.isAnonymous,
        location: presenceLocation,
        lastSeen: now,
      });
    }
    fresh.sort((a, b) => {
      if (a.uid === currentAuthorId) return -1;
      if (b.uid === currentAuthorId) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
    return fresh;
    // presenceTick intentionally re-evaluates the online window over time.
  }, [presenceUsers, presenceTick, isFirebaseActive, currentAuthorId, user, effectivePresenceName, presenceLocation]);

  const activePermanentStrokes = strokesBySlide[currentSlideIndex] ?? [];
  const activeTempStrokes = tempStrokesBySlide[currentSlideIndex] ?? [];
  const activeLiveStrokes = liveStrokesBySlide[currentSlideIndex] ?? {};
  const activeTextEdits = textEditsBySlide[currentSlideIndex] ?? {};
  const activeSlideImages = images.filter((img) => img.slideIndex === currentSlideIndex);
  const activeSlideTexts = texts.filter((t) => t.slideIndex === currentSlideIndex);
  const activeSlidePdfs = pdfPages.filter((pdf) => pdf.slideIndex === currentSlideIndex);

  // Every PDF in this room, merged from two Firebase sources:
  //   * pdfLibrary — the original file in Storage (any page can be rendered), and
  //   * pdfPages   — pages already rendered into Firestore.
  // A teammate can drop in any page straight from the dialog without re-upload.
  const roomPdfEntries = useMemo<RoomPdfEntry[]>(() => {
    const byFile = new Map<string, RoomPdfEntry>();
    const ensure = (fileName: string): RoomPdfEntry => {
      let entry = byFile.get(fileName);
      if (!entry) {
        entry = { fileName, pageCount: 1, storagePath: null, pages: [] };
        byFile.set(fileName, entry);
      }
      return entry;
    };

    for (const pdf of pdfPages) {
      const entry = ensure(pdf.fileName || 'PDF');
      entry.pageCount = Math.max(entry.pageCount, pdf.pageCount || 1);
      if (!entry.pages.some((page) => page.pageNumber === pdf.pageNumber)) {
        entry.pages.push({
          pageNumber: pdf.pageNumber,
          dataUrl: pdf.dataUrl,
          width: pdf.width,
          height: pdf.height,
        });
      }
    }

    for (const file of pdfFiles) {
      const entry = ensure(file.fileName);
      entry.pageCount = Math.max(entry.pageCount, file.pageCount || 1);
      entry.storagePath = file.storagePath;
    }

    return Array.from(byFile.values())
      .map((entry) => ({
        ...entry,
        pages: [...entry.pages].sort((a, b) => a.pageNumber - b.pageNumber),
      }))
      .sort((a, b) => a.fileName.localeCompare(b.fileName));
  }, [pdfFiles, pdfPages]);

  const canUndo = (undoRedoState.undoBySlide[currentSlideIndex]?.length ?? 0) > 0;
  const canRedo = (undoRedoState.redoBySlide[currentSlideIndex]?.length ?? 0) > 0;

  return {
    user,
    authReady,
    anonBlocked,
    roomId,
    joinCode,
    syncStatus,
    syncError,
    syncWarning,
    isFirebaseActive,
    currentAuthorId,
    activePermanentStrokes,
    activeTempStrokes,
    activeLiveStrokes,
    activeTextEdits,
    activeSlideImages,
    activeSlideTexts,
    activeSlidePdfs,
    roomPdfEntries,
    publishRoomPdf,
    presenceUsers: onlinePresenceUsers,
    presenceLocation,
    presenceLocationBusy,
    presenceLocationError,
    presenceDisplayName: effectivePresenceName,
    updatePresenceDisplayName,
    refreshPresenceLocation,
    joinRoom,
    pushPresentationStateToFirebase,
    broadcastLaserToFirebase,
    updateLiveStroke,
    commitStroke,
    deleteStrokesById,
    clearScopeStrokes,
    clearSlideStrokes,
    addImage,
    updateImage,
    deleteImage,
    setTextEdit,
    addSlideText,
    updateSlideText,
    deleteSlideText,
    addSlidePdf,
    updateSlidePdf,
    deleteSlidePdf,
    canUndo,
    canRedo,
    undo,
    redo,
  };
}
