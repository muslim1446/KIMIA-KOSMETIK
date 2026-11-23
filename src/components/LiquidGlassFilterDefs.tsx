import { useEffect, useState } from 'react';
import { APPLE_TOUCH_FROST_ENVELOPE } from '../utils/applePhysics';
import { triggerHaptic } from '../utils/haptics';
import { generateSnellDisplacementDataUrl } from '../utils/liquidGlassEngine';

/**
 * Mounts invisible SVG QuartzCore-aligned filter definitions:
 * - #apple-glass-refract-pill & #apple-glass-refract-sheet (kCACornerCurveContinuous Snell displacement + pre-blur saturate)
 * - #apple-gooey-merge (Blur + Alpha-Threshold matrix with gain=18, bias=-7 to avoid 8-bit banding)
 *
 * Also drives the decoupled 660ms touch-frost illumination envelope (`data-frost="active"`,
 * `--touch-x`, `--touch-y`) and progressive tactile detent triggers on `.apple-pressable`.
 */
export function LiquidGlassFilterDefs() {
  const [maps, setMaps] = useState<{ pill: string; sheet: string }>({ pill: '', sheet: '' });

  useEffect(() => {
    const pill = generateSnellDisplacementDataUrl({
      width: 192,
      height: 52,
      cornerRadius: 26,
      bezelWidth: 10,
      refractAmount: 18,
      maxScale: 24,
    });
    const sheet = generateSnellDisplacementDataUrl({
      width: 256,
      height: 256,
      cornerRadius: 28,
      bezelWidth: 16,
      refractAmount: 24,
      maxScale: 28,
    });
    setMaps({ pill, sheet });
  }, []);

  useEffect(() => {
    const timers = new WeakMap<HTMLElement, number>();
    const activeElements = new Set<HTMLElement>();

    const scheduleRelease = (el: HTMLElement) => {
      const existing = timers.get(el);
      if (existing !== undefined) {
        window.clearTimeout(existing);
      }
      const id = window.setTimeout(() => {
        el.removeAttribute('data-frost');
        timers.delete(el);
        activeElements.delete(el);
      }, APPLE_TOUCH_FROST_ENVELOPE.holdMs);
      timers.set(el, id);
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const pressable = target?.closest?.('.apple-pressable') as HTMLElement | null;
      if (!pressable) return;
      if ((pressable as HTMLButtonElement).disabled) return;

      const rect = pressable.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const x = Math.round(Math.max(0, Math.min(rect.width, e.clientX - rect.left)));
        const y = Math.round(Math.max(0, Math.min(rect.height, e.clientY - rect.top)));
        pressable.style.setProperty('--touch-x', `${x}px`);
        pressable.style.setProperty('--touch-y', `${y}px`);
      }

      const existing = timers.get(pressable);
      if (existing !== undefined) {
        window.clearTimeout(existing);
        timers.delete(pressable);
      }

      pressable.setAttribute('data-frost', 'active');
      activeElements.add(pressable);
      triggerHaptic('detent');
    };

    const onPointerRelease = () => {
      activeElements.forEach((el) => {
        if (timers.get(el) === undefined) {
          scheduleRelease(el);
        }
      });
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerup', onPointerRelease, { passive: true });
    document.addEventListener('pointercancel', onPointerRelease, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerRelease);
      document.removeEventListener('pointercancel', onPointerRelease);
      activeElements.forEach((el) => {
        const id = timers.get(el);
        if (id !== undefined) window.clearTimeout(id);
      });
    };
  }, []);

  if (!maps.pill && !maps.sheet) return null;

  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      className="fixed top-0 left-0 pointer-events-none opacity-0"
    >
      <defs>
        {maps.pill && (
          <filter
            id="apple-glass-refract-pill"
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix type="saturate" values="2.0" result="boosted" />
            <feImage href={maps.pill} result="dispMap" preserveAspectRatio="none" />
            <feDisplacementMap
              in="boosted"
              in2="dispMap"
              scale="24"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        )}
        {maps.sheet && (
          <filter
            id="apple-glass-refract-sheet"
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix type="saturate" values="1.9" result="boosted" />
            <feImage href={maps.sheet} result="dispMap" preserveAspectRatio="none" />
            <feDisplacementMap
              in="boosted"
              in2="dispMap"
              scale="28"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        )}
        {/* Subsystem 5: Gooey Metaball Bridge (blur 9px + alpha threshold 18*a - 7, gain <= 19 prevents 8-bit banding) */}
        <filter id="apple-gooey-merge" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blurred" />
          <feColorMatrix
            in="blurred"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="crushed"
          />
          <feComposite in="SourceGraphic" in2="crushed" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}
