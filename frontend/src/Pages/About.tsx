import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import LoginModal from "./Login";
import RegisterModal from "./Register";

const PARTICLES = [
  { size: 4, y: "8%",  dur: "16s", delay: "0s",   dir: "ltr" },
  { size: 5, y: "22%", dur: "20s", delay: "2s",   dir: "rtl" },
  { size: 3, y: "38%", dur: "14s", delay: "5s",   dir: "ltr" },
  { size: 6, y: "55%", dur: "18s", delay: "1s",   dir: "rtl" },
  { size: 4, y: "70%", dur: "22s", delay: "7s",   dir: "ltr" },
  { size: 3, y: "85%", dur: "15s", delay: "3s",   dir: "rtl" },
  { size: 5, y: "14%", dur: "19s", delay: "9s",   dir: "rtl" },
  { size: 4, y: "92%", dur: "13s", delay: "4s",   dir: "ltr" },
];

const TECH = [
  { name: "React.js",     role: "Frontend Framework" },
  { name: "TypeScript",   role: "Type Safety"        },
  { name: "Tailwind CSS", role: "Styling"            },
  { name: "Node.js",      role: "Backend Runtime"    },
  { name: "Express.js",   role: "REST API"           },
  { name: "MongoDB",      role: "Database"           },
  { name: "JWT Auth",     role: "Authentication"     },
  { name: "Google OAuth", role: "Social Login"       },
];

const FEATURES = [
  { icon: "◈", title: "Smart Reservations",  desc: "Real-time table booking with date, time, guest count, occasion and seating preference selection." },
  { icon: "◇", title: "Role-Based Access",   desc: "Separate flows for customers and admins — protected routes, JWT authentication and Google OAuth." },
  { icon: "○", title: "Admin Dashboard",     desc: "Dedicated panel to manage all bookings, track reservations and oversee restaurant operations." },
  { icon: "◆", title: "Responsive Design",  desc: "Fully responsive across mobile, tablet and desktop with cinematic dark/light theme support." },
];

const FUTURE = [
  { icon: "→", point: "Online payment gateway integration (Razorpay / Stripe) for advance table booking deposits." },
  { icon: "→", point: "Real-time notifications via SMS and email when a reservation is confirmed or cancelled." },
  { icon: "→", point: "AI-based table recommendation system based on guest preferences and past bookings." },
  { icon: "→", point: "Mobile application using React Native for iOS and Android platforms." },
  { icon: "→", point: "Multi-restaurant support — allowing multiple branches under a single admin panel." },
  { icon: "→", point: "QR code-based digital menu and check-in system for a contactless dining experience." },
];

