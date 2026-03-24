import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Navbar from "../components/navbar";

interface FormData {
  restaurantName: string;
  date: string;
  time: string;
  guests: string;
  tables: string;
  venue: string;
  theme: string;
  specialRequest: string;
  contactName: string;
  phoneNumber: string;
}

// tiny dots — travel from one screen edge to opposite edge
const PARTICLES = [
  { size: 5,  y: "12%", dur: "13s", delay: "0s",   dir: "ltr" },
  { size: 4,  y: "27%", dur: "17s", delay: "1.5s", dir: "rtl" },
  { size: 6,  y: "41%", dur: "15s", delay: "3s",   dir: "ltr" },
  { size: 4,  y: "58%", dur: "19s", delay: "0.8s", dir: "rtl" },
  { size: 5,  y: "72%", dur: "14s", delay: "5s",   dir: "ltr" },
  { size: 3,  y: "85%", dur: "21s", delay: "2s",   dir: "rtl" },
  { size: 6,  y: "6%",  dur: "16s", delay: "7s",   dir: "ltr" },
  { size: 4,  y: "94%", dur: "18s", delay: "4s",   dir: "rtl" },
  { size: 3,  y: "35%", dur: "22s", delay: "9s",   dir: "ltr" },
  { size: 5,  y: "63%", dur: "12s", delay: "6s",   dir: "rtl" },
  { size: 4,  y: "50%", dur: "20s", delay: "11s",  dir: "ltr" },
  { size: 3,  y: "20%", dur: "25s", delay: "8s",   dir: "rtl" },
];

