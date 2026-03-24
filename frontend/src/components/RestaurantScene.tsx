import { useEffect, useRef, useState } from "react";
import HeroSection from "../Pages/HeroSection";

export default function RestaurantScene() {
  const [progress, setProgress] = useState(0);
  const lockRef = useRef(true);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!lockRef.current) return;
      e.preventDefault();
      const delta = e.deltaY;
      setProgress((p) => {
        const next = clamp(p + delta / 850, 0, 1);
        if (next >= 1) lockRef.current = false;
        return next;
      });
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel as any);
  }, []);

  const eased = easeOutCubic(progress);
  const splashY = lerp(0, -110, eased);
  const splashOpacity = lerp(1, 0, eased);
  const dashIn = clamp((progress - 0.12) / 0.88, 0, 1);
  const dashE = easeOutCubic(dashIn);
  const dashY = lerp(40, 0, dashE);
  const dashOpacity = lerp(0, 1, dashE);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <div
        className="absolute inset-0"
        style={{ transform: `translateY(${dashY}px)`, opacity: dashOpacity }}
      >
        <HeroSection />
      </div>

      <div
        className="absolute inset-0 z-50"
        style={{
          transform: `translateY(${splashY}%)`,
          opacity: splashOpacity,
          willChange: "transform, opacity",
        }}
      >
        <SplashUI />
      </div>

      {progress < 1 && (
        <div className="absolute bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-black/40 px-5 py-2 text-[9px] tracking-[0.35em] text-[#caa561] backdrop-blur border border-[#caa561]/15">
          SCROLL TO ENTER
        </div>
      )}
    </div>
  );
}

