/**
 * LandingPage.tsx — v5 (Zomato proportional scroll)
 *
 * Architecture:
 *  - 3 fixed full-screen panels stacked vertically (in virtual space)
 *  - Wheel / touch accumulates into `rawTarget` (clamped [0, 2*vh])
 *  - RAF lerps `current` toward `rawTarget` → drives translateY for all 3 panels
 *  - Panel translateY:
 *      Panel 0: translateY(-current)
 *      Panel 1: translateY(vh - current)
 *      Panel 2: translateY(2*vh - current)
 *  - Scroll DOWN: rawTarget increases (panels slide up)
 *  - Scroll UP:   rawTarget decreases BUT only if < 2*vh (hero → scene blocked)
 *  - Once current ≥ 2*vh hero unlocks, wheel listener removed, native scroll takes over
 *
 *  Bottle panel auto-loops frames (24fps) while it's partially visible.
 */

import { useEffect, useRef, useCallback } from "react";
import HeroSection from "../Pages/HeroSection";

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_FRAMES = 192;
const FPS          = 24;
const LERP         = 0.10;   // smoothing factor per rAF tick (~60fps)
const SNAP_EPS     = 0.5;    // px — snap to target when this close

function pad3(n: number) { return String(n).padStart(3, "0"); }
function frameUrl(n: number) { return `/frames/ezgif-frame-${pad3(n)}.jpg`; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

const PARTICLES = Array.from({ length: 38 }, (_, i) => ({
  id: i,
  size: Math.random() * 2.2 + 0.6,
  left: Math.random() * 100,
  bottom: Math.random() * 40,
  delay: Math.random() * 10,
  dur: Math.random() * 9 + 7,
  dx: (Math.random() - 0.5) * 80,
  color: ["#F7E6C2","#caa561","#e8c97e","#f3e2be","#d4a843"][Math.floor(Math.random() * 5)],
}));

// ══════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  // ── Canvas / frames ───────────────────────────────────────────────────────
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const imagesRef   = useRef<HTMLImageElement[]>([]);
  const frameRef    = useRef(0);
  const dirtyRef    = useRef(false);
  const loadedRef   = useRef(false);
  const loadPctRef  = useRef(0);

  // ── Panel refs (DOM) ──────────────────────────────────────────────────────
  const panel0Ref = useRef<HTMLDivElement>(null);  // bottle
  const panel1Ref = useRef<HTMLDivElement>(null);  // scene
  const panel2Ref = useRef<HTMLDivElement>(null);  // hero
  const loaderRef = useRef<HTMLDivElement>(null);
  const loaderFillRef = useRef<HTMLDivElement>(null);
  const loaderPctRef  = useRef<HTMLSpanElement>(null);

  // ── Scroll state (all refs — zero re-renders during scroll) ──────────────
  const rawTargetRef    = useRef(0);   // accumulated scroll px (clamped)
  const currentRef      = useRef(0);   // lerped display value
  const heroUnlockedRef = useRef(false);
  const mainRafRef      = useRef<number | null>(null);

  // ── Auto-loop refs ────────────────────────────────────────────────────────
  const loopRafRef   = useRef<number | null>(null);
  const lastFrameTs  = useRef(0);

  // ─────────────────────────────────────────────────────────────────────────
  // Preload
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const imgs: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let done = 0;
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(i + 1);
      img.onload = () => {
        done++;
        if (done % 8 === 0 || done === TOTAL_FRAMES) {
          const pct = Math.round((done / TOTAL_FRAMES) * 100);
          loadPctRef.current = pct;
          if (loaderFillRef.current) loaderFillRef.current.style.width = `${pct}%`;
          if (loaderPctRef.current)  loaderPctRef.current.textContent = `Loading · ${pct}%`;
        }
        if (done === TOTAL_FRAMES) {
          loadedRef.current = true;
          dirtyRef.current  = true;
          if (loaderRef.current) loaderRef.current.classList.add("lp-done");
        }
      };
      img.onerror = () => { done++; if (done === TOTAL_FRAMES) { loadedRef.current = true; if (loaderRef.current) loaderRef.current.classList.add("lp-done"); } };
      imgs[i] = img;
    }
    imagesRef.current = imgs;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Draw current frame to canvas
  // ─────────────────────────────────────────────────────────────────────────
  const drawFrame = useCallback((idx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = imagesRef.current[idx];
    if (!img?.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: cw, height: ch } = canvas;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - sw) / 2, (ch - sh) / 2, sw, sh);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Resize canvas
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width  = window.innerWidth;
      c.height = window.innerHeight;
      dirtyRef.current = true;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Auto-loop: advance bottle frames (runs while panel 0 visible)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = 1000 / FPS;
    const autoLoop = (ts: number) => {
      // Stop looping once bottle panel fully off-screen
      if (currentRef.current >= window.innerHeight) {
        loopRafRef.current = requestAnimationFrame(autoLoop);
        return;
      }
      if (loadedRef.current && ts - lastFrameTs.current >= interval) {
        lastFrameTs.current = ts;
        frameRef.current = (frameRef.current + 1) % TOTAL_FRAMES;
        dirtyRef.current = true;
      }
      loopRafRef.current = requestAnimationFrame(autoLoop);
    };
    loopRafRef.current = requestAnimationFrame(autoLoop);
    return () => { if (loopRafRef.current) cancelAnimationFrame(loopRafRef.current); };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Main RAF loop: lerp + apply transforms + draw canvas
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const vh = () => window.innerHeight;

    const tick = () => {
      const raw = rawTargetRef.current;
      let cur   = currentRef.current;

      // Lerp toward target
      const diff = raw - cur;
      if (Math.abs(diff) < SNAP_EPS) {
        cur = raw;
      } else {
        cur = lerp(cur, raw, LERP);
      }
      currentRef.current = cur;

      // Apply translateY to each panel using inline style (no React re-render)
      const h = vh();
      if (panel0Ref.current) panel0Ref.current.style.transform = `translateY(${-cur}px)`;
      if (panel1Ref.current) panel1Ref.current.style.transform = `translateY(${h - cur}px)`;
      if (panel2Ref.current) panel2Ref.current.style.transform = `translateY(${2 * h - cur}px)`;

      // Draw canvas frame
      if (dirtyRef.current) {
        drawFrame(frameRef.current);
        dirtyRef.current = false;
      }

      // Unlock hero once current reaches 2*vh
      if (!heroUnlockedRef.current && cur >= 2 * h - SNAP_EPS) {
        heroUnlockedRef.current = true;
        document.body.style.overflow   = "";
        document.body.style.overflowY  = "auto";
        // panel2 is now at y=0, unlock done
      }

      mainRafRef.current = requestAnimationFrame(tick);
    };

    mainRafRef.current = requestAnimationFrame(tick);
    return () => { if (mainRafRef.current) cancelAnimationFrame(mainRafRef.current); };
  }, [drawFrame]);

  // ─────────────────────────────────────────────────────────────────────────
  // Wheel + Touch — accumulate into rawTarget
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Removed clamp2

    const handleDelta = (delta: number) => {
      if (heroUnlockedRef.current) return; // hero unlocked → native scroll handles everything

      const raw = rawTargetRef.current;
      const maxScroll = 2 * window.innerHeight;

      if (delta > 0) {
        // Scroll DOWN — allowed up to 2*vh
        const next = Math.min(maxScroll, raw + delta);
        rawTargetRef.current = next;
        // Once we hit the ceiling, lock permanently
        if (next >= maxScroll) {
          rawTargetRef.current = maxScroll;
        }
      } else {
        // Scroll UP — only allowed if we haven't fully entered hero yet
        // raw < 2*vh → can go back (scene ↔ bottle)
        // raw === 2*vh → hero entered, blocked
        if (raw < maxScroll) {
          rawTargetRef.current = Math.max(0, raw + delta); // delta is negative
        }
        // if raw >= maxScroll: permanently blocked going back
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (heroUnlockedRef.current) return;
      e.preventDefault();
      handleDelta(e.deltaY);
    };

    let ty0 = 0;
    const onTouchStart = (e: TouchEvent) => { ty0 = e.touches[0].clientY; };
    const onTouchMove  = (e: TouchEvent) => {
      if (heroUnlockedRef.current) return;
      e.preventDefault();
      const dy = ty0 - e.touches[0].clientY;
      ty0 = e.touches[0].clientY;
      handleDelta(dy * 2); // amplify slightly for touch feel
    };

    window.addEventListener("wheel",      onWheel,      { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true  });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });

    return () => {
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      document.body.style.overflow = "";
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER — pure layout, no scroll-state in JSX (all driven via refs+RAF)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

        /* ── Panel base ─────────────────────────────────────────────── */
        .lp-panel {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          will-change: transform;
          /* NO CSS transition — RAF drives it directly for smooth tracking */
        }

        /* ── BOTTLE PANEL ───────────────────────────────────────────── */
        .lp-p0 { background: #050311; z-index: 10; }
        .lp-canvas {
          position: absolute; inset: 0;
          width: 100% !important; height: 100% !important;
          display: block;
        }
        .lp-vignette {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 63% 63% at 50% 50%, transparent 36%, rgba(5,3,17,.54) 100%),
            linear-gradient(to bottom, rgba(5,3,17,.26) 0%, transparent 16%, transparent 84%, rgba(5,3,17,.26) 100%);
          z-index: 2;
        }
        .lp-glow {
          position: absolute;
          width: 540px; height: 540px;
          top: 50%; left: 50%; transform: translate(-50%,-50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,152,58,.09) 0%, transparent 65%);
          filter: blur(70px); z-index: 1; pointer-events: none;
          animation: lp-pulse 4.2s ease-in-out infinite;
        }
        @keyframes lp-pulse {
          0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1);}
          50%{opacity:.9;transform:translate(-50%,-50%) scale(1.13);}
        }
        .lp-wm {
          position: absolute; top: 24px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 14px;
          z-index: 6; pointer-events: none;
        }
        .lp-wm-line { width: 42px; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,152,58,.3)); }
        .lp-wm-line.r { background: linear-gradient(270deg, transparent, rgba(201,152,58,.3)); }
        .lp-wm-text {
          font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: .28em;
          text-transform: uppercase; color: rgba(201,152,58,.38);
        }
        .lp-live-badge {
          position: absolute; top: 20px; left: 22px; z-index: 6;
          display: flex; align-items: center; gap: 8px;
          background: rgba(5,3,17,.7);
          border: 1px solid rgba(201,152,58,.18);
          padding: 5px 14px 5px 10px; border-radius: 999px;
          pointer-events: none;
        }
        .lp-live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #e4b24a;
          box-shadow: 0 0 8px rgba(201,152,58,.7);
          animation: lp-blink 1.4s ease-in-out infinite;
        }
        @keyframes lp-blink{0%,100%{opacity:.35;}50%{opacity:1;}}
        .lp-live-label {
          font-family: 'Cinzel', serif; font-size: 8px; letter-spacing: .22em;
          text-transform: uppercase; color: rgba(201,152,58,.52);
        }

        /* ── Scroll progress indicator (right rail) ─────────────────── */
        .lp-rail {
          position: absolute; right: 24px; top: 50%; transform: translateY(-50%);
          width: 2px; height: 140px;
          background: rgba(201,152,58,.08); border-radius: 999px; z-index: 6;
          pointer-events: none;
        }
        .lp-rail-fill {
          position: absolute; top: 0; left: 0; right: 0;
          background: linear-gradient(to bottom, rgba(201,152,58,.9), rgba(201,152,58,.2));
          border-radius: 999px;
          box-shadow: 0 0 8px rgba(201,152,58,.4);
          width: 100%;
          height: 0%; /* updated by RAF */
          transition: none;
        }

        /* ── Scroll cue ─────────────────────────────────────────────── */
        .lp-cue {
          position: absolute; bottom: 7vh; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 9px;
          z-index: 6; pointer-events: none;
          animation: lp-fadeUp 1s ease .7s both;
        }
        .lp-cue-arrow {
          width: 20px; height: 20px;
          border-right: 1.5px solid rgba(201,152,58,.55);
          border-bottom: 1.5px solid rgba(201,152,58,.55);
          transform: rotate(45deg);
          animation: lp-arrow 1.6s ease-in-out infinite;
        }
        .lp-cue-arrow.a2 { animation-delay: .25s; margin-top: -14px; opacity: .45; }
        @keyframes lp-arrow {
          0%,100%{opacity:.4;transform:rotate(45deg) translate(0,0);}
          50%{opacity:1;transform:rotate(45deg) translate(5px,5px);}
        }
        .lp-cue-text {
          font-family: 'Cinzel', sans-serif; font-size: 8px; letter-spacing: .3em;
          text-transform: uppercase; color: rgba(201,152,58,.42); margin-top: 4px;
        }

        /* ── Loader ─────────────────────────────────────────────────── */
        .lp-loader {
          position: absolute; inset: 0; z-index: 12;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: #050311; gap: 22px;
          transition: opacity .7s ease, visibility .7s;
        }
        .lp-done { opacity: 0; visibility: hidden; pointer-events: none; }
        .lp-loader-icon {
          font-size: 2.6rem;
          animation: lp-bob 2s ease-in-out infinite;
          filter: drop-shadow(0 0 16px rgba(201,152,58,.28));
        }
        @keyframes lp-bob{0%,100%{transform:translateY(0) rotate(-5deg);}50%{transform:translateY(-12px) rotate(5deg);}}
        .lp-loader-track { width: 180px; height: 2px; background: rgba(201,152,58,.1); border-radius: 999px; overflow: hidden; }
        .lp-loader-fill-bar {
          height: 100%; width: 0;
          background: linear-gradient(90deg, #b8832a, #e4b24a, #b8832a);
          background-size: 200% 100%;
          border-radius: 999px;
          box-shadow: 0 0 10px rgba(201,152,58,.45);
          animation: lp-shim 1.8s linear infinite;
          transition: width .3s ease;
        }
        @keyframes lp-shim{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
        .lp-loader-pct {
          font-family: 'Cinzel', sans-serif; font-size: 10px; letter-spacing: .28em;
          text-transform: uppercase; color: rgba(201,152,58,.42);
        }

        /* ── SCENE PANEL ────────────────────────────────────────────── */
        .lp-p1 { background: #060505; z-index: 9; }
        @keyframes goldDrift {
          0%   { opacity:0; transform:translateY(0) translateX(0) scale(1); }
          15%  { opacity:1; }
          85%  { opacity:.5; }
          100% { opacity:0; transform:translateY(-320px) translateX(var(--dx)) scale(.2); }
        }
        @keyframes lp-fadeUp{0%{opacity:0;transform:translateY(18px);}100%{opacity:1;transform:translateY(0);}}
        @keyframes crownGlow{0%,100%{filter:drop-shadow(0 0 10px rgba(247,230,194,.22));}50%{filter:drop-shadow(0 0 28px rgba(247,230,194,.55));}}
        @keyframes shimmerSweep{0%{left:-80%;}100%{left:200%;}}
        @keyframes divExpand{0%{width:0;opacity:0;}100%{width:200px;opacity:1;}}
        @keyframes rotateSlow{to{transform:rotate(360deg);}}
        @keyframes pulseCenter{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.7;}50%{transform:translate(-50%,-50%) scale(1.5);opacity:0;}}
        @keyframes borderPulse{0%,100%{opacity:.15;}50%{opacity:.32;}}
        @keyframes lp-float1{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
        @keyframes lp-float2{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
        @keyframes lp-float3{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
        .lp-scene-cue {
          position: absolute; bottom: 6vh; left: 50%; transform: translateX(-50%);
          padding: 7px 22px; border-radius: 999px; z-index: 20;
          background: rgba(0,0,0,.42); border: 1px solid rgba(202,165,97,.14);
          font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: .36em;
          color: #caa561; pointer-events: none;
          animation: lp-fadeUp .6s ease .5s both;
        }
        /* back arrow on scene panel */
        .lp-back-hint {
          position: absolute; top: 6vh; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 7px;
          z-index: 20; pointer-events: none;
          animation: lp-fadeUp .6s ease 1s both;
        }
        .lp-back-arrow {
          width: 18px; height: 18px;
          border-left: 1.5px solid rgba(201,152,58,.4);
          border-top: 1.5px solid rgba(201,152,58,.4);
          transform: rotate(45deg);
          animation: lp-arrowUp 1.6s ease-in-out infinite;
        }
        .lp-back-arrow.a2 { animation-delay: .25s; margin-bottom: -12px; opacity: .45; }
        @keyframes lp-arrowUp{0%,100%{opacity:.35;transform:rotate(45deg) translate(0,0);}50%{opacity:.9;transform:rotate(45deg) translate(-4px,-4px);}}
        .lp-back-text {
          font-family: 'Cinzel', serif; font-size: 7px; letter-spacing: .26em;
          text-transform: uppercase; color: rgba(201,152,58,.38);
        }

        /* ── HERO PANEL ─────────────────────────────────────────────── */
        .lp-p2 {
          z-index: 8;
          overflow-y: auto;
          overflow-x: hidden;
        }

        @media (max-width:640px) {
          .lp-wm { display:none; }
          .lp-live-badge { left:14px; }
          .lp-rail { right:12px; height:90px; }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════
          PANEL 0 — BOTTLE (auto-loop, proportional slide)
      ════════════════════════════════════════════════════════ */}
      <div ref={panel0Ref} className="lp-panel lp-p0">
        <canvas ref={canvasRef} className="lp-canvas" aria-hidden="true" />
        <div className="lp-glow"     aria-hidden="true" />
        <div className="lp-vignette" aria-hidden="true" />

        {/* Watermark */}
        <div className="lp-wm" aria-hidden="true">
          <div className="lp-wm-line" />
          <span className="lp-wm-text">TableTime · Premium Experience</span>
          <div className="lp-wm-line r" />
        </div>

        {/* Live badge */}
        <div className="lp-live-badge" aria-hidden="true">
          <div className="lp-live-dot" />
          <span className="lp-live-label">Live Preview</span>
        </div>

        {/* Right rail — height driven by RAF */}
        <div className="lp-rail" aria-hidden="true" id="lp-rail-wrap">
          <div className="lp-rail-fill" id="lp-rail-fill" />
        </div>

        {/* Scroll cue */}
        <div className="lp-cue" aria-hidden="true">
          <div className="lp-cue-arrow" />
          <div className="lp-cue-arrow a2" />
          <span className="lp-cue-text">Scroll to Experience</span>
        </div>

        {/* Loader */}
        <div className="lp-loader" ref={loaderRef} aria-live="polite">
          <div className="lp-loader-icon">🍾</div>
          <div className="lp-loader-track">
            <div className="lp-loader-fill-bar" ref={loaderFillRef} />
          </div>
          <span className="lp-loader-pct" ref={loaderPctRef}>Loading · 0%</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          PANEL 1 — RESTAURANT SCENE SPLASH
      ════════════════════════════════════════════════════════ */}
      <div ref={panel1Ref} className="lp-panel lp-p1">

        {/* Particles */}
        <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
          {PARTICLES.map(p => (
            <div key={p.id} style={{
              position:"absolute", borderRadius:"50%",
              width:p.size, height:p.size,
              left:`${p.left}%`, bottom:`${p.bottom}%`,
              background:p.color, opacity:0,
              animation:`goldDrift ${p.dur}s linear ${-p.delay}s infinite`,
              ["--dx" as any]:`${p.dx}px`,
            }} />
          ))}
        </div>

        {/* Shimmer */}
        <div style={{ pointerEvents:"none", position:"absolute", top:0, bottom:0, left:"-80%", width:"48%",
          background:"linear-gradient(90deg, transparent, rgba(247,230,194,.03), transparent)",
          animation:"shimmerSweep 5.5s ease-in-out infinite" }} />

        {/* Orbs */}
        <div style={{ position:"absolute", left:-160, top:0, width:580, height:580, borderRadius:"50%", background:"radial-gradient(circle, rgba(202,165,97,.11) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", right:-192, top:-120, width:680, height:680, borderRadius:"50%", background:"radial-gradient(circle, rgba(243,226,190,.07) 0%, transparent 70%)", pointerEvents:"none" }} />

        {/* Frames */}
        <div style={{ position:"absolute", inset:20, borderRadius:40, border:"1px solid rgba(202,165,97,.16)", animation:"borderPulse 4s ease-in-out infinite", zIndex:10 }} />
        <div style={{ position:"absolute", inset:32, borderRadius:34, border:"1px solid rgba(243,226,190,.05)", zIndex:10 }} />

        {/* Rings */}
        <div style={{ position:"absolute", inset:0, opacity:.25, pointerEvents:"none" }}>
          {[
            { w:700, h:700, l:-210, t:-55 }, { w:560, h:560, l:-140, t:65 },
            { w:620, h:620, r:-210, b:-150 }, { w:420, h:420, r:-130, b:-25 },
          ].map((r, i) => (
            <div key={i} style={{ position:"absolute", borderRadius:"50%", border:"1px solid rgba(58,46,22,.6)",
              width:r.w, height:r.h,
              ...(r.l !== undefined ? { left:r.l } : { right:(r as any).r }),
              ...(r.t !== undefined ? { top:r.t }  : { bottom:(r as any).b }),
            }} />
          ))}
        </div>

        {/* Corner badges */}
        {([
          { pos:{ top:52, left:44 },   anim:"lp-float1 8s ease-in-out infinite",  icon:"cloche" },
          { pos:{ top:52, right:44 },  anim:"lp-float2 9s ease-in-out infinite",  icon:"key"    },
          { pos:{ bottom:80, right:44}, anim:"lp-float3 7s ease-in-out infinite", icon:"star"   },
        ] as const).map(({ pos, anim, icon }) => (
          <div key={icon} style={{ position:"absolute", ...pos, zIndex:20, width:52, height:52, borderRadius:"50%",
            background:"rgba(10,7,4,.85)", border:"1px solid rgba(243,226,190,.1)",
            boxShadow:"0 0 22px rgba(202,165,97,.06)", display:"grid", placeItems:"center", animation:anim }}>
            {icon === "cloche" && <svg width="25" height="25" viewBox="0 0 24 24" fill="none"><path d="M4 15h16" stroke="#F3E2BE" strokeWidth="1.6" strokeLinecap="round"/><path d="M6 15a6 6 0 0 1 12 0" stroke="#F3E2BE" strokeWidth="1.6" strokeLinecap="round"/><path d="M12 7v1M10.8 6.2h2.4" stroke="#F3E2BE" strokeWidth="1.6" strokeLinecap="round"/></svg>}
            {icon === "key"   && <svg width="25" height="25" viewBox="0 0 24 24" fill="none"><path d="M14 10a4 4 0 1 1-7.9 1.1A4 4 0 0 1 14 10Zm0 0h8l-2 2 2 2-2 2-2-2-2 2" stroke="#F3E2BE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".88"/></svg>}
            {icon === "star"  && <svg width="23" height="23" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" stroke="#F3E2BE" strokeWidth="1.6" strokeLinejoin="round" opacity=".88"/></svg>}
          </div>
        ))}

        {/* Back hint (scroll up to go back) */}
        <div className="lp-back-hint" aria-hidden="true">
          <div className="lp-back-arrow a2" />
          <div className="lp-back-arrow" />
          <span className="lp-back-text">Scroll up to go back</span>
        </div>

        {/* Center content */}
        <div style={{ position:"relative", zIndex:20, display:"flex", flexDirection:"column", alignItems:"center",
          textAlign:"center", padding:"0 24px", height:"100%", justifyContent:"center" }}>
          <p style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:"italic", fontSize:10, letterSpacing:".5em",
            color:"rgba(202,165,97,.52)", marginBottom:16, animation:"lp-fadeUp 1s ease .2s both" }}>
            Est. Fine Dining &amp; Reservations
          </p>
          <div style={{ marginBottom:18, animation:"crownGlow 3.5s ease-in-out infinite" }}>
            <svg width="96" height="64" viewBox="0 0 100 66" fill="none">
              <defs>
                <linearGradient id="cg2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#b8912a"/>
                  <stop offset="30%"  stopColor="#e8c97e"/>
                  <stop offset="50%"  stopColor="#F7E6C2"/>
                  <stop offset="70%"  stopColor="#e8c97e"/>
                  <stop offset="100%" stopColor="#b8912a"/>
                </linearGradient>
                <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#b8912a" stopOpacity=".55"/>
                  <stop offset="50%"  stopColor="#F7E6C2" stopOpacity=".88"/>
                  <stop offset="100%" stopColor="#b8912a" stopOpacity=".55"/>
                </linearGradient>
              </defs>
              <path d="M14 44 L26 20 L40 37 L50 10 L60 37 L74 20 L86 44" stroke="url(#cg2)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 48 C32 55, 68 55, 82 48" stroke="url(#bg3)" strokeWidth="2.4" strokeLinecap="round"/>
              <line x1="18" y1="50" x2="82" y2="50" stroke="url(#bg3)" strokeWidth="1.1" strokeLinecap="round"/>
              {[[26,20],[50,10],[74,20]].map(([cx, cy], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={i===1?5.4:4.8} fill="#F7E6C2" opacity=".88"/>
                  <circle cx={cx} cy={cy} r={i===1?3.1:2.7} fill="#caa561"/>
                  <circle cx={cx} cy={cy} r={i===1?1.3:1.1} fill="#F7E6C2" opacity=".8"/>
                </g>
              ))}
            </svg>
          </div>
          <h1 style={{ fontFamily:"'Cinzel', serif", fontWeight:700, fontSize:"clamp(34px, 6vw, 52px)",
            letterSpacing:".22em", color:"#f3e2be", textShadow:"0 0 38px rgba(247,230,194,.16)",
            animation:"lp-fadeUp 1s ease .4s both", margin:0 }}>
            THE RESERVE<span style={{ letterSpacing:0 }}>.</span>
          </h1>
          <div style={{ marginTop:11, height:1.5, borderRadius:999,
            background:"linear-gradient(90deg, transparent, #f3e2be, transparent)",
            animation:"divExpand 1.8s ease .6s both" }} />
          <div style={{ display:"flex", alignItems:"center", gap:11, marginTop:14, animation:"lp-fadeUp 1s ease .7s both" }}>
            <div style={{ height:1, width:44, background:"linear-gradient(90deg, transparent, rgba(202,165,97,.42))" }} />
            {[0,1,2].map(i => <div key={i} style={{ width:5, height:5, transform:"rotate(45deg)", background:i===1?"#f3e2be":"#caa561", opacity:i===1?.38:.6 }} />)}
            <div style={{ height:1, width:44, background:"linear-gradient(90deg, rgba(202,165,97,.42), transparent)" }} />
          </div>
          <p style={{ fontFamily:"'Cinzel', serif", fontSize:12.5, letterSpacing:".35em", color:"#caa561",
            textShadow:"0 0 12px rgba(202,165,97,.16)", marginTop:14, animation:"lp-fadeUp 1s ease .8s both" }}>
            PREMIUM TABLE BOOKINGS
          </p>
          <div style={{ marginTop:42, position:"relative", display:"flex", alignItems:"center", justifyContent:"center", animation:"lp-fadeUp 1s ease 1s both" }}>
            <div style={{ position:"absolute", width:62, height:62, borderRadius:"50%", border:"1px solid rgba(202,165,97,.18)", animation:"rotateSlow 12s linear infinite" }} />
            <div style={{ width:42, height:42, borderRadius:"50%", border:"2px solid rgba(243,226,190,.1)", borderTop:"2px solid #f3e2be", animation:"rotateSlow 1.4s linear infinite", filter:"drop-shadow(0 0 9px rgba(243,226,190,.25))" }} />
            <div style={{ position:"absolute", width:6, height:6, borderRadius:"50%", background:"#caa561", top:"50%", left:"50%", transform:"translate(-50%,-50%)", boxShadow:"0 0 9px rgba(202,165,97,.9)" }} />
            <div style={{ position:"absolute", width:13, height:13, borderRadius:"50%", border:"1px solid rgba(202,165,97,.38)", top:"50%", left:"50%", animation:"pulseCenter 2s ease-out infinite" }} />
          </div>
          <p style={{ fontFamily:"'Cinzel', serif", fontSize:9, letterSpacing:".44em", color:"rgba(202,165,97,.36)", marginTop:11, animation:"lp-fadeUp 1s ease 1.1s both" }}>
            PREPARING YOUR EXPERIENCE
          </p>
        </div>

        <div className="lp-scene-cue">SCROLL TO ENTER</div>
      </div>

      {/* ════════════════════════════════════════════════════════
          PANEL 2 — HERO SECTION
      ════════════════════════════════════════════════════════ */}
      <div ref={panel2Ref} className="lp-panel lp-p2">
        <HeroSection />
      </div>

      {/* RAF: update rail fill + hide cue proportionally */}
      <RailSync rawTargetRef={rawTargetRef} />
    </>
  );
}

// ── Tiny invisible component that keeps rail + scroll cue in sync ─────────────
// Uses its own RAF so it doesn't re-render the parent
function RailSync({ rawTargetRef }: { rawTargetRef: React.RefObject<number> }) {
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const vh = window.innerHeight;
      const raw = rawTargetRef.current ?? 0;
      // Section 1 rail: 0..vh maps to 0..100%
      const pct1 = Math.min(1, raw / vh) * 100;
      const fill = document.getElementById("lp-rail-fill");
      if (fill) fill.style.height = `${pct1}%`;

      // Hide scroll cue after 5% of first section
      const cue = document.querySelector(".lp-cue") as HTMLElement | null;
      if (cue) cue.style.opacity = raw > vh * 0.05 ? "0" : "1";

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rawTargetRef]);
  return null;
}
