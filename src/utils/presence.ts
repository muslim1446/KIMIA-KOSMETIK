export type PresenceLocationSource = 'gps' | 'ip' | 'none';

export interface PresenceLocation {
  source: PresenceLocationSource;
  label: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  updatedAt: number;
}

export interface PresenceUser {
  uid: string;
  displayName: string;
  isAnonymous: boolean;
  location: PresenceLocation | null;
  lastSeen: number;
}

/** A member counts as online while their heartbeat is younger than this. */
export const PRESENCE_ONLINE_WINDOW_MS = 80_000;
/** Presence heartbeat cadence (seconds). */
export const PRESENCE_HEARTBEAT_MS = 25_000;
/** How long an IP/GPS lookup result stays usable on this device. */
export const PRESENCE_LOCATION_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export const PRESENCE_LOCAL_STORAGE_KEY = 'kimia-5-4-presence-location';
export const PRESENCE_NAME_STORAGE_KEY = 'kimia-5-4-presence-name';
export const PRESENCE_AUTHOR_ID_STORAGE_KEY = 'kimia-5-4-presence-author-id';

const EMPTY_LOCATION: PresenceLocation = {
  source: 'none',
  label: '',
  city: '',
  region: '',
  country: '',
  countryCode: '',
  latitude: 0,
  longitude: 0,
  accuracy: 0,
  updatedAt: 0,
};

export function buildLocationLabel(city: string, region: string, country: string): string {
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const raw of [city, region, country]) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(value);
  }
  return parts.join(', ').slice(0, 160);
}

export function normalizePresenceLocation(raw: unknown): PresenceLocation {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_LOCATION };
  const value = raw as Record<string, unknown>;
  const source: PresenceLocationSource =
    value.source === 'gps' || value.source === 'ip' ? value.source : 'none';
  const city = typeof value.city === 'string' ? value.city.trim().slice(0, 80) : '';
  const region = typeof value.region === 'string' ? value.region.trim().slice(0, 80) : '';
  const country = typeof value.country === 'string' ? value.country.trim().slice(0, 80) : '';
  const fallbackLabel = buildLocationLabel(city, region, country);
  const label =
    typeof value.label === 'string' && value.label.trim()
      ? value.label.trim().slice(0, 160)
      : fallbackLabel;

  const finite = (input: unknown, fallback: number) =>
    typeof input === 'number' && Number.isFinite(input) ? input : fallback;

  return {
    source,
    label,
    city,
    region,
    country,
    countryCode:
      typeof value.countryCode === 'string' ? value.countryCode.trim().toUpperCase().slice(0, 8) : '',
    latitude: Math.max(-90, Math.min(90, finite(value.latitude, 0))),
    longitude: Math.max(-180, Math.min(180, finite(value.longitude, 0))),
    accuracy: Math.max(0, finite(value.accuracy, 0)),
    updatedAt: Math.max(0, finite(value.updatedAt, 0)),
  };
}

export function describePresenceLocation(location: PresenceLocation | null): string {
  if (!location || location.source === 'none' || !location.label) return '';
  return location.label;
}

export function presenceSourceLabel(
  location: PresenceLocation | null,
  labels: { gps: string; ip: string; none: string },
): string {
  if (!location) return labels.none;
  return labels[location.source];
}

export function loadCachedPresenceLocation(): PresenceLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PRESENCE_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = normalizePresenceLocation(JSON.parse(raw));
    if (parsed.source === 'none') return null;
    if (Date.now() - parsed.updatedAt > PRESENCE_LOCATION_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function cachePresenceLocation(location: PresenceLocation): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PRESENCE_LOCAL_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Ignore storage quota/privacy failures
  }
}

/**
 * A per-tab author id that survives page reloads (kept in sessionStorage) but
 * is never shared with other tabs. This stops a reload from leaving an
 * orphaned "still online" ghost in the presence list, while each tab keeps its
 * own identity. Falls back to a random id when storage is unavailable.
 */
export function loadOrCreateLocalAuthorId(): string {
  const random = `local-${Math.random().toString(36).slice(2, 8)}`;
  if (typeof window === 'undefined') return random;
  try {
    const existing = window.sessionStorage.getItem(PRESENCE_AUTHOR_ID_STORAGE_KEY);
    if (existing && /^[A-Za-z0-9_-]{4,64}$/.test(existing)) return existing;
    const created = `${random}${Date.now().toString(36).slice(-4)}`;
    window.sessionStorage.setItem(PRESENCE_AUTHOR_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return random;
  }
}

export function loadPresenceDisplayName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (window.localStorage.getItem(PRESENCE_NAME_STORAGE_KEY) ?? '').trim().slice(0, 80);
  } catch {
    return '';
  }
}

export function savePresenceDisplayName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PRESENCE_NAME_STORAGE_KEY, name.trim().slice(0, 80));
  } catch {
    // Ignore storage failures
  }
}