export default function About() {
  const [isDark, setIsDark]               = useState(true);
  const [activeLink, setActiveLink]       = useState("About");
  const [openLoginModal, setOpenLogin]    = useState(false);
  const [openRegisterModal, setOpenReg]   = useState(false);
  const navigate                          = useNavigate();
  const sectionRefs                       = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("rv"); }),
      { threshold: 0.08 }
    );
    sectionRefs.current.forEach((r) => r && observer.observe(r));
    return () => observer.disconnect();
  }, []);

  const ref  = (i: number) => (el: HTMLDivElement | null) => { sectionRefs.current[i] = el; };
  const bg   = isDark ? "bg-[#070310] text-white"        : "bg-[#f5f0ff] text-black";
  const bdr  = isDark ? "border-purple-500/[0.12]"       : "border-purple-300/25";
  const card = isDark ? "bg-white/[0.028]"               : "bg-white/75";
  const sub  = isDark ? "text-purple-300/40"             : "text-purple-600/50";
  const body = isDark ? "text-purple-200/55"             : "text-purple-800/65";
  const head = isDark ? "text-purple-100"                : "text-purple-950";
  const hr   = isDark
    ? "bg-gradient-to-r from-transparent via-purple-400/45 to-transparent"
    : "bg-gradient-to-r from-transparent via-purple-500/35 to-transparent";

  const SectionLabel = ({ text }: { text: string }) => (
    <span className={`font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.28em] uppercase block mb-2 ${sub}`}>{text}</span>
  );
  const SectionTitle = ({ text }: { text: string }) => (
    <h2 className={`font-['Cinzel'] text-[1.3rem] tracking-[0.1em] mb-5 ${head}`}>{text}</h2>
  );

  return (
    <div className={`min-h-screen transition-all duration-700 ${bg}`}>

      {/* ── BG ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute w-[550px] h-[550px] rounded-full blur-[120px] opacity-[0.13] -top-32 -right-32 animate-[d1_16s_ease-in-out_infinite] ${isDark ? "bg-[#7030d0]" : "bg-[#9060e0]"}`} />
        <div className={`absolute w-[450px] h-[450px] rounded-full blur-[110px] opacity-[0.10] -bottom-24 -left-20 animate-[d2_19s_ease-in-out_infinite] ${isDark ? "bg-[#a060f0]" : "bg-[#b080f0]"}`} />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: isDark
            ? "linear-gradient(rgba(160,96,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(160,96,240,1) 1px,transparent 1px)"
            : "linear-gradient(rgba(100,40,200,1) 1px,transparent 1px),linear-gradient(90deg,rgba(100,40,200,1) 1px,transparent 1px)",
          backgroundSize: "72px 72px"
        }} />
        {PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: p.size, height: p.size, top: p.y,
            left: p.dir === "ltr" ? "-8px" : "calc(100% + 8px)",
            background: isDark ? "rgba(180,130,255,0.32)" : "rgba(120,60,200,0.25)",
            boxShadow: isDark ? `0 0 ${p.size*2}px rgba(160,100,255,0.45)` : `0 0 ${p.size*2}px rgba(100,50,180,0.35)`,
            animation: `${p.dir === "ltr" ? "sR" : "sL"} ${p.dur} linear ${p.delay} infinite`
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
            BSc Information Technology · Final Year Project · 2026
          </span>
          <h1
            className={`font-['Cinzel'] font-[500] tracking-[0.18em] leading-none mb-3 ${isDark ? "text-transparent bg-clip-text bg-gradient-to-br from-[#c090ff] via-[#f0d8ff] to-[#9060d8]" : "text-transparent bg-clip-text bg-gradient-to-br from-[#5010b0] via-[#8040d0] to-[#4010a0]"}`}
            style={{ fontSize: "clamp(1.8rem,4vw,3rem)", WebkitBackgroundClip: "text" }}
          >
            The Reserve
          </h1>
          <p className={`font-['Cormorant_Garamond'] text-[1rem] tracking-[0.12em] mb-1 ${sub}`}>
            Restaurant Table Booking Using Node.js
          </p>
          <div className={`w-14 h-px mx-auto my-4 ${hr}`} />
          <p className={`font-['Cormorant_Garamond'] font-[300] text-[1.08rem] tracking-[0.04em] leading-relaxed max-w-xl mx-auto ${body}`}>
            A full-stack restaurant reservation management system — designed, developed and submitted as a final year academic project at Thakur Shyamnarayan Degree College, Mumbai.
          </p>
        </div>

        <div className="max-w-[880px] mx-auto px-5 py-10 space-y-5">

          {/* ── OVERVIEW ── */}
          <div ref={ref(0)} className={`rs rounded-2xl border backdrop-blur-2xl p-9 ${card} ${bdr}`}>
            <SectionLabel text="Overview" />
            <SectionTitle text="About This Project" />
            <p className={`font-['Cormorant_Garamond'] text-[1.05rem] leading-[1.9] tracking-wide mb-4 ${body}`}>
              <span className={isDark ? "text-purple-200/80" : "text-purple-900/80"}>The Reserve</span> is a modern full-stack web application for restaurant reservation management. It enables customers to register, log in and book tables at a fine dining restaurant — while giving administrators a dedicated dashboard to manage all bookings in real time.
            </p>
            <p className={`font-['Cormorant_Garamond'] text-[1.05rem] leading-[1.9] tracking-wide ${body}`}>
              The system incorporates industry-standard practices including JWT-based authentication, role-based access control, RESTful API architecture, and a responsive frontend built with React and TypeScript — demonstrating the complete software development lifecycle from design to deployment.
            </p>
            <div className={`mt-7 grid grid-cols-3 divide-x rounded-xl overflow-hidden border ${bdr} ${isDark ? "divide-purple-500/10" : "divide-purple-300/20"}`}>
              {[
                { num: "2026",       lbl: "Year Built"    },
                { num: "MERN",       lbl: "Tech Stack"    },
                { num: "Full Stack", lbl: "Project Type"  },
              ].map((s) => (
                <div key={s.lbl} className={`py-5 text-center ${isDark ? "bg-white/[0.018]" : "bg-purple-50/40"}`}>
                  <p className={`font-['Cinzel'] text-[1rem] tracking-[0.1em] mb-1 ${head}`}>{s.num}</p>
                  <p className={`text-[9.5px] tracking-[0.2em] uppercase ${sub}`}>{s.lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FEATURES ── */}
          <div ref={ref(1)} className="rs grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className={`rounded-2xl border backdrop-blur-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/30 ${card} ${bdr}`}>
                <span className={`text-[1.4rem] block mb-3 ${isDark ? "text-purple-400/50" : "text-purple-500/55"}`}>{f.icon}</span>
                <h3 className={`font-['Cinzel'] text-[11px] tracking-[0.18em] uppercase mb-2 ${head}`}>{f.title}</h3>
                <p className={`font-['Cormorant_Garamond'] text-[1rem] leading-relaxed ${body}`}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* ── TECH STACK ── */}
          <div ref={ref(2)} className={`rs rounded-2xl border backdrop-blur-2xl p-9 ${card} ${bdr}`}>
            <SectionLabel text="Technologies Used" />
            <SectionTitle text="Tech Stack" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TECH.map((t) => (
                <div key={t.name} className={`rounded-xl border p-4 text-center transition-all duration-300 hover:border-purple-400/30 ${isDark ? "border-purple-500/[0.09] bg-white/[0.018]" : "border-purple-300/20 bg-purple-50/40"}`}>
                  <p className={`font-['Cinzel'] text-[11.5px] tracking-[0.1em] mb-1 ${head}`}>{t.name}</p>
                  <p className={`text-[10px] tracking-[0.12em] uppercase ${sub}`}>{t.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FUTURE SCOPE ── */}
          <div ref={ref(3)} className={`rs rounded-2xl border backdrop-blur-2xl p-9 ${card} ${bdr}`}>
            <SectionLabel text="Roadmap" />
            <SectionTitle text="Future Scope" />
            <div className="space-y-3">
              {FUTURE.map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className={`flex-shrink-0 mt-[3px] text-[13px] ${isDark ? "text-purple-400/50" : "text-purple-500/55"}`}>{f.icon}</span>
                  <p className={`font-['Cormorant_Garamond'] text-[1.02rem] leading-relaxed ${body}`}>{f.point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── TEAM ── */}
          <div ref={ref(4)} className={`rs rounded-2xl border backdrop-blur-2xl p-9 ${card} ${bdr}`}>
            <SectionLabel text="Project Team" />
            <SectionTitle text="Developed By" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Pawan */}
              <div className={`rounded-xl border p-6 ${isDark ? "border-purple-400/22 bg-purple-900/10" : "border-purple-400/28 bg-purple-50/60"}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border flex-shrink-0 ${isDark ? "bg-purple-900/30 border-purple-400/30" : "bg-purple-100 border-purple-400/40"}`}>
                    <span className={`font-['Cinzel'] text-[13px] ${isDark ? "text-purple-300/70" : "text-purple-600/80"}`}>PS</span>
                  </div>
                  <div>
                    <p className={`font-['Cinzel'] text-[13px] tracking-[0.12em] ${head}`}>Pawan Sahu</p>
                    <p className={`text-[10px] tracking-[0.15em] uppercase mt-0.5 ${isDark ? "text-purple-400/50" : "text-purple-600/55"}`}>Lead Developer</p>
                  </div>
                </div>
                <p className={`font-['Cormorant_Garamond'] text-[0.97rem] leading-relaxed mb-4 ${body}`}>
                  Responsible for complete design, development and deployment — frontend architecture, backend APIs, database design, authentication system and UI/UX.
                </p>
                <div className={`grid grid-cols-2 gap-2 text-[10.5px] tracking-[0.1em] ${sub}`}>
                  <div><span className="opacity-60">Roll No</span><br /><span className={`font-['Cinzel'] text-[11px] ${isDark ? "text-purple-200/70" : "text-purple-800/70"}`}>202302107</span></div>
                  <div><span className="opacity-60">PRN</span><br /><span className={`font-['Cinzel'] text-[10px] ${isDark ? "text-purple-200/70" : "text-purple-800/70"}`}>2023016401987821</span></div>
                </div>
              </div>

              {/* Rushikesh */}
              <div className={`rounded-xl border p-6 ${isDark ? "border-purple-500/[0.10] bg-white/[0.015]" : "border-purple-300/20 bg-white/50"}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border flex-shrink-0 ${isDark ? "bg-purple-900/20 border-purple-500/20" : "bg-purple-50 border-purple-300/35"}`}>
                    <span className={`font-['Cinzel'] text-[13px] ${isDark ? "text-purple-300/50" : "text-purple-600/60"}`}>RP</span>
                  </div>
                  <div>
                    <p className={`font-['Cinzel'] text-[13px] tracking-[0.12em] ${head}`}>Rushikesh S. Patil</p>
                    <p className={`text-[10px] tracking-[0.15em] uppercase mt-0.5 ${isDark ? "text-purple-400/40" : "text-purple-600/45"}`}>Project Member</p>
                  </div>
                </div>
                <p className={`font-['Cormorant_Garamond'] text-[0.97rem] leading-relaxed mb-4 ${body}`}>
                  BSc IT student, Thakur Shyamnarayan Degree College, Mumbai. Project team member, 2025–26.
                </p>
                <div className={`grid grid-cols-2 gap-2 text-[10.5px] tracking-[0.1em] ${sub}`}>
                  <div><span className="opacity-60">Roll No</span><br /><span className={`font-['Cinzel'] text-[11px] ${isDark ? "text-purple-200/70" : "text-purple-800/70"}`}>202302178</span></div>
                  <div><span className="opacity-60">PRN</span><br /><span className={`font-['Cinzel'] text-[10px] ${isDark ? "text-purple-200/70" : "text-purple-800/70"}`}>2022016401450042</span></div>
                </div>
              </div>
            </div>

            {/* Guide */}
            <div className={`rounded-xl border p-6 flex items-center gap-5 ${isDark ? "border-purple-400/15 bg-white/[0.018]" : "border-purple-300/22 bg-purple-50/40"}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border flex-shrink-0 ${isDark ? "bg-purple-900/25 border-purple-400/25" : "bg-purple-100 border-purple-400/35"}`}>
                <span className={`font-['Cinzel'] text-[13px] ${isDark ? "text-purple-300/65" : "text-purple-600/75"}`}>AS</span>
              </div>
              <div>
                <span className={`text-[10px] tracking-[0.18em] uppercase block mb-1 ${sub}`}>Project Guide</span>
                <p className={`font-['Cinzel'] text-[13px] tracking-[0.12em] mb-1 ${head}`}>Prof. Aman Singh</p>
                <p className={`font-['Cormorant_Garamond'] text-[0.95rem] ${body}`}>
                  Assistant Professor · Department of Information Technology<br />
                  Thakur Shyamnarayan Degree College, Mumbai
                </p>
              </div>
            </div>
          </div>

          {/* ── COLLEGE + GITHUB ── */}
          <div ref={ref(5)} className="rs grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* College */}
            <div className={`rounded-2xl border backdrop-blur-2xl p-7 ${card} ${bdr}`}>
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${isDark ? "bg-purple-900/25 border-purple-400/22" : "bg-purple-100 border-purple-400/30"}`}>
                <span className={`font-['Cinzel'] text-[1.2rem] ${isDark ? "text-purple-300/60" : "text-purple-600/70"}`}>✦</span>
              </div>
              <span className={`text-[10px] tracking-[0.18em] uppercase block mb-1 ${sub}`}>Institution</span>
              <p className={`font-['Cinzel'] text-[12px] tracking-[0.1em] mb-2 ${head}`}>Thakur Shyamnarayan Degree College</p>
              <p className={`font-['Cormorant_Garamond'] text-[0.97rem] leading-relaxed ${body}`}>
                Mumbai, Maharashtra, India<br />
                Department of Information Technology<br />
                BSc IT — Final Year, 2025–26
              </p>
            </div>

            {/* GitHub */}
            <div className={`rounded-2xl border backdrop-blur-2xl p-7 ${card} ${bdr}`}>
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${isDark ? "bg-purple-900/25 border-purple-400/22" : "bg-purple-100 border-purple-400/30"}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(180,130,255,0.6)" : "rgba(100,50,180,0.65)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
              </div>
              <span className={`text-[10px] tracking-[0.18em] uppercase block mb-1 ${sub}`}>Source Code</span>
              <p className={`font-['Cinzel'] text-[12px] tracking-[0.1em] mb-2 ${head}`}>GitHub Repository</p>
              <p className={`font-['Cormorant_Garamond'] text-[0.97rem] leading-relaxed mb-4 ${body}`}>
                Full project source code available on GitHub. Frontend, backend, API and database schema — all documented.
              </p>
              <a
                href="https://github.com/Pawan19786"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 font-['Cinzel'] text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 rounded-lg border transition-all duration-300 hover:-translate-y-[1px] ${isDark ? "border-purple-400/30 text-purple-300/70 hover:border-purple-300/55 hover:text-purple-200 bg-purple-900/15 hover:bg-purple-900/25" : "border-purple-400/35 text-purple-700 hover:bg-purple-50 bg-white/60"}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
                github.com/Pawan19786
              </a>
            </div>
          </div>

          {/* ── CTA ── */}
          <div ref={ref(6)} className="rs text-center pb-8 pt-2">
            <p className={`font-['Cormorant_Garamond'] italic text-[1.1rem] tracking-wide mb-5 ${body}`}>
              Explore the application firsthand.
            </p>
            <button
              onClick={() => navigate("/book-table")}
              className={`px-12 py-4 font-['Cinzel'] text-[11px] tracking-[0.22em] uppercase rounded-xl text-white transition-all duration-300 relative overflow-hidden group hover:-translate-y-[2px] ${isDark ? "bg-gradient-to-r from-[#6820c8] via-[#9850e8] to-[#bf78ff] shadow-[0_5px_28px_rgba(140,80,240,0.35)] hover:shadow-[0_12px_44px_rgba(160,100,255,0.52)]" : "bg-gradient-to-r from-[#5010a8] via-[#7830c8] to-[#9050e0] shadow-[0_5px_24px_rgba(100,40,200,0.32)] hover:shadow-[0_12px_40px_rgba(120,60,220,0.48)]"}`}
            >
              <span className="relative z-10">Try Reservation System</span>
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

        .rs {
          opacity: 0; transform: translateY(28px);
          transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
        }
        .rv { opacity: 1 !important; transform: translateY(0) !important; }
      `}</style>
    </div>
  );
}