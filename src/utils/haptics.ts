/**
 * Subsystem 10: CoreHaptics-Inspired Synchronized Tactile Choreography
 *
 * Maps discrete physical UI events to short transient haptic impulses on
 * supported devices (`navigator.vibrate`) and degrades silently to a safe no-op
 * on desktop/unsupported browsers.
 */

export type HapticStyle = 'detent' | 'toggle' | 'snap' | 'soft';

const HAPTIC_PATTERNS: Record<HapticStyle, number | number[]> = {
  /** High sharpness crisp click (picker wheel tick / button detent) */
  detent: 5,
  /** Medium toggle switch / mode activation */
  toggle: 9,
  /** Double mechanical rubber-band boundary snap */
  snap: [6, 18, 8],
  /** Low-sharpness soft rubbery acknowledgement */
  soft: 12,
};

let lastHapticTimestamp = 0;

export function triggerHaptic(style: HapticStyle = 'detent'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  const now = Date.now();
  // Coalesce bursts < 18ms apart to preserve crisp single-phase latency
  if (now - lastHapticTimestamp < 18) return;
  lastHapticTimestamp = now;
  try {
    navigator.vibrate(HAPTIC_PATTERNS[style]);
  } catch {
    // Silently ignore in restricted iframes / desktop Safari
  }
}
