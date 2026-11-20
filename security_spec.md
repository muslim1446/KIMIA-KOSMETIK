# Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Authenticated Open-World Access (Anonymous + Google Auth)**: Every read and write requires `request.auth != null` (fulfilled silently via Firebase Anonymous Auth for zero-login collaboration, or optionally via Google Sign-In). Unauthenticated requests without a Firebase Auth token are rejected to protect against anonymous bot quota exhaustion.
2. **Membership Gate (Master Gate)**: Access to `/rooms/{roomId}`, `/rooms/{roomId}/slides/{slideKey}`, `/rooms/{roomId}/ephemeral/{slideKey}`, and `/rooms/{roomId}/images/{imageId}` requires the caller to be a registered member at `/rooms/{roomId}/members/{request.auth.uid}` (or the room owner during initial setup).
3. **Join Code Verification**: Joining a room by creating `/rooms/{roomId}/members/{uid}` requires `uid == request.auth.uid`, `role == 'editor'`, and `joinCode == get(.../rooms/{roomId}).data.joinCode` (unless creating the `'owner'` membership simultaneously with `/rooms/{roomId}` via `getAfter`).
4. **Anti-Data-Loss Deletion Lock**: `rooms/{roomId}`, `slides/{slideKey}`, and `ephemeral/{slideKey}` disallow `delete` (`allow delete: if false`) so no single visitor can wipe an entire shared presentation or its slide history.
5. **Immutable Provenance & Server Timestamps**: `ownerId`, `authorId`, `roomId`, `createdAt`, and `joinedAt` are immutable after creation; `createdAt`, `joinedAt`, and `updatedAt` must equal `request.time`.
6. **Strict Schema & Bounds**: Every document enforces `keys().hasAll(...)` and `keys().hasOnly(...)`, strict types, `.size()` bounds on all strings/arrays/maps, and `affectedKeys().hasOnly(...)` on every update branch.
7. **Zero `allow list` Exposure**: All client sync uses single-document `get`/`onSnapshot(doc(...))` listeners; `allow list` is explicitly `false` on all collections.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return `PERMISSION_DENIED`)
1. **Unauthenticated Room Read**: `get(/rooms/kimia-5-4-main)` with `auth == null`.
2. **Unauthenticated Slide Write**: `update(/rooms/kimia-5-4-main/slides/slide_0)` with `auth == null`.
3. **Owner Spoofing**: `create(/rooms/r1)` with `ownerId: "victim-uid"` != `request.auth.uid`.
4. **Privilege Escalation on Join**: `create(/rooms/r1/members/attacker)` with `role: "owner"` when room already exists.
5. **Wrong Join Code**: `create(/rooms/r1/members/attacker)` with `role: "editor"` and `joinCode: "WRONG"`.
6. **Member Impersonation**: `create(/rooms/r1/members/victim)` by `attacker`.
7. **Shadow Field Injection**: `update(/rooms/r1)` adding `{ isAdmin: true }`.
8. **Destructive Room / Slide Wipe**: `delete(/rooms/r1)` or `delete(/rooms/r1/slides/slide_0)` by any member.
9. **Immutable Timestamp Tampering**: `update(/rooms/r1)` changing `createdAt` or passing client timestamp instead of `request.time`.
10. **Denial-of-Wallet Oversized ID**: `get(/rooms/long_1500_char_id...)` rejected by `isValidId()`.
11. **Oversized Image Payload**: `create(/rooms/r1/images/img1)` with `dataUrl.size() > 360000`.
12. **Collection Scraping (`list`)**: `list(/rooms)` or `list(/rooms/r1/images)` by any user.
