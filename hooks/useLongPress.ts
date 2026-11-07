import { useCallback, useRef } from "react";

const MOVE_TOLERANCE = 10;

/**
 * Lifting the finger after a long press still sends a click, and by then a
 * menu has opened under it — that click would land on the menu's backdrop and
 * close it at once. Swallow just that one.
 */
function swallowNextClick() {
  const stop = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };
  document.addEventListener("click", stop, { capture: true, once: true });
  setTimeout(() => document.removeEventListener("click", stop, { capture: true }), 800);
}

/**
 * Press and hold (or right-click) to open something, without breaking taps or
 * scrolling: moving the finger cancels it, and the release that ends a long
 * press doesn't also tap whatever is under the finger.
 */
export function useLongPress(onLongPress: () => void, ms = 450) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  }, []);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        fired.current = true;
        timer.current = null;
        swallowNextClick();
        onLongPress();
      }, ms);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!start.current) return;
      if (Math.abs(e.clientX - start.current.x) > MOVE_TOLERANCE || Math.abs(e.clientY - start.current.y) > MOVE_TOLERANCE) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onContextMenu: (e: React.MouseEvent) => {
      // Right-click on a computer; some Android WebViews also send this on hold.
      e.preventDefault();
      if (fired.current) return;
      clear();
      fired.current = true;
      if (e.button === 0) swallowNextClick();
      onLongPress();
    },
  };
}
