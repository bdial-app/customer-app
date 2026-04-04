import { useState, useRef, useEffect, useCallback } from "react";

const ITEM_H = 44;
const PAD = 2;
const DRUM_H = 216;
const CY = DRUM_H / 2 - ITEM_H / 2;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const AMPMS = ["AM", "PM"];

function getOff(idx) {
  return CY - (idx + PAD) * ITEM_H;
}

function useDrum(colRef, trackRef, items, initIdx, circular, onChange) {
  const s = useRef({
    idx: initIdx,
    drag: false,
    sy: 0,
    sf: 0,
    vy: 0,
    ly: 0,
    lt: 0,
    raf: null,
  });

  const clamp = (v) =>
    circular
      ? ((Math.round(v) % items.length) + items.length) % items.length
      : Math.max(0, Math.min(items.length - 1, Math.round(v)));

  const curFloat = () => {
    const m = trackRef.current?.style.transform.match(/-?[\d.]+/);
    return m ? (CY - parseFloat(m[0])) / ITEM_H - PAD : s.current.idx;
  };

  const applyPx = (px) => {
    if (trackRef.current)
      trackRef.current.style.transform = `translateY(${px}px)`;
  };

  const updateCls = (f) => {
    if (!trackRef.current) return;
    Array.from(trackRef.current.children).forEach((el, i) => {
      const r = i - PAD - Math.round(f);
      el.dataset.state = r === 0 ? "sel" : Math.abs(r) === 1 ? "near" : "";
    });
  };

  const animTo = useCallback((tf) => {
    cancelAnimationFrame(s.current.raf);
    const ti = clamp(tf);
    const m = trackRef.current?.style.transform.match(/-?[\d.]+/);
    const sp = m ? parseFloat(m[0]) : getOff(s.current.idx);
    const ep = getOff(ti);
    let start = null;
    const frame = (ts) => {
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
  }, []);

  useEffect(() => {
    applyPx(getOff(initIdx));
    updateCls(initIdx);
  }, []);

  useEffect(() => {
    const col = colRef.current;
    if (!col) return;
    const py = (e) => (e.touches ? e.touches[0].clientY : e.clientY);

    const onDown = (e) => {
      cancelAnimationFrame(s.current.raf);
      s.current.drag = true;
      s.current.sy = py(e);
      s.current.sf = curFloat();
      s.current.vy = 0;
      s.current.ly = s.current.sy;
      s.current.lt = Date.now();
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!s.current.drag) return;
      const y = py(e),
        now = Date.now(),
        dt = now - s.current.lt || 1;
      s.current.vy = ((y - s.current.ly) / dt) * 16;
      s.current.ly = y;
      s.current.lt = now;
      const nf = s.current.sf + (s.current.sy - y) / ITEM_H;
      const cl = circular
        ? nf
        : Math.max(-0.4, Math.min(items.length - 0.6, nf));
      applyPx(CY - (cl + PAD) * ITEM_H);
      updateCls(cl);
      e.preventDefault();
    };
    const onUp = () => {
      if (!s.current.drag) return;
      s.current.drag = false;
      animTo(curFloat() + (-s.current.vy / ITEM_H) * 3.5);
    };
    const onWheel = (e) => {
      e.preventDefault();
      cancelAnimationFrame(s.current.raf);
      animTo(curFloat() + e.deltaY / ITEM_H);
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

// width: fixed px so all 3 cols are equal and centred
function DrumColumn({ items, initIdx, circular, onChange, width = 80 }) {
  const colRef = useRef(null);
  const trackRef = useRef(null);
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
            className="flex items-center justify-center"
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

export default function TimePicker() {
  const [open, setOpen] = useState(false);
  const [committed, setCommitted] = useState({ h: 7, m: 0, ap: 0 });
  const pending = useRef({ h: 7, m: 0, ap: 0 });
  const anchorRef = useRef(null);

  const timeStr = (s) => `${HOURS[s.h]}:${MINS[s.m]} ${AMPMS[s.ap]}`;

  const handleOpen = () => {
    pending.current = { ...committed };
    setOpen(true);
  };
  const handleCancel = () => setOpen(false);
  const handleDone = () => {
    setCommitted({ ...pending.current });
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <style>{`
        [data-state="sel"]  { color: rgba(0,0,0,0.88) !important; font-weight: 600 !important; }
        [data-state="near"] { color: rgba(0,0,0,0.55) !important; }
      `}</style>

      <div
        className="min-h-screen bg-white flex items-start justify-center pt-24 px-6"
        style={{
          fontFamily:
            "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        }}
      >
        <div className="flex items-center gap-4" ref={anchorRef}>
          <span style={{ fontSize: 17, color: "#3a3a3c" }}>1st Summary</span>

          <div className="relative">
            {/* Pill trigger */}
            <button
              onClick={() => (open ? setOpen(false) : handleOpen())}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 130,
                padding: "9px 22px",
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                background: "#e5e5ea",
                fontSize: 22,
                fontWeight: 400,
                letterSpacing: "0.2px",
                fontFamily: "inherit",
                color: open ? "#0A84FF" : "#3a3a3c",
                transition: "color 0.15s",
              }}
            >
              {timeStr(committed)}
            </button>

            {/* Frosted dropdown */}
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                left: "50%",
                // 3 cols × 80px = 240px total
                width: 240,
                zIndex: 50,
                borderRadius: 16,
                overflow: "hidden",
                transform: open
                  ? "translateX(-50%) scaleY(1)"
                  : "translateX(-50%) scaleY(0.92)",
                transformOrigin: "top center",
                opacity: open ? 1 : 0,
                pointerEvents: open ? "all" : "none",
                transition: "opacity 0.18s ease, transform 0.18s ease",
                background: "rgba(200,200,205,0.62)",
                backdropFilter: "blur(40px) saturate(1.9)",
                WebkitBackdropFilter: "blur(40px) saturate(1.9)",
                border: "0.5px solid rgba(255,255,255,0.5)",
                boxShadow:
                  "0 8px 40px rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              {/* Drums */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  height: DRUM_H,
                  overflow: "hidden",
                }}
              >
                {/* Selection line */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    pointerEvents: "none",
                    zIndex: 4,
                    top: DRUM_H / 2 - ITEM_H / 2,
                    height: ITEM_H,
                    borderTop: "0.5px solid rgba(0,0,0,0.18)",
                    borderBottom: "0.5px solid rgba(0,0,0,0.18)",
                  }}
                />
                {/* Fade top */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 86,
                    pointerEvents: "none",
                    zIndex: 3,
                    background:
                      "linear-gradient(to bottom, rgba(200,200,205,0.75) 0%, transparent 100%)",
                  }}
                />
                {/* Fade bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 86,
                    pointerEvents: "none",
                    zIndex: 3,
                    background:
                      "linear-gradient(to top, rgba(200,200,205,0.75) 0%, transparent 100%)",
                  }}
                />

                {/* All 3 columns fixed at 80px each = 240px total, perfectly centred */}
                <DrumColumn
                  items={HOURS}
                  initIdx={committed.h}
                  circular={true}
                  onChange={(i) => (pending.current.h = i)}
                  width={80}
                />
                <DrumColumn
                  items={MINS}
                  initIdx={committed.m}
                  circular={true}
                  onChange={(i) => (pending.current.m = i)}
                  width={80}
                />
                <DrumColumn
                  items={AMPMS}
                  initIdx={committed.ap}
                  circular={false}
                  onChange={(i) => (pending.current.ap = i)}
                  width={80}
                />
              </div>

              {/* Cancel / Done */}
              <div
                style={{
                  display: "flex",
                  borderTop: "0.5px solid rgba(0,0,0,0.12)",
                }}
              >
                <button
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
                </button>
                <button
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
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
