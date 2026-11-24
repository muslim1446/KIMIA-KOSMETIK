import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Pencil, RotateCcw, X } from 'lucide-react';
import { AnnotationTool, getRootSlideScope } from '../utils/annotationEngine';
import { APPLE_SPRINGS, APPLE_TOUCH_SLOP_PX } from '../utils/applePhysics';
import { useUiText } from '../utils/uiLanguage';

interface InvisibleTextEditorProps {
  slideIndex: number;
  slideRootRef: React.RefObject<HTMLDivElement | null>;
  interactionsKey: string;
  tool: AnnotationTool;
  textEdits: Record<string, string>;
  onSaveTextEdit: (slideIndex: number, textKey: string, value: string | null) => void;
  isRemoteProjector?: boolean;
  isPinchingOrPanning?: boolean;
}

interface ActiveTextMenu {
  textKey: string;
  targetEl: HTMLElement | SVGElement;
  currentText: string;
  hasOverride: boolean;
  x: number;
  y: number;
  mode: 'menu' | 'editing';
}

const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'PATH', 'RECT', 'CIRCLE', 'LINE', 'POLYGON', 'SVG']);

function hasOwnDirectText(el: Element): boolean {
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE && (node.nodeValue?.trim().length ?? 0) > 0) {
      return true;
    }
  }
  return false;
}

function findEditableElement(start: EventTarget | null, root: HTMLElement): HTMLElement | SVGElement | null {
  let cur = start instanceof Node ? (start instanceof Element ? start : start.parentElement) : null;
  while (cur && cur !== root) {
    if (
      cur.closest(
        '[data-slide-image-root], [data-slide-text-root], [data-text-editor-ui], [data-presentation-island]',
      )
    ) {
      return null;
    }
    const tag = cur.tagName.toUpperCase();
    if (!SKIP_TAGS.has(tag)) {
      if (tag === 'TEXT' || hasOwnDirectText(cur)) {
        return cur as HTMLElement | SVGElement;
      }
      // Also allow clicking a button whose text is inside a single child span
      if (tag === 'BUTTON' && (cur.textContent?.trim().length ?? 0) > 0) {
        const firstTextSpan = Array.from(cur.querySelectorAll('span')).find((sp) => hasOwnDirectText(sp));
        if (firstTextSpan) return firstTextSpan;
        return cur as HTMLElement;
      }
    }
    cur = cur.parentElement;
  }
  return null;
}

function computeDeterministicTextKey(
  el: Element,
  root: HTMLElement,
  slideIndex: number,
): string {
  const scopeAnchor = el.closest('[data-storage-scope]') as HTMLElement | null;
  const scopePrefix = scopeAnchor?.dataset.storageScope || getRootSlideScope(slideIndex);
  const boundary: Element = scopeAnchor && root.contains(scopeAnchor) ? scopeAnchor : root;

  const segments: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== boundary) {
    const parent: HTMLElement | null = cur.parentElement;
    if (!parent) break;
    let sameTagIdx = 0;
    const tag = cur.tagName.toLowerCase();
    for (let i = 0; i < parent.children.length; i++) {
      const sibling = parent.children[i];
      if (sibling === cur) break;
      if (sibling.tagName.toLowerCase() === tag) sameTagIdx++;
    }
    segments.unshift(`${tag}[${sameTagIdx}]`);
    cur = parent;
  }

  return `${scopePrefix}|${segments.join('>')}`;
}

function getEditableTextValue(el: Element): string {
  for (let i = 0; i < el.childNodes.length; i++) {
    const n = el.childNodes[i];
    if (n.nodeType === Node.TEXT_NODE && (n.nodeValue?.trim().length ?? 0) > 0) {
      return n.nodeValue ?? '';
    }
  }
  return el.textContent ?? '';
}

function setElementLeafText(el: Element, nextText: string) {
  for (let i = 0; i < el.childNodes.length; i++) {
    const n = el.childNodes[i];
    if (n.nodeType === Node.TEXT_NODE && (n.nodeValue?.trim().length ?? 0) > 0) {
      if (n.nodeValue !== nextText) {
        n.nodeValue = nextText;
      }
      return;
    }
  }
  if (el.childNodes.length === 0) {
    el.textContent = nextText;
  } else {
    const firstText = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
    if (firstText) {
      if (firstText.nodeValue !== nextText) firstText.nodeValue = nextText;
    }
  }
}

