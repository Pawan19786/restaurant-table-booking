import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import LoginModal from "./Login";
import RegisterModal from "./Register";

const PARTICLES = [
  { size: 4, y: "8%",  dur: "16s", delay: "0s",  dir: "ltr" },
  { size: 5, y: "22%", dur: "20s", delay: "2s",  dir: "rtl" },
  { size: 3, y: "38%", dur: "14s", delay: "5s",  dir: "ltr" },
  { size: 6, y: "55%", dur: "18s", delay: "1s",  dir: "rtl" },
  { size: 4, y: "70%", dur: "22s", delay: "7s",  dir: "ltr" },
  { size: 3, y: "85%", dur: "15s", delay: "3s",  dir: "rtl" },
];

const INFO_CARDS = [
  {
    icon: "◈",
    label: "Location",
    title: "Find Us",
    lines: ["14 Elysian Boulevard, Heritage Quarter", "Mumbai, Maharashtra 400001", "India"],
  },
  {
    icon: "◇",
    label: "Reservations",
    title: "Call or Write",
    lines: ["+91 98765 43210", "reservations@thereserve.in", "concierge@thereserve.in"],
  },
  {
    icon: "○",
    label: "Hours of Service",
    title: "Open Daily",
    lines: ["Mon – Thu   6:00 PM – 11:30 PM", "Fri – Sat     5:30 PM – 12:30 AM", "Sunday       6:00 PM – 11:00 PM"],
  },
];

const ENQUIRY_TYPES = [
  "Table Reservation",
  "Private Dining Event",
  "Special Occasion",
  "Feedback",
  "General Enquiry",
];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  enquiry: string;
  date: string;
  message: string;
}

