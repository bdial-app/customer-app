"use client";
import {
  useState, useRef, useCallback, useMemo,
  useImperativeHandle, forwardRef, useEffect, FC,
} from "react";
import { createPortal } from "react-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Zoom } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { shareContent } from "@/utils/sharing";
import "swiper/css/zoom";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImageItem {
  id: number;
  src: string;
  thumb: string;
  label: string;
  alt: string;
}

export interface PhotoGalleryRef {
  isLightboxOpen: () => boolean;
  openAt: (idx: number) => void;
}

export interface PhotoGalleryProps {
  images?: Array<{ src: string; thumb?: string; label?: string; alt?: string }>;
}

// ── Fallback ──────────────────────────────────────────────────────────────────

const FALLBACK_IMAGES: ImageItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  src: `https://picsum.photos/seed/${i + 1}/800/800`,
  thumb: `https://picsum.photos/seed/${i + 1}/300/300`,
  label: `Photo ${i + 1}`,
  alt: `Picsum photo ${i + 1}`,
}));

// ── Open animation ────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes lbOpen { from { opacity:0; transform:scale(1.04) } to { opacity:1; transform:scale(1) } }
  .lb-open { animation: lbOpen .22s cubic-bezier(.4,0,.2,1) both }
`;

// ── Gallery ───────────────────────────────────────────────────────────────────

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

  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const openAt = useCallback((idx: number) => {
    setActiveIdx(idx);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    // Reset zoom before closing
    swiperRef.current?.zoom?.out();
    setOpen(false);
  }, []);

  const isLightboxOpen = useCallback(() => open, [open]);

  useImperativeHandle(ref, () => ({ isLightboxOpen, openAt }), [isLightboxOpen, openAt]);

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Thumbnail grid */}
      <div className="min-h-screen bg-transparent">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{IMAGES.length} Photos</span>
          <span className="text-[11px] text-gray-400">Tap to view</span>
        </div>
        <div className="grid grid-cols-3 gap-0.75 px-1">
          {IMAGES.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              aria-label={img.label}
              onClick={() => openAt(idx)}
              className={`relative overflow-hidden bg-gray-100 dark:bg-slate-800 focus:outline-none active:opacity-70 active:scale-[0.98] transition-all duration-150 aspect-square ${idx === 0 ? "rounded-tl-2xl" : ""} ${idx === 2 ? "rounded-tr-2xl" : ""}`}
            >
              {img.thumb && (
                <img src={img.thumb} alt={img.alt} loading="lazy" draggable={false} className="w-full h-full object-cover select-none" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/5 to-transparent pointer-events-none" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {mounted && open && createPortal(
        <div className="lb-open fixed inset-0 z-9999 flex flex-col bg-black overflow-hidden">

          {/* iOS-style header */}
          <div
            className="relative z-10 shrink-0 flex items-center justify-between px-1.5 pb-2 bg-neutral-950/90 backdrop-blur-2xl border-b border-white/10"
            style={{ paddingTop: "calc(var(--sat,0px) + 8px)" }}
          >
            <button
              type="button"
              onClick={close}
              className="flex items-center gap-1 px-2 h-10 rounded-xl text-[#0a84ff] text-base font-normal active:bg-white/10 transition-colors"
            >
              <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
                <path d="M9 1L1.5 8.5L9 16" stroke="#0a84ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              All
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
              <span className="text-[15px] font-semibold tracking-tight text-white">{IMAGES[activeIdx]?.label}</span>
              <span className="text-[11.5px] text-white/45 mt-px">{activeIdx + 1} of {IMAGES.length}</span>
            </div>

            <button
              type="button"
              aria-label="Share"
              onClick={async () => { try { await shareContent({ title: IMAGES[activeIdx]?.label || 'Photo', text: '', url: IMAGES[activeIdx]?.src || '' }); } catch {} }}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-[#0a84ff] active:bg-white/10 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16,6 12,2 8,6" /><line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>

          {/* Swiper stage with built-in zoom */}
          <div className="flex-1 overflow-hidden">
            <Swiper
              modules={[Zoom]}
              zoom={{ maxRatio: 8, minRatio: 1 }}
              onSwiper={(s) => {
                swiperRef.current = s;
                s.slideTo(activeIdx, 0);
              }}
              onSlideChange={(s) => setActiveIdx(s.activeIndex)}
              initialSlide={activeIdx}
              slidesPerView={1}
              speed={300}
              resistance
              resistanceRatio={0.65}
              style={{ width: "100%", height: "100%" }}
            >
              {IMAGES.map((img) => (
                <SwiperSlide
                  key={img.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <div className="swiper-zoom-container" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={img.src}
                      alt={img.alt}
                      draggable={false}
                      className="max-w-full max-h-full object-contain select-none"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Dot indicators */}
          {IMAGES.length > 1 && IMAGES.length <= 12 && (
            <div className="absolute bottom-18 left-1/2 -translate-x-1/2 flex gap-1.25 pointer-events-none z-10">
              {IMAGES.map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-200 ${i === activeIdx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30"}`} />
              ))}
            </div>
          )}

          {/* Bottom toolbar */}
          <div className="shrink-0 flex items-center justify-around px-3 pt-2.5 pb-5 bg-neutral-950/90 backdrop-blur-2xl border-t border-white/10">
            <ToolBtn label="Prev" onClick={() => swiperRef.current?.slidePrev()}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
            </ToolBtn>

            <ToolBtn label="Zoom" onClick={() => swiperRef.current?.zoom?.in()}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </ToolBtn>

            <ToolBtn label="Next" onClick={() => swiperRef.current?.slideNext()}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6" /></svg>
            </ToolBtn>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
});

Gallery.displayName = "Gallery";

// ── ToolBtn ───────────────────────────────────────────────────────────────────

interface ToolBtnProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

const ToolBtn: FC<ToolBtnProps> = ({ label, onClick, children }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="flex flex-col items-center gap-0.75 px-3 py-1.5 rounded-xl bg-transparent text-2xs font-medium tracking-wide text-white/70 active:bg-white/10 transition-colors duration-100"
  >
    {children}
    <span>{label}</span>
  </button>
);

export default Gallery;