// ─── Particle Dust ────────────────────────────────────────────────────────────
function GoldDust() {
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    size: Math.random() * 2.5 + 0.8,
    left: Math.random() * 100,
    bottom: Math.random() * 35,
    delay: Math.random() * 10,
    duration: Math.random() * 9 + 7,
    dx: (Math.random() - 0.5) * 90,
    color: ["#F7E6C2", "#caa561", "#e8c97e", "#f3e2be", "#d4a843"][
      Math.floor(Math.random() * 5)
    ],
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            bottom: `${p.bottom}%`,
            background: p.color,
            animation: `goldDrift ${p.duration}s linear ${-p.delay}s infinite`,
            ["--dx" as any]: `${p.dx}px`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Splash ──────────────────────────────────────────────────────────────
function SplashUI() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-[#060505] overflow-hidden">

      {/* Keyframe styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

        @keyframes goldDrift {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 0.5; }
          100% { transform: translateY(-340px) translateX(var(--dx)) scale(0.2); opacity: 0; }
        }
        @keyframes crownGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(247,230,194,0.25)); }
          50%       { filter: drop-shadow(0 0 32px rgba(247,230,194,0.65)); }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes floaty2 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes floaty3 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes shimmerSweep {
          0%   { left: -80%; }
          100% { left: 200%; }
        }
        @keyframes divExpand {
          0%   { width: 0px; opacity: 0; }
          100% { width: 200px; opacity: 1; }
        }
        @keyframes fadeUp {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseCenter {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          50%       { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
        @keyframes rotateSlow {
          to { transform: rotate(360deg); }
        }
        @keyframes borderPulse {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.38; }
        }
      `}</style>

      {/* Gold particle dust */}
      <GoldDust />

      {/* Shimmer sweep */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(247,230,194,0.035), transparent)",
          width: "50%",
          animation: "shimmerSweep 5s ease-in-out infinite",
          position: "absolute",
          top: 0,
          bottom: 0,
        }}
      />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[600px] w-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(202,165,97,0.13) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute -right-48 -top-32 h-[700px] w-[700px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(243,226,190,0.09) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[300px] w-[500px]"
        style={{ background: "radial-gradient(ellipse, rgba(202,165,97,0.07) 0%, transparent 70%)" }} />

      {/* Outer frames */}
      <div
        className="absolute inset-5 rounded-[40px] z-10"
        style={{ border: "1px solid rgba(202,165,97,0.18)", animation: "borderPulse 4s ease-in-out infinite" }}
      />
      <div
        className="absolute inset-8 rounded-[34px] z-10"
        style={{ border: "1px solid rgba(243,226,190,0.07)" }}
      />

      {/* Decorative rings */}
      <Rings />

      {/* Corner badges */}
      <CornerBadge pos="top-[52px] left-[44px]" icon="cloche" animStyle="floaty 8s ease-in-out infinite" />
      <CornerBadge pos="top-[52px] right-[44px]" icon="key" animStyle="floaty2 9s ease-in-out infinite" />
      <CornerBadge pos="bottom-[80px] right-[44px]" icon="star" animStyle="floaty3 7s ease-in-out infinite" />

      {/* Center content */}
      <div className="relative z-20 flex flex-col items-center text-center px-6">

        {/* Est. tagline */}
        <p
          className="mb-4 text-[10px] tracking-[0.5em] text-[#caa561]/55 select-none"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            animation: "fadeUp 1s ease 0.2s both",
          }}
        >
          Est. Fine Dining & Reservations
        </p>

        {/* Crown */}
        <div
          className="mb-5 select-none"
          style={{ animation: "crownGlow 3.5s ease-in-out infinite" }}
        >
          <Crown />
        </div>

        {/* Title */}
        <h1
          className="select-none text-[44px] sm:text-[54px] tracking-[0.22em] text-[#f3e2be]"
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            textShadow: "0 0 40px rgba(247,230,194,0.2)",
            animation: "fadeUp 1s ease 0.4s both",
          }}
        >
          THE RESERVE<span style={{ letterSpacing: 0 }}>.</span>
        </h1>

        {/* Animated divider */}
        <div
          className="mt-3 h-[1.5px] rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, #f3e2be, transparent)",
            animation: "divExpand 1.8s ease 0.6s both",
          }}
        />

        {/* Diamond ornament */}
        <div className="flex items-center gap-3 mt-4" style={{ animation: "fadeUp 1s ease 0.7s both" }}>
          <div className="h-px w-12" style={{ background: "linear-gradient(90deg, transparent, rgba(202,165,97,0.45))" }} />
          <div className="w-[5px] h-[5px] rotate-45 bg-[#caa561] opacity-65" />
          <div className="w-[5px] h-[5px] rotate-45 bg-[#f3e2be] opacity-40" />
          <div className="w-[5px] h-[5px] rotate-45 bg-[#caa561] opacity-65" />
          <div className="h-px w-12" style={{ background: "linear-gradient(90deg, rgba(202,165,97,0.45), transparent)" }} />
        </div>

        {/* Subtitle */}
        <p
          className="mt-4 text-[13px] tracking-[0.36em] text-[#caa561] select-none"
          style={{
            fontFamily: "'Cinzel', serif",
            textShadow: "0 0 14px rgba(202,165,97,0.2)",
            animation: "fadeUp 1s ease 0.8s both",
          }}
        >
          PREMIUM TABLE BOOKINGS
        </p>

        {/* Loader */}
        <div className="mt-12 relative flex items-center justify-center" style={{ animation: "fadeUp 1s ease 1s both" }}>
          {/* Outer slow ring */}
          <div
            className="absolute rounded-full border border-[#caa561]/20"
            style={{ width: 64, height: 64, animation: "rotateSlow 12s linear infinite" }}
          />
          {/* Main spinner */}
          <div
            className="rounded-full"
            style={{
              width: 44,
              height: 44,
              border: "2px solid rgba(243,226,190,0.12)",
              borderTop: "2px solid #f3e2be",
              animation: "rotateSlow 1.4s linear infinite",
              filter: "drop-shadow(0 0 12px rgba(243,226,190,0.3))",
            }}
          />
          {/* Center pulse dot */}
          <div
            className="absolute rounded-full bg-[#caa561]"
            style={{
              width: 6,
              height: 6,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 10px rgba(202,165,97,0.9)",
            }}
          />
          {/* Pulse ring */}
          <div
            className="absolute rounded-full border border-[#caa561]/40"
            style={{
              width: 14,
              height: 14,
              top: "50%",
              left: "50%",
              animation: "pulseCenter 2s ease-out infinite",
            }}
          />
        </div>

        <p
          className="mt-3 text-[9px] tracking-[0.45em] text-[#caa561]/40 select-none"
          style={{ fontFamily: "'Cinzel', serif", animation: "fadeUp 1s ease 1.1s both" }}
        >
          PREPARING YOUR EXPERIENCE
        </p>
      </div>
    </div>
  );
}

