export const ROOM_ECHO_SUPPRESS_MS = 1800;

export interface RoomSnapshotGuardInput {
  hasPendingWrites: boolean;
  now: number;
  lastLocalPushAt: number;
  inFlightWrites: number;
  hasPendingLocalPush: boolean;
}

/**
 * Prevents stale Firestore room snapshots (e.g. initial connect snapshot after
 * an offline/connecting slide tap, slow 4G roundtrips, or concurrent laser writes)
 * from reverting a user's just-clicked local slide/tab navigation.
 */
export function shouldAcceptRemoteRoomSnapshot(input: RoomSnapshotGuardInput): boolean {
  if (input.hasPendingWrites) return false;
  if (input.hasPendingLocalPush) return false;
  if (input.inFlightWrites > 0) return false;
  if (input.lastLocalPushAt > 0 && input.now - input.lastLocalPushAt < ROOM_ECHO_SUPPRESS_MS) {
    return false;
  }
  return true;
}
