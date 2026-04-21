import { useState, useEffect, useRef, useCallback, useMemo, FC, useImperativeHandle, forwardRef } from "react";
import { createPortal } from "react-dom";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImageItem {
  id: number;
  src: string;
  thumb: string;
  label: string;
  alt: string;
}

interface Point {
  x: number;
  y: number;
}

type GestureState =
  | {
      mode: "pinch";
      startDist: number;
      startZoom: number;
      startMid: Point;
      startPan: Point;
    }
  | {
      mode: "drag";
      x0: number;
      y0: number;
      startPan: Point;
      moved: boolean;
      t0: number;
    };

// ── Data ──────────────────────────────────────────────────────────────────────

const FALLBACK_IMAGES: ImageItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  src: `https://picsum.photos/seed/${i + 1}/800/800`,
  thumb: `https://picsum.photos/seed/${i + 1}/300/300`,
  label: `Photo ${i + 1}`,
  alt: `Picsum photo ${i + 1}`,
}));

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDist(touches: React.Touch[]): number {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  );
}

function getMid(touches: React.Touch[]): Point {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

function clamp(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

// ── Slide animation (injected once) ──────────────────────────────────────────

const KEYFRAMES = `
  @keyframes lbOpen  { from { opacity:0; transform:scale(1.05) } to { opacity:1; transform:scale(1) } }
  @keyframes goNext  { from { opacity:.4; transform:translateX(48px) } to { opacity:1; transform:translateX(0) } }
  @keyframes goPrev  { from { opacity:.4; transform:translateX(-48px) } to { opacity:1; transform:translateX(0) } }
  @keyframes ripple  { from { opacity:1; transform:scale(.3) } to { opacity:0; transform:scale(2) } }
  .lb-open  { animation: lbOpen .24s cubic-bezier(.4,0,.2,1) both }
  .anim-next { animation: goNext .28s cubic-bezier(.4,0,.2,1) both }
  .anim-prev { animation: goPrev .28s cubic-bezier(.4,0,.2,1) both }
  .ripple-ring::after {
    content:''; position:absolute; inset:0; margin:auto;
    width:80px; height:80px; border-radius:50%;
    background:rgba(255,255,255,.15);
    animation: ripple .4s ease-out forwards;
  }
`;

// ── Component ─────────────────────────────────────────────────────────────────

export interface PhotoGalleryRef {
  isLightboxOpen: () => boolean;
}

export interface PhotoGalleryProps {
  images?: Array<{ src: string; thumb?: string; label?: string; alt?: string }>;
}

const Gallery = forwardRef<PhotoGalleryRef, PhotoGalleryProps>((props, ref) => {
  const IMAGES: ImageItem[] = useMemo(
    () =>
      props.images && props.images.length > 0
        ? props.images.map((img, i) => ({
            id: i + 1,
            src: img.src,
            thumb: img.thumb ?? img.src,
            label: img.label ?? `Photo ${i + 1}`,
            alt: img.alt ?? img.label ?? `Photo ${i + 1}`,
          }))
        : FALLBACK_IMAGES,
    [props.images],
  );

  const [lightbox, setLightbox] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [animClass, setAnimClass] = useState<string>("");
  const [showRipple, setShowRipple] = useState<boolean>(false);
  const [faved, setFaved] = useState<Record<number, boolean>>({});

  const gesture = useRef<GestureState | null>(null);
  const lastTap = useRef<number>(0);

  const open = (idx: number): void => {
    setLightbox(idx);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setAnimClass("");
  };

  const close = (): void => setLightbox(null);

  const goTo = useCallback((dir: 1 | -1): void => {
    setAnimClass(dir === 1 ? "anim-next" : "anim-prev");
    setLightbox((p) => ((p ?? 0) + dir + IMAGES.length) % IMAGES.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [IMAGES.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const h = (e: KeyboardEvent): void => {
      if (e.key === "ArrowRight") goTo(1);
      if (e.key === "ArrowLeft") goTo(-1);
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [lightbox, goTo]);

  // ── Touch ─────────────────────────────────────────────────────────────────

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>): void => {
      const t = Array.from(e.touches) as React.Touch[];
      if (t.length === 2) {
        e.preventDefault();
        gesture.current = {
          mode: "pinch",
          startDist: getDist(t),
          startZoom: zoom,
          startMid: getMid(t),
          startPan: { ...pan },
        };
      } else {
        gesture.current = {
          mode: "drag",
          x0: t[0].clientX,
          y0: t[0].clientY,
          startPan: { ...pan },
          moved: false,
          t0: Date.now(),
        };
      }
    },
    [zoom, pan]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>): void => {
      const g = gesture.current;
      if (!g) return;
      const t = Array.from(e.touches) as React.Touch[];

      if (g.mode === "pinch" && t.length === 2) {
        e.preventDefault();
        const nz = clamp(g.startZoom * (getDist(t) / g.startDist));
        setZoom(nz);
        const mid = getMid(t);
        setPan({ x: g.startPan.x + mid.x - g.startMid.x, y: g.startPan.y + mid.y - g.startMid.y });
      } else if (g.mode === "drag" && t.length === 1) {
        const dx = t[0].clientX - g.x0;
        const dy = t[0].clientY - g.y0;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) g.moved = true;
        if (zoom > 1) {
          e.preventDefault();
          setPan({ x: g.startPan.x + dx, y: g.startPan.y + dy });
        }
      }
    },
    [zoom]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>): void => {
      const g = gesture.current;
      if (!g) return;
      const ct = Array.from(e.changedTouches) as React.Touch[];

      if (g.mode === "drag") {
        const dx = ct[0].clientX - g.x0;
        const dy = Math.abs(ct[0].clientY - g.y0);
        const dt = Date.now() - g.t0;

        if (!g.moved && dt < 280) {
          const now = Date.now();
          if (now - lastTap.current < 320) {
            lastTap.current = 0;
            zoom > 1 ? (setZoom(1), setPan({ x: 0, y: 0 })) : setZoom(2.8);
            setShowRipple(true);
            setTimeout(() => setShowRipple(false), 420);
          } else {
            lastTap.current = now;
          }
        } else if (zoom <= 1 && Math.abs(dx) > 50 && dy < 80) {
          goTo(dx < 0 ? 1 : -1);
        }
      }

      if (g.mode === "pinch" && zoom < 1.05) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
      gesture.current = null;
    },
    [zoom, goTo]
  );

  const onWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setZoom((z) => {
      const nz = clamp(parseFloat((z + (e.deltaY < 0 ? 0.3 : -0.3)).toFixed(2)));
      if (nz <= MIN_ZOOM) setPan({ x: 0, y: 0 });
      return nz;
    });
  };

  const toggleFav = (idx: number): void =>
    setFaved((f) => ({ ...f, [idx]: !f[idx] }));

  const isLightboxOpen = useCallback(() => lightbox !== null, [lightbox]);

  useImperativeHandle(ref, () => ({
    isLightboxOpen
  }), [isLightboxOpen]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Root */}
      <div className="min-h-screen bg-transparent">

        {/* Photo count header */}
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[13px] font-semibold text-gray-900">{IMAGES.length} Photos</span>
          <span className="text-[11px] text-gray-400">Tap to view</span>
        </div>

        {/* 3-column grid with rounded corners */}
        <div className="grid grid-cols-3 gap-[3px] px-1">
          {IMAGES.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              aria-label={img.label}
              onClick={() => open(idx)}
              className={`
                relative overflow-hidden
                bg-gray-100 dark:bg-neutral-900
                focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
                active:opacity-70 active:scale-[0.98] transition-all duration-150
                ${idx === 0 ? "rounded-tl-2xl" : ""}
                ${idx === 2 ? "rounded-tr-2xl" : ""}
                ${idx === IMAGES.length - 3 + (IMAGES.length % 3 === 0 ? 0 : IMAGES.length % 3 === 1 ? 0 : IMAGES.length % 3 === 2 ? -1 : 0) ? "" : ""}
                aspect-square
              `}
            >
              <img
                src={img.thumb}
                alt={img.alt}
                loading="lazy"
                draggable={false}
                className="w-full h-full object-cover select-none"
              />
              {/* Subtle gradient on hover area */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
            </button>
          ))}
        </div>

        {/* ── Lightbox ── */}
        {lightbox !== null && typeof document !== "undefined" && createPortal(
          <div className="lb-open fixed inset-0 z-50 flex flex-col bg-black dark:bg-black overflow-hidden">

            {/* iOS nav bar */}
            <div
              className="
                relative z-10 flex-shrink-0 flex items-center justify-between
                h-14 px-1.5
                bg-neutral-950/90 dark:bg-neutral-950/90
                backdrop-blur-2xl
                border-b border-white/10
              "
            >
              {/* Back */}
              <button
                type="button"
                aria-label="Back"
                onClick={close}
                className="
                  flex items-center gap-1 px-2 h-10 rounded-xl
                  text-[#0a84ff] text-base font-normal
                  active:bg-white/10 transition-colors
                "
              >
                <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
                  <path d="M9 1L1.5 8.5L9 16" stroke="#0a84ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                All
              </button>

              {/* Title */}
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                <span className="text-[15px] font-semibold tracking-tight text-white">
                  {IMAGES[lightbox].label}
                </span>
                <span className="text-[11.5px] font-normal text-white/45 mt-px">
                  {lightbox + 1} of {IMAGES.length}
                </span>
              </div>

              {/* Share */}
              <button
                type="button"
                aria-label="Share"
                className="flex items-center justify-center w-10 h-10 rounded-xl text-[#0a84ff] active:bg-white/10 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16,6 12,2 8,6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </div>

            {/* Stage */}
            <div
              className="relative flex-1 overflow-hidden flex items-center justify-center touch-none"
              onWheel={onWheel}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  key={lightbox}
                  src={IMAGES[lightbox].src}
                  alt={IMAGES[lightbox].alt}
                  draggable={false}
                  className={`
                    max-w-full max-h-full object-contain select-none pointer-events-none
                    will-change-transform ${animClass}
                  `}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transition: gesture.current ? "none" : "transform 0.22s ease",
                    cursor: zoom > 1 ? "grab" : "default",
                    transformOrigin: "center center",
                  }}
                />
              </div>

              {/* Double-tap ripple */}
              {showRipple && (
                <div className="ripple-ring absolute inset-0 pointer-events-none" />
              )}

              {/* Dot indicator */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-[5px] pointer-events-none">
                {IMAGES.map((_, i) => (
                  <div
                    key={i}
                    className={`
                      rounded-full transition-all duration-200
                      ${i === lightbox
                        ? "w-1.5 h-1.5 bg-white scale-125"
                        : "w-1.5 h-1.5 bg-white/30"
                      }
                    `}
                  />
                ))}
              </div>
            </div>

            {/* Bottom toolbar */}
            <div
              className="
                flex-shrink-0 flex items-center justify-around
                px-3 pt-2.5 pb-5
                bg-neutral-950/90 dark:bg-neutral-950/90
                backdrop-blur-2xl
                border-t border-white/10
              "
            >
              {/* Prev */}
              <ToolBtn label="Prev" onClick={() => goTo(-1)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </ToolBtn>

              {/* Favourite */}
              <ToolBtn
                label="Favourite"
                onClick={() => toggleFav(lightbox)}
                active={!!faved[lightbox]}
              >
                <svg
                  width="22" height="22" viewBox="0 0 24 24"
                  fill={faved[lightbox] ? "#0a84ff" : "none"}
                  stroke={faved[lightbox] ? "#0a84ff" : "currentColor"}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </ToolBtn>

              {/* Fit */}
              <ToolBtn label="Fit" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                </svg>
              </ToolBtn>

              {/* Next */}
              <ToolBtn label="Next" onClick={() => goTo(1)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </ToolBtn>
            </div>

          </div>,
          document.body
        )}
      </div>
    </>
  );
});

// ── ToolBtn helper ────────────────────────────────────────────────────────────

interface ToolBtnProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}

const ToolBtn: FC<ToolBtnProps> = ({ label, onClick, active = false, children }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={`
      flex flex-col items-center gap-[3px] px-3 py-1.5 rounded-xl border-none bg-transparent
      text-[10px] font-medium tracking-wide
      transition-colors duration-100
      active:bg-white/10
      ${active ? "text-[#0a84ff]" : "text-white/70"}
    `}
  >
    {children}
    <span>{label}</span>
  </button>
);

Gallery.displayName = 'Gallery';

export default Gallery;