// ─── Rings ────────────────────────────────────────────────────────────────────
function Rings() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-30">
      <div className="absolute rounded-full border border-[#3a2e16]/70"
        style={{ width: 720, height: 720, left: -220, top: -60 }} />
      <div className="absolute rounded-full border border-[#3a2e16]/60"
        style={{ width: 580, height: 580, left: -150, top: 60 }} />
      <div className="absolute rounded-full border border-[#3a2e16]/50"
        style={{ width: 440, height: 440, left: -80, top: 160 }} />
      <div className="absolute rounded-full border border-[#3a2e16]/55"
        style={{ width: 640, height: 640, right: -220, bottom: -160 }} />
      <div className="absolute rounded-full border border-[#3a2e16]/45"
        style={{ width: 440, height: 440, right: -140, bottom: -30 }} />
    </div>
  );
}

// ─── Corner Badge ─────────────────────────────────────────────────────────────
function CornerBadge({
  pos,
  icon,
  animStyle,
}: {
  pos: string;
  icon: "key" | "cloche" | "star";
  animStyle: string;
}) {
  return (
    <div
      className={`absolute ${pos} z-20 grid h-[54px] w-[54px] place-items-center rounded-full`}
      style={{
        background: "rgba(12,9,6,0.80)",
        border: "1px solid rgba(243,226,190,0.12)",
        boxShadow: "0 0 28px rgba(202,165,97,0.08), inset 0 0 12px rgba(202,165,97,0.03)",
        backdropFilter: "blur(8px)",
        animation: animStyle,
      }}
    >
      {icon === "key" && <KeyIcon />}
      {icon === "cloche" && <ClocheIcon />}
      {icon === "star" && <StarIcon />}
    </div>
  );
}

// ─── Crown ────────────────────────────────────────────────────────────────────
function Crown() {
  return (
    <svg width="100" height="66" viewBox="0 0 100 66" fill="none">
      <defs>
        <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b8912a" />
          <stop offset="30%" stopColor="#e8c97e" />
          <stop offset="50%" stopColor="#F7E6C2" />
          <stop offset="70%" stopColor="#e8c97e" />
          <stop offset="100%" stopColor="#b8912a" />
        </linearGradient>
        <linearGradient id="baseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b8912a" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#F7E6C2" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#b8912a" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Crown body */}
      <path
        d="M14 44 L26 20 L40 37 L50 10 L60 37 L74 20 L86 44"
        stroke="url(#crownGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base arc */}
      <path
        d="M18 48 C32 55, 68 55, 82 48"
        stroke="url(#baseGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Base line */}
      <line x1="18" y1="50" x2="82" y2="50" stroke="url(#baseGrad)" strokeWidth="1.2" strokeLinecap="round" />
      {/* Crown gems — outer ring + inner fill */}
      <circle cx="26" cy="20" r="5" fill="#F7E6C2" opacity="0.9" />
      <circle cx="26" cy="20" r="2.8" fill="#caa561" />
      <circle cx="26" cy="20" r="1.2" fill="#F7E6C2" opacity="0.8" />

      <circle cx="50" cy="10" r="5.5" fill="#F7E6C2" opacity="0.95" />
      <circle cx="50" cy="10" r="3.2" fill="#caa561" />
      <circle cx="50" cy="10" r="1.4" fill="#F7E6C2" opacity="0.9" />

      <circle cx="74" cy="20" r="5" fill="#F7E6C2" opacity="0.9" />
      <circle cx="74" cy="20" r="2.8" fill="#caa561" />
      <circle cx="74" cy="20" r="1.2" fill="#F7E6C2" opacity="0.8" />
    </svg>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function KeyIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 10a4 4 0 1 1-7.9 1.1A4 4 0 0 1 14 10Zm0 0h8l-2 2 2 2-2 2-2-2-2 2"
        stroke="#F3E2BE"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

function ClocheIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M4 15h16" stroke="#F3E2BE" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 15a6 6 0 0 1 12 0" stroke="#F3E2BE" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 7v1" stroke="#F3E2BE" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10.8 6.2h2.4" stroke="#F3E2BE" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
        stroke="#F3E2BE"
        strokeWidth="1.7"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}