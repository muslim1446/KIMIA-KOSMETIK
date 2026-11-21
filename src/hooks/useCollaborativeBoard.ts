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
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
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
} from '../utils/annotationEngine';
import {
  PRESENCE_HEARTBEAT_MS,
  PRESENCE_LOCATION_MAX_AGE_MS,
  PRESENCE_ONLINE_WINDOW_MS,
  PresenceLocation,
  PresenceUser,
  buildLocationLabel,
  cachePresenceLocation,
  loadCachedPresenceLocation,
  loadPresenceDisplayName,
  normalizePresenceLocation,
  savePresenceDisplayName,
} from '../utils/presence';
import { LaserPoint, SyncedPresentationState } from './usePresentationSync';

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
      return {
        strokesBySlide: parsed.strokesBySlide ?? {},
        textEditsBySlide: parsed.textEditsBySlide ?? {},
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
    const { pdfPages, ...rest } = data;
    window.localStorage.setItem(LOCAL_BOARD_KEY, JSON.stringify(rest));
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

  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [presenceTick, setPresenceTick] = useState(0);
  const [presenceLocation, setPresenceLocation] = useState<PresenceLocation | null>(() =>
    loadCachedPresenceLocation(),
  );
  const [presenceLocationBusy, setPresenceLocationBusy] = useState(false);
  const [presenceLocationError, setPresenceLocationError] = useState<string | null>(null);
  const [presenceName, setPresenceName] = useState<string>(() => loadPresenceDisplayName());

  const localAuthorIdRef = useRef<string>(
    `local-${Math.random().toString(36).slice(2, 8)}`,
  );
  const anonAttemptedRef = useRef(false);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const roomImageIdsRef = useRef<string[]>([]);
  const slideTxQueueRef = useRef<Record<number, Promise<void>>>({});
  const ephemeralTxQueueRef = useRef<Record<number, Promise<void>>>({});
  const lastLocalLaserPushRef = useRef<number>(0);
  const lastLocalLaserActiveRef = useRef<boolean>(false);
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

  const presenceLocationRef = useRef<PresenceLocation | null>(presenceLocation);
  presenceLocationRef.current = presenceLocation;

  const isFirebaseActive = Boolean(authReady && user && syncStatus === 'synced');
  const currentAuthorId = user?.uid ?? localAuthorIdRef.current;
  const defaultPresenceName = (
    user?.displayName ||
    user?.email ||
    (user?.isAnonymous ? `Tetamu-${user.uid.slice(0, 5)}` : 'Pembentang')
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

  // Silent Open-World Auth: automatically sign in anonymously if not signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAuthReady(true);
        setAnonBlocked(false);
        return;
      }

      if (!anonAttemptedRef.current) {
        anonAttemptedRef.current = true;
        setSyncStatus('connecting');
        void signInAnonymously(auth).catch((err: unknown) => {
          const code = (err as { code?: string })?.code ?? '';
          setUser(null);
          setAuthReady(true);
          if (
            code === 'auth/operation-not-allowed' ||
            code === 'auth/admin-restricted-operation'
          ) {
            setAnonBlocked(true);
            setSyncStatus('local');
            setSyncError(
              'Aktifkan "Anonymous" di Firebase Console -> Authentication -> Sign-in method supaya semua ahli pasukan terus sync automatik tanpa log masuk.',
            );
          } else {
            setSyncStatus('local');
            setSyncError(err instanceof Error ? err.message : 'Mod luar talian aktif.');
          }
        });
        return;
      }

      setUser(null);
      setAuthReady(true);
      setSyncStatus('local');
    });
    return () => unsub();
  }, []);

  // Connect & Subscribe to Firestore Room automatically once signed in (anonymous or Google)
  useEffect(() => {
    if (!authReady || !user) return;

    let cancelled = false;
    const unsubs: Unsubscribe[] = [];
    const imageUnsubs = new Map<string, Unsubscribe>();

    const setupRoomAndListen = async () => {
      setSyncStatus('connecting');
      setSyncError(null);

      const safeRoomId = /^[a-zA-Z0-9_-]{3,128}$/.test(roomId) ? roomId : DEFAULT_ROOM_ID;
      const safeJoinCode = /^[a-zA-Z0-9_-]{3,32}$/.test(joinCode) ? joinCode : DEFAULT_JOIN_CODE;
      const roomRef = doc(db, 'rooms', safeRoomId);
      const memberRef = doc(db, 'rooms', safeRoomId, 'members', user.uid);
      const memberDisplayName = (
        user.displayName ||
        user.email ||
        (user.isAnonymous ? `Tetamu-${user.uid.slice(0, 5)}` : 'Pembentang')
      ).slice(0, 80);

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), 7000),
        );

        const memberSnap = await Promise.race([
          getDoc(memberRef).catch((err) => {
            if (err?.code === 'permission-denied') return null;
            throw err;
          }),
          timeoutPromise,
        ]);

        if (cancelled) return;

        if (!memberSnap || !memberSnap.exists()) {
          // Try joining an existing room as editor first
          let joinedExisting = false;
          try {
            await setDoc(memberRef, {
              uid: user.uid,
              displayName: memberDisplayName,
              role: 'editor',
              joinCode: safeJoinCode,
              joinedAt: serverTimestamp(),
            });
            joinedExisting = true;
          } catch (joinErr: unknown) {
            const code = (joinErr as { code?: string })?.code ?? '';
            if (code !== 'permission-denied') {
              throw joinErr;
            }
          }

          if (!joinedExisting) {
            // Room likely doesn't exist yet (allow get on non-existent room throws permission-denied).
            // Create room + owner membership atomically first, then seed any offline local boards/images.
            const createBatch = writeBatch(db);
            const ps = presentationStateRef.current;

            createBatch.set(roomRef, {
              ownerId: user.uid,
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
              uid: user.uid,
              displayName: memberDisplayName,
              role: 'owner',
              joinCode: safeJoinCode,
              joinedAt: serverTimestamp(),
            });
            await createBatch.commit();

            // Now that membership exists, seed any local offline strokes/edits/images/texts
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
                  Object.entries(textEditsRef.current[i] ?? {}).slice(-200),
                );
                if (localStrokes.length > 0 || Object.keys(localEdits).length > 0) {
                  seedBatch.set(doc(db, 'rooms', safeRoomId, 'slides', `slide_${i}`), {
                    roomId: safeRoomId,
                    slideIndex: i,
                    strokes: localStrokes,
                    textEdits: localEdits,
                    updatedAt: serverTimestamp(),
                    updatedBy: user.uid,
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
                    authorId: user.uid,
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
                  authorId: user.uid,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
              }
              await seedBatch.commit();
            }
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
              const suppressLaserEcho =
                lastLocalLaserActiveRef.current || Date.now() - lastLocalLaserPushRef.current < 450;
              onRemotePresentationSync({
                slideIndex: typeof data.slideIndex === 'number' ? data.slideIndex : 0,
                blackout: Boolean(data.blackout),
                projectorDark: Boolean(data.projectorDark),
                ...(suppressLaserEcho ? {} : { laser: data.laser }),
                interactions: data.interactions,
              });
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
                    authorId: user.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  }).catch((err) =>
                    handleFirestoreError(
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
          (err) => handleFirestoreError(err, OperationType.GET, `rooms/${safeRoomId}/texts`),
        );
        unsubs.push(unsubTexts);

        // 1c. Listen to fixed PDF page frames (collection keeps room document small)
        const pdfsCollectionRef = collection(db, 'rooms', safeRoomId, 'pdfPages');
        let pdfsHydrated = false;
        const unsubPdfs = onSnapshot(
          pdfsCollectionRef,
          (snap) => {
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
                    authorId: user.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  }).catch((err) =>
                    handleFirestoreError(
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
          (err) => handleFirestoreError(err, OperationType.GET, `rooms/${safeRoomId}/pdfPages`),
        );
        unsubs.push(unsubPdfs);

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
                setTextEditsBySlide((prev) => ({
                  ...prev,
                  [i]: d.textEdits && typeof d.textEdits === 'object' ? d.textEdits : {},
                }));
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
  }, [authReady, user, roomId, joinCode, onRemotePresentationSync]);

  // Push presentation state updates (slide change, tab clicks, etc.)
  const pushPresentationStateToFirebase = useCallback(
    async (next: SyncedPresentationState) => {
      if (!isFirebaseActive || !user) return;
      const path = `rooms/${roomId}`;
      try {
        await updateDoc(doc(db, 'rooms', roomId), {
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
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [isFirebaseActive, user, roomId],
  );

  // Throttled real-time laser coordinate broadcast (immediate on start/stop, ~120ms while moving)
  const broadcastLaserToFirebase = useCallback(
    (laser: LaserPoint) => {
      lastLocalLaserActiveRef.current = Boolean(laser.active);
      if (!isFirebaseActive || !user) return;

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
      if (!isFirebaseActive || !user) return Promise.resolve();
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
                  updatedBy: user.uid,
                });
              } else {
                tx.set(ref, {
                  roomId,
                  slideIndex,
                  strokes: boundedStrokes,
                  textEdits: boundedTextEdits,
                  updatedAt: serverTimestamp(),
                  updatedBy: user.uid,
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
      if (!isFirebaseActive || !user) return Promise.resolve();
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
                  updatedBy: user.uid,
                });
              } else {
                tx.set(ref, {
                  roomId,
                  slideIndex,
                  tempStrokes: boundedTemp,
                  liveStrokes: boundedLive,
                  updatedAt: serverTimestamp(),
                  updatedBy: user.uid,
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
    },
    [
      broadcastEphemeralLocal,
      currentAuthorId,
      mutateEphemeralBoardTx,
      mutateSlideBoardTx,
      postLocalBoardSync,
    ],
  );

  // Erase strokes by ID (transaction removes only hit IDs, keeping concurrent teammates' strokes)
  const deleteStrokesById = useCallback(
    (slideIndex: number, idsToDelete: Set<string>) => {
      if (idsToDelete.size === 0) return;

      const curPerm = strokesRef.current[slideIndex] ?? [];
      const nextPerm = removeStrokesFromList(curPerm, idsToDelete);
      const permChanged = nextPerm.length !== curPerm.length;

      const curTemp = tempStrokesRef.current[slideIndex] ?? [];
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
    },
    [broadcastEphemeralLocal, mutateEphemeralBoardTx, mutateSlideBoardTx, postLocalBoardSync],
  );

  const clearScopeStrokes = useCallback(
    (slideIndex: number, scopeKey: string) => {
      const curPerm = strokesRef.current[slideIndex] ?? [];
      const nextPerm = curPerm.filter((s) => s.scopeKey !== scopeKey);
      const curTemp = tempStrokesRef.current[slideIndex] ?? [];
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
    },
    [broadcastEphemeralLocal, mutateEphemeralBoardTx, mutateSlideBoardTx, postLocalBoardSync],
  );

  const clearSlideStrokes = useCallback(
    (slideIndex: number) => {
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
    },
    [broadcastEphemeralLocal, mutateEphemeralBoardTx, mutateSlideBoardTx, postLocalBoardSync],
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

      const nextImages = [...imagesRef.current, item].slice(-50);
      setImages(nextImages);
      postLocalBoardSync({ images: nextImages });

      if (isFirebaseActive && user) {
        const roomRef = doc(db, 'rooms', roomId);
        const imgRef = doc(db, 'rooms', roomId, 'images', id);
        try {
          await runTransaction(db, async (tx) => {
            const roomSnap = await tx.get(roomRef);
            const curIds: string[] =
              roomSnap.exists() && Array.isArray(roomSnap.data().imageIds)
                ? roomSnap.data().imageIds
                : roomImageIdsRef.current;
            const nextIds = mergeIdList(curIds, id, undefined, 50);

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
              authorId: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            tx.update(roomRef, {
              imageIds: nextIds,
              updatedAt: serverTimestamp(),
            });
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `rooms/${roomId}/images/${id}`);
        }
      }
      return item;
    },
    [currentAuthorId, isFirebaseActive, postLocalBoardSync, roomId, user],
  );

  // Update Image Position/Size/Scope
  const updateImage = useCallback(
    async (
      imageId: string,
      patch: Partial<Pick<SlideImageItem, 'scopeKey' | 'x' | 'y' | 'width' | 'height'>>,
      commitToRemote = true,
    ) => {
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

      if (commitToRemote && isFirebaseActive && user && updatedItem) {
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
    },
    [isFirebaseActive, postLocalBoardSync, roomId, user],
  );

  // Delete Image via room transaction
  const deleteImage = useCallback(
    async (imageId: string) => {
      const nextImages = imagesRef.current.filter((img) => img.id !== imageId);
      setImages(nextImages);
      postLocalBoardSync({ images: nextImages });

      if (isFirebaseActive && user) {
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
    [isFirebaseActive, postLocalBoardSync, roomId, user],
  );

  // Inline Text Edit (create/update/reset) via conflict-free transaction
  const setTextEdit = useCallback(
    (slideIndex: number, textKey: string, value: string | null) => {
      const nextSlideMap = mergeTextEditMap(
        textEditsRef.current[slideIndex] ?? {},
        textKey,
        value,
        200,
      );
      const nextMap = { ...textEditsRef.current, [slideIndex]: nextSlideMap };
      setTextEditsBySlide(nextMap);
      postLocalBoardSync({ textEditsBySlide: nextMap });

      void mutateSlideBoardTx(slideIndex, (cur) => ({
        strokes: cur.strokes,
        textEdits: mergeTextEditMap(cur.textEdits, textKey, value, 200),
      }));
    },
    [mutateSlideBoardTx, postLocalBoardSync],
  );

  const signInWithGoogle = useCallback(async () => {
    setSyncError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/unauthorized-domain') {
        setSyncError(
          `Domain (${window.location.hostname}) belum didaftarkan di Firebase Console -> Authentication -> Settings -> Authorized domains.`,
        );
      } else if (code !== 'auth/popup-closed-by-user') {
        setSyncError(err instanceof Error ? err.message : 'Log masuk Google gagal.');
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    anonAttemptedRef.current = false;
    setSyncError(null);
    if (!anonBlocked) {
      try {
        await signInAnonymously(auth);
      } catch {
        setSyncStatus('local');
      }
    } else {
      setSyncStatus('local');
    }
  }, [anonBlocked]);

  const joinRoom = useCallback((nextRoomId: string, nextJoinCode: string) => {
    const cleanRoom = nextRoomId.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    const cleanCode = nextJoinCode.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
    if (cleanRoom.length < 3 || cleanCode.length < 3) {
      setSyncError('ID Bilik dan Kod Sertai mesti sekurang-kurangnya 3 aksara (huruf/nombor).');
      return;
    }
    setSyncError(null);
    setRoomId(cleanRoom);
    setJoinCode(cleanCode);
  }, []);

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

      const nextTexts = [...textsRef.current, item].slice(-60);
      setTexts(nextTexts);
      postLocalBoardSync({ texts: nextTexts });

      if (isFirebaseActive && user) {
        void setDoc(doc(db, 'rooms', roomId, 'texts', id), {
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
          authorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `rooms/${roomId}/texts/${id}`),
        );
      }

      return item;
    },
    [currentAuthorId, isFirebaseActive, postLocalBoardSync, roomId, user],
  );

  // Update Movable Text Box
  const updateSlideText = useCallback(
    (textId: string, patch: Partial<SlideTextItem>, commitToRemote = true) => {
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

      if (commitToRemote && isFirebaseActive && user && updatedItem) {
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
          handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}/texts/${textId}`),
        );
      }
    },
    [isFirebaseActive, postLocalBoardSync, roomId, user],
  );

  // Delete Movable Text Box
  const deleteSlideText = useCallback(
    (textId: string) => {
      const nextTexts = textsRef.current.filter((t) => t.id !== textId);
      setTexts(nextTexts);
      postLocalBoardSync({ texts: nextTexts });

      if (isFirebaseActive && user) {
        void deleteDoc(doc(db, 'rooms', roomId, 'texts', textId)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `rooms/${roomId}/texts/${textId}`),
        );
      }
    },
    [isFirebaseActive, postLocalBoardSync, roomId, user],
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

      const nextPdfs = [...pdfPagesRef.current, item].slice(-20);
      setPdfPages(nextPdfs);
      postLocalBoardSync({ pdfPages: nextPdfs });

      if (isFirebaseActive && user) {
        void setDoc(doc(db, 'rooms', roomId, 'pdfPages', id), {
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
          authorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `rooms/${roomId}/pdfPages/${id}`),
        );
      }

      return item;
    },
    [currentAuthorId, isFirebaseActive, postLocalBoardSync, roomId, user],
  );

  // Update PDF Frame Position/Size (the chosen page itself never changes)
  const updateSlidePdf = useCallback(
    (
      pdfId: string,
      patch: Partial<Pick<SlidePdfItem, 'scopeKey' | 'x' | 'y' | 'width' | 'height'>>,
      commitToRemote = true,
    ) => {
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

      if (commitToRemote && isFirebaseActive && user && updatedItem) {
        const finalItem = updatedItem as SlidePdfItem;
        void updateDoc(doc(db, 'rooms', roomId, 'pdfPages', pdfId), {
          scopeKey: finalItem.scopeKey,
          x: finalItem.x,
          y: finalItem.y,
          width: finalItem.width,
          height: finalItem.height,
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}/pdfPages/${pdfId}`),
        );
      }
    },
    [isFirebaseActive, postLocalBoardSync, roomId, user],
  );

  // Delete PDF Frame
  const deleteSlidePdf = useCallback(
    (pdfId: string) => {
      const nextPdfs = pdfPagesRef.current.filter((pdf) => pdf.id !== pdfId);
      setPdfPages(nextPdfs);
      postLocalBoardSync({ pdfPages: nextPdfs });

      if (isFirebaseActive && user) {
        void deleteDoc(doc(db, 'rooms', roomId, 'pdfPages', pdfId)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `rooms/${roomId}/pdfPages/${pdfId}`),
        );
      }
    },
    [isFirebaseActive, postLocalBoardSync, roomId, user],
  );

  // ── Live room presence & location ─────────────────────────────────────────

  // Keep the online window fresh even when no Firestore snapshot arrives.
  useEffect(() => {
    const timer = window.setInterval(() => setPresenceTick((n) => n + 1), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  // Silent IP-based location so partners still see an approximate place when
  // device GPS is disabled or permission is denied.
  const ipPresenceLookupRef = useRef(false);
  useEffect(() => {
    if (ipPresenceLookupRef.current) return;
    const cached = loadCachedPresenceLocation();
    if (cached) {
      setPresenceLocation(cached);
      return;
    }
    ipPresenceLookupRef.current = true;
    void fetch('/api/geo', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? (res.json() as Promise<Record<string, unknown>>) : null))
      .then((raw) => {
        if (!raw) return;
        const location = normalizePresenceLocation({ ...raw, updatedAt: Date.now() });
        if (location.source === 'none') return;
        setPresenceLocation(location);
        cachePresenceLocation(location);
      })
      .catch(() => {
        // Approximation is optional; GPS refresh remains available.
      });
  }, []);

  const pushPresenceHeartbeat = useCallback(
    async (locationOverride?: PresenceLocation | null) => {
      if (!isFirebaseActive || !user) return;
      const location = locationOverride ?? presenceLocationRef.current;
      const safeLocation = location ?? normalizePresenceLocation(null);
      try {
        await setDoc(
          doc(db, 'rooms', roomId, 'presence', user.uid),
          {
            uid: user.uid,
            displayName: effectivePresenceNameRef.current,
            isAnonymous: user.isAnonymous,
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
        handleFirestoreError(err, OperationType.WRITE, `rooms/${roomId}/presence/${user.uid}`);
      }
    },
    [isFirebaseActive, roomId, user],
  );

  // Subscribe to the presence collection for this room.
  useEffect(() => {
    if (!isFirebaseActive || !user) {
      setPresenceUsers([]);
      return;
    }
    const presenceRef = collection(db, 'rooms', roomId, 'presence');
    const unsub = onSnapshot(
      presenceRef,
      (snap) => {
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
      (err) =>
        handleFirestoreError(err, OperationType.GET, `rooms/${roomId}/presence`),
    );
    return () => unsub();
  }, [isFirebaseActive, roomId, user]);

  // Heartbeat every 25s (and immediately when the tab becomes visible again).
  useEffect(() => {
    if (!isFirebaseActive || !user) return;
    void pushPresenceHeartbeat();
    const timer = window.setInterval(() => void pushPresenceHeartbeat(), PRESENCE_HEARTBEAT_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void pushPresenceHeartbeat();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      void deleteDoc(doc(db, 'rooms', roomId, 'presence', user.uid)).catch(() => {
        // Best-effort departure marker; stale heartbeats are filtered anyway.
      });
    };
  }, [isFirebaseActive, pushPresenceHeartbeat, roomId, user]);

  // Publish immediately after a name or location change.
  useEffect(() => {
    if (!isFirebaseActive || !user) return;
    void pushPresenceHeartbeat();
  }, [isFirebaseActive, presenceLocation, presenceName, pushPresenceHeartbeat, user]);

  const refreshPresenceLocation = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setPresenceLocationError(
        'Peranti ini tidak menyokong GPS. Lokasi anggaran internet masih dipaparkan.',
      );
      return;
    }
    setPresenceLocationBusy(true);
    setPresenceLocationError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 30_000,
        });
      });
      const { latitude, longitude, accuracy } = position.coords;
      let details: Record<string, unknown> = {};
      try {
        const res = await fetch(
          `/api/geo/reverse?lat=${latitude.toFixed(6)}&lng=${longitude.toFixed(6)}`,
          { headers: { Accept: 'application/json' } },
        );
        if (res.ok) details = (await res.json()) as Record<string, unknown>;
      } catch {
        // Coordinates are still useful without a reverse-geocoded label.
      }
      const city = typeof details.city === 'string' ? details.city : '';
      const region = typeof details.region === 'string' ? details.region : '';
      const country = typeof details.country === 'string' ? details.country : '';
      const location = normalizePresenceLocation({
        ...details,
        source: 'gps',
        latitude,
        longitude,
        accuracy,
        label: buildLocationLabel(city, region, country),
        updatedAt: Date.now(),
      });
      setPresenceLocation(location);
      presenceLocationRef.current = location;
      cachePresenceLocation(location);
      await pushPresenceHeartbeat(location);
    } catch (err) {
      const code = (err as { code?: number })?.code;
      setPresenceLocationError(
        code === 1
          ? 'Kebenaran lokasi ditolak. Lokasi anggaran internet masih dipaparkan kepada rakan pasukan.'
          : 'Lokasi tepat tidak dapat diperoleh. Lokasi anggaran internet masih digunakan.',
      );
    } finally {
      setPresenceLocationBusy(false);
    }
  }, [pushPresenceHeartbeat]);

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
    if (isFirebaseActive && user && !fresh.some((entry) => entry.uid === user.uid)) {
      fresh.push({
        uid: user.uid,
        displayName: effectivePresenceName,
        isAnonymous: user.isAnonymous,
        location: presenceLocation,
        lastSeen: now,
      });
    }
    fresh.sort((a, b) => {
      if (a.uid === user?.uid) return -1;
      if (b.uid === user?.uid) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
    return fresh;
    // presenceTick intentionally re-evaluates the online window over time.
  }, [presenceUsers, presenceTick, isFirebaseActive, user, effectivePresenceName, presenceLocation]);

  const activePermanentStrokes = strokesBySlide[currentSlideIndex] ?? [];
  const activeTempStrokes = tempStrokesBySlide[currentSlideIndex] ?? [];
  const activeLiveStrokes = liveStrokesBySlide[currentSlideIndex] ?? {};
  const activeTextEdits = textEditsBySlide[currentSlideIndex] ?? {};
  const activeSlideImages = images.filter((img) => img.slideIndex === currentSlideIndex);
  const activeSlideTexts = texts.filter((t) => t.slideIndex === currentSlideIndex);
  const activeSlidePdfs = pdfPages.filter((pdf) => pdf.slideIndex === currentSlideIndex);

  return {
    user,
    authReady,
    anonBlocked,
    roomId,
    joinCode,
    syncStatus,
    syncError,
    isFirebaseActive,
    currentAuthorId,
    activePermanentStrokes,
    activeTempStrokes,
    activeLiveStrokes,
    activeTextEdits,
    activeSlideImages,
    activeSlideTexts,
    activeSlidePdfs,
    presenceUsers: onlinePresenceUsers,
    presenceLocation,
    presenceLocationBusy,
    presenceLocationError,
    presenceDisplayName: effectivePresenceName,
    updatePresenceDisplayName,
    refreshPresenceLocation,
    signInWithGoogle,
    signOutUser,
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
  };
}
