import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "konsta/react";

const ITEM_H = 44;
const PAD = 2;
const DRUM_H = 216;
const CY = DRUM_H / 2 - ITEM_H / 2;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const AMPMS = ["AM", "PM"];

function getOff(idx: number) {
  return CY - (idx + PAD) * ITEM_H;
}

function useDrum(
  colRef: React.RefObject<HTMLDivElement | null>,
  trackRef: React.RefObject<HTMLDivElement | null>,
  items: string[],
  initIdx: number,
  circular: boolean,
  onChange: (idx: number) => void
) {
  const s = useRef<{
    idx: number;
    drag: boolean;
    sy: number;
    sf: number;
    vy: number;
    ly: number;
    lt: number;
    raf: number | null;
  }>({
    idx: initIdx,
    drag: false,
    sy: 0,
    sf: 0,
    vy: 0,
    ly: 0,
    lt: 0,
    raf: null,
  });

  const clamp = (v: number) =>
    circular
      ? ((Math.round(v) % items.length) + items.length) % items.length
      : Math.max(0, Math.min(items.length - 1, Math.round(v)));

  const curFloat = () => {
    const m = trackRef.current?.style.transform.match(/-?[\d.]+/);
    return m ? (CY - parseFloat(m[0])) / ITEM_H - PAD : s.current.idx;
  };

  const applyPx = (px: number) => {
    if (trackRef.current)
      trackRef.current.style.transform = `translateY(${px}px)`;
  };

  const updateCls = (f: number) => {
    if (!trackRef.current) return;
    Array.from(trackRef.current.children).forEach((el: any, i) => {
      const r = i - PAD - Math.round(f);
      el.dataset.state = r === 0 ? "sel" : Math.abs(r) === 1 ? "near" : "";
    });
  };

  const animTo = useCallback((tf: number) => {
    if (s.current.raf) cancelAnimationFrame(s.current.raf);
    const ti = clamp(tf);
    const m = trackRef.current?.style.transform.match(/-?[\d.]+/);
    const sp = m ? parseFloat(m[0]) : getOff(s.current.idx);
    const ep = getOff(ti);
    let start: number | null = null;
    const frame = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 200, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const cur = sp + (ep - sp) * ease;
      applyPx(cur);
      updateCls((CY - cur) / ITEM_H - PAD);
      if (p < 1) s.current.raf = requestAnimationFrame(frame);
      else {
        s.current.idx = ti;
        applyPx(ep);
        updateCls(ti);
        onChange(ti);
      }
    };
    s.current.raf = requestAnimationFrame(frame);
  }, [items.length, circular, onChange]);

  useEffect(() => {
    applyPx(getOff(initIdx));
    updateCls(initIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initIdx]);

  useEffect(() => {
    const col = colRef.current;
    if (!col) return;
    const py = (e: any) => (e.touches ? e.touches[0].clientY : e.clientY);

    const onDown = (e: any) => {
      if (s.current.raf) cancelAnimationFrame(s.current.raf);
      s.current.drag = true;
      s.current.sy = py(e);
      s.current.sf = curFloat();
      s.current.vy = 0;
      s.current.ly = s.current.sy;
      s.current.lt = Date.now();
      if (!e.touches) e.preventDefault();
    };
    const onMove = (e: any) => {
      if (!s.current.drag) return;
      const y = py(e),
        now = Date.now(),
        dt = (now - s.current.lt) || 1;
      s.current.vy = ((y - s.current.ly) / dt) * 16;
      s.current.ly = y;
      s.current.lt = now;
      const nf = s.current.sf + (s.current.sy - y) / ITEM_H;
      const cl = circular
        ? nf
        : Math.max(-0.4, Math.min(items.length - 0.6, nf));
      applyPx(CY - (cl + PAD) * ITEM_H);
      updateCls(cl);
      if (!e.touches) e.preventDefault();
    };
    const onUp = () => {
      if (!s.current.drag) return;
      s.current.drag = false;
      animTo(curFloat() + (-s.current.vy / ITEM_H) * 3.5);
    };
    const onWheel = (e: any) => {
      if (s.current.raf) cancelAnimationFrame(s.current.raf);
      animTo(curFloat() + e.deltaY / ITEM_H);
      e.preventDefault();
    };

    col.addEventListener("mousedown", onDown);
    col.addEventListener("touchstart", onDown, { passive: false });
    col.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      col.removeEventListener("mousedown", onDown);
      col.removeEventListener("touchstart", onDown);
      col.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [colRef, animTo, circular, items.length]);
}

interface DrumColumnProps {
  items: string[];
  initIdx: number;
  circular: boolean;
  onChange: (idx: number) => void;
  width?: number;
}

function DrumColumn({ items, initIdx, circular, onChange, width = 80 }: DrumColumnProps) {
  const colRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useDrum(colRef, trackRef, items, initIdx, circular, onChange);

  const built = circular
    ? [...items.slice(-PAD), ...items, ...items.slice(0, PAD)]
    : [...Array(PAD).fill(null), ...items, ...Array(PAD).fill(null)];

  return (
    <div
      ref={colRef}
      style={{
        width,
        height: DRUM_H,
        overflow: "hidden",
        position: "relative",
        cursor: "ns-resize",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <div ref={trackRef} style={{ willChange: "transform" }}>
        {built.map((t, i) => (
          <div
            key={i}
            className="flex items-center justify-center transition-opacity duration-200"
            style={{
              height: ITEM_H,
              fontSize: 17,
              fontWeight: 400,
              color: "rgba(0,0,0,0.32)",
            }}
            data-state=""
          >
            {t ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export default function TimePicker({ label, value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [portalPosition, setPortalPosition] = useState({ top: 0, right: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);

  // Parse "09:30 AM" into {h: 8, m: 30, ap: 0}
  const parseTime = (str: string) => {
    if (!str) return { h: 8, m: 0, ap: 0 }; // Default 9:00 AM
    const [time, ampm] = str.split(" ");
    const [h, m] = time.split(":").map(Number);
    return {
      h: (h || 9) - 1,
      m: m || 0,
      ap: ampm === "PM" ? 1 : 0,
    };
  };

  const [committed, setCommitted] = useState(parseTime(value));
  const pending = useRef(parseTime(value));

  const timeStr = (s: { h: number; m: number; ap: number }) => 
    `${HOURS[s.h]}:${MINS[s.m]} ${AMPMS[s.ap]}`;

  const handleOpen = () => {
    pending.current = { ...committed };
    
    // Calculate portal position
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setPortalPosition({
        top: rect.bottom + scrollTop + 4,
        right: window.innerWidth - rect.right - scrollLeft + 16
      });
    }
    
    setOpen(true);
  };
  const handleCancel = () => setOpen(false);
  const handleDone = () => {
    setCommitted({ ...pending.current });
    onChange(timeStr(pending.current));
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    setCommitted(parseTime(value));
  }, [value]);

  return (
    <div className="relative">
      <style>{`
        [data-state="sel"]  { color: rgba(0,0,0,0.88) !important; font-weight: 600 !important; }
        [data-state="near"] { color: rgba(0,0,0,0.55) !important; }
      `}</style>

      {/* List Item Style Toggle */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 last:border-b-0 active:bg-slate-50 transition-colors"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        ref={anchorRef}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">{label}</span>
          <span className="text-sm font-medium text-slate-800">{value || "Select Time"}</span>
        </div>
        
        {/* iOS style time pill */}
        <div 
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            open ? "bg-indigo-500 text-white shadow-md shadow-indigo-100 scale-105" : "bg-slate-100 text-slate-700"
          }`}
        >
          {timeStr(committed)}
        </div>
      </div>

      {/* Portal-rendered dropdown */}
      {open && createPortal(
        <div
          style={{
            position: "fixed",
            top: portalPosition.top,
            right: portalPosition.right,
            width: 240,
            zIndex: 1000,
            borderRadius: 16,
            overflow: "hidden",
            transform: "scaleY(1)",
            transformOrigin: "top right",
            opacity: 1,
            pointerEvents: "all",
            transition: "opacity 0.18s ease, transform 0.18s ease",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(40px) saturate(1.9)",
            WebkitBackdropFilter: "blur(40px) saturate(1.9)",
            border: "0.5px solid rgba(255,255,255,0.5)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {/* Drums */}
          <div
            style={{
              position: "relative",
              display: "flex",
              height: DRUM_H,
              overflow: "hidden",
              justifyContent: "center",
            }}
          >
            {/* Selection line */}
            <div
              style={{
                position: "absolute",
                left: 4,
                right: 4,
                pointerEvents: "none",
                zIndex: 4,
                top: DRUM_H / 2 - ITEM_H / 2,
                height: ITEM_H,
                background: "rgba(0,0,0,0.03)",
                borderRadius: 8,
                borderTop: "0.5px solid rgba(0,0,0,0.05)",
                borderBottom: "0.5px solid rgba(0,0,0,0.05)",
              }}
            />
            
            {/* Fade top */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 60,
                pointerEvents: "none",
                zIndex: 3,
                background: "linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, transparent 100%)",
              }}
            />
            {/* Fade bottom */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                pointerEvents: "none",
                zIndex: 3,
                background: "linear-gradient(to top, rgba(255,255,255,0.85) 0%, transparent 100%)",
              }}
            />

            <DrumColumn
              items={HOURS}
              initIdx={committed.h}
              circular={true}
              onChange={(i) => (pending.current.h = i)}
              width={70}
            />
            <DrumColumn
              items={MINS}
              initIdx={committed.m}
              circular={true}
              onChange={(i) => (pending.current.m = i)}
              width={70}
            />
            <DrumColumn
              items={AMPMS}
              initIdx={committed.ap}
              circular={false}
              onChange={(i) => (pending.current.ap = i)}
              width={70}
            />
          </div>

          {/* Cancel / Done */}
          <div
            style={{
              display: "flex",
              borderTop: "0.5px solid rgba(0,0,0,0.08)",
              padding: "8px",
              gap: "8px",
            }}
          >
            <Button
              clear
              onClick={handleCancel}
               style={{
                    flex: 1,
                    padding: "13px 0",
                    fontSize: 16,
                    fontWeight: 400,
                    color: "rgba(0,0,0,0.45)",
                    background: "transparent",
                    border: "none",
                    borderRight: "0.5px solid rgba(0,0,0,0.12)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDone}
               style={{
                    flex: 1,
                    padding: "13px 0",
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#0A84FF",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
            >
              Done
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
