import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
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
  mergeIdList,
  mergeLiveStrokeMap,
  mergeStrokeBatch,
  mergeStrokeList,
  mergeTextEditMap,
  PenStroke,
  pruneExpiredTempStrokes,
  removeStrokesFromList,
  sanitizeTextOverride,
  SlideImageItem,
} from '../utils/annotationEngine';
import { SyncedPresentationState } from './usePresentationSync';

export type BoardSyncStatus = 'local' | 'connecting' | 'synced' | 'error';

export interface LiveStrokeMap {
  [authorId: string]: PenStroke;
}

interface LocalBoardStorage {
  strokesBySlide: Record<number, PenStroke[]>;
  textEditsBySlide: Record<number, Record<string, string>>;
  images: SlideImageItem[];
}

const LOCAL_BOARD_KEY = 'kimia-5-4-board-v3';
const BOARD_BC_NAME = 'kimia-5-4-board-channel-v3';
const DEFAULT_ROOM_ID = 'kimia-5-4-main';
const DEFAULT_JOIN_CODE = 'KIMIA54';

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
    return { strokesBySlide: {}, textEditsBySlide: {}, images: [] };
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_BOARD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalBoardStorage>;
      return {
        strokesBySlide: parsed.strokesBySlide ?? {},
        textEditsBySlide: parsed.textEditsBySlide ?? {},
        images: Array.isArray(parsed.images) ? parsed.images : [],
      };
    }
  } catch {
    // Ignore corrupt localStorage
  }
  return { strokesBySlide: {}, textEditsBySlide: {}, images: [] };
}

function saveLocalBoard(data: LocalBoardStorage) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_BOARD_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota overflow in localStorage
  }
}