export default function BookTable() {
  const [isDark, setIsDark] = useState(true);
  const [activeLink, setActiveLink] = useState("Book Table");
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    restaurantName: "",
    date: "",
    time: "",
    guests: "",
    tables: "",
    venue: "",
    theme: "",
    specialRequest: "",
    contactName: "",
    phoneNumber: "",
  });

  useEffect(() => {
    const card = document.querySelector(".s-card");
    if (card) setTimeout(() => card.classList.add("card-visible"), 80);
  }, [submitted]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Reservation confirmed!");
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const inp = "w-full px-4 py-3 rounded-lg text-[14px] font-light tracking-wide outline-none transition-all duration-300";
  const inpDark = "bg-white/[0.035] border border-purple-400/[0.16] text-purple-50 placeholder-purple-300/[0.22] focus:border-purple-400/50 focus:bg-white/[0.055] focus:shadow-[0_0_0_3px_rgba(140,80,240,0.09)]";
  const inpLight = "bg-black/[0.03] border border-purple-400/25 text-purple-950 placeholder-purple-400/30 focus:border-purple-500/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(120,60,200,0.08)]";
  const lbl = `block text-[10px] tracking-[0.18em] uppercase mb-1.5 font-normal ${isDark ? "text-purple-300/38" : "text-purple-700/42"}`;
  const sel = "w-full px-4 py-3 rounded-lg text-[14px] font-light tracking-wide outline-none transition-all duration-300 appearance-none cursor-pointer";
  const bg = isDark ? "bg-[#070310] text-white" : "bg-[#f5f0ff] text-black";

  const SelectWrap = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      {children}
      <div className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent ${isDark ? "border-t-purple-400/40" : "border-t-purple-500/35"}`} />
    </div>
  );

  // ── SUCCESS ───────────────────────────────────────────────
  if (submitted) {
    return (
      <div className={`min-h-screen transition-all duration-700 ${bg}`}>
        <GlassParticles isDark={isDark} />
        <Navbar isDark={isDark} setIsDark={setIsDark} onLoginOpen={() => {}} onRegisterOpen={() => {}} activeLink={activeLink} setActiveLink={setActiveLink} />
        <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-4">
          <div className={`text-center max-w-md mx-auto animate-[fadeUp_0.8s_cubic-bezier(0.16,1,0.3,1)_both] rounded-2xl p-12 border backdrop-blur-2xl ${isDark ? "bg-white/[0.028] border-purple-500/[0.15]" : "bg-white/80 border-purple-300/30"}`}>
            <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center border animate-[successPulse_2.5s_ease-in-out_infinite] ${isDark ? "bg-purple-900/20 border-purple-400/35" : "bg-purple-100 border-purple-400/40"}`}>
              <span className={`font-['Cinzel'] text-xl ${isDark ? "text-purple-300/80" : "text-purple-600"}`}>✦</span>
            </div>
            <h2 className={`font-['Cinzel'] text-[1.5rem] tracking-[0.14em] mb-3 ${isDark ? "text-purple-200" : "text-purple-900"}`}>Reservation Confirmed</h2>
            <p className={`font-['Cormorant_Garamond'] italic text-[1.05rem] leading-relaxed tracking-wide mb-8 ${isDark ? "text-purple-300/50" : "text-purple-700/60"}`}>
              Your table has been reserved. We look forward to welcoming you.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({ restaurantName: "", date: "", time: "", guests: "", tables: "", venue: "", theme: "", specialRequest: "", contactName: "", phoneNumber: "" });
              }}
              className={`px-9 py-3 font-['Cinzel'] text-[10px] tracking-[0.2em] uppercase rounded-lg border transition-all duration-300 hover:-translate-y-[2px] ${isDark ? "border-purple-400/35 bg-purple-900/15 text-purple-300/80 hover:border-purple-300/60 hover:text-purple-200" : "border-purple-400/40 bg-purple-50 text-purple-700 hover:bg-purple-100"}`}
            >
              Make Another Reservation
            </button>
          </div>
        </div>
        <AnimStyles />
      </div>
    );
  }

  // ── MAIN FORM ─────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-all duration-700 ${bg}`}>
      <GlassParticles isDark={isDark} />

      <div className="relative z-10">
        <Navbar isDark={isDark} setIsDark={setIsDark} onLoginOpen={() => {}} onRegisterOpen={() => {}} activeLink={activeLink} setActiveLink={setActiveLink} />

        {/* Compact header */}
        <div className={`text-center px-8 pt-7 pb-5 relative ${isDark ? "border-b border-purple-500/10" : "border-b border-purple-300/20"}`}>
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-px ${isDark ? "bg-gradient-to-r from-transparent via-purple-400/45 to-transparent" : "bg-gradient-to-r from-transparent via-purple-500/35 to-transparent"}`} />
          <span className={`font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.28em] block mb-1 ${isDark ? "text-purple-300/35" : "text-purple-600/45"}`}>
            Fine Dining & Reservations
          </span>
          <h1
            className={`font-['Cinzel'] font-[500] tracking-[0.2em] leading-none ${isDark ? "text-transparent bg-clip-text bg-gradient-to-br from-[#c090ff] via-[#f0d8ff] to-[#9060d8]" : "text-transparent bg-clip-text bg-gradient-to-br from-[#5010b0] via-[#8040d0] to-[#4010a0]"}`}
            style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)", WebkitBackgroundClip: "text" }}
          >
            THE RESERVE
          </h1>
        </div>

        {/* Single form card */}
        <form onSubmit={handleSubmit} className="max-w-[820px] mx-auto px-5 py-7 pb-10">
          <div
            className={`s-card rounded-2xl border backdrop-blur-2xl opacity-0 translate-y-4 ${
              isDark
                ? "bg-white/[0.028] border-purple-500/[0.13] hover:border-purple-400/[0.20]"
                : "bg-white/75 border-purple-300/25 hover:border-purple-400/35 shadow-sm"
            }`}
          >
            <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className={lbl}>Restaurant</label>
                <input type="text" name="restaurantName" placeholder="e.g. The Reserve, Main Branch" value={formData.restaurantName} onChange={handleChange} required className={`${inp} ${isDark ? inpDark : inpLight}`} />
              </div>

              <div>
                <label className={lbl}>Seating Preference</label>
                <SelectWrap>
                  <select name="venue" value={formData.venue} onChange={handleChange} required className={`${sel} ${isDark ? inpDark : inpLight}`}>
                    <option value="">Select ambiance</option>
                    <option value="Indoor">Indoor — Intimate & Refined</option>
                    <option value="Outdoor">Outdoor — Garden Setting</option>
                    <option value="Rooftop">Rooftop — City Skyline View</option>
                    <option value="Private Cabin">Private Cabin — Exclusive</option>
                  </select>
                </SelectWrap>
              </div>

              <div>
                <label className={lbl}>Preferred Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required className={`${inp} ${isDark ? inpDark : inpLight}`} style={{ colorScheme: isDark ? "dark" : "light" }} />
              </div>

              <div>
                <label className={lbl}>Arrival Time</label>
                <input type="time" name="time" value={formData.time} onChange={handleChange} required className={`${inp} ${isDark ? inpDark : inpLight}`} style={{ colorScheme: isDark ? "dark" : "light" }} />
              </div>

              <div>
                <label className={lbl}>Number of Guests</label>
                <input type="number" name="guests" placeholder="e.g. 4" min="1" value={formData.guests} onChange={handleChange} required className={`${inp} ${isDark ? inpDark : inpLight}`} />
              </div>

              <div>
                <label className={lbl}>Tables Required</label>
                <input type="number" name="tables" placeholder="e.g. 1" min="1" value={formData.tables} onChange={handleChange} required className={`${inp} ${isDark ? inpDark : inpLight}`} />
              </div>

              <div>
                <label className={lbl}>Occasion</label>
                <SelectWrap>
                  <select name="theme" value={formData.theme} onChange={handleChange} required className={`${sel} ${isDark ? inpDark : inpLight}`}>
                    <option value="">Select occasion</option>
                    <option value="Romantic">Romantic Dinner</option>
                    <option value="Birthday">Birthday Celebration</option>
                    <option value="Family">Family Gathering</option>
                    <option value="Business">Business Dining</option>
                    <option value="Casual">Casual Evening</option>
                  </select>
                </SelectWrap>
              </div>

              <div>
                <label className={lbl}>Reservation Name</label>
                <input type="text" name="contactName" placeholder="Name on reservation" value={formData.contactName} onChange={handleChange} required className={`${inp} ${isDark ? inpDark : inpLight}`} />
              </div>

              <div className="md:col-span-2">
                <label className={lbl}>Phone Number</label>
                <input type="tel" name="phoneNumber" placeholder="+91 00000 00000" value={formData.phoneNumber} onChange={handleChange} required className={`${inp} ${isDark ? inpDark : inpLight}`} />
              </div>

              <div className="md:col-span-2">
                <label className={lbl}>Special Requests</label>
                <textarea name="specialRequest" placeholder="Dietary preferences, allergies, or anything that would make your evening perfect…" value={formData.specialRequest} onChange={handleChange} rows={3} className={`${inp} leading-relaxed resize-none ${isDark ? inpDark : inpLight}`} />
              </div>

              <div className="md:col-span-2 pt-1">
                <button
                  type="submit"
                  className={`w-full py-4 font-['Cinzel'] text-[11px] tracking-[0.24em] uppercase rounded-xl border-none cursor-pointer text-white transition-all duration-300 relative overflow-hidden group ${
                    isDark
                      ? "bg-gradient-to-r from-[#6820c8] via-[#9850e8] to-[#bf78ff] shadow-[0_5px_28px_rgba(140,80,240,0.35)] hover:-translate-y-[2px] hover:shadow-[0_12px_44px_rgba(160,100,255,0.52)]"
                      : "bg-gradient-to-r from-[#5010a8] via-[#7830c8] to-[#9050e0] shadow-[0_5px_24px_rgba(100,40,200,0.32)] hover:-translate-y-[2px] hover:shadow-[0_12px_40px_rgba(120,60,220,0.48)]"
                  }`}
                >
                  <span className="relative z-10">Confirm Reservation</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
      <AnimStyles />
    </div>
  );
}

// ── Tiny edge-to-edge particles ───────────────────────────
function GlassParticles({ isDark }: { isDark: boolean }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.13] -top-28 -right-28 animate-[drift1_14s_ease-in-out_infinite] ${isDark ? "bg-[#7030d0]" : "bg-[#9060e0]"}`} />
      <div className={`absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.10] -bottom-20 -left-20 animate-[drift2_17s_ease-in-out_infinite] ${isDark ? "bg-[#a060f0]" : "bg-[#b080f0]"}`} />

      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            top: p.y,
            left: p.dir === "ltr" ? "-8px" : "calc(100% + 8px)",
            background: isDark ? "rgba(180,130,255,0.35)" : "rgba(120,60,200,0.28)",
            boxShadow: isDark
              ? `0 0 ${p.size * 2}px rgba(160,100,255,0.5)`
              : `0 0 ${p.size * 2}px rgba(100,50,180,0.4)`,
            animation: `${p.dir === "ltr" ? "slideRight" : "slideLeft"} ${p.dur} linear ${p.delay} infinite`,
          }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(rgba(160,96,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(160,96,240,1) 1px,transparent 1px)"
            : "linear-gradient(rgba(100,40,200,1) 1px,transparent 1px),linear-gradient(90deg,rgba(100,40,200,1) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
    </div>
  );
}

function AnimStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

      @keyframes fadeUp       { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes drift1       { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,30px)} }
      @keyframes drift2       { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-40px)} }
      @keyframes successPulse { 0%,100%{box-shadow:0 0 0 0 rgba(140,80,240,0.3)} 50%{box-shadow:0 0 0 16px rgba(140,80,240,0)} }

      @keyframes slideRight {
        0%   { transform: translateX(0);      opacity: 0; }
        5%   { opacity: 1; }
        95%  { opacity: 1; }
        100% { transform: translateX(100vw);  opacity: 0; }
      }
      @keyframes slideLeft {
        0%   { transform: translateX(0);      opacity: 0; }
        5%   { opacity: 1; }
        95%  { opacity: 1; }
        100% { transform: translateX(-100vw); opacity: 0; }
      }

      .s-card {
        transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1),
                    transform 0.65s cubic-bezier(0.16,1,0.3,1),
                    border-color 0.3s ease;
      }
      .s-card.card-visible { opacity: 1 !important; transform: translateY(0) !important; }

      input[type="date"]::-webkit-calendar-picker-indicator,
      input[type="time"]::-webkit-calendar-picker-indicator {
        filter: invert(0.6) sepia(1) saturate(2) hue-rotate(240deg);
        opacity: 0.45; cursor: pointer;
      }
    `}</style>
  );
}