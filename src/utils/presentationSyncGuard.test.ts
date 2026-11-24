import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ROOM_ECHO_SUPPRESS_MS,
  shouldAcceptRemoteRoomSnapshot,
} from './presentationSyncGuard.ts';

test('shouldAcceptRemoteRoomSnapshot allows initial room hydration when no local navigation occurred', () => {
  assert.equal(
    shouldAcceptRemoteRoomSnapshot({
      hasPendingWrites: false,
      now: 10_000,
      lastLocalPushAt: 0,
      inFlightWrites: 0,
      hasPendingLocalPush: false,
    }),
    true,
  );
});

test('shouldAcceptRemoteRoomSnapshot blocks stale server snapshot while local push is pending or in-flight', () => {
  assert.equal(
    shouldAcceptRemoteRoomSnapshot({
      hasPendingWrites: false,
      now: 10_000,
      lastLocalPushAt: 9_900,
      inFlightWrites: 0,
      hasPendingLocalPush: true,
    }),
    false,
  );

  assert.equal(
    shouldAcceptRemoteRoomSnapshot({
      hasPendingWrites: false,
      now: 25_000,
      lastLocalPushAt: 5_000,
      inFlightWrites: 1,
      hasPendingLocalPush: false,
    }),
    false,
  );

  assert.equal(
    shouldAcceptRemoteRoomSnapshot({
      hasPendingWrites: true,
      now: 25_000,
      lastLocalPushAt: 0,
      inFlightWrites: 0,
      hasPendingLocalPush: false,
    }),
    false,
  );
});

test('shouldAcceptRemoteRoomSnapshot suppresses echoes within echo window and accepts afterwards', () => {
  assert.equal(
    shouldAcceptRemoteRoomSnapshot({
      hasPendingWrites: false,
      now: 10_000 + ROOM_ECHO_SUPPRESS_MS - 1,
      lastLocalPushAt: 10_000,
      inFlightWrites: 0,
      hasPendingLocalPush: false,
    }),
    false,
  );

  assert.equal(
    shouldAcceptRemoteRoomSnapshot({
      hasPendingWrites: false,
      now: 10_000 + ROOM_ECHO_SUPPRESS_MS,
      lastLocalPushAt: 10_000,
      inFlightWrites: 0,
      hasPendingLocalPush: false,
    }),
    true,
  );
});