function makeClientId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

  const localAuthorIdRef = useRef<string>(
    `local-${Math.random().toString(36).slice(2, 8)}`,
  );
  const anonAttemptedRef = useRef(false);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const roomImageIdsRef = useRef<string[]>([]);
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

  const isFirebaseActive = Boolean(authReady && user && syncStatus === 'synced');
  const currentAuthorId = user?.uid ?? localAuthorIdRef.current;

  // Persist local board & broadcast to same-browser tabs (?mode=audiens)
  useEffect(() => {
    saveLocalBoard({
      strokesBySlide,
      textEditsBySlide,
      images,
    });
  }, [strokesBySlide, textEditsBySlide, images]);

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
        const roomSnap = await Promise.race([
          getDoc(roomRef).catch(async (err) => {
            if (err?.code === 'permission-denied') {
              return null;
            }
            throw err;
          }),
          timeoutPromise,
        ]);

        if (cancelled) return;

        if (roomSnap && !roomSnap.exists()) {
          // Brand new room: create room + owner membership + seed any local offline strokes/edits atomically
          const batch = writeBatch(db);
          const ps = presentationStateRef.current;
          const localImgs = imagesRef.current.slice(-50);
          const seededImageIds = localImgs.map((img) => img.id);

          batch.set(roomRef, {
            ownerId: user.uid,
            title: 'Pembentangan Kimia 5.4',
            joinCode: safeJoinCode,
            slideIndex: ps.slideIndex,
            blackout: ps.blackout,
            projectorDark: ps.projectorDark,
            laser: ps.laser,
            interactions: ps.interactions,
            imageIds: seededImageIds,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          batch.set(memberRef, {
            uid: user.uid,
            displayName: memberDisplayName,
            role: 'owner',
            joinCode: safeJoinCode,
            joinedAt: serverTimestamp(),
          });

          for (let i = 0; i < 9; i++) {
            const localStrokes = (strokesRef.current[i] ?? []).slice(-400);
            const localEdits = Object.fromEntries(
              Object.entries(textEditsRef.current[i] ?? {}).slice(-200),
            );
            if (localStrokes.length > 0 || Object.keys(localEdits).length > 0) {
              batch.set(doc(db, 'rooms', safeRoomId, 'slides', `slide_${i}`), {
                roomId: safeRoomId,
                slideIndex: i,
                strokes: localStrokes,
                textEdits: localEdits,
                updatedAt: serverTimestamp(),
                updatedBy: user.uid,
              });
            }
          }

          for (const img of localImgs) {
            batch.set(doc(db, 'rooms', safeRoomId, 'images', img.id), {
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

          await batch.commit();
        } else {
          // Existing room: ensure membership via joinCode
          let memberExists = false;
          try {
            const memberSnap = await getDoc(memberRef);
            memberExists = memberSnap.exists();
          } catch {
            memberExists = false;
          }

          if (!memberExists) {
            await setDoc(memberRef, {
              uid: user.uid,
              displayName: memberDisplayName,
              role: 'editor',
              joinCode: safeJoinCode,
              joinedAt: serverTimestamp(),
            });
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
              onRemotePresentationSync({
                slideIndex: typeof data.slideIndex === 'number' ? data.slideIndex : 0,
                blackout: Boolean(data.blackout),
                projectorDark: Boolean(data.projectorDark),
                laser: data.laser,
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
                setTempStrokesBySlide((prev) => ({ ...prev, [i]: temp }));
                setLiveStrokesBySlide((prev) => ({
                  ...prev,
                  [i]: d.liveStrokes && typeof d.liveStrokes === 'object' ? d.liveStrokes : {},
                }));
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
          laser: next.laser,
          interactions: next.interactions,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [isFirebaseActive, user, roomId],
  );

  // Atomic transaction helper for SlideBoard (prevents concurrent teammates from overwriting each other)
  const mutateSlideBoardTx = useCallback(
    async (
      slideIndex: number,
      mutator: (current: {
        strokes: PenStroke[];
        textEdits: Record<string, string>;
      }) => { strokes: PenStroke[]; textEdits: Record<string, string> },
    ) => {
      if (!isFirebaseActive || !user) return;
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
    },
    [isFirebaseActive, user, roomId],
  );

  // Atomic transaction helper for EphemeralBoard (live in-progress & fading temp strokes)
  const mutateEphemeralBoardTx = useCallback(
    async (
      slideIndex: number,
      mutator: (current: {
        tempStrokes: PenStroke[];
        liveStrokes: LiveStrokeMap;
      }) => { tempStrokes: PenStroke[]; liveStrokes: LiveStrokeMap },
    ) => {
      if (!isFirebaseActive || !user) return;
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
          const curLive: LiveStrokeMap =
            curData && curData.liveStrokes && typeof curData.liveStrokes === 'object'
              ? curData.liveStrokes
              : {};

          const next = mutator({ tempStrokes: curTemp, liveStrokes: curLive });
          const boundedTemp = pruneExpiredTempStrokes(next.tempStrokes, now).slice(-120);
          const boundedLive = Object.fromEntries(
            Object.entries(next.liveStrokes).slice(-20),
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

      const nextMap = { ...strokesRef.current, [slideIndex]: nextPerm };
      setStrokesBySlide(nextMap);
      setTempStrokesBySlide((prev) => ({ ...prev, [slideIndex]: nextTemp }));
      postLocalBoardSync({ strokesBySlide: nextMap });
      broadcastEphemeralLocal(
        slideIndex,
        nextTemp,
        liveStrokesRef.current[slideIndex] ?? {},
      );

      void mutateSlideBoardTx(slideIndex, (cur) => ({
        strokes: cur.strokes.filter((s) => s.scopeKey !== scopeKey),
        textEdits: cur.textEdits,
      }));
      void mutateEphemeralBoardTx(slideIndex, (cur) => ({
        tempStrokes: cur.tempStrokes.filter((s) => s.scopeKey !== scopeKey),
        liveStrokes: cur.liveStrokes,
      }));
    },
    [broadcastEphemeralLocal, mutateEphemeralBoardTx, mutateSlideBoardTx, postLocalBoardSync],
  );

  const clearSlideStrokes = useCallback(
    (slideIndex: number) => {
      const nextMap = { ...strokesRef.current, [slideIndex]: [] };
      setStrokesBySlide(nextMap);
      setTempStrokesBySlide((prev) => ({ ...prev, [slideIndex]: [] }));
      postLocalBoardSync({ strokesBySlide: nextMap });
      broadcastEphemeralLocal(
        slideIndex,
        [],
        liveStrokesRef.current[slideIndex] ?? {},
      );

      void mutateSlideBoardTx(slideIndex, (cur) => ({
        strokes: [],
        textEdits: cur.textEdits,
      }));
      void mutateEphemeralBoardTx(slideIndex, (cur) => ({
        tempStrokes: [],
        liveStrokes: cur.liveStrokes,
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

  const activePermanentStrokes = strokesBySlide[currentSlideIndex] ?? [];
  const activeTempStrokes = tempStrokesBySlide[currentSlideIndex] ?? [];
  const activeLiveStrokes = liveStrokesBySlide[currentSlideIndex] ?? {};
  const activeTextEdits = textEditsBySlide[currentSlideIndex] ?? {};
  const activeSlideImages = images.filter((img) => img.slideIndex === currentSlideIndex);

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
    signInWithGoogle,
    signOutUser,
    joinRoom,
    pushPresentationStateToFirebase,
    updateLiveStroke,
    commitStroke,
    deleteStrokesById,
    clearScopeStrokes,
    clearSlideStrokes,
    addImage,
    updateImage,
    deleteImage,
    setTextEdit,
  };
}