export default function Contact() {
  const [isDark, setIsDark]             = useState(true);
  const [activeLink, setActiveLink]     = useState("Contact");
  const [openLoginModal, setOpenLogin]  = useState(false);
  const [openRegisterModal, setOpenReg] = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [form, setForm]                 = useState<FormState>({
    firstName: "", lastName: "", email: "",
    phone: "", enquiry: "", date: "", message: "",
  });

  const navigate    = useNavigate();
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("rv"); }),
      { threshold: 0.08 }
    );
    sectionRefs.current.forEach((r) => r && observer.observe(r));
    return () => observer.disconnect();
  }, []);

  const ref  = (i: number) => (el: HTMLDivElement | null) => { sectionRefs.current[i] = el; };

  // ── theme tokens (mirrors About.tsx) ──────────────────────────────────────
  const bg   = isDark ? "bg-[#070310] text-white"        : "bg-[#f5f0ff] text-black";
  const bdr  = isDark ? "border-purple-500/[0.12]"       : "border-purple-300/25";
  const card = isDark ? "bg-white/[0.028]"               : "bg-white/75";
  const sub  = isDark ? "text-purple-300/40"             : "text-purple-600/50";
  const body = isDark ? "text-purple-200/55"             : "text-purple-800/65";
  const head = isDark ? "text-purple-100"                : "text-purple-950";
  const hr   = isDark
    ? "bg-gradient-to-r from-transparent via-purple-400/45 to-transparent"
    : "bg-gradient-to-r from-transparent via-purple-500/35 to-transparent";

  const inputBase = `w-full rounded-xl border px-4 py-3 font-['Cormorant_Garamond'] text-[1rem] outline-none transition-all duration-300 placeholder:opacity-30 focus:ring-0 ${
    isDark
      ? "bg-white/[0.035] border-purple-500/[0.12] text-purple-100 placeholder-purple-200 focus:border-purple-400/40 focus:bg-purple-900/20"
      : "bg-white/60 border-purple-300/25 text-purple-950 placeholder-purple-400 focus:border-purple-400/45 focus:bg-purple-50/60"
  }`;

  const SectionLabel = ({ text }: { text: string }) => (
    <span className={`font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.28em] uppercase block mb-2 ${sub}`}>{text}</span>
  );
  const SectionTitle = ({ text }: { text: string }) => (
    <h2 className={`font-['Cinzel'] text-[1.3rem] tracking-[0.1em] mb-5 ${head}`}>{text}</h2>
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ${bg}`}>

      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute w-[550px] h-[550px] rounded-full blur-[120px] opacity-[0.13] -top-32 -right-32 animate-[d1_16s_ease-in-out_infinite] ${isDark ? "bg-[#7030d0]" : "bg-[#9060e0]"}`} />
        <div className={`absolute w-[450px] h-[450px] rounded-full blur-[110px] opacity-[0.10] -bottom-24 -left-20 animate-[d2_19s_ease-in-out_infinite] ${isDark ? "bg-[#a060f0]" : "bg-[#b080f0]"}`} />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: isDark
              ? "linear-gradient(rgba(160,96,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(160,96,240,1) 1px,transparent 1px)"
              : "linear-gradient(rgba(100,40,200,1) 1px,transparent 1px),linear-gradient(90deg,rgba(100,40,200,1) 1px,transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        {PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: p.size, height: p.size, top: p.y,
            left: p.dir === "ltr" ? "-8px" : "calc(100% + 8px)",
            background: isDark ? "rgba(180,130,255,0.32)" : "rgba(120,60,200,0.25)",
            boxShadow: isDark ? `0 0 ${p.size*2}px rgba(160,100,255,0.45)` : `0 0 ${p.size*2}px rgba(100,50,180,0.35)`,
            animation: `${p.dir === "ltr" ? "sR" : "sL"} ${p.dur} linear ${p.delay} infinite`,
          }} />
        ))}
      </div>

      <div className="relative z-10">
        <Navbar
          isDark={isDark} setIsDark={setIsDark}
          onLoginOpen={() => setOpenLogin(true)}
          onRegisterOpen={() => setOpenReg(true)}
          activeLink={activeLink} setActiveLink={setActiveLink}
        />

        {/* ── HERO ── */}
        <div className={`text-center px-8 pt-14 pb-10 border-b ${bdr} relative animate-[fu_0.9s_cubic-bezier(0.16,1,0.3,1)_both]`}>
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-px ${hr}`} />
          <span className={`font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.32em] block mb-2 ${sub}`}>
            Fine Dining &amp; Reservations · Est. 2012
          </span>
          <h1
            className={`font-['Cinzel'] font-[500] tracking-[0.18em] leading-none mb-3 ${
              isDark
                ? "text-transparent bg-clip-text bg-gradient-to-br from-[#c090ff] via-[#f0d8ff] to-[#9060d8]"
                : "text-transparent bg-clip-text bg-gradient-to-br from-[#5010b0] via-[#8040d0] to-[#4010a0]"
            }`}
            style={{ fontSize: "clamp(1.8rem,4vw,3rem)", WebkitBackgroundClip: "text" }}
          >
            Contact Us
          </h1>
          <p className={`font-['Cormorant_Garamond'] text-[1rem] tracking-[0.12em] mb-1 ${sub}`}>
            We'd love to hear from you
          </p>
          <div className={`w-14 h-px mx-auto my-4 ${hr}`} />
          <p className={`font-['Cormorant_Garamond'] font-[300] text-[1.08rem] tracking-[0.04em] leading-relaxed max-w-xl mx-auto ${body}`}>
            Whether it's a table reservation, a private event, or simply a message — our concierge team is ready to craft an extraordinary evening for you.
          </p>
        </div>

        <div className="max-w-[880px] mx-auto px-5 py-10 space-y-5">

          {/* ── INFO CARDS ── */}
          <div ref={ref(0)} className="rs grid grid-cols-1 md:grid-cols-3 gap-4">
            {INFO_CARDS.map((c, i) => (
              <div
                key={i}
                className={`rounded-2xl border backdrop-blur-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/30 ${card} ${bdr}`}
              >
                <span className={`text-[1.4rem] block mb-3 ${isDark ? "text-purple-400/50" : "text-purple-500/55"}`}>{c.icon}</span>
                <span className={`text-[10px] tracking-[0.22em] uppercase block mb-1 ${sub}`}>{c.label}</span>
                <h3 className={`font-['Cinzel'] text-[12px] tracking-[0.12em] mb-3 ${head}`}>{c.title}</h3>
                {c.lines.map((line, j) => (
                  <p key={j} className={`font-['Cormorant_Garamond'] text-[1rem] leading-relaxed ${body}`}>{line}</p>
                ))}
              </div>
            ))}
          </div>

          {/* ── CONTACT FORM ── */}
          <div ref={ref(1)} className={`rs rounded-2xl border backdrop-blur-2xl p-9 ${card} ${bdr}`}>
            <SectionLabel text="Get in Touch" />
            <SectionTitle text="Send a Message" />

            {submitted ? (
              /* ── SUCCESS STATE ── */
              <div className="text-center py-10 animate-[fu_0.7s_cubic-bezier(0.16,1,0.3,1)_both]">
                <span className={`text-[2.5rem] block mb-4 ${isDark ? "text-purple-400/60" : "text-purple-500/65"}`}>✦</span>
                <h3 className={`font-['Cinzel'] text-[1.1rem] tracking-[0.15em] mb-3 ${head}`}>Message Received</h3>
                <p className={`font-['Cormorant_Garamond'] text-[1.05rem] leading-relaxed max-w-sm mx-auto mb-6 ${body}`}>
                  Our concierge will respond within two hours. We look forward to welcoming you.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ firstName:"",lastName:"",email:"",phone:"",enquiry:"",date:"",message:"" }); }}
                  className={`font-['Cinzel'] text-[10px] tracking-[0.2em] uppercase px-8 py-3 rounded-xl border transition-all duration-300 hover:-translate-y-[1px] ${
                    isDark
                      ? "border-purple-400/30 text-purple-300/70 hover:border-purple-300/55 hover:text-purple-200 bg-purple-900/15"
                      : "border-purple-400/35 text-purple-700 hover:bg-purple-50 bg-white/60"
                  }`}
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Row 1 – Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.22em] uppercase ${sub}`}>First Name</label>
                    <input name="firstName" value={form.firstName} onChange={handleChange}
                      className={inputBase} placeholder="Arjun" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.22em] uppercase ${sub}`}>Last Name</label>
                    <input name="lastName" value={form.lastName} onChange={handleChange}
                      className={inputBase} placeholder="Sharma" required />
                  </div>
                </div>

                {/* Row 2 – Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.22em] uppercase ${sub}`}>Email Address</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      className={inputBase} placeholder="arjun@example.com" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.22em] uppercase ${sub}`}>Phone Number</label>
                    <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                      className={inputBase} placeholder="+91 98765 43210" />
                  </div>
                </div>

                {/* Row 3 – Enquiry Type & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.22em] uppercase ${sub}`}>Enquiry Type</label>
                    <select name="enquiry" value={form.enquiry} onChange={handleChange}
                      className={`${inputBase} appearance-none cursor-pointer`} required
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239b6dff' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                        paddingRight: "36px",
                      }}
                    >
                      <option value="" disabled>Select topic</option>
                      {ENQUIRY_TYPES.map((t) => (
                        <option key={t} value={t} className={isDark ? "bg-[#0f0820]" : "bg-white"}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={`font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.22em] uppercase ${sub}`}>Preferred Date</label>
                    <input name="date" type="date" value={form.date} onChange={handleChange}
                      className={inputBase} />
                  </div>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label className={`font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.22em] uppercase ${sub}`}>Your Message</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows={4}
                    className={`${inputBase} resize-none`}
                    placeholder="Tell us how we can make your evening extraordinary..." />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className={`w-full py-4 font-['Cinzel'] text-[11px] tracking-[0.22em] uppercase rounded-xl text-white transition-all duration-300 relative overflow-hidden group hover:-translate-y-[2px] ${
                    isDark
                      ? "bg-gradient-to-r from-[#6820c8] via-[#9850e8] to-[#bf78ff] shadow-[0_5px_28px_rgba(140,80,240,0.35)] hover:shadow-[0_12px_44px_rgba(160,100,255,0.52)]"
                      : "bg-gradient-to-r from-[#5010a8] via-[#7830c8] to-[#9050e0] shadow-[0_5px_24px_rgba(100,40,200,0.32)] hover:shadow-[0_12px_40px_rgba(120,60,220,0.48)]"
                  }`}
                >
                  <span className="relative z-10">Send Message</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>

              </form>
            )}
          </div>

          {/* ── MAP PLACEHOLDER ── */}
          <div ref={ref(2)} className={`rs rounded-2xl border backdrop-blur-2xl overflow-hidden ${card} ${bdr}`}>
            <div className="px-9 pt-8 pb-4">
              <SectionLabel text="Location" />
              <SectionTitle text="Find The Reserve" />
            </div>
            <div
              className={`mx-5 mb-6 rounded-xl border h-48 relative overflow-hidden flex items-center justify-center ${bdr} ${isDark ? "bg-white/[0.018]" : "bg-purple-50/40"}`}
              style={{
                backgroundImage: isDark
                  ? "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(155,109,255,0.04) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(155,109,255,0.04) 40px)"
                  : "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(120,60,200,0.05) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(120,60,200,0.05) 40px)",
              }}
            >
              {/* Pulsing pin */}
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-4 h-4 rounded-full animate-[pinPulse_2s_ease-in-out_infinite] ${isDark ? "bg-purple-400 shadow-[0_0_0_5px_rgba(155,109,255,0.18),0_0_22px_rgba(155,109,255,0.45)]" : "bg-purple-500 shadow-[0_0_0_5px_rgba(120,60,200,0.15),0_0_20px_rgba(120,60,200,0.35)]"}`} />
                <span className={`font-['Cinzel'] text-[10px] tracking-[0.18em] px-4 py-1.5 rounded-lg border ${isDark ? "border-purple-400/25 bg-[#070310]/80 text-purple-200/70" : "border-purple-300/30 bg-white/80 text-purple-700"}`}>
                  THE RESERVE · Heritage Quarter, Mumbai
                </span>
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div ref={ref(3)} className="rs text-center pb-8 pt-2">
            <p className={`font-['Cormorant_Garamond'] italic text-[1.1rem] tracking-wide mb-5 ${body}`}>
              Ready for an extraordinary evening?
            </p>
            <button
              onClick={() => navigate("/book-table")}
              className={`px-12 py-4 font-['Cinzel'] text-[11px] tracking-[0.22em] uppercase rounded-xl text-white transition-all duration-300 relative overflow-hidden group hover:-translate-y-[2px] ${
                isDark
                  ? "bg-gradient-to-r from-[#6820c8] via-[#9850e8] to-[#bf78ff] shadow-[0_5px_28px_rgba(140,80,240,0.35)] hover:shadow-[0_12px_44px_rgba(160,100,255,0.52)]"
                  : "bg-gradient-to-r from-[#5010a8] via-[#7830c8] to-[#9050e0] shadow-[0_5px_24px_rgba(100,40,200,0.32)] hover:shadow-[0_12px_40px_rgba(120,60,220,0.48)]"
              }`}
            >
              <span className="relative z-10">Reserve a Table</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>

        </div>
      </div>

      <LoginModal isOpen={openLoginModal} onClose={() => setOpenLogin(false)} onSwitchToRegister={() => { setOpenLogin(false); setOpenReg(true); }} />
      <RegisterModal isOpen={openRegisterModal} onClose={() => setOpenReg(false)} onSwitchToLogin={() => { setOpenReg(false); setOpenLogin(true); }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500;600&display=swap');

        @keyframes fu  { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
        @keyframes d1  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-45px,35px)} }
        @keyframes d2  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(35px,-45px)} }
        @keyframes sR  { 0%{transform:translateX(0);opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{transform:translateX(100vw);opacity:0} }
        @keyframes sL  { 0%{transform:translateX(0);opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{transform:translateX(-100vw);opacity:0} }
        @keyframes pinPulse {
          0%,100% { box-shadow: 0 0 0 5px rgba(155,109,255,0.18), 0 0 22px rgba(155,109,255,0.45); }
          50%      { box-shadow: 0 0 0 10px rgba(155,109,255,0.08), 0 0 36px rgba(155,109,255,0.6); }
        }

        .rs {
          opacity: 0; transform: translateY(28px);
          transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
        }
        .rv { opacity: 1 !important; transform: translateY(0) !important; }
      `}</style>
    </div>
  );
}