export const InvisibleTextEditor: React.FC<InvisibleTextEditorProps> = ({
  slideIndex,
  slideRootRef,
  interactionsKey,
  tool,
  textEdits,
  onSaveTextEdit,
  isRemoteProjector = false,
  isPinchingOrPanning = false,
}) => {
  const t = useUiText();
  const shouldReduceMotion = useReducedMotion();
  const [active, setActive] = useState<ActiveTextMenu | null>(null);
  const [draftValue, setDraftValue] = useState('');
  // Tracks true React text ONLY for keys currently overridden by textEdits
  const overriddenOriginalsRef = useRef<Map<string, string>>(new Map());
  const isApplyingRef = useRef(false);
  const lastLongPressAtRef = useRef(0);
  const isPinchingRef = useRef(isPinchingOrPanning);
  isPinchingRef.current = isPinchingOrPanning;

  // Close editor when switching slides
  useEffect(() => {
    setActive(null);
  }, [slideIndex]);

  // Apply text overrides to the matching slide panel DOM without breaking React reconciliation
  const applyOverrides = useCallback(() => {
    const root = slideRootRef.current;
    if (!root || isApplyingRef.current) return;
    const panel = root.querySelector<HTMLElement>(`[data-slide-panel-index="${slideIndex}"]`);
    if (!panel) return;

    isApplyingRef.current = true;
    try {
      const allEls = panel.querySelectorAll('*');
      allEls.forEach((el) => {
        const tag = el.tagName.toUpperCase();
        if (SKIP_TAGS.has(tag)) return;
        if (tag !== 'TEXT' && !hasOwnDirectText(el)) return;

        const key = computeDeterministicTextKey(el, root, slideIndex);
        if (key.startsWith('__')) return;

        if (Object.prototype.hasOwnProperty.call(textEdits, key)) {
          const currentVal = getEditableTextValue(el);
          if (!overriddenOriginalsRef.current.has(key) && currentVal !== textEdits[key]) {
            overriddenOriginalsRef.current.set(key, currentVal);
          }
          setElementLeafText(el, textEdits[key]);
        } else if (overriddenOriginalsRef.current.has(key)) {
          const orig = overriddenOriginalsRef.current.get(key);
          overriddenOriginalsRef.current.delete(key);
          if (orig !== undefined && getEditableTextValue(el) !== orig) {
            setElementLeafText(el, orig);
          }
        }
      });
    } finally {
      isApplyingRef.current = false;
    }
  }, [slideRootRef, slideIndex, textEdits]);

  useLayoutEffect(() => {
    applyOverrides();
    const root = slideRootRef.current;
    if (!root || typeof MutationObserver === 'undefined') return;

    const mo = new MutationObserver(() => {
      if (!isApplyingRef.current) {
        applyOverrides();
      }
    });
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, [applyOverrides, interactionsKey, slideRootRef]);

  // Right-click anywhere, left-click in 'text-edit' tool, OR stationary touch/pen long-press (460ms)
  useEffect(() => {
    if (isRemoteProjector) return;
    const root = slideRootRef.current;
    if (!root) return;

    const openMenuAtPoint = (targetNode: EventTarget | null, clientX: number, clientY: number): boolean => {
      if (tool === 'pen' || tool === 'eraser' || tool === 'laser') return false;
      const panel = root.querySelector<HTMLElement>(`[data-slide-panel-index="${slideIndex}"]`);
      if (!panel || !(targetNode instanceof Node) || !panel.contains(targetNode)) return false;
      const targetEl = findEditableElement(targetNode, root);
      if (!targetEl) return false;

      const key = computeDeterministicTextKey(targetEl, root, slideIndex);
      const currentText = getEditableTextValue(targetEl);
      const hasOverride = Object.prototype.hasOwnProperty.call(textEdits, key);
      if (hasOverride && !overriddenOriginalsRef.current.has(key)) {
        overriddenOriginalsRef.current.set(key, currentText);
      }

      const maxMenuW = Math.min(310, Math.max(220, window.innerWidth - 24));
      const safeX = Math.min(window.innerWidth - maxMenuW - 12, Math.max(12, clientX));
      const safeY = Math.min(window.innerHeight - 160, Math.max(12, clientY));

      setDraftValue(currentText);
      setActive({
        textKey: key,
        targetEl,
        currentText,
        hasOverride,
        x: safeX,
        y: safeY,
        mode: 'menu',
      });
      return true;
    };

    const onContextMenu = (e: MouseEvent) => {
      if (Date.now() - lastLongPressAtRef.current < 800) {
        e.preventDefault();
        return;
      }
      if (openMenuAtPoint(e.target, e.clientX, e.clientY)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onClickCapture = (e: MouseEvent) => {
      if (tool !== 'text-edit') return;
      if (openMenuAtPoint(e.target, e.clientX, e.clientY)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    let longPressState: {
      pointerId: number;
      startX: number;
      startY: number;
      target: EventTarget | null;
      timer: number;
    } | null = null;

    const clearLongPress = () => {
      if (longPressState) {
        window.clearTimeout(longPressState.timer);
        longPressState = null;
      }
    };

    const onPointerDownCapture = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || isPinchingRef.current) return;
      if (tool === 'pen' || tool === 'eraser' || tool === 'laser') return;
      const panel = root.querySelector<HTMLElement>(`[data-slide-panel-index="${slideIndex}"]`);
      if (!panel || !(e.target instanceof Node) || !panel.contains(e.target)) return;
      const targetEl = findEditableElement(e.target, root);
      if (!targetEl) return;

      clearLongPress();
      const capturedTarget = e.target;
      const capturedX = e.clientX;
      const capturedY = e.clientY;
      const capturedPointerId = e.pointerId;
      const timer = window.setTimeout(() => {
        if (isPinchingRef.current) {
          clearLongPress();
          return;
        }
        if (openMenuAtPoint(capturedTarget, capturedX, capturedY)) {
          lastLongPressAtRef.current = Date.now();
        }
        longPressState = null;
      }, 460);

      longPressState = {
        pointerId: capturedPointerId,
        startX: capturedX,
        startY: capturedY,
        target: capturedTarget,
        timer,
      };
    };

    const onPointerMoveWindow = (e: PointerEvent) => {
      if (!longPressState || e.pointerId !== longPressState.pointerId) return;
      if (Math.hypot(e.clientX - longPressState.startX, e.clientY - longPressState.startY) >= APPLE_TOUCH_SLOP_PX) {
        clearLongPress();
      }
    };

    const onPointerEndWindow = (e: PointerEvent) => {
      if (!longPressState || e.pointerId !== longPressState.pointerId) return;
      clearLongPress();
    };

    root.addEventListener('contextmenu', onContextMenu, true);
    root.addEventListener('click', onClickCapture, true);
    root.addEventListener('pointerdown', onPointerDownCapture, true);
    window.addEventListener('pointermove', onPointerMoveWindow, true);
    window.addEventListener('pointerup', onPointerEndWindow, true);
    window.addEventListener('pointercancel', onPointerEndWindow, true);
    return () => {
      clearLongPress();
      root.removeEventListener('contextmenu', onContextMenu, true);
      root.removeEventListener('click', onClickCapture, true);
      root.removeEventListener('pointerdown', onPointerDownCapture, true);
      window.removeEventListener('pointermove', onPointerMoveWindow, true);
      window.removeEventListener('pointerup', onPointerEndWindow, true);
      window.removeEventListener('pointercancel', onPointerEndWindow, true);
    };
  }, [isRemoteProjector, slideRootRef, slideIndex, tool, textEdits]);

  // Close floating menu on outside tap/click or Escape
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-text-editor-ui]')) return;
      setActive(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [active]);

  if (isRemoteProjector || !active) return null;

  const confirmEdit = () => {
    onSaveTextEdit(slideIndex, active.textKey, draftValue);
    setActive(null);
  };

  const resetEdit = () => {
    onSaveTextEdit(slideIndex, active.textKey, null);
    setActive(null);
  };

  return (
    <motion.div
      data-text-editor-ui="true"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 4 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0.12 } : APPLE_SPRINGS.popover}
      style={{ left: `${active.x}px`, top: `${active.y}px` }}
      className="fixed z-50"
    >
      {active.mode === 'menu' ? (
        <div className="apple-sheet apple-ui apple-squircle flex items-center gap-1 rounded-[18px] p-1.5">
          <button
            type="button"
            data-testid="text-edit-trigger"
            onClick={() => setActive((prev) => (prev ? { ...prev, mode: 'editing' } : null))}
            className="apple-pressable apple-tap-target flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-[12px] text-[12px] font-semibold text-[var(--apple-label)] hover:bg-[var(--apple-fill)] cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-[var(--apple-blue-fg)]" />
            <span>{t('text.edit')}</span>
          </button>

          {active.hasOverride && (
            <button
              type="button"
              onClick={resetEdit}
              title={t('text.restoreTitle')}
              className="apple-pressable apple-tap-target flex items-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-[12px] text-[12px] font-semibold text-[var(--apple-orange-fg)] hover:bg-[color-mix(in_srgb,var(--apple-orange)_14%,transparent)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('text.original')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="apple-sheet apple-ui apple-squircle w-[min(310px,calc(100vw-24px))] rounded-[24px] p-3 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--apple-secondary-label)] tracking-wide px-0.5">
            <span>{t('text.editTitle')}</span>
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label={t('common.cancel')}
              className="apple-pressable apple-tap-target w-7 h-7 rounded-full flex items-center justify-center text-[var(--apple-secondary-label)] hover:bg-[var(--apple-fill)] hover:text-[var(--apple-label)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              data-testid="text-edit-input"
              autoFocus
              rows={draftValue.length > 48 ? 3 : 2}
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  confirmEdit();
                }
              }}
              className="flex-1 rounded-[12px] border border-[var(--apple-separator)] bg-[var(--apple-bg-tertiary)] px-3 py-2 text-[13px] font-medium text-[var(--apple-label)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-blue)] resize-none"
            />
            <button
              type="button"
              data-testid="text-edit-confirm"
              aria-label={t('text.confirmEdit')}
              onClick={confirmEdit}
              className="apple-pressable apple-tap-target shrink-0 w-10 h-10 rounded-[12px] bg-[var(--apple-green-fg)] hover:opacity-90 text-white flex items-center justify-center shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
