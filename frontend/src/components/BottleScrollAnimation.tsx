import { useEffect, useRef, useState, useCallback } from "react";

const TOTAL_FRAMES = 192;
const SCROLL_HEIGHT_VH = 340; // total scroll space for the sticky animation zone

// Textual storytelling beats at different animation progress stages
const STORY_BEATS = [
  { start: 0.00, end: 0.18, title: "The Perfect Pour",        sub: "Premium drinks, crafted for the finest dining experiences."           },
  { start: 0.28, end: 0.46, title: "Ice Cold & Refreshing",   sub: "Every sip, a celebration. Every moment, unforgettable."               },
  { start: 0.55, end: 0.72, title: "Nightlife Awaits",        sub: "Where great food meets great drinks and great company."               },
  { start: 0.82, end: 1.00, title: "Reserve Your Table Now",  sub: "Secure your seat at the most exclusive tables in the city."           },
];

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}
function frameUrl(n: number): string {
  return `/frames/ezgif-frame-${pad3(n)}.jpg`;
}

export default function BottleScrollAnimation() {
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const imagesRef     = useRef<HTMLImageElement[]>([]);

  // Internal refs — mutated freely without re-renders
  const frameIndexRef  = useRef(0);
  const dirtyRef       = useRef(false);
  const rafRef         = useRef<number | null>(null);
  const lastStateSync  = useRef(0);

  // State for UI elements that need to show live values
  const [loaded,       setLoaded]       = useState(false);
  const [loadedPct,    setLoadedPct]    = useState(0);
  const [displayFrame, setDisplayFrame] = useState(1);      // frame counter display
  const [progress,     setProgress]     = useState(0);      // 0-1 for progress bar
  const [beatIdx,      setBeatIdx]      = useState<number | null>(null);
  const [beatVis,      setBeatVis]      = useState(false);
  const [showCue,      setShowCue]      = useState(true);   // scroll cue

  // ─── Preload all 192 frames ────────────────────────────────────────
  useEffect(() => {
    const imgs: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let done = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(i + 1);

      img.onload = () => {
        done++;
        // Update pct at most every 5 frames to avoid flooding state
        if (done % 5 === 0 || done === TOTAL_FRAMES) {
          setLoadedPct(Math.round((done / TOTAL_FRAMES) * 100));
        }
        if (done === TOTAL_FRAMES) {
          setLoaded(true);
          dirtyRef.current = true;
        }
      };
      img.onerror = () => {
        done++;
        if (done === TOTAL_FRAMES) setLoaded(true);
      };

      imgs[i] = img;
    }
    imagesRef.current = imgs;
  }, []);

  // ─── Draw current frame to canvas ────────────────────────────────
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = imagesRef.current[index];
    if (!img?.complete || !img.naturalWidth) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Object-fit: cover
    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh);
  }, []);

  // ─── rAF render loop (canvas only, no state updates here) ─────────
  useEffect(() => {
    const loop = () => {
      if (dirtyRef.current) {
        drawFrame(frameIndexRef.current);
        dirtyRef.current = false;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [drawFrame]);

  // ─── Resize canvas to match viewport ─────────────────────────────
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      dirtyRef.current = true;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ─── Scroll → frame mapping ────────────────────────────────────────
  useEffect(() => {
    let beatTimer: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect    = wrapper.getBoundingClientRect();
      const total   = wrapper.offsetHeight - window.innerHeight;
      const scrolled = -rect.top; // px scrolled into this section

      // Out of section bounds — ignore
      if (scrolled < 0 || scrolled > total + window.innerHeight * 0.5) return;

      const prog = Math.min(Math.max(scrolled / total, 0), 1);

      // Map progress [0,1] → frame index [0, TOTAL_FRAMES-1]
      const newIdx = Math.min(Math.max(Math.round(prog * (TOTAL_FRAMES - 1)), 0), TOTAL_FRAMES - 1);

      // Only mark canvas dirty when frame changes
      if (newIdx !== frameIndexRef.current) {
        frameIndexRef.current = newIdx;
        dirtyRef.current = true;
      }

      // Hide scroll cue once we've started scrolling
      if (prog > 0.04) setShowCue(false);
      else             setShowCue(true);

      // Throttle React state updates to ~30fps equivalent (every 33ms)
      const now = performance.now();
      if (now - lastStateSync.current > 33) {
        lastStateSync.current = now;
        setDisplayFrame(newIdx + 1);
        setProgress(prog);
      }

      // Story beats
      const idx = STORY_BEATS.findIndex(b => prog >= b.start && prog <= b.end);
      if (idx !== -1) {
        setBeatIdx(idx);
        setBeatVis(true);
        if (beatTimer) clearTimeout(beatTimer);
      } else {
        if (beatTimer) clearTimeout(beatTimer);
        beatTimer = setTimeout(() => setBeatVis(false), 350);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Run once on mount in case section is already partially scrolled
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (beatTimer) clearTimeout(beatTimer);
    };
  }, []);

  // ─── Draw frame 0 once loading is done ───────────────────────────
  useEffect(() => {
    if (loaded) {
      frameIndexRef.current = 0;
      dirtyRef.current = true;
    }
  }, [loaded]);

  const beat = beatIdx !== null ? STORY_BEATS[beatIdx] : null;
  const pctString = ((progress) * 100).toFixed(0);

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════════════════════
           BOTTLE SCROLL ANIMATION — Apple-style cinematic section
        ═══════════════════════════════════════════════════════════ */
        .bsa-wrapper {
          position: relative;
          height: ${SCROLL_HEIGHT_VH}vh;
          background: #050311;
          /* Clip so overflow doesn't disrupt surrounding layout */
          overflow: clip;
        }

        /* The sticky "viewport" that stays fixed while wrapper scrolls */
        .bsa-sticky {
          position: sticky;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #050311;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Seamless blend into surrounding dark sections */
        .bsa-sticky::before,
        .bsa-sticky::after {
          content: '';
          position: absolute;
          left: 0; right: 0;
          height: 220px;
          z-index: 4;
          pointer-events: none;
        }
        .bsa-sticky::before {
          top: 0;
          background: linear-gradient(to bottom, #050311 0%, transparent 100%);
        }
        .bsa-sticky::after {
          bottom: 0;
          background: linear-gradient(to top, #050311 0%, transparent 100%);
        }

        /* Canvas fills the entire sticky pane */
        .bsa-canvas {
          position: absolute;
          inset: 0;
          width: 100% !important;
          height: 100% !important;
          display: block;
        }

        /* Radial vignette — keeps text legible, lets bottle shine */
        .bsa-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 65% 65% at 50% 50%, transparent 40%, rgba(5,3,17,.55) 100%),
            linear-gradient(to bottom, rgba(5,3,17,.18) 0%, transparent 20%, transparent 80%, rgba(5,3,17,.18) 100%);
          z-index: 2;
          pointer-events: none;
        }

        /* Warm ambient glow center */
        .bsa-glow {
          position: absolute;
          width: 640px; height: 640px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,152,58,.08) 0%, transparent 65%);
          filter: blur(70px);
          z-index: 1;
          pointer-events: none;
          animation: bsa-pulse 4.5s ease-in-out infinite;
        }
        @keyframes bsa-pulse {
          0%,100% { opacity:.55; transform:translate(-50%,-50%) scale(1);    }
          50%      { opacity:1;   transform:translate(-50%,-50%) scale(1.14); }
        }

        /* ── Story beat text ──────────────────────────────────────── */
        .bsa-beat {
          position: absolute;
          left: 0; right: 0;
          bottom: 15vh;
          text-align: center;
          z-index: 6;
          pointer-events: none;
          transition: opacity .5s cubic-bezier(.22,1,.36,1),
                      transform .5s cubic-bezier(.22,1,.36,1);
          opacity: 0;
          transform: translateY(22px);
        }
        .bsa-beat.vis {
          opacity: 1;
          transform: translateY(0);
        }
        .bsa-beat-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(1.7rem, 4vw, 3.1rem);
          font-weight: 300;
          font-style: italic;
          letter-spacing: .07em;
          color: #f0cd7a;
          text-shadow: 0 0 48px rgba(201,152,58,.45), 0 2px 24px rgba(0,0,0,.9);
          display: block;
          margin-bottom: 11px;
        }
        .bsa-beat-sub {
          font-family: 'Syne', Arial, sans-serif;
          font-size: clamp(.72rem, 1.3vw, .92rem);
          letter-spacing: .24em;
          text-transform: uppercase;
          color: rgba(220,195,155,.52);
          display: block;
        }

        /* ── Left progress rail ───────────────────────────────────── */
        .bsa-rail {
          position: absolute;
          left: 28px; top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 160px;
          background: rgba(201,152,58,.1);
          border-radius: 999px;
          z-index: 6;
          pointer-events: none;
        }
        .bsa-rail-fill {
          position: absolute;
          top: 0; left: 0; right: 0;
          border-radius: 999px;
          background: linear-gradient(to bottom, rgba(201,152,58,.9), rgba(201,152,58,.2));
          box-shadow: 0 0 8px rgba(201,152,58,.45);
          transition: height .1s linear;
        }

        /* ── Frame counter (top-right, subtle) ───────────────────── */
        .bsa-counter {
          position: absolute;
          top: 26px; right: 30px;
          font-family: 'Syne', 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: rgba(201,152,58,.32);
          z-index: 6;
          font-variant-numeric: tabular-nums;
          pointer-events: none;
        }

        /* ── Top watermark label ──────────────────────────────────── */
        .bsa-watermark {
          position: absolute;
          top: 26px; left: 50%;
          transform: translateX(-50%);
          display: flex; align-items: center; gap: 14px;
          z-index: 6; pointer-events: none;
        }
        .bsa-wm-line {
          width: 44px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,152,58,.32));
        }
        .bsa-wm-line.r {
          background: linear-gradient(270deg, transparent, rgba(201,152,58,.32));
        }
        .bsa-wm-text {
          font-family: 'Syne', Arial, sans-serif;
          font-size: 9px; letter-spacing: .28em;
          text-transform: uppercase;
          color: rgba(201,152,58,.38);
        }

        /* ── Scroll cue ───────────────────────────────────────────── */
        .bsa-cue {
          position: absolute;
          bottom: 5.5vh; left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column;
          align-items: center; gap: 9px;
          z-index: 6; pointer-events: none;
          transition: opacity .5s ease;
        }
        .bsa-cue.hidden { opacity: 0; }
        .bsa-cue-arrow {
          width: 20px; height: 20px;
          border-right: 1.5px solid rgba(201,152,58,.45);
          border-bottom: 1.5px solid rgba(201,152,58,.45);
          transform: rotate(45deg);
          animation: bsa-arrow 1.6s ease-in-out infinite;
        }
        .bsa-cue-arrow.a2 { animation-delay: .25s; margin-top: -14px; opacity: .5; }
        @keyframes bsa-arrow {
          0%,100% { opacity:.5; transform:rotate(45deg) translate(0,0); }
          50%      { opacity:1;  transform:rotate(45deg) translate(4px,4px); }
        }
        .bsa-cue-label {
          font-family: 'Syne', Arial, sans-serif;
          font-size: 8px; letter-spacing: .28em;
          text-transform: uppercase;
          color: rgba(201,152,58,.38);
          margin-top: 4px;
        }

        /* ── Pre-load screen ──────────────────────────────────────── */
        .bsa-loader {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: #050311;
          z-index: 10;
          gap: 22px;
          transition: opacity .7s ease, visibility .7s ease;
        }
        .bsa-loader.done {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        .bsa-loader-bottle {
          font-size: 2.6rem;
          animation: bsa-bob 2.2s ease-in-out infinite;
          filter: drop-shadow(0 0 16px rgba(201,152,58,.3));
        }
        @keyframes bsa-bob {
          0%,100% { transform: translateY(0) rotate(-5deg); }
          50%      { transform: translateY(-12px) rotate(5deg); }
        }
        .bsa-loader-track {
          width: 180px; height: 2px;
          background: rgba(201,152,58,.1);
          border-radius: 999px; overflow: hidden;
        }
        .bsa-loader-fill {
          height: 100%;
          background: linear-gradient(90deg, #b8832a, #e4b24a, #b8832a);
          background-size: 200% 100%;
          border-radius: 999px;
          animation: bsa-shimmer 1.8s linear infinite;
          box-shadow: 0 0 10px rgba(201,152,58,.45);
          transition: width .3s ease;
        }
        @keyframes bsa-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .bsa-loader-pct {
          font-family: 'Syne', Arial, sans-serif;
          font-size: 10px; letter-spacing: .28em;
          text-transform: uppercase;
          color: rgba(201,152,58,.45);
        }

        /* ── Responsive ───────────────────────────────────────────── */
        @media (max-width: 640px) {
          .bsa-rail      { left: 14px; height: 100px; }
          .bsa-counter   { right: 14px; top: 20px; }
          .bsa-beat      { bottom: 9vh; padding: 0 18px; }
          .bsa-watermark { display: none; }
        }
      `}</style>

      {/*
        ── Outer wrapper ────────────────────────────────────────────────
           Its total height = SCROLL_HEIGHT_VH vh. As you scroll through
           this tall element, the inner sticky div stays pinned at top:0
           and we read how far we've scrolled to pick the frame.
      */}
      <div ref={wrapperRef} className="bsa-wrapper" role="img" aria-label="Scroll animation: premium bottle showcase">

        {/* ── Sticky viewport ── */}
        <div className="bsa-sticky">

          {/* Frame canvas */}
          <canvas ref={canvasRef} className="bsa-canvas" aria-hidden="true" />

          {/* Layers */}
          <div className="bsa-glow"     aria-hidden="true" />
          <div className="bsa-vignette" aria-hidden="true" />

          {/* Top watermark */}
          <div className="bsa-watermark" aria-hidden="true">
            <div className="bsa-wm-line"   />
            <span className="bsa-wm-text">TableTime · Premium Experience</span>
            <div className="bsa-wm-line r" />
          </div>

          {/* Left progress rail */}
          <div className="bsa-rail" aria-hidden="true">
            <div
              className="bsa-rail-fill"
              style={{ height: `${pctString}%` }}
            />
          </div>

          {/* Frame counter */}
          <div className="bsa-counter" aria-hidden="true">
            {pad3(displayFrame)} / {pad3(TOTAL_FRAMES)}
          </div>

          {/* Story beat overlay */}
          <div className={`bsa-beat${beatVis && beat ? " vis" : ""}`} aria-live="polite">
            {beat && (
              <>
                <span className="bsa-beat-title">{beat.title}</span>
                <span className="bsa-beat-sub">{beat.sub}</span>
              </>
            )}
          </div>

          {/* Scroll cue arrows */}
          <div className={`bsa-cue${showCue ? "" : " hidden"}`} aria-hidden="true">
            <div className="bsa-cue-arrow"    />
            <div className="bsa-cue-arrow a2" />
            <span className="bsa-cue-label">Scroll to Explore</span>
          </div>

          {/* Pre-load overlay */}
          <div className={`bsa-loader${loaded ? " done" : ""}`} aria-live="polite">
            <div className="bsa-loader-bottle">🍾</div>
            <div className="bsa-loader-track">
              <div className="bsa-loader-fill" style={{ width: `${loadedPct}%` }} />
            </div>
            <div className="bsa-loader-pct">Loading frames · {loadedPct}%</div>
          </div>
        </div>
      </div>
    </>
  );
}
